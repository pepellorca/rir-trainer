#!/usr/bin/env bash
set -euo pipefail
SOURCE="${1:-resources/icon-source.png}"
TARGET="ios/App/App/Assets.xcassets/AppIcon.appiconset"
if [ ! -f "$SOURCE" ]; then
  echo "No se encuentra $SOURCE" >&2
  exit 1
fi
if [ ! -d "$TARGET" ]; then
  echo "Crea primero el proyecto iOS con: npm run cap:add:ios" >&2
  exit 1
fi
mkdir -p "$TARGET"
make_icon() {
  local size="$1" name="$2"
  sips -s format png -z "$size" "$size" "$SOURCE" --out "$TARGET/$name" >/dev/null
}
make_icon 40  "AppIcon-20@2x.png"
make_icon 60  "AppIcon-20@3x.png"
make_icon 58  "AppIcon-29@2x.png"
make_icon 87  "AppIcon-29@3x.png"
make_icon 80  "AppIcon-40@2x.png"
make_icon 120 "AppIcon-40@3x.png"
make_icon 120 "AppIcon-60@2x.png"
make_icon 180 "AppIcon-60@3x.png"
make_icon 1024 "AppIcon-1024.png"
cat > "$TARGET/Contents.json" <<'JSON'
{
  "images" : [
    { "filename" : "AppIcon-20@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "20x20" },
    { "filename" : "AppIcon-20@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "20x20" },
    { "filename" : "AppIcon-29@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "29x29" },
    { "filename" : "AppIcon-29@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "29x29" },
    { "filename" : "AppIcon-40@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "40x40" },
    { "filename" : "AppIcon-40@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "40x40" },
    { "filename" : "AppIcon-60@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "60x60" },
    { "filename" : "AppIcon-60@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "60x60" },
    { "filename" : "AppIcon-1024.png", "idiom" : "ios-marketing", "scale" : "1x", "size" : "1024x1024" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
JSON
echo "✓ Iconos iOS generados en $TARGET"
