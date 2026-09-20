import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.auth import require_token_ws
from app.db import Meeting, SessionLocal, TranscriptSegment
from app.services.transcription import StreamingSession, load_model

logger = logging.getLogger(__name__)
router = APIRouter()


async def _meeting_exists(meeting_id: str) -> bool:
    async with SessionLocal() as session:
        result = await session.execute(select(Meeting.id).where(Meeting.id == meeting_id))
        return result.scalar_one_or_none() is not None


async def _persist_segments(meeting_id: str, segments: list[dict]) -> None:
    if not segments:
        return
    async with SessionLocal() as session:
        for seg in segments:
            session.add(
                TranscriptSegment(
                    meeting_id=meeting_id,
                    start_ms=seg["start_ms"],
                    end_ms=seg["end_ms"],
                    text=seg["text"],
                )
            )
        await session.commit()


@router.websocket("/meetings/{meeting_id}/audio")
async def audio_stream(websocket: WebSocket, meeting_id: str):
    await websocket.accept()

    if not await require_token_ws(websocket):
        return

    if not await _meeting_exists(meeting_id):
        await websocket.close(code=4404)
        return

    model = load_model()
    stream = StreamingSession(model)

    try:
        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"] is not None:
                await stream.push_audio(message["bytes"])
                result = await stream.maybe_transcribe()
                if result is None:
                    continue
                interim_text, finalized = result
                await _persist_segments(meeting_id, finalized)
                for seg in finalized:
                    await websocket.send_text(json.dumps({"type": "final", "segment": seg}))
                if interim_text:
                    await websocket.send_text(json.dumps({"type": "interim", "text": interim_text}))

            elif "text" in message and message["text"] is not None:
                try:
                    control = json.loads(message["text"])
                except ValueError:
                    continue
                if control.get("action") == "stop":
                    final_segments = await stream.flush()
                    await _persist_segments(meeting_id, final_segments)
                    for seg in final_segments:
                        await websocket.send_text(json.dumps({"type": "final", "segment": seg}))
                    await websocket.send_text(json.dumps({"type": "stopped"}))
                    break

    except WebSocketDisconnect:
        logger.info("Client disconnected from meeting %s, flushing remaining audio", meeting_id)
        final_segments = await stream.flush()
        await _persist_segments(meeting_id, final_segments)
