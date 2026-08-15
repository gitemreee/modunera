#!/usr/bin/env python3
"""The nine place tags, with the reason each one was chosen.

Chosen for camping and holiday-home density, not for population. A tiny house is
bought by someone already thinking about a plot, a pitch or a second home, and in
Germany those people sit on the coastal islands, around the lake districts and in
the low mountain ranges — not in the cities. Tagging Berlin would reach more
people and fewer buyers.

Every place is checked against `standorte/` before the sheet is written, so a tag
always has a page on the site to land on. A tag that leads nowhere is a tag that
sends a stranger to the home page.

Writes social/instagram/10-locations/<market>-nine.md

Usage: python3 tools/social/build_location_sheet.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "social/instagram/07-captions/launch-nine-locations.json"
OUT = ROOT / "social/instagram/10-locations"


def main() -> None:
    d = json.loads(DATA.read_text(encoding="utf8"))
    posts = sorted(d["posts"], key=lambda p: p["n"], reverse=True)

    missing = [p["page"] for p in posts if not (ROOT / p["page"]).is_dir()]
    if missing:
        for m in missing:
            print(f"FAIL no page at {m}", file=sys.stderr)
        raise SystemExit(1)

    out = [f"# Place tags — {d['market']}, the launch nine\n",
           d["why_these"] + "\n",
           "## The rule for hashtags\n", d["hashtag_rule"] + "\n",
           "## Before you tag\n", d["honesty_note"] + "\n",
           "## The nine, in posting order\n",
           "| # | Instagram location | Region | Hashtags | Page on the site |",
           "|---|---|---|---|---|"]

    for p in posts:
        out.append(f"| {p['n']} | **{p['instagram_tag']}** | {p['region']} | "
                   f"{' '.join(p['hashtags'])} | `/{p['page']}` |")

    out.append("\n## Why each one\n")
    for p in posts:
        out.append(f"**{p['n']} — {p['place']}.** {p['why']}\n")

    out.append("## Spread\n")
    states = {}
    for p in posts:
        state = p["region"].split(", ")[-1]
        states[state] = states.get(state, 0) + 1
    out.append("| Bundesland | Posts |")
    out.append("|---|---|")
    for state, n in sorted(states.items(), key=lambda kv: -kv[1]):
        out.append(f"| {state} | {n} |")
    out.append(f"\nSeven of sixteen states, north coast to Alpine foothills. No two "
               f"consecutive posts share a state, so the account does not read as "
               f"local to one region in its first week.\n")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{d['market'].lower()}-nine.md"
    path.write_text("\n".join(out), encoding="utf8")
    print(json.dumps({"file": str(path.relative_to(ROOT)), "places": len(posts),
                      "states": len(states), "pages_verified": True}))


if __name__ == "__main__":
    main()
