#!/usr/bin/env node
/* The `about` node on a location page names a topic, not a product.

   Search Console raised "offers, review or aggregateRating should be specified"
   on 5 October 2026. The cause was one nested node, repeated across the whole
   location tree:

     "about":{"@type":"Product","name":"Tiny House für X",
              "brand":{"@type":"Brand","name":"MODUNERA"}}

   Google reads nested Product nodes and applies the product-snippet rules to
   them, so every location page declared a product with no offer, no review and
   no rating. The fix is not to invent an offer: a location page is not a
   product, there is no SKU for Schmidmühlen and no price that belongs to it.
   The eight model pages are the products and they already carry proper Offer
   nodes.

   tools/build-modunera-europe.mjs was corrected at source, which fixed the
   3,554 city pages it still generates. The remaining ~7,400 are the last of the
   HTML baked by the retired tools/generate_scale_v3.py; no generator owns them,
   which is why the source fix did not reach them. Rather than resurrect that
   script, this rewrites the node in place.

   Rules it keeps:

     - the match is the exact JSON shape above, so a Product node that carries a
       real offer — the model pages, the comparison list — is never touched;
     - `brand` is dropped with the Product, because brand is not a property of
       Thing and the Organization node establishes it site-wide anyway;
     - a page already carrying Thing is left alone, so a second run changes
       nothing.

   Usage: node tools/build-about-topic.mjs
*/
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set([".git", "node_modules", "tools", "data", "social", "assets", "build"]);

// "about":{"@type":"Product","name":"<anything but a quote>","brand":{"@type":"Brand","name":"MODUNERA"}}
const PATTERN = /"about":\{"@type":"Product","name":("(?:[^"\\]|\\.)*"),"brand":\{"@type":"Brand","name":"MODUNERA"\}\}/g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      yield* walk(join(dir, entry.name));
    } else if (entry.name.endsWith(".html")) {
      yield join(dir, entry.name);
    }
  }
}

const report = { scanned: 0, changed: 0, nodes: 0 };

for await (const file of walk(ROOT)) {
  report.scanned += 1;
  const html = await readFile(file, "utf8");
  if (!html.includes('"about":{"@type":"Product"')) continue;
  let hits = 0;
  const next = html.replace(PATTERN, (_m, name) => {
    hits += 1;
    return `"about":{"@type":"Thing","name":${name}}`;
  });
  if (!hits) continue;
  await writeFile(file, next);
  report.changed += 1;
  report.nodes += hits;
}

console.log(JSON.stringify(report));
