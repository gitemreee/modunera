#!/usr/bin/env node
/* /tiny-house-leben/ — the long-form landing page "Leben im Tiny House".

   One page, its own art direction: the visitor scrolls through a single day,
   from the blue hour before sunrise to the night sky over the enquiry form.
   The copy and every figure live in data/tiny-leben.json, prices in
   data/pricing.json, model names in data/models.json, photographs in
   data/site-photos.json. This file only turns them into markup and draws the
   illustrations (landscape, exploded house, route, seasons) as inline SVG.

   The page deliberately carries no <nav class="nav">: build-modunera-v2 and
   build-shell-v3 recognise the shared chrome by that element and leave this
   page alone. Its CSS and JS are self-contained in assets/leben/.

   Deterministic: every "random" shape comes from a seeded generator, so a
   second run writes the identical file (the pipeline must be idempotent).

   Usage: node tools/build-tiny-leben.mjs
*/
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com";
const read = async (p) => JSON.parse(await readFile(join(ROOT, p), "utf8"));

const copy = await read("data/tiny-leben.json");
const pricing = await read("data/pricing.json");
const models = await read("data/models.json");
const photos = (await read("data/site-photos.json")).photos;

const ROUTE = copy.route;
const OUT = join(ROOT, ROUTE, "index.html");
const UP = "../"; // the page sits one level below the root

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const eur = (n) => `${new Intl.NumberFormat("de-DE").format(n)} €`;
const num = (n, d = 0) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const r1 = (n) => Math.round(n * 10) / 10;

/* --- seeded randomness ------------------------------------------------------ */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --- image helpers ----------------------------------------------------------- */
function webpSize(file) {
  const b = readFileSync(join(ROOT, file));
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === "VP8L") { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  throw new Error(`build-tiny-leben: cannot read size of ${file}`);
}
const photo = (name) => {
  const p = photos.find((x) => x.name === name);
  if (!p) throw new Error(`build-tiny-leben: unknown photo ${name}`);
  const land = p.files.filter((f) => !f.file.includes("portrait"));
  const small = land.find((f) => f.file.endsWith("-760.webp"));
  const large = land.find((f) => !f.file.endsWith("-760.webp")) ?? small;
  return { alt: p.alt_de, small, large, w: Number(large.px.split("x")[0]), h: Number(large.px.split("x")[1]) };
};
function photoImg(name, sizes, cls = "") {
  const p = photo(name);
  const sw = Number(p.small.px.split("x")[0]);
  return `<img${cls ? ` class="${cls}"` : ""} src="${UP}${p.large.file}" srcset="${UP}${p.small.file} ${sw}w, ${UP}${p.large.file} ${p.w}w" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async">`;
}

/* --- models ------------------------------------------------------------------ */
const modelRows = models.map((m) => {
  const n = m.id.replace("md-", "");
  const key = `mc${n}`;
  const price = pricing.models[key]?.base_eur;
  if (!price) throw new Error(`build-tiny-leben: no price for ${key}`);
  const small = `assets/images/gallery/${key}-exterior-900.webp`;
  const big = `assets/images/gallery/${key}-exterior.webp`;
  const file = existsSync(join(ROOT, small)) ? small : big;
  const [w, h] = webpSize(file);
  return {
    n, key, name: m.name, price, file, w, h,
    lengths: pricing.models[key].lengths,
    layout: pricing.models[key].layout_de,
    focus: pricing.models[key].focus_de,
    use: pricing.models[key].use_de,
    positioning: m.positioning,
    tags: copy.model_tags[key] ?? [],
  };
});
const prices = modelRows.map((m) => m.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const deliveryDE = pricing.delivery?.DE?.eur;
if (!deliveryDE) throw new Error("build-tiny-leben: data/pricing.json has no delivery.DE.eur");
const fill = (s) => s.replace("{minPrice}", eur(minPrice)).replace("{maxPrice}", eur(maxPrice)).replace("{deliveryDE}", eur(deliveryDE));

/* =============================================================================
   1  HERO LANDSCAPE — viewBox 1600×1000, five parallax layers
   ========================================================================== */
function ridge(seed, base, amp, step = 20) {
  const R = rng(seed);
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28];
  const fn = (x) => base
    + amp * 0.55 * Math.sin(x * 0.0021 + ph[0])
    + amp * 0.3 * Math.sin(x * 0.0057 + ph[1])
    + amp * 0.15 * Math.sin(x * 0.0131 + ph[2]);
  let d = `M-100 1100 L-100 ${r1(fn(-100))}`;
  for (let x = -100; x <= 1700; x += step) d += ` L${x} ${r1(fn(x))}`;
  return { d: `${d} L1700 1100 Z`, fn };
}
function forestPath(seed, fn, minH, maxH) {
  const R = rng(seed);
  let d = "";
  for (let x = -80; x < 1700; x += 9 + R() * 16) {
    const h = minH + R() * (maxH - minH);
    const w = h * (0.28 + R() * 0.1);
    const y = fn(x) + 6;
    // three tiers of a spruce, drawn as one polygon
    d += `M${r1(x)} ${r1(y - h)}`
      + ` L${r1(x + w * 0.42)} ${r1(y - h * 0.62)} L${r1(x + w * 0.26)} ${r1(y - h * 0.62)}`
      + ` L${r1(x + w * 0.72)} ${r1(y - h * 0.3)} L${r1(x + w * 0.5)} ${r1(y - h * 0.3)}`
      + ` L${r1(x + w)} ${r1(y)} L${r1(x - w)} ${r1(y)}`
      + ` L${r1(x - w * 0.5)} ${r1(y - h * 0.3)} L${r1(x - w * 0.72)} ${r1(y - h * 0.3)}`
      + ` L${r1(x - w * 0.26)} ${r1(y - h * 0.62)} L${r1(x - w * 0.42)} ${r1(y - h * 0.62)} Z`;
  }
  return d;
}
function grassPath(seed, fn, count, hMin, hMax) {
  const R = rng(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = -60 + R() * 1720;
    const y = fn(x) + 4;
    const h = hMin + R() * (hMax - hMin);
    const lean = (R() - 0.5) * h * 0.6;
    d += `M${r1(x - 2.2)} ${r1(y)} Q${r1(x + lean * 0.4)} ${r1(y - h * 0.6)} ${r1(x + lean)} ${r1(y - h)} Q${r1(x + lean * 0.3 + 1.2)} ${r1(y - h * 0.5)} ${r1(x + 2.2)} ${r1(y)} Z`;
  }
  return d;
}
function stars(seed, n) {
  const R = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = r1(R() * 1600), y = r1(R() * 560), rr = r1(0.5 + R() * R() * 1.9);
    out += `<circle cx="${x}" cy="${y}" r="${rr}"${R() > 0.82 ? ' class="tw"' : ""}/>`;
  }
  return out;
}

