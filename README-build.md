# MODUNERA build pipeline

Static HTML/CSS/JS, published by Netlify straight from the repository root
(`netlify.toml` → `publish = "."`). There is no framework and no build step at
deploy time — the generators below produce the committed HTML.

## Run order

```bash
node tools/rebrand-modunera.mjs           # brand normalisation, legacy asset removal
node tools/build-modunera-europe.mjs      # countries, regions, cities, services, Europe guides
node tools/build-modunera-locales.mjs     # Dutch, Danish and French sections
node tools/build-modunera-depth.mjs       # MD 1–MD 8 in five languages, country questions, blogs
node tools/build-news-v7.mjs              # sourced local news, five market hubs
node tools/build-production-faq-v7.mjs    # production, quality, delivery and buying FAQ
node tools/build-modunera-v2.mjs          # navigation, comparison pages, guide hubs, cookie notice
node tools/build-modunera-depth.mjs --extend   # appendix, product word, blocked-claim removal
node tools/build-hreflang-v7.mjs          # reciprocal five-language clusters
node tools/build-image-attrs.mjs          # intrinsic size, lazy loading, deferred place index
node tools/build-nordic-redirects.mjs     # 301s for the corrected Danish slugs
node tools/build-content-lastmod.mjs      # real content dates, from a content hash
node tools/build-seo-governance-v7.mjs    # robots policy, location gate, sitemaps
node tools/validate-modunera.mjs          # gate: canonicals, JSON-LD, links, brand, colours
node tools/validate-seo-v7.mjs            # gate: claims, sitemap, hreflang, schema, legal
```

The four V7 steps run **after** the content pipeline, in that order. They read the
finished HTML, so running any content generator afterwards undoes them — that is
the one ordering mistake this pipeline will not tell you about, because every
individual command still succeeds.

The order matters, and the depth layer runs twice on purpose.

`build-modunera-europe.mjs` writes its own six-link navigation into the pages it
generates; `build-modunera-v2.mjs` then replaces every `<nav class="nav">` on the
site with the shared mega-menu and rebuilds the sitemaps so the pages it adds are
indexed. Running the Europe build without the v2 layer afterwards leaves the site
with two different menus.

The locale builder runs before the v2 layer so its pages pick up the shared
navigation, the WhatsApp dock and the sitemap. The news and production-FAQ
generators run there for the same reason: they emit an empty `<nav class="nav">`
for v2 to fill, and v2 reads their hub paths and labels out of `data/news.json`
and `data/production-faq.json` to build the menu entries that point at them.

`build-modunera-depth.mjs` has two phases because v2 sits between them. Phase one
writes new pages, which then need v2's navigation and sitemap entries. Phase two
(`--extend`) appends the country question sets and the five-market appendix to the
existing library — including the guide hubs and category pages that v2 itself
regenerates, which is exactly why it cannot run before v2.

All of them are idempotent — a second full run changes nothing.

## Languages

German is the root, English is `/en/`, and the three remaining target-market
languages live under their own directories with the slugs those markets actually
use — not translations of the English ones:

| Locale | Home | Countries | Services | Models | Questions | Guides | Blog | FAQ |
|---|---|---|---|---|---|---|---|---|
| German | `/` | `/laender/` | `/leistungen/` | `/modelle/` | `/fragen/` | `/ratgeber/` | `/blog/` | `/faq/` |
| English | `/en/` | `/en/countries/` | `/en/services/` | `/en/models/` | `/en/questions/` | `/en/guides/` | `/en/blog/` | `/en/faq/` |
| Dutch | `/nl/` | `/nl/landen/` | `/nl/diensten/` | `/nl/modellen/` | `/nl/vragen-per-land/` | `/nl/gidsen/` | `/nl/blog/` | `/nl/veelgestelde-vragen/` |
| Danish | `/da/` | `/da/lande/` | `/da/ydelser/` | `/da/modeller/` | `/da/spoergsmaal-per-land/` | `/da/guides/` | `/da/blog/` | `/da/ofte-stillede-spoergsmaal/` |
| French | `/fr/` | `/fr/pays/` | `/fr/services/` | `/fr/modeles/` | `/fr/questions-par-pays/` | `/fr/guides/` | `/fr/blog/` | `/fr/questions-frequentes/` |

Copy, slugs and country names live in `data/locales.json`; the per-country legal
and climate paragraphs are written per language in `COUNTRY_COPY` inside
`tools/build-modunera-locales.mjs`. Every locale page carries hreflang for all
five languages plus x-default, and the header language picker lists them all.

