import { readdir, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const BASE = "https://modunera.com/";
const PHONE_DISPLAY = "+90 553 543 5342";
const PHONE_TEL = "+905535435342";
const WA = "905535435342";
const UPDATED = "2026-08-13";
const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".md", ".webmanifest"]);
const SOURCE_URLS = {
  euTrade: "https://trade.ec.europa.eu/access-to-markets/en/content/eu-turkiye-customs-union",
  euVehicle: "https://eur-lex.europa.eu/eli/reg/2018/858/oj/eng",
  euDimensions: "https://transport.ec.europa.eu/document/download/45e1073e-373a-4156-966b-0523915dec9f_en?filename=SWD_2023_70_implementation_report_amendments_dir_96_53.pdf",
  dePermit: "https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99012070006001",
  deDimensions: "https://www.gesetze-im-internet.de/stvo_2013/__22.html",
  nlPermit: "https://www.government.nl/themes/building-and-housing/environment-and-planning-act/the-environment-and-planning-portal",
  dkPermit: "https://lifeindenmark.borger.dk/housing-and-moving/construction/building-permit",
  luPermit: "https://guichet.public.lu/en/citoyens/logement/construction-renovation-transformation/certificats-energiepass/certificat-autorisation-construire.html",
  chPermit: "https://www.ch.ch/en/housing/homeownership/planning-application-and-building-permit/",
};

const COUNTRIES = {
  DE: {
    de: "Deutschland", en: "Germany", deSlug: "deutschland", enSlug: "germany", locationSlug: null,
    regionDe: "Bundesländer", regionEn: "federal states", image: "hero-forest.webp",
    climateDe: "Vier Jahreszeiten, regionale Schnee- und Windlasten sowie landesrechtliche Unterschiede verlangen eine standortbezogene Planung.",
    climateEn: "Four seasons, regional snow and wind loads, and state-level rules require site-specific planning.",
    legalDe: "Ein Tiny House wird bei einer auf Dauer angelegten Wohn- oder Gewerbenutzung regelmäßig wie ein bauliches Vorhaben behandelt. Räder allein schaffen keine Genehmigungsfreiheit; Bauplanungsrecht, Landesbauordnung, Grundstück und Nutzung sind mit der zuständigen Behörde zu prüfen.",
    legalEn: "A tiny house intended for lasting residential or commercial use is generally treated as a building project. Wheels alone do not remove planning obligations; state building law, land use, the plot and the intended use must be checked with the competent authority.",
    source: SOURCE_URLS.dePermit,
  },
  NL: {
    de: "Niederlande", en: "Netherlands", deSlug: "niederlande", enSlug: "netherlands", locationSlug: "niederlande",
    regionDe: "Provinzen", regionEn: "provinces", image: "mc1-exterior.webp",
    climateDe: "Küstenwind, Feuchte, Schlagregen und sommerlicher Sonneneintrag machen Gebäudehülle, Lüftung und Verankerung zu frühen Planungsfragen.",
    climateEn: "Coastal wind, humidity, driving rain and summer solar gain make envelope design, ventilation and anchoring early planning priorities.",
    legalDe: "Seit 1. Januar 2024 bündelt das niederländische Omgevingsloket die Regeln von Gemeinden, Provinzen, Wasserbehörden und Zentralstaat. Dort wird geprüft, ob eine Genehmigung oder Meldung erforderlich ist; der kommunale Omgevingsplan bleibt für den konkreten Standort entscheidend.",
    legalEn: "Since 1 January 2024, the Dutch Environment and Planning Portal combines rules from municipalities, provinces, water authorities and central government. It is the starting point for checking whether a permit or notification is required; the municipal environmental plan remains decisive for the site.",
    source: SOURCE_URLS.nlPermit,
  },
  DK: {
    de: "Dänemark", en: "Denmark", deSlug: "daenemark", enSlug: "denmark", locationSlug: "daenemark",
    regionDe: "Regionen", regionEn: "regions", image: "mc6-exterior.webp",
    climateDe: "Wind, salzhaltige Küstenluft, Schlagregen und lange Heizperioden erfordern robuste Außenflächen, kontrollierte Lüftung und eine belastbare Wärmeplanung.",
    climateEn: "Wind, salt-laden coastal air, driving rain and long heating seasons require robust exterior finishes, controlled ventilation and dependable thermal planning.",
    legalDe: "Für neue Gebäude, Erweiterungen und Nutzungsänderungen ist in Dänemark grundsätzlich eine Genehmigung erforderlich. Zuständig ist die Kommune am Standort; kleinere Vorhaben können Ausnahmen haben, müssen aber dennoch die geltenden Regeln einhalten.",
    legalEn: "In Denmark, new buildings, extensions and changes of use generally require permission. The municipality handles applications; smaller buildings may have exemptions but still have to meet applicable rules.",
    source: SOURCE_URLS.dkPermit,
  },
  LU: {
    de: "Luxemburg", en: "Luxembourg", deSlug: "luxemburg", enSlug: "luxembourg", locationSlug: "luxemburg",
    regionDe: "Kantone", regionEn: "cantons", image: "mc3-exterior.webp",
    climateDe: "Wechselhafte Witterung und kompakte Grundstücke machen Zufahrt, Entladung, Feuchteschutz und kommunale Planung besonders relevant.",
    climateEn: "Variable weather and compact plots make access, unloading, moisture protection and municipal planning particularly relevant.",
    legalDe: "Bau, Umbau oder Abriss eines Gebäudes benötigen in Luxemburg grundsätzlich die vorherige Genehmigung des Bürgermeisters der zuständigen Gemeinde. Das Projekt muss insbesondere zu den kommunalen Entwicklungs- und Bebauungsplänen passen.",
    legalEn: "Construction, alteration or demolition of a building in Luxembourg generally requires prior authorisation from the mayor of the municipality. The project must comply with the relevant development and building plans.",
    source: SOURCE_URLS.luPermit,
  },
  CH: {
    de: "Schweiz", en: "Switzerland", deSlug: "schweiz", enSlug: "switzerland", locationSlug: "schweiz",
    regionDe: "Kantone", regionEn: "cantons", image: "mc6-bedroom.webp",
    climateDe: "Höhenlage, Schnee, Frost, sommerliche Sonneneinstrahlung und anspruchsvolle Zufahrten verlangen eine besonders genaue technische und logistische Vorprüfung.",
    climateEn: "Altitude, snow, frost, summer solar gain and demanding access routes call for especially careful technical and logistics checks.",
    legalDe: "Gebäude und Anlagen dürfen in der Schweiz grundsätzlich nur mit behördlicher Bewilligung errichtet oder verändert werden. Auch provisorische Vorhaben können bewilligungspflichtig sein; Ausnahmen und Verfahren richten sich nach Kanton und Gemeinde.",
    legalEn: "In Switzerland, buildings and installations generally require an official permit before they are erected or altered. Even provisional projects may require approval; exemptions and procedures are set by cantonal and communal law.",
    source: SOURCE_URLS.chPermit,
  },
};

const DE_REGIONS = [
  ["Baden-Württemberg", "baden-wuerttemberg"], ["Bayern", "bayern"], ["Berlin", "berlin"],
  ["Brandenburg", "brandenburg"], ["Bremen", "bremen"], ["Hamburg", "hamburg"], ["Hessen", "hessen"],
  ["Mecklenburg-Vorpommern", "mecklenburg-vorpommern"], ["Niedersachsen", "niedersachsen"],
  ["Nordrhein-Westfalen", "nordrhein-westfalen"], ["Rheinland-Pfalz", "rheinland-pfalz"],
  ["Saarland", "saarland"], ["Sachsen", "sachsen"], ["Sachsen-Anhalt", "sachsen-anhalt"],
  ["Schleswig-Holstein", "schleswig-holstein"], ["Thüringen", "thueringen"],
];

const REGION_NAMES = {
  NL: { "01": "Drenthe", "16": "Flevoland", "02": "Friesland", "03": "Gelderland", "04": "Groningen", "05": "Limburg", "06": "Noord-Brabant", "07": "Noord-Holland", "15": "Overijssel", "09": "Utrecht", "10": "Zeeland", "11": "Zuid-Holland" },
  DK: { "17": "Hovedstaden", "18": "Midtjylland", "19": "Nordjylland", "20": "Sjælland", "21": "Syddanmark" },
  CH: { ZH: "Zürich", LU: "Luzern", SG: "St. Gallen", GR: "Graubünden", GE: "Genève", VS: "Valais / Wallis", BS: "Basel-Stadt" },
};

const SERVICE_PAGES = [
  { slug: "modulbau", enSlug: "modular-buildings", de: "Modulbau & Modulhäuser", en: "Modular buildings", image: "mc3-exterior.webp", deIntro: "Erweiterbare Raummodule für Wohnen, Hospitality, Büro und Gewerbe – für jedes Projekt geplant und transportfähig gefertigt.", enIntro: "Expandable modules for residential, hospitality, office and commercial use, engineered for the project and manufactured for transport." },
  { slug: "stahlbau", enSlug: "steel-structures", de: "Stahlbau & Stahlkonstruktionen", en: "Steel structures", image: "mc5-exterior.webp", deIntro: "Tragfähige Stahlrahmen und Sonderkonstruktionen als Basis für langlebige mobile und modulare Gebäude.", enIntro: "Load-bearing steel frames and bespoke structures for durable mobile and modular buildings." },
  { slug: "bungalows", enSlug: "bungalows", de: "Bungalows & Ferienhäuser", en: "Bungalows & holiday homes", image: "nature-pool.webp", deIntro: "Ebenerdige, komfortable Einheiten für private Nutzung, Ferienvermietung, Glamping und Resortprojekte.", enIntro: "Single-level, comfortable units for private use, holiday rental, glamping and resort projects." },
  { slug: "containerbau", enSlug: "containers", de: "Containerbau & Raumcontainer", en: "Container construction", image: "mc5-exterior.webp", deIntro: "Wohn-, Büro-, Sanitär- und Lagercontainer, als Einheit gefertigt statt aus einem Seecontainer umgebaut – auch als Leercontainer ohne Innenausbau.", enIntro: "Living, office, sanitary and storage containers, built as a unit rather than converted from a shipping container, and available as an empty shell." },
  { slug: "moebel-nach-mass", enSlug: "bespoke-furniture", de: "Möbel nach Maß", en: "Bespoke furniture", image: "mc7-interior.webp", deIntro: "Küchen, Einbaumöbel, Stauraum, Hotel- und Objektmöbel – auf Raum, Nutzung und Materialkonzept abgestimmt.", enIntro: "Kitchens, built-ins, storage, hospitality and contract furniture tailored to space, use and material concept." },
];

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
// German umlauts were handled, the Nordic letters were not: NFKD does not
// decompose æ, ø or å, so Sjælland became "sj-lland" and every Danish place
// with one of them lost a character from its URL.
const slugify = (value) => String(value).replaceAll("ß", "ss").replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("Ä", "Ae").replaceAll("Ö", "Oe").replaceAll("Ü", "Ue").replaceAll("æ", "ae").replaceAll("Æ", "Ae").replaceAll("ø", "oe").replaceAll("Ø", "Oe").replaceAll("å", "aa").replaceAll("Å", "Aa").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ort";
const canonicalFor = (file) => BASE + file.replace(/index\.html$/, "");
const rootFor = (file) => dirname(file) === "." ? "" : "../".repeat(dirname(file).split("/").length);
const waLink = (message) => `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;

async function put(file, content) {
  const target = join(ROOT, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

function schemas(value) {
  return value.map((entry) => `<script type="application/ld+json">${JSON.stringify(entry).replaceAll("<", "\\u003c")}</script>`).join("");
}

function head({ file, lang, title, description, image = "hero-forest.webp", alternateDe, alternateEn, schema = [] }) {
  const root = rootFor(file);
  const canonical = canonicalFor(file);
  const locale = lang === "de" ? "de_DE" : "en_GB";
  return `<!doctype html><html lang="${lang === "de" ? "de-DE" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="theme-color" content="#3A5A40"><link rel="canonical" href="${canonical}">${alternateDe ? `<link rel="alternate" hreflang="de" href="${alternateDe}">` : ""}${alternateEn ? `<link rel="alternate" hreflang="en" href="${alternateEn}">` : ""}${alternateDe ? `<link rel="alternate" hreflang="x-default" href="${alternateDe}">` : ""}<link rel="stylesheet" href="${root}assets/css/styles.css"><link rel="icon" type="image/png" href="${root}assets/images/modunera-mark.png"><meta property="og:type" content="website"><meta property="og:site_name" content="MODUNERA"><meta property="og:locale" content="${locale}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${BASE}assets/images/gallery/${image}"><meta name="twitter:card" content="summary_large_image">${schemas(schema)}</head><body>`;
}

