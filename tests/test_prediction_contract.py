"""Protect three-class score semantics and fail-closed package loading."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pydantic import ValidationError
from PIL import Image
from app import inference
from app.schemas import PredictionResponse


def valid_response():
    return dict(model="FT-004", model_version=inference.MODEL_VERSION,
                label="NORMAL", probabilities={"NORMAL": .4, "VIRAL": .35, "BACTERIAL": .25},
                class_order=["NORMAL", "VIRAL", "BACTERIAL"], member_count=3)


class PredictionContractTests(unittest.TestCase):
    def test_highest_score_wins_without_binary_threshold(self):
        response = PredictionResponse(**valid_response())
        self.assertEqual(response.label, "NORMAL")
        self.assertLess(response.probabilities.NORMAL, .5)

    def test_tie_uses_original_class_order(self):
        data = valid_response()
        data["probabilities"] = {"NORMAL": .4, "VIRAL": .4, "BACTERIAL": .2}
        self.assertEqual(PredictionResponse(**data).label, "NORMAL")
        data["label"] = "VIRAL"
        with self.assertRaises(ValidationError):
            PredictionResponse(**data)

    def test_invalid_or_contradictory_outputs_are_rejected(self):
        changes = [dict(label="PNEUMONIA"), dict(label="VIRAL"), dict(member_count=1),
                   dict(class_order=["BACTERIAL", "VIRAL", "NORMAL"]),
                   dict(probabilities={"NORMAL": .7, "VIRAL": .35, "BACTERIAL": .25}),
                   dict(probabilities={"NORMAL": float("nan"), "VIRAL": .35, "BACTERIAL": .25}),
                   dict(probabilities={"NORMAL": -1, "VIRAL": 1, "BACTERIAL": 1})]
        for change in changes:
            with self.subTest(change=change), self.assertRaises(ValidationError):
                PredictionResponse(**(valid_response() | change))

    def test_modified_manifest_and_alternate_selection_are_rejected(self):
        original = inference.BASE_DIR / "model/artifacts/ft004"
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            manifest = folder / "package_manifest.json"
            manifest.write_bytes((original / "package_manifest.json").read_bytes() + b" ")
            with self.assertRaisesRegex(RuntimeError, "manifest"):
                inference.verify_package(folder / "selection.json")
            manifest.write_bytes((original / "package_manifest.json").read_bytes())
            alternate = folder / "alternate.json"
            alternate.write_text(json.dumps({"members": []}))
            with self.assertRaisesRegex(RuntimeError, "descriptor"):
                inference.verify_package(alternate)

    def test_busy_worker_is_rejected_and_failure_releases_lock(self):
        with inference._prediction_lock, self.assertRaises(inference.InferenceBusyError):
            inference.predict(Image.new("RGB", (64, 64)))
        class BrokenPredictor:
            def predict(self, image):
                raise ValueError("inference failed")
        with patch.object(inference, "_model", BrokenPredictor()), self.assertRaises(ValueError):
            inference.predict(Image.new("RGB", (64, 64)))
        self.assertTrue(inference._prediction_lock.acquire(blocking=False))
        inference._prediction_lock.release()


if __name__ == "__main__":
    unittest.main()
