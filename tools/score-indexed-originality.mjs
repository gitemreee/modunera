#!/usr/bin/env node
/* Measures how much of each indexed page is that page's own writing.

   WHY THIS EXISTS

   `score-location-pages.mjs` instruments the 14,641 noindex location pages. The
   514 pages that are actually offered to search had no instrument at all, and
   the number that matters for them is the same one: after you remove everything
   that also appears on other pages, how much of this page is left?

   THE MEASURE

   A page's originality is the share of its <main> sentences that appear on no
   other indexed page. Nothing else — not length, not keyword density.

   Three normalisations, each of which changes the answer and each of which is
   there because leaving it out flatters the corpus:

     1. Place, region and country names are blanked before comparison. A
        mail-merged sentence is textually unique on every page and original on
        none. This is the lesson that turned 7,129 passing location pages into
        491, and it applies to any templated text, not just location pages.
     2. Prices, dates and other figures are blanked for the same reason: "ab
        18.900 EUR" and "ab 24.500 EUR" are one sentence, not two.
     3. Navigation, header and footer are outside <main> and never counted;
        inside <main>, the shared disclaimer and the shared checklist are counted
        exactly like any other repeated sentence, because that is what they are.

   A sentence is ORIGINAL when it occurs on exactly one indexed page. Shared by
   two pages is already shared. There is no tolerance band, because a tolerance
   band is a way of not counting something.

   Sentences shorter than MIN_WORDS are dropped: "Jetzt anfragen." repeated on
   500 pages is a button, not prose, and counting it measures the template rather
   than the writing.

   WHAT IT DOES NOT DO

   It does not rewrite anything and it does not decide what is acceptable. It
   reports mean and median originality across the indexed set, the worst pages,
   and the most-repeated sentences with the page count for each — which is the
   list you fix from.

   Usage:
     node tools/score-indexed-originality.mjs
     node tools/score-indexed-originality.mjs --json out.json
     node tools/score-indexed-originality.mjs --top 40      # worst pages to list
*/
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const MIN_WORDS = 6;

const args = process.argv.slice(2);
const jsonAt = args.indexOf("--json");
const JSON_OUT = jsonAt === -1 ? null : args[jsonAt + 1];
const topAt = args.indexOf("--top");
const TOP = topAt === -1 ? 25 : Number(args[topAt + 1]);

/* --- the indexed set: whatever is actually in the sitemap ------------------ */

async function sitemapPages() {
  const index = await readFile(join(ROOT, "sitemap.xml"), "utf8");
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => /sitemap-\d+\.xml$/.test(u));
  const urls = [];
  for (const part of parts) {
    const rel = part.replace(/^https?:\/\/[^/]+\//, "");
    const xml = await readFile(join(ROOT, rel), "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
  }
  return [...new Set(urls)].map((u) => {
    const path = u.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    return { url: u, rel: path === "" ? "index.html" : `${path}/index.html` };
  });
}

/* --- text extraction ------------------------------------------------------- */

function mainText(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body = m ? m[1] : "";
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&(?:auml|Auml|ouml|Ouml|uuml|Uuml|szlig|eacute|egrave|agrave|ccedil|oslash|aring|aelig);/g, "e")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Blanking. Anything that varies per page while the sentence stays the same is
   removed, so the comparison sees the sentence and not the mail-merge field. */
const PLACE_WORDS = new Set();
async function loadPlaceWords() {
  const add = (s) => {
    if (typeof s !== "string") return;
    for (const w of s.split(/[^\p{L}]+/u)) if (w.length > 2) PLACE_WORDS.add(w.toLowerCase());
  };
  const walkJson = (v) => {
    if (typeof v === "string") add(v);
    else if (Array.isArray(v)) v.forEach(walkJson);
    else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) {
        if (/name|city|region|state|place|country|land|title|slug|kommune|province/i.test(k)) walkJson(val);
      }
    }
  };
  for (const f of ["data/europe-locations-source.json", "data/locales.json"]) {
    try {
      walkJson(JSON.parse(await readFile(join(ROOT, f), "utf8")));
    } catch {
      /* a corpus file that is not present is not an error here */
    }
  }
}