/* The tiny house, front elevation, local coordinates (0,0 top-left of the body). */
function heroHouse(cls = "hh") {
  const clad = [];
  for (let x = 6; x < 340; x += 11) clad.push(`M${x} ${r1(52 - x * 0.0647 + 2)}V188`);
  return `<g class="h-house ${cls}">
  <ellipse class="h-spill" cx="150" cy="214" rx="300" ry="40" fill="url(#hSpill)"/>
  <path class="h-roof" d="M-22 58 L362 26 L362 40 L-22 72 Z"/>
  <path class="h-wall" d="M0 66 L340 38 L340 190 L0 190 Z"/>
  <path class="h-clad" d="${clad.join("")}"/>
  <g class="h-glass">
    <rect x="28" y="84" width="150" height="96" rx="2"/>
    <rect x="204" y="80" width="40" height="58" rx="2"/>
    <rect x="270" y="74" width="48" height="116" rx="2"/>
  </g>
  <g class="h-light">
    <rect x="28" y="84" width="150" height="96" rx="2"/>
    <rect x="204" y="80" width="40" height="58" rx="2"/>
    <rect x="270" y="74" width="48" height="116" rx="2"/>
  </g>
  <g class="h-inside">
    <path d="M86 84 V104"/><circle cx="86" cy="110" r="7"/>
    <path d="M140 180 q-4 -26 6 -40 q8 14 2 40 Z M134 180 q-10 -18 -2 -30 q6 12 6 30 Z"/>
    <rect x="44" y="150" width="58" height="22" rx="6"/>
  </g>
  <path class="h-frame" d="M28 84h150v96H28z M103 84v96 M204 80h40v58h-40z M270 74h48v116h-48z"/>
  <path class="h-deck" d="M-40 190 H386 V200 H-40 Z"/>
  <path class="h-posts" d="M-30 200v18M70 200v18M170 200v18M270 200v18M376 200v18"/>
  <path class="h-string" d="M-22 70 Q20 96 70 84 Q120 100 170 80"/>
  <g class="h-bulbs"><circle cx="-6" cy="80" r="2.6"/><circle cx="22" cy="90" r="2.6"/><circle cx="48" cy="88" r="2.6"/><circle cx="96" cy="90" r="2.6"/><circle cx="126" cy="92" r="2.6"/><circle cx="152" cy="86" r="2.6"/></g>
  <path class="h-tree" d="M440 210 L440 120 M440 30 C470 40 488 70 486 100 C484 130 462 146 440 146 C418 146 396 130 394 100 C392 70 410 40 440 30 Z"/>
</g>`;
}

function heroSvg() {
  const far = ridge(7, 560, 150, 24);
  const mid = ridge(19, 660, 70, 20);
  const fr = ridge(31, 735, 34, 16);
  const meadow = ridge(43, 872, 26, 18);
  const fore = ridge(59, 972, 30, 14);
  const birds = [0, 1, 2, 3, 4].map((i) => {
    const R = rng(100 + i);
    const x = r1(i * 34 + R() * 20), y = r1(R() * 40 + (i % 2) * 14), s = r1(0.7 + R() * 0.6);
    return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 Q7 -7 14 0 Q21 -7 28 0"/>`;
  }).join("");
  return `<svg class="h-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs>
  <radialGradient id="hSun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".22" stop-color="#FFE3A1"/><stop offset=".5" stop-color="#FFC27A" stop-opacity=".45"/><stop offset="1" stop-color="#FF9E5E" stop-opacity="0"/></radialGradient>
  <radialGradient id="hSpill" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFC46B" stop-opacity=".55"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></radialGradient>
  <radialGradient id="hMist" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<g class="h-stars">${stars(3, 170)}</g>
<g class="h-sun"><circle cx="1180" cy="0" r="230" fill="url(#hSun)"/><circle class="h-sun-core" cx="1180" cy="0" r="46"/></g>
<g class="h-birds"><g>${birds}</g></g>
<g class="lyr" data-depth="0.12"><path class="h-far" d="${far.d}"/></g>
<g class="h-mist m1"><ellipse cx="500" cy="650" rx="620" ry="60" fill="url(#hMist)"/></g>
<g class="lyr" data-depth="0.28"><path class="h-mid" d="${mid.d}"/></g>
<g class="h-mist m2"><ellipse cx="1150" cy="730" rx="700" ry="56" fill="url(#hMist)"/></g>
<g class="lyr" data-depth="0.48"><path class="h-forest" d="${fr.d}"/><path class="h-forest" d="${forestPath(5, fr.fn, 50, 130)}"/></g>
<g class="h-mist m3"><ellipse cx="300" cy="820" rx="560" ry="48" fill="url(#hMist)"/></g>
<g class="lyr" data-depth="0.7"><path class="h-meadow" d="${meadow.d}"/><path class="h-meadow-grass" d="${grassPath(11, meadow.fn, 260, 6, 18)}"/>${heroHouse()}</g>
<g class="lyr" data-depth="1"><path class="h-fore" d="${fore.d}"/><path class="h-fore" d="${grassPath(13, fore.fn, 420, 20, 70)}"/></g>
</svg>`;
}

/* the night landscape under the enquiry form: same house, windows lit */
function ctaLandscape() {
  const fr = ridge(83, 820, 40, 16);
  return `<svg class="cta-land" viewBox="0 600 1600 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs><radialGradient id="cSpill" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFC46B" stop-opacity=".55"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></radialGradient></defs>
<path class="h-forest" d="${fr.d}"/><path class="h-forest" d="${forestPath(17, fr.fn, 40, 120)}"/>
<path class="h-meadow" d="M-100 1000 L-100 930 Q400 900 800 926 T1700 918 L1700 1000 Z"/>
${heroHouse("ch").replace('url(#hSpill)', 'url(#cSpill)')}
</svg>`;
}

/* =============================================================================
   2  EXPLODED HOUSE — isometric, one <g> per component, offsets in metres
   ========================================================================== */
const ISO = { c: Math.cos(Math.PI / 6), s: 0.5, S: 46 };
const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
let cur = { dx: 0, dy: 0 };
function P(x, y, z) {
  const X = (x - y) * ISO.c * ISO.S, Y = (x + y) * ISO.s * ISO.S - z * ISO.S;
  for (const [ox, oy] of [[0, 0], [cur.dx, cur.dy]]) {
    bounds.minX = Math.min(bounds.minX, X + ox); bounds.maxX = Math.max(bounds.maxX, X + ox);
    bounds.minY = Math.min(bounds.minY, Y + oy); bounds.maxY = Math.max(bounds.maxY, Y + oy);
  }
  return `${r1(X)},${r1(Y)}`;
}
const poly = (pts, cls) => `<polygon class="${cls}" points="${pts.join(" ")}"/>`;
function box(x0, y0, z0, x1, y1, z1, cls) {
  return poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], `${cls} fy`)
    + poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], `${cls} fx`)
    + poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], `${cls} ft`);
}
/* a +y face (plane y) with rectangular openings, evenodd */
function faceY(x0, x1, z0, z1, y, holes, cls) {
  const q = (a, b, c, d) => `M${P(a, y, c)} L${P(b, y, c)} L${P(b, y, d)} L${P(a, y, d)} Z`;
  return `<path class="${cls}" fill-rule="evenodd" d="${q(x0, x1, z0, z1)}${holes.map(([a, b, c, d]) => q(a, b, c, d)).join("")}"/>`;
}
function faceX(y0, y1, z0, z1, x, holes, cls) {
  const q = (a, b, c, d) => `M${P(x, a, c)} L${P(x, b, c)} L${P(x, b, d)} L${P(x, a, d)} Z`;
  return `<path class="${cls}" fill-rule="evenodd" d="${q(y0, y1, z0, z1)}${holes.map(([a, b, c, d]) => q(a, b, c, d)).join("")}"/>`;
}
const line = (pts, cls) => `<polyline class="${cls}" points="${pts.join(" ")}"/>`;
function offset(dx, dy, dz) {
  return { dx: r1((dx - dy) * ISO.c * ISO.S), dy: r1((dx + dy) * ISO.s * ISO.S - dz * ISO.S) };
}
function group(layer, off, body, badge) {
  cur = off;
  const inner = body();
  const b = badge ? `<g class="x-badge"><circle cx="${badge[0]}" cy="${badge[1]}" r="22"/><text x="${badge[0]}" y="${badge[1] + 7}">${copy.layers.findIndex((l) => l.id === layer) + 1}</text></g>` : "";
  cur = { dx: 0, dy: 0 };
  return `<g class="x-g" data-layer="${layer}" data-dx="${off.dx}" data-dy="${off.dy}">${inner}${b}</g>`;
}
const centre = (x, y, z) => { const p = P(x, y, z).split(",").map(Number); return p; };

