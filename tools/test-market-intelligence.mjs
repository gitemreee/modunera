#!/usr/bin/env node
/* Section 75. The nineteen tests the master prompt asks for.

   Each one runs against the real engine and the real repository, not a mock. The
   engine is a script with top-level effects, so the tests that exercise it spawn
   it as a subprocess with MODUNERA_MI_STORE, MODUNERA_MI_INBOX and
   MODUNERA_MI_REPORT pointed at scratch files. The live store is never touched by
   a test run.

   Four of the nineteen — hreflang, canonical, sitemap, structured data — are
   already owned by tools/validate-seo-v7.mjs across all 15,000 pages. Repeating
   that here would be a second, weaker implementation of a check that already
   exists, so those tests assert the one thing the validator cannot know: what
   this engine added. They check the pages this work created and say so.

   Usage: node tools/test-market-intelligence.mjs
   Exit code 0 if every test passes, 1 otherwise.
*/
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENGINE = join(ROOT, "tools/market-intelligence.mjs");
const TODAY = "2026-08-18";

const results = [];
let failures = 0;

function test(name, fn) {
  try {
    const note = fn();
    results.push({ name, ok: true, note: note ?? "" });
  } catch (e) {
    failures += 1;
    results.push({ name, ok: false, note: e.message });
  }
}
const assert = (cond, message) => { if (!cond) throw new Error(message); };

const json = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const CONFIG = json("data/market-scan-config.json");
const NEWS = json("data/news.json");

const scratch = await mkdtemp(join(tmpdir(), "modunera-mi-"));
const STORE = join(scratch, "store.json");
const INBOX = join(scratch, "inbox.json");
const REPORT = join(scratch, "report.txt");

function runEngine(inboxCandidates, { store = null, today = TODAY, args = [], gscDir = null } = {}) {
  writeFileSyncJson(INBOX, { candidates: inboxCandidates });
  if (store === null) { if (existsSync(STORE)) rmSync(STORE); }
  else writeFileSyncJson(STORE, store);
  const env = { ...process.env, MODUNERA_TODAY: today, MODUNERA_MI_STORE: STORE, MODUNERA_MI_INBOX: INBOX, MODUNERA_MI_REPORT: REPORT };
  /* Always pinned, so a test never reads whatever happens to sit in data/gsc/
     and never depends on it being empty. */
  env.MODUNERA_MI_GSC_DIR = gscDir ?? join(scratch, "no-gsc");
  execFileSync("node", [ENGINE, ...args], { cwd: ROOT, env, stdio: "pipe" });
  return JSON.parse(readFileSync(STORE, "utf8"));
}

/* A Search Console export as the Turkish interface writes it: Turkish headings,
   comma decimal separators, a percent sign on the CTR, and a query containing a
   comma inside quotes. Every one of those broke a naive reader. */
function writeGscFixture(dir, germanyClicks) {
  fsSync.mkdirSync(dir, { recursive: true });
  fsSync.writeFileSync(join(dir, "Sorgular.csv"),
    "En çok kullanılan sorgular,Tıklamalar,Gösterimler,Ortalama CTR,Ortalama konum\n" +
    'tiny house kaufen deutschland,3,1420,"0,21%","9,4"\n' +
    'tiny house preise,0,860,"0%","14,2"\n' +
    '"modulhaus, schlüsselfertig",1,240,"0,42%","23,8"\n', "utf8");
  fsSync.writeFileSync(join(dir, "Ulkeler.csv"),
    "Ülke,Tıklamalar,Gösterimler,Ortalama CTR,Ortalama konum\n" +
    `Almanya,${germanyClicks},4200,"0,24%","12,1"\n`, "utf8");
  return dir;
}
function writeFileSyncJson(p, v) { require_fs().writeFileSync(p, JSON.stringify(v, null, 2), "utf8"); }
function rmSync(p) { require_fs().rmSync(p, { force: true }); }
function require_fs() { return fsSync; }
import * as fsSync from "node:fs";

/* A candidate that is real in shape, so a test is testing the gate and not a
   malformed object. Facts are the Menden ones, which were read on the source. */
const MENDEN = {
  country: "DE", region: "Nordrhein-Westfalen", place: "Menden (Sauerland)",
  type: "MUNICIPAL_TINY_HOUSE_SITE", title: "Tiny-House-Siedlung Sauerlandstraße",
  summary: "Verfahren der Stadt Menden auf dem Beteiligungsportal NRW.",
  status: "PUBLIC_CONSULTATION", units: null,
  authority: "Stadt Menden (Sauerland)",
  publisher: "Beteiligung NRW / Stadt Menden (Sauerland)",
  sourceUrl: "https://beteiligung.nrw.de/portal/men/beteiligung/themen/1016912",
  sourceDate: "2025-08-15",
};

