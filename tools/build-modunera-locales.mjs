/* ============================================================================
   MODUNERA locale layer
   ----------------------------------------------------------------------------
   German lives at the root and English under /en/. This builds the three
   remaining target-market languages — Dutch, Danish and French — each under its
   own directory with slugs the market actually uses (landen / lande / pays, not
   translations of "countries"), so the URLs read natively and match local search.

   Per locale: a home page, a countries index and five country pages, a services
   index and four service pages, and an FAQ. Every page carries hreflang for all
   five languages, so Google can pair them.

   Runs after tools/build-modunera-v2.mjs and before validation. The v2 layer's
   navigation and WhatsApp passes then run over these pages too.
   ============================================================================ */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const BASE = "https://modunera.com/";
const PHONE_DISPLAY = "+90 553 543 5342";
const PHONE_TEL = "+905535435342";
const WA = "905535435342";
const UPDATED = "2026-08-13";
const CLAIM = "Design Your Nature";

const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const canonicalFor = (file) => BASE + file.replace(/index\.html$/, "");
const rootFor = (file) => (dirname(file) === "." ? "" : "../".repeat(dirname(file).split("/").length));
const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
const eur = (n, tag) => new Intl.NumberFormat(tag).format(n) + " €";

async function put(file, content) {
  const target = join(ROOT, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

/* --- shared facts ---------------------------------------------------------- */

const SOURCES = {
  DE: "https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99012070006001",
  NL: "https://www.government.nl/themes/building-and-housing/environment-and-planning-act/the-environment-and-planning-portal",
  DK: "https://lifeindenmark.borger.dk/housing-and-moving/construction/building-permit",
  LU: "https://guichet.public.lu/en/citoyens/logement/construction-renovation-transformation/certificats-energiepass/certificat-autorisation-construire.html",
  CH: "https://www.ch.ch/en/housing/homeownership/planning-application-and-building-permit/",
};

const CODES = ["DE", "NL", "DK", "LU", "CH"];
const SERVICE_KEYS = ["modular", "steel", "bungalow", "furniture"];

/* Country copy per locale. Two sentences each: what the authority is, and what
   that means for the site. Written per language rather than translated. */
const COUNTRY_COPY = {
  nl: {
    DE: ["Bij duurzaam wonen of bedrijfsmatig gebruik wordt een tiny house in Duitsland doorgaans als bouwwerk beoordeeld. Wielen leveren geen vrijstelling op; bouwplanologie en de deelstaatbouwverordening bepalen samen wat mag.", "Vier seizoenen, regionale sneeuw- en windbelasting en verschillen per deelstaat vragen om planning per locatie."],
    NL: ["Sinds 1 januari 2024 bundelt het Omgevingsloket de regels van gemeente, provincie, waterschap en Rijk. Daar begint de controle of een vergunning of melding nodig is; het gemeentelijke omgevingsplan blijft beslissend.", "Kustwind, vocht, slagregen en zomerse zoninval maken gevel, ventilatie en verankering tot vroege planvragen."],
    DK: ["In Denemarken is voor nieuwbouw, uitbreiding en functiewijziging in beginsel een vergunning nodig. De kommune behandelt de aanvraag; kleinere bouwwerken kennen uitzonderingen maar moeten de regels blijven volgen.", "Wind, zilte kustlucht, slagregen en lange stookseizoenen vragen om robuuste buitenafwerking en betrouwbare warmteplanning."],
    LU: ["Bouwen, verbouwen of slopen vraagt in Luxemburg in beginsel de voorafgaande toestemming van de burgemeester van de gemeente. Het plan moet passen binnen de communale ontwikkelings- en bestemmingsplannen.", "Wisselvallig weer en compacte percelen maken toegang, lossen, vochtwering en gemeentelijke planning bijzonder relevant."],
    CH: ["Gebouwen en installaties mogen in Zwitserland in beginsel alleen met een vergunning worden opgericht of gewijzigd. Ook tijdelijke plaatsing kan vergunningplichtig zijn; procedures verschillen per kanton en gemeente.", "Hoogteligging, sneeuw, vorst, zomerzon en lastige aanvoerroutes vragen om een nauwkeurige technische en logistieke voorcontrole."],
  },
  da: {
    DE: ["Ved varig bolig- eller erhvervsanvendelse behandles et tiny house i Tyskland som udgangspunkt som et byggeri. Hjul giver ingen fritagelse; planlovgivning og delstatens byggelov afgør sammen, hvad der er muligt.", "Fire årstider, regionale sne- og vindlaster samt forskelle mellem delstaterne kræver planlægning per lokalitet."],
    NL: ["Siden 1. januar 2024 samler det hollandske Omgevingsloket reglerne fra kommune, provins, vandmyndighed og stat. Her kontrolleres, om der kræves tilladelse eller anmeldelse; kommunens omgevingsplan er afgørende for stedet.", "Kystvind, fugt, slagregn og sommerens solindfald gør klimaskærm, ventilation og forankring til tidlige planlægningsspørgsmål."],
    DK: ["Nye bygninger, tilbygninger og ændret anvendelse kræver i Danmark som udgangspunkt tilladelse. Kommunen behandler ansøgningen; mindre byggerier kan have undtagelser, men skal fortsat overholde gældende regler.", "Vind, saltholdig kystluft, slagregn og lange fyringssæsoner kræver robuste udvendige overflader, kontrolleret ventilation og en holdbar varmeplan."],
    LU: ["Opførelse, ombygning eller nedrivning kræver i Luxembourg som udgangspunkt forudgående tilladelse fra kommunens borgmester. Projektet skal navnlig passe til de kommunale udviklings- og bebyggelsesplaner.", "Skiftende vejr og kompakte grunde gør adgang, aflæsning, fugtsikring og kommunal planlægning særligt relevante."],
    CH: ["Bygninger og anlæg må i Schweiz som udgangspunkt kun opføres eller ændres med myndighedstilladelse. Også midlertidige projekter kan være omfattet; procedurer og undtagelser følger kanton og kommune.", "Højde, sne, frost, sommersol og krævende tilkørsel kræver en særligt grundig teknisk og logistisk forundersøgelse."],
  },
  fr: {
    DE: ["En Allemagne, une tiny house destinée à un usage résidentiel ou commercial durable est en principe traitée comme une construction. Les roues ne créent aucune dispense ; droit de l'urbanisme et code de la construction du Land s'appliquent ensemble.", "Quatre saisons, charges de neige et de vent régionales et différences entre Länder imposent une planification par site."],
    NL: ["Depuis le 1er janvier 2024, le guichet néerlandais Omgevingsloket réunit les règles de la commune, de la province, de l'autorité de l'eau et de l'État. On y vérifie si une autorisation ou une déclaration est requise ; le plan communal reste déterminant.", "Vent côtier, humidité, pluie battante et apports solaires estivaux font de l'enveloppe, de la ventilation et de l'ancrage des questions de projet précoces."],
    DK: ["Au Danemark, les constructions neuves, les extensions et les changements d'usage requièrent en principe une autorisation. La commune instruit la demande ; les petits ouvrages peuvent bénéficier d'exceptions tout en restant soumis aux règles.", "Vent, air marin salin, pluie battante et longues saisons de chauffe exigent des finitions extérieures robustes et une planification thermique fiable."],
    LU: ["Construire, transformer ou démolir requiert en principe au Luxembourg l'autorisation préalable du bourgmestre de la commune. Le projet doit notamment être conforme aux plans d'aménagement général et particulier.", "Météo changeante et parcelles compactes rendent l'accès, le déchargement, la protection contre l'humidité et la planification communale particulièrement déterminants."],
    CH: ["En Suisse, les constructions et installations ne peuvent en principe être érigées ou modifiées qu'avec une autorisation. Les projets provisoires peuvent également y être soumis ; procédures et exceptions relèvent du canton et de la commune.", "Altitude, neige, gel, ensoleillement estival et accès exigeants imposent une vérification technique et logistique particulièrement précise."],
  },
};

const SERVICE_COPY = {
  nl: {
    modular: "Uitbreidbare ruimtemodules voor wonen, hospitality, kantoor en bedrijf — projectmatig ontworpen en transporteerbaar gebouwd.",
    steel: "Draagkrachtige stalen frames en bijzondere constructies als basis voor duurzame mobiele en modulaire gebouwen.",
    bungalow: "Gelijkvloerse, comfortabele eenheden voor particulier gebruik, vakantieverhuur, glamping en resortprojecten.",
    furniture: "Keukens, inbouwkasten, bergruimte en objectmeubilair — afgestemd op ruimte, gebruik en materiaalconcept.",
  },
  da: {
    modular: "Udvidelige rummoduler til bolig, hospitality, kontor og erhverv — projekteret efter opgaven og bygget til transport.",
    steel: "Bærende stålrammer og særkonstruktioner som grundlag for holdbare mobile og modulære bygninger.",
    bungalow: "Enplans, komfortable enheder til privat brug, ferieudlejning, glamping og resortprojekter.",
    furniture: "Køkkener, indbyggede skabe, opbevaring samt hotel- og kontraktmøbler — tilpasset rum, anvendelse og materialekoncept.",
  },
  fr: {
    modular: "Modules extensibles pour le logement, l'hôtellerie, le bureau et l'activité — conçus par projet et fabriqués pour le transport.",
    steel: "Ossatures acier porteuses et constructions spéciales, base des bâtiments mobiles et modulaires durables.",
    bungalow: "Unités de plain-pied et confortables pour l'usage privé, la location saisonnière, le glamping et les projets de resort.",
    furniture: "Cuisines, aménagements intégrés, rangements et mobilier contract — ajustés à l'espace, à l'usage et au concept matériaux.",
  },
};

/* --- page shell ------------------------------------------------------------ */

const schemas = (list) => list.map((e) => `<script type="application/ld+json">${JSON.stringify(e).replaceAll("<", "\\u003c")}</script>`).join("");

function alternates(pageKey, locales, args) {
  /* Every locale that can express this page gets an hreflang line, plus the
     German root as x-default. */
  const links = [`<link rel="alternate" hreflang="de" href="${BASE}">`, `<link rel="alternate" hreflang="en" href="${BASE}en/">`];
  for (const [code, cfg] of Object.entries(locales)) {
    links.push(`<link rel="alternate" hreflang="${code}" href="${BASE}${localeUrl(code, cfg, pageKey, args)}">`);
  }
  links.push(`<link rel="alternate" hreflang="x-default" href="${BASE}">`);
  return links.join("");
}

function localeUrl(code, cfg, pageKey, args = {}) {
  if (pageKey === "home") return `${code}/`;
  if (pageKey === "countries") return `${code}/${cfg.paths.countries}/`;
  if (pageKey === "country") return `${code}/${cfg.paths.countries}/${cfg.countrySlugs[args.country]}/`;
  if (pageKey === "services") return `${code}/${cfg.paths.services}/`;
  if (pageKey === "service") return `${code}/${cfg.paths.services}/${cfg.serviceSlugs[args.service]}/`;
  if (pageKey === "faq") return `${code}/${cfg.paths.faq}/`;
  return `${code}/`;
}

function head({ file, cfg, title, description, image = "hero-forest.webp", schema = [], pageKey, args, locales }) {
  const root = rootFor(file);
  const canonical = canonicalFor(file);
  return `<!doctype html><html lang="${cfg.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="theme-color" content="#3A5A40"><link rel="canonical" href="${canonical}">${alternates(pageKey, locales, args)}<link rel="stylesheet" href="${root}assets/css/styles.css"><link rel="icon" type="image/png" href="${root}assets/brand/modunera-mark-v1.png"><meta property="og:type" content="website"><meta property="og:site_name" content="MODUNERA"><meta property="og:locale" content="${cfg.ogLocale}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${BASE}assets/images/gallery/${image}"><meta name="twitter:card" content="summary_large_image">${schemas(schema)}</head><body>`;
}

/* The navigation and WhatsApp dock are stamped over these pages by the v2 layer,
   so only a placeholder shell is emitted here. */
function chrome(root, cfg) {
  return `<a class="skip" href="#main">${esc(cfg.nav.contact)}</a><div class="scroll-progress"></div><nav class="nav" aria-label="${esc(cfg.label)}"><div class="container nav-inner"><a class="brand" href="${root}${cfg.code}/" aria-label="MODUNERA"><img src="${root}assets/brand/modunera-master-logo-mountain-v1-600.png" alt="MODUNERA"><span class="brand-claim">${CLAIM}</span></a><div class="nav-links"></div><div class="nav-actions"></div></div></nav>`;
}

function footer(root, cfg) {
  const c = cfg.paths;
  return `<section class="cta-band"><div class="container cta-inner"><div><h2>${esc(cfg.cta.title)}</h2><p>${esc(cfg.cta.text)}</p></div><a class="btn btn-light" href="${waLink(cfg.wa)}" target="_blank" rel="noopener">${esc(cfg.cta.button)}</a></div></section><footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="${root}${cfg.code}/"><img src="${root}assets/brand/modunera-master-logo-mountain-v1-600.png" alt="MODUNERA"><span class="brand-claim">${CLAIM}</span></a><p>${esc(cfg.home.intro)}</p><a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></div><div><h4>${esc(cfg.labels.countries)}</h4>${CODES.map((code) => `<a href="${root}${cfg.code}/${c.countries}/${cfg.countrySlugs[code]}/">${esc(cfg.countryNames[code])}</a>`).join("")}</div><div><h4>${esc(cfg.labels.services)}</h4>${SERVICE_KEYS.map((k) => `<a href="${root}${cfg.code}/${c.services}/${cfg.serviceSlugs[k]}/">${esc(cfg.serviceNames[k])}</a>`).join("")}</div><div><h4>MODUNERA</h4><a href="${root}${cfg.code}/${c.faq}/">${esc(cfg.labels.faq)}</a><a href="${root}kontakt/">${esc(cfg.nav.contact)}</a><a href="${root}">Deutsch</a><a href="${root}en/">English</a></div></div><div class="footer-bottom"><span>© <span data-year>2026</span> MODUNERA.</span><span>${esc(cfg.sections.legalNote)}</span></div></div></footer><script src="${root}assets/js/main.js"></script></body></html>`;
}

const faqMarkup = (items) => items.map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span>+</span></button><div class="faq-answer"><p>${esc(a)}</p></div></div>`).join("");
const faqSchema = (items) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });

/* --- pages ----------------------------------------------------------------- */

function homePage(cfg, locales, pricing) {
  const file = `${cfg.code}/index.html`;
  const root = rootFor(file);
  const p = cfg.paths;
  const entry = Math.min(...Object.values(pricing.models).map((m) => m.base_eur));
  const delivery = pricing.delivery[cfg.market];

  return (
    head({
      file, cfg, title: `${cfg.home.title} | MODUNERA`, description: cfg.home.description,
      image: "mc1-exterior.webp", pageKey: "home", locales,
      schema: [
        faqSchema(cfg.faq),
        { "@context": "https://schema.org", "@type": "Organization", name: "MODUNERA", url: BASE,
          logo: `${BASE}assets/brand/modunera-master-logo-mountain-v1-600.png`, telephone: PHONE_DISPLAY,
          areaServed: CODES },
      ],
    }) +
    chrome(root, cfg) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="eyebrow">${esc(cfg.home.kicker)}</div><h1>${esc(cfg.home.h1)}</h1><p>${esc(cfg.home.intro)}</p><div class="hero-actions"><a class="btn btn-primary" href="${waLink(cfg.wa)}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-outline" href="${root}${cfg.code}/${p.countries}/">${esc(cfg.labels.countries)} →</a></div></div></section>` +
    `<section class="section"><div class="container"><div class="kpi-row"><div class="kpi"><b>8</b><span>${esc(cfg.nav.models)}</span></div><div class="kpi"><b>${eur(entry, cfg.htmlLang)}</b><span>${esc(cfg.labels.updated)} ${UPDATED}</span></div><div class="kpi"><b>5</b><span>${esc(cfg.labels.countries)}</span></div><div class="kpi"><b>${delivery?.eur ? eur(delivery.eur, cfg.htmlLang) : "—"}</b><span>${esc(cfg.countryNames[cfg.market])}</span></div></div>` +
    `<div class="section-header"><div><div class="eyebrow">MODUNERA</div><h2>${esc(cfg.sections.whyTitle)}</h2></div><p>${esc(cfg.sections.whyIntro)}</p></div>` +
    `<div class="adv-grid">${cfg.sections.usp.map(([t, d], i) => `<div class="adv-card"><span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>` +
    `<div class="section-header" style="margin-top:34px"><div><div class="eyebrow">${esc(cfg.labels.countries)}</div><h2>${esc(cfg.labels.countries)}</h2></div></div><div class="state-grid">${CODES.map((code) => `<a class="state-card" href="${root}${cfg.code}/${p.countries}/${cfg.countrySlugs[code]}/"><span>MODUNERA</span><h3>${esc(cfg.countryNames[code])}</h3><p>${esc(COUNTRY_COPY[cfg.code][code][1].slice(0, 80))}…</p></a>`).join("")}</div>` +
    `<p class="legal-note" style="margin-top:22px">${esc(cfg.sections.legalNote)}</p></div></section>` +
    `<section class="section section-soft"><div class="container"><h2>${esc(cfg.labels.faq)}</h2><div class="faq-list">${faqMarkup(cfg.faq)}</div></div></section></main>` +
    footer(root, cfg)
  );
}

function countriesIndex(cfg, locales) {
  const file = `${cfg.code}/${cfg.paths.countries}/index.html`;
  const root = rootFor(file);
  return (
    head({ file, cfg, title: `${cfg.labels.countries} | MODUNERA`, description: cfg.home.description, image: "hero-forest.webp", pageKey: "countries", locales,
      schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: cfg.labels.countries, url: canonicalFor(file) }] }) +
    chrome(root, cfg) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="eyebrow">MODUNERA</div><h1>Tiny House ${esc(cfg.labels.countries)}</h1><p>${esc(cfg.sections.whyIntro)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="state-grid">${CODES.map((code) => `<a class="state-card" href="${root}${cfg.code}/${cfg.paths.countries}/${cfg.countrySlugs[code]}/"><span>MODUNERA</span><h3>${esc(cfg.countryNames[code])}</h3><p>${esc(COUNTRY_COPY[cfg.code][code][1].slice(0, 90))}…</p></a>`).join("")}</div><p class="legal-note" style="margin-top:22px">${esc(cfg.sections.legalNote)}</p></div></section></main>` +
    footer(root, cfg)
  );
}

