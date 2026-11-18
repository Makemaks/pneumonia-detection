"""Serve the frozen FT-004 ensemble using its published inference implementation."""

import hashlib
import gc
import ctypes
import json
import os
import threading
import sys
from pathlib import Path

from PIL import Image
from app.model_catalog import CATALOG

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_VERSION = "7a90abfa3695f61a17e4a2dd959c0da822080b21"
CLASS_ORDER = ("NORMAL", "VIRAL", "BACTERIAL")
SELECTION_PATH = Path(os.environ.get(
    "FT004_SELECTION_PATH", str(BASE_DIR / "model/artifacts/ft004/selection.json")
))
_model = None
_active_source = None
_verified_sources = set()
DOCTOR_SELECTION_PATH = BASE_DIR / "model/artifacts/doctor_shared_grouped_701515/selection.json"
_load_lock = threading.Lock()
_prediction_lock = threading.Lock()


class InferenceBusyError(RuntimeError):
    """The bounded CPU worker is already processing another image."""


class ModelUnavailableError(RuntimeError):
    """The explicitly requested package is unavailable; no fallback is allowed."""


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_package(selection_path: Path = SELECTION_PATH) -> dict:
    """Reject pointer files, modified package metadata and changed member ordering."""
    provenance = json.loads((Path(__file__).parent / "ft004/provenance.json").read_text())
    for name, expected_hash in provenance["files"].items():
        if _sha256(Path(__file__).parent / "ft004" / name) != expected_hash:
            raise RuntimeError(f"FT-004 published inference source changed: {name}")
    manifest_path = selection_path.parent / "package_manifest.json"
    if _sha256(manifest_path) != provenance["package_manifest_sha256"]:
        raise RuntimeError("FT-004 package manifest does not match the pinned publication")
    manifest = json.loads(manifest_path.read_text())
    if _sha256(selection_path) != manifest["files"]["selection.json"]["sha256"]:
        raise RuntimeError("FT-004 selection does not match the frozen published descriptor")
    for name, expected in manifest["files"].items():
        path = selection_path.parent / name
        if not path.is_file():
            raise FileNotFoundError(f"Missing FT-004 artifact: {name}")
        if path.stat().st_size != expected["size_bytes"] or _sha256(path) != expected["sha256"]:
            raise RuntimeError(f"FT-004 artifact integrity check failed: {name}")
    selection = json.loads(selection_path.read_text())
    members = selection.get("members", [])
    if len(members) != 3 or sorted(member["member_order"] for member in members) != [1, 2, 3]:
        raise RuntimeError("FT-004 requires three unique ordered members")
    if selection.get("deployable_seed") != 42 or any(member["seed"] != 42 for member in members):
        raise RuntimeError("FT-004 requires the original frozen seed-42 checkpoints")
    return selection


def release_unused_memory():
    """Return unused glibc arenas after a threaded CPU model switch.

    Freeing Python/Torch references alone can leave prior weight allocations
    in thread-specific malloc arenas. Keep the existing 1 GiB service limit.
    """
    gc.collect()
    if sys.platform.startswith("linux"):
        try:
            trim = ctypes.CDLL(None).malloc_trim
            trim.argtypes = [ctypes.c_size_t]
            trim.restype = ctypes.c_int
            trim(0)
        except (AttributeError, OSError):
            pass


def _create_predictor(model_source):
    import cv2
    import torch

    torch.set_num_threads(1)
    if torch.get_num_interop_threads() != 1:
        torch.set_num_interop_threads(1)
    cv2.setNumThreads(1)
    if model_source == "kaggle":
        verify_package()
        from app.ft004.inference import FT004EnsemblePredictor
        return FT004EnsemblePredictor(SELECTION_PATH, device="cpu")
    from app.doctor.inference import DoctorGroupedEnsemblePredictor
    return DoctorGroupedEnsemblePredictor(DOCTOR_SELECTION_PATH, device="cpu")


def load_model(model_source="kaggle"):
    global _model, _active_source
    if model_source not in CATALOG:
        raise ModelUnavailableError("Unknown model source")
    with _load_lock:
        # Keep only one three-member ensemble resident, even during switching.
        if _model is not None and _active_source not in (None, model_source):
            _model = None
            _active_source = None
            release_unused_memory()
        if _model is None:
            try:
                _model = _create_predictor(model_source)
            except Exception:
                _model = None
                _active_source = None
                _verified_sources.discard(model_source)
                release_unused_memory()
                raise ModelUnavailableError("Requested research model is unavailable") from None
            _active_source = model_source
            _verified_sources.add(model_source)
            release_unused_memory()
            print(f"Verified research model loaded: {model_source}; three DenseNet201 members.")
    return _model


def initialize_models():
    """Verify the doctor package without retaining six networks at startup."""
    load_model("kaggle")
    try:
        from app.doctor.inference import validate_package
        validate_package(DOCTOR_SELECTION_PATH)
        _verified_sources.add("doctor")
    except Exception:
        _verified_sources.discard("doctor")
        print("Doctor-shared research package is unavailable; Kaggle remains available.")


def models_status():
    # Health polling does not acquire the model lock or trigger network loads.
    return {"default": "kaggle", "active_source": _active_source, "models": [
        dict(source=source, available=source in _verified_sources,
             loaded=source == _active_source and _model is not None, **metadata)
        for source, metadata in CATALOG.items()
    ]}


def model_status() -> dict:
    return {
        "status": "ok" if "kaggle" in _verified_sources else "starting",
        "model": "FT-004",
        "model_version": MODEL_VERSION,
        "member_count": 3,
        "class_order": list(CLASS_ORDER),
        "research_use_only": True,
        "default_model_source": "kaggle",
        "active_model_source": _active_source,
    }


def predict(pil_img: Image.Image, model_source="kaggle") -> dict:
    global _model, _active_source
    if not _prediction_lock.acquire(blocking=False):
        raise InferenceBusyError("The analysis service is busy. Please retry in a moment.")
    try:
        if model_source not in CATALOG or model_source not in _verified_sources:
            raise ModelUnavailableError("Requested research model is unavailable")
        try:
            output = load_model(model_source).predict(pil_img)
        except ModelUnavailableError:
            raise
        except Exception:
            _model = None
            _active_source = None
            _verified_sources.discard(model_source)
            release_unused_memory()
            raise
        probabilities = {
            name.upper(): float(score) for name, score in output["class_probabilities"].items()
        }
        return {
            "model": CATALOG[model_source]["model"],
            "model_version": CATALOG[model_source]["model_version"],
            "model_source": model_source,
            "label": output["predicted_class"].upper(),
            "probabilities": probabilities,
            "class_order": list(CLASS_ORDER),
            "member_count": 3,
            "research_use_only": True,
        }
    finally:
        release_unused_memory()
        _prediction_lock.release()
