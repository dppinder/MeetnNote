# MeetnNote — server

FastAPI service that runs on your GPU box (`3060`, RTX 3060 12GB). Handles:

- Live streaming transcription (faster-whisper on GPU)
- AI meeting-notes generation (Ollama, local LLM — Llama 3.1 8B by default, Mistral 7B fallback)
- Meeting/transcript/notes storage (SQLite)

## Deploy to `3060`

From your Mac:

```bash
rsync -av --exclude venv --exclude data --exclude __pycache__ \
  meetnnote/server/ 3060:~/meetnnote/server/
ssh 3060
```

Then on `3060`:

```bash
cd ~/meetnnote/server
chmod +x deploy/setup.sh
./deploy/setup.sh
```

This creates a dedicated venv (`~/meetnnote-env`, separate from your existing
`~/legal-inference-env`), installs deps, installs/starts Ollama if needed, pulls
`llama3.1:8b` and `mistral:7b-instruct`, and writes `.env` with a random auth
token.

> **Note on VRAM:** `ollama pull llama3.1:8b` fetches the quantized (~Q4, ~4.7GB)
> version, not the 16GB fp16 checkpoint you tried to fine-tune earlier. That,
> plus `faster-whisper` (medium, int8_float16, ~1-2GB), comfortably fits in
> 12GB alongside normal desktop use.

### HTTPS for the iPhone (recommended: Tailscale)

iOS Safari only allows microphone access on `https://` (or `localhost`).
The Tauri desktop app doesn't have this problem — its WebView origin is
already trusted, so it talks to the plain-HTTP server below with no
changes needed. Only the iPhone PWA needs an HTTPS path in.

**Recommended: Tailscale.** It issues this box a real, publicly-trusted
certificate (via Let's Encrypt) for its tailnet address — no self-signed
cert, no manual "trust this" dance on the phone at all, and it also gives
you access to `3060` from outside your house for free:

```bash
./deploy/setup-tailscale.sh
```

Follow its printed instructions (sign in, enable HTTPS Certificates once in
the Tailscale admin console, run `tailscale serve`). Install the Tailscale
app on your iPhone from the App Store, sign into the same account, and open
the `https://<device>.<tailnet>.ts.net` URL it gives you in Safari — no cert
to trust, it just works.

**Fallback: self-signed cert**, if you'd rather not run Tailscale:

```bash
./deploy/gen-selfsigned-cert.sh 192.168.1.162 3060
```

Then run uvicorn with `--ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem`
on a port like 8443 instead of the plain-HTTP command below, and **trust the
cert** on your iPhone: AirDrop `certs/cert.pem` to it → it should prompt
"Profile Downloaded" → Settings → General → VPN & Device Management →
install the profile → Settings → General → About → Certificate Trust
Settings → enable full trust for it.

In practice a bare `.pem` (or a renamed `.cer`/`.der`) sometimes doesn't
register as installable, depending on iOS version and transfer method — if
VPN & Device Management shows nothing after AirDropping it, build a proper
`.mobileconfig` profile instead (the format Apple's own tools use,
recognized unambiguously regardless of transfer method):

```bash
# on your Mac, needs openssl + uuidgen (both built in)
./deploy/make-ios-profile.sh path/to/cert.pem
```

AirDrop the resulting `meetnnote-trust.mobileconfig` instead — this one
reliably shows up under VPN & Device Management to install. This is a
one-time step per device; without it, browsers refuse the connection
outright rather than just showing a warning, since self-signed certs
aren't trusted by default.

### Serving the web app to your phone

Build the client and copy its output next to the server, so `3060` serves
the app itself as well as the API — your phone just browses to the server's
URL and gets MeetnNote, installable via Safari's "Add to Home Screen":

```bash
# on your Mac
cd client && npm install && npm run build
rsync -av dist/ 3060:~/meetnnote/server/client-dist/
```

The server automatically serves it if `client-dist/` exists next to
`app/` (see `STATIC_DIR` in `.env.example`); if it's missing, the server
just runs API-only, which is fine if you only ever use the Tauri desktop app.

### Run it

Quick test, foreground (plain HTTP — see above for adding TLS, either via
Tailscale in front of this or the `--ssl-keyfile`/`--ssl-certfile` fallback):

```bash
source ~/meetnnote-env/bin/activate
cd ~/meetnnote/server
uvicorn app.main:app --host 0.0.0.0 --port 8010
```

Persistent, as a systemd service:

```bash
sudo cp deploy/meetnnote.service /etc/systemd/system/
sudo nano /etc/systemd/system/meetnnote.service   # fix YOUR_USERNAME paths
sudo systemctl daemon-reload
sudo systemctl enable --now meetnnote
sudo systemctl status meetnnote
```

Then: on your Mac, point the Tauri app's Settings at `http://192.168.1.162:8010`.
On your iPhone, use the Tailscale URL from `setup-tailscale.sh` (or the
self-signed `https://192.168.1.162:8443` fallback) in Safari, tap Share →
**Add to Home Screen**.

### Firewall

Only allow the plain-HTTP port from your LAN — Tailscale traffic doesn't
touch this, it arrives over the `tailscale0` interface instead:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8010 proto tcp
```

If you're using the self-signed-cert fallback instead of Tailscale, open
8443 the same way.

### Config (`.env`)

See `.env.example`. Key values:

- `AUTH_TOKEN` — bearer token the client must send. Generated randomly by `setup.sh`; copy it into the client's Settings screen.
- `WHISPER_MODEL` / `WHISPER_COMPUTE_TYPE` — tune for speed vs. accuracy. `medium` + `int8_float16` is a good default on a 3060; try `large-v3` if you want better accuracy and have VRAM headroom.
- `OLLAMA_MODEL` / `OLLAMA_FALLBACK_MODEL` — which local models generate notes.
- `STATIC_DIR` — where the built web client lives (default `./client-dist`); the server serves it if present, runs API-only if not.

## API

All REST endpoints require `Authorization: Bearer <AUTH_TOKEN>`.

- `POST /meetings` — create a meeting (`title`, `attendees`)
- `GET /meetings?q=` — list/search meetings
- `GET /meetings/{id}` — meeting + transcript segments + notes
- `PATCH /meetings/{id}` — update title/attendees/status
- `DELETE /meetings/{id}`
- `POST /meetings/{id}/generate-notes` — run the LLM over the stored transcript, save + return structured notes
- `PATCH /meetings/{id}/notes` — manually edit notes (marks `edited_by_user`)
- `GET /health` — no auth, for monitoring

### Live transcription — `ws://<host>:8010/meetings/{id}/audio?token=<AUTH_TOKEN>`

(`wss://` on whatever port you're serving HTTPS on, if using Tailscale or the self-signed-cert fallback.)

Client sends **binary frames**: raw PCM16, mono, 16kHz, in small chunks (e.g. every 250-500ms of audio).

Client sends **one text frame** to stop: `{"action": "stop"}` — server flushes remaining audio and closes.

Server sends **text (JSON) frames**:

```jsonc
{"type": "interim", "text": "...still-being-transcribed tail..."}
{"type": "final", "segment": {"start_ms": 0, "end_ms": 2340, "text": "..."}}
{"type": "stopped"}
```

`final` segments are already persisted to the DB when sent. `interim` is a live preview only — it is replaced by the next update, never stored.
