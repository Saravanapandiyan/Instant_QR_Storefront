#!/usr/bin/env bash
# Package a sanitized AppKodes Store release zip
set -euo pipefail

PRODUCT="instant-qr-storefront"
VERSION="${1:-1.0.0}"
ZIP_NAME="${PRODUCT}-${VERSION}.zip"
OUT_DIR="dist-release"

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/$ZIP_NAME"

echo "Packaging $ZIP_NAME..."

zip -r "$OUT_DIR/$ZIP_NAME" . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*/dist/*" \
  -x "*/dev-dist/*" \
  -x "*dist-release*" \
  -x "deploy/*" \
  -x "*.env" \
  -x "*.env.local" \
  -x "*.env.production" \
  -x "*.env.development" \
  -x "*.DS_Store" \
  -x "*.pem" \
  -x "*.key"

echo "=== Successfully packaged: $OUT_DIR/$ZIP_NAME ==="
ls -lh "$OUT_DIR/$ZIP_NAME"
