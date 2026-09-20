#!/usr/bin/env bash
# Generates a self-signed TLS cert for the server, valid for both the LAN IP
# and hostname. iOS is picky about certs it's asked to trust manually — it
# requires a SAN (not just a CN), SHA-256, a 2048-bit+ key, and <=825 days
# validity — this script follows all of those so "trust this cert" actually
# works on an iPhone, not just in a desktop browser.
set -euo pipefail

IP="${1:-192.168.1.162}"
HOSTNAME_="${2:-3060}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/certs"
mkdir -p "$DIR"

echo "==> Generating self-signed cert for IP=$IP, hostname=$HOSTNAME_"

openssl req -x509 -newkey rsa:2048 -sha256 -days 820 -nodes \
  -keyout "$DIR/key.pem" -out "$DIR/cert.pem" \
  -subj "/CN=$HOSTNAME_" \
  -addext "subjectAltName=DNS:$HOSTNAME_,DNS:$HOSTNAME_.local,IP:$IP,IP:127.0.0.1" \
  -addext "basicConstraints=critical,CA:false" \
  -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
  -addext "extendedKeyUsage=serverAuth"

chmod 600 "$DIR/key.pem"

echo "==> Wrote $DIR/cert.pem and $DIR/key.pem"
echo "==> Copy $DIR/cert.pem to your iPhone (AirDrop, or serve it and open the link in Safari)"
echo "    then: Settings > General > VPN & Device Management > install the profile,"
echo "    then: Settings > General > About > Certificate Trust Settings > enable full trust for it."
echo "    Do the same on your Mac (double-click cert.pem, add to Keychain, set to 'Always Trust')"
echo "    if the Tauri desktop app also needs to reach this server over https."
