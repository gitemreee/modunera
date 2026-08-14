/**
 * MODUNERA depth layer.
 *
 * The site had breadth — 14,800 pages — and almost no depth: a model page was
 * 470 words, a country page 820, and the 125 blog posts were the same seven
 * paragraphs with a different keyword pasted in. Search engines read that as one
 * page repeated; a buyer reads it as a brochure with nothing in it.
 *
 * This layer writes the pages that carry the actual argument:
 *   · MD 1 to MD 8 in all five languages, with layout, specification, delivery
 *     and running costs, instead of one German stub each;
 *   · a question set per destination country, per language, marked up as
 *     FAQPage so the answers can be indexed on their own;
 *   · long-form bodies for the guide and blog library, built from per-topic
 *     material rather than one template.
 *
 * It runs after the country/locale builders and before build-modunera-v2.mjs,
 * which owns navigation, the WhatsApp dock and the sitemaps. Pages emitted here
 * therefore carry a placeholder <nav class="nav"></nav> for v2 to fill.
 *
 * Everything is written from data, and rewriting a page is idempotent: running
 * the pipeline twice produces a byte-identical tree.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const BASE = "https://modunera.com/";
const PHONE_TEL = "+905535435342";
const PHONE_DISPLAY = "+90 553 543 5342";
const WA_NUMBER = "905535435342";
const UPDATED = "2026-08-14";

const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NUM_LOCALE = { de: "de-DE", en: "en-GB", nl: "nl-NL", da: "da-DK", fr: "fr-FR" };
const eur = (n, lang) => new Intl.NumberFormat(NUM_LOCALE[lang] ?? "en-GB").format(n) + " €";
const num = (n, lang) => new Intl.NumberFormat(NUM_LOCALE[lang] ?? "en-GB").format(n);
const waLink = (message) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

async function put(file, content) {
  const target = join(ROOT, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "assets", "downloads"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

const rootFor = (rel) => "../".repeat(rel.split("/").length - 1);
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

/* --- language configuration ---------------------------------------------- */

const LOCALES = JSON.parse(await readFile(join(ROOT, "data/locales.json"), "utf8")).locales;
const PRICING = JSON.parse(await readFile(join(ROOT, "data/pricing.json"), "utf8"));

/* Section paths per language. German and English are fixed by the existing tree;
   the other three come from data/locales.json, where their slugs are written in
   their own language rather than translated out of English. */
const PATHS = {
  de: { models: "modelle", questions: "fragen", countries: "laender", faq: "faq", home: "index.html", guides: "ratgeber" },
  en: { models: "en/models", questions: "en/questions", countries: "en/countries", faq: "en/faq", home: "en/", guides: "en/guides" },
  nl: { models: "nl/modellen", questions: "nl/vragen-per-land", countries: "nl/landen", faq: "nl/veelgestelde-vragen", home: "nl/", guides: "nl/gidsen" },
  da: { models: "da/modeller", questions: "da/spoergsmaal-per-land", countries: "da/lande", faq: "da/ofte-stillede-spoergsmaal", home: "da/", guides: "da/guides" },
  fr: { models: "fr/modeles", questions: "fr/questions-par-pays", countries: "fr/pays", faq: "fr/questions-frequentes", home: "fr/", guides: "fr/guides" },
};

const HTML_LANG = { de: "de-DE", en: "en-GB", nl: "nl-NL", da: "da-DK", fr: "fr-FR" };
const OG_LOCALE = { de: "de_DE", en: "en_GB", nl: "nl_NL", da: "da_DK", fr: "fr_FR" };
const LANGS = ["de", "en", "nl", "da", "fr"];

/* Country slugs per language. The German and English trees already exist under
   these names; the other three are read from the locale data so the depth layer
   and the locale builder cannot drift apart. */
const COUNTRY_SLUGS = {
  de: { DE: "deutschland", NL: "niederlande", DK: "daenemark", LU: "luxemburg", CH: "schweiz" },
  en: { DE: "germany", NL: "netherlands", DK: "denmark", LU: "luxembourg", CH: "switzerland" },
  nl: LOCALES.nl.countrySlugs,
  da: LOCALES.da.countrySlugs,
  fr: LOCALES.fr.countrySlugs,
};

const COUNTRY_NAMES = {
  de: { DE: "Deutschland", NL: "Niederlande", DK: "Dänemark", LU: "Luxemburg", CH: "Schweiz" },
  en: { DE: "Germany", NL: "the Netherlands", DK: "Denmark", LU: "Luxembourg", CH: "Switzerland" },
  nl: LOCALES.nl.countryNames,
  da: LOCALES.da.countryNames,
  fr: LOCALES.fr.countryNames,
};

const COUNTRY_ORDER = ["DE", "NL", "DK", "LU", "CH"];

/* --- shared page shell ---------------------------------------------------- */

/* The navigation is deliberately empty: build-modunera-v2.mjs replaces every
   <nav class="nav">…</nav> on the tree with the header for that page's language,
   so writing one here would only be overwritten. The hreflang set is written for
   real, because v2 reads it back to build the language picker's targets. */
const UI = {
  de: {
    skip: "Zum Inhalt springen", home: "Startseite", breadHome: "Startseite",
    ctaTitle: "Projekt in 2 Minuten starten.",
    ctaText: "Zielland, Nutzung und Wunschmodell per WhatsApp senden – wir strukturieren den nächsten Schritt.",
    ctaButton: "WhatsApp-Anfrage →",
    footerAbout: "Tiny Houses als Kernprodukt. Dazu Modulbau, Stahlbau, Bungalows und maßgefertigte Möbel – direkt aus eigener Produktion für Europa.",
    footCountries: "Länder", footCompare: "Vergleichen", footKnowledge: "Wissen",
    rights: "Alle Rechte vorbehalten.",
    legalFooter: "Hinweise ersetzen keine Behörden-, Rechts-, Steuer- oder Statikberatung.",
    disclaimer: `Stand ${UPDATED}. Alle Angaben sind unverbindliche Projektorientierung und keine Rechts-, Behörden-, Statik-, Energie- oder Steuerberatung. Preise sind Indikationen ab Werk; verbindlich ist ausschließlich ein geprüftes Angebot.`,
    updated: "Aktualisiert", source: "Offizielle Quelle", readMore: "Weiterlesen",
    configure: "Preis konfigurieren", whatsapp: "WhatsApp", call: PHONE_DISPLAY,
    contents: "Inhalt", nextStep: "Nächster Schritt",
  },
  en: {
    skip: "Skip to content", home: "Home", breadHome: "Home",
    ctaTitle: "Start your project in two minutes.",
    ctaText: "Send your country, intended use and preferred model via WhatsApp and we will structure the next step.",
    ctaButton: "WhatsApp enquiry →",
    footerAbout: "Tiny houses are our core product, complemented by modular buildings, steel structures, bungalows and bespoke furniture for Europe.",
    footCountries: "Countries", footCompare: "Compare", footKnowledge: "Knowledge",
    rights: "All rights reserved.",
    legalFooter: "Guidance does not replace authority, legal, tax or structural advice.",
    disclaimer: `As of ${UPDATED}. All figures are non-binding project guidance and not legal, authority, structural, energy or tax advice. Prices are ex-works indications; only a checked quotation is binding.`,
    updated: "Updated", source: "Official source", readMore: "Read more",
    configure: "Configure the price", whatsapp: "WhatsApp", call: PHONE_DISPLAY,
    contents: "Contents", nextStep: "Next step",
  },
  nl: {
    skip: "Naar de inhoud", home: "Home", breadHome: "Home",
    ctaTitle: "Start uw project in twee minuten.",
    ctaText: "Stuur land, gebruik en gewenst model via WhatsApp — wij structureren de volgende stap.",
    ctaButton: "WhatsApp-aanvraag →",
    footerAbout: "Tiny houses zijn ons kernproduct, aangevuld met modulaire bouw, staalconstructies, bungalows en meubels op maat voor Europa.",
    footCountries: "Landen", footCompare: "Vergelijken", footKnowledge: "Kennis",
    rights: "Alle rechten voorbehouden.",
    legalFooter: "Informatie vervangt geen advies van overheid, jurist, fiscalist of constructeur.",
    disclaimer: `Bijgewerkt ${UPDATED}. Alle bedragen zijn vrijblijvende projectindicaties en geen juridisch, bestuurlijk, constructief, energetisch of fiscaal advies. Prijzen zijn indicaties af fabriek; alleen een gecontroleerde offerte is bindend.`,
    updated: "Bijgewerkt", source: "Officiële bron", readMore: "Meer lezen",
    configure: "Prijs configureren", whatsapp: "WhatsApp", call: PHONE_DISPLAY,
    contents: "Inhoud", nextStep: "Volgende stap",
  },
  da: {
    skip: "Gå til indhold", home: "Forside", breadHome: "Forside",
    ctaTitle: "Start dit projekt på to minutter.",
    ctaText: "Send land, anvendelse og ønsket model via WhatsApp — vi strukturerer næste skridt.",
    ctaButton: "WhatsApp-forespørgsel →",
    footerAbout: "Tiny houses er vores kerneprodukt, suppleret med modulbyggeri, stålkonstruktioner, bungalower og specialfremstillede møbler til Europa.",
    footCountries: "Lande", footCompare: "Sammenlign", footKnowledge: "Viden",
    rights: "Alle rettigheder forbeholdes.",
    legalFooter: "Vejledningen erstatter ikke myndigheds-, juridisk, skatte- eller ingeniørrådgivning.",
    disclaimer: `Opdateret ${UPDATED}. Alle tal er uforpligtende projektvejledning og ikke juridisk, myndigheds-, konstruktions-, energi- eller skatterådgivning. Priser er ab fabrik-indikationer; kun et kontrolleret tilbud er bindende.`,
    updated: "Opdateret", source: "Officiel kilde", readMore: "Læs mere",
    configure: "Konfigurer prisen", whatsapp: "WhatsApp", call: PHONE_DISPLAY,
    contents: "Indhold", nextStep: "Næste skridt",
  },
  fr: {
    skip: "Aller au contenu", home: "Accueil", breadHome: "Accueil",
    ctaTitle: "Démarrez votre projet en deux minutes.",
    ctaText: "Envoyez votre pays, votre usage et le modèle souhaité par WhatsApp — nous structurons l'étape suivante.",
    ctaButton: "Demande WhatsApp →",
    footerAbout: "Les tiny houses sont notre produit principal, complété par la construction modulaire, les structures acier, les bungalows et le mobilier sur mesure pour l'Europe.",
    footCountries: "Pays", footCompare: "Comparer", footKnowledge: "Ressources",
    rights: "Tous droits réservés.",
    legalFooter: "Ces informations ne remplacent pas un conseil administratif, juridique, fiscal ou structurel.",
    disclaimer: `Mise à jour du ${UPDATED}. Tous les chiffres sont des orientations de projet sans engagement et ne constituent pas un conseil juridique, administratif, structurel, énergétique ou fiscal. Les prix sont des indications départ usine ; seule une offre vérifiée engage.`,
    updated: "Mise à jour", source: "Source officielle", readMore: "Lire la suite",
    configure: "Configurer le prix", whatsapp: "WhatsApp", call: PHONE_DISPLAY,
    contents: "Sommaire", nextStep: "Étape suivante",
  },
};

