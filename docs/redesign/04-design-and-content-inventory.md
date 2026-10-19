# 04 — Design and content inventory (M0)

Date: 2026-10-19. Read from `data/site-photos.json`, `assets/brand/`,
`tools/design-system-v2.css`, `assets/css/styles.css`, `README-build.md`. The
last section lists what the brief needs that the repository does not hold.

## 1. Real photographs (`data/site-photos.json`, 32 photographs, 76 WebP files)

Prepared by `tools/social/ingest_site_photos.py`; alt text written by hand in
German; placed by `build-photo-placement.mjs` on `/factory/`, `/projects/`,
`/qualitaet/`. Sizes: 1100×619 / 760×428 / 780×680 portrait for the landscape
set, 1200×800 / 760×507 for the rest. Originals are never altered (handoff rule 5).

| Category | Count | Names | What they show (from `alt_de`) |
|---|---|---|---|
| finished | 10 | aframe-deck-olive, aframe-lawn, aframe-night, aframe-olive-grove, detail-wood-and-metal, unit-angular-dark, unit-standing-seam, unit-terrace-event, unit-exhibition-terrace, unit-porch-sand | Completed single units: A-frame with deck under olive trees, A-frame on lawn, lit unit at night, unit in an olive grove, timber/metal façade detail, dark angular unit, standing-seam façade, two units on an exhibition ground with terraces, unit with covered porch on sand |
| interior | 10 | interior-kitchen-desk, interior-loft-stair, interior-wood, interior-stair-white, interior-stair-sofa, interior-kitchen-oven, interior-living-tv, interior-loft-ladder, interior-door-kitchen, interior-tall-loft | Kitchens, loft stairs with storage, timber surfaces, white stair, sofa and window front, built-in oven, TV lounge, loft ladder, view through the door, tall loft |
| production | 7 | production-cladding, production-frame-and-finish, production-hall-unit, production-interior-fitout, production-aframe-workshop, production-fitout-kitchen, production-fitout-benches | Unit on chassis with cladding and windows fitted, steel frame in the foreground with a finished unit behind on the yard, unit on supports in the hall, raw interior fit-out, A-frame shell in the workshop, kitchen under protective film, built-in benches |
| delivery | 2 | delivery-trailer, unit-trailer-gable | Unit on a low-loader in front of the factory; gable unit on a twin-axle chassis |
| transport | 3 | transport-road, transport-export-flags, transport-trailer-yard | Unit behind a tow vehicle on a country road; two units with Turkish and Azerbaijani flags prepared for delivery; two units on tandem-axle trailers on the yard |

What the photographs can and cannot support: they show **single tiny-house
units** and one workshop hall. There is no photograph of a multi-unit site, a
resort, a modular building larger than one unit, a crane lift, a foundation, or
any delivered project on a customer's site with an identifiable operator. The
export-flags photograph is the only image that documents a delivery outside
Türkiye's immediate context, and the destination is not stated.

## 2. Brand files (`assets/brand/`)

| File | Role |
|---|---|
| `modunera-master-logo-mountain-v1.png` | Master lockup, 2172×724 RGBA, terracotta mark + near-black wordmark; source of truth, deliberately not repainted |
| `…-300.png`, `…-600.png`, `…-900.png` | Header/footer lockup via `srcset`; `-600` is the Organization schema logo |
| `…-white-600.png` | White lockup for dark surfaces |
| `modunera-mark-v1.png` | 512×512 square mark; favicon and manifest icon |

Not present on this date although the README describes them: the sunrise-glow
master and its derivatives (band removed; files not in `assets/brand/` or
`assets/images/`). Derivatives are produced by `tools/generate-brand-assets.py`
(Pillow, outside CI). Legacy `assets/images/modunera-logo.png` and
`modunera-mark.png` are unreferenced.

Brand claim: "Design Your Nature", set in Caveat (14-character subset), `CLAIM`
in `build-modunera-v2.mjs`. No brand guideline document, no secondary marks, no
B2B sub-brand exist in the repository.

