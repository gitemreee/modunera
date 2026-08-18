# SEO, GEO and AI-answerability report

Date: 2026-08-16
Branch: `codex/modunera-full-system`
Method: every number is counted from the committed HTML on disk, plus a Chromium
pass. Nothing is taken from a build report, because a build report records what a
generator believed it did.

Reproduce:

```bash
node tools/validate-seo-v7.mjs
node tools/score-location-pages.mjs --json build-report-location-quality.json
node tools/audit-project.mjs --json build-report-audit.json
node tools/score-indexed-originality.mjs --json build-report-originality.json
```

---

## 1. Where the site stands

| | |
|---|---|
| HTML pages | 15,164 |
| In the sitemap | 514 |
| Explicitly `index,follow` | 284 |
| Explicitly `noindex,follow` | 14,646 |
| Explicitly `noindex,nofollow` | 4 |
| Pages carrying hreflang | 302 |
| Complete five-language clusters | 160 |
| FAQPage blocks | 14,895 |
| Direct-answer boxes | 15,023 |
| `llms.txt` / `llms-full.txt` | 881 B / 3,812 B |
| External resources on any page | **0** (as of today — see 3.1) |
| `mailto:` links | **0** |

The shape is unusual and deliberate: a 15,000-page site that offers 514 of them
to search. The rest are the programmatic location corpus, held back by
`data/location-index-policy.json` until they earn promotion. That is the right
architecture, and the rest of this report is mostly about whether the 514 are
doing their job and what it would take for any of the 14,650 to join them.

## 2. What is already right

Verified, not assumed:

- **Zero broken internal links** across 1,601,388 checked references.
- **Zero invalid JSON-LD.** All 37,801 blocks parse.
- **Zero blocked claims.** `validate-seo-v7.mjs` counts the phrases in
  `data/blocked-claims.json` and fails the build at anything but zero.
- **Sitemap integrity.** All 514 URLs resolve to a file on disk. Both sitemaps
  referenced by `robots.txt` exist and the index points at both.
- **hreflang reciprocity holds by construction.** `build-hreflang-v7.mjs` writes
  the identical tag set to every cluster member and strips sets it did not write,
  so a one-way declaration is not possible.
- **The language picker reads the page's own hreflang**, so a page with no
  equivalent in a language does not offer a false switch.
- **`robots.txt` does not block any AI crawler.** `User-agent: *` / `Allow: /`,
  with only the two demo shells disallowed.

## 3. Findings

### 3.1 P0 — fixed today: every page loaded a third-party font

`assets/css/styles.css` opened with `@import url('https://fonts.googleapis.com/…')`.
All 15,164 pages made a request to Google before any consent was possible, on a
site whose own cookie notice states in five languages that no analysis or
marketing service is active, and which sells primarily into Germany, where a
court has already awarded damages over that exact arrangement.

It also cost performance in the worst way an asset can: an `@import` inside a
stylesheet is invisible to the browser until that stylesheet has downloaded and
parsed, so the chain was four round trips across two origins before a character
was drawn — and when Google was slow or blocked, the page rendered in a system
fallback.

Fixed by self-hosting Poppins and a 14-character subset of Caveat under
`assets/fonts/`. Manrope was in the import and rendered on zero elements across
seven page types, so five weights were being fetched for nothing and are gone.

**The transferable lesson**: this repository's own audit claimed zero external
references for weeks. The check scanned HTML; the reference lived in CSS. "We
load nothing external" is a claim about every file the browser fetches and can
only be tested by loading a page and watching the network.

### 3.2 P1 — 7,478 pages cannot cite the authority they name

The German-market pages under `/standorte/` tell the reader to contact the
competent building authority and link no official source, because they predate
the generator that adds one. The 3,554 pages for the other four markets in the
same tree all have it. Detail and recommended fix in
`docs/legal-content-sources.md` §4.1.

This is worth 20 of 100 points each on the quality gate and is the largest single
move available to that corpus.

### 3.3 P1 — the location corpus scores 491 of 14,641 against its own gate

`tools/score-location-pages.mjs`, run on the full corpus:

| Band | Pages |
|---|---|
| 75–100 (passes) | 491 |
| 50–74 | 7,255 |
| 25–49 | 6,895 |
| 0–24 | 0 |

