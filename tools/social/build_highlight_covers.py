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




def _glyph(d, x, y, s, ch, colour, font):
    """A character used as artwork — the euro and the question mark.

    Drawing a euro sign by hand is drawing a letter badly. The committed face
    already carries both, so they are set rather than traced."""
    box = d.textbbox((0, 0), ch, font=font)
    d.text((x + (s - (box[2] - box[0])) / 2 - box[0],
            y + (s - (box[3] - box[1])) / 2 - box[1]), ch, font=font, fill=colour)


def icon_house(d, x, y, s, c, w):
    """The product in side view: a long body with the A-frame set into it.

    The wheels came off. Drawn at 380 px they were two small ellipses under a busy
    shape and the whole thing read as a machine; at the 44 px a phone uses, they
    were grit. What identifies this as MODUNERA is the gable cutting through a
    flat-roofed body, and that survives at any size — so it carries the tile alone,
    with a ground line under it instead of wheels.
    """
    b0, b1 = y + s * 0.34, y + s * 0.84
    _line(d, [(x + s * 0.06, b0), (x + s * 0.94, b0), (x + s * 0.94, b1),
              (x + s * 0.06, b1), (x + s * 0.06, b0)], c, w)
    _line(d, [(x + s * 0.30, b1), (x + s * 0.50, y + s * 0.08),
              (x + s * 0.70, b1)], c, w)
    for x0 in (0.13, 0.77):
        _line(d, [(x + s * x0, y + s * 0.48), (x + s * (x0 + 0.10), y + s * 0.48),
                  (x + s * (x0 + 0.10), y + s * 0.64), (x + s * x0, y + s * 0.64),
                  (x + s * x0, y + s * 0.48)], c, w)
    _line(d, [(x, y + s * 0.96), (x + s, y + s * 0.96)], c, w)


def icon_tag(d, x, y, s, c, w, font=None):
    """A tag lying flat, point to the left, with a euro set in the body.

    It was drawn on the diagonal and the diagonal was the whole problem. A tag
    tipped 45 degrees has no horizontal field inside it, so the euro had to go in
    a corner, where it sat against two sloping edges and read as debris caught in
    a pentagon. Laid flat, the body is a plain rectangle and the euro sits in the
    middle of it at the size a euro wants to be \u2014 which is the only reason the
    tag is here at all. A tag alone is a label; a tag with a currency is a price.
    """
    _line(d, [(x + s * 0.30, y + s * 0.16), (x + s * 0.98, y + s * 0.16),
              (x + s * 0.98, y + s * 0.84), (x + s * 0.30, y + s * 0.84),
              (x + s * 0.02, y + s * 0.50), (x + s * 0.30, y + s * 0.16)], c, w)
    # The hole has to be wider than the stroke that draws it. At r = 0.055 s it was
    # 42 px across drawn with a 104 px pen, so the ring closed on itself and came
    # out as a dot \u2014 a tag with a dot punched in it is a tag with a smudge on it.
    r = s * 0.10
    cx, cy = x + s * 0.22, y + s * 0.50
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=w)
    if font:
        _glyph(d, x + s * 0.40, y + s * 0.20, s * 0.58, "\u20ac", c, font)


def icon_book(d, x, y, s, c, w):
    """An open book with a bookmark.

    The spanner laid across it did not survive being small — it read as a hook —
    and a book on its own says guides perfectly well. The ribbon is what makes it
    a book in use rather than a shape."""
    _line(d, [(x + s * 0.02, y + s * 0.14), (x + s * 0.02, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.98, y + s * 0.14), (x + s * 0.98, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.02, y + s * 0.14), (x + s * 0.48, y + s * 0.26),
              (x + s * 0.48, y + s * 0.98), (x + s * 0.02, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.98, y + s * 0.14), (x + s * 0.52, y + s * 0.26),
              (x + s * 0.52, y + s * 0.98), (x + s * 0.98, y + s * 0.84)], c, w)
    _line(d, [(x + s * 0.72, y + s * 0.21), (x + s * 0.72, y + s * 0.62),
              (x + s * 0.80, y + s * 0.52), (x + s * 0.88, y + s * 0.60),
              (x + s * 0.88, y + s * 0.18)], c, round(w * 0.8))


