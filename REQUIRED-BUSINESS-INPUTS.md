# Publish blockers: what the business has to supply

Nothing in this list has been invented or guessed. Every item below is a field the
site currently cannot state truthfully, so it is either absent, `noindex`, or
written conditionally. Send the evidence and the corresponding page can be
completed and indexed.

Reviewed 2026-08-14 against the V7 SEO and legal audit.
Section 6 added 2026-08-16 from the Poland and Romania competitor analysis.

## 1. Legal entity — blocks `/legal/impressum/`, `/legal/datenschutz/`, `/legal/cookies/`

These three pages are live but set to `noindex,follow`, because a German-facing
commercial site with an incomplete Impressum is a compliance risk and an
incomplete one should not be a search result.

- [x] Full registered company name and legal form — MC TİNY HOUSE ÜRETİM VE DIŞ TİCARET LİMİTED ŞİRKETİ (2026-10-20, `data/company.json`; registration document still welcome)
- [x] Registered address — Yeşiltepe Mah. 8036 Sk. No: 3A, Erenler / Sakarya (2026-10-20)
- [x] MERSİS number — 0613200110100001 (2026-10-20); trade-register (ticaret sicil) number welcome if it differs
- [x] Tax office and tax number — Ali Fuat Cebesoy Vergi Dairesi, 6132001101 (2026-10-20)
- [ ] Name and role of the authorised representative(s)
- [x] Official e-mail address — emre@modunera.com (receives mail since 2026-10-18)
- [ ] Written approval to publish `+90 553 543 5342` as the public number
- [ ] Any EU branch, subsidiary, representative or service point, with its registration
- [ ] Named data controller, and a representative under Art. 27 GDPR if there is no EU establishment
- [ ] Confirmation of the actual data flow: hosting, forms, WhatsApp, analytics, CRM, e-mail
- [ ] Lawyer's approval of the withdrawal, delivery, warranty and dispute texts

## 2. Production — blocks "aus eigener Produktion" and "13+ Jahre"

Both claims have been removed from the site until this arrives.

- [ ] Factory or workshop address, and the legal relationship to it (owned, leased, contracted)
- [ ] Actual year production started, and the basis for any experience figure
- [ ] Rights to publish real production photographs or video
- [ ] Quality control and factory acceptance test procedure
- [ ] Warranty terms and the countries where service is provided

## 3. Per model, MD 1 to MD 8 — blocks the technical product passport

Until these exist, model pages describe layout and use, not certified performance.

- [ ] Approved technical drawing with a revision date
- [ ] External dimensions, internal/net area, occupancy
- [ ] Real weight of the empty and the delivered configuration — weighbridge ticket
- [ ] Chassis manufacturer, model, and the scope of the type approval / CoC
- [ ] Build-ups, material classes and thicknesses for floor, wall and roof
- [ ] U-values / λ-values with the calculation or report behind them
- [ ] Window and door manufacturer performance declaration
- [ ] Electrical, water, wastewater, heating, cooling and ventilation technical file
- [ ] Included equipment and option list
- [ ] Approved price, VAT treatment and valid-from date
- [ ] Delivery scope and the site works that are excluded

## 4. Structural and road claims — blocks snow load, wind load, 3,500 kg, homologation

- [ ] Site-specific structural calculation for Alpine and Scandinavian load cases
- [ ] Steel specification and the galvanising process/standard, with inspection record
- [ ] Type approval certificate and number, and whether it covers the finished superstructure
- [ ] Bill of materials showing chassis and component brands, per model

## 5. Commercial — blocks firm prices and delivery figures

- [ ] Approved price list with VAT treatment and validity date
- [ ] Delivery quotations with route assumptions, carrier, ferry/Ro-Ro basis and exclusions
- [ ] Actual service hours and measured response time, if a response promise is to be published

## 6. Customs classification — blocks the landed-cost figures on `/preisvergleich/`

Raised by the Poland and Romania competitor analysis, 2026-08-16. See
`docs/competitor-analysis-poland-romania.md`, section 1a.

The EU–Türkiye Customs Union covers industrial goods and an A.TR movement
certificate removes the duty on them — but the union **excludes coal and steel
products**. MODUNERA's product is built on a steel chassis and a load-bearing
steel frame.

Whether a prefabricated building on a steel frame is classified as a
prefabricated building, inside the union, or is caught by the steel exclusion is
a tariff-classification question. It cannot be answered from public guidance and
it has not been answered here.

- [ ] Written classification opinion from a customs broker, per model, against the
      actual commodity code
- [ ] Confirmation of whether an A.TR can be issued for that code
- [ ] Import VAT treatment per destination market, and who is the importer of
      record in each

It is worth money in both directions. A clean classification is a sentence the
site can use in all five markets. A dirty one means the delivery figures in
`/preisvergleich/` are understated and must be revised before anyone quotes from
them.

