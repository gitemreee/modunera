# Competitor analysis — Poland and Romania

Date: 2026-08-16
Branch: `codex/modunera-full-system`
Scope: the two countries that compete with Türkiye for the same five buyers —
Germany, the Netherlands, Denmark, Luxembourg, Switzerland.

## Method, and what this document will not do

Every company name, lead time and price band below comes from a source listed in
section 10 and is attributed where it is used. Where a figure could not be
sourced it is marked as missing rather than estimated, and where two figures are
not comparable that is said instead of comparing them anyway.

MODUNERA's own figures come from `data/pricing.json`, which is the same file the
configurator and the price-comparison pages read. They are ex-works indications,
not offers.

Nothing here is a claim that may be published on the site. Competitor pricing
gathered from directories and marketing pages is not evidence, and a comparison
table naming a competitor and a price is a legal exposure in Germany. The output
of this document is positioning and priorities, not page copy.

---

## 1. The finding that matters more than any other

Poland and Romania are inside the single market. Türkiye is not.

For a Polish manufacturer shipping to Germany there is no customs event: goods
move on a commercial invoice, with no clearance, no broker and no import VAT
levied at a border. For MODUNERA every delivery is an import. An A.TR movement
certificate removes the customs *duty* under the Customs Union, but it does not
remove the customs *procedure*, and import VAT is still charged at the
destination rate — 19% in Germany, 21% in the Netherlands, 25% in Denmark, 17% in
Luxembourg, 8.1% in Switzerland, which is outside the union entirely.

This is already stated correctly on the site, and `data/blocked-claims.json`
already blocks the two phrasings that overstated it ("mit A.TR keine Zollkosten",
"A.TR macht die Lieferung zollfrei"). That was the right call. The competitive
consequence is the part that has not been drawn out:

**A Polish competitor's quotation is complete. MODUNERA's is not, and cannot be,
until the buyer's own import position is known.** The buyer experiences that as
uncertainty at exactly the moment they are comparing two numbers.

The site's answer to this should not be to hide it. It should be to be the only
manufacturer in the comparison that tells the buyer, before they ask, what the
import will cost them and who does what. A buyer who is told "plus 19% import VAT
which you reclaim if you are VAT-registered, plus clearance, and here is who
handles it" trusts the number more than a competitor's round figure.

### 1a. An open question that changes the landed cost

The Customs Union covers industrial goods but **excludes coal and steel
products**, which are outside its scope. MODUNERA's product is built on a steel
chassis and a load-bearing steel frame.

Whether a prefabricated building on a steel frame is classified as a
prefabricated building — inside the union — or is caught by the steel exclusion is
a **tariff-classification question**, and it is not one this document can answer.
It has to be answered by a customs broker against the actual commodity code, per
model, in writing.

The answer is worth money in both directions. If the classification is clean, it
is a sentence the site can use in every market. If it is not, the landed-cost
figures in `/preisvergleich/` are understated and need revising before anyone
quotes from them.

This is now item 7 in `REQUIRED-BUSINESS-INPUTS.md`.

---

## 2. Poland — who is actually there

| Company | Base | Noted for |
|---|---|---|
| Mobi House | Poland | Described as a market leader in Europe for mobile homes, with a distributor network across several European countries |
| REDUKT | Kościan, Wielkopolska; founded 2017 | Sells across Europe under an English-language brand |
| Tiny House BAR-TOF | Poland | States deliveries to Germany, Austria, Switzerland, Hungary and Czechia |
| Aurora Company | Poland | States projects in 27 European countries |
| TinySmartHouse Polska | Poland; family firm since 2013 | One of the longest-established Polish producers |
| Tiny House Mobile | Poland | States 800+ mobile trailers produced across seven concepts |
| MTB Modules | Poland | Publishes a lead time of 8–10 weeks from contract signature |
| Ostrowski | Poland | Sandwich-panel manufacturer that added tiny houses — vertically integrated on the panel side |

The shape of the Polish field: several producers over ten years old, at least two
positioning themselves explicitly as European rather than Polish brands, and one
that came into tiny houses from panel manufacturing rather than from carpentry.