`/sv/` and `/tr/` are single legacy pages outside the target markets. Their
`html lang` was wrong (both claimed German) and is now correct, but they are not
built out.

## Where to edit what

| Change | File |
|---|---|
| Visual language: type scale, spacing, cards, colours | `tools/design-system-v2.css` |
| The palette | the `:root` token block at the top of `tools/design-system-v2.css` |
| Navigation entries | `MENU` in `tools/build-modunera-v2.mjs` |
| Brand claim ("Design Your Nature") | `CLAIM` in `tools/build-modunera-v2.mjs` |
| WhatsApp dock copy and services | `whatsappDock()` / `WA_SERVICES` in `tools/build-modunera-v2.mjs` |
| Model specs and prices | `data/pricing.json` |
| Model editorial copy (MD 1–MD 8, five languages) | `data/model-copy.json` |
| Model page long-form sections | `data/depth-copy.json` |
| Country question sets (20 × 5 countries × 5 languages) | `data/country-qa.json` |
| Blog subjects (58, five points and five mistakes each) | `data/blog-topics.json` |
| Blog category material, per format | `data/blog-categories.json` |
| English knowledge library (nine subjects) | `data/en-blog.json` |
| Dutch, Danish and French blogs (nine subjects each) | `data/blog-nl.json`, `data/blog-da.json`, `data/blog-fr.json` |
| Individual posts (28 per language, en/nl/da/fr) | `data/posts-<code>.json` and `posts-<code>-2.json`, listed in `POST_BATCHES` |
| Production, quality, delivery and buying FAQ (60 questions) | `data/production-faq.json` |
| Sourced local market news | `data/news.json` |
| Claims that may not be published yet | `data/blocked-claims.json` |
| The five-market appendix | `APPENDIX` in `tools/build-modunera-depth.mjs` |
| Home-page model grid, five languages | `HOME_MODELS` in `tools/build-modunera-depth.mjs` |
| Guide categories | `GUIDE_CATEGORIES` in `tools/build-modunera-v2.mjs` |
| New market guides | `MARKET_GUIDES` in `tools/build-modunera-v2.mjs` |
| Country copy, permits, regions | `COUNTRIES` in `tools/build-modunera-europe.mjs` |
| Location data | `data/europe-locations-source.json` |

Never edit `assets/css/styles.css` between the `MODUNERA BRAND PALETTE`
markers — that block is regenerated from `tools/design-system-v2.css` on every
build. Edits outside the markers survive, but the generated block is appended
last and therefore wins on equal specificity.

## SEO governance (V7)

Applied from the August 2026 audit pack. Five things it changes and why.

**Claims.** `data/blocked-claims.json` lists phrases that cannot be published until
the business supplies evidence — own production, 13+ years, hot-dip galvanising,
3,500 kg, CYR/Knott, double-tempered glazing, 220 V, same-day response. The pass
runs in `build-modunera-depth.mjs --extend` because those phrases live in three
layers at once: the current generators, the data corpora, and roughly 11,000 pages
baked by the retired `tools/generate_scale_v3.py`. `validate-seo-v7.mjs` asserts
the count of remaining hits is zero, so a claim cannot come back through a new
generator without failing the build. Delete a rule when the evidence in
`REQUIRED-BUSINESS-INPUTS.md` arrives — do not edit pages.

**The location gate.** 14,641 of 15,164 pages are programmatic location pages. They
default to `noindex,follow` and stay out of the sitemap until an entry in
`data/location-index-policy.json` scores at least 75 against the ten mandatory
fields in the pack's quality gate. The allow-list is deliberately empty: these
pages are a data store, not 14,641 search results.

**lastmod.** Git file dates are useless here — the pipeline rewrites navigation and
footer on every page, so git sees all 15,000 as modified whenever either changes.
`build-content-lastmod.mjs` hashes the page's own content instead (main, title,
description) and only moves a date when that hash moves.

**hreflang.** `build-hreflang-v7.mjs` composes clusters from the same slug tables the
pages are generated from, writes the identical set to every member so reciprocity
holds by construction, and adds no tag for a language that has no equivalent page.
It also strips the sets earlier generators wrote, which pointed many German pages
at a single English hub. Generators that route their own pages — the news hubs and
the production FAQ — contribute their clusters through
`data/hreflang-clusters-generated.json` rather than having their routing rules
copied here.

