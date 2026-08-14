/* ============================================================================
   MODUNERA v2 layer
   ----------------------------------------------------------------------------
   Runs after tools/build-modunera-europe.mjs and owns everything the Europe
   build does not:

     1. one navigation for the whole site. The legacy German pages carried a
        mega-menu while the ~7,257 generated pages carried a flat six-link bar,
        so the country and city landing pages could not reach the models, the
        tools or the 110 guides. Every <nav class="nav"> on the site is replaced
        with the v2 menu.
     2. the pages the site was missing: MD 1-MD 8 comparison, country price
        comparison, tiny-house advantages, and a guide hub with categories that
        finally surfaces the existing German guides.
     3. six new market guides for the Netherlands, Denmark, Luxembourg and
        Switzerland, in German and English.
     4. sitemaps, rebuilt so the new pages are indexed.

   Figures come from data/pricing.json. The build fails if those base prices
   drift from assets/js/configurator.js, so the comparison pages can never
   quote a price the configurator does not charge.
   ============================================================================ */

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const BASE = "https://modunera.com/";
const PHONE_DISPLAY = "+90 553 543 5342";
const PHONE_TEL = "+905535435342";
const WA = "905535435342";
const UPDATED = "2026-08-13";
const SKIP_DIRS = new Set([".git", ".github", "node_modules"]);

const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const canonicalFor = (file) => BASE + file.replace(/index\.html$/, "");
const rootFor = (file) => (dirname(file) === "." ? "" : "../".repeat(dirname(file).split("/").length));
const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
// German pages group with dots, English pages with commas: "7.000 €" reads as
// seven euros to an English speaker, so the separator has to follow the page language.
const eur = (n, lang = "de") => new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB").format(n) + " €";