## 6a. Containers — what the delivery price actually covers

Added 2026-08-17, when container construction became the sixth capability.

The owner states that the German container price is quoted **delivered to the
address**. That is the owner asserting a commercial term of their own business
and the site now says it. It is also the only place on the site where delivery is
inside a price rather than beside it: `data/pricing.json` carries a separate
delivery tariff per market for the eight tiny-house models, and every service page
lists unloading, foundation, connections and permits as excluded.

The container pages are written to that same boundary — price to the address,
everything from the unloading onwards separate — because nothing said otherwise.
Confirm it, or correct it:

- [ ] Does "delivered to the address" include **unloading**, or does the buyer
      provide crane and manoeuvring space? The pages currently say the buyer does.
- [ ] Which delivery term is meant, in the words a contract would use — who
      carries the risk in transit, and who is importer of record?
- [ ] Does it hold for every German address, or only within some area?
- [ ] For the Netherlands, Denmark, Luxembourg and Switzerland, is delivery
      quoted by route as the pages now say, or is there a comparable term?

Until this is answered no container price may be published at all, and the
delivery sentence stays as written: what is in it, and what is not.

Still blocked for containers, exactly as for the eight models: any size, panel
thickness, steel grade, certification, price or lead time. Sections 2 to 5 apply
to this product too.

## 7. The production FAQ answers its own sixty questions around these gaps

`/produktion-faq/` and `/en/production-faq/` answer all sixty questions from
`data/production-faq.json`, and forty of them are answered without the figure the
reader actually wants, because the figure is in sections 2 to 5 above. The answers
say where the number will come from rather than guessing one — which is honest, but
it is also the reason those pages read thinner than they should.

The questions each input closes, so the priority is visible:

| Input | Questions it lets us answer properly |
|---|---|
| Weighbridge tickets per model | "How much does the finished house weigh?", "Which models stay under 3,500 kg?" |
| Type approval / CoC scope | "What do CoC, type approval and homologation mean?", "Is only the trailer approved or the whole vehicle?" |
| U-value calculations | "Which U-values do the components reach?", "Which insulation materials are used?" |
| Warranty terms per country | "What is covered by warranty and for how long?", "Who carries out service in my country?" |
| Approved price list | "What is included in the price?", "When does a figure become binding?" |
| Site documentation | "Where are MODUNERA tiny houses manufactured?", "Can I visit the production?" |

## What happens when each arrives

| Input | Unblocks |
|---|---|
| Legal entity pack | The three legal pages go `index,follow`; `Organization.legalName` and the full address enter the schema |
| Production evidence | "Own production" returns to the home pages and the factory page; an experience figure becomes publishable |
| Model technical files | A product passport section per model, with `Product` + verified `Offer` schema |
| Structural calculations | Snow and wind suitability statements per market |
| Approved price list | `Offer` schema with `priceValidUntil` instead of the current request-a-quote flow |
| Any of the above | The corresponding production-FAQ answers stop deferring to the data sheet and state the figure |

## Social responsibility — proposed, not confirmed

Raised as a possible post subject: that MODUNERA donates one hundred trees to
TEMA Vakfı for every tiny house sold.

**This is not published anywhere and no post carries it.** It is held here rather
than written into a caption for three reasons, and all three have to clear before
it can go out:

| Needed | Why |
|---|---|
| Written confirmation that the donation actually happens | A commitment stated publicly is a commitment owed. If the number is a hundred, it has to be a hundred, per house, verifiably |
| TEMA Vakfı's agreement to be named | Naming a foundation as a partner without its consent is its problem as much as ours, and it is the kind of claim that gets checked |
| The exact wording, agreed with them | "We donate to TEMA" and "we are a TEMA partner" are different claims with different consequences |

Until then the responsibility angle is carried by post 8 of the launch nine — a
fire-safety message that names no organisation, claims no partnership and asks
nothing of anyone. It says something true without needing a signature.

If the donation is real, this becomes one of the strongest posts on the account,
because almost nobody in the category can evidence one. It is worth doing
properly rather than quickly.

## 3a. Ausstattungsliste — blocks the equipment tables in the catalogue

Added 2026-10-07, after a competitor catalogue (REDUKT, v202604) was supplied as
the standard to match. Their specification names makes and models for every
fitting. Ours names none, so `build/MODUNERA-Katalog-de.pdf` ships with models,
prices, components and delivery, and stops where their equipment tables begin.

Three of their entries contradict MODUNERA's own published `/qualitaet/`, so
their list cannot be adapted even in part: they build a **timber** C24/KVH frame
where MODUNERA builds **steel**; **aluminium** joinery where MODUNERA fits
**PVC**; **laminate** worktops where MODUNERA fits **solid panel**. Every line
below has to come from MODUNERA's own production, not from theirs.

Fill in per model where it differs, once where it does not.

