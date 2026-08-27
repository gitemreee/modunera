# SEO_AUDIT — modunera.com

Date: 2026-08-25 · Every number below was measured on this repository or on the
live site; nothing is estimated. Where a fix is already applied, the row says so.

## Architecture (mapped)

Static HTML, no framework, no deploy-time build. 18 generators + 2 validators in
`tools/`, fixed order in `README-build.md`. Content lives in generators and
`data/*.json` (pricing, services, news, blog, quality, photos, policies).
Canonicals self-referential per page; hreflang via `build-hreflang-v7.mjs`
(165 five-language clusters); sitemap index → `sitemaps/sitemap-0001.xml`,
owned by `build-seo-governance-v7.mjs`, noindex never in sitemap (validated).
Robots.txt: allow all + 2 disallows. Redirects: `_redirects` (441 rules),
generated. Analytics: consent-gated events, no IDs in repo. Forms: none —
WhatsApp deep links only. Images: WebP, width/height set, lazy below fold.

## Index state

15,181 HTML pages · 1,713 indexable (11%) · 13,468 held at noindex by
`data/location-index-policy.json` (evidence-gated: 157 on search evidence,
1,026 on quality score ≥75). GSC 3-month: 26 clicks, 565 impressions; 85% of
clicks from location pages (opened 2026-08-19, Google re-crawling — 1,062 in
"Discovered, not yet indexed", trending down).

## Findings

| Pri | Problem | SEO | CTR | Conv | Fix | Status |
|---|---|---|---|---|---|---|
| P0 | `/studio/` = `/konfigurator/`: identical `<title>`, 94% identical main (6-gram Jaccard), both self-canonical, ~3,100 internal links each — the money tool split in two | high | med | high | 301 studio→konfigurator, retarget all links at source, retitle survivor commercially | **FIXED 2026-08-25** |
| P0 | `/tiny-house-deutschland/` vs `/laender/deutschland/`: same query family ("tiny house deutschland/kaufen/hersteller"), 755 vs 1,436 inbound; hub carries the hreflang cluster | high | med | med | 301 LP→hub; blog guide retitled off the money query ("Projektleitfaden … von Grundstück bis Übergabe") | **FIXED 2026-08-25** |
| P0 | Model titles descriptive, not commercial: "MD 1 – Panorama und Loft \| MODUNERA Tiny House" — no price, no size, no intent in the snippet | med | high | high | `MD n Tiny House kaufen \| 8,00–9,70 m \| ab 44.900 € \| MODUNERA` from pricing.json, five languages, price appended to description | **FIXED 2026-08-25** |
| P0 | 7,400+ German location pages as scaled-content risk | high | – | – | Already governed: evidence-gated allow-list, 13,468 noindex, scorer + register in place | **DONE 2026-08-19** (report: LOCAL_SEO_QUALITY: `data/location-index-policy.json` counts block) |
| P1 | Guide inflation: 50 topic families each split into Leitfaden + Fehler-Checkliste (+ third variant); intra-family duplication measured 0.29–0.55 Jaccard — the same intent split 2–3 ways, 112 indexable blog folders | high | med | low | Merge per family into one guide, fold checklist in as section, 301 the rest. Plan with per-family measurements: `CONTENT_PRUNING_PLAN.md` | PLANNED (next phase) |
| P1 | Lead capture is WhatsApp-only; a buyer who won't open WhatsApp leaves nothing | – | – | high | Netlify Forms endpoint (static-compatible, no server): name/email/country/model/budget + honeypot; WhatsApp stays | OPEN |
| P1 | Homepage ships 3.26 MB images desktop / 2.43 MB mobile; local LCP 2.07s desktop (element: aframe-olive-grove-760.webp) — real-network LCP will exceed 2.5s on 4G | med | med | med | Ship smaller hero derivative, fetchpriority=high on LCP img, drop below-fold eager loads | OPEN |
| P1 | 531 titles >60 chars remain (down from 1,506) — mostly blog editorial; per-title judgement | med | high | – | Shorten during pruning merges (same pages, one pass) | PARTIAL |
| P2 | `/modelle/` had NO robots meta while in sitemap — governance only stamped classified pages | low | – | – | Governance now stamps explicit INDEX on unclassified pages | **FIXED 2026-08-25** |
| P2 | 248 descriptions >160 chars | – | med | – | Same generator pass as titles | OPEN |
| P2 | Title collisions: da/fr Luxembourg pages share one title; "Au" (ZH) vs "Au" (SG) share; fr/nl bungalows share | low | low | – | Disambiguate in generators (canton/language in title) | OPEN |
| P2 | `/katalog/` vs `/modelle/` — checked: 0.0 Jaccard, genuinely different (catalog viewer vs model grid). No consolidation | – | – | – | none needed | VERIFIED |
| P3 | CWV: CLS 0.011–0.048 ✓, INP n/a (static) ✓; only image weight (see P1) | – | – | – | – | – |
| P3 | Sitemap is one 1,713-URL part; split by type (models/commercial/guides/locations) aids diagnosis, not ranking | low | – | – | Split in governance when >5k indexable | DEFERRED |

## What was deliberately NOT done

- No new pages created (owner's directive: cleanup first). `/tiny-house-kaufen/`
  etc. from the brief's §8 wait until pruning shows which existing page re-intents.
- No E-E-A-T additions: blocked on `REQUIRED-BUSINESS-INPUTS.md` §1 (Impressum).
  No certification/review/award claims exist and none were added (§49).
- Daily practice series continues (owner ordered 90 days explicitly on
  2026-08-16); it is practical evergreen, not query-variant spam, and is exempt
  from pruning. Flagged: §24/25 of this brief and that order are in tension —
  owner's call which wins after the 90 days.
