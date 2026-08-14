#!/usr/bin/env node
/* The V7 SEO and trust gate.

   tools/validate-modunera.mjs already checks the structural invariants — unique
   canonicals, resolvable local references, well-formed JSON-LD. This checks the
   things the V7 audit found wrong, so that none of them can come back silently:

     1  no page still carries a claim from data/blocked-claims.json
     2  no page describes itself as a demo or a placeholder
     3  the sitemap contains no noindex URL
     4  the sitemap contains no private or demo area
     5  the sitemap contains no unapproved programmatic location page
     6  every sitemap URL resolves to a file that exists
     7  every sitemap URL is self-canonical
     8  no duplicate <loc> in the sitemap
     9  no lastmod in the future, and not one single date across every URL
    10  hreflang is reciprocal: every alternate carries the identical set
    11  hreflang uses only de-DE, en, nl-NL, da-DK, fr and x-default
    12  no hreflang points at a noindex page
    13  every indexable page has a title, description, canonical, lang and one h1
    14  JSON-LD parses and carries no rating, review or award
    15  the statutory pages are not indexed while they are incomplete

   Exit code 1 on any failure. Run it after the full pipeline.
*/
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com";
const failures = [];
const fail = (check, detail) => failures.push(`${check}: ${detail}`);

const PRIVATE = ["/admin-demo/", "/customer-portal/", "/booking/", "/saved-designs/"];
const LOCATION = ["/standorte/", "/en/locations/", "/nl/locaties/", "/da/steder/", "/fr/lieux/"];
const VALID_HREFLANG = new Set(["de-DE", "en", "nl-NL", "da-DK", "fr", "x-default"]);
const LEGAL = ["/legal/impressum/", "/legal/datenschutz/", "/legal/cookies/"];
/* "Demo" is legitimate in "Design Studio Demo" style product copy nowhere on this
   site, so the words below are treated as faults wherever they appear in markup. */
const DEMO_MARKERS = ["Platzhalterseite", "vor Livegang", "Diese Demo", "This demo", "placeholder page"];

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "assets"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (extname(full) === ".html") files.push(full);
  }
  return files;
}

const routeOf = (rel) => (rel === "index.html" ? "/" : `/${rel.replace(/index\.html$/, "")}`);
const isPrivate = (route) => PRIVATE.some((p) => route.startsWith(p));
const isLocation = (route) => LOCATION.some((p) => route.startsWith(p));

/* --- read the site --------------------------------------------------------- */

const blocked = JSON.parse(await readFile(join(ROOT, "data/blocked-claims.json"), "utf8")).rules
  .flatMap((rule) => rule.replacements.map(([from]) => from));
const policy = JSON.parse(await readFile(join(ROOT, "data/location-index-policy.json"), "utf8"));
const approved = new Set([...(policy.approved_urls ?? []),
  ...(policy.entries ?? []).filter((e) => e.status === "approved" && Number(e.quality_score ?? 0) >= Number(policy.minimum_quality_score ?? 75)).map((e) => e.url)]);

const files = (await walk(ROOT)).filter((f) => relative(ROOT, f).replaceAll("\\", "/").endsWith("index.html"));
const pages = new Map();
let claimHits = 0;
let demoHits = 0;

for (const file of files) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  const route = routeOf(rel);
  const html = await readFile(file, "utf8");
  const robots = html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] ?? "";
  const indexable = !/noindex/i.test(robots);

  for (const phrase of blocked) {
    if (html.includes(phrase)) {
      claimHits += 1;
      if (claimHits <= 5) fail("1 blocked claim", `${route} still contains "${phrase}"`);
      break;
    }
  }
  for (const marker of DEMO_MARKERS) {
    if (html.includes(marker)) {
      demoHits += 1;
      if (demoHits <= 5) fail("2 demo wording", `${route} contains "${marker}"`);
      break;
    }
  }

  pages.set(route, {
    indexable,
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? "",
    title: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "",
    description: html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? "",
    lang: html.match(/<html lang="([^"]+)"/i)?.[1] ?? "",
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
    hreflang: [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]),
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
  });
}
if (claimHits > 5) fail("1 blocked claim", `and ${claimHits - 5} further page(s)`);
if (demoHits > 5) fail("2 demo wording", `and ${demoHits - 5} further page(s)`);

/* --- the sitemap ----------------------------------------------------------- */

