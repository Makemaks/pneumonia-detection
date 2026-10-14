"""Download the pinned FT-004 publication and verify every byte before use."""
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVISION = "7a90abfa3695f61a17e4a2dd959c0da822080b21"
REPOSITORY = "Gerdoo2001/ai-research"
FOLDER = ROOT / "model/artifacts/ft004"


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def main():
    provenance = json.loads((ROOT / "app/ft004/provenance.json").read_text())
    manifest_path = FOLDER / "package_manifest.json"
    if digest(manifest_path) != provenance["package_manifest_sha256"]:
        raise RuntimeError("Package manifest differs from the pinned publication")
    manifest = json.loads(manifest_path.read_text())
    for name, expected in manifest["files"].items():
        if Path(name).name != name:
            raise RuntimeError("Invalid artifact filename")
        destination = FOLDER / name
        # Already verified files are reusable; original checkpoints stay unchanged.
        if destination.is_file() and destination.stat().st_size == expected["size_bytes"] and digest(destination) == expected["sha256"]:
            print(f"Verified {name}", flush=True)
            continue
        host = "media.githubusercontent.com/media" if name.endswith(".pt") else "raw.githubusercontent.com"
        url = f"https://{host}/{REPOSITORY}/{REVISION}/model/artifacts/ft004/{name}"
        pending = destination.with_suffix(destination.suffix + ".download")
        checksum = hashlib.sha256()
        size = 0
        request = urllib.request.Request(url, headers={"User-Agent": "FT004-pinned-package"})
        with urllib.request.urlopen(request, timeout=60) as response, pending.open("wb") as output:
            for block in iter(lambda: response.read(1024 * 1024), b""):
                output.write(block)
                checksum.update(block)
                size += len(block)
        if size != expected["size_bytes"] or checksum.hexdigest() != expected["sha256"]:
            raise RuntimeError(f"Artifact integrity check failed: {name}")
        pending.replace(destination)
        print(f"Downloaded and verified {name}: {size:,} bytes", flush=True)


if __name__ == "__main__":
    main()
