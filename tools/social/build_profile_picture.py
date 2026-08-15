#!/usr/bin/env python3
"""Profile picture options, built from the existing logo on the brand's own grounds.

The account currently sits on a warm beige that is in neither the site nor the
logo file. It is close enough to look deliberate and far enough to look like a
different company once the profile and the website are open side by side — which
is exactly the comparison a buyer makes.

No new logo is drawn. Two files exist and both are used as they are:

    modunera-mark-v1.png                          the house mark, red
    modunera-master-logo-mountain-v1-white-600.png  the full lockup, white

The mark is used rather than the lockup because Instagram renders the avatar at
about 32 px beside a comment and 56 px in the feed. At that size a wordmark is a
grey smudge; a symbol still reads. The lockup keeps its job at the top left of
every post, where it has room.

Each option is rendered at 1080 and again at 56 and 32, because the small sizes
are where an avatar is actually judged and where a light-on-light choice fails.

Writes social/instagram/09-profile/option-<x>.png and compare.jpg

Usage: python3 tools/social/build_profile_picture.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_instagram_grid as g  # noqa: E402

OUT = g.ROOT / "social/instagram/09-profile"
SIZE = 1080

# ground, which mark file, and the name it goes by
OPTIONS = [
    ("a-paper", g.PAPER, "mark", "The site's own body ground. The safest match — a "
                                 "visitor moving from the website sees the same white."),
    ("b-cream", g.CREAM, "mark", "The site's alternating section band. Warmer than "
                                 "paper and still a real token, closest to what the "
                                 "account uses now."),
    ("c-moss", g.MOSS_DEEP, "white", "Forest green with the white mark. The most "
                                     "distinctive at 32 px, because it is the only "
                                     "option that is dark — it holds its shape "
                                     "against a white feed."),
    ("d-roof", g.ROOF, "white", "The roof red as ground. Loudest, and it gives up "
                                "the red mark to do it."),
]


def circle(size: int, ground: tuple[int, int, int], mark: str) -> Image.Image:
    """The avatar as Instagram shows it: a circle, on a transparent square so the
    corners are not baked in."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    disc = Image.new("RGBA", (size, size), ground + (255,))
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    canvas.paste(disc, (0, 0), mask.resize((size, size), Image.LANCZOS))

    art = Image.open(g.BRAND / "modunera-mark-v1.png").convert("RGBA")
    art = art.crop(art.getbbox())
    if mark == "white":
        # The white lockup that ships is horizontal — mark on the left, wordmark on
        # the right — so there is no square white mark to use on a dark ground.
        # Rather than crop one out of a 600x151 file and inherit its rasterisation,
        # take the square mark's own alpha and fill it white. Same shape, same
        # file, in the white treatment the brand already has; no new artwork.
        alpha = art.getchannel("A")
        art = Image.new("RGBA", art.size, (255, 255, 255, 0))
        art.putalpha(alpha)

    # the mark occupies 46% of the diameter — inside the circle with real air, and
    # not so small that the avatar reads as an empty dot
    target = int(size * 0.46)
    art = art.resize((target, round(art.height * target / art.width)), Image.LANCZOS)
    canvas.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    return canvas


def on_white(im: Image.Image) -> Image.Image:
    """Composited onto white, which is the feed it will be seen against."""
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, (0, 0), im)
    return bg


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tiles = []
    for key, ground, mark, why in OPTIONS:
        full = circle(SIZE, ground, mark)
        full.save(OUT / f"option-{key}.png")

        # a strip showing 1080, 56 and 32 against the white the feed uses
        strip = Image.new("RGB", (300, 380), (255, 255, 255))
        strip.paste(on_white(full.resize((260, 260), Image.LANCZOS)), (20, 20))
        strip.paste(on_white(full.resize((56, 56), Image.LANCZOS)), (20, 300))
        strip.paste(on_white(full.resize((32, 32), Image.LANCZOS)), (96, 312))
        d = ImageDraw.Draw(strip)
        d.text((150, 306), key, font=g.F_BODY(20), fill=g.MUTED)
        d.text((150, 332), f"{g.contrast(g.WHITE, ground):.1f}:1 vs feed",
               font=g.F_BODY(17), fill=g.MUTED)
        tiles.append(strip)

    board = Image.new("RGB", (sum(t.width for t in tiles) + 18 * 3, 380), (255, 255, 255))
    x = 0
    for t in tiles:
        board.paste(t, (x, 0))
        x += t.width + 18
    board.save(OUT / "compare.jpg", quality=94, optimize=True)

    (OUT / "README.md").write_text(
        "# Profile picture\n\n"
        "Four options, all built from the two logo files already in `assets/brand/`.\n"
        "No new logo is drawn and neither file is modified.\n\n"
        "The mark is used rather than the full lockup: Instagram renders the avatar\n"
        "at roughly 32 px beside a comment, where a wordmark is a grey smudge and a\n"
        "symbol still reads. `compare.jpg` shows each option at 260, 56 and 32 px\n"
        "against the white the feed is seen on, because the small sizes are where\n"
        "the choice is actually made.\n\n"
        + "".join(f"* **{k}** — {w}\n" for k, _, _, w in OPTIONS)
        + "\nThe beige currently on the account is in neither the site nor the logo\n"
          "file. It reads as deliberate on its own and as a different company once\n"
          "the profile and the website are open together.\n",
        encoding="utf8")

    print({"options": [k for k, _, _, _ in OPTIONS],
           "compare": str((OUT / "compare.jpg").relative_to(g.ROOT))})


if __name__ == "__main__":
    main()