async function put(file, content) {
  const target = join(ROOT, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

/* --- shared chrome ------------------------------------------------------- */

const schemas = (list) =>
  list.map((e) => `<script type="application/ld+json">${JSON.stringify(e).replaceAll("<", "\\u003c")}</script>`).join("");

function head({ file, lang, title, description, image = "hero-forest.webp", alternateDe, alternateEn, schema = [] }) {
  const root = rootFor(file);
  const canonical = canonicalFor(file);
  const locale = lang === "de" ? "de_DE" : "en_GB";
  return `<!doctype html><html lang="${lang === "de" ? "de-DE" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="theme-color" content="#C29B72"><link rel="canonical" href="${canonical}">${alternateDe ? `<link rel="alternate" hreflang="de" href="${alternateDe}">` : ""}${alternateEn ? `<link rel="alternate" hreflang="en" href="${alternateEn}">` : ""}${alternateDe ? `<link rel="alternate" hreflang="x-default" href="${alternateDe}">` : ""}<link rel="stylesheet" href="${root}assets/css/styles.css"><link rel="icon" type="image/png" href="${root}assets/brand/modunera-mark-v1.png"><meta property="og:type" content="website"><meta property="og:site_name" content="MODUNERA"><meta property="og:locale" content="${locale}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${BASE}assets/images/gallery/${image}"><meta name="twitter:card" content="summary_large_image">${schemas(schema)}</head><body>`;
}

/* --- navigation ----------------------------------------------------------
   One menu for all 14,800+ pages. Dropdown parents are <button> elements, which
   is what assets/js/main.js already wires up, so no script change is needed.
   Exactly one bare "laender/" and one bare "leistungen/" link is emitted, which
   is what tools/validate-modunera.mjs asserts for the homepage.            */

const MENU = {
  de: {
    skip: "Zum Inhalt springen",
    label: "Hauptnavigation",
    home: "index.html",
    toggle: "Menü öffnen",
    switchTo: "en/",
    cta: "WhatsApp",
    ctaMsg: "Hallo MODUNERA, ich wünsche eine schnelle Ersteinschätzung für mein Tiny-House-Projekt.",
    items: [
      { label: "Tiny Houses", menu: [
        ["katalog/", "Alle Modelle", "MD 1 bis MD 8"],
        ["modellvergleich/", "Modellvergleich", "Maße, Grundriss, Preis"],
        ["studio/", "Design Studio", "Live konfigurieren"],
        ["konfigurator/", "Konfigurator", "Budget kalkulieren"],
        ["tiny-house-preise/", "Preise", "Was kostet ein Tiny House"],
      ]},
      { label: "Länder", menu: [
        ["laender/", "Alle Zielmärkte", "Fünf Länder im Überblick"],
        ["laender/deutschland/", "Deutschland", "Recht, Transport, Regionen"],
        ["laender/niederlande/", "Niederlande", "Omgevingsloket & Provinzen"],
        ["laender/daenemark/", "Dänemark", "Kommune & Regionen"],
        ["laender/luxemburg/", "Luxemburg", "Gemeinde & Kantone"],
        ["laender/schweiz/", "Schweiz", "Kanton & Bewilligung"],
        ["preisvergleich/", "Preisvergleich", "Budget je Zielland"],
        ["standorte/", "Standorte Deutschland", "7.000+ lokale Seiten"],
      ]},
      { label: "Vorteile", href: "vorteile/" },
      { label: "Weitere Bauten", menu: [
        ["leistungen/", "Übersicht", "Modul, Stahl, Bungalow, Möbel"],
        ["leistungen/modulbau/", "Modulbau", "Erweiterbare Raummodule"],
        ["leistungen/stahlbau/", "Stahlbau", "Tragende Konstruktionen"],
        ["leistungen/bungalows/", "Bungalows", "Ebenerdige Einheiten"],
        ["leistungen/moebel-nach-mass/", "Möbel nach Maß", "Küchen und Einbauten"],
      ]},
      { label: "Ratgeber", menu: [
        ["ratgeber/", "Ratgeber-Hub", "110 Beiträge in 9 Kategorien"],
        ["blog/", "Blog", "Alle Beiträge chronologisch"],
        ["blog/europa/", "Europa-Guides", "Recht, Transport, Vergleich"],
        ["ratgeber/genehmigung-und-recht/", "Genehmigung & Recht", "Bauantrag, Stellplatz, Versicherung"],
        ["ratgeber/kosten-und-finanzierung/", "Kosten & Finanzierung", "Preise, Kauf, Rendite"],
        ["faq/", "FAQ", "160 Antworten"],
        ["faq/europa/", "Europa-FAQ", "Genehmigung, Zoll, Lieferung"],
        ["downloads/", "Dokumente", "Pläne und technische Daten"],
      ]},
      { label: "Unternehmen", menu: [
        ["factory/", "Produktion", "Vom Stahl bis zur Übergabe"],
        ["projects/", "Projekte", "Wohnen, Urlaub, Business"],
        ["qualitaet/", "Material & Qualität", "Aufbau und Nachweise"],
        ["nachhaltigkeit/", "Nachhaltigkeit", "Ressourcen und Betrieb"],
        ["standorte/", "Standorte", "7.000+ lokale Seiten"],
        ["tools/", "Planungstools", "Vergleich, Lieferung, Grundstück"],
      ]},
      { label: "Kontakt", href: "kontakt/" },
    ],
  },
  en: {
    skip: "Skip to content",
    label: "Main navigation",
    home: "en/",
    toggle: "Open menu",
    switchTo: "",
    cta: "WhatsApp",
    ctaMsg: "Hello MODUNERA, I would like a quick project assessment for a tiny house.",
    items: [
      { label: "Tiny houses", menu: [
        ["en/model-comparison/", "Model comparison", "MD 1 to MD 8 side by side"],
        ["studio/", "Design studio", "Configure live"],
      ]},
      { label: "Countries", menu: [
        ["en/countries/", "All target markets", "Five countries at a glance"],
        ["en/countries/germany/", "Germany", "Rules, transport, regions"],
        ["en/countries/netherlands/", "Netherlands", "Environment and Planning Act"],
        ["en/countries/denmark/", "Denmark", "Municipality and regions"],
        ["en/countries/luxembourg/", "Luxembourg", "Municipal authorisation"],
        ["en/countries/switzerland/", "Switzerland", "Cantonal permits"],
        ["en/price-comparison/", "Price comparison", "Budget by destination"],
      ]},
      { label: "Advantages", href: "en/advantages/" },
      { label: "Other structures", menu: [
        ["en/services/", "Overview", "Modular, steel, bungalows, furniture"],
        ["en/services/modular-buildings/", "Modular buildings", "Expandable modules"],
        ["en/services/steel-structures/", "Steel structures", "Load-bearing frames"],
        ["en/services/bungalows/", "Bungalows", "Single-level units"],
        ["en/services/bespoke-furniture/", "Bespoke furniture", "Kitchens and built-ins"],
      ]},
      { label: "Guides", menu: [
        ["en/guides/", "Europe guides", "Permits, transport, comparison"],
        ["en/faq/", "FAQ", "Permits, customs, delivery"],
      ]},
      { label: "Contact", href: "kontakt/" },
    ],
  },
};


/* The three market locales (nl, da, fr) are defined in data/locales.json and
   generated by tools/build-modunera-locales.mjs. Their menus are derived from the
   same slugs so the two layers cannot drift. */
const LOCALE_DEFS = JSON.parse(await readFile(join(ROOT, "data/locales.json"), "utf8")).locales;
const LANGUAGES = [
  ["de", "Deutsch", "index.html"],
  ["en", "English", "en/"],
  ...Object.entries(LOCALE_DEFS).map(([code, cfg]) => [code, cfg.label, code + "/"]),
];

for (const [code, cfg] of Object.entries(LOCALE_DEFS)) {
  const p = cfg.paths;
  MENU[code] = {
    skip: cfg.nav.contact,
    label: cfg.label,
    home: code + "/",
    toggle: cfg.nav.contact,
    switchTo: "",
    cta: "WhatsApp",
    ctaMsg: cfg.wa,
    items: [
      { label: cfg.nav.countries, menu: [
        [`${code}/${p.countries}/`, cfg.labels.countries, "MODUNERA"],
        ...Object.keys(cfg.countrySlugs).map((c) => [`${code}/${p.countries}/${cfg.countrySlugs[c]}/`, cfg.countryNames[c], "Tiny House"]),
      ]},
      { label: cfg.nav.services, menu: [
        [`${code}/${p.services}/`, cfg.labels.services, "MODUNERA"],
        ...Object.keys(cfg.serviceSlugs).map((k) => [`${code}/${p.services}/${cfg.serviceSlugs[k]}/`, cfg.serviceNames[k], "MODUNERA"]),
      ]},
      { label: cfg.labels.faq, href: `${code}/${p.faq}/` },
      { label: cfg.nav.contact, href: "kontakt/" },
    ],
  };
}

/* Flags drawn inline: no request, no icon font, crisp at 20px. The picker's
   trigger is the flag of the language being read, so it needs no translation. */
const FLAGS = {
  de: '<svg class="flag" viewBox="0 0 5 3" aria-hidden="true"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
  en: '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><rect width="60" height="30" fill="#012169"/><path d="M0 0 60 30M60 0 0 30" stroke="#fff" stroke-width="6"/><path d="M30 0V30M0 15H60" stroke="#fff" stroke-width="10"/><path d="M30 0V30M0 15H60" stroke="#C8102E" stroke-width="6"/></svg>',
  nl: '<svg class="flag" viewBox="0 0 9 6" aria-hidden="true"><rect width="9" height="2" fill="#AE1C28"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#21468B"/></svg>',
  da: '<svg class="flag" viewBox="0 0 37 28" aria-hidden="true"><rect width="37" height="28" fill="#C8102E"/><rect x="12" width="4" height="28" fill="#fff"/><rect y="12" width="37" height="4" fill="#fff"/></svg>',
  fr: '<svg class="flag" viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>',
};

/* `alternates` carries the per-language URL of the page being rendered, read from
   the hreflang tags the page already declares. Where a language has an equivalent
   page the picker goes straight to it; otherwise it falls back to that language's
   home, so a switch never lands on a 404. */
function nav(root, lang, alternates = {}) {
  const m = MENU[lang];
  const links = m.items
    .map((item) => {
      if (item.href) return `<a href="${root}${item.href}">${item.label}</a>`;
      const entries = item.menu
        .map(([href, title, sub]) => `<a href="${root}${href}"><span>${title}</span><small>${sub}</small></a>`)
        .join("");
      return `<div class="nav-dropdown"><button type="button">${item.label}</button><div class="nav-menu">${entries}</div></div>`;
    })
    .join("");
  const languages = LANGUAGES
    .map(([code, label, href]) => {
      const target = alternates[code] ?? root + href;
      const current = code === lang ? ' aria-current="true"' : "";
      return `<a href="${target}" hreflang="${code}" lang="${code}"${current}>${FLAGS[code]}<span>${label}</span></a>`;
    })
    .join("");
  const picker = `<div class="nav-dropdown lang-dropdown"><button type="button" class="lang-switch" aria-label="Sprache / Language">${FLAGS[lang]}${lang.toUpperCase()}</button><div class="nav-menu">${languages}</div></div>`;
  return `<nav class="nav" aria-label="${m.label}"><div class="container nav-inner">${brandLockup(root, root + m.home, lang)}<div class="nav-links">${links}</div><div class="nav-actions">${picker}<a class="btn btn-primary" href="${waLink(m.ctaMsg)}" target="_blank" rel="noopener">${m.cta}</a><button class="mobile-toggle" aria-label="${m.toggle}">☰</button></div></div></nav>`;
}

function chrome(root, lang, alternates = {}) {
  const m = MENU[lang];
  return `<a class="skip" href="#main">${m.skip}</a><div class="scroll-progress"></div>${nav(root, lang, alternates)}`;
}

/* --- brand assets ---------------------------------------------------------
   assets/brand/ holds the two master files under their original names plus the
   derivatives tools/generate-brand-assets.py produces from them. The old
   assets/images/modunera-logo.png and modunera-mark.png stay in place as legacy
   until every reference has been verified as gone.                          */

const BRAND = "assets/brand/";
const LOGO = "modunera-master-logo-mountain-v1";
const LOGO_W = 600;
const LOGO_H = 151;
const MARK = "modunera-mark-v1.png";

const CLAIM = "Design Your Nature";

function brandLockup(root, href, lang) {
  const src = `${root}${BRAND}${LOGO}`;
  const label = lang === "de" ? "MODUNERA Startseite" : "MODUNERA home";
  // Never lazy: the lockup is above the fold on every page. width/height carry the
  // intrinsic ratio so the header reserves its box before the image arrives.
  // The claim rides inside the link so it stays glued to the lockup at every width.
  return `<a class="brand" href="${href}" aria-label="${label}"><img src="${src}-600.png" srcset="${src}-300.png 300w, ${src}-600.png 600w, ${src}-900.png 900w" sizes="150px" width="${LOGO_W}" height="${LOGO_H}" alt="MODUNERA" decoding="async"><span class="brand-claim">${CLAIM}</span></a>`;
}

/* WhatsApp dock. Replaces the old two-icon rail on every page: a launcher in the
   brand green, and a panel naming what we build so the first message arrives with
   context. It opens itself once per visitor and remembers the dismissal. */
const WA_MARK = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.04 3C8.9 3 3.1 8.8 3.1 15.94c0 2.28.6 4.5 1.74 6.46L3 29.5l7.28-1.9a12.9 12.9 0 0 0 5.76 1.37h.01c7.14 0 12.94-5.8 12.94-12.94C29 8.8 23.18 3 16.04 3Zm0 23.6h-.01c-1.83 0-3.62-.49-5.19-1.42l-.37-.22-3.85 1 1.03-3.75-.24-.39a10.6 10.6 0 0 1-1.63-5.68c0-5.93 4.83-10.76 10.77-10.76 2.88 0 5.58 1.12 7.61 3.16a10.7 10.7 0 0 1 3.15 7.61c0 5.94-4.83 10.75-10.77 10.75Zm5.9-8.05c-.32-.16-1.91-.94-2.21-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.6-.96-.86-1.6-1.92-1.79-2.24-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55l-.62-.01c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.67 0 1.58 1.15 3.1 1.31 3.32.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.91-.78 2.18-1.54.27-.76.27-1.4.19-1.54-.08-.13-.29-.21-.61-.37Z"/></svg>`;

const WA_SERVICES = {
  de: ["Tiny Houses", "Modulbau", "Stahlbau", "Bungalows", "Möbel nach Maß"],
  en: ["Tiny houses", "Modular buildings", "Steel structures", "Bungalows", "Bespoke furniture"],
};

function whatsappDock(lang) {
  const de = lang === "de";
  const message = de
    ? "Hallo MODUNERA. Zielland/Ort: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung."
    : "Hello MODUNERA. Destination/place: __. Intended use: __. People: __. Budget: __. Please send a first assessment.";
  const services = WA_SERVICES[lang].map((s) => `<li>${esc(s)}</li>`).join("");
  return `<div class="wa-dock" id="waDock"><div class="wa-panel" role="dialog" aria-label="${de ? "WhatsApp Kontakt" : "WhatsApp contact"}"><div class="wa-head">${WA_MARK}<div><strong>MODUNERA</strong><span>${de ? "Antwort meist am selben Tag" : "Usually replies the same day"}</span></div><button class="wa-close" type="button" aria-label="${de ? "Schließen" : "Close"}">✕</button></div><div class="wa-body"><p>${de ? "Wir fertigen in eigener Produktion und liefern nach Europa:" : "We manufacture in our own production and deliver across Europe:"}</p><ul class="wa-services">${services}</ul><a class="wa-cta" href="${waLink(message)}" target="_blank" rel="noopener">${WA_MARK}${de ? "Projekt starten" : "Start your project"}</a></div></div><div class="wa-rail"><a class="wa-call" href="tel:${PHONE_TEL}" aria-label="${de ? "Telefon" : "Phone"}">☎</a><button class="wa-launch" type="button" aria-label="${de ? "WhatsApp öffnen" : "Open WhatsApp"}" aria-expanded="false">${WA_MARK}</button></div></div><script>(function(){var d=document.getElementById("waDock");if(!d)return;var b=d.querySelector(".wa-launch"),c=d.querySelector(".wa-close"),K="modunera-wa-dismissed";function set(o){d.classList.toggle("open",o);b.setAttribute("aria-expanded",o?"true":"false")}b.addEventListener("click",function(){set(!d.classList.contains("open"))});c.addEventListener("click",function(){set(false);try{localStorage.setItem(K,"1")}catch(e){}});try{if(!localStorage.getItem(K))setTimeout(function(){set(true)},innerWidth<560?2600:1400)}catch(e){}})();</script>`;
}

function footer(root, lang) {
  const de = lang === "de";
  return `<section class="cta-band"><div class="container cta-inner"><div><h2>${de ? "Projekt in 2 Minuten starten." : "Start your project in two minutes."}</h2><p>${de ? "Zielland, Nutzung und Wunschmodell per WhatsApp senden – wir strukturieren den nächsten Schritt." : "Send your country, intended use and preferred model via WhatsApp and we will structure the next step."}</p></div><a class="btn btn-light" href="${waLink(de ? "Hallo MODUNERA, mein Zielland ist: __. Nutzung: __. Wunschgröße/Modell: __. Bitte kontaktieren Sie mich." : "Hello MODUNERA. Destination country: __. Intended use: __. Preferred size/model: __. Please contact me.")}" target="_blank" rel="noopener">${de ? "WhatsApp-Anfrage →" : "WhatsApp enquiry →"}</a></div></section><footer class="footer"><div class="container"><div class="footer-grid"><div>${brandLockup(root, root + (de ? "index.html" : "en/"), lang)}<p>${de ? "Tiny Houses als Kernprodukt. Dazu Modulbau, Stahlbau, Bungalows und maßgefertigte Möbel – direkt aus eigener Produktion für Europa." : "Tiny houses are our core product, complemented by modular buildings, steel structures, bungalows and bespoke furniture for Europe."}</p><a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></div><div><h4>${de ? "Länder" : "Countries"}</h4><a href="${root}${de ? "laender/deutschland/" : "en/countries/germany/"}">${de ? "Deutschland" : "Germany"}</a><a href="${root}${de ? "laender/niederlande/" : "en/countries/netherlands/"}">${de ? "Niederlande" : "Netherlands"}</a><a href="${root}${de ? "laender/daenemark/" : "en/countries/denmark/"}">${de ? "Dänemark" : "Denmark"}</a><a href="${root}${de ? "laender/luxemburg/" : "en/countries/luxembourg/"}">Luxembourg</a><a href="${root}${de ? "laender/schweiz/" : "en/countries/switzerland/"}">${de ? "Schweiz" : "Switzerland"}</a></div><div><h4>${de ? "Vergleichen" : "Compare"}</h4><a href="${root}${de ? "modellvergleich/" : "en/model-comparison/"}">${de ? "Modellvergleich" : "Model comparison"}</a><a href="${root}${de ? "preisvergleich/" : "en/price-comparison/"}">${de ? "Preisvergleich" : "Price comparison"}</a><a href="${root}${de ? "vorteile/" : "en/advantages/"}">${de ? "Vorteile" : "Advantages"}</a><a href="${root}studio/">Design Studio</a></div><div><h4>${de ? "Wissen" : "Knowledge"}</h4><a href="${root}${de ? "ratgeber/" : "en/guides/"}">${de ? "Ratgeber" : "Guides"}</a><a href="${root}${de ? "blog/europa/" : "en/guides/"}">${de ? "Europa-Guides" : "Europe guides"}</a><a href="${root}${de ? "faq/europa/" : "en/faq/"}">FAQ</a><a href="${root}kontakt/">${de ? "Kontakt" : "Contact"}</a></div></div><div class="footer-bottom"><span>© <span data-year>2026</span> MODUNERA. ${de ? "Alle Rechte vorbehalten." : "All rights reserved."}</span><span>${de ? "Hinweise ersetzen keine Behörden-, Rechts-, Steuer- oder Statikberatung." : "Guidance does not replace authority, legal, tax or structural advice."}</span></div></div></footer>${whatsappDock(lang)}<script src="${root}assets/js/main.js"></script></body></html>`;
}

const faqMarkup = (items) =>
  items.map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span>+</span></button><div class="faq-answer"><p>${esc(a)}</p></div></div>`).join("");

const faqSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

const breadcrumb = (trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: BASE + url })),
});

const disclaimer = (de) =>
  `<p class="legal-note">${de ? `Stand ${UPDATED}. Alle Angaben sind unverbindliche Projektorientierung und keine Rechts-, Behörden-, Statik-, Energie- oder Steuerberatung. Preise sind Indikationen ab Werk; verbindlich ist ausschließlich ein geprüftes Angebot.` : `As of ${UPDATED}. All figures are non-binding project guidance and not legal, authority, structural, energy or tax advice. Prices are ex-works indications; only a checked quotation is binding.`}</p>`;

/* --- pricing, checked against the configurator ---------------------------- */

async function loadPricing() {
  const pricing = JSON.parse(await readFile(join(ROOT, "data/pricing.json"), "utf8"));
  // studio.js is what /studio/ and /konfigurator/ actually load; configurator.js is
  // dead code still in the tree, checked too so the two cannot silently diverge.
  const sources = ["assets/js/studio.js", "assets/js/configurator.js"];
  const drift = [];
  for (const source of sources) {
    const js = await readFile(join(ROOT, source), "utf8");
    const name = source.split("/").pop();
    for (const [id, model] of Object.entries(pricing.models)) {
      const found = js.match(new RegExp(id + ":\\{name:'[^']*',base:(\\d+)"));
      if (!found) drift.push(`${id}: not found in ${name}`);
      else if (Number(found[1]) !== model.base_eur) drift.push(`${id}: ${name} ${found[1]} vs pricing.json ${model.base_eur}`);
    }
    for (const [code, d] of Object.entries(pricing.delivery)) {
      if (!d.tariff) continue;
      const found = js.match(new RegExp("[{,]" + d.tariff + ":(\\d+)"));
      if (!found) drift.push(`delivery ${code}: tariff "${d.tariff}" not found in ${name}`);
      else if (Number(found[1]) !== d.eur) drift.push(`delivery ${code}: ${name} ${found[1]} vs pricing.json ${d.eur}`);
    }
  }
  if (drift.length) throw new Error("pricing.json has drifted from the configurator sources:\n  " + drift.join("\n  "));
  return pricing;
}

const COUNTRY_LABELS = {
  DE: { de: "Deutschland", en: "Germany", deSlug: "deutschland", enSlug: "germany" },
  NL: { de: "Niederlande", en: "Netherlands", deSlug: "niederlande", enSlug: "netherlands" },
  DK: { de: "Dänemark", en: "Denmark", deSlug: "daenemark", enSlug: "denmark" },
  LU: { de: "Luxemburg", en: "Luxembourg", deSlug: "luxemburg", enSlug: "luxembourg" },
  CH: { de: "Schweiz", en: "Switzerland", deSlug: "schweiz", enSlug: "switzerland" },
};

/* --- MD 1-MD 8 comparison ------------------------------------------------- */

function modelComparisonPage(pricing, lang) {
  const de = lang === "de";
  const file = de ? "modellvergleich/index.html" : "en/model-comparison/index.html";
  const root = rootFor(file);
  const models = Object.entries(pricing.models);
  const cheapest = Math.min(...models.map(([, m]) => m.base_eur));

  const rows = models
    .map(([id, m]) => {
      const n = "MD " + id.slice(2);
      return `<tr><td><strong>${n}</strong></td><td>${m.lengths}</td><td>${de ? m.layout_de : m.layout_en}</td><td>${de ? m.focus_de : m.focus_en}</td><td>${de ? m.use_de : m.use_en}</td><td><span class="price-figure">${de ? "ab" : "from"} ${eur(m.base_eur, lang)}</span><span class="price-note">${de ? "ab Werk, Basis" : "ex works, base"}</span></td></tr>`;
    })
    .join("");

  const faqs = de
    ? [
        ["Welches Modell ist das günstigste?", `MD 7 startet mit ${eur(cheapest, lang)} ab Werk in der Basisausstattung. Der Gesamtpreis hängt danach von Länge, Innenausbau, Fassade, Heizung, Energie und Lieferung ab.`],
        ["Worin unterscheiden sich die Modelle wirklich?", "Vor allem im Grundriss: Anzahl der Lofts, ob ein zusätzlicher abgeschlossener Raum vorhanden ist und ob eine Veranda Teil der Konstruktion ist. Die Bauweise, der Stahlrahmen und die Ausstattungslinien sind über alle Modelle vergleichbar."],
        ["Kann ich einen Grundriss anpassen?", "Grundriss-, Material- und Möbelanpassungen sind projektbezogen möglich, weil Rahmen, Hülle, Ausbau und Möbel aus eigener Produktion kommen. Umfang und Auswirkung auf Preis und Termin werden vor der Bestellung schriftlich festgehalten."],
        ["Sind die Preise verbindlich?", "Nein. Es sind Indikationen ab Werk in Basisausstattung. Verbindlich ist ausschließlich ein geprüftes Angebot, das Ausstattung, Transport, Zielland und Baustellenbedingungen berücksichtigt."],
      ]
    : [
        ["Which model is the most affordable?", `MD 7 starts at ${eur(cheapest, lang)} ex works in base specification. The final figure then depends on length, interior, facade, heating, energy and delivery.`],
        ["What actually differs between the models?", "Mainly the layout: the number of lofts, whether a separate enclosed room is included and whether a veranda is part of the structure. Construction, the steel frame and the specification lines are comparable across the range."],
        ["Can a layout be adapted?", "Layout, material and furniture changes are possible per project because the frame, envelope, interior and furniture all come from our own production. Scope and the effect on price and schedule are recorded in writing before ordering."],
        ["Are the prices binding?", "No. They are ex-works indications in base specification. Only a checked quotation that reflects specification, transport, destination country and site conditions is binding."],
      ];

  const title = de ? "Modellvergleich MD 1–MD 8: Maße, Grundriss und Preis | MODUNERA" : "Model comparison MD 1–MD 8: size, layout and price | MODUNERA";
  const description = de
    ? "Alle acht MODUNERA Tiny-House-Modelle im direkten Vergleich: Längen, Grundriss, Ausrichtung, typische Nutzung und Preisindikation ab Werk."
    : "All eight MODUNERA tiny house models side by side: lengths, layout, focus, typical use and ex-works price indication.";

  return (
    head({
      file, lang, title, description, image: "mc1-exterior.webp",
      alternateDe: BASE + "modellvergleich/", alternateEn: BASE + "en/model-comparison/",
      schema: [
        faqSchema(faqs),
        breadcrumb(de ? [["MODUNERA", ""], ["Modellvergleich", "modellvergleich/"]] : [["MODUNERA", "en/"], ["Model comparison", "en/model-comparison/"]]),
        {
          "@context": "https://schema.org", "@type": "ItemList",
          itemListElement: models.map(([id, m], i) => ({
            "@type": "ListItem", position: i + 1, name: "MD " + id.slice(2),
            item: { "@type": "Product", name: "MODUNERA MD " + id.slice(2), brand: { "@type": "Brand", name: "MODUNERA" },
              offers: { "@type": "Offer", priceCurrency: "EUR", price: m.base_eur, availability: "https://schema.org/PreOrder" } },
          })),
        },
      ],
    }) +
    chrome(root, lang) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">${de ? "MODUNERA · Modelle" : "MODUNERA · Models"}</div><div class="eyebrow">${de ? "Acht Ausgangsmodelle" : "Eight base models"}</div><h1>${de ? "MD 1 bis MD 8 im direkten Vergleich." : "MD 1 to MD 8 side by side."}</h1><p>${de ? "Alle Modelle teilen Stahlrahmen, Bauweise und Ausstattungslinien. Der Unterschied liegt im Grundriss und in der Nutzung, für die das Modell ausgelegt ist." : "Every model shares the steel frame, the construction method and the specification lines. What differs is the layout and the use the model is designed for."}</p></div></section>` +
    `<section class="section"><div class="container"><div class="kpi-row"><div class="kpi"><b>8</b><span>${de ? "Ausgangsmodelle" : "Base models"}</span></div><div class="kpi"><b>8–9,70 m</b><span>${de ? "Längenoptionen" : "Length options"}</span></div><div class="kpi"><b>2,55 m</b><span>${de ? "Mobile Breite" : "Mobile width"}</span></div><div class="kpi"><b>${eur(cheapest, lang)}</b><span>${de ? "Einstieg ab Werk" : "Entry, ex works"}</span></div></div>` +
    `<div class="compare"><table><thead><tr><th>${de ? "Modell" : "Model"}</th><th>${de ? "Länge" : "Length"}</th><th>${de ? "Grundriss" : "Layout"}</th><th>${de ? "Ausrichtung" : "Focus"}</th><th>${de ? "Typische Nutzung" : "Typical use"}</th><th>${de ? "Preisindikation" : "Price indication"}</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<div class="answer-box"><strong>${de ? "Was der Preis nicht enthält" : "What the price excludes"}</strong><p>${de ? "Die Indikation gilt ab Werk in Basisausstattung. Transport, Kran, Fundament, Anschlüsse, Zoll, Einfuhrumsatzsteuer und lokale Leistungen kommen projektbezogen hinzu. Der Preisvergleich je Zielland zeigt die Logistikseite." : "The indication is ex works in base specification. Transport, crane, foundation, connections, customs, import VAT and local works are added per project. The country price comparison covers the logistics side."}</p></div>` +
    `<div class="hero-actions"><a class="btn btn-primary" href="${root}${de ? "preisvergleich/" : "en/price-comparison/"}">${de ? "Preisvergleich je Land →" : "Price comparison by country →"}</a><a class="btn btn-outline" href="${root}studio/">${de ? "Im Design Studio konfigurieren" : "Configure in the design studio"}</a><a class="btn btn-outline" href="${waLink(de ? "Hallo MODUNERA, ich vergleiche die Modelle MD 1–MD 8. Zielland: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung." : "Hello MODUNERA, I am comparing models MD 1–MD 8. Destination country: __. Intended use: __. People: __. Budget: __. Please send a first assessment.")}" target="_blank" rel="noopener">${de ? "WhatsApp-Projektcheck" : "WhatsApp project check"}</a></div>` +
    disclaimer(de) +
    `</div></section><section class="section section-soft"><div class="container"><h2>FAQ</h2><div class="faq-list">${faqMarkup(faqs)}</div></div></section></main>` +
    footer(root, lang)
  );
}

