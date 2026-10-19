# 11 — Legal and evidence blockers (M0)

Date: 2026-10-19. Each line is a claim the master brief would like the site to
make, for which the repository holds no evidence today, phrased as the question
the owner has to answer. "Repo today" states what the site currently says
instead. Section references are to `REQUIRED-BUSINESS-INPUTS.md` (RBI).

The governing rule, from `docs/handoff.md` §2: nothing about the company, its
products or the law is invented; what is not evidenced goes into RBI, not onto a
page. `data/blocked-claims.json` enforces the existing rules at build time;
every "yes" below either deletes a rule there or becomes a new one.

## A. Company and legal (RBI §1)

| Brief would say | Repo today | Question to the owner |
|---|---|---|
| "MODUNERA GmbH / Ltd. / A.Ş., registered in …" | Impressum is a placeholder; no legal name, address, register or MERSİS number, tax/VAT id, representative or e-mail; the three German legal pages are `noindex` | Which legal entity operates the site and signs contracts? Registration document, registered address accepting service, register/MERSİS number and authority, tax number or VAT id, name and role of the authorised representative(s)? |
| An EU presence ("offices in Germany / the Netherlands") | None stated anywhere | Is there any EU branch, subsidiary, representative or service point, with its registration? If not, who is the Art. 27 GDPR representative? |
| Official contact channels | Phone/WhatsApp `+90 553 543 5342` on 52,613 links; emre@modunera.com receives mail since 2026-10-18; no `mailto:` on any page | Written approval to publish the number? Which e-mail goes on the Impressum and the enterprise form? |
| Privacy and cookie texts naming a controller | `data/privacy.json` names Netlify, Inc. and Meta as processors and, by rule, no controller | Named data controller, confirmation of the actual data flow (hosting, forms, WhatsApp, analytics, CRM, e-mail), and lawyer's approval of withdrawal, delivery, warranty and dispute texts? |
| "Founded 20xx / 13+ years of experience" | Rule `experience-13-years` replaces the claim with "Fünf Zielmärkte" | Dated company or team history? Year production started and the basis for any experience figure? |
| A named team ("our engineers", "our project managers") | No person named on the site | Who may be named, with role and consent? |

## B. Factory and capacity (RBI §2)

| Brief would say | Repo today | Question to the owner |
|---|---|---|
| "Own production in Kartepe" | 7,406 location pages print "Luftlinienentfernung zur Produktionsregion Kartepe/Türkei" (a distance footnote from the retired generator); `/factory/` is titled "Eigene Tiny-House-Fertigung"; rule `own-production` replaces "aus eigener Produktion" everywhere else | What is the Kartepe site legally and actually: owned, leased or contracted? Address? May it be named and photographed? Who operates it? |
| "Monthly capacity of N tiny houses / N modules" | No capacity figure anywhere | Monthly capacity for tiny houses, and separately for larger modules — measured over which period, and with which evidence (production records, contracts)? |
| "Factory tour / video" | Seven hall photographs with hand-written alt text; no video | Rights to publish production photographs and video, and from whom? |
| "Quality control and factory acceptance" | `/factory/` lists eight phases including "07 Qualitätskontrolle"; `/qualitaet/` cards state no figure | Written QC / factory-acceptance procedure, and may it be published or summarised? |
| "Contracted manufacturers / partners" | None named | Which manufacturers, installers, logistics partners or local consultants are under contract, in which countries, and may they be named? |

## C. Engineering and certification (RBI §3, §3a, §4)

| Brief would say | Repo today | Question to the owner |
|---|---|---|
| "EN 1090 / EN 14351 / CE / ISO certified" | `/downloads/` says no certificate, test or legal property is claimed until originals exist; RBI §8 asks which compliance files exist (EN 1090, EN 14351, GPSR representative, RE2020/BENG) | Which certificates exist today, issued by whom, with which scope and number? Copies? |
| Hot-dip galvanised steel frame | Rule `galvanised-steel` replaces with "tragende Stahlkonstruktion" | Steel specification, galvanising process and standard, inspection record? |
| U-values, insulation build-ups, glazing | Rules `glazing`; quality cards and production FAQ defer the figure | U-/λ-values with the calculation or report; window and door DoP; build-ups and thicknesses per model? |
| Weight, chassis, type approval, 3,500 kg | Rule `weight-and-chassis-brands`; CYR/Knott removed | Weighbridge tickets per configuration; chassis manufacturer and model; CoC / type-approval number and whether it covers the superstructure? |
| Snow and wind load suitability (Alpine, Nordic) | Not stated | Site-specific or zone structural calculations? |
| "Engineering capacity for large modular buildings (multi-storey, facilities)" | Site describes single units (8.00–9.70 m) and five services pages (Modulbau, Stahlbau, Container, Bungalows, Möbel) without any built example | Has MODUNERA engineered or built a multi-unit or multi-storey modular building? Which codes, which engineer of record, which drawings exist? |
| Electrical standard | Rule `electrical-standard` corrects 220 V to 230 V / 50 Hz | Single-line diagram, test report, destination-country compliance review? |
| Equipment lists with makes and models | RBI §3a open; catalogue PDF stops where equipment tables begin | Per-model equipment and option list, packages, prices with VAT basis and valid-from date? |

