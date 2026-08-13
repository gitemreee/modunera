# MODUNERA build pipeline

Static HTML/CSS/JS, published by Netlify straight from the repository root
(`netlify.toml` → `publish = "."`). There is no framework and no build step at
deploy time — the generators below produce the committed HTML.

## Run order

```bash
node tools/rebrand-modunera.mjs        # brand normalisation, legacy asset removal
node tools/build-modunera-europe.mjs   # countries, regions, cities, services, Europe guides
node tools/build-modunera-v2.mjs       # navigation, comparison pages, guide hub, sitemaps
node tools/validate-modunera.mjs       # gate: canonicals, JSON-LD, links, brand, colours
```

The order matters. `build-modunera-europe.mjs` writes its own six-link
navigation into the pages it generates; `build-modunera-v2.mjs` then replaces
every `<nav class="nav">` on the site with the shared mega-menu and rebuilds the
sitemaps so the pages it adds are indexed. Running the Europe build without the
v2 layer afterwards leaves the site with two different menus.

All four are idempotent — a second run changes nothing.

## Where to edit what

| Change | File |
|---|---|
| Visual language: type scale, spacing, cards, colours | `tools/design-system-v2.css` |
| Navigation entries | `MENU` in `tools/build-modunera-v2.mjs` |
| Brand claim ("Design Your Nature") | `CLAIM` in `tools/build-modunera-v2.mjs` |
| WhatsApp dock copy and services | `whatsappDock()` / `WA_SERVICES` in `tools/build-modunera-v2.mjs` |
| Model specs and prices | `data/pricing.json` |
| Guide categories | `GUIDE_CATEGORIES` in `tools/build-modunera-v2.mjs` |
| New market guides | `MARKET_GUIDES` in `tools/build-modunera-v2.mjs` |
| Country copy, permits, regions | `COUNTRIES` in `tools/build-modunera-europe.mjs` |
| Location data | `data/europe-locations-source.json` |

Never edit `assets/css/styles.css` between the `MODUNERA BRAND PALETTE`
markers — that block is regenerated from `tools/design-system-v2.css` on every
build. Edits outside the markers survive, but the generated block is appended
last and therefore wins on equal specificity.

## Brand assets

`assets/brand/` holds the two master files under their original names, plus the
derivatives `tools/generate-brand-assets.py` produces from them. That script is
deliberately outside the four-command pipeline: it needs Pillow, which CI does
not install, and its outputs are committed. Re-run it only when a master file
changes.

| File | Role |
|---|---|
| `modunera-master-logo-mountain-v1.png` | master lockup, 2172×724 RGBA (source of truth) |
| `…-300/600/900.png` | header and footer lockup, served via `srcset` |
| `…-white-600.png` | white lockup, for dark surfaces |
| `modunera-mark-v1.png` | square mark, 512×512, favicon and manifest |
| `modunera-digital-sunrise-glow-v1.png` | glow master, 1774×887 (source of truth) |
| `…-900/1400.webp`, `…-1400.jpg` | glow band, 11–38 KB instead of 1.2 MB |

The master lockup appears in the header and footer of every page, beside the
handwritten claim "Design Your Nature". The mark is the favicon and manifest
icon, and the Organization schema logo points at `…-600.png`.

The sunrise-glow artwork and its derivatives are kept but **not currently placed
on the site** — the overture band it sat in was removed. They are ready for a
campaign or brand-story slot; nothing references them today.

`assets/images/modunera-logo.png` and `modunera-mark.png` are kept as legacy.
Nothing references them any more; they can be deleted once that has been
confirmed in production.

## Product codes

The models are **MD 1 – MD 8**. The rename from MC touched the visible codes and
the model URLs (`/modelle/md-N/`, with 301 redirects from the old paths in
`netlify.toml`). Two things deliberately did not move:

- the gallery filenames (`mc1-exterior.webp`) — internal, never shown
- the JavaScript model keys (`mc1`…`mc8`) in `studio.js`, `configurator.js` and
  `data/pricing.json` — visitors have configurations saved under those keys in
  localStorage, and renaming them would silently break every saved design

`tools/rebrand-modunera.mjs` carries the code and URL rules, so a rebuild keeps
them normalised.

## Pricing consistency

`tools/build-modunera-v2.mjs` reads `data/pricing.json` and cross-checks every
base price and delivery tariff against `assets/js/studio.js` — the file the site
actually loads — and against `assets/js/configurator.js`, which is dead code kept
in the tree so the two cannot silently diverge. If any of them drift the build
fails with the offending entries listed, so the comparison pages cannot advertise
a price the configurator does not charge.

All five target markets have a tariff. Luxembourg is an average (7,000 EUR) and
is labelled as one; Denmark rides the configurator's Scandinavia tariff and says
so. Adding a market means adding it to both JS files, both delivery selects
(`konfigurator/index.html`, `studio/index.html`) and `data/pricing.json`.

## Validation

`tools/validate-modunera.mjs` exits non-zero on: a missing canonical, duplicate
canonicals, missing `lang`, invalid JSON-LD, a broken local link, a missing
brand colour, a surviving legacy brand string, or a duplicated country/service
link in the homepage navigation. It also asserts the required page set exists.

Current numbers: 14,859 pages, 14,859 unique canonicals, 14,855 sitemap URLs,
36,960 JSON-LD blocks, 1,060,908 local references checked with none broken.

Beyond the gate, a Chromium pass over 67 pages at 390/768/1440px checks every
page for script errors and horizontal overflow.
