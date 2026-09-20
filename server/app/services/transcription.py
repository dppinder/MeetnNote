import asyncio

import numpy as np
from faster_whisper import WhisperModel

from app.config import settings

SAMPLE_RATE = 16000  # client must send mono 16kHz PCM16

_model: WhisperModel | None = None


def load_model() -> WhisperModel:
    """Load once at process startup and share across all connections."""
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
    return _model


def pcm16_bytes_to_float32(raw: bytes) -> np.ndarray:
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


class StreamingSession:
    """
    Buffers PCM16 mono 16kHz audio for one live meeting and periodically
    re-transcribes the pending window with faster-whisper.

    This is a simplified streaming approach, not true incremental
    hypothesis-agreement ASR: every COMMIT_INTERVAL_SEC of new audio it
    re-runs Whisper over the whole pending buffer. All but the last detected
    segment are treated as "settled" and finalized (persisted, buffer
    trimmed); the last segment is emitted as a live "interim" tail that gets
    replaced on each update, since more audio might still extend it. If the
    buffer grows past MAX_WINDOW_SEC, everything is force-finalized so
    latency and memory stay bounded.
    """

    COMMIT_INTERVAL_SEC = 2.0
    MAX_WINDOW_SEC = 20.0

    def __init__(self, model: WhisperModel):
        self.model = model
        self.buffer = np.empty(0, dtype=np.float32)
        self.buffer_start_ms = 0
        self.audio_since_commit_sec = 0.0
        self.lock = asyncio.Lock()

    async def push_audio(self, raw_pcm16: bytes) -> None:
        chunk = pcm16_bytes_to_float32(raw_pcm16)
        async with self.lock:
            self.buffer = np.concatenate([self.buffer, chunk])
            self.audio_since_commit_sec += len(chunk) / SAMPLE_RATE

    def _ready(self) -> bool:
        buffer_sec = len(self.buffer) / SAMPLE_RATE
        return self.audio_since_commit_sec >= self.COMMIT_INTERVAL_SEC or buffer_sec >= self.MAX_WINDOW_SEC

    async def maybe_transcribe(self) -> tuple[str, list[dict]] | None:
        """Returns (interim_text, finalized_segments), or None if not ready yet."""
        async with self.lock:
            if len(self.buffer) == 0 or not self._ready():
                return None
            audio = self.buffer.copy()
            base_ms = self.buffer_start_ms
            self.audio_since_commit_sec = 0.0

        finalized, interim_text, cut_sample = await self._run(audio, base_ms, force_finalize_all=False)

        if cut_sample > 0:
            async with self.lock:
                self.buffer = self.buffer[cut_sample:]
                self.buffer_start_ms = base_ms + int(cut_sample / SAMPLE_RATE * 1000)

        return interim_text, finalized

    async def flush(self) -> list[dict]:
        """Force-finalize whatever is left, e.g. when the user stops recording."""
        async with self.lock:
            if len(self.buffer) == 0:
                return []
            audio = self.buffer.copy()
            base_ms = self.buffer_start_ms
            self.buffer = np.empty(0, dtype=np.float32)

        finalized, _interim, _cut = await self._run(audio, base_ms, force_finalize_all=True)
        return finalized

    async def _run(
        self, audio: np.ndarray, base_ms: int, force_finalize_all: bool
    ) -> tuple[list[dict], str, int]:
        segments_iter, _info = await asyncio.to_thread(
            self.model.transcribe,
            audio,
            language="en",
            vad_filter=True,
            condition_on_previous_text=False,
            beam_size=1,
        )
        segments = [s for s in segments_iter if s.text.strip()]
        if not segments:
            return [], "", 0

        buffer_sec = len(audio) / SAMPLE_RATE
        force_all = force_finalize_all or buffer_sec >= self.MAX_WINDOW_SEC

        finalized: list[dict] = []
        interim_text = ""
        cut_sample = 0
        last_idx = len(segments) - 1

        for i, seg in enumerate(segments):
            if not force_all and i == last_idx:
                interim_text = seg.text.strip()
                continue
            finalized.append(
                {
                    "start_ms": base_ms + int(seg.start * 1000),
                    "end_ms": base_ms + int(seg.end * 1000),
                    "text": seg.text.strip(),
                }
            )
            cut_sample = int(seg.end * SAMPLE_RATE)

        return finalized, interim_text, cut_sample