/* --- country price comparison --------------------------------------------- */

function priceComparisonPage(pricing, lang) {
  const de = lang === "de";
  const file = de ? "preisvergleich/index.html" : "en/price-comparison/index.html";
  const root = rootFor(file);
  const entry = Math.min(...Object.values(pricing.models).map((m) => m.base_eur));
  const top = Math.max(...Object.values(pricing.models).map((m) => m.base_eur));

  const rows = Object.entries(COUNTRY_LABELS)
    .map(([code, label]) => {
      const d = pricing.delivery[code];
      const name = de ? label.de : label.en;
      const link = root + (de ? `laender/${label.deSlug}/` : `en/countries/${label.enSlug}/`);
      const note = de ? d.note_de : d.note_en;
      const delivery = d.eur
        ? `<span class="price-figure">${eur(d.eur, lang)}</span>${note ? `<span class="price-note">${esc(note)}</span>` : ""}`
        : `<span class="price-figure">${de ? "auf Anfrage" : "on request"}</span><span class="price-note">${esc(note ?? "")}</span>`;
      const from = d.eur ? `<span class="price-figure">${eur(entry + d.eur, lang)}</span><span class="price-note">${de ? "MD 7 Basis + Lieferung" : "MD 7 base + delivery"}</span>` : `<span class="price-figure">${de ? "auf Anfrage" : "on request"}</span>`;
      return `<tr><td><strong><a href="${link}">${name}</a></strong></td><td>${delivery}</td><td>${from}</td><td>${de ? "Ja – Standort- und Nutzungsprüfung bei der zuständigen Stelle" : "Yes – site and use check with the competent authority"}</td></tr>`;
    })
    .join("");

  const modelRows = Object.entries(pricing.models)
    .map(([id, m]) => `<tr><td><strong>MD ${id.slice(2)}</strong></td><td>${m.lengths}</td><td>${de ? m.layout_de : m.layout_en}</td><td><span class="price-figure">${eur(m.base_eur, lang)}</span></td></tr>`)
    .join("");

  const faqs = de
    ? [
        ["Warum unterscheidet sich der Preis je Land?", "Das Modell selbst kostet überall gleich. Unterschiedlich sind Entfernung und Route, damit die Logistik, sowie länderspezifische Abgaben, Anschlüsse und Vorbereitungsarbeiten am Grundstück."],
        ["Sind Zoll und Einfuhrumsatzsteuer enthalten?", "Nein. Zoll, Einfuhrumsatzsteuer und lokale Abgaben hängen von Warenwert, Einfuhrweg und Status im Zielland ab und werden projektbezogen ermittelt. Die EU-Türkei-Zollunion deckt nicht jede Warengruppe gleich ab."],
        ["Was kostet die Vorbereitung des Grundstücks?", "Das ist der am stärksten schwankende Posten. Zufahrt, Kranstellfläche, Fundament oder Punktlager, Strom-, Wasser- und Abwasseranschluss werden lokal beauftragt und sind nicht Teil der Werkspreise."],
        ["Gibt es einen Festpreis?", "Ein Festpreis entsteht erst nach Klärung von Ausstattung, Zielort, Route und Baustellenbedingungen. Bis dahin sind alle Zahlen Indikationen zur Budgetplanung."],
      ]
    : [
        ["Why does the price differ by country?", "The model itself costs the same everywhere. What differs is distance and route, and therefore logistics, plus country-specific duties, connections and site preparation."],
        ["Are customs and import VAT included?", "No. Customs, import VAT and local duties depend on goods value, import route and status in the destination country and are established per project. The EU-Türkiye customs union does not cover every product group identically."],
        ["What does site preparation cost?", "This is the most variable item. Access, crane standing area, foundation or point bearings and electricity, water and wastewater connections are contracted locally and are not part of the ex-works price."],
        ["Is there a fixed price?", "A fixed price only exists once specification, destination, route and site conditions are clarified. Until then every figure is an indication for budget planning."],
      ];

  const title = de ? "Tiny House Preisvergleich: Deutschland, Niederlande, Dänemark, Luxemburg & Schweiz | MODUNERA" : "Tiny house price comparison: Germany, Netherlands, Denmark, Luxembourg & Switzerland | MODUNERA";
  const description = de
    ? "Was kostet ein Tiny House je Zielland? Werkspreis, Lieferindikation und Budgetposten für Deutschland, Niederlande, Dänemark, Luxemburg und die Schweiz im Vergleich."
    : "What does a tiny house cost by destination? Ex-works price, delivery indication and budget items compared for Germany, the Netherlands, Denmark, Luxembourg and Switzerland.";

  return (
    head({
      file, lang, title, description, image: "mc6-exterior.webp",
      alternateDe: BASE + "preisvergleich/", alternateEn: BASE + "en/price-comparison/",
      schema: [
        faqSchema(faqs),
        breadcrumb(de ? [["MODUNERA", ""], ["Preisvergleich", "preisvergleich/"]] : [["MODUNERA", "en/"], ["Price comparison", "en/price-comparison/"]]),
      ],
    }) +
    chrome(root, lang) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">${de ? "MODUNERA · Budget" : "MODUNERA · Budget"}</div><div class="eyebrow">${de ? "Fünf Zielmärkte" : "Five target markets"}</div><h1>${de ? "Was ein Tiny House je Zielland kostet." : "What a tiny house costs by destination."}</h1><p>${de ? "Der Werkspreis ist überall gleich. Unterschiede entstehen bei Logistik, Abgaben und Vorbereitung am Grundstück. Diese Seite trennt die Posten, damit ein Budget belastbar wird." : "The ex-works price is identical everywhere. Differences come from logistics, duties and site preparation. This page separates those items so a budget holds up."}</p></div></section>` +
    `<section class="section"><div class="container"><div class="kpi-row"><div class="kpi"><b>${eur(entry, lang)}</b><span>${de ? "Einstieg ab Werk" : "Entry, ex works"}</span></div><div class="kpi"><b>${eur(top, lang)}</b><span>${de ? "Größtes Basismodell" : "Largest base model"}</span></div><div class="kpi"><b>5</b><span>${de ? "Zielmärkte" : "Target markets"}</span></div><div class="kpi"><b>8</b><span>${de ? "Modelle" : "Models"}</span></div></div>` +
    `<h2>${de ? "Lieferung und Einstiegsbudget je Land" : "Delivery and entry budget by country"}</h2><div class="compare"><table><thead><tr><th>${de ? "Zielland" : "Destination"}</th><th>${de ? "Lieferindikation" : "Delivery indication"}</th><th>${de ? "Einstiegsbudget" : "Entry budget"}</th><th>${de ? "Genehmigungsprüfung nötig" : "Permit check required"}</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<div class="answer-box"><strong>${de ? "Wie diese Zahlen entstehen" : "How these figures are produced"}</strong><p>${de ? "Die Lieferindikationen entsprechen exakt den Tarifen, die der MODUNERA Konfigurator rechnet. Für Luxemburg ist derzeit kein Tarif hinterlegt; die Route wird projektbezogen kalkuliert. Das Einstiegsbudget kombiniert das günstigste Basismodell mit der Lieferindikation und enthält keine Abgaben, kein Fundament und keine Anschlüsse." : "The delivery indications match the tariffs the MODUNERA configurator applies. No tariff is stored for Luxembourg at present; that route is calculated per project. The entry budget combines the most affordable base model with the delivery indication and excludes duties, foundation and connections."}</p></div>` +
    `<h2>${de ? "Modellpreise ab Werk" : "Model prices ex works"}</h2><div class="compare"><table><thead><tr><th>${de ? "Modell" : "Model"}</th><th>${de ? "Länge" : "Length"}</th><th>${de ? "Grundriss" : "Layout"}</th><th>${de ? "Basis ab Werk" : "Base, ex works"}</th></tr></thead><tbody>${modelRows}</tbody></table></div>` +
    `<h2>${de ? "Posten, die jedes Budget braucht" : "Items every budget needs"}</h2><div class="adv-grid">${(de
      ? [["Werkspreis", "Modell, Länge, Innenausbau, Fassade, Heizung, Energie und Möbel in der gewählten Linie."],
         ["Transport & Kran", "Route, Sondertransport falls nötig, Entladung und Positionierung am Zielort."],
         ["Abgaben", "Zoll, Einfuhrumsatzsteuer und lokale Gebühren je nach Zielland und Einfuhrweg."],
         ["Grundstück", "Zufahrt, Fundament oder Punktlager, Strom, Wasser, Abwasser und lokale Genehmigungen."]]
      : [["Ex-works price", "Model, length, interior, facade, heating, energy and furniture in the chosen line."],
         ["Transport & crane", "Route, special transport where required, unloading and positioning on site."],
         ["Duties", "Customs, import VAT and local fees depending on destination and import route."],
         ["Site", "Access, foundation or point bearings, electricity, water, wastewater and local permits."]]
    ).map(([t, p], i) => `<div class="adv-card"><span class="num">0${i + 1}</span><h3>${t}</h3><p>${p}</p></div>`).join("")}</div>` +
    `<div class="hero-actions"><a class="btn btn-primary" href="${waLink(de ? "Hallo MODUNERA. Zielland: __. Ort: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Budget-Ersteinschätzung." : "Hello MODUNERA. Destination country: __. Place: __. Intended use: __. People: __. Budget: __. Please send a first budget assessment.")}" target="_blank" rel="noopener">${de ? "Budget per WhatsApp prüfen" : "Check the budget via WhatsApp"}</a><a class="btn btn-outline" href="${root}${de ? "modellvergleich/" : "en/model-comparison/"}">${de ? "Modelle vergleichen" : "Compare models"}</a></div>` +
    disclaimer(de) +
    `</div></section><section class="section section-soft"><div class="container"><h2>FAQ</h2><div class="faq-list">${faqMarkup(faqs)}</div></div></section></main>` +
    footer(root, lang)
  );
}

/* --- advantages ----------------------------------------------------------- */

const ADVANTAGES = {
  de: [
    ["Kalkulierbares Budget", "Werkspreis, Ausstattungslinie und Lieferung sind vor der Bestellung bezifferbar. Was lokal dazukommt – Fundament, Anschlüsse, Genehmigung – wird getrennt ausgewiesen statt in einer Pauschale zu verschwinden."],
    ["Kurze Fertigungszeit", "Das Haus entsteht im Werk, während das Grundstück vorbereitet wird. Beide Stränge laufen parallel statt nacheinander, und Witterung verzögert die Fertigung nicht."],
    ["Kleiner Fußabdruck", "Weniger Grundfläche bedeutet weniger Versiegelung, geringeren Materialeinsatz und in vielen Fällen ein kleineres oder günstigeres Grundstück."],
    ["Niedriger Energiebedarf", "Eine kompakte Hülle hat wenig Fläche, über die Wärme verloren geht. Mit Dämmung, kontrollierter Lüftung und optionaler Solaranlage bleiben die Betriebskosten überschaubar."],
    ["Nutzung ist wechselbar", "Dasselbe Haus funktioniert als Wohnraum, Ferienvermietung, Homeoffice, Gästehaus oder Bürolösung. Der Nutzungswechsel ist meist eine Genehmigungs-, keine Baufrage."],
    ["Versetzbarkeit", "Je nach Ausführung und Fahrgestell bleibt das Gebäude transportfähig. Das hält Optionen offen, wenn sich Standort oder Lebenssituation ändern."],
    ["Ein Ansprechpartner", "Stahlrahmen, Hülle, Innenausbau und Möbel kommen aus eigener Produktion. Schnittstellen zwischen Gewerken entfallen, Verantwortung bleibt an einer Stelle."],
    ["Dokumentierte Basis", "Grundrisse, Ansichten, Gewichte, Fahrgestelldaten und Ausstattungslisten liegen vor. Damit lässt sich mit Behörden, Statikern und Transporteuren belastbar arbeiten."],
  ],
  en: [
    ["A budget you can calculate", "Ex-works price, specification line and delivery can be quantified before ordering. What is added locally – foundation, connections, permits – is shown separately instead of disappearing into a lump sum."],
    ["Short production time", "The house is built in the factory while the site is prepared. Both run in parallel rather than in sequence, and weather does not delay production."],
    ["A small footprint", "Less floor area means less sealed ground, less material and in many cases a smaller or cheaper plot."],
    ["Low energy demand", "A compact envelope has little surface through which heat escapes. With insulation, controlled ventilation and an optional solar system, running costs stay manageable."],
    ["Use can change", "The same building works as a home, holiday rental, home office, guest house or office solution. Changing the use is usually a permit question rather than a construction one."],
    ["It can be relocated", "Depending on the build and chassis, the building stays transportable. That keeps options open if the site or your situation changes."],
    ["One point of responsibility", "Steel frame, envelope, interior and furniture come from our own production. Interfaces between trades disappear and accountability stays in one place."],
    ["A documented basis", "Floor plans, elevations, weights, chassis data and specification lists exist. That makes working with authorities, structural engineers and hauliers dependable."],
  ],
};

