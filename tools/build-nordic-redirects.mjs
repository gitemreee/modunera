#!/usr/bin/env node
/* 301s for the Danish location URLs whose slug was corrected.

   slugify() transliterated the German umlauts but not æ, ø and å, so every
   Danish place containing one lost a character: Allerød was published as
   "aller-d", Åkirkeby as "akirkeby", Brøndby Strand as "br-ndby-strand".
   Those URLs are indexed, so they redirect rather than 404.

   The old form is derivable from the corrected one: each of ae, oe and aa was a
   single Nordic letter that became "-", and a leading one was stripped with the
   leading hyphen. This walks the corrected directories, reconstructs the forms
   the old function would have produced, and writes a rule for each that differs.

   Output is public/_redirects style, written to the repository root as
   `_redirects`, which Netlify reads alongside netlify.toml and which handles a
   long literal list better than TOML blocks.

   Usage: node tools/build-nordic-redirects.mjs
*/
import { readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TREES = ["standorte/daenemark", "en/locations/denmark"];

/* Every way the previous slugify could have rendered this name. A Nordic letter
   inside the word became "-", one at the start vanished with the leading hyphen.

   TWO CASES THIS MISSED, BOTH FOUND IN SEARCH CONSOLE AS LIVE 404s

   The first version replaced one occurrence at a time, so a name with two Nordic
   letters never got the form where both were replaced. Skælskør has an æ and an
   ø: the old slugify wrote "sk-lsk-r", and the rules covered only "sk-lskoer"
   and "skaelsk-r". Google still has "sk-lsk-r" and it 404s. Every subset of the
   occurrences is now generated, not one at a time.

   The second: two Nordic letters landing next to a word break produced two
   hyphens, and a slugify that collapses runs wrote one. Thurø By became
   "thur--by" here and "thur-by" in the index. Both forms are emitted now.

   The subsets are capped: a Danish place slug has at most a handful of these,
   and 2^n on an unexpected input is not a risk worth taking for a redirect file. */
const MAX_SUBSTITUTIONS = 6;

function previousForms(slug) {
  /* Where each replaceable pair sits, left to right, non-overlapping. */
  const spots = [];
  for (let i = 0; i < slug.length && spots.length < MAX_SUBSTITUTIONS; ) {
    const pair = ["ae", "oe", "aa"].find((p) => slug.startsWith(p, i));
    if (pair) { spots.push({ index: i, length: pair.length }); i += pair.length; }
    else i += 1;
  }
  const forms = new Set();
  for (let mask = 1; mask < (1 << spots.length); mask += 1) {
    let out = "";
    let cursor = 0;
    spots.forEach((spot, n) => {
      if (!(mask & (1 << n))) return;
      out += slug.slice(cursor, spot.index);
      out += out.length === 0 ? "" : "-";
      cursor = spot.index + spot.length;
    });
    out += slug.slice(cursor);
    forms.add(out);
    /* and the same with hyphen runs collapsed */
    forms.add(out.replace(/-{2,}/g, "-"));
  }
  forms.delete(slug);
  return [...forms]
    .map((form) => form.replace(/^-+/, "").replace(/-+$/, ""))
    .filter((form) => form && form !== slug);
}

async function directories(path) {
  return (await readdir(join(ROOT, path), { withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

const rules = [];
for (const tree of TREES) {
  for (const region of await directories(tree)) {
    for (const form of previousForms(region)) {
      rules.push([`/${tree}/${form}/*`, `/${tree}/${region}/:splat`]);
    }
    for (const place of await directories(`${tree}/${region}`)) {
      for (const form of previousForms(place)) {
        rules.push([`/${tree}/${region}/${form}/`, `/${tree}/${region}/${place}/`]);
      }
    }
  }
}

/* URL consolidations. Not Nordic slugs, but this generator owns _redirects, and
   a second writer of the same file would be a race. Each pair is a page that was
   removed because it duplicated the survivor:
   - /studio/ and /konfigurator/ were one configurator at two URLs with identical
     <title>s and 94% identical main content (6-gram Jaccard, measured 2026-08-25).
     Both carried ~3,100 internal links each. konfigurator survives: it is the
     word German buyers actually search.
   - /tiny-house-deutschland/ targeted the same query family as the Germany hub
     /laender/deutschland/, which carries twice its internal links and the
     five-language cluster. The hub survives. */
const CONSOLIDATIONS = [
  ["/studio/", "/konfigurator/"],
  ["/tiny-house-deutschland/", "/laender/deutschland/"],
  /* The guide pruning, 2026-08-25. Fifty topics each held a -leitfaden and a
     -fehler-checkliste on one search intent (intra-family duplication measured
     0.29-0.55 six-gram Jaccard - CONTENT_PRUNING_PLAN.md). The surviving guide
     absorbed the mistakes material whole, so nothing a reader could find on the
     redirected page is missing from its target. Where a topic also had a bare
     overview slug, the bare slug survives - it is the URL the query matches -
     and renders as the full guide now that the -leitfaden variant is gone. */
  ["/blog/tiny-house-abwasser-fehler-checkliste/", "/blog/tiny-house-abwasser-leitfaden/"],
  ["/blog/tiny-house-airbnb-fehler-checkliste/", "/blog/tiny-house-airbnb-leitfaden/"],
  ["/blog/tiny-house-akustik-fehler-checkliste/", "/blog/tiny-house-akustik-leitfaden/"],
  ["/blog/tiny-house-auf-raedern-fehler-checkliste/", "/blog/tiny-house-auf-raedern/"],
  ["/blog/tiny-house-auf-raedern-leitfaden/", "/blog/tiny-house-auf-raedern/"],
  ["/blog/tiny-house-bad-fehler-checkliste/", "/blog/tiny-house-bad-leitfaden/"],
  ["/blog/tiny-house-baugenehmigung-fehler-checkliste/", "/blog/tiny-house-baugenehmigung-leitfaden/"],
  ["/blog/tiny-house-brandschutz-fehler-checkliste/", "/blog/tiny-house-brandschutz-leitfaden/"],
  ["/blog/tiny-house-chalet-fehler-checkliste/", "/blog/tiny-house-chalet-leitfaden/"],
  ["/blog/tiny-house-daemmung-fehler-checkliste/", "/blog/tiny-house-daemmung-leitfaden/"],
  ["/blog/tiny-house-energieverbrauch-fehler-checkliste/", "/blog/tiny-house-energieverbrauch-leitfaden/"],
  ["/blog/tiny-house-familie-fehler-checkliste/", "/blog/tiny-house-familie-leitfaden/"],
  ["/blog/tiny-house-fenster-fehler-checkliste/", "/blog/tiny-house-fenster-leitfaden/"],
  ["/blog/tiny-house-ferienpark-fehler-checkliste/", "/blog/tiny-house-ferienpark-leitfaden/"],
  ["/blog/tiny-house-feuchteschutz-fehler-checkliste/", "/blog/tiny-house-feuchteschutz-leitfaden/"],
  ["/blog/tiny-house-finanzierung-fehler-checkliste/", "/blog/tiny-house-finanzierung-leitfaden/"],
  ["/blog/tiny-house-gaestehaus-fehler-checkliste/", "/blog/tiny-house-gaestehaus-leitfaden/"],
  ["/blog/tiny-house-gastronomie-fehler-checkliste/", "/blog/tiny-house-gastronomie-leitfaden/"],
  ["/blog/tiny-house-glamping-fehler-checkliste/", "/blog/tiny-house-glamping-leitfaden/"],
  ["/blog/tiny-house-grundriss-fehler-checkliste/", "/blog/tiny-house-grundriss-leitfaden/"],
  ["/blog/tiny-house-grundstueck-fehler-checkliste/", "/blog/tiny-house-grundstueck-leitfaden/"],
  ["/blog/tiny-house-heizung-fehler-checkliste/", "/blog/tiny-house-heizung-leitfaden/"],
  ["/blog/tiny-house-homeoffice-fehler-checkliste/", "/blog/tiny-house-homeoffice-leitfaden/"],
  ["/blog/tiny-house-import-tuerkei-fehler-checkliste/", "/blog/tiny-house-import-tuerkei-leitfaden/"],
  ["/blog/tiny-house-kaufen-fehler-checkliste/", "/blog/tiny-house-kaufen-leitfaden/"],
  ["/blog/tiny-house-kueche-fehler-checkliste/", "/blog/tiny-house-kueche-leitfaden/"],
  ["/blog/tiny-house-loft-fehler-checkliste/", "/blog/tiny-house-loft-leitfaden/"],
  ["/blog/tiny-house-lueftung-fehler-checkliste/", "/blog/tiny-house-lueftung-leitfaden/"],
  ["/blog/tiny-house-modern-fehler-checkliste/", "/blog/tiny-house-modern-leitfaden/"],
  ["/blog/tiny-house-nachhaltigkeit-fehler-checkliste/", "/blog/tiny-house-nachhaltigkeit/"],
  ["/blog/tiny-house-nachhaltigkeit-leitfaden/", "/blog/tiny-house-nachhaltigkeit/"],
  ["/blog/tiny-house-off-grid-fehler-checkliste/", "/blog/tiny-house-off-grid-leitfaden/"],
  ["/blog/tiny-house-preise-fehler-checkliste/", "/blog/tiny-house-preise-leitfaden/"],
  ["/blog/tiny-house-reinigung-fehler-checkliste/", "/blog/tiny-house-reinigung-leitfaden/"],
  ["/blog/tiny-house-rendite-fehler-checkliste/", "/blog/tiny-house-rendite-leitfaden/"],
  ["/blog/tiny-house-scandinavian-fehler-checkliste/", "/blog/tiny-house-scandinavian-leitfaden/"],
  ["/blog/tiny-house-senioren-fehler-checkliste/", "/blog/tiny-house-senioren-leitfaden/"],
  ["/blog/tiny-house-smart-home-fehler-checkliste/", "/blog/tiny-house-smart-home-leitfaden/"],
  ["/blog/tiny-house-solar-fehler-checkliste/", "/blog/tiny-house-solar-leitfaden/"],
  ["/blog/tiny-house-sommerhitze-fehler-checkliste/", "/blog/tiny-house-sommerhitze-leitfaden/"],
  ["/blog/tiny-house-stahlrahmen-fehler-checkliste/", "/blog/tiny-house-stahlrahmen-leitfaden/"],
  ["/blog/tiny-house-stauraum-fehler-checkliste/", "/blog/tiny-house-stauraum-leitfaden/"],
  ["/blog/tiny-house-stellplatz-fehler-checkliste/", "/blog/tiny-house-stellplatz-leitfaden/"],
  ["/blog/tiny-house-strom-fehler-checkliste/", "/blog/tiny-house-strom-leitfaden/"],
  ["/blog/tiny-house-thermowood-fehler-checkliste/", "/blog/tiny-house-thermowood-leitfaden/"],
  ["/blog/tiny-house-transport-fehler-checkliste/", "/blog/tiny-house-transport-leitfaden/"],
  ["/blog/tiny-house-versicherung-fehler-checkliste/", "/blog/tiny-house-versicherung-leitfaden/"],
  ["/blog/tiny-house-vs-modulhaus-fehler-checkliste/", "/blog/tiny-house-vs-modulhaus-leitfaden/"],
  ["/blog/tiny-house-vs-wohnwagen-fehler-checkliste/", "/blog/tiny-house-vs-wohnwagen-leitfaden/"],
  ["/blog/tiny-house-wartung-fehler-checkliste/", "/blog/tiny-house-wartung-leitfaden/"],
  ["/blog/tiny-house-wasser-fehler-checkliste/", "/blog/tiny-house-wasser-leitfaden/"],
  ["/blog/tiny-house-winterfest-fehler-checkliste/", "/blog/tiny-house-winterfest-leitfaden/"],
];
for (const [from, to] of CONSOLIDATIONS) rules.push([from, to]);

rules.sort(([a], [b]) => a.localeCompare(b, "en"));
const width = Math.max(...rules.map(([from]) => from.length));
const body = [
  "# Danish location URLs whose slug lost a Nordic letter before the transliteration",
  "# in tools/build-modunera-europe.mjs was corrected. Generated by",
  "# tools/build-nordic-redirects.mjs — do not edit by hand.",
  "",
  ...rules.map(([from, to]) => `${from.padEnd(width)}  ${to}  301!`),
  "",
].join("\n");

await writeFile(join(ROOT, "_redirects"), body, "utf8");
console.log(JSON.stringify({ rules: rules.length, file: "_redirects" }));
