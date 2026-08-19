#!/usr/bin/env node
/* The daily European market scan.

   WHAT IT IS

   Five markets, scanned in their own languages, for the developments that
   actually turn into an enquiry: a municipality opening a tiny-house site, a
   participation procedure on a Bebauungsplan, a holiday park extension, a
   modular-housing tender. Candidates are scored, deduplicated against what is
   already published, checked for cannibalisation, and turned into ONE decision
   per day — most often NO_PUBLISH.

   WHAT IT IS NOT

   It is not a blog generator. The goal is not a post a day; it is to find a real
   opportunity before a competitor does, verify it against the authority that
   issued it, and either strengthen a page that already exists or record a lead.
   Creating a URL is the last option in the decision order, not the first.

   THE THREE THINGS THAT MAKE IT SAFE

   1. It cannot invent. Every field on a signal comes from a fetched source, and
      a signal without a source URL is discarded rather than written. There is no
      code path that produces a municipality, a status, a date or a contact that
      was not read from a page.
   2. It cannot grow the location corpus. 14,641 programmatic location pages
      already exist and are deliberately held out of the sitemap. The decision
      engine has no CREATE_LOCATION action at all — not a guard that could be
      switched off, an action that does not exist.
   3. It publishes nothing by itself. AUTO_PUBLISH_* default to false. The run
      writes candidates, scores and a report; a person decides.

   WHEN NO SEARCH PROVIDER IS CONFIGURED

   There is no API key in this repository and there must not be one. Without
   MODUNERA_SEARCH_PROVIDER and its key in the environment the scan runs, reports
   `provider: "not-configured"`, decides NO_PUBLISH and exits 0. It does not fail
   the build and it does not fabricate a scan it did not perform.

   Usage:
     node tools/market-intelligence.mjs
     node tools/market-intelligence.mjs --report        # print the daily report
     node tools/market-intelligence.mjs --review        # only re-check due items
*/
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CONFIG = JSON.parse(await readFile(join(ROOT, "data/market-scan-config.json"), "utf8"));
/* Overridable so tools/test-market-intelligence.mjs can run the real engine
   against a scratch store and a scratch inbox instead of the live ones. A test
   that mutates the file it is meant to protect is not a test. */
const STORE_PATH = process.env.MODUNERA_MI_STORE ?? join(ROOT, "data/market-signals.json");
const REPORT_PATH = process.env.MODUNERA_MI_REPORT ?? join(ROOT, "build-report-market-intelligence.txt");
const TODAY = (process.env.MODUNERA_TODAY ?? new Date().toISOString().slice(0, 10));

const args = process.argv.slice(2);
const REPORT_ONLY = args.includes("--report");
const REVIEW_ONLY = args.includes("--review");

/* --- the store ------------------------------------------------------------- */

const emptyStore = {
  _comment: [
    "Signals, business opportunities and tenders found by tools/market-intelligence.mjs.",
    "",
    "Every entry here was read from the source URL it names. Nothing in this file",
    "is generated, inferred or filled in to make a record look complete: a field",
    "that the source did not state is null, and it stays null.",
    "",
    "A signal is a candidate, not a published page. Publication is a separate,",
    "deliberate step — see the decision on each run in `runs`.",
  ],
  updated_at: null,
  runs: [],
  signals: [],
  opportunities: [],
  tenders: [],
};
const store = existsSync(STORE_PATH)
  ? JSON.parse(await readFile(STORE_PATH, "utf8"))
  : structuredClone(emptyStore);

/* --- the verified inbox ----------------------------------------------------

   A finding a person located and read on the source page is a real finding even
   when no search provider is configured. It enters through
   data/verified-signals-inbox.json and then goes through the same scorer,
   deduplication, cannibalisation check and decision engine as an automated
   candidate. There is no shortcut past the gate: an inbox entry with no
   sourceUrl is rejected exactly like a scraped one with no sourceUrl. */
const INBOX_PATH = process.env.MODUNERA_MI_INBOX ?? join(ROOT, "data/verified-signals-inbox.json");
async function loadInbox() {
  if (!existsSync(INBOX_PATH)) return [];
  const raw = JSON.parse(await readFile(INBOX_PATH, "utf8"));
  return raw.candidates ?? [];
}

/* --- providers ------------------------------------------------------------- */

/* The abstraction the master prompt asks for. Only one implementation exists
   today and it is "not configured", which is the truthful state of this
   environment. Adding a provider means adding a function here and setting
   MODUNERA_SEARCH_PROVIDER; nothing else in the engine changes. */
