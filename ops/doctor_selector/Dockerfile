# Overlay the verified running FT-004 runtime; do not rebuild dependencies.
ARG BASE_IMAGE
FROM ${BASE_IMAGE}
ARG APP_REVISION
LABEL org.opencontainers.image.source="https://github.com/Makemaks/pneumonia-detection" \
      org.opencontainers.image.revision="${APP_REVISION}" \
      ai.model.sources="kaggle,doctor-shared-grouped-701515"
COPY app /app/app
COPY frontend/dist /app/app/static
COPY model/artifacts/doctor_shared_grouped_701515 /app/model/artifacts/doctor_shared_grouped_701515