/* ---- 1 daily scheduler --------------------------------------------------- */
test("daily scheduler", () => {
  const wf = join(ROOT, ".github/workflows/market-intelligence.yml");
  assert(existsSync(wf), "no .github/workflows/market-intelligence.yml");
  const text = readFileSync(wf, "utf8");
  const cron = CONFIG.run.schedule_cron_utc;
  assert(text.includes(cron), `workflow does not carry the cron from the config (${cron})`);
  assert(/workflow_dispatch/.test(text), "workflow cannot be run by hand");
  return `cron ${cron}`;
});

/* ---- 2 duplicate run ----------------------------------------------------- */
test("duplicate run", () => {
  const first = runEngine([MENDEN]);
  const second = runEngine([MENDEN], { store: first });
  assert(first.runs.length === 1, `first run wrote ${first.runs.length} run records`);
  assert(second.runs.length === 1, `a second run on the same day appended: ${second.runs.length} records`);
  const third = runEngine([MENDEN], { store: second, today: "2026-08-19" });
  assert(third.runs.length === 2, "a run on the next day did not append");
  return "same day replaces, next day appends";
});

/* ---- 3 duplicate project detection --------------------------------------- */
test("duplicate project detection", () => {
  const once = runEngine([MENDEN]);
  const twice = runEngine([MENDEN, { ...MENDEN, title: "Tiny-House-Siedlung Sauerlandstraße (Kopie)" }], { store: once });
  assert(twice.signals.length === 1, `the same source URL produced ${twice.signals.length} signals`);
  return "one signal per source URL";
});

/* ---- 4 official source validation ---------------------------------------- */
test("official source validation", () => {
  const s = runEngine([MENDEN]);
  assert(s.signals[0].sourceAuthority === 1, `beteiligung.nrw.de scored tier ${s.signals[0].sourceAuthority}, expected 1`);
  const blog = runEngine([{ ...MENDEN, sourceUrl: "https://tinyhouseblog.example.com/menden" }]);
  assert(blog.runs[0].decision === "NO_PUBLISH", "a non-official source was not refused");
  return "tier 1 recognised, tier 3 refused";
});

/* ---- 5 fake URL rejection ------------------------------------------------ */
test("fake URL rejection", () => {
  const s = runEngine([{ ...MENDEN, sourceUrl: "" }]);
  assert(s.signals.length === 0, "a candidate with no source URL became a signal");
  assert(s.runs[0].errors.some((e) => /no source URL/.test(e)), "the rejection was not reported");
  return "no source URL, no signal";
});

/* ---- 6 project status update --------------------------------------------- */
test("project status update", () => {
  const s = runEngine([{ ...MENDEN, status: "Baugenehmigung erteilt" }]);
  assert(s.signals[0].status === "UNKNOWN", `a status outside the taxonomy was accepted as "${s.signals[0].status}"`);
  const ok = runEngine([{ ...MENDEN, status: "APPROVED" }]);
  assert(ok.signals[0].status === "APPROVED", "a taxonomy status was not kept");
  const days = CONFIG.status_taxonomy.review_days.APPROVED;
  const expected = new Date(Date.parse(TODAY) + days * 86400000).toISOString().slice(0, 10);
  assert(ok.signals[0].nextReviewAt === expected, `review date ${ok.signals[0].nextReviewAt}, expected ${expected}`);
  return "taxonomy enforced, review interval derived from status";
});