const LIMITS = {
  de: [
    ["Die Genehmigung bleibt standortabhängig", "Räder oder eine kompakte Bauweise befreien nicht von Bauplanungsrecht. Ob ein Vorhaben zulässig ist, entscheidet die zuständige Stelle am konkreten Standort."],
    ["Fläche bleibt Fläche", "Stauraum, große Haushalte und flächenintensive Hobbys sind die reale Grenze. Ein ehrlicher Grundriss-Check vor dem Kauf verhindert Enttäuschungen."],
    ["Transport braucht Zufahrt", "Route, Kurvenradien, Trag­fähigkeit und Kranstellfläche entscheiden mit. Ein schwer erreichbares Grundstück verteuert die Lieferung deutlich."],
    ["Grundstück und Finanzierung sind getrennt", "Das Haus zu bestellen ist der einfachere Teil. Grundstück, Anschlüsse und Finanzierung folgen eigenen Regeln je Land und Kommune."],
    ["Wertentwicklung ist nicht zugesichert", "Vermietungs- und Wiederverkaufserlöse hängen von Lage, Nachfrage und Zustand ab. Zahlen aus Beispielrechnungen sind keine Zusage."],
  ],
  en: [
    ["Permits stay site-specific", "Wheels or a compact build do not remove planning obligations. Whether a project is admissible is decided by the competent authority for that specific site."],
    ["Floor area is still floor area", "Storage, large households and space-hungry hobbies are the real limit. An honest layout check before buying avoids disappointment."],
    ["Transport needs access", "Route, turning radii, load capacity and crane standing area all count. A hard-to-reach plot makes delivery noticeably more expensive."],
    ["Plot and financing are separate", "Ordering the house is the easier part. Plot, connections and financing follow their own rules per country and municipality."],
    ["Value development is not promised", "Rental and resale results depend on location, demand and condition. Figures in example calculations are not a commitment."],
  ],
};

function advantagesPage(pricing, lang) {
  const de = lang === "de";
  const file = de ? "vorteile/index.html" : "en/advantages/index.html";
  const root = rootFor(file);
  const entry = Math.min(...Object.values(pricing.models).map((m) => m.base_eur));

  const faqs = de
    ? [
        ["Lohnt sich ein Tiny House gegenüber einem Neubau?", "Bei kleinem Raumbedarf ist der Einstieg deutlich niedriger und die Bauzeit kürzer. Bei großem Flächenbedarf kehrt sich der Vorteil um: Dann wird der Quadratmeter im konventionellen Bau günstiger."],
        ["Kann man ganzjährig darin wohnen?", "Ja, wenn Dämmung, Feuchteschutz, Lüftung und Heizung auf das Klima am Standort ausgelegt sind. Genau das ist bei einem Vier-Jahreszeiten-Aufbau der entscheidende Unterschied zu einem Freizeitmodell."],
        ["Ist ein Tiny House automatisch genehmigungsfrei?", "Nein. Bei dauerhafter Wohn- oder Gewerbenutzung wird es in der Regel wie ein bauliches Vorhaben behandelt. Die Prüfung erfolgt bei der zuständigen Stelle am Standort."],
        ["Was ist der häufigste Planungsfehler?", "Das Grundstück zu spät zu prüfen. Zufahrt, Aufstellfläche, Anschlüsse und die kommunale Zulässigkeit entscheiden häufiger über ein Projekt als die Modellwahl."],
      ]
    : [
        ["Is a tiny house worth it compared to new construction?", "Where space needs are small, the entry cost is clearly lower and the build time shorter. Where a lot of floor area is needed the advantage reverses and conventional construction becomes cheaper per square metre."],
        ["Can you live in one all year?", "Yes, if insulation, moisture protection, ventilation and heating are designed for the local climate. That is exactly what separates a four-season build from a leisure model."],
        ["Is a tiny house automatically exempt from permits?", "No. For lasting residential or commercial use it is generally treated as a building project. The check is made with the competent authority for the site."],
        ["What is the most common planning mistake?", "Checking the plot too late. Access, standing area, connections and municipal admissibility decide more projects than the choice of model."],
      ];

  const title = de ? "Tiny House Vorteile – und was es nicht löst | MODUNERA" : "Tiny house advantages – and what it does not solve | MODUNERA";
  const description = de
    ? "Acht belegbare Vorteile eines Tiny House von MODUNERA – Budget, Bauzeit, Energie, Nutzung, Versetzbarkeit – und fünf ehrliche Grenzen, die vor dem Kauf geklärt gehören."
    : "Eight demonstrable advantages of a MODUNERA tiny house – budget, build time, energy, use, relocation – plus five honest limits worth clarifying before buying.";

  return (
    head({
      file, lang, title, description, image: "mc4-exterior.webp",
      alternateDe: BASE + "vorteile/", alternateEn: BASE + "en/advantages/",
      schema: [faqSchema(faqs), breadcrumb(de ? [["MODUNERA", ""], ["Vorteile", "vorteile/"]] : [["MODUNERA", "en/"], ["Advantages", "en/advantages/"]])],
    }) +
    chrome(root, lang) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">${de ? "MODUNERA · Vorteile" : "MODUNERA · Advantages"}</div><div class="eyebrow">${de ? "Sachlich statt werblich" : "Factual, not promotional"}</div><h1>${de ? "Was ein Tiny House wirklich besser macht." : "What a tiny house genuinely does better."}</h1><p>${de ? "Acht Vorteile, die sich an Zahlen, Terminen und Dokumenten festmachen lassen – und danach fünf Punkte, die ein Tiny House nicht löst. Beides gehört in eine Kaufentscheidung." : "Eight advantages that can be tied to figures, schedules and documents – followed by five things a tiny house does not solve. A purchase decision needs both."}</p></div></section>` +
    `<section class="section"><div class="container"><div class="kpi-row"><div class="kpi"><b>${eur(entry, lang)}</b><span>${de ? "Einstieg ab Werk" : "Entry, ex works"}</span></div><div class="kpi"><b>8</b><span>${de ? "Modelle" : "Models"}</span></div><div class="kpi"><b>5</b><span>${de ? "Zielmärkte" : "Target markets"}</span></div><div class="kpi"><b>2,55 m</b><span>${de ? "Mobile Breite" : "Mobile width"}</span></div></div>` +
    `<h2>${de ? "Acht Vorteile" : "Eight advantages"}</h2><div class="adv-grid">${ADVANTAGES[lang].map(([t, p], i) => `<div class="adv-card"><span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${t}</h3><p>${p}</p></div>`).join("")}</div>` +
    `<h2 style="margin-top:34px">${de ? "Fünf Punkte, die ein Tiny House nicht löst" : "Five things a tiny house does not solve"}</h2><p class="muted">${de ? "Diese Liste kostet uns gelegentlich eine Anfrage. Sie erspart beiden Seiten ein Projekt, das am Standort scheitert." : "This list occasionally costs us an enquiry. It also saves both sides a project that fails on site."}</p><div class="adv-grid">${LIMITS[lang].map(([t, p]) => `<div class="adv-card"><span class="num">${de ? "Grenze" : "Limit"}</span><h3>${t}</h3><p>${p}</p></div>`).join("")}</div>` +
    `<div class="answer-box"><strong>${de ? "Nächster Schritt" : "Next step"}</strong><p>${de ? "Die schnellste Klärung ist der Standort: Adresse oder Flurstück, geplante Nutzung, Personenanzahl und Budget. Damit lässt sich in einem Durchgang sagen, ob ein Modell passt und welche Prüfungen anstehen." : "The fastest clarification is the site: address or parcel, intended use, number of people and budget. With that we can say in one pass whether a model fits and which checks are due."}</p></div>` +
    `<div class="hero-actions"><a class="btn btn-primary" href="${waLink(de ? "Hallo MODUNERA. Zielland/Ort: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung." : "Hello MODUNERA. Destination/place: __. Intended use: __. People: __. Budget: __. Please send a first assessment.")}" target="_blank" rel="noopener">${de ? "WhatsApp-Projektcheck" : "WhatsApp project check"}</a><a class="btn btn-outline" href="${root}${de ? "modellvergleich/" : "en/model-comparison/"}">${de ? "Modelle vergleichen" : "Compare models"}</a><a class="btn btn-outline" href="${root}${de ? "preisvergleich/" : "en/price-comparison/"}">${de ? "Preise je Land" : "Prices by country"}</a></div>` +
    disclaimer(de) +
    `</div></section><section class="section section-soft"><div class="container"><h2>FAQ</h2><div class="faq-list">${faqMarkup(faqs)}</div></div></section></main>` +
    footer(root, lang)
  );
}

/* --- guide hub -------------------------------------------------------------
   110 German guides already existed under /blog/ but the only route to them was
   the old German navigation, so every generated country and city page led to a
   seven-post Europe index instead. These categories give them a home.        */

const GUIDE_CATEGORIES = [
  { slug: "genehmigung-und-recht", title: "Genehmigung & Recht", intro: "Bauplanungsrecht, Stellplatz, Grundstück, Brandschutz und Versicherung – die Fragen, die vor der Modellwahl geklärt gehören.", stems: ["baugenehmigung", "genehmigung-deutschland", "grundstueck", "stellplatz", "versicherung", "brandschutz"] },
  { slug: "technik-und-konstruktion", title: "Technik & Konstruktion", intro: "Dämmung, Feuchte, Rahmen, Fassade, Fenster und Lüftung – was ein Tiny House vier Jahreszeiten lang trägt.", stems: ["daemmung", "feuchteschutz", "stahlrahmen", "thermowood", "akustik", "fenster", "lueftung", "winterfest", "winterfestes-tiny-house", "sommerhitze", "vier-jahreszeiten"] },
  { slug: "energie-und-autarkie", title: "Energie & Autarkie", intro: "Heizung, Strom, Solar, Wasser und Abwasser – vom Netzanschluss bis zum autarken Betrieb.", stems: ["energieverbrauch", "heizung", "solar", "strom", "off-grid", "wasser", "abwasser", "nachhaltigkeit"] },
  { slug: "grundriss-und-innenraum", title: "Grundriss & Innenraum", intro: "Loft, Küche, Bad, Stauraum und Gestaltungslinien – wie aus wenig Fläche ein nutzbarer Alltag wird.", stems: ["grundriss", "innenraum-planen", "loft", "kueche", "bad", "stauraum", "modern", "scandinavian", "chalet"] },
  { slug: "kosten-und-finanzierung", title: "Kosten & Finanzierung", intro: "Preise, Kaufprozess, Finanzierung und Rendite – die kaufmännische Seite eines Tiny-House-Projekts.", stems: ["preise", "preise-kosten", "kaufen", "kaufen-deutschland", "finanzierung", "rendite"] },
  { slug: "nutzung-und-geschaeftsmodell", title: "Nutzung & Geschäftsmodell", intro: "Wohnen, Vermietung, Glamping, Gastronomie, Büro und Mehrgenerationen – ein Produkt, mehrere Modelle.", stems: ["airbnb", "airbnb-glamping", "glamping", "ferienpark", "gastronomie", "gaestehaus", "homeoffice", "familie", "senioren"] },
  { slug: "transport-und-import", title: "Transport & Import", intro: "Route, Fahrgestell, Sondertransport, Zoll und Einfuhr aus der Türkei nach Europa.", stems: ["transport", "import-tuerkei", "aus-der-tuerkei", "auf-raedern"] },
  { slug: "vergleich-und-alternativen", title: "Vergleich & Alternativen", intro: "Tiny House gegen Modulhaus, Wohnwagen und konventionellen Neubau – wo welche Lösung gewinnt.", stems: ["vs-modulhaus", "vs-wohnwagen"] },
  { slug: "betrieb-und-wartung", title: "Betrieb & Wartung", intro: "Reinigung, Wartungsintervalle und Smart-Home – was nach der Übergabe zu tun ist.", stems: ["reinigung", "wartung", "smart-home"] },
];

async function collectGuides() {
  const entries = await readdir(join(ROOT, "blog"), { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "europa") continue;
    let html;
    try {
      html = await readFile(join(ROOT, "blog", entry.name, "index.html"), "utf8");
    } catch {
      continue;
    }
    const raw = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? entry.name;
    posts.push({
      slug: entry.name,
      title: raw.replace(/\s*\|\s*MODUNERA.*$/, "").replaceAll("&amp;", "&").trim(),
      stem: entry.name.replace(/^tiny-house-/, "").replace(/-(leitfaden|fehler-checkliste)$/, ""),
      kind: entry.name.endsWith("-fehler-checkliste") ? "Checkliste" : entry.name.endsWith("-leitfaden") ? "Leitfaden" : "Artikel",
    });
  }
  posts.sort((a, b) => a.title.localeCompare(b.title, "de"));
  return posts;
}

function groupGuides(posts) {
  const byStem = new Map();
  for (const category of GUIDE_CATEGORIES) for (const stem of category.stems) byStem.set(stem, category.slug);
  const groups = new Map(GUIDE_CATEGORIES.map((c) => [c.slug, []]));
  const rest = [];
  for (const post of posts) {
    const slug = byStem.get(post.stem);
    if (slug) groups.get(slug).push(post);
    else rest.push(post);
  }
  return { groups, rest };
}

const postRows = (root, posts) =>
  posts.map((p) => `<a class="post-row" href="${root}blog/${p.slug}/"><strong>${esc(p.title)}</strong><span>${p.kind}</span></a>`).join("");

