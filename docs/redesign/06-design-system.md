# 06 — Design system notes for the B2B layer

No new palette, no new typeface, no change to the logo. The brief's "starting
hypothesis" tokens (§9.2) were **not** applied: the site has a documented
token system in `tools/design-system-v2.css` (Moss `#3A5A40`, Leaf `#588157`,
Sage `#A3B18A`, Cream `#DAD7CD`, White `#F5F5F5`, roof red `#97311A` for
headings; Poppins/Manrope/Caveat) and the brief says to inspect before
changing. It was inspected and kept.

## What was added (appended to `tools/design-system-v2.css`, generated into `assets/css/styles.css`)

| Class | Purpose | Used on |
|---|---|---|
| `.status-badge` (+ `.is-verified`) | separates a concept from a verified project; red dot = not built, green = verified | concepts, home, solutions hub |
| `.lifecycle` | eight numbered stage cards, 4/2/1 columns | how-we-work, home |
| `.scale-strip` | 1 / 10–20 / 50–100 / 100+ units | home |
| `.plan-diagram` | schematic SVG plan with caption | concept pages |
| `.module-mix` | module count table | concept pages |
| `.tier-list` | market tiers / focus groups | Europe, Africa |
| `.form-steps`, `.step-indicator`, `.step-nav`, `.consent-row`, `.form-done` | the stepped proposal form; without JS every fieldset is visible | proposal |

Everything else reuses the catalogue classes: `page-hero`, `location-hero`,
`data-strip`, `answer-box`, `editorial-copy`, `state-grid`/`state-card`,
`journey-grid`/`journey-card`, `check-list`, `compare`, `faq-item`,
`section-dark`, `btn-*`.

## Imagery rules applied

Real photographs only (`data/site-photos.json`). The concept pages show one
real unit "for scale" with a caption saying it is not the concept. The
masterplans are schematic SVG rectangles, captioned as such. The MD collection
image on the home is captioned "Visualisation". No stock, no AI renders.

## Motion and accessibility

No new animation. Stepped form: keyboard reachable, `reportValidity()` on
required fields, focus moves to the first field of the step, `prefers-reduced-
motion` untouched (the site already honours it). `role="status"` on the
success block.
