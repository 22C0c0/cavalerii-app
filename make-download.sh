#!/usr/bin/env bash
# Construiește o arhivă ZIP a proiectului pentru descărcare.
# Regula de aur: EXCLUDE toate fișierele cu secrete — arhiva conține DOAR cod.
set -euo pipefail

ZIP_PATH="public/acs-cavalerii-suceava.zip"

rm -f "$ZIP_PATH"

# Excluderi: dependențe, build-uri, cache-uri, istoric git și — cel mai important —
# fișierele locale de mediu cu chei secrete (.env.local, .env.keys).
# Folosim pattern-ul ".env*" ca să nu numim explicit niciun fișier secret.
zip -r "$ZIP_PATH" . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x "isolate/*" \
  -x ".fontcache/*" \
  -x ".git/*" \
  -x ".env*" \
  -x "public/acs-cavalerii-suceava.zip" \
  -x "*.DS_Store" \
  -x "package-lock.json" \
  > /dev/null

echo "=== ARHIVA A FOST CREATĂ ==="
ls -lh "$ZIP_PATH"

echo ""
echo "=== Verificare: fișiere cheie prezente ==="
unzip -l "$ZIP_PATH" | grep -E "deploy-github|workflows/deploy|convex.json|bun.lock|gitignore|package.json|src/main.tsx" || true

echo ""
echo "=== Verificare: fișiere cu secrete (trebuie să fie 0) ==="
COUNT=$(unzip -l "$ZIP_PATH" | grep -c "\.env" || true)
if [ "$COUNT" -eq 0 ]; then
  echo "OK — arhiva nu conține niciun fișier de mediu cu secrete."
else
  echo "ATENȚIE: găsite $COUNT fișiere de mediu! Șterge arhiva, nu o descărca."
  exit 1
fi