function guideHubPage(posts, groups, rest) {
  const file = "ratgeber/index.html";
  const root = rootFor(file);
  const blocks = GUIDE_CATEGORIES.filter((c) => groups.get(c.slug).length)
    .map((c) => {
      const list = groups.get(c.slug);
      return `<div class="cat-block"><h2 id="${c.slug}">${c.title} <span>${list.length} Beiträge</span></h2><p class="muted">${c.intro}</p><div class="post-list">${postRows(root, list)}</div><a class="btn btn-outline" style="margin-top:12px" href="${root}ratgeber/${c.slug}/">Kategorie öffnen →</a></div>`;
    })
    .join("");
  const restBlock = rest.length
    ? `<div class="cat-block"><h2 id="weitere">Weitere Themen <span>${rest.length} Beiträge</span></h2><div class="post-list">${postRows(root, rest)}</div></div>`
    : "";

  const faqs = [
    ["Womit fange ich an?", "Mit Genehmigung & Recht. Ob ein Vorhaben am gewünschten Standort zulässig ist, entscheidet häufiger über den Projekterfolg als die Modellwahl."],
    ["Was ist der Unterschied zwischen Leitfaden und Checkliste?", "Ein Leitfaden erklärt ein Thema von Planung bis Kosten. Eine Checkliste listet die sieben Fehler, die in der Praxis am häufigsten auftreten, und wie sie sich vermeiden lassen."],
    ["Gelten die Inhalte auch außerhalb Deutschlands?", "Technik, Grundriss und Energie sind übertragbar. Recht und Genehmigung sind es nicht – dafür gibt es die Europa-Guides mit länderspezifischen Quellen für Niederlande, Dänemark, Luxemburg und Schweiz."],
  ];

  return (
    head({
      file, lang: "de",
      title: `Tiny House Ratgeber: ${posts.length} Beiträge nach Thema | MODUNERA`,
      description: `Alle MODUNERA Tiny-House-Ratgeber nach Kategorie: Genehmigung, Technik, Energie, Grundriss, Kosten, Nutzung, Transport, Vergleich und Wartung.`,
      image: "interior-feature.webp",
      alternateDe: BASE + "ratgeber/", alternateEn: BASE + "en/guides/",
      schema: [
        faqSchema(faqs),
        breadcrumb([["MODUNERA", ""], ["Ratgeber", "ratgeber/"]]),
        { "@context": "https://schema.org", "@type": "CollectionPage", name: "MODUNERA Tiny House Ratgeber", url: BASE + "ratgeber/",
          hasPart: GUIDE_CATEGORIES.filter((c) => groups.get(c.slug).length).map((c) => ({ "@type": "CollectionPage", name: c.title, url: `${BASE}ratgeber/${c.slug}/` })) },
      ],
    }) +
    chrome(root, "de") +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">MODUNERA · Ratgeber</div><div class="eyebrow">${posts.length} Beiträge · ${GUIDE_CATEGORIES.length} Kategorien</div><h1>Tiny House Wissen, nach Thema sortiert.</h1><p>Von der Genehmigung über Dämmung und Energie bis zu Vermietung und Wartung. Für länderspezifische Rechtsfragen in Niederlande, Dänemark, Luxemburg und der Schweiz gibt es zusätzlich die Europa-Guides.</p><div class="hero-actions"><a class="btn btn-primary" href="${root}blog/europa/">Europa-Guides →</a><a class="btn btn-outline" href="${root}faq/">FAQ mit 160 Antworten</a></div></div></section>` +
    `<section class="section"><div class="container"><div class="cat-rail">${GUIDE_CATEGORIES.filter((c) => groups.get(c.slug).length).map((c) => `<a class="cat-chip" href="${root}ratgeber/${c.slug}/">${c.title} (${groups.get(c.slug).length})</a>`).join("")}</div>${blocks}${restBlock}</div></section>` +
    `<section class="section section-soft"><div class="container"><h2>FAQ</h2><div class="faq-list">${faqMarkup(faqs)}</div>${disclaimer(true)}</div></section></main>` +
    footer(root, "de")
  );
}

function guideCategoryPage(category, posts) {
  const file = `ratgeber/${category.slug}/index.html`;
  const root = rootFor(file);
  const faqs = [
    [`Wie viele Beiträge umfasst „${category.title}"?`, `${posts.length} Beiträge. Leitfäden erklären das Thema von der Planung bis zu den Kosten, Checklisten fassen die häufigsten Praxisfehler zusammen.`],
    ["Ersetzen diese Beiträge eine Beratung?", "Nein. Sie sind allgemeine Projektorientierung. Verbindlich sind die Prüfung am konkreten Standort und ein geprüftes Angebot."],
  ];
  return (
    head({
      file, lang: "de",
      title: `${category.title}: ${posts.length} Tiny-House-Beiträge | MODUNERA`,
      description: category.intro,
      image: "hero-forest.webp",
      alternateDe: `${BASE}ratgeber/${category.slug}/`, alternateEn: BASE + "en/guides/",
      schema: [
        faqSchema(faqs),
        breadcrumb([["MODUNERA", ""], ["Ratgeber", "ratgeber/"], [category.title, `ratgeber/${category.slug}/`]]),
        { "@context": "https://schema.org", "@type": "CollectionPage", name: category.title, url: `${BASE}ratgeber/${category.slug}/`,
          hasPart: posts.map((p) => ({ "@type": "Article", headline: p.title, url: `${BASE}blog/${p.slug}/` })) },
      ],
    }) +
    chrome(root, "de") +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">MODUNERA · Ratgeber · ${esc(category.title)}</div><div class="eyebrow">${posts.length} Beiträge</div><h1>${esc(category.title)}</h1><p>${esc(category.intro)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="cat-rail">${GUIDE_CATEGORIES.map((c) => `<a class="cat-chip" href="${root}ratgeber/${c.slug}/"${c.slug === category.slug ? ' aria-current="true"' : ""}>${c.title}</a>`).join("")}</div><div class="post-list">${postRows(root, posts)}</div><div class="hero-actions"><a class="btn btn-primary" href="${root}ratgeber/">Alle Kategorien →</a><a class="btn btn-outline" href="${waLink("Hallo MODUNERA, ich habe eine Frage zum Thema " + category.title + ". Zielland/Ort: __. Nutzung: __. Bitte kontaktieren Sie mich.")}" target="_blank" rel="noopener">Frage per WhatsApp</a></div>${disclaimer(true)}</div></section>` +
    `<section class="section section-soft"><div class="container"><h2>FAQ</h2><div class="faq-list">${faqMarkup(faqs)}</div></div></section></main>` +
    footer(root, "de")
  );
}

/* --- new market guides ----------------------------------------------------
   Six topics that the existing German library does not cover, written for the
   four newer target markets. German under /blog/europa/, English under
   /en/guides/.                                                              */

const SOURCES = {
  euTrade: ["EU–Türkiye Zollunion (Europäische Kommission)", "https://trade.ec.europa.eu/access-to-markets/en/content/eu-turkiye-customs-union"],
  euDim: ["Abmessungen und Gewichte im Straßenverkehr (EU-Bericht)", "https://transport.ec.europa.eu/document/download/45e1073e-373a-4156-966b-0523915dec9f_en?filename=SWD_2023_70_implementation_report_amendments_dir_96_53.pdf"],
  nl: ["Omgevingsloket – Environment and Planning Act", "https://www.government.nl/themes/building-and-housing/environment-and-planning-act/the-environment-and-planning-portal"],
  dk: ["Building permit (Life in Denmark)", "https://lifeindenmark.borger.dk/housing-and-moving/construction/building-permit"],
  lu: ["Autorisation de construire (guichet.lu)", "https://guichet.public.lu/en/citoyens/logement/construction-renovation-transformation/certificats-energiepass/certificat-autorisation-construire.html"],
  ch: ["Baubewilligung (ch.ch)", "https://www.ch.ch/en/housing/homeownership/planning-application-and-building-permit/"],
  de: ["Baugenehmigung (verwaltung.bund.de)", "https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99012070006001"],
};