**Distribution matters more than any of them individually.** Polish and Romanian
producers are listed on the comparison portals that European prefab buyers use —
Spassio, PrefabFind, EpicMonday. Spassio states that it works only with
manufacturers based in Europe, so Turkish manufacturers are not listed there at
all. See section 8.

## 3. Romania — who is actually there

| Company | Base | Noted for |
|---|---|---|
| Tiny Home România | Romania | Publishes 60–90 days from contract confirmation |
| Dwellii | Romania | Named in the Romanian producer surveys |
| MAAD Prefab | Romania | Named in the Romanian producer surveys |
| BIOBUILDS | Romania | Named in the Romanian producer surveys |
| Modulo House | Romania | Named in the Romanian producer surveys |
| OxyGo Modules | Romania | Named in the Romanian producer surveys |
| Eco Tiny House | Romania | Listed on Spassio |
| Best Tiny Houses | Romania | States roughly three months from contract |
| (unnamed) | Craiova; founded 2022 | Listed on the Enterprise Europe Network partnering database seeking trade intermediaries |

Romania's field is younger than Poland's and more fragmented, and it is
positioned on a different axis: the surveys describe hand-crafted Bucovinian
work, SIP-panel modulars, container conversions and metal-frame off-grid units
under the same national label. The consistent claim is a woodworking tradition
plus production costs Western Europe cannot match.

The Enterprise Europe Network listing is worth noting on its own: Romanian
producers are using an EU institutional channel to recruit distributors in the
target markets. That channel is not open to a Turkish manufacturer.

---

## 4. Price — what can and cannot be compared

Published figures, each from a source in section 10:

| | Figure | Basis |
|---|---|---|
| German market, compact tiny house | from ~€40,000 | German buyer-guide sites |
| German market, year-round habitable | €60,000–100,000 | German buyer-guide sites |
| German market, turnkey | €2,500–3,000/m² | German buyer-guide sites |
| Polish modular houses | €1,100–1,500/m² | German-language Polish-modular guide |
| Polish prefab, ex foundation and site works | €2,300–2,600/m² | German prefab portal |
| Delivery, general | €1,000–5,000 | German buyer-guide sites |
| **MODUNERA MD 7, ex works** | **€42,900** | `data/pricing.json` |
| **MODUNERA MD 6, ex works** | **€54,900** | `data/pricing.json` |
| **MODUNERA delivery, Germany** | **€6,800** | `data/pricing.json` |
| **MODUNERA delivery, Denmark** | **€10,500** | `data/pricing.json` |

**These rows do not compare.** Three reasons, and each of them matters:

1. **Per-m² against per-unit.** The Polish €1,100–1,500/m² is for modular houses,
   which are larger and simpler per square metre than a road-legal unit on a
   chassis. Dividing MODUNERA's €42,900 by a footprint produces a number that
   looks worse than the product is, because it ignores the loft and it charges
   the whole chassis and road-approval cost to the floor area.
2. **Ex works against delivered.** MODUNERA's figures are ex works. The German
   market figures are usually delivered, sometimes turnkey.
3. **Delivery is where the geography actually shows.** MODUNERA's own Germany
   tariff of €6,800 is above the top of the €1,000–5,000 band the German guides
   quote — which is what 2,500 km looks like against 600 km, and it is honest that
   the site publishes it rather than burying it.

**The conclusion to draw is the uncomfortable one.** On price alone, against
Poland, MODUNERA is not obviously cheaper once delivery and import are counted.
Polish wages have risen but Polish logistics into Germany are a third of the
distance and carry no customs event. A positioning built on "cheaper because
Türkiye" is a positioning that a Polish competitor can beat on a spreadsheet.

## 5. Lead time — the one axis where the field is tight

| Producer | Published lead time |
|---|---|
| MTB Modules (PL) | 8–10 weeks from contract |
| REDUKT (PL) | ~3 months from order |
| Tiny Home România (RO) | 60–90 days from confirmation |
| Best Tiny Houses (RO) | ~3 months from contract |
| Modular houses, general | 6–10 weeks order to shipment |
| **MODUNERA** | **not published** |

