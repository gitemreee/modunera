#!/usr/bin/env node
/* Sourced local news for the five target markets.

   From STRATEGY/local-news-system.md in the V7 pack. Each item is MODUNERA's own
   analysis of a named public source; no source text is reproduced and no source
   image is used. The template the pack specifies is enforced by the page shape
   rather than left to the writer: a short summary, what happened, what it means
   for a buyer with the inference labelled as such, the limit of the statement,
   the sources, and the review dates.

   Two things the generator does that the writer cannot forget:

     - an item whose next review date has passed says so on the page, rather than
       presenting a stale check as current;
     - an item flagged as needing follow-up or carrying unverified numbers says
       that in the body, so the reader is not left to assume the figures are
       confirmed.

   Items appear twice: once in the language of their own market, once in English.
   The two are linked with hreflang; no other language claims an equivalent.

   Usage: node tools/build-news-v7.mjs
*/
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com/";
const WA = "905535435342";
const TODAY = new Date().toISOString().slice(0, 10);

const NEWS = JSON.parse(await readFile(join(ROOT, "data/news.json"), "utf8"));
const LOCALES = JSON.parse(await readFile(join(ROOT, "data/locales.json"), "utf8")).locales;

const HTML_LANG = { de: "de-DE", en: "en-GB", nl: "nl-NL", da: "da-DK", fr: "fr-FR" };
const HREFLANG = { de: "de-DE", en: "en", nl: "nl-NL", da: "da-DK", fr: "fr" };
const HOME = { de: "", en: "en/", nl: "nl/", da: "da/", fr: "fr/" };
const COUNTRY_PAGE = {
  de: { DE: "laender/deutschland/", NL: "laender/niederlande/", DK: "laender/daenemark/", LU: "laender/luxemburg/", CH: "laender/schweiz/" },
  en: { DE: "en/countries/germany/", NL: "en/countries/netherlands/", DK: "en/countries/denmark/", LU: "en/countries/luxembourg/", CH: "en/countries/switzerland/" },
  nl: { DE: "nl/landen/duitsland/", NL: "nl/landen/nederland/", DK: "nl/landen/denemarken/", LU: "nl/landen/luxemburg/", CH: "nl/landen/zwitserland/" },
  da: { DE: "da/lande/tyskland/", NL: "da/lande/holland/", DK: "da/lande/danmark/", LU: "da/lande/luxembourg/", CH: "da/lande/schweiz/" },
  fr: { DE: "fr/pays/allemagne/", NL: "fr/pays/pays-bas/", DK: "fr/pays/danemark/", LU: "fr/pays/luxembourg/", CH: "fr/pays/suisse/" },
};
const WA_MESSAGE = {
  de: "Hallo MODUNERA. Zielland/Ort: __. Nutzung: __. Personen: __. Grundstück: __. Budget: __. Bitte prüfen Sie mein Projekt.",
  en: "Hello MODUNERA. Country/place: __. Use: __. Occupants: __. Plot: __. Budget: __. Please check my project.",
  nl: "Hallo MODUNERA. Land/plaats: __. Gebruik: __. Personen: __. Perceel: __. Budget: __. Kunt u mijn project toetsen?",
  da: "Hej MODUNERA. Land/sted: __. Anvendelse: __. Personer: __. Grund: __. Budget: __. Vil I vurdere mit projekt?",
  fr: "Bonjour MODUNERA. Pays/lieu : __. Usage : __. Occupants : __. Terrain : __. Budget : __. Merci de vérifier mon projet.",
};
const NOT_A_GUARANTEE = {
  de: "Dieser Beitrag berichtet über ein benanntes Projekt an einem benannten Ort. Er sagt nichts darüber aus, was auf Ihrem Grundstück zulässig ist. Verbindlich entscheidet die für Ihren Standort zuständige Behörde — vor der Bestellung, schriftlich.",
  en: "This item reports on a named project in a named place. It says nothing about what is permitted on your plot. The authority responsible for your site decides, in writing, before you order.",
  nl: "Dit bericht gaat over een benoemd project op een benoemde plek. Het zegt niets over wat op uw perceel is toegestaan. De bevoegde instantie voor uw locatie beslist — schriftelijk, vóór u bestelt.",
  da: "Dette indlæg handler om et navngivet projekt på et navngivet sted. Det siger intet om, hvad der er tilladt på din grund. Myndigheden for din placering afgør det — skriftligt, før du bestiller.",
  fr: "Cet article porte sur un projet nommé dans un lieu nommé. Il ne dit rien de ce qui est autorisé sur votre terrain. L'autorité compétente pour votre site décide, par écrit, avant toute commande.",
};