function countryPage(cfg, code, locales, pricing) {
  const file = `${cfg.code}/${cfg.paths.countries}/${cfg.countrySlugs[code]}/index.html`;
  const root = rootFor(file);
  const [legal, climate] = COUNTRY_COPY[cfg.code][code];
  const name = cfg.countryNames[code];
  const delivery = pricing.delivery[code];
  const entry = Math.min(...Object.values(pricing.models).map((m) => m.base_eur));
  const faqs = [
    [`${name}: ${cfg.faq[0][0]}`, legal],
    [cfg.faq[1][0], climate],
    [cfg.faq[2][0], delivery?.eur
      ? `${eur(delivery.eur, cfg.htmlLang)} — ${eur(entry + delivery.eur, cfg.htmlLang)}.`
      : cfg.faq[2][1]],
  ];
  return (
    head({ file, cfg, title: `Tiny House ${name} | MODUNERA`, description: `Tiny House ${name}: ${legal.slice(0, 130)}`, image: "mc6-exterior.webp", pageKey: "country", args: { country: code }, locales,
      schema: [faqSchema(faqs), { "@context": "https://schema.org", "@type": "WebPage", name: `Tiny House ${name}`, url: canonicalFor(file), inLanguage: cfg.htmlLang }] }) +
    chrome(root, cfg) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">MODUNERA · ${esc(cfg.labels.countries)} · ${esc(name)}</div><div class="eyebrow">${esc(name)}</div><h1>Tiny House ${esc(name)}</h1><p>${esc(climate)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="answer-box"><strong>${esc(cfg.labels.faq)}</strong><p>${esc(legal)}</p><a class="source-link" href="${SOURCES[code]}" target="_blank" rel="noopener nofollow">${esc(cfg.labels.source)} ↗</a></div>` +
    `<div class="kpi-row"><div class="kpi"><b>${eur(entry, cfg.htmlLang)}</b><span>${esc(cfg.nav.models)}</span></div><div class="kpi"><b>${delivery?.eur ? eur(delivery.eur, cfg.htmlLang) : "—"}</b><span>${esc(name)}</span></div><div class="kpi"><b>8</b><span>${esc(cfg.nav.models)}</span></div><div class="kpi"><b>2,55 m</b><span>${esc(cfg.nav.models)}</span></div></div>` +
    `<div class="hero-actions"><a class="btn btn-primary" href="${waLink(cfg.wa.replace("__", name))}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-outline" href="${root}${cfg.code}/${cfg.paths.services}/">${esc(cfg.labels.services)} →</a></div>` +
    `<p class="legal-note" style="margin-top:20px">${esc(cfg.sections.legalNote)}</p></div></section>` +
    `<section class="section section-soft"><div class="container"><h2>${esc(cfg.labels.faq)}</h2><div class="faq-list">${faqMarkup(faqs)}</div></div></section></main>` +
    footer(root, cfg)
  );
}

