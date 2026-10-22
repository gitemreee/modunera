# MODUNERA — implementation plan, procurement layer (2026-10-22)

Branch: `claude/b2b-procurement-expansion`. Nothing is deployed to production without the owner's "yayınla".

## Principles

- Extend what exists. No second solutions, Africa or proposal route. New pages are derived from the existing families.
- One source of truth. All new content lives in `data/b2b-catalog.json`, rendered by `tools/build-modunera-v2.mjs` (`buildCatalog`). `data/b2b.json` and `data/b2b-de.json` keep the existing pages.
- Honesty labels on every page:
  - Each family is a "Project-specific concept — subject to engineering and capacity confirmation".
  - Each technical row is either a *MODUNERA reference* or *Set per project*.
  - Scales are *Illustrative*.
  - Company facts are *Verified* or *Owner-stated*.

## Done in this branch (P0 + P1, plus the FR part of P2)

| Phase | Change | Files |
|---|---|---|
| 1 | EN menu: "Modular solutions" (families, building types, projects and company) and "Industries & markets" | `tools/build-modunera-v2.mjs` (`b2bMenu`) |
| 1 | EN home: hero "Designed spaces. Scalable projects.", CTAs Explore tiny houses / Explore modular projects, two division doors, building-type cards, industry links | `tools/build-modunera-europe.mjs`, `data/b2b.json` |
| 2 | 6 family pages under `/en/solutions/` | `data/b2b-catalog.json` `families` |
| 2 | `/en/industries/` hub plus 5 industry pages | `industries` |
| 2 | Building-type sections on `/en/solutions/` and `/en/solutions/prefabricated-facilities/` and `modular-housing/` | `solutionsHubPage`, `solutionPage` |
| 2 | `/en/company/capability/`, `/en/company/export-logistics/`, `/en/resources/procurement-faq/` | `capability`, `export_logistics`, `procurement_faq` |
| 3 | `/en/africa/`: new hero, DR Congo, Guinea and Libya added to "under assessment", segments, scales, shipping matrix, procurement models, trust links, quick enquiry | `data/b2b.json`, `en_africa` |
| 3 | `/fr/afrique/`, native French copy, hreflang DE/EN/FR | `fr_africa`, `tools/build-hreflang-v7.mjs` |
| 4 | Quick enquiry (`quick-enquiry`, 7 fields) on every new page, on Africa and on the proposal page | `quickForm()` |
| 4 | Full brief: temporary/permanent, m², currency, delivery window, power/water, installation scope, solution options for prefab houses and flat-pack, hidden reference/UTM/landing/product family | `data/b2b.json`, `data/b2b-de.json` |
| 4 | JS: confirmation only after a Netlify 2xx, error box otherwise, double-submit guard, reference code `MOD-YYMMDD-XXXXX`, first-touch UTM in sessionStorage, `?family=` preselect, no lead copy in localStorage | `assets/js/main.js` |
| 5 | Events `rfq_start`, `rfq_step_complete`, `rfq_validation_error`, `rfq_submit_success`, `rfq_submit_error`, `b2b_cta_click`, `whatsapp_project_click`, `language_switch` (consent-gated, no typed content) | `assets/js/main.js` |
| 5 | CSS for the basis tags, process steps, RFQ box, error box and division cards | `tools/design-system-v2.css` |

## Backlog (not done, and why)

1. **Ghana, Nigeria, Kenya pilot pages (P2).** These need original, verified local content: port, inland route, permit authority, partner model. Writing it from general knowledge would be the template content the brief forbids. Owner input: countries with real enquiries, and any local partner.
2. **DRC and Guinea French pages.** Same reason. Expert confirmation of public-procurement rules is needed first.
3. **DE/FR twins of the family and industry pages.** These are translations into the existing `b2b-de.json` structure, best done after the owner reviews the EN copy.
4. **Downloadable capability pack / datasheets.** No real document exists, so none is published.
5. **File upload.** There is no secure storage, so drawings go by e-mail (brief §10).
6. **CRM.** `integration-config.json` already has a `crmEndpoint` hook, and the data model is in `docs/rfq-data-model.md`. Choose HubSpot, Zoho or Pipedrive, then add the endpoint. No keys go in the repo.
7. **Server-side validation and rate limiting** beyond Netlify's spam filter and honeypot. This would need a Netlify Function, a paid-plan question for the owner.
8. **Lighthouse / Core Web Vitals.** Not measured here; no field data is available in this environment.