function nav(root, lang) {
  if (lang === "en") return `<a class="skip" href="#main">Skip to content</a><div class="scroll-progress"></div><nav class="nav" aria-label="Main navigation"><div class="container nav-inner"><a class="brand" href="${root}en/"><img src="${root}assets/brand/modunera-master-logo-mountain-v1-600.png" alt="MODUNERA"></a><div class="nav-links"><a href="${root}en/#models">Tiny houses</a><a href="${root}en/countries/">Countries</a><a href="${root}en/services/">Other structures</a><a href="${root}en/guides/">Guides</a><a href="${root}en/faq/">FAQ</a><a href="${root}kontakt/">Contact</a></div><div class="nav-actions"><a class="lang-switch" href="${root}">DE · EN</a><a class="btn btn-primary" href="${waLink("Hello MODUNERA, I would like a quick project assessment for a tiny house.")}" target="_blank" rel="noopener">WhatsApp</a><button class="mobile-toggle" aria-label="Open menu">☰</button></div></div></nav>`;
  return `<a class="skip" href="#main">Zum Inhalt springen</a><div class="scroll-progress"></div><nav class="nav" aria-label="Hauptnavigation"><div class="container nav-inner"><a class="brand" href="${root}index.html"><img src="${root}assets/brand/modunera-master-logo-mountain-v1-600.png" alt="MODUNERA"></a><div class="nav-links"><a href="${root}index.html#modelle">Tiny Houses</a><a href="${root}laender/">Länder</a><a href="${root}leistungen/">Weitere Bauten</a><a href="${root}blog/europa/">Ratgeber</a><a href="${root}faq/europa/">FAQ</a><a href="${root}kontakt/">Kontakt</a></div><div class="nav-actions"><a class="lang-switch" href="${root}en/">DE · EN</a><a class="btn btn-primary" href="${waLink("Hallo MODUNERA, ich wünsche eine schnelle Ersteinschätzung für mein Tiny-House-Projekt.")}" target="_blank" rel="noopener">WhatsApp</a><button class="mobile-toggle" aria-label="Menü öffnen">☰</button></div></div></nav>`;
}

function footer(root, lang) {
  const isDe = lang === "de";
  return `<section class="cta-band"><div class="container cta-inner"><div><h2>${isDe ? "Projekt in 2 Minuten starten." : "Start your project in two minutes."}</h2><p>${isDe ? "Zielland, Nutzung und Wunschmodell per WhatsApp senden – wir strukturieren den nächsten Schritt." : "Send your country, intended use and preferred model via WhatsApp and we will structure the next step."}</p></div><a class="btn btn-light" href="${waLink(isDe ? "Hallo MODUNERA, mein Zielland ist: __. Nutzung: __. Wunschgröße/Modell: __. Bitte kontaktieren Sie mich." : "Hello MODUNERA. Destination country: __. Intended use: __. Preferred size/model: __. Please contact me.")}" target="_blank" rel="noopener">${isDe ? "WhatsApp-Anfrage →" : "WhatsApp enquiry →"}</a></div></section><footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="${root}${isDe ? "index.html" : "en/"}"><img src="${root}assets/brand/modunera-master-logo-mountain-v1-600.png" alt="MODUNERA"></a><p>${isDe ? "Tiny Houses als Kernprodukt. Dazu Modulbau, Stahlbau, Containerbau, Bungalows und maßgefertigte Möbel – direkt aus eigener Produktion für Europa." : "Tiny houses are our core product, complemented by modular buildings, steel structures, bungalows and bespoke furniture for Europe."}</p><a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></div><div><h4>${isDe ? "Länder" : "Countries"}</h4><a href="${root}${isDe ? "laender/deutschland/" : "en/countries/germany/"}">${isDe ? "Deutschland" : "Germany"}</a><a href="${root}${isDe ? "laender/niederlande/" : "en/countries/netherlands/"}">${isDe ? "Niederlande" : "Netherlands"}</a><a href="${root}${isDe ? "laender/daenemark/" : "en/countries/denmark/"}">${isDe ? "Dänemark" : "Denmark"}</a><a href="${root}${isDe ? "laender/luxemburg/" : "en/countries/luxembourg/"}">Luxembourg</a><a href="${root}${isDe ? "laender/schweiz/" : "en/countries/switzerland/"}">${isDe ? "Schweiz" : "Switzerland"}</a></div><div><h4>${isDe ? "Leistungen" : "Services"}</h4><a href="${root}${isDe ? "index.html#modelle" : "en/#models"}">Tiny Houses</a><a href="${root}${isDe ? "leistungen/modulbau/" : "en/services/modular-buildings/"}">${isDe ? "Modulbau" : "Modular buildings"}</a><a href="${root}${isDe ? "leistungen/stahlbau/" : "en/services/steel-structures/"}">${isDe ? "Stahlbau" : "Steel structures"}</a><a href="${root}${isDe ? "leistungen/bungalows/" : "en/services/bungalows/"}">Bungalows</a><a href="${root}${isDe ? "leistungen/moebel-nach-mass/" : "en/services/bespoke-furniture/"}">${isDe ? "Möbel nach Maß" : "Bespoke furniture"}</a></div><div><h4>${isDe ? "Planung" : "Planning"}</h4><a href="${root}studio/">Design Studio</a><a href="${root}tools/#delivery">${isDe ? "Lieferkosten" : "Delivery estimate"}</a><a href="${root}${isDe ? "blog/europa/" : "en/guides/"}">${isDe ? "Recht & Logistik" : "Rules & logistics"}</a><a href="${root}${isDe ? "faq/europa/" : "en/faq/"}">FAQ</a></div></div><div class="footer-bottom"><span>© <span data-year>2026</span> MODUNERA. ${isDe ? "Alle Rechte vorbehalten." : "All rights reserved."}</span><span>${isDe ? "Hinweise ersetzen keine Behörden-, Rechts-, Steuer- oder Statikberatung." : "Guidance does not replace authority, legal, tax or structural advice."}</span></div></div></footer><div class="floating-actions"><a href="${waLink(isDe ? "Hallo MODUNERA, ich interessiere mich für ein Tiny House. Bitte kontaktieren Sie mich." : "Hello MODUNERA, I am interested in a tiny house. Please contact me.")}" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a><a href="tel:${PHONE_TEL}" aria-label="${isDe ? "Telefon" : "Phone"}">☎</a></div><script src="${root}assets/js/main.js"></script></body></html>`;
}

function faqMarkup(items) {
  return items.map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span>+</span></button><div class="faq-answer"><p>${esc(a)}</p></div></div>`).join("");
}

function faqSchema(items) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
}

function regionDisplay(code, region) {
  return REGION_NAMES[code]?.[region.code] || region.name.replace(/^Canton of /, "Kanton ");
}

function distance(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function buildLocations(source) {
  const markets = {};
  for (const code of ["NL", "DK", "LU", "CH"]) {
    const country = COUNTRIES[code];
    const regions = source[code].states.map((raw) => ({ ...raw, display: regionDisplay(code, raw), slug: slugify(regionDisplay(code, raw)), cities: [] }));
    const regionByCode = new Map(regions.map((region) => [region.code, region]));
    const seen = new Map();
    for (const raw of source[code].cities) {
      const region = regionByCode.get(raw.state);
      if (!region) continue;
      const baseSlug = slugify(raw.name);
      const key = `${region.code}/${baseSlug}`;
      const count = (seen.get(key) || 0) + 1;
      seen.set(key, count);
      const slug = count === 1 ? baseSlug : `${baseSlug}-${count}`;
      region.cities.push({ name: raw.name, lat: Number(raw.lat), lon: Number(raw.lon), slug, region, country, code });
    }
    for (const region of regions) {
      region.cities.sort((a, b) => a.name.localeCompare(b.name, code === "DK" ? "da" : code === "NL" ? "nl" : code === "CH" ? "de-CH" : "de"));
      for (const city of region.cities) city.nearby = region.cities.filter((candidate) => candidate !== city).map((candidate) => [distance(city, candidate), candidate]).sort((a, b) => a[0] - b[0]).slice(0, 6).map((pair) => pair[1]);
    }
    markets[code] = { country, regions, count: regions.reduce((sum, region) => sum + region.cities.length, 0) };
  }
  return markets;
}

function locationPaths(city) {
  const de = `standorte/${city.country.locationSlug}/${city.region.slug}/${city.slug}/index.html`;
  const en = `en/locations/${city.country.enSlug}/${city.region.slug}/${city.slug}/index.html`;
  return { de, en };
}

function climateProfile(city, lang) {
  if (city.code === "CH") return lang === "de" ? "Für das Grundstück sind Höhenlage, Schneelast, Frost, sommerlicher Wärmeschutz und die letzte Zufahrt getrennt zu prüfen." : "Altitude, snow load, frost, summer heat protection and final-site access should be checked separately for the plot.";
  if (city.code === "NL" || city.code === "DK") return lang === "de" ? "Wind, Feuchte und Schlagregen sprechen für robuste Anschlussdetails, kontrollierte Lüftung und korrosionsgeschützte Außenbauteile." : "Wind, humidity and driving rain call for robust junction details, controlled ventilation and corrosion-protected exterior components.";
  return lang === "de" ? "Dämmung, Feuchteführung, sommerlicher Wärmeschutz und eine verlässliche Zufahrt bilden die technische Basis der Vorprüfung." : "Insulation, moisture control, summer heat protection and reliable access form the technical basis of the preliminary assessment.";
}

function locationFaqs(city, lang) {
  const place = city.name;
  const country = city.country[lang === "de" ? "de" : "en"];
  if (lang === "de") return [
    [`Kann MODUNERA ein Tiny House nach ${place} liefern?`, `Eine Lieferung nach ${place} wird nach Modell, Abmessungen, Gewicht, Route, letzter Zufahrt und Entladepunkt geprüft. Erst die Transportfreigabe macht Termin und Kosten belastbar.`],
    [`Brauche ich in ${place} eine Genehmigung?`, `Räder oder ein Fahrgestell bedeuten nicht automatisch Genehmigungsfreiheit. Nutzung, Dauer, Grundstück und die Regeln der zuständigen Stelle in ${country} müssen vor Bestellung geprüft werden.`],
    [`Welche Transportart eignet sich für ${place}?`, "Je nach Modell kommen zugelassene Überführung auf eigener Achse, Tieflader beziehungsweise Sondertransport oder eine kombinierte Route mit Fähr- beziehungsweise Ro-Ro-Abschnitt in Betracht."],
    [`Ist ein MODUNERA Tiny House für ${place} winterfest?`, `Die Ausstattung kann für vier Jahreszeiten geplant werden. Die konkrete Auslegung von Dämmung, Verglasung, Lüftung, Heizung und Frostschutz richtet sich nach Grundstück und Nutzung in ${place}.`],
    [`Sind individuelle Möbel möglich?`, "Ja. Küchen, Treppen, Stauraum, Einbauten und lose Möbel können im Rahmen von Gewicht, Technik und Grundriss maßgefertigt werden."],
    [`Wie starte ich ein Projekt in ${place}?`, "Senden Sie Zielland, Ort, gewünschte Nutzung, Personenzahl und ein Budgetfenster per WhatsApp. Danach werden Modell, Standort, Dokumente und Transport strukturiert vorgeprüft."],
  ];
  return [
    [`Can MODUNERA deliver a tiny house to ${place}?`, `Delivery to ${place} is assessed against model, dimensions, weight, route, final access and unloading point. Timing and cost become reliable only after logistics approval.`],
    [`Do I need a permit in ${place}?`, `Wheels or a trailer do not automatically remove planning requirements. Intended use, duration, plot and the rules of the competent authority in ${country} must be checked before ordering.`],
    [`Which transport method is suitable for ${place}?`, "Depending on the model, delivery may use an approved road-going trailer, a low-loader or special transport, or a combined route with a ferry or Ro-Ro leg."],
    [`Can a MODUNERA tiny house be specified for year-round use in ${place}?`, `Yes, subject to project design. Insulation, glazing, ventilation, heating and frost protection must be specified for the plot and intended use in ${place}.`],
    ["Is bespoke furniture available?", "Yes. Kitchens, stairs, storage, fitted units and loose furniture can be made to measure within the project's weight, services and layout limits."],
    [`How do I start a project in ${place}?`, "Send the destination, intended use, number of occupants and budget range by WhatsApp. We then structure the model, site, documentation and logistics pre-check."],
  ];
}

function locationPage(city, lang) {
  const paths = locationPaths(city);
  const file = paths[lang];
  const root = rootFor(file);
  const isDe = lang === "de";
  const place = city.name;
  const region = city.region.display;
  const country = city.country[isDe ? "de" : "en"];
  const faq = locationFaqs(city, lang);
  const title = isDe ? `Tiny House in ${place}, ${country} | Lieferung & Planung | MODUNERA` : `Tiny house in ${place}, ${country} | Delivery & planning | MODUNERA`;
  const description = isDe ? `Tiny House für ${place}: Modelle, individuelle Möbel, Genehmigungsorientierung und Lieferung nach ${region}, ${country}. Projektcheck per WhatsApp.` : `Tiny houses for ${place}: models, bespoke furniture, permit guidance and delivery to ${region}, ${country}. Start with a WhatsApp project check.`;
  const deUrl = canonicalFor(paths.de);
  const enUrl = canonicalFor(paths.en);
  const schema = [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, url: canonicalFor(file), description, dateModified: UPDATED, contentLocation: { "@type": "Place", name: `${place}, ${region}, ${country}`, geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon } }, about: { "@type": "Product", name: `${isDe ? "Tiny House für" : "Tiny house for"} ${place}`, brand: { "@type": "Brand", name: "MODUNERA" } } },
    faqSchema(faq),
  ];
  const nearby = city.nearby.map((item) => { const target = locationPaths(item)[lang]; return `<a class="place-link" href="${root}${target.replace(/index\.html$/, "")}"><strong>${esc(item.name)}</strong><span>${esc(item.region.display)}</span></a>`; }).join("");
  const message = isDe ? `Hallo MODUNERA, ich plane ein Tiny House in ${place}, ${region}, ${country}. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung.` : `Hello MODUNERA, I am planning a tiny house in ${place}, ${region}, ${country}. Use: __. Occupants: __. Budget: __. Please send an initial assessment.`;
  return head({ file, lang, title, description, image: city.country.image, alternateDe: deUrl, alternateEn: enUrl, schema }) + nav(root, lang) + `<main id="main"><header class="location-hero"><img src="${root}assets/images/gallery/${city.country.image}" alt="${esc(title)}"><div class="location-hero-overlay"></div><div class="container location-hero-content"><div class="breadcrumbs"><a href="${root}${isDe ? "index.html" : "en/"}">${isDe ? "Startseite" : "Home"}</a> · <a href="${root}${isDe ? `laender/${city.country.deSlug}/` : `en/countries/${city.country.enSlug}/`}">${esc(country)}</a> · ${esc(region)} · ${esc(place)}</div><span class="hero-kicker">MODUNERA · ${esc(region)}</span><h1>${isDe ? `Tiny House in ${esc(place)} kaufen` : `Tiny house in ${esc(place)}`}</h1><p>${isDe ? "Direkt aus eigener Produktion, individuell konfigurierbar und für Lieferung, Grundstück und lokale Anforderungen strukturiert vorgeprüft." : "Direct from our own production, individually configurable and structured for preliminary delivery, site and local-requirement checks."}</p><div class="hero-actions"><a class="btn btn-primary" href="${waLink(message)}" target="_blank" rel="noopener">${isDe ? "WhatsApp-Projektcheck" : "WhatsApp project check"}</a><a class="btn btn-light" href="${root}studio/">${isDe ? "Modell konfigurieren" : "Configure a model"}</a></div></div></header><section class="section section-tight"><div class="container"><div class="data-strip"><div><span>${isDe ? "Land" : "Country"}</span><strong>${esc(country)}</strong></div><div><span>${isDe ? "Region" : "Region"}</span><strong>${esc(region)}</strong></div><div><span>${isDe ? "Kernprodukt" : "Core product"}</span><strong>Tiny House</strong></div><div><span>${isDe ? "Kontakt" : "Contact"}</span><strong>WhatsApp · ${PHONE_DISPLAY}</strong></div></div><div class="answer-box"><strong>${isDe ? "Direkte Antwort" : "Direct answer"}</strong><p>${isDe ? `MODUNERA plant Tiny-House-Projekte für ${place} mit acht Ausgangsmodellen, maßgefertigtem Innenausbau und einer Transportprüfung für den Einzelfall. Eine lokale Genehmigung oder konkrete Lieferbarkeit wird erst nach Grundstücks- und Dokumentenprüfung bestätigt.` : `MODUNERA plans tiny-house projects for ${place} using eight base models, bespoke interiors and logistics checked per project checks. Local permission or final deliverability is confirmed only after plot and document review.`}</p></div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "Standortprofil" : "Location profile"}</div><h2>${isDe ? `Für ${esc(place)} geplant, nach eigener Spezifikation gebaut.` : `Planned for ${esc(place)}, built to our own specification.`}</h2></div><p>${esc(climateProfile(city, lang))}</p></div><div class="benefit-grid"><div class="benefit"><span class="benefit-number">01</span><h3>${isDe ? "Tiny House zuerst" : "Tiny house first"}</h3><p>${isDe ? "Acht Modelle bilden den Kern. Länge, Grundriss, Fassade und Technik werden nach Nutzung gewählt." : "Eight models form the core. Length, layout, facade and services are selected for the intended use."}</p></div><div class="benefit"><span class="benefit-number">02</span><h3>${isDe ? "Möbel nach Maß" : "Bespoke furniture"}</h3><p>${isDe ? "Küche, Stauraum, Treppe und Einbauten entstehen passend zu Bewegungsflächen und Gewicht." : "Kitchen, storage, stairs and built-ins are designed around circulation space and weight."}</p></div><div class="benefit"><span class="benefit-number">03</span><h3>${isDe ? "Dokumentencheck" : "Document check"}</h3><p>${isDe ? "Technische Unterlagen werden mit den Anforderungen des Zielprojekts abgeglichen." : "Technical documentation is aligned with the destination project's requirements."}</p></div><div class="benefit"><span class="benefit-number">04</span><h3>${isDe ? "Transportplanung" : "Delivery planning"}</h3><p>${isDe ? "Route, Abmessungen, Gewicht, Zufahrt und Entladung werden als ein Prozess betrachtet." : "Route, dimensions, weight, access and unloading are treated as one process."}</p></div></div></div></section><section class="section section-dark"><div class="container wide-feature"><div class="visual"><img src="${root}assets/images/gallery/mc1-living.webp" alt="MODUNERA ${isDe ? "Innenraum" : "interior"}" loading="lazy"></div><div class="wide-copy"><div class="eyebrow">${isDe ? "Genehmigung & Nutzung" : "Permission & use"}</div><h2>${isDe ? "Mobil heißt nicht automatisch genehmigungsfrei." : "Mobile does not automatically mean permit-free."}</h2><p>${esc(isDe ? city.country.legalDe : city.country.legalEn)}</p><a class="btn btn-sand" href="${city.country.source}" target="_blank" rel="noopener">${isDe ? "Amtliche Ausgangsquelle ↗" : "Official starting source ↗"}</a><p class="legal-note light">${isDe ? `Stand: ${UPDATED}. Allgemeine Orientierung, keine Rechts- oder Behördenberatung.` : `Reviewed ${UPDATED}. General guidance only; not legal or authority advice.`}</p></div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "Logistik" : "Logistics"}</div><h2>${isDe ? `Drei mögliche Wege nach ${esc(place)}.` : `Three possible routes to ${esc(place)}.`}</h2></div><p>${isDe ? "Die Transportform wird erst nach technischen Daten und Route festgelegt." : "The transport method is selected only after technical data and route checks."}</p></div><div class="process-grid"><div><span>01</span><h3>${isDe ? "Eigene Achse" : "Road-going trailer"}</h3><p>${isDe ? "Nur bei passender Zulassung, Versicherung, Abmessung, Gewicht und Fahrerlaubnis." : "Only with suitable approval, insurance, dimensions, weight and driving entitlement."}</p></div><div><span>02</span><h3>${isDe ? "Tieflader" : "Low-loader"}</h3><p>${isDe ? "Für nicht straßenzugelassene oder abmessungsbedingt besondere Einheiten." : "For units that are not road-approved or require special handling due to dimensions."}</p></div><div><span>03</span><h3>Ro-Ro / Ferry</h3><p>${isDe ? "Als Teil einer kombinierten Route; Hafen, Fahrplan und Nachlauf werden für jedes Projekt einzeln kalkuliert." : "As one leg of a combined route; port, schedule and onward road delivery are quoted per project."}</p></div><div><span>04</span><h3>${isDe ? "Entladung" : "Unloading"}</h3><p>${isDe ? "Letzte Zufahrt, Rangierfläche, Kranbedarf, Untergrund und Anschlüsse prüfen." : "Check final access, manoeuvring space, crane need, ground and utility connections."}</p></div></div></div></section><section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">FAQ · ${esc(place)}</div><h2>${isDe ? "Fragen vor dem Angebot." : "Questions before quotation."}</h2></div><p>${isDe ? "Konkrete Antworten entstehen aus Standort, Nutzung und technischer Konfiguration." : "Specific answers come from the site, intended use and technical specification."}</p></div><div class="faq-list">${faqMarkup(faq)}</div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "In der Nähe" : "Nearby"}</div><h2>${isDe ? "Weitere regionale Seiten" : "More regional pages"}</h2></div></div><div class="places-list">${nearby}</div></div></section></main>` + footer(root, lang);
}

