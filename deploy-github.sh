#!/usr/bin/env bash
# ============================================================
#  Deploy ACS Cavalerii Suceava pe GitHub Pages
#  Rulare:  bash deploy-github.sh
#  Necesită: git instalat (gh CLI e opțional, automatează mai mult)
# ============================================================
set -euo pipefail

echo ""
echo "=== Deploy ACS Cavalerii Suceava pe GitHub Pages ==="
echo ""

# 0. Verific git
if ! command -v git >/dev/null 2>&1; then
  echo "Eroare: git nu este instalat. Instalează-l de la https://git-scm.com"
  exit 1
fi

# 1. Citesc VITE_CONVEX_URL din .env.local, dacă există
CONVEX_URL=""
if [ -f .env.local ]; then
  CONVEX_URL="$(grep -E '^VITE_CONVEX_URL=' .env.local | cut -d= -f2- | tr -d '"' || true)"
fi
if [ -z "$CONVEX_URL" ]; then
  echo "Atenție: nu am găsit VITE_CONVEX_URL în .env.local."
  read -rp "Lipește aici URL-ul Convex (ex: https://xxx-yyy.convex.cloud): " CONVEX_URL
  [ -z "$CONVEX_URL" ] && { echo "Eroare: URL Convex lipsă — aplicația va porni fără backend."; }
fi

# 2. URL-ul repo-ului GitHub
read -rp "URL-ul repo-ului GitHub (ex: https://github.com/utilizator/acs-cavalerii-suceava.git): " REPO_URL
[ -z "$REPO_URL" ] && { echo "Eroare: URL lipsă."; exit 1; }

# 3. Inițializare repo + primul commit
echo ""
echo "→ Pregătesc repository-ul git..."
git init -b main 2>/dev/null || git init
git add .
git commit -m "ACS Cavalerii Suceava — prima versiune" || echo "(nimic nou de comisat)"

# 4. Push
echo "→ Trimit codul pe GitHub..."
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi
git push -u origin main

echo ""
echo "✓ Codul e pe GitHub."

# 5. Secret + activare Pages (automate dacă există gh CLI, altfel instrucțiuni)
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "→ Setez secretul VITE_CONVEX_URL..."
  REPO_SLUG="${REPO_URL#*github.com/}"
  REPO_SLUG="${REPO_SLUG%.git}"
  gh secret set VITE_CONVEX_URL -R "$REPO_SLUG" -b "$CONVEX_URL"

  echo "→ Activez GitHub Pages (Source: GitHub Actions)..."
  gh api -X POST "repos/$REPO_SLUG/pages" -f "build_type=workflow" 2>/dev/null \
    || echo "(Pages pare deja activat — OK)"

  echo ""
  echo "=== GATA! ==="
  echo "Deploy-ul rulează acum: verifică tab-ul Actions din repo."
  echo "În ~3 minute site-ul e live la:"
  echo "  https://$(echo "$REPO_SLUG" | cut -d/ -f1).github.io/$(echo "$REPO_SLUG" | cut -d/ -f2)/"
else
  echo ""
  echo "=== Mai ai 2 pași manual (2 minute) ==="
  echo "gh CLI nu e instalat/logat, deci setezi manual:"
  echo ""
  echo "1. Secretul: repo → Settings → Secrets and variables → Actions"
  echo "   → New repository secret → Name: VITE_CONVEX_URL"
  echo "   → Value: $CONVEX_URL"
  echo ""
  echo "2. Pages: repo → Settings → Pages → Source: GitHub Actions"
  echo ""
  echo "Apoi: tab-ul Actions → așteaptă build-ul verde (~3 min)."
fi

echo ""
