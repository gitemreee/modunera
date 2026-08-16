#!/usr/bin/env node
/* Scores the programmatic location pages against the gate that already governs
   them, and reports which — if any — have earned a place in the sitemap.

   data/location-index-policy.json has said `minimum_quality_score: 75` with an
   empty allow-list since the gate was written. That is a policy with no
   instrument: nothing measured a page, so nothing could ever be promoted, and the
   14,650 noindex pages were destined to stay noindex by inertia rather than by
   judgement. This is the instrument.

   What it does not do: promote anything. It writes a report. Editing the
   allow-list is a decision, and a decision made by a script that also invented
   the criteria is not a decision.

   THE CRITERIA, and why each one

   Every criterion is something a page can only satisfy by containing information
   that is true of that place and not of the next town along. That is the whole
   test — not length, not keyword density, but whether removing the place name
   would leave a page that still made sense. If it would, the page is a template
   with a mail-merge field and Google is right to ignore it.

     unique_prose   35  Sentences that appear on fewer than 0.3% of the scored
                        pages, counted AFTER the page's own place and region names
                        are blanked out. That last clause is the whole measure: a
                        mail-merged sentence is textually unique on every page and
                        original on none, and without blanking, the score rewards
                        exactly what it exists to catch. It did, on the first full
                        run — 7,129 pages passed. With names blanked, 491 do.
     local_fact     20  A named region, and a climate or terrain statement that
                        differs between regions. "Bayern" is not a local fact;
                        "Süd- und Höhenlagenprofil" is, because Schleswig-Holstein
                        does not get it.
     authority      20  A link to the official permitting source for the country.
                        A page telling a reader to contact an authority it cannot
                        name has not earned a search result. 7,478 pages fail this:
                        the German-market pages under /standorte/, which predate
                        the generator that adds the source link. The 3,554 pages
                        for the other four markets in the same tree all have it.
     depth          15  Word count in <main>, scaled: 400 words scores nothing,
                        1,200 scores full. Deliberately the smallest weight, so a
                        long template cannot buy its way past a short real page.
     internal_link  10  Inbound links from outside its own directory. A page no
                        other page links is a page the site itself does not think
                        is worth reading.

   The weights are stated here rather than buried so that an argument about them
   is an argument about these numbers, in this file.

   Usage:
     node tools/score-location-pages.mjs                 # summary to stdout
     node tools/score-location-pages.mjs --json out.json # full per-page detail
     node tools/score-location-pages.mjs --sample 500    # faster, sampled run
*/
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const POLICY = JSON.parse(await readFile(join(ROOT, "data/location-index-policy.json"), "utf8"));

const args = process.argv.slice(2);
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const sample = args.includes("--sample") ? Number(args[args.indexOf("--sample") + 1]) : 0;

/* The directories that hold programmatic location pages, in every language. */
const LOCATION_ROOTS = ["standorte", "en/locations", "nl/locaties", "da/lokationer", "fr/emplacements"];

/* The official permitting source per market, from build-modunera-europe.mjs. A
   page scores `authority` if it links any of them — which market it should link
   is a separate question, and one this script deliberately does not police,
   because a Dutch page linking the German source is a different fault from a page
   linking nothing and should not be hidden inside the same zero. */
const AUTHORITY_HOSTS = ["verwaltung.bund.de", "government.nl", "lifeindenmark.borger.dk",
  "guichet.public.lu", "ch.ch/en/housing"];

async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(join(ROOT, dir), { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(rel, out);
    else if (extname(entry.name) === ".html") out.push(rel);
  }
  return out;
}

const stripTags = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z]+;|&#\d+;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const mainOf = (html) => {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  return m ? m[1] : "";
};

const sentencesOf = (text) => text.split(/(?<=[.!?])\s+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 45);

/* Blank the page's own place and region names before comparing sentences.

   Without this the measure rewards exactly what it exists to catch. "MODUNERA
   plant Tiny-House-Projekte für Schmidmühlen mit acht Ausgangsmodellen" is
   textually unique — no other page says Schmidmühlen — while being a mail-merge
   field in a sentence written once for 7,000 towns. The first full run scored
   nearly every page at full marks for original prose on exactly that basis.

   The names come from the page's own <h1> and breadcrumb rather than from the
   URL, because the slug is transliterated (schmidmuehlen) and the prose is not
   (Schmidmühlen), and matching one against the other is a worse problem than
   reading the heading. Any capitalised token of three or more characters in those
   two elements is treated as a name and blanked wherever it appears. That takes
   "MODUNERA" with it, which is correct: it appears on every page and identifies
   nothing about this one. */
function placeTokens(html) {
  const bits = [];
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const crumb = html.match(/<div class="breadcrumbs">([\s\S]*?)<\/div>/);
  for (const m of [h1, crumb]) if (m) bits.push(stripTags(m[1]));
  const tokens = new Set();
  for (const token of bits.join(" ").split(/[^\p{L}\p{N}-]+/u)) {
    if (token.length >= 3 && token[0] === token[0].toLocaleUpperCase() && /\p{L}/u.test(token[0])) tokens.add(token);
  }
  return [...tokens].sort((a, b) => b.length - a.length);   // longest first: "Sankt Gallen" before "Sankt"
}

const blankNames = (text, tokens) => {
  let out = text;
  for (const t of tokens) out = out.split(t).join("~");
  return out;
};

console.error("collecting location pages…");
let pages = [];
for (const dir of LOCATION_ROOTS) pages.push(...await walk(dir));
const total = pages.length;
if (sample && pages.length > sample) {
  // Deterministic sample: every Nth page. Random would make two runs of the same
  // tree disagree, and a quality gate that disagrees with itself is not a gate.
  const step = Math.floor(pages.length / sample);
  pages = pages.filter((_, i) => i % step === 0).slice(0, sample);
}
console.error(`scoring ${pages.length} of ${total}`);