function regionPage(market, region, lang) {
  const isDe = lang === "de";
  const file = isDe ? `standorte/${market.country.locationSlug}/${region.slug}/index.html` : `en/locations/${market.country.enSlug}/${region.slug}/index.html`;
  const counterpart = isDe ? `en/locations/${market.country.enSlug}/${region.slug}/index.html` : `standorte/${market.country.locationSlug}/${region.slug}/index.html`;
  const root = rootFor(file);
  const country = market.country[isDe ? "de" : "en"];
  const title = isDe ? `Tiny Houses in ${region.display}, ${country} | MODUNERA` : `Tiny houses in ${region.display}, ${country} | MODUNERA`;
  const description = isDe ? `${region.cities.length} lokale Seiten für Tiny-House-Projekte in ${region.display}: Modelle, Genehmigungsorientierung, Transport und WhatsApp-Projektcheck.` : `${region.cities.length} local pages for tiny-house projects in ${region.display}: models, permission guidance, logistics and WhatsApp project check.`;
  const cards = region.cities.map((city) => `<a href="${city.slug}/"><strong>${esc(city.name)}</strong><span>${isDe ? "Projektseite öffnen" : "Open project page"}</span></a>`).join("");
  return head({ file, lang, title, description, image: market.country.image, alternateDe: canonicalFor(isDe ? file : counterpart), alternateEn: canonicalFor(isDe ? counterpart : file), schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: canonicalFor(file), description, dateModified: UPDATED }] }) + nav(root, lang) + `<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="${root}${isDe ? `laender/${market.country.deSlug}/` : `en/countries/${market.country.enSlug}/`}">${esc(country)}</a> · ${esc(region.display)}</div><div class="eyebrow">${region.cities.length} ${isDe ? "Orte und Gemeinden" : "cities and municipalities"}</div><h1>${isDe ? `Tiny Houses in ${esc(region.display)}` : `Tiny houses in ${esc(region.display)}`}</h1><p>${isDe ? "Wählen Sie einen Ort für lokale Planungs-, Klima-, Genehmigungs- und Lieferinformationen. Jede Seite führt direkt zum WhatsApp-Projektcheck." : "Choose a place for local planning, climate, permission and delivery guidance. Every page leads directly to the WhatsApp project check."}</p></div></header><section class="section"><div class="container"><div class="answer-box"><strong>${isDe ? "Wichtig" : "Important"}</strong><p>${isDe ? "Lokale Seiten sind eine strukturierte Erstorientierung. Verbindliche Genehmigung, Statik, Transportfähigkeit und Kosten entstehen erst durch die Prüfung des konkreten Projekts." : "Local pages provide structured initial guidance. Permission, structural design, transport feasibility and cost become binding only after review of the actual project."}</p></div><div class="state-place-grid">${cards}</div></div></section></main>` + footer(root, lang);
}

function countryFaqs(country, lang) {
  if (lang === "de") return [
    [`Liefert MODUNERA Tiny Houses nach ${country.de}?`, `Ja, Lieferungen nach ${country.de} werden für das einzelne Projekt angeboten. Modell, Abmessungen, Gewicht, Route, Zollstatus, letzte Zufahrt und Entladung müssen vorab freigegeben werden.`],
    [`Brauche ich in ${country.de} eine Genehmigung?`, country.legalDe],
    ["Kann das Haus mit eigenem Kennzeichen überführt werden?", "Nur wenn Fahrgestell beziehungsweise Anhänger, Dokumente, Versicherung, Abmessungen und Gewichte für die gesamte Route passen. Andernfalls wird auf Tieflader oder Sondertransport geplant."],
    ["Ist Ro-Ro-Transport möglich?", "Ein Ro-Ro- oder Fährabschnitt kann Teil der Route sein. Verfügbarkeit, Hafenwahl, Fahrplan, Hafenhandling und Straßen-Nachlauf werden erst für das konkrete Modell und Ziel bestätigt."],
    ["Was ist beim Import aus Türkiye zu beachten?", "Für EU-Ziele können je nach Einreihung und Zollstatus Regeln der EU–Türkiye-Zollunion und ein A.TR-Nachweis relevant sein. Einfuhrumsatzsteuer, Produktanforderungen und nationale Zulassung bleiben gesondert zu prüfen; für die Schweiz gilt ein separates Zollverfahren."],
    ["Sind individuelle Grundrisse und Möbel möglich?", "Ja. Tiny Houses sind das Kernprodukt; Küche, Bad, Treppe, Stauraum und Objektmöbel werden im Rahmen von Statik, Gewicht, Haustechnik und Transport maßgefertigt."],
    ["Wie schnell erhalte ich eine Rückmeldung?", "Die schnellste Erstaufnahme erfolgt per WhatsApp. Vollständige Angaben zu Ort, Nutzung, Personen, Wunschgröße und Budget verkürzen die Vorprüfung."],
  ];
  return [
    [`Does MODUNERA deliver tiny houses to ${country.en}?`, `Yes, deliveries to ${country.en} are offered on a project basis. Model, dimensions, weight, route, customs status, final access and unloading must be approved first.`],
    [`Do I need a permit in ${country.en}?`, country.legalEn],
    ["Can the house travel on its own registration plate?", "Only if the trailer, documents, insurance, dimensions and weights comply along the full route. Otherwise delivery is planned on a low-loader or as special transport."],
    ["Is Ro-Ro transport possible?", "A Ro-Ro or ferry leg may form part of the route. Availability, port, schedule, handling and onward road delivery are confirmed only for the actual model and destination."],
    ["What should I know about importing from Türkiye?", "For EU destinations, the EU–Türkiye Customs Union and A.TR proof may be relevant depending on tariff classification and customs status. Import VAT, product requirements and national approval remain separate checks; Switzerland uses a separate customs process."],
    ["Are custom layouts and furniture available?", "Yes. Tiny houses are the core product; kitchens, bathrooms, stairs, storage and contract furniture are made to measure within structural, weight, services and transport limits."],
    ["How do I get the fastest response?", "Start on WhatsApp and include the destination, intended use, number of occupants, preferred size and budget. Complete information shortens the preliminary review."],
  ];
}

