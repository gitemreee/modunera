# Market intelligence, SEO and GEO engine — what was built

Date: 2026-08-19
Brief: the European Tiny House Market Intelligence master prompt, sections 1–77.

This is the section 76 report. It says what exists, what it does on a normal
morning, what it deliberately refuses to do, and the two structural limits that
no amount of further work removes without a decision from the business.

---

## 1. The two limits, first

Everything below is shaped by these. They are not defects and they are not
temporary oversights.

**There is no server.** `netlify.toml` publishes the repository root and the
committed HTML is what ships. There is no database, no CMS, no Cloud Function and
no session. So every "database model" in section 71 is a JSON file in `data/`,
every scheduled job is a GitHub Actions workflow, and the admin panel of sections
62–64 is a generated static page. An admin panel with a login form would be a
login form that protects nothing, because the page it protects is a file the web
server hands to anyone who asks.

**There is no search-provider key, and there must not be one.** Section 74
forbids hard-coding credentials, and this repository is public. Until
`MODUNERA_SEARCH_PROVIDER` and `MODUNERA_SEARCH_KEY` are set as repository
secrets, the daily scan performs no scan. It says so — `provider:
not-configured`, decision `NO_PUBLISH`, reason "no search provider configured, so
no scan was performed — nothing was invented to fill the gap" — and exits 0.

That second limit is the important one. The engine could have been written to
produce a plausible-looking daily report from nothing. It was not, because a
market intelligence system that invents its findings is worse than no system: it
looks like evidence.

---

## 2. What exists

| File | What it is |
|---|---|
| `data/market-scan-config.json` | The whole policy: schedule, five markets with native-language query pools, source authority tiers, scoring weights and threshold, quality gate, commercial signal keywords, status taxonomy with review intervals, decision order, auto-publish switches. |
| `tools/market-intelligence.mjs` | The engine. Scans, scores, deduplicates, checks cannibalisation, decides, writes the store and the daily report. |
| `data/market-signals.json` | The store. Signals, opportunities, tenders, and the last ninety run records. |
| `data/verified-signals-inbox.json` | Findings a person read on the source page, waiting to enter the engine. |
| `tools/build-intelligence-dashboard.mjs` | Generates `/intelligence/` — sections 62, 63 and 64. |
| `tools/test-market-intelligence.mjs` | The nineteen tests of section 75. |
| `.github/workflows/market-intelligence.yml` | The daily run, 04:35 UTC. |
| `build-report-market-intelligence.txt` | The section 69 daily report, in the repository so the last run is readable without opening Actions. |

---

## 3. What a morning looks like

04:35 UTC — 07:35 in Istanbul, chosen so it lands before the daily practice post
at 05:12 UTC and a new article reaches the site the same morning.

1. The scan runs across the five markets in their own languages. With no provider
   configured it checks nothing and reports the failure per market, as section 73
   asks — one market's provider failing never kills the job.
2. Hand-verified candidates in the inbox go through the identical path: score,
   dedup, cannibalisation, decide. There is no shortcut around the gate. An inbox
   entry with no source URL is rejected exactly like a scraped one.
3. One decision is produced. Most days it is `NO_PUBLISH`, and section 17 says
   that is correct: the engine is not obliged to produce something daily.
4. The nineteen tests run. The full site pipeline runs. Both validators run, with
   their exit codes observed rather than piped.
5. If anything changed, it is committed. If nothing changed, nothing is committed.

Publication is never automatic. `AUTO_PUBLISH_NEWS` is not set in the workflow,
so a run that decides `CREATE_NEWS` records the candidate, the score and the
reason, and stops.

---

## 4. The decision engine

Section 18's order, with creating a URL deliberately last:

```
UPDATE_EXISTING_ARTICLE → UPDATE_GUIDE → UPDATE_COUNTRY_PAGE → UPDATE_FAQ
→ CREATE_NEWS → CREATE_BLOG → NO_PUBLISH
```

There is no `CREATE_LOCATION`. Not a guard that could be switched off — the
action does not exist in the engine or in the config, and a test asserts that no
code path can emit it. 14,641 programmatic location pages already exist and are
held out of the sitemap by `data/location-index-policy.json`; a place-specific
finding updates the page for that place or becomes a news item.