function head({ lang, rel, title, description, alternates, image, extraLd = [] }) {
  const root = rootFor(rel);
  const canonical = BASE + rel.replace(/index\.html$/, "");
  const hreflang = LANGS
    .filter((code) => alternates[code])
    .map((code) => `<link rel="alternate" hreflang="${code}" href="${BASE + alternates[code].replace(/index\.html$/, "")}">`)
    .join("");
  const xDefault = alternates.de ?? alternates.en;
  return `<!DOCTYPE html><html lang="${HTML_LANG[lang]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}">${hreflang}<link rel="alternate" hreflang="x-default" href="${BASE + xDefault.replace(/index\.html$/, "")}"><meta property="og:type" content="website"><meta property="og:locale" content="${OG_LOCALE[lang]}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${BASE}${image ?? "assets/images/gallery/hero-forest.webp"}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${root}assets/brand/modunera-mark-v1.png"><link rel="stylesheet" href="${root}assets/css/styles.css">${extraLd.map(jsonLd).join("")}</head><body><a class="skip" href="#main">${esc(UI[lang].skip)}</a><nav class="nav"></nav>`;
}

function footer(lang, rel) {
  const root = rootFor(rel);
  const u = UI[lang];
  const p = PATHS[lang];
  const cs = COUNTRY_SLUGS[lang];
  const cn = COUNTRY_NAMES[lang];
  const countryLinks = COUNTRY_ORDER
    .map((c) => `<a href="${root}${p.countries}/${cs[c]}/">${esc(cn[c].replace(/^the /, ""))}</a>`)
    .join("");
  const compare = lang === "de"
    ? `<a href="${root}modellvergleich/">Modellvergleich</a><a href="${root}preisvergleich/">Preisvergleich</a><a href="${root}vorteile/">Vorteile</a><a href="${root}studio/">Design Studio</a>`
    : lang === "en"
      ? `<a href="${root}en/model-comparison/">Model comparison</a><a href="${root}en/price-comparison/">Price comparison</a><a href="${root}en/advantages/">Advantages</a><a href="${root}studio/">Design Studio</a>`
      : `<a href="${root}${p.models}/">${esc(LOCALES[lang].labels.allModels)}</a><a href="${root}${p.countries}/">${esc(LOCALES[lang].labels.countries)}</a><a href="${root}studio/">Design Studio</a>`;
  const knowledge = `<a href="${root}${p.guides}/">${esc(lang === "de" ? "Ratgeber" : lang === "en" ? "Guides" : LOCALES[lang].labels.guides)}</a><a href="${root}${p.questions}/">${esc(lang === "de" ? "Länderfragen" : lang === "en" ? "Country questions" : LOCALES[lang].labels.questions)}</a><a href="${root}${p.faq}/">${esc(lang === "de" ? "FAQ" : lang === "en" ? "FAQ" : LOCALES[lang].labels.faq)}</a><a href="${root}kontakt/">${esc(lang === "fr" || lang === "en" || lang === "nl" ? "Contact" : lang === "da" ? "Kontakt" : "Kontakt")}</a>`;
  const waMsg = lang === "de"
    ? "Hallo MODUNERA, mein Zielland ist: __. Nutzung: __. Wunschgröße/Modell: __. Bitte kontaktieren Sie mich."
    : LOCALES[lang]?.wa ?? "Hello MODUNERA. Destination country: __. Intended use: __. Preferred size/model: __. Please contact me.";
  return `<section class="cta-band"><div class="container cta-inner"><div><h2>${esc(u.ctaTitle)}</h2><p>${esc(u.ctaText)}</p></div><a class="btn btn-light" href="${waLink(waMsg)}" target="_blank" rel="noopener">${esc(u.ctaButton)}</a></div></section><footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="${root}${p.home}"><img src="${root}assets/brand/modunera-master-logo-mountain-v1-600.png" alt="MODUNERA"></a><p>${esc(u.footerAbout)}</p><a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></div><div><h4>${esc(u.footCountries)}</h4>${countryLinks}</div><div><h4>${esc(u.footCompare)}</h4>${compare}</div><div><h4>${esc(u.footKnowledge)}</h4>${knowledge}</div></div><div class="footer-bottom"><span>© <span data-year>2026</span> MODUNERA. ${esc(u.rights)}</span><span>${esc(u.legalFooter)}</span></div></div></footer><script src="${root}assets/js/main.js"></script></body></html>`;
}

const breadcrumbLd = (trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: BASE + url })),
});

const faqLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

