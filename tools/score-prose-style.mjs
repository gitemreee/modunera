#!/usr/bin/env node
/* Counts the constructions that make writing read like a form rather than a
   person, across the pages that are actually indexed.

   WHY THIS EXISTS

   "Make it warmer" is not a task you can carry out on 15,000 pages, and it is not
   a task anyone can check afterwards. This turns it into one: count the specific
   things, rank them, fix the generator that emits the worst, count again.

   WHAT IT COUNTS, and why each one

     nominal chains   German technical prose stacks -ung/-heit/-keit nouns until
                      the verb disappears. Three or more in one sentence is the
                      point where a reader stops hearing a person. Counted per
                      sentence, not per page, so a long page is not punished for
                      being long.
     passive          "wird geprüft", "werden festgelegt". Passive hides who does
                      the thing. Sometimes that is correct — an authority decides,
                      not us — which is why this is reported, not auto-fixed.
     filler           Words that fill the slot where a fact should be:
                      projektbezogen, entsprechend, jeweils, im Rahmen,
                      hinsichtlich, umfassend, optimal, hochwertig, ganzheitlich.
     long sentences   Over LONG_WORDS words. Not wrong, but a page where a third
                      of the sentences are that long is a page nobody finishes.

   WHAT IT DELIBERATELY DOES NOT COUNT AS A FAULT

   Legal hedges. "grundsätzlich", "in der Regel", "in principle", "as a rule",
   "i princippet", "en principe" and their kin are the reason this site's
   statements survive being quoted. They are counted and reported SEPARATELY under
   `hedges` so that a tone pass can see them and leave them alone. Stripping them
   would not make the site warmer, it would make it wrong.

   The most useful output is `repeated_phrases`: a formulaic phrase on 200 pages
   is one edit in a generator, not 200 edits in HTML.

   Usage:
     node tools/score-prose-style.mjs
     node tools/score-prose-style.mjs --json build-report-prose.json
     node tools/score-prose-style.mjs --lang de --top 30
*/
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LONG_WORDS = 30;
const NOMINAL_CHAIN = 3;

const args = process.argv.slice(2);
const pick = (flag, dflt) => { const i = args.indexOf(flag); return i === -1 ? dflt : args[i + 1]; };
const JSON_OUT = pick("--json", null);
const ONLY_LANG = pick("--lang", null);
const TOP = Number(pick("--top", 20));

/* --- what counts as filler, per language ---------------------------------- */

const FILLER = {
  de: ["projektbezogen", "entsprechend", "jeweilig", "jeweils", "im Rahmen", "hinsichtlich", "diesbezüglich",
       "seitens", "umfassend", "optimal", "hochwertig", "ganzheitlich", "vielfältig", "individuell abgestimmt",
       "zielgerichtet", "bedarfsgerecht", "professionell", "innovativ", "maßgeschneidert"],
  en: ["project-specific", "accordingly", "respective", "in the context of", "with regard to", "comprehensive",
       "optimal", "high-quality", "holistic", "tailor-made", "state-of-the-art", "innovative", "professional",
       "cutting-edge", "seamless"],
  nl: ["projectmatig", "dienovereenkomstig", "respectievelijk", "in het kader van", "met betrekking tot",
       "hoogwaardig", "optimaal", "integraal", "op maat gemaakt", "innovatief", "professioneel"],
  da: ["projektbestemt", "tilsvarende", "respektive", "inden for rammerne af", "med hensyn til", "højkvalitets",
       "optimal", "helhedsorienteret", "skræddersyet", "innovativ", "professionel"],
  /* Three words were in this list and have been taken out, because reading the
     matches showed the site was right and the list was wrong:
       "professionnel"  — on this site it is always a noun: "acheteurs
                          professionnels" (business buyers, as against
                          particuliers) and "un professionnel habilité" (a
                          qualified trade). Both are facts, not puffery.
       "au cas par cas" — a hedge, and an accurate one: zoning really is decided
                          case by case. It belongs with grundsätzlich, not here.
       "en conséquence" — ordinary French in "planifiez la livraison en
                          conséquence". Nothing is standing in for a fact.
     A measure that flags correct writing is worse than no measure, because
     someone will act on it. */
  fr: ["respectif", "dans le cadre de", "en ce qui concerne", "de haute qualité",
       "optimal", "global", "sur mesure et", "innovant", "clé en main"],
};

/* Hedges are counted and reported, never treated as a fault. They are the
   sentences that make a claim survive being quoted, and this site is careful
   with them on purpose. */
