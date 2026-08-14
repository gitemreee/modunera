#!/usr/bin/env node
/* The production, quality, delivery and purchasing FAQ.

   From STRATEGY/production-faq-blueprint.md in the V7 pack. Sixty questions in
   nine subjects, and one rule the blueprint states twice: the FAQPage schema is
   generated from the same questions and answers the reader can see, and the
   sixty are not copied onto every URL.

   Both follow from a single routing rule here. A subject becomes its own page in
   a language when that language actually has enough answers for one; below the
   threshold its questions sit on the hub instead. German and English carry all
   sixty, so they get nine subject pages each and a hub that is an index. Dutch,
   Danish and French carry the fourteen questions that come up in those markets,
   so their hub carries the answers and there are no thin subject pages. Translate
   more of the sixty and the subject pages appear on their own.

   Answers quote no U-value, no weight, no warranty period and no approval scope.
   Those are blocked in data/blocked-claims.json until the business supplies
   evidence, so an answer says where the figure will come from instead.

   Run before build-modunera-v2.mjs, which fills the navigation, the brand lockup
   and the WhatsApp dock on these pages along with every other.

   Usage: node tools/build-production-faq-v7.mjs
*/
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com/";
const WA = "905535435342";

/* Below this, a subject has too little in that language to be its own page and
   its questions are answered on the hub. */
const MIN_QUESTIONS_PER_PAGE = 3;

const FAQ = JSON.parse(await readFile(join(ROOT, "data/production-faq.json"), "utf8"));

const LANGS = ["de", "en", "nl", "da", "fr"];
const HTML_LANG = { de: "de-DE", en: "en-GB", nl: "nl-NL", da: "da-DK", fr: "fr-FR" };
const HREFLANG = { de: "de-DE", en: "en", nl: "nl-NL", da: "da-DK", fr: "fr" };
const HOME = { de: "", en: "en/", nl: "nl/", da: "da/", fr: "fr/" };
const MODELS = { de: "modelle/", en: "en/models/", nl: "nl/modellen/", da: "da/modeller/", fr: "fr/modeles/" };
const NEWS_HUB = { de: "news/", en: "en/news/", nl: "nl/nieuws/", da: "da/nyheder/", fr: "fr/actualites/" };
const FOOT = {
  de: { models: "Modelle", news: "Aus den Märkten", legal: "Impressum", privacy: "Datenschutz" },
  en: { models: "Models", news: "From the markets", legal: "Imprint", privacy: "Privacy" },
  nl: { models: "Modellen", news: "Uit de markten", legal: "Colofon", privacy: "Privacy" },
  da: { models: "Modeller", news: "Fra markederne", legal: "Kolofon", privacy: "Privatliv" },
  fr: { models: "Modèles", news: "Depuis les marchés", legal: "Mentions légales", privacy: "Confidentialité" },
};
const WA_MESSAGE = {
  de: "Hallo MODUNERA. Zielland/Ort: __. Nutzung: __. Personen: __. Grundstück: __. Budget: __. Bitte prüfen Sie mein Projekt.",
  en: "Hello MODUNERA. Country/place: __. Use: __. Occupants: __. Plot: __. Budget: __. Please check my project.",
  nl: "Hallo MODUNERA. Land/plaats: __. Gebruik: __. Personen: __. Perceel: __. Budget: __. Kunt u mijn project toetsen?",
  da: "Hej MODUNERA. Land/sted: __. Anvendelse: __. Personer: __. Grund: __. Budget: __. Vil I vurdere mit projekt?",
  fr: "Bonjour MODUNERA. Pays/lieu : __. Usage : __. Occupants : __. Terrain : __. Budget : __. Merci de vérifier mon projet.",
};
/* What the hub says about the sixty when the language carries only a selection.
   Saying it is a selection is the honest form; presenting fourteen as "all our
   questions" is not. */
const SELECTION_NOTE = {
  nl: "Dit zijn de vragen die in Nederland het vaakst terugkomen. De volledige lijst van zestig staat in het Duits en het Engels.",
  da: "Det er de spørgsmål, der oftest går igen i Danmark. Den fulde liste på tres findes på tysk og engelsk.",
  fr: "Ce sont les questions qui reviennent le plus souvent. La liste complète des soixante existe en allemand et en anglais.",
};

