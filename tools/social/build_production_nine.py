#!/usr/bin/env python3
"""The production nine — built, moved, handed over.

The launch nine opened the account with what the company makes. This set answers
the question that follows on every serious enquiry: HOW, and how does it get
here? The material arrived on 2026-08-21 in the owner's second Drive batch —
construction in the hall, fit-out before the walls close, units on trailers, one
on the road, two prepared for a delivery with flags on the facade. Real frames
of the two phases the account had never shown.

Same rules as the launch nine, because they are the account's rules, not the
set's: checkerboard with pictures on corners and centre so a card never touches
a card; only colour pairings the site itself uses; every ratio asserted at
render time; captions carry no claim a photograph or an existing page does not
back.

    1 workshop     2 steel-to-handover   3 fit-out kitchen
    4 width fact   5 on the road          6 last-metres card
    7 yard          8 final-check card    9 handover duo

Sources are the untouched copies in social/instagram/17-drive-2026-08-21/ —
HEIC among them, hence the opener registration.

Writes social/instagram/18-production-nine/post-N.jpg, grid.jpg, manifest.json

Usage: python3 tools/social/build_production_nine.py
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
import build_launch_nine as ln     # noqa: E402  check/check_rendered/sheet are generic

OUT = g.ROOT / "social/instagram/18-production-nine"
SRC2 = g.ROOT / "social/instagram/17-drive-2026-08-21"
SRC1 = g.ROOT / "social/instagram/16-drive-2026-08"

L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_HALL = dict(warmth=1.01, lift=0.05, contrast=1.14, saturation=0.90)
L_DUSK = dict(warmth=1.05, lift=0.05, contrast=1.12, saturation=0.98)

# name -> (file, look, vertical focus of the 4:5 crop)
PHOTOS = {
    "workshop": ("IMG_6037.HEIC", L_HALL, 0.52),
    "fitout":   ("IMG_3849.HEIC", L_HALL, 0.50),
    "road":     ("d9c3d6ca-4188-4ca1-ab9a-59311b8eb375.JPG", L_DUSK, 0.48),
    "yard":     ("96b30700-e8fe-458c-b326-318c2928c047.JPG", L_EXT, 0.55),
    "flags":    ("b93f484c-fded-4c20-89a0-b12ac521e558.JPG", L_EXT, 0.55),
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
    dict(n=1, role="picture", template="photo", key="workshop",
         title="BUILT, MID-SENTENCE",
         why="The set opens inside the hall: an A-frame with its cladding half "
             "done and the offcuts still on the floor. Nothing says 'we build "
             "this ourselves' like a frame nobody tidied for the camera."),

    dict(n=2, role="card", template="card",
         lines=["FROM STEEL", "TO HANDOVER."], size=84,
         ground=g.MOSS_DEEP, type_colour=g.CREAM, rule_colour=g.CREAM, light_type=True,
         why="The claim of the whole set, in the words /factory/ already uses. "
             "Forest ground, cream type — the pairing the launch nine proved."),

    dict(n=3, role="picture", template="photo", key="fitout",
         title="FILM STILL ON",
         why="A kitchen whose worktop still wears its protective film. The "
             "photograph does the arguing: fit-out happens in the hall, not on "
             "the plot."),

    dict(n=4, role="card", template="numeral", figure="2.55",
         label=["METRES WIDE —", "EVERY MODEL"],
         # numeral_post on a light ground draws the figure in roof red and the
         # label in ink; declared here so ln.check asserts the real pair.
         ground=g.PAPER, type_colour=g.ROOF, rule_colour=g.INK, light_type=False,
         why="The one number that makes road delivery possible, already public "
             "on the site. A numeral is where the eye rests between pictures."),

    dict(n=5, role="picture", template="photo", key="road",
         title="ON THE ROAD",
         why="The centre tile gets the strongest frame: a unit behind the tow "
             "vehicle at dusk, actually moving. The whole set pivots on it."),

    dict(n=6, role="card", template="card",
         lines=["THE LAST", "HUNDRED METRES", "ARE CHECKED", "FIRST."], size=62,
         ground=g.CHARCOAL, type_colour=g.CREAM, rule_colour=g.CREAM, light_type=True,
         why="The delivery promise the site makes on every country page, on the "
             "set's one near-black. It reads like method, not marketing."),

    dict(n=7, role="picture", template="photo", key="yard",
         title="READY TO LEAVE",
         why="Two units on tandem-axle trailers in the yard. Pairs with 5: "
             "before the road, and on it."),

    dict(n=8, role="card", template="card",
         lines=["CHECKED.", "LOADED.", "RELEASED."], size=84,
         ground=g.ROOF, type_colour=g.WHITE, rule_colour=g.CREAM, light_type=True,
         why="The loudest ground carries the shortest sentence in the set — the "
             "three steps between yard and road, in the order they happen."),

    dict(n=9, role="picture", template="duo", key="flags",
         statement=["HANDOVER", "DAY."],
         ground=g.PAPER, type_colour=g.INK, rule_colour=g.INK, light_type=False,
         why="Two units prepared for a delivery, flags of Türkiye and Azerbaijan "
             "on the facade. The duo band keeps the type off the photograph — "
             "the picture is the claim, and it needs no help."),
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
    # The whole plan goes to ln.check: it asserts colour pairs on flat grounds
    # AND the grid adjacency across all nine positions.
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
        "set": "production nine — built, moved, handed over",
        "arrangement": "3x3 checkerboard; a card never touches a card",
        "sources": "social/instagram/17-drive-2026-08-21 (owner's Drive, batch 2)",
        "posts": manifest,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

    print(json.dumps({"posts": len(PLAN), "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
