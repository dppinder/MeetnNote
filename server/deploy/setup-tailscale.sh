#!/usr/bin/env bash
# Sets up Tailscale on 3060 and exposes MeetnNote over it with a real,
# publicly-trusted HTTPS certificate (via Tailscale's Let's Encrypt
# integration) — no self-signed cert, no manual "trust this" step on any
# device. Run this ON THE 3060 BOX.
#
# Prerequisites: MeetnNote itself already running on plain HTTP (see
# deploy/meetnnote.service or run uvicorn manually on port 8000).
set -euo pipefail

APP_PORT="${1:-8000}"

echo "==> Checking Tailscale..."
if ! command -v tailscale &>/dev/null; then
  echo "Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
fi

echo "==> Connecting this box to your tailnet (opens a login link if not already signed in)..."
sudo tailscale up

echo
echo "==> Tailscale status:"
tailscale status

HOSTNAME_TS=$(tailscale status --json | python3 -c "import json,sys; print(json.load(sys.stdin)['Self']['DNSName'].rstrip('.'))" 2>/dev/null || echo "<check 'tailscale status' above for your device's name>")

cat << EOF

==> IMPORTANT one-time step (only needed once per Tailscale account, not per device):
    Go to https://login.tailscale.com/admin/dns and enable "HTTPS Certificates"
    if you haven't already — this is what lets Tailscale issue a real,
    trusted cert for this box instead of a self-signed one.

==> Then run this to expose MeetnNote over HTTPS on the tailnet:
    sudo tailscale serve --bg --https=443 http://127.0.0.1:$APP_PORT

    (If that exact syntax errors, Tailscale's CLI flags have shifted across
    versions — run 'tailscale serve --help' for the form your installed
    version expects; the goal is: HTTPS on 443, proxying to
    http://127.0.0.1:$APP_PORT)

==> Once that's running, your MeetnNote URL is:
    https://$HOSTNAME_TS

    Install the Tailscale app on your iPhone (App Store), sign into the
    same account, and open that URL in Safari — no cert to trust, it just
    works, and it works from anywhere, not just your home Wi-Fi.
EOF