const esc = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const rootFor = (rel) => "../".repeat(rel.split("/").length - 1);
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
const waLink = (lang) => `https://wa.me/${WA}?text=${encodeURIComponent(WA_MESSAGE[lang])}`;

/* --- routing --------------------------------------------------------------- */

const hubPath = (lang) => `${FAQ.hub[lang].path}/`;
const categoryPath = (category, lang) => `${FAQ.hub[lang].path}/${category.slug[lang]}/`;

const questionsIn = (categoryId, lang) =>
  FAQ.questions.filter((q) => q.category === categoryId && q.q?.[lang] && q.a?.[lang]);

const hasOwnPage = (category, lang) =>
  questionsIn(category.id, lang).length >= MIN_QUESTIONS_PER_PAGE;

/* Everything the language answers that no subject page of its own carries. */
const hubQuestions = (lang) => FAQ.categories
  .filter((category) => !hasOwnPage(category, lang))
  .flatMap((category) => questionsIn(category.id, lang).map((q) => [category, q]))
  .filter(([, q]) => q);

const languagesWith = (category) => LANGS.filter((lang) => hasOwnPage(category, lang));

/* --- shell ----------------------------------------------------------------- */

function head({ lang, rel, title, description, alternates, extraLd }) {
  const root = rootFor(rel);
  const canonical = BASE + rel.replace(/index\.html$/, "");
  const tags = Object.entries(alternates)
    .map(([code, path]) => `<link rel="alternate" hreflang="${HREFLANG[code]}" href="${BASE}${path}">`)
    .join("");
  const xDefault = alternates.de ?? alternates[Object.keys(alternates)[0]];
  return `<!DOCTYPE html><html lang="${HTML_LANG[lang]}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${esc(title)}</title><meta name="description" content="${esc(description)}">` +
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">` +
    `<link rel="canonical" href="${canonical}">${tags}` +
    `<link rel="alternate" hreflang="x-default" href="${BASE}${xDefault}">` +
    `<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">` +
    `<meta property="og:image" content="${BASE}assets/images/gallery/hero-forest.webp">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<link rel="icon" type="image/png" href="${root}assets/brand/modunera-mark-v1.png">` +
    `<link rel="stylesheet" href="${root}assets/css/styles.css">${extraLd.map(jsonLd).join("")}` +
    `</head><body><a class="skip" href="#main">Skip</a><nav class="nav"></nav>`;
}

function footer(lang, rel) {
  const root = rootFor(rel);
  const f = FOOT[lang];
  return `<footer class="footer"><div class="container">` +
    `<div class="footer-bottom"><span><a class="brand" href="${root}${HOME[lang]}">MODUNERA</a></span>` +
    `<span><a href="${root}${MODELS[lang]}">${esc(f.models)}</a> · ` +
    `<a href="${root}${hubPath(lang)}">${esc(FAQ.hub[lang].label)}</a> · ` +
    `<a href="${root}${NEWS_HUB[lang]}">${esc(f.news)}</a></span></div>` +
    `<div class="footer-bottom"><span>© <span data-year>2026</span> MODUNERA.</span>` +
    `<span><a href="${root}legal/impressum/">${esc(f.legal)}</a> · ` +
    `<a href="${root}legal/datenschutz/">${esc(f.privacy)}</a></span></div>` +
    `</div></footer><script src="${root}assets/js/main.js"></script></body></html>`;
}

/* The site's own accordion markup, with an id so the hub can link to a single
   question and main.js can open it on arrival. */
const faqMarkup = (pairs, lang) => pairs
  .map(([, q]) => `<div class="faq-item" id="q-${q.id}"><button class="faq-question">${esc(q.q[lang])}<span>+</span></button>` +
    `<div class="faq-answer"><p>${esc(q.a[lang])}</p></div></div>`)
  .join("");

/* Generated from exactly the pairs rendered above it, never from the data file:
   a question that is not on the page is not in its schema. */
const faqLd = (pairs, lang, url) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url,
  inLanguage: HTML_LANG[lang],
  mainEntity: pairs.map(([, q]) => ({
    "@type": "Question",
    name: q.q[lang],
    acceptedAnswer: { "@type": "Answer", text: q.a[lang] },
  })),
});

