#!/usr/bin/env bash
# Runs the AG-UI FastAPI agent and the Angular client concurrently.
# Requires: make install, then ./scripts/dev.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  echo "Stopping processes..."
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

API_PORT="${PORT:-8001}"
echo "Starting FastAPI on :${API_PORT}..."
(cd "$ROOT/apps/api" && . .venv/bin/activate && uvicorn src.main:app --reload --port "$API_PORT") &

echo "Starting Angular on :4200..."
(cd "$ROOT/apps/web" && npm start) &

wait
