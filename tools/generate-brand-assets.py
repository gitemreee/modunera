#!/usr/bin/env python3
"""Derive the shipped brand assets from the two master files.

Not part of the four-command build pipeline: it needs Pillow, which CI does not
install, and the outputs are committed. Re-run it only when a master file
changes:

    pip install Pillow
    python3 tools/generate-brand-assets.py

Inputs (kept unchanged, never deleted):
    assets/brand/modunera-master-logo-mountain-v1.png   2172x724, RGBA
    assets/brand/modunera-digital-sunrise-glow-v1.png   1774x887, RGB

Outputs:
    modunera-master-logo-mountain-v1-{300,600,900}.png  header/footer lockup
    modunera-master-logo-mountain-v1-white-600.png      for charcoal surfaces
    modunera-digital-sunrise-glow-v1-{900,1400}.webp    hero, plus a jpg fallback
    modunera-mark-v1.png                                square mark, favicon/manifest
"""

from pathlib import Path
from PIL import Image

BRAND = Path(__file__).resolve().parent.parent / "assets" / "brand"
MASTER = BRAND / "modunera-master-logo-mountain-v1.png"
GLOW = BRAND / "modunera-digital-sunrise-glow-v1.png"


def trimmed(image):
    """Crop the transparent margin so the lockup fills its box predictably."""
    return image.crop(image.split()[3].getbbox())


def resize_to_width(image, width):
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.LANCZOS)


def main():
    master = trimmed(Image.open(MASTER).convert("RGBA"))
    print(f"master trimmed to {master.width}x{master.height} "
          f"(ratio {master.width / master.height:.3f})")

    for width in (300, 600, 900):
        out = BRAND / f"modunera-master-logo-mountain-v1-{width}.png"
        resize_to_width(master, width).save(out, optimize=True)
        print(f"  {out.name}: {out.stat().st_size // 1024} KB")

    # A white lockup for the charcoal footer and the glow band. Recolouring the
    # opaque pixels beats a CSS brightness/invert filter, which also washes out
    # the terracotta mark's antialiasing.
    white = Image.new("RGBA", master.size, (255, 255, 255, 0))
    white.putalpha(master.split()[3])
    out = BRAND / "modunera-master-logo-mountain-v1-white-600.png"
    resize_to_width(white, 600).save(out, optimize=True)
    print(f"  {out.name}: {out.stat().st_size // 1024} KB")

    # Square mark for the favicon and the web manifest: the mountain "M" only,
    # which sits left of the gap the wordmark leaves at roughly 28% width.
    gap = int(master.width * 0.29)
    mark = master.crop((0, 0, gap, master.height))
    mark = mark.crop(mark.split()[3].getbbox())
    side = max(mark.size)
    pad = round(side * 0.16)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.paste(mark, ((canvas.width - mark.width) // 2, (canvas.height - mark.height) // 2), mark)
    canvas = canvas.resize((512, 512), Image.LANCZOS)
    out = BRAND / "modunera-mark-v1.png"
    canvas.save(out, optimize=True)
    print(f"  {out.name}: {canvas.width}x{canvas.height}, {out.stat().st_size // 1024} KB")

    # The glow master is 1.2 MB of RGB gradient, far too heavy for a hero.
    glow = Image.open(GLOW).convert("RGB")
    for width in (900, 1400):
        out = BRAND / f"modunera-digital-sunrise-glow-v1-{width}.webp"
        resize_to_width(glow, width).save(out, "WEBP", quality=86, method=6)
        print(f"  {out.name}: {out.stat().st_size // 1024} KB")
    out = BRAND / "modunera-digital-sunrise-glow-v1-1400.jpg"
    resize_to_width(glow, 1400).save(out, "JPEG", quality=84, optimize=True, progressive=True)
    print(f"  {out.name}: {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
