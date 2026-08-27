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

import { existsSync } from "node:fs";
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
/* nl, da and fr each get their own blog rather than a translation of the German
   library: the reader in Denmark needs kommunen and BR18, the reader in the
   Netherlands the Omgevingswet, and the French pages serve Luxembourg and
   Suisse romande, where the vocabulary is different again. */
const LOCALE_BLOG = Object.fromEntries(await Promise.all(["nl", "da", "fr"].map(async (code) =>
  [code, JSON.parse(await readFile(join(ROOT, `data/blog-${code}.json`), "utf8"))])));

/* Individual posts, one file per language. The category pages carry the broad
   subjects; these are the specific ones a buyer searches for by name —
   foundation, cladding, bathroom, heating — and they deliberately avoid
   repeating the category material, which is what keeps the similarity between
   the two formats low. English sits under en/blog/ beside its nine categories. */
/* Posts arrive in numbered batches so a batch can be written and reviewed on its
   own. The four languages must stay in the same order across every batch:
   localePostPage() pairs them by index to build the hreflang cluster. */
const POST_BATCHES = ["", "-2"];
const LOCALE_POSTS = Object.fromEntries(await Promise.all(["en", "nl", "da", "fr"].map(async (code) => {
  const batches = await Promise.all(POST_BATCHES.map(async (suffix) => {
    const file = join(ROOT, `data/posts-${code}${suffix}.json`);
    return existsSync(file) ? JSON.parse(await readFile(file, "utf8")).posts : [];
  }));
  return [code, batches.flat()];
})));
for (const lang of ["nl", "da", "fr"]) {
  if (LOCALE_POSTS[lang].length !== LOCALE_POSTS.en.length) {
    throw new Error(`posts-${lang} has ${LOCALE_POSTS[lang].length} subjects, posts-en has ${LOCALE_POSTS.en.length}; the hreflang pairing is by index and needs them equal`);
  }
}

// where a language keeps its blog, and how a category slug maps back to its page
const BLOG_ROOT = { en: "en/blog", nl: "nl/blog", da: "da/blog", fr: "fr/blog" };
const POST_LABELS = {
  en: { readMore: "Read on", inThis: "In this article", related: "More on this subject", faq: "Questions", back: "All subjects", posts: "Articles" },
  nl: { readMore: "Lees verder", inThis: "In dit artikel", related: "Meer over dit onderwerp", faq: "Vragen", back: "Alle onderwerpen", posts: "Artikelen" },
  da: { readMore: "Læs videre", inThis: "I denne artikel", related: "Mere om emnet", faq: "Spørgsmål", back: "Alle emner", posts: "Artikler" },
  fr: { readMore: "Lire la suite", inThis: "Dans cet article", related: "Sur le même sujet", faq: "Questions", back: "Tous les sujets", posts: "Articles" },
};
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
/* "Tiny House" is the search term in all five markets — German buyers type the
   English words too — so it is the product word everywhere, capitalised as a
   product category. MODEL_EYEBROW replaces the label that used to be repeated
   directly above the same words in the h1. */
const TERM = "Tiny House";
const TERM_RE = /tiny[\s-]*house/i;
const snippet = (h1, lead) => {
  const text = TERM_RE.test(lead.slice(0, 158)) ? lead : `${h1} ${lead}`;
  return text.length > 155 ? text.slice(0, 155).trimEnd() + "…" : text;
};
const MODEL_EYEBROW = {
  de: "Tiny House Modell", en: "Tiny house model", nl: "Tiny house model",
  da: "Tiny house-model", fr: "Modèle tiny house",
};

