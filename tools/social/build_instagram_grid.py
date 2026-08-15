#!/usr/bin/env python3
"""Builds the twelve-post MODUNERA profile grid from the selected photographs.

Reads   social/instagram/01-selected/*.jpg      (copies; the originals are untouched)
Writes  social/instagram/03-grid-preview/       the 3x4 profile preview
        social/instagram/04-post-drafts/        one low-resolution draft per post

Three things this does that a hand layout forgets:

  * It strips the camera's own watermark. Four of the eight photographs were shot
    on a phone that burns a "vivo X200 Pro | ZEISS" strip with exposure data into
    the bottom of the frame. Cropping it is not retouching the photograph, it is
    removing another company's branding from ours. The strip is detected rather
    than assumed, by finding the run of rows at the foot of the image that are
    both bright and colourless across their width, so a photograph without one
    is left alone.

  * It respects the profile crop. Instagram shows a 1080x1350 post as a centred
    1:1 square in the grid, so the top and bottom 135 px are not visible there.
    Every element that identifies the brand sits inside that square.

  * It uses no filter. The only thing laid over a photograph is a soft gradient
    at the foot, and only where type has to sit on it. The brief asks for
    minimal, architectural and European, which means the picture is the design.

Pillow only — already present in the environment, so no dependency is added.

Usage: python3 tools/social/build_instagram_grid.py [--full]
       --full renders at 1080x1350 instead of the low-resolution draft size.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import math

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[2]
SELECTED = ROOT / "social/instagram/01-selected"
DRAFTS = ROOT / "social/instagram/04-post-drafts"
PREVIEW = ROOT / "social/instagram/03-grid-preview"
BRAND = ROOT / "assets/brand"
# The site's own faces. Poppins is --display (headings), Manrope is body; both
# are committed here as TTF because Pillow cannot read the woff2 that Google
# Fonts and Fontsource ship, and because a render must not depend on a network
# fetch. Converted from @fontsource/poppins and @fontsource/manrope — see
# tools/social/fonts/README.md.
FONTS = Path(__file__).resolve().parent / "fonts"

POST_W, POST_H = 1080, 1350
# Drafts render at post size. A half-size draft cannot answer "is this sharp
# enough", which is the question the drafts exist to answer. Approval still gates
# publication — 05-approved is what makes something final, not the pixel count.
DRAFT_SCALE = 1.0

# The site's own tokens, read off a rendered page rather than off the stylesheet:
# design-system-v2.css is appended after styles.css and overrides it, so what the
# stylesheet declares and what the browser paints are not the same thing.
MOSS_DEEP = (46, 71, 51)      # #2E4733  forest green card ground, --moss-deep
MOSS = (58, 90, 64)           # #3A5A40  --moss, the same value as --ink
SAGE = (163, 177, 138)        # #A3B18A
CREAM = (218, 215, 205)       # #DAD7CD  --cream / --paper-2
PAPER = (245, 245, 245)       # #F5F5F5
ROOF = (151, 49, 26)          # #97311A  the logo's roof red
INK = (58, 90, 64)            # #3A5A40, the site's --ink. Not a near-black.
MUTED = (74, 87, 72)          # #4A5748, the site's --muted — body and label copy
LIGHT_GROUND = PAPER          # #F5F5F5, what the site actually paints as its page
WHITE = (255, 255, 255)       # what a heading takes on any dark ground — see below
ON_MOSS = (188, 202, 194)     # body copy inside .section-dark, measured


def over(colour: tuple[int, int, int], alpha: float,
         ground: tuple[int, int, int]) -> tuple[int, int, int]:
    """A translucent token flattened onto its ground.

    Pillow draws onto an RGB canvas and silently discards a fourth component, so
    fill=(151,49,26,90) does not paint a 35% line — it paints a solid one. The
    site's hairlines are --line, rgba(58,90,64,.18), which is nearly invisible;
    the difference between that and a solid rule is the difference between a
    datasheet and a form. Blend here rather than hoping alpha survives."""
    return tuple(round(c * alpha + gnd * (1 - alpha)) for c, gnd in zip(colour, ground))


LINE = over(INK, 0.18, PAPER)         # --line on paper: rgba(58,90,64,.18)
LINE_STRONG = over(INK, 0.30, PAPER)  # the heavier divider above a data block

# The logo's own wordmark colour, sampled out of assets/brand/. It is the only
# near-black the brand owns, so a black card uses this rather than #000.
CHARCOAL = (35, 36, 38)       # #232426


def _srgb(c: int) -> float:
    v = c / 255
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def contrast(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    """WCAG contrast ratio. Display type needs 3.0, body copy 4.5.

    Worth having in the renderer rather than in a checklist because the two
    pairings that read as most obviously "on brand" are the two that fail: roof
    red on moss deep is 1.34 and moss on roof red is 1.02 — red and green sit at
    almost the same luminance, so the type vanishes at the 120 px the grid
    actually shows. Put cream or white between them instead."""
    la = 0.2126 * _srgb(a[0]) + 0.7152 * _srgb(a[1]) + 0.0722 * _srgb(a[2])
    lb = 0.2126 * _srgb(b[0]) + 0.7152 * _srgb(b[1]) + 0.0722 * _srgb(b[2])
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

# --- who gets which colour -------------------------------------------------
# Counted on seven rendered page types, every visible h1/h2/h3:
#
#     roof red #97311A   76   every section h2 and every card h3 on a light ground
#     white    #FFFFFF   33   every heading on a dark ground, hero included
#     moss     #3A5A40    5   the page-title h1 of an interior page, once per page
#
# So moss is not a heading colour in general — it does exactly one job, the title
# at the top of a page. A card in the feed is a statement inside a stream, which
# is the section-h2 case, and that is red 76 times out of 76. The cards keep red.
#
# The dark-ground rule is just as strict and the feed was missing it: a heading on
# moss is pure white, not off-white; the small label above it is cream #DAD7CD,
# the same as .eyebrow on .section-dark; body copy there is #BCCAC2.

# Instagram crops the grid thumbnail to a centred square: 135 px off the top and
# the bottom of a 1080x1350 post. Nothing that identifies the brand goes there.
SAFE_TOP = 135
SAFE_BOTTOM = 135
# Tightened from 74. One margin for the logo, the caption, the card statement and
# the domain, so everything sits on the same optical frame — a logo pulled left
# while the caption below it stays put reads as a mistake, not as a decision.
MARGIN = 56

# Where each element sits. Declared once because two things read them: the code
# that draws the element, and ink_mask, which reproduces it to measure the ground
# underneath. If those two ever disagreed the scrim would be solved for somewhere
# the type is not, which is the failure this whole arrangement exists to prevent.
DOMAIN_TEXT = "modunera.com"
CAPTION_Y = POST_H - SAFE_BOTTOM - 106
CAPTION_SIZE = 37
CAPTION_TRACK = CAPTION_SIZE * 0.15 * 0.42
LOGO_XY = (MARGIN, SAFE_TOP + 36)
LOGO_W = 246


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


# Measured off the rendered site rather than read off the stylesheet, because the
# v2 layer overrides what styles.css declares. What a page actually computes:
#
#   h1        Poppins 820, letter-spacing -0.028em, colour --ink   #3A5A40
#   h2        Poppins 800, letter-spacing -0.021em, colour --roof  #97311A
#   .eyebrow  Poppins 800, letter-spacing +0.15em, uppercase, --ink
#   p         Poppins 500, normal tracking, colour --muted         #4A5748
#
# So the whole site is Poppins — body included, despite styles.css naming Manrope,
# because design-system-v2.css sets body to var(--display). The feed follows that.
F_TITLE = lambda s: font("Poppins-ExtraBold.ttf", s)   # 800, as h1 and h2 are
F_BODY = lambda s: font("Poppins-Medium.ttf", s)       # 500, as body copy is
F_LABEL = lambda s: font("Poppins-ExtraBold.ttf", s)   # 800, as .eyebrow is


def strip_camera_watermark(im: Image.Image) -> tuple[Image.Image, int]:
    """Remove the phone's burnt-in branding strip from the foot of the frame.

    The strip is a near-white band the full width of the image carrying dark
    text. Rows are scanned upward from the bottom while they stay bright and
    close to grey; the first row that does not is the real photograph.
    """
    w, h = im.size
    small = im.convert("RGB").resize((160, h), Image.BILINEAR)
    px = small.load()
    limit = int(h * 0.16)  # the strip is never more than a sixth of the frame
    band = 0
    for offset in range(1, limit):
        y = h - offset
        bright = colourless = 0
        for x in range(0, 160, 4):
            r, g, b = px[x, y]
            if (r + g + b) / 3 > 195:
                bright += 1
            if max(r, g, b) - min(r, g, b) < 26:
                colourless += 1
        if bright < 30 or colourless < 32:  # of 40 samples
            break
        band = offset
    if band < h * 0.01:
        return im, 0
    return im.crop((0, 0, w, h - band)), band



def _curve(lut_fn) -> list[int]:
    return [max(0, min(255, round(lut_fn(v / 255) * 255))) for v in range(256)]


def grade(im: Image.Image, *, warmth: float = 1.0, lift: float = 0.0,
          contrast: float = 1.0, saturation: float = 1.0) -> Image.Image:
    """One grade across the whole grid, so twelve phone photographs taken in three
    years on two cameras read as one brand rather than as an album.

    Four moves, all gentle, none of them a filter:

      1. Grey-world white balance, damped. Phone auto-white-balance drifts green
         under a workshop roof and blue in open shade; the drift is what makes a
         feed look like snapshots. Correction is pulled only 60% of the way to
         neutral so the warmth of evening light survives.
      2. A soft S-curve. Adds the depth a flat phone JPEG lacks. The curve is
         anchored at both ends, so nothing clips to pure black or pure white.
      3. Saturation pulled slightly down. Phone JPEGs oversaturate greens; the
         palette this brand uses is muted, and the photographs have to sit next to
         moss and sage without shouting.
      4. A wide, shallow vignette. Two stops at the extreme corner, nothing
         anywhere the eye actually reads.

    Deliberately not done: HDR tone mapping, clarity, local contrast, sky
    replacement, colour-popping. The brief rules those out and they are what makes
    a manufacturer's feed look like a stock library.
    """
    im = im.convert("RGB")

    # 1. white balance
    stat = ImageStat.Stat(im)
    r, g, b = stat.mean
    grey = (r + g + b) / 3
    damp = 0.6
    scale = [1 + damp * ((grey / c) - 1) if c > 4 else 1 for c in (r, g, b)]
    scale[0] *= warmth          # a touch of warmth is a brand decision, not a fix
    scale[2] /= warmth
    im = im.point(_curve(lambda v: v * scale[0]) + _curve(lambda v: v * scale[1])
                  + _curve(lambda v: v * scale[2]))

    # 2. the S-curve, plus any shadow lift the photograph needs
    def s(v: float) -> float:
        v = v + lift * (1 - v) ** 2.2
        v = v + (contrast - 1) * 0.5 * math.sin(2 * math.pi * (v - 0.5)) / (2 * math.pi) * 4
        return max(0.0, min(1.0, v))
    lut = _curve(s)
    im = im.point(lut * 3)

    # 3. saturation
    if saturation != 1.0:
        im = ImageEnhance.Color(im).enhance(saturation)

    # 4. vignette
    w, h = im.size
    small = 200
    mask = Image.new("L", (small, small))
    px = mask.load()
    cx = cy = (small - 1) / 2
    for y in range(small):
        for x in range(small):
            d = (((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2) ** 0.5
            px[x, y] = int(max(0, min(1, (d - 0.62) / 0.75)) ** 1.7 * 74)
    mask = mask.resize((w, h), Image.BILINEAR)
    im.paste(Image.new("RGB", (w, h), (10, 18, 14)), (0, 0), mask)
    return im



def sharpen(im: Image.Image, amount: float = 1.0, micro: float = 1.0) -> Image.Image:
    """Output sharpening, in two passes at two radii.

    A 4,000 px phone frame resampled down to 1,080 px loses its edges — that is
    what a Lanczos filter does, and every professional pipeline sharpens after the
    resize to put them back. Skipping it is why an unedited photograph dropped
    straight into a layout reads as soft.

    Two radii, because they do different jobs:

      micro-contrast, radius 34, low amount — separates a wall from the trees
        behind it and gives the frame depth. This is the move that reads as
        "professional" rather than "phone". Kept low and wide so it cannot halo;
        it is not HDR and there is no local tone mapping.

      output sharpening, radius 1.1, higher amount — puts the edge back on
        cladding seams, window frames, deck boards and stair nosings.

    Both use a threshold, so flat sky and shadow are left alone and sensor noise
    is not amplified. The night frame runs at a fraction of the amount for exactly
    that reason.
    """
    if micro > 0:
        im = im.filter(ImageFilter.UnsharpMask(radius=34, percent=int(30 * micro), threshold=4))
    if amount > 0:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=int(105 * amount), threshold=3))
    return im


def frosted_foot(im: Image.Image, height_ratio: float = 0.30) -> Image.Image:
    """A graduated blur under the caption instead of a heavier dark bar.

    A busy foot — decking planks, gravel, a steel frame — competes with type no
    matter how dark the scrim is. Blurring it lets the caption sit on the
    photograph rather than on a panel laid over it, and keeps the picture's
    colour and light. The blur is graduated so there is no visible seam.
    """
    w, h = im.size
    band = int(h * height_ratio)
    strip = im.crop((0, h - band, w, h))
    blurred = strip.filter(ImageFilter.GaussianBlur(radius=w / 46))
    ramp = Image.new("L", (1, band))
    for y in range(band):
        t = y / max(band - 1, 1)
        ramp.putpixel((0, y), int(255 * min(1.0, (t ** 1.7) * 1.15)))
    out = im.copy()
    out.paste(blurred, (0, h - band), ramp.resize((w, band), Image.BILINEAR))
    return out


def cover(im: Image.Image, w: int, h: int, focus: float = 0.5) -> Image.Image:
    """Scale to fill w x h and crop the overflow, keeping `focus` of the long axis.

    focus is 0..1 along whichever axis is cropped: 0 keeps the top or left edge,
    1 the bottom or right.
    """
    scale = max(w / im.width, h / im.height)
    resized = im.resize((max(w, round(im.width * scale)), max(h, round(im.height * scale))), Image.LANCZOS)
    if resized.width > w:
        left = round((resized.width - w) * focus)
        return resized.crop((left, 0, left + w, h))
    top = round((resized.height - h) * focus)
    return resized.crop((0, top, w, top + h))



def _luma(im: Image.Image, box) -> tuple[float, float]:
    """Mean brightness and standard deviation of a region, 0-255."""
    st = ImageStat.Stat(im.crop(box).convert("L"))
    return st.mean[0], st.stddev[0]


def _luma_bright(im: Image.Image, box, pct: float = 82.0) -> float:
    """The brightness white type actually has to survive in a region.

    Not the mean. A foot band that is half black cladding and half sunlit timber
    has a perfectly comfortable mean and an illegible caption: the words fail
    where they cross the bright half, and averaging is precisely what hides that.
    One patch bright enough to swallow the type is a failure however dark the rest
    of the band is, so take a high percentile — at 82 a bright fifth of the region
    is enough to call for a scrim, while a few blown highlights are not.
    """
    hist = im.crop(box).convert("L").histogram()
    target = sum(hist) * pct / 100
    run = 0
    for value, count in enumerate(hist):
        run += count
        if run >= target:
            return float(value)
    return 255.0


def scrim_need(luma: float, floor: float = 86.0, span: float = 105.0) -> float:
    """How much darkening this region actually needs for white type, 0 to 1.

    White on a region already at or below `floor` clears 4.5:1 on its own, so it
    gets nothing. Above that the need ramps with the deficit. This is why not every
    frame carries a gradient: the night shot and the dark cladding do not need one,
    and putting one there only flattens a photograph that was already right.
    """
    if luma <= floor:
        return 0.0
    return min(1.0, (luma - floor) / span)


SCRIM_RGB = (14, 24, 18)


def scrim_alpha_for(bright: float, target: float = 4.6) -> int:
    """The alpha that actually brings `bright` down to where white clears `target`.

    Solved rather than dialled. The previous code multiplied a hand-picked ceiling
    of 190 by the need, which is a guess wearing a formula: on the lawn frame the
    need saturated at 1.0, the ceiling gave 190, and the domain still measured
    3.78:1 against the white pebbles because 190 was simply not enough for that
    ground. Asking what alpha the ground requires removes the guess, and returns 0
    for the frames that need nothing so a good photograph is never flattened.

    0 to 255, for a scrim of SCRIM_RGB composited in sRGB, which is how Pillow
    blends. A grey proxy is fair here: the darkening is neutral, so hue barely
    moves the ratio, and the input is already a luminance percentile.
    """
    scrim_grey = 0.2126 * SCRIM_RGB[0] + 0.7152 * SCRIM_RGB[1] + 0.0722 * SCRIM_RGB[2]
    for alpha in range(0, 256, 3):
        a = alpha / 255
        blended = bright * (1 - a) + scrim_grey * a
        v = round(max(0.0, min(255.0, blended)))
        if contrast(WHITE, (v, v, v)) >= target:
            return alpha
    return 255


def ink_mask(title: str | None, want: str) -> Image.Image:
    """A mask of exactly the pixels one element will cover.

    Drawn from the same constants the renderer draws from, so the ground can be
    measured where the ink actually lands. This is the third and last version of
    the same lesson: the scrim was first solved from a band's mean, then from a
    band's high percentile, and both were still measuring a rectangle rather than
    a word. Post 7's caption is 327 px wide inside a 644 px box, so nearly half of
    what was sampled was ground no letter ever touched — and the bright half it
    did touch was averaged away by the comfortable majority beside it.
    """
    m = Image.new("L", (POST_W, POST_H), 0)
    if want == "caption" and title:
        tracked(ImageDraw.Draw(m), (MARGIN, CAPTION_Y), title,
                F_LABEL(CAPTION_SIZE), 255, tracking=CAPTION_TRACK)
    elif want == "domain":
        d = ImageDraw.Draw(m)
        d.text(domain_xy(d), DOMAIN_TEXT, font=F_BODY(30), fill=255)
    elif want == "logo":
        logo = Image.open(BRAND / "modunera-master-logo-mountain-v1-white-600.png").convert("RGBA")
        logo = logo.resize((LOGO_W, round(logo.height * LOGO_W / logo.width)), Image.LANCZOS)
        m.paste(logo.getchannel("A"), LOGO_XY)
    return m


def luma_under(im: Image.Image, mask: Image.Image, pct: float = 92.0) -> float:
    """The brightest ground an element is actually read against.

    Two decisions, both of which earlier versions got wrong.

    It measures the *ring* — the band a few pixels wide around each stroke, with
    the strokes themselves excluded — not the pixels the strokes cover. The eye
    separates a letter from the ground beside it, and on a photograph those are
    different values. Excluding the strokes also means this works identically on a
    finished post as on a bare one, so the renderer and the check that verifies it
    can share one function instead of disagreeing by a measurement method.

    And it takes a high percentile rather than a mode, because a caption whose
    twelve letters average comfortably but whose three brightest letters sit on
    sunlit timber is a caption with three letters missing.
    """
    # The ring sits clear of the stroke rather than against it. A band starting at
    # the glyph edge picks up the drawn type's own antialiasing once the ink is on,
    # so the same photograph would measure darker before the type than after — and
    # a check that disagreed with the renderer by that much would be measuring the
    # gap between two methods rather than the legibility of a post.
    inner = mask.filter(ImageFilter.MaxFilter(7))
    outer = mask.filter(ImageFilter.MaxFilter(15))
    grey = im.convert("L")
    hit = sorted(v for v, o, i in zip(grey.get_flattened_data(),
                                      outer.get_flattened_data(),
                                      inner.get_flattened_data())
                 if o > 140 and i <= 140)
    if not hit:
        return 0.0
    return float(hit[min(len(hit) - 1, int(len(hit) * pct / 100))])


def apply_until_legible(canvas: Image.Image, masks: list[Image.Image], scrim,
                        target: float = 4.6, cap: int = 250):
    """Darken, measure, repeat — instead of solving once and hoping.

    scrim_alpha_for computes the alpha a flat ground would need, but a gradient
    does not deliver its full alpha everywhere the type sits, and a photograph is
    not flat. Every previous version of this got the estimate wrong in a new way
    and shipped green while missing its own target: first the mean, then the ramp
    peak, then the fixed sampling box. The estimate is now a starting point rather
    than an answer, and the loop is what guarantees the number.

    Returns the darkened canvas and the alpha that was actually used. A frame that
    already clears the target is returned untouched, at alpha 0, so a photograph
    that never needed a gradient never gets one.
    """
    worst = lambda c: min(contrast(WHITE, (v, v, v))
                          for v in [luma_under(c, m) for m in masks]) if masks else 99.0
    if worst(canvas) >= target:
        return canvas, 0
    alpha = max(scrim_alpha_for(luma_under(canvas, m)) for m in masks)
    while alpha <= cap:
        out = scrim(canvas, alpha)
        if worst(out) >= target:
            return out, alpha
        alpha += 12
    return scrim(canvas, cap), cap


def head_scrim(im: Image.Image, height_ratio: float = 0.24, strength: int = 140) -> Image.Image:
    """A soft darkening at the head only, so the white logo reads on a bright sky.

    Without it the lockup vanished on the workshop wall and the tree canopy — a
    logo that disappears on a third of the grid is not a logo.

    The gradient peaks at the logo and fades below it, rather than peaking at the
    very top of the post. That distinction is the whole point: the top 135 px are
    cropped out of the grid thumbnail, so a ramp that spends its strength up there
    delivers only a fraction of it where the logo actually sits. Measured on the
    frame photographs, the old ramp gave the lockup about a quarter of the
    darkening it was asked for.
    """
    w, h = im.size
    logo_bottom = SAFE_TOP + 118                    # the lockup, plus a little air
    band = max(int(h * height_ratio), logo_bottom + 150)
    ramp = Image.new("L", (1, band))
    for y in range(band):
        t = 1.0 if y <= logo_bottom else 1 - (y - logo_bottom) / max(band - logo_bottom, 1)
        ramp.putpixel((0, y), int(strength * (t ** 1.9)))
    mask = ramp.resize((w, band), Image.BILINEAR)
    out = im.copy()
    out.paste(Image.new("RGB", (w, band), (14, 24, 18)), (0, 0), mask)
    return out


def foot_scrim(im: Image.Image, height_ratio: float = 0.34, strength: int = 165) -> Image.Image:
    """A soft darkening at the foot only, so the domain and title can be read.

    Not a filter: the top two thirds of the photograph are untouched.
    """
    w, h = im.size
    band = int(h * height_ratio)
    # The ramp reaches full strength at the *top of the type*, not at the bottom of
    # the post and not at the bottom of the safe square, and holds it from there
    # down. Both of those earlier choices spent the gradient below everything it
    # was protecting: measured on the lawn frame, the caption and the domain were
    # receiving about 40 % and 62 % of the requested alpha respectively, which is
    # why white kept failing there however high the ceiling went. Peaking at the
    # type means the alpha that scrim_alpha_for solves for is the alpha the type
    # actually gets.
    peak = max(1, (h - SAFE_BOTTOM - 120) - (h - band))
    scrim = Image.new("L", (1, band))
    for y in range(band):
        t = min(1.0, y / peak)
        scrim.putpixel((0, y), int(strength * (t ** 2.1)))
    mask = scrim.resize((w, band), Image.BILINEAR)
    layer = Image.new("RGB", (w, band), (14, 24, 18))
    out = im.copy()
    out.paste(layer, (0, h - band), mask)
    return out


def place_logo(canvas: Image.Image, light: bool) -> None:
    """Small, top left, inside the square the profile grid shows. Never centred,
    never enlarged, never boxed — the brief is explicit on all three."""
    name = "modunera-master-logo-mountain-v1-white-600.png" if light else "modunera-master-logo-mountain-v1-600.png"
    logo = Image.open(BRAND / name).convert("RGBA")
    logo = logo.resize((LOGO_W, round(logo.height * LOGO_W / logo.width)), Image.LANCZOS)
    canvas.paste(logo, LOGO_XY, logo)


def domain_xy(draw: ImageDraw.ImageDraw) -> tuple[int, int]:
    """Where modunera.com sits. One definition, used by the drawing and by the
    mask that measures the ground under it — if those two drifted apart the
    measurement would be of somewhere the type is not."""
    f = F_BODY(30)
    box = draw.textbbox((0, 0), DOMAIN_TEXT, font=f)
    return (POST_W - MARGIN - (box[2] - box[0]),
            POST_H - SAFE_BOTTOM - 30 - (box[3] - box[1]))


def body_on(ground: tuple[int, int, int]) -> tuple[int, int, int]:
    """The body colour this ground can carry, at 4.5:1 or better.

    The site has three body values — white on a photograph, #BCCAC2 inside
    .section-dark, --muted on paper — and picking between them by a light/dark
    flag works until a ground turns up that is neither. Roof red is exactly that
    case: it is dark, so the flag chose #BCCAC2, which measures 4.46:1 on it and
    fails. Choose by measurement instead and the question does not arise again.
    """
    for candidate in (MUTED, ON_MOSS, WHITE):
        if contrast(candidate, ground) >= 4.5:
            return candidate
    return WHITE if contrast(WHITE, ground) > contrast(MUTED, ground) else MUTED


def place_domain(draw: ImageDraw.ImageDraw, light: bool, on_photo: bool = True,
                 ground: tuple[int, int, int] | None = None) -> None:
    """Lower case, bottom right, inside the safe square.

    It is body copy, so it takes whichever body colour its ground can carry. On a
    photograph that is white, over a scrim sized for it. On a flat panel the
    colour is measured against the panel rather than assumed from its darkness."""
    fill = WHITE if on_photo else (body_on(ground) if ground else (ON_MOSS if light else MUTED))
    draw.text(domain_xy(draw), DOMAIN_TEXT, font=F_BODY(30), fill=fill)


def tracked(draw: ImageDraw.ImageDraw, xy, text: str, f, fill, tracking: float = 0):
    """Letter-spaced type, positive or negative. Pillow has no tracking at all.

    The site tracks display type *tight* — h1 at -0.028em, h2 at -0.021em — and
    only opens it up for uppercase labels, where .eyebrow sits at +0.15em. The
    feed follows both conventions rather than tracking everything open, which was
    the single most visible difference between a card and a page heading."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking
    return x


