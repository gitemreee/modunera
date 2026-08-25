#!/usr/bin/env node
/* Puts the real photographs on the pages where a reader is entitled to see one.

   Three pages make a claim that a render cannot support. /factory/ says this is
   how we build; /projects/ says these are projects we have delivered; /qualitaet/
   says this is the material and the workmanship. All three were illustrated with
   model renders, which are honest as designs and dishonest as evidence.

   No generator owns those pages — they are the last of the HTML baked by the
   retired tools/generate_scale_v3.py, which is why the pipeline never refreshed
   their imagery. Rather than resurrect that script, this replaces named image
   references on named pages, from the mapping below.

   Rules it keeps:

     - a replacement is applied only where the exact old reference is found, so a
       page that has already been updated is left alone and the pass is idempotent;
     - alt text comes from data/site-photos.json, which is written by hand per
       photograph — the alt text on these pages described a render and would have
       described the wrong picture afterwards;
     - width and height are rewritten to the real intrinsic size of the new file,
       because a stale aspect ratio is worse than none: the browser reserves the
       wrong box and the layout shifts anyway.

   Renders are not removed from the site. They keep the job they are good at —
   illustrating the eight models — on /modelle/, /katalog/ and the model pages.

   Usage: node tools/build-photo-placement.mjs
*/
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const PHOTOS = JSON.parse(await readFile(join(ROOT, "data/site-photos.json"), "utf8")).photos;
const byName = Object.fromEntries(PHOTOS.map((p) => [p.name, p]));

/* page -> [old gallery file, new photograph name] */
const PLACEMENTS = {
  "factory/index.html": [
    // "from steel to handover" — illustrated by a finished model render
    ["mc6-exterior.webp", "production-cladding"],
    ["mc2-kitchen.webp", "production-frame-and-finish"],
  ],
  "projects/index.html": [
    ["nature-pool.webp", "aframe-lawn"],
    ["mc2-exterior.webp", "aframe-olive-grove"],
    ["mc7-interior.webp", "interior-kitchen-desk"],
    ["mc1-living.webp", "interior-loft-stair"],
  ],
  // /qualitaet/ carries no photograph at all — a hero, twelve benefit cards and
  // a call to action. A page about material and workmanship with no picture of
  // either is the one case here that needs a section added rather than an image
  // swapped, so it is handled by INSERTIONS below.
};

/* page -> { anchor, html } — a section inserted immediately before `anchor`,
   built from markup the design system already styles (wide-feature / visual /
   wide-copy, as used on the country pages). Idempotent: the insertion is skipped
   when its marker is already present. */
const INSERTIONS = {
  "qualitaet/index.html": {
    marker: "data-photo-section=\"workmanship\"",
    anchor: '<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">Qualitätsprozess</div>',
    photo: "interior-wood",
    build: (img) => `<section class="section" data-photo-section="workmanship">` +
      `<div class="container wide-feature"><div class="visual">${img}</div>` +
      `<div class="wide-copy"><div class="eyebrow">Ausführung</div>` +
      `<h2>Was am Ende sichtbar bleibt.</h2>` +
      `<p>Oberflächen, Fugenbilder, Kantenabschlüsse und Anschlüsse an Küche, Treppe und ` +
      `Stauraum entstehen im selben Haus wie der Rohbau. Diese Aufnahme zeigt eine ` +
      `ausgeführte Einheit, keine Visualisierung.</p>` +
      `<p class="legal-note">Materialstärken, U-Werte und Prüfnachweise stehen im technischen ` +
      `Datenblatt zum Angebot; auf dieser Seite werden keine Werte genannt, ` +
      `die nicht belegt sind.</p></div></div></section>`,
  },
};

/* --- galleries added from the 2026-08 Drive batch --------------------------

   The swap table above has nothing left to do on these pages: the earlier pass
   already replaced every render on /factory/ and /projects/ with a photograph.
   Thirteen more photographs arrived, so what these pages need now is more room,
   not another substitution — hence a gallery section rather than a swap.

   One thing deliberately NOT done: none of these is placed on an individual model
   page. A photograph on /modelle/md-3/ says "this is an MD 3", and nobody has
   told us which model is in which frame. They go on the model index instead,
   where the claim is only that these are units MODUNERA has built. Guessing the
   model would be inventing product data to fill a layout.

   Idempotent by marker, like INSERTIONS. */
/* One page can carry more than one gallery now — /factory/ shows production AND
   transport — so this is a list of specs with a page field, not an object keyed
   by page. Each spec stays idempotent by its own marker. */