**Statutory pages.** `/legal/impressum/`, `/legal/datenschutz/` and `/legal/cookies/`
are `noindex,follow` while they are incomplete, and the validator fails if any of
them becomes indexable. Remove them from `INCOMPLETE_LEGAL` in
`build-seo-governance-v7.mjs` once section 1 of `REQUIRED-BUSINESS-INPUTS.md` is
satisfied.

## The product word

"Tiny house" is the search term in all five markets — German buyers type the
English words more often than any translation — so it is the product word
everywhere rather than a per-language equivalent. `normaliseTitles()` in
`tools/build-modunera-depth.mjs` runs last in the pipeline and gives the term to
any `<title>` and any content-page `<meta name="description">` that lacks it,
extending the existing `| MODUNERA` suffix rather than adding a second brand.
Re-running finds nothing to do, which is what keeps the pipeline idempotent.

Coverage after a full build, out of 15,007 pages:

| Field | Pages missing the term | Why |
|---|---|---|
| Body copy | 1 | the Google verification file, which has no body |
| `<title>` | 5 | the verification file and four local-only app shells |
| `<meta description>` | 10 | legal pages and app shells — `TERM_CONTENT` excludes them on purpose |
| `<h1>` | 32 | the 20 "other structures" pages (a bungalow is not a tiny house), three legal pages, the app shells |

Do not push the last few: an imprint headline that says "tiny house" reads as
keyword stuffing, and the pages concerned already carry the term in the title.

## The locale blogs

`nl`, `da` and `fr` each have their own blog at `<code>/blog/`, generated by
`buildKnowledgePages()` from `data/blog-<code>.json`. They are written for their
own market, not translated from the German library: the Dutch pages talk about
the Omgevingswet and the Omgevingsloket, the Danish about kommunen and
byggetilladelse, and the French serve Luxembourg and Suisse romande, where the
vocabulary is different again.

`tools/build-modunera-v2.mjs` reads the same three files to build the Blog menu,
so a renamed or reordered category appears in the navigation on the next build
and the two layers cannot drift. The nine categories are in the same order in all
three files — `localeBlogCategoryPage()` pairs them by index for hreflang, so keep
that order if you add a subject.

Beside the nine categories, each of `en`, `nl`, `da` and `fr` carries twenty-eight
individual posts: the specific things a buyer searches for by name — foundation,
cladding, bathroom, kitchen, heating, acoustics — chosen so they do not repeat the
category material. They arrive in batches, `POST_BATCHES = ["", "-2"]` in
`build-modunera-depth.mjs`, so `data/posts-en.json` and `data/posts-en-2.json` are
read as one list; add `-3` to the array to add another sixteen.

`localePostPage()` pairs the four languages by index for hreflang, so the subjects
must stay in the same order in all four files, and the builder throws if the counts
diverge rather than silently pairing the wrong two pages. Each post declares a
`category` slug and is listed on that category page and on the blog hub.

Blog size per language after a full build, counting `<main>` only:

| Language | Hub | Categories | Posts | Words |
|---|---|---|---|---|
| German | `/blog/` | 9 under `/ratgeber/` | 110 + 13 Europe guides | the original library |
| English | `/en/blog/` | 9 | 28 | 52,654 |
| Dutch | `/nl/blog/` | 9 | 28 | 25,834 |
| Danish | `/da/blog/` | 9 | 28 | 23,757 |
| French | `/fr/blog/` | 9 | 28 | 28,291 |

German is still far ahead on count. Closing that gap means writing more subject
material per language, not templating the existing posts — the 125-post German
library was one page published 125 times before it was rewritten, and repeating
that mistake in four more languages would undo the duplication work.

## The production FAQ

`data/production-faq.json` holds sixty questions in nine subjects. One routing
rule in `tools/build-production-faq-v7.mjs` decides the whole shape, and it is the
rule the blueprint asks for: a subject becomes its own page in a language when
that language has at least three answers for it.

German and English carry all sixty, so each gets nine subject pages and a hub that
is a pure index — every question title is listed and links to `#q-<id>` on its
subject page, no answer is repeated. Dutch, Danish and French carry the fourteen
questions that come up in those markets, which is below the threshold everywhere,
so their hub carries the answers and no thin subject page exists. Translate more
of the sixty and the subject pages appear without touching the generator.

