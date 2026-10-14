# FT-004 Chest X-ray Research App

Single-container FastAPI application that serves both:

- the Vue/Vite frontend
- the `/predict` three-class FT-004 ensemble API

The live model is the frozen FT-004 package published by
[Gerdoo2001/ai-research](https://github.com/Gerdoo2001/ai-research/tree/7a90abfa3695f61a17e4a2dd959c0da822080b21/model/artifacts/ft004).
It averages the Normal, Viral and Bacterial probabilities from three original
seed-42 DenseNet201 networks, then selects the highest score. FT-011 completed
its seed-42 screening on October 13 and did not replace FT-004.

## Local development on macOS

From this repository's root:

```sh
npm run setup
npm run dev
```

Open **http://127.0.0.1:5174**. The backend runs at **http://127.0.0.1:8001**;
Vite forwards the frontend's API requests to that local backend. Both servers
reload as source files change. Press **Ctrl+C** to stop both.
The first launch can take a couple of minutes while the three models initialize;
the frontend starts after the model is ready.

Setup installs Python 3.12, an isolated `.venv`, the pinned backend packages,
and the frontend lockfile dependencies. Python, uv, and caches stay inside this
repository. Node 22.12 or later and a bootstrap `python3` with pip are required.
Setup downloads about 657 MB of model weights from the pinned publication and
verifies every SHA-256 hash. Weights are ignored by this application's Git repository.

The default ports avoid the existing Orbis development servers. To use other ports:

```sh
PNEUMONIA_API_PORT=8002 PNEUMONIA_WEB_PORT=5175 npm run dev
```

To build the frontend and serve everything from one local backend process:

```sh
npm start
```

Then open **http://127.0.0.1:8001**. `npm start` builds and copies the generated
frontend into the ignored `app/static` directory before starting FastAPI.

Useful commands: `npm run build`, `npm run dev:backend`, and
`npm run dev:frontend`. Run the last two in separate terminals if desired.

The runtime uses PyTorch 2.5.1 and torchvision 0.20.1; Linux selects their CPU
wheels. The research checkpoint configurations and deterministic preprocessing
are preserved. TensorFlow is no longer needed for inference.
The project-local Python installation follows [uv's managed Python workflow](https://docs.astral.sh/uv/guides/install-python/).

## Pulmo interface

The frontend includes a desktop analysis workspace, an illustrative 3D lung
viewer, preview-first uploads, cancellable analysis, retryable errors, and text reports.
The lung model is procedural artwork, not an image-specific reconstruction or heatmap.
Its default Airways view reveals the branching airways through translucent tissue.
Animated air parcels follow the windpipe into the lungs during inhalation and reverse
on exhalation; the lung surfaces expand and relax in the same six-second cycle.
Surface mode shows the tissue and lobe fissures. **Preview scan** runs a short visual
sweep; real analysis activates the same effect automatically while the API is working.
Neither the breathing cycle nor the scan sweep represents patient measurements or
model progress. Pause freezes the breathing and airflow together.
Drag to rotate, use the viewer controls to zoom/pause/reset, or focus the viewer and
press the left/right arrows to rotate and Home to reset. Reduced-motion preferences
are respected; a static illustration is available when WebGL is unavailable.

Upload one JPEG or PNG up to 5 MB, review it, then select **Analyze X-ray**.
Results open in a modal with the original image and all three averaged class
scores. There is no binary threshold or inferred complementary score. Reports
include the model's source revision. These scores are not clinical certainty. Cancelling abandons
the browser request; a computation already started by the server may still finish.
Fonts and the 3D engine are bundled locally; the UI does not need a CDN at runtime.

Frontend validation checks:

```sh
npm --prefix frontend test
npm run build
python -m unittest discover -s tests -v
```

## Manual setup on Windows

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
python scripts/download-ft004.py
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000.

## Run with Docker

```powershell
python scripts/download-ft004.py
docker build -t pneumonia-fastapi .
docker run --rm -p 8000:8000 pneumonia-fastapi
```

Open http://127.0.0.1:8000.

## Frozen model package

By default, the app loads:

```text
model/artifacts/ft004/selection.json
```

Override its directory with `FT004_SELECTION_PATH` when mounting the same verified
package. Startup verifies the pinned manifest, selection, checkpoint files and
vendored inference source before loading. `/health` reports the model identity,
source revision, class order and three-member count only after loading succeeds.

The server runs one bounded CPU inference at a time and responds with HTTP 503
when busy. Uploads are limited to one JPEG/PNG, 5 MB and 16 megapixels.

This is a research prototype. The published scores are development-validation
results, not independent clinical performance. External evaluation remains pending.
