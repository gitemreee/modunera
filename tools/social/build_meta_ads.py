#!/usr/bin/env python3
"""Meta (Facebook/Instagram) ad creatives — three variants, three placements.

The paid-ad pattern is build_ad_nature.py's: photograph above, forest band
below, type on the band so nothing has to be forced legible over a sky. This
module keeps that pattern and adds what a campaign needs that a single post did
not: more than one message to test, and every placement Meta asks for.

Variants (one photograph, one message each):
  A  natur   — the owner's offer with the price, as he asked for it
  B  abend   — same offer without a price; the evening photograph, delivery line
  C  innen   — the interior; what is inside, no figures

Placements: 1:1 1080x1080 (feed), 4:5 1080x1350 (feed, more height on phones),
9:16 1080x1920 (stories / reels, with 250 px top and 260 px bottom kept clear of
the interface).

The figures in variant A are the owner's and build_ad_nature.py's docstring
records that they are not the site's. Nothing here changes that.

Writes social/meta-ads/<variant>/{1x1,4x5,9x16}.jpg and manifest.json

Usage: python3 tools/social/build_meta_ads.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g       # noqa: E402
import build_ad_nature as a            # noqa: E402

OUT = g.ROOT / "social/meta-ads"
IG = g.ROOT / "social/instagram"

VARIANTS = {
    "a-natur": dict(
        photo=IG / "16-drive-2026-08/f1b98089-4ffb-4c23-a654-d831609455ac.JPG",
        head=["DEIN PLATZ", "IN DER NATUR."], price="39.500 €",
        sub=["7-Meter-Modell", "Lieferung nach Deutschland in 15 Tagen"],
        focus=0.46, look=a.LOOK),
    "b-abend": dict(
        photo=IG / "01-selected/IMG_20250913_193621.jpg",
        head=["ANKOMMEN.", "ABSCHALTEN."], price="",
        sub=["Komplett ausgestattet ab Werk", "Lieferung nach Deutschland"],
        focus=0.5, look=dict(warmth=1.0, lift=0.03, contrast=1.12, saturation=1.0)),
    "c-innen": dict(
        photo=IG / "17-drive-2026-08-21/fb8b030f-1c7a-42e8-b2c1-7c8c4b5de23e.JPG",
        head=["KLEIN GEBAUT.", "GROSS GEDACHT."], price="",
        sub=["Loft, Küche, Bad – fertig ausgebaut", "Acht Modelle, 2,55 m breit"],
        focus=0.5, look=dict(warmth=1.02, lift=0.02, contrast=1.1, saturation=0.98)),
}

PLACEMENTS = {
    # name: (W, H, margin, safe_top, safe_bottom, split, head, price, sub, logo_w)
    "1x1":  (1080, 1080, 56, 56, 56, 560, 58, 96, 30, 250),
    "4x5":  (1080, 1350, 56, 56, 56, 742, 74, 118, 34, 270),
    "9x16": (1080, 1920, 66, 250, 260, 1090, 86, 138, 38, 300),
}


def build(v: dict, W, H, margin, safe_top, safe_bottom, split, head_size, price_size, sub_size, logo_w):
    canvas = Image.new("RGB", (W, H), g.MOSS_DEEP)
    im = Image.open(v["photo"]).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    photo = g.sharpen(g.grade(g.cover(im, W, split, v["focus"]), **v["look"]))
    canvas.paste(photo, (0, 0))
    d = ImageDraw.Draw(canvas)

    logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-white-600.png").convert("RGBA")
    logo = logo.resize((logo_w, round(logo.height * logo_w / logo.width)), Image.LANCZOS)
    head = canvas.crop((0, 0, W, split))
    probe = g._luma_bright(head, (margin, safe_top, margin + logo_w, safe_top + logo.height))
    if g.contrast(g.WHITE, (int(probe),) * 3) < 4.6:
        grad = Image.new("L", (1, split))
        for y in range(split):
            grad.putpixel((0, y), round(150 * max(0.0, 1 - y / (split * 0.45))))
        head = Image.composite(Image.new("RGB", head.size, (10, 18, 14)), head, grad.resize(head.size))
        canvas.paste(head, (0, 0))
    canvas.paste(logo, (margin, safe_top), logo)

    # the square has the least band: with a price on it the two sub lines
    # become one, so the domain keeps its own row instead of landing on them
    sub = v["sub"] if not (v["price"] and H <= W) else [" · ".join(v["sub"])]
    y = split + 50
    y = a.lines(d, v["head"], y, g.F_TITLE(head_size), g.WHITE, margin)
    y += 14
    if v["price"]:
        d.text((margin, y), v["price"], font=g.F_TITLE(price_size), fill=a.SAND)
        b = d.textbbox((0, 0), v["price"], font=g.F_TITLE(price_size))
        y += round((b[3] - b[1]) * 1.06) + 50
    else:
        y += 10
    y = a.lines(d, sub, y, g.F_BODY(sub_size), g.CREAM, margin)
    dom_y = H - safe_bottom - sub_size - 6
    assert y <= dom_y, f"band overflow in {W}x{H}: text ends at {y}, domain row at {dom_y}"
    d.text((margin, dom_y), a.DOMAIN, font=g.F_BODY(sub_size), fill=g.CREAM)
    return canvas, {"headline_on_band": round(g.contrast(g.WHITE, g.MOSS_DEEP), 2),
                    "price_on_band": round(g.contrast(a.SAND, g.MOSS_DEEP), 2),
                    "sub_on_band": round(g.contrast(g.CREAM, g.MOSS_DEEP), 2)}


def main() -> None:
    manifest = {}
    for name, v in VARIANTS.items():
        out = OUT / name
        out.mkdir(parents=True, exist_ok=True)
        manifest[name] = {"photograph": v["photo"].name, "copy": {"headline": v["head"], "price": v["price"], "sub": v["sub"]}, "placements": {}}
        for pl, spec in PLACEMENTS.items():
            im, ratios = build(v, *spec)
            im.save(out / f"{pl}.jpg", quality=92, optimize=True)
            manifest[name]["placements"][pl] = {"size": f"{spec[0]}x{spec[1]}", **ratios}
    (OUT / "manifest.json").write_text(json.dumps({
        "set": "Meta ads — three variants, three placements",
        "figures_source": "variant A: owner — see build_ad_nature.py docstring; B and C carry no figures",
        "variants": manifest}, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(json.dumps({k: list(v["placements"]) for k, v in manifest.items()}))


if __name__ == "__main__":
    main()