const HEDGE = {
  de: ["grundsätzlich", "in der Regel", "in eng begrenzten", "unverbindlich", "kann abweichen", "je nach", "vorbehaltlich"],
  en: ["in principle", "as a rule", "narrowly defined", "non-binding", "may differ", "depending on", "subject to"],
  nl: ["in beginsel", "in de regel", "nauw omschreven", "vrijblijvend", "kan afwijken", "afhankelijk van"],
  da: ["som udgangspunkt", "som regel", "snævert afgrænsede", "uforpligtende", "kan afvige", "afhængigt af"],
  fr: ["en principe", "en règle générale", "étroitement définies", "sans engagement", "peut varier", "selon"],
};

/* German nominalisation suffixes. The other four languages nominalise too but not
   with the same density, so the chain measure is reported for German and English
   and left out of the headline for the rest. */
const NOMINAL_RE = {
  de: /\b[A-ZÄÖÜ][a-zäöüß]+(?:ung|heit|keit|nis|schaft|ierung|barkeit|igkeit)\b/g,
  en: /\b\w+(?:tion|ment|ness|ity|ance|ence)\b/gi,
  nl: /\b\w+(?:ing|heid|baarheid)\b/gi,
  da: /\b\w+(?:ning|hed|else)\b/gi,
  fr: /\b\w+(?:tion|ment|ité|ance|ence)\b/gi,
};

const PASSIVE_RE = {
  de: /\b(wird|werden|wurde|wurden|worden)\b[^.!?]{0,60}?\b(ge\w+t|ge\w+en|\w+iert)\b/gi,
  en: /\b(is|are|was|were|been|be)\s+(\w+ed|built|made|given|taken|set|written|held|shown|kept|sent)\b/gi,
  nl: /\b(wordt|worden|werd|werden)\b[^.!?]{0,60}?\b(ge\w+d|ge\w+t|ge\w+en)\b/gi,
  da: /\b(bliver|blev)\b[^.!?]{0,60}?\b(\w+et|\w+t)\b/gi,
  fr: /\b(est|sont|était|étaient|sera|seront)\s+(\w+é|\w+ée|\w+és|\w+ées|fait|faits|mis|prise?)\b/gi,
};

/* --- the indexed set ------------------------------------------------------- */