function countryPage(code, market, lang) {
  const country = COUNTRIES[code];
  const isDe = lang === "de";
  const file = isDe ? `laender/${country.deSlug}/index.html` : `en/countries/${country.enSlug}/index.html`;
  const counterpart = isDe ? `en/countries/${country.enSlug}/index.html` : `laender/${country.deSlug}/index.html`;
  const root = rootFor(file);
  const name = country[isDe ? "de" : "en"];
  const faq = countryFaqs(country, lang);
  let regions;
  if (code === "DE") regions = DE_REGIONS.map(([label, slug]) => `<a class="state-card" href="${root}standorte/${slug}/"><span>${isDe ? "Bundesland" : "Federal state"}</span><h3>${esc(label)}</h3><p>${isDe ? "Lokale Seiten, Klima, Lieferung und FAQ" : "Local pages, climate, delivery and FAQ"}</p></a>`).join("");
  else regions = market.regions.map((region) => `<a class="state-card" href="${root}${isDe ? `standorte/${country.locationSlug}/${region.slug}/` : `en/locations/${country.enSlug}/${region.slug}/`}"><span>${region.cities.length} ${isDe ? "Orte" : "places"}</span><h3>${esc(region.display)}</h3><p>${isDe ? "Regionale Planung & Projektcheck" : "Regional planning & project check"}</p></a>`).join("");
  const count = code === "DE" ? "7.423+" : market.count.toLocaleString(isDe ? "de-DE" : "en-GB");
  const title = isDe ? `Tiny House ${country.de}: kaufen, liefern & genehmigen | MODUNERA` : `Tiny houses in ${country.en}: delivery, permits & custom build | MODUNERA`;
  const description = isDe ? `Premium Tiny Houses für ${country.de}: eigene Produktion, acht Modelle, individuelle Möbel, regionale Seiten, Genehmigungsorientierung und Transportplanung.` : `Premium tiny houses for ${country.en}: own production, eight models, bespoke furniture, regional pages, permit guidance and transport planning.`;
  const guide = isDe ? `blog/europa/tiny-house-${country.deSlug}-genehmigung/` : `en/guides/tiny-house-${country.enSlug}-permits/`;
  const message = isDe ? `Hallo MODUNERA, ich plane ein Tiny House in ${country.de}. Ort/Region: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung.` : `Hello MODUNERA, I am planning a tiny house in ${country.en}. Place/region: __. Use: __. Occupants: __. Budget: __. Please send an initial assessment.`;
  return head({ file, lang, title, description, image: country.image, alternateDe: canonicalFor(isDe ? file : counterpart), alternateEn: canonicalFor(isDe ? counterpart : file), schema: [{ "@context": "https://schema.org", "@type": "WebPage", name: title, url: canonicalFor(file), description, dateModified: UPDATED, inLanguage: isDe ? "de-DE" : "en" }, faqSchema(faq)] }) + nav(root, lang) + `<main id="main"><header class="location-hero country-hero"><img src="${root}assets/images/gallery/${country.image}" alt="${esc(title)}"><div class="location-hero-overlay"></div><div class="container location-hero-content"><div class="breadcrumbs"><a href="${root}${isDe ? "laender/" : "en/countries/"}">${isDe ? "Länder" : "Countries"}</a> · ${esc(name)}</div><span class="hero-kicker">MODUNERA · ${esc(name)}</span><h1>${isDe ? `Tiny Houses für ${esc(name)}` : `Tiny houses for ${esc(name)}`}</h1><p>${isDe ? "Nach eigener Spezifikation gefertigt: acht Tiny-House-Modelle, individuelle Möbel, strukturierte Genehmigungsorientierung und Lieferung je Projekt." : "Direct from our own production: eight tiny-house models, bespoke furniture, structured permit guidance and delivery quoted per project."}</p><div class="hero-actions"><a class="btn btn-primary" href="${waLink(message)}" target="_blank" rel="noopener">${isDe ? "Schnellangebot per WhatsApp" : "Fast quote via WhatsApp"}</a><a class="btn btn-light" href="${root}studio/">${isDe ? "Tiny konfigurieren" : "Configure a tiny house"}</a></div></div></header><section class="section section-tight"><div class="container"><div class="data-strip"><div><span>${isDe ? "Lokale Abdeckung" : "Local coverage"}</span><strong>${count} ${isDe ? "Seiten" : "pages"}</strong></div><div><span>${isDe ? "Modelle" : "Models"}</span><strong>MD 1–MD 8</strong></div><div><span>${isDe ? "Produktion" : "Production"}</span><strong>Türkiye</strong></div><div><span>${isDe ? "Direktkontakt" : "Direct contact"}</span><strong>WhatsApp</strong></div></div><div class="answer-box"><strong>${isDe ? "Direkte Antwort" : "Direct answer"}</strong><p>${isDe ? `MODUNERA liefert Tiny Houses nach ${country.de}, wenn Modell, Route, Dokumente, Zufahrt und Entladung freigegeben sind. Der Standort muss vor Bestellung mit der zuständigen Behörde geklärt werden; wir liefern technische Projektunterlagen, ersetzen aber keine lokale Rechts- oder Genehmigungsberatung.` : `MODUNERA delivers tiny houses to ${country.en} once the model, route, documents, access and unloading are approved. The site must be checked with the competent authority before ordering; we provide project documents but do not replace local legal or permit advice.`}</p></div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "Warum MODUNERA" : "Why MODUNERA"}</div><h2>${isDe ? "Tiny-House-Spezialisierung mit breiter Fertigungskompetenz." : "Tiny-house specialisation backed by broad manufacturing capability."}</h2></div><p>${isDe ? "Tiny Houses bleiben unser Hauptgeschäft. Modulbau, Stahlkonstruktionen, Containerbau, Bungalows und Möbel nach Maß erweitern die Möglichkeiten für private und gewerbliche Projekte." : "Tiny houses remain our core business. Modular buildings, steel structures, containers, bungalows and bespoke furniture extend the possibilities for private and commercial projects."}</p></div><div class="benefit-grid"><div class="benefit"><span class="benefit-number">01</span><h3>${isDe ? "Acht Ausgangsmodelle" : "Eight base models"}</h3><p>${isDe ? "Schneller Einstieg ohne Individualisierung auszuschließen." : "A faster starting point without excluding customisation."}</p></div><div class="benefit"><span class="benefit-number">02</span><h3>${isDe ? "Eigene Möbel" : "In-house furniture"}</h3><p>${isDe ? "Einbauten werden zusammen mit Grundriss und Technik geplant." : "Built-ins are planned together with the layout and services."}</p></div><div class="benefit"><span class="benefit-number">03</span><h3>${isDe ? "Digitaler Projektstart" : "Digital project start"}</h3><p>${isDe ? "Konfigurator, Standortseiten und WhatsApp verkürzen die Erstklärung." : "Configurator, location pages and WhatsApp shorten the initial qualification."}</p></div><div class="benefit"><span class="benefit-number">04</span><h3>${isDe ? "Europa-Logistik" : "European logistics"}</h3><p>${isDe ? "Straße, Tieflader und kombinierte Fähr-/Ro-Ro-Routen werden verglichen." : "Road, low-loader and combined ferry/Ro-Ro routes are compared."}</p></div></div></div></section><section class="section section-dark"><div class="container wide-feature"><div class="visual"><img src="${root}assets/images/gallery/mc2-kitchen.webp" alt="MODUNERA Tiny House" loading="lazy"></div><div class="wide-copy"><div class="eyebrow">${isDe ? "Rechtliche Orientierung" : "Regulatory orientation"}</div><h2>${isDe ? `Was in ${esc(country.de)} zuerst zu klären ist.` : `What to check first in ${esc(country.en)}.`}</h2><p>${esc(isDe ? country.legalDe : country.legalEn)}</p><a class="btn btn-sand" href="${root}${guide}">${isDe ? "Länderleitfaden lesen →" : "Read country guide →"}</a><a class="source-link" href="${country.source}" target="_blank" rel="noopener">${isDe ? "Amtliche Quelle" : "Official source"} ↗</a></div></div></section><section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? country.regionDe : country.regionEn}</div><h2>${isDe ? "Ort oder Region auswählen." : "Choose a place or region."}</h2></div><p>${isDe ? "Lokale Seiten bündeln Suchintention, Klima, Nutzung, Genehmigung und Lieferung – ohne eine behördliche Freigabe vorzutäuschen." : "Local pages bring together search intent, climate, use, permission and delivery without implying authority approval."}</p></div><div class="state-grid">${regions}</div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">FAQ · ${esc(name)}</div><h2>${isDe ? "Schnelle Antworten, klare Grenzen." : "Fast answers, clear limits."}</h2></div></div><div class="faq-list">${faqMarkup(faq)}</div></div></section></main>` + footer(root, lang);
}

function countriesIndex(lang, markets) {
  const isDe = lang === "de";
  const file = isDe ? "laender/index.html" : "en/countries/index.html";
  const root = rootFor(file);
  const cards = Object.entries(COUNTRIES).map(([code, country]) => { const count = code === "DE" ? "7.423+" : markets[code].count.toLocaleString(isDe ? "de-DE" : "en-GB"); return `<a class="state-card" href="${isDe ? country.deSlug : country.enSlug}/"><span>${count} ${isDe ? "lokale Seiten" : "local pages"}</span><h3>${esc(country[isDe ? "de" : "en"])}</h3><p>${isDe ? "Modelle, Recht, Transport und Projektcheck" : "Models, rules, logistics and project check"}</p></a>`; }).join("");
  const title = isDe ? "Tiny Houses in Deutschland, Niederlande, Dänemark, Luxemburg & Schweiz | MODUNERA" : "Tiny houses in Germany, Netherlands, Denmark, Luxembourg & Switzerland | MODUNERA";
  const description = isDe ? "Länderspezifische Tiny-House-Landingpages mit regionaler Abdeckung, Genehmigungsorientierung, Transportwegen und direktem WhatsApp-Projektcheck." : "Country-specific tiny-house landing pages with regional coverage, permit guidance, delivery routes and a direct WhatsApp project check.";
  return head({ file, lang, title, description, alternateDe: BASE + "laender/", alternateEn: BASE + "en/countries/", schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: canonicalFor(file), description, dateModified: UPDATED }] }) + nav(root, lang) + `<main id="main"><header class="page-hero"><div class="container"><div class="eyebrow">MODUNERA Europe</div><h1>${isDe ? "Tiny Houses für fünf Zielmärkte." : "Tiny houses for five target markets."}</h1><p>${isDe ? "Tiny Houses sind unser Kern. Für jedes Land verbinden wir Modelle, lokale Orientierung, Genehmigungsfragen, Transport und einen schnellen WhatsApp-Projektstart." : "Tiny houses are our core. For each country we connect models, local guidance, permit questions, logistics and a fast WhatsApp project start."}</p></div></header><section class="section"><div class="container"><div class="state-grid">${cards}</div></div></section></main>` + footer(root, lang);
}

/* Per-service copy. Without it the four service pages were the same page four
   times: the process strip, the three FAQs and the five-market appendix were
   identical on all of them, and only the name and a one-line intro changed. About
   60 of 770 words said anything a reader could not have read on the other three.

   Everything in the file describes how the work is done and what decides whether
   it can be done. No certified figures — those are publish blockers — but the
   engineering logic of each trade is true regardless of which documents arrive,
   and it is the part a buyer needs before the first enquiry. */
const SERVICE_COPY = JSON.parse(await readFile(join(ROOT, "data/services.json"), "utf8")).services;