**Fahrgestell**
- [ ] Hersteller, Typ, Achszahl, zulässige Gesamtmasse
- [ ] Plattformmaße (L x B) je Modell
- [ ] CoC / Typgenehmigung: Nummer und Geltungsbereich
- [ ] Lässt sich der Aufbau vom Fahrgestell trennen? Wenn ja, wie

**Aufbau**
- [ ] Stahlgüte, Profilquerschnitte, Korrosionsschutzverfahren und Norm
- [ ] Dämmstoff und Stärke für Boden, Wand, Dach
- [ ] Dampfbremse / Unterspannbahn: Fabrikat und Typ
- [ ] Fassadenvarianten mit Materialbezeichnung je Paket
- [ ] Dachaufbau und Dacheindeckung
- [ ] U-Werte mit der Berechnung oder dem Bericht dahinter

**Fenster und Türen**
- [ ] Hersteller, Profilsystem, Verglasungsaufbau je Modell
- [ ] Leistungserklärung (DoP)

**Innenausbau**
- [ ] Wand- und Deckenbekleidung: Material und Stärke
- [ ] Bodenbelag: Typ und Nutzungsklasse
- [ ] Küche: Korpus, Front, Arbeitsplatte — Material und Stärke
- [ ] Möbel: was ist im Preis, was ist Option

**Geräte** — Fabrikat und Typ, je Paket
- [ ] Kochfeld, Kühlschrank, Dunstabzug
- [ ] Warmwasserbereiter (Leistung, Volumen)
- [ ] Heizung und Kühlung
- [ ] Lüftung
- [ ] Sanitärobjekte: Dusche, WC, Waschtisch, Armaturen

**Installationen**
- [ ] Elektro: Phasenzahl, Absicherung, FI, Anschlusswert
- [ ] Wasser und Abwasser: Rohrmaterial, Anschlussart

**Pakete**
- [ ] Welche Ausstattungsstufen gibt es, und was enthält jede
- [ ] Optionsliste mit Aufpreisen
- [ ] Gibt es eine Off-grid-Variante, und was gehört dazu

**Preis**
- [ ] Netto oder brutto, und mit welchem Mehrwertsteuersatz
- [ ] Gültig ab welchem Datum

## 8. Operators, regions and markets — blocks references on `/gewerblich/` and `/regionen/`

Added 2026-10-14 with the operator pages and the tourism-region pages. Both
are written without a single delivered project, operator name or regional
rule, because none of those is confirmed. Each item below unlocks a sentence
the pages currently cannot say.

**Reference projects (B2B)**
- [ ] Has MODUNERA delivered to a campsite, holiday park, hotel, marina, municipality or village project? Which, where, how many units, when — and may it be named?
- [ ] A photograph of a delivered unit in operation (not a render), with the operator's written consent
- [ ] One operator willing to be quoted, with name and role

**Series and commercial terms**
- [ ] Lead time for 5, 12 and 25 identical units
- [ ] Volume terms, if any (the pages say "quoted per project" until there is a number)
- [ ] Payment and warranty terms for operators, if they differ from private buyers

**Winter and altitude**
- [ ] Which models, with which package, are specified for year-round occupation — and the U-values that back it
- [ ] Snow-load verification available per site, or a standard verification for a stated zone
- [ ] Frost-proof water routing: standard, or an option, and what it contains

**Markets**
- [ ] Decision on Belgium and the United Kingdom as target markets (the October 2026 report ranks them second and fourth outside Germany; both need a dealer and, for the UK, UKCA and a customs broker)
- [ ] Decision on a French country page under `/fr/` (the scan covers FR since 2026-10-14; the sections exist, the country page does not)
- [ ] Which compliance files exist today: EN 1090, EN 14351, GPSR representative, RE2020 / BENG

**The prospect list**
- [ ] Where it lives (a CRM, not the repository) and who owns follow-up — the site carries its shape only, in `data/market-research-2026-10.json`

**Forms**
- [ ] A mailbox that receives Netlify form notifications (`modunera.com` has no MX record; `emre@` and `ersan@` do not receive mail until DNS is set up at the mail provider)

## 9. Procurement layer (2026-10-22)

- [ ] Netlify notification for the new `quick-enquiry` form (and `project-proposal`) to emre@modunera.com
- [ ] Evidence for "500+ units shipped since 2019" (shipment list or invoices), before it is used outside the capability page
- [ ] Company profile / capability statement PDF (real document), to replace "on request"
- [ ] Certificates, if any exist (ISO, CE, ...) — none is claimed today
- [ ] Ghana / Nigeria / Kenya pilots: real enquiries, port and route experience, a local partner — needed before country pages are written
- [ ] DRC / Guinea: confirmation of procurement and partnership rules by a local expert
- [ ] CRM choice (HubSpot, Zoho, Pipedrive) for `crmEndpoint`
