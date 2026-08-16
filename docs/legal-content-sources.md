# Legal and permit content — where it comes from

Date: 2026-08-16
Branch: `codex/modunera-full-system`
Scope: every statement on this site about planning permission, zoning, road
legality, customs or import, in all five languages.

This document exists so that the next person to edit a legal paragraph can find
out where the current one came from without guessing, and so that a reader who
challenges a sentence can be answered with a source rather than an opinion.

---

## 1. The rule the content follows

Three sentences govern everything below, and they are the reason the site does
not have a legal problem today.

1. **The site orientates; it does not advise.** Every legal paragraph ends, in
   its own language, with a note that it is general project guidance and not
   legal, authority, structural, energy or tax advice, and that the current law
   and the decision of the competent authority are what bind.
2. **The competent authority is named, and the reader is sent to it.** Not "check
   with your local council" but, per country, which body and which plan: the
   *untere Bauaufsichtsbehörde* and the *Bebauungsplan*; the *gemeente* through
   the *Omgevingsloket* and the *omgevingsplan*; the *kommune* and the
   *lokalplan* with its zone status; the *commune* with the PAG and PAP; the
   *Gemeinde* with the canton and the *Nutzungsplanung*.
3. **Nothing is asserted about a specific plot.** The site never says a place is
   permitted. It says what decides it and who decides it.

Rule 3 is what makes 14,650 programmatic location pages defensible. A page that
said "tiny houses are allowed in Schmidmühlen" would be a claim about a plot
nobody has seen. A page that says what governs Bavaria and who to ask is not.

## 2. Primary sources, per market

These are the official pages the site links as its starting source. They are the
only external destinations in the legal content; nothing is sourced from a blog,
a competitor, or a law-firm summary.