const UI = {
  de: {
    skip: "Zum Inhalt springen", home: "Startseite", breadHome: "Startseite",
    ctaTitle: "Projekt in 2 Minuten starten.",
    ctaText: "Zielland, Nutzung und Wunschmodell per WhatsApp senden – wir strukturieren den nächsten Schritt.",
    ctaButton: "WhatsApp-Anfrage →",
    footerAbout: "Tiny Houses als Kernprodukt. Dazu Modulbau, Stahlbau, Containerbau, Bungalows und maßgefertigte Möbel – direkt aus eigener Produktion für Europa.",
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
    footerAbout: "Tiny houses zijn ons kernproduct, aangevuld met modulaire bouw, staalconstructies, containerbouw, bungalows en meubels op maat voor Europa.",
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
    ? `<a href="${root}modellvergleich/">Modellvergleich</a><a href="${root}preisvergleich/">Preisvergleich</a><a href="${root}vorteile/">Vorteile</a><a href="${root}konfigurator/">Design Studio</a>`
    : lang === "en"
      ? `<a href="${root}en/model-comparison/">Model comparison</a><a href="${root}en/price-comparison/">Price comparison</a><a href="${root}en/advantages/">Advantages</a><a href="${root}konfigurator/">Design Studio</a>`
      : `<a href="${root}${p.models}/">${esc(LOCALES[lang].labels.allModels)}</a><a href="${root}${p.countries}/">${esc(LOCALES[lang].labels.countries)}</a><a href="${root}konfigurator/">Design Studio</a>`;
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

  /* The commercial title. "MD 1 – Panorama und Loft" described the model to
     someone already on the site; in a search result it competed on charm against
     rivals stating price and size. Query intent, dimensions and the from-price —
     all three from data the site already publishes — now stand in the snippet.
     The lengths use an en dash ("8,00–9,70 m") instead of the body copy's
     " oder ", because the pipe-separated title has no room for prose. */
  const titleLengths = (spec.lengths.match(/[\d.,]+/g) ?? [])
    .map((v) => (lang === "en" ? v.replace(",", ".") : v.replace(".", ",")))
    .join("\u2013") + "\u00a0m";
  const BUY = { de: "Tiny House kaufen", en: "Tiny House", nl: "Tiny House kopen",
                da: "tiny house", fr: "tiny house" }[lang];
  const FROM = { de: "ab", en: "from", nl: "vanaf", da: "fra", fr: "d\u00e8s" }[lang];
  const title = `${model} ${BUY} | ${titleLengths} | ${FROM} ${vars.price} | MODUNERA`;
  const leadHasTerm = /tiny[\s-]*house/i.test(copy.lead);
  const rawDescription = leadHasTerm ? copy.lead : `${model} ${TERM} – ${copy.lead}`;
  /* The description carries the price too, when it fits: the snippet is the one
     place a buyer compares suppliers without clicking, and rivals print theirs. */
  const PRICE_TAIL = { de: ` Ab ${vars.price} ab Werk.`, en: ` From ${vars.price} ex works.`,
                       nl: ` Vanaf ${vars.price} af fabriek.`, da: ` Fra ${vars.price} ab fabrik.`,
                       fr: ` D\u00e8s ${vars.price} d\u00e9part usine.` }[lang];
  const base = rawDescription.length > 155 - PRICE_TAIL.length
    ? rawDescription.slice(0, 152 - PRICE_TAIL.length).trimEnd() + "…"
    : rawDescription;
  const description = base + PRICE_TAIL;

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
  const body = `<main id="main"><header class="article-visual-hero"><img src="${root}${heroImage}" alt="MODUNERA ${model} ${esc(copy.label)}"><div class="article-visual-overlay"></div><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · <a href="${root}${p.models}/">${esc(trail[1][0])}</a> · ${model}</div><div class="model-label">${esc(MODEL_EYEBROW[lang])}</div><h1>${model} ${TERM} · ${esc(copy.label)}</h1><p>${esc(copy.lead)}</p><div class="hero-actions"><a class="btn btn-primary" href="${root}konfigurator/?model=mc${n}">${esc(u.configure)}</a><a class="btn btn-light" href="${waLink(waMsg)}" target="_blank" rel="noopener">WhatsApp</a></div></div></header>

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
    de: ["Alle Modelle", "Acht Tiny Houses: MD 1 bis MD 8.", "Acht Tiny-House-Grundrisse auf derselben technischen Basis. Der Unterschied liegt in Länge, Aufteilung und Ausstattungstiefe – nicht in der Bauweise."],
    en: ["All models", "Eight tiny houses: MD 1 to MD 8.", "Eight tiny house plans on one technical basis. What differs is length, layout and specification depth — not the way they are built."],
    nl: ["Alle modellen", "Acht tiny houses: MD 1 tot en met MD 8.", "Acht tiny house-plattegronden op dezelfde technische basis. Het verschil zit in lengte, indeling en afwerkingsdiepte — niet in de bouwwijze."],
    da: ["Alle modeller", "Otte tiny houses: MD 1 til MD 8.", "Otte tiny house-planer på samme tekniske grundlag. Forskellen ligger i længde, disponering og udstyrsdybde — ikke i byggemåden."],
    fr: ["Tous les modèles", "Huit tiny houses : MD 1 à MD 8.", "Huit plans de tiny house sur une même base technique. La différence tient à la longueur, à la distribution et à la profondeur d'équipement — pas au mode constructif."],
  }[lang];

  const cards = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const c = MODEL_COPY[String(n)][lang];
    const s = PRICING.models[`mc${n}`];
    const img = MODEL_COPY[String(n)].images[0];
    return `<article class="model-card"><a href="${root}${p.models}/md-${n}/">${gridImg(root, img, `MODUNERA MD ${n}`)}<div class="model-content"><div class="model-label">${esc(c.label)}</div><h3>MD ${n}</h3><p>${esc(c.lead)}</p><div class="model-specs"><span>${esc(lengths(n, lang))}</span><span>${esc(MODEL_COPY[String(n)].sleeps)}</span><span>${esc(eur(s.base_eur, lang))}</span></div></div></a></article>`;
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

/* Which pages get the appendix.

   This used to be "the whole article library and the guide hubs", which put the
   country permit paragraphs on 221 pages — 146 indexed pages carrying the same
   sentence about Außenbereich and 146 the same one about sommerhusområder. On a
   page about kitchen layout or acoustic separation that is forty sentences the
   reader did not come for, and it was the largest single source of repetition
   across the 514 indexed pages.

   The scope now lives in data/appendix-scope.json, with a reason written against
   every decision, so an argument about where the appendix belongs is an argument
   about that file. Default is DROP: a tree that is not named there does not get
   it, which means a new section cannot inherit forty sentences by accident. */
const APPENDIX_SCOPE = JSON.parse(await readFile(join(ROOT, "data/appendix-scope.json"), "utf8"));

const CATEGORY_APPENDIX = new Map();
for (const c of APPENDIX_SCOPE.categories) {
  CATEGORY_APPENDIX.set(c.de, c.appendix === "keep");
  CATEGORY_APPENDIX.set(c.en, c.appendix === "keep");
}
const TOPIC_APPENDIX = new Map(
  APPENDIX_SCOPE.topic_overrides.map((t) => [t.topic, t.appendix === "keep"]),
);
const KEEP_TREES = APPENDIX_SCOPE.trees.map((t) => new RegExp(t.match));
const DROP_TREES = APPENDIX_SCOPE.dropped_trees.map((t) => new RegExp(t.match));

/* A page's subject category, where the page has one. The German article library
   resolves through blogTopicOf(); the English posts carry their category in
   data/posts-en*.json; the category pages are named after the category itself. */
const EN_POST_CATEGORY = new Map(LOCALE_POSTS.en.map((p) => [p.slug, p.category]));

function appendixCategoryOf(rel) {
  const de = blogTopicOf(rel);
  if (de) return { category: de.topic.cat, topic: de.key };

  const cat = rel.match(/^ratgeber\/([^/]+)\/index\.html$/);
  if (cat && CATEGORY_APPENDIX.has(cat[1])) return { category: cat[1], topic: null };

  const en = rel.match(/^en\/blog\/([^/]+)\/index\.html$/);
  if (en) {
    if (CATEGORY_APPENDIX.has(en[1])) return { category: en[1], topic: null };
    if (EN_POST_CATEGORY.has(en[1])) return { category: EN_POST_CATEGORY.get(en[1]), topic: null };
  }
  return null;
}

function wantsAppendix(rel) {
  if (!rel.endsWith("index.html")) return false;
  // the 7,100 location pages carry their own local material and would be swamped
  if (rel.startsWith("standorte/") || rel.startsWith("en/locations/")) return false;
  // the pages this layer writes in full already contain everything the appendix has
  if (/^(modelle|en\/models|nl\/modellen|da\/modeller|fr\/modeles)\//.test(rel)) return false;
  if (/^(fragen|en\/questions|nl\/vragen-per-land|da\/spoergsmaal-per-land|fr\/questions-par-pays)\//.test(rel)) return false;

  // an explicit drop beats everything: it is the reviewed decision for that page
  if (DROP_TREES.some((re) => re.test(rel))) return false;
  if (KEEP_TREES.some((re) => re.test(rel))) return true;

  const subject = appendixCategoryOf(rel);
  if (!subject) return false; // default drop
  if (subject.topic && TOPIC_APPENDIX.has(subject.topic)) return TOPIC_APPENDIX.get(subject.topic);
  return CATEGORY_APPENDIX.get(subject.category) === true;
}

/* The appendix is written into pages by --extend and removed from them by the
   same pass when the scope changes. Without this, narrowing the scope would
   leave the block on every page that already had it, because extendArticles()
   only ever wrote. */
function stripAppendix(html) {
  return html.includes(APPENDIX_OPEN)
    ? html.replace(new RegExp(`${APPENDIX_OPEN}[\\s\\S]*?${APPENDIX_CLOSE}`), "")
    : html;
}

async function extendArticles() {
  const files = (await walk(ROOT)).filter((f) => extname(f).toLowerCase() === ".html");
  let changed = 0;
  let removed = 0;
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    // the location corpus has never carried the appendix and is 14,641 of the
    // 15,164 files; skipping it here is what keeps this pass cheap
    if (rel.startsWith("standorte/") || rel.startsWith("en/locations/")) continue;

    const html = await readFile(file, "utf8");
    let next;
    if (wantsAppendix(rel)) {
      const tag = (html.match(/<html\s+lang="([a-z]{2})/i) ?? [, "de"])[1].toLowerCase();
      const lang = APPENDIX[tag] ? tag : "de";
      const block = appendixBlock(lang, rootFor(rel));
      next = html.includes(APPENDIX_OPEN)
        ? html.replace(new RegExp(`${APPENDIX_OPEN}[\\s\\S]*?${APPENDIX_CLOSE}`), block)
        : html.replace("</main>", block + "</main>");
    } else {
      next = stripAppendix(html);
      if (next !== html) removed += 1;
    }
    if (next !== html) {
      await writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  if (removed) console.log(`  appendix removed from ${removed} page(s) now out of scope`);
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
    .map(([slug]) => `<a class="post-row" href="${root}en/guides/${slug}/"><strong>${esc(GUIDE_TITLES[slug])}</strong><span>${esc(u.readMore)}</span></a>`)
    .join("");

  const siblings = EN_BLOG.categories
    .filter((c) => c.slug !== cat.slug)
    .map((c) => `<a class="cat-chip" href="${root}en/blog/${c.slug}/">${esc(c.name)}</a>`)
    .join("");

  const catPosts = LOCALE_POSTS.en
    .filter((o) => o.category === cat.slug)
    .map((o) => `<a class="post-row" href="${root}en/blog/${o.slug}/"><strong>${esc(o.title)}</strong><span>Read on</span></a>`)
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

${catPosts ? `<section class="section"><div class="container">${sectionHeader("Articles", cat.name)}<div class="post-list">${catPosts}</div></div></section>` : ""}

<section class="section"><div class="container">${sectionHeader("Questions", "Frequently asked, answered here.")}<div class="faq-layout"><div>${faqMarkup(cat.faq)}</div></div>${disclaimer(lang)}</div></section>

<section class="section section-soft"><div class="container">${sectionHeader("Blog", "The other subjects.")}<div class="cat-rail">${siblings}</div></div></section></main>`;

  return head({
    lang,
    rel,
    title: `${cat.name} – tiny house guide | MODUNERA`,
    description: snippet(cat.h1, cat.lead),
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
    .map((slug) => `<a class="post-row" href="${root}en/guides/${slug}/"><strong>${esc(GUIDE_TITLES[slug])}</strong><span>${esc(EN_BLOG.categories.find((c) => c.slug === GUIDE_CATEGORY[slug])?.name ?? "Guide")}</span></a>`)
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

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · Blog</div><div class="eyebrow">Blog</div><h1>${esc(h.h1)}</h1><p>${esc(h.lead)}</p></div></header><section class="section"><div class="container"><div class="blog-grid">${cards}</div></div></section><section class="section section-soft"><div class="container">${sectionHeader("Articles", "The specific questions, answered one at a time.")}<div class="post-list">${LOCALE_POSTS.en.map((o) => `<a class="post-row" href="${root}en/blog/${o.slug}/"><strong>${esc(o.title)}</strong><span>${esc(o.name)}</span></a>`).join("")}</div></div></section><section class="section"><div class="container">${sectionHeader("Guides", "Country and process guides.", "Thirteen detailed guides on permits, budget, customs, transport and letting across the five destination markets.")}<div class="post-list">${guideRows}</div><div style="margin-top:24px"><a class="btn btn-dark" href="${root}en/questions/">Country questions and answers →</a></div></div></section></main>`;

  return head({
    lang,
    rel,
    title: h.title,
    description: snippet(h.h1, h.lead),
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
    description: snippet(g.h1, g.lead),
    alternates: { [lang]: rel, de: "ratgeber/index.html", en: "en/blog/index.html" },
    image: "assets/images/gallery/interior-feature.webp",
    extraLd: [articleLd, breadcrumbLd(trail)],
  }) + body + footer(lang, rel);
}

function localeBlogUrl(lang, slug) {
  const base = `${lang}/${LOCALE_BLOG[lang].path}`;
  return slug ? `${base}/${slug}/index.html` : `${base}/index.html`;
}

function localeBlogHubPage(lang) {
  const rel = localeBlogUrl(lang, null);
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const b = LOCALE_BLOG[lang];
  const l = b.labels;

  const cards = b.categories.map((c) => `<article class="blog-card"><a href="${root}${lang}/${b.path}/${c.slug}/"><div class="blog-card-body"><span class="blog-card-cat">${esc(c.name)}</span><h3>${esc(c.h1)}</h3><p>${esc(c.lead)}</p><span class="blog-card-more">${esc(l.readMore)} →</span></div></a></article>`).join("");

  const countryRows = COUNTRY_ORDER.map((c) => {
    const name = COUNTRY_NAMES[lang][c].replace(/^the /, "");
    return `<a class="post-row" href="${root}${p.questions}/${COUNTRY_SLUGS[lang][c]}/"><span>${esc(name)}</span><small>20 ${esc(QA.labels[lang].questions.toLowerCase())} →</small></a>`;
  }).join("");

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · ${esc(b.hub.eyebrow)}</div><div class="eyebrow">${esc(b.hub.eyebrow)}</div><h1>${esc(b.hub.h1)}</h1><p>${esc(b.hub.lead)}</p><div class="hero-actions"><a class="btn btn-primary" href="${root}${p.models}/">${esc(l.models)}</a><a class="btn btn-outline" href="${root}${p.guides}/">${esc(LOCALES[lang].labels.guides)}</a></div></div></header>

<section class="section"><div class="container"><div class="blog-grid">${cards}</div></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(POST_LABELS[lang].posts, b.hub.h1)}<div class="post-list">${LOCALE_POSTS[lang].map((o) => `<a class="post-row" href="${root}${BLOG_ROOT[lang]}/${o.slug}/"><strong>${esc(o.title)}</strong><span>${esc(o.name)}</span></a>`).join("")}</div></div></section>

<section class="section"><div class="container">${sectionHeader(QA.labels[lang].hub, QA.labels[lang].hubH1, esc(QA.labels[lang].hubLead))}<div class="post-list">${countryRows}</div><div style="margin-top:24px"><a class="btn btn-dark" href="${root}${p.questions}/">${esc(l.questions)} →</a></div></div></section>

<section class="section"><div class="container"><div class="answer-box"><strong>MODUNERA</strong><p>${esc(b.hub.closing)}</p></div>${disclaimer(lang)}</div></section></main>`;

  return head({
    lang,
    rel,
    title: b.hub.title,
    description: snippet(b.hub.h1, b.hub.lead),
    alternates: { nl: localeBlogUrl("nl", null), da: localeBlogUrl("da", null), fr: localeBlogUrl("fr", null), de: "ratgeber/index.html", en: "en/blog/index.html" },
    extraLd: [
      breadcrumbLd([[u.breadHome, p.home], [b.hub.eyebrow, `${lang}/${b.path}/`]]),
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: b.hub.h1,
        description: b.hub.lead,
        inLanguage: HTML_LANG[lang],
        url: BASE + `${lang}/${b.path}/`,
        blogPost: b.categories.map((c) => ({ "@type": "BlogPosting", headline: c.h1, url: BASE + `${lang}/${b.path}/${c.slug}/` })),
      },
    ],
  }) + body + footer(lang, rel);
}

function localeBlogCategoryPage(lang, cat) {
  const rel = localeBlogUrl(lang, cat.slug);
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const b = LOCALE_BLOG[lang];
  const l = b.labels;
  const index = b.categories.findIndex((c) => c.slug === cat.slug);

  const siblings = b.categories
    .filter((c) => c.slug !== cat.slug)
    .map((c) => `<a class="cat-chip" href="${root}${lang}/${b.path}/${c.slug}/">${esc(c.name)}</a>`)
    .join("");

  const toc = cat.sections
    .map(([h2], i) => `<a href="#section-${i + 1}">${esc(h2)}</a>`)
    .join("");

  const article = cat.sections
    .map(([h2, paras], i) => `<section id="section-${i + 1}"><h2>${esc(h2)}</h2>${paras.map((t) => `<p>${esc(t)}</p>`).join("")}</section>`)
    .join("");

  const catPosts = LOCALE_POSTS[lang]
    .filter((o) => o.category === cat.slug)
    .map((o) => `<a class="post-row" href="${root}${BLOG_ROOT[lang]}/${o.slug}/"><strong>${esc(o.title)}</strong><span>${esc(POST_LABELS[lang].readMore)}</span></a>`)
    .join("");

  // the same subject in the other two locales, so the switch lands on the topic
  const alternates = { de: "ratgeber/index.html", en: "en/blog/index.html" };
  for (const code of ["nl", "da", "fr"]) alternates[code] = localeBlogUrl(code, LOCALE_BLOG[code].categories[index].slug);

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · <a href="${root}${lang}/${b.path}/">${esc(b.hub.eyebrow)}</a> · ${esc(cat.name)}</div><div class="eyebrow">${esc(cat.name)}</div><h1>${esc(cat.h1)}</h1><p>${esc(cat.lead)}</p></div></header>

<section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>${esc(cat.name)}</strong><p>${esc(cat.lead)}</p></div>${article}</article><aside class="article-aside"><div class="toc"><strong>${esc(l.allPosts)}</strong>${toc}</div></aside></div></section>

${catPosts ? `<section class="section section-soft"><div class="container">${sectionHeader(POST_LABELS[lang].posts, cat.name)}<div class="post-list">${catPosts}</div></div></section>` : ""}

<section class="section${catPosts ? "" : " section-soft"}"><div class="container">${sectionHeader(l.faq, cat.name, esc(cat.lead))}<div class="faq-layout"><div>${faqMarkup(cat.faq)}</div></div>${disclaimer(lang)}</div></section>

<section class="section section-soft"><div class="container">${sectionHeader(b.hub.eyebrow, l.related)}<div class="cat-rail">${siblings}</div><div style="margin-top:24px"><a class="btn btn-dark" href="${root}${lang}/${b.path}/">${esc(l.hubLink)} →</a></div></div></section></main>`;

  return head({
    lang,
    rel,
    title: `${cat.name}: ${TERM} | MODUNERA`,
    description: snippet(cat.h1, cat.lead),
    alternates,
    extraLd: [
      breadcrumbLd([[u.breadHome, p.home], [b.hub.eyebrow, `${lang}/${b.path}/`], [cat.name, `${lang}/${b.path}/${cat.slug}/`]]),
      faqLd(cat.faq),
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: cat.h1,
        description: cat.lead,
        inLanguage: HTML_LANG[lang],
        dateModified: UPDATED,
        author: { "@type": "Organization", name: "MODUNERA" },
        publisher: { "@type": "Organization", name: "MODUNERA", logo: { "@type": "ImageObject", url: BASE + "assets/brand/modunera-master-logo-mountain-v1-600.png" } },
        mainEntityOfPage: BASE + `${lang}/${b.path}/${cat.slug}/`,
      },
    ],
  }) + body + footer(lang, rel);
}

/* An individual post. Same shell as a category page so the two read as one blog,
   but the aside carries the article's own sections and the siblings are the other
   posts in the same category rather than the nine category chips. */
function localePostPage(lang, post) {
  const rel = `${BLOG_ROOT[lang]}/${post.slug}/index.html`;
  const root = rootFor(rel);
  const p = PATHS[lang];
  const u = UI[lang];
  const l = POST_LABELS[lang];
  const blogHome = `${BLOG_ROOT[lang]}/`;
  const blogLabel = lang === "en" ? "Blog" : LOCALE_BLOG[lang].hub.eyebrow;

  const siblings = LOCALE_POSTS[lang]
    .filter((o) => o.slug !== post.slug)
    .slice(0, 6)
    .map((o) => `<a class="post-row" href="${root}${BLOG_ROOT[lang]}/${o.slug}/"><strong>${esc(o.title)}</strong><span>${esc(o.name)}</span></a>`)
    .join("");

  const toc = post.sections.map(([h2], i) => `<a href="#section-${i + 1}">${esc(h2)}</a>`).join("");
  const article = post.sections
    .map(([h2, paras], i) => `<section id="section-${i + 1}"><h2>${esc(h2)}</h2>${paras.map((t) => `<p>${esc(t)}</p>`).join("")}</section>`)
    .join("");

  const body = `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${p.home}">${esc(u.breadHome)}</a> · <a href="${root}${blogHome}">${esc(blogLabel)}</a> · ${esc(post.name)}</div><div class="eyebrow">${esc(post.name)}</div><h1>${esc(post.title)}</h1><p>${esc(post.lead)}</p><div class="hero-actions"><a class="btn btn-primary" href="${root}${p.models}/">MD 1 – MD 8</a><a class="btn btn-outline" href="${root}${blogHome}${post.category}/">${esc(post.name)} →</a></div></div></header>

<section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>${esc(post.name)}</strong><p>${esc(post.lead)}</p></div>${article}</article><aside class="article-aside"><div class="toc"><strong>${esc(l.inThis)}</strong>${toc}</div></aside></div></section>

<section class="section section-soft"><div class="container">${sectionHeader(l.faq, post.name, esc(post.lead))}<div class="faq-layout"><div>${faqMarkup(post.faq)}</div></div>${disclaimer(lang)}</div></section>

<section class="section"><div class="container">${sectionHeader(blogLabel, l.related)}<div class="post-list">${siblings}</div><div style="margin-top:24px"><a class="btn btn-dark" href="${root}${blogHome}">${esc(l.back)} →</a></div></div></section></main>`;

  return head({
    lang,
    rel,
    title: `${post.title.replace(/[.:]$/, "")} | MODUNERA ${TERM}`,
    description: snippet(post.title, post.lead),
    alternates: Object.fromEntries(["en", "nl", "da", "fr"].map((code) => {
      const i = LOCALE_POSTS[lang].findIndex((o) => o.slug === post.slug);
      return [code, `${BLOG_ROOT[code]}/${LOCALE_POSTS[code][i].slug}/index.html`];
    }).concat([["de", "blog/index.html"]])),
    extraLd: [
      breadcrumbLd([[u.breadHome, p.home], [blogLabel, blogHome], [post.name, `${BLOG_ROOT[lang]}/${post.slug}/`]]),
      faqLd(post.faq),
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.lead,
        inLanguage: HTML_LANG[lang],
        dateModified: UPDATED,
        author: { "@type": "Organization", name: "MODUNERA" },
        publisher: { "@type": "Organization", name: "MODUNERA", logo: { "@type": "ImageObject", url: BASE + "assets/brand/modunera-master-logo-mountain-v1-600.png" } },
        mainEntityOfPage: BASE + `${BLOG_ROOT[lang]}/${post.slug}/`,
      },
    ],
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
    await put(localeBlogUrl(lang, null), localeBlogHubPage(lang));
    count += 1;
    for (const cat of LOCALE_BLOG[lang].categories) {
      await put(localeBlogUrl(lang, cat.slug), localeBlogCategoryPage(lang, cat));
      count += 1;
    }
  }
  for (const lang of ["en", "nl", "da", "fr"]) {
    for (const post of LOCALE_POSTS[lang]) {
      await put(`${BLOG_ROOT[lang]}/${post.slug}/index.html`, localePostPage(lang, post));
      count += 1;
    }
  }
  return count;
}



/* --- the article library, rewritten from per-topic material ---------------- */

/* The 125 German posts were generated from one seven-section skeleton with the
   keyword substituted in: "Bei {keyword} sollte die Planung mit dem gewünschten
   Ergebnis beginnen", 125 times. That is not thin content, it is one page
   published 125 times, and a search engine reads it that way.
   
   data/blog-topics.json gives each of the 58 topics its own argument, its own
   mistakes and its own questions. A topic appears in two formats — a guide and a
   mistakes checklist — and the two use the material differently so they do not
   duplicate each other either. The rewrite replaces the <article> body and the
   table of contents beside it; the hero, the breadcrumbs and the sidebar links
   the rest of the pipeline owns are left alone. */

const BLOG_TOPICS = JSON.parse(await readFile(join(ROOT, "data/blog-topics.json"), "utf8")).topics;

const CATEGORY_LABELS = {
  "genehmigung-und-recht": "Genehmigung & Recht",
  "kosten-und-finanzierung": "Kosten & Finanzierung",
  "technik-und-konstruktion": "Technik & Konstruktion",
  "energie-und-autarkie": "Energie & Autarkie",
  "transport-und-import": "Transport & Import",
  "grundriss-und-innenraum": "Grundriss & Innenraum",
  "nutzung-und-geschaeftsmodell": "Nutzung & Geschäftsmodell",
  "vergleich-und-alternativen": "Vergleich & Alternativen",
  "betrieb-und-wartung": "Betrieb & Wartung",
};

/* Which models a category most often points at. Written per category rather than
   per topic, because the answer genuinely is the same for every topic inside one:
   a permit question does not have a favourite model, a family question does. */
const CATEGORY_MODELS = {
  "genehmigung-und-recht": [3, 1, 7],
  "kosten-und-finanzierung": [7, 1, 5],
  "technik-und-konstruktion": [6, 1, 8],
  "energie-und-autarkie": [7, 5, 6],
  "transport-und-import": [7, 1, 4],
  "grundriss-und-innenraum": [3, 2, 1],
  "nutzung-und-geschaeftsmodell": [4, 2, 8],
  "vergleich-und-alternativen": [1, 6, 7],
  "betrieb-und-wartung": [8, 6, 7],
};

/* Slug → topic key and format. tiny-house-<topic>-leitfaden is a guide,
   -fehler-checkliste is the mistakes format, anything else is a standalone post
   which is rendered as a guide. */
function blogTopicOf(rel) {
  const m = rel.match(/^blog\/([^/]+)\/index\.html$/);
  if (!m || m[1] === "europa") return null;
  let key = m[1].replace(/^tiny-house-/, "");
  let format = "post";
  if (key.endsWith("-leitfaden")) { key = key.slice(0, -"-leitfaden".length); format = "guide"; }
  else if (key.endsWith("-fehler-checkliste")) { key = key.slice(0, -"-fehler-checkliste".length); format = "mistakes"; }
  const topic = BLOG_TOPICS[key];
  return topic ? { key, format, topic } : null;
}

const BLOG_CATEGORIES = JSON.parse(await readFile(join(ROOT, "data/blog-categories.json"), "utf8")).categories;

/* topic key → { guide?, mistakes?, post? } of the slugs that exist on disk */
const TOPIC_SLUGS = new Map();

/* The two formats share only the opening sentence and the two closing sections.
   Everything in between is different material: the guide argues the subject and
   then goes deeper on the category; the checklist works through the mistakes and
   then gives the order in which to check things. Written this way the two pages
   for one topic are no longer versions of each other. */
/* Two topics exist as a standalone post *and* as a guide. Rendering both from the
   guide material produced two byte-identical pages, which is the one duplication
   problem a search engine punishes outright. Where a topic has both, the
   standalone becomes the overview: it introduces the subject, names the mistakes
   in one line each and sends the reader to the two long pages. Where a topic has
   only the standalone (eight of them), it is still rendered as the guide. */
const bodyFormat = ({ key, format }) => {
  if (format !== "post") return format;
  const have = TOPIC_SLUGS.get(key) ?? {};
  return have.guide ? "overview" : "guide";
};

function articleHeadings(found) {
  const { topic } = found;
  const cat = BLOG_CATEGORIES[topic.cat];
  const kind = bodyFormat(found);
  const body = kind === "mistakes"
    ? [...topic.mistakes.map(([t], i) => `Fehler ${i + 1}: ${t}`), cat.order[0]]
    : kind === "overview"
      ? ["Worum es bei diesem Thema geht", "Die drei Fehler, die am meisten kosten", "Wo Sie weiterlesen"]
      : [...topic.points.map(([h]) => h), cat.depth[0]];
  return [...body, "Welche Modelle hier meistens infrage kommen", `${cat.countryLead}`];
}

function articleBody(found, root) {
  const { key, topic } = found;
  const format = bodyFormat(found);
  const cat = BLOG_CATEGORIES[topic.cat];
  const models = CATEGORY_MODELS[topic.cat];
  const heads = articleHeadings(found);
  const sections = [`<div class="answer-box"><strong>Kurz gesagt</strong><p>${esc(topic.what)}</p></div>`];
  const have = TOPIC_SLUGS.get(key) ?? {};

  const bodies = format === "mistakes"
    ? [...topic.mistakes.map(([, text]) => text), cat.order[1]]
    : format === "overview"
      ? [
          `${topic.points[0][0]}: ${topic.points[0][1]}`,
          topic.mistakes.map(([t]) => t).join(". ") + ". Jeder dieser Punkte ist einzeln vermeidbar und zusammen der Grund, warum vergleichbare Projekte unterschiedlich enden.",
          `Der ausführliche Leitfaden behandelt ${esc(topic.points.map(([h]) => h.toLowerCase()).join(", "))}. Die Fehler-Checkliste geht die drei häufigsten Fehlannahmen im Detail durch und nennt die Reihenfolge, in der geprüft wird.`,
        ]
      : [...topic.points.map(([, text]) => text), cat.depth[1]];

  bodies.forEach((text, i) => {
    sections.push(`<section id="section-${i + 1}"><h2>${esc(heads[i])}</h2><p>${esc(text)}</p></section>`);
  });

  const n0 = bodies.length;
  const modelLine = models
    .map((n) => `<a href="${root}modelle/md-${n}/">MD ${n}</a> (${esc(MODEL_COPY[String(n)].de.label)}, ab ${esc(eur(PRICING.models[`mc${n}`].base_eur, "de"))})`)
    .join(", ");
  sections.push(
    `<section id="section-${n0 + 1}"><h2>${esc(heads[n0])}</h2><p>Bei Fragen aus dem Bereich ${esc(CATEGORY_LABELS[topic.cat])} führen die Projekte in der Praxis am häufigsten zu ${modelLine}. Die Basisbreite beträgt bei allen acht Modellen 2,55 Meter; der Unterschied liegt in Länge, Aufteilung und Ausstattungstiefe. Entschieden wird nach Nutzung, Personenzahl und Standort — nicht nach dem Datenblatt.</p></section>`
  );

  /* The market paragraph quotes the per-country fact that this category actually
     turns on, so it reads differently under a permit topic than under a cost one. */
  sections.push(
    `<section id="section-${n0 + 2}"><h2>${esc(heads[n0 + 1])}</h2>${COUNTRY_ORDER
      .map((c) => `<p><strong>${esc(COUNTRY_NAMES.de[c])}:</strong> ${esc(QA.facts.de[c][cat.countryField])}</p>`)
      .join("")}<p><a class="source-link" href="${root}fragen/">Alle Fragen und Antworten je Zielland →</a></p></section>`
  );

  /* The FAQ block belongs to the guide; the checklist closes with the questions
     as prose so the two pages do not carry the same three answers verbatim. */
  if (format === "overview") {
    const links = [
      have.guide ? [have.guide, `${topic.title}: der vollständige Leitfaden`] : null,
      have.mistakes ? [have.mistakes, `${topic.title}: die häufigsten Fehler`] : null,
    ].filter(Boolean);
    sections.push(
      `<section id="section-${n0 + 3}"><h2>Die beiden ausführlichen Beiträge</h2><div class="post-list">${links
        .map(([slug, title]) => `<a class="post-row" href="${root}blog/${slug}/"><strong>${esc(title)}</strong><span>Weiterlesen</span></a>`)
        .join("")}</div></section>`
    );
  } else if (format === "mistakes") {
    sections.push(
      `<section id="section-${n0 + 3}"><h2>Vor der Bestellung abhaken</h2><ul class="check-list">${topic.mistakes
        .map(([title]) => `<li>${esc(title)} — geprüft und schriftlich festgehalten?</li>`)
        .join("")}<li>Zuständige Stelle im Zielland angefragt und Antwort schriftlich erhalten?</li><li>Zufahrt und Entladepunkt mit Fotos und Maßen dokumentiert?</li><li>Budget inklusive Fundament, Anschlüssen, Entladung, Planung, Gebühren und Versicherung gerechnet?</li></ul></section>`
    );
  } else {
    /* 2026-08-25, the pruning. The mistakes format is no longer a page of its
       own: 50 topics each held a -leitfaden and a -fehler-checkliste on ONE
       search intent, with intra-family duplication measured at 0.29-0.55
       six-gram Jaccard (CONTENT_PRUNING_PLAN.md). The checklist material was
       genuinely good - the FORMAT was the problem - so the guide absorbs it
       whole: the mistakes argued in full, then the pre-order checklist, then
       the FAQ. One topic, one URL, everything the two pages said. */
    sections.push(
      `<section id="section-${n0 + 3}"><h2>Die häufigsten Fehler — und wie sie sich vermeiden lassen</h2>${topic.mistakes
        .map(([mTitle, mText], i) => `<h3>Fehler ${i + 1}: ${esc(mTitle)}</h3><p>${esc(mText)}</p>`)
        .join("")}</section>`
    );
    sections.push(
      `<section id="section-${n0 + 4}"><h2>Vor der Bestellung abhaken</h2><ul class="check-list">${topic.mistakes
        .map(([mTitle]) => `<li>${esc(mTitle)} — geprüft und schriftlich festgehalten?</li>`)
        .join("")}<li>Zuständige Stelle im Zielland angefragt und Antwort schriftlich erhalten?</li><li>Zufahrt und Entladepunkt mit Fotos und Maßen dokumentiert?</li><li>Budget inklusive Fundament, Anschlüssen, Entladung, Planung, Gebühren und Versicherung gerechnet?</li></ul></section>`
    );
    sections.push(
      `<section id="section-${n0 + 5}"><h2>Häufige Fragen</h2>${faqMarkup(topic.faq)}</section>`
    );
  }

  /* Related reading inside the same category. The library had no lateral links at
     all, so a crawler reaching one post had nowhere to go but back to the hub. */
  const siblings = Object.entries(BLOG_TOPICS)
    .filter(([k, t]) => t.cat === topic.cat && k !== key && TOPIC_SLUGS.has(k))
    .slice(0, 6);
  if (siblings.length) {
    const sibId = format === "guide" ? n0 + 6 : n0 + 4;
    sections.push(
      `<section id="section-${sibId}"><h2>Weiterlesen zu ${esc(CATEGORY_LABELS[topic.cat])}</h2><div class="post-list">${siblings
        .map(([k, t]) => {
          const have = TOPIC_SLUGS.get(k) ?? {};
          const slug = have[format] ?? have.guide ?? have.mistakes ?? have.post;
          return `<a class="post-row" href="${root}blog/${slug}/"><span>${esc(t.title)}</span><small>${esc(t.what.slice(0, 96))}…</small></a>`;
        })
        .join("")}</div><p><a class="source-link" href="${root}ratgeber/${topic.cat}/">Alle Beiträge zu ${esc(CATEGORY_LABELS[topic.cat])} →</a></p></section>`
    );
  }

  sections.push(disclaimer("de"));
  return `<article class="article">${sections.join("")}</article>`;
}

function tableOfContents(found) {
  const kind = bodyFormat(found);
  const tail = kind === "overview"
    ? ["Die beiden ausführlichen Beiträge"]
    : kind === "mistakes"
      ? ["Vor der Bestellung abhaken"]
      : ["Die häufigsten Fehler — und wie sie sich vermeiden lassen", "Vor der Bestellung abhaken", "Häufige Fragen"];
  const all = [...articleHeadings(found), ...tail];
  return `<div class="toc"><strong>Inhalt</strong>${all
    .map((h, i) => `<a href="#section-${i + 1}">${esc(h)}</a>`)
    .join("")}</div>`;
}

/* The last legacy prose on the German article library.

   rewriteArticles() replaces the <article> body and the table of contents. It
   does not touch the <head> or the page-hero paragraph, so the description
   tools/generate_scale_v3.py baked in 2025 is still what a reader sees first and
   what Google shows in the result:

     "Akustik im Tiny House professionell planen: Schallübertragung, Raumgefühl
      und Materialkonzept. Mit Entscheidungslogik, Kostenrahmen, Technik und
      Checkliste."

   Measured across the 519 indexed pages, "professionell" was the single most
   repeated filler word on the site — 101 occurrences on 52 pages — and every one
   of them came from that one f-string. "Professionell planen" tells a reader
   nothing: nobody offers to plan their house unprofessionally. "Entscheidungs-
   logik, Kostenrahmen, Technik und Checkliste" is four nouns where a sentence
   would do.

   Both are replaced here rather than in the retired script, because the retired
   script is not run and these pages have no other owner. The subject-specific
   half of the line — what the article is actually about — is kept exactly as it
   was; only the padding around it changes. Re-running finds nothing to do. */
/* The formulaic phrases counted by tools/score-prose-style.mjs, replaced from
   data/prose-fixes.json. Same shape as normaliseClaims(): the phrases sit in the
   layer no generator owns — the home page, /faq/, /konfigurator/, /studio/ and
   the pages baked by the retired tools/generate_scale_v3.py — so they are fixed
   on the built HTML rather than by hand-editing a page.

   "professionell" was the most repeated filler word on the site at 101
   occurrences across 52 pages, and every one came from one f-string in the
   retired script. Hedges are not in that file and are not touched. */
const PROSE_FIXES = JSON.parse(await readFile(join(ROOT, "data/prose-fixes.json"), "utf8")).replacements
  .map(([from, to]) => ({ from, to }))
  .sort((a, b) => b.from.length - a.from.length);

function humaniseLegacyLead(html) {
  let out = html;
  for (const { from, to } of PROSE_FIXES) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}

async function rewriteArticles() {
  const files = (await walk(join(ROOT, "blog"))).filter((f) => extname(f).toLowerCase() === ".html");
  // ten of the topics exist only as a standalone post, with no -leitfaden or
  // -fehler-checkliste variant, so the related links are built from what is on
  // disk rather than from the naming convention
  TOPIC_SLUGS.clear();
  for (const file of files) {
    const found = blogTopicOf(relative(ROOT, file).replaceAll("\\", "/"));
    if (!found) continue;
    const bucket = TOPIC_SLUGS.get(found.key) ?? {};
    bucket[found.format] = relative(ROOT, dirname(file)).replaceAll("\\", "/").replace(/^blog\//, "");
    TOPIC_SLUGS.set(found.key, bucket);
  }
  let changed = 0;
  let skipped = 0;
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    const found = blogTopicOf(rel);
    const html = await readFile(file, "utf8");
    /* The hub carries a card for all 125 articles, each with the same legacy
       description, so it alone held 51 of the 101 "professionell" occurrences.
       It has no topic of its own, so the body rewrite skips it — but the lead
       pass has to reach it, which is why this runs before the topic check. */
    if (!found) {
      const cleaned = humaniseLegacyLead(html);
      if (cleaned !== html) { await writeFile(file, cleaned, "utf8"); changed += 1; }
      skipped += 1;
      continue;
    }
    const root = rootFor(rel);
    let next = html.replace(/<article class="article">[\s\S]*?<\/article>/, articleBody(found, root));
    next = next.replace(/<div class="toc"><strong>Inhalt<\/strong>[\s\S]*?<\/div>/, tableOfContents(found));
    next = humaniseLegacyLead(next);
    // the FAQ now lives in the body, so the page should say so in its structured data
    // only the guide format renders the answers, so only it declares FAQPage
    const ld = bodyFormat(found) === "guide" ? jsonLd(faqLd(found.topic.faq)) : "";
    next = next.includes("MODUNERA TOPIC FAQ")
      ? next.replace(/<!-- MODUNERA TOPIC FAQ -->[\s\S]*?<!-- \/MODUNERA TOPIC FAQ -->/, `<!-- MODUNERA TOPIC FAQ -->${ld}<!-- /MODUNERA TOPIC FAQ -->`)
      : next.replace("</head>", `<!-- MODUNERA TOPIC FAQ -->${ld}<!-- /MODUNERA TOPIC FAQ --></head>`);
    if (next !== html) {
      await writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  return { changed, skipped };
}



/* --- models on the home page ----------------------------------------------- */

/* Four of the five home pages had no models on them at all: the English one
   showed a single stock image under the heading "Eight starting points", and the
   Dutch, Danish and French ones went from the hero straight to countries. The
   German one had all eight, but behind a tab widget that displays exactly one at
   a time and needs JavaScript to do it.
   
   All five now carry the same eight-card grid — image, layout, sleeping places
   and entry price, each card a link to that model's page in that language. */

const HOME_MODELS = {
  de: { anchor: "modelle", eyebrow: "MD 1 bis MD 8", h2: "Acht Charaktere. Ein Lebensentwurf.",
    lead: "Wählen Sie nicht nur nach Größe, sondern nach Nutzung, Raumgefühl, Stil und Investitionsziel. Alle acht auf derselben technischen Basis von 2,55 Metern Breite — der Unterschied liegt in Länge, Aufteilung und Ausstattungstiefe.",
    all: "Alle Modelle im Detail", compare: "Modelle vergleichen", sleeps: "Schlafplätze" },
  en: { anchor: "models", eyebrow: "MD 1 to MD 8", h2: "Eight characters. One way of living.",
    lead: "Choose by use, spatial feel, style and investment goal rather than by size alone. All eight share a 2.55 metre base width — what differs is length, layout and specification depth.",
    all: "All models in detail", compare: "Compare the models", sleeps: "sleeps" },
  nl: { anchor: "modellen", eyebrow: "MD 1 tot en met MD 8", h2: "Acht karakters. Eén manier van wonen.",
    lead: "Kies op gebruik, ruimtegevoel, stijl en investeringsdoel in plaats van alleen op maat. Alle acht delen een basisbreedte van 2,55 meter — het verschil zit in lengte, indeling en afwerkingsdiepte.",
    all: "Alle modellen in detail", compare: "Modellen vergelijken", sleeps: "slaapplaatsen" },
  da: { anchor: "modeller", eyebrow: "MD 1 til MD 8", h2: "Otte karakterer. Én måde at bo på.",
    lead: "Vælg efter anvendelse, rumfornemmelse, stil og investeringsmål frem for kun efter størrelse. Alle otte deler en basisbredde på 2,55 meter — forskellen ligger i længde, disponering og udstyrsdybde.",
    all: "Alle modeller i detaljer", compare: "Sammenlign modellerne", sleeps: "sovepladser" },
  fr: { anchor: "modeles", eyebrow: "MD 1 à MD 8", h2: "Huit caractères. Une façon d'habiter.",
    lead: "Choisissez selon l'usage, la sensation d'espace, le style et l'objectif d'investissement plutôt que selon la seule taille. Les huit partagent une largeur de base de 2,55 mètres — la différence tient à la longueur, à la distribution et à la profondeur d'équipement.",
    all: "Tous les modèles en détail", compare: "Comparer les modèles", sleeps: "couchages" },
};

function homeModelSection(lang, root) {
  const h = HOME_MODELS[lang];
  const p = PATHS[lang];
  const cards = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const c = MODEL_COPY[String(n)][lang];
    const s = PRICING.models[`mc${n}`];
    const img = MODEL_COPY[String(n)].images[0];
    return `<article class="model-card"><a href="${root}${p.models}/md-${n}/">${gridImg(root, img, `MODUNERA MD ${n} – ${esc(c.label)}`)}<div class="model-content"><div class="model-label">${esc(c.label)}</div><h3>MD ${n}</h3><p>${esc(c.lead)}</p><div class="model-specs"><span>${esc(lengths(n, lang))}</span><span>${esc(MODEL_COPY[String(n)].sleeps)} ${esc(h.sleeps)}</span><span>${esc(MODEL_FROM[lang])} ${esc(eur(s.base_eur, lang))}</span></div></div></a></article>`;
  }).join("");

  const compareHref = lang === "de" ? "modellvergleich/" : lang === "en" ? "en/model-comparison/" : `${p.questions}/`;
  const compareLabel = lang === "de" || lang === "en" ? h.compare : QA.labels[lang].hub;

  return `<section class="section section-soft" id="${h.anchor}"><div class="container">${sectionHeader(h.eyebrow, h.h2, esc(h.lead))}<div class="model-grid">${cards}</div><div class="hero-actions" style="margin-top:30px"><a class="btn btn-dark" href="${root}${p.models}/">${esc(h.all)}</a><a class="btn btn-outline" href="${root}${compareHref}">${esc(compareLabel)}</a></div>${disclaimer(lang)}</div></section>`;
}

const HOME_OPEN = "<!-- MODUNERA HOME MODELS START -->";
const HOME_CLOSE = "<!-- MODUNERA HOME MODELS END -->";

/* German prices read "ab 44.900 €", English "from €44,900" — the word in front of
   the figure differs per language and is shared with the navigation. */
const MODEL_FROM = { de: "ab", en: "from", nl: "vanaf", da: "fra", fr: "dès" };

/* The grid card image, responsive when a -900 sibling exists. The full gallery
   originals are up to 441 KB for a card the layout renders at ~700 px; measured
   at load, the home page transferred 3.26 MB of images, mostly here. The
   sibling is emitted by tools/make_image_derivatives.py; where one is missing
   the original stands alone, so a new gallery file never breaks the build. */
function gridImg(root, img, alt) {
  const sibling = join(ROOT, `assets/images/gallery/${img}-900.webp`);
  const src = `${root}assets/images/gallery/${img}-900.webp`;
  const full = `${root}assets/images/gallery/${img}.webp`;
  if (!existsSync(sibling)) {
    return `<img src="${full}" alt="${alt}" loading="lazy" width="900" height="600">`;
  }
  return `<img src="${src}" srcset="${src} 900w, ${full} 1600w" sizes="(max-width:920px) 100vw, 720px" alt="${alt}" loading="lazy" width="900" height="600">`;
}

async function buildHomeModels() {
  let changed = 0;
  for (const lang of LANGS) {
    const rel = PATHS[lang].home === "index.html" ? "index.html" : `${PATHS[lang].home}index.html`;
    let html;
    try {
      html = await readFile(join(ROOT, rel), "utf8");
    } catch {
      continue;
    }
    const block = HOME_OPEN + homeModelSection(lang, rootFor(rel)) + HOME_CLOSE;
    let next;
    if (html.includes(HOME_OPEN)) {
      next = html.replace(new RegExp(`${HOME_OPEN}[\\s\\S]*?${HOME_CLOSE}`), block);
    } else if (lang === "de") {
      // the German home carries the tab widget: one model visible, JavaScript required
      next = html.replace(/<section class="section section-soft" id="modelle">[\s\S]*?<\/section>\s*(?=<section)/, block);
    } else if (lang === "en") {
      // the English home carries a single stock image under the eight-models heading
      next = html.replace(/<section class="section" id="models">[\s\S]*?<\/section>\s*(?=<section)/, block);
    } else {
      // nl, da and fr open with <section class="page-hero"> rather than a <header>,
      // and go from there straight to the figures row; the grid slots in after the hero
      next = html.replace(/(<section class="page-hero">[\s\S]*?<\/section>)/, `$1${block}`);
    }
    if (next !== html) {
      await writeFile(join(ROOT, rel), next, "utf8");
      changed += 1;
    }
  }
  return changed;
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

/* Claims that cannot be published until the business supplies evidence. The
   register is data/blocked-claims.json; this pass applies it to the built HTML
   because the phrases sit in three layers at once — the current generators, the
   data corpora, and roughly 11,000 pages baked years ago by the retired
   tools/generate_scale_v3.py. Longest phrase first, so "aus eigener Produktion"
   is caught before the bare "eigener Produktion" that is a substring of it.
   Re-running finds nothing, which keeps the pipeline idempotent. */
const CLAIM_RULES = JSON.parse(await readFile(join(ROOT, "data/blocked-claims.json"), "utf8")).rules;
const CLAIM_REPLACEMENTS = CLAIM_RULES
  .flatMap((rule) => rule.replacements.map(([from, to]) => ({ from, to })))
  .sort((a, b) => b.from.length - a.from.length);

async function normaliseClaims() {
  /* walkPages(), not walk(): the shared walk() skips downloads/ because it holds
     the PDF library, which meant downloads/index.html — a normal indexed page —
     was never reached by the claim register either. It is one page, and it is
     exactly the kind of page a phrase hides on. */
  const files = await walkPages(ROOT);
  let changed = 0;
  for (const file of files) {
    const original = await readFile(file, "utf8");
    let html = original;
    for (const { from, to } of CLAIM_REPLACEMENTS) {
      if (html.includes(from)) html = html.split(from).join(to);
    }
    // the formulaic phrases from data/prose-fixes.json ride the same walk: both
    // are literal replacements over pages that no generator owns, and walking
    // 15,000 files twice to do it separately would only be slower
    html = humaniseLegacyLead(html);
    if (html === original) continue;
    await writeFile(file, html, "utf8");
    changed += 1;
  }
  return changed;
}

/* --- the product word, on every page ------------------------------------- */

/* Buyers in all five markets search the English words — Germans type "Tiny House"
   more often than any translation — so the term belongs in the tab title and the
   search result of every page, not only on the pages that happen to mention it in
   their headline. This runs last in the pipeline, after every generator, and only
   touches a title that does not already carry the term. The Google verification
   file and the local-only demo shells are left alone: they are not indexed pages.
   Re-running finds nothing to do, which is what keeps the pipeline idempotent. */
const TITLE_TERM_SKIP = /^(google[0-9a-f]+\.html|admin-demo\/|customer-portal\/|booking\/|saved-designs\/)/;

/* The shared walk() skips downloads/ because it holds the PDF library, but the
   one index page in there is a normal indexed page and needs the same treatment. */
async function walkPages(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "assets"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walkPages(full, files);
    else if (extname(full) === ".html") files.push(full);
  }
  return files;
}

/* Pages whose subject is the product. A privacy policy or an imprint is left
   alone: forcing the product word into those descriptions would be noise, and
   their titles already carry it. */
const TERM_CONTENT = /^(blog\/|ratgeber\/|en\/blog\/|en\/guides\/|fragen\/|faq\/|standorte\/|laender\/|leistungen\/|katalog\/|modelle\/|projects\/|factory\/|qualitaet\/|nachhaltigkeit\/|tiny-house-|(de|en|nl|da|fr)\/)/;
const DESC_PREFIX = { de: "Tiny House", en: "Tiny house", nl: "Tiny house", da: "Tiny house", fr: "Tiny house" };

async function normaliseTitles() {
  const files = await walkPages(ROOT);
  let changed = 0;
  for (const full of files) {
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (TITLE_TERM_SKIP.test(rel)) continue;
    const html = await readFile(full, "utf8");
    const match = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (!match) continue;
    let updated = html;
    // the meta description, on pages whose subject is the product
    const desc = html.match(/<meta name="description" content="([^"]*)">/i);
    if (desc && TERM_CONTENT.test(rel) && !TERM_RE.test(desc[1]) && desc[1].trim()) {
      const lang = (html.match(/<html lang="([a-z]{2})/i) ?? [, "de"])[1].toLowerCase();
      const led = `${DESC_PREFIX[lang] ?? DESC_PREFIX.de}: ${desc[1]}`;
      const trimmed = led.length > 158 ? led.slice(0, 155).trimEnd() + "…" : led;
      updated = updated.split(`content="${desc[1]}"`).join(`content="${trimmed}"`);
    }
    const title = match[1];
    if (TERM_RE.test(title)) {
      if (updated !== html) { await writeFile(full, updated, "utf8"); changed += 1; }
      continue;
    }
    // the site already ends most titles in "| MODUNERA"; extend that suffix rather
    // than bolting a second brand on, so the pattern stays the one MD 1 – MD 8 use
    const next = /\|\s*MODUNERA\s*$/.test(title)
      ? title.replace(/\|\s*MODUNERA\s*$/, `| MODUNERA ${TERM}`)
      : /MODUNERA/.test(title)
        ? `${title.trimEnd()} | ${TERM}`
        : `${title.trimEnd()} | MODUNERA ${TERM}`;
    if (next === title) {
      if (updated !== html) { await writeFile(full, updated, "utf8"); changed += 1; }
      continue;
    }
    // og:title mirrors the title wherever it is set, so move the two together
    updated = updated
      .replace(match[0], `<title>${next}</title>`)
      .replace(`<meta property="og:title" content="${title}">`, `<meta property="og:title" content="${next}">`);
    await writeFile(full, updated, "utf8");
    changed += 1;
  }
  return changed;
}

/* The German blog index carries a legacy card grid that no generator rebuilds —
   baked by the retired scale script. When the pruning removed 52 article
   directories, 104 of its links pointed at nothing (two per card: image and
   title). Rather than hand-editing a legacy page, this pass drops any card whose
   href has no directory behind it. Self-healing: a future removal needs no edit
   here, and a re-run with nothing removed changes nothing. */
async function pruneBlogIndexCards() {
  const file = join(ROOT, "blog/index.html");
  const original = await readFile(file, "utf8");
  let removed = 0;
  const next = original.replace(/<article class="blog-card[^"]*"[\s\S]*?<\/article>/g, (card) => {
    const href = card.match(/href="([^"]+)"/)?.[1] ?? "";
    if (!href || href.startsWith("http")) return card;
    const target = join(ROOT, "blog", href.replace(/\/$/, ""), "index.html");
    if (existsSync(target)) return card;
    removed += 1;
    return "";
  });
  if (next !== original) await writeFile(file, next, "utf8");
  return removed;
}

if (extendOnly) {
  const rewritten = await rewriteArticles();
  const deadCards = await pruneBlogIndexCards();
  if (deadCards) console.error(`blog index: ${deadCards} dead card(s) removed`);
  const homes = await buildHomeModels();
  const countries = await extendCountryPages();
  const articles = await extendArticles();
  const titles = await normaliseTitles();
  const claims = await normaliseClaims();
  console.log(`depth layer (extend):
  ${rewritten.changed} blog posts rewritten from per-topic material (${rewritten.skipped} left alone)
  ${homes} home pages given the eight-model grid
  ${countries} country pages extended with their question set
  ${articles} library pages extended with the five-market appendix
  ${titles} titles given the product word
  ${claims} pages cleared of claims that are not yet evidenced`);
} else {
  const models = await buildModelPages();
  const questions = await buildQuestionPages();
  const knowledge = await buildKnowledgePages();
  console.log(`depth layer (pages):
  ${models} model pages (MD 1 – MD 8 plus an index, in five languages)
  ${questions} country question pages (20 questions per country per language)
  ${knowledge} knowledge pages (English blog hub, nine subject pages, three locale guide hubs)`);
}
