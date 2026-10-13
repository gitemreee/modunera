#!/usr/bin/env node
/* The privacy notice, in German and English, from data/privacy.json.

   Two reasons this exists rather than two hand-edited pages.

   The German one had gone wrong. It said a project form "sendet keine Daten an
   einen Server" — entries stayed in localStorage and were handed to WhatsApp,
   and nothing was transmitted. That stopped being true when assets/js/main.js
   began posting to Netlify Forms, and it became materially wrong when
   tools/build-location-enquiry.mjs put that form on 10,960 location pages. A
   notice that understates what is processed is the one error on this page that
   carries legal weight, so the text now names Netlify Forms, the data it
   receives, the legal basis and the retention.

   And there was no English one at all, which is why the English location tree
   — the best-ranking part of the site, at positions 1.5 to 3.8 — still has no
   enquiry form: putting a form in front of an EU visitor and linking consent
   to a German-only policy is not something to do quietly.

   How the English page is built. No generator owns the legal pages; they are
   among the last baked by the retired generate_scale_v3.py. Rather than invent
   a shell, this borrows one from an existing English page at the same depth,
   so the navigation, the language switcher and every relative path are the
   ones the rest of /en/ already uses, and replaces the <main>.

   Rules it keeps:

     - content comes from data/privacy.json, so the next person edits data;
     - the German page keeps its own shell and only its <main> is replaced;
     - re-running changes nothing: output is compared before writing.

   Usage: node tools/build-privacy.mjs
*/
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DE_PAGE = "legal/datenschutz/index.html";
const EN_PAGE = "en/legal/privacy/index.html";
const EN_DONOR = "en/guides/customs-import-turkiye-europe/index.html";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function main(copy) {
  const body = copy.sections.map((s) => {
    const li = s.li ? `<ul>${s.li.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const after = (s.after || []).map((x) => `<p>${esc(x)}</p>`).join("");
    return `<h2>${esc(s.h2)}</h2>${s.p.map((x) => `<p>${esc(x)}</p>`).join("")}${li}${after}`;
  }).join("");
  return `<main id="main"><section class="page-hero"><div class="container">` +
    `<h1>${esc(copy.h1)}</h1><p>${esc(copy.lead)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="editorial-copy">${body}</div></div></section></main>`;
}

const swapMain = (html, next) => html.replace(/<main[\s\S]*?<\/main>/, next);

function retitle(html, { title, description, canonical }) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(description)}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(description)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`);
}

async function put(rel, html) {
  const abs = join(ROOT, rel);
  if (existsSync(abs) && (await readFile(abs, "utf8")) === html) return false;
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, html, "utf8");
  return true;
}

const copy = JSON.parse(await readFile(join(ROOT, "data/privacy.json"), "utf8"));
const report = {};

const de = await readFile(join(ROOT, DE_PAGE), "utf8");
report.de = await put(DE_PAGE, swapMain(de, main(copy.de))) ? "written" : "unchanged";

const donor = await readFile(join(ROOT, EN_DONOR), "utf8");
const en = retitle(swapMain(donor, main(copy.en)), {
  title: copy.en.title, description: copy.en.description,
  canonical: "https://modunera.com/en/legal/privacy/",
});
report.en = await put(EN_PAGE, en) ? "written" : "unchanged";

console.log(JSON.stringify(report));