## 3. Colour tokens and type (`tools/design-system-v2.css`, `:root` block)

| Token | Hex | Role |
|---|---|---|
| `--moss` | `#3A5A40` | body text, dark surfaces, primary action (`--terracotta`, `--charcoal`, `--brand`, `--ink`, `--forest*` remap onto it) |
| `--leaf` | `#588157` | secondary action, hover, figures on light (4.1:1 on white: buttons, not small text) |
| `--sage` / `--beige` | `#A3B18A` | light accents on dark, chips, the brand claim |
| `--cream` | `#DAD7CD` | alternating sections, notices, accents on dark (5.4:1 on moss) |
| `--paper-white` / `--paper` | `#F5F5F5` | page ground |
| `--moss-deep` | `#2E4733` | footer, pressed states |
| `--roof` | `#97311A` | headings and navigation, sampled from the logo mark (6.95:1 on white, 1.02:1 on moss → headings on dark surfaces go white) |
| `--muted` | `#4A5748` | secondary text |
| `--line` / `--line-strong` | `rgba(58,90,64,.18 / .34)` | hairline rules |
| `--max` | `1200px` | container (`.nav>.container{--max:1460px}`) |
| `--r` | `8px` | radius; later passes add pill buttons and "glass" cards |
| `--sp-section` / `--sp-gap` | `60px` / `14px` | rhythm |

Type: `--display: "Poppins","Manrope",…` (Poppins self-hosted 400–800, latin +
latin-ext; Manrope is a fallback only). Scale: `--fs-display clamp(2.1rem,4vw,3.4rem)`,
`--fs-h1 clamp(1.85rem,3vw,2.7rem)`, `--fs-h2 clamp(1.45rem,2.2vw,2rem)`,
`--fs-h3 1.12rem`, `--fs-body .95rem`, `--fs-small .83rem`, `--fs-label .68rem`.
Headings 800 weight, `letter-spacing -.021em`, `text-wrap: balance`; `h4` is an
uppercase micro-label; `.eyebrow` is the system's signature mark; tabular figures
on every spec/price class. The file is 1,765 lines because it has grown by
passes (hero three times, phone four times, "glass everywhere", floating frame
and left rail from `build-shell-v3.mjs`); it is appended verbatim to
`assets/css/styles.css` between the palette markers on every build.

## 4. Component classes a B2B layer can reuse (`assets/css/styles.css`)

| Class | What it is | Fit for B2B |
|---|---|---|
| `.location-hero` / `.article-visual-hero` | Full-bleed photo hero, min-height 650, copy bottom-aligned, `.location-hero-content` | Project / sector landing heroes |
| `.data-strip` | 4-column bordered figure strip, tabular numerals | Project facts (units, m², phase) — only with evidenced numbers |
| `.answer-box` | Left-ruled direct-answer panel | "Who this is for" / summary blocks; already used for AI-answerability |
| `.editorial-copy` / `.editorial-split` | Two-column editorial feature with large h2 | Positioning and capability sections |
| `.state-grid` / `.state-card` | 4-up card grid (2-up on phone), label + h3 + muted p | Sectors, services, markets |
| `.check-list` | Unstyled list with 28px indent for a mark | Scope-of-supply and exclusions lists |
| `.nav-menu-wide` + `.nav-col` | Mega-menu panel; widens to three columns via `:has()` | A "Projects / Sectors" menu column |
| `.places-list` / `.state-place-grid` | 3-up (2-up phone) link grid | Market or region lists |
| `.faq-item` / `.faq-question` / `.faq-answer` | Accordion driven by `main.js`, opens on hash | Procurement FAQ |
| `.kpi-row`, `.stat-line`, `.benefit-number` | Figure rows | Only with evidenced figures |
| `.compare` + table | Scrollable comparison table (min-width 850) | Module / configuration comparison |
| `.process-item` | Numbered process rows (used for the 8 phases on `/factory/`) | Project delivery process |
| `.notice`, `.source-link`, `.legal-note` | Caveat panel, source citation, small print | Mandatory for claims with sources |
| `.project-card` / `.project-grid`, `.quality-card`, `.benefit-card`, `.value-card` | Image and card variants | Case studies once evidence exists |
| `.cta-band` | Gradient CTA band — currently `display:none!important` in the legacy sheet | Needs a v2 replacement, not reuse |
| `.btn`, `.btn-primary`, `.btn-outline`, `.btn-sand`, `.btn-dark`, `.btn-ghost`, `.btn-light` | Button set, pill radius after the later pass | Enquiry CTAs |
| `.section`, `.section-soft`, `.section-moss`, `.section-dark`, `.section-header` | Section rhythm and surfaces | All pages |
| `.breadcrumbs`, `.eyebrow`, `.muted` | Wayfinding and labels | All pages |
| Form markup from `enquiryForm()` (`build-modunera-v2.mjs`) and `build-location-enquiry.mjs` | Nine-field Netlify form with consent | Base for the enterprise proposal form (fields must be added in all three generators) |