const MARKET_GUIDES = [
  {
    deSlug: "gesamtbudget-tiny-house-europa", enSlug: "total-budget-tiny-house-europe", image: "mc1-exterior.webp",
    sources: ["euTrade", "euDim"],
    de: {
      title: "Gesamtbudget Tiny House Europa: vom Werkspreis zum nutzbaren Zustand",
      desc: "Welche Posten zwischen Werkspreis und einzugsfertigem Tiny House liegen – Transport, Kran, Abgaben, Fundament, Anschlüsse – und wie sich das Budget je Zielland verschiebt.",
      answer: "Der Werkspreis ist selten mehr als die Hälfte des Gesamtbudgets. Transport, Kran, Abgaben, Fundament und Anschlüsse entscheiden darüber, wie belastbar eine Kalkulation ist.",
      sections: [
        ["1. Werkspreis ist eine Teilzahl", ["Ein Angebot ab Werk beschreibt Modell, Länge, Innenausbau, Fassade, Heizung, Energie und Möbel. Es endet an der Werkstor-Kante. Alles danach ist Projektlogistik und lokale Leistung.", "Ein Vergleich zwischen Anbietern ist deshalb nur dann fair, wenn beide Seiten dieselbe Leistungsgrenze angeben. Ein niedriger Werkspreis mit knapper Ausstattung kann teurer enden als ein höherer mit vollständiger Linie."]],
        ["2. Transport, Route und Kran", ["Die Route entscheidet über Kosten und Machbarkeit. Breite, Höhe, Gewicht und Kurvenradien bestimmen, ob ein Standardtransport reicht oder ein Sondertransport mit Begleitung nötig wird.", "Am Zielort kommen Kranstellfläche, Tragfähigkeit des Untergrunds und Zufahrt hinzu. Ein Grundstück ohne befestigte Zufahrt verteuert die Entladung deutlich."]],
        ["3. Abgaben und Einfuhr", ["Zoll, Einfuhrumsatzsteuer und lokale Gebühren hängen von Warenwert, Einfuhrweg und Status im Zielland ab. Die EU-Türkei-Zollunion erfasst nicht jede Warengruppe gleich, deshalb gehört diese Position früh geklärt.", "Für die Schweiz gelten eigene Regeln, weil sie nicht Teil der EU-Zollunion ist. Das ist bei der Budgetplanung ein eigener Block, kein Detail."]],
        ["4. Fundament und Anschlüsse", ["Punktfundamente, Streifenfundamente oder ein Fahrgestell mit Stützen – die Wahl folgt Untergrund, Nutzung und Genehmigung. Strom, Wasser und Abwasser werden lokal beauftragt und sind der am stärksten schwankende Posten.", "Wer autark plant, tauscht Anschlusskosten gegen Anlagenkosten: Solar, Speicher, Frisch- und Grauwassersystem. Beides lässt sich rechnen, aber nicht mischen ohne Plan."]],
        ["5. Puffer statt Optimismus", ["Ein Budget ohne Reserve ist keine Planung. Üblich ist eine Reserve für Baustellenüberraschungen: Untergrund, Zufahrt, Nachforderungen der Behörde oder ein zusätzlicher Krantag.", "Wer die Posten getrennt führt statt in einer Pauschale, erkennt sofort, welche Stellschraube ein Projekt wirtschaftlich macht."]],
      ],
      faqs: [
        ["Wie viel sollte ich über den Werkspreis hinaus einplanen?", "Das hängt stark von Zielland, Zufahrt und Anschlusssituation ab. Belastbar wird die Zahl erst, wenn Route und Grundstück geprüft sind – deshalb weist MODUNERA die Posten getrennt aus statt eine Pauschale zu nennen."],
        ["Ist die Lieferung im Preis enthalten?", "Nein. Der Konfigurator rechnet die Lieferung als eigenen Posten je Zielregion. Der Preisvergleich je Land zeigt die hinterlegten Indikationen."],
        ["Kann ich Fundament und Anschlüsse selbst beauftragen?", "Ja, das ist der Regelfall. Diese Leistungen werden lokal vergeben; MODUNERA liefert die technischen Vorgaben, Gewichte und Auflagerpunkte dafür."],
        ["Was ist der häufigste Budgetfehler?", "Die Grundstücksseite zu spät zu prüfen. Zufahrt, Untergrund und Anschlüsse verschieben ein Budget stärker als die Wahl zwischen zwei Modellen."],
      ],
    },
    en: {
      title: "Total budget for a tiny house in Europe: from ex-works price to move-in ready",
      desc: "Which items sit between the ex-works price and a usable tiny house – transport, crane, duties, foundation, connections – and how the budget shifts by destination country.",
      answer: "The ex-works price is rarely more than half of the total budget. Transport, crane, duties, foundation and connections decide whether a calculation holds up.",
      sections: [
        ["1. The ex-works price is a partial figure", ["An ex-works quotation covers model, length, interior, facade, heating, energy and furniture. It ends at the factory gate. Everything after that is project logistics and local work.", "A comparison between suppliers is only fair when both state the same delivery boundary. A low ex-works price with a thin specification can end up costlier than a higher one with a complete line."]],
        ["2. Transport, route and crane", ["The route decides cost and feasibility. Width, height, weight and turning radii determine whether standard transport is enough or a special transport with escort is required.", "On site, crane standing area, ground bearing capacity and access are added. A plot without a made-up access road makes unloading noticeably more expensive."]],
        ["3. Duties and import", ["Customs, import VAT and local fees depend on goods value, import route and status in the destination country. The EU–Türkiye customs union does not treat every product group identically, so this item belongs early in the plan.", "Switzerland follows its own rules because it is not part of the EU customs union. In budget planning that is a separate block, not a detail."]],
        ["4. Foundation and connections", ["Point foundations, strip foundations or a chassis on supports – the choice follows ground, use and permit. Electricity, water and wastewater are contracted locally and are the most variable item.", "Planning off-grid trades connection cost for equipment cost: solar, storage, fresh and grey water systems. Both can be calculated, but not mixed without a plan."]],
        ["5. Contingency instead of optimism", ["A budget without a reserve is not a plan. A reserve for site surprises is normal: ground conditions, access, additional authority requirements or an extra crane day.", "Keeping the items separate rather than in a lump sum shows immediately which lever makes a project viable."]],
      ],
      faqs: [
        ["How much should I plan beyond the ex-works price?", "That depends heavily on destination, access and connection situation. The number only becomes dependable once route and plot are checked, which is why MODUNERA lists the items separately instead of quoting a lump sum."],
        ["Is delivery included in the price?", "No. The configurator calculates delivery as a separate item per destination region. The country price comparison shows the stored indications."],
        ["Can I contract the foundation and connections myself?", "Yes, that is the normal case. These are awarded locally; MODUNERA supplies the technical requirements, weights and bearing points."],
        ["What is the most common budget mistake?", "Checking the plot too late. Access, ground and connections move a budget more than the choice between two models."],
      ],
    },
  },
  {
    deSlug: "grundstueck-stellplatz-europa", enSlug: "plot-and-site-europe", image: "hero-forest.webp",
    sources: ["nl", "dk", "lu", "ch", "de"],
    de: {
      title: "Grundstück & Stellplatz in den Zielmärkten: worauf die Zulässigkeit wirklich beruht",
      desc: "Wie Niederlande, Dänemark, Luxemburg, Schweiz und Deutschland die Zulässigkeit eines Tiny House am konkreten Standort prüfen – und welche Unterlagen vorab helfen.",
      answer: "Nicht das Haus entscheidet über die Zulässigkeit, sondern der Standort: Flächennutzung, geplante Nutzungsart und Dauer. Diese Prüfung gehört vor die Modellwahl.",
      sections: [
        ["1. Die Nutzung schlägt die Bauform", ["Ob Wohnen, Ferienvermietung, Büro oder temporäre Aufstellung: Die tatsächliche Nutzung und die Standdauer sind für die rechtliche Einordnung meist wichtiger als die Bezeichnung Tiny House. Ein Fahrgestell schafft keine pauschale Genehmigungsfreiheit.", "Wer die Nutzung später ändert, löst häufig eine erneute Prüfung aus. Das ist planbar, wenn es von Anfang an bekannt ist."]],
        ["2. Fünf Länder, fünf Zuständigkeiten", ["In den Niederlanden bündelt das Omgevingsloket seit 2024 die Regeln von Gemeinde, Provinz, Wasserbehörde und Zentralstaat; der kommunale Omgevingsplan bleibt für den Standort entscheidend. In Dänemark liegt die Zuständigkeit bei der Kommune.", "In Luxemburg genehmigt der Bürgermeister der Gemeinde, und das Vorhaben muss zu den kommunalen Entwicklungs- und Bebauungsplänen passen. In der Schweiz richten sich Verfahren und Ausnahmen nach Kanton und Gemeinde. In Deutschland kommen Bauplanungsrecht und Landesbauordnung zusammen."]],
        ["3. Was die Behörde sehen will", ["Adresse oder Flurstück, geplante Nutzung, Standdauer, Abmessungen, Gewichte, Anschlüsse und Zufahrt. Je vollständiger diese Angaben, desto schneller kommt eine belastbare Auskunft.", "Grundriss, Ansichten, Schnitte und ein Aufstellkonzept liegen für alle MODUNERA Modelle vor und lassen sich der Anfrage direkt beilegen."]],
        ["4. Zufahrt ist ein Genehmigungs- und ein Kostenthema", ["Ein Standort kann baurechtlich zulässig und logistisch trotzdem schwierig sein. Kurvenradien, Traglast, Leitungen über der Fahrbahn und die Kranstellfläche gehören in dieselbe Vorprüfung.", "Diese Punkte früh zu klären verhindert die teuerste Variante: ein genehmigtes Projekt, das nicht angeliefert werden kann."]],
        ["5. Reihenfolge, die funktioniert", ["Standort prüfen, Nutzung festlegen, Unterlagen zusammenstellen, Behördenauskunft einholen, dann Modell und Ausstattung fixieren. Wer umgekehrt vorgeht, plant gegen eine Unbekannte."]],
      ],
      faqs: [
        ["Brauche ich immer eine Genehmigung?", "Bei einer auf Dauer angelegten Wohn- oder Gewerbenutzung in der Regel ja. Kleinere oder temporäre Vorhaben können Ausnahmen haben, müssen aber trotzdem die geltenden Regeln einhalten. Verbindlich ist die Auskunft der zuständigen Stelle."],
        ["Hilft ein Fahrgestell bei der Genehmigung?", "Nicht pauschal. Räder ändern nichts daran, dass eine dauerhafte Nutzung baurechtlich bewertet wird. Sie können aber bei temporären Aufstellungen und beim späteren Versetzen helfen."],
        ["Kann MODUNERA die Genehmigung übernehmen?", "Nein. Das Verfahren führen Eigentümer beziehungsweise beauftragte Planer vor Ort. MODUNERA liefert die technischen Unterlagen, die dafür gebraucht werden."],
        ["Wie lange dauert die Prüfung?", "Das unterscheidet sich je Land, Kommune und Vorhaben erheblich. Eine erste Auskunft ist oft schnell zu bekommen, das förmliche Verfahren dauert länger."],
      ],
    },
    en: {
      title: "Plot and site across the target markets: what admissibility really rests on",
      desc: "How the Netherlands, Denmark, Luxembourg, Switzerland and Germany assess whether a tiny house is admissible on a specific site – and which documents help upfront.",
      answer: "The site decides admissibility, not the house: land use, intended use and duration. That check belongs before choosing a model.",
      sections: [
        ["1. Use outweighs building form", ["Whether living, holiday rental, office or temporary siting: the actual use and the duration usually matter more for the legal classification than the label tiny house. A chassis does not create blanket exemption from permits.", "Changing the use later often triggers a fresh assessment. That is manageable when it is known from the start."]],
        ["2. Five countries, five competent bodies", ["In the Netherlands the Environment and Planning Portal has combined municipal, provincial, water authority and central government rules since 2024; the municipal environmental plan remains decisive for the site. In Denmark the municipality is responsible.", "In Luxembourg the mayor of the municipality authorises the project, which must fit the communal development and building plans. In Switzerland procedures and exemptions follow cantonal and communal law. In Germany planning law and state building law meet."]],
        ["3. What the authority wants to see", ["Address or parcel, intended use, duration, dimensions, weights, connections and access. The more complete these details, the faster a dependable answer arrives.", "Floor plans, elevations, sections and a siting concept exist for every MODUNERA model and can be attached to the enquiry directly."]],
        ["4. Access is both a permit and a cost topic", ["A site can be admissible in planning terms and still be difficult logistically. Turning radii, load capacity, cables above the carriageway and crane standing area belong in the same preliminary check.", "Clarifying these early avoids the most expensive variant: an approved project that cannot be delivered."]],
        ["5. An order that works", ["Check the site, fix the use, assemble the documents, obtain the authority's position, then fix model and specification. Doing it the other way round means planning against an unknown."]],
      ],
      faqs: [
        ["Do I always need a permit?", "For lasting residential or commercial use, generally yes. Smaller or temporary projects may have exemptions but still have to meet applicable rules. Only the competent authority's position is binding."],
        ["Does a chassis help with the permit?", "Not as a rule. Wheels do not change the fact that permanent use is assessed under building law. They can help with temporary siting and with relocating later."],
        ["Can MODUNERA handle the permit?", "No. The procedure is run by owners or their appointed local planners. MODUNERA supplies the technical documents needed for it."],
        ["How long does the assessment take?", "This differs considerably by country, municipality and project. A first indication is often quick; the formal procedure takes longer."],
      ],
    },
  },
  {
    deSlug: "ganzjaehrig-wohnen-klima-europa", enSlug: "year-round-living-climate-europe", image: "mc6-exterior.webp",
    sources: ["euDim"],
    de: {
      title: "Ganzjährig wohnen: Klima, Dämmung und Feuchte je Zielmarkt",
      desc: "Küstenwind in den Niederlanden, salzhaltige Luft und lange Heizperioden in Dänemark, Höhenlage und Schneelast in der Schweiz – was ein Vier-Jahreszeiten-Aufbau leisten muss.",
      answer: "Ein Tiny House wird nicht durch Dämmstärke allein winterfest, sondern durch das Zusammenspiel von Hülle, Luftdichtheit, Lüftung, Wärmebrückenfreiheit und Heizsystem – abgestimmt auf das Klima am Standort.",
      sections: [
        ["1. Vier Klimaprofile, ein Konstruktionsprinzip", ["Küstenwind, Feuchte und Schlagregen prägen die Niederlande. Dänemark bringt Wind, salzhaltige Luft und lange Heizperioden. Luxemburg ist wechselhaft mit kompakten Grundstücken. Die Schweiz addiert Höhenlage, Schnee, Frost und starke Sommersonne.", "Das Konstruktionsprinzip bleibt gleich: dichte Hülle, kontrollierte Lüftung, wärmebrückenarme Anschlüsse. Was sich ändert, sind Dämmstärken, Fassadenaufbau, Verglasung und Verankerung."]],
        ["2. Luftdichtheit vor Dämmstärke", ["Eine dicke Dämmung mit undichten Anschlüssen verliert mehr Energie als eine dünnere mit sauberer Luftdichtheitsebene. Zusätzlich wandert feuchte Innenluft in die Konstruktion – das ist der eigentliche Schaden.", "Deshalb gehören Dampfbremse, Anschlussbänder und Durchdringungen in die Planung, nicht in die Improvisation auf der Baustelle."]],
        ["3. Lüftung ist bei kleinem Volumen kritischer", ["Ein Tiny House hat wenig Luftvolumen. Kochen, Duschen und zwei Personen erzeugen schnell hohe Feuchte. Ohne kontrollierte Lüftung mit Wärmerückgewinnung steigt das Schimmelrisiko deutlich.", "Fensterlüften ersetzt das im Winter nicht – es kostet die Wärme, die gerade erzeugt wurde."]],
        ["4. Sommer ist das unterschätzte Problem", ["Große Verglasung bringt Tageslicht und im Juli Hitze. Verschattung, Dachaufbau, Speichermasse und Nachtlüftung entscheiden über die Bewohnbarkeit im Sommer stärker als die Klimaanlage.", "In der Schweiz kommt in Höhenlagen intensive Einstrahlung hinzu, während die Nächte kühl bleiben – das ist planbar, wenn es früh berücksichtigt wird."]],
        ["5. Heizsystem folgt dem Standort", ["Wärmepumpe, Fußbodenheizung oder elektrische Direktheizung haben je nach Heizperiode, Strompreis und Anschlusssituation unterschiedliche Wirtschaftlichkeit. In Dänemark mit langer Heizperiode rechnet sich eine effiziente Lösung schneller als in Luxemburg."]],
      ],
      faqs: [
        ["Ist ein MODUNERA Tiny House winterfest?", "Die Vier-Jahreszeiten-Ausführung ist darauf ausgelegt. Entscheidend ist, dass Dämmung, Fenster, Lüftung und Heizung auf das Klima am konkreten Standort abgestimmt werden – das wird projektbezogen festgelegt."],
        ["Was ist mit Schneelast in der Schweiz?", "Schnee- und Windlasten sind regional geregelt und gehören in die statische Vorprüfung. Höhenlage und Exposition des Grundstücks bestimmen die Anforderung."],
        ["Wie hoch ist der Heizbedarf?", "Er hängt von Hülle, Klima, Nutzung und Innentemperatur ab. Eine seriöse Zahl entsteht erst mit Standort und Ausführung, nicht als Pauschalwert."],
        ["Braucht man eine Lüftungsanlage?", "Bei ganzjähriger Nutzung ist eine kontrollierte Lüftung dringend zu empfehlen. Sie schützt die Konstruktion und hält die Luftqualität bei kleinem Volumen stabil."],
      ],
    },
    en: {
      title: "Year-round living: climate, insulation and moisture by target market",
      desc: "Coastal wind in the Netherlands, salt-laden air and long heating seasons in Denmark, altitude and snow load in Switzerland – what a four-season build has to deliver.",
      answer: "A tiny house does not become winter-proof through insulation thickness alone, but through envelope, airtightness, ventilation, thermal-bridge-free detailing and heating working together – tuned to the site climate.",
      sections: [
        ["1. Four climate profiles, one construction principle", ["Coastal wind, humidity and driving rain shape the Netherlands. Denmark brings wind, salt-laden air and long heating seasons. Luxembourg is variable with compact plots. Switzerland adds altitude, snow, frost and strong summer sun.", "The construction principle stays the same: a tight envelope, controlled ventilation, low thermal bridging. What changes are insulation thickness, facade build-up, glazing and anchoring."]],
        ["2. Airtightness before insulation thickness", ["Thick insulation with leaky junctions loses more energy than thinner insulation with a clean airtight layer. Humid indoor air also migrates into the construction, and that is the real damage.", "Vapour control, sealing tapes and penetrations therefore belong in the design, not in improvisation on site."]],
        ["3. Ventilation matters more in a small volume", ["A tiny house holds little air. Cooking, showering and two people quickly create high humidity. Without controlled ventilation with heat recovery, mould risk rises sharply.", "Opening windows does not replace it in winter – it costs exactly the heat just produced."]],
        ["4. Summer is the underestimated problem", ["Large glazing brings daylight, and heat in July. Shading, roof build-up, thermal mass and night ventilation decide summer habitability more than air conditioning does.", "In Switzerland, altitude adds intense radiation while nights stay cool – manageable when considered early."]],
        ["5. The heating system follows the site", ["Heat pump, underfloor heating or direct electric heating differ in economics depending on heating season, electricity price and connection situation. In Denmark, with its long heating season, an efficient solution pays back faster than in Luxembourg."]],
      ],
      faqs: [
        ["Is a MODUNERA tiny house winter-proof?", "The four-season build is designed for it. What matters is that insulation, windows, ventilation and heating are matched to the climate at the specific site, which is fixed per project."],
        ["What about snow load in Switzerland?", "Snow and wind loads are regulated regionally and belong in the preliminary structural check. Altitude and exposure of the plot set the requirement."],
        ["How high is the heating demand?", "It depends on envelope, climate, use and indoor temperature. A serious figure only emerges with site and specification, not as a blanket value."],
        ["Is a ventilation system necessary?", "For year-round use, controlled ventilation is strongly recommended. It protects the construction and keeps air quality stable in a small volume."],
      ],
    },
  },
  {
    deSlug: "vermietung-auslastung-europa", enSlug: "rental-and-occupancy-europe", image: "mc4-exterior.webp",
    sources: ["nl", "dk"],
    de: {
      title: "Vermietung & Auslastung in den Zielmärkten: was die Rechnung trägt",
      desc: "Tiny House als Ferienvermietung in Niederlande, Dänemark, Luxemburg und der Schweiz – Nutzungsrecht, Saison, Ausstattung und die Posten, die eine Rendite realistisch machen.",
      answer: "Eine Vermietung steht und fällt mit der Zulässigkeit der Nutzung am Standort. Erst danach entscheiden Saison, Lage, Ausstattung und Betriebsaufwand über die Wirtschaftlichkeit.",
      sections: [
        ["1. Zuerst die Nutzungsart, dann die Kalkulation", ["Ferienvermietung ist eine eigene Nutzungsart. Ob sie am Standort zulässig ist, entscheidet die Kommune – unabhängig davon, ob das Gebäude mobil ist. Wer erst kauft und dann prüft, riskiert eine nicht nutzbare Einheit.", "In Ferienparks und auf gewerblichen Stellplätzen ist der Rahmen häufig bereits gesetzt, was den Weg deutlich verkürzt."]],
        ["2. Saison schlägt Tagespreis", ["Die Auslastung über das Jahr bestimmt den Ertrag stärker als der Preis pro Nacht. Eine winterfeste Ausführung verlängert die Saison und verändert damit die Rechnung grundlegend.", "Dänemark und die Niederlande haben starke Sommer- und Randsaisons; die Schweiz kann mit Bergbezug eine zweite Wintersaison erschließen."]],
        ["3. Ausstattung, die Bewertungen erzeugt", ["Bad, Küche, Schlafkomfort, Heizung und Schallschutz entscheiden über Bewertungen und Wiederbuchungen. Genau hier zahlt sich integrierte Möbelfertigung aus, weil Stauraum und Bettmaße zum Grundriss passen statt nachträglich hineingestellt zu werden.", "Ein überdachter Außenbereich – wie beim MD 4 – verlängert die nutzbare Saison und ist in Bildern sofort sichtbar."]],
        ["4. Betrieb ist ein Kostenblock", ["Reinigung, Wäsche, Check-in, Wartung, Versicherung und Plattformgebühren gehören in jede Rechnung. Sie werden bei der ersten Kalkulation regelmäßig unterschätzt.", "Wer mehrere Einheiten plant, verteilt diese Kosten besser – das ist häufig der eigentliche Skaleneffekt."]],
        ["5. Realistisch statt versprochen", ["Belastbare Zahlen entstehen aus lokalen Vergleichsobjekten, nicht aus Musterrechnungen. MODUNERA liefert Modell, Ausstattung und Dokumentation; die Ertragsannahmen gehören zum Standort und zum Betreiber."]],
      ],
      faqs: [
        ["Darf ich ein Tiny House als Ferienwohnung vermieten?", "Das hängt von der Zulässigkeit der Nutzungsart am Standort ab und wird kommunal geprüft. Diese Frage gehört vor die Bestellung."],
        ["Welches Modell eignet sich für Vermietung?", "Häufig MD 2 wegen der zwei getrennten Lofts und MD 4 wegen der Veranda. Entscheidend sind Gästezahl, Saison und Lage."],
        ["Garantiert MODUNERA eine Rendite?", "Nein. Auslastung und Preise hängen von Lage, Nachfrage, Betrieb und Wettbewerb ab. Verbindliche Ertragszusagen wären unseriös."],
        ["Wie schnell ist eine Einheit einsatzbereit?", "Nach Lieferung sind Aufstellung, Anschlüsse und Ausstattung nötig. Der Zeitbedarf hängt vom Standort ab, nicht vom Modell."],
      ],
    },
    en: {
      title: "Rental and occupancy across the target markets: what carries the calculation",
      desc: "A tiny house as a holiday rental in the Netherlands, Denmark, Luxembourg and Switzerland – permitted use, season, specification and the items that make a return realistic.",
      answer: "A rental stands or falls on whether the use is admissible on the site. Only then do season, location, specification and running costs decide the economics.",
      sections: [
        ["1. Use class first, calculation second", ["Holiday rental is a use class of its own. Whether it is admissible on the site is decided by the municipality, regardless of whether the building is mobile. Buying first and checking afterwards risks an unusable unit.", "In holiday parks and on commercial pitches the framework is often already in place, which shortens the path considerably."]],
        ["2. Season beats nightly rate", ["Occupancy across the year drives income more than the price per night. A winter-capable build extends the season and fundamentally changes the calculation.", "Denmark and the Netherlands have strong summer and shoulder seasons; Switzerland can open a second winter season where there is a mountain context."]],
        ["3. Specification that produces reviews", ["Bathroom, kitchen, sleeping comfort, heating and acoustics decide reviews and rebookings. This is exactly where integrated furniture production pays off, because storage and bed dimensions follow the layout instead of being placed into it afterwards.", "A covered outdoor area – as on the MD 4 – extends the usable season and is immediately visible in photographs."]],
        ["4. Operations are a cost block", ["Cleaning, laundry, check-in, maintenance, insurance and platform fees belong in every calculation. They are regularly underestimated in a first estimate.", "Planning several units spreads these costs better, and that is often the real economy of scale."]],
        ["5. Realistic rather than promised", ["Dependable figures come from local comparable properties, not from example calculations. MODUNERA supplies the model, specification and documentation; the revenue assumptions belong to the site and the operator."]],
      ],
      faqs: [
        ["May I rent out a tiny house as a holiday home?", "That depends on whether the use class is admissible on the site and is assessed by the municipality. The question belongs before ordering."],
        ["Which model suits rental use?", "Frequently the MD 2 for its two separate lofts and the MD 4 for its veranda. Guest numbers, season and location are decisive."],
        ["Does MODUNERA guarantee a return?", "No. Occupancy and rates depend on location, demand, operations and competition. Binding revenue promises would not be credible."],
        ["How quickly is a unit ready to operate?", "After delivery, siting, connections and fit-out are required. The time needed depends on the site rather than the model."],
      ],
    },
  },
  {
    deSlug: "zoll-einfuhr-tuerkei-europa", enSlug: "customs-import-turkiye-europe", image: "mc5-exterior.webp",
    sources: ["euTrade", "euDim"],
    de: {
      title: "Zoll & Einfuhr aus der Türkei: wie die Warenseite eines Tiny-House-Projekts läuft",
      desc: "Zollunion, Warengruppen, Einfuhrumsatzsteuer und die Sonderrolle der Schweiz – was bei der Einfuhr eines Tiny House aus der Türkei in die Zielmärkte zu klären ist.",
      answer: "Die EU-Türkei-Zollunion erleichtert vieles, deckt aber nicht jede Warengruppe gleich ab. Einfuhrumsatzsteuer, Nachweise und der Status im Zielland bleiben projektbezogen zu klären.",
      sections: [
        ["1. Zollunion ist nicht gleich zollfrei", ["Die Zollunion zwischen EU und Türkei erfasst den Warenverkehr in wesentlichen Teilen, aber nicht jede Warengruppe identisch. Welche Regelung greift, hängt von Einreihung, Nachweisen und Einfuhrweg ab.", "Für ein Gebäude auf Fahrgestell kommt hinzu, ob es als Ware oder als Fahrzeug bewegt wird – das verändert die Nachweiskette."]],
        ["2. Einfuhrumsatzsteuer bleibt", ["Auch wenn Zölle entfallen, ist die Einfuhrumsatzsteuer im Zielland ein eigener Posten. Sie richtet sich nach Warenwert und nationalem Steuersatz und gehört in die Budgetplanung.", "Ob und wie sie geltend gemacht werden kann, hängt vom Status des Käufers ab – privat oder gewerblich – und ist eine steuerliche Frage vor Ort."]],
        ["3. Die Schweiz ist ein eigener Fall", ["Die Schweiz ist nicht Teil der EU-Zollunion. Einfuhr, Abgaben und Nachweise laufen nach eigenen Regeln, und die Grenzabfertigung ist ein eigener Schritt in der Route.", "Wer in die Schweiz liefert, plant diesen Block getrennt und früh."]],
        ["4. Dokumente, die die Kette tragen", ["Handelsrechnung, Packliste, Ursprungsnachweise, technische Datenblätter mit Maßen und Gewichten sowie Transportdokumente bilden die Grundlage. Fehlt ein Nachweis, steht die Ware – das ist der teuerste Fehler in dieser Kette.", "MODUNERA stellt die produktseitigen Unterlagen bereit; die zollrechtliche Abwicklung erfolgt über Spedition und Zollagent im Zielland."]],
        ["5. Straßenverkehr ist eine zweite Prüfung", ["Baurechtliche Zulässigkeit am Zielort und straßenverkehrsrechtliche Zulässigkeit während der Überführung sind zwei getrennte Fragen. Abmessungen und Gewichte im europäischen Straßenverkehr sind eigens geregelt und entscheiden über Sondertransport und Begleitung."]],
      ],
      faqs: [
        ["Fallen bei der Einfuhr Zölle an?", "Das hängt von Warengruppe, Einreihung und Nachweisen ab. Die Zollunion erleichtert vieles, ist aber keine pauschale Zollfreiheit. Verbindlich ist die Auskunft der Zollbehörde beziehungsweise des Zollagenten im Zielland."],
        ["Wer übernimmt die Zollabwicklung?", "In der Regel eine Spedition mit Zollagent im Zielland. MODUNERA liefert die produktseitigen Unterlagen dafür."],
        ["Ist die Schweiz teurer in der Einfuhr?", "Sie ist vor allem anders: eigene Regeln, eigene Abfertigung, eigener Zeitbedarf. Der Kostenunterschied ergibt sich projektbezogen."],
        ["Kann ich die Einfuhrumsatzsteuer zurückholen?", "Das ist eine steuerliche Frage im Zielland und hängt vom Status des Käufers ab. Sie gehört zur lokalen Steuerberatung, nicht zum Herstellerangebot."],
      ],
    },
    en: {
      title: "Customs and import from Türkiye: how the goods side of a tiny house project runs",
      desc: "Customs union, product groups, import VAT and Switzerland's special position – what has to be clarified when importing a tiny house from Türkiye into the target markets.",
      answer: "The EU–Türkiye customs union simplifies a great deal but does not cover every product group identically. Import VAT, evidence and the buyer's status in the destination country still have to be clarified per project.",
      sections: [
        ["1. A customs union is not duty-free by default", ["The customs union between the EU and Türkiye covers trade in substantial part, but not every product group identically. Which rule applies depends on classification, evidence and import route.", "For a building on a chassis there is the additional question of whether it moves as goods or as a vehicle, which changes the chain of evidence."]],
        ["2. Import VAT remains", ["Even where duties fall away, import VAT in the destination country is a separate item. It follows goods value and the national rate and belongs in budget planning.", "Whether and how it can be reclaimed depends on the buyer's status – private or commercial – and is a local tax question."]],
        ["3. Switzerland is its own case", ["Switzerland is not part of the EU customs union. Import, duties and evidence follow separate rules, and border clearance is its own step in the route.", "Anyone delivering to Switzerland plans this block separately and early."]],
        ["4. The documents that carry the chain", ["Commercial invoice, packing list, proofs of origin, technical data sheets with dimensions and weights, and transport documents form the basis. A missing document stops the goods, and that is the costliest error in this chain.", "MODUNERA provides the product-side documents; customs clearance runs through a forwarder and customs agent in the destination country."]],
        ["5. Road transport is a second assessment", ["Admissibility under building law at the destination and admissibility under road traffic law during transfer are two separate questions. Dimensions and weights in European road transport are separately regulated and decide special transport and escort."]],
      ],
      faqs: [
        ["Are duties payable on import?", "That depends on product group, classification and evidence. The customs union simplifies much but is not blanket duty exemption. Only the customs authority or the customs agent in the destination country is binding."],
        ["Who handles customs clearance?", "Usually a forwarder with a customs agent in the destination country. MODUNERA supplies the product-side documents for it."],
        ["Is importing into Switzerland more expensive?", "Above all it is different: separate rules, separate clearance, separate lead time. The cost difference emerges per project."],
        ["Can I reclaim import VAT?", "That is a tax question in the destination country and depends on the buyer's status. It belongs with local tax advice rather than a manufacturer's quotation."],
      ],
    },
  },
  {
    deSlug: "anschluesse-strom-wasser-abwasser-europa", enSlug: "connections-power-water-wastewater-europe", image: "mc7-interior.webp",
    sources: ["nl", "ch"],
    de: {
      title: "Anschlüsse: Strom, Wasser und Abwasser am Zielort",
      desc: "Netzanschluss, Teilautarkie oder Off-Grid – wie sich die Versorgung eines Tiny House in den Zielmärkten planen lässt und welche Kosten wo entstehen.",
      answer: "Die Versorgung ist selten Teil des Hauspreises und fast immer der variabelste Posten. Netzanschluss, Teilautarkie und Off-Grid sind drei Wege mit sehr unterschiedlichen Kostenprofilen.",
      sections: [
        ["1. Drei Wege, drei Kostenprofile", ["Netzanschluss ist im Betrieb am einfachsten, kostet aber je nach Entfernung zur Leitung erheblich. Teilautarkie – Netzstrom plus Solar und Speicher – senkt Betriebskosten bei moderater Investition. Off-Grid verlagert alles in die Anlagentechnik.", "Welcher Weg trägt, entscheidet die Lage: ein Grundstück 150 Meter von der nächsten Leitung entfernt rechnet anders als eines an der Straße."]],
        ["2. Strom", ["Der Hausanschluss wird beim örtlichen Netzbetreiber beantragt. Kosten hängen von Entfernung, Leitungsführung und Anschlussleistung ab. Solar mit Speicher kann den Bezug senken, ersetzt aber im Winter selten den Anschluss vollständig.", "Bei Wärmepumpe oder Direktheizung steigt die benötigte Anschlussleistung – das gehört in dieselbe Anfrage."]],
        ["3. Wasser", ["Ein Anschluss an das öffentliche Netz ist der Regelfall. Alternativ arbeiten Frischwassertanks mit Befüllung, was Autarkie schafft, aber Betriebsaufwand erzeugt.", "In Frostregionen – Dänemark, Schweizer Höhenlagen – gehören frostsichere Leitungsführung und Begleitheizung zur Planung, nicht zur Nachrüstung."]],
        ["4. Abwasser", ["Kanalanschluss, Sammelgrube oder Kleinkläranlage – die Zulässigkeit richtet sich nach Kommune und Gewässerschutz. In den Niederlanden ist zusätzlich die Wasserbehörde über das Omgevingsloket eingebunden.", "Trockentrenntoiletten reduzieren Schwarzwasser, lösen aber die Grauwasserfrage aus Küche und Dusche nicht."]],
        ["5. Reihenfolge der Anfragen", ["Netzbetreiber, Wasserversorger und Kommune parallel anfragen, bevor der Liefertermin steht. Diese Vorlaufzeiten sind der häufigste Grund, warum ein geliefertes Haus noch nicht bewohnbar ist."]],
      ],
      faqs: [
        ["Sind Anschlüsse im Preis enthalten?", "Nein. Anschlüsse werden lokal beauftragt und sind nicht Teil des Werkspreises. MODUNERA liefert die technischen Vorgaben und Anschlusspunkte."],
        ["Ist ein vollständig autarkes Tiny House realistisch?", "Technisch ja, mit Solar, Speicher, Wassertank und Abwasserlösung. Wirtschaftlich hängt es davon ab, wie teuer der Netzanschluss am konkreten Standort wäre."],
        ["Was kostet ein Netzanschluss?", "Das ist stark entfernungsabhängig und wird vom örtlichen Netzbetreiber kalkuliert. Eine pauschale Zahl wäre irreführend."],
        ["Funktioniert das im Winter?", "Mit frostsicherer Leitungsführung, ausreichender Dämmung und passender Heizung ja. In Frostregionen gehört das in die Erstplanung."],
      ],
    },
    en: {
      title: "Connections: electricity, water and wastewater on site",
      desc: "Grid connection, partial autonomy or off-grid – how to plan the supply of a tiny house in the target markets and where the costs arise.",
      answer: "Supply is rarely part of the house price and almost always the most variable item. Grid connection, partial autonomy and off-grid are three routes with very different cost profiles.",
      sections: [
        ["1. Three routes, three cost profiles", ["A grid connection is simplest in operation but costs considerably depending on the distance to the line. Partial autonomy – grid power plus solar and storage – lowers running costs at moderate investment. Off-grid moves everything into equipment.", "Which route works is decided by location: a plot 150 metres from the nearest line calculates differently from one on the street."]],
        ["2. Electricity", ["The service connection is applied for with the local network operator. Costs depend on distance, routing and connected load. Solar with storage can reduce consumption but rarely replaces the connection entirely in winter.", "With a heat pump or direct heating the required connected load rises, which belongs in the same application."]],
        ["3. Water", ["A connection to the public network is the normal case. Alternatively, fresh water tanks with refilling create autonomy but generate operating effort.", "In frost regions – Denmark, Swiss altitudes – frost-safe routing and trace heating belong in the design rather than in retrofitting."]],
        ["4. Wastewater", ["Sewer connection, collection tank or small treatment plant – admissibility follows municipal rules and water protection. In the Netherlands the water authority is additionally involved through the Environment and Planning Portal.", "Separating dry toilets reduce black water but do not solve the grey water question from kitchen and shower."]],
        ["5. The order of applications", ["Approach network operator, water utility and municipality in parallel before the delivery date is fixed. These lead times are the most common reason a delivered house is not yet habitable."]],
      ],
      faqs: [
        ["Are connections included in the price?", "No. Connections are contracted locally and are not part of the ex-works price. MODUNERA supplies the technical requirements and connection points."],
        ["Is a fully off-grid tiny house realistic?", "Technically yes, with solar, storage, a water tank and a wastewater solution. Economically it depends on how expensive a grid connection would be at that specific site."],
        ["What does a grid connection cost?", "It is heavily distance-dependent and calculated by the local network operator. A blanket figure would be misleading."],
        ["Does it work in winter?", "With frost-safe routing, sufficient insulation and suitable heating, yes. In frost regions that belongs in the initial design."],
      ],
    },
  },
];

