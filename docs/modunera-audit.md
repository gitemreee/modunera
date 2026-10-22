# MODUNERA — as-is audit (2026-10-22)

Written against the 22 October 2026 master brief, before the procurement layer was added.
It covers what already existed, what the brief asks for that was missing, and the risks.

## 1. Stack and build

| Item | Finding |
|---|---|
| Framework | None. Static HTML, ~15,200 pages, published from the repository root by Netlify (`publish = "."`). |
| Build | ~25 Node generators in the order in `README-build.md`, then `validate-modunera.mjs` and `validate-seo-v7.mjs`. CI: `.github/workflows/build-modunera.yml`, `daily-post.yml`, `market-intelligence.yml`. |
| Package manager | None needed. Node built-ins only. |
| Content model | Data files in `data/*.json` feed the generators. Pages are never edited by hand. |
| Decision | Keep the stack. A migration to Next.js or Astro would put 15,000 indexed URLs at risk and gain nothing the brief needs (brief §13). |

## 2. SEO infrastructure

- Canonicals on every page. `validate-modunera.mjs` checks uniqueness (15,224 unique).
- hreflang comes from `tools/build-hreflang-v7.mjs`, built from clusters. Anything not in a cluster is stripped.
- Sitemap: `build-seo-governance-v7.mjs` writes only indexable canonicals (2,247 URLs). Location pages are governed by `data/location-index-policy.json` (1,561 approved routes). The ~7,000 legacy location pages are kept but most are noindex. That was a deliberate, data-led earlier decision, and it is left as it is (brief §12).
- Blocked claims: `data/blocked-claims.json` removes unproven phrases such as "own production" from the built HTML. The validator fails if any remain.
- Redirects: `netlify.toml` holds the MC→MD 301s, and `build-nordic-redirects.mjs` adds more.

## 3. Locales

DE (root), EN (`/en/`), NL, DA and FR come from `data/locales.json`. FR had tiny-house pages only, with no B2B content.

## 4. Brand

- Logo: `assets/brand/` master files and derivatives.
- Palette: the `:root` tokens in `tools/design-system-v2.css` (moss #3A5A40, roof #97311A, cream, sage).
- Claim: "Design Your Nature".
- Photos: real MODUNERA units, listed in `data/site-photos.json`. Model images are labelled as visualisations.

## 5. Forms, measurement, contact

- Netlify Forms has been enabled since 2026-10-18. The `projektanfrage` form (B2C, 9 fields) is used on location and contact pages. `project-proposal` (B2B, EN and DE, stepped) is used on the proposal pages.
- **Defect found:** `assets/js/main.js` showed "request received" even when the POST failed, because the `catch` only logged. It also copied every lead, personal data included, into `localStorage`. Both have now been fixed for project enquiries (see the plan).
- Analytics: GA4, GTM and Clarity load only when IDs exist in `assets/js/integration-config.json` **and** cookie consent is "all". No IDs are configured. `track()` is a no-op until then.
- WhatsApp: the verified number +90 553 543 5342, in a dock on every page.
- No file upload, no CRM, no server-side lead store beyond Netlify Forms.

## 6. Products and user journeys

- MD 1–MD 8 model pages, comparison, configurator, price indications from `data/pricing.json`, and country pages. All of these are untouched.
- The B2B layer went live on 2026-10-19:
  - `/en/solutions/` with three families (resorts, modular housing, prefabricated facilities)
  - `/en/how-we-work/` and `/en/concepts/` (three studies labelled "Concept — not built")
  - `/en/europe/`, `/en/africa/` ("no delivered project in Africa")
  - `/en/request-project-proposal/` (four steps plus review)
  - German twins of all of these

## 7. Gap against the brief

| Brief item | State before | Action |
|---|---|---|
| Building-type pages (camps, prefab houses, flat-pack, offices/sanitary, schools, healthcare) | Listed as bullets on `prefabricated-facilities` | Add 6 family pages, derived from the existing families |
| Industry pages (mining, EPC, energy, public, hospitality) | Linked to generic solution pages | Add 5 pages plus an `/en/industries/` hub |
| Company and capability (trust centre) | Only the Impressum | Add `/en/company/capability/` with a verified/on-request status per item |
| Export and logistics | Partly on the Africa page | Add `/en/company/export-logistics/` with a responsibility matrix |
| Procurement FAQ | None | Add `/en/resources/procurement-faq/` |
| Quick enquiry | None | Add a 7-field `quick-enquiry` form using the same field names as the full brief |
| RFQ: reference, UTM, currency, temporary/permanent, m², off-grid, installation | Missing | Add the fields; JS fills reference and attribution |
| Success only after a real save | Not true | Fixed |
| Africa hub: segments, scales, shipping, procurement models | Partly | Extend the existing page (no duplicate route) |
| FR Africa hub | None | Add `/fr/afrique/`, with an hreflang cluster DE/EN/FR |
| Homepage dual funnel | B2B-led EN home | New hero copy and two division doors under the hero |
| Measurement events | `whatsapp_click`, `lead_form_submit` | Add the `rfq_*`, `b2b_cta_click`, `whatsapp_project_click` and `language_switch` events |
| Country pilots Ghana, Nigeria, Kenya | None | **Deferred.** No verified local content (ports, permits, partners) exists, and the brief forbids template pages. |

## 8. Risks

1. **Nav density.** The EN bar now has 11 entries. It fits at 1366 px; narrower desktops wrap into the mobile drawer as before. The B2B entries replace the two existing ones rather than adding to them.
2. **Netlify field lists.** Netlify registers fields per form name from the deployed HTML. New `project-proposal` fields were therefore added to EN **and** DE. `quick-enquiry` is a new form that needs its own notification (an owner action).
3. **Unproven figures.** "500+ units" is owner-stated. It is labelled so on the capability page.
4. **Photographs on non-tiny-house pages** (schools, clinics). These are real MODUNERA units, and each alt text says "not a [building type]".
5. **No German or French versions of the family and industry pages.** Without twins, these pages carry no hreflang.