def icon_pin(d, x, y, s, c, w):
    """A globe, not a pin.

    A pin means one place and this highlight is five countries, so the pin was
    wrong before it was drawn badly. Filling its head with a ring of stars made it
    worse: at 380 px the stars were dots, at 44 px a berry.

    Three strokes, and the third is the one that was missing. The previous globe
    had two latitude lines and no equator, and both latitudes were drawn as chords
    from 0.09 to 0.91 — but a circle at that height is 0.974 wide, so each line
    stopped short of the outline at both ends and floated inside it. Four strokes,
    two of them not touching anything. The equator is the one line that can run the
    full diameter and meet the circle exactly, so it is the one that stays; the
    wide meridian is narrowed to 0.32-0.68 so the pair no longer closes into an eye.
    """
    m = s * 0.02
    d.ellipse([x + m, y + m, x + s - m, y + s - m], outline=c, width=w)
    d.ellipse([x + s * 0.32, y + m, x + s * 0.68, y + s - m], outline=c, width=w)
    _line(d, [(x + m, y + s * 0.50), (x + s - m, y + s * 0.50)], c, w)


def icon_gear(d, x, y, s, c, w):
    """A gear with a tick in it: the thing was made, and it was checked."""
    import math
    r_out, r_in, teeth = s * 0.46, s * 0.36, 10
    cx, cy = x + s * 0.5, y + s * 0.5
    pts = []
    for i in range(teeth * 2):
        a = math.radians(i * 180 / teeth - 90)
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    _line(d, pts + [pts[0]], c, w)
    _line(d, [(cx - s * 0.16, cy), (cx - s * 0.04, cy + s * 0.13),
              (cx + s * 0.18, cy - s * 0.15)], c, w)


def _rot(pts, deg, cx=0.5, cy=0.5):
    """Turn a path given in 0..1 icon space about its centre.

    Coordinates may leave the unit box once turned. That is safe here: every icon
    is drawn onto a padded transparent layer, measured by the bounding box of its
    ink and normalised from that, so a shape that overruns its nominal box is
    sized and centred by what it actually covers rather than by what it declared.
    """
    import math
    a = math.radians(deg)
    ca, sa = math.cos(a), math.sin(a)
    return [((px - cx) * ca - (py - cy) * sa + cx,
             (px - cx) * sa + (py - cy) * ca + cy) for px, py in pts]


def icon_hammer(d, x, y, s, c, w):
    """One claw hammer, in outline like the rest of the set.

    Crossed tools were here and they read as scissors with a flag on them. Two
    objects at this stroke weight is one object too many: the X of the two handles
    is the biggest shape in the frame, so the eye reads the X first and the tools
    second, and the two heads — a rectangle and an open arc — end up as debris at
    the top corners. The arc in particular came off as a stray letter C.

    A single tool has no X to read. The claw went through two versions before this
    one. Drawn as a two-pronged notch off the left end it needed four vertices
    inside a fifth of the frame and they closed into a beak at this pen weight.
    Dropped entirely in favour of a stepped head — thin pein, deep face — it got
    worse: a horizontal block with a tapered grip hanging off the right of it is
    the silhouette of a power drill, and that is what it read as, on both sizes.

    Upright is the problem. Every drill is drawn level and every hammer worth
    recognising is drawn mid-swing, so the tilt is doing more work here than any
    detail in the head. Turned 30 degrees the drill reading goes, and the claw can
    come back as a single blunt wedge — two vertices instead of four, which is
    what this pen can hold.
    """
    head = _rot([(0.40, 0.06), (0.98, 0.06), (0.98, 0.36), (0.40, 0.36),
                 (0.14, 0.26), (0.06, 0.13), (0.40, 0.06)], -30)
    grip = _rot([(0.48, 0.36), (0.68, 0.36), (0.62, 0.98), (0.42, 0.98),
                 (0.48, 0.36)], -30)
    for path in (head, grip):
        _line(d, [(x + px * s, y + py * s) for px, py in path], c, w)


def icon_truck(d, x, y, s, c, w):
    """A flatbed with a load on it. Production ends when something leaves the yard,
    and this is the page that answers what happens then."""
    _line(d, [(x + s * 0.02, y + s * 0.30), (x + s * 0.02, y + s * 0.72),
              (x + s * 0.58, y + s * 0.72), (x + s * 0.58, y + s * 0.30),
              (x + s * 0.02, y + s * 0.30)], c, w)
    for i in range(2):
        _line(d, [(x + s * 0.02, y + s * (0.44 + i * 0.14)),
                  (x + s * 0.58, y + s * (0.44 + i * 0.14))], c, round(w * 0.7))
    _line(d, [(x + s * 0.58, y + s * 0.72), (x + s * 0.58, y + s * 0.44),
              (x + s * 0.78, y + s * 0.44), (x + s * 0.94, y + s * 0.58),
              (x + s * 0.94, y + s * 0.72), (x + s * 0.58, y + s * 0.72)], c, w)
    r = s * 0.085
    for cx in (0.20, 0.44, 0.80):
        d.ellipse([x + s * cx - r, y + s * 0.72 - r * 0.3,
                   x + s * cx + r, y + s * 0.72 + r * 1.7], outline=c, width=w)