**One correction the first live run forced.** A verified Menden (Sauerland)
procedure was routed to `UPDATE_EXISTING_ARTICLE` against an existing article
about Lüptitz — two different municipalities, on the strength of "tiny", "house"
and "Siedlung" appearing in both titles. That is not cannibalisation. Two
place-specific pages compete only when they are about the same place. The check
now skips pages whose place differs from the candidate's; where either side has
no place, title overlap still decides, which is the case the 0.55 threshold was
written for.

---

## 5. The first signal, end to end

The engine was not accepted on the strength of it running. It was run against a
real finding, located by search and read on the source page:

- **Stadt Menden (Sauerland), "Tiny-House-Siedlung Sauerlandstraße"** on the
  Beteiligung NRW portal. Verfahrensträger Stadt Menden (Sauerland), Neumarkt 5,
  58706 Menden. Status active, period from 15.08.2025 with no end date.
- **The page states no number of units.** It is recorded as `units: null`, the
  dashboard renders it as "nicht angegeben", and the article says the source does
  not state it. That is the whole point of the field: null is not zero.
- Tier 1 source, score 87 against a threshold of 60 → `CREATE_NEWS`.
- The article was written and published as `de-menden-sauerlandstrasse` in German
  and English — section 67, native language plus English, not all five.
- The next run read `data/news.json`, found an article citing the same source,
  and switched its recommendation to `UPDATE_EXISTING_ARTICLE`.

`published` is derived from `data/news.json` on every run rather than stored.
A hand-set flag survives the article being deleted, and then the engine stops
recommending something it should.

A named municipal officer's direct line and e-mail are on the source page. They
are not in this repository and not on the dashboard. Section 64 asks for those
columns; the column renders a link to the page that carries them, because this
repository is public and a person's contact details do not belong in it.

---

## 6. `/intelligence/`

Sections 62, 63 and 64 as one generated page: thirteen dashboard tiles, the
news-candidate table with authority tier and both scores, the business
opportunities table, the last run's counters, its errors and the review queue.

It is `noindex,nofollow`, in no sitemap, in no navigation and linked from nowhere.
It is **unlisted, not secret** — anyone who types the URL sees it. So it shows
only what a competitor could read from the same official sources anyway.

The first draft of that page used `.card`, `.grid-4` and `.stat`. None of the
three exists in `assets/css/styles.css`. Every command exited 0 and the page
would have shipped as an unstyled column. It was caught by loading the page in a
browser and reading the computed styles, which is rule 4 of this project and has
now caught something every single time it has been applied. The second fault was
the same kind: the page was excluded from the shell pass, so it sat directly on
the site's dark photographic body background with dark text on it, unreadable.

---

## 7. The nineteen tests

`node tools/test-market-intelligence.mjs` — 19/19 passing. They run against the
real engine and the real repository, with the store and inbox pointed at scratch
files so a test never mutates what it protects.

Four of them — hreflang, canonical, sitemap, structured data — are already owned
by `validate-seo-v7.mjs` across all 15,000 pages. Rather than write a second,
weaker copy of that, they assert the one thing the validator cannot know: what
this work added. The new article has its de/en hreflang pair and valid JSON-LD;
`/intelligence/` has no alternates, a self-canonical, and appears in no sitemap.

---

## 8. What is not built, and why

- **A live admin panel with authentication.** No server. See §1.
- **A search-provider adapter.** Writing one against a specific vendor without the
  key would be untested code that looks finished. The abstraction is there; adding
  a provider is one function and one environment variable, and nothing else in the
  engine changes.
- **Google Search Console integration.** Sections 37, 38 and 59. The engine reads
  `data/gsc-export.json` if someone puts one there and reports "not connected"
  when they have not. Live OAuth needs credentials that cannot live here.
- **Automatic publication.** Section 65's switches exist and default to false. The
  workflow does not set them. This is a deliberate choice, not an omission.

---

## 9. What the business has to decide

1. **Whether to fund a search provider.** Without one the daily scan is a
   scheduled `NO_PUBLISH` and every finding has to be located by a person and put
   in the inbox. The engine works either way; only the volume changes.
2. **Whether to connect Search Console.** Sections 37 and 38 are the highest-value
   unbuilt part: the site now has impressions to learn from, and nothing is
   reading them.
3. **Whether `/intelligence/` should stay reachable at all.** Unlisted is not
   private. If it should be private, it needs a host that can authenticate, which
   Netlify's free tier does not.