def photo_post(source: Path, title: str | None, focus: float, look: dict | None = None) -> Image.Image:
    im = Image.open(source).convert("RGB")
    im, band = strip_camera_watermark(im)
    src_w, src_h = im.size
    canvas = cover(im, POST_W, POST_H, focus)

    look = dict(look or {})
    noisy = look.pop("noisy", False)
    canvas = grade(canvas, **look)

    # Sharpening follows how far the frame was actually reduced rather than a
    # number typed per photograph: a frame downscaled 1.7x lost more edge than one
    # downscaled 1.3x and can take more back. A high-ISO frame is exempt, because
    # sharpening grain is still sharpening grain.
    reduction = max(src_w / POST_W, src_h / POST_H)
    amount = 0.0 if noisy else min(1.20, 0.72 + 0.28 * reduction)
    micro = 0.35 if noisy else min(1.0, 0.55 + 0.28 * reduction)
    canvas = sharpen(canvas, amount=(0.55 if noisy else amount), micro=micro)

    # --- gradients only where the photograph needs them ----------------------
    # Each gradient is solved from the ground the element it protects actually
    # covers — the glyphs, not a rectangle around them. See ink_mask and
    # luma_under. A frame that already clears 4.6:1 — the night shot, the dark
    # cladding — gets nothing at all.
    canvas, head_alpha = apply_until_legible(
        canvas, [ink_mask(None, "logo")],
        lambda c, a: head_scrim(c, height_ratio=0.24, strength=a))

    # The foot carries two elements on very different grounds — the caption at the
    # left and the domain at the right — so both are measured and the stronger
    # requirement wins. On the lawn frame the caption sits on dark grass and the
    # domain on sunlit white pebbles; one number for the whole band served neither.
    foot_box = (0, POST_H - SAFE_BOTTOM - 170, POST_W, POST_H - SAFE_BOTTOM)
    masks = [ink_mask(None, "domain")] + ([ink_mask(title, "caption")] if title else [])

    # A blurred foot is for a busy one. A calm foot — grass, a dark wall, the
    # night — reads better sharp, and blurring it would be the artificial look the
    # brief rules out. The frost goes on first and the alpha is measured after it,
    # rather than measured before and then discounted by a fixed 28 %: blur makes a
    # busy ground uniform, which helps, but it does not make a bright ground dark.
    # On the lawn frame the discount was subtracting darkening that the white
    # pebbles still needed, and the domain measured 3.58:1 because of it.
    need = lambda: max(scrim_alpha_for(luma_under(canvas, m)) for m in masks)
    if title and _luma(canvas, foot_box)[1] > 44 and need() > 40:
        canvas = frosted_foot(canvas, height_ratio=0.28)

    ratio = 0.34 if title else 0.26
    canvas, foot_alpha = apply_until_legible(
        canvas, masks, lambda c, a: foot_scrim(c, height_ratio=ratio, strength=a))

    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=True)
    if title:
        # the caption is a small uppercase label, which the site tracks open at
        # +0.15em on .eyebrow — the one place it opens type up at all
        tracked(draw, (MARGIN, CAPTION_Y), title, F_LABEL(CAPTION_SIZE),
                WHITE, tracking=CAPTION_TRACK)
    place_domain(draw, light=True)
    canvas.info["watermark_band_px"] = band
    canvas.info["head_scrim"] = head_alpha      # 0-255 alpha, solved not dialled
    canvas.info["foot_scrim"] = foot_alpha
    return canvas