| Tree | Pages | Mean | With a source | Mean original sentences |
|---|---|---|---|---|
| `en/locations` | 3,609 | 60 | 3,554 | 1.5 |
| `standorte` | 11,032 | 50 | 3,554 | 1.4 |

**Mean original sentences per page: 1.4.** After each page's own place and region
names are blanked, the average location page contributes between one and two
sentences that are not on dozens of other pages. That is the honest description
of a templated corpus, and it is why holding them out of the sitemap was correct.

The 491 that pass are mostly Dutch pages, where the regional and climate
paragraphs genuinely differ. They are the sensible first tranche if any promotion
happens — and promotion should be a decision, taken deliberately, on a small
batch, with the search-console effect measured before the next.

### 3.35 P1 — fixed 2026-08-17: the appendix was the largest repeat on the indexed set

The 514 pages offered to search had no originality instrument; only the noindex
location corpus did. `tools/score-indexed-originality.mjs` is that instrument. It
measures the share of a page's `<main>` sentences that appear on no other indexed
page, after blanking place names and figures — the same normalisation
`score-location-pages.mjs` uses, and for the same reason: a mail-merged sentence
is textually unique on every page and original on none.

Measured before the fix, the top repeats were not the disclaimer but the country
permit paragraphs: the same sentence about `§ 35 BauGB` on 146 pages, the same one
about Danish *sommerhusområder* on 146, the ordering checklist on 144. All of it
came from one block — the `APPENDIX` in `build-modunera-depth.mjs --extend`, which
was applied to the whole article library: 221 pages, ~640 words each. On a page
about kitchen layout or acoustic separation, Danish holiday-zone permitting
answers a question the reader did not ask.

Scoped by subject rather than by tree. The decision now lives in
`data/appendix-scope.json`, with a reason written against every category and every
page type, and the default is drop, so a new section cannot inherit forty
sentences by accident. Kept where siting, permitting, import or total cost is the
subject — the Europe guides, the country-permit and cost and letting and transport
categories, the bungalow and modular service pages. Dropped from interiors,
technical construction, energy, maintenance, the bespoke-furniture and steel pages
and the library hubs.

| | Before | After |
|---|---|---|
| Pages carrying the appendix | 221 | 96 |
| Mean originality, 514 indexed pages | 42.2% | **49.5%** |
| Median originality | 34.0% | **42.9%** |
| Indexed pages below 25% original | 241 | **161** |
| Indexed pages below 50% original | 325 | **276** |
| Pages sharing the `§ 35 BauGB` paragraph | 146 | 65 |
| Pages sharing the ordering checklist | 144 | 63 |

No page was deleted and the sitemap did not move: 15,164 pages, 514 URLs, both
validators exit 0, and a second full run changes nothing.

What did **not** improve, and is the next thing to fix: the `md-8` model pages
(4.5–5.3% original) and the country question pages (5.4–5.7%) are now the worst on
the site. Neither carries the appendix — their repetition is their own shared model
and fact tables, which is a different problem with a different fix.

### 3.4 P2 — the indexing policy is expressed in two places and only one is enforced

514 URLs are in the sitemap. 284 of them carry an explicit `index,follow`. The
other **230 carry no robots meta at all** and are indexable by default — the
Danish and Dutch blog trees, mostly.

Nothing is broken: default is indexable and the sitemap is correct. But the
policy lives in two lists that no check compares, so a page can be added to one
and forgotten in the other. Worth an assertion in `validate-seo-v7.mjs`: every
sitemap URL must carry an explicit `index,follow`, and no page carrying it may be
absent from the sitemap.

### 3.5 P2 — titles and descriptions on the pages that are indexed

Of the 284 explicitly indexable pages:

| | Mean | Over the practical limit |
|---|---|---|
| `<title>` | 72 characters | 203 over 65 |
| `<meta description>` | 146 characters | 58 over 165 |

Truncation in a result is not a ranking penalty, but a title cut mid-phrase is a
click not taken. The pattern is the ` | MODUNERA` suffix plus a long descriptive
head; shortening the head rather than dropping the brand is the fix, and it
belongs in the generators.

### 3.6 P2 — no e-mail address exists anywhere

Zero `mailto:` across 15,164 pages, against 30,305 `tel:` links. A German
Impressum requires one. Blocked on section 1 of `REQUIRED-BUSINESS-INPUTS.md`.

