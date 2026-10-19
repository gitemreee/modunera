# 15 — Business owner inputs: the twelve critical facts (M0)

Date: 2026-10-19. For each fact the brief depends on: what the repository
already has, the status (**have / partial / missing**), and what is blocked on
it. Section numbers refer to `REQUIRED-BUSINESS-INPUTS.md` (RBI). Nothing here is
inferred; where the repo is silent the status is "missing".

| # | Fact | What the repo already has | Status | Blocked on it |
|---|---|---|---|---|
| 1 | **Full legal entity** (name, legal form, registered address, register/MERSİS number, tax/VAT id, authorised representatives, official e-mail, EU representative) | RBI §1 checklist; Impressum placeholder listing the same fields as "noch zu ergänzen"; phone `+90 553 543 5342` published; `Organization` schema with name, url, telephone, logo only; `privacy.json` names no controller by rule | **missing** | Indexing of `/legal/impressum/`, `/legal/datenschutz/`, `/legal/cookies/` (`INCOMPLETE_LEGAL`); `Organization.legalName`/address in schema; any B2B page, enterprise form or proposal footer that must name a contracting party; GDPR controller statement |
| 2 | **Final brand files** (logo masters, B2B sub-brand if any, colour/type rules, templates) | `assets/brand/` lockup 2172×724 + 300/600/900 + white + 512 mark; claim "Design Your Nature" in Caveat; palette and type tokens in `tools/design-system-v2.css`; `generate-brand-assets.py`; `site.webmanifest` still on old colours; sunrise-glow artwork described in README but not present | **partial** | A B2B visual layer (sub-brand, iconography, presentation/proposal template, favicon/theme fix); confirmation that the unrepainted lockup stays the master |
| 3 | **Kartepe production site — legal and actual status** (owned/leased/contracted, address, operator, right to name and film) | 7,406 German location pages print "Produktionsregion Kartepe/Türkei" as a distance footnote (retired generator); `/factory/` titled "Eigene Tiny-House-Fertigung" and eight-phase process; seven hall photographs; rule `own-production` strips "aus eigener Produktion" site-wide; RBI §2 | **missing** | "Own production" on home/factory pages; factory address on any page; factory video; capacity claims; `/factory/` title consistency with the claims register |
| 4 | **Monthly capacity — tiny houses vs. larger modules** | No capacity figure anywhere; RBI §8 asks lead time for 5/12/25 units | **missing** | Any capacity, lead-time or series statement on operator, project or B2B pages; `data-strip`/KPI figures |
| 5 | **Engineering capacity for large modular buildings** (multi-unit, multi-storey, facilities; engineer of record; codes; drawings) | Service pages Modulbau/Stahlbau/Containerbau/Bungalows exist as text; no drawing, no built example, no engineer named; RBI §3, §4 open (drawings, structural calcs, type approval) | **missing** | The brief's "Modular Living & Project Developments" positioning; masterplan/concept pages; any statement about building size, storeys or compliance (EN 1090, Eurocodes) |
| 6 | **Contracted manufacturers, installers, logistics, local consultants** (per country; may they be named) | None named; container pages say the buyer provides crane and manoeuvring; delivery tariffs per market in `pricing.json` as indications; prospect list kept out of the repo by rule | **missing** | "Turnkey", "installation by our teams", partner logos, country service map, installer-backed warranty statements |
| 7 | **Real service and warranty scope per country** | Rule `same-day-response` ("Antwort an Werktagen"); production FAQ defers warranty period; service pages list unloading, foundation, connections, permits as excluded; RBI §2 "warranty terms and the countries where service is provided"; §6a delivery-term questions | **missing** | Warranty sentences on model, operator and B2B pages; service promises; the FAQ answers "What is covered by warranty and for how long?" and "Who carries out service in my country?" |
| 8 | **Any active Africa partnership or delivery** (country, counterpart, stage, documents, consent) | Nothing: no page or data file mentions Africa; the only string is `"Güney Afrika": 0` in `data/market-signals.json`; market config covers DE/NL/DK/LU/CH + FR scan | **missing** | Every Africa reference in the brief (markets page, hero copy, case study, logistics/customs copy, language choice); whether Africa appears at all in release 1 |
| 9 | **Product documents and certificates** (drawings, data sheets, U-values, weighbridge tickets, CoC/type approval, DoP, EN 1090 / EN 14351 / GPSR, QC procedure) | `/downloads/` states no certificate is claimed until originals exist; `/katalog/MODUNERA-Katalog-de.pdf` without equipment tables; `quality-spec.json` rule "never state the figure"; rules `galvanised-steel`, `glazing`, `electrical-standard`, `weight-and-chassis-brands`; RBI §3, §3a, §4, §7 | **missing** | Product passport sections with `Product` + verified `Offer` schema; downloadable technical documents; snow/wind statements; 40 of 60 production-FAQ answers; any "certified" wording |
| 10 | **Completed-project imagery with permissions** (delivered units on site, operator consent, operator quote) | 32 real photographs of single units in the hall, yard, exhibitions and one olive grove (`data/site-photos.json`); transport photo with Turkish and Azerbaijani flags; `/projects/` case-study framework prepared and empty; RBI §8 | **partial** (imagery) / **missing** (permissions, named projects) | Reference section, case studies, testimonials (JSON-LD rating/review/award banned anyway), "delivered to N countries", operator-page proof sentences |
| 11 | **Official e-mail, CRM and lead owner** | emre@modunera.com receives mail since 2026-10-18 and gets Netlify Forms notifications; Netlify Forms enabled since 2026-10-18 (four days of submissions lost before); form `projektanfrage` with nine fixed fields on `/kontakt/`, 14,514 location pages and operator pages; `crmEndpoint` empty — no CRM; `localStorage` copy + WhatsApp handoff; RBI §8 "Forms" and "The prospect list" | **partial** | Enterprise proposal form design (fields, routing, SLA), a second form name if the field list differs, CRM endpoint, who answers B2B enquiries and in which languages, `mailto:` on Impressum, response-time statements |
| 12 | **Approved legal texts** (Impressum, privacy, cookies, withdrawal, delivery, warranty, dispute; lawyer-approved; KVKK/GDPR) | `data/privacy.json` DE/EN describing actual processing (Netlify Forms, WhatsApp/Meta, consent-gated analytics, localStorage keys); cookie notice in five languages; Impressum with a dispute-resolution sentence; `docs/legal-content-sources.md` sourcing for permit copy; RBI §1 "Lawyer's approval of the withdrawal, delivery, warranty and dispute texts" | **partial** | Indexing of statutory pages; B2B terms (AGB/T&C for proposals), data-processing wording for enterprise form fields and any non-EU transfer; cookie flow before any analytics id is set |

