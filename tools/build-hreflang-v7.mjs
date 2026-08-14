#!/usr/bin/env node
/* Reciprocal hreflang clusters across the five target languages.

   The V7 audit found 7,561 pages with no hreflang at all, 7,297 with a partial
   three-way set, and only 114 with the full target cluster — plus NL/DA/FR
   country pages whose German and English alternates pointed at the home page
   rather than at the same country.

   This builds the clusters from the slug tables the site is already generated
   from, so the navigation and the language map cannot drift apart. Three rules
   decide what is written:

     1. A cluster contains only the languages where the equivalent page actually
        exists on disk. A language with no equivalent gets no tag — pointing at
        the home page instead is the fault the audit named.
     2. Every member of a cluster receives the identical set, which makes the
        relationship reciprocal by construction rather than by inspection.
     3. Language codes are de-DE, en, nl-NL, da-DK and fr, plus x-default on the
        German equivalent — or English where German has none.

   noindex pages are skipped: a page that is not a search result has no business
   in a cluster, and including one is a signal error.

   Usage: node tools/build-hreflang-v7.mjs [--check]
*/
import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com/";
const CHECK_ONLY = process.argv.includes("--check");

const HREFLANG = { de: "de-DE", en: "en", nl: "nl-NL", da: "da-DK", fr: "fr" };
const ORDER = ["de", "en", "nl", "da", "fr"];

const LOCALES = JSON.parse(await readFile(join(ROOT, "data/locales.json"), "utf8")).locales;
const readJson = async (rel) => JSON.parse(await readFile(join(ROOT, rel), "utf8"));

/* --- the slug tables, taken from the same data the pages are built from ---- */

const COUNTRY_SLUG = {
  de: { DE: "deutschland", NL: "niederlande", DK: "daenemark", LU: "luxemburg", CH: "schweiz" },
  en: { DE: "germany", NL: "netherlands", DK: "denmark", LU: "luxembourg", CH: "switzerland" },
  nl: LOCALES.nl.countrySlugs, da: LOCALES.da.countrySlugs, fr: LOCALES.fr.countrySlugs,
};
const SERVICE_SLUG = {
  de: { modular: "modulbau", steel: "stahlbau", bungalow: "bungalows", furniture: "moebel-nach-mass" },
  en: { modular: "modular-buildings", steel: "steel-structures", bungalow: "bungalows", furniture: "bespoke-furniture" },
  nl: LOCALES.nl.serviceSlugs, da: LOCALES.da.serviceSlugs, fr: LOCALES.fr.serviceSlugs,
};
const SECTION = {
  home:      { de: "", en: "en/", nl: "nl/", da: "da/", fr: "fr/" },
  countries: { de: "laender/", en: "en/countries/", nl: "nl/landen/", da: "da/lande/", fr: "fr/pays/" },
  models:    { de: "modelle/", en: "en/models/", nl: "nl/modellen/", da: "da/modeller/", fr: "fr/modeles/" },
  services:  { de: "leistungen/", en: "en/services/", nl: "nl/diensten/", da: "da/ydelser/", fr: "fr/services/" },
  faq:       { de: "faq/", en: "en/faq/", nl: "nl/veelgestelde-vragen/", da: "da/ofte-stillede-spoergsmaal/", fr: "fr/questions-frequentes/" },
  questions: { de: "fragen/", en: "en/questions/", nl: "nl/vragen-per-land/", da: "da/spoergsmaal-per-land/", fr: "fr/questions-par-pays/" },
  guides:    { de: "ratgeber/", en: "en/guides/", nl: "nl/gidsen/", da: "da/guides/", fr: "fr/guides/" },
  blog:      { de: "blog/", en: "en/blog/", nl: "nl/blog/", da: "da/blog/", fr: "fr/blog/" },
};

/* --- assemble the clusters ------------------------------------------------- */

const clusters = [];
const addCluster = (members) => {
  const present = Object.fromEntries(Object.entries(members).filter(([, route]) => route !== null));
  if (Object.keys(present).length > 1) clusters.push(present);
};
const perLang = (fn) => Object.fromEntries(ORDER.map((lang) => [lang, fn(lang)]));

for (const section of Object.values(SECTION)) addCluster(perLang((lang) => section[lang]));
for (const code of ["DE", "NL", "DK", "LU", "CH"]) {
  addCluster(perLang((lang) => `${SECTION.countries[lang]}${COUNTRY_SLUG[lang][code]}/`));
  addCluster(perLang((lang) => `${SECTION.questions[lang]}${COUNTRY_SLUG[lang][code]}/`));
}
for (const key of ["modular", "steel", "bungalow", "furniture"]) {
  addCluster(perLang((lang) => `${SECTION.services[lang]}${SERVICE_SLUG[lang][key]}/`));
}
for (let n = 1; n <= 8; n += 1) {
  addCluster(perLang((lang) => `${SECTION.models[lang]}md-${n}/`));
}

/* The four non-German blogs share a subject order by design — localePostPage()
   and localeBlogCategoryPage() in build-modunera-depth.mjs pair them by index,
   so the same index is the same subject. German has no equivalent of these. */
const localeBlogs = Object.fromEntries(await Promise.all(
  ["nl", "da", "fr"].map(async (code) => [code, await readJson(`data/blog-${code}.json`)])));
const posts = Object.fromEntries(await Promise.all(
  ["en", "nl", "da", "fr"].map(async (code) => [code, (await readJson(`data/posts-${code}.json`)).posts])));
const enBlog = await readJson("data/en-blog.json");

