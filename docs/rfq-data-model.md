# RFQ data model — quick enquiry and full project brief

Two Netlify forms share one set of field names, so an export of either maps onto one CRM record.

| Field | quick-enquiry | project-proposal | Notes |
|---|---|---|---|
| `enquiry_type` | `quick` | `full` | hidden |
| `ref` | ✓ | ✓ | hidden, `MOD-YYMMDD-XXXXX`, generated in the browser at submit and shown to the buyer |
| `business_email`, `organisation`, `contact_name` | ✓ required | ✓ required | |
| `site_country` | ✓ required | ✓ required | |
| `solution` | ✓ required | ✓ required | same option list; options carry `data-family` codes |
| `capacity_note`, `message` | ✓ optional | ✓ | |
| `phone`, `role`, `website`, `site_location`, `project_phase`, `units_band`, `land_status`, `use_duration`, `floor_area` | – | ✓ | |
| `budget_band`, `currency`, `procurement_date`, `delivery_window`, `scope_requested`, `funding_stage`, `procurement_model` | – | ✓ | |
| `climate_note`, `utilities_note`, `access_note`, `drawings`, `offgrid`, `installation_scope` | – | ✓ | |
| `product_family` | ✓ | ✓ | `MOD-WC` etc., from the page or `?family=` |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `landing_page` | ✓ | ✓ | first touch of the session (sessionStorage only) |
| `locale`, `source_path`, `privacy_version` | ✓ | ✓ | hidden |
| `privacy_consent` | ✓ required | ✓ required | |
| `marketing_consent` | ✓ optional, unticked | ✓ optional, unticked | separate from the service consent |

## Internal routing (applied by the team or a CRM, never shown to the buyer)

| Field | Route |
|---|---|
| `site_country` in Africa | B2B-Africa |
| `site_country` in Europe | B2B-Europe |
| `solution` = Resort or hospitality | Hospitality |
| `procurement_model` = Public tender | Public Tender |
| `solution` = Other, with a tiny-house message | Tiny House |

Suggested priority signals: units_band, budget_band, delivery_window, role, project_phase.

## Limits

- The reference is generated in the browser. It is unique enough for follow-up but is not a server ID. A Netlify Function could issue server-side IDs later.
- Netlify keeps a submission only if it passes its spam filter. The confirmation is shown only after Netlify returns 2xx.
- No personal data is kept in the browser. Only the UTM attribution is kept, in sessionStorage.
