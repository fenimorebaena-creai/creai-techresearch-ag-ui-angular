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

echo "Starting FastAPI on :8000..."
(cd "$ROOT/apps/api" && . .venv/bin/activate && uvicorn src.main:app --reload --port 8000) &

echo "Starting Angular on :4200..."
(cd "$ROOT/apps/web" && npm start) &

wait