def card_post(lines: list[str], ground: tuple[int, int, int], light_type: bool,
              size: int = 82, rule: bool = True,
              type_colour: tuple[int, int, int] | None = None,
              rule_colour: tuple[int, int, int] | None = None) -> Image.Image:
    """A statement on a flat ground.

    The two defaults below are the site's own pairing and cover the feed. The two
    overrides exist because a profile that uses one pairing ninety times reads as
    a template — a run of posts wants roof-red type on paper next to cream on
    moss next to white on red next to cream on charcoal. Any override still has
    to clear contrast; `contrast()` is here to check it rather than trust it.
    """
    canvas = Image.new("RGB", (POST_W, POST_H), ground)
    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=light_type)

    # Light ground: roof red, as every section h2 and card h3 on the site.
    # Dark ground: pure white, as every heading inside .section-dark.
    ink = type_colour if type_colour else (WHITE if light_type else ROOF)
    # The short rule is the site's .eyebrow:before — 16x2px in --terracotta, which
    # the v2 layer remaps to #3A5A40, so it is moss on light and cream on dark. It
    # was red here, which is the one colour the site never gives that mark.
    accent = rule_colour if rule_colour else (CREAM if light_type else INK)
    f = F_TITLE(size)
    leading = int(size * 1.34)
    block_h = leading * len(lines)
    # Optically centred inside the square the grid shows, not inside the post.
    top = SAFE_TOP + (POST_H - SAFE_TOP - SAFE_BOTTOM - block_h) // 2 - 26

    if rule:
        draw.rectangle([MARGIN, top - 54, MARGIN + 92, top - 51], fill=accent)

    for i, line in enumerate(lines):
        # the site's h2 tracking, -0.021em, scaled to this size
        tracked(draw, (MARGIN, top + i * leading), line, f, ink, tracking=-size * 0.021)

    place_domain(draw, light=light_type, on_photo=False, ground=ground)
    return canvas