const breadcrumbLd = (trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, route], index) => ({
    "@type": "ListItem", position: index + 1, name, item: BASE + route,
  })),
});

const actions = (lang, root, extra = "") =>
  `<section class="section section-soft"><div class="container"><div class="hero-actions">` +
  `<a class="btn btn-primary" href="${waLink(lang)}" target="_blank" rel="noopener">${esc(FAQ.labels[lang].cta)}</a>` +
  `${extra}</div></div></section>`;

/* --- pages ----------------------------------------------------------------- */

function categoryPage(category, lang) {
  const rel = `${categoryPath(category, lang)}index.html`;
  const root = rootFor(rel);
  const l = FAQ.labels[lang];
  const hub = FAQ.hub[lang];
  const pairs = questionsIn(category.id, lang).map((q) => [category, q]);

  const siblings = FAQ.categories
    .filter((other) => other.id !== category.id && hasOwnPage(other, lang))
    .map((other) => `<a class="post-row" href="${root}${categoryPath(other, lang)}">` +
      `<strong>${esc(other.name[lang])}</strong><span>${questionsIn(other.id, lang).length}</span></a>`)
    .join("");

  const alternates = Object.fromEntries(languagesWith(category).map((code) => [code, categoryPath(category, code)]));

  const body = `<main id="main"><header class="page-hero"><div class="container">` +
    `<div class="breadcrumbs"><a href="${root}${HOME[lang]}">MODUNERA</a> · ` +
    `<a href="${root}${hubPath(lang)}">${esc(hub.label)}</a> · ${esc(category.name[lang])}</div>` +
    `<div class="eyebrow">${esc(hub.label)} · ${pairs.length} ${esc(l.questions)}</div>` +
    `<h1>${esc(category.h1[lang])}</h1><p>${esc(category.lead[lang])}</p></div></header>` +

    `<section class="section"><div class="container"><div class="faq-layout"><div>${faqMarkup(pairs, lang)}</div></div>` +
    `<p class="legal-note">${esc(l.note)}</p></div></section>` +

    `<section class="section section-soft"><div class="container">` +
    `<div class="section-header"><div><div class="eyebrow">${esc(hub.label)}</div><h2>${esc(l.allCategories)}</h2></div></div>` +
    `<div class="post-list">${siblings}</div></div></section>` +

    actions(lang, root, `<a class="btn btn-outline" href="${root}${hubPath(lang)}">${esc(l.back)} →</a>`) +
    `</main>`;

  return head({
    lang, rel,
    title: `${category.name[lang]} — ${hub.label} | MODUNERA Tiny House`,
    description: category.lead[lang],
    alternates,
    extraLd: [
      faqLd(pairs, lang, BASE + categoryPath(category, lang)),
      breadcrumbLd([["MODUNERA", HOME[lang]], [hub.label, hubPath(lang)], [category.name[lang], categoryPath(category, lang)]]),
    ],
  }) + body + footer(lang, rel);
}

