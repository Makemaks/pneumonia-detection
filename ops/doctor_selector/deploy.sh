#!/usr/bin/env bash
# Candidate must have passed all checks before this script touches production.
set -euo pipefail
revision="${1:?Full tested application revision required}"
image="${2:?Verified candidate image required}"
release="${3:?Absolute release evidence directory required}"
root=/var/www/pneumonia-detection
compose="$root/ops/standalone-20261008/compose.yaml"
case "$release" in "$root"/ops/releases/doctor-selector-*) ;; *) exit 2 ;; esac
test -d "$release"
test ! -e "$release/compose.before.yaml"
test -s "$release/candidate-http-verification.json"
test -s "$release/candidate-model-verification.json"
python3 -c 'import json,sys; assert all(json.load(open(p))["verified"] for p in sys.argv[1:])' \
  "$release/candidate-http-verification.json" "$release/candidate-model-verification.json"
test "$(docker image inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" = "$revision"
cd "$root"
test -z "$(git status --porcelain --untracked-files=no)"
git fetch origin master
test "$(git rev-parse origin/master)" = "$revision"
git merge --ff-only origin/master
test "$(git rev-parse HEAD)" = "$revision"
cp "$compose" "$release/compose.before.yaml"
docker inspect pneumonia_app --format '{{.Config.Image}}' > "$release/previous-image.txt"
docker ps --format '{{.ID}} {{.Names}}' | awk '$2 != "pneumonia_app" && $2 != "pneumonia_doctor_candidate"' | sort > "$release/other-containers.before"
PNEUMONIA_FT004_IMAGE="$image" docker compose -f ops/ft004/compose.yaml config > "$release/compose.after.yaml"
rollback() {
  trap - ERR
  cp "$release/compose.before.yaml" "$compose"
  docker compose -f "$compose" up -d --no-build --no-deps --wait --wait-timeout 180 app
  printf '%s\n' 'New release failed; previous Pulmo container configuration restored.' >&2
  exit 1
}
trap rollback ERR
cp "$release/compose.after.yaml" "$compose"
docker compose -f "$compose" up -d --no-build --no-deps --wait --wait-timeout 180 app
docker exec -i pneumonia_app python - http://127.0.0.1:8000 \
  < "$release/ops/doctor_selector/verify.py" > "$release/live-http-verification.json"
python3 "$release/ops/doctor_selector/verify.py" https://pneumoniadetection.xyz \
  > "$release/public-http-verification.json"
curl --fail --silent --show-error --max-time 15 https://pneumoniadetection.xyz/ > "$release/public-index.html"
cmp "$release/frontend/dist/index.html" "$release/public-index.html"
docker ps --format '{{.ID}} {{.Names}}' | awk '$2 != "pneumonia_app" && $2 != "pneumonia_doctor_candidate"' | sort > "$release/other-containers.after"
cmp "$release/other-containers.before" "$release/other-containers.after"
docker inspect pneumonia_app --format '{{.Config.Image}} {{.State.Health.Status}} restarts={{.RestartCount}}'
trap - ERR