function explodedSvg() {
  const L = 8, W = 2.55, T = 0.14, Z0 = 0.8, Z1 = 3.5;
  const winFront = [[0.9, 3.3, 1.15, 3.1], [4.6, 5.6, 1.9, 2.9], [6.05, 6.75, 1.9, 2.9]];
  const doorRight = [[0.75, 1.75, 0.86, 3.0]];
  const parts = [];

  // 7 chassis
  parts.push(group("chassis", offset(0, 0, -2.7), () => {
    let s = "";
    const wheel = (cx, y) => {
      const pts = [];
      for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; pts.push(P(cx + 0.33 * Math.cos(t), y, 0.3 + 0.33 * Math.sin(t))); }
      return poly(pts, "x-tyre");
    };
    s += wheel(3.55, 0.42) + wheel(4.35, 0.42);
    for (const [x, y] of [[0.35, 0.5], [7.55, 0.5], [0.35, 2.0], [7.55, 2.0]]) s += box(x, y, 0, x + 0.1, y + 0.1, 0.42, "x-steel2");
    s += box(0.2, 0.45, 0.35, 7.8, 0.6, 0.55, "x-steel");
    for (const x of [0.2, 1.8, 3.4, 5.0, 6.6, 7.65]) s += box(x, 0.6, 0.42, x + 0.15, 1.95, 0.52, "x-steel2");
    s += line([P(0.2, 0.55, 0.45), P(-1.15, 1.275, 0.45), P(0.2, 2.0, 0.45)], "x-bar");
    s += box(-1.35, 1.2, 0.36, -1.05, 1.35, 0.5, "x-steel");
    s += box(0.2, 1.95, 0.35, 7.8, 2.1, 0.55, "x-steel");
    s += wheel(3.55, 2.16) + wheel(4.35, 2.16);
    for (const cx of [3.55, 4.35]) s += `<circle class="x-hub" cx="${centre(cx, 2.17, 0.3)[0]}" cy="${centre(cx, 2.17, 0.3)[1]}" r="5"/>`;
    return s;
  }, centre(7.0, 2.3, 0.45)));

  // 6 floor
  parts.push(group("boden", offset(0, 0, -1.3), () => {
    let s = box(0, 0, 0.55, L, W, Z0, "x-floor");
    for (let y = 0.3; y < W; y += 0.3) s += line([P(0.02, y, Z0), P(L - 0.02, y, Z0)], "x-plank");
    return s;
  }, centre(7.6, 1.2, Z0)));

  // 3 walls — back and left (interior faces visible)
  parts.push(group("waende", offset(0, -2.3, 0), () => box(0, 0, Z0, L, T, Z1, "x-wall-in")
    + line([P(0, T, Z1), P(L, T, Z1)], "x-steelline"), null));
  parts.push(group("waende", offset(-2.6, 0, 0), () => box(0, T, Z0, T, W - T, Z1, "x-wall-in"), null));

  // 5 technik — conduits on the back wall
  parts.push(group("technik", offset(0, -1.15, 0), () => {
    const y = T + 0.02;
    let s = line([P(0.4, y, 1.15), P(7.5, y, 1.15)], "x-cable");
    s += line([P(0.4, y, 3.2), P(7.5, y, 3.2)], "x-cable");
    for (const x of [1.3, 3.6, 5.1, 6.4]) s += line([P(x, y, 1.15), P(x, y, 1.42)], "x-cable") + poly([P(x - 0.08, y, 1.42), P(x + 0.08, y, 1.42), P(x + 0.08, y, 1.58), P(x - 0.08, y, 1.58)], "x-socket");
    s += line([P(7.1, y, 1.15), P(7.1, y, 3.2)], "x-cable");
    s += poly([P(6.95, y, 2.1), P(7.3, y, 2.1), P(7.3, y, 2.65), P(6.95, y, 2.65)], "x-panel");
    s += box(2.2, y, 2.75, 3.25, y + 0.2, 3.05, "x-ac");
    return s;
  }, centre(2.6, T, 3.3)));

  // 2 interior
  parts.push(group("innen", offset(0, 0, 0.35), () => {
    let s = "";
    s += box(6.85, T, Z0, L - T, 1.55, 3.0, "x-bath");
    s += box(4.35, T, Z0, 6.7, 0.75, 1.72, "x-kitchen");
    s += box(4.35, T, 2.35, 6.7, 0.5, 2.95, "x-kitchen");
    s += box(1.0, 0.55, 1.5, 1.95, 1.3, 1.56, "x-wood");
    s += line([P(1.1, 1.2, Z0), P(1.1, 1.2, 1.5)], "x-leg") + line([P(1.85, 1.2, Z0), P(1.85, 1.2, 1.5)], "x-leg");
    s += box(2.9, 1.75, Z0, 4.3, 2.4, 1.25, "x-sofa");
    s += box(2.9, 2.25, 1.25, 4.3, 2.4, 1.62, "x-sofa");
    s += box(T, T, 2.35, 2.7, W - T, 2.5, "x-wood");
    s += box(0.3, 0.35, 2.5, 2.2, 2.2, 2.68, "x-bed");
    s += line([P(2.78, 1.85, Z0), P(2.78, 1.85, 2.5)], "x-ladder") + line([P(2.78, 2.3, Z0), P(2.78, 2.3, 2.5)], "x-ladder");
    for (let z = 1.1; z < 2.5; z += 0.3) s += line([P(2.78, 1.85, z), P(2.78, 2.3, z)], "x-ladder");
    return s;
  }, centre(5.5, 0.45, 1.72)));

  // 3 walls — front (exterior, with openings) and right end (with door)
  parts.push(group("waende", offset(0, 2.6, 0), () => {
    let s = faceY(0, L, Z0, Z1, W, winFront, "x-wall-out fy");
    for (let x = 0.12; x < L; x += 0.14) {
      const hit = winFront.find(([a, b]) => x > a && x < b);
      if (!hit) s += line([P(x, W, Z0), P(x, W, Z1)], "x-clad");
      else { s += line([P(x, W, Z0), P(x, W, hit[2])], "x-clad") + line([P(x, W, hit[3]), P(x, W, Z1)], "x-clad"); }
    }
    // the wall section on top: cladding, 10 cm stone wool, lining
    s += poly([P(0, W - T, Z1), P(L, W - T, Z1), P(L, W - 0.1, Z1), P(0, W - 0.1, Z1)], "x-lining");
    s += poly([P(0, W - 0.1, Z1), P(L, W - 0.1, Z1), P(L, W - 0.03, Z1), P(0, W - 0.03, Z1)], "x-wool");
    s += poly([P(0, W - 0.03, Z1), P(L, W - 0.03, Z1), P(L, W, Z1), P(0, W, Z1)], "x-cladtop");
    s += poly([P(L, W - T, Z0), P(L, W, Z0), P(L, W, Z1), P(L, W - T, Z1)], "x-wall-out fx");
    return s;
  }, centre(5.9, W, 1.5)));
  parts.push(group("fenster", offset(0, 4.0, 0), () => winFront.map(([a, b, c, d]) =>
    poly([P(a, W + 0.01, c), P(b, W + 0.01, c), P(b, W + 0.01, d), P(a, W + 0.01, d)], "x-glass")
    + line([P(a + 0.15, W + 0.01, d - 0.12), P(a + (b - a) * 0.45, W + 0.01, c + (d - c) * 0.35)], "x-shine")
    + poly([P(a, W + 0.01, c), P(b, W + 0.01, c), P(b, W + 0.01, d), P(a, W + 0.01, d)], "x-sash")).join(""),
  centre(1.0, W, 3.1)));
  parts.push(group("waende", offset(2.6, 0, 0), () => {
    let s = faceX(T, W - T, Z0, Z1, L, doorRight, "x-wall-out fx");
    s += poly([P(L - T, T, Z1), P(L, T, Z1), P(L, W - T, Z1), P(L - T, W - T, Z1)], "x-cladtop");
    return s;
  }, null));
  parts.push(group("fenster", offset(3.6, 0, 0), () => doorRight.map(([a, b, c, d]) =>
    poly([P(L + 0.01, a, c), P(L + 0.01, b, c), P(L + 0.01, b, d), P(L + 0.01, a, d)], "x-glass")
    + poly([P(L + 0.01, a, c), P(L + 0.01, b, c), P(L + 0.01, b, d), P(L + 0.01, a, d)], "x-sash")).join(""), null));

  // 1 roof — insulation and the standing-seam slab
  parts.push(group("dach", offset(0, 0, 2.2), () => box(0.1, 0.1, 3.4, L - 0.1, W - 0.1, 3.5, "x-woolbox"), null));
  parts.push(group("dach", offset(0, 0, 3.4), () => {
    let s = box(-0.25, -0.2, 3.52, L + 0.25, W + 0.2, 3.72, "x-roof");
    for (let x = 0.15; x < L + 0.2; x += 0.42) s += line([P(x, -0.2, 3.72), P(x, W + 0.2, 3.72)], "x-seam");
    return s;
  }, centre(6.8, W + 0.2, 3.72)));

  const pad = 30;
  const vb = [bounds.minX - pad, bounds.minY - pad, bounds.maxX - bounds.minX + pad * 2, bounds.maxY - bounds.minY + pad * 2].map(r1);
  return `<svg class="x-svg" viewBox="${vb.join(" ")}" role="img" aria-labelledby="x-title"><title id="x-title">Explosionszeichnung eines MODUNERA Tiny House: Dach, Innenausbau, Wände, Fenster, Haustechnik, Boden und Fahrgestell</title>${parts.join("")}</svg>`;
}

