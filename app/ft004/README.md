These five Python modules are byte-identical copies of the inference dependencies
from Gerdoo2001/ai-research at 7a90abfa3695f61a17e4a2dd959c0da822080b21:
model/src/multiclass/{__init__,config,models,preprocessing,inference}.py.

provenance.json records each file hash and the pinned package-manifest hash.
The wrapper app/inference.py verifies these before loading trusted checkpoints.
The original training root calculations are preserved; original absolute path
strings are used only for historical configuration hashes. Inference does not
open training manifests, results directories or ImageNet downloads.

Deployment uses the exact seed-42 FT-004 package, CPU PyTorch 2.5.1 and
Torchvision 0.20.1, with original PIL/OpenCV enhancement, fit/crop and normalization.
