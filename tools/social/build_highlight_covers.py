#!/usr/bin/env python3
"""Story-sized highlight covers, one per section of the site.

An empty profile is judged on one screen, and the row of highlights sits directly
under the bio — above the grid. Filling it is the cheapest thing that makes a new
account look like a business rather than a first attempt.

What Instagram actually does with these: it takes the story, crops the centre
square, and masks it to a circle about 161 px across on a phone. So the frame is
1080x1920 for uploading, but everything that matters lives inside a circle of
roughly 620 px centred at (540, 960) — the rest is never seen, and a design that
uses the corners is a design that loses them.

Icons are drawn, not fetched. The logo is a set of straight strokes at one weight,
so these are too: same stroke width relative to the frame, same square ends, no
fill, no gradient. Drawn at 4x and reduced, because Pillow has no anti-aliased
stroke and a 1-pass line at this size shows its stairs.

Colour rotates through the whole palette rather than tinting one hue. Adjacent
covers never share a ground, since the row is read left to right and two identical
circles beside each other read as one.

Writes social/instagram/11-highlights/<slug>.png and contact-sheet.jpg

Usage: python3 tools/social/build_highlight_covers.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/11-highlights"
W, H = 1080, 1920
SS = 4                      # supersample factor
CENTRE = (W // 2, H // 2)
SAFE_D = 620                # the circle the icon lives in
STROKE = 26                 # icon stroke weight at 1080, before supersampling


# --- icons -------------------------------------------------------------------
# Each takes a draw context and a square box, and strokes inside it. All are
# defined in the supersampled space, so coordinates are already multiplied.

def _line(d, pts, colour, w, joint="curve"):
    d.line(pts, fill=colour, width=w, joint=joint)


def _bez(p0, p1, p2, p3, steps=64):
    """Points along a cubic bezier.

    Pillow draws arcs and straight lines and nothing between, and the first pass
    at these icons showed why that matters: a leaf built from two circular arcs
    came out as a lens with a line through it, which reads as the empty-set sign
    rather than as anything that grows. A leaf and a flame are both defined by
    curves that change rate along their length, so they need real curves.
    """
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        out.append((u**3 * p0[0] + 3 * u*u*t * p1[0] + 3 * u*t*t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u*u*t * p1[1] + 3 * u*t*t * p2[1] + t**3 * p3[1]))
    return out


def _curve(d, x, y, s, spans, colour, w):
    """Draw a run of beziers given in 0..1 icon space."""
    pts = []
    for p0, p1, p2, p3 in spans:
        seg = _bez(p0, p1, p2, p3)
        pts += seg if not pts else seg[1:]
    d.line([(x + px * s, y + py * s) for px, py in pts], fill=colour, width=w, joint="curve")


def icon_house(d, x, y, s, c, w):
    """The A-frame, which is what MODUNERA actually builds and what the logo is."""
    _line(d, [(x, y + s), (x + s / 2, y), (x + s, y + s)], c, w)
    _line(d, [(x + s * 0.30, y + s * 0.60), (x + s * 0.70, y + s * 0.60)], c, w)


def icon_tag(d, x, y, s, c, w):
    """A price tag: a rectangle with one corner cut to a point, and its eyelet.

    The first version was a square rotated forty-five degrees with a dot in it,
    which is a diamond, not a tag. A tag is read by its asymmetry — three square
    corners and one point — so the shape has to keep them."""
    _line(d, [(x + s * 0.44, y + s * 0.06), (x + s * 0.94, y + s * 0.06),
              (x + s * 0.94, y + s * 0.56), (x + s * 0.50, y + s * 0.96),
              (x + s * 0.06, y + s * 0.52), (x + s * 0.44, y + s * 0.06)], c, w)
    r = s * 0.085
    cx, cy = x + s * 0.74, y + s * 0.26
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=w)


def icon_book(d, x, y, s, c, w):
    """An open book, for a hundred and ten articles."""
    _line(d, [(x + s * 0.06, y + s * 0.20), (x + s * 0.06, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.94, y + s * 0.20), (x + s * 0.94, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.06, y + s * 0.20), (x + s * 0.48, y + s * 0.30),
              (x + s * 0.48, y + s * 0.94), (x + s * 0.06, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.94, y + s * 0.20), (x + s * 0.52, y + s * 0.30),
              (x + s * 0.52, y + s * 0.94), (x + s * 0.94, y + s * 0.84)], c, w)


def icon_pin(d, x, y, s, c, w):
    """A map pin, for five countries and seven thousand pages of them."""
    r = s * 0.34
    cx, cy = x + s / 2, y + s * 0.38
    d.arc([cx - r, cy - r, cx + r, cy + r], 155, 25, fill=c, width=w)
    _line(d, [(cx - r * 0.906, cy + r * 0.423), (cx, y + s * 0.98)], c, w)
    _line(d, [(cx + r * 0.906, cy + r * 0.423), (cx, y + s * 0.98)], c, w)
    rr = s * 0.10
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=c, width=w)


def icon_leaf(d, x, y, s, c, w):
    """A leaf: two bezier flanks from base to tip, plus the midrib.

    Built from arcs first, which produced a symmetrical lens with a diagonal
    through it — the empty-set sign. A leaf is not symmetrical about its axis in
    the way an arc pair is: each flank leaves the base almost along the axis and
    swings wide near the middle, and that changing rate is what makes it read."""
    _curve(d, x, y, s, [((0.12, 0.90), (0.06, 0.44), (0.40, 0.08), (0.90, 0.10)),
                        ((0.90, 0.10), (0.92, 0.60), (0.56, 0.94), (0.12, 0.90))], c, w)
    _curve(d, x, y, s, [((0.12, 0.90), (0.38, 0.64), (0.62, 0.40), (0.90, 0.10))], c, w)


def icon_flame(d, x, y, s, c, w):
    """A flame. The one cover that is not about selling.

    Straight segments made a diamond inside a diamond. A flame is a teardrop —
    narrow and pointed at the top, heavy and round at the bottom — and the whole
    of that reading is in how fast it widens."""
    # Symmetric about its axis, this is a water drop and nothing else. What makes
    # a flame is the shoulder: one flank leaves the tip, turns back on itself, and
    # only then swings wide. Without that inflection the shape stays a droplet
    # however narrow the tip is drawn.
    _curve(d, x, y, s, [((0.46, 0.02), (0.30, 0.24), (0.14, 0.44), (0.13, 0.66)),
                        ((0.13, 0.66), (0.12, 0.88), (0.30, 0.98), (0.50, 0.98)),
                        ((0.50, 0.98), (0.72, 0.98), (0.88, 0.86), (0.88, 0.64)),
                        ((0.88, 0.64), (0.88, 0.44), (0.70, 0.40), (0.68, 0.22)),
                        ((0.68, 0.22), (0.66, 0.12), (0.56, 0.06), (0.46, 0.02))], c, w)
    _curve(d, x, y, s, [((0.46, 0.50), (0.60, 0.62), (0.66, 0.74), (0.60, 0.85)),
                        ((0.60, 0.85), (0.54, 0.93), (0.40, 0.92), (0.35, 0.83)),
                        ((0.35, 0.83), (0.30, 0.72), (0.38, 0.62), (0.46, 0.50))], c, w)


def icon_frame(d, x, y, s, c, w):
    """Four panels: a portfolio.

    An open square with a diagonal through it read as a pencil, which is an edit
    icon in every interface anyone has used. Four panels cannot be mistaken for
    an instruction."""
    for cx in (0.04, 0.54):
        for cy in (0.04, 0.54):
            _line(d, [(x + s * cx, y + s * cy), (x + s * (cx + 0.42), y + s * cy),
                      (x + s * (cx + 0.42), y + s * (cy + 0.42)),
                      (x + s * cx, y + s * (cy + 0.42)),
                      (x + s * cx, y + s * cy)], c, w)


def icon_bubble(d, x, y, s, c, w):
    """A speech bubble, for a hundred and sixty answers."""
    _line(d, [(x + s * 0.06, y + s * 0.72), (x + s * 0.06, y + s * 0.10),
              (x + s * 0.94, y + s * 0.10), (x + s * 0.94, y + s * 0.72),
              (x + s * 0.38, y + s * 0.72), (x + s * 0.20, y + s * 0.94),
              (x + s * 0.20, y + s * 0.72), (x + s * 0.06, y + s * 0.72)], c, w)


def icon_layers(d, x, y, s, c, w):
    """Stacked planes: modules, and the steel under them."""
    for i, dy in enumerate((0.10, 0.42, 0.74)):
        _line(d, [(x + s * 0.50, y + s * dy), (x + s * 0.96, y + s * (dy + 0.13)),
                  (x + s * 0.50, y + s * (dy + 0.26)), (x + s * 0.04, y + s * (dy + 0.13)),
                  (x + s * 0.50, y + s * dy)], c, w)


# --- the covers ---------------------------------------------------------------

COVERS = [
    dict(slug="models", label="MODELS", icon=icon_house,
         ground=g.MOSS_DEEP, ink=g.CREAM, link="modunera.com/en/models/",
         note="Eight models, MD 1 to MD 8"),
    dict(slug="prices", label="PRICES", icon=icon_tag,
         ground=g.PAPER, ink=g.ROOF, link="modunera.com/en/price-comparison/",
         note="Price comparison across the five markets"),
    dict(slug="guides", label="GUIDES", icon=icon_book,
         ground=g.MOSS, ink=g.CREAM, link="modunera.com/en/guides/",
         note="Permits, delivery and comparison"),
    dict(slug="europe", label="EUROPE", icon=icon_pin,
         ground=g.CREAM, ink=g.MOSS_DEEP, link="modunera.com/en/countries/",
         note="Germany, Netherlands, Denmark, Luxembourg, Switzerland"),
    dict(slug="quality", label="QUALITY", icon=icon_leaf,
         ground=g.CHARCOAL, ink=g.SAGE, link="modunera.com/en/advantages/",
         note="What a tiny house does well, and what it does not solve"),
    dict(slug="build", label="WHAT WE BUILD", icon=icon_layers,
         ground=g.ROOF, ink=g.WHITE, link="modunera.com/en/services/",
         note="Modular, steel, bungalows and bespoke furniture"),
    dict(slug="production", label="PRODUCTION", icon=icon_frame,
         ground=g.SAGE, ink=g.MOSS_DEEP, link="modunera.com/en/production-faq/",
         note="Production, quality, delivery and purchase — 60 questions"),
    dict(slug="faq", label="FAQ", icon=icon_bubble,
         ground=g.PAPER, ink=g.MOSS_DEEP, link="modunera.com/en/faq/",
         note="Permits, delivery, customs and buying"),
    dict(slug="nature", label="NATURE", icon=icon_flame,
         ground=g.CHARCOAL, ink=g.CREAM, link=None,
         note="Care on wooded sites. Not a sales highlight, and it has no link."),
]


TARGET = 380 * SS               # the longest side of every icon's ink, normalised


def _draw_alone(fn, s: float, stroke: int) -> Image.Image:
    """One icon on its own transparent layer, so its ink can be measured."""
    pad = int(s * 0.6)
    layer = Image.new("LA", (int(s + pad * 2), int(s + pad * 2)), (0, 0))
    fn(ImageDraw.Draw(layer), pad, pad, s, (255, 255), stroke)
    return layer


def cover(spec: dict) -> Image.Image:
    """Draw the icon, measure where its ink actually landed, then place that.

    Placing by the nominal box was wrong twice over, and both were visible in the
    row. Vertically: an icon whose shape does not fill its box sits wherever its
    coordinates happen to fall — the book was 27 px low and the layers 20 px low,
    which reads as a wobble down the row rather than as a design. And in size: the
    A-frame's ink measured 408 px across while the map pin's measured 262, so the
    same nominal box produced icons that looked a third apart.

    So it is drawn twice. The first pass measures, the second redraws at a
    corrected scale — with the stroke weight held constant, because normalising by
    scaling the finished artwork would have made the thin icons thin-lined too.
    Then the measured ink, not the box, is centred.
    """
    stroke = STROKE * SS
    s = SAFE_D * SS * 0.62
    box = _draw_alone(spec["icon"], s, stroke).getbbox()
    s *= TARGET / max(box[2] - box[0], box[3] - box[1])

    layer = _draw_alone(spec["icon"], s, stroke)
    box = layer.getbbox()
    ink = layer.crop(box)

    big = Image.new("RGB", (W * SS, H * SS), spec["ground"])
    tint = Image.new("RGB", ink.size, spec["ink"])
    big.paste(tint, (CENTRE[0] * SS - ink.width // 2,
                     CENTRE[1] * SS - ink.height // 2), ink.getchannel("A"))
    return big.resize((W, H), Image.LANCZOS)


def circle_preview(im: Image.Image, d: int = 220) -> Image.Image:
    """What Instagram shows: the centre square, masked to a circle."""
    sq = im.crop((0, (H - W) // 2, W, (H - W) // 2 + W)).resize((d, d), Image.LANCZOS)
    mask = Image.new("L", (d * 4, d * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
    out = Image.new("RGB", (d, d), (255, 255, 255))
    out.paste(sq, (0, 0), mask.resize((d, d), Image.LANCZOS))
    return out


def check() -> list[str]:
    problems = []
    for i, c in enumerate(COVERS):
        r = g.contrast(c["ink"], c["ground"])
        if r < 3.0:
            problems.append(f"{c['slug']}: icon on ground is {r:.2f}:1, needs 3.0")
        if i and COVERS[i - 1]["ground"] == c["ground"]:
            problems.append(f"{c['slug']}: same ground as {COVERS[i-1]['slug']} beside it")
    if len({tuple(c["ground"]) for c in COVERS}) < 5:
        problems.append("fewer than five distinct grounds across the row")
    return problems


def main() -> None:
    problems = check()
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    circles = []
    for spec in COVERS:
        im = cover(spec)
        im.save(OUT / f"{spec['slug']}.png", optimize=True)
        circles.append(circle_preview(im))

    # the row as it appears under the bio, on the white the profile is drawn on
    gap = 22
    board = Image.new("RGB", (sum(c.width for c in circles) + gap * (len(circles) + 1),
                              circles[0].height + gap * 2), (255, 255, 255))
    x = gap
    for c in circles:
        board.paste(c, (x, gap))
        x += c.width + gap
    board.save(OUT / "contact-sheet.jpg", quality=94, optimize=True)

    (OUT / "links.md").write_text(
        "# Highlight covers\n\n"
        "Upload each as a story, then add it to a highlight and set the cover to that\n"
        "story. The name goes in Instagram's own field — the artwork carries no text,\n"
        "because Instagram already prints the name under the circle and a word inside\n"
        "it would be the same word twice.\n\n"
        "Everything sits inside the centre circle. The 1080x1920 frame is only what\n"
        "Instagram accepts for upload; the corners are never shown.\n\n"
        "| Name to type | File | Link to put in the highlight |\n|---|---|---|\n"
        + "".join(f"| {c['label']} | `{c['slug']}.png` | "
                 f"{'https://' + c['link'] if c['link'] else '—'} |\n" for c in COVERS)
        + "\n"
        + "".join(f"- **{c['label']}** — {c['note']}\n" for c in COVERS),
        encoding="utf8")

    print(json.dumps({"covers": len(COVERS),
                      "grounds": len({tuple(c["ground"]) for c in COVERS}),
                      "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
