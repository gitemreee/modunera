#!/usr/bin/env node
/* Title length on the indexable set.

   WHY THIS IS A PASS AND NOT AN EDIT IN FIVE GENERATORS

   The suffix is composed in build-modunera-depth, build-modunera-europe,
   build-modunera-v2, build-news-v7, build-production-faq-v7 and the locale
   builders, each with a different surrounding structure. The rule being applied
   is one rule and it depends on the finished string — whether the title has
   already named its subject before the pipe. That is knowable only after the
   title exists, so it belongs where the other whole-page rules already live:
   alongside the claims pass, the image-attribute pass and the source-block pass.

   WHAT IT DOES

   Shortens the boilerplate suffix, and only where the title has already said the
   thing the suffix would repeat. 339 of 526 indexable pages were longer than
   Google prints, and 9,273 characters of the set were suffix. Of the 245 pages
   ending "| MODUNERA Tiny House", 97 already carry the phrase before the pipe;
   for the other 148 that suffix is the only place the keyword appears, and
   stripping it would trade a truncation problem for a relevance one. Measuring
   that is why the rule is conditional instead of global.

   og:title carries the same string as <title> here, so both move together. The
   JSON-LD headline is the body without a suffix and is left alone.

   noindex pages are skipped. Rewriting the 14,641 location pages would be a large
   number that changes nothing: they are not search results.

   Idempotent: a title already shortened no longer matches its rule.

   Order: after the content generators and before build-seo-governance-v7.mjs.

   Usage: node tools/build-title-lengths.mjs [--dry]
*/
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const POLICY = JSON.parse(await readFile(join(ROOT, "data/title-policy.json"), "utf8"));
const DRY = process.argv.includes("--dry");
const TITLE_LIMIT = POLICY.target_chars ?? 60;
const KEYWORD = new RegExp(POLICY.keyword_required, "i");

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "sitemaps"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/* Longest suffix first, so "MODUNERA Tiny House Ratgeber" is not part-matched by
   the rule for "MODUNERA Ratgeber". */
const rules = [...POLICY.suffix_rules].sort((a, b) => b.from.length - a.from.length);

const DROP_MIDDLE = new Set((POLICY.middle_segments_to_drop ?? []).map((s) => s.trim()));

/* Three parts, and the middle one is the same on every page in its language.
   "Hersteller & Lieferung" is not what anyone types and does not tell this page
   apart from the next one; it is simply what pushes the place name past the cut.
   Dropping it takes a location title from 71 characters to 42. */
function dropMiddle(title) {
  const parts = title.split("|").map((p) => p.trim());
  if (parts.length !== 3) return title;
  if (!DROP_MIDDLE.has(parts[1])) return title;
  return `${parts[0]} | ${parts[2]}`;
}

const PHRASE_TRIMS = POLICY.phrase_trims ?? [];
const COLON = POLICY.colon_tail_trim ?? { enabled: false };
const COUNTRY_TAIL = POLICY.location_country_tail ?? { enabled: false };
const COUNTRY_RE = COUNTRY_TAIL.enabled ? new RegExp(COUNTRY_TAIL.pattern) : null;

/* Four rules, all conditional on the title actually being over the limit — a
   title that fits is never touched, whatever formulas it contains. Order:
   boilerplate middles, literal phrase trims, the location country tail, and
   last the colon tail, because the first three are surgical and the fourth is
   the broadest. */
const OVERRIDES = POLICY.page_overrides ?? {};

function shorten(rawTitle, route) {
  /* An editorial override outranks every formula below it: the length rules
     exist to repair titles nobody chose, and these were chosen. */
  const ov = OVERRIDES[route];
  if (ov?.title) return ov.title === rawTitle ? null : ov.title;
  let title = dropMiddle(rawTitle);
  if (title.length > TITLE_LIMIT) {
    for (const { find, replace } of PHRASE_TRIMS) {
      if (title.length <= TITLE_LIMIT) break;
      if (title.includes(find)) title = title.split(find).join(replace);
    }
  }
  if (COUNTRY_RE && title.length > (COUNTRY_TAIL.only_when_over ?? 60)) {
    const m = COUNTRY_RE.exec(title);
    if (m) title = m[1] + m[2];
  }
  if (COLON.enabled && title.length > (COLON.only_when_over ?? 60)
      && !(COLON.exempt_trees ?? []).some((t) => route.startsWith(t))) {
    const m = /^([^:|]{18,}?):\s[^|]+(\|.*)$/.exec(title);
    if (m && m[1].trim().length >= (COLON.min_head ?? 18)) {
      title = `${m[1].trim()} ${m[2].trim()}`;
    }
  }
  return finishShorten(rawTitle, title);
}

