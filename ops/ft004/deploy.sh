#!/usr/bin/env bash
# Run on the existing production server only after candidate verification.
set -euo pipefail
revision="${1:?Full tested application revision required}"
image="${2:?Verified release image required}"
app_dir=/var/www/pneumonia-detection
release_dir="$app_dir/ops/releases/ft004-20261014"
compose_file="$app_dir/ops/standalone-20261008/compose.yaml"
cd "$app_dir"
test -z "$(git status --porcelain --untracked-files=no)"
git fetch origin master
test "$(git rev-parse origin/master)" = "$revision"
git merge --ff-only origin/master
test "$(git rev-parse HEAD)" = "$revision"
test "$(docker image inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" = "$revision"
test ! -f "$release_dir/compose.before.yaml"
cp "$compose_file" "$release_dir/compose.before.yaml"
docker ps --format '{{.ID}} {{.Names}}' | awk '$2 != "pneumonia_app" && $2 != "pneumonia_ft004_candidate"' | sort > "$release_dir/other-containers.before"
PNEUMONIA_FT004_IMAGE="$image" docker compose -f ops/ft004/compose.yaml config > "$release_dir/compose.after.yaml"
rollback() {
  trap - ERR
  cp "$release_dir/compose.before.yaml" "$compose_file"
  docker compose -f "$compose_file" up -d --no-build --wait --wait-timeout 180
  printf '%s\n' 'Release verification failed; the previous service has been restored.' >&2
  exit 1
}
trap rollback ERR
cp "$release_dir/compose.after.yaml" "$compose_file"
docker compose -f "$compose_file" up -d --no-build --wait --wait-timeout 180
docker exec -i pneumonia_app python - < ops/ft004/verify.py > "$release_dir/live-api-verification.json"
curl --fail --silent --show-error --max-time 15 http://127.0.0.1:8090/research > "$release_dir/live-research.html"
cmp "$release_dir/dist/index.html" "$release_dir/live-research.html"
docker ps --format '{{.ID}} {{.Names}}' | awk '$2 != "pneumonia_app" && $2 != "pneumonia_ft004_candidate"' | sort > "$release_dir/other-containers.after"
cmp "$release_dir/other-containers.before" "$release_dir/other-containers.after"
trap - ERR
docker inspect pneumonia_app --format '{{.Config.Image}} {{.State.Health.Status}} restarts={{.RestartCount}}'