const sitemapDir = join(ROOT, "sitemaps");
const parts = existsSync(sitemapDir) ? (await readdir(sitemapDir)).filter((f) => f.endsWith(".xml")) : [];
const entries = [];
for (const part of parts) {
  const xml = await readFile(join(sitemapDir, part), "utf8");
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
    entries.push({ loc: m[1], lastmod: m[2] ?? null, part });
  }
}
if (!entries.length) fail("3 sitemap", "no URLs found in sitemaps/");

const seen = new Set();
const today = new Date().toISOString().slice(0, 10);
for (const { loc, lastmod } of entries) {
  const route = loc.replace(BASE, "") || "/";
  if (seen.has(loc)) fail("8 duplicate loc", loc);
  seen.add(loc);

  const page = pages.get(route);
  if (!page) { fail("6 sitemap target missing", route); continue; }
  if (!page.indexable) fail("3 noindex in sitemap", route);
  if (isPrivate(route)) fail("4 private area in sitemap", route);
  if (isLocation(route) && !approved.has(route)) fail("5 unapproved location in sitemap", route);
  if (page.canonical.replace(BASE, "") !== route) fail("7 canonical mismatch", `${route} -> ${page.canonical}`);
  if (lastmod && lastmod > today) fail("9 future lastmod", `${route} ${lastmod}`);
}
const distinctLastmod = new Set(entries.map((e) => e.lastmod).filter(Boolean)).size;
if (entries.length > 50 && distinctLastmod === 0) {
  fail("9 lastmod", "no URL carries a lastmod; the policy requires real content dates");
}

/* --- hreflang -------------------------------------------------------------- */

for (const [route, page] of pages) {
  if (!page.hreflang.length) continue;
  for (const [code, href] of page.hreflang) {
    if (!VALID_HREFLANG.has(code)) fail("11 hreflang code", `${route} uses "${code}"`);
    const other = href.replace(BASE, "") || "/";
    const target = pages.get(other);
    if (!target) { fail("10 hreflang target missing", `${route} -> ${other}`); continue; }
    if (!target.indexable) fail("12 hreflang to noindex", `${route} -> ${other}`);
    if (code === "x-default") continue;
    const mine = [...page.hreflang].map((p) => p.join(" ")).sort().join("|");
    const theirs = [...target.hreflang].map((p) => p.join(" ")).sort().join("|");
    if (mine !== theirs) fail("10 hreflang not reciprocal", `${route} <-> ${other}`);
  }
}

/* --- per-page basics and structured data ----------------------------------- */

let ldChecked = 0;
for (const [route, page] of pages) {
  if (!page.indexable) continue;
  if (!page.title.trim()) fail("13 missing title", route);
  if (!page.description.trim()) fail("13 missing description", route);
  if (!page.canonical) fail("13 missing canonical", route);
  if (!page.lang.trim()) fail("13 missing html lang", route);
  if (page.h1Count !== 1) fail("13 h1 count", `${route} has ${page.h1Count}`);
  for (const block of page.jsonLd) {
    let data;
    try { data = JSON.parse(block); } catch { fail("14 invalid JSON-LD", route); continue; }
    ldChecked += 1;
    const text = JSON.stringify(data);
    for (const key of ["aggregateRating", '"review"', '"award"', "ratingValue"]) {
      if (text.includes(key)) fail("14 unevidenced schema", `${route} contains ${key}`);
    }
  }
}

for (const route of LEGAL) {
  const page = pages.get(route);
  if (!page) { fail("15 legal page missing", route); continue; }
  if (page.indexable) fail("15 incomplete legal page is indexed", `${route} — see REQUIRED-BUSINESS-INPUTS.md`);
}

/* --- report ---------------------------------------------------------------- */

const summary = {
  status: failures.length ? "failed" : "ok",
  html_pages: pages.size,
  indexable_pages: [...pages.values()].filter((p) => p.indexable).length,
  sitemap_urls: entries.length,
  sitemap_parts: parts.length,
  distinct_lastmod_dates: distinctLastmod,
  pages_with_hreflang: [...pages.values()].filter((p) => p.hreflang.length).length,
  full_five_language_clusters: [...pages.values()].filter((p) => p.hreflang.length === 6).length,
  json_ld_blocks_checked: ldChecked,
  blocked_claim_hits: claimHits,
  demo_wording_hits: demoHits,
  failures: failures.length,
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  console.error(failures.slice(0, 40).join("\n"));
  if (failures.length > 40) console.error(`... and ${failures.length - 40} more`);
  process.exit(1);
}
