#!/usr/bin/env node
/* The Impressum (legal/impressum/) from data/company.json.

   The page was baked by the retired generate_scale_v3.py with a placeholder
   body and has no generator of its own; this pass replaces the <main> of the
   existing file, keeping its head, navigation and footer, so the page is
   rendered from data from now on. A field that data/company.json leaves null
   is listed under "Noch zu ergänzen" rather than left out silently, and the
   notice at the top stays until nothing is listed there. Whether the page is
   indexed is decided by build-seo-governance-v7.mjs (INCOMPLETE_LEGAL), which
   runs after this pass.

   Idempotent: the same data produces the same bytes.
   Usage: node tools/build-impressum.mjs */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "legal/impressum/index.html");
const C = JSON.parse(await readFile(join(ROOT, "data/company.json"), "utf8"));
const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const missing = [
  [C.representatives, "Vertretungsberechtigte Person(en) (Geschäftsführer / Müdür)"],
  [C.trade_register ?? C.mersis, "Handelsregister- bzw. MERSİS-Nummer"],
  [null, "Gegebenenfalls Niederlassung oder Bevollmächtigter in der EU"],
].filter(([v]) => !v).map(([, label]) => label);

const a = C.address;
const tel = C.phone.replace(/\s+/g, "");
const main = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="../../index.html">Startseite</a> · Impressum</div><h1>Impressum</h1><p>Anbieterkennzeichnung nach § 5 DDG.</p></div></header>` +
  `<section class="section"><div class="container"><div class="article-content" style="max-width:850px">` +
  (missing.length > 1 ? `<div class="notice"><strong>Einzelne Angaben werden noch ergänzt.</strong> Firmierung, Anschrift, Steuernummer und MERSİS-Nummer stehen fest; die unten unter „Noch zu ergänzen“ genannten Angaben folgen. Bis dahin ist diese Seite von der Suchindexierung ausgenommen.</div>\n` : "") +
  `<h2>Anbieter</h2><p><strong>${esc(C.legal_name)}</strong><br>${esc(C.legal_form.de)}<br>${esc(a.street)}<br>${esc(a.district)} / ${esc(a.province)}<br>${esc(a.country.de)}</p>` +
  `<p>${esc(C.brand)} ist eine Marke der ${esc(C.legal_name)}.</p>\n` +
  (C.history ? `<h2>Unternehmen</h2><p>Gegründet ${C.history.founded} in ${esc(C.history.founded_place)}. Seit ${C.history.founded} fertigt das Unternehmen Tiny Houses und modulare Bauten. Die erste Ausfuhr ging ${C.history.first_export.year} nach ${esc(C.history.first_export.destination_de)}; seitdem wurden mehr als ${esc(C.history.units_shipped_since_2019.replace('+',''))} Tiny Houses ausgeliefert.</p>\n` : "") +
  `<h2>Kontakt</h2><p>E-Mail: <a href="mailto:${esc(C.email)}">${esc(C.email)}</a><br>Telefon und WhatsApp: <a href="tel:${esc(tel)}">${esc(C.phone)}</a></p>\n` +
  (C.representatives ? `<h2>Vertretungsberechtigt</h2><p>${esc(C.representatives)}</p>\n` : "") +
  `<h2>Steuerliche Angaben</h2><p>Steuernummer (Vergi Kimlik No.): ${esc(C.tax_number)}<br>Zuständiges Finanzamt: ${esc(C.tax_office)}</p>\n` +
  (C.trade_register || C.mersis ? `<h2>Registereintrag</h2><p>${C.trade_register ? `Handelsregister: ${esc(C.trade_register)}<br>` : ""}${C.mersis ? `MERSİS-Nr.: ${esc(C.mersis)}` : ""}</p>\n` : "") +
  (missing.length ? `<h2>Noch zu ergänzen</h2><ul>${missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>\n` : "") +
  `<h2>Verbraucherstreitbeilegung</h2><p>Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.</p>\n` +
  `<h2>Haftung für Inhalte und Links</h2><p>Die Inhalte dieser Seiten – insbesondere Angaben zu Genehmigung, Transport, Zoll und Steuern – sind allgemeine Orientierung und keine Rechts-, Ingenieur- oder Steuerberatung. Verbindlich entscheidet die jeweils zuständige Behörde am konkreten Standort. Für die Inhalte verlinkter externer Seiten sind deren Betreiber verantwortlich.</p></div></div></section></main>`;

const schema = { "@context": "https://schema.org", "@type": "Organization", name: C.brand, legalName: C.legal_name, url: "https://modunera.com/", email: C.email, telephone: C.phone, taxID: C.tax_number, ...(C.history ? { foundingDate: String(C.history.founded), foundingLocation: C.history.founded_place } : {}), ...(C.mersis ? { identifier: { "@type": "PropertyValue", propertyID: "MERSİS", value: C.mersis } } : {}),
  address: { "@type": "PostalAddress", streetAddress: a.street, addressLocality: a.district, addressRegion: a.province, addressCountry: a.country_code } };
const schemaTag = `<script type="application/ld+json" data-company>${JSON.stringify(schema)}</script>`;

const html = await readFile(FILE, "utf8");
let next = html.replace(/<main id="main">[\s\S]*?<\/main>/, main);
next = next.includes("data-company>") ? next.replace(/<script type="application\/ld\+json" data-company>[\s\S]*?<\/script>/, schemaTag) : next.replace("</head>", `${schemaTag}</head>`);
if (!next.includes(C.tax_number)) { console.error("build-impressum: <main> not found in legal/impressum/index.html"); process.exit(1); }
const changed = next !== html;
if (changed) await writeFile(FILE, next, "utf8");
console.log(JSON.stringify({ page: "legal/impressum/", changed, still_missing: missing.length }));