`FAQPage` JSON-LD is built from the same array that renders the accordion, so a
question that is not on the page cannot be in its schema. `main.js` opens the
`.faq-item` named by `location.hash`, so a link to one question arrives on an open
answer rather than a closed row.

The answers quote no U-value, weight, warranty period or approval scope. Those are
blocked in `data/blocked-claims.json` until the business supplies evidence, so each
answer says where the figure will come from — see section 6 of
`REQUIRED-BUSINESS-INPUTS.md` for which input unblocks which question.

## Local market news

`data/news.json` holds MODUNERA's own analysis of named public sources — no source
text is reproduced and no source image is used. `tools/build-news-v7.mjs` enforces
the template by page shape rather than trusting the writer: an item whose review
date has passed says so on the page, and an item flagged as needing follow-up or
carrying unverified numbers says that in the body. Items appear in the language of
their own market and in English; no other language claims an equivalent.

Both generators hand their clusters to `data/hreflang-clusters-generated.json`.
`build-hreflang-v7.mjs` owns every alternate set on the site and strips the ones it
did not write, so without that manifest it would remove the sets these two
generators had just produced.

## post-row markup

`.post-row` has two slots: `<strong>` for the title and `<span>` for a short
label. The span is styled uppercase, letterspaced and — historically — `nowrap`,
so a title placed there overflowed the row and then the viewport. That happened
twice. The generators now put titles in `<strong>`, and `.post-row>span` is
allowed to wrap so the mistake cannot push the page again.

## Navigation width

The bar carries nine top-level items in German, and the enlarged lockup takes
about 500px of them. Three rules keep it on one line, all at the end of
`tools/design-system-v2.css`:

- the nav gets its own container, `.nav>.container{--max:1460px}` — note `--max`,
  not `max-width`: `.container` sizes itself with `width:min(var(--max),…)`, so a
  `max-width` override is inert
- the lockup steps down in two disjoint bands (`1340–1479`, `1480–1699`) and keeps
  its full size above 1700px
- below 1340px the drawer takes over, because the row genuinely stops fitting

The bands are written `min-width … and max-width …` so they never overlap, which
is what stops them fighting the phone tiers declared earlier in the sheet.

## Palette

Five colours, plus one derived shade because CSS needs a pressed state and a
surface deeper than the darkest of the five:

| Token | Hex | Role |
|---|---|---|
| `--moss` | `#3A5A40` | body text, dark surfaces, primary action |
| `--leaf` | `#588157` | secondary action, hover, figures on light |
| `--sage` | `#A3B18A` | light accents on dark, chips, the brand claim |
| `--cream` | `#DAD7CD` | alternating sections, notices, accents on dark |
| `--paper-white` | `#F5F5F5` | page ground |
| `--moss-deep` | `#2E4733` | derived: footer, pressed states |
| `--roof` | `#97311A` | headings and navigation — sampled from the logo mark |

The old token names (`--terracotta`, `--charcoal`, `--sand`, `--forest-950` and
the rest) are kept and remapped onto these, so the 164-class v1 contract keeps
working and nothing had to be renamed for the site to repaint.

Two contrast rules fall out of the palette and are worth knowing before editing:
Leaf on white measures 4.1:1, so it fills buttons but never sets small text; and
Sage on Moss measures 3.4:1, so accents on dark surfaces take Cream at 5.4:1 while
large figures on those grounds can still take Sage.

**The logo is deliberately not repainted.** The master lockup keeps its terracotta
mark and near-black wordmark; `tools/generate-brand-assets.py` derives the shipped
sizes from it unchanged. `--roof` is that mark's colour, sampled from the master —
headings and the navigation take it, so the one element that is not repainted sets
the colour of the page's voice. It measures 6.95:1 on White and 5.26:1 on Cream,
but only 1.02:1 on Moss, so every dark surface names its headings back to white.

## Brand assets

`assets/brand/` holds the two master files under their original names, plus the
derivatives `tools/generate-brand-assets.py` produces from them. That script is
deliberately outside the four-command pipeline: it needs Pillow, which CI does
not install, and its outputs are committed. Re-run it only when a master file
changes.

| File | Role |
|---|---|
| `modunera-master-logo-mountain-v1.png` | master lockup, 2172×724 RGBA (source of truth) |
| `…-300/600/900.png` | header and footer lockup, served via `srcset` |
| `…-white-600.png` | white lockup, for dark surfaces |
| `modunera-mark-v1.png` | square mark, 512×512, favicon and manifest |
| `modunera-digital-sunrise-glow-v1.png` | glow master, 1774×887 (source of truth) |
| `…-900/1400.webp`, `…-1400.jpg` | glow band, 11–38 KB instead of 1.2 MB |

