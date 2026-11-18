"""Synthetic contracts only: no patient data or real checkpoint loading."""

import io
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from PIL import Image
from pydantic import ValidationError

from app import inference, main
from app.model_catalog import CATALOG
from app.schemas import PredictionResponse


def result(source):
    return dict(model=CATALOG[source]["model"], model_version=CATALOG[source]["model_version"],
                model_source=source, research_use_only=True, label="NORMAL", member_count=3,
                class_order=["NORMAL", "VIRAL", "BACTERIAL"],
                probabilities={"NORMAL": .6, "VIRAL": .3, "BACTERIAL": .1})


def image_bytes():
    stream = io.BytesIO()
    with Image.new("RGB", (32, 40), (128, 128, 128)) as image:
        image.save(stream, format="PNG")
    return stream.getvalue()


class SelectorTests(unittest.TestCase):
    def setUp(self):
        self.patches = [patch.object(inference, "_model", None),
                        patch.object(inference, "_active_source", None),
                        patch.object(inference, "_verified_sources", {"kaggle", "doctor"})]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)

    def test_both_source_identities_are_accepted_but_cannot_be_mixed(self):
        for source in CATALOG:
            self.assertEqual(PredictionResponse(**result(source)).model_source, source)
            wrong = result(source)
            wrong["model_source"] = "doctor" if source == "kaggle" else "kaggle"
            with self.assertRaises(ValidationError):
                PredictionResponse(**wrong)

    def test_cached_requests_reuse_but_source_switches_replace(self):
        objects = []
        def create(source):
            # The previously cached model must already be evicted here.
            self.assertIsNone(inference._model)
            obj = SimpleNamespace(source=source)
            objects.append(obj)
            return obj
        with patch.object(inference, "_create_predictor", side_effect=create) as factory:
            self.assertIs(inference.load_model("kaggle"), inference.load_model("kaggle"))
            self.assertEqual(inference.load_model("doctor").source, "doctor")
            self.assertEqual(inference.load_model("kaggle").source, "kaggle")
            self.assertEqual(factory.call_count, 3)

    def test_failed_activation_never_substitutes_the_other_model(self):
        with patch.object(inference, "_create_predictor", side_effect=RuntimeError("private path")):
            with self.assertRaises(inference.ModelUnavailableError):
                inference.load_model("doctor")
        self.assertNotIn("doctor", inference._verified_sources)
        self.assertIn("kaggle", inference._verified_sources)
        self.assertIsNone(inference._model)

    def test_health_poll_does_not_reload_or_change_active_model(self):
        with patch.object(inference, "_create_predictor") as factory:
            for _ in range(3):
                self.assertEqual(inference.model_status()["status"], "ok")
                self.assertEqual(inference.models_status()["default"], "kaggle")
            factory.assert_not_called()

    def test_unknown_source_and_unavailable_doctor_do_not_trigger_a_load(self):
        inference._verified_sources.discard("doctor")
        with patch.object(inference, "_create_predictor") as factory:
            for source in ("doctor", "other"):
                with self.assertRaises(inference.ModelUnavailableError):
                    inference.predict(None, source)
            factory.assert_not_called()

    def test_api_routes_default_and_explicit_sources(self):
        with patch.object(main, "initialize_models"), patch.object(main, "predict", side_effect=lambda img, source: result(source)) as predict:
            with TestClient(main.app) as client:
                for source in ("kaggle", "doctor"):
                    response = client.post("/predict", data={"model_source": source}, files={
                        "file": ("synthetic.png", image_bytes(), "image/png")})
                    self.assertEqual(response.status_code, 200, response.text)
                    self.assertEqual(response.json()["model_source"], source)
                default = client.post("/predict", files={"file": ("synthetic.png", image_bytes(), "image/png")})
                self.assertEqual(default.json()["model_source"], "kaggle")
                self.assertEqual(client.post("/predict", data={"model_source": "unknown"}, files={
                    "file": ("synthetic.png", image_bytes(), "image/png")}).status_code, 422)
                self.assertEqual(client.get("/models").headers["cache-control"], "no-store")
                self.assertEqual(predict.call_count, 3)

    def test_api_rejects_wrong_source_outputs_and_safe_failure(self):
        with patch.object(main, "initialize_models"), patch.object(main, "predict", return_value=result("kaggle")):
            with TestClient(main.app) as client:
                response = client.post("/predict", data={"model_source": "doctor"}, files={
                    "file": ("synthetic.png", image_bytes(), "image/png")})
                self.assertEqual(response.status_code, 500)
        with patch.object(main, "initialize_models"), patch.object(main, "predict", side_effect=inference.ModelUnavailableError("private")):
            with TestClient(main.app) as client:
                response = client.post("/predict", data={"model_source": "doctor"}, files={
                    "file": ("synthetic.png", image_bytes(), "image/png")})
                self.assertEqual(response.status_code, 503)
                self.assertNotIn("private", response.text)


if __name__ == "__main__":
    unittest.main()
