#!/usr/bin/env python3
"""Five ways to arrange the same photographs into a profile grid.

The question this answers is not "which post looks best" but "what does the
profile look like when someone lands on it". Instagram shows a 3-column grid of
centred square crops, so the arrangement is a composition in its own right — and
the same twelve pictures can read as a catalogue, a magazine or a lookbook
depending only on where they sit.

Each option below uses the same photograph pool and the same design system. Only
the arrangement changes, so the comparison is fair.

  A  Checkerboard      photo and card alternate; a card never touches a card
  B  Three rails       left column informs, centre states, right column shows
  C  Row bands         a row of photographs, then a row of cards, alternating
  D  Centre spine      statements run down the middle, photographs either side
  E  Panorama triptych one photograph split across a row, cards between

Writes social/instagram/03-grid-preview/options/option-<x>.jpg

Usage: python3 tools/social/build_grid_options.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.PREVIEW / "options"
L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_INT = dict(warmth=1.02, lift=0.04, contrast=1.15, saturation=0.92)
L_NIGHT = dict(warmth=1.04, lift=0.06, contrast=1.10, saturation=0.98, noisy=True)

P = {
    "deck":    ("IMG_20250519_182528.jpg", L_EXT, 0.50),
    "lawn":    ("IMG_20250525_142713.jpg", L_EXT, 0.42),
    "night":   ("IMG_20250913_193621.jpg", L_NIGHT, 0.45),
    "grove":   ("IMG_20250519_183120.jpg", L_EXT, 0.50),
    "kitchen": ("IMG_20250807_131955.jpg", L_INT, 0.42),
    "loft":    ("20240227_113020.jpg", L_INT, 0.66),
    "wood":    ("20250126_192414.jpg", L_INT, 0.50),
    "stair":   ("IMG_20250724_101400.jpg", L_INT, 0.50),
    "cladding": ("20231214_121220.jpg", dict(warmth=0.99, lift=0.05, contrast=1.20, saturation=0.88), 0.24),
    "frame":   ("IMG_20250913_183727.jpg", L_EXT, 0.50),
    "trailer": ("IMG_20250913_104632.jpg", L_EXT, 0.52),
}


def src(key: str) -> Path:
    name = P[key][0]
    for d in (g.SELECTED, g.ROOT / "social/instagram/00-candidates"):
        if (d / name).exists():
            return d / name
    raise FileNotFoundError(name)


def photo(key: str, title: str | None = None):
    _, look, focus = P[key]
    return g.photo_post(src(key), title, focus, look)


def detail(key: str):
    _, look, focus = P[key]
    return g.detail_post(src(key), focus, False, {k: v for k, v in look.items() if k != "noisy"})


def cream(lines, size=88):
    return g.card_post(lines, g.LIGHT_GROUND, light_type=False, size=size)


def forest(lines, size=88):
    return g.card_post(lines, g.MOSS_DEEP, light_type=True, size=size)


def numeral(fig, label, dark=False):
    return g.numeral_post(fig, label, g.MOSS_DEEP if dark else g.LIGHT_GROUND, light_type=dark)


def spec(code, name, sub):
    return g.spec_post(code, name, sub, g.model_rows(code.lower().replace(" ", "").replace("md", "mc")))


def panorama(key: str, parts: int = 3) -> list[Image.Image]:
    """One photograph cut into consecutive posts so the row reads as a single
    picture in the profile grid. The cut is made on the square the grid shows, not
    on the 4:5 post, or the seams would not line up where anyone can see them."""
    _, look, _ = P[key]
    im = Image.open(src(key)).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    src_w, src_h = im.size
    wide = g.cover(im, g.POST_W * parts, g.POST_W, 0.5)     # square-tall band, 3 wide
    wide = g.grade(wide, **{k: v for k, v in look.items() if k != "noisy"})
    reduction = max(src_w / (g.POST_W * parts), src_h / g.POST_W)
    wide = g.sharpen(wide, amount=min(1.20, 0.72 + 0.28 * reduction),
                     micro=min(1.0, 0.55 + 0.28 * reduction))
    out = []
    for i in range(parts):
        slice_ = wide.crop((i * g.POST_W, 0, (i + 1) * g.POST_W, g.POST_W))
        post = Image.new("RGB", (g.POST_W, g.POST_H), (20, 30, 24))
        post.paste(slice_, (0, g.SAFE_TOP))                 # the square sits in the grid window
        # extend the picture into the cropped bands so the open post is not letterboxed
        post.paste(slice_.crop((0, 0, g.POST_W, g.SAFE_TOP)), (0, 0))
        post.paste(slice_.crop((0, g.POST_W - g.SAFE_BOTTOM, g.POST_W, g.POST_W)),
                   (0, g.POST_H - g.SAFE_BOTTOM))
        draw = __import__("PIL.ImageDraw", fromlist=["ImageDraw"]).Draw(post)
        luma, _ = g._luma(post, (g.MARGIN, g.SAFE_TOP + 36, g.MARGIN + 246, g.SAFE_TOP + 106))
        need = g.scrim_need(luma)
        if need > 0.04:
            post = g.head_scrim(post, height_ratio=0.24, strength=int(150 * need))
            draw = __import__("PIL.ImageDraw", fromlist=["ImageDraw"]).Draw(post)
        if i == 0:                                          # the lockup once, on the left panel
            g.place_logo(post, light=True)
        if i == parts - 1:
            g.place_domain(draw, light=True)
        out.append(post)
    return out


def sheet(posts: list[Image.Image], path: Path, cell: int = 300, gutter: int = 3) -> None:
    """The profile view: the centred square of each post, at grid proportions."""
    rows = (len(posts) + 2) // 3
    im = Image.new("RGB", (cell * 3 + gutter * 2, cell * rows + gutter * (rows - 1)), (255, 255, 255))
    for i, post in enumerate(posts):
        sq = post.crop((0, g.SAFE_TOP, g.POST_W, g.POST_H - g.SAFE_BOTTOM)).resize((cell, cell), Image.LANCZOS)
        im.paste(sq, ((i % 3) * (cell + gutter), (i // 3) * (cell + gutter)))
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, quality=90, optimize=True)


def option_a():
    """Checkerboard — the current grid. Photograph and card alternate so a card
    never touches a card. Safest, most familiar, least distinctive."""
    return [
        photo("grove"), cream(["DESIGN", "YOUR", "NATURE"], 92), photo("cladding", "BUILT WITH PURPOSE"),
        forest(["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE", "CUSTOM FURNITURE"], 58),
        photo("kitchen", "MADE AROUND YOU"), photo("night", "HOME, AFTER DARK"),
        photo("trailer", "FROM TÜRKİYE TO EUROPE"), cream(["DELIVERY", "ACROSS", "DE · NL · DK", "LU · CH"], 68),
        photo("loft", "SPACE TO BREATHE"),
        photo("frame", "FROM FRAME TO FINISH"), forest(["MINIMAL.", "MODERN.", "NATURAL."], 92), photo("lawn"),
    ]


def option_b():
    """Three rails — the left column informs, the centre states, the right column
    shows. Reads like a spread: specification, idea, evidence, on every row. The
    strongest structure and the least forgiving, because one weak photograph in
    the right rail is visible down the whole column."""
    return [
        spec("MD 1", "Panorama and loft", "Living · holiday home"), forest(["DESIGN", "YOUR", "NATURE"], 88), photo("grove"),
        numeral("5", ["COUNTRIES,", "ONE ROUTE"]), forest(["MINIMAL.", "MODERN.", "NATURAL."], 88), photo("night"),
        spec("MD 6", "Chalet concept", "Mountain sites · resort"), forest(["MADE", "TO ORDER."], 88), photo("kitchen"),
        numeral("8", ["MODELS,", "ONE SYSTEM"]), forest(["BUILT", "FOR FOUR", "SEASONS."], 76), photo("lawn"),
    ]


def option_c():
    """Row bands — a row of three photographs, then a row of three cards. The feed
    breathes in and out. Works well when photographs arrive in sets of three and
    badly when they do not."""
    return [
        photo("grove"), photo("night"), photo("lawn"),
        cream(["DESIGN", "YOUR", "NATURE"], 84), forest(["TINY HOUSE", "MODULAR", "STEEL", "FURNITURE"], 58),
        numeral("5", ["COUNTRIES,", "ONE ROUTE"]),
        photo("kitchen"), photo("loft"), photo("wood"),
        spec("MD 1", "Panorama and loft", "Living · holiday home"),
        forest(["MINIMAL.", "MODERN.", "NATURAL."], 88), numeral("8", ["MODELS,", "ONE SYSTEM"], dark=True),
    ]


def option_d():
    """Centre spine — statements run down the middle, photographs either side.
    The eye reads the middle as a sentence while the sides carry the product.
    Quieter than the rails and easier to keep going for months."""
    return [
        photo("grove"), forest(["DESIGN", "YOUR", "NATURE"], 88), photo("night"),
        photo("cladding"), cream(["FROM", "FRAME TO", "FINISH."], 84), photo("frame"),
        photo("kitchen"), forest(["MADE", "AROUND", "YOU."], 88), photo("loft"),
        photo("trailer"), cream(["DE · NL · DK", "LU · CH"], 72), photo("lawn"),
    ]


def option_e():
    """Panorama triptych — one photograph cut across a whole row so the profile
    shows a single wide picture, with card rows between. The most distinctive and
    the most demanding: it only works with a frame wide enough to survive the cut,
    and the three posts are weak on their own in the feed."""
    posts = panorama("grove")
    posts += [cream(["DESIGN", "YOUR", "NATURE"], 84),
              forest(["TINY HOUSE", "MODULAR", "STEEL", "FURNITURE"], 58),
              numeral("5", ["COUNTRIES,", "ONE ROUTE"])]
    posts += panorama("lawn")
    posts += [spec("MD 1", "Panorama and loft", "Living · holiday home"),
              forest(["MINIMAL.", "MODERN.", "NATURAL."], 88),
              numeral("8", ["MODELS,", "ONE SYSTEM"], dark=True)]
    return posts


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    built = {}
    for key, fn in [("a-checkerboard", option_a), ("b-three-rails", option_b),
                    ("c-row-bands", option_c), ("d-centre-spine", option_d),
                    ("e-panorama", option_e)]:
        posts = fn()
        sheet(posts, OUT / f"option-{key}.jpg")
        built[key] = len(posts)

    # one sheet with all five side by side, for the actual comparison
    tiles = [Image.open(OUT / f"option-{k}.jpg") for k in built]
    gap = 22
    w = sum(t.width for t in tiles) + gap * (len(tiles) - 1)
    h = max(t.height for t in tiles)
    board = Image.new("RGB", (w, h), (255, 255, 255))
    x = 0
    for t in tiles:
        board.paste(t, (x, 0))
        x += t.width + gap
    board.save(OUT / "compare-all.jpg", quality=88, optimize=True)
    print({"options": built, "compare": str((OUT / "compare-all.jpg").relative_to(g.ROOT))})


if __name__ == "__main__":
    main()