| Market | Source | Publisher | Linked from |
|---|---|---|---|
| Germany | [verwaltung.bund.de — Baugenehmigung](https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99012070006001) | Federal/Länder joint service catalogue | 54 pages |
| Netherlands | [government.nl — Environment and Planning Act portal](https://www.government.nl/themes/building-and-housing/environment-and-planning-act/the-environment-and-planning-portal) | Rijksoverheid | 3,108 pages |
| Denmark | [lifeindenmark.borger.dk — Building permit](https://lifeindenmark.borger.dk/housing-and-moving/construction/building-permit) | Danish public authorities | 920 pages |
| Luxembourg | [guichet.public.lu — Autorisation de construire](https://guichet.public.lu/en/citoyens/logement/construction-renovation-transformation/certificats-energiepass/certificat-autorisation-construire.html) | State of Luxembourg | 398 pages |
| Switzerland | [ch.ch — Planning application and building permit](https://www.ch.ch/en/housing/homeownership/planning-application-and-building-permit/) | Swiss Confederation | 2,906 pages |

Cross-border and vehicle matters:

| Subject | Source | Linked from |
|---|---|---|
| EU–Türkiye Customs Union | [Access2Markets](https://trade.ec.europa.eu/access-to-markets/en/content/eu-turkiye-customs-union) | 6 pages |
| Vehicle type approval | [Regulation (EU) 2018/858](https://eur-lex.europa.eu/eli/reg/2018/858/oj/eng) | 2 pages |
| Road dimensions and weights | [Directive 96/53/EC implementation report](https://transport.ec.europa.eu/document/download/45e1073e-373a-4156-966b-0523915dec9f_en?filename=SWD_2023_70_implementation_report_amendments_dir_96_53.pdf) | 8 pages |
| German road dimensions, §22 StVO | [gesetze-im-internet.de](https://www.gesetze-im-internet.de/stvo_2013/__22.html) | **0 pages — see 4.2** |

Counts are `grep` over the committed HTML on 2026-08-16, not from a build report.

## 3. What the site actually claims, per market

Short form. The full paragraphs are in `COUNTRY_COPY` in
`tools/build-modunera-europe.mjs`, written per language rather than translated
from English, and they are the single place to edit them.

- **Germany** — Permanent residential or commercial use generally makes the unit
  a building under Land building law regardless of a chassis. Permission turns on
  whether the plot is *Innenbereich* or falls under §34/§35 BauGB; §35
  *Außenbereich* is named as the most common reason German projects fail.
- **Netherlands** — Since 1 January 2024 the Omgevingsloket consolidates the
  rules of municipality, province, water board and state under the Omgevingswet.
  Permanent living requires a residential function in the *omgevingsplan*; many
  attractive sites are designated recreation, where it is not allowed even where
  it happens in practice.
- **Denmark** — New buildings, extensions and changes of use generally require a
  building permit from the *kommune*. Permanent living requires *byzone* or an
  equivalent designation; in *sommerhusområder* year-round use is restricted in
  principle, with exceptions tied to personal circumstances.
- **Luxembourg** — Construction, conversion and demolition require prior
  *autorisation de construire* from the *commune*. Permitted where the PAG zone
  allows residential use; practice varies noticeably between communes because
  they are small.
- **Switzerland** — Buildings and installations generally require a permit.
  Inside the building zone where the zone allows residential use; outside it,
  only in narrowly limited exceptions — named as the most common reason Swiss
  projects fail.

Each paragraph carries the delivery indication and the destination import VAT
rate from `data/pricing.json`, which is the same file the configurator reads.

## 4. Gaps, and they are real

### 4.1 Seven and a half thousand German-market pages cite no source

`/standorte/` is the German-language location tree and it covers all five
markets, not only Germany. Measured on 2026-08-16: **11,032 pages, of which 3,554
link an official source and 7,478 do not.** The 3,554 are the Dutch, Danish,
Luxembourgish and Swiss pages, written by `build-modunera-europe.mjs`, which puts
`country.source` on every page it generates. The 7,478 without a source are the
German-market pages — the largest single block on the site, for the largest
market — and they are the last of the HTML baked by the retired
`tools/generate_scale_v3.py`, which had no such field.

(An earlier draft of this document said none of the 11,032 had a source. That was
wrong, and wrong in the direction that makes the problem look bigger than it is.
The number came from grepping for the German source URL alone, on a tree that is
German-language rather than German-market.)

They are all `noindex,follow`, so this is not currently a search problem. It is a
consistency and quality problem, and it is the single largest item standing
between those pages and the quality gate in
`data/location-index-policy.json`. A page that cannot cite the authority it is
telling the reader to contact has not earned indexing.

**Recommended fix:** a pass equivalent to `build-photo-placement.mjs` — named
insertion into named pages, idempotent — that adds the Germany source block to
those 7,478 pages. It is not a rewrite; it is one insertion point repeated. It is
also worth 20 points each on the quality gate (`tools/score-location-pages.mjs`),
which is the largest single move available to that corpus.

### 4.2 One source is defined and never used

`SOURCE_URLS.deDimensions` — §22 StVO, the German rule on load dimensions and
securing — is declared in `build-modunera-europe.mjs` and referenced from no
page. Transport and road legality are discussed across the guides and the
production FAQ without linking the German primary text. Either use it on the
transport guide or delete the constant; a source list with an unused entry
invites the assumption that the subject is sourced when it is not.

### 4.3 The legal pages are `noindex` and should stay that way

`/legal/impressum/`, `/legal/datenschutz/` and `/legal/cookies/` are live and set
to `noindex,follow` because the company data in section 1 of
`REQUIRED-BUSINESS-INPUTS.md` has not been supplied. That is the correct state:
an incomplete Impressum on a German-facing commercial site is a compliance risk,
and an incomplete one should not be a search result. It is a blocker on the
business, not on the site.

### 4.4 No e-mail address exists anywhere

Zero `mailto:` links across 15,164 pages against 30,305 `tel:` links. A German
Impressum requires one. Same blocker as 4.3, seen from the front end.

### 4.5 Customs classification is unresolved

Added to `REQUIRED-BUSINESS-INPUTS.md` as section 6 on 2026-08-16. The Customs
Union excludes steel products and this product is built on a steel frame; whether
that exclusion catches it is a tariff-classification question that changes the
landed cost. See `docs/competitor-analysis-poland-romania.md` §1a.

## 5. How claims are prevented from creeping back

`data/blocked-claims.json` holds every phrase that may not be published until
evidence exists, with the wording that replaces it and the evidence each one
needs. `build-modunera-depth.mjs --extend` applies it to the built HTML, and
`validate-seo-v7.mjs` fails the build if the count of remaining blocked phrases
is anything but zero.

That register is the mechanism, and it has one known failure mode, found on
2026-08-16: it matches literal strings, so a phrase can walk past it by being
capitalised differently or by appearing URL-encoded. Two capitalised forms of the
glazing claim had been surviving since the register was written, and — separately
— 7,406 pages carried the previous brand name inside URL-encoded WhatsApp links
that no plain-text rule could see.

**When adding a rule, add its capitalised, sentence-initial and percent-encoded
forms too.** The validator counts what the register knows about; it cannot count
what the register was never told.

## 6. Review

Country paragraphs carry a review date (`UPDATED` in the generator, currently
2026-08-13) that is printed on the page. The dates are not decorative: a legal
statement without a review date is a legal statement of unknown age.

Triggers for a re-review, ahead of any schedule:

- a change to the Omgevingswet or the Dutch transitional arrangements
- a Danish change to *sommerhusområde* rules or zone definitions
- German Land-level building-code amendments touching §35 privileging
- a Swiss revision to the *Raumplanungsgesetz* outside-the-building-zone regime
- any change to the scope of the EU–Türkiye Customs Union
- an EU vehicle-approval or road-dimensions amendment

Otherwise: every six months, and the review is to open each source in section 2
and confirm the page still says what the site says it says.
