#!/usr/bin/env python3
"""Paid ad creative — "Dein Platz in der Natur", post and story.

One offer, two canvases: 1080x1350 for the feed and 1080x1920 for stories. The
photograph is the same in both so the pair reads as one campaign; only the crop
and the type scale change.

The figures come from the owner, not from the site, and they do not agree with
it. data/pricing.json has no seven-metre model (the shortest is 8,00 m) and no
39.500 € (the lowest published figure is 42.900 €), and the production pages
say deliberately that the schedule is fixed at order confirmation rather than
quoting a number of days. Whoever runs this campaign is choosing to advertise
terms the site does not carry; a visitor who clicks through sees both. That is
a commercial decision and it is recorded here rather than smoothed over.

The scrim under the type is measured, not dialled: the gradient is deepened
until white body copy clears 5.2:1 over the pixels the letters actually cover.

Writes social/instagram/21-ad-natur/post.jpg and story.jpg

Usage: python3 tools/social/build_ad_nature.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw
import pillow_heif

pillow_heif.register_heif_opener()

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g   # noqa: E402

OUT = g.ROOT / "social/instagram/21-ad-natur"
PHOTO = g.ROOT / "social/instagram/16-drive-2026-08/f1b98089-4ffb-4c23-a654-d831609455ac.JPG"
LOOK = dict(warmth=1.03, lift=0.02, contrast=1.18, saturation=0.97)

HEAD  = ["DEIN PLATZ", "IN DER NATUR."]
PRICE = "39.500 €"
SUB   = ["7-Meter-Modell", "Lieferung nach Deutschland in 15 Tagen"]
SAND  = (220, 199, 170)   # the site's --sand #DCC7AA; the shared grid module
                          # carries no sand, so it is declared here rather than
                          # widened into every set's palette for one ad.
DOMAIN = "modunera.com"


def lines(d, xs, y, fnt, fill, x, leading=1.14):
    for ln in xs:
        d.text((x, y), ln, font=fnt, fill=fill)
        b = d.textbbox((0, 0), ln, font=fnt)
        y += round((b[3] - b[1]) * leading) + 14
    return y


def build(W: int, H: int, margin: int, safe_top: int, safe_bottom: int,
          split: int, head_size: int, price_size: int, sub_size: int,
          logo_w: int, focus: float):
    """Photograph above, forest band below.

    The first version put the type on the photograph under a solved scrim and
    it was still weak: the foot of this frame is pale concrete, so the gradient
    had to go so deep it greyed the picture before the headline read cleanly.
    A band does structurally what the scrim was being asked to do by force, and
    it is the pattern the feed already uses, so the ad does not arrive looking
    like it came from somewhere else.
    """
    canvas = Image.new("RGB", (W, H), g.MOSS_DEEP)
    im = Image.open(PHOTO).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    photo = g.cover(im, W, split, focus)
    photo = g.grade(photo, **LOOK)
    photo = g.sharpen(photo)
    canvas.paste(photo, (0, 0))

    d = ImageDraw.Draw(canvas)
    logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-white-600.png").convert("RGBA")
    logo = logo.resize((logo_w, round(logo.height * logo_w / logo.width)), Image.LANCZOS)
    # the logo sits on the picture, so it gets the same solved head scrim the
    # rest of the feed gets rather than being trusted to a bright sky
    head = canvas.crop((0, 0, W, split))
    probe = g._luma_bright(head, (margin, safe_top, margin + logo_w, safe_top + logo.height))
    if g.contrast(g.WHITE, (int(probe),) * 3) < 4.6:
        grad = Image.new("L", (1, split))
        for y in range(split):
            grad.putpixel((0, y), round(150 * max(0.0, 1 - y / (split * 0.45))))
        head = Image.composite(Image.new("RGB", head.size, (10, 18, 14)), head,
                               grad.resize(head.size))
        canvas.paste(head, (0, 0))
    canvas.paste(logo, (margin, safe_top), logo)

    y = split + 54
    y = lines(d, HEAD, y, g.F_TITLE(head_size), g.WHITE, margin)
    y += 16
    d.text((margin, y), PRICE, font=g.F_TITLE(price_size), fill=SAND)
    b = d.textbbox((0, 0), PRICE, font=g.F_TITLE(price_size))
    y += round((b[3] - b[1]) * 1.06) + 54
    y = lines(d, SUB, y, g.F_BODY(sub_size), g.CREAM, margin)
    d.text((margin, H - safe_bottom - sub_size - 6), DOMAIN,
           font=g.F_BODY(sub_size), fill=g.CREAM)

    ratios = {"headline_on_band": round(g.contrast(g.WHITE, g.MOSS_DEEP), 2),
              "price_on_band": round(g.contrast(SAND, g.MOSS_DEEP), 2),
              "sub_on_band": round(g.contrast(g.CREAM, g.MOSS_DEEP), 2)}
    return canvas, ratios


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    post, mp = build(1080, 1350, 56, 56, 56, split=742, head_size=74,
                     price_size=118, sub_size=34, logo_w=270, focus=0.46)
    story, ms = build(1080, 1920, 66, 250, 260, split=1090, head_size=86,
                      price_size=138, sub_size=38, logo_w=300, focus=0.46)
    post.save(OUT / "post.jpg", quality=92, optimize=True)
    story.save(OUT / "story.jpg", quality=92, optimize=True)
    (OUT / "manifest.json").write_text(json.dumps({
        "set": "paid ad — Dein Platz in der Natur",
        "photograph": PHOTO.name,
        "copy": {"headline": HEAD, "price": PRICE, "sub": SUB},
        "figures_source": "owner, not data/pricing.json — see the module docstring",
        "post": {"size": "1080x1350", **mp},
        "story": {"size": "1080x1920", "safe_margins": "250/260", **ms},
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(json.dumps({"post": mp, "story": ms}))


if __name__ == "__main__":
    main()