/* The other-structures pages sell modules, steel, bungalows and furniture, so
   their own words never mention the core product. German and English already
   close the description by naming it; these three locales now do the same. */
const SERVICE_NOTE = {
  nl: "Tiny houses blijven ons kernproduct; aanvraag en eerste beoordeling direct via WhatsApp.",
  da: "Tiny houses er fortsat vores kerneprodukt; forespørgsel og indledende vurdering direkte via WhatsApp.",
  fr: "Les tiny houses restent notre produit principal ; demande et première évaluation directement via WhatsApp.",
};
const SERVICES_H1 = {
  nl: "Meer dan het tiny house: overige bouw.",
  da: "Mere end tiny house: andet byggeri.",
  fr: "Au-delà de la tiny house : autres constructions.",
};
const SERVICES_INTRO = {
  nl: "MODUNERA-capaciteiten naast tiny houses:",
  da: "MODUNERA-kompetencer ved siden af tiny houses:",
  fr: "Les savoir-faire MODUNERA à côté des tiny houses :",
};

function servicesIndex(cfg, locales) {
  const file = `${cfg.code}/${cfg.paths.services}/index.html`;
  const root = rootFor(file);
  return (
    head({ file, cfg, title: `${cfg.labels.services} | MODUNERA`, description: `${SERVICES_INTRO[cfg.code]} ${cfg.sections.whyIntro}`, image: "mc3-exterior.webp", pageKey: "services", locales,
      schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: cfg.labels.services, url: canonicalFor(file) }] }) +
    chrome(root, cfg) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="eyebrow">MODUNERA</div><h1>${esc(SERVICES_H1[cfg.code])}</h1><p>${esc(cfg.sections.whyIntro)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="journey-grid">${SERVICE_KEYS.map((k, i) => `<a class="journey-card" href="${root}${cfg.code}/${cfg.paths.services}/${cfg.serviceSlugs[k]}/"><div><span class="num">0${i + 1}</span><h3>${esc(cfg.serviceNames[k])}</h3><p>${esc(SERVICE_COPY[cfg.code][k])}</p></div><span class="arrow">↗</span></a>`).join("")}</div></div></section></main>` +
    footer(root, cfg)
  );
}

function servicePage(cfg, key, locales) {
  const file = `${cfg.code}/${cfg.paths.services}/${cfg.serviceSlugs[key]}/index.html`;
  const root = rootFor(file);
  const name = cfg.serviceNames[key];
  const copy = SERVICE_COPY[cfg.code][key];
  return (
    head({ file, cfg, title: `${name} | MODUNERA`, description: `${copy} ${SERVICE_NOTE[cfg.code]}`, image: "mc5-exterior.webp", pageKey: "service", args: { service: key }, locales,
      schema: [{ "@context": "https://schema.org", "@type": "Service", name, description: copy, provider: { "@type": "Organization", name: "MODUNERA" }, areaServed: CODES }] }) +
    chrome(root, cfg) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumbs">MODUNERA · ${esc(cfg.labels.services)}</div><div class="eyebrow">${esc(cfg.labels.services)}</div><h1>${esc(name)}</h1><p>${esc(copy)}</p><div class="hero-actions"><a class="btn btn-primary" href="${waLink(cfg.wa)}" target="_blank" rel="noopener">WhatsApp</a></div></div></section>` +
    `<section class="section"><div class="container"><div class="journey-grid">${SERVICE_KEYS.filter((k) => k !== key).map((k, i) => `<a class="journey-card" href="${root}${cfg.code}/${cfg.paths.services}/${cfg.serviceSlugs[k]}/"><div><span class="num">0${i + 1}</span><h3>${esc(cfg.serviceNames[k])}</h3><p>${esc(SERVICE_COPY[cfg.code][k])}</p></div><span class="arrow">↗</span></a>`).join("")}</div><p class="legal-note" style="margin-top:22px">${esc(cfg.sections.legalNote)}</p></div></section></main>` +
    footer(root, cfg)
  );
}

