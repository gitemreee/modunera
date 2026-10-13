#!/usr/bin/env node
/* An enquiry form on the pages that actually get the traffic.

   Before this, the whole site had one lead form — /kontakt/ — and that page
   draws no impressions at all in the October Search Console export. Every other
   page, all 15,140 of them, offered exactly one way to make contact: a WhatsApp
   link to a Turkish mobile number. The configurator ends there too.

   Location pages carry 86% of the property's clicks. A German buyer weighing a
   45,000 € purchase was being asked to open WhatsApp to a foreign number or
   leave. That is not a ranking problem and no amount of further SEO fixes it.

   The submit path already exists: assets/js/main.js posts any
   form[data-lead-form][data-netlify] to Netlify Forms over AJAX under the
   form-name registered at build time by /kontakt/, and still opens WhatsApp
   afterwards for anyone who prefers it. So this adds markup, not machinery, and
   Netlify does not have to detect a form on eleven thousand pages.

   Scope. German /standorte/ only, this pass. /en/locations/ ranks better than
   anything else on the site and has no form either, but it also has no English
   privacy page — /legal/datenschutz/ exists in German alone. Putting an English
   form in front of an EU visitor and linking consent to a German-only policy is
   not a thing to do quietly, so the English tree waits for its privacy page.

   The form is shorter than the one on /kontakt/: a visitor who has just landed
   on a town page will not fill in seven fields. Name, e-mail, phone, use and a
   free text, with the place pre-filled from the page's own JSON-LD so the lead
   arrives knowing where it came from.

   Rules it keeps:

     - inserted before </main>, which every page has, and never by position;
     - the place comes from the contentLocation node already in the page, so a
       page whose JSON-LD does not carry one is reported, not guessed at;
     - keyed by id, so a page that already has the block is skipped and a second
       run changes nothing.

   Usage: node tools/build-location-enquiry.mjs
*/
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ID = "ortsanfrage";
const ANCHOR = "</main>";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function walk(dir, out = []) {
  for (const entry of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(rel, out);
    else if (entry.name === "index.html") out.push(rel);
  }
  return out;
}

/* The place as the page itself states it.

   Two sources, because the location tree has two origins. The 3,554 pages
   tools/build-modunera-europe.mjs still writes carry a contentLocation Place —
   "Neu-Ulm, Bayern, Deutschland" — and the town is its first field. The other
   7,478 are the last of the HTML baked by the retired generate_scale_v3.py and
   have no Place node at all; what they do have is the `about` Thing that
   tools/build-about-topic.mjs left them, "Tiny House für Aalen".

   Reading the h1 instead would mean parsing "Tiny House in Aalen kaufen" and
   guessing which words are the name. The about node holds the place and
   nothing else. */
const ABOUT_PREFIX = /^Tiny House für\s+/;

function placeOf(html) {
  const place = html.match(/"contentLocation":\{"@type":"Place","name":"((?:[^"\\]|\\.)*)"/);
  if (place) return place[1].split(",")[0].trim();
  const about = html.match(/"about":\{"@type":"Thing","name":"((?:[^"\\]|\\.)*)"\}/);
  if (about && ABOUT_PREFIX.test(about[1])) return about[1].replace(ABOUT_PREFIX, "").trim();
  return null;
}

function block(place, root) {
  const p = esc(place);
  return `<section class="section section-soft" id="${ID}"><div class="container">` +
    `<form class="editorial-copy" data-lead-form name="projektanfrage" method="POST" data-netlify="true" netlify-honeypot="bot-field">` +
    `<input type="hidden" name="form-name" value="projektanfrage">` +
    `<input type="hidden" name="Lieferort" value="${p}">` +
    `<p style="display:none"><label>Bitte frei lassen<input name="bot-field"></label></p>` +
    `<div class="eyebrow">Anfrage · ${p}</div>` +
    `<h2>Was ist in ${p} geplant?</h2>` +
    `<p>Beschreiben Sie das Projekt in zwei Sätzen. Sie bekommen eine Ersteinschätzung zu Modell, Lieferweg und den nächsten Schritten — keine automatische Preisliste.</p>` +
    `<div class="form-grid">` +
    `<div class="field"><label>Name</label><input name="Name" required></div>` +
    `<div class="field"><label>E-Mail</label><input name="E-Mail" type="email" required></div>` +
    `<div class="field"><label>Telefon / WhatsApp</label><input name="Telefon"></div>` +
    `<div class="field"><label>Nutzung</label><select name="Nutzung"><option>Privates Wohnen</option><option>Ferienhaus</option><option>Airbnb / Glamping</option><option>Homeoffice</option><option>Händler / Distributor</option></select></div>` +
    `<div class="field full"><label>Ihr Projekt</label><textarea name="Projekt" rows="4"></textarea></div>` +
    `</div>` +
    `<div class="save-bar"><div class="field" style="grid-column:1/-1">` +
    `<label style="display:flex;gap:10px;align-items:flex-start;font-weight:400">` +
    `<input type="checkbox" name="Einwilligung" value="ja" required style="margin-top:5px">` +
    `<span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert werden. Details in der <a href="${root}legal/datenschutz/" style="text-decoration:underline">Datenschutzerklärung</a>.</span>` +
    `</label></div>` +
    `<button class="btn btn-primary">Anfrage senden</button>` +
    `</div>` +
    `<p class="legal-note">Pflichtfelder sind nur Name und E-Mail. Nach dem Absenden öffnet sich zusätzlich WhatsApp mit einer vorbereiteten Nachricht, falls Sie dort weiterschreiben möchten.</p>` +
    `</form></div></section>`;
}

const report = { added: 0, already: 0, no_place: [], no_anchor: [] };

for (const file of await walk("standorte")) {
  const html = await readFile(join(ROOT, file), "utf8");
  if (html.includes(`id="${ID}"`)) { report.already += 1; continue; }
  if (!html.includes(ANCHOR)) { report.no_anchor.push(file); continue; }
  const place = placeOf(html);
  if (!place) { report.no_place.push(file); continue; }
  const depth = file.split("/").length - 1;      // standorte/<region>/<ort>/index.html
  const root = "../".repeat(depth);
  await writeFile(join(ROOT, file), html.replace(ANCHOR, block(place, root) + ANCHOR), "utf8");
  report.added += 1;
}

for (const key of ["no_place", "no_anchor"]) {
  if (report[key].length) {
    console.error(`build-location-enquiry: ${report[key].length} page(s) skipped — ${key}:`);
    for (const f of report[key].slice(0, 5)) console.error(`  ${f}`);
  }
}
console.log(JSON.stringify({ added: report.added, already: report.already,
  no_place: report.no_place.length, no_anchor: report.no_anchor.length }));
