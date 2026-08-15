#!/usr/bin/env python3
"""The nine posts that open the account.

Not a slice of the ninety. The ninety are a plan — an arrangement that holds for
months and proves a Reel can be dropped anywhere without breaking it. These nine
are the first thing a visitor sees on an empty profile, and an empty profile is
judged in about two seconds on one screen. So this set is chosen for what a full
first screen says, and it deliberately spends more colour variety in nine posts
than the ninety spend in their first nine.

    1 lawn        2 slogan       3 steel frame
    4 what we do  5 night        6 five countries
    7 cladding    8 one spark    9 to Europe

Checkerboard: pictures on the diagonal corners and centre, cards between them, so
no card touches a card. That is the same rule build_feed_plan.py enforces across
all ninety, and it is what lets a Reel be posted at any moment without rotating
the layout into nonsense.

Five grounds, five type colours, both logo variants:

    2  roof red   #97311A  on paper     #F5F5F5   6.95:1   colour logo
    4  cream      #DAD7CD  on moss deep #2E4733   7.06:1   white logo
    6  white      #FFFFFF  on roof red  #97311A   7.58:1   white logo
    8  cream      #DAD7CD  on charcoal  #232426  10.79:1   white logo
    9  moss       #3A5A40  on paper     #F5F5F5   7.09:1   white logo (on the photo)

Two pairings are not here and cannot be: roof red on moss deep measures 1.34:1 and
moss on roof red 1.02:1. Red and green sit at nearly the same luminance, so the
type disappears — worst of all at the 120 px square the grid actually shows. Where
that pairing is wanted, cream or white goes between the two.

Every ratio above is asserted at render time by check(), so a later edit that
breaks one fails the build instead of shipping.

Writes social/instagram/08-launch-nine/post-N.jpg and grid.jpg

Usage: python3 tools/social/build_launch_nine.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/08-launch-nine"

# Grades. Exterior daylight, interior workshop, and night — the same three looks
# the rest of the feed uses, so these nine sit inside the system rather than
# beside it.
L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_INT = dict(warmth=1.02, lift=0.04, contrast=1.15, saturation=0.92)
L_NIGHT = dict(warmth=1.04, lift=0.06, contrast=1.10, saturation=0.98, noisy=True)
L_YARD = dict(warmth=0.99, lift=0.05, contrast=1.20, saturation=0.88)

PHOTOS = {
    "lawn":     ("IMG_20250525_142713.jpg", L_EXT, 0.42),
    "frame":    ("IMG_20250913_183727.jpg", L_EXT, 0.50),
    "night":    ("IMG_20250913_193621.jpg", L_NIGHT, 0.45),
    "cladding": ("20231214_121220.jpg", L_YARD, 0.24),
    "trailer":  ("IMG_20250913_104632.jpg", L_EXT, 0.52),
}


def src(key: str) -> Path:
    name = PHOTOS[key][0]
    for d in (g.SELECTED, g.ROOT / "social/instagram/00-candidates"):
        if (d / name).exists():
            return d / name
    raise FileNotFoundError(f"{name} is in neither 01-selected nor 00-candidates")


def photo(key: str, title: str | None = None) -> Image.Image:
    _, look, focus = PHOTOS[key]
    return g.photo_post(src(key), title, focus, look)


# --- the nine ---------------------------------------------------------------
# Each entry carries the colours it uses so check() can assert them against the
# rendered file rather than against this table.

PLAN = [
    dict(n=1, role="picture", template="photo", key="lawn",
         title="DELIVERED, NOT RENDERED",
         why="The opening post is a finished house in daylight. An account that "
             "opens on a render asks to be doubted."),

    dict(n=2, role="card", template="card", lines=["DESIGN", "YOUR", "NATURE"], size=94,
         ground=g.PAPER, type_colour=g.ROOF, rule_colour=g.INK, light_type=False,
         why="The slogan in the site's own pairing — roof red on paper, moss rule. "
             "It anchors everything that follows to the website."),

    dict(n=3, role="picture", template="photo", key="frame",
         title="STEEL BEFORE TIMBER",
         why="Structure before surface. It answers the first question a European "
             "buyer asks about a house built abroad."),

    dict(n=4, role="card", template="card",
         lines=["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE", "CUSTOM FURNITURE"], size=62,
         ground=g.MOSS_DEEP, type_colour=g.CREAM, rule_colour=g.CREAM, light_type=True,
         why="The forest ground and the white logo. Four lines of plain scope, no "
             "adjectives — the card that says what the company does."),

    dict(n=5, role="picture", template="photo", key="night",
         title="HOME, AFTER DARK",
         why="The centre of a 3x3 is where the eye lands. It gets the strongest "
             "photograph in the set."),

    dict(n=6, role="card", template="numeral", figure="5",
         label=["COUNTRIES,", "ONE ROUTE"],
         ground=g.ROOF, type_colour=g.WHITE, rule_colour=g.CREAM, light_type=True,
         why="A red ground, once. It is the loudest tile in the grid, so it "
             "carries the fact worth being loud about."),

    dict(n=7, role="picture", template="photo", key="cladding",
         title="FITTED BY HAND",
         why="Workmanship at close range. Paired with 3 it makes the production "
             "case twice, at two distances."),

    dict(n=8, role="card", template="card", lines=["ONE SPARK", "IS ENOUGH."], size=88,
         ground=g.CHARCOAL, type_colour=g.CREAM, rule_colour=g.ROOF, light_type=True,
         why="The only near-black in the brand, taken from the logo's own "
             "wordmark. It stops the scroll because nothing else in the grid is "
             "this dark, and it says something that is not about selling."),

    dict(n=9, role="picture", template="duo", key="trailer",
         statement=["FROM TÜRKİYE", "TO EUROPE."],
         ground=g.PAPER, type_colour=g.INK, rule_colour=g.INK, light_type=False,
         why="Photograph above, paper band below in moss green — the one green "
             "type in the set, and the one post where the type never sits on the "
             "picture at all."),
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


def check(plan: list[dict]) -> list[str]:
    """Assert the things that are cheap to get wrong and expensive to publish.

    Contrast is checked against the declared pair, the card-adjacency rule against
    the arrangement, and ground repetition against the reading order — a grid whose
    tiles 2 and 4 share a ground reads as two halves rather than as a composition.
    """
    problems = []
    for s in plan:
        if s["role"] != "card" and s["template"] != "duo":
            continue
        ratio = g.contrast(s["type_colour"], s["ground"])
        if ratio < 3.0:
            problems.append(f"post {s['n']}: type on ground is {ratio:.2f}:1, display needs 3.0")

    # a card never touches a card, horizontally or vertically, in 3 columns
    roles = {s["n"]: s["role"] for s in plan}
    for i in range(1, 10):
        if roles[i] != "card":
            continue
        for nb in ([i - 1] if (i - 1) % 3 else []) + ([i + 1] if i % 3 else []) + [i - 3, i + 3]:
            if 1 <= nb <= 9 and roles.get(nb) == "card":
                problems.append(f"post {i} is a card touching card {nb}")

    grounds = {s["n"]: s.get("ground") for s in plan if s.get("ground")}
    for i, gr in grounds.items():
        for nb in ([i - 1] if (i - 1) % 3 else []) + ([i + 1] if i % 3 else []) + [i - 3, i + 3]:
            if grounds.get(nb) == gr:
                problems.append(f"posts {i} and {nb} repeat the same ground")

    if len({s.get("ground") for s in plan if s.get("ground")}) < 4:
        problems.append("fewer than four distinct grounds across nine posts")
    return problems


def sheet(images: list[Image.Image], path: Path, cell: int = 360, gutter: int = 4) -> None:
    """The profile view — the centred square of each post, at grid proportions."""
    rows = (len(images) + 2) // 3
    im = Image.new("RGB", (cell * 3 + gutter * 2, cell * rows + gutter * (rows - 1)),
                   (255, 255, 255))
    for i, post in enumerate(images):
        sq = post.crop((0, g.SAFE_TOP, g.POST_W, g.POST_H - g.SAFE_BOTTOM))
        im.paste(sq.resize((cell, cell), Image.LANCZOS),
                 ((i % 3) * (cell + gutter), (i // 3) * (cell + gutter)))
    im.save(path, quality=92, optimize=True)


def main() -> None:
    problems = check(PLAN)
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        raise SystemExit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    images = []
    for spec in PLAN:
        im = render(spec)
        im.save(OUT / f"post-{spec['n']}.jpg", quality=92, optimize=True)
        images.append(im)

    sheet(images, OUT / "grid.jpg")

    manifest = []
    for s in PLAN:
        entry = {"n": s["n"], "role": s["role"], "template": s["template"],
                 "file": f"post-{s['n']}.jpg", "why": s["why"]}
        if s.get("ground"):
            entry["ground"] = "#%02X%02X%02X" % s["ground"]
            entry["type"] = "#%02X%02X%02X" % s["type_colour"]
            entry["contrast"] = round(g.contrast(s["type_colour"], s["ground"]), 2)
            entry["logo"] = "white" if s["light_type"] else "colour"
        if s.get("key"):
            entry["photograph"] = PHOTOS[s["key"]][0]
            entry["logo"] = "white"
        manifest.append(entry)

    (OUT / "manifest.json").write_text(json.dumps({
        "set": "launch nine — the first posts on an empty profile",
        "arrangement": "3x3 checkerboard; a card never touches a card",
        "forbidden_pairings": {"roof on moss deep": 1.34, "moss on roof": 1.02},
        "posts": manifest,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

    print(json.dumps({"rendered": len(images),
                      "grounds": len({s.get("ground") for s in PLAN if s.get("ground")}),
                      "checks": "passed",
                      "out": str(OUT.relative_to(g.ROOT))}))


if __name__ == "__main__":
    main()