Conventions to keep: `.post-row` titles in `<strong>`; every `<img>` gets
width/height and lazy loading from `build-image-attrs.mjs`; headings on dark
surfaces are white; small text never in `--leaf` on white.

## 5. Existing content that supports the brief

- Operator hub and six segments (`data/commercial.json`): campsite/glamping,
  holiday park/resort, hotel/nature hotel, marina/coast, municipality/tourism,
  tiny-house village/eco-village — DE and EN, with FAQ and "clarify before
  enquiring" lists, no reference project named.
- Services (`data/services.json`): Modulbau, Stahlbau, Bungalows, Containerbau,
  Möbel nach Maß — DE and EN.
- Ten tourism-region pages linking operator segments to German landscapes.
- `/factory/`: eight-phase production process (briefing → transport prep) and
  five hall photographs; `/qualitaet/`: twelve component cards without figures.
- `/projects/`: four use-case profiles (Nature Retreat, Compact Family, Forest
  Office, Garden Guest Suite) and a prepared but empty case-study framework.
- Production FAQ: 60 questions, 40 of which defer the figure to pending evidence.
- Daily practice posts 2026-10-15 to 10-24 written for operators.
- Market research shape (`data/market-research-2026-10.json`): segment counts,
  entry priorities, compliance items the report names — readable by people, not rendered.

## 6. What the brief needs that the repository does not hold → "asset needed"

| Need | Status | Note |
|---|---|---|
| Masterplan / site-plan visuals for resorts or housing communities | asset needed | No drawing, plan or diagram exists; no multi-unit layout |
| Concept renders of modular buildings larger than one unit | asset needed | Only the 46 single-model CGI renders in `assets/images/gallery/`, labelled "Visualisierung" |
| Factory video or tour footage | asset needed | No video anywhere in the repo; rights to publish factory media are §2 of `REQUIRED-BUSINESS-INPUTS.md` |
| Africa imagery (sites, deliveries, partners) | asset needed | No HTML page or data file mentions "Africa"; the only "Afrika" string is a `"Güney Afrika": 0` country counter in `data/market-signals.json` |
| Delivered-project photography with operator consent | asset needed | §8 of `REQUIRED-BUSINESS-INPUTS.md` |
| Crane / installation / foundation photography | asset needed | Not in `site-photos.json` |
| B2B brand assets (sub-brand, icon set, presentation template) | asset needed | Only the lockup, mark and claim exist |
| Technical drawings, data sheets, certificates as downloadable documents | asset needed | `/downloads/` holds the German catalogue PDF only; §3, §3a, §4 open |
| Team / management portraits and bios | asset needed | No person is named anywhere on the site |
| Multilingual B2B copy (beyond DE/EN) | asset needed | NL/DA/FR data files are consumer tiny-house copy; no B2B terms in slug tables |
| Map or diagram of markets served | asset needed | Could be built from `locales.json` and `pricing.json` delivery tariffs for the five markets only |
| Case-study template content | partial | Framework prepared on `/projects/`; no content allowed until a project may be named |