const SearchProvider = {
  name: process.env.MODUNERA_SEARCH_PROVIDER ?? "not-configured",
  configured() {
    return this.name !== "not-configured" && Boolean(process.env.MODUNERA_SEARCH_KEY);
  },
  async search(_query, _lang) {
    if (!this.configured()) return { ok: false, reason: "provider not configured", results: [] };
    // A real provider returns [{title, url, snippet, publishedAt, publisher}].
    // Deliberately not implemented against a specific vendor: the key is not in
    // this repository and inventing results would defeat the entire engine.
    return { ok: false, reason: `provider "${this.name}" has no adapter in this build`, results: [] };
  },
};

/* Search Console, sections 37 and 38.

   There is no live connection and there cannot be one from a public repository:
   an OAuth refresh token or a service-account key committed here is a credential
   published to the world. So the engine reads an export instead, which costs
   nothing and needs no key:

     data/gsc-export.json     the API shape, {rows:[{keys:[...], clicks, ...}]}
     data/gsc/*.csv           the files the Search Console UI's own Export button
                              produces, unzipped into that folder

   Column headings come out in the interface language of whoever downloaded the
   file, so both English and Turkish headings are recognised. A heading that is
   neither is reported by name rather than silently skipped — a column read as
   the wrong field is worse than a column not read at all. */

const GSC = CONFIG.gsc ?? {};

const GSC_FIELDS = {
  query:       ["query", "queries", "top queries", "sorgu", "sorgular", "en cok kullanilan sorgular", "en çok kullanılan sorgular"],
  page:        ["page", "pages", "top pages", "sayfa", "sayfalar", "en cok kullanilan sayfalar", "en çok kullanılan sayfalar"],
  country:     ["country", "countries", "ulke", "ülke", "ulkeler", "ülkeler"],
  device:      ["device", "cihaz"],
  date:        ["date", "tarih"],
  clicks:      ["clicks", "tiklamalar", "tıklamalar"],
  impressions: ["impressions", "gosterimler", "gösterimler"],
  ctr:         ["ctr", "average ctr", "ortalama ctr"],
  position:    ["position", "average position", "ortalama konum", "konum"],
};

const foldHeading = (h) => String(h ?? "")
  .replace(/^\uFEFF/, "").trim().toLowerCase()
  .replaceAll("ı", "i").replaceAll("ö", "o").replaceAll("ü", "u")
  .replaceAll("ş", "s").replaceAll("ç", "c").replaceAll("ğ", "g");

function fieldFor(heading) {
  const h = foldHeading(heading);
  for (const [field, names] of Object.entries(GSC_FIELDS)) {
    if (names.some((n) => foldHeading(n) === h)) return field;
  }
  return null;
}

/* A percentage in an export is "3,2%" or "3.2%" depending on the locale, and a
   position is "12,4" or "12.4" for the same reason. Both have to survive. */
function num(value) {
  if (value === null || value === undefined) return null;
  let t = String(value).trim();
  if (!t) return null;
  const pct = t.endsWith("%");
  t = t.replace("%", "").trim();
  if (/,\d{1,2}$/.test(t) && !/\.\d/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/,/g, "");
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return pct ? n / 100 : n;
}

