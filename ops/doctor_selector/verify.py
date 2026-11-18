"""Integration checks on an artificial PNG only, never a patient/test image."""
import io
import json
import math
import sys
import time
import urllib.error
import urllib.request
import uuid
from PIL import Image

CATALOG = {
    "kaggle": ("FT-004", "7a90abfa3695f61a17e4a2dd959c0da822080b21"),
    "doctor": ("DOCTOR-SHARED-701515", "4484aef80293d996944f20a04774ae2ec57a11ffd8272b8c942a72178291e5e2"),
}
CLASSES = ["NORMAL", "VIRAL", "BACTERIAL"]


def check(result, source):
    assert (result["model"], result["model_version"]) == CATALOG[source], result
    assert result["model_source"] == source and result["research_use_only"] is True, result
    assert result["member_count"] == 3 and result["class_order"] == CLASSES, result
    probabilities = result["probabilities"]
    assert set(probabilities) == set(CLASSES), result
    assert all(math.isfinite(p) and 0 <= p <= 1 for p in probabilities.values()), result
    assert abs(sum(probabilities.values()) - 1) < 1e-5, result
    assert result["label"] == max(CLASSES, key=probabilities.__getitem__), result


def post(base, source, png):
    boundary = "pulmo-check-" + uuid.uuid4().hex
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="model_source"\r\n\r\n{source}\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="artificial-smoke.png"\r\n'
            'Content-Type: image/png\r\n\r\n').encode() + png + f"\r\n--{boundary}--\r\n".encode()
    request = urllib.request.Request(base + "/predict", data=body,
                                    headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
    with urllib.request.urlopen(request, timeout=150) as response:
        return json.load(response)


def main():
    image = Image.new("RGB", (128, 160), (128, 128, 128))
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    records = []
    if "--model" in sys.argv:
        import numpy as np
        import torch
        from app import inference
        from app.schemas import PredictionResponse
        inference.initialize_models()
        assert {row["source"] for row in inference.models_status()["models"] if row["available"]} == set(CATALOG)
        for source in ("kaggle", "doctor", "kaggle"):
            start = time.monotonic()
            result = inference.predict(image, source)
            check(result, source)
            PredictionResponse(**result)
            if source == "doctor":
                vectors = []
                # Independently repeat the training evaluator's selected-weight
                # FP32 transform/forward/softmax/mean rule on loaded networks.
                with torch.no_grad():
                    for model, transform in inference._model.members:
                        vectors.append(torch.softmax(model(transform(image).unsqueeze(0)), dim=1)[0].tolist())
                expected = dict(zip(CLASSES, np.asarray(vectors, dtype=float).mean(axis=0)))
            else:
                reference = inference._model.predict(image)
                expected = {name.upper(): score for name, score in reference["class_probabilities"].items()}
            delta = max(abs(result["probabilities"][name] - expected[name]) for name in CLASSES)
            assert delta <= 1e-7, delta
            status = inference.models_status()
            assert [r["source"] for r in status["models"] if r["loaded"]] == [source]
            records.append({"source": source, "probability_delta": delta,
                            "elapsed_seconds": time.monotonic() - start, "resident_ensembles": 1})
        try:
            import resource
            peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
        except ImportError:
            peak = None
        print(json.dumps({"verified": True, "checks": records, "peak_rss_mib": peak,
                          "input": "artificial uniform PNG only", "accuracy_measurement": False}))
        return
    base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    with urllib.request.urlopen(base + "/models", timeout=10) as response:
        models = json.load(response)
    assert models["default"] == "kaggle"
    assert {row["source"] for row in models["models"] if row["available"]} == set(CATALOG), models
    for source in ("kaggle", "doctor", "kaggle"):
        start = time.monotonic()
        result = post(base, source, stream.getvalue())
        check(result, source)
        with urllib.request.urlopen(base + "/models", timeout=10) as response:
            state = json.load(response)
        assert [r["source"] for r in state["models"] if r["loaded"]] == [source], state
        records.append({"source": source, "elapsed_seconds": time.monotonic() - start, "result": result})
    try:
        post(base, "invalid-source", stream.getvalue())
        raise AssertionError("Unknown model source was not rejected")
    except urllib.error.HTTPError as error:
        assert error.code == 422, error.code
    print(json.dumps({"verified": True, "input": "artificial uniform PNG only",
                      "accuracy_measurement": False, "checks": records}))


if __name__ == "__main__":
    main()
