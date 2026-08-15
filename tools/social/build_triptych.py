#!/usr/bin/env python3
"""Three posts that make one panel, for the top of the profile.

A triptych is the only thing in a grid that cannot be scrolled past, because it is
the only thing that does not make sense one tile at a time. This one is drawn
rather than photographed: a photograph cut in three has to be composed in three
already, and the ones that are get used up quickly — while a panel of colour can
carry what a stranger actually needs on arrival, which is what this company makes
and where it delivers.

    1  the lockup and the slogan
    2  what is built — five lines, from /leistungen/
    3  where it goes — five flags, at their own proportions

The gradient runs across all three tiles as one ramp, so the panels belong to each
other even though each is a whole post on its own. It stays between moss-deep and
moss: leaf measures 4.48:1 against white, which is under what body copy needs and
close enough to look usable, and a ground that cannot carry its type is not a
ground.

Posting order. Instagram puts the most recent post at the top left, so the panels
go up in reverse — 3, then 2, then 1 — and land left to right. Pinning does not
change that: pinned posts move to the front of the grid but keep their order
among themselves.

Writes social/instagram/13-triptych/panel-N.jpg, strip.jpg and grid.jpg

Usage: python3 tools/social/build_triptych.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/13-triptych"
PANELS = 3
BAND_W = g.POST_W * PANELS

# What is built. Five, because /leistungen/ advertises four things beside the
# tiny house itself and a card that lists four was under-claiming against the
# company's own page.
BUILDS = ["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE", "BUNGALOWS",
          "CUSTOM FURNITURE"]
SLOGAN = ["DESIGN", "YOUR", "NATURE"]


def band() -> Image.Image:
    """The gradient, drawn once across the full width of the three tiles.

    Vertically it darkens a little as well, which keeps the foot of each tile
    heavier than its head — the same weighting a photograph has, so the drawn
    panels sit beside the photographic posts rather than beside a different feed.
    """
    ramp = g.gradient((BAND_W, g.POST_W),
                      [(0.0, g.MOSS_DEEP), (0.5, g.MOSS), (1.0, g.MOSS_DEEP)])
    darker = Image.eval(ramp, lambda v: int(v * 0.80))
    fall = g.gradient((BAND_W, g.POST_W),
                      [(0.0, (0, 0, 0)), (1.0, (255, 255, 255))],
                      horizontal=False).convert("L")
    return Image.composite(darker, ramp, fall)


def panel_grounds() -> list[Image.Image]:
    """Each tile: the gradient's share of the band, extended into the crop bands.

    The top and bottom 135 px are not shown in the grid but are shown when the
    post is opened, so they carry the gradient on rather than a dark edge.
    """
    strip = band()
    out = []
    for i in range(PANELS):
        sq = strip.crop((i * g.POST_W, 0, (i + 1) * g.POST_W, g.POST_W))
        post = Image.new("RGB", (g.POST_W, g.POST_H))
        post.paste(sq, (0, g.SAFE_TOP))
        post.paste(sq.crop((0, 0, g.POST_W, g.SAFE_TOP)), (0, 0))
        post.paste(sq.crop((0, g.POST_W - g.SAFE_BOTTOM, g.POST_W, g.POST_W)),
                   (0, g.POST_H - g.SAFE_BOTTOM))
        out.append(post)
    return out


def dress(posts: list[Image.Image]) -> list[Image.Image]:
    top = g.SAFE_TOP
    out = []

    # --- 1: the lockup and the slogan ---------------------------------------
    p = posts[0]
    d = ImageDraw.Draw(p)
    g.place_logo(p, light=True)
    d.rectangle([g.MARGIN, top + 320, g.MARGIN + 92, top + 323], fill=g.CREAM)
    for i, line in enumerate(SLOGAN):
        g.tracked(d, (g.MARGIN, top + 380 + i * 124), line, g.F_TITLE(104),
                  g.WHITE, tracking=-104 * 0.021)
    out.append(p)

    # --- 2: what is built ----------------------------------------------------
    p = posts[1]
    d = ImageDraw.Draw(p)
    d.rectangle([g.MARGIN, top + 190, g.MARGIN + 92, top + 193], fill=g.CREAM)
    g.tracked(d, (g.MARGIN, top + 232), "WHAT WE BUILD", g.F_LABEL(30), g.CREAM,
              tracking=30 * 0.15)
    for i, line in enumerate(BUILDS):
        g.tracked(d, (g.MARGIN, top + 330 + i * 106), line, g.F_TITLE(62),
                  g.WHITE, tracking=-62 * 0.021)
    out.append(p)

    # --- 3: where it goes ----------------------------------------------------
    p = posts[2]
    d = ImageDraw.Draw(p)
    d.rectangle([g.MARGIN, top + 190, g.MARGIN + 92, top + 193], fill=g.CREAM)
    g.tracked(d, (g.MARGIN, top + 232), "WHERE WE DELIVER", g.F_LABEL(30), g.CREAM,
              tracking=30 * 0.15)
    fh, gap = 62, 26
    y = top + 330
    for code in g.FLAG_ORDER:
        f = g.flag(code, fh)
        p.paste(f, (g.MARGIN, y))
        # a hairline round each flag: white bands would otherwise bleed into a
        # light part of the ramp and a red field would float on green
        d.rectangle([g.MARGIN, y, g.MARGIN + f.width, y + fh],
                    outline=(255, 255, 255, 255), width=2)
        g.tracked(d, (g.MARGIN + f.width + 30, y + 14), g.FLAGS[code]["name"],
                  g.F_BODY(38), g.WHITE, tracking=0)
        y += fh + gap
    g.place_domain(d, light=True, on_photo=False, ground=g.MOSS_DEEP)
    out.append(p)
    return out


def check(posts: list[Image.Image]) -> list[str]:
    """Type has to clear 4.5:1 on the ramp under it, and no element may sit
    outside the square the grid shows."""
    problems = []
    for i, p in enumerate(posts, start=1):
        flat = Image.new("RGB", p.size, g.MOSS_DEEP)
        # the ink is everything far from the ramp: compare against the ground the
        # panel would have with nothing drawn on it
        ground = panel_grounds()[i - 1]
        from PIL import ImageChops
        ink = ImageChops.difference(p, ground).convert("L").point(
            lambda v: 255 if v > 40 else 0)
        box = ink.getbbox()
        if box is None:
            problems.append(f"panel {i}: nothing was drawn")
            continue
        if box[1] < g.SAFE_TOP or box[3] > g.POST_H - g.SAFE_BOTTOM:
            problems.append(f"panel {i}: ink spans y {box[1]}-{box[3]}, "
                            f"outside the visible square {g.SAFE_TOP}-{g.POST_H - g.SAFE_BOTTOM}")
        if box[0] < g.MARGIN - 2 or box[2] > g.POST_W - g.MARGIN + 2:
            problems.append(f"panel {i}: ink spans x {box[0]}-{box[2]}, outside the margins")

        v = g.luma_under(ground, ink)
        r = g.contrast(g.WHITE, (int(v),) * 3)
        if r < 4.5:
            problems.append(f"panel {i}: type measures {r:.2f}:1 on its ground, needs 4.5")
    return problems


def main() -> None:
    posts = dress(panel_grounds())
    problems = check(posts)
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    for i, p in enumerate(posts, start=1):
        p.save(OUT / f"panel-{i}.jpg", quality=94, optimize=True)

    cell, gut = 360, 4
    grid = Image.new("RGB", (cell * 3 + gut * 2, cell), (255, 255, 255))
    for i, p in enumerate(posts):
        sq = p.crop((0, g.SAFE_TOP, g.POST_W, g.POST_H - g.SAFE_BOTTOM))
        grid.paste(sq.resize((cell, cell), Image.LANCZOS), (i * (cell + gut), 0))
    grid.save(OUT / "grid.jpg", quality=94, optimize=True)

    print(json.dumps({"panels": PANELS, "checks": "passed",
                      "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