## D. References and projects (RBI §8)

| Brief would say | Repo today | Question to the owner |
|---|---|---|
| "Delivered resorts / communities / facilities in Europe" | Operator pages and region pages name no delivered project; `/projects/` shows use-case profiles and an empty case-study framework; the export-flags photograph shows two units prepared for delivery with Turkish and Azerbaijani flags | Which projects were delivered — what, where, how many units, when — and may each be named? |
| Reference photographs | 32 photographs, none on a customer site with an identifiable operator | Photographs of delivered units in operation, with the operator's written consent? |
| Client quotes / testimonials / ratings | Validator check 14 bans `aggregateRating`, `review`, `award` in JSON-LD; no testimonial on the site | One operator willing to be quoted, with name, role and written consent? |
| "Projects in N countries" | Five target markets stated; `pricing.json` has tariffs for DE/NL/CH/DK/LU | Country list of actual deliveries with evidence? |
| Series lead times ("5 / 12 / 25 units in N weeks") | "quoted per project" | Lead time for 5, 12 and 25 identical units; volume terms; payment and warranty terms for operators? |

## E. Markets and Africa

| Brief would say | Repo today | Question to the owner |
|---|---|---|
| "Active in selected African markets" | No page or data file mentions Africa; `data/market-signals.json` carries `"Güney Afrika": 0` as a counter | Is there any active African partnership, tender, contract or delivery? Country, counterpart, stage, documents? May it be named? |
| African delivery logistics and customs | Site covers EU–Türkiye Customs Union only, with the A.TR claim corrected (rule `atr-automatic-exemption`); RBI §6 customs classification open | Which route, Incoterm, importer of record and customs regime apply for any African destination? Who is the local partner? |
| Belgium, UK, France as markets | RBI §8: BE/UK are an owner decision (dealer, UKCA, broker); FR sections exist, no country page | Decision on BE, UK and a French country page? |
| "Number 1 in the tiny-house market" or similar | Explicitly refused in `data/market-research-2026-10.json` (`not_done_and_why`) | None — superlatives stay out regardless of evidence unless a dated, attributable source is supplied. |

## F. Services scope — turnkey, installation, warranty (RBI §2, §5, §6, §6a)

| Brief would say | Repo today | Question to the owner |
|---|---|---|
| "Turnkey delivery" | "turnkey"/"schlüsselfertig" appears only in the competitor-comparison guides describing Romanian competitors; every service page lists unloading, foundation, connections and permits as excluded | Does MODUNERA contract for site works, foundations, connections, permits and handover anywhere? Through which installer, in which countries? |
| "Installation by our teams in Europe / Africa" | No installer named; container pages say the buyer provides crane and manoeuvring space | Who installs, under which contract, with which insurance? |
| "Warranty N years, service in every market" | Rule `same-day-response` replaces response promises; production FAQ defers warranty period | Warranty terms and period, the countries where service is provided, and who carries it out? |
| Delivery terms and landed cost | Tariffs per market in `pricing.json` as indications; container price "delivered to the address" on the owner's statement; RBI §6a questions open | Which Incoterm; does "delivered" include unloading; who is importer of record; import VAT treatment per market? |
| Customs classification of a steel-framed building | RBI §6: unanswered; `/preisvergleich/` figures may be understated | Written classification opinion from a customs broker per model, and whether an A.TR can be issued? |
| Firm prices for B2B series | All figures ex-works indications | Approved price list with VAT treatment and validity date; B2B volume terms? |
| Response time / service hours | "Antwort an Werktagen" | Actual service hours and measured response time, if a promise is to be published? |
| Donation / social responsibility ("100 trees per house") | Held in RBI, not published | Written confirmation, TEMA Vakfı's consent and agreed wording? |

## What happens when an answer arrives

Per RBI "What happens when each arrives": the legal pack makes the statutory
pages indexable and fills `Organization.legalName`; production evidence returns
"own production" to the home and factory pages; model technical files add a
product passport with `Product` + verified `Offer`; structural calculations add
snow/wind statements per market; reference projects unlock the sentences the
operator and region pages cannot say today. Each answer is actioned by deleting
or adding a rule in `data/blocked-claims.json` and editing the owning data file —
never by editing a page.