/* Pass one: how often does each sentence occur across the corpus? A sentence
   that occurs 7,000 times is boilerplate however well written it is. */
const sentenceCount = new Map();
const parsed = [];
for (const file of pages) {
  const html = await readFile(join(ROOT, file), "utf8");
  const body = mainOf(html);
  const text = stripTags(body);
  // Two views of the same page: the real text for word count, and the same text
  // with its place names blanked for comparison against every other page.
  const sentences = sentencesOf(blankNames(text, placeTokens(html)));
  for (const s of new Set(sentences)) sentenceCount.set(s, (sentenceCount.get(s) || 0) + 1);
  parsed.push({ file, html, body, text, sentences, words: text.split(" ").length });
}

/* Pass two: inbound links. Counted from the whole site, not just the location
   tree, and excluding a page's own directory — a region page listing its towns
   links every one of them, which would give every page the same score and
   measure nothing. */
console.error("counting inbound links…");
const inbound = new Map();
const wanted = new Set(parsed.map((p) => p.file.replace(/index\.html$/, "")));
const allPages = await walk(".");
for (const file of allPages) {
  const html = await readFile(join(ROOT, file), "utf8");
  const fromDir = file.split("/").slice(0, -2).join("/");
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto") || href.startsWith("tel")) continue;
    let target;
    try { target = relative(ROOT, join(ROOT, file, "..", href)).replace(/\\/g, "/"); } catch { continue; }
    if (!target.endsWith("/")) target += "/";
    if (!wanted.has(target)) continue;
    if (fromDir && target.startsWith(fromDir + "/")) continue;   // same neighbourhood
    inbound.set(target, (inbound.get(target) || 0) + 1);
  }
}

const CLIMATE_HINTS = /profil|klima|küsten|höhenlagen|binnenland|kyst|kust|altitude|montagne|coastal|alpine|inland/i;

/* Boilerplate is relative to the corpus that was actually read, and it has to be,
   because sampling breaks a fixed threshold. The first version called a sentence
   fresh if it occurred on fewer than five pages. On the full 14,641 that is
   right. On a 400-page sample it is nonsense: a sentence templated across 100
   pages turns up two or three times in the sample and scores as original, which
   is how the first sampled run gave nearly every page full marks for prose.
   0.3% of the scored set, floor of two — 44 pages at full corpus, 2 at a 400
   sample, and the same meaning at both. */
const BOILERPLATE_AT = Math.max(2, Math.ceil(parsed.length * 0.003));
if (sample) console.error(`sampled: a sentence counts as boilerplate at ${BOILERPLATE_AT} occurrences`);

const scored = parsed.map((p) => {
  const fresh = p.sentences.filter((s) => (sentenceCount.get(s) || 0) < BOILERPLATE_AT);
  const uniqueProse = Math.min(1, fresh.length / 6) * 35;

  const region = /<strong>([^<]{3,40})<\/strong>/.test(p.body);
  const climate = CLIMATE_HINTS.test(p.text);
  const localFact = (region ? 10 : 0) + (climate ? 10 : 0);

  const authority = AUTHORITY_HOSTS.some((h) => p.html.includes(h)) ? 20 : 0;

  const depth = Math.max(0, Math.min(1, (p.words - 400) / 800)) * 15;

  const links = inbound.get(p.file.replace(/index\.html$/, "")) || 0;
  const linkScore = Math.min(1, links / 3) * 10;

  const score = uniqueProse + localFact + authority + depth + linkScore;
  return {
    file: p.file,
    score: Math.round(score),
    parts: {
      unique_prose: Math.round(uniqueProse), local_fact: localFact,
      authority, depth: Math.round(depth), internal_link: Math.round(linkScore),
    },
    evidence: { fresh_sentences: fresh.length, words: p.words, inbound_links: links },
  };
});

scored.sort((a, b) => b.score - a.score);
const pass = scored.filter((s) => s.score >= POLICY.minimum_quality_score);
const bucket = (lo, hi) => scored.filter((s) => s.score >= lo && s.score < hi).length;

const byTree = {};
for (const s of scored) {
  const tree = LOCATION_ROOTS.find((r) => s.file.startsWith(r + "/")) || "other";
  byTree[tree] ??= { pages: 0, mean: 0, with_authority: 0, mean_fresh: 0 };
  byTree[tree].pages += 1;
  byTree[tree].mean += s.score;
  byTree[tree].mean_fresh += s.evidence.fresh_sentences;
  if (s.parts.authority) byTree[tree].with_authority += 1;
}
for (const t of Object.values(byTree)) {
  t.mean = Math.round(t.mean / t.pages);
  t.mean_fresh = Math.round((t.mean_fresh / t.pages) * 10) / 10;
}

const report = {
  scored_at_pages: scored.length,
  total_location_pages: total,
  threshold: POLICY.minimum_quality_score,
  passing: pass.length,
  distribution: { "0-24": bucket(0, 25), "25-49": bucket(25, 50), "50-74": bucket(50, 75), "75-100": bucket(75, 101) },
  by_tree: byTree,
  best: scored.slice(0, 5),
  worst: scored.slice(-3),
};

if (jsonOut) {
  await writeFile(join(ROOT, jsonOut), JSON.stringify({ ...report, all: scored }, null, 2), "utf8");
  console.error(`wrote ${jsonOut}`);
}
console.log(JSON.stringify(report, null, 2));

/* Not an assertion and not a build gate: this reports, it does not fail. A gate
   that failed the build on a corpus nobody has yet decided to promote would be a
   gate against work in progress. */