const GALLERIES = [
  {
    page: "factory/index.html",
    marker: 'data-photo-gallery="production"',
    // /factory/ has no section-soft; the gallery goes in front of the dark band
    anchor: '<section class="section section-dark">',
    eyebrow: "Aus der Fertigung",
    h2: "Fünf Aufnahmen aus dem Bau.",
    lead: "Aufnahmen aus der Halle, nicht aus dem Katalog: eine A-Frame-Einheit im Rohbau, eine Einheit auf Stützen mit montierter Aussenhaut, der Innenausbau vor dem Schliessen der Wände, und eine Küche, deren Arbeitsplatte noch Schutzfolie trägt.",
    photos: ["production-aframe-workshop", "production-hall-unit",
             "production-interior-fitout", "production-fitout-benches",
             "production-fitout-kitchen"],
  },
  {
    page: "factory/index.html",
    marker: 'data-photo-gallery="transport"',
    anchor: '<section class="section section-dark">',
    eyebrow: "Auf dem Weg",
    h2: "Vom Hof auf die Strasse.",
    lead: "Die Übergabe ist Teil der Arbeit: Einheiten auf Tandemachs-Anhängern auf dem Werksgelände, eine Einheit hinter dem Zugfahrzeug auf der Landstrasse, und zwei Einheiten, vorbereitet für eine Auslieferung mit Flaggen der Türkei und Aserbaidschans an der Fassade.",
    photos: ["transport-trailer-yard", "transport-road", "transport-export-flags",
             "unit-trailer-gable"],
  },
  {
    page: "projects/index.html",
    marker: 'data-photo-gallery="delivered"',
    anchor: '<section class="section section-soft">',
    eyebrow: "Gebaute Einheiten",
    h2: "Sechs Aufnahmen von ausgeführten Einheiten.",
    lead: "Fassaden, Terrassen und ein Fassadendetail — fotografiert auf dem Hof, auf dem Aufstellplatz und auf Messen. Keine Visualisierung, keine Renderansicht.",
    photos: ["unit-angular-dark", "unit-standing-seam", "unit-terrace-event",
             "unit-exhibition-terrace", "detail-wood-and-metal", "unit-porch-sand"],
  },
  {
    page: "modelle/index.html",
    marker: 'data-photo-gallery="built"',
    anchor: '<section class="section section-soft">',
    eyebrow: "Gebaut, nicht gerendert",
    h2: "So sehen ausgeführte Innenräume aus.",
    lead: "Die Grundrisse oben sind Zeichnungen der acht Modelle. Diese sechs Aufnahmen sind Innenräume gebauter Einheiten. Welche Aufnahme zu welchem Modell gehört, steht bewusst nicht dabei: das wäre eine Zuordnung, die wir hier nicht belegen können.",
    photos: ["interior-stair-sofa", "interior-kitchen-oven", "interior-living-tv",
             "interior-loft-ladder", "interior-door-kitchen", "interior-tall-loft"],
  },
];

/* The gallery derivative each placement should point at, and its real size. */
function derivative(name) {
  const photo = byName[name];
  if (!photo) return null;
  const wide = photo.files.find((f) => f.file.endsWith("-1200.webp"))
    ?? photo.files.find((f) => f.file.endsWith("-1100.webp"));
  if (!wide) return null;
  const [w, h] = wide.px.split("x").map(Number);
  return { file: wide.file, w, h, alt: photo.alt_de };
}

const esc = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

let pagesChanged = 0;
let swaps = 0;
const missing = [];

for (const [page, list] of Object.entries(PLACEMENTS)) {
  const file = join(ROOT, page);
  if (!existsSync(file)) { missing.push(page); continue; }
  const original = await readFile(file, "utf8");
  let html = original;

  for (const [oldFile, name] of list) {
    const target = derivative(name);
    if (!target) { missing.push(`${page}: ${name}`); continue; }

    // Rewrite the whole tag, not just the src: the alt described the render and
    // the dimensions belonged to it.
    const pattern = new RegExp(
      `<img\\b[^>]*src="([^"]*?)assets/images/gallery/${oldFile.replace(".", "\\.")}"[^>]*>`, "g");
    html = html.replace(pattern, (tag, prefix) => {
      swaps += 1;
      const keep = (name) => (tag.match(new RegExp(`\\s${name}="[^"]*"`)) ?? [""])[0];
      return `<img${keep("decoding")}${keep("loading")}${keep("fetchpriority")}` +
        ` width="${target.w}" height="${target.h}"` +
        ` src="${prefix}${target.file}" alt="${esc(target.alt)}">`;
    });
  }

  if (html !== original) {
    await writeFile(file, html, "utf8");
    pagesChanged += 1;
  }
}

/* The share card is the page's public face. A page whose body now shows a real
   photograph but whose og:image still points at a render posts the render to
   every social preview, which is the one place the picture is seen without any
   surrounding context. page -> the photograph its card should use. */
const SHARE_CARDS = {
  "factory/index.html": "production-cladding",
  "projects/index.html": "aframe-olive-grove",
  "qualitaet/index.html": "interior-wood",
};

