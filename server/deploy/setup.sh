#!/usr/bin/env bash
# Run this ON the 3060 box (e.g. `ssh 3060` from your Mac, then run this script
# from inside the cloned/rsynced meetnnote/server directory).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$HOME/meetnnote-env"

echo "==> App dir: $APP_DIR"

echo "==> Checking GPU..."
if ! command -v nvidia-smi &>/dev/null; then
  echo "nvidia-smi not found. Install NVIDIA drivers first." >&2
  exit 1
fi
nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader

echo "==> Creating venv at $VENV_DIR (if missing)..."
python3.12 -m venv "$VENV_DIR" 2>/dev/null || python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo "==> Installing Python deps (this pulls torch, can take a while)..."
pip install --upgrade pip
pip install -r "$APP_DIR/requirements.txt"

# faster-whisper needs the CUDA/cuDNN runtime libs available to ctranslate2.
# If you already have the CUDA toolkit set up for your legal-inference-env,
# nothing extra is needed. Otherwise: pip install nvidia-cudnn-cu12 nvidia-cublas-cu12

echo "==> Checking Ollama..."
if ! command -v ollama &>/dev/null; then
  echo "Ollama not found. Installing (https://ollama.com/install.sh)..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "==> Ensuring Ollama service is running..."
sudo systemctl enable --now ollama || echo "Could not manage ollama via systemctl, make sure 'ollama serve' is running some other way."

echo "==> Pulling models (quantized, GPU-friendly — NOT the same as the fp16 fine-tuning checkpoint)..."
ollama pull llama3.1:8b
ollama pull mistral:7b-instruct

echo "==> Preparing .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  TOKEN=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
  sed -i "s/^AUTH_TOKEN=.*/AUTH_TOKEN=$TOKEN/" "$APP_DIR/.env"
  echo "Generated a random AUTH_TOKEN in $APP_DIR/.env — you'll need it in the client's settings."
else
  echo ".env already exists, leaving it alone."
fi

mkdir -p "$APP_DIR/data"

echo "==> Generating a self-signed TLS cert (needed for mic access from an iPhone browser)..."
if [ ! -f "$APP_DIR/certs/cert.pem" ]; then
  DETECTED_IP=$(ip -4 addr show scope global 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
  LAN_IP="${1:-${DETECTED_IP:-192.168.1.162}}"
  "$APP_DIR/deploy/gen-selfsigned-cert.sh" "$LAN_IP" "$(hostname)"
else
  echo "certs/cert.pem already exists, leaving it alone."
fi

echo "==> Done. Next steps:"
echo "  1. Review $APP_DIR/.env"
echo "  2. Trust certs/cert.pem on your iPhone and Mac (see the cert script's output above for the exact steps)"
echo "  3. Build the web client and copy it here so phones can just browse to this server:"
echo "       (on your Mac) cd client && npm install && npm run build"
echo "       rsync -av client/dist/ 3060:$APP_DIR/client-dist/"
echo "  4. Test it directly:   source $VENV_DIR/bin/activate && cd $APP_DIR && uvicorn app.main:app --host 0.0.0.0 --port 8443 --ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem"
echo "  5. Or install as a systemd service: see deploy/meetnnote.service"