/* =============================================================================
   3  ROUTE — a stylised line from Sakarya to Germany, arc-length sampled here
   ========================================================================== */
function routeSvg() {
  const segs = [
    [[90, 330], [250, 336], [300, 200], [450, 214]],
    [[450, 214], [600, 228], [640, 330], [800, 300]],
    [[800, 300], [940, 274], [960, 140], [1110, 104]],
  ];
  const bz = (p, t) => { const u = 1 - t; return [0, 1].map((i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]); };
  const pts = [];
  for (const s of segs) for (let i = 0; i <= 60; i++) pts.push(bz(s, i / 60));
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = len[len.length - 1];
  const at = (f) => { const target = f * total; const i = len.findIndex((l) => l >= target); return pts[Math.max(0, i)]; };
  const d = `M${segs[0][0].join(" ")}` + segs.map((s) => ` C${s[1].join(" ")} ${s[2].join(" ")} ${s[3].join(" ")}`).join("");
  const nodes = copy.route_steps.map((st, i) => {
    const [x, y] = at(i / (copy.route_steps.length - 1)).map(r1);
    return `<g class="r-node" data-i="${i}" transform="translate(${x} ${y})"><circle r="17"/><text y="5">${i + 1}</text></g>`;
  }).join("");
  const hills = ridge(71, 330, 60, 30).d.replace(/-100 1100/g, "-100 460").replace(/1700 1100/g, "1700 460");
  return `<svg class="r-svg" viewBox="0 0 1200 420" role="img" aria-labelledby="r-title"><title id="r-title">Schematische Route vom Werk in Sakarya bis zum Stellplatz in Deutschland, fünf Schritte</title>
<path class="r-hills" d="${hills}"/>
<path class="r-track" d="${d}"/><path class="r-done" d="${d}" pathLength="1"/>
${nodes}
<text class="r-end" x="70" y="388">Sakarya, Türkei</text><text class="r-end" x="1130" y="70" text-anchor="end">Dein Stellplatz, Deutschland</text>
<g class="r-truck"><g transform="translate(-34 -34)"><rect class="r-trailer" x="0" y="26" width="52" height="6" rx="2"/><path class="r-house" d="M4 26 V10 L28 4 L48 8 V26 Z"/><rect class="r-cab" x="52" y="14" width="16" height="18" rx="3"/><circle class="r-wheel" cx="12" cy="34" r="4"/><circle class="r-wheel" cx="40" cy="34" r="4"/><circle class="r-wheel" cx="62" cy="34" r="4"/></g></g>
</svg>`;
}

/* =============================================================================
   4  SEASON SCENE — the CSS variables of the active season repaint it
   ========================================================================== */