function finishShorten(rawTitle, title) {
  const m = /^(.*?)\s*\|\s*([^|]+)$/.exec(title);
  if (!m) return title === rawTitle ? null : title;
  const body = m[1];
  const suffix = m[2].trim();
  for (const rule of rules) {
    if (suffix !== rule.from) continue;
    if (rule.only_if_body_has_keyword && !KEYWORD.test(decode(body))) return title === rawTitle ? null : title;
    return `${body} | ${rule.to}`;
  }
  return title === rawTitle ? null : title;
}

let indexable = 0;
let changed = 0;
let keptForKeyword = 0;
let charsSaved = 0;
let descTrimmed = 0;
const byRule = {};

for (const file of await walk(ROOT)) {
  const original = await readFile(file, "utf8");
  const robots = (original.match(/<meta name="robots" content="([^"]*)"/i) ?? [])[1] ?? "";
  if (/noindex/i.test(robots)) continue;
  indexable += 1;

  const titleMatch = original.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) continue;
  const title = titleMatch[1].trim();
  const route = "/" + relative(ROOT, file).replace(/index\.html$/, "");
  const next = shorten(title, route);

  if (!next) {
    /* Recorded, not silent: a page left long because its keyword lives in the
       suffix is a page for a generator to fix, not a page that was overlooked. */
    const suffix = (/\|\s*([^|]+)$/.exec(title) ?? [])[1]?.trim();
    if (suffix && rules.some((r) => r.from === suffix)) keptForKeyword += 1;
  }

  let html = original;
  if (next) html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${next}</title>`);
  /* og:title mirrors <title> on this site. Changing one and not the other would
     make the page say two different things to two different readers. */
  if (next) html = html.split(`content="${title}"`).join(`content="${next}"`);

  /* The second SERP line. Sentence-aware: a description past 160 is cut at the
     last sentence end at or before the cap — a mid-word cut in a result page
     reads as a defect, and Google rewrites defective lines with whatever it
     finds. Only if no sentence end exists past 80 does it fall to a word
     boundary with an ellipsis. */
  const ovDesc = OVERRIDES[route]?.description;
  if (ovDesc) {
    const dm0 = html.match(/<meta name="description" content="([^"]*)"/i);
    if (dm0 && dm0[1] !== ovDesc) html = html.split(`content="${dm0[1]}"`).join(`content="${ovDesc}"`);
  }
  const DESC = POLICY.description_trim ?? { enabled: false };
  if (DESC.enabled) {
    const dm = html.match(/<meta name="description" content="([^"]*)"/i);
    if (dm && dm[1].length > 160) {
      const cap = DESC.max ?? 158;
      const text = dm[1];
      let cut = -1;
      for (const mm of text.matchAll(/[.!?](?=\s|$)/g)) {
        if (mm.index + 1 <= cap) cut = mm.index + 1; else break;
      }
      const trimmed = cut > 80
        ? text.slice(0, cut).trim()
        : text.slice(0, cap - 1).replace(/\s+\S*$/, "").trim() + "…";
      html = html.split(`content="${text}"`).join(`content="${trimmed}"`);
      descTrimmed += 1;
    }
  }

  if (html !== original) {
    changed += 1;
    if (next) charsSaved += title.length - next.length;
    const suffix = next ? (/\|\s*([^|]+)$/.exec(title) ?? [])[1]?.trim() : null;
    if (suffix) byRule[suffix] = (byRule[suffix] ?? 0) + 1;
    if (!DRY) await writeFile(file, html, "utf8");
  }
}

console.log(JSON.stringify({
  indexable_pages: indexable,
  titles_shortened: changed,
  characters_recovered: charsSaved,
  left_long_because_the_suffix_carries_the_keyword: keptForKeyword,
  descriptions_trimmed: descTrimmed,
  by_suffix: byRule,
  dry_run: DRY,
}));
