#!/usr/bin/env python3
"""Large stills for /tiny-house-leben/.

The site photographs in assets/images/photos/ stop at 1,100–1,200 px because no
template drew them wider. The landing page shows a few of them full-bleed, and
on a phone it shows them as a tall portrait frame, so those need their own
crops. This reuses the grading and sharpening of ingest_site_photos.py — same
source frames, same look — and only adds the sizes.

Usage: python3.13 tools/social/build_leben_stills.py
"""
import json
from pathlib import Path

import ingest_site_photos as base

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/leben/img"
# Full-bleed frames are large; a slightly lower quality than the site set keeps
# each under about 350 KB without visible loss at these sizes.
base.QUALITY = 68

# name -> list of (suffix, (w, h), focus override or None)
STILLS = {
    "aframe-lawn": [("wide", (1600, 900), None), ("tall", (860, 1290), 0.5)],
    "aframe-night": [("wide", (1600, 900), None), ("tall", (860, 1290), 0.52)],
    "aframe-deck-olive": [("wide", (1600, 900), None)],
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    report = []
    for name, sizes in STILLS.items():
        src, _category, look, focus, _alt = base.PLAN[name]
        im, lk = base.prepared(base.find(src), look)
        for suffix, target, f in sizes:
            dest = OUT / f"{name}-{suffix}.webp"
            kb = round(base.export(im, im.size, target, focus if f is None else f, lk, dest) / 1024)
            report.append({"file": str(dest.relative_to(ROOT)), "px": f"{target[0]}x{target[1]}", "kb": kb})
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
