import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an assistant that turns a raw meeting transcript into structured notes.
Read the transcript and respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:

{
  "summary": "2-4 sentence plain-English summary of the meeting",
  "discussion_points": ["key point discussed", "..."],
  "decisions": ["decision that was made", "..."],
  "action_items": ["who owes what, by when, if stated", "..."]
}

Rules:
- Base everything strictly on the transcript. Do not invent names, numbers, or commitments that weren't said.
- If a section has nothing (e.g. no decisions were made), return an empty list for it.
- Keep each list item short (one sentence).
- Output valid JSON only.
"""

EMPTY_NOTES = {
    "summary": "",
    "discussion_points": [],
    "decisions": [],
    "action_items": [],
}


def _build_transcript_text(segments: list[dict]) -> str:
    lines = []
    for seg in segments:
        speaker = f"{seg['speaker']}: " if seg.get("speaker") else ""
        lines.append(f"{speaker}{seg['text']}")
    return "\n".join(lines)


async def _call_ollama(model: str, transcript_text: str) -> str:
    async with httpx.AsyncClient(base_url=settings.ollama_host, timeout=180) as client:
        resp = await client.post(
            "/api/chat",
            json={
                "model": model,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.2},
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Transcript:\n\n{transcript_text}"},
                ],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


def _parse_notes(raw: str) -> dict:
    parsed = json.loads(raw)
    return {
        "summary": str(parsed.get("summary", "")),
        "discussion_points": [str(x) for x in parsed.get("discussion_points", [])],
        "decisions": [str(x) for x in parsed.get("decisions", [])],
        "action_items": [str(x) for x in parsed.get("action_items", [])],
    }


async def generate_meeting_notes(segments: list[dict]) -> tuple[dict, str]:
    """Returns (structured_notes, raw_model_output). Falls back to a second
    model if the primary fails or returns unparseable output."""
    transcript_text = _build_transcript_text(segments)
    if not transcript_text.strip():
        return dict(EMPTY_NOTES), ""

    for model in (settings.ollama_model, settings.ollama_fallback_model):
        try:
            raw = await _call_ollama(model, transcript_text)
            return _parse_notes(raw), raw
        except Exception:
            logger.exception("Note generation failed with model %s, trying next", model)

    return dict(EMPTY_NOTES), ""