function hubPage(lang) {
  const rel = `${hubPath(lang)}index.html`;
  const root = rootFor(rel);
  const l = FAQ.labels[lang];
  const hub = FAQ.hub[lang];
  const paged = FAQ.categories.filter((category) => hasOwnPage(category, lang));
  const loose = hubQuestions(lang);

  /* Subjects with their own page are indexed here, not answered here: every
     question title is listed and each links to its own answer on the subject
     page. Listing the titles is what makes the hub navigable; repeating the
     answers is what the blueprint forbids. */
  const index = paged.map((category) => {
    const rows = questionsIn(category.id, lang)
      .map((q) => `<a class="post-row" href="${root}${categoryPath(category, lang)}#q-${q.id}">` +
        `<strong>${esc(q.q[lang])}</strong></a>`)
      .join("");
    return `<div class="cat-block"><h2><a href="${root}${categoryPath(category, lang)}">${esc(category.name[lang])}</a>` +
      `<span>${questionsIn(category.id, lang).length} ${esc(l.questions)}</span></h2>` +
      `<p>${esc(category.lead[lang])}</p><div class="post-list">${rows}</div></div>`;
  }).join("");

  /* Whatever the language answers but has no page for is answered here, grouped
     by subject so the reader still sees the structure. */
  const grouped = FAQ.categories
    .map((category) => [category, loose.filter(([owner]) => owner.id === category.id)])
    .filter(([, pairs]) => pairs.length)
    .map(([category, pairs]) =>
      `<div class="section-header"><div><div class="eyebrow">${esc(category.name[lang])}</div>` +
      `<h2>${esc(category.h1[lang])}</h2></div><p>${esc(category.lead[lang])}</p></div>` +
      `<div class="faq-layout"><div>${faqMarkup(pairs, lang)}</div></div>`)
    .join("");

  const alternates = Object.fromEntries(LANGS.map((code) => [code, hubPath(code)]));

  const body = `<main id="main"><header class="page-hero"><div class="container">` +
    `<div class="breadcrumbs"><a href="${root}${HOME[lang]}">MODUNERA</a> · ${esc(hub.label)}</div>` +
    `<div class="eyebrow">${esc(hub.label)}</div><h1>${esc(hub.h1)}</h1><p>${esc(hub.lead)}</p></div></header>` +
    (index ? `<section class="section"><div class="container">${index}</div></section>` : "") +
    (grouped
      ? `<section class="section${index ? " section-soft" : ""}"><div class="container">${grouped}` +
        (SELECTION_NOTE[lang] ? `<p class="legal-note">${esc(SELECTION_NOTE[lang])}</p>` : "") +
        `</div></section>`
      : "") +
    `<section class="section${grouped && !index ? " section-soft" : ""}"><div class="container"><div class="answer-box">` +
    `<strong>${esc(l.note)}</strong></div></div></section>` +
    actions(lang, root) + `</main>`;

  const schema = [breadcrumbLd([["MODUNERA", HOME[lang]], [hub.label, hubPath(lang)]])];
  if (loose.length) schema.unshift(faqLd(loose, lang, BASE + hubPath(lang)));
  if (paged.length) {
    schema.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: hub.h1,
      description: hub.lead,
      inLanguage: HTML_LANG[lang],
      url: BASE + hubPath(lang),
      hasPart: paged.map((category) => ({
        "@type": "FAQPage",
        name: category.name[lang],
        url: BASE + categoryPath(category, lang),
      })),
    });
  }

  return head({ lang, rel, title: hub.title, description: hub.lead, alternates, extraLd: schema }) +
    body + footer(lang, rel);
}

/* --- write ----------------------------------------------------------------- */

async function put(rel, content) {
  const target = join(ROOT, rel);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

const clusters = [Object.fromEntries(LANGS.map((lang) => [lang, hubPath(lang)]))];
let pages = 0;

for (const lang of LANGS) {
  await put(`${hubPath(lang)}index.html`, hubPage(lang));
  pages += 1;
}
for (const category of FAQ.categories) {
  const langs = languagesWith(category);
  for (const lang of langs) {
    await put(`${categoryPath(category, lang)}index.html`, categoryPage(category, lang));
    pages += 1;
  }
  if (langs.length > 1) {
    clusters.push(Object.fromEntries(langs.map((lang) => [lang, categoryPath(category, lang)])));
  }
}

/* build-hreflang-v7.mjs owns every alternate set on the site and strips the ones
   it did not write, so the routes are handed to it here rather than duplicated
   as a second copy of the routing rule. */
const MANIFEST = join(ROOT, "data/hreflang-clusters-generated.json");
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
manifest.generated = { ...manifest.generated, "production-faq": clusters };
manifest._comment = "Clusters contributed by generators that route their own pages. Written by build-news-v7.mjs and build-production-faq-v7.mjs, read by build-hreflang-v7.mjs.";
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const perLanguage = Object.fromEntries(LANGS.map((lang) => [lang, {
  subject_pages: FAQ.categories.filter((category) => hasOwnPage(category, lang)).length,
  answered_on_hub: hubQuestions(lang).length,
  questions: FAQ.questions.filter((q) => q.q?.[lang] && q.a?.[lang]).length,
}]));

console.log(JSON.stringify({
  questions: FAQ.questions.length,
  subjects: FAQ.categories.length,
  pages,
  clusters: clusters.length,
  per_language: perLanguage,
}));
