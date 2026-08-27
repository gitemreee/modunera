#!/usr/bin/env python3
"""Responsive derivatives for the heavy gallery originals.

The home page's eight-model grid pulled the full-resolution gallery files —
mc1-exterior.webp alone is 441 KB — into cards the layout renders at ~700 px.
Measured at load, the page transferred 3.26 MB of images on desktop. These
files were the bulk of it, and they had no smaller siblings to offer a srcset.

This writes a -900 sibling (and keeps the original as the 2x candidate) for the
gallery files the grids actually use. Idempotent: an existing sibling that is
newer than its source is left alone. Originals are never touched — the rule the
whole photo pipeline runs on.

Usage: python3 tools/make_image_derivatives.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GALLERY = ROOT / "assets/images/gallery"

# the files the model grids and big home sections actually reference
NAMES = [f"mc{n}-{kind}" for n in range(1, 9) for kind in ("exterior",)] + [
    "mc1-living", "mc2-kitchen", "mc2-living", "mc3-living", "mc4-bedroom",
    "mc5-interior", "mc6-living", "mc6-bedroom", "mc7-interior", "mc8-interior",
    "mc8-angle", "interior-feature", "nature-pool", "hero-forest",
]

made = skipped = 0
for name in NAMES:
    src = GALLERY / f"{name}.webp"
    if not src.exists():
        continue
    out = GALLERY / f"{name}-900.webp"
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
        skipped += 1
        continue
    im = Image.open(src)
    if im.width <= 900:
        skipped += 1
        continue
    ratio = 900 / im.width
    im = im.resize((900, round(im.height * ratio)), Image.LANCZOS)
    im.save(out, "WEBP", quality=82, method=6)
    made += 1

print({"made": made, "skipped": skipped})
