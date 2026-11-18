"""Deployment probes respect legitimate backpressure without hiding failures."""
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location("deployment_probe", Path(__file__).resolve().parents[1] / "ops/doctor_selector/verify.py")
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class ProbeTests(unittest.TestCase):
    def test_explicit_busy_response_is_retried(self):
        busy = HTTPError("http://example.test/predict", 503, "busy", {"Retry-After": "2"}, None)
        with patch.object(probe.urllib.request, "urlopen", side_effect=[busy, io.BytesIO(json.dumps({"ok": True}).encode())]) as request, patch.object(probe.time, "sleep") as sleep:
            self.assertEqual(probe.post("http://example.test", "kaggle", b"synthetic"), {"ok": True})
            self.assertEqual(request.call_count, 2)
            sleep.assert_called_once_with(2.0)

    def test_unavailable_model_or_other_error_is_not_hidden(self):
        for code in (503, 500, 422):
            error = HTTPError("http://example.test/predict", code, "failure", {}, None)
            with patch.object(probe.urllib.request, "urlopen", side_effect=error), patch.object(probe.time, "sleep") as sleep:
                with self.assertRaises(HTTPError):
                    probe.post("http://example.test", "doctor", b"synthetic")
                sleep.assert_not_called()

    def test_busy_retry_count_is_bounded(self):
        error = HTTPError("http://example.test/predict", 503, "busy", {"Retry-After": "2"}, None)
        with patch.object(probe.urllib.request, "urlopen", side_effect=error) as request, patch.object(probe.time, "sleep"):
            with self.assertRaises(HTTPError):
                probe.post("http://example.test", "doctor", b"synthetic")
            self.assertEqual(request.call_count, 12)