The master lockup appears in the header and footer of every page, beside the
handwritten claim "Design Your Nature". The mark is the favicon and manifest
icon, and the Organization schema logo points at `…-600.png`.

The sunrise-glow artwork and its derivatives are kept but **not currently placed
on the site** — the overture band it sat in was removed. They are ready for a
campaign or brand-story slot; nothing references them today.

`assets/images/modunera-logo.png` and `modunera-mark.png` are kept as legacy.
Nothing references them any more; they can be deleted once that has been
confirmed in production.

## Product codes

The models are **MD 1 – MD 8**. The rename from MC touched the visible codes and
the model URLs (`/modelle/md-N/`, with 301 redirects from the old paths in
`netlify.toml`). Two things deliberately did not move:

- the gallery filenames (`mc1-exterior.webp`) — internal, never shown
- the JavaScript model keys (`mc1`…`mc8`) in `studio.js`, `configurator.js` and
  `data/pricing.json` — visitors have configurations saved under those keys in
  localStorage, and renaming them would silently break every saved design

`tools/rebrand-modunera.mjs` carries the code and URL rules, so a rebuild keeps
them normalised.

## Pricing consistency

`tools/build-modunera-v2.mjs` reads `data/pricing.json` and cross-checks every
base price and delivery tariff against `assets/js/studio.js` — the file the site
actually loads — and against `assets/js/configurator.js`, which is dead code kept
in the tree so the two cannot silently diverge. If any of them drift the build
fails with the offending entries listed, so the comparison pages cannot advertise
a price the configurator does not charge.

All five target markets have a tariff. Luxembourg is an average (7,000 EUR) and
is labelled as one; Denmark rides the configurator's Scandinavia tariff and says
so. Adding a market means adding it to both JS files, both delivery selects
(`konfigurator/index.html`, `studio/index.html`) and `data/pricing.json`.

## Validation

`tools/validate-modunera.mjs` exits non-zero on: a missing canonical, duplicate
canonicals, missing `lang`, invalid JSON-LD, a broken local link, a missing
palette colour, a surviving legacy brand string, or a duplicated country/service
link in the homepage navigation. It also asserts the required page set exists.

Current numbers: 15,164 pages, 15,164 unique canonicals, 514 sitemap URLs,
37,801 JSON-LD blocks, 1,601,405 local references checked with none broken. The
sitemap is far smaller than the page count on purpose — see *SEO governance (V7)*.

Beyond the gate, a Chromium pass at 390/768/1440px checks every page for script
errors, horizontal overflow, and that the contact rail renders as SVG icons.

## Page depth

The original kit produced pages of 300–900 words built from one template, which
reads to a search engine as one page repeated. Where that stands now:

| Page type | Before | Now |
|---|---|---|
| Model page (MD 1–MD 8) | 472, German only | 2,100–2,400, five languages |
| Country page | 330–860 | 1,200–2,050 |
| Country question page | did not exist | 1,000–1,420 |
| English subject page | did not exist | 1,100–1,800 |
| Blog post / guide | 605–740 | 1,650–1,900 |

## Duplication

Length was never the real problem with the blog. The 125 posts were generated
from one seven-section skeleton with a keyword substituted in, which a search
engine reads as one page published 125 times.

`data/blog-topics.json` gives each of the 58 subjects its own argument, its own
mistakes and its own questions; `data/blog-categories.json` supplies the
category-level material, split so the guide format and the mistakes-checklist
format of the same subject do not reuse each other's text. Measured across all
5,995 pairs of posts, by 6-gram Jaccard similarity of the `<article>` body:

| | Before | Now |
|---|---|---|
| Mean overlap between any two posts | ~95% | 10.0% |
| Guide vs checklist of the same subject | 100% | 27% |
| Pairs above 85% | almost all | 0 |
| Pairs above 70% | almost all | 0 |
| Worst remaining pair | 100% | 56% (two checklists in one category) |

Adding more shared boilerplate would raise the word counts and undo this, so it
is deliberately not done. Length comes only from `data/blog-topics.json`, which
now holds 22,400 words of per-subject source: five points, five mistakes and
three questions for each of the 58 subjects. Article bodies run 490–850 words on
top of the shared market appendix; taking them to 1,500 means roughly doubling
that corpus again, subject by subject.
