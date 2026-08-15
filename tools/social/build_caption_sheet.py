#!/usr/bin/env python3
"""The captions as something you can post from, rather than a JSON file.

Generated from the caption file and the render manifest together, so the sheet
cannot drift from what was actually built: the colours, contrast ratios and
reasons printed beside each caption are read out of the manifest, not retyped.

On posting order, which is easy to get backwards. Instagram puts the **most
recent** post at the top left and fills right and down in reverse chronological
order. So the post that should end up at the top left has to be published *last*.
For a numbered set laid out as grid.jpg shows it, that means publishing from the
highest number down to 1 — nine first, one last.

That reversal is also why the checkerboard survives it. Reversing a sequence in a
three-column grid is a 180-degree rotation, and rotation preserves adjacency, so
"a card never touches a card" holds whichever direction the set is published in.

Two sheets come out of the same data:

  <set>.md        the full reference — both languages, the full hashtag sets, the
                  "not said, and why" list, and the treatment behind each post
  <set>-post.md   what you actually post from — one block per post, five hashtags,
                  the place tag, and nothing else to scroll past

The five-tag sheet exists because Instagram's own limit on this account is five,
and because five is a better number anyway: the generic category tags are the most
contested terms in the market and a new account does not rank in them, whereas a
regional tag is a small pool of people who are already there.

Writes social/instagram/07-captions/<set>.md and <set>-post.md

Usage: python3 tools/social/build_caption_sheet.py [set]
       set defaults to launch-nine
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAPTIONS = ROOT / "social/instagram/07-captions"
MANIFESTS = {"launch-nine": ROOT / "social/instagram/08-launch-nine/manifest.json"}


def build(name: str) -> Path:
    entries = json.loads((CAPTIONS / f"{name}.json").read_text(encoding="utf8"))
    posts = json.loads(MANIFESTS[name].read_text(encoding="utf8"))["posts"]
    by_n = {p["n"]: p for p in posts}
    high, low = max(by_n), min(by_n)

    out = [
        f"# MODUNERA — {name.replace('-', ' ')}\n",
        "## Posting order\n",
        f"**Publish from {high} down to {low}.** Instagram puts the most recent post at",
        "the top left, so the post you want in that corner has to go up last. Publishing",
        f"{low} first would mirror the layout: {low} would land bottom right and the grid",
        "would come out reversed.\n",
        "The arrangement itself survives either direction — reversing a sequence in a",
        "three-column grid is a 180-degree rotation, and rotation preserves adjacency, so",
        "no card ends up touching a card. Only the composition would be back to front.\n",
        "Each caption below is one block: English first, German under a rule, hashtags",
        "last. Copy the whole block.\n",
        "---\n",
    ]

    for e in sorted(entries, key=lambda x: x["n"], reverse=True):
        m = by_n[e["n"]]
        bits = [f"`{m['file']}`", m["role"]]
        if m.get("ground"):
            bits.append(f"{m['type']} on {m['ground']} — {m['contrast']}:1")
        if m.get("photograph"):
            bits.append(m["photograph"])
        bits.append(f"{m['logo']} logo")

        out.append(f"## {e['n']} · {' · '.join(bits)}\n")
        out.append(f"*{m['why']}*\n")
        tags = " ".join(dict.fromkeys(e["hashtags_en"] + e["hashtags_de"]))
        out.append("```\n" + e["en"] + "\n\n—\n\n" + e["de"] + "\n\n" + tags + "\n```\n")
        if e.get("unsourced"):
            out.append("Not said, and why:\n")
            out += [f"- {u}" for u in e["unsourced"]]
            out.append("")
        out.append("---\n")

    path = CAPTIONS / f"{name}.md"
    path.write_text("\n".join(out), encoding="utf8")
    return path


def strip_domain_line(text: str) -> str:
    """Remove a bare modunera.com line the caption already ends with.

    Post 1 signs off with the domain in both languages. Once the sheet appends a
    link line of its own, leaving that in prints the address twice in one caption,
    which reads as a mistake rather than as emphasis.
    """
    lines = [l for l in text.split("\n") if l.strip() != "modunera.com"]
    return "\n".join(lines).rstrip()


def build_post_sheet(name: str) -> Path:
    """The posting sheet: one block per post, five hashtags, and the place tag.

    Deliberately thinner than the reference sheet. This one is read on a phone
    with the Instagram composer open, so everything that is not copied out of it
    is in the way.
    """
    entries = {e["n"]: e for e in
               json.loads((CAPTIONS / f"{name}.json").read_text(encoding="utf8"))}
    loc = json.loads((CAPTIONS / f"{name}-locations.json").read_text(encoding="utf8"))
    places = {p["n"]: p for p in loc["posts"]}
    order = sorted(entries, reverse=True)

    out = [
        f"# MODUNERA — {name.replace('-', ' ')}, ready to post\n",
        f"**Publish {order[0]} first and {order[-1]} last.** Instagram puts the most recent",
        "post at the top left, so the post you want in that corner goes up last. Work",
        "down this page in order.\n",
        "Each block is one caption: English, a rule, German, the page on the site, then",
        "five hashtags. Copy the whole block. The place tag goes in Instagram's own",
        "location field, not in the caption.\n",
        f"> **On the address line.** {loc['link_rule']}\n",
        f"> **On the place tag.** {loc['honesty_note']}\n",
        "---\n",
    ]

    for n in order:
        e, p = entries[n], places[n]
        out.append(f"## {n} · `post-{n}.jpg`\n")
        out.append(f"**Location:** {p['instagram_tag']} — {p['region']}\n")
        block = strip_domain_line(e["en"]) + "\n\n—\n\n" + strip_domain_line(e["de"])
        if p.get("link"):
            block += f"\n\n{p['link']}"
        block += "\n\n" + " ".join(p["hashtags"])
        out.append("```\n" + block + "\n```\n")
        out.append("---\n")

    path = CAPTIONS / f"{name}-post.md"
    path.write_text("\n".join(out), encoding="utf8")
    return path


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "launch-nine"
    made = [build(name), build_post_sheet(name)]
    print(json.dumps({"set": name,
                      "files": [str(p.relative_to(ROOT)) for p in made]}))


if __name__ == "__main__":
    main()