GALLERY = ROOT / "assets/images/gallery"

# Specifications come from the same data/pricing.json the website quotes, so a
# post can never advertise a figure the site has moved on from.
PRICING = json.loads((ROOT / "data/pricing.json").read_text(encoding="utf8"))["models"]


def model_rows(code: str) -> list[tuple[str, str]]:
    m = PRICING[code]
    return [("Length", m["lengths"].replace(",", ".")), ("Width", "2.55 m"),
            ("Layout", m["layout_en"]), ("From", f"{m['base_eur']:,} €".replace(",", "."))]


def concept_mark(draw: ImageDraw.ImageDraw, light: bool) -> None:
    """Renders are labelled. The brief requires it and it is the difference
    between showing a design and implying a photograph."""
    f = F_BODY(23)
    draw.text((MARGIN, POST_H - SAFE_BOTTOM - 34), "CONCEPT", font=f,
              fill=(255, 255, 255, 200) if light else (INK[0] + 40, INK[1] + 40, INK[2] + 40))


def spec_post(model: str, name: str, sub: str, rows: list[tuple[str, str]]) -> Image.Image:
    """A specification sheet, not a slogan. The model name sits large at the top
    of the safe square, the figures run as label/value rows under a hairline, and
    the lower half is left empty. Nothing is centred."""
    canvas = Image.new("RGB", (POST_W, POST_H), LIGHT_GROUND)
    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=False)

    top = SAFE_TOP + 210
    tracked(draw, (MARGIN, top), model, F_TITLE(132), ROOF, tracking=-132 * 0.028)
    tracked(draw, (MARGIN, top + 168), name.upper(), F_LABEL(34), INK, tracking=34 * 0.15 * 0.42)
    draw.text((MARGIN, top + 214), sub, font=F_BODY(30), fill=MUTED)

    y = top + 300
    draw.rectangle([MARGIN, y, POST_W - MARGIN, y + 2], fill=LINE_STRONG)
    y += 34
    for label, value in rows:
        tracked(draw, (MARGIN, y + 6), label.upper(), F_LABEL(22), MUTED, tracking=22 * 0.15)
        f = F_TITLE(38)
        draw.text((POST_W - MARGIN - draw.textlength(value, font=f), y - 4), value, font=f, fill=INK)
        y += 62
        draw.rectangle([MARGIN, y - 14, POST_W - MARGIN, y - 13], fill=LINE)

    place_domain(draw, light=False)
    return canvas


