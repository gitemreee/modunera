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
- **Top left**, 56 px from the left edge, 171 px from the top. That leaves 36 px
  of headroom inside the square the profile grid shows — measured, not assumed:
  the grid crop starts at 135 px and the lockup starts at 171 px.
- The outer margin is 56 px for everything — logo, caption, card statement and
  domain — so they sit on one optical frame. A logo pulled left while the caption
  below it stays put reads as a mistake rather than as a decision.
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
| Outer margin | 56 px |
| Logo | x 56, y 171 |
| Caption baseline | x 56, y 1109 |
| Domain | right-aligned to x 1024, baseline y 1185 |
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
| 3 | Module in the workshop — BUILT WITH PURPOSE | `20231214_121220.jpg` |
| 4 | Green card — the four services | — |
| 5 | Interior, kitchen and desk — MADE AROUND YOU | `IMG_20250807_131955.jpg` |
| 6 | Lit A-frame at dusk — HOME, AFTER DARK | `IMG_20250913_193621.jpg` |
| 7 | Module on the trailer — FROM TÜRKİYE TO EUROPE | `IMG_20250913_104632.jpg` |
| 8 | Cream card — DELIVERY ACROSS DE · NL · DK · LU · CH | — |
| 9 | Loft stair and living space — SPACE TO BREATHE | `20240227_113020.jpg` |
| 10 | Steel frame in front, finished house behind — FROM FRAME TO FINISH | `IMG_20250913_183727.jpg` |
| 11 | Green card — MINIMAL. MODERN. NATURAL. | — |
| 12 | A-frame on the lawn, no caption | `IMG_20250525_142713.jpg` |

### What was culled, and why

Three frames were removed from `01-selected/` after seeing them at grid scale.
Copies only — the originals in the shared folder are untouched.

| Removed | Reason | Replaced by |
|---|---|---|
| `IMG_20250618_094223.jpg` | Orange scaffolding dominated the frame; the house was the smallest thing in it | `20231214_121220.jpg` |
| `IMG_20260206_161331.jpg` | A grey unfinished terrace. Reads as a building site, not a product | `20240227_113020.jpg` |
| `20231207_103831.jpg` | Dim workshop, awkward pose, cluttered background | `IMG_20250913_183727.jpg` |

The third replacement earns its caption literally: a red steel frame in the
foreground, a finished house behind it — *from frame to finish* in one frame.

Three further frames are held in `00-candidates/` as alternates rather than
deleted: `IMG_20250519_183120.jpg`, `20250126_192414.jpg`,
`IMG_20250724_101400.jpg`. They are good photographs that this particular twelve
had no room for.

**One substitution.****One substitution.** The brief names `IMG_20250519_182509.jpg` for post 1. That
file is 9.7 MB and would not transfer through the connector after four attempts.
`IMG_20250519_182528.jpg` is used instead: the same building, the same deck, the
same session, and also on the brief's own list of strongest frames. Swap it back
by editing one line in `POSTS` if the original can be placed in `01-selected/`.

## 8. Photographic treatment

Twelve photographs taken across three years on two cameras will not read as one
brand on their own. One grade is applied to all of them — the same four moves,
with per-frame amounts, so the feed is cohesive without any frame looking
processed.

| Move | What it does | Why |
|---|---|---|
| Grey-world white balance, damped to 60% | Pulls the colour cast out | Phone auto-white-balance drifts green under a workshop roof and blue in open shade. That drift is what makes a feed look like snapshots. Damping to 60% keeps the warmth of evening light instead of neutralising it away |
| Soft S-curve, anchored at both ends | Adds depth | A flat phone JPEG has no shadow structure. Anchoring means nothing clips to pure black or pure white |
| Saturation 0.88–0.98 | Takes the shout out of the greens | Phone JPEGs oversaturate foliage, and these frames sit beside moss and sage |
| Wide shallow vignette | Holds the eye in the frame | Two stops at the extreme corner and nothing where the eye actually reads |

### Sharpening

A 4,000 px phone frame resampled to 1,080 px loses its edges — that is what a
Lanczos filter does, and every professional pipeline sharpens after the resize to
put them back. Skipping it is the single biggest reason a photograph dropped
straight into a layout reads as soft rather than as product photography.

Two radii, because they do different jobs:

| Pass | Radius | Amount | What it does |
|---|---|---|---|
| Micro-contrast | 34 px | 27–30% | Separates a wall from the trees behind it; gives the frame depth. This is the pass that reads as "professional" rather than "phone" |
| Output sharpening | 1.1 px | 58–120% | Puts the edge back on cladding seams, window frames, deck boards, stair nosings |

Both use a threshold (4 and 3), so flat sky and shadow are left alone and sensor
noise is not amplified. The night frame runs at roughly half — `sharp=0.55,
micro=0.35` — because sharpening a high-ISO frame sharpens its grain.

Order matters and is fixed: crop → grade → **sharpen** → scrims → type. Sharpening
before the scrims means the frosted foot stays soft and the type stays clean.

**Deliberately not done:** HDR tone mapping, tone-mapped local contrast, sky
replacement, colour popping, skin smoothing, any preset. The wide low-amount
unsharp above is micro-contrast, not HDR: it has no local tone mapping and, at
radius 34 and under 30%, cannot produce the halo that gives HDR away. Those other
moves are what make a manufacturer's feed look like a stock library.

### The frosted foot

Where a caption sits, the bottom 30% of the photograph is **graduated Gaussian
blur** rather than a heavier dark bar. A busy foot — decking planks, gravel, a
steel frame — competes with type no matter how dark a scrim is. Blurring it lets
the caption sit *on* the photograph instead of on a panel laid over it, and keeps
the picture's own colour and light. The blur ramps to zero so there is no seam,
and the scrim over it drops from 195 to 150 because a blurred foot needs far less
darkening.

Posts without a caption get the scrim only, at 118 — just enough to carry
`modunera.com`.

## 9. What is deliberately not done yet

- Drafts now render at the full 1,080 × 1,350. A half-size draft cannot answer
  "is this sharp enough", which is the question the drafts exist to answer.
  Resolution is not what makes something final here — approval is, and nothing has
  entered `05-approved/`.
- No captions and no hashtags.
- Nothing uploaded anywhere.
- `05-approved/` and `06-published/` are empty by design: a file only enters them
  after a person has looked at it.
