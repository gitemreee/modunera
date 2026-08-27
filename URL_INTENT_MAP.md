# URL_INTENT_MAP — one primary URL per query family

Date: 2026-08-25. Families the audit examined; each has exactly one primary.
Internal links route to the primary; secondaries either 301 or hold a clearly
different intent.

## Germany (the contested cluster)

| Query family | Primary | Secondaries | Action taken |
|---|---|---|---|
| tiny house deutschland · kaufen deutschland · hersteller deutschland | `/laender/deutschland/` | `/tiny-house-deutschland/` | **301 → primary** (page removed) |
| projekt-ablauf / worauf achten (informational) | `/blog/tiny-house-kaufen-deutschland/` | – | Retitled off the money query: "Tiny House Projektleitfaden Deutschland: von Grundstück bis Übergabe" |
| tiny house genehmigung deutschland | `/blog/tiny-house-genehmigung-deutschland/` | ratgeber cluster | unchanged; pillar candidate in pruning |
| tiny house {stadt} | `/standorte/...` (evidence-gated) | – | gate live since 19.08 |

## Tool

| Query family | Primary | Secondaries | Action taken |
|---|---|---|---|
| tiny house konfigurator · konfigurieren | `/konfigurator/` | `/studio/` | **301 → primary**; survivor retitled "Tiny House Konfigurator: Modell, Ausstattung & Preis" |

## Models & prices

| Query family | Primary | Notes |
|---|---|---|
| md-{n} · tiny house {layout} kaufen | `/modelle/md-{n}/` | commercial titles with size+price live 25.08 |
| alle modelle / übersicht | `/modelle/` | robots now explicit index |
| katalog (digital viewer) | `/katalog/` | distinct intent, verified 0.0 overlap |
| modellvergleich | `/modellvergleich/` | brief §10 comparison engine target |
| tiny house preise (product) | `/tiny-house-preise/` | – |
| preise je zielland | `/preisvergleich/` | distinct (per-country landed view) |

## Rule applied everywhere

Commercial → one landing page. Informational → one guide, titled without the
transactional verb. Local → gated location page. A new query variant gets a
section on the primary, not a URL.
