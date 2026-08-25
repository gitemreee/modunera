#!/usr/bin/env python3
"""One story for each of the nine highlights.

The covers exist and the circles are empty — a highlight with a cover and no
story is a door painted on a wall. This adds the first story behind each door:
1080x1920, one per highlight, in the highlight's own colours where the cover is
flat and on a real photograph where the theme has one.

The rules are the account's rules. Photographs are the repository's own, graded
with the feed's looks. Flat grounds use only pairings the cover set already
proved. Every factual line is either visible in the photograph or already
published on modunera.com — the 42,900 € floor price, the 2.55 m base width,
the 160 FAQ answers, the five markets. Type sits inside Instagram's story-safe
area: the top ~250 px belong to the profile chip, the bottom ~250 px to the
reply box.

Writes social/instagram/19-highlight-stories/story-<slug>.jpg + contact-sheet.jpg

Usage: python3 tools/social/build_highlight_stories.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw
import pillow_heif

pillow_heif.register_heif_opener()

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/19-highlight-stories"
SRC2 = g.ROOT / "social/instagram/17-drive-2026-08-21"
SRC1 = g.ROOT / "social/instagram/01-selected"

W, H = 1080, 1920
SAFE_TOP, SAFE_BOTTOM = 250, 260
MARGIN = 66

L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_HALL = dict(warmth=1.01, lift=0.05, contrast=1.14, saturation=0.90)


def logo(canvas: Image.Image, light: bool) -> None:
    name = ("modunera-master-logo-mountain-v1-white-600.png" if light
            else "modunera-master-logo-mountain-v1-600.png")
    im = Image.open(g.BRAND / name).convert("RGBA")
    w = 280
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    canvas.paste(im, (MARGIN, SAFE_TOP), im)


def _lines(draw, lines, y, fnt, fill, leading=1.16):
    for ln in lines:
        draw.text((MARGIN, y), ln, font=fnt, fill=fill)
        box = draw.textbbox((0, 0), ln, font=fnt)
        y += round((box[3] - box[1]) * leading) + 14
    return y


def story_photo(source: Path, look: dict, focus: float, title: list[str],
                sub: list[str], link: str | None) -> Image.Image:
    im = Image.open(source).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    canvas = g.cover(im, W, H, focus)
    canvas = g.grade(canvas, **look)
    canvas = g.sharpen(canvas)
    # scrim: measured, not guessed — darken until white body clears 4.5:1
    band_top = H - SAFE_BOTTOM - 640
    probe = canvas.crop((0, band_top, W, H))
    for alpha in range(0, 200, 12):
        test = Image.composite(Image.new("RGB", probe.size, (0, 0, 0)), probe,
                               Image.new("L", probe.size, alpha))
        v = g._luma_bright(test, (MARGIN, 60, W - MARGIN, probe.height - 40))
        if g.contrast(g.WHITE, (int(v),) * 3) >= 5.2:
            break
    grad = Image.new("L", (1, probe.height))
    for y in range(probe.height):
        grad.putpixel((0, y), round(alpha * min(1.0, y / 300)))
    grad = grad.resize(probe.size)
    shaded = Image.composite(Image.new("RGB", probe.size, (0, 0, 0)), probe, grad)
    canvas.paste(shaded, (0, band_top))

    d = ImageDraw.Draw(canvas)
    logo(canvas, light=True)
    y = H - SAFE_BOTTOM - 500
    y = _lines(d, title, y, g.F_TITLE(88), g.WHITE)
    y += 18
    y = _lines(d, sub, y, g.F_BODY(40), g.CREAM)
    if link:
        d.text((MARGIN, H - SAFE_BOTTOM - 64), link, font=g.F_BODY(34), fill=g.WHITE)
    return canvas


def story_card(ground, type_colour, title: list[str], sub: list[str],
               link: str | None, light: bool, flags: bool = False,
               figure: str | None = None) -> Image.Image:
    canvas = Image.new("RGB", (W, H), ground)
    d = ImageDraw.Draw(canvas)
    logo(canvas, light=light)
    body = g.body_on(ground)
    y = SAFE_TOP + 420
    if figure:
        # Sized to fit: at 260 px "42,900 \u20ac" ran off the right edge of the
        # first render. The figure shrinks until it clears the margin, and the
        # block below moves with the real glyph height instead of a constant.
        size = 260
        while size > 80:
            f = g.F_TITLE(size)
            box = d.textbbox((0, 0), figure, font=f)
            if box[2] - box[0] <= W - 2 * MARGIN:
                break
            size -= 10
        d.text((MARGIN, y), figure, font=f, fill=type_colour)
        y += (box[3] - box[1]) + 90
    d.rectangle([MARGIN, y, MARGIN + 84, y + 6], fill=type_colour)
    y += 60
    y = _lines(d, title, y, g.F_TITLE(96), type_colour)
    y += 30
    y = _lines(d, sub, y, g.F_BODY(42), body, leading=1.3)
    if flags:
        row = g.flag_row(["DE", "NL", "DK", "LU", "CH"], 64, 26)
        canvas.paste(row, (MARGIN, y + 44))
    if link:
        d.text((MARGIN, H - SAFE_BOTTOM - 64), link, font=g.F_BODY(34), fill=type_colour)
    return canvas


STORIES = [
    dict(slug="models", kind="photo", src=SRC1 / "IMG_20250525_142713.jpg",
         look=L_EXT, focus=0.42,
         title=["EIGHT MODELS,", "MD 1 TO MD 8."],
         sub=["One base width: 2.55 m.", "Length, layout and facade", "are chosen per project."],
         link="modunera.com/en/models/"),
    dict(slug="prices", kind="card", ground=g.PAPER, type_colour=g.ROOF, light=False,
         figure="42,900 €",
         title=["WHERE PRICES", "START."],
         sub=["Ex works, per model, public —", "compared across all five markets", "on one page."],
         link="modunera.com/en/price-comparison/"),
    dict(slug="guides", kind="card", ground=g.MOSS, type_colour=g.CREAM, light=True,
         title=["READ FIRST.", "ORDER SECOND."],
         sub=["Permits, delivery, customs,", "comparison — the guides answer", "before the contract asks."],
         link="modunera.com/en/guides/"),
    dict(slug="europe", kind="card", ground=g.CREAM, type_colour=g.MOSS_DEEP, light=False,
         flags=True,
         title=["FIVE MARKETS,", "ONE MAKER."],
         sub=["Germany, the Netherlands, Denmark,", "Luxembourg and Switzerland —", "each with its own country page."],
         link="modunera.com/en/countries/"),
    dict(slug="quality", kind="photo", src=SRC2 / "IMG_3849.HEIC",
         look=L_HALL, focus=0.5,
         title=["THE FILM COMES", "OFF LAST."],
         sub=["Fit-out happens in the hall.", "The worktop keeps its protective", "film until handover."],
         link="modunera.com/en/advantages/"),
    dict(slug="build", kind="card", ground=g.ROOF, type_colour=g.WHITE, light=True,
         title=["MORE THAN", "TINY."],
         sub=["Tiny houses, modular buildings,", "steel structures, containers,", "bungalows, bespoke furniture."],
         link="modunera.com/en/services/"),
    dict(slug="production", kind="photo", src=SRC2 / "IMG_6037.HEIC",
         look=L_HALL, focus=0.52,
         title=["BUILT IN", "OUR OWN HALL."],
         sub=["An A-frame mid-build: cladding", "half done, offcuts on the floor.", "Nothing staged."],
         link="modunera.com/en/production-faq/"),
    dict(slug="faq", kind="card", ground=g.CHARCOAL, type_colour=g.CREAM, light=True,
         figure="160",
         title=["ANSWERS,", "BEFORE YOU ASK."],
         sub=["Permits, delivery, customs and", "buying — the FAQ covers the", "questions that decide a project."],
         link="modunera.com/en/faq/"),
    dict(slug="nature", kind="photo", src=SRC1 / "IMG_20250519_182528.jpg",
         look=L_EXT, focus=0.5,
         title=["THE TREES", "STAY."],
         sub=["A deck built around the olives,", "not over them. Small houses", "leave the site standing."],
         link=None),
]


def render(s: dict) -> Image.Image:
    if s["kind"] == "photo":
        return story_photo(s["src"], s["look"], s["focus"], s["title"], s["sub"], s["link"])
    return story_card(s["ground"], s["type_colour"], s["title"], s["sub"],
                      s["link"], s["light"], flags=s.get("flags", False),
                      figure=s.get("figure"))


def main() -> None:
    problems = []
    for s in STORIES:
        if s["kind"] == "card":
            r = g.contrast(s["type_colour"], s["ground"])
            if r < 3.0:
                problems.append(f"{s['slug']}: title {r:.2f}:1")
            if g.contrast(g.body_on(s["ground"]), s["ground"]) < 4.5:
                problems.append(f"{s['slug']}: no body colour clears 4.5:1")
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    images = [render(s) for s in STORIES]
    for s, im in zip(STORIES, images):
        im.save(OUT / f"story-{s['slug']}.jpg", quality=92, optimize=True)

    cols, cell = 3, 360
    sheet = Image.new("RGB", (cols * cell + 8, ((len(images) + 2) // 3) * (cell * 1920 // 1080) + 8), (24, 24, 24))
    for i, im in enumerate(images):
        t = im.resize((cell, cell * 1920 // 1080))
        sheet.paste(t, (4 + (i % cols) * cell, 4 + (i // cols) * t.height))
    sheet.save(OUT / "contact-sheet.jpg", quality=85)

    (OUT / "manifest.json").write_text(json.dumps(
        {"set": "one story behind each of the nine highlight covers",
         "format": "1080x1920, story-safe margins 250/260",
         "stories": [{"slug": s["slug"], "kind": s["kind"],
                      "file": f"story-{s['slug']}.jpg",
                      "link": s["link"]} for s in STORIES]},
        indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(json.dumps({"stories": len(STORIES), "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