const esc = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const rootFor = (rel) => "../".repeat(rel.split("/").length - 1);
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
const waLink = (lang) => `https://wa.me/${WA}?text=${encodeURIComponent(WA_MESSAGE[lang])}`;

const itemPath = (item, lang) => `${NEWS.hubs[lang].path}/${item.slug[lang]}/`;
const languagesFor = (item) => [item.nativeLang, "en"].filter((lang, index, all) => all.indexOf(lang) === index);

function head({ lang, rel, title, description, alternates, extraLd }) {
  const root = rootFor(rel);
  const canonical = BASE + rel.replace(/index\.html$/, "");
  const tags = Object.entries(alternates)
    .map(([code, path]) => `<link rel="alternate" hreflang="${HREFLANG[code]}" href="${BASE}${path}">`)
    .join("");
  const xDefault = alternates[Object.keys(alternates)[0]];
  return `<!DOCTYPE html><html lang="${HTML_LANG[lang]}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${esc(title)}</title><meta name="description" content="${esc(description)}">` +
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">` +
    `<link rel="canonical" href="${canonical}">${tags}` +
    `<link rel="alternate" hreflang="x-default" href="${BASE}${xDefault}">` +
    `<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">` +
    `<meta property="og:image" content="${BASE}assets/images/gallery/hero-forest.webp">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<link rel="icon" type="image/png" href="${root}assets/brand/modunera-mark-v1.png">` +
    `<link rel="stylesheet" href="${root}assets/css/styles.css">${extraLd.map(jsonLd).join("")}` +
    `</head><body><a class="skip" href="#main">Skip</a><nav class="nav"></nav>`;
}

function footer(lang, rel) {
  const root = rootFor(rel);
  return `<footer class="footer"><div class="container"><div class="footer-bottom">` +
    `<span>© <span data-year>2026</span> MODUNERA.</span>` +
    `<span><a href="${root}legal/impressum/">Impressum</a> · <a href="${root}legal/datenschutz/">Datenschutz</a></span>` +
    `</div></div></footer><script src="${root}assets/js/main.js"></script></body></html>`;
}

