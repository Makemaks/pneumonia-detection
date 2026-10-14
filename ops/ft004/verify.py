"""FT-004 deployment execution checks using a generated image only."""
import io
import json
import math
import resource
import sys
import time
import urllib.error
import urllib.request
import uuid
from PIL import Image

VERSION = "7a90abfa3695f61a17e4a2dd959c0da822080b21"
CLASSES = ["NORMAL", "VIRAL", "BACTERIAL"]


def check(result):
    assert result["model"] == "FT-004", result
    assert result["model_version"] == VERSION, result
    assert result["member_count"] == 3 and result["class_order"] == CLASSES, result
    probabilities = result["probabilities"]
    assert set(probabilities) == set(CLASSES), result
    assert all(math.isfinite(p) and 0 <= p <= 1 for p in probabilities.values()), result
    assert abs(sum(probabilities.values()) - 1) < 1e-5, result
    assert result["label"] == max(CLASSES, key=probabilities.__getitem__), result
    assert "threshold" not in result, result


image = Image.new("RGB", (256, 320), (128, 128, 128))
if "--model" in sys.argv:
    from app.inference import load_model, predict
    from app.schemas import PredictionResponse
    started = time.monotonic()
    model = load_model()
    result = predict(image)
    check(result)
    PredictionResponse(**result)
    reference = model.predict(image)
    assert all(abs(result["probabilities"][name.upper()] - score) <= 1e-8
               for name, score in reference["class_probabilities"].items())
    print(json.dumps({"load_and_reference_checks_seconds": time.monotonic() - started,
                      "reference_probability_match": True, "peak_process_rss_mib": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, "synthetic_prediction": result}))
    sys.exit(0)

base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
with urllib.request.urlopen(base + "/health", timeout=10) as response:
    health = json.load(response)
    assert health["status"] == "ok" and health["model"] == "FT-004", health
    assert health["model_version"] == VERSION and health["member_count"] == 3, health
png = io.BytesIO()
image.save(png, format="PNG")
boundary = "ft004-smoke-" + uuid.uuid4().hex
body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"synthetic-smoke.png\"\r\nContent-Type: image/png\r\n\r\n").encode()
body += png.getvalue() + f"\r\n--{boundary}--\r\n".encode()
started = time.monotonic()
request = urllib.request.Request(base + "/predict", data=body, headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
with urllib.request.urlopen(request, timeout=120) as response:
    result = json.load(response)
    check(result)
print(json.dumps({"health": health, "api_prediction_seconds": time.monotonic() - started,
                  "synthetic_prediction": result, "execution_check_only": True}))
