#!/usr/bin/env python3
"""Builds the twelve-post MODUNERA profile grid from the selected photographs.

Reads   social/instagram/01-selected/*.jpg      (copies; the originals are untouched)
Writes  social/instagram/03-grid-preview/       the 3x4 profile preview
        social/instagram/04-post-drafts/        one low-resolution draft per post

Three things this does that a hand layout forgets:

  * It strips the camera's own watermark. Four of the eight photographs were shot
    on a phone that burns a "vivo X200 Pro | ZEISS" strip with exposure data into
    the bottom of the frame. Cropping it is not retouching the photograph, it is
    removing another company's branding from ours. The strip is detected rather
    than assumed, by finding the run of rows at the foot of the image that are
    both bright and colourless across their width, so a photograph without one
    is left alone.

  * It respects the profile crop. Instagram shows a 1080x1350 post as a centred
    1:1 square in the grid, so the top and bottom 135 px are not visible there.
    Every element that identifies the brand sits inside that square.

  * It uses no filter. The only thing laid over a photograph is a soft gradient
    at the foot, and only where type has to sit on it. The brief asks for
    minimal, architectural and European, which means the picture is the design.

Pillow only — already present in the environment, so no dependency is added.

Usage: python3 tools/social/build_instagram_grid.py [--full]
       --full renders at 1080x1350 instead of the low-resolution draft size.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SELECTED = ROOT / "social/instagram/01-selected"
DRAFTS = ROOT / "social/instagram/04-post-drafts"
PREVIEW = ROOT / "social/instagram/03-grid-preview"
BRAND = ROOT / "assets/brand"
FONTS = Path("/mnt/skills/examples/canvas-design/canvas-fonts")

POST_W, POST_H = 1080, 1350
DRAFT_SCALE = 0.5 if "--full" not in sys.argv else 1.0

# The site's own tokens, read off tools/design-system-v2.css rather than picked.
MOSS_DEEP = (46, 71, 51)      # #2E4733  forest green card ground
MOSS = (58, 90, 64)           # #3A5A40
SAGE = (163, 177, 138)        # #A3B18A
CREAM = (218, 215, 205)       # #DAD7CD  the off-white card ground
PAPER = (245, 245, 245)       # #F5F5F5
ROOF = (151, 49, 26)          # #97311A  the logo's roof red
INK = (32, 46, 36)

# Instagram crops the grid thumbnail to a centred square: 135 px off the top and
# the bottom of a 1080x1350 post. Nothing that identifies the brand goes there.
SAFE_TOP = 135
SAFE_BOTTOM = 135
MARGIN = 74


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


# Manrope is the site's display face and is not installed here. Work Sans is the
# closest humanist geometric available and is used for the drafts; the
# substitution is recorded in 02-design-system/brand-rules.md so the final
# artwork can be re-rendered in Manrope without redesigning anything.
F_TITLE = lambda s: font("WorkSans-Bold.ttf", s)
F_BODY = lambda s: font("WorkSans-Regular.ttf", s)


def strip_camera_watermark(im: Image.Image) -> tuple[Image.Image, int]:
    """Remove the phone's burnt-in branding strip from the foot of the frame.

    The strip is a near-white band the full width of the image carrying dark
    text. Rows are scanned upward from the bottom while they stay bright and
    close to grey; the first row that does not is the real photograph.
    """
    w, h = im.size
    small = im.convert("RGB").resize((160, h), Image.BILINEAR)
    px = small.load()
    limit = int(h * 0.16)  # the strip is never more than a sixth of the frame
    band = 0
    for offset in range(1, limit):
        y = h - offset
        bright = colourless = 0
        for x in range(0, 160, 4):
            r, g, b = px[x, y]
            if (r + g + b) / 3 > 195:
                bright += 1
            if max(r, g, b) - min(r, g, b) < 26:
                colourless += 1
        if bright < 30 or colourless < 32:  # of 40 samples
            break
        band = offset
    if band < h * 0.01:
        return im, 0
    return im.crop((0, 0, w, h - band)), band


def cover(im: Image.Image, w: int, h: int, focus: float = 0.5) -> Image.Image:
    """Scale to fill w x h and crop the overflow, keeping `focus` of the long axis.

    focus is 0..1 along whichever axis is cropped: 0 keeps the top or left edge,
    1 the bottom or right.
    """
    scale = max(w / im.width, h / im.height)
    resized = im.resize((max(w, round(im.width * scale)), max(h, round(im.height * scale))), Image.LANCZOS)
    if resized.width > w:
        left = round((resized.width - w) * focus)
        return resized.crop((left, 0, left + w, h))
    top = round((resized.height - h) * focus)
    return resized.crop((0, top, w, top + h))


def head_scrim(im: Image.Image, height_ratio: float = 0.22, strength: int = 118) -> Image.Image:
    """A soft darkening at the head only, so the white logo reads on a bright sky.

    Without it the lockup vanished on the workshop wall and the tree canopy — a
    logo that disappears on a third of the grid is not a logo."""
    w, h = im.size
    band = int(h * height_ratio)
    ramp = Image.new("L", (1, band))
    for y in range(band):
        t = 1 - (y / max(band - 1, 1))
        ramp.putpixel((0, y), int(strength * (t ** 1.9)))
    mask = ramp.resize((w, band), Image.BILINEAR)
    out = im.copy()
    out.paste(Image.new("RGB", (w, band), (14, 24, 18)), (0, 0), mask)
    return out


def foot_scrim(im: Image.Image, height_ratio: float = 0.34, strength: int = 165) -> Image.Image:
    """A soft darkening at the foot only, so the domain and title can be read.

    Not a filter: the top two thirds of the photograph are untouched.
    """
    w, h = im.size
    band = int(h * height_ratio)
    scrim = Image.new("L", (1, band))
    for y in range(band):
        t = y / max(band - 1, 1)
        scrim.putpixel((0, y), int(strength * (t ** 2.1)))
    mask = scrim.resize((w, band), Image.BILINEAR)
    layer = Image.new("RGB", (w, band), (14, 24, 18))
    out = im.copy()
    out.paste(layer, (0, h - band), mask)
    return out


def place_logo(canvas: Image.Image, light: bool) -> None:
    """Small, top left, inside the square the profile grid shows. Never centred,
    never enlarged, never boxed — the brief is explicit on all three."""
    name = "modunera-master-logo-mountain-v1-white-600.png" if light else "modunera-master-logo-mountain-v1-600.png"
    logo = Image.open(BRAND / name).convert("RGBA")
    target_w = 246
    logo = logo.resize((target_w, round(logo.height * target_w / logo.width)), Image.LANCZOS)
    canvas.paste(logo, (MARGIN, SAFE_TOP + 82), logo)


def place_domain(draw: ImageDraw.ImageDraw, light: bool) -> None:
    """Lower case, bottom right, inside the safe square."""
    f = F_BODY(30)
    text = "modunera.com"
    right = POST_W - MARGIN
    bottom = POST_H - SAFE_BOTTOM - 30
    box = draw.textbbox((0, 0), text, font=f)
    draw.text((right - (box[2] - box[0]), bottom - (box[3] - box[1])), text,
              font=f, fill=(255, 255, 255, 235) if light else INK)


def tracked(draw: ImageDraw.ImageDraw, xy, text: str, f, fill, tracking: int = 0):
    """Letter-spaced type. Pillow has no tracking, and the labels need it to read
    as architectural rather than as a caption."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking
    return x