Everyone in the field publishes a number and MODUNERA does not. That is a
defensible choice — `/leistungen/` now says a date is committed after
specification sign-off because any earlier figure would be a guess — but it is a
choice with a cost: in a comparison of four suppliers, the one with no number is
read as the slow one.

The fix is not to invent a lead time. It is to publish the *shape* of the
schedule: how long specification takes, how long production takes once
specification is signed, and how long transit takes per market. Three ranges the
business can stand behind beat one number it cannot.

That needs section 2 of `REQUIRED-BUSINESS-INPUTS.md` — actual production dates
from past units.

---

## 6. Where MODUNERA is genuinely different

These are differences the site can defend today, without new evidence.

1. **Steel frame as standard.** The Polish and Romanian field is predominantly
   timber frame, SIP panel or container. A load-bearing steel structure is a
   different product, and `/qualitaet/` can now say what that buys — span, point
   loads, and a frame that survives 2,500 km before it carries a building.
2. **Furniture from the same shop.** Vertical integration into the interior is
   rare in this field; most producers buy kitchens in. `/leistungen/moebel-nach-mass/`
   now explains why that changes the result and not just the invoice.
3. **Five markets answered separately.** The site answers permitting per country
   and per region, with the competent authority named and an official source
   linked. No competitor found in this research does this at comparable depth.
4. **Breadth.** Tiny houses, modules, steel, bungalows and furniture from one
   works. Most of the field does one of these.

## 7. Where MODUNERA is genuinely behind

1. **Not in the single market.** Structural, permanent, and covered in section 1.
2. **Not on the comparison portals.** Section 8.
3. **No published lead time.** Section 5.
4. **No legal entity published.** Section 1 of `REQUIRED-BUSINESS-INPUTS.md`
   still blocks the Impressum, which is `noindex` today. Every Polish and
   Romanian competitor in this list publishes a company registration. For a
   German buyer comparing a Turkish supplier against an EU one, an incomplete
   Impressum confirms the fear they already had.
5. **No delivered-project evidence.** Competitors publish project counts —
   "27 European countries", "800+ units". MODUNERA publishes none, because
   section 2 of the inputs file has not been supplied.

Items 4 and 5 are not marketing problems. They are the two that decide whether a
German buyer proceeds at all, and both are unblocked by paperwork the business
already has.

---

## 8. Distribution — the finding with the shortest path to revenue

European prefab buyers do not start on manufacturers' own websites. They start on
comparison portals: **Spassio**, **PrefabFind**, **EpicMonday**. These list a
hundred-plus manufacturers with models, prices and filters, and they are where
Polish and Romanian producers get in front of German and Dutch buyers.

**Spassio states it works only with manufacturers based in Europe.** Turkish
manufacturers are therefore absent from it, and the same restriction may apply to
others. This has two consequences and they point in opposite directions:

- The SEO work on this site is doing more than it looks like it is doing, because
  organic search is one of the few channels not gated by an EU-establishment
  rule.
- An EU establishment — a branch, a subsidiary, or a distributor agreement with
  an EU-registered partner — would unlock a channel that is currently closed
  outright. That is a commercial decision, not a website decision, but it belongs
  in front of whoever makes it. Section 1 of `REQUIRED-BUSINESS-INPUTS.md` already
  asks whether any EU branch or representative exists.

Worth checking before acting: whether PrefabFind and EpicMonday carry the same
restriction. Neither states it in the material found here.

---

## 9. What to do, in order

Ranked by value over effort. Nothing here needs new site architecture.

1. **Get the tariff classification answered in writing** (section 1a). It either
   becomes a selling sentence or it corrects the price pages. Cost: one broker
   consultation.
2. **Publish the legal entity** (section 7.4). It unblocks the Impressum, removes
   the `noindex`, and closes the single largest trust gap against an EU
   competitor. Cost: paperwork that already exists.
3. **Publish the schedule shape rather than a lead time** (section 5). Three
   defensible ranges instead of one guess.