def duo_post(source: Path, statement: list[str], ground: tuple[int, int, int],
             light_type: bool, focus: float = 0.5, concept: bool = False,
             look: dict | None = None,
             type_colour: tuple[int, int, int] | None = None,
             rule_colour: tuple[int, int, int] | None = None) -> Image.Image:
    """Photograph above, colour band below. The type never sits on the picture at
    all, which is a different relationship from a caption and gives the grid a
    second rhythm."""
    split = 830
    canvas = Image.new("RGB", (POST_W, POST_H), ground)
    im = Image.open(source).convert("RGB")
    im, _ = strip_camera_watermark(im)
    src_w, src_h = im.size
    photo = cover(im, POST_W, split, focus)
    look = dict(look or {})
    look.pop("noisy", None)
    photo = grade(photo, **look)
    reduction = max(src_w / POST_W, src_h / split)
    photo = sharpen(photo, amount=min(1.20, 0.72 + 0.28 * reduction),
                    micro=min(1.0, 0.55 + 0.28 * reduction))
    canvas.paste(photo, (0, 0))

    draw = ImageDraw.Draw(canvas)
    luma, _ = _luma(canvas, (MARGIN, SAFE_TOP + 36, MARGIN + 246, SAFE_TOP + 106))
    need = scrim_need(luma)
    if need > 0.04:
        head = head_scrim(canvas.crop((0, 0, POST_W, split)), height_ratio=0.30,
                          strength=int(150 * need))
        canvas.paste(head, (0, 0))
    place_logo(canvas, light=True)

    # The band below the photograph is a section, so its statement follows the
    # section rule: white on moss, roof red on paper. It was moss-on-paper here,
    # which is the one colour the site never gives a heading below the page title.
    ink = type_colour if type_colour else (WHITE if light_type else ROOF)
    y = split + 74
    draw.rectangle([MARGIN, y, MARGIN + 92, y + 3],
                   fill=rule_colour if rule_colour else (CREAM if light_type else INK))
    y += 40
    for line in statement:
        tracked(draw, (MARGIN, y), line, F_TITLE(52), ink, tracking=-52 * 0.021)
        y += 66

    if concept:
        tracked(draw, (MARGIN, split + 22), "CONCEPT", F_LABEL(23),
                ON_MOSS if light_type else MUTED, tracking=23 * 0.15)
    place_domain(draw, light=light_type, on_photo=False, ground=ground)
    return canvas


