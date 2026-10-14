"""Serve the frozen FT-004 ensemble using its published inference implementation."""

import hashlib
import json
import os
import threading
from pathlib import Path

from PIL import Image

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_VERSION = "7a90abfa3695f61a17e4a2dd959c0da822080b21"
CLASS_ORDER = ("NORMAL", "VIRAL", "BACTERIAL")
SELECTION_PATH = Path(os.environ.get(
    "FT004_SELECTION_PATH", str(BASE_DIR / "model/artifacts/ft004/selection.json")
))
_model = None
_load_lock = threading.Lock()
_prediction_lock = threading.Lock()


class InferenceBusyError(RuntimeError):
    """The bounded CPU worker is already processing another image."""


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


def load_model():
    global _model
    with _load_lock:
        if _model is None:
            verify_package()
            import cv2
            import torch
            from app.ft004.inference import FT004EnsemblePredictor

            torch.set_num_threads(1)
            if torch.get_num_interop_threads() != 1:
                torch.set_num_interop_threads(1)
            cv2.setNumThreads(1)
            _model = FT004EnsemblePredictor(SELECTION_PATH, device="cpu")
            print(f"FT-004 loaded: three verified seed-42 DenseNet201 members; source {MODEL_VERSION}.")
    return _model


def model_status() -> dict:
    return {
        "status": "ok" if _model is not None else "starting",
        "model": "FT-004",
        "model_version": MODEL_VERSION,
        "member_count": 3,
        "class_order": list(CLASS_ORDER),
        "research_use_only": True,
    }


def predict(pil_img: Image.Image) -> dict:
    if not _prediction_lock.acquire(blocking=False):
        raise InferenceBusyError("The analysis service is busy. Please retry in a moment.")
    try:
        output = load_model().predict(pil_img)
        probabilities = {
            name.upper(): float(score) for name, score in output["class_probabilities"].items()
        }
        return {
            "model": "FT-004",
            "model_version": MODEL_VERSION,
            "label": output["predicted_class"].upper(),
            "probabilities": probabilities,
            "class_order": list(CLASS_ORDER),
            "member_count": 3,
        }
    finally:
        _prediction_lock.release()
