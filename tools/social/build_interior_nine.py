#!/usr/bin/env python3
"""The interior nine — inside the eight metres.

The account has shown two acts. The launch nine (08) showed what the company
makes; the production nine (18) showed how it is built and how it gets to a
plot. Both stop at the door. Every serious enquiry ends up asking the third
question anyway — what is it like to be in one — and the feed has never
answered it.

The material was already in the repository and unused: of the twenty-one
photographs copied from the owner's Drive in August, the production nine spent
five, all of them hall and road. The strongest of the sixteen left are
interiors, which is the set this makes.

Same rules as the two sets before it, because they are the account's rules:
checkerboard with pictures on the corners and the centre so a card never
touches a card; only colour pairings the site itself uses; every ratio asserted
at render time; no figure that is not already public on the site. The one
number here, 9,70 m, comes from data/pricing.json, the file the model pages
read; the transport line on card 8 is the wording the country and transport
pages already use.

    1 the long view    2 set claim card   3 kitchen and ladder
    4 length numeral   5 living area      6 daylight card
    7 A-frame stair    8 delivery card    9 threshold duo

Sources are the untouched copies in social/instagram/16-drive-2026-08/ and
17-drive-2026-08-21/ — HEIC among them, hence the opener registration.

Writes social/instagram/20-interior-nine/post-N.jpg, grid.jpg, manifest.json

Usage: python3 tools/social/build_interior_nine.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g   # noqa: E402
import build_launch_nine as ln     # noqa: E402

OUT = g.ROOT / "social/instagram/20-interior-nine"
SRC2 = g.ROOT / "social/instagram/17-drive-2026-08-21"
SRC1 = g.ROOT / "social/instagram/16-drive-2026-08"

# Interiors are lit by their own windows, so they take less contrast than an
# exterior and no added warmth — the timber supplies that already.
L_BRIGHT = dict(warmth=1.00, lift=0.04, contrast=1.10, saturation=0.94)
L_WARM   = dict(warmth=1.03, lift=0.03, contrast=1.12, saturation=0.96)
L_MOODY  = dict(warmth=1.02, lift=0.06, contrast=1.08, saturation=0.92)

# name -> (file, look, vertical focus of the 4:5 crop)
PHOTOS = {
    "longview":  ("fb8b030f-1c7a-42e8-b2c1-7c8c4b5de23e.JPG", L_BRIGHT, 0.50),
    "kitchen":   ("IMG_4217.HEIC", L_MOODY, 0.52),
    "living":    ("IMG_9993.HEIC", L_WARM, 0.50),
    "aframe":    ("IMG_0372.JPG" , L_BRIGHT, 0.48),
    "threshold": ("IMG_6838.HEIC", L_WARM, 0.50),
}


def src(key: str) -> Path:
    name = PHOTOS[key][0]
    for d in (SRC2, SRC1):
        if (d / name).exists():
            return d / name
    raise FileNotFoundError(name)


def photo(key: str, title: str | None = None) -> Image.Image:
    _, look, focus = PHOTOS[key]
    return g.photo_post(src(key), title, focus, look)


PLAN = [
    dict(n=1, role="picture", template="photo", key="longview",
         title="THE LONG VIEW",
         why="The set opens on the frame that answers the question fastest: "
             "the whole length of a unit read end to end, shelves, worktop, "
             "window, bed. One picture does what a floor plan needs a page for."),

    dict(n=2, role="card", template="card",
         lines=["EIGHT METRES.", "FULLY LIVED IN."], size=76,
         ground=g.MOSS_DEEP, type_colour=g.CREAM, rule_colour=g.CREAM, light_type=True,
         why="The claim of the set, on the forest ground the launch nine proved. "
             "Eight metres is the shorter of the two public lengths, so the "
             "sentence is the modest version of the fact, not the flattering one."),

    dict(n=3, role="picture", template="photo", key="kitchen",
         title="KITCHEN, AND THE WAY UP",
         why="Worktop, hob and the ladder to the loft in a single frame. The "
             "ladder is the part people underestimate, so it belongs in the "
             "picture rather than in a caption arguing about it."),

    dict(n=4, role="card", template="numeral", figure="9,70",
         label=["METRES — THE", "LONGER PLAN"],
         ground=g.PAPER, type_colour=g.ROOF, rule_colour=g.INK, light_type=False,
         why="The length that governs everything inside, already public on the "
             "model pages via data/pricing.json. A numeral is where the eye "
             "rests between two pictures."),

    dict(n=5, role="picture", template="photo", key="living",
         title="WHERE THE SOFA GOES",
         why="The centre tile gets the frame the set is really selling: sofa, "
             "pendant, television, curtains. It was captioned EVENINGS first, "
             "which the picture does not back — there is still packaging in the "
             "corner. A furnished unit before anyone moves in is what this is, "
             "so that is what it says."),

    dict(n=6, role="card", template="card",
         lines=["DAYLIGHT FIRST.", "THEN WALLS."], size=70,
         ground=g.CHARCOAL, type_colour=g.CREAM, rule_colour=g.CREAM, light_type=True,
         why="How the plans are actually drawn, in six words, on the set's one "
             "near-black. It reads as method rather than marketing, which is the "
             "register the rest of the account keeps."),

    dict(n=7, role="picture", template="photo", key="aframe",
         title="UNDER THE GABLE",
         why="The A-frame interior: stair, truss, the pitch overhead. Pairs with "
             "3 — the two different ways up that the range offers."),

    dict(n=8, role="card", template="card",
         lines=["BY ROAD —", "IN PART", "BY RO-RO."], size=72,
         ground=g.ROOF, type_colour=g.WHITE, rule_colour=g.CREAM, light_type=True,
         why="How the room in the other eight pictures reaches a plot, in the "
             "site's own words. The transport pages are careful that Ro-Ro is a "
             "leg of a route and not a door-to-door service, so the card says "
             "'in part' rather than claiming the ship does the job."),

    dict(n=9, role="picture", template="duo", key="threshold",
         statement=["COME", "INSIDE."],
         ground=g.PAPER, type_colour=g.INK, rule_colour=g.INK, light_type=False,
         why="A doorway looking through to the kitchen and the stair — the set "
             "closes on the view you get standing in the door. The duo band "
             "keeps the type off the photograph entirely."),
]


def render(spec: dict) -> Image.Image:
    t = spec["template"]
    if t == "photo":
        return photo(spec["key"], spec.get("title"))
    if t == "card":
        return g.card_post(spec["lines"], spec["ground"], light_type=spec["light_type"],
                           size=spec["size"], type_colour=spec["type_colour"],
                           rule_colour=spec["rule_colour"])
    if t == "numeral":
        return g.numeral_post(spec["figure"], spec["label"], spec["ground"],
                              light_type=spec["light_type"])
    if t == "duo":
        _, look, focus = PHOTOS[spec["key"]]
        return g.duo_post(src(spec["key"]), spec["statement"], spec["ground"],
                          light_type=spec["light_type"], focus=focus, look=look,
                          type_colour=spec["type_colour"], rule_colour=spec["rule_colour"])
    raise ValueError(t)


def main() -> None:
    problems = ln.check(PLAN)
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    images = [render(spec) for spec in PLAN]

    rendered = ln.check_rendered(PLAN, images)
    if rendered:
        for p in rendered:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    for spec, im in zip(PLAN, images):
        im.save(OUT / f"post-{spec['n']}.jpg", quality=92, optimize=True)

    ln.sheet(images, OUT / "grid.jpg")

    manifest = []
    for s in PLAN:
        entry = {"n": s["n"], "role": s["role"], "template": s["template"],
                 "file": f"post-{s['n']}.jpg", "why": s["why"]}
        if s.get("ground") and s.get("type_colour"):
            entry["ground"] = "#%02X%02X%02X" % s["ground"]
            entry["type"] = "#%02X%02X%02X" % s["type_colour"]
            entry["contrast"] = round(g.contrast(s["type_colour"], s["ground"]), 2)
            entry["logo"] = "white" if s["light_type"] else "colour"
        if s.get("key"):
            entry["photograph"] = PHOTOS[s["key"]][0]
            entry["logo"] = "white"
        manifest.append(entry)

    (OUT / "manifest.json").write_text(json.dumps({
        "set": "interior nine — inside the eight metres",
        "arrangement": "3x3 checkerboard; a card never touches a card",
        "sources": "social/instagram/16-drive-2026-08 and 17-drive-2026-08-21 "
                   "(owner's Drive), photographs unused by the production nine",
        "figures": "9,70 m / 44.900 € — data/pricing.json, the file the model pages read",
        "posts": manifest,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

    print(json.dumps({"posts": len(PLAN), "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
