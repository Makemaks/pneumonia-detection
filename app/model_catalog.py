"""Public source identities, independent of loading and user inputs."""

KAGGLE_VERSION = "7a90abfa3695f61a17e4a2dd959c0da822080b21"
DOCTOR_VERSION = "4484aef80293d996944f20a04774ae2ec57a11ffd8272b8c942a72178291e5e2"
CATALOG = {
    "kaggle": {"model": "FT-004", "model_version": KAGGLE_VERSION,
               "label": "Kaggle dataset — original FT-004", "research_use_only": True},
    "doctor": {"model": "DOCTOR-SHARED-701515", "model_version": DOCTOR_VERSION,
               "label": "Doctor-shared dataset — grouped 70/15/15", "research_use_only": True},
}
