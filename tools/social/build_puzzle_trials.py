#!/usr/bin/env python3
"""Two ways to make twelve posts read as one board. Previews only.

The reference boards work because the *ground* is continuous, not because the
tiles are fragments. That distinction is the whole design question here, and it
decides what the account can do afterwards:

  - a continuous ground costs nothing in the feed. Each tile is still a whole
    composition — a photograph on paper, a statement on moss — and someone who
    meets one alone, days later, sees a finished post.
  - fragments cost everything in the feed. Half a shape and three letters means
    nothing to the person scrolling, and that is where most impressions happen.

Both trials keep every tile whole. They differ in how loudly the ground speaks.

    A  paper board   light ground running under everything, photographs inset
                     with real margin, colour blocks and rules crossing seams
    B  forest board  moss field, photographs full-bleed into it, two of them
                     spanning a pair of tiles so the join is deliberate

What neither can escape: a board of twelve is a commitment. Every later post has
to arrive in threes or the whole thing shifts by one, and a Reel shifts it too.
That is a real cost and it is the reason the ninety-post plan was built on
adjacency instead.

Writes social/instagram/14-puzzle/trial-<x>.jpg  (board and profile preview)

Usage: python3 tools/social/build_puzzle_trials.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/14-puzzle"
COLS, ROWS = 3, 4
TW, TH = g.POST_W, g.POST_H              # one tile
BW, BH = TW * COLS, TH * ROWS            # the whole board

L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_INT = dict(warmth=1.02, lift=0.04, contrast=1.15, saturation=0.92)
L_NIGHT = dict(warmth=1.04, lift=0.06, contrast=1.10, saturation=0.98)
L_YARD = dict(warmth=0.99, lift=0.05, contrast=1.20, saturation=0.88)

PHOTOS = {
    "lawn":     ("IMG_20250525_142713.jpg", L_EXT),
    "grove":    ("IMG_20250519_183120.jpg", L_EXT),
    "night":    ("IMG_20250913_193621.jpg", L_NIGHT),
    "cladding": ("20231214_121220.jpg", L_YARD),
    "trailer":  ("IMG_20250913_104632.jpg", L_EXT),
    "kitchen":  ("IMG_20250807_131955.jpg", L_INT),
    "loft":     ("20240227_113020.jpg", L_INT),
}


def src(key: str) -> Path:
    name = PHOTOS[key][0]
    for d in (g.SELECTED, g.ROOT / "social/instagram/00-candidates"):
        if (d / name).exists():
            return d / name
    raise FileNotFoundError(name)


def photo(key: str, w: int, h: int, focus: float = 0.5) -> Image.Image:
    im = Image.open(src(key)).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    sw, sh = im.size
    out = g.cover(im, w, h, focus)
    out = g.grade(out, **PHOTOS[key][1])
    reduction = max(sw / w, sh / h)
    return g.sharpen(out, amount=min(1.20, 0.72 + 0.28 * reduction),
                     micro=min(1.0, 0.55 + 0.28 * reduction))


def tile_xy(col: int, row: int) -> tuple[int, int]:
    return col * TW, row * TH


def disc(board: Image.Image, cx: int, cy: int, r: int, colour) -> None:
    """A circle big enough to cross tiles, drawn smooth.

    This is what does the joining. The reference boards are not held together by
    cutting content in half — every tile in them is a finished composition — they
    are held together by shapes that are larger than one tile, so the eye
    completes the curve across the gutter and reads four tiles as one surface.
    That costs nothing in the feed, which is the whole reason it works: a tile
    carrying the edge of a circle is still a tile with a coloured field on it.

    Drawn on a mask at twice the size and reduced, because Pillow's ellipse is
    aliased and a hard stair-step on a curve this large is the one thing that
    would make it look printed at 300 dpi by accident.
    """
    box = (cx - r, cy - r, cx + r, cy + r)
    size = r * 2
    mask = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    board.paste(Image.new("RGB", (size, size), colour), (box[0], box[1]), mask)


# --- trial A: the paper board -------------------------------------------------

def trial_a() -> Image.Image:
    """Paper under everything, with discs larger than a tile doing the joining.

    Four of them, placed so each straddles a seam and no two touch. They are the
    reason the board reads as one surface; the photographs are inset with real
    margin so the ground and the discs run behind them rather than being
    interrupted.
    """
    b = Image.new("RGB", (BW, BH), g.PAPER)
    M = 96

    #        centre                 radius  colour
    disc(b, 1500, 620, 820, g.MOSS_DEEP)     # under tiles 1-2-3, into row 2
    disc(b, 2880, 2180, 700, g.CREAM)        # tile 6, into 9
    disc(b, 560, 3320, 840, g.MOSS_DEEP)     # tiles 4-7
    disc(b, 2160, 5010, 950, g.SAGE)         # centred on the seam of 11-12
    d = ImageDraw.Draw(b)

    # Every element is placed against the disc it lands on, not against the page.
    # White reads on moss at 10.17:1, roof red on cream at 5.26:1 and charcoal on
    # sage at 7.9:1 — the sage disc is the one that would have taken moss type at
    # 4.46:1 and looked fine at full size while disappearing in the grid.

    # row 1 — photograph, the slogan on the moss disc, photograph
    b.paste(photo("lawn", TW - M * 2, TH - M * 2, 0.36), (M, M))
    x, y = tile_xy(1, 0)
    for i, line in enumerate(["DESIGN", "YOUR", "NATURE"]):
        g.tracked(d, (x + M, y + 330 + i * 132), line, g.F_TITLE(108), g.WHITE,
                  tracking=-108 * 0.021)
    x, y = tile_xy(2, 0)
    b.paste(photo("night", TW - M * 2, TH - M * 2, 0.46), (x + M, y + M))

    # row 2 — the list on paper, a photograph, the figure on the cream disc
    x, y = tile_xy(0, 1)
    d.rectangle([x + M, y + 300, x + M + 92, y + 303], fill=g.INK)
    g.tracked(d, (x + M, y + 350), "WHAT WE BUILD", g.F_LABEL(30), g.INK, tracking=30 * 0.15)
    for i, line in enumerate(["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE",
                              "BUNGALOWS", "CUSTOM FURNITURE"]):
        g.tracked(d, (x + M, y + 470 + i * 104), line, g.F_TITLE(56), g.ROOF,
                  tracking=-56 * 0.021)
    x, y = tile_xy(1, 1)
    b.paste(photo("grove", TW - M * 2, TH - M * 2, 0.52), (x + M, y + M))
    x, y = tile_xy(2, 1)
    g.tracked(d, (x + M, y + 300), "5", g.F_TITLE(420), g.ROOF, tracking=0)
    g.tracked(d, (x + M, y + 900), "COUNTRIES,", g.F_LABEL(44), g.INK, tracking=44 * 0.15 * 0.42)
    g.tracked(d, (x + M, y + 972), "ONE MAKER", g.F_LABEL(44), g.INK, tracking=44 * 0.15 * 0.42)

    # row 3 — a statement on the second moss disc, then two photographs
    x, y = tile_xy(0, 2)
    d.rectangle([x + M, y + 380, x + M + 92, y + 383], fill=g.CREAM)
    for i, line in enumerate(["STEEL", "BEFORE", "TIMBER"]):
        g.tracked(d, (x + M, y + 440 + i * 128), line, g.F_TITLE(104), g.WHITE,
                  tracking=-104 * 0.021)
    x, y = tile_xy(1, 2)
    b.paste(photo("cladding", TW - M * 2, TH - M * 2, 0.30), (x + M, y + M))
    x, y = tile_xy(2, 2)
    b.paste(photo("kitchen", TW - M * 2, TH - M * 2, 0.5), (x + M, y + M))

    # row 4 — a photograph, then the flags and the lockup on the sage disc
    x, y = tile_xy(0, 3)
    b.paste(photo("trailer", TW - M * 2, TH - M * 2, 0.5), (x + M, y + M))
    x, y = tile_xy(1, 3)
    g.tracked(d, (x + 210, y + 300), "WHERE WE DELIVER", g.F_LABEL(30), g.CHARCOAL,
              tracking=30 * 0.15)
    yy = y + 400
    for code in g.FLAG_ORDER:
        f = g.flag(code, 68)
        b.paste(f, (x + 210, yy))
        d.rectangle([x + 210, yy, x + 210 + f.width, yy + 68], outline=g.CHARCOAL, width=2)
        g.tracked(d, (x + 210 + f.width + 32, yy + 16), g.FLAGS[code]["name"],
                  g.F_BODY(42), g.CHARCOAL, tracking=0)
        yy += 100
    x, y = tile_xy(2, 3)
    logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-600.png").convert("RGBA")
    lw = 460
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    b.paste(logo, (x + M, y + 520), logo)
    g.tracked(d, (x + M, y + 700), "modunera.com", g.F_BODY(46), g.CHARCOAL, tracking=0)
    return b


# --- trial B: the forest board ------------------------------------------------

def trial_b() -> Image.Image:
    """A moss field with photographs full-bleed into it. Louder, and it gives up
    the white air that makes the paper board feel like a catalogue."""
    b = g.gradient((BW, BH), [(0.0, g.MOSS_DEEP), (0.5, g.MOSS), (1.0, g.MOSS_DEEP)])
    d = ImageDraw.Draw(b)
    M = 0

    b.paste(photo("grove", TW * 2, TH, 0.52), tile_xy(0, 0))       # spans tiles 1-2
    x, y = tile_xy(2, 0)
    for i, line in enumerate(["DESIGN", "YOUR", "NATURE"]):
        g.tracked(d, (x + 96, y + 380 + i * 128), line, g.F_TITLE(100), g.WHITE,
                  tracking=-100 * 0.021)

    x, y = tile_xy(0, 1)
    g.tracked(d, (x + 96, y + 300), "WHAT", g.F_TITLE(96), g.CREAM, tracking=-96 * 0.021)
    g.tracked(d, (x + 96, y + 420), "WE BUILD", g.F_TITLE(96), g.CREAM, tracking=-96 * 0.021)
    for i, line in enumerate(["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE",
                              "BUNGALOWS", "CUSTOM FURNITURE"]):
        g.tracked(d, (x + 96, y + 620 + i * 82), line, g.F_BODY(44), g.ON_MOSS, tracking=0)
    b.paste(photo("night", TW, TH, 0.46), tile_xy(1, 1))
    b.paste(photo("cladding", TW, TH, 0.30), tile_xy(2, 1))

    b.paste(photo("lawn", TW, TH, 0.36), tile_xy(0, 2))
    x, y = tile_xy(1, 2)
    d.rectangle([x, y, x + TW, y + TH], fill=g.ROOF)
    g.tracked(d, (x + 96, y + 260), "5", g.F_TITLE(420), g.WHITE, tracking=0)
    g.tracked(d, (x + 96, y + 900), "COUNTRIES,", g.F_LABEL(46), g.CREAM,
              tracking=46 * 0.15 * 0.42)
    g.tracked(d, (x + 96, y + 976), "ONE MAKER", g.F_LABEL(46), g.CREAM,
              tracking=46 * 0.15 * 0.42)
    b.paste(photo("loft", TW, TH, 0.5), tile_xy(2, 2))

    x, y = tile_xy(0, 3)
    g.tracked(d, (x + 96, y + 240), "WHERE WE", g.F_TITLE(90), g.WHITE, tracking=-90 * 0.021)
    g.tracked(d, (x + 96, y + 350), "DELIVER", g.F_TITLE(90), g.WHITE, tracking=-90 * 0.021)
    yy = y + 540
    for code in g.FLAG_ORDER:
        f = g.flag(code, 68)
        b.paste(f, (x + 96, yy))
        d.rectangle([x + 96, yy, x + 96 + f.width, yy + 68], outline=(255, 255, 255), width=2)
        g.tracked(d, (x + 96 + f.width + 32, yy + 16), g.FLAGS[code]["name"],
                  g.F_BODY(42), g.WHITE, tracking=0)
        yy += 96
    b.paste(photo("trailer", TW * 2, TH, 0.5), tile_xy(1, 3))      # spans tiles 11-12
    return b


def sheet(board: Image.Image, path: Path, cell: int = 330, gut: int = 4) -> None:
    """The profile view: the twelve tiles, cut and set back down with the gutter
    Instagram draws between them. The gutter is the honest part — a board that
    only works without it is a board that will not work."""
    im = Image.new("RGB", (cell * COLS + gut * (COLS - 1),
                           round(cell * TH / TW) * ROWS + gut * (ROWS - 1)), (255, 255, 255))
    ch = round(cell * TH / TW)
    for r in range(ROWS):
        for c in range(COLS):
            x, y = tile_xy(c, r)
            tile = board.crop((x, y, x + TW, y + TH)).resize((cell, ch), Image.LANCZOS)
            im.paste(tile, (c * (cell + gut), r * (ch + gut)))
    im.save(path, quality=93, optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("a-paper", trial_a), ("b-forest", trial_b)]:
        board = fn()
        sheet(board, OUT / f"trial-{name}.jpg")
        board.resize((BW // 3, BH // 3), Image.LANCZOS).save(
            OUT / f"board-{name}.jpg", quality=88, optimize=True)
        print(f"{name}: {OUT.relative_to(g.ROOT)}/trial-{name}.jpg")


if __name__ == "__main__":
    main()
