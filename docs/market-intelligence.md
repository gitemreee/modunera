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

`node tools/test-market-intelligence.mjs` — 26/26 passing: the nineteen the
brief names, three for the provider adapter against a local stub, two for the
Search Console reader, and two for the publication gates the first live scan
exposed. They run against the
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
- **A second search provider.** Brave is implemented and running (§2a). Adding
  another vendor is one object in `ADAPTERS` and one line; nothing else changes.
- **A *live* Search Console connection.** OAuth or a service-account key cannot
  live in a repository. What is built instead is section 8a below, and it needs
  no key at all.
- **Automatic publication.** Section 65's switches exist and default to false. The
  workflow does not set them. This is a deliberate choice, not an omission.

---

## 2a. The search provider: Brave

**Plan: "Search".** $5 per 1,000 requests, with $5 of credit applied monthly. The
scan makes **28 requests a day**, about 850 a month, so the monthly credit covers
essentially the whole bill. The **"Answers"** plan is deliberately not used: it
returns a written summary, and a summary is not a source you can open and read.

Twenty-eight, not thirty-three. Switzerland's five queries are three German and
two French, and the loop used to run every query in both languages — ten requests
to learn what five could, two of them French text submitted as German. Queries can
now name their own language.

**The key is never in the repository.** `MODUNERA_SEARCH_KEY` comes from the
environment; in CI it is a GitHub Actions repository secret. Section 74.

```
Settings → Secrets and variables → Actions → New repository secret
  MODUNERA_SEARCH_PROVIDER = brave
  MODUNERA_SEARCH_KEY      = <the key>
```

`.github/workflows/market-intelligence.yml` already reads both. Nothing else has
to change; the run stops saying `not-configured` the next morning.

### What the first live scan changed

Running it against the real API immediately found four things that a stub never
would have. All four are fixed, and each has a test.

1. **215 signals, 208 of them junk.** Classified ads, auction listings, holiday-park
   directories. The store would have grown by roughly two hundred rows a day and
   buried the handful worth reading. Rejections are now counted, not kept — with
   their reasons: today, `268 × not an authority (tier 3)`, `2 × blocked as a
   primary source`, `2 × below the score threshold`.
2. **It wanted to publish a newspaper.** NDR reporting that a Schleswig-Holstein
   Baugebiet had drawn national interest scored 78 and came back `CREATE_NEWS`.
   Section 14 says official source first: a media report is a *lead*. Tier 2 above
   the threshold now gets `FIND_OFFICIAL_SOURCE` and can never be published as-is.
3. **It wanted to publish a tender index page.** `kreis-eic.de`'s
   "Ausschreibungen und Bekanntmachungen" listing is a genuine tier 1 source and
   scored 76 — but it is an index, not a project. The deeper problem: a search
   result is a title, a URL and a snippet, which is not enough to write anything
   from. So **nothing the scan finds is published directly.** At best it becomes
   `VERIFY_ON_SOURCE`: a person opens the page and, if there is a real project on
   it, writes it into `data/verified-signals-inbox.json`. Only what comes through
   that inbox — that a person has actually read — can reach `CREATE_NEWS`.
4. **One story, two newspapers.** The same Niedersachsen article came back from
   `az-online.de` and `leinetal24.de` under an identical headline. Deduplication
   matched on place and title, and a search result carries no place, so both were
   stored. It now also matches on the normalised title within a market.

A fifth was found by the test suite rather than the API: a rejected key was being
retried three times per query — 84 pointless requests against a metered service.
401 and 403 are not transient, so they now stop the scan once and say why.

### What it actually returns

28 queries, 278 results read, 272 rejected with reasons, **4 new signals**, in 23
seconds. Today's:

| Score | Tier | Action | What it is |
|---|---|---|---|
| 87 | 1 | `CREATE_NEWS` | Menden (Sauerland) — read on the source, published |
| 78 | 2 | `FIND_OFFICIAL_SOURCE` | NDR: national interest in a northern Baugebiet |
| 76 | 1 | `VERIFY_ON_SOURCE` | Kreis Eichsfeld tender and notices index |
| 65 | 2 | `FIND_OFFICIAL_SOURCE` | Denmark: a summer-house area moving after seven years |
| 64 | 2 | `FIND_OFFICIAL_SOURCE` | Hannover firm directory — a competitor listing |

Four leads a day, each naming the page to open. That is the shape of the thing:
not a post a day, a short list a person can act on.

---

## 8a. Search Console, sections 37 and 38

Built, and it costs nothing. The engine reads an export rather than logging in:

- `data/gsc/*.csv` — the files the Search Console **Export** button produces,
  unzipped into that folder. Headings are recognised in English and in Turkish,
  because the export carries the interface language of whoever downloaded it, and
  so are comma decimals (`9,4`), percent signs, and queries containing a comma
  inside quotes. A heading that is neither language is reported by name in the
  daily run instead of being misread as a different column.
- `data/gsc-export.json` — the API shape, if a connection is ever added.

It sorts what it finds into section 38's four buckets, biggest missed audience
first — impressions you are not converting:

| Bucket | What to do |
|---|---|
| `HIGH_IMPRESSION_LOW_CTR` | The page ranks and nobody clicks. Rewrite title and description. |
| `NEAR_PAGE_ONE` | Position 8–20. Strengthen the page that ranks; do not create a second one. |
| `MISSING_CONTENT` | Impressions with no page that answers them. A new page is worth considering. |
| `COUNTRY_GROWTH` | Clicks from a market rose **against the previous export**. |

Two things it deliberately does not do. **Country growth needs two exports**; on
the first one it is absent, because "rising" is a comparison and a single file
has nothing to compare with — it is not manufactured out of one number. And a
**country row never lands in a page bucket**: the first test run reported
"NEAR_PAGE_ONE: Almanya", which is not an action anyone can take, so country rows
now feed only the growth comparison.

**A warning that belongs to the owner, not to the code.** Whatever goes into
`data/gsc/` is in the repository, and the derived opportunities go into
`data/market-signals.json`. A list of the queries a site ranks for and nearly
ranks for is precisely what a competitor would like. So `/intelligence/` shows
only the count per bucket; the queries stay in
`build-report-market-intelligence.txt`. Setting `gsc.render_on_dashboard` to
`true` puts them on the page, and the default is `false` because that page is
unlisted rather than secret. `data/gsc/README.md` says all of this next to the
folder where the decision is actually made.

---

## 9. What the business has to decide

1. **Add the Brave key as a repository secret** (§2a). The adapter is written and
   has been run against the live API; the scheduled job cannot see the key until
   it is a secret, and no key may be committed.
2. **Whether the Search Console export may live in this repository.** The reader
   is built and needs no credentials; it needs the file. If the repository is
   public, putting the export in it publishes the query list. That is a decision
   about the business's own data, not a setting. See §8a.
3. **Whether `/intelligence/` should stay reachable at all.** Unlisted is not
   private. If it should be private, it needs a host that can authenticate, which
   Netlify's free tier does not.