function faqPage(cfg, locales) {
  const file = `${cfg.code}/${cfg.paths.faq}/index.html`;
  const root = rootFor(file);
  const all = [...cfg.faq, ...CODES.map((code) => [`${cfg.countryNames[code]}`, COUNTRY_COPY[cfg.code][code][0]])];
  return (
    head({ file, cfg, title: `${cfg.labels.faq} | MODUNERA`, description: cfg.home.description, image: "interior-feature.webp", pageKey: "faq", locales, schema: [faqSchema(all)] }) +
    chrome(root, cfg) +
    `<main id="main"><section class="page-hero"><div class="container"><div class="eyebrow">MODUNERA</div><h1>Tiny House FAQ: ${esc(cfg.labels.faq)}</h1><p>${esc(cfg.sections.whyIntro)}</p></div></section>` +
    `<section class="section"><div class="container"><div class="faq-list">${faqMarkup(all)}</div><p class="legal-note" style="margin-top:22px">${esc(cfg.sections.legalNote)}</p></div></section></main>` +
    footer(root, cfg)
  );
}

/* --- main ------------------------------------------------------------------ */

async function main() {
  const { locales } = JSON.parse(await readFile(join(ROOT, "data/locales.json"), "utf8"));
  const pricing = JSON.parse(await readFile(join(ROOT, "data/pricing.json"), "utf8"));
  for (const [code, cfg] of Object.entries(locales)) cfg.code = code;

  let pages = 0;
  for (const cfg of Object.values(locales)) {
    await put(`${cfg.code}/index.html`, homePage(cfg, locales, pricing));
    await put(`${cfg.code}/${cfg.paths.countries}/index.html`, countriesIndex(cfg, locales));
    for (const code of CODES) await put(`${cfg.code}/${cfg.paths.countries}/${cfg.countrySlugs[code]}/index.html`, countryPage(cfg, code, locales, pricing));
    await put(`${cfg.code}/${cfg.paths.services}/index.html`, servicesIndex(cfg, locales));
    for (const key of SERVICE_KEYS) await put(`${cfg.code}/${cfg.paths.services}/${cfg.serviceSlugs[key]}/index.html`, servicePage(cfg, key, locales));
    await put(`${cfg.code}/${cfg.paths.faq}/index.html`, faqPage(cfg, locales));
    pages += 1 + 1 + CODES.length + 1 + SERVICE_KEYS.length + 1;
  }

  console.log(JSON.stringify({ layer: "locales", locales: Object.keys(locales), pages }));
}

await main();
