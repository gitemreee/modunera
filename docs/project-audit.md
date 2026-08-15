# MODUNERA — technical audit

Date: 2026-08-15
Branch: `codex/modunera-full-system`
Commit audited: `610e150b`
Method: every number below is counted from the committed HTML on disk by
`tools/audit-project.mjs`, plus a Chromium pass at 390 and 1440 px. Nothing is
taken from a build report, because a build report records what a generator
believed it did.

Reproduce with:

```bash
node tools/audit-project.mjs --json build-report-audit.json
node tools/validate-modunera.mjs
node tools/validate-seo-v7.mjs
```

---

## 1. What the project is

No framework, no package manager, no build step at deploy time. `netlify.toml`
publishes the repository root. The site is 15,165 committed HTML pages produced
by twelve Node generators in `tools/`, run in a fixed order documented in
`README-build.md`. There is no `package.json`, so there is no `npm run build`,
no lint config and no test runner — the equivalents are the two validators and
the browser pass listed above.

| | |
|---|---|
| HTML pages | 15,165 |
| Indexable | 515 |
| `noindex,follow` | 14,650 |
| Sitemap URLs | 514 |
| Image files | 66 (12 MB) |
| Repository, excluding `.git` | 593 MB |
| Internal links checked | 1,387,913 |

## 2. What is already correct

These were verified, not assumed. They are listed because an audit that only
reports faults invites re-doing work that is already done.

- **Zero broken internal links** across 1,387,913 checked references.
- **Zero images referenced but absent.** Every `src` resolves to a file.
- **Zero invalid JSON-LD.** All 37,801 blocks parse.
- **Zero missing `alt` attributes** across 74,668 `<img>` tags. 25 are
  deliberately empty (decorative), which is correct.
- **WhatsApp: 52,613 links, all on +90 553 543 5342, all with prefilled text.**
  No wrong number anywhere.
- **Zero external render-blocking references.** No CDN font, script or
  stylesheet — the site loads nothing from a third-party host.
- **Sitemap integrity**: all 514 URLs resolve to a page; no orphan entries.
- **Canonical, `lang`, title, description and `h1`** are present on every page
  except one (see 3.1).
- `robots.txt` does not block GPTBot, ClaudeBot or PerplexityBot.
- `llms.txt` (880 B) and `llms-full.txt` (3,807 B) are present.
- Mobile navigation opens on tap; the WhatsApp dock is visible on a 390 px
  viewport; no JavaScript errors on any page tested.

## 3. Findings, by priority

### P1 — fix before the next deploy

**3.1 The CI workflow is stale and would fail.**
`.github/workflows/build-modunera.yml` runs a three-command pipeline
(`rebrand` → `europe` → `v2`) that is missing seven of the twelve current steps:
the locales layer, the depth layer and its `--extend` phase, news, the production
FAQ, hreflang, `content-lastmod`, SEO governance and `validate-seo-v7`. It then
asserts `assets/images/modunera-logo.png` and `assets/images/modunera-mark.png`
exist — files the rebrand step deliberately retired in favour of `assets/brand/`.
It also triggers only on pushes to `codex/modunera-europe-growth`, a branch that
no longer exists, and only when the workflow file itself changes. Left as is, it
is a green-looking check that verifies nothing, and a red one the moment anybody
enables it properly.

**3.2 Three real colour-contrast failures.**
Measured against WCAG AA with the computed background walked up the tree.
White-on-photograph readings of 1.00–1.09 in the raw output are tool artefacts
(a gradient or background-image is not a `backgroundColor`) and are excluded.
What remains is real:

| Element | Foreground | Background | Ratio | Required |
|---|---|---|---|---|
| `h3` inside `.section-dark` | Roof `#97311A` | Moss-deep `#2E4733` | **1.34** | 3.0 |
| `p` inside `.section-dark` | Muted `#4A5748` | Moss-deep `#2E4733` | **1.33** | 4.5 |
| `a.source-link` in `.state-card` | Sage `#A3B18A` | White | **2.28** | 4.5 |

The first two are the same defect: the dark section inherits the heading and body
colours written for a light ground. The third is site-wide — it is the
"Deutschland →" / "Weiterlesen →" link that appears on country, model and service
pages.

Two near-misses are also worth closing while the file is open: `a.btn` in sage
(4.46 against a required 4.5) and `small` `#AFC1B7` on Moss (4.10 against 4.5).

**3.3 44,187 `<img>` tags carry no `width`/`height`.**
That is 59% of all image tags. Every one is a cumulative-layout-shift risk, and
CLS is a Core Web Vitals metric. The fix belongs in the generators, not the HTML.

**3.4 45,036 `<img>` tags carry no `loading` attribute.**
Below-the-fold images are fetched eagerly. The home page pulls 4.6 MB at 1440 px
and 4.1 MB at 390 px — the heaviest page on the site by a wide margin, and the
one most likely to be a first impression.

### P2 — fix in the next content pass

**3.5 `Product` schema on 14,556 pages with no product data.**
Every location page carries `WebPage.about = {"@type":"Product","name":"Tiny
House für <place>","brand":"MODUNERA"}` — a product entity per town, with no
offer, no price, no SKU and no specification, because those figures are still
blocked in `REQUIRED-BUSINESS-INPUTS.md`. The pages are `noindex`, so nothing
reads the markup today, but asserting 14,556 distinct products is the kind of
claim this project has otherwise been careful not to make. Recommendation: drop
the `about` node from location pages and keep `Product` for the eight models
only, once real specifications exist.

**3.6 `FAQPage` schema on 14,920 pages.**
Same shape of problem. The schema is legitimate — the questions are visible on
the page — but at this scale on `noindex` URLs it is bytes with no reader.

