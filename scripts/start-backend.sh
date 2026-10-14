#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

if [ ! -x .venv/bin/python ]; then
  printf '%s\n' 'Run npm run setup first.' >&2
  exit 1
fi

export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1

exec .venv/bin/python -m uvicorn app.main:app \
  --host 127.0.0.1 --port "${PNEUMONIA_API_PORT:-8001}" "$@"
