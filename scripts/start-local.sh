#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

if [ ! -x .venv/bin/python ]; then
  printf '%s\n' 'Run npm run setup first.' >&2
  exit 1
fi

npm run build
.venv/bin/python - <<'PY'
from pathlib import Path
from shutil import copytree

copytree(Path('frontend/dist'), Path('app/static'), dirs_exist_ok=True)
PY

exec bash scripts/start-backend.sh
