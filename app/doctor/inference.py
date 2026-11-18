"""Frozen, research-only inference for the completed grouped doctor-shared study.

No training records, source images, or held-out images are read at inference.
The study's original nondeployment flags remain unchanged in its checkpoints.
This adapter supports the owner's requested public research comparison only;
it does not permit clinical use or establish independent external validation.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.ft004.inference import _sha256, average_member_probabilities
from .preprocessing import ImageTransform

SELECTION_ID = "DOCTOR-SHARED-GROUPED-701515-20261118-ENSEMBLE-S42"
PROTOCOL_HASH = "4484aef80293d996944f20a04774ae2ec57a11ffd8272b8c942a72178291e5e2"
SPLIT_HASH = "701b20b1cd34581b0cd5365217963b27ff9fe7c482c1f8b8b4c48855329dc820"
CLASS_NAMES = ("Normal", "Viral", "Bacterial")
PIPELINES = (
    "pseudo_color_then_histogram_equalization_then_clahe",
    "pseudo_color_then_histogram_equalization",
    "histogram_equalization",
)
EPOCHS = (10, 11, 12)
WEIGHT_HASHES = (
    "c3277178176ece9de363ed80928a987c28e80bc0782fc39b4388e38b3daba365",
    "3e9c64a39249e4cf6c24c14f5c38dce14f00cd72c08f7ee2239a5a6b509c09a8",
    "9ec18784c14c5881f92bc4af8c4a8750b848c1d5f23c1a749e230437382bb4b2",
)
PREPROCESSING_HASH = "b7a270ed0093426785c7bc8a6aba33ec6eaf796e6d399ddbc8a3ac68f8d84046"


def validate_package(selection_path: str | Path) -> tuple[dict, list[Path]]:
    path = Path(selection_path).resolve()
    selection = json.loads(path.read_text(encoding="utf-8"))
    if (
        selection.get("selection_id") != SELECTION_ID
        or selection.get("study") != "doctor_shared_grouped_701515_20261118"
        or selection.get("status") != "frozen_exploratory_research_model"
        or selection.get("protocol_hash") != PROTOCOL_HASH
        or selection.get("split_manifest_sha256") != SPLIT_HASH
        or selection.get("class_order") != list(CLASS_NAMES)
        or selection.get("input_size") != 224
        or selection.get("ensemble_rule") != "equal arithmetic mean"
        or selection.get("research_use_only") is not True
        or selection.get("clinical_use_permitted") is not False
        or selection.get("preprocessing_sha256") != PREPROCESSING_HASH
        or _sha256(Path(__file__).with_name("preprocessing.py")) != PREPROCESSING_HASH
    ):
        raise ValueError("Doctor-shared package identity or preprocessing mismatch")
    members = selection.get("members", [])
    if len(members) != 3:
        raise ValueError("Doctor-shared package requires three frozen members")
    paths = []
    for index, member in enumerate(members):
        filename = f"member_{index + 1}_selected_weights.pt"
        if (
            member.get("order") != index + 1
            or member.get("checkpoint") != filename
            or member.get("pipeline") != PIPELINES[index]
            or member.get("epoch") != EPOCHS[index]
            or member.get("sha256") != WEIGHT_HASHES[index]
        ):
            raise ValueError("Doctor-shared frozen member specification mismatch")
        checkpoint = path.parent / filename
        if not checkpoint.is_file() or _sha256(checkpoint) != WEIGHT_HASHES[index]:
            raise ValueError("Doctor-shared checkpoint missing or checksum mismatch")
        paths.append(checkpoint)
    return selection, paths


class DoctorGroupedEnsemblePredictor:
    def __init__(self, selection_path: str | Path, device: str = "cpu") -> None:
        import torch
        from torchvision.models import densenet201

        self.selection, paths = validate_package(selection_path)
        self.class_names = CLASS_NAMES
        self.device = torch.device(device)
        self.members = []
        for index, path in enumerate(paths):
            checkpoint = torch.load(path, map_location="cpu", weights_only=True, mmap=True)
            if (
                checkpoint.get("protocol_hash") != PROTOCOL_HASH
                or tuple(checkpoint.get("class_order", ())) != CLASS_NAMES
                or checkpoint.get("pipeline") != PIPELINES[index]
                or checkpoint.get("epoch") != EPOCHS[index]
                or checkpoint.get("permitted_for_deployment") is not False
            ):
                raise ValueError("Doctor-shared checkpoint metadata mismatch")
            model = densenet201(weights=None, num_classes=3)
            model.load_state_dict(checkpoint["model_state_dict"], strict=True)
            model.to(self.device).eval()
            self.members.append((model, ImageTransform(PIPELINES[index], 224, training=False)))

    def predict(self, image) -> dict:
        import torch

        vectors = []
        with torch.inference_mode():
            for model, transform in self.members:
                tensor = transform(image).unsqueeze(0).to(self.device)
                probabilities = torch.softmax(model(tensor), dim=1)[0].cpu().tolist()
                vectors.append(dict(zip(CLASS_NAMES, probabilities)))
        probabilities = average_member_probabilities(vectors, CLASS_NAMES)
        predicted = max(probabilities, key=probabilities.__getitem__)
        return {
            "selection_id": SELECTION_ID,
            "predicted_class": predicted,
            "confidence": probabilities[predicted],
            "class_probabilities": probabilities,
            "member_count": 3,
            "research_use_only": True,
        }