async function sitemapPages() {
  const index = await readFile(join(ROOT, "sitemap.xml"), "utf8");
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => /sitemap-\d+\.xml$/.test(u));
  const urls = [];
  for (const part of parts) {
    const xml = await readFile(join(ROOT, part.replace(/^https?:\/\/[^/]+\//, "")), "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
  }
  return [...new Set(urls)].map((u) => {
    const p = u.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    return { url: u, rel: p === "" ? "index.html" : `${p}/index.html` };
  });
}

/* Prose only.

   The first run of this file reported eight "sentences" of 104 words and one of
   112, and every one of them was the MD 1-MD 8 price table read as running text:
   "Modell Grundriss Länge Ab Werk MD 1 Panorama und Loft 8,00 m …". A table has
   no full stops, so stripping tags and splitting on punctuation turns it into one
   enormous sentence and the measure points at the wrong thing entirely.

   Tables, spec grids and data strips are therefore removed, and every block-level
   close becomes a sentence boundary so that a list of six items is six short
   sentences rather than one long one. The measure is about prose a person reads
   in sequence; a table is not that, and "shortening" it would mean deleting
   figures. */
function mainText(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return (m ? m[1] : "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<table[\s\S]*?<\/table>/gi, " ")
    .replace(/<div class="(?:spec-grid|data-strip|state-grid|cat-rail|places-list|post-list|gallery-grid)"[\s\S]*?<\/div>\s*<\/div>/gi, " ")
    .replace(/<\/(?:p|li|h1|h2|h3|h4|td|th|figcaption|strong|dt|dd|a|span|div|section)>/gi, " . ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:apos|#39);/g, "'").replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s*\.\s*(?:\.\s*)+/g, " . ")
    .replace(/\s+/g, " ").trim();
}

const splitSentences = (t) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 4);
const langOf = (html) => (html.match(/<html\s+lang="([a-z]{2})/i)?.[1] ?? "de").toLowerCase();

/* --- run ------------------------------------------------------------------- */

const pages = await sitemapPages();
const byLang = new Map();
const phraseHits = new Map(); // "lang\tphrase" -> Set of pages
const longSamples = [];

for (const p of pages) {
  let html;
  try { html = await readFile(join(ROOT, p.rel), "utf8"); } catch { continue; }
  const lang = langOf(html);
  if (ONLY_LANG && lang !== ONLY_LANG) continue;
  const text = mainText(html);
  const sentences = splitSentences(text);
  if (!sentences.length) continue;

  if (!byLang.has(lang)) byLang.set(lang, { lang, pages: 0, sentences: 0, long: 0, passive: 0, nominalChains: 0, filler: 0, hedges: 0, words: 0 });
  const acc = byLang.get(lang);
  acc.pages += 1;
  acc.sentences += sentences.length;

  for (const s of sentences) {
    const words = s.split(/\s+/).length;
    acc.words += words;
    if (words > LONG_WORDS) {
      acc.long += 1;
      if (longSamples.length < 400) longSamples.push({ lang, words, rel: p.rel, text: s.slice(0, 180) });
    }
    if (PASSIVE_RE[lang] && new RegExp(PASSIVE_RE[lang].source, PASSIVE_RE[lang].flags).test(s)) acc.passive += 1;
    const noms = s.match(new RegExp(NOMINAL_RE[lang].source, NOMINAL_RE[lang].flags)) ?? [];
    if (noms.length >= NOMINAL_CHAIN) acc.nominalChains += 1;
  }

  const note = (list, bucket) => {
    for (const phrase of list ?? []) {
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const n = (text.match(re) ?? []).length;
      if (!n) continue;
      acc[bucket] += n;
      if (bucket === "filler") {
        const key = `${lang}\t${phrase}`;
        if (!phraseHits.has(key)) phraseHits.set(key, { pages: new Set(), total: 0 });
        phraseHits.get(key).pages.add(p.rel);
        phraseHits.get(key).total += n;
      }
    }
  };
  note(FILLER[lang], "filler");
  note(HEDGE[lang], "hedges");
}

const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);
const languages = [...byLang.values()].sort((a, b) => b.pages - a.pages).map((a) => ({
  lang: a.lang,
  pages: a.pages,
  sentences: a.sentences,
  mean_words_per_sentence: Math.round((a.words / a.sentences) * 10) / 10,
  long_sentences: a.long,
  long_sentence_pct: pct(a.long, a.sentences),
  passive_sentences: a.passive,
  passive_pct: pct(a.passive, a.sentences),
  nominal_chain_sentences: a.nominalChains,
  nominal_chain_pct: pct(a.nominalChains, a.sentences),
  filler_hits: a.filler,
  hedges_kept: a.hedges,
}));

const repeated = [...phraseHits.entries()]
  .map(([key, v]) => { const [lang, phrase] = key.split("\t"); return { lang, phrase, pages: v.pages.size, occurrences: v.total }; })
  .sort((a, b) => b.pages - a.pages)
  .slice(0, TOP);

const worstLong = longSamples.sort((a, b) => b.words - a.words).slice(0, TOP);

const totals = languages.reduce((t, l) => ({
  sentences: t.sentences + l.sentences, long: t.long + l.long_sentences,
  passive: t.passive + l.passive_sentences, nominal: t.nominal + l.nominal_chain_sentences,
  filler: t.filler + l.filler_hits, hedges: t.hedges + l.hedges_kept,
}), { sentences: 0, long: 0, passive: 0, nominal: 0, filler: 0, hedges: 0 });

const report = {
  status: "ok",
  indexed_pages_measured: languages.reduce((n, l) => n + l.pages, 0),
  long_sentence_threshold: LONG_WORDS,
  totals: {
    sentences: totals.sentences,
    long_sentence_pct: pct(totals.long, totals.sentences),
    passive_pct: pct(totals.passive, totals.sentences),
    nominal_chain_pct: pct(totals.nominal, totals.sentences),
    filler_hits: totals.filler,
    hedges_kept: totals.hedges,
  },
  languages,
  repeated_phrases: repeated,
  longest_sentences: worstLong,
};

if (JSON_OUT) await writeFile(join(ROOT, JSON_OUT), JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify({ status: "ok", ...report.totals, indexed_pages_measured: report.indexed_pages_measured }, null, 2));
console.log("\nper language");
console.log("  lang  pages  sent   w/sent   long%   passive%  nominal%  filler  hedges");
for (const l of languages) {
  console.log(`  ${l.lang.padEnd(5)}${String(l.pages).padStart(5)}${String(l.sentences).padStart(7)}${String(l.mean_words_per_sentence).padStart(8)}${String(l.long_sentence_pct).padStart(8)}${String(l.passive_pct).padStart(10)}${String(l.nominal_chain_pct).padStart(10)}${String(l.filler_hits).padStart(8)}${String(l.hedges_kept).padStart(8)}`);
}
console.log(`\ntop filler phrases (pages / occurrences) — each one is a generator edit, not a page edit`);
for (const r of repeated) console.log(`  ${String(r.pages).padStart(4)} pages ${String(r.occurrences).padStart(5)}x  [${r.lang}] ${r.phrase}`);
console.log(`\nlongest sentences`);
for (const s of worstLong.slice(0, 8)) console.log(`  ${s.words}w  ${s.rel}\n       ${s.text}…`);
