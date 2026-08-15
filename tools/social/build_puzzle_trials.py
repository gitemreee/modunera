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

from PIL import Image, ImageChops, ImageDraw

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


def blob(board: Image.Image, circles: list[tuple[int, int, int]], colour) -> None:
    """Several overlapping circles painted as one shape.

    Pasting them one at a time leaves a seam wherever two overlap, because each
    paste blends its own antialiased edge over the last. Union the masks first and
    paint once, and the result is a single organic field with no internal edges.

    This is what the first version of this board was missing. Discs placed apart
    read as four islands on a page; the reference boards chain their shapes so a
    field runs from one corner of the board to the other, and that continuity is
    the connection — not the fact that the ground is the same colour underneath.
    """
    mask = Image.new("L", board.size, 0)
    for cx, cy, r in circles:
        size = r * 2
        m = Image.new("L", (size * 2, size * 2), 0)
        ImageDraw.Draw(m).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
        layer = Image.new("L", board.size, 0)
        layer.paste(m.resize((size, size), Image.LANCZOS), (cx - r, cy - r))
        # lighter, not paste: the union of the masks. Pasting each circle over the
        # last blends its antialiased rim into the mask that is already there, and
        # the rim survives as a faint arc inside what should be a single field.
        mask = ImageChops.lighter(mask, layer)
    board.paste(Image.new("RGB", board.size, colour), (0, 0), mask)


STRADDLED: list = []