def photo_post(source: Path, title: str | None, focus: float) -> Image.Image:
    im = Image.open(source).convert("RGB")
    im, band = strip_camera_watermark(im)
    canvas = cover(im, POST_W, POST_H, focus)
    canvas = head_scrim(canvas)
    if title:
        canvas = foot_scrim(canvas, height_ratio=0.36, strength=195)
    else:
        canvas = foot_scrim(canvas, height_ratio=0.26, strength=130)
    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=True)
    if title:
        f = F_TITLE(37)
        tracked(draw, (MARGIN, POST_H - SAFE_BOTTOM - 106), title, f, (255, 255, 255), tracking=3)
    place_domain(draw, light=True)
    canvas.info["watermark_band_px"] = band
    return canvas


def card_post(lines: list[str], ground: tuple[int, int, int], light_type: bool,
              size: int = 82, rule: bool = True) -> Image.Image:
    canvas = Image.new("RGB", (POST_W, POST_H), ground)
    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=light_type)

    ink = PAPER if light_type else INK
    accent = SAGE if light_type else ROOF
    f = F_TITLE(size)
    leading = int(size * 1.34)
    block_h = leading * len(lines)
    # Optically centred inside the square the grid shows, not inside the post.
    top = SAFE_TOP + (POST_H - SAFE_TOP - SAFE_BOTTOM - block_h) // 2 - 26

    if rule:
        draw.rectangle([MARGIN, top - 54, MARGIN + 92, top - 51], fill=accent)

    for i, line in enumerate(lines):
        tracked(draw, (MARGIN, top + i * leading), line, f, ink, tracking=2)

    place_domain(draw, light=light_type)
    return canvas