const faqMarkup = (items) =>
  items
    .map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span>+</span></button><div class="faq-answer"><p>${esc(a)}</p></div></div>`)
    .join("");

const disclaimer = (lang) => `<p class="legal-note">${esc(UI[lang].disclaimer)}</p>`;

const sectionHeader = (eyebrow, h2, lead) =>
  `<div class="section-header"><div><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(h2)}</h2></div>${lead ? `<p>${lead}</p>` : ""}</div>`;

/* --- model pages ---------------------------------------------------------- */

const MODEL_COPY = JSON.parse(await readFile(join(ROOT, "data/model-copy.json"), "utf8")).models;
const DEPTH = JSON.parse(await readFile(join(ROOT, "data/depth-copy.json"), "utf8"));
const SOURCES = DEPTH.sources;

const modelUrl = (lang, n) => `${PATHS[lang].models}/md-${n}/index.html`;
const modelIndexUrl = (lang) => `${PATHS[lang].models}/index.html`;

const modelAlternates = (n) => Object.fromEntries(LANGS.map((code) => [code, modelUrl(code, n)]));

/* Lengths are stored as one German-formatted string in pricing.json ("8,00 / 9,70 m").
   Splitting and reformatting keeps English readers from meeting a decimal comma. */
function lengths(n, lang) {
  const raw = PRICING.models[`mc${n}`].lengths;
  const values = raw.replace(/\s*m$/, "").split("/").map((v) => Number(v.trim().replace(",", ".")));
  const joiner = { de: " oder ", en: " or ", nl: " of ", da: " eller ", fr: " ou " }[lang];
  return values.map((v) => `${v.toFixed(2).replace(".", lang === "en" ? "." : ",")} m`).join(joiner);
}

/* 2.55 m in English, 2,55 m everywhere else — a decimal comma reads as a
   thousands separator to an English eye. */
const width = (lang) => (lang === "en" ? "2.55 m" : "2,55 m");

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);

function deliveryRows(lang, base) {
  return COUNTRY_ORDER.map((c) => {
    const d = PRICING.delivery[c];
    return [COUNTRY_NAMES[lang][c].replace(/^the /, ""), eur(base, lang), eur(d.eur, lang), eur(base + d.eur, lang)];
  });
}

const table = (head, rows) =>
  `<div class="compare"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((cell, i) => `<t${i === 0 ? "h" : "d"}>${cell}</t${i === 0 ? "h" : "d"}>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

function modelPage(lang, n) {
  const rel = modelUrl(lang, n);
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const d = DEPTH[lang];
  const copy = MODEL_COPY[String(n)][lang];
  const spec = PRICING.models[`mc${n}`];
  const model = `MD ${n}`;
  const vars = { model, price: eur(spec.base_eur, lang), sleeps: MODEL_COPY[String(n)].sleeps, lengths: lengths(n, lang) };
  const images = MODEL_COPY[String(n)].images;
  const heroImage = `assets/images/gallery/${images[0]}.webp`;

  const title = `${model} – ${copy.label} | MODUNERA Tiny House`;
  const description = copy.lead.length > 155 ? copy.lead.slice(0, 152).trimEnd() + "…" : copy.lead;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `MODUNERA ${model}`,
    sku: `MD-${n}`,
    category: "Tiny House",
    description: copy.lead,
    image: BASE + heroImage,
    brand: { "@type": "Brand", name: "MODUNERA" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: spec.base_eur,
      availability: "https://schema.org/PreOrder",
      url: BASE + rel.replace(/index\.html$/, ""),
      priceValidUntil: "2027-12-31",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: d.specLabels.width, value: width(lang) },
      { "@type": "PropertyValue", name: d.specLabels.length, value: lengths(n, lang) },
      { "@type": "PropertyValue", name: d.specLabels.sleeps, value: MODEL_COPY[String(n)].sleeps },
    ],
  };

  const trail = [
    [u.breadHome, p.home],
    [lang === "de" ? "Modelle" : lang === "en" ? "Models" : LOCALES[lang]?.labels.allModels ?? "Models", `${p.models}/`],
    [model, rel.replace(/index\.html$/, "")],
  ];

  const faqItems = d.faq.items.map(([q, a]) => [fill(q, vars), fill(a, vars)]);

  const specCards = [
    [d.specLabels.length, lengths(n, lang)],
    [d.specLabels.width, width(lang)],
    [d.specLabels.layout, spec[`layout_${lang === "de" ? "de" : "en"}`]],
    [d.specLabels.sleeps, MODEL_COPY[String(n)].sleeps],
    [d.specLabels.price, `${eur(spec.base_eur, lang)}*`],
    [d.specLabels.delivery, eur(Math.min(...COUNTRY_ORDER.map((c) => PRICING.delivery[c].eur)), lang)],
  ];

  const compareRows = Array.from({ length: 8 }, (_, i) => {
    const k = i + 1;
    const s = PRICING.models[`mc${k}`];
    const name = k === n
      ? `<strong>MD ${k}</strong>`
      : `<a href="${root}${p.models}/md-${k}/">MD ${k}</a>`;
    return [name, esc(MODEL_COPY[String(k)][lang].label), esc(lengths(k, lang)), esc(eur(s.base_eur, lang))];
  });

  const waMsg = lang === "de"
    ? `Hallo MODUNERA, ich interessiere mich für ${model}. Zielland/Ort: __. Nutzung: __. Personen: __. Budget: __.`
    : lang === "en"
      ? `Hello MODUNERA, I am interested in ${model}. Destination/place: __. Intended use: __. People: __. Budget: __.`
      : `${LOCALES[lang].wa} (${model})`;

  /* .model-hero, which the package's own model pages used, has no CSS at all — the
     image was simply laid out at its natural size and pushed the heading below the
     fold. .article-visual-hero is the styled equivalent the blog already uses. */
  const body = `<main id="main"><header class="article-visual-hero"><img src="${root}${heroImage}" alt="MODUNERA ${model} ${esc(copy.label)}"><div class="article-visual-overlay"></div><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · <a href="${root}${p.models}/">${esc(trail[1][0])}</a> · ${model}</div><div class="model-label">${esc(copy.label)}</div><h1>${model} · ${esc(copy.label)}</h1><p>${esc(copy.lead)}</p><div class="hero-actions"><a class="btn btn-primary" href="${root}konfigurator/?model=mc${n}">${esc(u.configure)}</a><a class="btn btn-light" href="${waLink(waMsg)}" target="_blank" rel="noopener">WhatsApp</a></div></div></header>

<section class="section"><div class="container">${sectionHeader(d.glance.eyebrow, fill(d.glance.h2, vars), esc(copy.lead))}<div class="spec-grid">${specCards
    .map(([label, value]) => `<div class="spec"><span class="blog-meta">${esc(label)}</span><strong>${esc(value)}</strong></div>`)
    .join("")}</div><p class="legal-note" style="margin-top:14px">*${esc(u.disclaimer)}</p></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(d.layout.eyebrow, fill(d.layout.h2, vars))}<div class="editorial-split"><div class="editorial-copy"><p>${esc(copy.layout)}</p><h3>${esc(d.layout.bestFor)}</h3><ul class="check-list">${copy.best.map((b) => `<li>${esc(b)}</li>`).join("")}</ul><h3>${esc(d.layout.notFor)}</h3><p>${esc(copy.notFor)}</p></div><div class="editorial-copy"><h3>${esc(d.glance.eyebrow)}</h3><ul class="check-list">${copy.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></div></div></div></section>

<section class="section"><div class="container">${sectionHeader(d.gallery.eyebrow, fill(d.gallery.h2, vars), esc(d.gallery.lead))}<div class="gallery-grid">${images
    .map((img, i) => `<button data-lightbox="${root}assets/images/gallery/${img}.webp" aria-label="${esc(model)}"><img src="${root}assets/images/gallery/${img}.webp" alt="MODUNERA ${model} – ${i + 1}" loading="lazy" width="900" height="600"></button>`)
    .join("")}</div></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(d.tech.eyebrow, fill(d.tech.h2, vars), esc(d.tech.lead))}<div class="benefit-grid">${d.tech.cards
    .map(([h3, text]) => `<div class="benefit-card"><h3>${esc(h3)}</h3><p>${esc(text)}</p></div>`)
    .join("")}</div></div></section>

<section class="section"><div class="container">${sectionHeader(d.options.eyebrow, d.options.h2, esc(d.options.lead))}<div class="quality-grid">${d.options.items
    .map(([h3, text]) => `<div class="quality-card"><h3>${esc(h3)}</h3><p>${esc(text)}</p></div>`)
    .join("")}</div></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(d.climate.eyebrow, fill(d.climate.h2, vars), esc(d.climate.lead))}<div class="state-grid">${COUNTRY_ORDER
    .map((c) => `<div class="state-card"><h3>${esc(COUNTRY_NAMES[lang][c].replace(/^the /, ""))}</h3><p>${esc(d.climate.countries[c])}</p><a class="source-link" href="${root}${p.countries}/${COUNTRY_SLUGS[lang][c]}/">${esc(u.readMore)} →</a></div>`)
    .join("")}</div></div></section>

<section class="section"><div class="container">${sectionHeader(d.costs.eyebrow, fill(d.costs.h2, vars), esc(d.costs.lead))}${table(d.costs.tableHead, deliveryRows(lang, spec.base_eur))}<p class="legal-note">${esc(d.costs.note)}</p><div class="quality-grid" style="margin-top:30px">${d.costs.items
    .map(([h3, text]) => `<div class="quality-card"><h3>${esc(h3)}</h3><p>${esc(text)}</p></div>`)
    .join("")}</div></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(d.permits.eyebrow, d.permits.h2, esc(fill(d.permits.lead, vars)))}<div class="answer-box"><strong>${esc(d.permits.eyebrow)}</strong><p>${esc(d.permits.warning)}</p></div><div class="state-grid" style="margin-top:26px">${COUNTRY_ORDER
    .map((c) => `<div class="state-card"><h3>${esc(COUNTRY_NAMES[lang][c].replace(/^the /, ""))}</h3><p>${esc(d.permits.countries[c])}</p><a class="source-link" href="${SOURCES[c]}" target="_blank" rel="noopener nofollow">${esc(u.source)} →</a></div>`)
    .join("")}</div></div></section>

