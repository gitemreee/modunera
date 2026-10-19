# 13 — QA and test report (slice 1, 2026-10-19)

Everything below was actually run in this session on the feature branch.

| Check | Command / method | Result |
|---|---|---|
| Full pipeline, 24 steps in README order | `pipeline.sh` (scratch runner mirroring README-build.md) | all 24 ok |
| Gate 1 | `node tools/validate-modunera.mjs` | exit 0 — 15,193 pages, 15,193 unique canonicals, 37,887 JSON-LD blocks, 1,973,040 local references checked |
| Gate 2 | `node tools/validate-seo-v7.mjs` | exit 0 — 0 blocked claims, 0 pattern hits, 0 failures |
| New routes exist | `ls en/solutions en/how-we-work en/concepts en/europe en/africa en/request-project-proposal` | 13 new pages |
| Render, console, overflow | Playwright (Chromium) at 1440 and 390 px: `/en/`, `/en/solutions/resorts/`, `/en/concepts/forest-hospitality-village/`, `/en/africa/`, `/en/request-project-proposal/` | h1 present, 0 console errors, no horizontal overflow on any page |
| Mega menu | hover "Solutions" at 1440 px | panel opens with 6 entries, nav fits one row |
| Stepped form | Playwright: Continue with empty required fields → stays on step 1; fill required → steps 1→2→3→4→5 | as expected |
| Form submission | POST to deploy-preview-3 | 200; Netlify registered `project-proposal` with 29 fields; the test submission was read back and deleted |
| `/en/legal/privacy/` robots | grep after rebuild | `noindex,follow` (was `index`; run order fixed) |
| Idempotency | second pipeline pass | not run locally this time; CI gate runs it on the PR |

## Known gaps in this slice
- No Lighthouse run yet (`12-performance-accessibility-report.md` pending).
- `project-proposal` form is registered only after the first Netlify deploy of this branch.

## Slice 2 (2026-10-19)
| Check | Result |
|---|---|
| Pipeline + both validators | exit 0; 15,205 pages, 2,228 sitemap URLs, 0 blocked claims |
| Mobile first screen, 390×844 (hero image 400 → 260 px) | `/en/` H1 515–563 px, CTA bottom 680; `/` H1 568–616, CTA 750; `/nl/` H1 585–634, CTA 750 — all above 844 |
| German B2B pages (resorts, concept, proposal at 390 px, menu) | h1 present, 0 console errors, no overflow |
| hreflang | DE/EN pairs on B2B, operator and region pages: `de-DE`, `en`, `x-default`; validator reciprocity passes |
