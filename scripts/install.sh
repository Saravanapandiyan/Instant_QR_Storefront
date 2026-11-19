#!/usr/bin/env bash
# Appkodes Store installer for OrdZo.
# Usage: curl -fsSL https://store.appkodes.com/install/instant-qr-storefront.sh | bash -s -- --licence=AK-XXXX-XXXX-XXXX
set -euo pipefail

PRODUCT="instant-qr-storefront"
APP_DIR="/opt/${PRODUCT}"
STORE="https://store.appkodes.com"
LICENCE=""
DOMAIN=""

for arg in "$@"; do
  case "$arg" in
    --licence=*|--license=*) LICENCE="${arg#*=}" ;;
    --domain=*) DOMAIN="${arg#*=}" ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root, for example: curl ... | sudo bash -s -- --licence=..." >&2
  exit 1
fi

if [ -z "$LICENCE" ]; then
  if ( : < /dev/tty ) 2>/dev/null; then
    read -r -p "Licence key: " LICENCE < /dev/tty
  else
    echo "No licence key. Pass --licence=AK-XXXX-XXXX-XXXX." >&2
    exit 1
  fi
fi

command -v curl  >/dev/null || { apt-get update -y && apt-get install -y curl; }
command -v unzip >/dev/null || { apt-get update -y && apt-get install -y unzip; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Checking your licence and downloading ${PRODUCT}..."
if ! curl -sSL --fail-with-body -D "$TMP/headers" \
      -d "licence=${LICENCE}" -d "product=${PRODUCT}" \
      "${STORE}/api/store/licence/download" -o "$TMP/release.zip"; then
  cat "$TMP/release.zip" >&2 2>/dev/null || true
  exit 1
fi

VERSION="$(grep -i '^x-appkodes-version:' "$TMP/headers" | tail -1 | cut -d' ' -f2 | tr -d '\r')"
echo "Downloaded version ${VERSION:-unknown}."

mkdir -p "$APP_DIR"
unzip -oq "$TMP/release.zip" -d "$APP_DIR"

# Run unattended application setup
export LICENCE
export DOMAIN="${DOMAIN:-$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || hostname -I | awk '{print $1}' || echo 'localhost')}"

if [ -f "$APP_DIR/scripts/setup.sh" ]; then
  chmod +x "$APP_DIR/scripts/setup.sh"
  bash "$APP_DIR/scripts/setup.sh"
fi

echo "=========================================================="
echo " OrdZo ${VERSION:-} installed successfully!"
echo " Location: ${APP_DIR}"
echo " Accessible via: http://${DOMAIN}"
echo "=========================================================="