### 3.7 P2 — `Product` schema on 14,556 pages with no product

Every location page carries `WebPage.about` as a `Product` named "Tiny House für
<place>", with no offer, price, SKU or specification, because those are blocked.
The pages are `noindex` so nothing reads it today, but asserting 14,556 distinct
products is the kind of claim this project has otherwise avoided. Recommendation
unchanged from the audit: drop `about` from location pages and keep `Product` for
the eight models, once real specifications exist.

---

## 4. GEO — being answerable by AI systems

This is where the site is unusually well placed, largely by accident of decisions
taken for other reasons.

**What already works in its favour:**

- **Direct-answer boxes on 15,023 pages.** Every page opens with a short, direct
  statement of the answer before the argument. That is the single most useful
  structure for extraction, and it was built for readers.
- **14,895 FAQPage blocks**, with the question visible on the page and the answer
  matching the markup. Schema that agrees with the rendered text is the kind an
  answer engine can use; schema that does not is the kind that gets a site
  distrusted.
- **Sourced statements.** The legal paragraphs name the competent authority and
  link the official source. An answer engine looking for a citable claim finds one
  with its provenance attached.
- **Stated limits.** The site says what it does not know — that permission
  depends on the plot, that figures are indications, that a weighbridge ticket is
  what binds. Hedged, sourced text is what survives being quoted.
- **`llms.txt` and `llms-full.txt` are present**, and `robots.txt` blocks no AI
  crawler.
- **No JavaScript dependency for content.** Every page is complete HTML. Crawlers
  that do not execute scripts see everything.

**What would improve it, in order of value:**

1. **Publish the legal entity.** An answer engine asked "who makes MODUNERA tiny
   houses" cannot currently answer with a company, an address or a registration,
   because the site does not state them. This is the same blocker as everything
   else, and it is the one that most limits being cited as a source rather than
   mentioned as a name.
2. **`llms-full.txt` is 3,812 bytes for a 15,000-page site.** It can carry
   substantially more: the eight models with their layouts and indicative prices,
   the five markets with their authorities, the scope boundaries now on the
   service pages. That file is the cheapest surface on the site to improve.
3. **Add `Organization` `sameAs`** pointing at the Instagram, Facebook and
   Pinterest profiles that now exist. Entity resolution across platforms is what
   turns a name into a known organisation.
4. **Answer the comparison question explicitly.** "Turkish vs Polish tiny house
   manufacturer" is a real query with a real answer, and the honest version —
   including the customs difference — is a page no competitor will write. See
   `docs/competitor-analysis-poland-romania.md` §9.4.
5. **Do not add more FAQ schema.** 14,895 blocks on `noindex` pages is already
   bytes with no reader. Depth on the 514 beats breadth across the 14,650.

## 5. What to do next, in order

1. Publish the legal entity (§3.6, §4.1) — unblocks the Impressum, the e-mail,
   `LocalBusiness` schema, and the largest trust gap against EU competitors.
2. Add the German source block to the 7,478 pages (§3.2) — one insertion point
   repeated, 20 points each on the gate.
3. Add the sitemap/robots cross-assertion to `validate-seo-v7.mjs` (§3.4) — an
   hour, and it closes a class of drift permanently.
4. Shorten the 203 long titles (§3.5) in the generators.
5. Expand `llms-full.txt` (§4.2).
6. Leave the location corpus `noindex` until §3.2 is done and the gate is re-run.
   Promoting on today's scores would be promoting templates.

## 6. What this report does not cover

- **Rankings.** No rank tracking exists for this site, so nothing here says how it
  performs on any query. Everything above is about whether the pages deserve to.
- **Search Console data.** Not connected to this environment. The owner reported
  the first figure on 2026-08-18: **10 clicks from Germany in 24 hours**. That is
  the first traffic signal this project has had, and it is a baseline rather than
  a result — the site is weeks old and 519 of its 15,171 pages are offered to
  search. It is recorded here because everything else in this report is a
  statement about whether pages deserve traffic, and this is the first sentence
  about whether they get any. Anyone reading later: compare against the daily
  series, which began the same day.
- **Conversion.** Now measurable but not yet measured — the event layer shipped
  today and `assets/js/integration-config.json` is still empty by design. See
  `docs/conversion-events.md`.
