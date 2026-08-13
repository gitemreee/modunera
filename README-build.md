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
| `…-white-600.png` | white lockup for the phone brand band |
| `modunera-mark-v1.png` | square mark, 512×512, favicon and manifest |
| `modunera-digital-sunrise-glow-v1.png` | glow master, 1774×887 (source of truth) |
| `…-900/1400.webp`, `…-1400.jpg` | glow band, 11–38 KB instead of 1.2 MB |

The master lockup appears in the header and footer of every page, the mark is
the favicon and manifest icon, and the Organization schema logo points at
`…-600.png`. The glow artwork has exactly one placement per language: the
`#brand-overture` band above the home page hero, full bleed so its own gradient
becomes the band and no card edge can appear. Below 769px the `<picture>` falls
back to the white lockup and the glow is recreated in CSS, because the artwork's
wordmark would be roughly ten pixels tall on a phone.

`assets/images/modunera-logo.png` and `modunera-mark.png` are kept as legacy.
Nothing references them any more; they can be deleted once that has been
confirmed in production.

## Pricing consistency

`tools/build-modunera-v2.mjs` reads `data/pricing.json` and cross-checks every
base price and delivery tariff against `assets/js/configurator.js`. If the two
drift apart the build fails with the offending entries listed, so the comparison
pages cannot advertise a price the configurator does not charge.

No delivery tariff is stored for Luxembourg. The price comparison shows "auf
Anfrage" for that row rather than inventing a figure. Adding `LU` to the
`extras.delivery` map in `assets/js/configurator.js` and to `data/pricing.json`
turns it into a normal row.

## Validation

`tools/validate-modunera.mjs` exits non-zero on: a missing canonical, duplicate
canonicals, missing `lang`, invalid JSON-LD, a broken local link, a missing
brand colour, a surviving legacy brand string, or a duplicated country/service
link in the homepage navigation. It also asserts the required page set exists.

Current numbers: 14,859 pages, 14,859 unique canonicals, 14,855 sitemap URLs,
36,960 JSON-LD blocks, 938,094 local references checked with none broken.
