#!/usr/bin/env python3
"""The Pinterest profile cover.

The Facebook cover was put here and Pinterest cut it: the two surfaces want
different shapes, and a 2.7:1 file dropped into a wider band loses its right-hand
end — which is where all the type was.

Pinterest accepts 1440x864 and then draws the profile banner much wider and
shorter than that, so the file is uploaded at the full size and designed for the
band. Measured off the account, the visible strip is roughly 3.3:1, which from a
1440x864 file is a centred crop 436 px tall — y 214 to 650. Everything that
carries meaning lives inside that, with margin.

    file     1440 x 864
    band     the centre 1440 x 436, y 214 to 650
    safe     y 260 to 604, x 90 to 1350

Unlike Facebook's, this cover has no paragraph on it. A Pinterest profile prints
the bio directly underneath, and 500 characters of it — repeating the same three
lines above would be the same words twice on one screen.

Writes social/instagram/15-pinterest/cover.jpg and cover-crop.jpg

Usage: python3 tools/social/build_pinterest_cover.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/15-pinterest"
W, H = 1440, 864
BAND = (0, 214, W, 650)                 # what the profile actually shows
SAFE = (90, 260, 1350, 604)

PHOTO = "IMG_20250519_182528.jpg"       # the A-frame across the centre, deck full width
LOOK = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)

PANEL = 720                             # the panel's left edge, before the fade
FADE = 340
TEXT_X = 790
SLOGAN = ["DESIGN YOUR", "NATURE"]
SLOGAN_SIZE = 62
LINE = "Tiny Houses und Modulbau nach Maß"


def source() -> Path:
    for d in (g.SELECTED, g.ROOT / "social/instagram/00-candidates"):
        if (d / PHOTO).exists():
            return d / PHOTO
    raise FileNotFoundError(PHOTO)


def ground() -> Image.Image:
    im = Image.open(source()).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    sw, sh = im.size
    photo = g.grade(g.cover(im, W, H, 0.48), **LOOK)
    reduction = max(sw / W, sh / H)
    photo = g.sharpen(photo, amount=min(1.20, 0.72 + 0.28 * reduction),
                      micro=min(1.0, 0.55 + 0.28 * reduction))

    mask = Image.new("L", (W, 1), 0)
    for x in range(W):
        if x >= PANEL:
            mask.putpixel((x, 0), 255)
        elif x >= PANEL - FADE:
            t = 1 - (PANEL - x) / FADE
            mask.putpixel((x, 0), int(255 * (t ** 1.4)))
    out = photo.copy()
    out.paste(Image.new("RGB", (W, H), g.MOSS_DEEP), (0, 0), mask.resize((W, H)))
    return out


def ink(canvas: Image.Image, mask_only: bool = False) -> Image.Image:
    target = Image.new("L", (W, H), 0) if mask_only else canvas
    d = ImageDraw.Draw(target)
    fill = 255 if mask_only else None

    if not mask_only:
        logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-white-600.png").convert("RGBA")
        lw = 300
        logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
        canvas.paste(logo, (TEXT_X, 268), logo)
        d.rectangle([TEXT_X, 366, TEXT_X + 92, 369], fill=g.CREAM)

    for i, line in enumerate(SLOGAN):
        g.tracked(d, (TEXT_X, 400 + i * 76), line, g.F_TITLE(SLOGAN_SIZE),
                  fill or g.WHITE, tracking=-SLOGAN_SIZE * 0.021)
    d.text((TEXT_X, 566), LINE, font=g.F_BODY(28), fill=fill or g.ON_MOSS)
    return target


def check(bare: Image.Image, mask: Image.Image) -> list[str]:
    problems = []
    for text in SLOGAN + [LINE]:
        gone = g.missing_glyphs(text)
        if gone:
            problems.append(f"no glyph for {' '.join(gone)} in {text!r}")

    box = mask.getbbox()
    if box is None:
        return problems + ["no type was drawn"]
    x0, y0, x1, y1 = box
    if not (SAFE[0] <= x0 and x1 <= SAFE[2] and SAFE[1] <= y0 and y1 <= SAFE[3]):
        problems.append(f"type spans {box}, outside the safe band {SAFE}")

    v = g.luma_under(bare, mask)
    r = g.contrast(g.WHITE, (int(v),) * 3)
    if r < 4.5:
        problems.append(f"type measures {r:.2f}:1 against its ground, needs 4.5")
    return problems


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    bare = ground()
    problems = check(bare, ink(bare, mask_only=True))
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    cover = ink(bare)
    cover.save(OUT / "cover.jpg", quality=94, optimize=True)

    # the band the profile shows, beside the whole file, so the crop is visible
    strip = cover.crop(BAND).resize((900, round(900 * (BAND[3] - BAND[1]) / W)), Image.LANCZOS)
    full = cover.resize((900, round(900 * H / W)), Image.LANCZOS)
    pad, gap = 20, 30
    board = Image.new("RGB", (900 + pad * 2, full.height + gap + strip.height + pad * 2 + 60),
                      (255, 255, 255))
    d = ImageDraw.Draw(board)
    d.text((pad, pad), "the file, 1440x864", font=g.F_BODY(20), fill=g.MUTED)
    board.paste(full, (pad, pad + 28))
    y = pad + 28 + full.height + gap
    d.text((pad, y - 26), "what the profile shows", font=g.F_BODY(20), fill=g.MUTED)
    board.paste(strip, (pad, y))
    board.save(OUT / "cover-crop.jpg", quality=94, optimize=True)

    print(json.dumps({"file": "social/instagram/15-pinterest/cover.jpg",
                      "px": f"{W}x{H}", "checks": "passed"}))


if __name__ == "__main__":
    main()
