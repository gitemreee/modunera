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

   Scope. Both location trees. The English one waited a pass: /en/locations/
   ranks better than anything else on the site, at positions 1.5 to 3.8, but
   there was no English privacy page, and putting a form in front of an EU
   visitor with consent linked to a German-only policy is not a thing to do
   quietly. tools/build-privacy.mjs now renders /en/legal/privacy/, so the form
   follows.

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
const ABOUT_PREFIX = /^Tiny (?:House für|house for)\s+/;

function placeOf(html) {
  const place = html.match(/"contentLocation":\{"@type":"Place","name":"((?:[^"\\]|\\.)*)"/);
  if (place) return place[1].split(",")[0].trim();
  const about = html.match(/"about":\{"@type":"Thing","name":"((?:[^"\\]|\\.)*)"\}/);
  if (about && ABOUT_PREFIX.test(about[1])) return about[1].replace(ABOUT_PREFIX, "").trim();
  return null;
}

const COPY = {
  de: {
    privacy: "legal/datenschutz/",
    eyebrow: (p) => `Anfrage · ${p}`,
    h2: (p) => `Was ist in ${p} geplant?`,
    lead: "Beschreiben Sie das Projekt in zwei Sätzen. Sie bekommen eine Ersteinschätzung zu Modell, Lieferweg und den nächsten Schritten — keine automatische Preisliste.",
    name: "Name", email: "E-Mail", phone: "Telefon / WhatsApp", use: "Nutzung",
    project: "Ihr Projekt", submit: "Anfrage senden",
    uses: ["Privates Wohnen", "Ferienhaus", "Airbnb / Glamping", "Homeoffice", "Händler / Distributor"],
    consent: (href) => `Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert werden. Details in der <a href="${href}" style="text-decoration:underline">Datenschutzerklärung</a>.`,
    note: "Pflichtfelder sind nur Name und E-Mail. Nach dem Absenden öffnet sich zusätzlich WhatsApp mit einer vorbereiteten Nachricht, falls Sie dort weiterschreiben möchten.",
  },
  en: {
    privacy: "en/legal/privacy/",
    eyebrow: (p) => `Enquiry · ${p}`,
    h2: (p) => `What are you planning in ${p}?`,
    lead: "Describe the project in two sentences. You get a first assessment of model, delivery route and the next steps — not an automated price list.",
    name: "Name", email: "E-mail", phone: "Phone / WhatsApp", use: "Intended use",
    project: "Your project", submit: "Send enquiry",
    uses: ["Private living", "Holiday home", "Airbnb / glamping", "Home office", "Dealer / distributor"],
    consent: (href) => `I agree that my details may be stored in order to handle my enquiry. Details in the <a href="${href}" style="text-decoration:underline">privacy notice</a>.`,
    note: "Only name and e-mail are required. After sending, WhatsApp also opens with a prepared message in case you would rather continue there.",
  },
};

function block(place, root, lang) {
  const t = COPY[lang];
  const p = esc(place);
  return `<section class="section section-soft" id="${ID}"><div class="container">` +
    `<form class="editorial-copy" data-lead-form name="projektanfrage" method="POST" data-netlify="true" netlify-honeypot="bot-field">` +
    `<input type="hidden" name="form-name" value="projektanfrage">` +
    `<input type="hidden" name="Lieferort" value="${p}">` +
    /* same field list on every projektanfrage variant — see enquiryForm() in
       build-modunera-v2.mjs for why Netlify needs that */
    `<input type="hidden" name="Einheiten" value="">` +
    `<input type="hidden" name="Budget" value="">` +
    `<p style="display:none"><label>Bitte frei lassen<input name="bot-field"></label></p>` +
    `<div class="eyebrow">${t.eyebrow(p)}</div>` +
    `<h2>${t.h2(p)}</h2>` +
    `<p>${t.lead}</p>` +
    `<div class="form-grid">` +
    `<div class="field"><label>${t.name}</label><input name="Name" required></div>` +
    `<div class="field"><label>${t.email}</label><input name="E-Mail" type="email" required></div>` +
    `<div class="field"><label>${t.phone}</label><input name="Telefon"></div>` +
    `<div class="field"><label>${t.use}</label><select name="Nutzung">${t.uses.map((u) => `<option>${u}</option>`).join("")}</select></div>` +
    `<div class="field full"><label>${t.project}</label><textarea name="Projekt" rows="4"></textarea></div>` +
    `</div>` +
    `<div class="save-bar"><div class="field" style="grid-column:1/-1">` +
    `<label style="display:flex;gap:10px;align-items:flex-start;font-weight:400">` +
    `<input type="checkbox" name="Einwilligung" value="ja" required style="margin-top:5px">` +
    `<span>${t.consent(root + t.privacy)}</span>` +
    `</label></div>` +
    `<button class="btn btn-primary">${t.submit}</button>` +
    `</div>` +
    `<p class="legal-note">${t.note}</p>` +
    `</form></div></section>`;
}

const report = { added: 0, updated: 0, already: 0, no_place: [], no_anchor: [] };
/* the block as written by this pass: one section, no section nested inside it */
const BLOCK_RE = new RegExp(`<section class="section section-soft" id="${ID}">[\\s\\S]*?</form></div></section>`);

for (const [dir, lang] of [["standorte", "de"], ["en/locations", "en"]]) {
  for (const file of await walk(dir)) {
    const html = await readFile(join(ROOT, file), "utf8");
    const place = placeOf(html);
    const root = "../".repeat(file.split("/").length - 1);
    if (html.includes(`id="${ID}"`)) {
      /* The block is keyed by id, so a page that has it is not given a second
         one — but the markup is regenerated and swapped in when it differs,
         because the form's field list changes (2026-10-18: Einheiten and
         Budget joined it) and a page keeping the old one would post fields
         Netlify no longer keeps, or lack ones it now expects. */
      if (!place) { report.no_place.push(file); continue; }
      const fresh = html.replace(BLOCK_RE, block(place, root, lang));
      if (fresh === html) { report.already += 1; continue; }
      await writeFile(join(ROOT, file), fresh, "utf8");
      report.updated += 1;
      continue;
    }
    if (!html.includes(ANCHOR)) { report.no_anchor.push(file); continue; }
    if (!place) { report.no_place.push(file); continue; }
    await writeFile(join(ROOT, file), html.replace(ANCHOR, block(place, root, lang) + ANCHOR), "utf8");
    report.added += 1;
  }
}

for (const key of ["no_place", "no_anchor"]) {
  if (report[key].length) {
    console.error(`build-location-enquiry: ${report[key].length} page(s) skipped — ${key}:`);
    for (const f of report[key].slice(0, 5)) console.error(`  ${f}`);
  }
}
console.log(JSON.stringify({ added: report.added, updated: report.updated, already: report.already,
  no_place: report.no_place.length, no_anchor: report.no_anchor.length }));
