# Pulmo dataset selector — 18 November 2026

This release keeps the Pulmo UI and original Kaggle FT-004 system, adding a
separate doctor-shared grouped study ensemble. It does not combine the two
systems into a six-member prediction. Kaggle is still the default.

Doctor package: fixed validation-selected epochs 10, 11, 12; preprocessing
VIRIDIS → GE → CLAHE, VIRIDIS → GE, GE; 224 input; no inference augmentation;
three probability vectors equally averaged. Weight and preprocessing hashes
are checked before loading. The selected weights are unchanged from the
70/15/15-per-class experiment, not the earlier all-300 adaptation or binary
experiment. No test-based member reselection or new training occurs here.

The owner requested public availability as a research demonstration. Original
study/checkpoint nondeployment flags are retained as historical controls,
not silently rewritten into clinical permission. This public prototype is not
for clinical diagnosis. Doctor-shared does not mean independently collected:
the collection contains public-source data, 200 pneumonia images have possible
Kaggle similarity, Normal source checksums remain unresolved, and pneumonia
patient identity is unverified. Warnings appear beside the selector, in
results and in downloaded text reports.

## Runtime

- `/models`: availability, public version identity and current resident source.
- `/predict`: multipart `file` plus `model_source=kaggle|doctor`, default Kaggle.
- A result must match its requested source, model identity and pinned revision.
- `/health` retains the original Kaggle default identity for compatibility and
  adds the active source. It reports availability, not a promise that Kaggle
  is currently resident while a doctor prediction is being processed.
- One prediction/switch at a time. Unload before changing sources; no fallback.
- Doctor availability at startup means its frozen package hashes validated;
  its networks load on first selection. A failed load disables that source.
- Keep the existing one-worker, 1 GiB, 0.75 CPU, read-only container controls.

## Verification and deployment

Run Python unit tests, frontend tests and build. `verify.py --model` checks real
weights/reference parity and source switching using only an artificial PNG.
`verify.py http://127.0.0.1:8091` checks candidate HTTP routing. Neither is an
accuracy measurement, patient upload or held-out test re-evaluation.

Build the candidate as an overlay on the currently verified FT-004 runtime
with `Dockerfile`, including only app code, built frontend, and the three
doctor selected weights/selection JSON. Do not include patient images,
training recovery checkpoints, private manifests, SSH files or credentials.
Keep raw source bytes and SHA256 checksums when transferring.

Test on a loopback-only candidate port under the existing resource limits.
Preserve the current immutable image and a copy of the active compose file.
Switch only the `pneumonia_app` service after candidate verification. If public
health, both model routes or assets fail, restore the prior compose file and
image. Leave Nginx, TLS, DNS, security groups and all other services unchanged.

The existing frontend lockfile reports npm dependency advisories, including
Vue server-renderer and source-map/build dependencies. This scoped selector
release preserves the existing dependency versions; framework/security
upgrades require a separate tested change. Successful unit/build checks do
not imply a clean dependency security audit.

The first candidate (c81c079) passed single-process reference checks but hit
the 1 GiB container memory ceiling during HTTP doctor-to-Kaggle switching.
It was never activated publicly. The corrected adapter explicitly returns
unused glibc arenas after freeing old weights and after predictions, keeping
the same resource limits. HTTP verification runs outside the serving
container using a standard-library-generated artificial PNG, avoiding an
extra client interpreter inside the server's memory budget. Failed-candidate
logs and subsequent verification evidence remain in the EC2 release record.

The legacy Compose file also sees a stopped Compose-labelled backup while the
real `pneumonia_app` is a standalone container. Compose cutover was blocked by
the occupied name before the live container changed. `deploy_targeted.sh`
therefore targets the verified live container ID, preserves it under an
explicit rollback name, and creates the replacement with the same resource,
security, loopback port and standalone network settings. It restores that
original container automatically if checks fail. Do not use the older
Compose cutover on this host without first reconciling its legacy backups.
