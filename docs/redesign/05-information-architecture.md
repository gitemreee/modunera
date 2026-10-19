# 05 — Information architecture (M1/M2 slice, 2026-10-19)

The brief's target sitemap (§8) was mapped onto the site that exists. The rule
was: add routes, never move or retire an indexed one in this phase. Deviations
from the brief are listed with the reason.

## Routes built in this slice (all English, all `index,follow`)

| Route | Brief section | Source |
|---|---|---|
| `/en/` (rewritten) | §10 home sections 01–12 | `data/b2b.json` → `englishHome()` in `tools/build-modunera-europe.mjs` |
| `/en/solutions/` | §4, §8 | `data/b2b.json` → `buildB2B()` in `tools/build-modunera-v2.mjs` |
| `/en/solutions/resorts/` | §4 A | same |
| `/en/solutions/modular-housing/` | §4 B | same |
| `/en/solutions/prefabricated-facilities/` | §4 C | same |
| `/en/how-we-work/` | §5 | same |
| `/en/concepts/` + 3 concept pages | §12 | same; `project_status: concept_unbuilt` on every one |
| `/en/europe/` | §6.2 | same |
| `/en/africa/` | §6.3–6.4 | same |
| `/en/request-project-proposal/` | §13 | same; Netlify form `project-proposal` |

## Deviations from the brief's sitemap, and why

- **`/en/regions/europe/` and `/en/regions/africa/` → `/en/europe/`, `/en/africa/`.** `/en/regions/` is already the hub of the ten German tourism-region pages (added 2026-10-14, indexed, linked from the Countries menu). Nesting continents under it would mix two taxonomies. Short top-level routes instead.
- **`/en/sectors/*`, `/en/project-types/*`, `/en/how-we-work/<stage>/`, `/en/markets/<country>/`, `/en/insights/*`, `/en/company/`, `/en/factory/`, `/en/materials-quality/`, `/en/sustainability/`, `/en/technical-resources/`, `/en/downloads/`** — not built. Sectors are a section on the solutions hub and the home; project types are the "typical configurations" table on each solution page; stages are the eight cards on one page. Separate pages would be thin until the owner supplies what they would say (docs 11 and 15). Company/factory/quality pages exist in German (`/unternehmen/`, `/produktion/`, `/qualitaet/`) and are the next slice once the evidence questions are answered.
- **`/en/tiny-houses/`** — not added; `/en/models/` is the canonical catalogue route and is linked from the home, the menu and the solutions hub.
- **`/en/projects/`** — deliberately absent: there is no verified project to list. The concepts hub says so and names the status under which one would appear.

## Navigation (English)

Solutions · Europe & Africa · Tiny houses · Countries · Other structures · Guides · Blog · FAQ · Request a proposal · Contact.
"Advantages" left the top bar (it stays in the Tiny houses column). The German menu is unchanged in this phase.

## Lifecycle of a URL from here

Every route above is in the sitemap and carries a self-referential canonical and no hreflang (English only; a German twin would add the pair the way `data/commercial.json` does). None of the 15,182 pre-existing URLs changed path, canonical or robots in this slice except `/en/legal/privacy/`, which was wrongly `index` and is now `noindex` as governance always intended (see README-build.md, run order note).

## Slice 2 (2026-10-19): German twins

| DE route | EN route |
|---|---|
| `/loesungen/` | `/en/solutions/` |
| `/loesungen/resorts/`, `/loesungen/modulares-wohnen/`, `/loesungen/vorgefertigte-einrichtungen/` | the three solution pages |
| `/so-arbeiten-wir/` | `/en/how-we-work/` |
| `/konzepte/` + `waldresort`, `modulare-wohnsiedlung`, `arbeiter-campus` | `/en/concepts/` + three studies |
| `/europa-projekte/` | `/en/europe/` (`/europa/` was avoided: `blog/europa/` and `faq/europa/` already use the word) |
| `/afrika/` | `/en/africa/` |
| `/projektanfrage-b2b/` | `/en/request-project-proposal/` (same Netlify form, `locale` field tells them apart) |

German menu: a "Lösungen" dropdown first, containing the solutions, concepts,
how-we-work, Europe, Africa and the B2B enquiry. Turkish is not planned.

Also fixed in slice 2: the operator pages and the tourism-region pages carried
DE/EN alternates from `head()` that `build-hreflang-v7.mjs` stripped because
it had no table for them; all three families are now clustered.
