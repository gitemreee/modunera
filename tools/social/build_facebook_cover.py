#!/usr/bin/env python3
"""The Facebook page cover, and the two crops it has to survive.

Facebook does not show one cover, it shows two. On a computer the image is drawn
at 820x312 and the page's profile picture sits over the bottom left of it. On a
phone the same file is drawn at 640x360 — taller and narrower — so roughly an
eighth is cut from each side. A cover designed for the desktop crop loses its
type on a phone; a cover designed to survive both puts everything that matters
inside the overlap.

    file          1702 x 630   (2x of 851x315, the size Facebook accepts)
    desktop       the whole width, minus the avatar at the bottom left
    phone         the middle 1280 px only
    safe for both x from 211 to 1491, and clear of the bottom-left corner

The composition mirrors the website's hero rather than inventing a second look:
photograph on one side, forest-green panel on the other, the two meeting on a
gradient instead of a hard edge.

Writes social/instagram/12-facebook/cover.png and cover-crops.jpg

Usage: python3 tools/social/build_facebook_cover.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/12-facebook"
W, H = 1702, 630

# What each surface actually shows, in this file's coordinates.
PHONE = (211, 0, 1491, H)               # the middle 1280 px
# The profile picture is drawn 170x170 on a desktop page, its centre near the
# cover's bottom edge, about 16 px in from the left of an 820-wide display. At
# this file's scale that is the corner below — nothing legible goes in it.
AVATAR = (0, 428, 400, H)
PANEL = 1020                            # the green panel's right edge, before the fade
FADE = 260                              # how far the photograph dissolves into it
TEXT_X = 260                            # inside the phone crop, right of its left edge

PHOTO = "IMG_20250519_183120.jpg"       # the A-frame in the olive grove, 1.94:1
LOOK = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)


def source() -> Path:
    for d in (g.SELECTED, g.ROOT / "social/instagram/00-candidates"):
        if (d / PHOTO).exists():
            return d / PHOTO
    raise FileNotFoundError(PHOTO)


def build() -> Image.Image:
    im = Image.open(source()).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    src_w, src_h = im.size

    # The photograph fills the whole frame; the panel is laid over its left. A
    # half-width photograph would have to be cropped to 1.3:1 and this frame is
    # 1.94:1 — cropping it that hard is what cost the website's hero its roofline.
    photo = g.cover(im, W, H, 0.52)
    photo = g.grade(photo, **LOOK)
    reduction = max(src_w / W, src_h / H)
    photo = g.sharpen(photo, amount=min(1.20, 0.72 + 0.28 * reduction),
                      micro=min(1.0, 0.55 + 0.28 * reduction))

    # The panel: solid to PANEL, then a ramp to nothing over FADE. Drawn as a mask
    # so the join is a dissolve rather than a seam.
    mask = Image.new("L", (W, 1), 0)
    for x in range(W):
        if x <= PANEL:
            mask.putpixel((x, 0), 255)
        elif x <= PANEL + FADE:
            t = 1 - (x - PANEL) / FADE
            mask.putpixel((x, 0), int(255 * (t ** 1.4)))
    canvas = photo.copy()
    canvas.paste(Image.new("RGB", (W, H), g.MOSS_DEEP), (0, 0), mask.resize((W, H)))

    return canvas


# Where each piece of type goes. Declared once so the drawing and the mask that
# measures the ground under it cannot drift apart — the same arrangement the post
# renderer uses, and for the same reason.
SLOGAN = dict(xy=(TEXT_X, 212), text="DESIGN YOUR NATURE", size=58, colour=g.WHITE)
# Three short lines rather than two long ones. The second of the two ran past the
# panel into the photograph, where white type has nothing to sit on — and it was
# only visible in the phone crop, because on the desktop crop the fade is far
# enough right to look deliberate.
LINES = [(TEXT_X, 306, "Tiny Houses, Modulbau, Stahlbau und Möbel nach Maß."),
         (TEXT_X, 344, "Produziert in der Türkei."),
         (TEXT_X, 380, "Geliefert nach DE · NL · DK · LU · CH.")]
LOGO_XY, LOGO_W = (TEXT_X, 70), 300
RULE = (TEXT_X, 180, TEXT_X + 92, 183)


def line_masks() -> list[tuple[str, Image.Image]]:
    """One mask per line, because one mask for the whole block hides a line.

    The first version measured the block as a unit and passed: the slogan and the
    first line sit on green, so a percentile over all of them stayed dark even
    though the last line had run out onto the photograph. Anything measured as a
    group can be rescued by its majority — which is the same failure as measuring
    a scrim band by its mean, and it has now happened at three different scales in
    this codebase. Measure the smallest thing that can fail on its own.
    """
    out = []
    m = Image.new("L", (W, H), 0)
    g.tracked(ImageDraw.Draw(m), SLOGAN["xy"], SLOGAN["text"],
              g.F_TITLE(SLOGAN["size"]), 255, tracking=-SLOGAN["size"] * 0.021)
    out.append(("slogan", m))
    for i, (x, y, text) in enumerate(LINES):
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).text((x, y), text, font=g.F_BODY(30), fill=255)
        out.append((f"line {i + 1}", m))
    return out


def draw_type(canvas: Image.Image, mask_only: bool = False) -> Image.Image:
    """Put the type on, or return a mask of exactly the pixels it will cover.

    There is no domain line. Facebook already prints the website in the page's own
    field, directly under the cover, and the logo is in the frame — a third copy
    would only be a third copy, and the only place left to put it is the corner the
    profile picture covers.
    """
    target = Image.new("L", (W, H), 0) if mask_only else canvas
    d = ImageDraw.Draw(target)
    ink = 255 if mask_only else None

    if not mask_only:
        logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-white-600.png").convert("RGBA")
        logo = logo.resize((LOGO_W, round(logo.height * LOGO_W / logo.width)), Image.LANCZOS)
        canvas.paste(logo, LOGO_XY, logo)
        d.rectangle(list(RULE), fill=g.CREAM)

    g.tracked(d, SLOGAN["xy"], SLOGAN["text"], g.F_TITLE(SLOGAN["size"]),
              ink or SLOGAN["colour"], tracking=-SLOGAN["size"] * 0.021)
    for x, y, text in LINES:
        d.text((x, y), text, font=g.F_BODY(30), fill=ink or g.ON_MOSS)
    return target


def crops(cover: Image.Image) -> Image.Image:
    """The two surfaces side by side, with the avatar drawn where it lands."""
    desktop = cover.resize((820, 304), Image.LANCZOS)
    dd = ImageDraw.Draw(desktop)
    dd.ellipse([18, 304 - 96, 18 + 112, 304 + 16], fill=(255, 255, 255))
    dd.ellipse([24, 304 - 90, 24 + 100, 304 + 10], fill=g.PAPER)

    phone = cover.crop(PHONE).resize((640, 360), Image.LANCZOS)

    gap, pad = 28, 24
    board = Image.new("RGB", (820 + gap + 640 + pad * 2, 360 + pad * 2 + 34), (255, 255, 255))
    board.paste(desktop, (pad, pad + 34))
    board.paste(phone, (pad + 820 + gap, pad + 34))
    bd = ImageDraw.Draw(board)
    bd.text((pad, pad), "desktop 820x312, avatar over the bottom left",
            font=g.F_BODY(20), fill=g.MUTED)
    bd.text((pad + 820 + gap, pad), "phone 640x360, the middle only",
            font=g.F_BODY(20), fill=g.MUTED)
    return board


def check(bare: Image.Image, mask: Image.Image) -> list[str]:
    """Everything that carries meaning has to survive both crops, stay out from
    under the profile picture, and be readable on what it actually sits on.

    The extents come from the mask rather than from a box drawn around the type by
    hand. A hand-drawn box was the first version of this and it failed twice over:
    it ran 900 px wide for a 620 px slogan, so the measurement reached past the
    green panel into the photograph and reported the sky.
    """
    problems = []
    box = mask.getbbox()
    if box is None:
        return ["no type was drawn"]
    x0, y0, x1, y1 = box
    if x0 < PHONE[0] or x1 > PHONE[2]:
        problems.append(f"type spans x {x0}-{x1}, outside the phone crop {PHONE[0]}-{PHONE[2]}")
    if x0 < AVATAR[2] and y1 > AVATAR[1]:
        problems.append(f"type reaches y {y1}; the profile picture covers from {AVATAR[1]} down")

    for name, m in line_masks():
        v = g.luma_under(bare, m)
        ratio = g.contrast(g.WHITE, (int(v),) * 3)
        if ratio < 4.5:
            b = m.getbbox()
            problems.append(f"{name} measures {ratio:.2f}:1, needs 4.5 "
                            f"(it runs to x={b[2]}, the panel is solid to {PANEL})")
    return problems


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    bare = build()
    mask = draw_type(bare, mask_only=True)
    problems = check(bare, mask)
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)
    cover = draw_type(bare)
    cover.save(OUT / "cover.png", optimize=True)
    crops(cover).save(OUT / "cover-crops.jpg", quality=94, optimize=True)
    print(json.dumps({"file": "social/instagram/12-facebook/cover.png",
                      "px": f"{W}x{H}", "upload_as": "851x315 or this 2x file",
                      "checks": "passed"}))


if __name__ == "__main__":
    main()
