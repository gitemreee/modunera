#!/usr/bin/env python3
"""Prepares the real project photographs for the website.

The site has been running on renders. Renders are legitimate — they are the
company's own and the eight models exist as designs — but a manufacturer whose
every picture is a render reads as a catalogue rather than as a workshop, and the
audit lists real photography as a publish blocker for exactly that reason.

This takes the photographs already copied into social/instagram/ and produces the
webp derivatives the site's templates expect. It does not touch the originals and
it does not delete a render: the renders stay as the model illustrations they
honestly are, and the photographs take the places where a reader is entitled to
see the real thing — the hero, production, and delivery.

The same treatment the Instagram grid uses is applied here, for one reason: a
visitor who sees a photograph on the feed and the same photograph on the site
should not see two different gradings of it.

Usage: python3 tools/social/ingest_site_photos.py
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_instagram_grid import (  # noqa: E402  reuse, do not re-implement
    cover, grade, sharpen, strip_camera_watermark,
)

ROOT = Path(__file__).resolve().parents[2]
SRC = [ROOT / "social/instagram/01-selected", ROOT / "social/instagram/00-candidates"]
OUT = ROOT / "assets/images/photos"

L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_INT = dict(warmth=1.02, lift=0.04, contrast=1.15, saturation=0.92)
L_NIGHT = dict(warmth=1.04, lift=0.06, contrast=1.10, saturation=0.98)

# name -> (source, category, alt text, grade, focus)
# Alt text is written here rather than generated: it is read aloud to people using
# a screen reader and "tiny house photo 3" helps nobody.
PLAN = {
    "aframe-deck-olive": (
        "IMG_20250519_182528.jpg", "finished", L_EXT, 0.5,
        "Fertiges MODUNERA Tiny House mit A-Frame-Front und umlaufender Holzterrasse unter Olivenbäumen"),
    "aframe-lawn": (
        "IMG_20250525_142713.jpg", "finished", L_EXT, 0.42,
        "Tiny House mit A-Frame-Giebel und Holzfassade auf einer Rasenfläche, seitliche Ansicht"),
    "aframe-night": (
        "IMG_20250913_193621.jpg", "finished", L_NIGHT, 0.45,
        "Beleuchtetes Tiny House am Abend, warmes Licht hinter der Glasfront und Gartenbeleuchtung"),
    "aframe-olive-grove": (
        "IMG_20250519_183120.jpg", "finished", L_EXT, 0.5,
        "Tiny House im Olivenhain, Frontansicht mit Terrasse und Zugangsstufen"),
    "interior-kitchen-desk": (
        "IMG_20250807_131955.jpg", "interior", L_INT, 0.42,
        "Innenraum eines Tiny House mit Küchenzeile, Esstisch am Fenster und Sitzbereich"),
    "interior-loft-stair": (
        "20240227_113020.jpg", "interior", L_INT, 0.66,
        "Wohnbereich mit Sofa und Treppe mit integrierten Schubladen zum Schlafloft"),
    "interior-wood": (
        "20250126_192414.jpg", "interior", L_INT, 0.5,
        "Innenausbau mit Holzoberflächen, indirekter Beleuchtung und Einbauküche"),
    "interior-stair-white": (
        "IMG_20250724_101400.jpg", "interior", L_INT, 0.5,
        "Heller Innenraum mit weißer Treppe, Stauraum unter den Stufen und Küchenzeile"),
    "production-cladding": (
        "20231214_121220.jpg", "production", dict(warmth=0.99, lift=0.05, contrast=1.20, saturation=0.88), 0.4,
        "Tiny House in der Fertigung: Holzfassade montiert, Fenster eingesetzt, Modul auf dem Fahrgestell"),
    "production-frame-and-finish": (
        "IMG_20250913_183727.jpg", "production", L_EXT, 0.5,
        "Stahlrahmen im Vordergrund, fertiggestelltes Tiny House dahinter auf dem Werksgelände"),
    "delivery-trailer": (
        "IMG_20250913_104632.jpg", "delivery", L_EXT, 0.52,
        "Tiny House auf dem Tieflader vor der Fertigung, bereit für den Transport"),
}

# The sizes the site's templates ask for. Hero stills carry a portrait crop as
# well, because a landscape frame in a tall phone box loses two thirds of itself.
WIDE = [(1400, 788), (760, 428)]
PORTRAIT = (760, 1013)
GALLERY = [(1200, 800), (760, 507)]


# Kept in step with HERO_SLIDES in tools/build-modunera-v2.mjs.
HERO_NAMES = {"aframe-deck-olive", "aframe-lawn", "aframe-olive-grove",
              "production-frame-and-finish", "aframe-night"}


def find(name: str) -> Path:
    for d in SRC:
        p = d / name
        if p.exists():
            return p
    raise FileNotFoundError(name)


def prepared(path: Path, look: dict) -> Image.Image:
    im = Image.open(path).convert("RGB")
    im, _ = strip_camera_watermark(im)
    return im, dict(look)


def export(im: Image.Image, src_size, target, focus: float, look: dict, dest: Path) -> int:
    w, h = target
    out = cover(im, w, h, focus)
    out = grade(out, **look)
    reduction = max(src_size[0] / w, src_size[1] / h)
    out = sharpen(out, amount=min(1.20, 0.72 + 0.28 * reduction),
                  micro=min(1.0, 0.55 + 0.28 * reduction))
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "WEBP", quality=82, method=6)
    return dest.stat().st_size


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest, total = [], 0
    for name, (src, category, look, focus, alt) in PLAN.items():
        path = find(src)
        im, lk = prepared(path, look)
        entry = {"name": name, "category": category, "source": src, "alt_de": alt, "files": []}
        # Hero membership decides the size set, not the category: the hero needs
        # 1400 and a portrait crop, and one production frame earns a place there.
        sizes = WIDE + [PORTRAIT] if name in HERO_NAMES else GALLERY
        for w, h in sizes:
            suffix = "portrait" if (w, h) == PORTRAIT else str(w)
            dest = OUT / f"{name}-{suffix}.webp"
            size = export(im, im.size, (w, h), focus, lk, dest)
            total += size
            entry["files"].append({"file": str(dest.relative_to(ROOT)), "px": f"{w}x{h}",
                                   "kb": round(size / 1024)})
        manifest.append(entry)

    (ROOT / "data/site-photos.json").write_text(
        json.dumps({"_comment": "Real project photographs prepared by "
                                "tools/social/ingest_site_photos.py. Alt text is written by hand, "
                                "per photograph, because it is read aloud.",
                    "photos": manifest}, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(json.dumps({"photographs": len(manifest),
                      "files_written": sum(len(e["files"]) for e in manifest),
                      "total_kb": round(total / 1024),
                      "manifest": "data/site-photos.json"}))


if __name__ == "__main__":
    main()