const listMarkup = (items) => `<ul class="check-list">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;

function servicePage(service, lang) {
  const isDe = lang === "de";
  const file = isDe ? `leistungen/${service.slug}/index.html` : `en/services/${service.enSlug}/index.html`;
  const counterpart = isDe ? `en/services/${service.enSlug}/index.html` : `leistungen/${service.slug}/index.html`;
  const root = rootFor(file);
  const name = service[isDe ? "de" : "en"];
  const intro = service[isDe ? "deIntro" : "enIntro"];
  const title = `${name} | MODUNERA`;
  const description = `${intro} ${isDe ? "Tiny Houses bleiben unser Kernprodukt; Anfrage und Vorprüfung direkt per WhatsApp." : "Tiny houses remain our core product; enquiry and preliminary review direct via WhatsApp."}`;
  const copy = SERVICE_COPY[service.slug];
  const faq = copy.faq[lang];
  const message = isDe ? `Hallo MODUNERA, ich interessiere mich für ${service.de}. Projektort: __. Nutzung: __. Größe/Menge: __. Bitte kontaktieren Sie mich.` : `Hello MODUNERA, I am interested in ${service.en}. Project location: __. Use: __. Size/quantity: __. Please contact me.`;
  return head({ file, lang, title, description, image: service.image, alternateDe: canonicalFor(isDe ? file : counterpart), alternateEn: canonicalFor(isDe ? counterpart : file), schema: [{ "@context": "https://schema.org", "@type": "Service", name, provider: { "@type": "Organization", name: "MODUNERA", url: BASE }, areaServed: ["DE", "NL", "DK", "LU", "CH"], description }, faqSchema(faq)] }) + nav(root, lang) + `<main id="main"><header class="location-hero"><img src="${root}assets/images/gallery/${service.image}" alt="${esc(name)}"><div class="location-hero-overlay"></div><div class="container location-hero-content"><div class="eyebrow">MODUNERA · ${isDe ? "Weitere Lösungen" : "Additional solutions"}</div><h1>${esc(name)}</h1><p>${esc(intro)}</p><div class="hero-actions"><a class="btn btn-primary" href="${waLink(message)}" target="_blank" rel="noopener">${isDe ? "Projekt per WhatsApp starten" : "Start on WhatsApp"}</a><a class="btn btn-light" href="${root}${isDe ? "index.html#modelle" : "en/#models"}">${isDe ? "Tiny Houses ansehen" : "View tiny houses"}</a></div></div></header><section class="section section-tight"><div class="container"><div class="answer-box"><strong>${isDe ? "Einordnung" : "Positioning"}</strong><p>${esc(copy.lead[lang])}</p></div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "Leistungsumfang" : "Capability"}</div><h2>${isDe ? `Was wir unter ${esc(name)} fertigen.` : `What we build under ${esc(name)}.`}</h2></div><p>${isDe ? "Tiny Houses bleiben das Hauptgeschäft. Dieses Feld ergänzt es dort, wo ein Projekt mehr Fläche, eine andere Tragstruktur oder eine eigenständige Lieferung braucht." : "Tiny houses remain the core business. This capability extends it where a project needs more floor area, a different structural system or a delivery of its own."}</p></div>${listMarkup(copy.makes[lang])}</div></section><section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "Machbarkeit" : "Feasibility"}</div><h2>${isDe ? "Woran es tatsächlich entschieden wird." : "What actually decides it."}</h2></div><p>${isDe ? "Diese vier Punkte entscheiden die meisten Projekte in diesem Feld — früh geklärt kosten sie nichts, spät geklärt kosten sie den Termin." : "These four points decide most projects in this field. Settled early they cost nothing; settled late they cost the schedule."}</p></div><div class="benefit-grid">${copy.decides[lang].map(([heading, body], index) => `<div class="benefit"><span class="benefit-number">${String(index + 1).padStart(2, "0")}</span><h3>${esc(heading)}</h3><p>${esc(body)}</p></div>`).join("")}</div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">${isDe ? "Abgrenzung" : "Scope"}</div><h2>${isDe ? "Was enthalten ist — und was nicht." : "What is included, and what is not."}</h2></div><p>${isDe ? "Die zweite Spalte ist die wichtigere. Fundament, Anschluss und Genehmigung sind die Positionen, die ein Angebot nicht enthält und ein Projekt trotzdem braucht." : "The second column is the important one. Foundation, connections and permits are the items a quotation does not contain and a project needs anyway."}</p></div><div class="benefit-grid"><article class="benefit-card"><h3>${isDe ? "Im Lieferumfang" : "In scope"}</h3>${listMarkup(copy.scope[lang].in)}</article><article class="benefit-card"><h3>${isDe ? "Nicht enthalten" : "Not included"}</h3>${listMarkup(copy.scope[lang].out)}</article></div></div></section><section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">FAQ</div><h2>${isDe ? "Fragen, die vor dem Angebot kommen." : "Questions that come before the quotation."}</h2></div></div><div class="faq-list">${faqMarkup(faq)}</div></div></section></main>` + footer(root, lang);
}

function servicesIndex(lang) {
  const isDe = lang === "de";
  const file = isDe ? "leistungen/index.html" : "en/services/index.html";
  const root = rootFor(file);
  /* Five capabilities, four pages. The WhatsApp panel on every page of this site
     lists five things MODUNERA makes and this hub showed four of them, because
     the fifth — the tiny house — has the entire rest of the site. Giving it a
     page under /leistungen/ as well would put a thin fifth service page in
     competition with the home page, /modelle/ and /tiny-house-preise/ for the one
     term the business most needs to rank for, and canonical competition is a cost
     with no matching benefit. So it gets a card and the card goes to the tree
     that already exists. The hub now represents the business; the URL space does
     not gain a duplicate. */
  const core = isDe
    ? { href: `${root}modelle/`, name: "Tiny Houses", intro: "Das Hauptgeschäft: acht Modelle von MD 1 bis MD 8, auf eigenem Fahrgestell, für Wohnen, Ferienvermietung und Büro." }
    : { href: `${root}en/models/`, name: "Tiny houses", intro: "The core business: eight models from MD 1 to MD 8, on their own chassis, for living, holiday rental and workspace." };
  const entries = [core, ...SERVICE_PAGES.map((service) => ({
    href: `${isDe ? service.slug : service.enSlug}/`,
    name: service[isDe ? "de" : "en"],
    intro: service[isDe ? "deIntro" : "enIntro"],
  }))];
  const cards = entries.map((entry, index) => `<a class="journey-card" href="${entry.href}"><div><span class="num">${String(index + 1).padStart(2, "0")}</span><h3>${esc(entry.name)}</h3><p>${esc(entry.intro)}</p></div><span class="arrow">↗</span></a>`).join("");
  const title = isDe ? "Tiny Houses, Modulbau, Stahlbau, Container, Bungalows & Möbel | MODUNERA" : "Tiny houses, modular, steel, containers, bungalows & furniture | MODUNERA";
  const description = isDe ? "Die sechs Dinge, die MODUNERA fertigt: Tiny Houses als Kern, dazu Modulbau, Stahlkonstruktionen, Containerbau, Bungalows und maßgefertigte Möbel." : "The six things MODUNERA builds: tiny houses at the core, plus modular buildings, steel structures, containers, bungalows and bespoke furniture.";
  return head({ file, lang, title, description, alternateDe: BASE + "leistungen/", alternateEn: BASE + "en/services/" }) + nav(root, lang) + `<main id="main"><header class="page-hero"><div class="container"><div class="eyebrow">${isDe ? "Leistungen" : "Capabilities"}</div><h1>${isDe ? "Sechs Dinge, die wir fertigen." : "Six things we build."}</h1><p>${esc(description)}</p></div></header><section class="section"><div class="container"><div class="journey-grid">${cards}</div></div></section></main>` + footer(root, lang);
}

function guidePage(code, lang) {
  const country = COUNTRIES[code];
  const isDe = lang === "de";
  const file = isDe ? `blog/europa/tiny-house-${country.deSlug}-genehmigung/index.html` : `en/guides/tiny-house-${country.enSlug}-permits/index.html`;
  const counterpart = isDe ? `en/guides/tiny-house-${country.enSlug}-permits/index.html` : `blog/europa/tiny-house-${country.deSlug}-genehmigung/index.html`;
  const root = rootFor(file);
  const name = country[isDe ? "de" : "en"];
  const title = isDe ? `Tiny House Genehmigung ${country.de}: Regeln & Checkliste | MODUNERA` : `Tiny house permits in ${country.en}: rules & checklist | MODUNERA`;
  const description = isDe ? `Aktualisierte Orientierung zur Tiny-House-Genehmigung in ${country.de}: Standort, Nutzung, Fahrgestell, Dokumente, Transport und Behördencheck.` : `Updated guidance to tiny-house permission in ${country.en}: site, use, trailer, documents, transport and authority checks.`;
  const faq = countryFaqs(country, lang).slice(1, 5);
  return head({ file, lang, title, description, image: country.image, alternateDe: canonicalFor(isDe ? file : counterpart), alternateEn: canonicalFor(isDe ? counterpart : file), schema: [{ "@context": "https://schema.org", "@type": "Article", headline: title, description, datePublished: UPDATED, dateModified: UPDATED, author: { "@type": "Organization", name: "MODUNERA Redaktion" }, publisher: { "@type": "Organization", name: "MODUNERA", logo: { "@type": "ImageObject", url: BASE + "assets/brand/modunera-master-logo-mountain-v1-600.png" } } }, faqSchema(faq)] }) + nav(root, lang) + `<main id="main"><header class="article-visual-hero"><img src="${root}assets/images/gallery/${country.image}" alt="${esc(title)}"><div class="article-visual-overlay"></div><div class="container"><div class="blog-meta">${UPDATED} · MODUNERA ${isDe ? "Redaktion" : "Editorial"}</div><h1>${esc(title.replace(" | MODUNERA", ""))}</h1><p>${esc(description)}</p></div></header><section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>${isDe ? "Kurzantwort" : "Short answer"}</strong><p>${esc(isDe ? country.legalDe : country.legalEn)}</p></div><h2>${isDe ? "1. Nutzung vor Mobilität" : "1. Use before mobility"}</h2><p>${isDe ? "Ob Wohnen, Ferienvermietung, Büro oder temporäre Aufstellung: Die tatsächliche Nutzung und Dauer sind für die rechtliche Einordnung meist wichtiger als die Bezeichnung Tiny House. Ein Fahrgestell ist kein pauschaler Befreiungstatbestand." : "Residential, holiday-rental, office or temporary use can lead to different treatment. Actual use and duration usually matter more than the label tiny house, and a trailer is not a blanket exemption."}</p><h2>${isDe ? "2. Grundstück und zuständige Stelle" : "2. Plot and competent authority"}</h2><p>${isDe ? `Vor einer Bestellung sollten Adresse beziehungsweise Flurstück, vorgesehene Nutzung, Standdauer, Abmessungen, Anschlüsse und Zufahrt mit der zuständigen Stelle in ${country.de} geklärt werden.` : `Before ordering, check the address or parcel, intended use, duration, dimensions, utility connections and access with the competent authority in ${country.en}.`}</p><h2>${isDe ? "3. Technische Unterlagen" : "3. Technical documents"}</h2><ul class="check-list"><li>${isDe ? "Grundriss, Ansichten, Schnitte und Abmessungen" : "Plans, elevations, sections and dimensions"}</li><li>${isDe ? "Tragstruktur, Gewichte und gegebenenfalls Fahrgestelldaten" : "Structure, weights and trailer data where relevant"}</li><li>${isDe ? "Wärme-, Feuchte-, Brand- und Installationskonzept" : "Thermal, moisture, fire and services concepts"}</li><li>${isDe ? "Aufstellung, Fundierung, Zufahrt und Entladung" : "Placement, foundations, access and unloading"}</li></ul><h2>${isDe ? "4. Transport ist ein separates Prüfpaket" : "4. Transport is a separate review package"}</h2><p>${isDe ? "Baurechtliche Zulässigkeit am Zielort und straßenverkehrsrechtliche Zulässigkeit während der Überführung sind zwei verschiedene Fragen. Modell, Route, Kennzeichen, Versicherung, Fahrerlaubnis und Sondertransportgenehmigungen werden getrennt geprüft." : "Planning permission at the destination and road legality during delivery are separate questions. Model, route, registration, insurance, driving entitlement and special-transport permits require separate checks."}</p><h2>${isDe ? "5. Amtliche Ausgangsquelle" : "5. Official starting source"}</h2><p><a href="${country.source}" target="_blank" rel="noopener">${esc(name)} · ${isDe ? "offizielle Genehmigungsinformation" : "official permit information"} ↗</a></p><div class="notice"><strong>${isDe ? "Rechtlicher Hinweis" : "Legal note"}</strong><p>${isDe ? `Stand ${UPDATED}. Dieser Beitrag ist eine allgemeine Projektorientierung und keine Rechts-, Behörden-, Statik-, Energie- oder Steuerberatung. Verbindlich sind die aktuelle Rechtslage und die Entscheidung der zuständigen Stellen.` : `Reviewed ${UPDATED}. This article is general project guidance, not legal, authority, structural, energy or tax advice. Current law and the decisions of competent authorities are controlling.`}</p></div><h2>FAQ</h2><div class="faq-list">${faqMarkup(faq)}</div></article><aside class="article-aside"><div class="toc"><strong>${isDe ? "Projektstart" : "Project start"}</strong><a href="${root}${isDe ? `laender/${country.deSlug}/` : `en/countries/${country.enSlug}/`}">${isDe ? "Länderseite" : "Country page"}</a><a href="${root}${isDe ? "blog/europa/tiny-house-transport-tuerkei-europa/" : "en/guides/tiny-house-transport-turkiye-europe/"}">${isDe ? "Transportleitfaden" : "Transport guide"}</a><a class="btn btn-primary" href="${waLink(isDe ? `Hallo MODUNERA, ich plane ein Projekt in ${country.de}. Bitte prüfen Sie mit mir die nächsten Schritte.` : `Hello MODUNERA, I am planning a project in ${country.en}. Please help me structure the next steps.`)}" target="_blank" rel="noopener">WhatsApp</a></div></aside></div></section></main>` + footer(root, lang);
}

