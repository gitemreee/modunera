#!/usr/bin/env node
/* The instrument for titles and descriptions on the indexable set.

   WHY IT EXISTS

   Search Console shows impressions the site is not converting: 214 impressions
   and 12 clicks from Germany over three months, 101 and 3 from the Netherlands.
   A page that is shown and not clicked is usually not an authority problem; it
   is a problem with the two lines Google prints. So this counts them.

   WHAT IT MEASURES, AND WHY THOSE NUMBERS

   Google does not truncate at a character count — it truncates at a pixel width,
   around 580px on desktop, and a title of capital Ms is wider than one of
   lowercase i's. A character count is therefore an approximation, and this tool
   says so rather than pretending to a precision it does not have. It reports at
   60 characters, which is where a typical German title starts being cut, and it
   also reports the width in ems so a title full of wide letters is not passed by
   a count that happens to fit.

   It counts only pages that are actually indexable. Measuring the 14,641 noindex
   location pages would produce a large number that means nothing.

   Usage: node tools/score-titles.mjs [--list N]
*/
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LIST = (() => { const i = process.argv.indexOf("--list"); return i === -1 ? 0 : Number(process.argv[i + 1] ?? 20); })();

const TITLE_LIMIT = 60;
const DESC_MAX = 160;
const DESC_MIN = 70;

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "sitemaps"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

/* A rough width in ems, so "MODUNERA" is not counted the same as "illili".
   These are eyeballed averages for a sans face, which is all the precision the
   claim needs: it is here to catch a 58-character title of capitals, not to
   predict the pixel. */
const WIDE = /[MWmw@%]/g;
const NARROW = /[iljtIfr.,:;'|!\[\]()]/g;
function ems(text) {
  const base = text.length * 0.5;
  const wide = (text.match(WIDE) ?? []).length * 0.35;
  const narrow = (text.match(NARROW) ?? []).length * -0.22;
  const caps = (text.match(/[A-ZÄÖÜ]/g) ?? []).length * 0.08;
  return Math.round((base + wide + narrow + caps) * 10) / 10;
}
/* 580px at a 16px font is about 36 ems. */
const EM_LIMIT = 29;

const pages = [];
for (const file of await walk(ROOT)) {
  const html = await readFile(file, "utf8");
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/i) ?? [])[1] ?? "";
  if (/noindex/i.test(robots)) continue;
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1]?.trim() ?? "";
  const desc = (html.match(/<meta name="description" content="([^"]*)"/i) ?? [])[1]?.trim() ?? "";
  const suffix = (title.match(/\|\s*([^|]+)$/) ?? [])[1]?.trim() ?? null;
  pages.push({
    route: "/" + relative(ROOT, file).replace(/index\.html$/, ""),
    title, desc, suffix,
    titleChars: title.length, titleEms: ems(title),
    descChars: desc.length,
  });
}

const over = pages.filter((p) => p.titleChars > TITLE_LIMIT);
const overEms = pages.filter((p) => p.titleEms > EM_LIMIT);
const descOver = pages.filter((p) => p.descChars > DESC_MAX);
const descShort = pages.filter((p) => p.desc && p.descChars < DESC_MIN);
const descMissing = pages.filter((p) => !p.desc);

const suffixCount = {};
for (const p of pages) {
  const key = p.suffix ?? "(none)";
  suffixCount[key] = (suffixCount[key] ?? 0) + 1;
}
/* What the boilerplate costs, in characters, across the whole indexable set. */
let suffixTax = 0;
for (const p of pages) if (p.suffix) suffixTax += p.suffix.length + 3;

const pct = (n) => `${((n / pages.length) * 100).toFixed(1)}%`;

console.log("MODUNERA — titles and descriptions on the indexable set\n");
console.log(`indexable pages                 ${pages.length}`);
console.log(`title over ${TITLE_LIMIT} characters        ${over.length}  (${pct(over.length)})`);
console.log(`title wider than ~${EM_LIMIT} ems         ${overEms.length}  (${pct(overEms.length)})`);
console.log(`description over ${DESC_MAX}          ${descOver.length}`);
console.log(`description under ${DESC_MIN}           ${descShort.length}`);
console.log(`description missing             ${descMissing.length}`);
console.log(`\nboilerplate suffix costs        ${suffixTax} characters across the set`);
console.log(`                                (${Math.round(suffixTax / pages.length)} per page on average)\n`);
console.log("suffixes in use:");
for (const [s, n] of Object.entries(suffixCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  "${s}"  ${s === "(none)" ? "" : `(+${s.length + 3} chars)`}`);
}

if (LIST) {
  console.log(`\nlongest ${LIST} titles:`);
  for (const p of [...over].sort((a, b) => b.titleChars - a.titleChars).slice(0, LIST)) {
    console.log(`  ${String(p.titleChars).padStart(3)} chars / ${String(p.titleEms).padStart(5)} ems  ${p.route}`);
    console.log(`       ${p.title}`);
  }
}

console.log(`\nJSON: ${JSON.stringify({ pages: pages.length, title_over_limit: over.length, title_over_ems: overEms.length, desc_over: descOver.length, desc_short: descShort.length, desc_missing: descMissing.length, suffix_tax_chars: suffixTax })}`);