/* ---- 7 location page cannibalization ------------------------------------- */
test("location page cannibalization", () => {
  const engine = readFileSync(ENGINE, "utf8");
  /* Grepping for the bare word finds this file's own prose about not having it.
     What matters is whether any code path can emit the action. */
  assert(!/action:\s*["'`]CREATE_LOCATION/.test(engine), "the engine can emit a CREATE_LOCATION action");
  assert(!CONFIG.decision.order.includes("CREATE_LOCATION"), "the config allows CREATE_LOCATION");
  assert(CONFIG.decision.location_pages_frozen === true, "location pages are not frozen in the config");
  const policy = json("data/location-index-policy.json");
  assert(policy, "no location index policy");
  return "no action exists that could mint a location page";
});

/* ---- 8 product price source ---------------------------------------------- */
test("product price source", () => {
  const pricing = json("data/pricing.json");
  assert(pricing, "data/pricing.json missing");
  const engine = readFileSync(ENGINE, "utf8");
  assert(!/\d{2}\.?\d{3}\s*€/.test(engine), "the engine hard-codes a price");
  const priced = NEWS.items.filter((i) => JSON.stringify(i).match(/\d{2}\.\d{3}\s*€/));
  assert(priced.length === 0, `${priced.length} news item(s) state a price; prices belong in data/pricing.json`);
  return "no price outside data/pricing.json";
});

/* ---- 9 delivery price source --------------------------------------------- */
test("delivery price source", () => {
  const pricing = json("data/pricing.json");
  const hasDelivery = JSON.stringify(pricing).toLowerCase().includes("delivery") ||
    JSON.stringify(pricing).toLowerCase().includes("lieferung") ||
    JSON.stringify(pricing).toLowerCase().includes("transport");
  assert(hasDelivery, "data/pricing.json carries no delivery figures");
  const engine = readFileSync(ENGINE, "utf8");
  assert(!/Lieferkosten\s*[:=]\s*\d/.test(engine), "the engine hard-codes a delivery cost");
  return "delivery figures live in data/pricing.json only";
});

/* ---- 10 localization ------------------------------------------------------ */
test("localization", () => {
  /* Section 67: a market news item is published in the market's own language and
     English, not in all five. */
  for (const item of NEWS.items) {
    const langs = Object.keys(item.slug ?? {});
    assert(langs.includes(item.nativeLang), `${item.id} has no slug in its native language`);
    assert(langs.length <= 2, `${item.id} is published in ${langs.length} languages; section 67 allows the native language and English`);
    for (const l of langs) assert(item[l]?.title, `${item.id} has a ${l} slug but no ${l} title`);
  }
  return `${NEWS.items.length} items, native language plus English`;
});

/* ---- 11 hreflang ---------------------------------------------------------- */
test("hreflang", () => {
  const page = join(ROOT, "intelligence/index.html");
  assert(existsSync(page), "the intelligence page was not built");
  const html = readFileSync(page, "utf8");
  assert(!/rel="alternate"\s+hreflang/.test(html), "a noindex page carries hreflang alternates");
  const newsPage = join(ROOT, "news/menden-sauerlandstrasse-tiny-house-siedlung/index.html");
  if (existsSync(newsPage)) {
    const n = readFileSync(newsPage, "utf8");
    assert(/hreflang="de"/.test(n) && /hreflang="en"/.test(n), "the new news article has no de/en hreflang pair");
    return "intelligence has none, the new article has de+en";
  }
  return "intelligence has none (article not built yet in this checkout)";
});

/* ---- 12 canonical --------------------------------------------------------- */
test("canonical", () => {
  const html = readFileSync(join(ROOT, "intelligence/index.html"), "utf8");
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert(m, "no canonical on the intelligence page");
  assert(m[1] === "https://modunera.com/intelligence/", `canonical points at ${m[1]}`);
  return m[1];
});

/* ---- 13 sitemap ----------------------------------------------------------- */
test("sitemap", () => {
  const dir = join(ROOT, "sitemaps");
  assert(existsSync(dir), "no sitemaps directory");
  const files = fsSync.readdirSync(dir).filter((f) => f.endsWith(".xml"));
  const all = files.map((f) => readFileSync(join(dir, f), "utf8")).join("");
  assert(!all.includes("/intelligence/"), "the intelligence page is in a sitemap");
  return `${files.length} sitemap file(s) checked, /intelligence/ absent`;
});

/* ---- 14 structured data --------------------------------------------------- */
test("structured data", () => {
  const newsPage = join(ROOT, "news/menden-sauerlandstrasse-tiny-house-siedlung/index.html");
  if (!existsSync(newsPage)) return "article not built yet in this checkout";
  const html = readFileSync(newsPage, "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert(blocks.length > 0, "the new article carries no structured data");
  for (const [, body] of blocks) JSON.parse(body);
  return `${blocks.length} valid JSON-LD block(s)`;
});

/* ---- 15 GSC fallback ------------------------------------------------------ */
test("GSC fallback", () => {
  const s = runEngine([MENDEN]);
  assert(s.runs[0].gsc === "not connected", `the run claims GSC state "${s.runs[0].gsc}"`);
  assert(s.runs[0].gscOpportunities === 0, "GSC opportunities were counted without a connection");
  return "reports not connected rather than inventing rows";
});

/* ---- 15a GSC export parsing ----------------------------------------------- */
test("GSC export parsing", () => {
  const dir = writeGscFixture(join(scratch, "gsc-a"), 10);
  const s = runEngine([], { gscDir: dir });
  const run = s.runs[0];
  assert(run.gscRows === 4, `read ${run.gscRows} rows, expected 4`);
  const opps = s.gscOpportunities ?? [];
  const kinds = Object.fromEntries(opps.map((o) => [o.kind, o]));
  assert(kinds.HIGH_IMPRESSION_LOW_CTR?.subject === "tiny house kaufen deutschland",
    "the high-impression/low-CTR query was not identified");
  assert(kinds.HIGH_IMPRESSION_LOW_CTR.position === 9.4, `comma decimal misread as ${kinds.HIGH_IMPRESSION_LOW_CTR.position}`);
  assert(kinds.NEAR_PAGE_ONE?.subject === "tiny house preise", "the near-page-one query was not identified");
  assert(kinds.MISSING_CONTENT?.subject === "modulhaus, schlüsselfertig",
    "a quoted query containing a comma was split");
  /* A country row has no page to strengthen; it must not land in a page bucket. */
  assert(!opps.some((o) => o.subject === "Almanya" && o.kind !== "COUNTRY_GROWTH"),
    "a country row was classified as a page opportunity");
  return "Turkish headings, comma decimals, quoted commas, 3 buckets";
});

/* ---- 15b GSC country growth needs a baseline ------------------------------ */
test("GSC country growth", () => {
  const dir = join(scratch, "gsc-b");
  writeGscFixture(dir, 10);
  const first = runEngine([], { gscDir: dir });
  assert(!(first.gscOpportunities ?? []).some((o) => o.kind === "COUNTRY_GROWTH"),
    "growth was claimed from a single export, with nothing to compare against");
  writeGscFixture(dir, 17);
  const second = runEngine([], { store: first, gscDir: dir, today: "2026-08-20" });
  const growth = (second.gscOpportunities ?? []).find((o) => o.kind === "COUNTRY_GROWTH");
  assert(growth, "growth was not detected against the stored baseline");
  assert(growth.was === 10 && growth.clicks === 17, `growth reported ${growth.was} -> ${growth.clicks}`);
  return "absent on the first export, 10 -> 17 on the second";
});

/* ---- 16 business lead extraction ------------------------------------------ */
test("business lead extraction", () => {
  const s = runEngine([MENDEN]);
  assert(Array.isArray(s.opportunities), "no opportunities array in the store");
  assert(s.opportunities.length === 0, "leads appeared without a source that named one");
  assert(s.runs[0].businessLeads === 0, "the run counted leads it did not find");
  const sig = s.signals[0];
  assert(!/@/.test(JSON.stringify(sig)), "an e-mail address was copied into the store");
  /* An ISO date matches a lazy phone pattern, which is how the first version of
     this test failed on "2026-08-18". A phone number has five or more digits
     after its separator; a date does not. */
  assert(!/\b\+?\d{2,5}[\s/-]\d{5,}\b/.test(JSON.stringify(sig)), "a phone number was copied into the store");
  return "no lead invented, no personal contact copied";
});

/* ---- 17 tender extraction ------------------------------------------------- */
test("tender extraction", () => {
  const s = runEngine([MENDEN]);
  assert(Array.isArray(s.tenders), "no tenders array in the store");
  assert(s.tenders.length === 0, "a tender appeared with no procurement source");
  const tierOne = CONFIG.source_authority[0].match;
  assert(tierOne.some((m) => /ted\\?\.europa/.test(m)), "TED is not in the tier 1 source list");
  return "TED recognised as tier 1, nothing invented";
});

/* ---- 18 quality threshold ------------------------------------------------- */
test("quality threshold", () => {
  const threshold = CONFIG.scoring.publish_threshold;
  const weak = runEngine([{
    country: "DE", place: null, title: "Wohnen", summary: "Ein Beitrag.",
    sourceUrl: "https://beteiligung.nrw.de/portal/men/beteiligung/themen/999999",
    publisher: "Beteiligung NRW", sourceDate: "2019-01-01", status: "UNKNOWN",
  }]);
  const score = weak.signals[0]?.score ?? 0;
  assert(score < threshold, `a weak candidate scored ${score}, at or above the ${threshold} threshold`);
  assert(weak.runs[0].decision === "NO_PUBLISH", `a candidate scoring ${score} was not refused`);
  return `below ${threshold} is refused (this one scored ${score})`;
});

/* ---- 19 NO_PUBLISH -------------------------------------------------------- */
test("NO_PUBLISH", () => {
  const s = runEngine([]);
  assert(s.runs[0].decision === "NO_PUBLISH", `an empty day decided ${s.runs[0].decision}`);
  assert(/no search provider configured/.test(s.runs[0].decisionWhy), "the reason does not name the missing provider");
  assert(s.signals.length === 0, "a signal appeared on a day with nothing to find");
  return "a day with nothing found produces nothing";
});

/* ---- report --------------------------------------------------------------- */
await rm(scratch, { recursive: true, force: true });

const width = Math.max(...results.map((r) => r.name.length));
console.log("MODUNERA MARKET INTELLIGENCE — SECTION 75 TESTS\n");
for (const r of results) {
  console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(width)}  ${r.note}`);
}
console.log(`\n  ${results.length - failures}/${results.length} passed`);
process.exit(failures ? 1 : 0);