for (let i = 0; i < enBlog.categories.length; i += 1) {
  addCluster({
    en: `en/blog/${enBlog.categories[i].slug}/`,
    nl: `nl/blog/${localeBlogs.nl.categories[i]?.slug}/`,
    da: `da/blog/${localeBlogs.da.categories[i]?.slug}/`,
    fr: `fr/blog/${localeBlogs.fr.categories[i]?.slug}/`,
  });
}
const postCount = Math.min(...Object.values(posts).map((list) => list.length));
for (let i = 0; i < postCount; i += 1) {
  addCluster(Object.fromEntries(["en", "nl", "da", "fr"].map((lang) =>
    [lang, `${SECTION.blog[lang]}${posts[lang][i].slug}/`])));
}

/* The market guides are generated as DE/EN pairs by build-modunera-v2.mjs, under
   /blog/europa/ and /en/guides/ respectively. Reading the pairs out of that file
   keeps this map from drifting when a guide is added. The country permit guides
   follow the same pattern with the country slug. */
const v2 = await readFile(join(ROOT, "tools/build-modunera-v2.mjs"), "utf8");
for (const [, deSlug, enSlug] of v2.matchAll(/deSlug: "([a-z-]+)", enSlug: "([a-z-]+)"/g)) {
  const isCountry = ["deutschland", "niederlande", "daenemark", "luxemburg", "schweiz"].includes(deSlug);
  addCluster({
    de: isCountry ? `blog/europa/tiny-house-${deSlug}-genehmigung/` : `blog/europa/${deSlug}/`,
    en: isCountry ? `en/guides/tiny-house-${enSlug}-permits/` : `en/guides/${enSlug}/`,
  });
}

/* Two generators route their own pages — the local news hubs and the production
   FAQ, whose subject pages exist only in the languages that have enough answers
   for one. Rather than keep a second copy of those rules here, each writes the
   clusters it produced into the manifest and this reads them back. Without that
   the strip pass below would remove the sets those generators just wrote. */
const MANIFEST = join(ROOT, "data/hreflang-clusters-generated.json");
if (existsSync(MANIFEST)) {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  for (const list of Object.values(manifest.generated ?? {})) {
    for (const members of list) addCluster(members);
  }
}

/* --- write them ------------------------------------------------------------ */

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "assets", "sitemaps"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (extname(full) === ".html") files.push(full);
  }
  return files;
}

const routeOf = (rel) => (rel === "index.html" ? "" : rel.slice(0, -"index.html".length));
const exists = new Set((await walk(ROOT))
  .map((f) => relative(ROOT, f).replaceAll("\\", "/"))
  .filter((rel) => rel.endsWith("index.html"))
  .map(routeOf));

const wanted = new Map();
const dropped = [];
for (const members of clusters) {
  const live = Object.entries(members).filter(([, route]) => exists.has(route));
  for (const [lang, route] of Object.entries(members)) {
    if (!exists.has(route)) dropped.push(`${lang}:${route}`);
  }
  if (live.length < 2) continue;
  const ordered = ORDER.filter((lang) => live.some(([l]) => l === lang))
    .map((lang) => [lang, live.find(([l]) => l === lang)[1]]);
  const xDefault = (ordered.find(([lang]) => lang === "de") ?? ordered[0])[1];
  const tags = ordered
    .map(([lang, route]) => `<link rel="alternate" hreflang="${HREFLANG[lang]}" href="${BASE}${route}">`)
    .join("") + `<link rel="alternate" hreflang="x-default" href="${BASE}${xDefault}">`;
  for (const [, route] of ordered) wanted.set(route, tags);
}

let changed = 0;
let skippedNoindex = 0;
const stale = [];
for (const [route, tags] of wanted) {
  const file = join(ROOT, route, "index.html");
  const html = await readFile(file, "utf8");
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) { skippedNoindex += 1; continue; }
  // replace whatever alternate set is there, wherever it sits, with this one
  const stripped = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, "");
  const next = stripped.replace(/(<link rel="canonical"[^>]*>)/, `$1${tags}`);
  if (next === html) continue;
  if (!next.includes(tags)) { stale.push(route); continue; }
  if (!CHECK_ONLY) await writeFile(file, next, "utf8");
  changed += 1;
}

/* Anything else carrying an alternate set has one written by an earlier
   generator — several German pages pointed at a single English hub, which is a
   many-to-one relationship and not an equivalence. Those sets are removed. */
let strippedStale = 0;
for (const file of await walk(ROOT)) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (!rel.endsWith("index.html")) continue;
  const route = routeOf(rel);
  if (wanted.has(route)) continue;
  const html = await readFile(file, "utf8");
  if (!html.includes('rel="alternate" hreflang=')) continue;
  const next = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, "");
  if (next === html) continue;
  if (!CHECK_ONLY) await writeFile(file, next, "utf8");
  strippedStale += 1;
}

const report = {
  clusters_built: clusters.length,
  routes_in_a_cluster: wanted.size,
  pages_rewritten: changed,
  skipped_noindex: skippedNoindex,
  members_missing_on_disk: dropped.length,
  pages_without_canonical_anchor: stale.length,
  stale_sets_removed: strippedStale,
};
console.log(JSON.stringify(report));
if (stale.length) {
  console.error(`No canonical tag to anchor hreflang on:\n${stale.slice(0, 10).join("\n")}`);
  process.exit(1);
}
if (CHECK_ONLY && (changed || strippedStale)) {
  console.error(`${changed} page(s) have an hreflang set that does not match the cluster map.`);
  process.exit(1);
}
