# Pneumonia FastAPI App

Single-container FastAPI application that serves both:

- the Vue/Vite frontend
- the `/predict` pneumonia model API

## Run locally

Build the frontend first:

```powershell
cd frontend
npm install
npm run build
cd ..
New-Item -ItemType Directory -Force app/static | Out-Null
Copy-Item -Recurse -Force frontend/dist/* app/static/
```

Start FastAPI:

```powershell
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000.

## Run with Docker

```powershell
docker build -t pneumonia-fastapi .
docker run --rm -p 8000:8000 pneumonia-fastapi
```

Open http://127.0.0.1:8000.

## Model path

By default, the app loads:

```text
model/outputs/binary/v2/densenet201/densenet201_pneumonia.h5
```

You can override it with `MODEL_PATH` if you mount the model separately.