let cardsChanged = 0;
for (const [page, name] of Object.entries(SHARE_CARDS)) {
  const file = join(ROOT, page);
  if (!existsSync(file)) { missing.push(page); continue; }
  const target = derivative(name);
  if (!target) { missing.push(`${page}: ${name}`); continue; }
  const original = await readFile(file, "utf8");
  const absolute = `https://modunera.com/${target.file}`;
  let html = original;

  if (/<meta (?:property="og:image"|name="twitter:image")/.test(html)) {
    // repoint an existing card away from the render
    html = html.replace(
      /(<meta (?:property="og:image"|name="twitter:image") content=")https:\/\/modunera\.com\/assets\/images\/gallery\/[^"]*(")/g,
      `$1${absolute}$2`);
  } else {
    /* These pages carry no Open Graph at all — shared anywhere, they render as a
       bare link. The audit counted 17 such pages; these three are the ones that
       now have a photograph worth showing, so they get a full card built from the
       title and description already in the head. */
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) ?? [, ""])[1].trim();
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) ?? [, ""])[1];
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) ?? [, ""])[1];
    if (!title || !canonical) { missing.push(`${page}: no title or canonical to build a card from`); continue; }
    const card =
      `<meta property="og:type" content="website">` +
      `<meta property="og:title" content="${esc(title)}">` +
      (desc ? `<meta property="og:description" content="${esc(desc)}">` : "") +
      `<meta property="og:url" content="${esc(canonical)}">` +
      `<meta property="og:image" content="${absolute}">` +
      `<meta name="twitter:card" content="summary_large_image">` +
      `<meta name="twitter:image" content="${absolute}">`;
    html = html.replace(/(<link rel="canonical"[^>]*>)/, `$1${card}`);
  }

  if (html !== original) {
    await writeFile(file, html, "utf8");
    cardsChanged += 1;
  }
}

let sectionsAdded = 0;
let galleriesAdded = 0;
for (const spec of GALLERIES) {
  const page = spec.page;
  const file = join(ROOT, page);
  if (!existsSync(file)) { missing.push(page); continue; }
  const html = await readFile(file, "utf8");

  const cards = spec.photos.map((name) => {
    const t = derivative(name);
    if (!t) { missing.push(`${page}: ${name}`); return ""; }
    return `<figure class="gallery-item"><img loading="lazy" decoding="async"` +
      ` width="${t.w}" height="${t.h}" src="../${t.file}" alt="${esc(t.alt)}"></figure>`;
  }).join("");
  if (!cards) { missing.push(`${page}: no usable photograph`); continue; }

  const block = `<section class="section" ${spec.marker}><div class="container">` +
    `<div class="section-header"><div><div class="eyebrow">${esc(spec.eyebrow)}</div>` +
    `<h2>${esc(spec.h2)}</h2></div><p>${esc(spec.lead)}</p></div>` +
    `<div class="gallery-grid">${cards}</div></div></section>`;

  /* A gallery already on the page is REPLACED, not skipped. Skipping froze the
     first version forever: the photo lists changed for batch 2 and the pages
     kept showing the old ones, because "marker present" was read as "done".
     Replacing is what lets an edit to the list above reach the built page —
     the same lesson the WhatsApp dock pass already carries. Idempotent all the
     same: regenerating an unchanged spec produces byte-identical HTML. */
  let next;
  if (html.includes(spec.marker)) {
    const re = new RegExp(`<section class="section" ${spec.marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>[\\s\\S]*?</section>`);
    next = html.replace(re, block);
  } else {
    if (!html.includes(spec.anchor)) { missing.push(`${page}: gallery anchor not found`); continue; }
    next = html.replace(spec.anchor, block + spec.anchor);
  }
  if (next !== html) {
    await writeFile(file, next, "utf8");
    galleriesAdded += 1;
    pagesChanged += 1;
  }
}

for (const [page, spec] of Object.entries(INSERTIONS)) {
  const file = join(ROOT, page);
  if (!existsSync(file)) { missing.push(page); continue; }
  const html = await readFile(file, "utf8");
  if (html.includes(spec.marker)) continue;          // already inserted
  const target = derivative(spec.photo);
  if (!target) { missing.push(`${page}: ${spec.photo}`); continue; }
  if (!html.includes(spec.anchor)) { missing.push(`${page}: anchor not found`); continue; }
  const img = `<img loading="lazy" decoding="async" width="${target.w}" height="${target.h}"` +
    ` src="../${target.file}" alt="${esc(target.alt)}">`;
  await writeFile(file, html.replace(spec.anchor, spec.build(img) + spec.anchor), "utf8");
  sectionsAdded += 1;
  pagesChanged += 1;
}

console.log(JSON.stringify({
  pages_changed: pagesChanged,
  images_replaced: swaps,
  sections_added: sectionsAdded,
  galleries_added: galleriesAdded,
  share_cards_repointed: cardsChanged,
  unresolved: missing,
}));
if (missing.length) process.exitCode = 1;