## Immediate asks, in the order they unblock the most

1. **#1 legal entity + #12 lawyer-approved texts** — unblocks the statutory
   pages, the schema, and the right to present as a contracting B2B brand.
2. **#11 lead owner and CRM decision** — the enterprise form cannot be designed
   without knowing where a submission goes and who answers.
3. **#3 Kartepe status + #9 documents** — decides whether "own production",
   "certified" and any figure can appear in release 1.
4. **#8 Africa** — a yes/no with documents decides whether Africa is a market
   page or is omitted; the repository has nothing to build on.
5. **#5 engineering capacity + #4 capacity + #6 partners + #7 warranty** —
   decide how far "Project Developments" can be claimed beyond the single unit.
6. **#10 project imagery and permissions** — the first case study.
7. **#2 brand files** — can run in parallel; nothing else waits on it.

## How each answer enters the repository

Evidence goes into `REQUIRED-BUSINESS-INPUTS.md` (ticked, with the document
reference), the corresponding rule is removed from or added to
`data/blocked-claims.json`, and the owning data file (`privacy.json`,
`commercial.json`, `services.json`, `quality-spec.json`, `pricing.json`,
`site-photos.json`, …) is edited. Pages are never edited by hand; the pipeline
and both validators run before the change is committed to the branch.