function itemPage(item, lang) {
  const rel = `${itemPath(item, lang)}index.html`;
  const root = rootFor(rel);
  const copy = item[lang];
  const l = NEWS.labels[lang];
  const hub = NEWS.hubs[lang];
  const status = NEWS.statusLabels[item.status][lang];
  const overdue = item.nextReviewAt < TODAY;

  const alternates = Object.fromEntries(languagesFor(item).map((code) => [code, itemPath(item, code)]));
  const sources = [[item.publisher, item.sourceUrl], item.secondaryUrl ? [item.publisher, item.secondaryUrl] : null]
    .filter(Boolean)
    .map(([name, url]) => `<li><a href="${url}" target="_blank" rel="noopener nofollow">${esc(name)} ↗</a><br><small>${esc(url)}</small></li>`)
    .join("");

  const caveats = [
    item.sourceDateNote ? { de: "Die zitierte Seite trägt kein eindeutiges Veröffentlichungsdatum. Wir geben deshalb nur das Datum unserer eigenen Prüfung an.", en: "The cited page carries no unambiguous publication date. We therefore state only the date of our own check.", nl: "De geciteerde pagina draagt geen eenduidige publicatiedatum. Wij vermelden daarom alleen de datum van onze eigen controle.", da: "Den citerede side har ingen entydig udgivelsesdato. Vi angiver derfor kun datoen for vores egen kontrol.", fr: "La page citée ne porte pas de date de publication non ambiguë. Nous n'indiquons donc que la date de notre propre vérification." }[lang] : null,
    item.needsFollowUp ? { de: "Für den aktuellen Stand fehlt uns eine amtliche Bestätigung. Der Beitrag gibt ausdrücklich den Stand der Quelle wieder.", en: "We lack an official confirmation of the current position. The item deliberately reports the source's position.", nl: "Een officiële bevestiging van de actuele stand ontbreekt. Het bericht geeft uitdrukkelijk de stand van de bron weer.", da: "Vi mangler en officiel bekræftelse af den aktuelle status. Indlægget gengiver udtrykkeligt kildens status.", fr: "Nous n'avons pas de confirmation officielle de la situation actuelle. L'article rapporte expressément la position de la source." }[lang] : null,
    item.numbersUnverified ? { de: "Zahlen und Termine aus dieser Quelle sind noch nicht verifiziert und werden hier bewusst nicht wiedergegeben.", en: "Counts and dates from this source are not yet verified and are deliberately not reproduced here.", nl: "Aantallen en data uit deze bron zijn nog niet geverifieerd en worden hier bewust niet overgenomen.", da: "Tal og datoer fra denne kilde er endnu ikke verificeret og gengives bevidst ikke her.", fr: "Les chiffres et dates de cette source ne sont pas encore vérifiés et ne sont volontairement pas repris ici." }[lang] : null,
    overdue ? l.overdue : null,
  ].filter(Boolean);

  const body = `<main id="main"><header class="page-hero"><div class="container">` +
    `<div class="breadcrumbs"><a href="${root}${HOME[lang]}">MODUNERA</a> · <a href="${root}${hub.path}/">${esc(hub.label)}</a> · ${esc(item.place)}</div>` +
    `<div class="eyebrow">${esc(item.place)} · ${esc(status)}</div>` +
    `<h1>${esc(copy.title)}</h1><p>${esc(copy.summary)}</p></div></header>` +

    `<section class="section"><div class="container article-shell"><article class="article">` +
    (caveats.length ? `<div class="notice">${caveats.map((text) => `<p>${esc(text)}</p>`).join("")}</div>` : "") +
    `<section id="what"><h2>${esc(l.what)}</h2>${copy.what.map((p) => `<p>${esc(p)}</p>`).join("")}</section>` +
    `<section id="meaning"><h2>${esc(l.meaning)}</h2><p class="legal-note">${esc(l.inference)}</p>${copy.meaning.map((p) => `<p>${esc(p)}</p>`).join("")}</section>` +
    `<section id="limit"><h2>${esc(l.limit)}</h2><p>${esc(NOT_A_GUARANTEE[lang])}</p></section>` +
    `<section id="sources"><h2>${esc(l.sources)}</h2><ul>${sources}</ul>` +
    `<p class="legal-note">${esc(l.publisher)}: ${esc(item.publisher)}` +
    (item.sourceDate ? ` · ${esc(l.published)}: ${esc(item.sourceDate)}` : "") +
    ` · ${esc(l.checked)}: ${esc(item.checkedAt)} · ${esc(l.nextReview)}: ${esc(item.nextReviewAt)} · ${esc(l.status)}: ${esc(status)}</p>` +
    `</section></article><aside class="article-aside"><div class="toc"><strong>${esc(hub.label)}</strong>` +
    `<a href="#what">${esc(l.what)}</a><a href="#meaning">${esc(l.meaning)}</a><a href="#limit">${esc(l.limit)}</a><a href="#sources">${esc(l.sources)}</a>` +
    `</div></aside></div></section>` +

    `<section class="section section-soft"><div class="container"><div class="hero-actions">` +
    `<a class="btn btn-primary" href="${waLink(lang)}" target="_blank" rel="noopener">${esc(l.cta)}</a>` +
    `<a class="btn btn-outline" href="${root}${COUNTRY_PAGE[lang][item.country]}">${esc(l.countryGuide)} →</a>` +
    `<a class="btn btn-outline" href="${item.sourceUrl}" target="_blank" rel="noopener nofollow">${esc(l.openSource)} ↗</a>` +
    `</div></div></section></main>`;

  const article = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: copy.title,
    description: copy.summary,
    inLanguage: HTML_LANG[lang],
    dateModified: item.checkedAt,
    ...(item.sourceDate && /^\d{4}-\d{2}-\d{2}$/.test(item.sourceDate) ? { datePublished: item.sourceDate } : {}),
    author: { "@type": "Organization", name: "MODUNERA" },
    publisher: { "@type": "Organization", name: "MODUNERA", logo: { "@type": "ImageObject", url: `${BASE}assets/brand/modunera-master-logo-mountain-v1-600.png` } },
    mainEntityOfPage: BASE + itemPath(item, lang),
    citation: [item.sourceUrl, item.secondaryUrl].filter(Boolean),
    contentLocation: { "@type": "Place", name: item.place },
  };

  return head({
    lang, rel, title: `${copy.title} | MODUNERA Tiny House`, description: copy.summary,
    alternates, extraLd: [article],
  }) + body + footer(lang, rel);
}

