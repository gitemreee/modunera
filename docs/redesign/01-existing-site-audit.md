# 01 — Existing site audit (M0 baseline)

Date: 2026-10-19. Branch: `feat/modunera-global-b2b-redesign`. Every figure below
was read from the repository on this date (`README-build.md`,
`docs/redesign/02-url-inventory.csv`, `build-report-seo-v7.json`, `data/*.json`,
`tools/`, `.github/workflows/`). Where something could not be verified from the
repo it says "evidence required". Nothing was run; nothing outside `docs/redesign/`
was changed.

## 1. Technology

| | |
|---|---|
| Stack | Static HTML/CSS/JS. No framework, no `package.json`, no deploy-time build. |
| Hosting | Netlify, `netlify.toml` → `publish = "."`: the committed HTML is what ships. |
| Headers | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`; assets immutable for a year, HTML `must-revalidate`. |
| Redirects | 8 model redirects `/modelle/mc-N/` → `/modelle/md-N/` in `netlify.toml`; 494-line generated `_redirects` (Danish slug fixes, 52 pruned guide families, studio → konfigurator). |
| Generators | 23 Node scripts in `tools/`, run as 24 steps (`build-modunera-depth.mjs` runs twice). Fixed order in `README-build.md`. All idempotent. |
| Validators | `tools/validate-modunera.mjs` (canonicals, JSON-LD, links, brand, colours) and `tools/validate-seo-v7.mjs` (15 checks: claims, demo markers, sitemap, hreflang, schema, statutory pages). |
| Scheduled | `tools/market-intelligence.mjs` (daily scan, runs before the pipeline) and `tools/test-market-intelligence.mjs`. |
| Retired | `tools/generate_scale_v3.py` baked ~11,000 location pages that no current generator owns; claim and prose passes patch them in the built HTML. |
| Languages | DE at root, `/en/`, `/nl/`, `/da/`, `/fr/`; `/sv/` and `/tr/` are single legacy pages. |

### Generator run order (from `README-build.md`)

1 `rebrand-modunera` · 2 `build-modunera-europe` · 3 `build-modunera-locales` ·
4 `build-modunera-depth` · 5 `build-news-v7` · 6 `build-production-faq-v7` ·
7 `build-daily-blog` · 8 `build-intelligence-dashboard` · 9 `build-modunera-v2` ·
10 `build-modunera-depth --extend` · 11 `build-quality-spec` · 12 `build-hreflang-v7` ·
13 `build-photo-placement` · 14 `build-image-attrs` · 15 `build-nordic-redirects` ·
16 `build-title-lengths` · 17 `build-content-lastmod` · 18 `build-seo-governance-v7` ·
19 `build-privacy` · 20 `build-budget-bands` · 21 `build-location-enquiry` ·
22 `build-about-topic` · 23 `build-de-source-block` · 24 `build-shell-v3` (wraps finished pages, runs last) ·
then both validators.

Ordering traps the README documents: the V7 steps read finished HTML, so any
content generator run after them silently undoes them; `build-modunera-v2` must
follow `build-modunera-europe` or two menus coexist; `build-quality-spec` must
follow `--extend` because the claim pass renames the headings it matches on.

### GitHub workflows (`.github/workflows/`)

| Workflow | Trigger | What it does |
|---|---|---|
| `build-modunera.yml` | push to `main`, `codex/**`, `claude/**`; every PR; manual | Runs all 24 steps, both validators, `audit-project.mjs`; fails if committed HTML ≠ fresh build or if a second pass changes output. Does not commit. **Note: `feat/**` is not in the push list — only the PR trigger covers this branch.** |
| `daily-post.yml` | 05:12 UTC daily | Checks out `main`, runs the full pipeline and both gates, commits and pushes to `main` if output changed, pings IndexNow. |
| `market-intelligence.yml` | 04:35 UTC daily | Runs the scan (no provider key → `NO_PUBLISH`), tests, full pipeline, gates; commits to `main` with rebase retry; pings IndexNow. |

## 2. Page counts (from `02-url-inventory.csv`, 15,182 HTML files)

| Type | Pages | Indexable | Notes |
|---|---|---|---|
| location | 14,625 | 1,659 | 11,016 German-language (`/standorte/`), 3,609 English (`/en/locations/`) |
| blog | 250 | 250 | DE 98, en-GB/nl/da/fr 38 each (incl. `/blog/praxis/` daily series) |
| page | 114 | 112 | tools, services, guides hubs, country questions, legal-adjacent |
| model | 45 | 45 | MD 1–8 + hub, five languages |
| hub | 34 | 27 | 7 noindex: admin-demo, booking, customer-portal, intelligence, saved-designs, sv, tr |
| country | 30 | 30 | 6 per language |
| tourism-region | 22 | 22 | 10 regions + hub, DE and EN |
| state-hub | 16 | 16 | German Länder hubs |
| news | 15 | 15 | |
| operator | 14 | 14 | hub + 6 segments, DE and EN |
| faq | 13 | 13 | |
| legal | 4 | 1 | impressum, datenschutz, cookies noindex; `/en/legal/privacy/` carries `index,follow` (see §8) |
| **Total** | **15,182** | **2,204** | 12,976 noindex, 2 without robots meta (verification file, social preview); 2,203 in sitemap |

Location tree detail: 7,406 German town pages + 16 state hubs; German-language
trees for NL 1,537, CH 1,451, DK 437, LU 184 (= 3,609); English mirrors of those
four countries, 3,609. `data/location-index-policy.json` approves 1,561 routes
(535 on search evidence, 1,026 on quality score ≥ 75); the inventory's 1,659
indexable "location" rows additionally include region-level hubs that the
inventory script classifies by path depth.

By `lang`: de-DE 11,228 · en 3,659 · en-GB 74 · da-DK 73 · nl-NL 73 · fr-FR 71 · sv-SE 1 · tr-TR 1.

## 3. Templates and sections that exist

| Section | Routes | Owner |
|---|---|---|
| Home | `/`, `/en/`, `/nl/`, `/da/`, `/fr/` | `HOME_MODELS` in `build-modunera-depth.mjs`; home page body is legacy-baked, patched by passes |
| Models MD 1–8 | `/modelle/md-N/` and four locale mirrors | `data/pricing.json`, `data/model-copy.json`, `data/depth-copy.json` |
| Comparison / tools | `/modellvergleich/`, `/preisvergleich/`, `/konfigurator/`, `/katalog/` (PDF viewer), `/tiny-house-preise/` | `build-modunera-v2.mjs`; `/studio/` 301s to the configurator |
| Countries | `/laender/<land>/` + locale mirrors, 20 country questions × 5 × 5 | `COUNTRIES` in `build-modunera-europe.mjs`, `data/country-qa.json` |
| Locations | `/standorte/<land>/<ort>/`, `/en/locations/<country>/<region>/<town>/` | `build-modunera-europe.mjs`, `data/locations.json`, `data/europe-locations-source.json` |
| Tourism regions | `/regionen/<10>/`, `/en/regions/` | `data/tourism-regions.json` (towns assigned by bounding box) |
| Operator pages | `/gewerblich/` + 6 segments, `/en/commercial/` | `data/commercial.json` |
| Services | `/leistungen/{modulbau,stahlbau,bungalows,containerbau,moebel-nach-mass}/` + `/en/services/` | `data/services.json` |
| Blog | `/blog/` (DE library + 13 Europe guides), `/ratgeber/` categories, `/blog/praxis/` daily series, `/en|nl|da|fr/blog/` (9 categories + 28 posts each) | `data/blog-topics.json`, `data/blog-*.json`, `data/posts-*.json`, `data/blog-daily-*.json` |
| News | `/news/`, `/en/news/`, `/nl/nieuws/`, `/da/nyheder/`, `/fr/actualites/` | `data/news.json` (10 items) |
| FAQ | `/faq/`, `/fragen/`, `/produktion-faq/` (60 Q, 9 subjects), locale FAQs | `data/faq.json`, `data/production-faq.json` |
| Factory / quality / projects | `/factory/`, `/qualitaet/` (12 component cards), `/projects/` (use-case profiles; "case-study framework" prepared, no delivered project named) | `data/quality-spec.json`, `data/site-photos.json` |
| Legal | `/legal/impressum/`, `/legal/datenschutz/`, `/legal/cookies/`, `/en/legal/privacy/` | `data/privacy.json`; Impressum is an explicit placeholder listing what is "noch zu ergänzen" |
| Intelligence | `/intelligence/` (noindex,nofollow dashboard) | `build-intelligence-dashboard.mjs` |
| App shells | `/admin-demo/`, `/customer-portal/`, `/booking/`, `/saved-designs/` | noindex; demo shells, no backend |

## 4. Data models (`data/*.json`, from their `_comment` fields)

| File | Holds |
|---|---|
| `pricing.json` | Single source of truth for MD 1–8 base prices (EUR, ex-works, keys `mc1`–`mc8`), delivery tariffs DE/NL/CH/DK/LU, enquiry budget bands; cross-checked against `studio.js`/`configurator.js` at build. |
| `models.json` | Eight model ids, names, lengths, layouts, positioning, gallery image names. |
| `model-copy.json` | Per-model editorial copy, five languages; numbers live in pricing. |
| `depth-copy.json` | Shared long-form model-page sections per language with `{model}`, `{price}` substitution. |
| `country-qa.json` | 20 questions per country per language; answers assembled from per-country facts; never promises a permit. |
| `locales.json` | NL/DA/FR slug tables and copy; German root and English handled by other builders. |
| `locations.json` (7,406) / `europe-locations-source.json` / `europe-locations.json` | Town data for DE and NL/DK/LU/CH (licence in `europe-locations-LICENSE.txt`). |
| `location-index-policy.json` | The index gate: `default_status: noindex`, `minimum_quality_score: 75`, 1,561 approved routes, search-evidence rule, GSC-derived counts. |
| `blocked-claims.json` | 8 claim rules (own production, 13+ years, galvanising, glazing, 220 V, 3,500 kg/CYR & Knott, same-day response, A.TR duty-free) with replacement wording and the evidence each needs. |
| `prose-fixes.json` | Formulaic phrases replaced in built HTML; hedges deliberately kept. |
| `title-policy.json` | Title suffix and length rules from Search Console measurement. |
| `appendix-scope.json` | Which pages carry the five-market appendix. |
| `commercial.json` | Operator hub + six segments, DE/EN, with enquiry form presets. |
| `tourism-regions.json` | Ten landscapes with bounding boxes and state lists. |
| `services.json` | Per-service content for five services, DE/EN. |
| `quality-spec.json` | Twelve `/qualitaet/` component cards; rule: never state the figure. |
| `production-faq.json` | 60 questions, 9 subjects; answers defer figures to blocked evidence. |
| `faq.json` / `answer-library.json` | 160 legacy FAQ Q&A (DE). |
| `news.json` | 10 sourced items, five hubs, review intervals. |
| `blog-topics.json`, `blog-categories.json`, `en-blog.json`, `blog-nl/da/fr.json`, `posts-*.json`, `blog-daily-1..4.json` | The article libraries and the daily practice queue (blog-daily-3/4 are operator practice, 2026-10-15 to 10-24). |
| `site-photos.json` | 32 real photographs with hand-written German alt text (see `04-design-and-content-inventory.md`). |
| `privacy.json` | Privacy notice DE/EN as data; no legal entity named by rule. |
| `hreflang-clusters-generated.json` | Clusters contributed by news and production-FAQ generators. |
| `content-lastmod.json` | Content-hash based lastmod per route. |
| `market-scan-config.json`, `market-signals.json`, `verified-signals-inbox.json`, `market-research.json`, `market-research-2026-10.json` | The market-intelligence engine's policy, store, inbox and the owner-supplied research reduced to publishable shape (no prospect names stored). |
| `knowledge-graph.json` | Legacy Organization/Product graph used by the retired Python generator; its Organization description still says "mit eigener Produktion" and `areaServed` lists ten countries — not what the live home page emits (five markets, no production claim). |
| `social-posts.json` | Ninety-post Instagram feed plan. |
| `gsc/` | Search Console CSV exports (Turkish-language headings) read by the engine. |

## 5. User flows

- **WhatsApp dock** on every page, `wa.me/905535435342` with prefilled text; dock
  copy in `whatsappDock()` in `build-modunera-v2.mjs`; opening the panel and
  clicking through are separate tracked events.
- **Enquiry form `projektanfrage`** (`data-netlify="true"`, honeypot `bot-field`),
  on `/kontakt/`, all 14,514 location pages and the operator pages, with the same
  nine fields (`Nutzung`, `Name`, `E-Mail`, `Telefon`, `Lieferort`, `Einheiten`,
  `Budget`, `Projekt`, `Einwilligung`). `main.js` posts it to Netlify Forms over
  AJAX, stores a copy in `localStorage`, then opens WhatsApp. Netlify Forms was
  off from 2026-10-14 to 2026-10-18 (submissions lost); notifications go to
  emre@modunera.com, which receives mail since 2026-10-18. `crmEndpoint` in
  `integration-config.json` is empty: there is no CRM.
- **Configurator** `/konfigurator/` (`studio.js`, localStorage keys `mc1`–`mc8`),
  ends in WhatsApp.
- **Language picker** reads the page's own hreflang; NL/DA/FR sections carry
  their own blogs, FAQs, models and country pages but no location trees.
- **Catalogue PDF** `/katalog/MODUNERA-Katalog-de.pdf` (German only; equipment
  tables absent pending `REQUIRED-BUSINESS-INPUTS.md` §3a).

## 6. Assets

- `assets/brand/`: master lockup `modunera-master-logo-mountain-v1.png` (2172×724)
  and 300/600/900 derivatives, white 600 variant, `modunera-mark-v1.png` 512×512.
  The sunrise-glow artwork the README lists is not in the directory on this date.
- `assets/images/photos/`: 76 WebP files from 32 real photographs
  (`data/site-photos.json`); placed on factory, projects, quality by
  `build-photo-placement.mjs`. 20 MB in `assets/images` overall.
- `assets/images/gallery/`: 46 CGI model renders (`mc1-exterior.webp` …),
  labelled on model pages as "Visualisierungen aus der MODUNERA-Produktdokumentation".
- `assets/images/hero-slides/`: five slides in three sizes.
- Fonts self-hosted: Poppins 400–800 (latin + latin-ext), Caveat subset for the claim.
- `site.webmanifest` still carries the pre-rebrand `theme_color #C29B72` and
  `background_color #faf8f5`.

## 7. Analytics

`assets/js/main.js` loads GTM, GA4 and Clarity only when `localStorage.mcCookie
=== 'all'` and only from ids in `assets/js/integration-config.json`, which is
empty in the repo (all seven keys `""`). Five consent-gated events:
`whatsapp_click`, `whatsapp_panel_open`, `phone_click`, `document_download`,
`lead_form_submit`, with `page_type`, `page_lang`, `link_place`. `metaPixelId`
exists as a key but no pixel code is loaded. No measurement id is committed.
Search Console exports are read offline from `data/gsc/`.

## 8. Known problems

1. **Legal pages incomplete**: Impressum lists its own missing fields; three
   German legal pages are `noindex` by design (`INCOMPLETE_LEGAL`).
2. **`/en/legal/privacy/` is `index,follow` in the committed HTML** although
   `build-seo-governance-v7.mjs` lists it in `INCOMPLETE_LEGAL`; `build-privacy.mjs`
   runs after governance in the documented order, and the validator's statutory
   check covers only the three German routes. Evidence required: confirm on a
   fresh build; if confirmed, this is a sequencing bug to fix before the redesign
   adds more legal pages.
3. **Claims register is literal-string based**; phrases have slipped past it via
   capitalisation and URL-encoding before (`docs/legal-content-sources.md` §5).
   `/factory/` is still titled "Eigene Tiny-House-Fertigung", which the regex
   family does not match.
4. **The English home is thin and tiny-house-only** ("Premium tiny houses for
   Europe"); the brief's B2B positioning has no route yet. The English model
   routes carry the commercial titles and prices the SEO audit introduced.
5. **No CRM, no lead owner on record**, no mailbox other than emre@ (since 2026-10-18).
6. **No translation workflow**: NL/DA/FR are hand-written data files paired by
   index for hreflang; a count mismatch throws in the builder.
7. **Image weight**: home shipped 2.16 MB desktop / 1.84 MB mobile after the
   August fix; `assets/images` is 20 MB.
8. **Workflow push filter** omits `feat/**`, so CI on this branch runs only via PR.
9. **Legacy residue**: `knowledge-graph.json` text, `site.webmanifest` colours,
   `assets/images/modunera-logo.png`/`modunera-mark.png` (unreferenced).
10. **Daily workflows commit to `main`** independently of any feature branch.

## 9. What must be preserved

- The claims register and the zero-hit rule (`data/blocked-claims.json`, validator check 1).
- The location gate: `default_status: noindex`, evidence-based promotion, sitemap
  containing only approved routes; never run a content generator after the V7 steps.
- hreflang by construction (`build-hreflang-v7.mjs` owns every alternate set).
- Self-referential canonicals, one `h1`, title/description on every indexable page.
- The 301 maps: `netlify.toml` model redirects and the generated `_redirects`.
- Self-hosted fonts; no third-party request before consent.
- The nine-field form contract across all three form generators and the Netlify
  form name `projektanfrage`.
- `data/pricing.json` ↔ `studio.js` ↔ `configurator.js` consistency check and the
  `mc1`–`mc8` localStorage keys.
- The legal-content rule set: orient, name the authority, never assert a plot
  (`docs/legal-content-sources.md`).
- The statement that the statutory pages stay `noindex` until §1 of
  `REQUIRED-BUSINESS-INPUTS.md` is satisfied.
- Idempotency and the "committed HTML equals fresh build" CI gate; `README-build.md`
  run order updated in the same commit as any new generator.
- The real photographs: originals never deleted, renamed or altered (handoff rule 5).
