# 16 — Implementation handoff

## Where the B2B layer lives
- `data/b2b.json` — all copy and structure (home, solutions, lifecycle, concepts, regions, proposal form).
- `tools/build-modunera-v2.mjs` — `buildB2B()` and the page functions above it; `b2bMenu()` feeds the English menu.
- `tools/build-modunera-europe.mjs` — `englishHome()` reads `data/b2b.json`.
- `tools/design-system-v2.css` — the B2B block at the end.
- `assets/js/main.js` — stepped forms (`form[data-steps]`) and `data-no-whatsapp`.

## To change copy
Edit `data/b2b.json`, run the pipeline in README order, run both validators,
commit the generated HTML with the data change.

## To add a concept
Add an object to `concepts` with `project_status` from the brief's list; the
diagram is `{cols, rows, shared[], service[]}` in grid cells. Only
`completed_verified` / `under_construction_verified` / `contracted_verified`
may carry a client name, and only with written permission (doc 11).

## To add a language
Sibling object per language in `data/b2b.json`, a second `buildB2B(lang)`
call, hreflang pairs in `head()` — follow `data/commercial.json`.

## Status table (brief §30)

| Work package | Status | Route / file | Test | Risk / blocker |
|---|---|---|---|---|
| Design system | Partial — B2B components added, palette kept | `tools/design-system-v2.css` | validators, screenshots | none |
| Homepage | Done (EN) | `/en/` | validators, 1440/390 screenshots | mobile hero order (doc 13) |
| Solution pages | Done (3 + hub) | `/en/solutions/*` | validators, screenshots | copy is scope-safe; references blocked on doc 11 |
| Lifecycle | Done | `/en/how-we-work/` | validators | — |
| Concepts | Done (3 + hub) | `/en/concepts/*` | validators, screenshot | schematic only; renders = asset needed |
| Regions | Done (EN) | `/en/europe/`, `/en/africa/` | validators, screenshot | Africa is "under assessment" by design |
| Project enquiry | Done, pending live test | `/en/request-project-proposal/` | stepping tested; POST on preview | file upload, UTM, CRM |
| SEO migration | No URL moved | `docs/redesign/09-seo-migration-map.csv` | gates pass | CI idempotency gate on PR |
| Languages | EN only | — | — | doc 08 |
