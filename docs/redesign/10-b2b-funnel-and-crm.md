# 10 — B2B funnel and lead data

## Entry points
Home hero → `/en/request-project-proposal/`; every solution, concept and
region page ends in the same CTA band; the operator pages (`/gewerblich/`,
`/en/commercial/`) keep their shorter `projektanfrage` form for campsites,
parks, hotels, marinas, municipalities and villages.

## The proposal form (`project-proposal`, Netlify Forms)
Five steps: identity → definition → commercial fit → technical brief → review
and consent. Required: organisation, contact name, business e-mail, solution,
site country, units band, privacy consent. Marketing consent is separate and
unchecked. Hidden: `locale`, `source_path`, `privacy_version`. Honeypot
`bot-field`. Submission is an URL-encoded POST handled by `assets/js/main.js`
(the same path as every other form on the site); on success the form hides and
a `role="status"` block confirms. WhatsApp is not opened for this form.

Not yet: file upload (Netlify Forms supports multipart up to 8 MB; the shared
AJAX path does not — a follow-up), UTM capture (consent-gated analytics has
no UTM reader yet), a request ID (Netlify assigns one; it is not shown).

## Field → CRM mapping (brief §13.3)
| Form field | CRM field |
|---|---|
| organisation | company_name |
| contact_name, business_email, phone, role, website | contact_* |
| solution | project_type |
| site_country, site_location | country, site |
| project_phase | project_stage |
| units_band, budget_band, scope_requested, funding_stage, procurement_model, land_status | same |
| procurement_date | anticipated_procurement_date |
| climate_note, utilities_note, access_note, drawings, message | message block |
| privacy_consent, marketing_consent, privacy_version | consent_at (Netlify timestamp), privacy_version |
| locale, source_path | locale, source_path |

## Routing and scoring (internal)
Enterprise project: 20+ units, land secured or funded, decision role named.
Qualified mid-market: 10–49 units, phase ≥ design. Early-stage: idea, no land.
Private tiny-house buyer: 1–9 units, solution "other" or MD interest → the
B2C path. Out of scope: countries under sanctions or no feasible route.
Scores are never shown to the user.

## Where leads land today
Netlify Forms (dashboard + e-mail notification to emre@modunera.com). There is
no CRM. The prospect spreadsheet of 2026-10-15 and these leads belong in one
system; the owner chooses it (HubSpot free, Pipedrive, or a sheet) — doc 15.
