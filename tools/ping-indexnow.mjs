#!/usr/bin/env node
/* IndexNow: tell Bing-family engines about the indexable URL set.

   WHY IT EXISTS

   The owner's ask on 2026-08-28 was speed: pages are in Google but new and
   re-opened pages crawl slowly, and the AI answer engines that matter for GEO —
   Copilot, and the retrieval behind several chat products — read Bing's index.
   Google exposes no submission API for a normal site; Bing, Seznam, Naver and
   Yandex share IndexNow, which does exactly this: push the URL list, instantly.

   The key is meant to be public — the protocol verifies ownership by fetching
   https://modunera.com/<key>.txt, which this repository serves as a root file.
   It is not a secret and does not belong in the environment.

   The whole sitemap is submitted each time. IndexNow explicitly tolerates
   resubmission, the set is ~1,800 URLs against a 10,000-per-call limit, and
   picking only changed URLs would mean trusting a diff where a full list costs
   one request.

   Usage: node tools/ping-indexnow.mjs          (after a deploy)
          node tools/ping-indexnow.mjs --dry    (print the payload, send nothing)
*/
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const KEY = "be0c39ed85ccce8a829cd586e117662b";
const HOST = "modunera.com";
const DRY = process.argv.includes("--dry");

const urls = [];
for (const f of await readdir(join(ROOT, "sitemaps"))) {
  if (!f.endsWith(".xml")) continue;
  const xml = await readFile(join(ROOT, "sitemaps", f), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
}
if (!urls.length) { console.error("no URLs in sitemaps/ — refusing to ping"); process.exit(1); }

const payload = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls };
if (DRY) { console.log(JSON.stringify({ urls: urls.length, sample: urls.slice(0, 3) })); process.exit(0); }

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
/* 200 and 202 are both success; anything else is worth seeing in the log but
   must not fail a publish that already happened. */
console.log(JSON.stringify({ submitted: urls.length, status: res.status }));