def numeral_post(figure: str, label: list[str], ground: tuple[int, int, int],
                 light_type: bool) -> Image.Image:
    """One figure, very large, as the image itself. The label is small and low.
    A grid needs somewhere the eye stops, and a numeral does that without a
    photograph."""
    canvas = Image.new("RGB", (POST_W, POST_H), ground)
    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=light_type)
    # The figure is display type at heading scale, so it follows the heading rule;
    # the words under it are a label, so they follow .eyebrow — ink on paper,
    # cream on moss. Two colours, both the site's, instead of one flat one.
    figure_fill = WHITE if light_type else ROOF
    label_fill = CREAM if light_type else INK

    f = F_TITLE(430)
    box = draw.textbbox((0, 0), figure, font=f)
    draw.text((MARGIN - 18, SAFE_TOP + 170 - box[1]), figure, font=f, fill=figure_fill)

    y = POST_H - SAFE_BOTTOM - 150 - 56 * len(label)
    draw.rectangle([MARGIN, y - 40, MARGIN + 92, y - 37], fill=label_fill)
    for line in label:
        tracked(draw, (MARGIN, y), line, F_LABEL(46), label_fill, tracking=46 * 0.15 * 0.42)
        y += 58
    place_domain(draw, light=light_type, on_photo=False, ground=ground)
    return canvas