<section class="section"><div class="container">${sectionHeader(d.compare.eyebrow, fill(d.compare.h2, vars), esc(d.compare.lead))}${table(d.compare.head, compareRows)}<div style="margin-top:24px"><a class="btn btn-dark" href="${root}${lang === "de" ? "modellvergleich/" : lang === "en" ? "en/model-comparison/" : p.models + "/"}">${esc(d.compare.cta)}</a></div></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(d.operation.eyebrow, d.operation.h2)}<div class="editorial-copy">${d.operation.paras.map((t) => `<p>${esc(t)}</p>`).join("")}</div></div></section>

<section class="section"><div class="container">${sectionHeader(d.faq.eyebrow, fill(d.faq.h2, vars))}<div class="faq-layout"><div>${faqMarkup(faqItems)}</div></div>${disclaimer(lang)}</div></section>

<section class="section section-soft"><div class="container">${sectionHeader(d.next.eyebrow, fill(d.next.h2, vars), esc(d.next.lead))}<div class="hero-actions"><a class="btn btn-primary" href="${waLink(waMsg)}" target="_blank" rel="noopener">${esc(d.next.button)}</a><a class="btn btn-outline" href="${root}konfigurator/?model=mc${n}">${esc(d.next.second)}</a></div></div></section></main>`;

  return head({
    lang,
    rel,
    title,
    description,
    alternates: modelAlternates(n),
    image: heroImage,
    extraLd: [productLd, breadcrumbLd(trail), faqLd(faqItems)],
  }) + body + footer(lang, rel);
}

function modelIndexPage(lang) {
  const rel = modelIndexUrl(lang);
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const d = DEPTH[lang];
  const heading = {
    de: ["Alle Modelle", "MD 1 bis MD 8.", "Acht Grundrisse auf derselben technischen Basis. Der Unterschied liegt in Länge, Aufteilung und Ausstattungstiefe – nicht in der Bauweise."],
    en: ["All models", "MD 1 to MD 8.", "Eight plans on one technical basis. What differs is length, layout and specification depth — not the way they are built."],
    nl: ["Alle modellen", "MD 1 tot en met MD 8.", "Acht plattegronden op dezelfde technische basis. Het verschil zit in lengte, indeling en afwerkingsdiepte — niet in de bouwwijze."],
    da: ["Alle modeller", "MD 1 til MD 8.", "Otte planer på samme tekniske grundlag. Forskellen ligger i længde, disponering og udstyrsdybde — ikke i byggemåden."],
    fr: ["Tous les modèles", "MD 1 à MD 8.", "Huit plans sur une même base technique. La différence tient à la longueur, à la distribution et à la profondeur d'équipement — pas au mode constructif."],
  }[lang];

  const cards = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const c = MODEL_COPY[String(n)][lang];
    const s = PRICING.models[`mc${n}`];
    const img = MODEL_COPY[String(n)].images[0];
    return `<article class="model-card"><a href="${root}${p.models}/md-${n}/"><img src="${root}assets/images/gallery/${img}.webp" alt="MODUNERA MD ${n}" loading="lazy" width="900" height="600"><div class="model-content"><div class="model-label">${esc(c.label)}</div><h3>MD ${n}</h3><p>${esc(c.lead)}</p><div class="model-specs"><span>${esc(lengths(n, lang))}</span><span>${esc(MODEL_COPY[String(n)].sleeps)}</span><span>${esc(eur(s.base_eur, lang))}</span></div></div></a></article>`;
  }).join("");

  const trail = [[UI[lang].breadHome, PATHS[lang].home], [heading[0], `${p.models}/`]];
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading[0],
    itemListElement: Array.from({ length: 8 }, (_, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `MODUNERA MD ${i + 1}`,
      url: BASE + `${p.models}/md-${i + 1}/`,
    })),
  };

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · ${esc(heading[0])}</div><div class="eyebrow">${esc(heading[0])}</div><h1>${esc(heading[1])}</h1><p>${esc(heading[2])}</p></div></header><section class="section"><div class="container"><div class="model-grid">${cards}</div>${disclaimer(lang)}</div></section><section class="section section-soft"><div class="container">${sectionHeader(d.compare.eyebrow, heading[1], esc(d.compare.lead))}${table(d.compare.head, Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const s = PRICING.models[`mc${n}`];
    return [`<a href="${root}${p.models}/md-${n}/">MD ${n}</a>`, esc(MODEL_COPY[String(n)][lang].label), esc(lengths(n, lang)), esc(eur(s.base_eur, lang))];
  }))}</div></section></main>`;

  return head({
    lang,
    rel,
    title: `${heading[0]} – MD 1 – MD 8 | MODUNERA`,
    description: heading[2],
    alternates: Object.fromEntries(LANGS.map((code) => [code, modelIndexUrl(code)])),
    image: "assets/images/gallery/mc1-exterior.webp",
    extraLd: [itemList, breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

async function buildModelPages() {
  let count = 0;
  for (const lang of LANGS) {
    for (let n = 1; n <= 8; n += 1) {
      await put(modelUrl(lang, n), modelPage(lang, n));
      count += 1;
    }
    await put(modelIndexUrl(lang), modelIndexPage(lang));
    count += 1;
  }
  return count;
}

/* --- country question pages ----------------------------------------------- */

/* The user's brief: "questions tied to each country, with answers, so it can be
   indexed". Twenty per country per language, each answer assembled from facts
   that actually differ between markets — a Danish answer about wastewater is not
   a German one with the country name swapped. Marked up as FAQPage so the
   answers can surface individually in search. */
const QA = JSON.parse(await readFile(join(ROOT, "data/country-qa.json"), "utf8"));

/* French needs the preposition that goes with each country name, not a bare
   name dropped into the sentence. */
const FR_IN = { DE: "en Allemagne", NL: "aux Pays-Bas", DK: "au Danemark", LU: "au Luxembourg", CH: "en Suisse" };
const FR_TO = { DE: "vers l'Allemagne", NL: "vers les Pays-Bas", DK: "vers le Danemark", LU: "vers le Luxembourg", CH: "vers la Suisse" };

const questionsUrl = (lang, code) => `${PATHS[lang].questions}/${code ? COUNTRY_SLUGS[lang][code] + "/" : ""}index.html`;

function countryQa(lang, code) {
  const facts = QA.facts[lang][code];
  const country = COUNTRY_NAMES[lang][code];
  const vars = {
    ...facts,
    country,
    countryIn: lang === "fr" ? FR_IN[code] : country,
    countryTo: lang === "fr" ? FR_TO[code] : country,
    updated: UPDATED,
    delivery: eur(PRICING.delivery[code].eur, lang),
  };
  return QA.questions[lang].map(([q, a]) => [fill(q, vars), fill(a, vars)]);
}

function questionsCountryPage(lang, code) {
  const rel = questionsUrl(lang, code);
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const l = QA.labels[lang];
  const country = COUNTRY_NAMES[lang][code];
  const vars = { country, countryIn: lang === "fr" ? FR_IN[code] : country };
  const items = countryQa(lang, code);

  const trail = [
    [u.breadHome, p.home],
    [l.hub, `${p.questions}/`],
    [country.replace(/^the /, ""), rel.replace(/index\.html$/, "")],
  ];

  const others = COUNTRY_ORDER.filter((c) => c !== code)
    .map((c) => `<a class="cat-chip" href="${root}${p.questions}/${COUNTRY_SLUGS[lang][c]}/">${esc(COUNTRY_NAMES[lang][c].replace(/^the /, ""))}</a>`)
    .join("");

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · <a href="${root}${p.questions}/">${esc(l.hub)}</a> · ${esc(country.replace(/^the /, ""))}</div><div class="eyebrow">${esc(l.hub)}</div><h1>${esc(fill(l.pageH1, vars))}</h1><p>${esc(l.hubLead)}</p><div class="hero-actions"><a class="btn btn-primary" href="${root}${p.countries}/${COUNTRY_SLUGS[lang][code]}/">${esc(l.openCountry)}</a><a class="btn btn-outline" href="${root}${p.models}/">MD 1 – MD 8</a></div></div></header>

<section class="section"><div class="container"><div class="faq-layout"><div>${faqMarkup(items)}</div></div>${disclaimer(lang)}<p><a class="source-link" href="${SOURCES[code]}" target="_blank" rel="noopener nofollow">${esc(u.source)}: ${esc(country.replace(/^the /, ""))} →</a></p></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(l.hub, l.allCountries)}<div class="cat-rail">${others}</div></div></section></main>`;

  return head({
    lang,
    rel,
    title: fill(l.pageTitle, vars),
    description: `${fill(l.pageH1, vars)} ${l.hubLead}`.slice(0, 158),
    alternates: Object.fromEntries(LANGS.map((c) => [c, questionsUrl(c, code)])),
    image: "assets/images/gallery/hero-forest.webp",
    extraLd: [faqLd(items), breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

function questionsHubPage(lang) {
  const rel = questionsUrl(lang, null);
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const l = QA.labels[lang];

  const cards = COUNTRY_ORDER.map((c) => {
    const name = COUNTRY_NAMES[lang][c].replace(/^the /, "");
    const first = countryQa(lang, c)[0];
    return `<div class="state-card"><h3>${esc(name)}</h3><p>${esc(first[1].slice(0, 190))}…</p><a class="source-link" href="${root}${p.questions}/${COUNTRY_SLUGS[lang][c]}/">${esc(name)}: 20 ${esc(l.questions.toLowerCase())} →</a></div>`;
  }).join("");

  const trail = [[u.breadHome, p.home], [l.hub, `${p.questions}/`]];
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: l.hub,
    description: l.hubLead,
    hasPart: COUNTRY_ORDER.map((c) => ({
      "@type": "FAQPage",
      name: fill(l.pageTitle, { country: COUNTRY_NAMES[lang][c], countryIn: lang === "fr" ? FR_IN[c] : COUNTRY_NAMES[lang][c] }),
      url: BASE + `${p.questions}/${COUNTRY_SLUGS[lang][c]}/`,
    })),
  };

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · ${esc(l.hub)}</div><div class="eyebrow">${esc(l.hub)}</div><h1>${esc(l.hubH1)}</h1><p>${esc(l.hubLead)}</p></div></header><section class="section"><div class="container"><div class="state-grid">${cards}</div>${disclaimer(lang)}</div></section></main>`;

  return head({
    lang,
    rel,
    title: `${l.hub} – MODUNERA`,
    description: l.hubLead.slice(0, 158),
    alternates: Object.fromEntries(LANGS.map((c) => [c, questionsUrl(c, null)])),
    image: "assets/images/gallery/hero-forest.webp",
    extraLd: [collection, breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

async function buildQuestionPages() {
  let count = 0;
  for (const lang of LANGS) {
    await put(questionsUrl(lang, null), questionsHubPage(lang));
    count += 1;
    for (const code of COUNTRY_ORDER) {
      await put(questionsUrl(lang, code), questionsCountryPage(lang, code));
      count += 1;
    }
  }
  return count;
}

/* --- country pages get the question set too -------------------------------- */

/* The existing country pages are 330 to 860 words. Appending the same twenty
   answers there — inside a marked block so a second run replaces rather than
   duplicates — roughly quadruples them and gives each one its own FAQPage. */
const MARK_OPEN = "<!-- MODUNERA DEPTH START -->";
const MARK_CLOSE = "<!-- MODUNERA DEPTH END -->";

function depthBlock(lang, code, root) {
  const l = QA.labels[lang];
  const p = PATHS[lang];
  const country = COUNTRY_NAMES[lang][code];
  const vars = { country, countryIn: lang === "fr" ? FR_IN[code] : country };
  const items = countryQa(lang, code);
  return `${MARK_OPEN}<section class="section section-soft" id="fragen"><div class="container">${sectionHeader(l.hub, fill(l.pageH1, vars), esc(l.hubLead))}<div class="faq-layout"><div>${faqMarkup(items)}</div></div>${disclaimer(lang)}<div style="margin-top:22px"><a class="btn btn-dark" href="${root}${p.questions}/${COUNTRY_SLUGS[lang][code]}/">${esc(l.hub)}: ${esc(country.replace(/^the /, ""))} →</a></div></div></section>${jsonLd(faqLd(items))}${MARK_CLOSE}`;
}

async function extendCountryPages() {
  let changed = 0;
  for (const lang of LANGS) {
    for (const code of COUNTRY_ORDER) {
      const rel = `${PATHS[lang].countries}/${COUNTRY_SLUGS[lang][code]}/index.html`;
      let html;
      try {
        html = await readFile(join(ROOT, rel), "utf8");
      } catch {
        continue;
      }
      const block = depthBlock(lang, code, rootFor(rel));
      const next = html.includes(MARK_OPEN)
        ? html.replace(new RegExp(`${MARK_OPEN}[\\s\\S]*?${MARK_CLOSE}`), block)
        : html.replace("</main>", block + "</main>");
      if (next !== html) {
        await writeFile(join(ROOT, rel), next, "utf8");
        changed += 1;
      }
    }
  }
  return changed;
}

/* --- article library: the five-market appendix ----------------------------- */

/* The 125 blog posts and the guide library were written from one template, so
   they all end at roughly 730 words and say nearly the same thing. Rewriting
   every one of them by hand is not the job of a build script — but each of them
   is missing the same concrete material: what the topic means in each of the
   five destination markets, which of the eight models the answer usually points
   at, and what has to be settled before ordering.
   
   That appendix is written from the country and model data, so it is specific
   rather than padding, and it is wrapped in markers so a second run replaces it
   instead of stacking a second copy. */

const APPENDIX = {
  de: {
    eyebrow: "Fünf Zielmärkte",
    h2: "Was dabei je Zielland zu klären ist.",
    lead: "Dieselbe Frage wird in Kopenhagen anders beantwortet als in Zürich. Diese fünf Punkte gehören in jede Projektprüfung – unabhängig davon, welches Detail Sie gerade recherchieren.",
    authorityLabel: "Zuständig",
    planLabel: "Maßgeblicher Plan",
    deliveryLabel: "Lieferung ab",
    vatLabel: "Einfuhr",
    modelsEyebrow: "Modelle",
    modelsH2: "Welche Modelle dabei in Frage kommen.",
    modelsLead: "Acht Grundrisse auf derselben technischen Basis von 2,55 Metern Breite. Der Unterschied liegt in Länge, Aufteilung und Ausstattungstiefe.",
    checklistEyebrow: "Checkliste",
    checklistH2: "Fünf Punkte vor der Bestellung.",
    checklist: [
      "Schriftliche Auskunft der zuständigen Behörde zur Zulässigkeit am konkreten Grundstück – mündliche Zusagen tragen kein Projekt.",
      "Zufahrt und Entladepunkt mit Fotos und Maßen. Die letzten hundert Meter sind in der Praxis öfter das Problem als die Fernstrecke.",
      "Erschließung: Entfernung zu Strom, Trinkwasser und Kanal. Dieser Abstand bestimmt einen der größten Nebenposten.",
      "Nutzungsart und Personenzahl. Dauerwohnen, Ferien und Vermietung führen zu unterschiedlichen Auslegungen desselben Modells.",
      "Budgetrahmen inklusive Fundament, Anschlüssen, Entladung, Planung, Gebühren und Versicherung – nicht nur der Werkspreis.",
    ],
    questionsLink: "Alle Fragen und Antworten je Zielland",
    modelsLink: "MD 1 bis MD 8 ansehen",
  },
  en: {
    eyebrow: "Five destination markets",
    h2: "What has to be settled in each country.",
    lead: "The same question is answered differently in Copenhagen than in Zurich. These five points belong in every project check, whatever detail you are researching right now.",
    authorityLabel: "Responsible",
    planLabel: "Governing plan",
    deliveryLabel: "Delivery from",
    vatLabel: "On import",
    modelsEyebrow: "Models",
    modelsH2: "Which models come into question.",
    modelsLead: "Eight plans on one technical basis, 2.55 metres wide. What differs is length, layout and specification depth.",
    checklistEyebrow: "Checklist",
    checklistH2: "Five points before ordering.",
    checklist: [
      "A written answer from the responsible authority on admissibility at the specific plot — verbal assurances do not carry a project.",
      "Access and unloading point, with photographs and dimensions. In practice the last hundred metres cause more trouble than the long haul.",
      "Servicing: the distance to power, drinking water and sewer. That distance sets one of the largest secondary items.",
      "Type of use and number of people. Permanent living, holidays and letting lead to different specifications of the same model.",
      "Budget range including foundation, connections, unloading, planning, fees and insurance — not just the ex-works price.",
    ],
    questionsLink: "All questions and answers per destination",
    modelsLink: "See MD 1 to MD 8",
  },

  nl: {
    eyebrow: "Vijf bestemmingen",
    h2: "Wat per land moet worden uitgezocht.",
    lead: "Dezelfde vraag wordt in Kopenhagen anders beantwoord dan in Zürich. Deze vijf punten horen in elke projecttoets, welk detail u nu ook onderzoekt.",
    authorityLabel: "Bevoegd",
    planLabel: "Bepalend plan",
    deliveryLabel: "Levering vanaf",
    vatLabel: "Bij invoer",
    modelsEyebrow: "Modellen",
    modelsH2: "Welke modellen hierbij in aanmerking komen.",
    modelsLead: "Acht plattegronden op dezelfde technische basis van 2,55 meter breed. Het verschil zit in lengte, indeling en afwerkingsdiepte.",
    checklistEyebrow: "Checklist",
    checklistH2: "Vijf punten vóór het bestellen.",
    checklist: [
      "Een schriftelijk antwoord van het bevoegd gezag over toelaatbaarheid op het concrete perceel — mondelinge toezeggingen dragen geen project.",
      "Toegang en losplaats met foto's en maten. In de praktijk zijn de laatste honderd meter vaker het probleem dan het lange traject.",
      "Ontsluiting: de afstand tot elektra, drinkwater en riool. Die afstand bepaalt een van de grootste nevenposten.",
      "Gebruik en aantal personen. Permanent wonen, vakantie en verhuur leiden tot verschillende uitvoeringen van hetzelfde model.",
      "Budget inclusief fundering, aansluitingen, lossen, planning, leges en verzekering — niet alleen de prijs af fabriek.",
    ],
    questionsLink: "Alle vragen en antwoorden per land",
    modelsLink: "Bekijk MD 1 tot en met MD 8",
  },
  da: {
    eyebrow: "Fem destinationer",
    h2: "Hvad der skal afklares i hvert land.",
    lead: "Samme spørgsmål besvares anderledes i København end i Zürich. Disse fem punkter hører med i enhver projektvurdering, uanset hvilken detalje du undersøger lige nu.",
    authorityLabel: "Ansvarlig",
    planLabel: "Afgørende plan",
    deliveryLabel: "Levering fra",
    vatLabel: "Ved import",
    modelsEyebrow: "Modeller",
    modelsH2: "Hvilke modeller der kommer i betragtning.",
    modelsLead: "Otte planer på samme tekniske grundlag, 2,55 meter brede. Forskellen ligger i længde, disponering og udstyrsdybde.",
    checklistEyebrow: "Tjekliste",
    checklistH2: "Fem punkter før bestilling.",
    checklist: [
      "Et skriftligt svar fra myndigheden om tilladelighed på den konkrete grund — mundtlige tilsagn bærer ikke et projekt.",
      "Adgang og aflæsningspunkt med fotos og mål. I praksis er de sidste hundrede meter oftere problemet end den lange strækning.",
      "Byggemodning: afstanden til el, drikkevand og kloak. Den afstand sætter en af de største biposter.",
      "Anvendelse og antal personer. Helårsbeboelse, ferie og udlejning fører til forskellige specifikationer af samme model.",
      "Budgetramme inklusive fundament, tilslutninger, aflæsning, projektering, gebyrer og forsikring — ikke kun prisen ab fabrik.",
    ],
    questionsLink: "Alle spørgsmål og svar per land",
    modelsLink: "Se MD 1 til MD 8",
  },
  fr: {
    eyebrow: "Cinq destinations",
    h2: "Ce qu'il faut régler dans chaque pays.",
    lead: "La même question ne reçoit pas la même réponse à Copenhague et à Zurich. Ces cinq points appartiennent à toute étude de projet, quel que soit le détail que vous cherchez aujourd'hui.",
    authorityLabel: "Compétence",
    planLabel: "Plan applicable",
    deliveryLabel: "Livraison à partir de",
    vatLabel: "À l'importation",
    modelsEyebrow: "Modèles",
    modelsH2: "Quels modèles entrent en ligne de compte.",
    modelsLead: "Huit plans sur une même base technique de 2,55 mètres de large. La différence tient à la longueur, à la distribution et à la profondeur d'équipement.",
    checklistEyebrow: "Check-list",
    checklistH2: "Cinq points avant de commander.",
    checklist: [
      "Une réponse écrite de l'autorité compétente sur l'admissibilité de la parcelle — une assurance verbale ne porte pas un projet.",
      "Accès et point de déchargement, photos et cotes à l'appui. En pratique, les cent derniers mètres posent plus de problèmes que le long trajet.",
      "Viabilisation : la distance à l'électricité, à l'eau potable et à l'assainissement. Cette distance fixe l'un des principaux postes annexes.",
      "Usage et nombre de personnes. Résidence permanente, vacances et location conduisent à des spécifications différentes du même modèle.",
      "Enveloppe budgétaire incluant fondation, raccordements, déchargement, études, taxes et assurance — pas seulement le prix départ usine.",
    ],
    questionsLink: "Toutes les questions et réponses par pays",
    modelsLink: "Voir MD 1 à MD 8",
  },
};

const APPENDIX_OPEN = "<!-- MODUNERA APPENDIX START -->";
const APPENDIX_CLOSE = "<!-- MODUNERA APPENDIX END -->";

function appendixBlock(lang, root) {
  const a = APPENDIX[lang];
  const p = PATHS[lang];
  const l = QA.labels[lang];

  const countryCards = COUNTRY_ORDER.map((c) => {
    const f = QA.facts[lang][c];
    const name = COUNTRY_NAMES[lang][c].replace(/^the /, "");
    return `<div class="state-card"><h3>${esc(name)}</h3><p><strong>${esc(a.authorityLabel)}:</strong> ${esc(f.authority)}.</p><p><strong>${esc(a.planLabel)}:</strong> ${esc(f.plan)}.</p><p>${esc(f.permanent)}</p><p class="legal-note">${esc(a.deliveryLabel)} ${esc(eur(PRICING.delivery[c].eur, lang))} · ${esc(a.vatLabel)}: ${esc(f.vat)}</p><a class="source-link" href="${root}${p.questions}/${COUNTRY_SLUGS[lang][c]}/">${esc(name)} →</a></div>`;
  }).join("");

  const modelRows = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const s = PRICING.models[`mc${n}`];
    return [
      `<a href="${root}${p.models}/md-${n}/">MD ${n}</a>`,
      esc(MODEL_COPY[String(n)][lang].label),
      esc(lengths(n, lang)),
      esc(eur(s.base_eur, lang)),
    ];
  });

  return `${APPENDIX_OPEN}<section class="section section-soft"><div class="container">${sectionHeader(a.eyebrow, a.h2, esc(a.lead))}<div class="state-grid">${countryCards}</div><div style="margin-top:24px"><a class="btn btn-outline" href="${root}${p.questions}/">${esc(a.questionsLink)} →</a></div></div></section>

<section class="section"><div class="container">${sectionHeader(a.modelsEyebrow, a.modelsH2, esc(a.modelsLead))}${table(DEPTH[lang].compare.head, modelRows)}<div style="margin-top:24px"><a class="btn btn-dark" href="${root}${p.models}/">${esc(a.modelsLink)}</a></div></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(a.checklistEyebrow, a.checklistH2)}<ul class="check-list">${a.checklist.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>${disclaimer(lang)}</div></section>${APPENDIX_CLOSE}`;
}

/* Which pages get the appendix: the article library and the guide hubs, not the
   7,000 location pages (they have their own local content) and not the pages
   this layer already writes in full. */
function wantsAppendix(rel) {
  if (!rel.endsWith("index.html")) return false;
  // the 7,100 location pages carry their own local material and would be swamped
  if (rel.startsWith("standorte/") || rel.startsWith("en/locations/")) return false;
  // the pages this layer writes in full already contain everything the appendix has
  if (/^(modelle|en\/models|nl\/modellen|da\/modeller|fr\/modeles)\//.test(rel)) return false;
  if (/^(fragen|en\/questions|nl\/vragen-per-land|da\/spoergsmaal-per-land|fr\/questions-par-pays)\//.test(rel)) return false;
  return (
    /^(blog|ratgeber|leistungen|faq)\//.test(rel) ||
    /^en\/(guides|blog|services|faq)\//.test(rel) ||
    /^(nl\/gidsen|da\/guides|fr\/guides|nl\/diensten|da\/ydelser|fr\/services)\//.test(rel) ||
    /^(vorteile|katalog|en\/advantages)\//.test(rel)
  );
}

async function extendArticles() {
  const files = (await walk(ROOT)).filter((f) => extname(f).toLowerCase() === ".html");
  let changed = 0;
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    if (!wantsAppendix(rel)) continue;
    const html = await readFile(file, "utf8");
    const tag = (html.match(/<html\s+lang="([a-z]{2})/i) ?? [, "de"])[1].toLowerCase();
    const lang = APPENDIX[tag] ? tag : "de";
    const block = appendixBlock(lang, rootFor(rel));
    const next = html.includes(APPENDIX_OPEN)
      ? html.replace(new RegExp(`${APPENDIX_OPEN}[\\s\\S]*?${APPENDIX_CLOSE}`), block)
      : html.replace("</main>", block + "</main>");
    if (next !== html) {
      await writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  return changed;
}



/* --- the English knowledge library ---------------------------------------- */

/* The English section had thirteen guides and no blog at all, which is why the
   English menu had two entries under "Tiny houses" and nothing under knowledge.
   Rather than translating 125 near-identical German posts into 125 near-identical
   English ones, this builds nine category pages that are each written on their
   own subject, and a hub that indexes them together with the existing guides. */
const EN_BLOG = JSON.parse(await readFile(join(ROOT, "data/en-blog.json"), "utf8"));

/* Which of the existing English guides belongs under which category. Anything not
   listed still appears on the hub. */
const GUIDE_CATEGORY = {
  "tiny-house-germany-permits": "permits-and-law",
  "tiny-house-netherlands-permits": "permits-and-law",
  "tiny-house-denmark-permits": "permits-and-law",
  "tiny-house-luxembourg-permits": "permits-and-law",
  "tiny-house-switzerland-permits": "permits-and-law",
  "plot-and-site-europe": "permits-and-law",
  "total-budget-tiny-house-europe": "costs-and-financing",
  "tiny-house-manufacturers-poland-romania-turkiye-comparison": "comparison-and-alternatives",
  "connections-power-water-wastewater-europe": "energy-and-off-grid",
  "year-round-living-climate-europe": "technology-and-construction",
  "customs-import-turkiye-europe": "transport-and-import",
  "tiny-house-transport-turkiye-europe": "transport-and-import",
  "rental-and-occupancy-europe": "use-and-business-model",
};

const GUIDE_TITLES = {
  "tiny-house-germany-permits": "Germany: permits and site rules",
  "tiny-house-netherlands-permits": "Netherlands: Omgevingswet and Omgevingsloket",
  "tiny-house-denmark-permits": "Denmark: kommune and byggetilladelse",
  "tiny-house-luxembourg-permits": "Luxembourg: commune and autorisation de construire",
  "tiny-house-switzerland-permits": "Switzerland: building zone and Baubewilligung",
  "plot-and-site-europe": "Choosing a plot across Europe",
  "total-budget-tiny-house-europe": "The total budget for a European project",
  "tiny-house-manufacturers-poland-romania-turkiye-comparison": "Poland, Romania and Türkiye compared",
  "connections-power-water-wastewater-europe": "Power, water and wastewater connections",
  "year-round-living-climate-europe": "Year-round living and climate",
  "customs-import-turkiye-europe": "Customs and import from Türkiye",
  "tiny-house-transport-turkiye-europe": "Transport from Türkiye to Europe",
  "rental-and-occupancy-europe": "Letting and occupancy across Europe",
};

const enBlogUrl = (slug) => `en/blog/${slug ? slug + "/" : ""}index.html`;

function enBlogCategoryPage(cat) {
  const lang = "en";
  const rel = enBlogUrl(cat.slug);
  const root = rootFor(rel);
  const p = PATHS.en;
  const u = UI.en;
  const guides = Object.entries(GUIDE_CATEGORY)
    .filter(([, c]) => c === cat.slug)
    .map(([slug]) => `<a class="post-row" href="${root}en/guides/${slug}/"><span>${esc(GUIDE_TITLES[slug])}</span><small>${esc(u.readMore)} →</small></a>`)
    .join("");

  const siblings = EN_BLOG.categories
    .filter((c) => c.slug !== cat.slug)
    .map((c) => `<a class="cat-chip" href="${root}en/blog/${c.slug}/">${esc(c.name)}</a>`)
    .join("");

  const trail = [[u.breadHome, p.home], ["Blog", "en/blog/"], [cat.name, `en/blog/${cat.slug}/`]];
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: cat.h1,
    description: cat.lead,
    inLanguage: "en-GB",
    dateModified: UPDATED,
    author: { "@type": "Organization", name: "MODUNERA" },
    publisher: { "@type": "Organization", name: "MODUNERA", logo: { "@type": "ImageObject", url: BASE + "assets/brand/modunera-master-logo-mountain-v1-600.png" } },
    mainEntityOfPage: BASE + `en/blog/${cat.slug}/`,
  };

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · <a href="${root}en/blog/">Blog</a> · ${esc(cat.name)}</div><div class="eyebrow">${esc(cat.name)}</div><h1>${esc(cat.h1)}</h1><p>${esc(cat.lead)}</p></div></header>

<section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>In short</strong><p>${esc(cat.lead)}</p></div>${cat.sections
    .map(([h2, text], i) => `<section id="section-${i + 1}"><h2>${esc(h2)}</h2><p>${esc(text)}</p></section>`)
    .join("")}</article></div></div></section>

${guides ? `<section class="section section-soft"><div class="container">${sectionHeader("Guides", "Detailed guides in this area.")}<div class="post-list">${guides}</div></div></section>` : ""}

<section class="section"><div class="container">${sectionHeader("Questions", "Frequently asked, answered here.")}<div class="faq-layout"><div>${faqMarkup(cat.faq)}</div></div>${disclaimer(lang)}</div></section>

<section class="section section-soft"><div class="container">${sectionHeader("Blog", "The other subjects.")}<div class="cat-rail">${siblings}</div></div></section></main>`;

  return head({
    lang,
    rel,
    title: `${cat.name} – tiny house guide | MODUNERA`,
    description: cat.lead.slice(0, 158),
    alternates: { en: rel, de: "ratgeber/index.html" },
    image: "assets/images/gallery/interior-feature.webp",
    extraLd: [articleLd, faqLd(cat.faq), breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

function enBlogHubPage() {
  const lang = "en";
  const rel = enBlogUrl(null);
  const root = rootFor(rel);
  const p = PATHS.en;
  const u = UI.en;
  const h = EN_BLOG.hub;

  const cards = EN_BLOG.categories
    .map((c) => `<article class="blog-card" data-blog-category="${c.slug}"><a href="${root}en/blog/${c.slug}/"><div class="blog-card-body"><span class="blog-meta">${esc(c.sub)}</span><h3>${esc(c.name)}</h3><p>${esc(c.lead.slice(0, 165))}…</p></div></a></article>`)
    .join("");

  const guideRows = Object.keys(GUIDE_TITLES)
    .map((slug) => `<a class="post-row" href="${root}en/guides/${slug}/"><span>${esc(GUIDE_TITLES[slug])}</span><small>${esc(EN_BLOG.categories.find((c) => c.slug === GUIDE_CATEGORY[slug])?.name ?? "Guide")}</small></a>`)
    .join("");

  const trail = [[u.breadHome, p.home], ["Blog", "en/blog/"]];
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MODUNERA tiny house blog",
    description: h.lead,
    inLanguage: "en-GB",
    hasPart: EN_BLOG.categories.map((c) => ({ "@type": "Article", headline: c.h1, url: BASE + `en/blog/${c.slug}/` })),
  };

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · Blog</div><div class="eyebrow">Blog</div><h1>${esc(h.h1)}</h1><p>${esc(h.lead)}</p></div></header><section class="section"><div class="container"><div class="blog-grid">${cards}</div></div></section><section class="section section-soft"><div class="container">${sectionHeader("Guides", "Country and process guides.", "Thirteen detailed guides on permits, budget, customs, transport and letting across the five destination markets.")}<div class="post-list">${guideRows}</div><div style="margin-top:24px"><a class="btn btn-dark" href="${root}en/questions/">Country questions and answers →</a></div></div></section></main>`;

  return head({
    lang,
    rel,
    title: h.title,
    description: h.lead.slice(0, 158),
    alternates: { en: rel, de: "blog/index.html" },
    image: "assets/images/gallery/interior-feature.webp",
    extraLd: [collection, breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

/* --- locale guide hubs ----------------------------------------------------- */

/* nl, da and fr have countries, services, models, an FAQ and a question set, and
   their menus point at a guide hub. This writes that hub in their own language
   instead of leaving the link pointing at nothing. */
const LOCALE_GUIDES = {
  nl: {
    h1: "Wat u moet uitzoeken voordat u een tiny house bestelt.",
    lead: "Vergunning, levering, aansluitingen, winterbedrijf en kosten — per bestemming verschillend beantwoord. Deze gids brengt de vijf markten samen en verwijst naar de vragen en antwoorden per land.",
    sections: [
      ["Begin bij het perceel, niet bij het huis", "Geen enkel tiny house is toelaatbaar of ontoelaatbaar op zichzelf. Het perceel beslist: de bestemming, de ontsluiting en het gebruik dat u voor ogen heeft. Vraag de gemeente schriftelijk om uitsluitsel voordat u bestelt — dat kost een brief en beslist het hele project."],
      ["Reken het budget compleet door", "De prijs af fabriek is het begin. Levering, fundering, aansluitingen, lossen, lokale planning, leges en verzekering komen erbij. De afstand tot riool en net bepaalt vaak meer dan welke uitvoeringskeuze dan ook."],
      ["Laat de uitvoering het klimaat volgen", "Isolatiedikte, glasoppervlak, ventilatie en verwarming worden samen beslist en vóór productie vastgelegd. Een opbouw voor een zomerverblijf is voor permanent wonen op hetzelfde adres te krap."],
      ["Regel de laatste honderd meter vooraf", "Toegang, draaicirkel, ondergrond en kraanopstelling bepalen de lossing. Stuur foto's en maten voordat de order wordt bevestigd; een krappe oprit is oplosbaar, maar alleen als hij tijdig bekend is."],
    ],
  },
  da: {
    h1: "Hvad du skal have afklaret, før du bestiller et tiny house.",
    lead: "Tilladelse, levering, tilslutninger, vinterbrug og omkostninger — besvaret forskelligt fra land til land. Denne guide samler de fem markeder og henviser til spørgsmål og svar per land.",
    sections: [
      ["Start ved grunden, ikke ved huset", "Intet tiny house er tilladt eller forbudt i sig selv. Grunden afgør: udlægningen, byggemodningen og den anvendelse, du planlægger. Bed kommunen om et skriftligt svar, før du bestiller — det koster et brev og afgør hele projektet."],
      ["Regn budgettet helt igennem", "Prisen ab fabrik er begyndelsen. Levering, fundament, tilslutninger, aflæsning, lokal projektering, gebyrer og forsikring kommer til. Afstanden til kloak og net betyder ofte mere end noget udstyrsvalg."],
      ["Lad specifikationen følge klimaet", "Isoleringstykkelse, glasareal, ventilation og varme besluttes samlet og fastlægges før produktion. En opbygning til en sommerenhed er for tynd til helårsbeboelse på samme adresse."],
      ["Ordn de sidste hundrede meter på forhånd", "Adgang, vendediameter, underlag og kranplads afgør aflæsningen. Send fotos og mål, før ordren bekræftes; en snæver tilkørsel kan løses, men kun hvis den kendes i tide."],
    ],
  },
  fr: {
    h1: "Ce qu'il faut clarifier avant de commander une tiny house.",
    lead: "Autorisation, livraison, raccordements, usage hivernal et coûts — la réponse change d'un pays à l'autre. Ce guide rassemble les cinq marchés et renvoie aux questions et réponses par pays.",
    sections: [
      ["Commencez par la parcelle, pas par la maison", "Aucune tiny house n'est admissible ou inadmissible en soi. C'est la parcelle qui tranche : son affectation, sa viabilisation et l'usage que vous prévoyez. Demandez une réponse écrite à la commune avant de commander — cela coûte une lettre et décide de tout le projet."],
      ["Chiffrez le budget en entier", "Le prix départ usine n'est qu'un début. Livraison, fondation, raccordements, déchargement, études locales, taxes et assurance s'y ajoutent. La distance au réseau pèse souvent plus que n'importe quel choix d'équipement."],
      ["Faites suivre la spécification au climat", "Épaisseur d'isolant, surface vitrée, ventilation et chauffage se décident ensemble et se fixent avant la production. Une composition d'unité d'été est trop juste pour une résidence permanente à la même adresse."],
      ["Réglez les cent derniers mètres à l'avance", "Accès, rayon de braquage, sol et position de grue déterminent le déchargement. Envoyez photos et cotes avant la confirmation de commande ; un accès étroit se résout, mais seulement s'il est connu à temps."],
    ],
  },
};

function localeGuidesPage(lang) {
  const rel = `${PATHS[lang].guides}/index.html`;
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const g = LOCALE_GUIDES[lang];
  const label = LOCALES[lang].labels.guides;
  const trail = [[u.breadHome, p.home], [label, `${p.guides}/`]];

  const countryRows = COUNTRY_ORDER.map((c) => {
    const name = COUNTRY_NAMES[lang][c].replace(/^the /, "");
    return `<a class="post-row" href="${root}${p.questions}/${COUNTRY_SLUGS[lang][c]}/"><span>${esc(name)}</span><small>20 ${esc(QA.labels[lang].questions.toLowerCase())} →</small></a>`;
  }).join("");

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.lead,
    inLanguage: HTML_LANG[lang],
    dateModified: UPDATED,
    author: { "@type": "Organization", name: "MODUNERA" },
    publisher: { "@type": "Organization", name: "MODUNERA", logo: { "@type": "ImageObject", url: BASE + "assets/brand/modunera-master-logo-mountain-v1-600.png" } },
    mainEntityOfPage: BASE + `${p.guides}/`,
  };

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · ${esc(label)}</div><div class="eyebrow">${esc(label)}</div><h1>${esc(g.h1)}</h1><p>${esc(g.lead)}</p></div></header><section class="section"><div class="container article-shell"><article class="article">${g.sections
    .map(([h2, text], i) => `<section id="section-${i + 1}"><h2>${esc(h2)}</h2><p>${esc(text)}</p></section>`)
    .join("")}</article></div></section><section class="section section-soft"><div class="container">${sectionHeader(QA.labels[lang].hub, QA.labels[lang].hubH1, esc(QA.labels[lang].hubLead))}<div class="post-list">${countryRows}</div></div></section></main>`;

  return head({
    lang,
    rel,
    title: `${label} – MODUNERA`,
    description: g.lead.slice(0, 158),
    alternates: { [lang]: rel, de: "ratgeber/index.html", en: "en/blog/index.html" },
    image: "assets/images/gallery/interior-feature.webp",
    extraLd: [articleLd, breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

async function buildKnowledgePages() {
  let count = 0;
  await put(enBlogUrl(null), enBlogHubPage());
  count += 1;
  for (const cat of EN_BLOG.categories) {
    await put(enBlogUrl(cat.slug), enBlogCategoryPage(cat));
    count += 1;
  }
  for (const lang of ["nl", "da", "fr"]) {
    await put(`${PATHS[lang].guides}/index.html`, localeGuidesPage(lang));
    count += 1;
  }
  return count;
}

/* --- run ------------------------------------------------------------------ */

/* Two phases, because build-modunera-v2.mjs sits between them: it regenerates the
   guide hubs and category pages, so an appendix written before it would be thrown
   away. Phase one writes new pages, v2 gives them navigation and sitemaps, phase
   two appends to everything that then exists.
     node tools/build-modunera-depth.mjs            # new pages
     node tools/build-modunera-v2.mjs               # navigation, hubs, sitemaps
     node tools/build-modunera-depth.mjs --extend   # append to the library
   Both phases are idempotent. */
const extendOnly = process.argv.includes("--extend");

if (extendOnly) {
  const countries = await extendCountryPages();
  const articles = await extendArticles();
  console.log(`depth layer (extend):
  ${countries} country pages extended with their question set
  ${articles} library pages extended with the five-market appendix`);
} else {
  const models = await buildModelPages();
  const questions = await buildQuestionPages();
  const knowledge = await buildKnowledgePages();
  console.log(`depth layer (pages):
  ${models} model pages (MD 1 – MD 8 plus an index, in five languages)
  ${questions} country question pages (20 questions per country per language)
  ${knowledge} knowledge pages (English blog hub, nine subject pages, three locale guide hubs)`);
}
