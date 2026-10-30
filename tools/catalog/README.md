# MODUNERA catalogue and price offer (print)

Sources for the German print catalogue `MODUNERA-Katalog-2026-DE.pdf` (A4 portrait, terracotta/anthracite design) and the price-offer input template.

| File | What it does |
|---|---|
| `exploded2.py` | Draws the exploded isometric house and the wall section as SVG (`exploded-house.svg`, `exploded-section.svg`) |
| `build3.py` | Builds the A4 catalogue → `MODUNERA-Katalog-2026-DE.pdf` (current version) |
| `build2.py` | Earlier square-format catalogue; `build3.py` reads its model data (`MODELS`, `LINES`, `ICONS`) |
| `teklif_sablon.py` | Writes `MODUNERA-Teklif-Fiyat-Sablonu.xlsx`, the price template the owner fills in (yellow cells) |
| `img/` | Model visualisations from the old MC Tiny brochure, plus a delivery photo from `assets/images/photos/` |
| `fonts/` | Barlow, Barlow Semi Condensed, Fraunces, Inter (Google Fonts, OFL), Poppins, Caveat |

## Rebuild

```
cd tools/catalog
python3 exploded2.py
python3 build3.py
```

This needs Python with Playwright and Chromium (`/opt/pw-browsers/chromium` in the cloud session). The HTML intermediate (`katalog*.html`) is git-ignored. Nothing here is part of the site build pipeline, and no generator reads it.

## Content rules

- Statistics carry their source on the page and in the closing source list: Destatis, BWI 2022, Interhyp/YouGov, DEVK/Civey, IfW/GREIX, Antonelli 2019.
- Model images are marked as visualisations.
- "500+ units" and the "190-house village" are marked as owner-stated.
- The permit text says that permanent living in Germany normally needs a building permit. The old MC brochure claimed otherwise, and that claim must not come back.
- The rental figure is an example with stated assumptions, not a forecast.

## Next

When the filled-in price template comes back:
- add a German price offer in the same design: cover, per-model prices with package contents, extras and transport, total band, terms;
- update the site prices in `data/pricing.json`, then add MD 9 and the 6–10 m lengths.
