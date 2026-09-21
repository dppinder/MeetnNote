#!/usr/bin/env bash
# Wraps the server's self-signed cert in a proper .mobileconfig configuration
# profile. iOS sometimes fails to recognize a bare .pem/.cer file as
# installable (varies by iOS version and transfer method) — a .mobileconfig
# is the format Apple's own tools use and is recognized unambiguously
# regardless of whether it arrives via AirDrop, Mail, or Safari.
#
# Run this ON YOUR MAC (needs openssl + uuidgen, both built in):
#   ./make-ios-profile.sh path/to/cert.pem
set -euo pipefail

PEM="${1:?Usage: $0 path/to/cert.pem [output.mobileconfig]}"
OUT="${2:-$HOME/Desktop/meetnnote-trust.mobileconfig}"

gen_uuid() {
  if command -v uuidgen &>/dev/null; then
    uuidgen
  else
    python3 -c "import uuid; print(str(uuid.uuid4()).upper())"
  fi
}

DER_B64=$(openssl x509 -in "$PEM" -outform der | base64)
UUID_CERT=$(gen_uuid)
UUID_PROFILE=$(gen_uuid)

cat > "$OUT" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadCertificateFileName</key>
      <string>meetnnote-cert.cer</string>
      <key>PayloadContent</key>
      <data>
$DER_B64
      </data>
      <key>PayloadDescription</key>
      <string>Trusted root certificate for your home MeetnNote server (3060)</string>
      <key>PayloadDisplayName</key>
      <string>MeetnNote 3060 Certificate</string>
      <key>PayloadIdentifier</key>
      <string>com.meetnnote.cert</string>
      <key>PayloadType</key>
      <string>com.apple.security.root</string>
      <key>PayloadUUID</key>
      <string>$UUID_CERT</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Installs the self-signed TLS certificate used by your home MeetnNote server so Safari trusts it.</string>
  <key>PayloadDisplayName</key>
  <string>MeetnNote 3060 Trust</string>
  <key>PayloadIdentifier</key>
  <string>com.meetnnote.trustprofile</string>
  <key>PayloadOrganization</key>
  <string>MeetnNote</string>
  <key>PayloadRemovable</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>$UUID_PROFILE</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
EOF

echo "Wrote $OUT"
echo "AirDrop (or email) this .mobileconfig file to your iPhone."