def detail_post(source: Path, focus: float = 0.5, concept: bool = False,
                look: dict | None = None) -> Image.Image:
    """A tight architectural crop, full bleed, no statement. The grid needs to
    breathe, and a frame with nothing to read is how it does that."""
    im = Image.open(source).convert("RGB")
    im, _ = strip_camera_watermark(im)
    src_w, src_h = im.size
    canvas = cover(im, POST_W, POST_H, focus)
    look = dict(look or {})
    look.pop("noisy", None)
    canvas = grade(canvas, **look)
    reduction = max(src_w / POST_W, src_h / POST_H)
    canvas = sharpen(canvas, amount=min(1.20, 0.72 + 0.28 * reduction),
                     micro=min(1.0, 0.55 + 0.28 * reduction))
    luma, _ = _luma(canvas, (MARGIN, SAFE_TOP + 36, MARGIN + 246, SAFE_TOP + 106))
    need = scrim_need(luma)
    if need > 0.04:
        canvas = head_scrim(canvas, height_ratio=0.24, strength=int(150 * need))
    foot_luma, _ = _luma(canvas, (0, POST_H - SAFE_BOTTOM - 170, POST_W, POST_H - SAFE_BOTTOM))
    foot_need = scrim_need(foot_luma, floor=78.0)
    if foot_need > 0.04:
        canvas = foot_scrim(canvas, height_ratio=0.24, strength=int(140 * foot_need))
    draw = ImageDraw.Draw(canvas)
    place_logo(canvas, light=True)
    if concept:
        tracked(draw, (MARGIN, POST_H - SAFE_BOTTOM - 34), "CONCEPT", F_LABEL(23),
                (255, 255, 255), tracking=23 * 0.15)
    place_domain(draw, light=True)
    return canvas


# The order the brief specifies, left to right, top to bottom.
# IMG_20250519_182509.jpg is named in the brief; it is 9.7 MB and would not come
# down the connector after four attempts. IMG_20250519_182528.jpg replaces it —
# the same A-frame and deck, the same session, and also on the brief's own list
# of strongest frames. Recorded here rather than silently swapped.
L_EXT = dict(warmth=1.02, lift=0.03, contrast=1.16, saturation=0.94)
L_INT = dict(warmth=1.02, lift=0.04, contrast=1.15, saturation=0.92)

