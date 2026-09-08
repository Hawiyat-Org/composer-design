#!/bin/bash
# Convert a 1024x1024 PNG to macOS .icns
# Requires macOS (uses sips and iconutil - not available on Linux)
#
# Usage: ./convert-icon.sh <input.png> [output.icns]
#
# After generation, replace tools/pack/resources/mac/icon.icns with the output.

set -euo pipefail

INPUT="${1:?Usage: $0 <input.png> [output.icns]}"
OUTPUT="${2:-icon.icns}"
NAME=$(basename "$INPUT" .png)
ICONSET="/tmp/${NAME}.iconset"

if [ ! -f "$INPUT" ]; then
  echo "Error: input file not found: $INPUT" >&2
  exit 1
fi

mkdir -p "$ICONSET"

for size in 16 32 64 128 256 512 1024; do
  sips -z "$size" "$size" "$INPUT" --out "$ICONSET/icon_${size}x${size}.png" 2>/dev/null
  if [ "$size" -le 512 ]; then
    sips -z "$((size*2))" "$((size*2))" "$INPUT" --out "$ICONSET/icon_${size}x${size}@2x.png" 2>/dev/null || true
  fi
done

iconutil -c icns "$ICONSET" -o "$OUTPUT"
rm -rf "$ICONSET"
echo "Created $OUTPUT"