4. **Own the import question publicly.** Turn section 1 from a weakness into the
   page no competitor writes: what an import from Türkiye actually involves, who
   does what, and what it costs. The buyer is already worrying about it.
5. **Check whether PrefabFind and EpicMonday accept non-EU manufacturers**
   (section 8). One email each.
6. **Do not build a comparison table naming competitors.** In Germany,
   comparative advertising against named competitors is lawful only under
   conditions, and doing it from directory data rather than verified figures is
   how it stops being lawful.

---

## 10. Sources

Retrieved 2026-08-16.

Polish manufacturers:
- [Mobi House (Spassio profile)](https://spassio.com/manufacturer/mobi-house/) · [Mobi House](https://mobihouse.pl/en)
- [REDUKT](https://redukt.eu/en/)
- [Tiny House BAR-TOF](https://tinyhousebt.com/en/about-us/)
- [Aurora Company](https://auroracompany.pl/en/)
- [TinySmartHouse Polska](https://tinysmarthouse.pl/en/home-page/)
- [Tiny House Mobile (Spassio profile)](https://spassio.com/manufacturer/tiny-house-mobile/)
- [MTB Modules](https://mtbmodules.com/tiny-house/)
- [Ostrowski](https://www.ostrowski.eu/en/news/tiny-houses/)

Romanian manufacturers:
- [Tiny Home România](https://tinyhomeromania.ro/en/)
- [Romanian prefab manufacturer guide (Spassio)](https://spassio.com/the-complete-guide-to-romanian-prefab-house-manufacturers/)
- [Top modular home manufacturers in Romania (PrefabFind)](https://prefabfind.com/en/blogs/top-modular-home-manufacturers-prefabfind-4016)
- [Prefab manufacturers, Romania (EpicMonday)](https://www.epicmonday.com/prefab-manufacturers/romania)
- [Eco Tiny House (Spassio profile)](https://spassio.com/manufacturer/eco-tiny-house/)
- [Enterprise Europe Network partnering listing, Craiova](https://een.ec.europa.eu/partnering-opportunities/romanian-manufacturer-modular-homes-and-tiny-houses-looking)

Price bands:
- [Tiny House kaufen: Hersteller, Preise & Erfahrungen](https://tiny-houses.de/minihaus-kaufen-preise/)
- [Was kostet ein Tiny House?](https://www.tinyhaus-experte.de/blog/was-kostet-ein-tiny-house)
- [Modulhaus aus Polen — Preise](https://heytimber.pl/de/modulhaus-aus-polen-2025-preise-vorteile-und-kaufberatung/)
- [Fertighaus aus Polen — Preise, Anbieter & Qualität](https://www.fertighaus.de/fertighaeuser-aus-polen/)

Customs and single market:
- [A.TR certificate — duty-free import from Türkiye (KVK, Netherlands Chamber of Commerce)](https://www.kvk.nl/en/international/turkiye-duty-free-import-with-an-atr-certificate/)
- [EU–Türkiye Customs Union (European Commission, Access2Markets)](https://trade.ec.europa.eu/access-to-markets/en/content/eu-turkiye-customs-union)
- [The EU single market: benefits, facts and figures (Council of the EU)](https://www.consilium.europa.eu/en/policies/the-eu-single-market-benefits-facts-and-figures/)

Distribution:
- [Spassio](https://spassio.com/) · [Spassio manufacturer directory](https://spassio.com/manufacturers/)

## 11. What this document could not establish

- **Competitor unit prices.** Directory listings and marketing pages were the only
  source available. Comparable ex-works prices for named competitors would need
  quotations, which means enquiring as a buyer.
- **Competitor build specifications.** Frame material, insulation and glazing are
  described in marketing terms on every site visited. No performance declarations
  were obtainable.
- **Search visibility.** How these competitors rank against MODUNERA on German,
  Dutch and Danish queries was not measured here; that belongs with the SEO
  report and needs a rank-tracking tool.
- **Whether the steel exclusion catches the product** (section 1a). This is the
  most consequential unknown in the document.
