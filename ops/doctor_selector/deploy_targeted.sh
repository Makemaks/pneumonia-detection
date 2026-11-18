#!/usr/bin/env bash
# The existing live container is standalone; legacy Compose-labelled backups
# must not select or recreate another container during this cutover.
set -euo pipefail
revision="${1:?Verified application revision required}"
image="${2:?Verified release image required}"
release="${3:?Absolute evidence directory required}"
expected_old="${4:-ad96a823a97316b30da355e329b7167fa6bbd51ee91cb97fbc200b1cadba95d2}"
model_evidence="${5:-candidate-model-verification.json}"
case "$model_evidence" in candidate-model-verification.json|backend-inheritance-verification.json) ;; *) exit 2 ;; esac
root=/var/www/pneumonia-detection
case "$release" in "$root"/ops/releases/doctor-selector-*) ;; *) exit 2 ;; esac
backup="pneumonia_app-rollback-20261118-${revision:0:7}"
failed="pneumonia_app-failed-20261118-${revision:0:7}"
old=$(docker inspect pneumonia_app --format '{{.Id}}')
test "$old" = "$expected_old"
test "$(docker image inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" = "$revision"
test "$(docker inspect pneumonia_doctor_candidate --format '{{.State.Running}} {{.State.OOMKilled}}')" = 'true false'
if docker inspect "$backup" >/dev/null 2>&1 || docker inspect "$failed" >/dev/null 2>&1; then exit 2; fi
python3 -c 'import json,sys; assert all(json.load(open(p))["verified"] for p in sys.argv[1:])' \
  "$release/candidate-http-verification.json" "$release/$model_evidence"
git -C "$root" diff --quiet "$revision" -- app frontend model/artifacts
docker ps --format '{{.ID}} {{.Names}}' | awk '$2 != "pneumonia_app" && $2 != "pneumonia_doctor_candidate"' | sort > "$release/targeted-other-containers.before"
docker inspect pneumonia_app --format '{{json .State}}' > "$release/targeted-previous-state.json"
rollback() {
  trap - ERR
  current=$(docker inspect pneumonia_app --format '{{.Id}}' 2>/dev/null || true)
  if test -n "$current" && test "$current" != "$old"; then
    docker stop -t 20 "$current" || true
    docker rename "$current" "$failed"
  fi
  old_name=$(docker inspect "$old" --format '{{.Name}}')
  if test "$old_name" != /pneumonia_app; then docker rename "$old" pneumonia_app; fi
  docker start "$old"
  printf '%s\n' 'New release failed; original standalone Pulmo container restored.' >&2
  exit 1
}
trap rollback ERR
docker stop -t 30 "$old"
docker rename "$old" "$backup"
docker run -d --name pneumonia_app --restart unless-stopped --init \
  --memory=1g --memory-swap=1g --cpus=.75 --pids-limit=256 \
  --read-only --user=10001:10001 --network=pneumonia-standalone \
  --cap-drop=ALL --security-opt=no-new-privileges:true \
  --tmpfs /tmp:rw,noexec,nosuid,size=128m,mode=1777 \
  --log-driver=json-file --log-opt max-size=10m --log-opt max-file=3 \
  --health-cmd="python -c 'import json,urllib.request; r=json.load(urllib.request.urlopen(\"http://127.0.0.1:8000/health\",timeout=3)); assert r[\"status\"]==\"ok\"'" \
  --health-interval=30s --health-timeout=5s --health-start-period=120s --health-retries=3 \
  -e FT004_SELECTION_PATH=/app/model/artifacts/ft004/selection.json \
  -e OMP_NUM_THREADS=1 -e OPENBLAS_NUM_THREADS=1 \
  -e PYTHONDONTWRITEBYTECODE=1 -e PYTHONUNBUFFERED=1 \
  -p 127.0.0.1:8090:8000 "$image" \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 \
  --limit-concurrency 8 --proxy-headers --forwarded-allow-ips '*'
ready=false
for n in $(seq 1 90); do
  if curl --fail --silent http://127.0.0.1:8090/health > "$release/targeted-health.json"; then ready=true; break; fi
  test "$(docker inspect pneumonia_app --format '{{.State.Running}}')" = true
  sleep 2
done
test "$ready" = true
python3 "$release/ops/doctor_selector/verify.py" http://127.0.0.1:8090 > "$release/live-http-verification.json"
python3 "$release/ops/doctor_selector/verify.py" https://pneumoniadetection.xyz > "$release/public-http-verification.json"
curl --fail --silent --show-error --max-time 15 https://pneumoniadetection.xyz/ > "$release/public-index.html"
cmp "$release/frontend/dist/index.html" "$release/public-index.html"
docker ps --format '{{.ID}} {{.Names}}' | awk '$2 != "pneumonia_app" && $2 != "pneumonia_doctor_candidate"' | sort > "$release/targeted-other-containers.after"
cmp "$release/targeted-other-containers.before" "$release/targeted-other-containers.after"
docker inspect pneumonia_app --format '{{.Config.Image}} {{.State.Health.Status}} OOM={{.State.OOMKilled}} restarts={{.RestartCount}}'
trap - ERR