function transportGuide(lang) {
  const isDe = lang === "de";
  const file = isDe ? "blog/europa/tiny-house-transport-tuerkei-europa/index.html" : "en/guides/tiny-house-transport-turkiye-europe/index.html";
  const counterpart = isDe ? "en/guides/tiny-house-transport-turkiye-europe/index.html" : "blog/europa/tiny-house-transport-tuerkei-europa/index.html";
  const root = rootFor(file);
  const title = isDe ? "Tiny House Transport Türkiye–Europa: Kennzeichen, Tieflader & Ro-Ro | MODUNERA" : "Tiny house transport Türkiye–Europe: trailer, low-loader & Ro-Ro | MODUNERA";
  const description = isDe ? "Projektleitfaden für Tiny-House-Transporte aus Türkiye nach Europa: eigene Achse, Tieflader, Sondertransport, Ro-Ro, A.TR, Einfuhrumsatzsteuer und Zielzufahrt." : "Project guide to tiny-house delivery from Türkiye to Europe: road-going trailer, low-loader, special transport, Ro-Ro, A.TR, import VAT and final access.";
  const faq = isDe ? [["Welche Transportart ist am günstigsten?", "Das lässt sich erst nach Abmessungen, Gewicht, Zulassungsstatus, Start- und Zielort, Route und Entladebedarf vergleichen."], ["Bedeutet A.TR automatisch keine Einfuhrkosten?", "Nein. A.TR belegt den Zollstatus für Waren im Anwendungsbereich der EU–Türkiye-Zollunion; Einreihung, Produktanforderungen, Einfuhrumsatzsteuer und sonstige Kosten bleiben zu prüfen."], ["Kann das Tiny House auf eigener Achse fahren?", "Nur bei passender Fahrzeug- beziehungsweise Anhängerzulassung, Versicherung, Gewichten, Maßen und Streckenzulässigkeit."], ["Ist Ro-Ro eine Tür-zu-Tür-Lösung?", "Nein. Ro-Ro ist typischerweise ein Abschnitt der Route; Vorlauf, Hafenhandling und Nachlauf bis zum Grundstück bleiben separat."]] : [["Which transport method is cheapest?", "A comparison is possible only after dimensions, weight, approval status, origin, destination, route and unloading needs are known."], ["Does A.TR mean there are no import costs?", "No. A.TR proves customs status for goods within the EU–Türkiye Customs Union's scope; tariff classification, product requirements, import VAT and other charges remain separate."], ["Can the tiny house travel on its own wheels?", "Only with suitable vehicle or trailer approval, insurance, weights, dimensions and route compliance."], ["Is Ro-Ro a door-to-door solution?", "No. Ro-Ro is usually one leg of the route; pre-carriage, port handling and onward delivery to the plot remain separate."]];
  return head({ file, lang, title, description, image: "mc4-exterior.webp", alternateDe: canonicalFor(isDe ? file : counterpart), alternateEn: canonicalFor(isDe ? counterpart : file), schema: [{ "@context": "https://schema.org", "@type": "Article", headline: title, description, datePublished: UPDATED, dateModified: UPDATED, author: { "@type": "Organization", name: "MODUNERA Redaktion" } }, faqSchema(faq)] }) + nav(root, lang) + `<main id="main"><header class="article-visual-hero"><img src="${root}assets/images/gallery/mc4-exterior.webp" alt="Tiny House Transport"><div class="article-visual-overlay"></div><div class="container"><div class="blog-meta">${UPDATED} · ${isDe ? "Logistikleitfaden" : "Logistics guide"}</div><h1>${isDe ? "Von Türkiye nach Europa: die richtige Transportkette." : "From Türkiye to Europe: choosing the right transport chain."}</h1><p>${esc(description)}</p></div></header><section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>${isDe ? "Kurzantwort" : "Short answer"}</strong><p>${isDe ? "Es gibt keinen pauschal besten Weg. Zugelassene Überführung auf eigener Achse, Tieflader/Sondertransport und ein kombinierter Straßen–Fähr-/Ro-Ro-Weg werden anhand von Modell, Dokumenten, Route und Grundstück verglichen." : "There is no universally best route. A road-approved trailer, low-loader/special transport and a combined road–ferry/Ro-Ro chain are compared using the model, documents, route and plot."}</p></div><h2>${isDe ? "Option 1: zugelassene Überführung" : "Option 1: approved road-going trailer"}</h2><p>${isDe ? "Diese Variante setzt ein geeignetes und für die Route anerkanntes Fahrgestell beziehungsweise einen Anhänger, gültige Registrierung oder Überführungsregelung, Versicherung, passende Fahrerlaubnis sowie eingehaltene Maße und Gewichte voraus." : "This option requires a suitable trailer accepted along the route, valid registration or transfer arrangement, insurance, the correct driving entitlement, and compliant dimensions and weights."}</p><h2>${isDe ? "Option 2: Tieflader oder Sondertransport" : "Option 2: low-loader or special transport"}</h2><p>${isDe ? "Nicht zugelassene, schwere oder überbreite Einheiten werden als Ladung transportiert. Route, Genehmigungen, Begleitung, Zeitfenster, Maut, Kran und letzte Zufahrt beeinflussen Preis und Termin." : "Units that are not road-approved, heavy or oversized travel as cargo. Route, permits, escort, time windows, tolls, crane and final access affect price and timing."}</p><h2>${isDe ? "Option 3: Fähre oder Ro-Ro als Routenbaustein" : "Option 3: ferry or Ro-Ro as a route leg"}</h2><p>${isDe ? "Ein Fähr- oder Ro-Ro-Abschnitt kann Straßenkilometer reduzieren. Er ersetzt jedoch nicht Vorlauf, Hafenabwicklung, Sicherung, Terminfenster, Nachlauf und Grundstücksentladung. Fahrpläne und geeignete Häfen müssen aktuell angefragt werden." : "A ferry or Ro-Ro leg can reduce road mileage, but it does not replace pre-carriage, port processing, securing, schedule windows, onward road delivery and unloading. Current schedules and suitable ports must be quoted."}</p><h2>${isDe ? "Zoll, A.TR und Einfuhrumsatzsteuer" : "Customs, A.TR and import VAT"}</h2><p>${isDe ? "Die EU–Türkiye-Zollunion umfasst grundsätzlich Industrieprodukte; Waren im freien Verkehr können mit A.TR-Nachweis zirkulieren. Ob das konkrete Tiny House erfasst ist, hängt von korrekter Tarifierung und Zollstatus ab. Einfuhrumsatzsteuer und technische Anforderungen bleiben davon getrennt. Für die Schweiz gilt ein eigenes Importverfahren." : "The EU–Türkiye Customs Union generally covers industrial products; goods in free circulation can move with A.TR proof. Whether a specific tiny house is covered depends on correct tariff classification and customs status. Import VAT and technical requirements remain separate. Switzerland uses its own import procedure."}</p><p><a href="${SOURCE_URLS.euTrade}" target="_blank" rel="noopener">EU Access2Markets · EU–Türkiye Customs Union ↗</a></p><h2>${isDe ? "Maße und Fahrzeugzulassung" : "Dimensions and vehicle approval"}</h2><p>${isDe ? "Im grenzüberschreitenden EU-Straßenverkehr liegen wichtige harmonisierte Bezugsgrößen unter anderem bei 2,55 m Breite und 4,00 m Höhe; Modell und Kombination müssen im Einzelfall geprüft werden. Für Anhänger regelt EU-Verordnung 2018/858 die Typgenehmigung und Marktüberwachung." : "Key harmonised reference limits for cross-border EU road traffic include 2.55 m width and 4.00 m height; the actual model and vehicle combination must be assessed. EU Regulation 2018/858 governs approval and market surveillance of trailers."}</p><p><a href="${SOURCE_URLS.euDimensions}" target="_blank" rel="noopener">European Commission · vehicle dimensions ↗</a><br><a href="${SOURCE_URLS.euVehicle}" target="_blank" rel="noopener">EUR-Lex · Regulation (EU) 2018/858 ↗</a></p><div class="notice"><strong>${isDe ? "Vor Angebot benötigt" : "Needed before quotation"}</strong><p>${isDe ? "Modell, Außenmaße, Leer-/Gesamtgewicht, Fahrgestelldokumente, Start- und Zieladresse, Fotos/Maße der Zufahrt, gewünschter Termin, Kranbedarf und Nutzungsart." : "Model, external dimensions, empty/gross weight, trailer documents, origin and destination, access photos/dimensions, preferred date, crane need and intended use."}</p></div><h2>FAQ</h2><div class="faq-list">${faqMarkup(faq)}</div></article><aside class="article-aside"><div class="toc"><strong>${isDe ? "Schnellanfrage" : "Fast enquiry"}</strong><p>${isDe ? "Senden Sie Zielort und Wunschmodell. Wir strukturieren die fehlenden Logistikdaten." : "Send the destination and preferred model. We will structure the missing logistics data."}</p><a class="btn btn-primary" href="${waLink(isDe ? "Hallo MODUNERA, bitte prüfen Sie den Transport. Zielort: __. Modell/Größe: __. Zufahrt: __." : "Hello MODUNERA, please assess delivery. Destination: __. Model/size: __. Access: __.")}" target="_blank" rel="noopener">WhatsApp</a></div></aside></div></section></main>` + footer(root, lang);
}

function competitorGuide(lang) {
  const isDe = lang === "de";
  const file = isDe ? "blog/europa/tiny-house-hersteller-polen-rumaenien-tuerkei-vergleich/index.html" : "en/guides/tiny-house-manufacturers-poland-romania-turkiye-comparison/index.html";
  const counterpart = isDe ? "en/guides/tiny-house-manufacturers-poland-romania-turkiye-comparison/index.html" : "blog/europa/tiny-house-hersteller-polen-rumaenien-tuerkei-vergleich/index.html";
  const root = rootFor(file);
  const title = isDe ? "Tiny-House-Hersteller vergleichen: Polen, Rumänien & Türkiye | MODUNERA" : "Compare tiny-house manufacturers: Poland, Romania & Türkiye | MODUNERA";
  const description = isDe ? "Sachlicher Angebotsvergleich für Tiny Houses aus Polen, Rumänien und Türkiye: Preisumfang, Dokumente, Konstruktion, Möbel, Transport, Garantie und Service." : "A practical comparison framework for tiny houses from Poland, Romania and Türkiye: scope, documents, structure, furniture, delivery, warranty and service.";
  const competitors = [
    ["REDUKT", "Polen", "https://redukt.eu/en/", isDe ? "Europa-Lieferung und klar gegliederte Modell-/Preispositionierung" : "European delivery and a clearly structured model/price proposition"],
    ["Aurora Company", "Polen", "https://auroracompany.pl/en/", isDe ? "öffentlich kommunizierte Europa-Erfahrung und Garantiepositionierung" : "publicly communicated European experience and warranty proposition"],
    ["Mobi House", "Polen", "https://mobihouse.pl/en", isDe ? "etablierte Modellreihen, Individualisierung und Export" : "established ranges, customisation and export"],
    ["Kubo TinyHouse", "Rumänien", "https://kubo-tinyhouse.com/en/", isDe ? "Vier-Jahreszeiten- und schlüsselfertige Positionierung" : "four-season and turnkey positioning"],
    ["Eco Tiny House", "Rumänien", "https://www.ecotiny.house/", isDe ? "Export- und Hospitality-Erfahrung" : "export and hospitality experience"],
    ["Solido", "Rumänien", "https://solidotinyhouse.com/", isDe ? "individuelle Modelle und europaweite Lieferung" : "custom models and European delivery"],
  ];
  const competitorRows = competitors.map(([name, country, url, positioning]) => `<tr><td><a href="${url}" target="_blank" rel="noopener">${esc(name)} ↗</a></td><td>${esc(country)}</td><td>${esc(positioning)}</td><td>${isDe ? "Ausstattung, Nachweise, Lieferumfang und Service einzeln verifizieren" : "Verify specification, evidence, delivery scope and service line by line"}</td></tr>`).join("");
  const competitorTable = `<div class="compare"><table><thead><tr><th>${isDe ? "Anbieter" : "Supplier"}</th><th>${isDe ? "Markt" : "Market"}</th><th>${isDe ? "Öffentliche Positionierung" : "Public positioning"}</th><th>${isDe ? "Prüfpunkt" : "Check"}</th></tr></thead><tbody>${competitorRows}</tbody></table></div>`;
  return head({ file, lang, title, description, image: "mc5-interior.webp", alternateDe: canonicalFor(isDe ? file : counterpart), alternateEn: canonicalFor(isDe ? counterpart : file), schema: [{ "@context": "https://schema.org", "@type": "Article", headline: title, description, datePublished: UPDATED, dateModified: UPDATED, author: { "@type": "Organization", name: "MODUNERA Redaktion" } }] }) + nav(root, lang) + `<main id="main"><header class="article-visual-hero"><img src="${root}assets/images/gallery/mc5-interior.webp" alt="${esc(title)}"><div class="article-visual-overlay"></div><div class="container"><div class="blog-meta">${UPDATED} · ${isDe ? "Herstellervergleich" : "Manufacturer comparison"}</div><h1>${esc(title.replace(" | MODUNERA", ""))}</h1><p>${esc(description)}</p></div></header><section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>${isDe ? "Marktbild" : "Market view"}</strong><p>${isDe ? "Polnische und rumänische Hersteller verfügen teils über langjährige Europa-Liefererfahrung, große Stückzahlen, Garantien und etablierte Modellreihen. Ein seriöser Vergleich sollte deshalb nicht über Herkunft oder pauschale Qualitätsbehauptungen laufen, sondern über nachprüfbare Leistungsmerkmale." : "Some Polish and Romanian manufacturers show long European delivery experience, substantial volumes, warranties and established model ranges. A serious comparison should therefore focus on verifiable scope rather than origin or blanket quality claims."}</p></div><h2>${isDe ? "Beobachtete Wettbewerber" : "Competitors reviewed"}</h2><p>${isDe ? `Stand ${UPDATED}: Die folgende Übersicht fasst ausschließlich öffentlich kommunizierte Positionierungen zusammen; sie ist keine Qualitätsrangliste.` : `Reviewed ${UPDATED}: the following snapshot summarises public supplier positioning only; it is not a quality ranking.`}</p>${competitorTable}<h2>${isDe ? "Sieben Punkte für einen belastbaren Vergleich" : "Seven points for a reliable comparison"}</h2><ol><li>${isDe ? "Ist der Preis brutto/netto und welche Ausstattung ist enthalten?" : "Is the price gross or net, and what specification is included?"}</li><li>${isDe ? "Welche Gewichte, Maße und Fahrgestell-/Transportdokumente werden zugesagt?" : "Which weights, dimensions and trailer/transport documents are committed?"}</li><li>${isDe ? "Wie sind Dämmung, Wärmebrücken, Lüftung, Brand- und Feuchteschutz dokumentiert?" : "How are insulation, thermal bridges, ventilation, fire and moisture protection documented?"}</li><li>${isDe ? "Sind Transport, Kran, Zoll, Einfuhrumsatzsteuer, Fundierung und Anschlüsse enthalten?" : "Are delivery, crane, customs, import VAT, foundations and utility connections included?"}</li><li>${isDe ? "Welche Garantie gilt wo, und wer erbringt Service im Zielland?" : "Which warranty applies where, and who provides service in the destination country?"}</li><li>${isDe ? "Wie weit reichen Grundriss-, Material- und Möbelanpassungen?" : "How far can layout, materials and furniture be customised?"}</li><li>${isDe ? "Welche Referenzen sind für vergleichbares Klima und Nutzung belegbar?" : "Which references can be verified for comparable climate and use?"}</li></ol><h2>${isDe ? "MODUNERA-Positionierung" : "MODUNERA positioning"}</h2><p>${isDe ? "MODUNERA setzt auf acht klar vergleichbare Tiny-House-Ausgangsmodelle, eigene Produktion, integrierte Maßmöbel, digitale Konfiguration, länder- und ortsbezogene Informationsseiten sowie einen strukturierten WhatsApp-Projektcheck. Diese Punkte sind überprüfbar; eine pauschale Behauptung, jeder Wettbewerber sei qualitativ schlechter, wird bewusst vermieden." : "MODUNERA combines eight comparable base models, own production, integrated bespoke furniture, digital configuration, country- and location-specific guidance, and a structured WhatsApp project check. These are verifiable points; we deliberately avoid blanket claims that every competitor is lower quality."}</p><h2>${isDe ? "Angebote auf eine Linie bringen" : "Normalise quotations before comparing"}</h2><p>${isDe ? "Fordern Sie von jedem Hersteller dieselbe Leistungs- und Dokumentenliste an. Vergleichen Sie erst danach den Gesamtpreis bis zum nutzbaren Zustand am Grundstück. Ein niedriger Werkspreis kann durch Transport, Steuern, Kran, Fundament, Anschlüsse oder fehlende Ausstattung relativiert werden." : "Ask every manufacturer for the same scope and document list. Compare only after calculating total cost to usable condition on the plot. A lower factory price can be offset by transport, tax, crane, foundations, connections or omitted equipment."}</p><div class="notice"><strong>${isDe ? "Transparenz" : "Transparency"}</strong><p>${isDe ? "Dieser Beitrag ist eine allgemeine Kaufhilfe. Genannte Marktbeobachtungen beruhen auf öffentlich kommunizierten Anbieterangaben und stellen keine unabhängige Produktprüfung dar." : "This article is general buying guidance. Market observations are based on publicly communicated supplier information and are not an independent product test."}</p></div></article><aside class="article-aside"><div class="toc"><strong>${isDe ? "MODUNERA-Angebot" : "MODUNERA quote"}</strong><p>${isDe ? "Fordern Sie ein strukturiertes Angebot an und vergleichen Sie Position für Position." : "Request a structured quote and compare line by line."}</p><a class="btn btn-primary" href="${waLink(isDe ? "Hallo MODUNERA, bitte senden Sie mir ein vergleichbares Tiny-House-Angebot. Zielland: __. Nutzung: __. Budget: __." : "Hello MODUNERA, please send me a comparable tiny-house quote. Country: __. Use: __. Budget: __.")}" target="_blank" rel="noopener">WhatsApp</a></div></aside></div></section></main>` + footer(root, lang);
}