def type_on(board: Image.Image, box: tuple[int, int, int, int]):
    """The palette colour that can be read on whatever the board has there.

    The fields move when the composition is adjusted, and type placed against an
    assumed ground goes with them: the figure 5 was written in roof red onto what
    had become a roof-red field and vanished completely, and two country names
    ended up straddling the seam between moss and cream. Sampling the board where
    the type will go removes the assumption — the layout can be moved freely and
    the colours follow.

    The darkest patch in the box decides, not the average: type has to be legible
    over all of what it crosses, not over most of it.
    """
    grey = board.crop(box).convert("L")
    hist = sorted(v for v in grey.get_flattened_data())
    dark = hist[int(len(hist) * 0.10)]
    light = hist[int(len(hist) * 0.90)]
    for candidate in (g.WHITE, g.CREAM, g.CHARCOAL, g.ROOF, g.INK):
        if min(g.contrast(candidate, (dark,) * 3),
               g.contrast(candidate, (light,) * 3)) >= 4.5:
            return candidate
    # Nothing clears 4.5 against both ends, which means the box straddles a light
    # field and a dark one. That is a layout fault, not a colour choice — no ink
    # is readable on cream and moss at once — so it is reported instead of being
    # papered over with whichever colour looks least bad.
    STRADDLED.append((box, dark, light))
    return g.WHITE if dark < 110 else g.CHARCOAL


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
    b = Image.new("RGB", (BW, BH), g.CREAM)
    M = 96

    # Four fields, each several circles merged, chained so colour runs from the
    # top of the board to the bottom without a break. Coverage is about 55 % —
    # the first version sat near 25 % and read as islands on a page.
    blob(b, [(760, 380, 780), (1560, 620, 840), (1180, 1560, 720),
         (540, 2020, 900)], g.MOSS_DEEP)   # the last one takes tile 4 whole
    blob(b, [(2900, 1980, 660), (2680, 2760, 600), (3120, 2600, 480)], g.ROOF)
    blob(b, [(420, 3380, 820), (620, 4250, 620), (200, 4500, 460)], g.MOSS_DEEP)
    blob(b, [(2760, 4900, 860), (3180, 4380, 560), (2200, 5300, 620)], g.SAGE)
    d = ImageDraw.Draw(b)

    # Every element is placed against the disc it lands on, not against the page.
    # White reads on moss at 10.17:1, roof red on cream at 5.26:1 and charcoal on
    # sage at 7.9:1 — the sage disc is the one that would have taken moss type at
    # 4.46:1 and looked fine at full size while disappearing in the grid.

    # row 1 — photograph, the slogan on the moss disc, photograph
    b.paste(photo("lawn", TW - M * 2, TH - M * 2, 0.36), (M, M))
    x, y = tile_xy(1, 0)
    c = type_on(b, (x + M, y + 300, x + TW - M, y + 740))
    for i, line in enumerate(["DESIGN", "YOUR", "NATURE"]):
        g.tracked(d, (x + M, y + 330 + i * 132), line, g.F_TITLE(108), c,
                  tracking=-108 * 0.021)
    x, y = tile_xy(2, 0)
    b.paste(photo("night", TW - M * 2, TH - M * 2, 0.46), (x + M, y + M))

    # row 2 — the list on paper, a photograph, the figure on the cream disc
    x, y = tile_xy(0, 1)
    c = type_on(b, (x + M, y + 290, x + TW - M, y + 1000))
    d.rectangle([x + M, y + 300, x + M + 92, y + 303], fill=c)
    g.tracked(d, (x + M, y + 350), "WHAT WE BUILD", g.F_LABEL(30), c, tracking=30 * 0.15)
    for i, line in enumerate(["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE",
                              "BUNGALOWS", "CUSTOM FURNITURE"]):
        g.tracked(d, (x + M, y + 470 + i * 104), line, g.F_TITLE(56), c,
                  tracking=-56 * 0.021)
    x, y = tile_xy(1, 1)
    b.paste(photo("grove", TW - M * 2, TH - M * 2, 0.52), (x + M, y + M))
    x, y = tile_xy(2, 1)
    c = type_on(b, (x + M, y + 300, x + TW - M, y + 1030))
    g.tracked(d, (x + M, y + 300), "5", g.F_TITLE(420), c, tracking=0)
    g.tracked(d, (x + M, y + 900), "COUNTRIES,", g.F_LABEL(44), c, tracking=44 * 0.15 * 0.42)
    g.tracked(d, (x + M, y + 972), "ONE MAKER", g.F_LABEL(44), c, tracking=44 * 0.15 * 0.42)

    # row 3 — a statement on the second moss disc, then two photographs
    x, y = tile_xy(0, 2)
    c = type_on(b, (x + M, y + 370, x + TW - M, y + 830))
    d.rectangle([x + M, y + 380, x + M + 92, y + 383], fill=c)
    for i, line in enumerate(["STEEL", "BEFORE", "TIMBER"]):
        g.tracked(d, (x + M, y + 440 + i * 128), line, g.F_TITLE(104), c,
                  tracking=-104 * 0.021)
    x, y = tile_xy(1, 2)
    b.paste(photo("cladding", TW - M * 2, TH - M * 2, 0.30), (x + M, y + M))
    x, y = tile_xy(2, 2)
    b.paste(photo("kitchen", TW - M * 2, TH - M * 2, 0.5), (x + M, y + M))

    # row 4 — a photograph, the lockup on cream, the flags on the sage field.
    # The flags were in the middle tile and straddled moss, cream and sage at once;
    # no ink is readable across all three. Moved whole onto one field instead.
    x, y = tile_xy(0, 3)
    b.paste(photo("trailer", TW - M * 2, TH - M * 2, 0.5), (x + M, y + M))

    x, y = tile_xy(1, 3)
    logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-600.png").convert("RGBA")
    lw = 460
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    b.paste(logo, (x + 300, y + 520), logo)
    g.tracked(d, (x + 300, y + 700), "modunera.com", g.F_BODY(46),
              type_on(b, (x + 300, y + 690, x + 300 + 340, y + 756)), tracking=0)

    x, y = tile_xy(2, 3)
    c = type_on(b, (x + M, y + 290, x + TW - M, y + 950))
    g.tracked(d, (x + M, y + 300), "WHERE WE DELIVER", g.F_LABEL(30), c, tracking=30 * 0.15)
    yy = y + 400
    for code in g.FLAG_ORDER:
        f = g.flag(code, 68)
        b.paste(f, (x + M, yy))
        d.rectangle([x + M, yy, x + M + f.width, yy + 68], outline=c, width=2)
        g.tracked(d, (x + M + f.width + 32, yy + 16), g.FLAGS[code]["name"],
                  g.F_BODY(42), c, tracking=0)
        yy += 100
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
    for name, fn in [("a-paper", trial_a), ("b-forest", trial_b), ("c-frames", trial_c)]:
        board = fn()
        sheet(board, OUT / f"trial-{name}.jpg")
        board.resize((BW // 3, BH // 3), Image.LANCZOS).save(
            OUT / f"board-{name}.jpg", quality=88, optimize=True)
        thin = [(n, f) for n, f in coverage(board, g.PAPER if name == "c-frames"
                                            else g.CREAM) if f < 0.45]
        if thin:
            print("  thin tiles: " + ", ".join(f"{n} at {f:.0%}" for n, f in thin),
                  file=sys.stderr)
        if STRADDLED:
            for box, dark, light in STRADDLED:
                print(f"  WARN type at {box} straddles ground {dark}-{light}; "
                      f"no palette colour clears 4.5 on both", file=sys.stderr)
            STRADDLED.clear()
        print(f"{name}: {OUT.relative_to(g.ROOT)}/trial-{name}.jpg")



# --- trial C: the frame board -------------------------------------------------
# A third device, and the most delicate of the three. The connection is not a
# field of colour but a set of thin open rectangles that begin in one tile and
# end in another: the eye follows a line across the gutter as readily as it
# completes a curve, and a line costs almost no surface, so the ground stays
# light without the board going empty.
#
# Light is not the problem. Empty is. This one is pale and dense at once — every
# tile carries a photograph, a rule, a label or a frame edge, and the white is
# the space between things rather than the absence of them.

def coverage(board: Image.Image, ground) -> list[tuple[int, float]]:
    """How much of each tile is something rather than nothing.

    "Too empty" is the criticism this board kept earning, and it is not a matter
    of taste that can be left to the eye at preview size — a tile that is 80 %
    bare ground looks calm in a 330 px preview and looks unfinished at full size
    on a phone. So it is counted: every pixel that differs from the ground by more
    than a JPEG's worth of noise is content. Below 45 % a tile is reported.
    """
    from PIL import ImageChops
    flat = Image.new("RGB", (TW, TH), ground)
    out = []
    for r in range(ROWS):
        for c in range(COLS):
            x, y = tile_xy(c, r)
            tile = board.crop((x, y, x + TW, y + TH))
            diff = ImageChops.difference(tile, flat).convert("L").point(
                lambda v: 255 if v > 12 else 0)
            filled = sum(diff.get_flattened_data()) / 255 / (TW * TH)
            out.append((r * COLS + c + 1, filled))
    return out


def vtext(board: Image.Image, xy, text: str, font, colour, tracking=0.0,
          clockwise: bool = True) -> None:
    """Type running up or down the edge of the board.

    Pillow cannot rotate text, so it is drawn flat on its own layer and the layer
    is turned. Worth the detour: a vertical line of type is the cheapest way to
    fill a tall margin without adding another block, and it is what stops a
    three-column board reading as three separate columns."""
    pad = 40
    tmp = Image.new("RGBA", (2200, font.size + pad * 2), (0, 0, 0, 0))
    g.tracked(ImageDraw.Draw(tmp), (0, pad), text, font, colour + (255,), tracking=tracking)
    tmp = tmp.crop(tmp.getbbox())
    tmp = tmp.rotate(-90 if clockwise else 90, expand=True)
    board.paste(tmp, xy, tmp)


def open_frame(d: ImageDraw.ImageDraw, box, colour, w: int = 4) -> None:
    d.rectangle(list(box), outline=colour, width=w)


def trial_c() -> Image.Image:
    """Blocks and photographs fill the tiles; thin frames cross the seams.

    The first version of this put type straight onto the ground and measured 3 %
    coverage on the slogan tile. Type is almost no pixels — a line of it fills a
    tile the way a signature fills a page — so a tile carrying only words reads as
    unfinished however good the words are. Every tile now has a photograph or a
    block under it, and the frames are what join them.

    Every block crosses at least one seam, so the connection survives the gutter.
    """
    b = Image.new("RGB", (BW, BH), g.PAPER)
    d = ImageDraw.Draw(b)
    M = 60

    #  x0    y0    x1    y1    colour        what it crosses
    for x0, y0, x1, y1, col in [
            (900, M, 2400, TH - M, g.CREAM),                 # tile 2, into 1 and 3
            (M, TH + M, 1240, TH * 2 - M, g.MOSS_DEEP),      # tile 4, into 5
            (2000, TH + 200, BW - M, TH * 2 - M, g.CREAM),   # tile 6, into 5
            (900, TH * 2 + M, 2360, TH * 3 - M, g.CREAM),    # tile 8, into 7 and 9
            (940, TH * 3 + M, 2220, BH - M, g.MOSS_DEEP),    # tile 11, into 10 and 12
            (2140, TH * 3 + 240, BW - M, BH - M, g.SAGE)]:   # tile 12, into 11
        d.rectangle([x0, y0, x1, y1], fill=col)

    # Photographs go on after the blocks, so a block behind one becomes its margin
    b.paste(photo("lawn", 1020, TH - M * 2, 0.34), (M, M))
    b.paste(photo("night", 960, TH - M * 2, 0.46), (2220, M))
    b.paste(photo("grove", 900, TH - M * 2, 0.52), (1140, TH + M))
    b.paste(photo("cladding", 1020, TH - M * 2, 0.32), (M, TH * 2 + M))
    b.paste(photo("loft", 960, TH - M * 2, 0.5), (2220, TH * 2 + M))
    b.paste(photo("trailer", 1020, TH - M * 2, 0.48), (M, TH * 3 + M))

    R = g.ROOF
    # the frames, last, so they read as drawn over the whole board
    open_frame(d, (760, 700, 1900, 1500), R)      # 1 -> 2, and down into 4/5
    open_frame(d, (1980, 1180, 3060, 1900), R)    # 3 -> 6
    open_frame(d, (700, 2500, 1820, 3300), R)     # 7 -> 8, across the row above
    open_frame(d, (1900, 3700, 2980, 4500), R)    # 9 -> 12

    x, y = tile_xy(1, 0)
    c = type_on(b, (x + 120, y + 420, x + TW - 120, y + 900))
    for i, line in enumerate(["DESIGN", "YOUR", "NATURE"]):
        g.tracked(d, (x + 120, y + 440 + i * 132), line, g.F_TITLE(104), c,
                  tracking=-104 * 0.021)

    x, y = tile_xy(0, 1)
    c = type_on(b, (x + 120, y + 300, x + 1000, y + 1010))
    g.tracked(d, (x + 120, y + 320), "WHAT WE BUILD", g.F_LABEL(30), c, tracking=30 * 0.15)
    for i, line in enumerate(["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE",
                              "BUNGALOWS", "CUSTOM FURNITURE"]):
        g.tracked(d, (x + 120, y + 450 + i * 104), line, g.F_TITLE(56), c,
                  tracking=-56 * 0.021)

    vtext(b, (3090, TH + 320), "DESIGN YOUR NATURE", g.F_LABEL(36), g.INK,
          tracking=36 * 0.15)

    x, y = tile_xy(1, 2)
    c = type_on(b, (x + 120, y + 300, x + TW - 120, y + 1020))
    g.tracked(d, (x + 120, y + 300), "5", g.F_TITLE(400), c, tracking=0)
    g.tracked(d, (x + 120, y + 880), "LÄNDER,", g.F_LABEL(44), c, tracking=44 * 0.15 * 0.42)
    g.tracked(d, (x + 120, y + 952), "EIN HERSTELLER", g.F_LABEL(44), c,
              tracking=44 * 0.15 * 0.42)

    x, y = tile_xy(1, 3)
    c = type_on(b, (x + 120, y + 260, x + TW - 60, y + 1000))
    g.tracked(d, (x + 120, y + 280), "WHERE WE DELIVER", g.F_LABEL(30), c, tracking=30 * 0.15)
    yy = y + 400
    for code in g.FLAG_ORDER:
        f = g.flag(code, 64)
        b.paste(f, (x + 120, yy))
        d.rectangle([x + 120, yy, x + 120 + f.width, yy + 64], outline=c, width=2)
        g.tracked(d, (x + 120 + f.width + 30, yy + 14), g.FLAGS[code]["name"],
                  g.F_BODY(40), c, tracking=0)
        yy += 94

    x, y = tile_xy(2, 3)
    logo = Image.open(g.BRAND / "modunera-master-logo-mountain-v1-600.png").convert("RGBA")
    lw = 470
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    b.paste(logo, (x + 180, y + 640), logo)
    g.tracked(d, (x + 180, y + 820), "modunera.com", g.F_BODY(44),
              type_on(b, (x + 180, y + 810, x + 180 + 340, y + 876)), tracking=0)
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
    for name, fn in [("a-paper", trial_a), ("b-forest", trial_b), ("c-frames", trial_c)]:
        board = fn()
        sheet(board, OUT / f"trial-{name}.jpg")
        board.resize((BW // 3, BH // 3), Image.LANCZOS).save(
            OUT / f"board-{name}.jpg", quality=88, optimize=True)
        thin = [(n, f) for n, f in coverage(board, g.PAPER if name == "c-frames"
                                            else g.CREAM) if f < 0.45]
        if thin:
            print("  thin tiles: " + ", ".join(f"{n} at {f:.0%}" for n, f in thin),
                  file=sys.stderr)
        if STRADDLED:
            for box, dark, light in STRADDLED:
                print(f"  WARN type at {box} straddles ground {dark}-{light}; "
                      f"no palette colour clears 4.5 on both", file=sys.stderr)
            STRADDLED.clear()
        print(f"{name}: {OUT.relative_to(g.ROOT)}/trial-{name}.jpg")



# --- trial C: the frame board -------------------------------------------------
# A third device, and the most delicate of the three. The connection is not a
# field of colour but a set of thin open rectangles that begin in one tile and
# end in another: the eye follows a line across the gutter as readily as it
# completes a curve, and a line costs almost no surface, so the ground stays
# light without the board going empty.
#
# Light is not the problem. Empty is. This one is pale and dense at once — every
# tile carries a photograph, a rule, a label or a frame edge, and the white is
# the space between things rather than the absence of them.

def coverage(board: Image.Image, ground) -> list[tuple[int, float]]:
    """How much of each tile is something rather than nothing.

    "Too empty" is the criticism this board kept earning, and it is not a matter
    of taste that can be left to the eye at preview size — a tile that is 80 %
    bare ground looks calm in a 330 px preview and looks unfinished at full size
    on a phone. So it is counted: every pixel that differs from the ground by more
    than a JPEG's worth of noise is content. Below 45 % a tile is reported.
    """
    from PIL import ImageChops
    flat = Image.new("RGB", (TW, TH), ground)
    out = []
    for r in range(ROWS):
        for c in range(COLS):
            x, y = tile_xy(c, r)
            tile = board.crop((x, y, x + TW, y + TH))
            diff = ImageChops.difference(tile, flat).convert("L").point(
                lambda v: 255 if v > 12 else 0)
            filled = sum(diff.get_flattened_data()) / 255 / (TW * TH)
            out.append((r * COLS + c + 1, filled))
    return out


def vtext(board: Image.Image, xy, text: str, font, colour, tracking=0.0,
          clockwise: bool = True) -> None:
    """Type running up or down the edge of the board.

    Pillow cannot rotate text, so it is drawn flat on its own layer and the layer
    is turned. Worth the detour: a vertical line of type is the cheapest way to
    fill a tall margin without adding another block, and it is what stops a
    three-column board reading as three separate columns."""
    pad = 40
    tmp = Image.new("RGBA", (2200, font.size + pad * 2), (0, 0, 0, 0))
    g.tracked(ImageDraw.Draw(tmp), (0, pad), text, font, colour + (255,), tracking=tracking)
    tmp = tmp.crop(tmp.getbbox())
    tmp = tmp.rotate(-90 if clockwise else 90, expand=True)
    board.paste(tmp, xy, tmp)


def open_frame(d: ImageDraw.ImageDraw, box, colour, w: int = 4) -> None:
    d.rectangle(list(box), outline=colour, width=w)
if __name__ == "__main__":
    main()