# The order the brief specifies, left to right, top to bottom.
# IMG_20250519_182509.jpg is named in the brief; it is 9.7 MB and would not come
# down the connector after four attempts. IMG_20250519_182528.jpg replaces it —
# the same A-frame and deck, the same session, and also on the brief's own list
# of strongest frames. Recorded here rather than silently swapped.
POSTS = [
    dict(kind="photo", src="IMG_20250519_182528.jpg", title=None, focus=0.5,
         note="substituted for IMG_20250519_182509.jpg (see comment)"),
    dict(kind="cream", lines=["DESIGN", "YOUR", "NATURE"], size=96),
    dict(kind="photo", src="IMG_20250618_094223.jpg", title="BUILT WITH PURPOSE", focus=0.5),
    dict(kind="forest", lines=["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE", "CUSTOM FURNITURE"], size=62),
    dict(kind="photo", src="IMG_20250807_131955.jpg", title="MADE AROUND YOU", focus=0.42),
    dict(kind="photo", src="IMG_20250913_193621.jpg", title="HOME, AFTER DARK", focus=0.45),
    dict(kind="photo", src="IMG_20250913_104632.jpg", title="FROM TÜRKİYE TO EUROPE", focus=0.5),
    dict(kind="cream", lines=["DELIVERY", "ACROSS", "DE · NL · DK", "LU · CH"], size=72),
    dict(kind="photo", src="IMG_20260206_161331.jpg", title="SPACE TO BREATHE", focus=0.5),
    dict(kind="photo", src="20231207_103831.jpg", title="FROM FRAME TO FINISH", focus=0.5),
    dict(kind="forest", lines=["MINIMAL.", "MODERN.", "NATURAL."], size=96),
    dict(kind="photo", src="IMG_20250525_142713.jpg", title=None, focus=0.42),
]


def main() -> None:
    DRAFTS.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)

    rendered, manifest = [], []
    for i, spec in enumerate(POSTS, start=1):
        if spec["kind"] == "photo":
            img = photo_post(SELECTED / spec["src"], spec["title"], spec["focus"])
            entry = {"post": i, "type": "photograph", "source": spec["src"],
                     "title": spec["title"], "watermark_band_removed_px": img.info.get("watermark_band_px", 0)}
            if spec.get("note"):
                entry["note"] = spec["note"]
        elif spec["kind"] == "cream":
            img = card_post(spec["lines"], CREAM, light_type=False, size=spec["size"])
            entry = {"post": i, "type": "card, off-white", "lines": spec["lines"]}
        else:
            img = card_post(spec["lines"], MOSS_DEEP, light_type=True, size=spec["size"])
            entry = {"post": i, "type": "card, forest green", "lines": spec["lines"]}

        out = DRAFTS / f"post-{i:02d}.jpg"
        draft = img if DRAFT_SCALE == 1.0 else img.resize(
            (round(POST_W * DRAFT_SCALE), round(POST_H * DRAFT_SCALE)), Image.LANCZOS)
        draft.save(out, quality=86, optimize=True)
        entry["file"] = str(out.relative_to(ROOT))
        entry["pixels"] = f"{draft.width}x{draft.height}"
        manifest.append(entry)
        rendered.append(img)

    # The profile preview: three columns, four rows, each post cropped to the
    # square Instagram actually shows in the grid, with the same 2 px gutter.
    cell = 360
    gutter = 4
    sheet = Image.new("RGB", (cell * 3 + gutter * 2, cell * 4 + gutter * 3), (255, 255, 255))
    for i, img in enumerate(rendered):
        square = img.crop((0, SAFE_TOP, POST_W, POST_H - SAFE_BOTTOM)).resize((cell, cell), Image.LANCZOS)
        sheet.paste(square, ((i % 3) * (cell + gutter), (i // 3) * (cell + gutter)))
    sheet.save(PREVIEW / "profile-grid-3x4.jpg", quality=90, optimize=True)

    # And a preview of the full 4:5 frames, which is what a visitor sees when a
    # post is opened rather than scanned.
    fw, fh = 300, 375
    full = Image.new("RGB", (fw * 3 + gutter * 2, fh * 4 + gutter * 3), (255, 255, 255))
    for i, img in enumerate(rendered):
        full.paste(img.resize((fw, fh), Image.LANCZOS), ((i % 3) * (fw + gutter), (i // 3) * (fh + gutter)))
    full.save(PREVIEW / "post-frames-3x4.jpg", quality=90, optimize=True)

    (PREVIEW / "grid-manifest.json").write_text(
        json.dumps({"generated_for": "MODUNERA", "post_size": "1080x1350",
                    "draft_scale": DRAFT_SCALE, "posts": manifest}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf8")
    print(json.dumps({"posts": len(manifest),
                      "drafts": str(DRAFTS.relative_to(ROOT)),
                      "preview": str((PREVIEW / "profile-grid-3x4.jpg").relative_to(ROOT)),
                      "watermarks_removed": sum(1 for m in manifest if m.get("watermark_band_removed_px"))},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
