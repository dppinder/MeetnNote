import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import init_db
from app.routers import meetings, ws_transcribe
from app.services.transcription import load_model

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    load_model()  # preload Whisper onto the GPU so the first meeting isn't slow
    yield


app = FastAPI(title="MeetnNote", lifespan=lifespan)

# Client is a Tauri app on the LAN; CORS is irrelevant to Tauri's webview
# fetches in practice but this keeps a plain browser client usable too.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)
app.include_router(ws_transcribe.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Mounted last, and only if present, so the API still works standalone (e.g.
# during dev, or if you only ever use the Tauri desktop client) without a
# client build. When present, this lets a phone browse straight to this
# server's URL and get the app itself, same-origin as the API/WebSocket.
if os.path.isdir(settings.static_dir):
    app.mount("/", StaticFiles(directory=settings.static_dir, html=True), name="webapp")
    logging.info("Serving built web app from %s", settings.static_dir)
else:
    logging.info("No client build at %s — running API-only (fine for the Tauri desktop client)", settings.static_dir)