function marketGuidePage(guide, lang) {
  const de = lang === "de";
  const c = de ? guide.de : guide.en;
  const file = de ? `blog/europa/${guide.deSlug}/index.html` : `en/guides/${guide.enSlug}/index.html`;
  const root = rootFor(file);
  const alternateDe = `${BASE}blog/europa/${guide.deSlug}/`;
  const alternateEn = `${BASE}en/guides/${guide.enSlug}/`;

  const body = c.sections
    .map(([heading, paragraphs]) => `<h2>${esc(heading)}</h2>${paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}`)
    .join("");
  const sourceList = guide.sources
    .map((key) => `<li><a href="${SOURCES[key][1]}" target="_blank" rel="noopener nofollow">${esc(SOURCES[key][0])} ↗</a></li>`)
    .join("");

  return (
    head({
      file, lang, title: `${c.title} | MODUNERA`, description: c.desc, image: guide.image,
      alternateDe, alternateEn,
      schema: [
        { "@context": "https://schema.org", "@type": "Article", headline: c.title, description: c.desc,
          datePublished: UPDATED, dateModified: UPDATED, inLanguage: de ? "de-DE" : "en",
          author: { "@type": "Organization", name: "MODUNERA" }, publisher: { "@type": "Organization", name: "MODUNERA" },
          mainEntityOfPage: de ? alternateDe : alternateEn },
        faqSchema(c.faqs),
        breadcrumb(de ? [["MODUNERA", ""], ["Europa-Guides", "blog/europa/"], [c.title, `blog/europa/${guide.deSlug}/`]] : [["MODUNERA", "en/"], ["Guides", "en/guides/"], [c.title, `en/guides/${guide.enSlug}/`]]),
      ],
    }) +
    chrome(root, lang) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">${UPDATED} · ${de ? "MODUNERA Redaktion" : "MODUNERA editorial"}</div><h1>${esc(c.title)}</h1><p>${esc(c.desc)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="article-shell"><article class="article"><div class="answer-box"><strong>${de ? "Kurzantwort" : "Short answer"}</strong><p>${esc(c.answer)}</p></div>${body}<h2>${de ? "Amtliche Quellen" : "Official sources"}</h2><ul>${sourceList}</ul>${disclaimer(de)}<div class="hero-actions"><a class="btn btn-primary" href="${waLink(de ? "Hallo MODUNERA. Thema: " + c.title + ". Zielland/Ort: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung." : "Hello MODUNERA. Topic: " + c.title + ". Destination/place: __. Intended use: __. People: __. Budget: __. Please send a first assessment.")}" target="_blank" rel="noopener">${de ? "WhatsApp-Projektcheck" : "WhatsApp project check"}</a><a class="btn btn-outline" href="${root}${de ? "preisvergleich/" : "en/price-comparison/"}">${de ? "Preisvergleich je Land" : "Price comparison by country"}</a></div></article><aside class="article-aside"><h4>${de ? "Weiter lesen" : "Read next"}</h4>${MARKET_GUIDES.filter((g) => g !== guide).map((g) => `<a class="post-row" href="${root}${de ? "blog/europa/" + g.deSlug + "/" : "en/guides/" + g.enSlug + "/"}"><strong>${esc((de ? g.de : g.en).title)}</strong></a>`).join("")}</aside></div></div></section>` +
    `<section class="section section-soft"><div class="container"><h2>FAQ</h2><div class="faq-list">${faqMarkup(c.faqs)}</div></div></section></main>` +
    footer(root, lang)
  );
}