def icon_bubble(d, x, y, s, c, w, font=None):
    """Two bubbles: one asks, one answers. A single bubble is a message; a pair
    with a question mark is a FAQ."""
    _line(d, [(x + s * 0.30, y + s * 0.04), (x + s * 0.98, y + s * 0.04),
              (x + s * 0.98, y + s * 0.52), (x + s * 0.52, y + s * 0.52),
              (x + s * 0.40, y + s * 0.68), (x + s * 0.40, y + s * 0.52),
              (x + s * 0.30, y + s * 0.52), (x + s * 0.30, y + s * 0.04)], c, w)
    _line(d, [(x + s * 0.02, y + s * 0.42), (x + s * 0.24, y + s * 0.42)], c, w)
    _line(d, [(x + s * 0.02, y + s * 0.42), (x + s * 0.02, y + s * 0.90),
              (x + s * 0.18, y + s * 0.90), (x + s * 0.30, y + s * 1.02),
              (x + s * 0.30, y + s * 0.90), (x + s * 0.62, y + s * 0.90),
              (x + s * 0.62, y + s * 0.58)], c, w)
    if font:
        _glyph(d, x + s * 0.44, y + s * 0.02, s * 0.42, "?", c, font)


def icon_leaves(d, x, y, s, c, w):
    """A seedling: a stem out of the ground with two leaves.

    The palm went. Two leaves above an open hand is a face — the leaves become
    eyes and the palm becomes a mouth — and a thumb on the end of the curve did
    not undo it, because the reading comes from the arrangement rather than from
    the detail. A stem does the same job with no ambiguity: something growing,
    in ground worth keeping.
    """
    _line(d, [(x + s * 0.50, y + s * 0.92), (x + s * 0.50, y + s * 0.34)], c, w)
    for dx, dy, sc, flip in ((0.02, 0.14, 0.46, True), (0.52, 0.06, 0.46, False)):
        pts = [((0.12, 0.90), (0.06, 0.44), (0.40, 0.08), (0.90, 0.10)),
               ((0.90, 0.10), (0.92, 0.60), (0.56, 0.94), (0.12, 0.90))]
        if flip:
            pts = [tuple((1 - px, py) for px, py in seg) for seg in pts]
        _curve(d, x + s * dx, y + s * dy, s * sc, pts, c, round(w * 0.85))
    _line(d, [(x + s * 0.14, y + s * 0.94), (x + s * 0.86, y + s * 0.94)], c, w)


# --- the covers ---------------------------------------------------------------

COVERS = [
    dict(slug="models", label="MODELS", icon=icon_house, glyph=None,
         ground=g.MOSS_DEEP, ink=g.CREAM, link="modunera.com/en/models/",
         note="Eight models, MD 1 to MD 8"),
    dict(slug="prices", label="PRICES", icon=icon_tag, glyph=0.36,
         ground=g.PAPER, ink=g.ROOF, link="modunera.com/en/price-comparison/",
         note="Price comparison across the five markets"),
    dict(slug="guides", label="GUIDES", icon=icon_book, glyph=None,
         ground=g.MOSS, ink=g.CREAM, link="modunera.com/en/guides/",
         note="Permits, delivery and comparison"),
    dict(slug="europe", label="EUROPE", icon=icon_pin, glyph=None,
         ground=g.CREAM, ink=g.MOSS_DEEP, link="modunera.com/en/countries/",
         note="Germany, Netherlands, Denmark, Luxembourg, Switzerland"),
    dict(slug="quality", label="QUALITY", icon=icon_gear, glyph=None,
         ground=g.CHARCOAL, ink=g.SAGE, link="modunera.com/en/advantages/",
         note="What a tiny house does well, and what it does not solve"),
    dict(slug="build", label="WHAT WE BUILD", icon=icon_hammer, glyph=None,
         ground=g.ROOF, ink=g.WHITE, link="modunera.com/en/services/",
         note="Modular, steel, bungalows and bespoke furniture"),
    dict(slug="production", label="PRODUCTION", icon=icon_truck, glyph=None,
         ground=g.SAGE, ink=g.MOSS_DEEP, link="modunera.com/en/production-faq/",
         note="Production, quality, delivery and purchase — 60 questions"),
    dict(slug="faq", label="FAQ", icon=icon_bubble, glyph=0.26,
         ground=g.PAPER, ink=g.MOSS_DEEP, link="modunera.com/en/faq/",
         note="Permits, delivery, customs and buying"),
    dict(slug="nature", label="NATURE", icon=icon_leaves, glyph=None,
         ground=g.CHARCOAL, ink=g.CREAM, link=None,
         note="Care on wooded sites. Not a sales highlight, and it has no link."),
]