function normalise(sentence) {
  let s = sentence.toLowerCase();
  s = s.replace(/\d[\d.,\s]*/g, " # ");
  s = s
    .split(/([^\p{L}]+)/u)
    .map((tok) => (PLACE_WORDS.has(tok) ? " @ " : tok))
    .join("");
  return s.replace(/[^\p{L}#@ ]+/gu, " ").replace(/\s+/g, " ").trim();
}

function sentences(text) {
  return text
    .split(/(?<=[.!?:])\s+(?=[A-ZÄÖÜÅØÆÉÈÀÇ«"'\d])/u)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= MIN_WORDS);
}

/* --- run ------------------------------------------------------------------- */

await loadPlaceWords();
const pages = await sitemapPages();

const perPage = [];
const freq = new Map(); // normalised sentence -> Set of page indexes

for (const [i, p] of pages.entries()) {
  let html;
  try {
    html = await readFile(join(ROOT, p.rel), "utf8");
  } catch {
    continue; // validate-seo-v7 owns the assertion that every sitemap URL resolves
  }
  const sents = sentences(mainText(html));
  const norm = sents.map(normalise).filter(Boolean);
  perPage.push({ rel: p.rel, url: p.url, index: i, sentences: norm });
  for (const s of norm) {
    if (!freq.has(s)) freq.set(s, new Set());
    freq.get(s).add(i);
  }
}

const scored = perPage.map((p) => {
  const total = p.sentences.length;
  const uniq = new Set(p.sentences);
  const original = [...uniq].filter((s) => freq.get(s).size === 1).length;
  const distinct = uniq.size;
  return {
    rel: p.rel,
    url: p.url,
    sentences: distinct,
    original,
    originality: distinct === 0 ? 0 : Math.round((original / distinct) * 1000) / 10,
    repeated_sentences: total - original,
  };
});

const withText = scored.filter((p) => p.sentences > 0);
const vals = withText.map((p) => p.originality).sort((a, b) => a - b);
const mean = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
const median =
  vals.length % 2
    ? vals[(vals.length - 1) / 2]
    : Math.round(((vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2) * 10) / 10;

const worst = [...withText].sort((a, b) => a.originality - b.originality).slice(0, TOP);

const repeats = [...freq.entries()]
  .filter(([, set]) => set.size > 1)
  .sort((a, b) => b[1].size - a[1].size)
  .slice(0, TOP)
  .map(([s, set]) => ({ pages: set.size, words: s.split(" ").length, sentence: s.slice(0, 140) }));

const report = {
  status: "ok",
  indexed_pages: pages.length,
  pages_with_prose: withText.length,
  mean_originality_pct: mean,
  median_originality_pct: median,
  pages_below_25pct: withText.filter((p) => p.originality < 25).length,
  pages_below_50pct: withText.filter((p) => p.originality < 50).length,
  worst_pages: worst,
  most_repeated_sentences: repeats,
};

if (JSON_OUT) {
  await writeFile(join(ROOT, JSON_OUT), JSON.stringify({ ...report, pages: scored }, null, 2), "utf8");
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      indexed_pages: report.indexed_pages,
      mean_originality_pct: report.mean_originality_pct,
      median_originality_pct: report.median_originality_pct,
      pages_below_25pct: report.pages_below_25pct,
      pages_below_50pct: report.pages_below_50pct,
    },
    null,
    2,
  ),
);
console.log(`\nworst ${worst.length} pages`);
for (const p of worst) console.log(`  ${String(p.originality).padStart(5)}%  ${p.original}/${p.sentences}  ${p.rel}`);
console.log(`\nmost repeated sentences (top ${repeats.length})`);
for (const r of repeats) console.log(`  ${String(r.pages).padStart(4)} pages  ${r.sentence}`);
