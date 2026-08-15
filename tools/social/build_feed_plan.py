#!/usr/bin/env python3
"""The ninety-post feed, built on arrangement A.

Arrangement A was chosen because it is the only one that survives a Reel. Its
rule is about adjacency, not position:

    a card never touches a card — not beside it, not above or below it

That relationship holds between neighbours, so when a Reel pushes every tile
along by one the pattern shifts without breaking. A column rule would not.

The consequence is arithmetical and worth stating: in a three-column grid the
largest set of cells where no two touch is a checkerboard, which is half of them.
So at most 45 of 90 posts can be cards, and at least 45 must carry a picture.
That is the real constraint on this feed — not ideas, pictures.

    11 real photographs x 2 crops   = 22
    26 model renders, marked CONCEPT = 26
                                       48 picture tiles

Enough, with four to spare. Every real photograph appears twice, in a different
crop with a different caption; every render appears once. Seeing the same house
twice across ninety posts is honest and unavoidable at this archive size, and the
answer is more photography, not more repetition — the series below are sized so
new frames drop in without rebuilding anything.

Content comes from the files the website is built from — data/pricing.json,
data/production-faq.json, data/news.json — so a post cannot quote a figure the
site has moved on from.

Writes  data/social-posts.json           the plan, one entry per post
        social/instagram/03-grid-preview/feed-90.jpg
        social/instagram/04-post-drafts/ (with --render)

Usage: python3 tools/social/build_feed_plan.py [--render]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402
import build_grid_options as o  # noqa: E402

RENDER = "--render" in sys.argv
GALLERY = g.ROOT / "assets/images/gallery"
FAQ = json.loads((g.ROOT / "data/production-faq.json").read_text(encoding="utf8"))
PRICING = json.loads((g.ROOT / "data/pricing.json").read_text(encoding="utf8"))["models"]

MODEL_NAMES = {
    "mc1": ("MD 1", "Panorama and loft", "Living · holiday home"),
    "mc2": ("MD 2", "Two lofts", "Families"),
    "mc3": ("MD 3", "Loft plus room", "Living · rental"),
    "mc4": ("MD 4", "Loft, room, veranda", "Hospitality"),
    "mc5": ("MD 5", "Compact plus room", "Office · studio"),
    "mc6": ("MD 6", "Chalet concept", "Mountain sites · resort"),
    "mc7": ("MD 7", "Entry model", "First project"),
    "mc8": ("MD 8", "Compact, upgraded", "Retreat"),
}

# Real photographs, each used twice: a wide read and a closer one.
PHOTO_POSTS = [
    ("grove",    None,                      0.50), ("grove",    "UNDER THE OLIVES",     0.30),
    ("lawn",     None,                      0.42), ("lawn",     "ROOM TO STAND BACK",   0.62),
    ("night",    "HOME, AFTER DARK",        0.45), ("night",    "LIGHT THAT STAYS IN",  0.62),
    ("deck",     "THE DECK IS THE ROOM",    0.50), ("deck",     "TIMBER, CLOSE UP",     0.74),
    ("kitchen",  "MADE AROUND YOU",         0.42), ("kitchen",  "A KITCHEN THAT WORKS", 0.66),
    ("loft",     "SPACE TO BREATHE",        0.66), ("loft",     "STAIRS THAT STORE",    0.40),
    ("wood",     "WARM TO THE TOUCH",       0.50), ("wood",     "GRAIN AND LIGHT",      0.30),
    ("stair",    "EVERY STEP EARNS ITS PLACE", 0.50), ("stair", "WHITE AND OAK",        0.68),
    ("cladding", "BUILT WITH PURPOSE",      0.24), ("cladding", "CLADDING GOES ON",     0.62),
    ("frame",    "FROM FRAME TO FINISH",    0.50), ("frame",    "STEEL FIRST",          0.26),
    ("trailer",  "FROM TÜRKİYE TO EUROPE",  0.52), ("trailer",  "READY TO TRAVEL",      0.30),
]

# Renders. Marked CONCEPT on the artwork, per the brief's own rule.
RENDER_DUOS = [
    ("mc1-exterior.webp", ["ONE SHELL.", "EIGHT PLANS."]),
    ("mc3-exterior.webp", ["PLANNED", "AROUND USE."]),
    ("mc5-exterior.webp", ["COMPACT,", "NOT SMALL."]),
    ("mc7-solar.webp",    ["OFF-GRID", "READY."]),
    ("mc8-angle.webp",    ["EVERY ANGLE", "CONSIDERED."]),
    ("mc4-exterior.webp", ["A VERANDA", "CHANGES IT."]),
]
RENDER_DETAILS = [
    "mc1-living.webp", "mc1-loft.webp", "mc2-kitchen.webp", "mc2-living.webp",
    "mc3-living.webp", "mc3-loft.webp", "mc4-bedroom.webp", "mc4-living.webp",
    "mc5-interior.webp", "mc5-loft.webp", "mc6-bedroom.webp", "mc6-living.webp",
    "mc6-exterior.webp", "mc7-interior.webp", "mc7-exterior.webp", "mc8-interior.webp",
    "mc8-exterior.webp", "mc2-exterior.webp", "nature-pool.webp", "hero-forest.webp",
]

STATEMENTS_LIGHT = [
    ["DESIGN", "YOUR", "NATURE"], ["MINIMAL.", "MODERN.", "NATURAL."],
    ["LESS HOUSE.", "MORE", "FREEDOM."], ["BUILT", "TO LAST."],
    ["MADE", "TO ORDER."], ["FORM", "FOLLOWS", "THE SITE."],
    ["QUIET", "BY DESIGN."], ["SMALL", "PLAN.", "LONG VIEW."],
]
STATEMENTS_DARK = [
    ["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE", "CUSTOM FURNITURE"],
    ["BUILT", "FOR FOUR", "SEASONS."], ["ONE TEAM,", "FRAME TO", "FURNITURE."],
    ["DRAWN,", "BUILT,", "DELIVERED."], ["NOTHING", "SPARE."],
    ["THE SITE", "DECIDES", "THE PLAN."], ["HONEST", "MATERIALS."],
    ["SPACE,", "NOT", "SQUARE METRES."],
]
NUMERALS = [
    ("8", ["MODELS,", "ONE SYSTEM"], True), ("5", ["COUNTRIES,", "ONE ROUTE"], False),
    ("2.55", ["METRES WIDE,", "ROAD LEGAL"], False), ("4", ["SEASONS,", "ONE BUILD"], True),
    ("60", ["QUESTIONS,", "ANSWERED"], False), ("1", ["TEAM,", "START TO FINISH"], True),
]
# Questions taken verbatim from the production FAQ, so the feed and the site agree.
FAQ_IDS = ["p1", "p3", "s1", "s4", "c1", "v2", "w1", "w2", "d1", "d4", "g1", "f2", "pr1", "pr4"]


def faq_card(qid: str):
    q = next((x for x in FAQ["questions"] if x["id"] == qid), None)
    if not q or not q["q"].get("en"):
        return None
    # The question mark stays. Without it the card reads as an unfinished
    # statement rather than as a question the caption is about to answer.
    words = q["q"]["en"].replace("MODUNERA ", "").upper().split()
    lines, line = [], ""
    for w in words:
        if len(line) + len(w) + 1 > 16 and line:
            lines.append(line); line = w
        else:
            line = f"{line} {w}".strip()
    if line:
        lines.append(line)
    return lines[:4]


def build_plan():
    """Every post, tagged card or picture, before placement."""
    pictures, cards = [], []

    for key, title, focus in PHOTO_POSTS:
        pictures.append({"kind": "photo", "key": key, "title": title, "focus": focus,
                         "series": "photography"})
    for src, lines in RENDER_DUOS:
        pictures.append({"kind": "duo", "src": src, "lines": lines, "series": "models",
                         "concept": True})
    for src in RENDER_DETAILS:
        pictures.append({"kind": "detail", "src": src, "series": "models", "concept": True})

    for code, (label, name, sub) in MODEL_NAMES.items():
        cards.append({"kind": "spec", "code": code, "label": label, "name": name, "sub": sub,
                      "series": "specification"})
    for lines in STATEMENTS_LIGHT:
        cards.append({"kind": "cream", "lines": lines, "series": "voice"})
    for lines in STATEMENTS_DARK:
        cards.append({"kind": "forest", "lines": lines, "series": "voice"})
    for fig, label, dark in NUMERALS:
        cards.append({"kind": "numeral", "figure": fig, "label": label, "dark": dark,
                      "series": "figures"})
    for qid in FAQ_IDS:
        lines = faq_card(qid)
        if lines:
            cards.append({"kind": "forest" if len(cards) % 2 else "cream", "lines": lines,
                          "size": 56, "series": "questions", "faq_id": qid})
    return pictures, cards


def interleave(groups):
    """Round-robin across series, so the feed never runs eight of the same thing.

    Built by series rather than shuffled, because a shuffle is not reproducible
    and this file has to render the same feed every time it runs."""
    out, i = [], 0
    groups = [list(gr) for gr in groups if gr]
    while any(groups):
        gr = groups[i % len(groups)]
        if gr:
            out.append(gr.pop(0))
        if not gr:
            groups = [x for x in groups if x]
            i = 0 if not groups else i % len(groups)
            continue
        i += 1
    return out


def order(pictures, cards):
    """Cards cycle through their series; pictures alternate photograph and render,
    so a real house is never more than one tile from the last one."""
    by = {}
    for c in cards:
        by.setdefault(c["series"], []).append(c)
    # voice is the largest group; splitting it in two keeps it from dominating the cycle
    voice = by.pop("voice", [])
    groups = [by.get("specification", []), voice[::2], by.get("questions", []),
              voice[1::2], by.get("figures", [])]
    ordered_cards = interleave(groups)

    photos = [p for p in pictures if p["series"] == "photography"]
    renders = [p for p in pictures if p["series"] == "models"]
    ordered_pictures = interleave([photos, renders])
    return ordered_pictures, ordered_cards


def place(pictures, cards, total=90, cols=3):
    """Lay the feed out so no card touches a card.

    Walks the grid and puts a card wherever both neighbours already placed — the
    one to the left and the one above — are pictures. Anything else takes a
    picture. That is the checkerboard, derived from the rule rather than hardcoded,
    which is why it still holds when the counts change.
    """
    feed, pi, ci = [], 0, 0
    for i in range(total):
        left = feed[i - 1] if i % cols else None
        above = feed[i - cols] if i >= cols else None
        can_card = (left is None or left["role"] == "picture") and \
                   (above is None or above["role"] == "picture")
        if can_card and ci < len(cards):
            item = dict(cards[ci]); item["role"] = "card"; ci += 1
        else:
            item = dict(pictures[pi % len(pictures)]); item["role"] = "picture"
            item["repeat"] = pi // len(pictures)
            pi += 1
        item["position"] = i + 1
        feed.append(item)
    return feed, {"cards_used": ci, "cards_available": len(cards),
                  "pictures_used": pi, "pictures_available": len(pictures)}


def check(feed, cols=3):
    """The rule, asserted rather than assumed."""
    bad = []
    for i, post in enumerate(feed):
        if post["role"] != "card":
            continue
        if i % cols and feed[i - 1]["role"] == "card":
            bad.append(f"{i+1} beside {i}")
        if i >= cols and feed[i - cols]["role"] == "card":
            bad.append(f"{i+1} below {i+1-cols}")
    return bad


def render(post):
    if post["kind"] == "photo":
        _, look, _ = o.P[post["key"]]
        return g.photo_post(o.src(post["key"]), post["title"], post["focus"], look)
    if post["kind"] == "duo":
        return g.duo_post(GALLERY / post["src"], post["lines"], g.MOSS_DEEP, True, 0.5, True,
                          dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94))
    if post["kind"] == "detail":
        return g.detail_post(GALLERY / post["src"], 0.5, True,
                             dict(warmth=1.02, lift=0.04, contrast=1.15, saturation=0.92))
    if post["kind"] == "spec":
        return g.spec_post(post["label"], post["name"], post["sub"], g.model_rows(post["code"]))
    if post["kind"] == "numeral":
        return g.numeral_post(post["figure"], post["label"],
                              g.MOSS_DEEP if post["dark"] else g.LIGHT_GROUND, post["dark"])
    ground = g.MOSS_DEEP if post["kind"] == "forest" else g.LIGHT_GROUND
    return g.card_post(post["lines"], ground, light_type=post["kind"] == "forest",
                       size=post.get("size", 88))


def main():
    pictures, cards = build_plan()
    pictures, cards = order(pictures, cards)
    feed, stats = place(pictures, cards)
    broken = check(feed)

    (g.ROOT / "data/social-posts.json").write_text(json.dumps({
        "_comment": "The ninety-post feed on arrangement A. The rule is adjacency — a card "
                    "never touches a card — so a Reel posted at any time shifts the grid "
                    "without breaking it. Generated by tools/social/build_feed_plan.py.",
        "arrangement": "A", "rule": "no card adjacent to a card, horizontally or vertically",
        "reels": "a Reel counts as a picture tile and may be posted at any position",
        "stats": stats, "rule_violations": broken, "posts": feed,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

    print(json.dumps({"posts": len(feed), **stats, "rule_violations": len(broken),
                      "by_series": {s: sum(1 for p in feed if p["series"] == s)
                                    for s in sorted({p["series"] for p in feed})}}))

    if RENDER:
        images = [render(p) for p in feed]
        cell, gut = 190, 3
        rows = len(images) // 3
        sheet = g.Image.new("RGB", (cell * 3 + gut * 2, cell * rows + gut * (rows - 1)), (255, 255, 255))
        for i, im in enumerate(images):
            sq = im.crop((0, g.SAFE_TOP, g.POST_W, g.POST_H - g.SAFE_BOTTOM)).resize((cell, cell), g.Image.LANCZOS)
            sheet.paste(sq, ((i % 3) * (cell + gut), (i // 3) * (cell + gut)))
        sheet.save(g.PREVIEW / "feed-90.jpg", quality=88, optimize=True)
        for i, im in enumerate(images, start=1):
            im.save(g.DRAFTS / f"post-{i:02d}.jpg", quality=86, optimize=True)
        print(json.dumps({"rendered": len(images), "sheet": "social/instagram/03-grid-preview/feed-90.jpg"}))


if __name__ == "__main__":
    main()