# Set one: the logo's own backing, and the roof red on it. One pairing for all
# nine, which is the quieter row — it reads as a set of buttons rather than as
# nine decisions. 5.26:1, comfortably above the 3.0 an icon needs.
BRAND_GROUND, BRAND_INK = g.CREAM, g.ROOF


TARGET = 380 * SS               # the longest side of every icon's ink, normalised


def _draw_alone(spec, s: float, stroke: int) -> Image.Image:
    """One icon on its own transparent layer, so its ink can be measured."""
    pad = int(s * 0.6)
    layer = Image.new("LA", (int(s + pad * 2), int(s + pad * 2)), (0, 0))
    d = ImageDraw.Draw(layer)
    if spec.get("glyph"):
        spec["icon"](d, pad, pad, s, (255, 255), stroke,
                     font=g.F_TITLE(int(s * spec["glyph"])))
    else:
        spec["icon"](d, pad, pad, s, (255, 255), stroke)
    return layer


def cover(spec: dict, brand: bool = False) -> Image.Image:
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
    box = _draw_alone(spec, s, stroke).getbbox()
    s *= TARGET / max(box[2] - box[0], box[3] - box[1])

    layer = _draw_alone(spec, s, stroke)
    box = layer.getbbox()
    ink = layer.crop(box)

    ground = BRAND_GROUND if brand else spec["ground"]
    big = Image.new("RGB", (W * SS, H * SS), ground)
    tint = Image.new("RGB", ink.size, BRAND_INK if brand else spec["ink"])
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

    for name, brand in (("brand", True), ("varied", False)):
        out = OUT / name
        out.mkdir(parents=True, exist_ok=True)
        circles = []
        for spec in COVERS:
            im = cover(spec, brand=brand)
            im.save(out / f"{spec['slug']}.png", optimize=True)
            circles.append(circle_preview(im))

        gap = 22
        board = Image.new("RGB", (sum(c.width for c in circles) + gap * (len(circles) + 1),
                                  circles[0].height + gap * 2), (255, 255, 255))
        x = gap
        for c in circles:
            board.paste(c, (x, gap))
            x += c.width + gap
        board.save(out / "contact-sheet.jpg", quality=94, optimize=True)

        # and the row at the size it is actually read, which is where a busy icon dies
        small = [c.resize((44, 44), Image.LANCZOS) for c in circles]
        tiny = Image.new("RGB", (44 * len(small) + 12 * (len(small) + 1), 68), (255, 255, 255))
        x = 12
        for c in small:
            tiny.paste(c, (x, 12))
            x += 44 + 12
        tiny.resize((tiny.width * 2, tiny.height * 2), Image.NEAREST).save(
            out / "at-44px.jpg", quality=94)

    (OUT / "links.md").write_text(
        "# Highlight covers\n\n"
        "**Use `varied/`.** The single-colour set was rendered and set aside: one\n"
        "pairing across nine circles reads as a row of buttons, which is tidy and\n"
        "says nothing — the palette is doing no work. `brand/` stays in the tree as\n"
        "the alternative, not as the recommendation.\n\n"
        "Upload each as a story, then add it to a highlight and set the cover to that\n"
        "story. The name goes in Instagram's own field — the artwork carries no text,\n"
        "because Instagram already prints the name under the circle and a word inside\n"
        "it would be the same word twice.\n\n"
        "`at-44px.jpg` in each folder is the row at the size a phone draws it. An icon\n"
        "that only works in the big preview is an icon that does not work.\n\n"
        "| Name to type | File | Link to put in the highlight |\n|---|---|---|\n"
        + "".join(f"| {c['label']} | `{c['slug']}.png` | "
                 f"{'https://' + c['link'] if c['link'] else '—'} |\n" for c in COVERS)
        + "\n"
        + "".join(f"- **{c['label']}** — {c['note']}\n" for c in COVERS),
        encoding="utf8")

    print(json.dumps({"sets": ["brand", "varied"], "covers": len(COVERS),
                      "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
