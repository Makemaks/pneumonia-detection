#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

export UV_PYTHON_INSTALL_DIR="$repo_dir/.python"
export UV_PYTHON_BIN_DIR="$repo_dir/.tools/bin"
export UV_CACHE_DIR="$repo_dir/.cache/uv"
export npm_config_cache="$repo_dir/.cache/npm"
uv_bin="$repo_dir/.tools/uv/bin/uv"

if [ ! -x "$uv_bin" ]; then
  python3 -m pip install --disable-pip-version-check --no-cache-dir \
    --target "$repo_dir/.tools/uv" 'uv==0.12.23'
fi

python_version="$(cat .python-version)"
"$uv_bin" python install "$python_version"
if [ ! -x .venv/bin/python ]; then
  "$uv_bin" venv --python "$python_version" --seed .venv
fi

if ! .venv/bin/python -c 'import sys; assert sys.version_info[:2] == (3, 12)' >/dev/null 2>&1; then
  mv .venv ".venv-previous-$(date +%Y%m%d%H%M%S)"
  "$uv_bin" venv --python "$python_version" --seed .venv
fi
"$uv_bin" pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python scripts/download-ft004.py
npm --prefix frontend ci

test -f model/artifacts/ft004/member_1_viridis_ge_clahe_s42.pt
printf '\n%s\n' 'Setup complete. Run npm run dev, then open http://127.0.0.1:5174.'
