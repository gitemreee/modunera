#!/usr/bin/env node
/* The budget bands on the enquiry form, from data/pricing.json.

   They opened at "Unter 60.000 €" while every one of the eight models is an
   ex-works indication between 42.900 € and 54.900 €, so every enquiry landed in
   the first band and the field sorted nobody. Bands that do not discriminate
   are worse than no field: they cost the visitor a decision and tell us
   nothing.

   The new bands live beside the prices they are derived from, so the next
   price change has the bands in front of it. No generator owns /kontakt/ — it
   is one of the pages baked by the retired generate_scale_v3.py — which is why
   this is a pass rather than part of a page builder.

   Idempotent: the select is rewritten only when it differs.

   Usage: node tools/build-budget-bands.mjs
*/
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "kontakt/index.html";
const SELECT = /<select name="Budget">[\s\S]*?<\/select>/;

const pricing = JSON.parse(await readFile(join(ROOT, "data/pricing.json"), "utf8"));
const bands = pricing.enquiry_budget_bands?.de;
if (!bands?.length) {
  console.error("build-budget-bands: data/pricing.json has no enquiry_budget_bands.de");
  process.exit(1);
}

const html = await readFile(join(ROOT, PAGE), "utf8");
if (!SELECT.test(html)) {
  console.error(`build-budget-bands: no Budget select found on ${PAGE}`);
  process.exit(1);
}
const next = html.replace(SELECT, `<select name="Budget">${bands.map((b) => `<option>${b}</option>`).join("")}</select>`);
const changed = next !== html;
if (changed) await writeFile(join(ROOT, PAGE), next, "utf8");
console.log(JSON.stringify({ page: PAGE, bands: bands.length, changed }));
