import os
import numpy as np
import cv2
from PIL import Image
from pathlib import Path

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
import tensorflow as tf

# ==============================
# CONFIGURATION
# ==============================
IMG_SIZE = 224

# Compute absolute base directory (repo root)
BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = BASE_DIR / "model" / "outputs" / "binary" / "v2" / "densenet201" / "densenet201_pneumonia.h5"
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    str(DEFAULT_MODEL_PATH),
)

_model = None


# ==============================
# CLAHE ENHANCEMENT
# ==============================
def apply_clahe(np_img: np.ndarray) -> np.ndarray:
    """Apply CLAHE to improve local contrast before prediction."""
    # Convert RGB to LAB color space
    lab = cv2.cvtColor(np_img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)

    # Apply CLAHE to the L-channel (brightness)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)

    # Merge back and convert to RGB
    merged = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)
    return enhanced


# ==============================
# MODEL LOADING
# ==============================
def load_model():
    """Load DenseNet121 model (cached after first call)."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
        print(f"Loading model from {MODEL_PATH} ...")
        _model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("Model loaded successfully.")
    return _model


# ==============================
# PREPROCESS IMAGE
# ==============================
def preprocess_image(pil_img: Image.Image) -> np.ndarray:
    """
    Convert PIL image → NumPy RGB → apply CLAHE → resize → normalize.
    """
    # Convert to RGB NumPy
    img = np.array(pil_img.convert("RGB"))

    # Apply CLAHE enhancement
    img = apply_clahe(img)

    # Resize to model input
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))

    # Normalize [0,1]
    x = img.astype("float32") / 255.0

    # Add batch dimension
    x = np.expand_dims(x, axis=0)
    return x


# ==============================
# PREDICT FUNCTION
# ==============================
def predict(pil_img: Image.Image, threshold: float = 0.5):
    """Predict pneumonia from chest X-ray."""
    model = load_model()
    x = preprocess_image(pil_img)
    prob = float(model.predict(x, verbose=0)[0][0])
    label = "PNEUMONIA" if prob >= threshold else "NORMAL"

    result = {
        "label": label,
        "probability": prob,
        "threshold": threshold,
    }

    # Print result in the terminal for debugging and monitoring.
    print("\n==============================")
    print("AI Lung Analyzer Prediction Result")
    print("==============================")
    print(f"Label: {label}")
    print(f"Probability: {prob:.4f}")
    print(f"Threshold: {threshold}")
    print("==============================\n")

    return result
