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

- [ ] Full registered company name and legal form (a PDF or photo of the registration)
- [ ] Registered address that accepts service of process
- [ ] Trade register / MERSİS number and the registering authority
- [ ] Tax office and tax number, or VAT identification number
- [ ] Name and role of the authorised representative(s)
- [ ] Official e-mail address
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