**3.7 No email address anywhere on the site.**
Zero `mailto:` links across 15,165 pages, against 30,305 `tel:` links. A German
Impressum requires an e-mail address, and section 1 of
`REQUIRED-BUSINESS-INPUTS.md` already lists it as a publish blocker — this is the
same gap seen from the front end.

**3.8 14,362 titles exceed 65 characters.**
Almost all are location pages, which are `noindex`, so the SERP truncation
argument does not apply to them. It does apply to the 515 indexable pages: 126
descriptions exceed 165 characters and 9 fall under 70.

**3.9 Four duplicated title strings and four duplicated descriptions** among
indexable pages. The worst is "Guides – MODUNERA | Tiny House" on two URLs.
Small, but it is the class of problem the sitemap gate exists to prevent.

**3.10 1.2 MB of dead brand assets.**
`assets/brand/modunera-digital-sunrise-glow-v1*` (PNG plus three derivatives) is
referenced by nothing. This is the alternative logo direction that must not be
used. Deleting the files removes the chance of it being picked up by mistake.
Also unreferenced: the v1 gallery set (`assets/images/mc-1…8.webp`, `hero.webp`,
`interior-1…3.webp`) and the retired `modunera-logo.png` / `modunera-mark.png`.

**3.11 1,237 inline `style` attributes.** Mostly harmless, but they are the
places where the design system is being bypassed and are worth folding into
classes as those templates are next touched.

### P3 — watch

- `google1292ab011b78c207.html` is a Search Console verification stub with no
  title, canonical, `lang` or `h1`. Expected for that file type; noted so the
  single-page counts in section 2 are not read as a fault.
- 33 asset files report as unreferenced by a naive scan; 18 of those are hero
  slide derivatives reached through `srcset`/`<source>` and are genuinely in use.
  The real dead set is the 14 files named in 3.10.
- 17 pages have no Open Graph title or image, 18 no Twitter card. All are utility
  or legal pages.

## 4. Rendering and performance

Local Chromium, no network beyond the origin, cold cache per page.

| Page | Width | Transferred | Load | DOM nodes |
|---|---|---|---|---|
| `/` | 390 | 4,056 KB | 178 ms | 841 |
| `/` | 1440 | 4,628 KB | 211 ms | 841 |
| `/en/` | 1440 | 3,185 KB | 154 ms | 517 |
| `/modelle/md-1/` | 1440 | 655 KB | 76 ms | 736 |
| `/leistungen/` | 1440 | 197 KB | 60 ms | 519 |
| `/produktion-faq/` | 1440 | 201 KB | 60 ms | 520 |

The home page is 20× the weight of a service page. The cause is the five-slide
hero: all five stills are fetched, and only the first is needed for the first
paint. `fetchpriority="low"` is already set on slides 2–5, but low priority is
not deferral. This is the single highest-value performance fix on the site.

Every page is under 900 DOM nodes, which is healthy.

## 5. Internationalisation

Five market languages: German (root), English (`/en/`), Dutch (`/nl/`), Danish
(`/da/`), French (`/fr/`). Two non-market trees (`/sv/`, `/tr/`) are `noindex`.

- 302 pages carry hreflang; 160 form complete five-language clusters.
- Reciprocity holds by construction: `build-hreflang-v7.mjs` writes the identical
  tag set to every cluster member and strips sets it did not write.
- The language picker in the navigation reads the page's own hreflang tags, so a
  page with no equivalent in a language does not offer a false switch.

Gap: Switzerland is served in German and French but the architecture has no
Italian branch, which the brief asks to be ready for. Nothing is broken; it is
an unbuilt extension point, recorded in the backlog.

## 6. Structured data inventory

| Type | Pages |
|---|---|
| FAQPage | 14,913 |
| WebPage | 14,542 |
| BreadcrumbList | 7,803 |
| BlogPosting | 249 |
| CollectionPage | 161 |
| Product (nested `about`) | 14,556 |
| Article / NewsArticle | 71 |
| Service | 20 |
| Organization (incl. nested publisher) | 330 |
| WebSite | 1 |
| LocalBusiness | 0 |

`WebSite` on exactly one URL (the home page) is correct. `LocalBusiness` at zero
is also correct and deliberate: it requires a verifiable address and opening
hours, which section 1 of `REQUIRED-BUSINESS-INPUTS.md` does not yet have.

## 7. Forms and conversion surface

Eight forms exist across the site. Every WhatsApp link carries a prefilled
message. There is no analytics identifier configured
(`assets/js/integration-config.json` is empty of one), so no measurement of
WhatsApp clicks or form submissions is possible today — event points and named
placeholders are Phase 9 work.

## 8. Media inventory — a blocked premise

The brief refers to a connected Tiny House folder holding 186 images and a
pre-existing inventory report. Neither is reachable from this environment: the
repository contains 66 images, and a search of the connected Google Drive
returns the site's own gallery renders and unrelated business folders, with no
186-image set and no inventory document.

Consequence: the Instagram work can build the folder structure, the design
system, the manifest schema and the automation, and can draft a grid from the
renders already in the repository — marked "Concept", per the brief's own rule
that AI and render imagery must be labelled. Selecting from 186 real photographs
cannot be done until that folder is shared. This is recorded as a blocker rather
than worked around.

## 9. Recommended order of work

1. Fix or retire the CI workflow (3.1) — it is the only finding that can silently
   mislead.
2. Contrast (3.2) — three CSS rules.
3. Image dimensions and lazy-loading in the generators (3.3, 3.4), then re-measure
   the home page weight.
4. Defer hero slides 2–5 (section 4).
5. Drop the per-town `Product` node (3.5).
6. Delete the dead brand assets (3.10).
7. Titles and descriptions on the 515 indexable pages (3.8, 3.9).
