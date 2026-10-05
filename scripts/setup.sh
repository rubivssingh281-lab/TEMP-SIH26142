#!/usr/bin/env bash
# भू DRISTI — one-command setup for macOS / Linux.
# Usage:  bash scripts/setup.sh          (install + start dev server)
#         bash scripts/setup.sh --no-run (install only)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"

echo "==> भू DRISTI setup (macOS/Linux)"

# 1. Check Node.js (>= 18.17)
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed. Install Node 20 LTS from https://nodejs.org and re-run." >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node $(node -v) found; this project needs Node >= 18.17 (20 LTS recommended)." >&2
  exit 1
fi
echo "    Node $(node -v), npm $(npm -v)"

# 2. Install dependencies
echo "==> Installing frontend dependencies (npm install)…"
cd "$FRONTEND"
npm install

# 3. Type-check (fast sanity check)
echo "==> Type-checking…"
npm run typecheck

echo ""
echo "==> Setup complete."
echo "    Frontend ready in: $FRONTEND"

# 4. Optionally start the dev server
if [ "${1:-}" = "--no-run" ]; then
  echo "    Start it anytime with:  cd frontend && npm run dev"
  echo "    Then open http://localhost:3000"
  exit 0
fi

echo "==> Starting dev server on http://localhost:3000  (Ctrl+C to stop)"
npm run dev