/* A CSV line, respecting quotes. Query strings contain commas. */
function csvLine(line) {
  const out = []; let cur = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const SearchConsoleProvider = {
  jsonPath: process.env.MODUNERA_MI_GSC_DIR ? join(process.env.MODUNERA_MI_GSC_DIR, "gsc-export.json") : join(ROOT, GSC.export_file ?? "data/gsc-export.json"),
  dirs: process.env.MODUNERA_MI_GSC_DIR ? [process.env.MODUNERA_MI_GSC_DIR] : (GSC.search_dirs ?? ["data/gsc"]).map((d) => join(ROOT, d)),
  files() {
    const found = [];
    if (existsSync(this.jsonPath)) found.push(this.jsonPath);
    for (const dir of this.dirs) {
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) if (/\.csv$/i.test(f)) found.push(join(dir, f));
    }
    return found;
  },
  available() { return this.files().length > 0; },
  async load() {
    const files = this.files();
    if (!files.length) {
      return { ok: false, reason: `no export found (looked for ${GSC.export_file ?? "data/gsc-export.json"} and ${(GSC.search_dirs ?? []).join(", ")}/*.csv)`, rows: [], warnings: [] };
    }
    const rows = [];
    const warnings = [];
    for (const file of files) {
      const text = await readFile(file, "utf8");
      const label = file.slice(ROOT.length);
      if (file.endsWith(".json")) {
        const raw = JSON.parse(text);
        for (const r of raw.rows ?? []) {
          rows.push({
            source: label,
            query: r.query ?? r.keys?.[0] ?? null,
            page: r.page ?? null, country: r.country ?? null, device: r.device ?? null,
            clicks: num(r.clicks), impressions: num(r.impressions),
            ctr: num(r.ctr), position: num(r.position),
          });
        }
        continue;
      }
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { warnings.push(`${label}: no data rows`); continue; }
      const headings = csvLine(lines[0]);
      const fields = headings.map(fieldFor);
      const unknown = headings.filter((h, i) => !fields[i] && h.trim());
      if (unknown.length) warnings.push(`${label}: column(s) not recognised and ignored: ${unknown.join(", ")}`);
      if (!fields.includes("impressions")) { warnings.push(`${label}: no impressions column, skipped`); continue; }
      for (const line of lines.slice(1)) {
        const cells = csvLine(line);
        const row = { source: label, query: null, page: null, country: null, device: null, clicks: null, impressions: null, ctr: null, position: null };
        fields.forEach((f, i) => {
          if (!f) return;
          row[f] = ["clicks", "impressions", "ctr", "position"].includes(f) ? num(cells[i]) : (cells[i] ?? null);
        });
        rows.push(row);
      }
    }
    return { ok: true, rows, warnings, files: files.map((f) => f.slice(ROOT.length)) };
  },
};

/* Section 38. Four buckets, each with the action it implies. A row lands in the
   first bucket it qualifies for, so one row never inflates the count four times. */
