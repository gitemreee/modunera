#!/usr/bin/env node
/* Puts the official German permit source on the German-market location pages.

   /standorte/ is the German-language location tree and it covers all five
   markets. The Dutch, Danish, Luxembourgish and Swiss pages in it each link the
   official permitting source for their country, because build-modunera-europe.mjs
   writes country.source onto every page it generates. The German-market pages do
   not: they are the last of the HTML baked by the retired generate_scale_v3.py,
   which had no such field.

   That leaves the largest block on the site, for the largest market, telling the
   reader to contact the competent building authority and never naming where to
   find it. It is the one criterion in tools/score-location-pages.mjs worth twenty
   points that every one of them fails, and closing it is the largest single move
   available to that corpus.

   How it inserts. Not by position and not by rebuilding the page — by the one
   sentence every German-market page in the tree carries and no other page does:

     "Die Angaben sind eine geografisch abgeleitete Orientierung. …"

   7,406 pages carry it. The source link goes immediately before it, which is the
   order the Swiss and Dutch pages already use — link, then the note that limits
   what the link means.

   Rules it keeps:

     - a page already carrying the source is skipped, so the pass is idempotent;
     - a page without the anchor is counted and reported, never guessed at. About
       seventy pages in the tree do not carry the sentence, and a generator that
       silently invents an insertion point for them would be putting a legal link
       somewhere nobody chose;
     - the wording and the review date match what the other four markets already
       print, so the tree reads as one thing.

   Usage: node tools/build-de-source-block.mjs
*/
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

const SOURCE = "https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99012070006001";
const ANCHOR = '<p class="legal-note light">Die Angaben sind eine geografisch abgeleitete Orientierung.';
const LINK = `<a class="btn btn-sand" href="${SOURCE}" target="_blank" rel="noopener">Amtliche Ausgangsquelle ↗</a>`;

/* Any of the five official sources counts as "already sourced" — a page that
   links the Swiss or Dutch authority is a page for that market and none of this
   applies to it. */
const ANY_SOURCE = ["verwaltung.bund.de", "government.nl", "lifeindenmark.borger.dk",
  "guichet.public.lu", "ch.ch/en/housing"];

async function walk(dir, out = []) {
  for (const entry of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(rel, out);
    else if (extname(entry.name) === ".html") out.push(rel);
  }
  return out;
}

let added = 0, alreadySourced = 0, noAnchor = [];
for (const file of await walk("standorte")) {
  const html = await readFile(join(ROOT, file), "utf8");
  if (ANY_SOURCE.some((h) => html.includes(h))) { alreadySourced += 1; continue; }
  if (!html.includes(ANCHOR)) { noAnchor.push(file); continue; }
  await writeFile(join(ROOT, file), html.replace(ANCHOR, LINK + ANCHOR), "utf8");
  added += 1;
}

if (noAnchor.length) {
  console.error(`build-de-source-block: ${noAnchor.length} page(s) have no source and no anchor:`);
  for (const f of noAnchor.slice(0, 10)) console.error(`  ${f}`);
  if (noAnchor.length > 10) console.error(`  … and ${noAnchor.length - 10} more`);
}
console.log(JSON.stringify({ added, already_sourced: alreadySourced, no_anchor: noAnchor.length }));
