# MeetnNote

A self-hosted, Granola-style meeting notes app. All AI (speech-to-text and
note generation) runs on your own GPU box instead of a SaaS vendor.

- **`server/`** — FastAPI service for the `3060` box (RTX 3060 12GB, Ubuntu). Streams
  live transcription (faster-whisper) and generates structured meeting notes
  (Ollama + Llama 3.1 8B / Mistral 7B). Also serves the web client (below)
  directly. See [server/README.md](server/README.md).
- **`client/`** — React/TS app, the same code runs two ways:
  - Wrapped in **Tauri** as a native desktop app for your Mac.
  - As a plain **PWA** served by the `3060` server itself — open its URL in
    mobile Safari and "Add to Home Screen" to record meetings from your
    iPhone. No app store, no separate build.
  Records audio, shows a live transcript, AI-generated notes, a personal
  scratch-notes tab, and a cross-meeting Tasks view. Stores nothing locally
  — everything lives on the server.

Visual design (dark warm-editorial theme, Newsreader/Inter type, tabbed
note view) comes from `DESIGN.md` / `code.html` / `screen.png` — a mockup
generated with Google Stitch. Those files are the design reference, not
part of the running app.

## Quickstart

**1. Deploy the server to `3060`:**

```bash
rsync -av --exclude venv --exclude data --exclude __pycache__ --exclude certs \
  server/ 3060:~/meetnnote/server/
ssh 3060 'cd ~/meetnnote/server && chmod +x deploy/setup.sh && ./deploy/setup.sh'
```

Copy the `AUTH_TOKEN` it writes to `server/.env` on the box — you'll need it
below. Then either run it in the foreground to test, or install the systemd
service (see `server/README.md`).

The server runs plain HTTP by default — that's fine for the Mac desktop app.
The iPhone needs an HTTPS path in, since iOS Safari refuses microphone
access otherwise; run `./deploy/setup-tailscale.sh` on `3060` for that (gets
a real, trusted cert automatically, plus access from outside your house —
see `server/README.md`'s HTTPS section for the self-signed-cert fallback if
you'd rather not use Tailscale).

**2. Build the client:**

```bash
cd client
npm install
npm run build          # produces dist/ — used by both paths below
```

For the **Mac desktop app**:

```bash
npm run tauri dev      # dev mode, hot reload
# or: npx tauri build for a distributable .app
```

You'll need Rust installed (`rustup.rs`) since Tauri compiles a native shell
around the web UI — a one-time setup, not needed per build. Before a
**production** bundle (`tauri build`), generate real app icons once from a
square source image (this repo was hand-built without `create-tauri-app`'s
defaults): `npx tauri icon path/to/your-icon.png`. `tauri dev` works fine
without this step.

For the **iPhone**, no separate build — just copy `dist/` to the server so it
serves the app itself:

```bash
rsync -av dist/ 3060:~/meetnnote/server/client-dist/
```

Then on the iPhone, open the Tailscale URL from `setup-tailscale.sh` (or the
self-signed `https://192.168.1.162:8443` fallback) in Safari and tap Share
→ **Add to Home Screen**.

**3. Connect them:** in the Mac app, go to Settings (⚙) and enter
`http://192.168.1.162:8010` and the token from step 1, then "Test connection".
The iPhone version defaults its server address to wherever it was loaded
from, so it just needs the token.

## What works today (v1)

- Create a meeting, record it (mic, or any input device macOS/iOS exposes —
  see note below), see a live-updating transcript
- Generate AI-structured notes from the transcript (summary, discussion
  points, decisions, action items) via your local LLM
- Edit notes by hand, they won't be overwritten unless you click Regenerate
- Jot personal scratch notes per meeting, separate from the AI summary
- A Tasks view aggregating action items across every meeting
- Copy a meeting's notes as Markdown, or Share via the OS share sheet
- Search/browse past meetings
- Works from either the Mac desktop app or an iPhone (installed as a
  home-screen PWA) — same server, same meetings, either device

## Known limitations, honestly

- **System audio capture (the other person's voice on a call) isn't built
  in.** Browser/webview APIs only give you `getUserMedia`, i.e. whatever
  input device is selected — they can't tap "what's playing through your
  speakers" without a virtual audio driver. To capture both sides of a call,
  install a free virtual audio device like
  [BlackHole](https://github.com/ExistentialAudio/BlackHole) on your Mac,
  create a Multi-Output/Aggregate Device in Audio MIDI Setup that combines
  your mic + BlackHole, and select that aggregate device in the app's device
  picker. This is the same trick most indie Mac meeting recorders use before
  they ship a native ScreenCaptureKit tap.
- **Streaming transcription is a simplified rolling-window approach**, not
  true incremental ASR — every ~2s it re-transcribes the pending audio
  buffer and finalizes settled segments. Good enough for live notes, not
  word-perfect real-time captioning.
- **No speaker diarization yet** — transcripts aren't labeled by speaker.
- **Auth is a single shared bearer token** — fine behind your router or
  Tailscale, not meant to be exposed directly to the open internet (e.g. via
  port forwarding).
- **No calendar integration, no chat-with-your-notes, no templates yet** —
  planned as v2, see below.
- **iPhone recording needs the screen on and the tab in the foreground.**
  iOS suspends microphone access the moment you lock the phone or switch
  apps — same limitation every web-based recorder has on iOS, not something
  this app can work around.
- **The BlackHole trick above is Mac-only.** There's no equivalent on iPhone
  for capturing the other side of a phone call — the iPhone client is really
  for in-person meetings (or anything playing through the phone's own mic),
  not recording phone calls.
- **If you skip Tailscale and use the self-signed-cert fallback instead**,
  it needs a one-time manual trust step on each device (see
  `server/README.md`) — and in practice iOS doesn't always recognize a bare
  `.pem`/`.cer` as installable, so that fallback path also ships a
  `.mobileconfig` generator as a second-line fix.

## v2 ideas (not built yet)

- Chat with your notes (RAG over past meetings, answered by your local LLM)
- Calendar auto-detect meetings (Google/Outlook)
- Speaker diarization (pyannote.audio)
- Meeting templates
