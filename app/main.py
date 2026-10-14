"""
FastAPI Backend for Pneumonia Classification
Author: John Mark
"""

import io
import asyncio
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_swagger_ui_oauth2_redirect_html
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from starlette.concurrency import run_in_threadpool
import importlib.resources as pkg_resources

from app.schemas import PredictionResponse
from app.inference import predict, load_model, model_status, InferenceBusyError


# =====================================================
# FastAPI app config
# =====================================================
app = FastAPI(title="FT-004 Chest X-ray Research API", version="2.0.0")
analysis_gate = asyncio.Lock()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
INDEX_FILE = STATIC_DIR / "index.html"

# =====================================================
# Mount LOCAL swagger-ui assets
# =====================================================
try:
    import swagger_ui_bundle

    # Locate the package’s static folder
    with pkg_resources.as_file(pkg_resources.files(swagger_ui_bundle)) as swagger_path:
        app.mount("/swagger-ui", StaticFiles(directory=swagger_path), name="swagger-ui")
        print(f"Serving Swagger UI assets locally from: {swagger_path}")
except Exception as e:
    print(f"[WARN] Could not mount local Swagger UI assets: {e}")


# =====================================================
# Override /docs to use local JS & CSS
# =====================================================
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """
    Local Swagger UI (no CDN calls).
    """
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Docs",
        swagger_js_url="/swagger-ui/swagger-ui-bundle.js",
        swagger_css_url="/swagger-ui/swagger-ui.css",
    )


@app.get(app.swagger_ui_oauth2_redirect_url, include_in_schema=False)
async def swagger_redirect():
    return get_swagger_ui_oauth2_redirect_html()


# =====================================================
# Startup: preload model
# =====================================================
@app.on_event("startup")
def warmup():
    # A failed checkpoint verification must prevent an apparently healthy service.
    load_model()


# =====================================================
# Endpoints
# =====================================================
@app.get("/health")
def health():
    status = model_status()
    return JSONResponse(status, status_code=200 if status["status"] == "ok" else 503)


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(file: UploadFile = File(...)):
    # Keep full-resolution decoding bounded as well as model inference.
    if analysis_gate.locked():
        raise HTTPException(status_code=503, detail="The analysis service is busy. Please retry in a moment.", headers={"Retry-After": "2"})
    async with analysis_gate:
        return await analyze_upload(file)


async def analyze_upload(file: UploadFile):
    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=415, detail="Only JPEG or PNG images are supported.")

    try:
        raw = await file.read(5_000_001)
        if len(raw) > 5_000_000:
            raise HTTPException(status_code=413, detail="Image exceeds the 5 MB limit.")
        img = Image.open(io.BytesIO(raw))
        if img.format not in {"JPEG", "PNG"}:
            raise HTTPException(status_code=415, detail="Only JPEG or PNG images are supported.")
        if img.width * img.height > 16_000_000:
            raise HTTPException(status_code=413, detail="Image exceeds the 16 megapixel limit.")
        img.load()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        result = await run_in_threadpool(predict, img)
        return PredictionResponse(**result)
    except InferenceBusyError as e:
        raise HTTPException(status_code=503, detail=str(e), headers={"Retry-After": "2"})
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Model not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="The analysis could not be completed.") from e


# =====================================================
# Frontend
# =====================================================
if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(INDEX_FILE)

    @app.get("/{path:path}", include_in_schema=False)
    async def serve_frontend(path: str):
        requested_file = STATIC_DIR / path
        if requested_file.is_file():
            return FileResponse(requested_file)
        return FileResponse(INDEX_FILE)


# =====================================================
# Run directly
# =====================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