/* --- passes --------------------------------------------------------------- */

/* Locale of a page, from its html lang. Anything unknown is German, which is
   what the root of the site is. */
function detectLang(html) {
  const tag = (html.match(/<html\s+lang="([^"]+)"/i) ?? [, "de"])[1].toLowerCase();
  const code = tag.split("-")[0];
  return MENU[code] ? code : "de";
}

async function rewriteNavigation() {
  const files = (await walk(ROOT)).filter((f) => extname(f).toLowerCase() === ".html");
  let changed = 0;
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    const html = await readFile(file, "utf8");
    if (!html.includes('<nav class="nav"')) continue;
    const lang = detectLang(html);
    // reuse the hreflang tags already on the page as the picker's targets
    const alternates = {};
    for (const m of html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">/gi)) {
      if (m[1] !== "x-default") alternates[m[1]] = m[2];
    }
    const next = html.replace(/<nav class="nav"[\s\S]*?<\/nav>/, nav(rootFor(rel), lang, alternates));
    if (next !== html) {
      await writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  return changed;
}

/* Repoints every brand reference on the site at assets/brand/. Covers the pages
   this layer does not regenerate — the 7,572 legacy German pages still carry
   their own footer, and they were using the 3.97:1 wordmark as a favicon, which
   renders as an illegible smear at 32px. */
async function rewriteBrand() {
  const files = (await walk(ROOT)).filter((f) => extname(f).toLowerCase() === ".html");
  let changed = 0;
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    const root = rootFor(rel);
    const original = await readFile(file, "utf8");
    const lang = /<html\s+lang="en"/i.test(original) ? "en" : "de";
    let html = original;

    html = html.replace(/<a class="brand"([^>]*)>[\s\S]*?<\/a>/g, (match, attrs) => {
      const href = (attrs.match(/href="([^"]*)"/) ?? [, ""])[1];
      return brandLockup(root, href, lang);
    });

    html = html.replace(/<link rel="icon"[^>]*>/g, `<link rel="icon" type="image/png" href="${root}${BRAND}${MARK}">`);

    // catches both the plain string form and the ImageObject form used by the guides
    html = html.replaceAll(`${BASE}assets/images/modunera-logo.png`, `${BASE}${BRAND}${LOGO}-600.png`);
    html = html.replaceAll(`${BASE}assets/images/modunera-mark.png`, `${BASE}${BRAND}${MARK}`);

    if (html !== original) {
      await writeFile(file, html, "utf8");
      changed += 1;
    }
  }
  return changed;
}

/* Swaps the legacy two-icon rail for the WhatsApp dock on the pages this layer
   does not regenerate — the 7,572 German pages carry their own footer. */
async function rewriteWhatsapp() {
  const files = (await walk(ROOT)).filter((f) => extname(f).toLowerCase() === ".html");
  let changed = 0;
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    const original = await readFile(file, "utf8");
    if (original.includes('id="waDock"')) continue;
    const lang = /<html\s+lang="en"/i.test(original) ? "en" : "de";
    // legacy pages carry the old rail; the locale pages carry nothing, so the dock
    // is appended before </body> when there is no rail to replace
    const html = original.includes('<div class="floating-actions">')
      ? original.replace(/<div class="floating-actions">[\s\S]*?<\/div>/, whatsappDock(lang))
      : original.replace("</body>", whatsappDock(lang) + "</body>");
    if (html !== original) {
      await writeFile(file, html, "utf8");
      changed += 1;
    }
  }
  return changed;
}

/* Hero slideshow. Five stills, crossfaded by CSS alone — no library, no script.
   Only the first is fetched at high priority; the rest are hints-lowered so they
   never compete with the page. */
const HERO_SLIDES = 5;

function heroSlides(root) {
  const imgs = Array.from({ length: HERO_SLIDES }, (_, i) => {
    const base = `${root}assets/images/hero-slides/slide-${i + 1}`;
    const priority = i === 0 ? 'fetchpriority="high"' : 'fetchpriority="low"';
    // Phones get a 3:4 crop: a landscape still in a tall portrait box loses about
    // two thirds of its width to object-fit:cover, which left the house unreadable.
    return `<picture><source media="(max-width:640px)" srcset="${base}-portrait.webp"><img src="${base}-1400.webp" srcset="${base}-760.webp 760w, ${base}-1400.webp 1400w" sizes="100vw" alt="" decoding="async" ${priority}></picture>`;
  }).join("");
  return `<div class="hero-slides" aria-hidden="true">${imgs}</div>`;
}

/* Puts the slideshow inside the existing .hero-media wrapper on both home pages.
   Idempotent: it only fills the wrapper when it is still empty. */
async function insertHeroSlides() {
  let added = 0;
  for (const rel of ["index.html", "en/index.html"]) {
    const file = join(ROOT, rel);
    const html = await readFile(file, "utf8");
    if (html.includes('class="hero-slides"')) continue;
    if (!html.includes('<div class="hero-media"></div>')) throw new Error(`hero-media wrapper missing in ${rel}`);
    const next = html.replace('<div class="hero-media"></div>', `<div class="hero-media">${heroSlides(rootFor(rel))}</div>`);
    await writeFile(file, next, "utf8");
    added += 1;
  }
  return added;
}

async function buildSitemaps() {
  const all = await walk(ROOT, []);
  const skip = new Set(["admin-demo", "customer-portal", "saved-designs", "booking"]);
  const urls = all
    .filter((f) => f.endsWith("index.html"))
    .map((f) => relative(ROOT, f).replaceAll("\\", "/"))
    .filter((rel) => !skip.has(rel.split("/")[0]))
    .map((rel) => canonicalFor(rel))
    .sort();
  const dir = join(ROOT, "sitemaps");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const names = [];
  for (let i = 0; i < urls.length; i += 2000) {
    const chunk = urls.slice(i, i + 2000);
    const name = `sitemap-${String(names.length + 1).padStart(4, "0")}.xml`;
    names.push(name);
    const body = chunk
      .map((url) => `<url><loc>${esc(url)}</loc><lastmod>${UPDATED}</lastmod><changefreq>${url.includes("/blog/") || url.includes("/guides/") || url.includes("/ratgeber/") ? "monthly" : "weekly"}</changefreq><priority>${url === BASE ? "1.0" : url.includes("/standorte/") || url.includes("/locations/") ? "0.6" : "0.8"}</priority></url>`)
      .join("");
    await put(`sitemaps/${name}`, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  }
  await put("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${names.map((n) => `<sitemap><loc>${BASE}sitemaps/${n}</loc><lastmod>${UPDATED}</lastmod></sitemap>`).join("")}</sitemapindex>`);
  return { urls: urls.length, sitemaps: names.length };
}

async function main() {
  const pricing = await loadPricing();

  await put("modellvergleich/index.html", modelComparisonPage(pricing, "de"));
  await put("en/model-comparison/index.html", modelComparisonPage(pricing, "en"));
  await put("preisvergleich/index.html", priceComparisonPage(pricing, "de"));
  await put("en/price-comparison/index.html", priceComparisonPage(pricing, "en"));
  await put("vorteile/index.html", advantagesPage(pricing, "de"));
  await put("en/advantages/index.html", advantagesPage(pricing, "en"));

  const posts = await collectGuides();
  const { groups, rest } = groupGuides(posts);
  await put("ratgeber/index.html", guideHubPage(posts, groups, rest));
  let categoryPages = 0;
  for (const category of GUIDE_CATEGORIES) {
    const list = groups.get(category.slug);
    if (!list.length) continue;
    await put(`ratgeber/${category.slug}/index.html`, guideCategoryPage(category, list));
    categoryPages += 1;
  }

  for (const guide of MARKET_GUIDES) {
    await put(`blog/europa/${guide.deSlug}/index.html`, marketGuidePage(guide, "de"));
    await put(`en/guides/${guide.enSlug}/index.html`, marketGuidePage(guide, "en"));
  }

  const navChanged = await rewriteNavigation();
  const heroSlideshows = await insertHeroSlides();
  const brandChanged = await rewriteBrand();
  const waChanged = await rewriteWhatsapp();
  const sitemap = await buildSitemaps();

  // keep the build report in step, since validate-modunera.mjs reports its sitemap_urls
  const reportPath = join(ROOT, "build-report-modunera.json");
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  report.sitemap_urls = sitemap.urls;
  report.sitemap_files = sitemap.sitemaps;
  report.generated_comparison_pages = 6;
  report.generated_guide_hub_pages = 1 + categoryPages;
  report.generated_market_guides = MARKET_GUIDES.length * 2;
  report.categorised_guides = posts.length;
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(JSON.stringify({
    layer: "v2",
    newPages: 6 + 1 + categoryPages + MARKET_GUIDES.length * 2,
    guideCategories: categoryPages,
    categorisedGuides: posts.length,
    marketGuides: MARKET_GUIDES.length * 2,
    navigationRewritten: navChanged,
    heroSlideshows,
    brandRewritten: brandChanged,
    whatsappDocks: waChanged,
    sitemap,
  }));
}

await main();