function gscOpportunities(rows) {
  const t = GSC;
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    const imp = r.impressions ?? 0;
    if (imp < (t.min_impressions ?? 50)) continue;
    const pos = r.position;
    const ctr = r.ctr ?? (imp ? (r.clicks ?? 0) / imp : 0);
    /* A country row has no landing page to strengthen and no title to rewrite,
       so it must not fall into the query and page buckets. The first test run
       reported "NEAR_PAGE_ONE: Almanya", which is not an action anyone can take.
       Country rows go to the growth comparison below and nowhere else. */
    const subject = r.query ?? r.page ?? null;
    if (!subject) continue;
    let kind = null;
    if (t.high_impression_low_ctr && imp >= t.high_impression_low_ctr.min_impressions &&
        pos !== null && pos <= t.high_impression_low_ctr.max_position && ctr <= t.high_impression_low_ctr.max_ctr) {
      kind = "HIGH_IMPRESSION_LOW_CTR";
    } else if (t.near_page_one && pos !== null &&
        pos >= t.near_page_one.min_position && pos <= t.near_page_one.max_position) {
      kind = "NEAR_PAGE_ONE";
    } else if (t.missing_content && imp >= t.missing_content.min_impressions &&
        pos !== null && pos > t.missing_content.min_position) {
      kind = "MISSING_CONTENT";
    }
    /* COUNTRY_GROWTH is deliberately not decided here. "Search from a country is
       rising" is a comparison against an earlier export, and a single file has
       nothing to compare with. It is computed below, from the baseline the last
       run stored, and is simply absent on the first export rather than being
       faked out of one number. */
    if (!kind) continue;
    const key = `${kind}|${subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind, subject, page: r.page ?? null, country: r.country ?? null,
      clicks: r.clicks ?? 0, impressions: imp,
      ctr: ctr === null ? null : Math.round(ctr * 10000) / 10000,
      position: pos === null ? null : Math.round(pos * 10) / 10,
      action: (t[kind.toLowerCase()] ?? {}).action ?? null,
      source: r.source,
    });
  }
  /* Biggest missed audience first: impressions you are not converting. */
  return out.sort((a, b) => (b.impressions - b.clicks) - (a.impressions - a.clicks));
}

/* Country growth, against the previous export rather than against a threshold. */
function countryGrowth(rows, baseline) {
  const now = {};
  for (const r of rows) {
    if (!r.country) continue;
    now[r.country] = (now[r.country] ?? 0) + (r.clicks ?? 0);
  }
  const min = GSC.country_growth?.min_clicks ?? 5;
  const found = [];
  for (const [country, clicks] of Object.entries(now)) {
    const before = baseline?.[country];
    if (before === undefined) continue;
    if (clicks <= before || clicks < min) continue;
    found.push({
      kind: "COUNTRY_GROWTH", subject: country, page: null, country,
      clicks, impressions: 0, ctr: null, position: null,
      was: before, growth: clicks - before,
      action: GSC.country_growth?.action ?? null, source: "baseline comparison",
    });
  }
  return { opportunities: found.sort((a, b) => b.growth - a.growth), baseline: now };
}

/* --- what is already published, so the engine can prefer updating ---------- */

async function existingContentIndex() {
  const news = JSON.parse(await readFile(join(ROOT, "data/news.json"), "utf8"));
  const index = news.items.map((i) => ({
    kind: "news",
    id: i.id,
    country: i.country,
    place: i.place,
    sourceUrl: i.sourceUrl,
    status: i.status,
    nextReviewAt: i.nextReviewAt,
    title: i.de?.title ?? i.en?.title ?? i.id,
    /* The URLs build-news-v7.mjs will emit for this item, composed the same way
       it composes them, so `published` below is a fact about the site and not a
       flag somebody remembered to set. */
    urls: Object.keys(i.slug ?? {})
      .filter((lang) => news.hubs[lang])
      .map((lang) => `/${news.hubs[lang].path}/${i.slug[lang]}/`),
  }));
  return index;
}

/* A signal is published when a news item cites the same source. Deriving it
   beats storing it: a hand-edited `published: true` survives the article being
   deleted, and then the engine stops recommending something it should. */
function reconcilePublished(index) {
  let n = 0;
  for (const sig of store.signals) {
    const article = index.find((i) => i.sourceUrl === sig.sourceUrl);
    const published = Boolean(article);
    const urls = article ? article.urls : [];
    if (sig.published !== published || JSON.stringify(sig.publishedUrls) !== JSON.stringify(urls)) {
      sig.published = published;
      sig.publishedUrls = urls;
      sig.publishedAs = article ? article.id : null;
    }
    if (published) n += 1;
  }
  return n;
}

/* --- scoring --------------------------------------------------------------- */

const hostOf = (url) => { try { return new URL(url).hostname; } catch { return ""; } };

function authorityTier(url) {
  const host = hostOf(url);
  const full = `${host}${(() => { try { return new URL(url).pathname; } catch { return ""; } })()}`;
  for (const tier of CONFIG.source_authority) {
    if (tier.match.some((m) => new RegExp(m, "i").test(full))) return tier;
  }
  return CONFIG.source_authority.at(-1);
}

function blockedAsPrimary(url) {
  return CONFIG.blocked_as_primary_source.match.some((m) => new RegExp(m, "i").test(url));
}

function freshnessPoints(publishedAt) {
  if (!publishedAt) return 4;
  const days = (Date.parse(TODAY) - Date.parse(publishedAt)) / 86400000;
  const [d1, d3, d7, d30] = CONFIG.run.freshness_windows_days;
  if (days <= d1) return 15;
  if (days <= d3) return 12;
  if (days <= d7) return 9;
  if (days <= d30) return 6;
  return 2;
}

function commercialPoints(text) {
  const t = (text ?? "").toLowerCase();
  if (CONFIG.commercial_signals.high.some((k) => t.includes(k))) return 20;
  if (CONFIG.commercial_signals.medium.some((k) => t.includes(k))) return 12;
  return 4;
}

function scoreSignal(sig) {
  const w = CONFIG.scoring.weights;
  const tier = authorityTier(sig.sourceUrl);
  const text = `${sig.title} ${sig.summary ?? ""}`;
  const parts = {
    commercial_relevance: commercialPoints(text),
    target_market_relevance: CONFIG.markets.some((m) => m.code === sig.country) ? w.target_market_relevance : 0,
    official_source_authority: tier.points,
    freshness: freshnessPoints(sig.sourceDate),
    search_opportunity: sig.place ? w.search_opportunity : Math.round(w.search_opportunity / 2),
    buyer_usefulness: /genehmig|vergunning|tilladelse|autorisation|bewilligung|kavel|grundstück|stellplatz/i.test(text)
      ? w.buyer_usefulness : Math.round(w.buyer_usefulness / 2),
    uniqueness: w.uniqueness,
    product_relevance: /tiny|modul|container|bungalow|glamping|ferien|vakantie|feriepark/i.test(text) ? w.product_relevance : 0,
    internal_link_opportunity: sig.country ? w.internal_link_opportunity : 0,
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { total, parts, tier: tier.tier };
}

/* --- deduplication, section 26 --------------------------------------------- */

const normalise = (s) => (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function findExistingSignal(candidate) {
  return store.signals.find((s) =>
    s.sourceUrl === candidate.sourceUrl ||
    (s.country === candidate.country &&
     normalise(s.place) &&
     normalise(s.place) === normalise(candidate.place) &&
     normalise(s.title).slice(0, 40) === normalise(candidate.title).slice(0, 40)));
}

/* --- cannibalisation, section 39 ------------------------------------------- */

function titleOverlap(a, b) {
  const A = new Set(normalise(a).split(" ").filter((w) => w.length > 3));
  const B = new Set(normalise(b).split(" ").filter((w) => w.length > 3));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter += 1;
  return inter / Math.min(A.size, B.size);
}

/* The place gate exists because the first live run tripped over it. A verified
   Menden (Sauerland) participation procedure was routed to UPDATE_EXISTING_ARTICLE
   against an existing item about Lüptitz — two different municipalities, on the
   strength of the words "tiny", "house" and "Siedlung" appearing in both titles.
   That is not cannibalisation. Two place-specific pages compete only when they
   are about the same place: a buyer searching for Menden never sees the Lüptitz
   page as the same result. So when both sides name a place and the places differ,
   the pages cannot cannibalise each other and the check does not fire. When
   either side has no place — a country guide, an evergreen article — the title
   overlap still decides, which is the case the threshold was written for. */
function cannibalises(candidate, index) {
  const candidatePlace = normalise(candidate.place);
  for (const page of index) {
    const pagePlace = normalise(page.place);
    if (candidatePlace && pagePlace && candidatePlace !== pagePlace) continue;
    const overlap = titleOverlap(candidate.title, page.title);
    if (overlap >= CONFIG.decision.cannibalisation_threshold) return page;
  }
  return null;
}

/* --- the decision engine, section 18 --------------------------------------- */

function decide({ scored, candidate, existing, collision }) {
  /* "Already in the store" and "already published" are different states and were
     briefly conflated here. A signal seen yesterday and not yet acted on is still
     waiting for a person; saying it is published would quietly retire it. */
  if (existing?.published) return { action: "UPDATE_EXISTING_ARTICLE", target: existing.id, why: "the same project is already published; a new URL would split it in two" };
  if (existing) return { action: existing.recommendedAction ?? "NO_PUBLISH", target: existing.id, why: `already a candidate since ${existing.firstSeenAt}, re-checked today, still waiting for a decision` };
  if (collision) return { action: "UPDATE_EXISTING_ARTICLE", target: collision.id, why: `title overlaps "${collision.title}" above the cannibalisation threshold` };
  if (blockedAsPrimary(candidate.sourceUrl)) return { action: "NO_PUBLISH", why: "only a non-official source found; an official one has to be located first" };
  if (scored.tier > 2) return { action: "NO_PUBLISH", why: "source is not an authority or reputable publication" };
  if (scored.total < CONFIG.scoring.publish_threshold) return { action: "NO_PUBLISH", why: `score ${scored.total} is below the ${CONFIG.scoring.publish_threshold} threshold` };
  return { action: "CREATE_NEWS", why: `score ${scored.total}, tier ${scored.tier} source, no existing page covers it` };
}

/* --- items due for re-check, sections 24 and 61 ---------------------------- */

function dueForReview(index) {
  return index.filter((i) => i.nextReviewAt && i.nextReviewAt <= TODAY);
}

/* --- run ------------------------------------------------------------------- */

/* Numbered within the day, not across the store's history: run-2026-08-19-002
   on the first run of a new day reads as "the second run today" and is wrong. */
const runId = `run-${TODAY}-${String(store.runs.filter((r) => r.date === TODAY).length + 1).padStart(3, "0")}`;
const run = {
  runId,
  date: TODAY,
  startedAt: new Date().toISOString(),
  provider: SearchProvider.name,
  providerConfigured: SearchProvider.configured(),
  gsc: "not connected",
  markets: {},
  /* Section 72. Every one of these is a count of something that happened, not a
     field that gets a plausible number when nothing did. */
  queriesPlanned: 0,
  sourcesChecked: 0,
  sourcesAccepted: 0,
  sourcesRejected: 0,
  candidates: 0,
  verifiedInboxCandidates: 0,
  projectsDiscovered: 0,
  existingProjectsUpdated: 0,
  tenderOpportunities: 0,
  businessLeads: 0,
  gscOpportunities: 0,
  contentGenerated: 0,
  contentUpdated: 0,
  decision: "NO_PUBLISH",
  decisionWhy: "",
  dueForReview: [],
  errors: [],
};

const index = await existingContentIndex();
run.signalsPublished = reconcilePublished(index);

/* Sections 37 and 38. Runs whether or not a search provider is configured: the
   two are independent, and the export is the part that costs nothing. */
const gsc = await SearchConsoleProvider.load();
let gscFound = [];
if (gsc.ok) {
  gscFound = gscOpportunities(gsc.rows);
  const growth = countryGrowth(gsc.rows, store.gscBaseline);
  gscFound = [...gscFound, ...growth.opportunities];
  store.gscBaseline = growth.baseline;
  store.gscOpportunities = gscFound;
  run.gsc = `${gsc.rows.length} row(s) from ${gsc.files.length} file(s)`;
  run.gscRows = gsc.rows.length;
  run.gscOpportunities = gscFound.length;
  for (const w of gsc.warnings ?? []) run.errors.push(`GSC: ${w}`);
} else {
  run.gsc = "not connected";
  run.gscRows = 0;
  run.gscOpportunities = 0;
  store.gscOpportunities = store.gscOpportunities ?? [];
}
run.dueForReview = dueForReview(index).map((i) => ({ id: i.id, status: i.status, nextReviewAt: i.nextReviewAt }));

if (REVIEW_ONLY) {
  run.decision = "NO_PUBLISH";
  run.decisionWhy = `review pass only; ${run.dueForReview.length} item(s) due`;
} else {
  const decisions = [];

  /* One place where a candidate becomes a decision, so an inbox entry and a
     scraped result are judged by identical code. */
  function consider(candidate, origin) {
    if (!candidate.sourceUrl || !candidate.title) return null;
    const scored = scoreSignal(candidate);
    const existing = findExistingSignal(candidate);
    const collision = cannibalises(candidate, index);
    const d = decide({ scored, candidate, existing, collision });
    const entry = { candidate, scored, d, origin };
    decisions.push(entry);
    if (d.action.startsWith("UPDATE")) run.existingProjectsUpdated += 1;
    else if (!existing) run.projectsDiscovered += 1;
    return entry;
  }

  for (const market of CONFIG.markets) {
    const m = { queries: market.queries.length, checked: 0, accepted: 0, rejected: 0, signals: 0, error: null };
    run.queriesPlanned += market.queries.length;
    for (const lang of market.languages) {
      for (const query of market.queries) {
        let attempt = 0;
        let res = null;
        while (attempt < CONFIG.run.max_retries_per_market) {
          attempt += 1;
          try { res = await SearchProvider.search(query, lang); break; }
          catch (e) { if (attempt >= CONFIG.run.max_retries_per_market) m.error = String(e.message ?? e); }
        }
        if (!res || !res.ok) { if (!m.error) m.error = res?.reason ?? "no result"; continue; }
        for (const r of res.results) {
          m.checked += 1;
          run.sourcesChecked += 1;
          if (!r.url || !r.title) { m.rejected += 1; run.sourcesRejected += 1; continue; }
          const candidate = {
            country: market.code, place: r.place ?? null, title: r.title,
            summary: r.snippet ?? null, sourceUrl: r.url, publisher: r.publisher ?? hostOf(r.url),
            sourceDate: r.publishedAt ?? null, status: "UNKNOWN",
          };
          if (!consider(candidate, "scan")) { m.rejected += 1; run.sourcesRejected += 1; continue; }
          m.accepted += 1; run.sourcesAccepted += 1; m.signals += 1; run.candidates += 1;
        }
      }
    }
    run.markets[market.code] = m;
    if (m.error) run.errors.push(`${market.code}: ${m.error}`);
  }

  /* The verified inbox, after the scan, so a hand-read finding never masks a
     provider failure: the market rows above still say the scan found nothing. */
  for (const c of await loadInbox()) {
    const market = CONFIG.markets.find((mm) => mm.code === c.country);
    if (!market) { run.errors.push(`inbox: ${c.title} names country ${c.country}, which is not a target market`); continue; }
    const entry = consider(c, "verified-inbox");
    if (!entry) { run.errors.push(`inbox: ${c.title ?? "(untitled)"} has no source URL and was rejected`); continue; }
    run.verifiedInboxCandidates += 1;
    run.candidates += 1;
    const row = run.markets[c.country];
    if (row) row.signals += 1;
  }

  const publishable = decisions
    .filter((x) => x.d.action !== "NO_PUBLISH")
    .sort((a, b) => b.scored.total - a.scored.total);

  /* Every considered candidate is recorded, because a signal is a candidate and
     not a published page. Only ONE of them becomes today's decision. Section 17:
     the engine is not obliged to produce something every day. */
  const reviewDays = CONFIG.status_taxonomy.review_days;
  const addDays = (iso, n) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);

  for (const { candidate, scored, d, origin } of decisions) {
    const existing = findExistingSignal(candidate);
    if (existing) { existing.lastCheckedAt = TODAY; continue; }
    const status = CONFIG.status_taxonomy.values.includes(candidate.status) ? candidate.status : "UNKNOWN";
    /* Section 71, MarketSignal. A field the source did not state is null. */
    store.signals.push({
      id: `${candidate.country.toLowerCase()}-${normalise(candidate.place ?? candidate.title).split(" ").slice(0, 4).join("-")}`,
      country: candidate.country,
      region: candidate.region ?? null,
      municipality: candidate.place ?? null,
      type: candidate.type ?? null,
      title: candidate.title,
      summary: candidate.summary ?? null,
      status,
      statusEvidence: candidate.statusEvidence ?? null,
      units: candidate.units ?? null,
      authority: candidate.authority ?? null,
      authorityAddress: candidate.authorityAddress ?? null,
      publisher: candidate.publisher ?? hostOf(candidate.sourceUrl),
      sourceUrl: candidate.sourceUrl,
      sourceAuthority: scored.tier,
      corroboratingSources: candidate.corroboratingSources ?? [],
      contactOnSource: candidate.contactOnSource ?? null,
      notStatedBySource: candidate.notStatedBySource ?? [],
      publishedAt: candidate.sourceDate ?? null,
      firstSeenAt: TODAY,
      lastCheckedAt: TODAY,
      nextReviewAt: addDays(TODAY, reviewDays[status] ?? 30),
      seoScore: scored.parts.search_opportunity + scored.parts.uniqueness + scored.parts.internal_link_opportunity,
      commercialScore: scored.parts.commercial_relevance + scored.parts.buyer_usefulness,
      score: scored.total,
      scoreParts: scored.parts,
      recommendedAction: d.action,
      recommendedWhy: d.why,
      origin,
      published: false,
      publishedUrls: [],
    });
  }

  if (!publishable.length) {
    run.decision = "NO_PUBLISH";
    run.decisionWhy = SearchProvider.configured()
      ? "nothing found today that clears the threshold from an authoritative source"
      : (run.verifiedInboxCandidates
          ? "no search provider configured; the hand-verified candidates that were checked did not clear the threshold"
          : "no search provider configured, so no scan was performed — nothing was invented to fill the gap");
  } else {
    const top = publishable[0];
    run.decision = top.d.action;
    run.decisionWhy = `${top.candidate.title} (${top.candidate.country}) — ${top.d.why}`;
    run.decisionSignal = top.candidate.sourceUrl;
    /* Section 65. Publication is a person's act. These default to false and the
       workflow does not set them; a run that decides CREATE_NEWS writes the
       candidate and the reason, and stops there. */
    run.autoPublish = {
      news: process.env.AUTO_PUBLISH_NEWS === "true",
      blog: process.env.AUTO_PUBLISH_BLOG === "true",
      guides: process.env.AUTO_UPDATE_GUIDES === "true",
    };
    run.awaitingHumanDecision = !run.autoPublish.news;
  }
}

run.finishedAt = new Date().toISOString();

/* Section 75, "duplicate run". Running the engine twice on the same day is not
   two days of intelligence, and this repository's whole build discipline rests on
   a second run changing nothing. So a run replaces the day's existing record
   rather than appending to it — and if everything except the clock is identical,
   the existing record is left exactly as it was, so the file does not churn. */
const sameDay = store.runs.findIndex((r) => r.date === TODAY);
const withoutClock = (r) => { const { startedAt, finishedAt, runId, ...rest } = r; return JSON.stringify(rest); };
if (sameDay === -1) {
  store.runs.push(run);
} else if (withoutClock(store.runs[sameDay]) !== withoutClock(run)) {
  run.runId = store.runs[sameDay].runId;
  store.runs[sameDay] = run;
}
store.runs = store.runs.slice(-90);
store.updated_at = TODAY;

if (!REPORT_ONLY) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

/* --- the daily report, section 69 ------------------------------------------ */

const lines = [];
lines.push("MODUNERA DAILY INTELLIGENCE REPORT", "");
lines.push(`Date:   ${TODAY}`);
lines.push(`Run ID: ${runId}`);
lines.push(`Search provider: ${run.provider}${run.providerConfigured ? "" : "  (NOT CONFIGURED — no scan performed)"}`);
lines.push(`Search Console:  ${run.gsc}`, "", "MARKET SCAN", "");
for (const m of CONFIG.markets) {
  const r = run.markets[m.code] ?? { queries: 0, checked: 0, signals: 0, error: "not run" };
  lines.push(`${m.name} (${m.code})`);
  lines.push(`  queries planned: ${r.queries}   sources checked: ${r.checked}   signals: ${r.signals}`);
  if (r.error) lines.push(`  note: ${r.error}`);
}
lines.push("", "SEARCH CONSOLE (sections 37 and 38)", "");
lines.push(`  ${run.gsc}`);
if (gscFound.length) {
  const byKind = {};
  for (const o of gscFound) byKind[o.kind] = (byKind[o.kind] ?? 0) + 1;
  for (const [k, n] of Object.entries(byKind)) lines.push(`  ${k.padEnd(26)}${n}`);
  lines.push("");
  for (const o of gscFound.slice(0, 15)) {
    lines.push(`  ${o.kind}  ${o.subject}`);
    lines.push(`      clicks ${o.clicks}  impressions ${o.impressions}` +
      (o.position === null ? "" : `  position ${o.position}`) +
      (o.ctr === null ? "" : `  CTR ${(o.ctr * 100).toFixed(2)}%`) +
      (o.growth === undefined ? "" : `  was ${o.was}, now ${o.clicks}`));
    if (o.action) lines.push(`      -> ${o.action}`);
  }
  if (gscFound.length > 15) lines.push(`  ... and ${gscFound.length - 15} more, all in data/market-signals.json`);
} else if (run.gscRows) {
  lines.push("  rows read, nothing crossed a threshold");
}

lines.push("", "VERIFIED INBOX", "");
lines.push(`  hand-verified candidates considered: ${run.verifiedInboxCandidates}`);
lines.push("", "DECISION", "", `  ${run.decision}`, `  ${run.decisionWhy}`);
if (run.decision !== "NO_PUBLISH") {
  lines.push(`  source: ${run.decisionSignal}`);
  lines.push(`  auto-publish news: ${run.autoPublish?.news ? "ON" : "off"}${run.awaitingHumanDecision ? "  — waiting for a person" : ""}`);
}
lines.push("");
lines.push("RUN COUNTERS (section 72)", "");
for (const [k, v] of [
  ["queries planned", run.queriesPlanned],
  ["sources visited", run.sourcesChecked],
  ["sources accepted", run.sourcesAccepted],
  ["sources rejected", run.sourcesRejected],
  ["projects discovered", run.projectsDiscovered],
  ["existing projects updated", run.existingProjectsUpdated],
  ["tender opportunities", run.tenderOpportunities],
  ["business leads", run.businessLeads],
  ["GSC opportunities", run.gscOpportunities],
  ["content generated", run.contentGenerated],
  ["content updated", run.contentUpdated],
]) lines.push(`  ${k.padEnd(28)}${v}`);
lines.push("");
lines.push("REVIEW QUEUE", "");
if (!run.dueForReview.length) lines.push("  nothing due today");
for (const d of run.dueForReview) lines.push(`  ${d.id}  status=${d.status}  due ${d.nextReviewAt}`);
lines.push("", "STORE", "",
  `  signals: ${store.signals.length}   opportunities: ${store.opportunities.length}   tenders: ${store.tenders.length}`);
for (const sig of store.signals) {
  lines.push(`  ${sig.country}  ${sig.title}`);
  lines.push(`      ${sig.municipality ?? "—"} · ${sig.status} · score ${sig.score} · tier ${sig.sourceAuthority} · ${sig.recommendedAction}`);
  lines.push(`      units: ${sig.units === null ? "not stated by the source" : sig.units}   next review ${sig.nextReviewAt}`);
  lines.push(`      ${sig.sourceUrl}`);
}
if (run.errors.length) { lines.push("", "ERRORS", ""); for (const e of run.errors) lines.push(`  ${e}`); }
const report = lines.join("\n");
await writeFile(REPORT_PATH, report + "\n", "utf8");
console.log(report);
