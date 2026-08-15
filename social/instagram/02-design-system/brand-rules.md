# MODUNERA — Instagram design system

For the twelve-post launch grid. Every value here is taken from the live site
(`tools/design-system-v2.css` and `assets/brand/`) rather than chosen for the
feed, so the profile and the website read as one brand.

Rendered by `tools/social/build_instagram_grid.py`. Change a value here and in
that file together — the script is the source of truth for what is produced, this
document for why.

---

## 1. Colour

The five-colour eco set the site already uses. No sixth colour is introduced for
social, and nothing is brightened for the feed.

| Token | Hex | Where it is used |
|---|---|---|
| Moss deep | `#2E4733` | Forest-green card ground |
| Moss | `#3A5A40` | Reserved; darker rules and hover states on the site |
| Sage | `#A3B18A` | The short rule above the type on a green card |
| Cream | `#DAD7CD` | Off-white card ground |
| Paper | `#F5F5F5` | Type on a green card |
| Roof red | `#97311A` | The short rule above the type on a cream card. Sampled from the logo mark |
| Ink | `#202E24` | Type on a cream card |

Forbidden, and not present in any output: neon, gold, gradients used as
decoration, heavy drop shadow, artificial 3D, HDR-look grading, stock-photo
colour treatment.

The only thing ever laid over a photograph is a soft neutral gradient — one at
the head so the white logo reads, one at the foot so the caption reads. Both are
`rgb(14,24,18)` at partial alpha, ramped, never flat. The middle of every
photograph is untouched.

## 2. Type

The site's display face is **Manrope**. It is not installed in the environment
that renders these drafts, so the drafts are set in **Work Sans** — the closest
humanist geometric available, same skeleton, same proportions.

**This is a draft substitution, not a brand decision.** Install Manrope and
re-run the script with `--full` before anything is published; the layout is
metric-driven and will not need redesigning.

| Role | Face | Size at 1080×1350 | Tracking |
|---|---|---|---|
| Card statement | Work Sans Bold | 62–96 px | +2 px |
| Photo caption | Work Sans Bold | 37 px | +3 px |
| Domain | Work Sans Regular | 30 px | 0 |

Card line leading is 1.34× the size. Captions are English, short, upper case, and
never more than four words. No post carries a number, an index, or an "01/09".

## 3. Logo

Only the existing master lockup is used, in the two variants already in the
repository:

| Variant | File | Used on |
|---|---|---|
| Full colour | `assets/brand/modunera-master-logo-mountain-v1-600.png` | Cream cards |
| White | `assets/brand/modunera-master-logo-mountain-v1-white-600.png` | Photographs and green cards |

Rules, all enforced by the script:

- **246 px wide** on a 1080 px post — 22.8% of the width. It is a signature, not
  a headline.
- **Top left**, 74 px from the left edge, 217 px from the top.
- Never centred, never enlarged, never placed on its own box or plate behind the
  photograph, never re-coloured, never redrawn.
- No alternative lockup is used. The "digital sunrise" direction has been deleted
  from the repository so it cannot be picked up by mistake.

## 4. Layout and safe area

Posts are **1080 × 1350** (4:5). Instagram shows them in the profile grid as a
**centred 1:1 crop**, which discards the top and bottom 135 px.

```
0 ────────────────────────── 1080
│         cropped in grid          │ 135 px
├──────────────────────────────────┤
│                                  │
│      everything that carries      │ 1080 px  ← the square the grid shows
│      the brand lives here         │
│                                  │
├──────────────────────────────────┤
│         cropped in grid          │ 135 px
└──────────────────────────────────┘ 1350
```

| Element | Position |
|---|---|
| Outer margin | 74 px |
| Logo | x 74, y 217 |
| Caption baseline | x 74, y 1109 |
| Domain | right-aligned to x 1006, baseline y 1185 |
| Card statement block | optically centred in the safe square, 26 px above true centre |
| Rule above card statement | 92 × 3 px, 54 px above the first line |

`modunera.com` is always lower case, always bottom right, white on photographs
and green cards, ink on cream cards.

## 5. Photographs

- **Real project and production photographs only** in this first grid. No AI
  image, no render, no stock. Nothing was generated.
- Any AI or render image used later must be labelled **Concept** on the artwork
  itself.
- No filter, no colour grading, no sharpening, no HDR.
- The photograph is never fully covered by type. Captions sit in the lower fifth.

**Camera watermark.** Four of the eight photographs were shot on a phone that
burns a `vivo X200 Pro | ZEISS` strip with exposure data into the foot of the
frame. The script detects that band — a run of bright, colourless rows spanning
the width — and crops it. Cropping another manufacturer's branding out of ours is
not retouching, and a photograph without a band is left untouched.

## 6. Rhythm of the grid

Photograph, card, photograph — so a card never sits beside another card and never
directly above one. Green and cream cards alternate down the column. Two posts
carry no caption at all (the first and the last), which gives the grid somewhere
to rest.

## 7. Source files

Originals stay where they are. `01-selected/` holds **copies**; nothing in the
source folder was moved, renamed, deleted or edited.

| Post | Content | Source |
|---|---|---|
| 1 | A-frame and deck, no caption | `IMG_20250519_182528.jpg` |
| 2 | Cream card — DESIGN YOUR NATURE | — |
| 3 | Module under construction — BUILT WITH PURPOSE | `IMG_20250618_094223.jpg` |
| 4 | Green card — the four services | — |
| 5 | Interior, kitchen and desk — MADE AROUND YOU | `IMG_20250807_131955.jpg` |
| 6 | Lit A-frame at dusk — HOME, AFTER DARK | `IMG_20250913_193621.jpg` |
| 7 | Module on the trailer — FROM TÜRKİYE TO EUROPE | `IMG_20250913_104632.jpg` |
| 8 | Cream card — DELIVERY ACROSS DE · NL · DK · LU · CH | — |
| 9 | Covered terrace — SPACE TO BREATHE | `IMG_20260206_161331.jpg` |
| 10 | Workshop, cutting timber — FROM FRAME TO FINISH | `20231207_103831.jpg` |
| 11 | Green card — MINIMAL. MODERN. NATURAL. | — |
| 12 | A-frame on the lawn, no caption | `IMG_20250525_142713.jpg` |

**One substitution.** The brief names `IMG_20250519_182509.jpg` for post 1. That
file is 9.7 MB and would not transfer through the connector after four attempts.
`IMG_20250519_182528.jpg` is used instead: the same building, the same deck, the
same session, and also on the brief's own list of strongest frames. Swap it back
by editing one line in `POSTS` if the original can be placed in `01-selected/`.

## 8. What is deliberately not done yet

- No high-resolution finals. Drafts render at 540 × 675; `--full` produces
  1080 × 1350 when the artwork is approved.
- No captions and no hashtags.
- Nothing uploaded anywhere.
- `05-approved/` and `06-published/` are empty by design: a file only enters them
  after a person has looked at it.
