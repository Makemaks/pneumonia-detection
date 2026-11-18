# Live Pulmo deployment — 18 November 2026

Verified live by approximately 17:15 Manila at https://pneumoniadetection.xyz.

## Delivered

- Kaggle dataset / original FT-004 remains the default.
- Doctor-shared dataset / grouped 70/15/15 is a separate selectable system.
- Each uses three DenseNet201 members; one ensemble stays resident at a time.
- Source identity is checked in the server response and browser. No fallback.
- Selector, results and saved reports identify the selected dataset.
- The doctor option displays its exploratory/public-source/possible-overlap
  limitations. It is not independent clinical validation or clinical use.

## Release identity

- Website repository: `Makemaks/pneumonia-detection`, `master`.
- Application source: `59500ded9b678d162cafcdfaa7b0d887bba2c16c`.
- Runtime image: `pneumonia-dataset-selector:59500de-20261118`.
- Image ID: `sha256:bf68e8a897cad925b5fe71ea79440571460993cb8b24cb3d511f368a11cef8fe`.
- EC2 instance: `i-0e60947c0f04fb25d`, `eu-north-1`, public IP `13.62.170.125`.
- Only `pneumonia_app` was replaced. Nginx, TLS, DNS, firewall, IAM and other
  application/database containers were not changed.
- Retained 1 GiB memory, 0.75 CPU, one worker, read-only filesystem, non-root
  user, dropped capabilities, existing standalone network and loopback 8090.
- Original container retained as `pneumonia_app-rollback-20261118-59500de`.
- The legacy Compose cutover failed on a pre-existing backup/name conflict
  before replacing the live container. The targeted standalone script then
  completed with explicit container rollback rather than Compose recreation.

## Verification

- 12 Python unit/API tests and seven frontend contract tests passed.
- Vue/TypeScript production build passed. Existing npm dependency advisories
  remain disclosed; dependency versions were not upgraded in this release.
- Real-weight/reference checks passed on a generated uniform PNG, including
  Kaggle → doctor → Kaggle switching. Maximum probability difference was 0.
- Corrected EC2 model-check peak RSS: 801.63 MiB under the unchanged 1 GiB cap.
- Candidate, live loopback and public HTTPS prediction checks all passed;
  unknown source was rejected with 422 and only the requested source loaded.
- Public HTML matched the tested build. Chrome showed both options enabled,
  accepted the doctor selection, and displayed its limitation notice.
- Final container: healthy, zero restarts, `OOMKilled=false`; observed memory
  approximately 441.5 MiB after the checks. Other running container IDs/names
  matched their before/after snapshot.
- Temporary candidate was stopped/removed after saving its logs and state.
  Previous image/container and failed-candidate evidence remain available.

The first candidate's HTTP doctor-to-Kaggle switch hit its memory cap. It was
never activated publicly. The corrected adapter frees unused allocator arenas;
the same limit and all inference/checkpoint rules were retained.

The [four JSON evidence records](evidence/20261118) contain only generated-input
execution checks. Their artificial-image predictions are **not accuracy
measurements**, patient results, or a repeat of the study's held-out test.
Training data, split assignments, selected weights and scientific metrics
were not modified for deployment. Original study nondeployment flags remain
unchanged as historical controls; this later owner-requested public research
demonstration does not grant clinical permission.

EC2 release records: `/var/www/pneumonia-detection/ops/releases/doctor-selector-20261118-59500de`.
The separate first-candidate record is the sibling ending `c81c079`.