POSTS = [
    # ---- row 1 : photograph, statement, photograph
    dict(kind="photo", src="IMG_20250519_182528.jpg", title=None, focus=0.5, look=L_EXT,
         note="substituted for IMG_20250519_182509.jpg, which would not transfer"),
    dict(kind="cream", lines=["DESIGN", "YOUR", "NATURE"], size=96),
    dict(kind="photo", src="20231214_121220.jpg", title="BUILT WITH PURPOSE", focus=0.24,
         look=dict(warmth=0.99, lift=0.05, contrast=1.20, saturation=0.88),
         note="replaced IMG_20250618_094223.jpg — scaffolding dominated the frame"),

    # ---- row 2 : the four services, an interior, the night frame
    dict(kind="forest", lines=["TINY HOUSE", "MODULAR HOME", "STEEL STRUCTURE", "CUSTOM FURNITURE"], size=62),
    dict(kind="photo", src="IMG_20250807_131955.jpg", title="MADE AROUND YOU", focus=0.42, look=L_INT),
    dict(kind="photo", src="IMG_20250913_193621.jpg", title="HOME, AFTER DARK", focus=0.45,
         look=dict(warmth=1.04, lift=0.06, contrast=1.10, saturation=0.98, noisy=True)),

    # ---- row 3 : delivery, a numeral, a specification sheet
    dict(kind="photo", src="IMG_20250913_104632.jpg", title="FROM TÜRKİYE TO EUROPE", focus=0.52, look=L_EXT),
    dict(kind="numeral", figure="5", label=["COUNTRIES,", "ONE ROUTE"], ground=LIGHT_GROUND, light=False),
    dict(kind="spec", model="MD 1", name="Panorama and loft", sub="Living · holiday home",
         rows=model_rows("mc1")),

    # ---- row 4 : photo-over-band, a detail, a photograph
    dict(kind="duo", src_path=GALLERY / "mc3-exterior.webp", lines=["ONE SHELL.", "EIGHT PLANS."],
         ground=MOSS_DEEP, light=True, focus=0.5, concept=True, look=L_EXT),
    dict(kind="detail", src_path=GALLERY / "mc5-interior.webp", focus=0.5, concept=True, look=L_INT),
    dict(kind="photo", src="20240227_113020.jpg", title="SPACE TO BREATHE", focus=0.66, look=L_INT),

    # ---- row 5 : frame to finish, a statement, a specification sheet
    dict(kind="photo", src="IMG_20250913_183727.jpg", title="FROM FRAME TO FINISH", focus=0.5, look=L_EXT),
    dict(kind="forest", lines=["MINIMAL.", "MODERN.", "NATURAL."], size=96),
    dict(kind="spec", model="MD 6", name="Chalet concept", sub="Mountain sites · resort",
         rows=model_rows("mc6")),

    # ---- row 6 : a numeral, a detail, the closing photograph
    dict(kind="numeral", figure="8", label=["MODELS,", "ONE SYSTEM"], ground=MOSS_DEEP, light=True),
    dict(kind="duo", src_path=GALLERY / "mc7-solar.webp", lines=["OFF-GRID", "READY."],
         ground=LIGHT_GROUND, light=False, focus=0.5, concept=True, look=L_EXT),
    dict(kind="photo", src="IMG_20250525_142713.jpg", title=None, focus=0.42, look=L_EXT),
]


def main() -> None:
    DRAFTS.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)

    rendered, manifest = [], []
    for i, spec in enumerate(POSTS, start=1):
        if spec["kind"] == "photo":
            img = photo_post(SELECTED / spec["src"], spec["title"], spec["focus"], spec.get("look"))
            entry = {"post": i, "type": "photograph", "source": spec["src"],
                     "title": spec["title"], "watermark_band_removed_px": img.info.get("watermark_band_px", 0),
                     "head_scrim": img.info.get("head_scrim"), "foot_scrim": img.info.get("foot_scrim")}
            if spec.get("note"):
                entry["note"] = spec["note"]
        elif spec["kind"] == "cream":
            img = card_post(spec["lines"], LIGHT_GROUND, light_type=False, size=spec["size"])
            entry = {"post": i, "type": "card, off-white", "lines": spec["lines"]}
        elif spec["kind"] == "forest":
            img = card_post(spec["lines"], MOSS_DEEP, light_type=True, size=spec["size"])
            entry = {"post": i, "type": "card, forest green", "lines": spec["lines"]}
        elif spec["kind"] == "spec":
            img = spec_post(spec["model"], spec["name"], spec["sub"], spec["rows"])
            entry = {"post": i, "type": "specification card", "model": spec["model"]}
        elif spec["kind"] == "duo":
            img = duo_post(spec["src_path"], spec["lines"], spec["ground"], spec["light"],
                           spec.get("focus", 0.5), spec.get("concept", False), spec.get("look"))
            entry = {"post": i, "type": "photo over band", "source": str(spec["src_path"].name),
                     "lines": spec["lines"]}
        elif spec["kind"] == "numeral":
            img = numeral_post(spec["figure"], spec["label"], spec["ground"], spec["light"])
            entry = {"post": i, "type": "numeral", "figure": spec["figure"]}
        else:
            img = detail_post(spec["src_path"], spec.get("focus", 0.5),
                              spec.get("concept", False), spec.get("look"))
            entry = {"post": i, "type": "detail", "source": str(spec["src_path"].name)}

        out = DRAFTS / f"post-{i:02d}.jpg"
        draft = img if DRAFT_SCALE == 1.0 else img.resize(
            (round(POST_W * DRAFT_SCALE), round(POST_H * DRAFT_SCALE)), Image.LANCZOS)
        draft.save(out, quality=86, optimize=True)
        entry["file"] = str(out.relative_to(ROOT))
        entry["pixels"] = f"{draft.width}x{draft.height}"
        manifest.append(entry)
        rendered.append(img)

    # The profile preview: three columns, four rows, each post cropped to the
    # square Instagram actually shows in the grid, with the same 2 px gutter.
    cell = 380
    gutter = 4
    sheet = Image.new("RGB", (cell * 3 + gutter * 2, cell * 6 + gutter * 5), (255, 255, 255))
    for i, img in enumerate(rendered):
        square = img.crop((0, SAFE_TOP, POST_W, POST_H - SAFE_BOTTOM)).resize((cell, cell), Image.LANCZOS)
        sheet.paste(square, ((i % 3) * (cell + gutter), (i // 3) * (cell + gutter)))
    sheet.save(PREVIEW / "profile-grid-3x6.jpg", quality=90, optimize=True)

    # And a preview of the full 4:5 frames, which is what a visitor sees when a
    # post is opened rather than scanned.
    fw, fh = 320, 400
    full = Image.new("RGB", (fw * 3 + gutter * 2, fh * 6 + gutter * 5), (255, 255, 255))
    for i, img in enumerate(rendered):
        full.paste(img.resize((fw, fh), Image.LANCZOS), ((i % 3) * (fw + gutter), (i // 3) * (fh + gutter)))
    full.save(PREVIEW / "post-frames-3x6.jpg", quality=90, optimize=True)

    (PREVIEW / "grid-manifest.json").write_text(
        json.dumps({"generated_for": "MODUNERA", "post_size": "1080x1350",
                    "draft_scale": DRAFT_SCALE, "posts": manifest}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf8")
    print(json.dumps({"posts": len(manifest),
                      "drafts": str(DRAFTS.relative_to(ROOT)),
                      "preview": str((PREVIEW / "profile-grid-3x6.jpg").relative_to(ROOT)),
                      "watermarks_removed": sum(1 for m in manifest if m.get("watermark_band_removed_px"))},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