function hubPage(lang) {
  const hub = NEWS.hubs[lang];
  const rel = `${hub.path}/index.html`;
  const root = rootFor(rel);
  const l = NEWS.labels[lang];
  const items = NEWS.items.filter((item) => languagesFor(item).includes(lang));

  const cards = items.map((item) => {
    const copy = item[lang];
    const status = NEWS.statusLabels[item.status][lang];
    return `<article class="blog-card"><a href="${root}${itemPath(item, lang)}">` +
      `<div class="blog-card-body"><span class="blog-card-cat">${esc(item.place)} · ${esc(status)}</span>` +
      `<h3>${esc(copy.title)}</h3><p>${esc(copy.summary)}</p>` +
      `<span class="blog-card-more">${esc(l.checked)}: ${esc(item.checkedAt)} →</span></div></a></article>`;
  }).join("");

  const alternates = Object.fromEntries(Object.keys(NEWS.hubs)
    .filter((code) => NEWS.items.some((item) => languagesFor(item).includes(code)))
    .map((code) => [code, `${NEWS.hubs[code].path}/`]));

  const body = `<main id="main"><header class="page-hero"><div class="container">` +
    `<div class="breadcrumbs"><a href="${root}${HOME[lang]}">MODUNERA</a> · ${esc(hub.label)}</div>` +
    `<div class="eyebrow">${esc(hub.label)}</div><h1>${esc(hub.h1)}</h1><p>${esc(hub.lead)}</p></div></header>` +
    `<section class="section"><div class="container"><div class="blog-grid">${cards}</div></div></section>` +
    `<section class="section section-soft"><div class="container"><div class="answer-box">` +
    `<strong>${esc(l.limit)}</strong><p>${esc(NOT_A_GUARANTEE[lang])}</p></div></div></section></main>`;

  return head({
    lang, rel, title: hub.title, description: hub.lead, alternates,
    extraLd: [{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: hub.h1,
      description: hub.lead,
      inLanguage: HTML_LANG[lang],
      url: BASE + hub.path + "/",
      hasPart: items.map((item) => ({ "@type": "NewsArticle", headline: item[lang].title, url: BASE + itemPath(item, lang) })),
    }],
  }) + body + footer(lang, rel);
}

async function put(rel, content) {
  const target = join(ROOT, rel);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

let pages = 0;
const overdue = [];
const clusters = [];
const hubLangs = Object.keys(NEWS.hubs).filter((lang) => NEWS.items.some((item) => languagesFor(item).includes(lang)));

for (const lang of hubLangs) {
  await put(`${NEWS.hubs[lang].path}/index.html`, hubPage(lang));
  pages += 1;
}
if (hubLangs.length > 1) {
  clusters.push(Object.fromEntries(hubLangs.map((lang) => [lang, `${NEWS.hubs[lang].path}/`])));
}
for (const item of NEWS.items) {
  const langs = languagesFor(item);
  for (const lang of langs) {
    await put(`${itemPath(item, lang)}index.html`, itemPage(item, lang));
    pages += 1;
  }
  if (langs.length > 1) clusters.push(Object.fromEntries(langs.map((lang) => [lang, itemPath(item, lang)])));
  if (item.nextReviewAt < TODAY) overdue.push(item.id);
}

/* build-hreflang-v7.mjs owns every alternate set on the site and strips the ones
   it did not write, so the routes are handed to it here rather than duplicated
   as a second copy of the routing rule. */
const MANIFEST = join(ROOT, "data/hreflang-clusters-generated.json");
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
manifest.generated = { ...manifest.generated, news: clusters };
manifest._comment = "Clusters contributed by generators that route their own pages. Written by build-news-v7.mjs and build-production-faq-v7.mjs, read by build-hreflang-v7.mjs.";
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  items: NEWS.items.length,
  pages,
  hubs: hubLangs.length,
  clusters: clusters.length,
  overdue_reviews: overdue,
}));