function guidesIndex(lang) {
  const isDe = lang === "de";
  const file = isDe ? "blog/europa/index.html" : "en/guides/index.html";
  const root = rootFor(file);
  const countryCards = Object.values(COUNTRIES).map((country) => `<a class="journey-card" href="${isDe ? `tiny-house-${country.deSlug}-genehmigung/` : `tiny-house-${country.enSlug}-permits/`}"><div><span class="num">${esc(country[isDe ? "de" : "en"].slice(0, 2).toUpperCase())}</span><h3>${isDe ? `Genehmigung ${country.de}` : `${country.en} permits`}</h3><p>${isDe ? "Standort, Nutzung, Unterlagen und Behördencheck." : "Site, use, documents and authority check."}</p></div><span class="arrow">↗</span></a>`).join("");
  const title = isDe ? "Tiny House Europa: Recht, Transport & Herstellervergleich | MODUNERA" : "Tiny houses in Europe: permits, delivery & comparison | MODUNERA";
  const description = isDe ? "Aktuelle Länderleitfäden für Deutschland, Niederlande, Dänemark, Luxemburg und Schweiz plus Transport- und Herstellervergleich." : "Current country guides for Germany, Netherlands, Denmark, Luxembourg and Switzerland plus transport and manufacturer comparison.";
  return head({ file, lang, title, description, alternateDe: BASE + "blog/europa/", alternateEn: BASE + "en/guides/", schema: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: canonicalFor(file), description, dateModified: UPDATED }] }) + nav(root, lang) + `<main id="main"><header class="page-hero"><div class="container"><div class="eyebrow">${isDe ? "Recht · Logistik · Kauf" : "Rules · logistics · buying"}</div><h1>${isDe ? "Tiny-House-Wissen für fünf Zielmärkte." : "Tiny-house guidance for five target markets."}</h1><p>${esc(description)}</p></div></header><section class="section"><div class="container"><div class="journey-grid">${countryCards}<a class="journey-card" href="${isDe ? "tiny-house-transport-tuerkei-europa/" : "tiny-house-transport-turkiye-europe/"}"><div><span class="num">TR</span><h3>${isDe ? "Transport Türkiye–Europa" : "Transport Türkiye–Europe"}</h3><p>${isDe ? "Kennzeichen, Tieflader, Sondertransport, Ro-Ro und Zoll." : "Trailer, low-loader, special transport, Ro-Ro and customs."}</p></div><span class="arrow">↗</span></a><a class="journey-card" href="${isDe ? "tiny-house-hersteller-polen-rumaenien-tuerkei-vergleich/" : "tiny-house-manufacturers-poland-romania-turkiye-comparison/"}"><div><span class="num">EU</span><h3>${isDe ? "Hersteller vergleichen" : "Compare manufacturers"}</h3><p>${isDe ? "Polen, Rumänien und Türkiye sachlich vergleichen." : "A practical framework for Poland, Romania and Türkiye."}</p></div><span class="arrow">↗</span></a></div></div></section></main>` + footer(root, lang);
}

function europeFaqPage(lang) {
  const isDe = lang === "de";
  const file = isDe ? "faq/europa/index.html" : "en/faq/index.html";
  const root = rootFor(file);
  const all = Object.values(COUNTRIES).flatMap((country) => countryFaqs(country, lang).slice(0, 3));
  all.push(...(isDe ? [["Welche Informationen beschleunigen ein Angebot?", "Zielland und Ort, Nutzung, Personenanzahl, Wunschmodell oder Außenmaß, Budget, Termin, Grundstücksstatus sowie Fotos und Maße der letzten Zufahrt."], ["Bietet MODUNERA auch Modulbau, Stahlbau, Containerbau, Bungalows und Möbel an?", "Ja. Tiny Houses sind das Hauptgeschäft; die weiteren Leistungen werden für das einzelne Projekt angeboten."]] : [["Which details speed up a quotation?", "Country and place, intended use, occupants, preferred model or dimensions, budget, timing, plot status, and photos and measurements of final access."], ["Does MODUNERA also offer modular buildings, steel structures, bungalows and furniture?", "Yes. Tiny houses are the core business; additional services are offered on a project basis."]]));
  const title = isDe ? "Tiny House Europa FAQ: Genehmigung, Lieferung, Zoll & Kauf | MODUNERA" : "Tiny house Europe FAQ: permits, delivery, customs & buying | MODUNERA";
  const description = isDe ? `${all.length} Antworten für Tiny-House-Projekte in Deutschland, Niederlande, Dänemark, Luxemburg und Schweiz.` : `${all.length} answers for tiny-house projects in Germany, Netherlands, Denmark, Luxembourg and Switzerland.`;
  return head({ file, lang, title, description, alternateDe: BASE + "faq/europa/", alternateEn: BASE + "en/faq/", schema: [faqSchema(all)] }) + nav(root, lang) + `<main id="main"><header class="page-hero"><div class="container"><div class="eyebrow">${isDe ? "Länder & Export" : "Countries & export"}</div><h1>${isDe ? "Tiny House Europa FAQ" : "Tiny house Europe FAQ"}</h1><p>${esc(description)}</p></div></header><section class="section"><div class="container faq-layout"><aside class="faq-controls"><div class="answer-box"><strong>${isDe ? "Hinweis" : "Note"}</strong><p>${isDe ? "Allgemeine Informationen ersetzen keine lokale Behörden-, Rechts-, Steuer-, Statik- oder Energieberatung." : "General information does not replace local authority, legal, tax, structural or energy advice."}</p></div><a class="btn btn-primary" href="${waLink(isDe ? "Hallo MODUNERA, ich habe eine Frage zu meinem Tiny-House-Projekt in __." : "Hello MODUNERA, I have a question about my tiny-house project in __.")}" target="_blank" rel="noopener">WhatsApp</a></aside><div class="faq-list">${faqMarkup(all)}</div></div></section></main>` + footer(root, lang);
}

function englishHome() {
  const file = "en/index.html";
  const root = "../";
  const title = "Premium tiny houses for Europe | MODUNERA";
  const description = "Eight premium tiny-house models, bespoke interiors and delivery quoted per project to Germany, Netherlands, Denmark, Luxembourg and Switzerland.";
  const countries = Object.values(COUNTRIES).map((country) => `<a class="state-card" href="countries/${country.enSlug}/"><span>Local guidance</span><h3>${esc(country.en)}</h3><p>Rules, delivery, regions and WhatsApp project check</p></a>`).join("");
  const services = SERVICE_PAGES.map((service) => `<a class="journey-card" href="services/${service.enSlug}/"><div><h3>${esc(service.en)}</h3><p>${esc(service.enIntro)}</p></div><span class="arrow">↗</span></a>`).join("");
  return head({ file, lang: "en", title, description, image: "hero-forest.webp", alternateDe: BASE, alternateEn: BASE + "en/", schema: [{ "@context": "https://schema.org", "@type": "WebPage", name: title, url: BASE + "en/", description }, { "@context": "https://schema.org", "@type": "Organization", name: "MODUNERA", url: BASE, telephone: PHONE_DISPLAY, logo: BASE + "assets/brand/modunera-master-logo-mountain-v1-600.png", areaServed: ["DE", "NL", "DK", "LU", "CH"] }] }) + nav(root, "en") + `<main id="main"><header class="hero"><div class="hero-media"></div><div class="hero-grain"></div><div class="container hero-content"><div class="hero-panel"><div class="hero-kicker">Manufactured in Türkiye · Planned for Europe</div><h1>Tiny houses:<br>small footprint, <em>more freedom.</em></h1><p>Architecturally distinctive tiny houses from our own production, individually configured for year-round private, hospitality and investment projects.</p><div class="hero-actions"><a class="btn btn-primary" href="${waLink("Hello MODUNERA. Destination country/place: __. Intended use: __. Occupants: __. Budget: __. Please send an initial assessment.")}" target="_blank" rel="noopener">Fast WhatsApp quote</a><a class="btn btn-outline" href="../studio/">Open design studio</a></div><div class="hero-proof"><span>8 models</span><span>Bespoke furniture</span><span>Five target markets</span></div></div></div></header><section class="section" id="models"><div class="container"><div class="section-header"><div><div class="eyebrow">Tiny house first</div><h2>Eight starting points. One project built around you.</h2></div><p>Choose by use, people, privacy, style and investment goal. Layout, facade, services and furniture are specified as one product.</p></div><div class="model-highlight"><img src="../assets/images/gallery/mc1-exterior.webp" alt="MODUNERA tiny house"><div><span class="model-label">MD 1–MD 8</span><h3>Private living, holiday rental, office or hospitality.</h3><p>Four-season specification, integrated furniture, energy options and logistics are reviewed for the destination.</p><a class="btn btn-primary" href="../studio/">Configure a model →</a></div></div></div></section><section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">Target markets</div><h2>Country guidance that leads to action.</h2></div><p>Local pages give a useful starting point while keeping authority approval and project feasibility clearly separated.</p></div><div class="state-grid">${countries}</div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Beyond tiny houses</div><h2>Additional production capabilities.</h2></div><p>Tiny houses remain our core business. Related structures and furniture support larger private and commercial projects.</p></div><div class="journey-grid">${services}</div></div></section><section class="section section-dark"><div class="container"><div class="section-header"><div><div class="eyebrow">Fast qualification</div><h2>Send five facts. Get a clearer next step.</h2></div><p>Destination, intended use, occupants, preferred size and budget are enough to start a structured preliminary review.</p></div><a class="btn btn-sand" href="${waLink("Hello MODUNERA. Destination: __. Use: __. Occupants: __. Size/model: __. Budget: __.")}" target="_blank" rel="noopener">Start on WhatsApp</a></div></section></main>` + footer(root, "en");
}

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", ".github", "node_modules"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

