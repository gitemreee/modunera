#!/usr/bin/env node
/* Gives each component card on /qualitaet/ its own sentence.

   The page lists twelve components — steel frame, chassis, facade, glazing,
   wiring, kitchen — and every one of them carried the same line:

     "In der Broschürenspezifikation der Modellfamilie genannt; finale
      Ausführung projektbezogen."

   Twelve headings and one sentence is worse than twelve headings and none. A
   reader who gets to the third card learns that the text is filler and stops
   reading the page, which means the headings stop working too. It also reads as
   evasion on the one page whose whole subject is what the thing is made of.

   The sentence was not evasion, it was a fallback: the certified figures behind
   these components — U-values, axle loads, steel grades, glazing build-ups — are
   publish blockers in REQUIRED-BUSINESS-INPUTS.md, so the pass that removed the
   unverified claims had nothing to put back and put the same placeholder in all
   twelve slots. The fix is not to invent the figures. It is to say what each
   component is, what job it does, and where its certified figure will come from —
   which is true today, useful today, and does not become a lie when the
   documentation arrives.

   No generator owns this page; it is one of the last files baked by the retired
   tools/generate_scale_v3.py, which is why a direct edit would have survived but
   would have had nowhere to live. The copy is in data/quality-spec.json so that
   the next person changing it edits a data file rather than a 60 KB line of HTML.

   Rules it keeps:

     - a card is found by its <h3>, not by its position, so reordering the grid
       does not silently move the copy onto the wrong component;
     - a heading in the data file that is not on the page is an error, not a skip.
       A silent skip is how a renamed heading turns into a card that keeps the
       placeholder while the build still reports success;
     - a card already carrying its sentence is left alone, so the pass is
       idempotent and a second run changes nothing.

   Usage: node tools/build-quality-spec.mjs
*/
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = JSON.parse(await readFile(join(ROOT, "data/quality-spec.json"), "utf8"));

/* The grid is one unbroken line of HTML, so the card is located by the pair it is
   built from rather than by parsing. Non-greedy up to the first </p>, which is the
   card's own — a benefit-card holds exactly one heading and one paragraph. */
function cardPattern(heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(<h3>${escaped}</h3><p>)(.*?)(</p>)`, "s");
}

const file = join(ROOT, SPEC.page);
const original = await readFile(file, "utf8");
let html = original;

const missing = [];
let rewritten = 0;
let already = 0;

for (const card of SPEC.cards) {
  const pattern = cardPattern(card.match);
  const found = html.match(pattern);
  if (!found) {
    missing.push(card.match);
    continue;
  }
  const wanted = card[SPEC.lang];
  if (found[2] === wanted) {
    already += 1;
    continue;
  }
  html = html.replace(pattern, (_m, open, _old, close) => open + wanted + close);
  rewritten += 1;
}

if (missing.length) {
  console.error(`build-quality-spec: ${missing.length} heading(s) not found on ${SPEC.page}:`);
  for (const heading of missing) console.error(`  ${heading}`);
  process.exit(1);
}

if (html !== original) await writeFile(file, html, "utf8");

console.log(JSON.stringify({
  page: SPEC.page,
  cards: SPEC.cards.length,
  rewritten,
  unchanged: already,
}));