function seasonSvg() {
  const R = rng(91);
  const crown = [[300, 150, 64], [256, 176, 48], [346, 178, 50], [300, 108, 46], [270, 128, 40], [334, 128, 42]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
  let blossoms = "", leaves = "", flakes = "";
  for (let i = 0; i < 26; i++) blossoms += `<circle cx="${r1(240 + R() * 120)}" cy="${r1(80 + R() * 130)}" r="${r1(3 + R() * 2.5)}"/>`;
  for (let i = 0; i < 12; i++) leaves += `<g transform="translate(${r1(240 + R() * 130)} ${r1(150 + R() * 40)})"><path style="--d:${r1(R() * 6)}s;--x:${r1(-40 + R() * 80)}px" d="M0 0 q6 -6 12 0 q-6 6 -12 0Z"/></g>`;
  for (let i = 0; i < 46; i++) flakes += `<circle style="--d:${r1(R() * 8)}s;--x:${r1(-20 + R() * 40)}px" cx="${r1(R() * 600)}" cy="${r1(-20 - R() * 60)}" r="${r1(1.4 + R() * 2.2)}"/>`;
  return `<svg class="s-svg" viewBox="0 0 600 400" aria-hidden="true" focusable="false">
<rect class="s-sky" width="600" height="400"/>
<circle class="s-sun" cx="470" cy="90" r="34"/>
<path class="s-hill" d="M0 280 Q150 220 300 262 T600 246 V400 H0Z"/>
<path class="s-ground" d="M0 320 Q200 296 420 312 T600 306 V400 H0Z"/>
<path class="s-snowground" d="M0 320 Q200 296 420 312 T600 306 V316 Q420 322 200 306 T0 330Z"/>
<g class="s-house" transform="translate(380 236)"><path class="s-roof" d="M-10 30 L150 16 L150 26 L-10 40Z"/><path class="s-wall" d="M0 38 L140 26 L140 86 L0 86Z"/><rect class="s-win" x="14" y="48" width="56" height="30"/><rect class="s-win" x="98" y="40" width="22" height="46"/><path class="s-snowroof" d="M-12 30 L152 16 L152 12 Q70 14 -12 24Z"/><rect class="s-deck" x="-16" y="86" width="176" height="6"/></g>
<path class="s-trunk" d="M294 300 L298 180 L290 150 M298 196 L320 160 M296 220 L270 186"/>
<g class="s-crown">${crown}</g>
<g class="s-blossom">${blossoms}</g>
<g class="s-leaves">${leaves}</g>
<g class="s-flakes">${flakes}</g>
</svg>`;
}

/* =============================================================================
   5  CHARTS
   ========================================================================== */
function spaceChart() {
  return copy.space.blocks.map((b) => {
    const whole = Math.floor(b.m2), frac = r1(b.m2 - whole);
    let cells = "";
    for (let i = 0; i < whole; i++) cells += `<i style="--i:${i}"></i>`;
    if (frac > 0) cells += `<i class="part" style="--i:${whole};--f:${frac}"></i>`;
    return `<figure class="sq sq-${b.tone}" data-tip="${esc(`${b.label}: ${num(b.m2, b.m2 % 1 ? 1 : 0)} m² · ${b.source}`)}" tabindex="0">
  <figcaption><strong>${num(b.m2, b.m2 % 1 ? 1 : 0)} m²</strong><span>${esc(b.label)}</span></figcaption>
  <div class="sq-grid" aria-hidden="true">${cells}</div>
</figure>`;
  }).join("");
}
function buildCostChart() {
  const max = 150, H = 220;
  const bars = copy.buildcost.bars.map((b, i) => {
    const h = r1((b.value / max) * H);
    const x = 70 + i * 150;
    return `<g class="bc-bar${i ? " hi" : ""}" data-tip="${esc(`${b.label}: Index ${num(b.value, 1)}`)}" tabindex="0"><rect class="hit" x="${x - 20}" y="20" width="120" height="${H + 10}"/><path class="bar" style="--h:${h}" d="M${x} ${30 + H} V${r1(30 + H - h + 4)} Q${x} ${r1(30 + H - h)} ${x + 4} ${r1(30 + H - h)} H${x + 76} Q${x + 80} ${r1(30 + H - h)} ${x + 80} ${r1(30 + H - h + 4)} V${30 + H} Z"/><text class="bc-val" x="${x + 40}" y="${r1(30 + H - h - 12)}">${num(b.value, b.value % 1 ? 1 : 0)}</text><text class="bc-lab" x="${x + 40}" y="${30 + H + 26}">${esc(b.label)}</text></g>`;
  }).join("");
  return `<svg class="bc-svg" viewBox="0 0 360 290" role="img" aria-label="${esc(`${copy.buildcost.note}: ${copy.buildcost.bars.map((b) => `${b.label} ${num(b.value, 1)}`).join(", ")}`)}"><line class="axis" x1="40" x2="330" y1="250" y2="250"/>${bars}<path class="bc-arrow" d="M150 120 Q 190 70 228 92" /><text class="bc-delta" x="160" y="74">+37 %</text></svg>`;
}
function forestChart() {
  let s = "";
  for (let i = 0; i < 100; i++) {
    const x = (i % 10) * 30 + 15, y = Math.floor(i / 10) * 34 + 18;
    s += `<use href="#tree" x="${x}" y="${y}" class="${i < copy.forest.value ? "on" : "off"}" style="--i:${i}"/>`;
  }
  return `<svg class="fo-svg" viewBox="0 0 300 350" role="img" aria-label="${esc(`${copy.forest.value} von 100 Feldern sind Wald: ${copy.forest.title}`)}"><defs><symbol id="tree" viewBox="-12 -16 24 32" width="24" height="32" overflow="visible"><path d="M0 -15 L9 2 H4 L11 12 H-11 L-4 2 H-9 Z"/><rect x="-1.6" y="12" width="3.2" height="4"/></symbol></defs><g transform="translate(-12 -16)">${s}</g></svg>`;
}
function interestChart() {
  return copy.interest.bars.map((b) => `<div class="ib" data-tip="${esc(`${b.label}: ${num(b.value, b.value % 1 ? 1 : 0)} % · ${b.source}`)}" tabindex="0"><div class="ib-lab"><span>${esc(b.label)}</span><strong>${num(b.value, b.value % 1 ? 1 : 0)} %</strong></div><div class="ib-track"><div class="ib-bar" style="--v:${b.value}"></div></div><small>${esc(b.source)}</small></div>`).join("");
}
function priceStrip() {
  const lo = 42000, hi = 56000, X = (v) => r1(30 + ((v - lo) / (hi - lo)) * 940);
  const ticks = [42000, 44000, 46000, 48000, 50000, 52000, 54000, 56000]
    .map((t) => `<line class="tick" x1="${X(t)}" x2="${X(t)}" y1="96" y2="104"/><text class="tick-l" x="${X(t)}" y="126">${num(t / 1000)}k</text>`).join("");
  const sorted = [...modelRows].sort((a, b) => a.price - b.price);
  const dots = sorted.map((m, i) => {
    const up = i % 2 === 0;
    return `<g class="ps-dot" data-model="${m.key}" data-tip="${esc(`${m.name}: ab ${eur(m.price)} ab Werk · ${m.lengths}`)}" tabindex="0"><line class="stem" x1="${X(m.price)}" x2="${X(m.price)}" y1="100" y2="${up ? 62 : 138}"/><circle class="hit" cx="${X(m.price)}" cy="100" r="18"/><circle class="dot" cx="${X(m.price)}" cy="100" r="8"/><text x="${X(m.price)}" y="${up ? 52 : 160}">${esc(m.name)}</text></g>`;
  }).join("");
  return `<svg class="ps-svg" viewBox="0 0 1000 176" role="img" aria-label="${esc(`Preise ab Werk: ${sorted.map((m) => `${m.name} ${eur(m.price)}`).join(", ")}`)}"><line class="axis" x1="30" x2="970" y1="100" y2="100"/>${ticks}${dots}</svg>`;
}

/* =============================================================================
   6  PAGE
   ========================================================================== */
const words = copy.manifesto.split(/\s+/).map((w, i) => `<span style="--w:${i}">${esc(w)}</span>`).join(" ");
const statTiles = copy.stats.map((s) => `<div class="stat reveal" data-tip="${esc(s.source)}" tabindex="0"><div class="stat-n"><span class="pre">${esc(s.prefix ?? "")}</span><span class="count" data-to="${s.value}" data-dec="${s.decimals}">${num(s.value, s.decimals)}</span><span class="unit">${esc(s.unit)}</span></div><p>${esc(s.label)}</p><small>${esc(s.source)}</small></div>`).join("");

const dayPanels = copy.day.map((d, i) => `<article class="day-card" style="--k:${i}">
  <div class="day-ph">${photoImg(d.photo, "(max-width: 860px) 82vw, 480px")}</div>
  <div class="day-tx"><span class="day-time">${esc(d.time)}</span><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></div>
</article>`).join("");

const seasonTabs = copy.seasons.map((s, i) => `<button type="button" role="tab" class="s-tab" id="tab-${s.id}" aria-controls="s-panel" aria-selected="${i === 0}" data-season="${s.id}">${esc(s.name)}</button>`).join("");
const seasonData = copy.seasons.map((s) => `<template data-season="${s.id}"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></template>`).join("");

const layerList = copy.layers.map((l, i) => `<li data-layer="${l.id}" tabindex="0"><span class="ln">${i + 1}</span><div><strong>${esc(l.name)}</strong><p>${esc(l.text)}</p>${l.id === "waende" ? `<span class="wallbuild" aria-hidden="true"><i class="wb-out"></i><i class="wb-wool"></i><i class="wb-in"></i></span><span class="wallbuild-l">Fassade · Stahlrahmen mit 10 cm Steinwolle · Innenverkleidung</span>` : ""}</div></li>`).join("");

const filterChips = Object.entries(copy.tag_names).map(([k, v], i) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="${i === 0}">${esc(v)}</button>`).join("");
const modelCards = modelRows.map((m) => `<article class="mcard" data-tags="${m.tags.join(" ")}" data-price="${m.price}" data-model="${m.key}">
  <a class="mcard-img" href="${UP}modelle/md-${m.n}/" tabindex="-1" aria-hidden="true"><img src="${UP}${m.file}" width="${m.w}" height="${m.h}" alt="" loading="lazy" decoding="async"></a>
  <div class="mcard-body">
    <div class="mcard-top"><h3><a href="${UP}modelle/md-${m.n}/">${esc(m.name)}</a></h3><span class="mcard-price">ab ${eur(m.price)}</span></div>
    <p>${esc(m.positioning)}</p>
    <dl><div><dt>Länge</dt><dd>${esc(m.lengths)}</dd></div><div><dt>Grundriss</dt><dd>${esc(m.layout)}</dd></div><div><dt>Ideal für</dt><dd>${esc(m.use)}</dd></div></dl>
    <button type="button" class="mcard-ask" data-ask="${esc(`${m.name} (ab ${eur(m.price)} ab Werk)`)}">Dieses Modell anfragen</button>
  </div>
</article>`).join("");

const marquee = (names) => {
  const items = names.map((n) => `<li>${photoImg(n, "380px")}</li>`).join("");
  return `<ul class="mq-row">${items}</ul><ul class="mq-row" aria-hidden="true">${items.replace(/alt="[^"]*"/g, 'alt=""')}</ul>`;
};
const rowA = ["aframe-olive-grove", "interior-tall-loft", "unit-standing-seam", "interior-wood", "unit-porch-sand", "interior-living-tv", "aframe-lawn"];
const rowB = ["production-cladding", "interior-stair-white", "unit-angular-dark", "transport-road", "interior-door-kitchen", "detail-wood-and-metal", "delivery-trailer"];

const routeSteps = copy.route_steps.map((s, i) => `<li data-i="${i}"><span>${i + 1}</span><strong>${esc(s.title)}</strong><p>${esc(s.text)}</p></li>`).join("");
const honest = copy.honest.map((h, i) => `<article class="hon reveal" style="--k:${i}"><span class="hon-n">0${i + 1}</span><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></article>`).join("");
const faqs = copy.faq.map((f) => `<details class="faq-i"><summary>${esc(f.q)}</summary><p>${esc(fill(f.a))}</p></details>`).join("");

const modelOptions = modelRows.map((m) => `<option value="${m.price}" data-name="${esc(m.name)}"${m.n === "1" ? " selected" : ""}>${esc(m.name)} · ab ${eur(m.price)}</option>`).join("");
const cd = copy.calculator.defaults;

const dataTable = [
  ...copy.stats.map((s) => [s.label, `${s.prefix ?? ""}${num(s.value, s.decimals)} ${s.unit}`, s.source]),
  ...copy.space.blocks.map((b) => [b.label, `${num(b.m2, b.m2 % 1 ? 1 : 0)} m²`, b.source]),
  ...copy.buildcost.bars.map((b) => [`${copy.buildcost.note}, ${b.label}`, num(b.value, 1), copy.buildcost.source]),
  [copy.forest.title, `${copy.forest.value} % (11,5 Mio. ha)`, copy.forest.source],
  [copy.camping.label, `${num(copy.camping.value, 1)} Mio.`, copy.camping.source],
  ...copy.interest.bars.map((b) => [`Tiny House vorstellbar: ${b.label}`, `${num(b.value, b.value % 1 ? 1 : 0)} %`, b.source]),
  [copy.nature.title, "Kurzfristig niedrigere Cortisolwerte", copy.nature.source],
].map(([a, b, c]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join("");

const canonical = `${BASE}/${ROUTE}`;
const ld = [
  { "@context": "https://schema.org", "@type": "WebPage", name: copy.title, description: copy.description, url: canonical, inLanguage: "de-DE", dateModified: copy.updated, isPartOf: { "@type": "WebSite", name: "MODUNERA", url: `${BASE}/` }, about: { "@type": "Thing", name: "Tiny House Leben in der Natur" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Startseite", item: `${BASE}/` }, { "@type": "ListItem", position: 2, name: "Tiny House Leben", item: canonical }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: copy.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: fill(f.a) } })) },
].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");

const og = photo("aframe-deck-olive");

const html = `<!doctype html>
<html lang="de-DE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(copy.title)}</title>
<meta name="description" content="${esc(copy.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#0B1220">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="MODUNERA">
<meta property="og:title" content="${esc(copy.title)}">
<meta property="og:description" content="${esc(copy.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${BASE}/${og.large.file}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="${UP}assets/brand/modunera-mark-v1.png">
<link rel="preload" href="${UP}assets/leben/fonts/Fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${UP}assets/leben/fonts/Inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${UP}assets/leben/leben.css">
${ld}
</head>
<body class="lb">
<a class="skip" href="#warum">Zum Inhalt springen</a>
<header class="bar" data-bar>
  <a class="bar-logo" href="${UP}" aria-label="MODUNERA Startseite"><img src="${UP}assets/brand/modunera-master-logo-mountain-v1-white-600.png" width="600" height="151" alt="MODUNERA"></a>
  <nav class="bar-links" aria-label="Abschnitte"><a href="#zahlen">Zahlen</a><a href="#rechner">Rechner</a><a href="#alltag">Alltag</a><a href="#aufbau">Aufbau</a><a href="#modelle">Modelle</a><a href="#faq">FAQ</a></nav>
  <div class="bar-clock" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="cl-sun" cx="12" cy="12" r="5"/><path class="cl-moon" d="M15 4a8 8 0 1 0 5 13 7 7 0 0 1-5-13z"/></svg><span data-clock>05:40</span></div>
  <a class="bar-cta" href="#anfrage">Anfragen</a>
  <i class="bar-progress" data-progress></i>
</header>

<main>
<section class="hero" id="start" data-hero>
  <div class="hero-stage">
    <div class="hero-sky" data-sky></div>
    ${heroSvg()}
    <canvas class="hero-flies" data-flies="hero" aria-hidden="true"></canvas>
    <div class="hero-copy">
      <p class="hero-kicker">Tiny House · Leben in der Natur</p>
      <h1 class="hero-h1">${copy.hero.lines.map((l, i) => `<span class="hl hl-${i}">${esc(l)}</span>`).join(" ")}</h1>
      <div class="hero-foot">
        <p class="hero-lead">${esc(copy.hero.lead)}</p>
        <div class="hero-btns"><a class="btn btn-sun" href="#modelle">Modelle ab ${eur(minPrice)}</a><a class="btn btn-ghost" href="#rechner">Kosten vergleichen</a></div>
      </div>
    </div>
    <p class="hero-cue" aria-hidden="true"><span>${esc(copy.hero.cue)}</span><i></i></p>
  </div>
</section>

<section class="manifesto" id="warum" data-manifesto>
  <svg class="edge edge-top" viewBox="0 0 1600 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H1600 V30 Q1400 70 1200 40 T800 46 T400 36 T0 52 Z"/></svg>
  <div class="wrap">
    <p class="eyebrow">Warum klein die Zukunft ist</p>
    <p class="mani-text">${words}</p>
  </div>
</section>

<section class="numbers" id="zahlen">
  <div class="wrap">
    <header class="sec-head reveal"><p class="eyebrow">Die Zahlen hinter dem Gefühl</p><h2>Wir wohnen auf immer mehr Fläche – und zahlen immer mehr dafür.</h2></header>
    <div class="stats">${statTiles}</div>

    <div class="space reveal" id="raum">
      <div class="space-head"><h3>${esc(copy.space.title)}</h3><p>${esc(copy.space.intro)}</p></div>
      <div class="space-chart">${spaceChart()}</div>
    </div>

    <div class="duo">
      <div class="card reveal"><h3>${esc(copy.buildcost.title)}</h3><p class="card-sub">${esc(copy.buildcost.note)}</p>${buildCostChart()}<small class="src">${esc(copy.buildcost.source)}</small></div>
      <div class="card card-forest reveal"><h3>${esc(copy.forest.title)}</h3><p class="card-sub">${esc(copy.forest.detail)}</p>${forestChart()}<small class="src">${esc(copy.forest.source)}</small></div>
    </div>

    <div class="camp reveal">
      <p class="eyebrow">${esc(copy.camping.kicker)}</p>
      <div class="camp-n"><span class="count" data-to="${copy.camping.value}" data-dec="1">${num(copy.camping.value, 1)}</span><span class="unit">Mio.</span></div>
      <p class="camp-l">${esc(copy.camping.label)}</p><small class="src">${esc(copy.camping.source)}</small>
    </div>

    <div class="interest reveal"><h3>${esc(copy.interest.title)}</h3>${interestChart()}</div>

    <details class="table-view"><summary>Alle Zahlen und Quellen als Tabelle</summary><div class="tv-wrap"><table><thead><tr><th scope="col">Kennzahl</th><th scope="col">Wert</th><th scope="col">Quelle</th></tr></thead><tbody>${dataTable}</tbody></table></div></details>
  </div>
</section>

<section class="calc" id="rechner">
  <div class="wrap">
    <header class="sec-head reveal"><p class="eyebrow">Rechenbeispiel</p><h2>${esc(copy.calculator.title)}</h2><p>${esc(copy.calculator.intro)}</p></header>
    <form class="calc-grid" data-calc data-delivery="${deliveryDE}" onsubmit="return false">
      <fieldset class="calc-in">
        <legend class="sr">Annahmen</legend>
        <label class="rng"><span>Wohnfläche Neubau <output data-o="area">${cd.area} m²</output></span><input type="range" name="area" min="60" max="200" step="5" value="${cd.area}"></label>
        <label class="rng"><span>Baukosten pro m² <output data-o="eur_m2">${eur(cd.eur_m2)}</output></span><input type="range" name="eur_m2" min="2600" max="3800" step="50" value="${cd.eur_m2}"><small>${esc(copy.calculator.efh_cost_source)}</small></label>
        <label class="sel"><span>Tiny House</span><select name="model">${modelOptions}</select></label>
        <label class="chk"><input type="checkbox" name="delivery" checked><span>Lieferung nach Deutschland einrechnen (Richtwert ${eur(deliveryDE)})</span></label>
        <label class="rng"><span>Eigenkapital <output data-o="equity">${eur(cd.equity)}</output></span><input type="range" name="equity" min="0" max="100000" step="5000" value="${cd.equity}"></label>
        <label class="rng"><span>Zinssatz <output data-o="rate">${num(cd.rate, 1)} %</output></span><input type="range" name="rate" min="1" max="7" step="0.1" value="${cd.rate}"></label>
        <label class="rng"><span>Laufzeit <output data-o="years">${cd.years} Jahre</output></span><input type="range" name="years" min="5" max="30" step="1" value="${cd.years}"></label>
        <p class="calc-note">${esc(copy.calculator.rate_note)}</p>
      </fieldset>
      <div class="calc-out" aria-live="polite">
        <div class="co-row"><div class="co-lab"><span>Neubau Einfamilienhaus</span><strong data-r="efh">–</strong></div><div class="co-track"><i class="co-bar co-efh" data-b="efh"></i></div></div>
        <div class="co-row"><div class="co-lab"><span data-r="tinyname">Tiny House</span><strong data-r="tiny">–</strong></div><div class="co-track"><i class="co-bar co-tiny" data-b="tiny"></i></div></div>
        <div class="co-big"><span>Unterschied</span><strong data-r="diff">–</strong></div>
        <dl class="co-dl">
          <div><dt>Monatsrate Neubau</dt><dd data-r="rate_efh">–</dd></div>
          <div><dt>Monatsrate Tiny House</dt><dd data-r="rate_tiny">–</dd></div>
          <div><dt>Zinsen gesamt Neubau</dt><dd data-r="int_efh">–</dd></div>
          <div><dt>Zinsen gesamt Tiny House</dt><dd data-r="int_tiny">–</dd></div>
        </dl>
        <p class="co-free" data-r="free">–</p>
        <button type="button" class="btn btn-sun" data-calc-ask>Mit diesem Modell anfragen</button>
      </div>
    </form>
  </div>
</section>

<section class="day" id="alltag" data-day>
  <div class="day-stage">
    <header class="day-head"><p class="eyebrow">Ein Tag im Tiny House</p><h2>Von 06:30 bis unter die Sterne.</h2><p>Echte Häuser, echte Räume – fotografiert an ausgelieferten und ausgestellten MODUNERA Einheiten.</p></header>
    <div class="day-track" data-track>${dayPanels}</div>
  </div>
</section>

<section class="nature" id="natur">
  <div class="wrap nature-grid">
    <div class="seasons reveal" data-seasons>
      <p class="eyebrow">Vier Jahreszeiten, ein Zuhause</p>
      <div class="s-tabs" role="tablist" aria-label="Jahreszeiten">${seasonTabs}</div>
      <div class="s-scene season-${copy.seasons[0].id}" data-scene>${seasonSvg()}</div>
      <div class="s-panel" id="s-panel" role="tabpanel" aria-live="polite"><h3>${esc(copy.seasons[0].title)}</h3><p>${esc(copy.seasons[0].text)}</p></div>
      ${seasonData}
    </div>
    <div class="breathe reveal">
      <p class="eyebrow">Natur &amp; Gesundheit</p>
      <h2>${esc(copy.nature.title)}</h2>
      <p>${esc(copy.nature.text)}</p>
      <small class="src">${esc(copy.nature.source)}</small>
      <div class="br-orb" aria-hidden="true"><i></i><i></i><i></i><span class="br-in">Einatmen</span><span class="br-out">Ausatmen</span></div>
      <p class="br-hint">Atme einen Moment mit: vier Sekunden ein, sechs aus.</p>
    </div>
  </div>
</section>

<section class="build" id="aufbau" data-explode>
  <div class="build-stage">
    <header class="build-head"><p class="eyebrow">Ein Haus in Schichten</p><h2>Was in einem MODUNERA steckt.</h2></header>
    <div class="build-grid">
      <div class="build-fig">${explodedSvg()}<button type="button" class="build-toggle" data-explode-toggle aria-pressed="false">Zerlegen</button></div>
      <ol class="build-list" data-layers>${layerList}</ol>
    </div>
  </div>
</section>

<section class="models" id="modelle">
  <div class="wrap">
    <header class="sec-head reveal"><p class="eyebrow">Acht Modelle</p><h2>Finde das Haus, das zu deinem Leben passt.</h2><p>Alle Preise sind Richtpreise ab Werk in Sakarya. Den verbindlichen Preis inklusive Lieferung nennt das schriftliche Angebot.</p></header>
    <div class="ps reveal"><h3>Alle Preise auf einem Strahl</h3><div class="ps-scroll">${priceStrip()}</div></div>
    <div class="m-tools"><div class="chips" role="group" aria-label="Nach Nutzung filtern">${filterChips}</div><button type="button" class="sort" data-sort aria-pressed="false">Nach Preis sortieren</button></div>
    <div class="m-grid" data-models>${modelCards}</div>
    <p class="m-more"><a href="${UP}modelle/">Alle Modelle mit Grundrissen und Details</a></p>
  </div>
</section>

<section class="gallery" id="galerie" aria-label="Fotos ausgeführter Häuser">
  <div class="mq mq-a">${marquee(rowA)}</div>
  <div class="mq mq-b">${marquee(rowB)}</div>
</section>

<section class="route" id="weg" data-route>
  <div class="wrap">
    <header class="sec-head reveal"><p class="eyebrow">Der Weg zu dir</p><h2>Von Sakarya bis vor deine Tür.</h2></header>
    <div class="r-fig">${routeSvg()}</div>
    <ol class="r-steps">${routeSteps}</ol>
  </div>
</section>

<section class="honest" id="ehrlich">
  <div class="wrap">
    <header class="sec-head reveal"><p class="eyebrow">Ehrlich gesagt</p><h2>Was du vorher wissen solltest.</h2><p>Ein Tiny House ist eine Entscheidung fürs Leben – darum gehören die unbequemen Punkte nach vorn.</p></header>
    <div class="hon-grid">${honest}</div>
  </div>
</section>

<section class="faq" id="faq">
  <div class="wrap faq-wrap">
    <header class="sec-head reveal"><p class="eyebrow">Häufige Fragen</p><h2>Kurz beantwortet.</h2></header>
    <div class="faq-list">${faqs}</div>
  </div>
</section>

<section class="cta" id="anfrage">
  <canvas class="cta-sky" data-flies="cta" aria-hidden="true"></canvas>
  ${ctaLandscape()}
  <div class="wrap cta-grid">
    <div class="cta-copy reveal">
      <p class="eyebrow">22:00 · Licht an</p>
      <h2>${esc(copy.cta.title)}</h2>
      <p>${esc(copy.cta.text)}</p>
      <ul class="cta-direct">
        <li><a href="https://wa.me/905535435342" rel="noopener">WhatsApp: +90 553 543 5342</a></li>
        <li><a href="mailto:emre@modunera.com">emre@modunera.com</a></li>
      </ul>
    </div>
    <form class="lead reveal" name="projektanfrage" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-lead>
      <input type="hidden" name="form-name" value="projektanfrage">
      <p class="hp"><label>Bitte frei lassen<input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="f-grid">
        <label class="f"><span>Name *</span><input name="Name" autocomplete="name" required></label>
        <label class="f"><span>E-Mail *</span><input name="E-Mail" type="email" autocomplete="email" required></label>
        <label class="f"><span>Telefon / WhatsApp</span><input name="Telefon" type="tel" autocomplete="tel"></label>
        <label class="f"><span>Wo soll das Haus stehen?</span><input name="Lieferort" placeholder="z. B. Lüneburger Heide"></label>
        <label class="f"><span>Nutzung</span><select name="Nutzung">${copy.cta.uses.map((u) => `<option>${esc(u)}</option>`).join("")}</select></label>
        <label class="f"><span>Anzahl</span><select name="Einheiten">${copy.cta.units.map((u) => `<option>${esc(u)}</option>`).join("")}</select></label>
        <label class="f f-full"><span>Budgetrahmen</span><select name="Budget">${pricing.enquiry_budget_bands.de.map((b) => `<option>${esc(b)}</option>`).join("")}</select></label>
        <label class="f f-full"><span>Dein Vorhaben</span><textarea name="Projekt" rows="4" placeholder="Grundstück, Zeitraum, Wunschmodell …" data-projekt></textarea></label>
      </div>
      <label class="f-consent"><input type="checkbox" name="Einwilligung" value="ja" required><span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert werden. Details in der <a href="${UP}legal/datenschutz/">Datenschutzerklärung</a>.</span></label>
      <button class="btn btn-sun f-send" type="submit">Anfrage senden</button>
      <p class="f-status" data-status role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap foot-grid">
    <a class="foot-logo" href="${UP}"><img src="${UP}assets/brand/modunera-master-logo-mountain-v1-white-600.png" width="600" height="151" alt="MODUNERA" loading="lazy"></a>
    <nav aria-label="Weiterlesen"><a href="${UP}modelle/">Modelle</a><a href="${UP}qualitaet/">Qualität</a><a href="${UP}kontakt/">Kontakt</a><a href="${UP}legal/impressum/">Impressum</a><a href="${UP}legal/datenschutz/">Datenschutz</a><a href="${UP}legal/cookies/">Cookies</a></nav>
    <p>Preise sind Richtpreise ab Werk, keine Angebote. Zahlen mit Quellenangabe; Herstellerangaben sind als solche gekennzeichnet. Stand: ${esc(copy.updated.split("-").reverse().join("."))}</p>
  </div>
</footer>
<div class="tip" data-tipbox role="tooltip" hidden></div>
<script src="${UP}assets/leben/leben.js" defer></script>
</body>
</html>
`;

await mkdir(dirname(OUT), { recursive: true });
const before = existsSync(OUT) ? await readFile(OUT, "utf8") : "";
if (before !== html) await writeFile(OUT, html, "utf8");
console.log(JSON.stringify({ page: ROUTE, models: modelRows.length, bytes: html.length, changed: before !== html }));