async function updateExistingText() {
  const files = await walk(ROOT);
  let changed = 0;
  const genericDeWa = waLink("Hallo MODUNERA, ich interessiere mich für ein Tiny House. Bitte kontaktieren Sie mich.");
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(extname(file).toLowerCase())) continue;
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    if (["tools/rebrand-modunera.mjs", "tools/build-modunera-europe.mjs"].includes(rel)) continue;
    const original = await readFile(file, "utf8");
    let next = original
      .replaceAll("modunera-logo.svg", "modunera-logo.png")
      .replace(/<meta name="theme-color" content="#[0-9a-fA-F]{6}">/g, '<meta name="theme-color" content="#3A5A40">')
      .replaceAll('href="https://wa.me/905535435342"', `href="${genericDeWa}"`);
    if (extname(file).toLowerCase() === ".html" && !/<link rel="canonical" href="[^"]+">/.test(next)) {
      next = next.replace("</head>", `<link rel="canonical" href="${canonicalFor(rel)}"></head>`);
    }
    if (["admin-demo/index.html", "customer-portal/index.html", "saved-designs/index.html", "booking/index.html"].includes(rel)) {
      next = next.replace(/<meta name="robots" content="[^"]+">/g, "");
      next = next.replace("</head>", '<meta name="robots" content="noindex,nofollow"></head>');
    }
    if (rel === "index.html") {
      const germanyLocationLink = '<a href="standorte/"><span>Deutschland</span><small>Lokale Seiten</small></a>';
      const europeExpansionLinks = '<a href="laender/"><span>Europa</span><small>5 Zielmärkte</small></a><a href="leistungen/"><span>Weitere Bauten</span><small>Modul, Stahl, Container, Bungalow, Möbel</small></a>';
      next = next.replace('areaServed":["DE","AT","CH","NL","BE","FR","SE","NO","DK","FI"]', 'areaServed":["DE","NL","DK","LU","CH"]');
      next = next.replace('<a class="btn btn-outline" href="#modelle">Modelle entdecken</a>', `<a class="btn btn-outline" href="${waLink("Hallo MODUNERA. Zielland/Ort: __. Nutzung: __. Personen: __. Budget: __. Bitte senden Sie mir eine Ersteinschätzung.")}" target="_blank" rel="noopener">WhatsApp-Projektcheck</a>`);
      next = next.replaceAll(europeExpansionLinks, "");
      next = next.replace(germanyLocationLink, germanyLocationLink + europeExpansionLinks);
      if (!next.includes('id="europe-markets"')) {
        const section = `<section class="section section-soft" id="europe-markets"><div class="container"><div class="section-header"><div><div class="eyebrow">Deutschland · Niederlande · Dänemark · Luxemburg · Schweiz</div><h2>Fünf Märkte. Ein direkter Projektstart.</h2></div><p>Länder-Landingpages verbinden lokale Suchintention, Genehmigungsorientierung, Transport und regionale Seiten mit einer vorbefüllten WhatsApp-Anfrage.</p></div><div class="state-grid">${Object.values(COUNTRIES).map((country) => `<a class="state-card" href="laender/${country.deSlug}/"><span>Tiny House</span><h3>${country.de}</h3><p>Regionen, Recht, Lieferung & FAQ</p></a>`).join("")}</div><div class="answer-box"><strong>Für schnelle Rückmeldung</strong><p>Senden Sie Zielland/Ort, Nutzung, Personenanzahl, Wunschmodell oder Größe und Budget. Damit kann die erste technische und logistische Einordnung sofort beginnen.</p></div></div></section>`;
        next = next.replace('<section class="section section-soft" id="modelle">', section + '<section class="section section-soft" id="modelle">');
      }
      if (!next.includes('id="extended-production"')) {
        const section = `<section class="section" id="extended-production"><div class="container"><div class="section-header"><div><div class="eyebrow">Tiny House bleibt Hauptgeschäft</div><h2>Mehr Möglichkeiten aus derselben Fertigung.</h2></div><p>Für größere oder ergänzende Projekte bieten wir auch Modulbau, Stahlkonstruktionen, Containerbau, Bungalows und maßgefertigte Möbel.</p></div><div class="journey-grid">${SERVICE_PAGES.map((service, index) => `<a class="journey-card" href="leistungen/${service.slug}/"><div><span class="num">0${index + 1}</span><h3>${service.de}</h3><p>${service.deIntro}</p></div><span class="arrow">↗</span></a>`).join("")}</div></div></section>`;
        next = next.replace('<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">MODUNERA Academy</div>', section + '<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">MODUNERA Academy</div>');
      }
    }
    if (rel === "downloads/index.html") {
      next = next.replace(/<a class="btn btn-outline" href="mc-tiny-germany-broschuere\.pdf" download>PDF herunterladen<\/a>/g, '<button class="btn btn-outline" disabled>PDF-Broschüre wird aktualisiert</button>');
    }
    if (next !== original) {
      await writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  return changed;
}

async function updateBrandCss() {
  const file = join(ROOT, "assets/css/styles.css");
  const designSystem = await readFile(join(ROOT, "tools/design-system-v2.css"), "utf8");
  let css = await readFile(file, "utf8");
  // the brand claim is set in a handwriting face, so it joins the existing request
  css = css.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);/,
    "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&display=swap');");
  css = css.replace(/\/\* MODUNERA BRAND PALETTE START \*\/[\s\S]*?\/\* MODUNERA BRAND PALETTE END \*\//g, "").trimEnd();
  css += `\n\n/* MODUNERA BRAND PALETTE START */\n${designSystem.trim()}\n/* MODUNERA BRAND PALETTE END */\n`;
  await writeFile(file, css, "utf8");
}

async function buildSearchData(markets) {
  const original = JSON.parse(await readFile(join(ROOT, "data/locations.json"), "utf8"));
  const compact = original.map((place) => ({ n: place.name, s: place.state, c: "DE", u: `/${place.path}` }));
  for (const [code, market] of Object.entries(markets)) for (const region of market.regions) for (const city of region.cities) compact.push({ n: city.name, s: `${region.display}, ${market.country.de}`, c: code, u: `/${locationPaths(city).de.replace(/index\.html$/, "")}` });
  await put("assets/js/locations-data.js", `window.MODUNERA_LOCATIONS=${JSON.stringify(compact)};window.MC_LOCATIONS=window.MODUNERA_LOCATIONS;\n`);
  await put("data/europe-locations.json", JSON.stringify(Object.fromEntries(Object.entries(markets).map(([code, market]) => [code, { country: market.country.de, regions: market.regions.map((region) => ({ name: region.display, slug: region.slug, count: region.cities.length })), count: market.count }])), null, 2) + "\n");
}

async function buildSitemaps() {
  const all = await walk(ROOT, []);
  const skip = new Set(["admin-demo", "customer-portal", "saved-designs", "booking"]);
  const urls = all.filter((file) => file.endsWith("index.html")).map((file) => relative(ROOT, file).replaceAll("\\", "/")).filter((rel) => !skip.has(rel.split("/")[0])).map((rel) => canonicalFor(rel)).sort();
  const dir = join(ROOT, "sitemaps");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const chunks = [];
  for (let i = 0; i < urls.length; i += 2000) chunks.push(urls.slice(i, i + 2000));
  const names = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const name = `sitemap-${String(i + 1).padStart(4, "0")}.xml`;
    names.push(name);
    const body = chunks[i].map((url) => `<url><loc>${esc(url)}</loc><lastmod>${UPDATED}</lastmod><changefreq>${url.includes("/blog/") || url.includes("/guides/") ? "monthly" : "weekly"}</changefreq><priority>${url === BASE ? "1.0" : url.includes("/standorte/") || url.includes("/locations/") ? "0.6" : "0.8"}</priority></url>`).join("");
    await put(`sitemaps/${name}`, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  }
  await put("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${names.map((name) => `<sitemap><loc>${BASE}sitemaps/${name}</loc><lastmod>${UPDATED}</lastmod></sitemap>`).join("")}</sitemapindex>`);
  return { urls: urls.length, sitemaps: names.length };
}

async function writeSupportingFiles(markets, counts) {
  await put("site.webmanifest", JSON.stringify({ name: "MODUNERA", short_name: "MODUNERA", description: "Premium tiny houses and modular living for Europe", start_url: "/", display: "standalone", background_color: "#faf8f5", theme_color: "#C29B72", icons: [{ src: "/assets/brand/modunera-mark-v1.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }] }, null, 2) + "\n");
  await put("robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin-demo/\nDisallow: /customer-portal/\nSitemap: ${BASE}sitemap.xml\nSitemap: ${BASE}image-sitemap.xml\n`);
  await put("llms.txt", `# MODUNERA\n\nMODUNERA manufactures premium tiny houses in Türkiye for projects in Germany, the Netherlands, Denmark, Luxembourg and Switzerland. Tiny houses are the core offer; modular buildings, steel structures, bungalows and bespoke furniture are additional project-based capabilities.\n\n## Primary pages\n- ${BASE}\n- ${BASE}en/\n- ${BASE}laender/\n- ${BASE}en/countries/\n- ${BASE}leistungen/\n- ${BASE}blog/europa/\n- ${BASE}faq/europa/\n\n## Contact\n- Phone and WhatsApp: ${PHONE_DISPLAY}\n\n## Editorial boundary\nCountry, permit, customs and transport content is general guidance reviewed on ${UPDATED}. It does not replace current authority, legal, customs, tax, structural or energy advice. Project approval and deliverability are confirmed only after document, site and route checks.\n`);
  await put("data/market-research.json", JSON.stringify({ reviewed_at: UPDATED, target_markets: Object.keys(COUNTRIES), competitor_markets: { Poland: { observed_strengths: ["established European delivery", "mature model ranges", "public warranty propositions"], examples: ["REDUKT", "Aurora Company", "Mobi House"] }, Romania: { observed_strengths: ["experienced export manufacturers", "four-season positioning", "custom and hospitality offers"], examples: ["Eco Tiny House", "Kubo TinyHouse", "Solido"] } }, modunera_positioning: ["tiny-house core offer with eight base models", "own production", "integrated bespoke furniture", "digital configuration and tools", "country and local landing architecture", "structured WhatsApp qualification"], policy: "Use verifiable differentiators; do not publish unsupported blanket superiority claims.", sources: ["https://redukt.eu/en/", "https://auroracompany.pl/en/", "https://mobihouse.pl/en", "https://kubo-tinyhouse.com/en/", "https://www.ecotiny.house/", ...Object.values(SOURCE_URLS)] }, null, 2) + "\n");
  await put("build-report-modunera.json", JSON.stringify({ generated_at: UPDATED, brand: "MODUNERA", domain: BASE, core_business: "Tiny houses", target_markets: Object.fromEntries(Object.entries(markets).map(([code, market]) => [code, { regions: market.regions.length, locations: market.count }])), generated_location_pages: counts.locationPages, generated_country_pages: 10, generated_service_pages: 10, generated_guide_pages: 16, sitemap_urls: counts.sitemap.urls, sitemap_files: counts.sitemap.sitemaps, whatsapp: PHONE_TEL, colors: { beige: "#C29B72", terracotta: "#8D321F", olive: "#3A4027", charcoal: "#2B2D31" } }, null, 2) + "\n");
}

async function main() {
  const source = JSON.parse(await readFile(join(ROOT, "data/europe-locations-source.json"), "utf8"));
  const changedExisting = await updateExistingText();
  await updateBrandCss();
  const markets = buildLocations(source);
  let locationPages = 0;

  for (const [code, market] of Object.entries(markets)) {
    for (const region of market.regions) {
      await put(`standorte/${market.country.locationSlug}/${region.slug}/index.html`, regionPage(market, region, "de"));
      await put(`en/locations/${market.country.enSlug}/${region.slug}/index.html`, regionPage(market, region, "en"));
      for (const city of region.cities) {
        const paths = locationPaths(city);
        await put(paths.de, locationPage(city, "de"));
        await put(paths.en, locationPage(city, "en"));
        locationPages += 2;
      }
    }
    await put(`laender/${market.country.deSlug}/index.html`, countryPage(code, market, "de"));
    await put(`en/countries/${market.country.enSlug}/index.html`, countryPage(code, market, "en"));
  }

  await put("laender/deutschland/index.html", countryPage("DE", null, "de"));
  await put("en/countries/germany/index.html", countryPage("DE", null, "en"));
  await put("laender/index.html", countriesIndex("de", markets));
  await put("en/countries/index.html", countriesIndex("en", markets));
  for (const service of SERVICE_PAGES) {
    await put(`leistungen/${service.slug}/index.html`, servicePage(service, "de"));
    await put(`en/services/${service.enSlug}/index.html`, servicePage(service, "en"));
  }
  await put("leistungen/index.html", servicesIndex("de"));
  await put("en/services/index.html", servicesIndex("en"));
  for (const code of Object.keys(COUNTRIES)) {
    await put(`blog/europa/tiny-house-${COUNTRIES[code].deSlug}-genehmigung/index.html`, guidePage(code, "de"));
    await put(`en/guides/tiny-house-${COUNTRIES[code].enSlug}-permits/index.html`, guidePage(code, "en"));
  }
  await put("blog/europa/tiny-house-transport-tuerkei-europa/index.html", transportGuide("de"));
  await put("en/guides/tiny-house-transport-turkiye-europe/index.html", transportGuide("en"));
  await put("blog/europa/tiny-house-hersteller-polen-rumaenien-tuerkei-vergleich/index.html", competitorGuide("de"));
  await put("en/guides/tiny-house-manufacturers-poland-romania-turkiye-comparison/index.html", competitorGuide("en"));
  await put("blog/europa/index.html", guidesIndex("de"));
  await put("en/guides/index.html", guidesIndex("en"));
  await put("faq/europa/index.html", europeFaqPage("de"));
  await put("en/faq/index.html", europeFaqPage("en"));
  await put("en/index.html", englishHome());
  await buildSearchData(markets);
  const sitemap = await buildSitemaps();
  await writeSupportingFiles(markets, { locationPages, sitemap });

  const expected = ["laender/niederlande/index.html", "en/countries/netherlands/index.html", "leistungen/moebel-nach-mass/index.html", "blog/europa/tiny-house-transport-tuerkei-europa/index.html", "faq/europa/index.html", "assets/brand/modunera-master-logo-mountain-v1-600.png", "assets/images/modunera-mark.png"];
  for (const file of expected) await stat(join(ROOT, file));
  console.log(JSON.stringify({ brand: "MODUNERA", changedExisting, locationPages, countryPages: 10, servicePages: 10, guidesAndFaq: 18, sitemap }));
}

await main();
