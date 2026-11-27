#!/usr/bin/env node
/* Technical drawings for MD 1–MD 8, and the section that shows them on the
   forty model pages (five languages × eight models).

   The factory has no drawings to publish yet, so these are planning sketches,
   drawn from data/model-drawings.json — itself derived from the layout text on
   each model page and the catalogue renders. Every sheet says so in its title
   block, and every height carries "ca.". When real shop drawings arrive, the
   data file is the one place to change.

   Per model and language this writes four SVG sheets to
   assets/images/drawings/<lang>/md-<n>-{plan,elevations,section,3d}.svg:
     plan        ground floor and sleeping loft, furnished, dimensioned
     elevations  long side and end, materials, chassis
     section     long section through the loft with clear heights
     3d          isometric cut-away, roof off, front walls cut low

   It then inserts a "technical drawings" section after the plan section of
   every model page (marker data-drawings, replaced on every run, so the pass
   is idempotent). Runs after the content generators and before the V7 passes.

   Usage: node tools/build-model-drawings.mjs
*/
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const D = JSON.parse(await readFile(join(ROOT, "data/model-drawings.json"), "utf8"));
const COPY = JSON.parse(await readFile(join(ROOT, "data/model-copy.json"), "utf8")).models;
const { W, t: T } = D;
const H = D.heights;
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

/* ---------------------------------------------------------------- language */
const LANGS = {
  de: {
    dec: ",", page: (n) => `modelle/md-${n}/index.html`, eyebrowPlan: "Raumkonzept",
    room: { wohnen: "Wohnen", kueche: "Küche · Essen", bad: "Bad", zimmer: "Zimmer", eingang: "Eingang", veranda: "Veranda", arbeiten: "Arbeiten", flur: "Flur" },
    loft: "Loft", void: "Luftraum", up: "hoch", ladder: "Leiter",
    sheets: { plan: "Grundrisse", elevations: "Ansichten", section: "Längsschnitt", "3d": "3D-Schnittmodell" },
    eg: "Grundriss Erdgeschoss", loftPlan: "Schlafebene (Loft)", front: "Ansicht Längsseite", end: "Ansicht Stirnseite",
    clear: "lichte Höhe ca.", stand: "Stehhöhe am First ca.", floor: "OK Fertigfußboden", ground: "Gelände",
    sketch: "Planungsskizze", approx: "Maße ca. in m · verbindlich ist die Werkplanung zum Angebot", date: "Stand 11/2026",
    area: "Wohnfläche ca.", loftArea: "Loft ca.", sleeps: "Schlafplätze", variant: (v) => `auch als ${v}-m-Variante`, scale: "Maßstabsleiste",
    eyebrow: "Technische Zeichnungen", h2: (n) => `MD ${n} als Plan.`,
    intro: "Grundrisse, Ansichten, Schnitt und 3D-Modell als Planungsskizze. Sie zeigen Aufteilung, Möblierbarkeit und Proportionen; verbindliche Maße, Höhen und Ausführung legt die Werkplanung zum Angebot fest.",
    cap: { plan: "Grundriss Erdgeschoss und Schlafebene", elevations: "Längs- und Stirnansicht", section: "Längsschnitt mit lichten Höhen", "3d": "3D-Schnittmodell, Dach und Vorderwände abgenommen" },
    open: "In voller Größe öffnen", alt: (n, s) => `MD ${n} – ${s}, Planungsskizze`,
  },
  en: {
    dec: ".", page: (n) => `en/models/md-${n}/index.html`, eyebrowPlan: "The plan",
    room: { wohnen: "Living", kueche: "Kitchen · Dining", bad: "Bathroom", zimmer: "Room", eingang: "Entrance", veranda: "Veranda", arbeiten: "Study", flur: "Hall" },
    loft: "Loft", void: "Open to below", up: "up", ladder: "Ladder",
    sheets: { plan: "Floor plans", elevations: "Elevations", section: "Long section", "3d": "3D cut-away" },
    eg: "Ground floor plan", loftPlan: "Sleeping loft", front: "Long elevation", end: "End elevation",
    clear: "clear height approx.", stand: "standing height at ridge approx.", floor: "Finished floor level", ground: "Ground",
    sketch: "Planning sketch", approx: "Approx. dimensions in m · the shop drawings issued with the offer are binding", date: "Issue 11/2026",
    area: "Floor area approx.", loftArea: "Loft approx.", sleeps: "sleeps", variant: (v) => `also as ${v} m version`, scale: "Scale bar",
    eyebrow: "Technical drawings", h2: (n) => `MD ${n} on paper.`,
    intro: "Floor plans, elevations, section and a 3D model as planning sketches. They show layout, furnishing and proportions; binding dimensions, heights and specification are set in the shop drawings issued with the offer.",
    cap: { plan: "Ground floor and sleeping loft", elevations: "Long and end elevation", section: "Long section with clear heights", "3d": "3D cut-away, roof and front walls removed" },
    open: "Open full size", alt: (n, s) => `MD ${n} – ${s}, planning sketch`,
  },
  nl: {
    dec: ",", page: (n) => `nl/modellen/md-${n}/index.html`, eyebrowPlan: "De plattegrond",
    room: { wohnen: "Wonen", kueche: "Keuken · Eten", bad: "Badkamer", zimmer: "Kamer", eingang: "Entree", veranda: "Veranda", arbeiten: "Werkplek", flur: "Hal" },
    loft: "Vide-loft", void: "Vide", up: "op", ladder: "Ladder",
    sheets: { plan: "Plattegronden", elevations: "Aanzichten", section: "Langsdoorsnede", "3d": "3D-doorsnede" },
    eg: "Plattegrond begane grond", loftPlan: "Slaaploft", front: "Aanzicht lange zijde", end: "Aanzicht kopse kant",
    clear: "vrije hoogte ca.", stand: "stahoogte in de nok ca.", floor: "Bovenkant afgewerkte vloer", ground: "Maaiveld",
    sketch: "Ontwerpschets", approx: "Maten ca. in m · bindend is de werktekening bij de offerte", date: "Stand 11/2026",
    area: "Woonoppervlak ca.", loftArea: "Loft ca.", sleeps: "slaapplaatsen", variant: (v) => `ook als ${v} m-variant`, scale: "Schaalstok",
    eyebrow: "Technische tekeningen", h2: (n) => `MD ${n} op papier.`,
    intro: "Plattegronden, aanzichten, doorsnede en 3D-model als ontwerpschets. Ze tonen indeling, inrichting en verhoudingen; bindende maten, hoogtes en uitvoering staan in de werktekening bij de offerte.",
    cap: { plan: "Begane grond en slaaploft", elevations: "Lange zijde en kopse kant", section: "Langsdoorsnede met vrije hoogtes", "3d": "3D-doorsnede, dak en voorgevels weggenomen" },
    open: "Op volle grootte openen", alt: (n, s) => `MD ${n} – ${s}, ontwerpschets`,
  },
  da: {
    dec: ",", page: (n) => `da/modeller/md-${n}/index.html`, eyebrowPlan: "Planen",
    room: { wohnen: "Stue", kueche: "Køkken · Spis", bad: "Bad", zimmer: "Værelse", eingang: "Entré", veranda: "Veranda", arbeiten: "Arbejde", flur: "Gang" },
    loft: "Hems", void: "Åbent rum", up: "op", ladder: "Stige",
    sheets: { plan: "Plantegninger", elevations: "Facader", section: "Længdesnit", "3d": "3D-snitmodel" },
    eg: "Plan, stueetage", loftPlan: "Sovehems", front: "Facade, langside", end: "Facade, gavl",
    clear: "fri højde ca.", stand: "ståhøjde ved kip ca.", floor: "Færdigt gulv", ground: "Terræn",
    sketch: "Skitseprojekt", approx: "Mål ca. i m · bindende er arbejdstegningerne til tilbuddet", date: "Udgave 11/2026",
    area: "Boligareal ca.", loftArea: "Hems ca.", sleeps: "sovepladser", variant: (v) => `også som ${v} m-variant`, scale: "Målestok",
    eyebrow: "Tekniske tegninger", h2: (n) => `MD ${n} på papir.`,
    intro: "Plantegninger, facader, snit og 3D-model som skitseprojekt. De viser disponering, møblering og proportioner; bindende mål, højder og udførelse fastlægges i arbejdstegningerne til tilbuddet.",
    cap: { plan: "Stueetage og sovehems", elevations: "Langside og gavl", section: "Længdesnit med fri højde", "3d": "3D-snitmodel, tag og forvægge fjernet" },
    open: "Åbn i fuld størrelse", alt: (n, s) => `MD ${n} – ${s}, skitseprojekt`,
  },
  fr: {
    dec: ",", page: (n) => `fr/modeles/md-${n}/index.html`, eyebrowPlan: "Le plan",
    room: { wohnen: "Séjour", kueche: "Cuisine · Repas", bad: "Salle d’eau", zimmer: "Chambre", eingang: "Entrée", veranda: "Véranda", arbeiten: "Bureau", flur: "Dégagement" },
    loft: "Mezzanine", void: "Vide", up: "monte", ladder: "Échelle",
    sheets: { plan: "Plans", elevations: "Façades", section: "Coupe longitudinale", "3d": "Écorché 3D" },
    eg: "Plan du rez-de-chaussée", loftPlan: "Mezzanine de couchage", front: "Façade longue", end: "Façade pignon",
    clear: "hauteur libre env.", stand: "hauteur sous faîtage env.", floor: "Niveau du sol fini", ground: "Terrain",
    sketch: "Esquisse", approx: "Cotes env. en m · font foi les plans d’exécution joints à l’offre", date: "Édition 11/2026",
    area: "Surface env.", loftArea: "Mezzanine env.", sleeps: "couchages", variant: (v) => `aussi en version ${v} m`, scale: "Échelle graphique",
    eyebrow: "Plans techniques", h2: (n) => `MD ${n} sur plan.`,
    intro: "Plans, façades, coupe et modèle 3D sous forme d’esquisse. Ils montrent l’organisation, l’aménagement et les proportions ; les cotes, hauteurs et l’exécution définitives figurent dans les plans d’exécution joints à l’offre.",
    cap: { plan: "Rez-de-chaussée et mezzanine", elevations: "Façade longue et pignon", section: "Coupe longitudinale avec hauteurs libres", "3d": "Écorché 3D, toiture et murs avant retirés" },
    open: "Ouvrir en grand", alt: (n, s) => `MD ${n} – ${s}, esquisse`,
  },
};

/* ---------------------------------------------------------------- helpers */
const r2 = (n) => Math.round(n * 100) / 100;
const r1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (n, L, d = 2) => n.toFixed(d).replace(".", L.dec);
const INK = "#23282C", MID = "#5B6268", THIN = "#8C9399", PAPER = "#FCFBF8";

function text(x, y, s, { size = 13, weight = 400, anchor = "middle", fill = INK, rotate = 0, ls = 0, italic = false } = {}) {
  const rot = rotate ? ` transform="rotate(${rotate} ${r1(x)} ${r1(y)})"` : "";
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${ls ? ` letter-spacing="${ls}"` : ""}${italic ? ' font-style="italic"' : ""}${rot}>${esc(s)}</text>`;
}
const line = (x1, y1, x2, y2, stroke = INK, w = 1, extra = "") => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${w}"${extra}/>`;
const rect = (x, y, w, h, fill = "none", stroke = "none", sw = 1, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;
const poly = (pts, fill = "none", stroke = "none", sw = 1, extra = "") => `<polygon points="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;

/* dimension line between two points on a horizontal (dir 'h') or vertical axis */
function dim(a, b, at, L, { dir = "h", label, side = -1, ext = null } = {}) {
  const s = [];
  const txt = label ?? fmt(Math.abs(b - a) / 100 * 100 / 100, L);
  if (dir === "h") {
    s.push(line(a, at, b, at, MID, 0.9));
    for (const x of [a, b]) {
      s.push(line(x - 4, at + 4, x + 4, at - 4, INK, 1.3));
      if (ext !== null) s.push(line(x, ext, x, at + side * -6, THIN, 0.6));
    }
    s.push(text((a + b) / 2, at + (side < 0 ? -5 : 15), txt, { size: 12.5, fill: INK }));
  } else {
    s.push(line(at, a, at, b, MID, 0.9));
    for (const y of [a, b]) {
      s.push(line(at - 4, y + 4, at + 4, y - 4, INK, 1.3));
      if (ext !== null) s.push(line(ext, y, at + side * -6, y, THIN, 0.6));
    }
    s.push(text(at + (side < 0 ? -6 : 16), (a + b) / 2, txt, { size: 12.5, rotate: -90, fill: INK }));
  }
  return s.join("");
}

function titleBlock(L, x, y, w, model, sheetTitle, { scaleS = null } = {}) {
  const n = model.n;
  const sleeps = COPY[n]?.sleeps;
  const s = [];
  s.push(rect(x, y, w, 64, "#fff", INK, 1.2));
  s.push(line(x + 190, y, x + 190, y + 64, INK, 0.8));
  s.push(line(x + w - 360, y, x + w - 360, y + 64, INK, 0.8));
  s.push(text(x + 20, y + 30, "MODUNERA", { size: 20, weight: 700, anchor: "start", ls: 2.5 }));
  s.push(text(x + 20, y + 50, "Tiny House", { size: 11, anchor: "start", fill: MID, ls: 1.2 }));
  s.push(text(x + 210, y + 28, `MD ${n} · ${sheetTitle}`, { size: 17, weight: 700, anchor: "start" }));
  const meta = [`${fmt(model.L, L)} × ${fmt(W, L)} m`];
  if (model.variant_note) meta.push(L.variant(model.variant_note));
  if (sleeps) meta.push(`${sleeps} ${L.sleeps}`);
  s.push(text(x + 210, y + 49, meta.join(" · "), { size: 12, anchor: "start", fill: MID }));
  s.push(text(x + w - 345, y + 26, L.sketch.toUpperCase(), { size: 12, weight: 700, anchor: "start", fill: "#B3401C", ls: 1.4 }));
  s.push(text(x + w - 345, y + 44, L.approx, { size: 9.6, anchor: "start", fill: MID }));
  s.push(text(x + w - 345, y + 58, L.date, { size: 9.6, anchor: "start", fill: MID }));
  if (scaleS) {
    const bx = x + w - 360 - 200, by = y + 40;
    for (let i = 0; i < 3; i++) s.push(rect(bx + i * scaleS * 0.5 * 2 / 2 * 1, by, scaleS, 6, i % 2 ? "#fff" : INK, INK, 0.8).replace(`x="${r1(bx + i * scaleS)}"`, `x="${r1(bx + i * scaleS)}"`));
    for (let i = 0; i <= 3; i++) s.push(text(bx + i * scaleS, by - 5, String(i), { size: 10, fill: MID }));
    s.push(text(bx + 3 * scaleS + 10, by + 6, "m", { size: 10, anchor: "start", fill: MID }));
  }
  return s.join("");
}
/* the scale bar above draws three 1 m blocks; keep the maths obvious */
function scaleBar(x, y, S) {
  const s = [];
  for (let i = 0; i < 3; i++) s.push(rect(x + i * S, y, S, 6, i % 2 ? "#fff" : INK, INK, 0.8));
  for (let i = 0; i <= 3; i++) s.push(text(x + i * S, y - 5, String(i), { size: 10, fill: MID }));
  s.push(text(x + 3 * S + 8, y + 6, "m", { size: 10, anchor: "start", fill: MID }));
  return s.join("");
}
const svgDoc = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}"><title>${esc(title)}</title>${rect(0, 0, w, h, PAPER)}${body}</svg>\n`;

/* ---------------------------------------------------------------- model geometry */
function prep(key) {
  const m = structuredClone(D.models[key]);
  m.key = key; m.n = key.replace("mc", "");
  m.e0 = m.enclosed?.[0] ?? 0; m.e1 = m.enclosed?.[1] ?? m.L;
  m.openings = m.openings.map((o) => ({ ...o, side: o.side === "veranda" ? "right" : o.side === "enclosed_left" ? "left" : o.side }));
  m.lofty = (o) => o.loft || o.sill >= 2.2;
  return m;
}
/* the roof line of the long elevation at x: highest silhouette edge crossing x */
function roofAt(m, x) {
  const p = m.silhouette;
  let best = 0;
  for (let i = 0; i < p.length; i++) {
    const [ax, az] = p[i], [bx, bz] = p[(i + 1) % p.length];
    if ((x >= Math.min(ax, bx) && x <= Math.max(ax, bx)) && ax !== bx) {
      const z = az + ((x - ax) / (bx - ax)) * (bz - az);
      best = Math.max(best, z);
    }
  }
  if (m.roofband) best = Math.max(best, m.roofband.ridge);
  return best;
}

/* =============================================================================
   PLAN
   ========================================================================== */
const FLOOR = "#F5F1E8", WET = "#EEF2F3", DECK = "#EBDDC6";
function furniture(f, X, Y, S) {
  const s = [];
  const st = `stroke="${MID}" stroke-width="1.1"`;
  const R = (x0, y0, x1, y1, fill = "#fff", rx = 0, extra = "") => `<rect x="${r1(X(x0))}" y="${r1(Y(y0))}" width="${r1((x1 - x0) * S)}" height="${r1((y1 - y0) * S)}" rx="${rx}" fill="${fill}" ${st}${extra}/>`;
  const C = (cx, cy, r, fill = "#fff", extra = "") => `<circle cx="${r1(X(cx))}" cy="${r1(Y(cy))}" r="${r1(r * S)}" fill="${fill}" ${st}${extra}/>`;
  const Lz = (x0, y0, x1, y1, w = 0.9, c = THIN) => line(X(x0), Y(y0), X(x1), Y(y1), c, w);
  switch (f.t) {
    case "sofa": {
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#E9ECE3", 6));
      const b = 0.2;
      const bk = { left: [f.x0, f.y0, f.x0 + b, f.y1], right: [f.x1 - b, f.y0, f.x1, f.y1], back: [f.x0, f.y0, f.x1, f.y0 + b], front: [f.x0, f.y1 - b, f.x1, f.y1] }[f.back];
      s.push(R(...bk, "#DDE2D5", 4));
      const horizontal = f.back === "back" || f.back === "front";
      const n = Math.max(2, Math.round((horizontal ? f.x1 - f.x0 : f.y1 - f.y0) / 0.7));
      for (let i = 1; i < n; i++) {
        if (horizontal) { const x = f.x0 + ((f.x1 - f.x0) * i) / n; s.push(Lz(x, f.y0 + (f.back === "back" ? b : 0.05), x, f.y1 - (f.back === "front" ? b : 0.05))); }
        else { const y = f.y0 + ((f.y1 - f.y0) * i) / n; s.push(Lz(f.x0 + (f.back === "left" ? b : 0.05), y, f.x1 - (f.back === "right" ? b : 0.05), y)); }
      }
      break;
    }
    case "sofa_l": {
      const d = 0.85, b = 0.2;
      let parts;
      if (f.back === "left") parts = [[f.x0, f.y0, f.x0 + d, f.y1], [f.x0 + d, f.y0, f.x1, f.y0 + d]];
      else if (f.back === "right") parts = [[f.x1 - d, f.y0, f.x1, f.y1], [f.x0, f.y0, f.x1 - d, f.y0 + d]];
      else parts = [[f.x0, f.y0, f.x1, f.y0 + d], [f.x0, f.y0 + d, f.x0 + d, f.y1]];
      for (const p of parts) s.push(R(...p, "#E9ECE3", 6));
      if (f.back === "left") { s.push(R(f.x0, f.y0, f.x0 + b, f.y1, "#DDE2D5", 4)); s.push(R(f.x0, f.y0, f.x1, f.y0 + b, "#DDE2D5", 4)); }
      else if (f.back === "right") { s.push(R(f.x1 - b, f.y0, f.x1, f.y1, "#DDE2D5", 4)); s.push(R(f.x0, f.y0, f.x1, f.y0 + b, "#DDE2D5", 4)); }
      else { s.push(R(f.x0, f.y0, f.x1, f.y0 + b, "#DDE2D5", 4)); s.push(R(f.x0, f.y0, f.x0 + b, f.y1, "#DDE2D5", 4)); }
      break;
    }
    case "armchair": case "lounge":
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#E9ECE3", 8));
      s.push(R(f.x0, f.y0, f.x1, f.y0 + 0.16, "#DDE2D5", 5));
      break;
    case "coffee": s.push(R(f.x0, f.y0, f.x1, f.y1, "#F3E6D3", 4)); break;
    case "rug": s.push(R(f.x0, f.y0, f.x1, f.y1, "rgba(163,177,138,.16)", 3, ` stroke-dasharray="4 3"`)); break;
    case "kitchen": {
      const y0 = f.side === "back" ? T : W - T - 0.6, y1 = y0 + 0.6;
      s.push(R(f.x0, y0, f.x1, y1, "#fff"));
      const edge = f.side === "back" ? y1 - 0.04 : y0 + 0.04;
      s.push(Lz(f.x0, edge, f.x1, edge, 0.8));
      if (f.fridge === "x1" || f.fridge === "x0") {
        const fx0 = f.fridge === "x1" ? f.x1 - 0.62 : f.x0;
        s.push(R(fx0, y0, fx0 + 0.62, y1, "#F1F3F4"));
        s.push(Lz(fx0, y0, fx0 + 0.62, y1)); s.push(Lz(fx0 + 0.62, y0, fx0, y1));
      }
      if (f.sink) { const cy = (y0 + y1) / 2; s.push(R(f.sink - 0.3, cy - 0.2, f.sink + 0.3, cy + 0.2, "#EEF2F3", 5)); s.push(C(f.sink + 0.08, cy, 0.035, "#fff")); }
      if (f.hob) { const cy = (y0 + y1) / 2; s.push(R(f.hob - 0.3, cy - 0.25, f.hob + 0.3, cy + 0.25, "#EDEDEB", 3)); for (const [dx, dy] of [[-0.14, -0.11], [0.14, -0.11], [-0.14, 0.11], [0.14, 0.11]]) s.push(C(f.hob + dx, cy + dy, 0.075, "none")); }
      const uy = f.side === "back" ? T + 0.35 : W - T - 0.35;
      s.push(line(X(f.x0), Y(uy), X(f.x1), Y(uy), THIN, 0.8, ' stroke-dasharray="6 4"'));
      break;
    }
    case "table": {
      const n = f.chairs ?? 4;
      const cx = (f.x0 + f.x1) / 2;
      const spots = n >= 4 ? [cx - 0.25, cx + 0.25] : [cx];
      for (const x of spots) { s.push(R(x - 0.2, f.y0 - 0.3, x + 0.2, f.y0 + 0.05, "#fff", 4)); if (n >= 2) s.push(R(x - 0.2, f.y1 - 0.05, x + 0.2, f.y1 + 0.3, "#fff", 4)); }
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#F3E6D3", 3));
      break;
    }
    case "table_round": {
      const n = f.chairs ?? 3;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + Math.PI / n;
        const cx = f.cx + Math.cos(a) * (f.r + 0.12), cy = f.cy + Math.sin(a) * (f.r + 0.12);
        s.push(C(cx, cy, 0.19, "#fff"));
      }
      s.push(C(f.cx, f.cy, f.r, "#F3E6D3"));
      break;
    }
    case "stair": {
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#fff"));
      const n = 8, len = f.x1 - f.x0;
      for (let i = 1; i < n; i++) s.push(Lz(f.x0 + (len * i) / n, f.y0, f.x0 + (len * i) / n, f.y1, 0.9, MID));
      const cy = (f.y0 + f.y1) / 2;
      const [a, b] = f.up === "x1" ? [f.x0 + 0.1, f.x1 - 0.12] : [f.x1 - 0.1, f.x0 + 0.12];
      s.push(line(X(a), Y(cy), X(b), Y(cy), INK, 1.2));
      s.push(`<circle cx="${r1(X(a))}" cy="${r1(Y(cy))}" r="3" fill="${INK}"/>`);
      const dirx = Math.sign(b - a);
      s.push(poly([[X(b), Y(cy)], [X(b) - dirx * 9, Y(cy) - 5], [X(b) - dirx * 9, Y(cy) + 5]], INK));
      break;
    }
    case "ladder": {
      s.push(R(f.x0, f.y0, f.x1, f.y1, "none"));
      const n = 4; for (let i = 1; i < n; i++) s.push(Lz(f.x0 + ((f.x1 - f.x0) * i) / n, f.y0, f.x0 + ((f.x1 - f.x0) * i) / n, f.y1, 0.9, MID));
      break;
    }
    case "shower":
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#fff"));
      s.push(Lz(f.x0, f.y0, f.x1, f.y1, 0.7)); s.push(Lz(f.x1, f.y0, f.x0, f.y1, 0.7));
      s.push(C((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 0.04, "#fff"));
      break;
    case "wc": {
      const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[f.dir];
      const wx = f.x - v[0] * 0.25, wy = f.y - v[1] * 0.25; // tank against the wall
      const tw = 0.4, td = 0.18;
      if (v[0] === 0) s.push(R(wx - tw / 2, wy - td / 2, wx + tw / 2, wy + td / 2, "#fff", 3));
      else s.push(R(wx - td / 2, wy - tw / 2, wx + td / 2, wy + tw / 2, "#fff", 3));
      const bx = f.x + v[0] * 0.06, by = f.y + v[1] * 0.06;
      s.push(`<ellipse cx="${r1(X(bx))}" cy="${r1(Y(by))}" rx="${r1((v[0] ? 0.24 : 0.18) * S)}" ry="${r1((v[0] ? 0.18 : 0.24) * S)}" fill="#fff" ${st}/>`);
      break;
    }
    case "basin": {
      const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[f.dir];
      const w = 0.5, d = 0.38;
      const cx = f.x, cy = f.y;
      if (v[0] === 0) { s.push(R(cx - w / 2, cy - d / 2, cx + w / 2, cy + d / 2, "#fff", 4)); s.push(`<ellipse cx="${r1(X(cx))}" cy="${r1(Y(cy))}" rx="${r1(0.17 * S)}" ry="${r1(0.12 * S)}" fill="#EEF2F3" ${st}/>`); }
      else { s.push(R(cx - d / 2, cy - w / 2, cx + d / 2, cy + w / 2, "#fff", 4)); s.push(`<ellipse cx="${r1(X(cx))}" cy="${r1(Y(cy))}" rx="${r1(0.12 * S)}" ry="${r1(0.17 * S)}" fill="#EEF2F3" ${st}/>`); }
      break;
    }
    case "washer": s.push(R(f.x0, f.y0, f.x1, f.y1, "#fff")); s.push(C((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 0.2, "#EEF2F3")); break;
    case "wardrobe": s.push(R(f.x0, f.y0, f.x1, f.y1, "#fff")); s.push(Lz(f.x0, f.y0, f.x1, f.y1)); break;
    case "desk":
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#F3E6D3", 2));
      { const cx = (f.x0 + f.x1) / 2, cy = f.y1 + 0.25; s.push(C(cx, cy, 0.2, "#fff")); }
      break;
    case "daybed": case "bench":
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#fff", 4));
      if (f.t === "daybed") s.push(R(f.x0 + 0.06, f.y0 + 0.08, f.x0 + 0.45, f.y1 - 0.08, "#F1EEE7", 6));
      break;
    case "nightstand": s.push(R(f.x0, f.y0, f.x1, f.y1, "#F3E6D3", 2)); break;
    case "bed": s.push(...bedPlan(f, X, Y, S, st)); break;
    case "plant": s.push(C(f.cx, f.cy, f.r, "#E3EBDC")); s.push(C(f.cx, f.cy, f.r * 0.45, "none")); break;
    case "stove":
      s.push(R(f.cx - 0.42, f.cy - 0.4, f.cx + 0.42, f.cy + 0.42, "#EFEBE4", 2));
      s.push(C(f.cx, f.cy, f.r, "#3A3F44")); s.push(C(f.cx, f.cy, f.r * 0.35, "#fff"));
      break;
    case "bar": {
      s.push(R(f.x0, f.y0, f.x1, f.y1, "#F3E6D3", 2));
      const n = f.stools ?? 3;
      for (let i = 0; i < n; i++) s.push(C(f.x0 + ((f.x1 - f.x0) * (i + 0.5)) / n, f.y0 - 0.25, 0.16, "#fff"));
      break;
    }
  }
  return s.join("");
}
function bedPlan(b, X, Y, S, st) {
  const s = [];
  s.push(`<rect x="${r1(X(b.x0))}" y="${r1(Y(b.y0))}" width="${r1((b.x1 - b.x0) * S)}" height="${r1((b.y1 - b.y0) * S)}" rx="4" fill="#fff" ${st}/>`);
  const head = b.head ?? "back";
  if (head === "back") {
    const w = (b.x1 - b.x0 - 0.2) / 2;
    for (let i = 0; i < 2; i++) s.push(`<rect x="${r1(X(b.x0 + 0.1 + i * w))}" y="${r1(Y(b.y0 + 0.08))}" width="${r1((w - 0.06) * S)}" height="${r1(0.32 * S)}" rx="6" fill="#F1EEE7" ${st}/>`);
    s.push(`<path d="M${r1(X(b.x0))} ${r1(Y(b.y0 + 0.62))} H${r1(X(b.x1))} M${r1(X(b.x0))} ${r1(Y(b.y0 + 0.62))} L${r1(X(b.x0 + 0.35))} ${r1(Y(b.y0 + 0.9))}" fill="none" stroke="${THIN}" stroke-width="0.9"/>`);
  }
  return s;
}

function openingSymbol(o, m, X, Y, S, L) {
  const s = [];
  const horiz = o.side === "front" || o.side === "back";
  const wy0 = o.side === "back" ? 0 : W - T, wy1 = wy0 + T;
  const wx0 = o.side === "left" ? m.e0 : m.e1 - T, wx1 = wx0 + T;
  if (horiz) {
    s.push(rect(X(o.a), Y(wy0) - 0.5, (o.b - o.a) * S, T * S + 1, PAPER));
    s.push(line(X(o.a), Y(wy0), X(o.a), Y(wy1), INK, 1.4) + line(X(o.b), Y(wy0), X(o.b), Y(wy1), INK, 1.4));
  } else {
    s.push(rect(X(wx0) - 0.5, Y(o.a), T * S + 1, (o.b - o.a) * S, PAPER));
    s.push(line(X(wx0), Y(o.a), X(wx1), Y(o.a), INK, 1.4) + line(X(wx0), Y(o.b), X(wx1), Y(o.b), INK, 1.4));
  }
  const glass = (a, b, off) => horiz ? line(X(a), Y(wy0 + off), X(b), Y(wy0 + off), INK, 1.1) : line(X(wx0 + off), Y(a), X(wx0 + off), Y(b), INK, 1.1);
  const inward = o.side === "back" ? 1 : o.side === "front" ? -1 : o.side === "left" ? 1 : -1;
  if (o.type === "window" || o.type === "fixed") {
    s.push(glass(o.a, o.b, T * 0.35) + glass(o.a, o.b, T * 0.65));
    if (o.type === "window") s.push(horiz ? line(X(o.a), Y(wy0 + T / 2), X(o.b), Y(wy0 + T / 2), THIN, 0.6) : line(X(wx0 + T / 2), Y(o.a), X(wx0 + T / 2), Y(o.b), THIN, 0.6));
  } else if (o.type === "slide") {
    const mid = (o.a + o.b) / 2;
    s.push(glass(o.a, mid + 0.05, T * 0.3) + glass(mid - 0.05, o.b, T * 0.7));
    const ay = horiz ? Y(wy0 + T / 2) + inward * -14 : null;
    if (horiz) s.push(line(X(o.a + 0.3), ay, X(mid - 0.2), ay, MID, 0.9) + poly([[X(mid - 0.2), ay], [X(mid - 0.2) - 7, ay - 3.5], [X(mid - 0.2) - 7, ay + 3.5]], MID));
  } else if (o.type === "fold") {
    const n = Math.max(3, Math.round((o.b - o.a) / 0.75));
    const w = (o.b - o.a) / n;
    let d = "";
    for (let i = 0; i <= n; i++) {
      const p = o.a + i * w;
      const dep = i % 2 ? 0.3 : 0;
      if (horiz) d += `${i ? "L" : "M"}${r1(X(p))} ${r1(Y(wy0 + (inward > 0 ? T : 0)) + inward * dep * S)} `;
    }
    s.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.1"/>`);
  } else if (o.type === "door" || o.type === "door2") {
    const leaves = o.type === "door2" ? [[o.a, (o.a + o.b) / 2, "a"], [(o.a + o.b) / 2, o.b, "b"]] : [[o.a, o.b, o.hinge ?? "a"]];
    for (const [a, b, h] of leaves) {
      const w = b - a;
      const hp = h === "a" ? a : b, fp = h === "a" ? b : a;
      if (horiz) {
        const yIn = inward > 0 ? wy1 : wy0;
        s.push(line(X(hp), Y(yIn), X(hp), Y(yIn) + inward * w * S, INK, 1.4));
        s.push(`<path d="M${r1(X(hp))} ${r1(Y(yIn) + inward * w * S)} A${r1(w * S)} ${r1(w * S)} 0 0 ${(h === "a") === (inward > 0) ? 0 : 1} ${r1(X(fp))} ${r1(Y(yIn))}" fill="none" stroke="${THIN}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
      } else {
        const xIn = inward > 0 ? wx1 : wx0;
        s.push(line(X(xIn), Y(hp), X(xIn) + inward * w * S, Y(hp), INK, 1.4));
        s.push(`<path d="M${r1(X(xIn) + inward * w * S)} ${r1(Y(hp))} A${r1(w * S)} ${r1(w * S)} 0 0 ${(h === "a") === (inward > 0) ? 1 : 0} ${r1(X(xIn))} ${r1(Y(fp))}" fill="none" stroke="${THIN}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
      }
    }
  }
  return s.join("");
}

function partition(wl, X, Y, S) {
  const s = [];
  const th = 0.08;
  const vertical = wl.x0 === wl.x1;
  const segs = [];
  if (wl.door) {
    const a = wl.door.at - wl.door.w / 2, b = wl.door.at + wl.door.w / 2;
    if (vertical) { segs.push([wl.y0, a], [b, wl.y1]); } else { segs.push([wl.x0, a], [b, wl.x1]); }
  } else segs.push(vertical ? [wl.y0, wl.y1] : [wl.x0, wl.x1]);
  for (const [a, b] of segs) {
    if (b - a <= 0.001) continue;
    if (vertical) s.push(rect(X(wl.x0 - th / 2), Y(a), th * S, (b - a) * S, INK));
    else s.push(rect(X(a), Y(wl.y0 - th / 2), (b - a) * S, th * S, INK));
  }
  if (wl.door) {
    const a = wl.door.at - wl.door.w / 2, w = wl.door.w, dir = wl.door.dir ?? 1;
    if (vertical) {
      const x = wl.x0;
      s.push(line(X(x), Y(a), X(x) + dir * w * S, Y(a), INK, 1.3));
      s.push(`<path d="M${r1(X(x) + dir * w * S)} ${r1(Y(a))} A${r1(w * S)} ${r1(w * S)} 0 0 ${dir > 0 ? 1 : 0} ${r1(X(x))} ${r1(Y(a + w))}" fill="none" stroke="${THIN}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
    } else {
      const y = wl.y0;
      s.push(line(X(a), Y(y), X(a), Y(y) + dir * w * S, INK, 1.3));
      s.push(`<path d="M${r1(X(a))} ${r1(Y(y) + dir * w * S)} A${r1(w * S)} ${r1(w * S)} 0 0 ${dir > 0 ? 0 : 1} ${r1(X(a + w))} ${r1(Y(y))}" fill="none" stroke="${THIN}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
    }
  }
  return s.join("");
}

function freeSpot(r, wM, hM, obstacles) {
  let best = null;
  for (const fy of [0.5, 0.35, 0.65, 0.22, 0.78]) for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
    const cx = r.x0 + (r.x1 - r.x0) * fx, cy = r.y0 + (r.y1 - r.y0) * fy;
    const a = [cx - wM / 2, cy - hM / 2, cx + wM / 2, cy + hM / 2];
    let hit = 0;
    for (const o of obstacles) hit += Math.max(0, Math.min(a[2], o[2]) - Math.max(a[0], o[0])) * Math.max(0, Math.min(a[3], o[3]) - Math.max(a[1], o[1]));
    const score = hit * 100 + Math.hypot(fx - 0.5, fy - 0.5);
    if (!best || score < best.score) best = { cx, cy, score };
  }
  return best;
}
function footprint(f) {
  if (f.t === "rug") return null;
  if (f.cx !== undefined) return [f.cx - f.r - 0.3, f.cy - f.r - 0.3, f.cx + f.r + 0.3, f.cy + f.r + 0.3];
  if (f.x !== undefined) return [f.x - 0.3, f.y - 0.35, f.x + 0.3, f.y + 0.35];
  if (f.t === "kitchen") { const y0 = f.side === "back" ? T : W - T - 0.6; return [f.x0, y0, f.x1, y0 + 0.6]; }
  if (f.t === "table" || f.t === "bar") return [f.x0, f.y0 - 0.35, f.x1, f.y1 + 0.35];
  return [f.x0, f.y0, f.x1, f.y1];
}
function roomLabel(r, L, X, Y, S, { loft = false, obstacles = [] } = {}) {
  const name = loft ? L.loft : L.room[r.k];
  const area = (r.x1 - r.x0) * (r.y1 - r.y0);
  const w = Math.max(name.length * 7.6, 62) + 16;
  const spot = r.lx !== undefined ? { cx: r.lx, cy: r.ly } : freeSpot(r, w / S, 0.38, obstacles);
  const cx = spot.cx, cy = spot.cy;
  return `<g>${rect(X(cx) - w / 2, Y(cy) - 19, w, 36, "rgba(252,251,248,.88)", "none", 0, ' rx="6"')}${text(X(cx), Y(cy) - 3, name, { size: 13.5, weight: 700 })}${text(X(cx), Y(cy) + 12, `${fmt(area, L, 1)} m²`, { size: 11.5, fill: MID })}</g>`;
}

function planBody(m, L, ox, oy, S, level) {
  const X = (x) => ox + x * S, Y = (y) => oy + y * S;
  const s = [];
  const defs = `<pattern id="tile-${level}" width="${0.3 * S}" height="${0.3 * S}" patternUnits="userSpaceOnUse"><path d="M0 0H${0.3 * S}V${0.3 * S}" fill="none" stroke="#D5DDE0" stroke-width="0.7"/></pattern><pattern id="deck-${level}" width="${0.14 * S}" height="10" patternUnits="userSpaceOnUse"><rect width="${0.14 * S}" height="10" fill="${DECK}"/><path d="M0 0V10" stroke="#CDB89A" stroke-width="1"/></pattern>`;
  s.push(`<defs>${defs}</defs>`);
  // decks and verandas (outside the enclosed volume)
  const outside = [];
  if (m.veranda) outside.push([m.veranda.x0, 0, m.veranda.x1, W]);
  if (m.porch) outside.push([m.porch.x0, 0, m.porch.x1, W]);
  if (m.deck && !m.deck.front) outside.push([m.deck.x0, 0.2, m.deck.x1, W - 0.2]);
  if (m.deck?.front) outside.push([m.deck.x0, W, m.deck.x1, W + 1.3]);
  for (const [a, b, c, d] of outside) s.push(rect(X(a), Y(b), (c - a) * S, (d - b) * S, level === "eg" ? `url(#deck-${level})` : "none", level === "eg" ? MID : THIN, 0.8, level === "eg" ? "" : ' stroke-dasharray="5 4"'));
  if (level === "eg" && (m.veranda || m.porch)) {
    const v = m.veranda ?? m.porch;
    for (const [px, py] of [[v.x0 === 0 ? 0.05 : v.x1 - 0.12, 0.02], [v.x0 === 0 ? 0.05 : v.x1 - 0.12, W - 0.14]]) s.push(rect(X(px), Y(py), 0.12 * S, 0.12 * S, INK));
  }
  if (level === "eg" && m.porch) for (const yy of [0, W - 0.06]) s.push(rect(X(m.porch.x0 + 0.05), Y(yy), (m.porch.x1 - m.porch.x0 - 0.1) * S, 0.06 * S, "#B98A5B", INK, 0.6));
  if (level === "eg" && m.deck?.rail) s.push(`<path d="M${X(m.deck.x1 - 0.02)} ${Y(0.2)} H${X(m.deck.x0)} V${Y(W - 0.2)} H${X(m.deck.x1 - 0.02)}" fill="none" stroke="${INK}" stroke-width="2.2"/>`);
  if (level === "eg" && m.deck?.front) for (let i = 1; i <= 2; i++) s.push(line(X(m.deck.x0 + 0.4), Y(W + 1.3 - i * 0.3), X(m.deck.x1 - 0.4), Y(W + 1.3 - i * 0.3), MID, 0.8));
  // floors
  s.push(rect(X(m.e0 + T), Y(T), (m.e1 - m.e0 - 2 * T) * S, (W - 2 * T) * S, FLOOR));
  if (level === "eg") for (const r of m.rooms) if (r.k === "bad") s.push(rect(X(r.x0), Y(r.y0), (r.x1 - r.x0) * S, (r.y1 - r.y0) * S, `url(#tile-${level})`));
  if (level === "eg") {
    for (const f of m.furniture) if (f.t === "rug") s.push(furniture(f, X, Y, S));
    for (const f of m.furniture) if (f.t !== "rug") s.push(furniture(f, X, Y, S));
    for (const wl of m.walls) s.push(partition(wl, X, Y, S));
  } else {
    // sleeping level: lofts, void, beds, railings
    const lofts = m.lofts ?? [];
    let gaps = [[m.e0 + T, m.e1 - T]];
    for (const lf of lofts) {
      s.push(rect(X(lf.x0), Y(T), (lf.x1 - lf.x0) * S, (W - 2 * T) * S, "#EFE6D6"));
      gaps = gaps.flatMap(([a, b]) => (lf.x1 <= a || lf.x0 >= b) ? [[a, b]] : [[a, lf.x0], [lf.x1, b]].filter(([p, q]) => q - p > 0.05));
    }
    for (const [a, b] of gaps) {
      s.push(line(X(a), Y(T), X(b), Y(W - T), THIN, 0.8) + line(X(a), Y(W - T), X(b), Y(T), THIN, 0.8));
      s.push(`<g>${rect(X((a + b) / 2) - 42, Y(W / 2) - 11, 84, 22, PAPER, "none", 0, ' rx="4"')}${text(X((a + b) / 2), Y(W / 2) + 4, L.void, { size: 12, fill: MID, italic: true })}</g>`);
    }
    for (const lf of lofts) {
      s.push(bedPlan(lf.bed, X, Y, S, `stroke="${MID}" stroke-width="1.1"`).join(""));
      if (lf.wardrobe) s.push(furniture({ t: "wardrobe", ...lf.wardrobe }, X, Y, S));
      for (const edge of [lf.x0, lf.x1]) {
        if (edge <= m.e0 + T + 0.01 || edge >= m.e1 - T - 0.01) continue;
        s.push(line(X(edge), Y(T), X(edge), Y(W - T), INK, 2.4));
        for (let y = T + 0.3; y < W - T; y += 0.45) s.push(`<circle cx="${r1(X(edge))}" cy="${r1(Y(y))}" r="2.6" fill="${INK}"/>`);
      }
      const ceil = Math.min(...[lf.x0 + 0.2, (lf.x0 + lf.x1) / 2, lf.x1 - 0.2].map((x) => roofAt(m, x))) - H.roof_thk;
      const head = (m.roofband ? m.roofband.ridge - H.roof_thk : ceil) - H.loft_top;
      const lr = { x0: lf.x0, x1: lf.x1, y0: T, y1: W - T, ly: W - T - 0.52, lx: (lf.x0 + lf.x1) / 2 };
      s.push(roomLabel(lr, L, X, Y, S, { loft: true }));
      s.push(text(X(lr.lx), Y(W - T) - 12, `${m.roofband ? L.stand : L.clear} ${fmt(head, L)} m`, { size: 10.5, fill: MID }));
    }
    for (const f of m.furniture) if (f.t === "stair" || f.t === "ladder") s.push(`<g opacity=".55">${furniture(f, X, Y, S)}</g>`);
  }
  // exterior walls (poché) — ring with openings cut later
  s.push(`<path fill-rule="evenodd" fill="${INK}" d="M${X(m.e0)} ${Y(0)}H${X(m.e1)}V${Y(W)}H${X(m.e0)}Z M${X(m.e0 + T)} ${Y(T)}V${Y(W - T)}H${X(m.e1 - T)}V${Y(T)}Z"/>`);
  for (const o of m.openings) {
    if (level === "eg" ? m.lofty(o) : !m.lofty(o)) continue;
    s.push(openingSymbol(o, m, X, Y, S, L));
  }
  if (level === "eg") { const obs = m.furniture.map(footprint).filter(Boolean); for (const r of m.rooms) if (r.label !== false) s.push(roomLabel(r, L, X, Y, S, { obstacles: obs })); }
  if (level === "eg") {
    const xa = Math.min(m.e0, m.deck?.x0 ?? 0, m.porch?.x0 ?? 0) - 0.4, xb = Math.max(m.e1, m.veranda?.x1 ?? 0) + 0.4, yc = W / 2;
    s.push(line(X(xa), Y(yc), X(xb), Y(yc), "#B3401C", 1.1, ' stroke-dasharray="14 5 3 5"'));
    for (const xe of [xa, xb]) s.push(`<g><circle cx="${r1(X(xe))}" cy="${r1(Y(yc))}" r="11" fill="#fff" stroke="#B3401C" stroke-width="1.4"/>${text(X(xe), Y(yc) + 4.5, "A", { size: 12, weight: 700, fill: "#B3401C" })}</g>`);
  }
  return { svg: s.join(""), X, Y };
}

function planSheet(m, L) {
  const S = 100;
  const minX = Math.min(0, m.deck?.x0 ?? 0, m.porch?.x0 ?? 0), maxX = Math.max(m.L, m.veranda?.x1 ?? 0);
  const wide = (maxX - minX) * S;
  const width = Math.max(1160, wide + 260);
  const ox = (width - wide) / 2 - minX * S - 20;
  const s = [];
  // ground floor
  let y = 70;
  s.push(text(ox + minX * S, y, L.eg.toUpperCase(), { size: 15, weight: 700, anchor: "start", ls: 1.5 }));
  const oy1 = y + 70;
  const eg = planBody(m, L, ox, oy1, S, "eg");
  s.push(eg.svg);
  // dimensions: back = room chain, front = overall, right = width
  const cuts = [...new Set([m.e0, ...m.walls.filter((w) => w.x0 === w.x1 && w.y0 <= T + 0.01).map((w) => r2(w.x0)), m.e1])].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) s.push(dim(eg.X(cuts[i]), eg.X(cuts[i + 1]), oy1 - 34, L, { label: fmt(cuts[i + 1] - cuts[i], L), ext: oy1 - 4 }));
  const frontDeck = m.deck?.front ? 1.3 : 0;
  const fy = oy1 + (W + frontDeck) * S + 38;
  s.push(dim(eg.X(m.e0), eg.X(m.e1), fy, L, { label: fmt(m.e1 - m.e0, L), side: 1, ext: oy1 + W * S + 4 }));
  if (minX < 0 || maxX > m.L || m.e0 > 0) s.push(dim(eg.X(minX), eg.X(maxX), fy + 34, L, { label: fmt(maxX - minX, L), side: 1, ext: fy + 4 }));
  s.push(dim(oy1, oy1 + W * S, eg.X(maxX) + 86, L, { dir: "v", label: fmt(W, L), side: 1, ext: eg.X(maxX) + 6 }));
  // area summary
  const net = m.rooms.filter((r) => r.k !== "veranda").reduce((a, r) => a + (r.x1 - r.x0) * (r.y1 - r.y0), 0);
  const loftA = (m.lofts ?? []).reduce((a, lf) => a + (lf.x1 - lf.x0) * (W - 2 * T), 0);
  // loft
  y = fy + 110;
  s.push(text(ox + minX * S, y, L.loftPlan.toUpperCase(), { size: 15, weight: 700, anchor: "start", ls: 1.5 }));
  const oy2 = y + 40;
  const lp = planBody(m, L, ox, oy2, S, "loft");
  s.push(lp.svg);
  for (const lf of m.lofts ?? []) s.push(dim(lp.X(lf.x0), lp.X(lf.x1), oy2 + W * S + 34, L, { label: fmt(lf.x1 - lf.x0, L), side: 1, ext: oy2 + W * S + 4 }));
  const by = oy2 + W * S + 90;
  s.push(text(ox + minX * S, by, `${L.area} ${fmt(net, L, 1)} m²  ·  ${L.loftArea} ${fmt(loftA, L, 1)} m²`, { size: 13, weight: 600, anchor: "start" }));
  s.push(scaleBar(width - 420, by - 4, S));
  const tb = by + 30;
  s.push(titleBlock(L, 30, tb, width - 60, m, L.sheets.plan));
  const height = tb + 64 + 30;
  return svgDoc(width, height, s.join(""), `MD ${m.n} – ${L.sheets.plan}`);
}

/* =============================================================================
   ELEVATIONS
   ========================================================================== */
const MAT = {
  wood: { fill: "#D9B183", line: "#B08355", dir: "v", gap: 0.11, w: 0.8 },
  seam: { fill: "#3A4146", line: "#5B656D", dir: "v", gap: 0.42, w: 1.2 },
  white: { fill: "#F2F0EA", line: "#D2CDC2", dir: "h", gap: 0.16, w: 0.8 },
  slats: { fill: "#5A4634", line: "#C79A69", dir: "slat", gap: 0.12, w: 0.06 },
  glass: { fill: "#A9C9DA", line: "#87AABD", dir: "h", gap: 0.5, w: 0.6 },
};
function matFill(mat, x0, x1, z0, z1, X, Z, S) {
  const M = MAT[mat];
  const s = [rect(X(x0), Z(z1), (x1 - x0) * S, (z1 - z0) * S, M.fill)];
  if (M.dir === "v") for (let x = x0 + M.gap; x < x1; x += M.gap) s.push(line(X(x), Z(z1), X(x), Z(z0), M.line, M.w));
  if (M.dir === "h") for (let z = z0 + M.gap; z < z1; z += M.gap) s.push(line(X(x0), Z(z), X(x1), Z(z), M.line, M.w));
  if (M.dir === "slat") for (let x = x0 + 0.02; x < x1; x += M.gap) s.push(rect(X(x), Z(z1), M.w * S, (z1 - z0) * S, M.line));
  return s.join("");
}
function glassRect(x0, x1, z0, z1, X, Z, S, { divisions = 1, frame = "#2E3B41" } = {}) {
  const s = [];
  const id = `g${Math.round(x0 * 100)}${Math.round(z0 * 100)}`;
  s.push(`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C7DEEA"/><stop offset=".55" stop-color="#8FB4C9"/><stop offset="1" stop-color="#6E97AE"/></linearGradient></defs>`);
  s.push(rect(X(x0), Z(z1), (x1 - x0) * S, (z1 - z0) * S, `url(#${id})`, frame, 3));
  for (let i = 1; i < divisions; i++) { const x = x0 + ((x1 - x0) * i) / divisions; s.push(line(X(x), Z(z1), X(x), Z(z0), frame, 2.4)); }
  s.push(line(X(x0 + (x1 - x0) * 0.15), Z(z1 - 0.1), X(x0 + (x1 - x0) * 0.45), Z(z0 + (z1 - z0) * 0.35), "rgba(255,255,255,.55)", 2));
  return s.join("");
}
function chassisFront(m, X, Z, S) {
  const s = [];
  const a = m.e0 > 0 ? m.e0 : 0;
  s.push(rect(X(a + 0.25), Z(H.chassis_top), (m.L - a - 0.5) * S, (H.chassis_top - H.chassis_bottom) * S, "#2B3136"));
  const mid = (a + m.L) / 2;
  for (const cx of [mid - 0.42, mid + 0.42]) {
    s.push(`<circle cx="${r1(X(cx))}" cy="${r1(Z(0.33))}" r="${r1(0.33 * S)}" fill="#15191C"/>`);
    s.push(`<circle cx="${r1(X(cx))}" cy="${r1(Z(0.33))}" r="${r1(0.17 * S)}" fill="#8E989F" stroke="#5B656D" stroke-width="2"/>`);
  }
  s.push(`<path d="M${X(mid - 0.85)} ${Z(0.55)} A${0.42 * S} ${0.42 * S} 0 0 1 ${X(mid)} ${Z(0.55)} A${0.42 * S} ${0.42 * S} 0 0 1 ${X(mid + 0.85)} ${Z(0.55)}" fill="none" stroke="#2B3136" stroke-width="5"/>`);
  for (const jx of [a + 0.4, m.L - 0.4]) { s.push(rect(X(jx) - 4, Z(H.chassis_bottom), 8, H.chassis_bottom * S, "#4A5258")); s.push(rect(X(jx) - 12, Z(0.03), 24, 4, "#2B3136")); }
  if (!(m.deck && !m.deck.front && m.deck.x0 < 0) && !m.porch) s.push(`<path d="M${X(a + 0.25)} ${Z(0.48)} L${X(-1.15)} ${Z(0.44)} L${X(-1.35)} ${Z(0.44)}" fill="none" stroke="#2B3136" stroke-width="6" stroke-linecap="round"/>` + `<circle cx="${X(-1.4)}" cy="${Z(0.44)}" r="6" fill="#2B3136"/>`);
  return s.join("");
}
function elevationFront(m, L, ox, gy, S) {
  const X = (x) => ox + x * S, Z = (z) => gy - z * S;
  const s = [];
  const clip = `clip-${m.key}-f`;
  s.push(`<defs><clipPath id="${clip}"><polygon points="${m.silhouette.map(([x, z]) => `${r1(X(x))},${r1(Z(z))}`).join(" ")}"/></clipPath></defs>`);
  // decks behind the chassis line
  if (m.deck && !m.deck.front) { s.push(rect(X(m.deck.x0), Z(H.floor), (m.deck.x1 - m.deck.x0) * S, (H.floor - 0.55) * S, "#8C6A48")); for (const px of [m.deck.x0 + 0.1, (m.deck.x0 + m.deck.x1) / 2]) s.push(rect(X(px), Z(0.55), 8, 0.55 * S, "#5C4632")); if (m.deck.rail) { s.push(line(X(m.deck.x0), Z(H.floor + 1.0), X(0), Z(H.floor + 1.0), INK, 2.4)); for (let x = m.deck.x0; x <= 0.01; x += 0.4) s.push(line(X(x), Z(H.floor), X(x), Z(H.floor + 1.0), INK, 1.6)); for (const zz of [0.33, 0.66]) s.push(line(X(m.deck.x0), Z(H.floor + zz), X(0), Z(H.floor + zz), MID, 0.8)); } }
  s.push(chassisFront(m, X, Z, S));
  s.push(`<g clip-path="url(#${clip})">`);
  for (const f of m.facade) s.push(matFill(f.mat, f.x0, f.x1, f.z0 ?? 0, f.z1 ?? 6, X, Z, S));
  if (m.roofband) s.push(rect(X(-0.3), Z(m.roofband.eave + 0.02), (m.L + 0.6) * S, 0.02 * S, "#232A2E"));
  s.push(`</g>`);
  // roof band of the gable roof (MD 6)
  if (m.roofband) {
    const rb = m.roofband;
    s.push(poly([[X(-0.3), Z(rb.eave - 0.25)], [X(m.L + 0.3), Z(rb.eave - 0.25)], [X(m.L + 0.3), Z(rb.ridge)], [X(-0.3), Z(rb.ridge)]], "#353D42"));
    for (let x = -0.15; x < m.L + 0.3; x += 0.42) s.push(line(X(x), Z(rb.ridge), X(x), Z(rb.eave - 0.25), "#56616A", 1.2));
    s.push(line(X(-0.3), Z(rb.ridge), X(m.L + 0.3), Z(rb.ridge), INK, 3));
  }
  if (m.veranda) {
    const v = m.veranda, eave = roofAt(m, (v.x0 + v.x1) / 2) - 0.45;
    s.push(rect(X(v.x0), Z(eave), (v.x1 - v.x0) * S, (eave - H.floor) * S, "#4C5458"));
    s.push(rect(X(v.x0 + 0.1), Z(eave), (v.x1 - v.x0 - 0.2) * S, (eave - H.floor) * S, "#666F74"));
    s.push(glassRect(v.x0 + 0.15, v.x0 + 1.3, H.floor, H.floor + 2.15, X, Z, S, { divisions: 2 }));
    for (const px of [v.x1 - 0.12]) s.push(rect(X(px), Z(eave), 0.12 * S, (eave - H.floor) * S, "#2E3B41"));
    s.push(line(X(v.x0 + 0.2), Z(H.floor + 0.95), X(v.x1 - 0.12), Z(H.floor + 0.95), INK, 2));
  }
  // openings on the front
  for (const o of m.openings.filter((o) => o.side === "front")) {
    const z0 = H.floor + o.sill, z1 = H.floor + o.head;
    const div = o.type === "fold" ? Math.round((o.b - o.a) / 0.75) : o.type === "slide" ? 2 : o.type === "door2" ? 2 : 1;
    s.push(glassRect(o.a, o.b, z0, z1, X, Z, S, { divisions: div }));
    if (o.type === "door") s.push(rect(X(o.hinge === "b" ? o.a + 0.08 : o.b - 0.12), Z(H.floor + 1.05), 4, 0.25 * S, "#C9CED2"));
  }
  if (m.porch) {
    s.push(matFill("slats", m.porch.x0, m.porch.x1, H.floor, roofAt(m, m.porch.x1) - 0.1, X, Z, S));
  }
  if (m.chimney) { const cx = m.chimney.x, top = roofAt(m, cx); s.push(rect(X(cx) - 7, Z(top + 0.75), 14, 0.75 * S, "#2B3136")); s.push(rect(X(cx) - 12, Z(top + 0.82), 24, 6, "#2B3136")); }
  // floor line, plinth, fascia
  s.push(rect(X(m.e0), Z(H.floor), (m.e1 - m.e0) * S, (H.floor - 0.55) * S, "#2B3136"));
  s.push(poly(m.silhouette.map(([x, z]) => [X(x), Z(z)]), "none", INK, 2.6));
  if (m.deck?.front) {
    const d = m.deck;
    s.push(rect(X(d.x0), Z(H.floor + 0.02), (d.x1 - d.x0) * S, (H.floor - 0.15) * S, "#9A764F", INK, 1));
    for (let i = 1; i <= 2; i++) s.push(rect(X(d.x0 + 0.3 * i), Z(H.floor - i * 0.18), (d.x1 - d.x0 - 0.6 * i) * S, 0.18 * S, i === 1 ? "#B48D63" : "#C9A57C", INK, 0.8));
  }
  s.push(line(X(-2.0), gy, X(m.L + 2.2), gy, INK, 1.6));
  for (let x = -2.0; x < m.L + 2.2; x += 0.16) s.push(line(X(x), gy, X(x) - 6, gy + 6, THIN, 0.7));
  return { svg: s.join(""), X, Z };
}
function elevationEnd(m, L, ox, gy, S) {
  const U = (u) => ox + u * S, Z = (z) => gy - z * S;
  const s = [];
  const e = m.end;
  const lastMat = m.facade[m.facade.length - 1].mat === "glass" ? "white" : m.facade[m.facade.length - 1].mat;
  if (e.behind) s.push(rect(U(0), Z(e.behind), W * S, (e.behind - e.top) * S, "#C9CBC8", INK, 1.2));
  let outline;
  if (e.shape === "gable") {
    const ov = e.aframe ? 0.35 : 0.15;
    outline = [[0, 0.55], [0, e.eave], [W / 2, e.ridge], [W, e.eave], [W, 0.55]];
    s.push(`<defs><clipPath id="clip-${m.key}-e"><polygon points="${outline.map(([u, z]) => `${r1(U(u))},${r1(Z(z))}`).join(" ")}"/></clipPath></defs>`);
    s.push(`<g clip-path="url(#clip-${m.key}-e)">${matFill(lastMat, 0, W, 0, e.ridge, U, Z, S)}</g>`);
    s.push(poly([[U(-ov), Z(e.eave - ov * 1.2)], [U(W / 2), Z(e.ridge + 0.12)], [U(W + ov), Z(e.eave - ov * 1.2)], [U(W + ov - 0.12), Z(e.eave - ov * 1.2)], [U(W / 2), Z(e.ridge - 0.08)], [U(-ov + 0.12), Z(e.eave - ov * 1.2)]], "#2E3B41"));
  } else {
    outline = [[0, 0.55], [0, e.top], [W, e.top], [W, 0.55]];
    s.push(matFill(lastMat, 0, W, 0.55, e.top, U, Z, S));
  }
  for (const o of m.openings.filter((o) => o.side === "right")) {
    const a = W - o.b, b = W - o.a; // viewed from the right end, the front is on the left
    s.push(glassRect(a, b, H.floor + o.sill, H.floor + o.head, U, Z, S, { divisions: o.type === "fixed" ? 2 : 1 }));
  }
  if (m.veranda) { s.push(rect(U(0.1), Z(e.eave ?? e.top), (W - 0.2) * S, ((e.eave ?? e.top) - H.floor) * S, "#666F74")); s.push(glassRect(0.4, 2.15, H.floor, H.floor + 2.15, U, Z, S, { divisions: 2 })); for (const u of [0, W - 0.12]) s.push(rect(U(u), Z(e.eave ?? e.top), 0.12 * S, ((e.eave ?? e.top) - H.floor) * S, "#2E3B41")); }
  s.push(rect(U(0), Z(H.floor), W * S, (H.floor - 0.55) * S, "#2B3136"));
  s.push(poly(outline.map(([u, z]) => [U(u), Z(z)]), "none", INK, 2.6));
  // chassis seen from the end
  s.push(rect(U(0.35), Z(H.chassis_top), (W - 0.7) * S, (H.chassis_top - H.chassis_bottom) * S, "#2B3136"));
  for (const u of [0.1, W - 0.38]) s.push(rect(U(u), Z(0.66), 0.28 * S, 0.66 * S, "#15191C", "none", 0, ' rx="6"'));
  for (const u of [0.45, W - 0.45]) s.push(rect(U(u) - 4, Z(H.chassis_bottom), 8, H.chassis_bottom * S, "#4A5258"));
  s.push(line(U(-0.8), gy, U(W + 0.8), gy, INK, 1.6));
  for (let u = -0.8; u < W + 0.8; u += 0.16) s.push(line(U(u), gy, U(u) - 6, gy + 6, THIN, 0.7));
  return { svg: s.join(""), U, Z, top: e.shape === "gable" ? e.ridge : Math.max(e.top, e.behind ?? 0) };
}
function elevationsSheet(m, L) {
  const S = 80;
  const minX = Math.min(-1.5, m.deck?.x0 ?? 0, ...m.silhouette.map((p) => p[0]));
  const maxX = Math.max(...m.silhouette.map((p) => p[0]), m.L);
  const top = Math.max(...m.silhouette.map((p) => p[1]), m.roofband?.ridge ?? 0, m.end.ridge ?? 0);
  const frontW = (maxX - minX) * S, endW = W * S;
  const width = Math.max(1160, 60 + frontW + 130 + endW + 140);
  const ox = 60 - minX * S;
  const gy = 110 + top * S;
  const s = [];
  s.push(text(60, 62, L.front.toUpperCase(), { size: 15, weight: 700, anchor: "start", ls: 1.5 }));
  const fe = elevationFront(m, L, ox, gy, S);
  s.push(fe.svg);
  // height chain on the right of the long elevation
  const hx = fe.X(maxX) + 40;
  s.push(dim(gy, fe.Z(H.floor), hx, L, { dir: "v", label: fmt(H.floor, L), side: 1 }));
  s.push(dim(fe.Z(H.floor), fe.Z(top), hx, L, { dir: "v", label: fmt(top - H.floor, L), side: 1 }));
  s.push(dim(gy, fe.Z(top), hx + 34, L, { dir: "v", label: `ca. ${fmt(top, L)}`, side: 1 }));
  s.push(dim(fe.X(m.e0 > 0 ? 0 : 0), fe.X(m.L), gy + 44, L, { label: fmt(m.L, L), side: 1, ext: gy + 4 }));
  // end elevation
  const ex = hx + 130;
  s.push(text(ex, 62, L.end.toUpperCase(), { size: 15, weight: 700, anchor: "start", ls: 1.5 }));
  const ee = elevationEnd(m, L, ex + 20, gy, S);
  s.push(ee.svg);
  s.push(dim(ee.U(0), ee.U(W), gy + 44, L, { label: fmt(W, L), side: 1, ext: gy + 4 }));
  // level marks
  const lm = (z, label) => `<g>${poly([[fe.X(minX) - 2, fe.Z(z)], [fe.X(minX) - 12, fe.Z(z) - 9], [fe.X(minX) + 8, fe.Z(z) - 9]], "none", INK, 1)}${text(fe.X(minX) + 14, fe.Z(z) - 2, label, { size: 11, anchor: "start", fill: MID })}</g>`;
  void lm;
  const tb = gy + 110;
  s.push(scaleBar(width - 360, tb - 26, S));
  s.push(titleBlock(L, 30, tb, width - 60, m, L.sheets.elevations));
  return svgDoc(width, tb + 94, s.join(""), `MD ${m.n} – ${L.sheets.elevations}`);
}

/* =============================================================================
   SECTION
   ========================================================================== */
function sectionSheet(m, L) {
  const S = 90;
  const minX = Math.min(-0.6, ...m.silhouette.map((p) => p[0]));
  const maxX = Math.max(m.L, ...m.silhouette.map((p) => p[0]));
  const top = Math.max(...m.silhouette.map((p) => p[1]), m.roofband?.ridge ?? 0);
  const width = Math.max(1160, (maxX - minX) * S + 360);
  const ox = 200 - minX * S, gy = 100 + top * S;
  const X = (x) => ox + x * S, Z = (z) => gy - z * S;
  const s = [];
  const POCHE = "#3A4045", BEYOND = "#B9BEC2";
  s.push(text(60, 62, `${L.sheets.section.toUpperCase()} A–A`, { size: 15, weight: 700, anchor: "start", ls: 1.5 }));
  // ground + chassis (beyond)
  s.push(`<g opacity=".45">${chassisFront(m, X, Z, S)}</g>`);
  s.push(line(X(minX - 1), gy, X(maxX + 1), gy, INK, 1.6));
  for (let x = minX - 1; x < maxX + 1; x += 0.16) s.push(line(X(x), gy, X(x) - 6, gy + 6, THIN, 0.7));
  // the inside, seen towards the back wall: windows and kitchen beyond
  s.push(rect(X(m.e0 + T), Z(roofAt(m, (m.e0 + m.e1) / 2) - H.roof_thk), (m.e1 - m.e0 - 2 * T) * S, 0, "none"));
  for (const o of m.openings.filter((o) => o.side === "back")) s.push(rect(X(o.a), Z(H.floor + o.head), (o.b - o.a) * S, (o.head - o.sill) * S, "#EAF1F5", BEYOND, 1.2));
  for (const f of m.furniture) {
    if (f.t === "kitchen" && f.side === "back") {
      s.push(rect(X(f.x0), Z(H.floor + 0.9), (f.x1 - f.x0) * S, 0.9 * S, "#F4F2EE", BEYOND, 1.1));
      s.push(rect(X(f.x0), Z(H.floor + 0.94), (f.x1 - f.x0) * S, 0.04 * S, "#C9A57C"));
      const ux1 = Math.min(f.x1, ...(m.lofts ?? []).filter((lf) => lf.x0 < f.x1 && lf.x1 > f.x0).map((lf) => lf.x0).filter((x) => x > f.x0));
      if (ux1 - f.x0 > 0.6) s.push(rect(X(f.x0), Z(H.floor + 2.25), (ux1 - f.x0) * S, 0.6 * S, "#F4F2EE", BEYOND, 1.1));
      if (f.fridge === "x1" || f.fridge === "x0") { const fx = f.fridge === "x1" ? f.x1 - 0.62 : f.x0; s.push(rect(X(fx), Z(H.floor + 1.85), 0.62 * S, 1.85 * S, "#EEF0F1", BEYOND, 1.1)); }
    }
    if (f.t === "stair") {
      const n = 8, len = f.x1 - f.x0, rise = (H.loft_top - H.floor) / (n + 1);
      let d = "";
      for (let i = 0; i <= n; i++) {
        const k = f.up === "x1" ? i : n - i;
        const x = f.x0 + (len * i) / n;
        const z = H.floor + rise * (k + 1);
        d += `${i ? "L" : "M"}${r1(X(x))} ${r1(Z(z))} L${r1(X(x + len / n))} ${r1(Z(z))} `;
      }
      s.push(`<path d="${d}" fill="none" stroke="${MID}" stroke-width="1.6"/>`);
      s.push(`<path d="${d} L${r1(X(f.up === "x1" ? f.x1 : f.x0))} ${r1(Z(H.floor))} L${r1(X(f.up === "x1" ? f.x0 : f.x1))} ${r1(Z(H.floor))} Z" fill="rgba(201,165,124,.25)" stroke="none"/>`);
    }
    if (f.t === "ladder") { const x = (f.x0 + f.x1) / 2; s.push(line(X(x), Z(H.floor), X(x + 0.35), Z(H.loft_top), MID, 2)); }
    if (f.t === "stove") { s.push(rect(X(f.cx - 0.25), Z(H.floor + 0.95), 0.5 * S, 0.95 * S, "#3A3F44")); const top = roofAt(m, m.chimney?.x ?? f.cx); s.push(rect(X(f.cx) - 5, Z(top), 10, (top - H.floor - 0.95) * S, "#3A3F44")); }
  }
  // cut elements (poché)
  s.push(rect(X(m.e0), Z(H.floor), (m.e1 - m.e0) * S, (H.floor - 0.55) * S, POCHE));
  const roofPts = [];
  for (let x = m.e0; x <= m.e1 + 0.001; x += 0.05) roofPts.push([x, roofAt(m, x)]);
  s.push(poly([...roofPts.map(([x, z]) => [X(x), Z(z)]), ...roofPts.slice().reverse().map(([x, z]) => [X(x), Z(z - H.roof_thk)])], POCHE));
  s.push(rect(X(m.e0), Z(roofAt(m, m.e0 + 0.01)), T * S, (roofAt(m, m.e0 + 0.01) - 0.55) * S, POCHE));
  s.push(rect(X(m.e1 - T), Z(roofAt(m, m.e1 - 0.01)), T * S, (roofAt(m, m.e1 - 0.01) - 0.55) * S, POCHE));
  for (const o of m.openings.filter((o) => o.side === "left" || o.side === "right")) {
    if (o.a > W / 2 || o.b < W / 2) continue;
    const x = o.side === "left" ? m.e0 : m.e1 - T;
    s.push(rect(X(x) - 1, Z(H.floor + o.head), T * S + 2, (o.head - o.sill) * S, "#fff"));
    s.push(line(X(x + T / 2), Z(H.floor + o.head), X(x + T / 2), Z(H.floor + o.sill), "#6E97AE", 2));
  }
  for (const wl of m.walls) {
    if (wl.x0 !== wl.x1 || wl.y0 > W / 2 || wl.y1 < W / 2) continue;
    const loftOver = (m.lofts ?? []).some((lf) => wl.x0 >= lf.x0 - 0.05 && wl.x0 <= lf.x1 + 0.05);
    const zt = loftOver ? H.loft_under : roofAt(m, wl.x0) - H.roof_thk;
    const door = wl.door && wl.door.at - wl.door.w / 2 < W / 2 && wl.door.at + wl.door.w / 2 > W / 2;
    s.push(rect(X(wl.x0 - 0.04), Z(zt), 0.08 * S, (zt - (door ? H.floor + 2.05 : H.floor)) * S, POCHE));
  }
  for (const lf of m.lofts ?? []) {
    s.push(rect(X(lf.x0), Z(H.loft_top), (lf.x1 - lf.x0) * S, (H.loft_top - H.loft_under) * S, POCHE));
    const b = lf.bed;
    s.push(rect(X(b.x0), Z(H.loft_top + 0.22), (b.x1 - b.x0) * S, 0.22 * S, "#fff", BEYOND, 1.1));
    for (const edge of [lf.x0, lf.x1]) {
      if (edge <= m.e0 + T + 0.01 || edge >= m.e1 - T - 0.01) continue;
      s.push(rect(X(edge) - 2, Z(H.loft_top + 0.9), 4, 0.9 * S, INK));
      s.push(rect(X(edge) - (edge === lf.x1 ? 0 : 3), Z(H.loft_top + 0.9), 3, 0.9 * S, "rgba(150,195,220,.5)"));
    }
  }
  // heights
  const hdim = (x, z0, z1, label) => dim(Z(z0), Z(z1), X(x), L, { dir: "v", label, side: -1 });
  const used = [];
  for (const lf of m.lofts ?? []) {
    const cx = (lf.x0 + lf.x1) / 2;
    const ceilz = (m.roofband ? m.roofband.ridge : roofAt(m, cx)) - H.roof_thk;
    s.push(hdim(cx + 0.55, H.floor, H.loft_under, `ca. ${fmt(H.loft_under - H.floor, L)}`));
    s.push(hdim(cx + 0.55, H.loft_top, ceilz, `ca. ${fmt(ceilz - H.loft_top, L)}`));
    used.push([lf.x0, lf.x1]);
  }
  // a free stretch for the full room height
  let fx = null;
  for (let x = m.e0 + 0.6; x < m.e1 - 0.6; x += 0.1) if (!used.some(([a, b]) => x > a - 0.4 && x < b + 0.4)) { fx = x; break; }
  if (fx !== null) {
    const ceil = roofAt(m, fx) - H.roof_thk;
    s.push(hdim(fx + 0.3, H.floor, ceil, `ca. ${fmt(ceil - H.floor, L)}`));
  }
  // level marks
  const lm = (z, label) => `<g>${poly([[X(minX) - 70, Z(z)], [X(minX) - 80, Z(z) - 9], [X(minX) - 60, Z(z) - 9]], "none", INK, 1)}${line(X(minX) - 82, Z(z), X(m.e0), Z(z), THIN, 0.6, ' stroke-dasharray="4 4"')}${text(X(minX) - 84, Z(z) - 2, label, { size: 11, anchor: "end", fill: MID })}</g>`;
  s.push(lm(H.floor, `±${fmt(0, L)}`));
  if (m.lofts?.length) { s.push(lm(H.loft_under, `+${fmt(H.loft_under - H.floor, L)}`)); s.push(lm(H.loft_top, `+${fmt(H.loft_top - H.floor, L)}`)); }
  s.push(lm(0, `−${fmt(H.floor, L)}`));
  s.push(lm(top, `+${fmt(top - H.floor, L)}`));
  s.push(text(X(minX) - 84, Z(0) + 14, L.ground, { size: 10, anchor: "end", fill: THIN }));
  const tb = gy + 70;
  s.push(scaleBar(width - 380, tb - 26, S));
  s.push(titleBlock(L, 30, tb, width - 60, m, `${L.sheets.section} A–A`));
  return svgDoc(width, tb + 94, s.join(""), `MD ${m.n} – ${L.sheets.section}`);
}

/* =============================================================================
   3D CUT-AWAY (isometric)
   ========================================================================== */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function isoSheet(m, L) {
  const S = 62, C = Math.cos(Math.PI / 6), SN = 0.5;
  const pts = [];
  const P = (x, y, z) => { const X = (x - y) * C * S, Y = (x + y) * SN * S - z * S; pts.push([X, Y]); return [X, Y]; };
  const items = [];
  const add = (key, svg) => items.push({ key, svg });
  const pp = (arr) => arr.map(([a, b]) => `${r1(a)},${r1(b)}`).join(" ");
  function box(x0, y0, z0, x1, y1, z1, col, { op = 1, stroke = "rgba(30,35,40,.35)", top = null } = {}) {
    const o = op < 1 ? ` fill-opacity="${op}"` : "";
    const st = ` stroke="${stroke}" stroke-width=".7" stroke-linejoin="round"`;
    return `<polygon points="${pp([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)])}" fill="${shade(col, 0.9)}"${o}${st}/>`
      + `<polygon points="${pp([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)])}" fill="${shade(col, 0.78)}"${o}${st}/>`
      + `<polygon points="${pp([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)])}" fill="${top ?? col}"${o}${st}/>`;
  }
  const shadow = (x0, y0, x1, y1, z) => `<polygon points="${pp([P(x0 + 0.05, y0 + 0.08, z), P(x1 + 0.1, y0 + 0.08, z), P(x1 + 0.1, y1 + 0.12, z), P(x0 + 0.05, y1 + 0.12, z)])}" fill="rgba(60,40,20,.13)"/>`;
  const Fz = H.floor;
  const e0 = m.e0, e1 = m.e1;
  const WALL = "#F4F1EA", CUT = "#3A4045";
  // ground shadow + chassis
  const ground = `<polygon points="${pp([P(e0 - 0.3, -0.2, 0), P(Math.max(m.L, m.veranda?.x1 ?? 0) + 0.5, -0.2, 0), P(Math.max(m.L, m.veranda?.x1 ?? 0) + 0.5, W + 0.6, 0), P(e0 - 0.3, W + 0.6, 0)])}" fill="rgba(40,50,40,.06)"/>`;
  let base = ground;
  base += box(0.3, 0.45, H.chassis_bottom, m.L - 0.3, 0.6, H.chassis_top, "#3B4248") + box(0.3, W - 0.6, H.chassis_bottom, m.L - 0.3, W - 0.45, H.chassis_top, "#3B4248");
  const mid = m.L / 2;
  for (const cx of [mid - 0.42, mid + 0.42]) { const pts2 = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts2.push(P(cx + 0.33 * Math.cos(a), W - 0.42, 0.33 + 0.33 * Math.sin(a))); } base += `<polygon points="${pp(pts2)}" fill="#16191C"/>`; }
  // floor slab
  base += box(e0, 0, 0.55, e1, W, Fz, "#E3CDA6", { top: "#E8D3AE" });
  for (let y = T + 0.18; y < W - T; y += 0.18) base += `<line x1="${r1(P(e0 + T, y, Fz)[0])}" y1="${r1(P(e0 + T, y, Fz)[1])}" x2="${r1(P(e1 - T, y, Fz)[0])}" y2="${r1(P(e1 - T, y, Fz)[1])}" stroke="rgba(150,110,60,.18)" stroke-width=".8"/>`;
  for (const r of m.rooms) if (r.k === "bad") base += `<polygon points="${pp([P(r.x0, r.y0, Fz + 0.002), P(r.x1, r.y0, Fz + 0.002), P(r.x1, r.y1, Fz + 0.002), P(r.x0, r.y1, Fz + 0.002)])}" fill="#E6ECEE"/>`;
  // outside decks
  if (m.veranda) base += box(m.veranda.x0, 0, 0.55, m.veranda.x1, W, Fz, "#C9A57C", { top: "#D8B88E" });
  if (m.porch) base += box(m.porch.x0, 0, 0.55, m.porch.x1, W, Fz, "#C9A57C", { top: "#D8B88E" });
  if (m.deck && !m.deck.front) base += box(m.deck.x0, 0.2, 0.55, m.deck.x1, W - 0.2, Fz, "#C9A57C", { top: "#D8B88E" });
  // back wall (inner face visible) with openings
  const wallTop = (x) => Math.min(roofAt(m, x) - H.roof_thk, 3.9);
  const backOpen = m.openings.filter((o) => o.side === "back");
  const leftOpen = m.openings.filter((o) => o.side === "left");
  const faceWithHoles = (quad, holes) => `<path fill-rule="evenodd" fill="${WALL}" stroke="rgba(30,35,40,.35)" stroke-width=".7" d="M${quad.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(" L")} Z ${holes.map((h) => `M${h.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(" L")} Z`).join(" ")}"/>`;
  // the back wall follows the roof line: draw it as vertical strips so sloped and stepped roofs read right
  let backSvg = "", leftSvg = "";
  const xs = [];
  for (let x = e0; x < e1 - 0.001; x += 0.25) xs.push([x, Math.min(e1, x + 0.25)]);
  const bq = [];
  for (const [a, b] of xs) bq.push([a, wallTop(a + 0.01)], [b, wallTop(b - 0.01)]);
  const backFace = [P(e0, T, Fz), P(e1, T, Fz), ...bq.slice().reverse().map(([x, z]) => P(x, T, z))];
  backSvg += faceWithHoles(backFace, backOpen.map((o) => [P(o.a, T, Fz + o.sill), P(o.b, T, Fz + o.sill), P(o.b, T, Fz + o.head), P(o.a, T, Fz + o.head)]));
  for (const o of backOpen) backSvg += `<polygon points="${pp([P(o.a, T * 0.4, Fz + o.sill), P(o.b, T * 0.4, Fz + o.sill), P(o.b, T * 0.4, Fz + o.head), P(o.a, T * 0.4, Fz + o.head)])}" fill="rgba(150,200,226,.55)"/>`;
  backSvg += `<polygon points="${pp([...bq.map(([x, z]) => P(x, 0, z)), ...bq.slice().reverse().map(([x, z]) => P(x, T, z))])}" fill="${CUT}"/>`;
  const lt = wallTop(e0 + 0.01);
  leftSvg += faceWithHoles([P(e0 + T, T, Fz), P(e0 + T, W - T, Fz), P(e0 + T, W - T, lt), P(e0 + T, T, lt)], leftOpen.map((o) => [P(e0 + T, o.a, Fz + o.sill), P(e0 + T, o.b, Fz + o.sill), P(e0 + T, o.b, Fz + o.head), P(e0 + T, o.a, Fz + o.head)]));
  for (const o of leftOpen) leftSvg += `<polygon points="${pp([P(e0 + T * 0.4, o.a, Fz + o.sill), P(e0 + T * 0.4, o.b, Fz + o.sill), P(e0 + T * 0.4, o.b, Fz + o.head), P(e0 + T * 0.4, o.a, Fz + o.head)])}" fill="rgba(150,200,226,.55)"/>`;
  leftSvg += `<polygon points="${pp([P(e0, 0, lt), P(e0 + T, 0, lt), P(e0 + T, W, lt), P(e0, W, lt)])}" fill="${CUT}"/>`;
  // interior
  const rugs = m.furniture.filter((f) => f.t === "rug").map((f) => `<polygon points="${pp([P(f.x0, f.y0, Fz + 0.004), P(f.x1, f.y0, Fz + 0.004), P(f.x1, f.y1, Fz + 0.004), P(f.x0, f.y1, Fz + 0.004)])}" fill="#C9D3BC"/>`).join("");
  const z0 = Fz;
  for (const wl of m.walls) {
    const th = 0.04;
    const loftOver = (m.lofts ?? []).some((lf) => (wl.x0 + wl.x1) / 2 >= lf.x0 - 0.05 && (wl.x0 + wl.x1) / 2 <= lf.x1 + 0.05);
    const zt = loftOver ? H.loft_under : Math.min(H.loft_under, wallTop((wl.x0 + wl.x1) / 2));
    const segs = [];
    const vertical = wl.x0 === wl.x1;
    const [lo, hi] = vertical ? [wl.y0, wl.y1] : [wl.x0, wl.x1];
    if (wl.door) { segs.push([lo, wl.door.at - wl.door.w / 2], [wl.door.at + wl.door.w / 2, hi]); } else segs.push([lo, hi]);
    for (const [a, b] of segs) if (b - a > 0.01) {
      const bx = vertical ? [wl.x0 - th, a, z0, wl.x0 + th, b, zt] : [a, wl.y0 - th, z0, b, wl.y0 + th, zt];
      add(bx[3] + bx[4] + z0 * 3, box(...bx, WALL));
    }
    if (wl.door) { const a = wl.door.at - wl.door.w / 2, b = wl.door.at + wl.door.w / 2; const bx = vertical ? [wl.x0 - th, a, Fz + 2.05, wl.x0 + th, b, zt] : [a, wl.y0 - th, Fz + 2.05, b, wl.y0 + th, zt]; add(bx[3] + bx[4] + z0 * 3, box(...bx, WALL)); }
  }
  const FB = (f, svg) => add(f.x1 + f.y1 + Fz * 3, shadow(f.x0, f.y0, f.x1, f.y1, Fz + 0.003) + svg);
  for (const f of m.furniture) {
    switch (f.t) {
      case "sofa": case "sofa_l": case "armchair": case "lounge": {
        const col = f.t === "lounge" ? "#C7B79E" : "#9FAF8E";
        let parts = [[f.x0, f.y0, f.x1, f.y1]];
        if (f.t === "sofa_l") { const d = 0.85; parts = f.back === "left" ? [[f.x0, f.y0, f.x0 + d, f.y1], [f.x0 + d, f.y0, f.x1, f.y0 + d]] : f.back === "right" ? [[f.x1 - d, f.y0, f.x1, f.y1], [f.x0, f.y0, f.x1 - d, f.y0 + d]] : [[f.x0, f.y0, f.x1, f.y0 + d], [f.x0, f.y0 + d, f.x0 + d, f.y1]]; }
        for (const [a, b, c, d2] of parts) {
          let svg = shadow(a, b, c, d2, Fz + 0.003) + box(a, b, Fz, c, d2, Fz + 0.42, col);
          const bk = f.back ?? "back";
          if (bk === "back" || f.t === "sofa_l") svg += box(a, b, Fz + 0.42, c, Math.min(d2, b + 0.2), Fz + 0.78, shade(col, 0.95));
          if (bk === "left") svg += box(a, b, Fz + 0.42, Math.min(c, a + 0.2), d2, Fz + 0.78, shade(col, 0.95));
          if (bk === "right") svg += box(Math.max(a, c - 0.2), b, Fz + 0.42, c, d2, Fz + 0.78, shade(col, 0.95));
          if (bk === "front") svg += box(a, Math.max(b, d2 - 0.2), Fz + 0.42, c, d2, Fz + 0.78, shade(col, 0.95));
          add(c + d2 + Fz * 3, svg);
        }
        break;
      }
      case "coffee": FB(f, box(f.x0, f.y0, Fz + 0.32, f.x1, f.y1, Fz + 0.38, "#B88A5E")); break;
      case "kitchen": {
        const y0 = f.side === "back" ? T : W - T - 0.6, y1 = y0 + 0.6;
        let svg = box(f.x0, y0, Fz, f.x1, y1, Fz + 0.86, "#F7F6F2") + box(f.x0, y0, Fz + 0.86, f.x1, y1 + 0.02, Fz + 0.9, "#C49A6C");
        if (f.sink) svg += `<polygon points="${pp([P(f.sink - 0.28, y0 + 0.12, Fz + 0.902), P(f.sink + 0.28, y0 + 0.12, Fz + 0.902), P(f.sink + 0.28, y0 + 0.48, Fz + 0.902), P(f.sink - 0.28, y0 + 0.48, Fz + 0.902)])}" fill="#B7C3C9"/>`;
        if (f.hob) svg += `<polygon points="${pp([P(f.hob - 0.3, y0 + 0.08, Fz + 0.902), P(f.hob + 0.3, y0 + 0.08, Fz + 0.902), P(f.hob + 0.3, y0 + 0.52, Fz + 0.902), P(f.hob - 0.3, y0 + 0.52, Fz + 0.902)])}" fill="#2B3034"/>`;
        add(f.x1 + y1 + Fz * 3, svg);
        if (f.fridge === "x1" || f.fridge === "x0") { const fx = f.fridge === "x1" ? f.x1 - 0.62 : f.x0; add(fx + 0.62 + y1 + Fz * 3 + 0.01, box(fx, y0, Fz, fx + 0.62, y1, Fz + 1.95, "#E9ECEE")); }
        if (f.side === "back") {
          const lofts = (m.lofts ?? []).filter((lf) => lf.x0 < f.x1 && lf.x1 > f.x0);
          const ux1 = Math.min(f.x1 - (f.fridge === "x1" ? 0.62 : 0), ...lofts.map((lf) => lf.x0).filter((x) => x > f.x0));
          if (ux1 - f.x0 > 0.6) add(ux1 + T + 0.35 + 2.0 * 3, box(f.x0, T, Fz + 1.55, ux1, T + 0.35, Fz + 2.25, "#F7F6F2"));
        }
        break;
      }
      case "table": {
        let svg = shadow(f.x0, f.y0, f.x1, f.y1, Fz + 0.003);
        for (const [lx, ly] of [[f.x0 + 0.05, f.y0 + 0.05], [f.x1 - 0.09, f.y0 + 0.05], [f.x0 + 0.05, f.y1 - 0.09], [f.x1 - 0.09, f.y1 - 0.09]]) svg += box(lx, ly, Fz, lx + 0.04, ly + 0.04, Fz + 0.72, "#6B4E33");
        svg += box(f.x0, f.y0, Fz + 0.72, f.x1, f.y1, Fz + 0.76, "#C49A6C");
        add(f.x1 + f.y1 + Fz * 3, svg);
        break;
      }
      case "table_round": {
        const ptsT = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ptsT.push(P(f.cx + f.r * Math.cos(a), f.cy + f.r * Math.sin(a), Fz + 0.75)); }
        add(f.cx + f.r + f.cy + f.r + Fz * 3, shadow(f.cx - f.r, f.cy - f.r, f.cx + f.r, f.cy + f.r, Fz + 0.003) + box(f.cx - 0.04, f.cy - 0.04, Fz, f.cx + 0.04, f.cy + 0.04, Fz + 0.72, "#6B4E33") + `<polygon points="${pp(ptsT)}" fill="#C49A6C" stroke="rgba(30,35,40,.35)" stroke-width=".7"/>`);
        break;
      }
      case "stair": {
        const n = 8, len = f.x1 - f.x0, rise = (H.loft_top - Fz) / (n + 1);
        for (let i = 0; i < n; i++) {
          const k = f.up === "x1" ? i : n - 1 - i;
          const a = f.x0 + (len * i) / n, b = a + len / n;
          add(b + f.y1 + Fz * 3 + 0.02, box(a, f.y0, Fz, b, f.y1, Fz + rise * (k + 1), "#E9E4DA", { top: "#C49A6C" }));
        }
        break;
      }
      case "ladder": { const y = (f.y0 + f.y1) / 2; let svg = ""; for (const yy of [f.y0 + 0.05, f.y1 - 0.05]) svg += `<line x1="${r1(P(f.x0, yy, Fz)[0])}" y1="${r1(P(f.x0, yy, Fz)[1])}" x2="${r1(P(f.x1, yy, H.loft_top)[0])}" y2="${r1(P(f.x1, yy, H.loft_top)[1])}" stroke="#8C6238" stroke-width="2.4"/>`; for (let k = 1; k < 7; k++) { const tt = k / 7; svg += `<line x1="${r1(P(f.x0 + (f.x1 - f.x0) * tt, f.y0 + 0.05, Fz + (H.loft_top - Fz) * tt)[0])}" y1="${r1(P(f.x0 + (f.x1 - f.x0) * tt, f.y0 + 0.05, Fz + (H.loft_top - Fz) * tt)[1])}" x2="${r1(P(f.x0 + (f.x1 - f.x0) * tt, f.y1 - 0.05, Fz + (H.loft_top - Fz) * tt)[0])}" y2="${r1(P(f.x0 + (f.x1 - f.x0) * tt, f.y1 - 0.05, Fz + (H.loft_top - Fz) * tt)[1])}" stroke="#8C6238" stroke-width="1.8"/>`; } add(f.x1 + f.y1 + Fz * 3 + 0.5, svg + `<g data-y="${y}"></g>`); break; }
      case "shower": add(f.x1 + f.y1 + Fz * 3, box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 0.05, "#FFFFFF") + box(f.x0, f.y1 - 0.02, Fz + 0.05, f.x1, f.y1, Fz + 2.0, "#BFD9E6", { op: 0.35, stroke: "rgba(80,120,140,.5)" }) + box(f.x1 - 0.02, f.y0, Fz + 0.05, f.x1, f.y1, Fz + 2.0, "#BFD9E6", { op: 0.35, stroke: "rgba(80,120,140,.5)" })); break;
      case "wc": add(f.x + f.y + 0.3 + Fz * 3, box(f.x - 0.18, f.y - 0.25, Fz, f.x + 0.18, f.y + 0.25, Fz + 0.42, "#FFFFFF")); break;
      case "basin": add(f.x + f.y + 0.3 + Fz * 3, box(f.x - 0.25, f.y - 0.2, Fz + 0.55, f.x + 0.25, f.y + 0.2, Fz + 0.85, "#FFFFFF", { top: "#E7EEF1" })); break;
      case "washer": FB(f, box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 0.85, "#F2F3F4")); break;
      case "wardrobe": FB(f, box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 2.0, "#EDE7DC")); break;
      case "desk": FB(f, box(f.x0, f.y0, Fz + 0.72, f.x1, f.y1, Fz + 0.76, "#C49A6C") + box(f.x0, f.y0, Fz, f.x0 + 0.05, f.y1, Fz + 0.72, "#B48A5E") + box(f.x1 - 0.05, f.y0, Fz, f.x1, f.y1, Fz + 0.72, "#B48A5E")); break;
      case "daybed": case "bench": FB(f, box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 0.45, f.t === "bench" ? "#B88A5E" : "#F3F0EA")); break;
      case "bed": FB(f, box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 0.3, "#B88A5E") + box(f.x0 + 0.04, f.y0 + 0.04, Fz + 0.3, f.x1 - 0.04, f.y1 - 0.04, Fz + 0.52, "#FBFAF6") + box(f.x0 + 0.1, f.y0 + 0.08, Fz + 0.52, f.x1 - 0.1, f.y0 + 0.42, Fz + 0.64, "#E8E3D8") + box(f.x0 + 0.04, f.y0 + 0.9, Fz + 0.52, f.x1 - 0.04, f.y1 - 0.04, Fz + 0.56, "#A3B18A")); break;
      case "nightstand": FB(f, box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 0.5, "#B88A5E")); break;
      case "plant": add(f.cx + f.cy + Fz * 3 + 0.4, box(f.cx - 0.13, f.cy - 0.13, Fz, f.cx + 0.13, f.cy + 0.13, Fz + 0.42, "#C9B79E") + `<circle cx="${r1(P(f.cx, f.cy, Fz + 0.75)[0])}" cy="${r1(P(f.cx, f.cy, Fz + 0.75)[1])}" r="${r1(0.3 * S)}" fill="#6F9A5B"/>`); break;
      case "stove": add(f.cx + f.cy + 0.3 + Fz * 3, box(f.cx - 0.38, f.cy - 0.38, Fz, f.cx + 0.38, f.cy + 0.38, Fz + 0.04, "#D9D4CB") + box(f.cx - 0.24, f.cy - 0.24, Fz + 0.04, f.cx + 0.24, f.cy + 0.24, Fz + 0.95, "#2E3236") + box(f.cx - 0.06, f.cy - 0.06, Fz + 0.95, f.cx + 0.06, f.cy + 0.06, wallTop(f.cx), "#2E3236")); break;
      case "bar": { let svg = shadow(f.x0, f.y0, f.x1, f.y1, Fz + 0.003) + box(f.x0, f.y0, Fz, f.x1, f.y1, Fz + 1.05, "#F7F6F2") + box(f.x0 - 0.05, f.y0 - 0.25, Fz + 1.05, f.x1 + 0.05, f.y1, Fz + 1.09, "#2E3236"); const n = f.stools ?? 3; for (let i = 0; i < n; i++) { const cx = f.x0 + ((f.x1 - f.x0) * (i + 0.5)) / n; svg += box(cx - 0.15, f.y0 - 0.5, Fz + 0.72, cx + 0.15, f.y0 - 0.2, Fz + 0.76, "#2E3236") + box(cx - 0.02, f.y0 - 0.37, Fz, cx + 0.02, f.y0 - 0.33, Fz + 0.72, "#2E3236"); } add(f.x1 + f.y1 + Fz * 3, svg); break; }
    }
  }
  // lofts
  for (const lf of m.lofts ?? []) {
    let svg = box(lf.x0, T, H.loft_under, lf.x1, W - T, H.loft_top, "#E2CBA3", { top: "#E8D3AE" });
    const b = lf.bed;
    svg += box(b.x0, b.y0, H.loft_top, b.x1, b.y1, H.loft_top + 0.2, "#FBFAF6") + box(b.x0 + 0.08, b.y0 + 0.06, H.loft_top + 0.2, b.x1 - 0.08, b.y0 + 0.4, H.loft_top + 0.3, "#E8E3D8") + box(b.x0, b.y0 + 0.85, H.loft_top + 0.2, b.x1, b.y1, H.loft_top + 0.23, "#C0703F");
    if (lf.wardrobe) svg += box(lf.wardrobe.x0, lf.wardrobe.y0, H.loft_top, lf.wardrobe.x1, lf.wardrobe.y1, H.loft_top + 0.75, "#EDE7DC");
    for (const edge of [lf.x0, lf.x1]) {
      if (edge <= e0 + T + 0.01 || edge >= e1 - T - 0.01) continue;
      svg += box(edge - 0.01, T, H.loft_top, edge + 0.01, W - T, H.loft_top + 0.9, "#BFD9E6", { op: 0.35, stroke: "rgba(80,120,140,.6)" });
    }
    add(lf.x1 + W + 30, svg);
  }
  // front and right walls, cut at 1.0 m above the floor
  const cutZ = Fz + 0.5;
  const lowWall = (side) => {
    let svg = "";
    const opens = m.openings.filter((o) => o.side === side && !m.lofty(o));
    const along = side === "front" ? [e0, e1] : [0, W];
    const cuts = [];
    let cur = along[0];
    for (const o of [...opens].sort((a, b) => a.a - b.a)) { cuts.push([cur, o.a, cutZ]); cuts.push([o.a, o.b, Fz + Math.min(o.sill, 0.5)]); cur = o.b; }
    cuts.push([cur, along[1], cutZ]);
    for (const [a, b, zt] of cuts) {
      if (b - a < 0.005 || zt <= Fz + 0.001) continue;
      const bx = side === "front" ? [a, W - T, 0.55, b, W, zt] : [e1 - T, a, 0.55, e1, b, zt];
      svg += box(...bx, "#D9B183", { top: CUT });
    }
    for (const o of opens) if (o.sill > 0 && o.sill < 0.5) {
      const bx = side === "front" ? [o.a, W - T * 0.5, Fz + o.sill, o.b, W - T * 0.45, cutZ] : [e1 - T * 0.5, o.a, Fz + o.sill, e1 - T * 0.45, o.b, cutZ];
      svg += box(...bx, "#BFD9E6", { op: 0.4, stroke: "rgba(80,120,140,.5)" });
    }
    return svg;
  };
  // assemble in painter's order
  let out = base + backSvg + leftSvg + rugs;
  items.sort((a, b) => a.key - b.key);
  out += items.map((i) => i.svg).join("");
  out += lowWall("front") + lowWall("right");
  if (m.deck?.front) out += box(m.deck.x0, W, 0.4, m.deck.x1, W + 1.3, Fz - 0.02, "#C9A57C", { top: "#D8B88E" }) + box(m.deck.x0 + 0.3, W + 1.3, 0.2, m.deck.x1 - 0.3, W + 1.6, 0.4, "#C9A57C", { top: "#D8B88E" });
  if (m.veranda) { for (const lo of m.furniture.filter((f) => f.t === "lounge")) void lo; out += box(m.veranda.x1 - 0.12, W - 0.12, Fz, m.veranda.x1, W, Fz + 1.0, "#2E3B41"); out += box(m.veranda.x0 + 0.05, W - 0.06, Fz + 0.9, m.veranda.x1, W, Fz + 0.95, "#2E3B41"); }
  if (m.deck?.rail) out += box(m.deck.x0, W - 0.24, Fz, m.deck.x0 + 0.04, W - 0.2, Fz + 1.0, "#2E3B41") + box(m.deck.x0, 0.2, Fz + 0.96, m.deck.x0 + 0.04, W - 0.2, Fz + 1.0, "#2E3B41") + box(m.deck.x0, W - 0.24, Fz + 0.96, m.deck.x1, W - 0.2, Fz + 1.0, "#2E3B41");
  // fit
  const xs2 = pts.map((p) => p[0]), ys2 = pts.map((p) => p[1]);
  const minX = Math.min(...xs2), maxX = Math.max(...xs2), minY = Math.min(...ys2), maxY = Math.max(...ys2);
  const pad = 50, head = 70;
  const width = Math.max(1160, maxX - minX + 2 * pad);
  const dx = (width - (maxX - minX)) / 2 - minX, dy = head + pad - minY;
  const tb = dy + maxY + 40;
  const body = `${text(60, 62, L.sheets["3d"].toUpperCase(), { size: 15, weight: 700, anchor: "start", ls: 1.5 })}<g transform="translate(${r1(dx)} ${r1(dy)})">${out}</g>${titleBlock(L, 30, tb, width - 60, m, L.sheets["3d"])}`;
  return svgDoc(Math.round(width), Math.round(tb + 94), body, `MD ${m.n} – ${L.sheets["3d"]}`);
}

/* =============================================================================
   WRITE + INSERT
   ========================================================================== */
const SHEETS = { plan: planSheet, elevations: elevationsSheet, section: sectionSheet, "3d": isoSheet };
const report = { files: 0, pages: 0, missing: [] };
const sizes = {};
for (const [code, L] of Object.entries(LANGS)) {
  await mkdir(join(ROOT, "assets/images/drawings", code), { recursive: true });
  for (const key of Object.keys(D.models)) {
    const m = prep(key);
    for (const [sheet, fn] of Object.entries(SHEETS)) {
      const svg = fn(m, L);
      const rel = `assets/images/drawings/${code}/md-${m.n}-${sheet}.svg`;
      const abs = join(ROOT, rel);
      const prev = existsSync(abs) ? await readFile(abs, "utf8") : "";
      if (prev !== svg) await writeFile(abs, svg, "utf8");
      const vb = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
      sizes[rel] = [Math.round(Number(vb[1])), Math.round(Number(vb[2]))];
      report.files += 1;
    }
  }
}

function section(code, n) {
  const L = LANGS[code];
  const depth = L.page(n).split("/").length - 1;
  const up = "../".repeat(depth);
  const fig = (sheet, wide) => {
    const rel = `assets/images/drawings/${code}/md-${n}-${sheet}.svg`;
    const [w, h] = sizes[rel];
    return `<figure class="drawing${wide ? " drawing-wide" : ""}"><a href="${up}${rel}" target="_blank" rel="noopener" aria-label="${esc(`${L.cap[sheet]} – ${L.open}`)}"><img src="${up}${rel}" width="${w}" height="${h}" alt="${esc(L.alt(n, L.sheets[sheet]))}" loading="lazy" decoding="async"></a><figcaption>${esc(L.cap[sheet])}</figcaption></figure>`;
  };
  return `<section class="section drawings" id="drawings" data-drawings><div class="container"><div class="section-header"><div><div class="eyebrow">${esc(L.eyebrow)}</div><h2>${esc(L.h2(n))}</h2></div><p>${esc(L.intro)}</p></div><div class="drawings-grid">${fig("3d", true)}${fig("plan", true)}${fig("elevations")}${fig("section")}</div></div></section>`;
}

for (const [code, L] of Object.entries(LANGS)) {
  for (const key of Object.keys(D.models)) {
    const n = key.replace("mc", "");
    const file = join(ROOT, L.page(n));
    if (!existsSync(file)) { report.missing.push(L.page(n)); continue; }
    let html = await readFile(file, "utf8");
    html = html.replace(/<section class="section drawings"[^>]*data-drawings>[\s\S]*?<\/section>/, "");
    const anchor = `<div class="eyebrow">${L.eyebrowPlan}</div>`;
    const at = html.indexOf(anchor);
    if (at < 0) { report.missing.push(`${L.page(n)} (no plan section)`); continue; }
    const end = html.indexOf("</section>", at) + "</section>".length;
    const next = html.slice(0, end) + section(code, n) + html.slice(end);
    const prev = await readFile(file, "utf8");
    if (next !== prev) await writeFile(file, next, "utf8");
    report.pages += 1;
  }
}
if (report.missing.length) { console.error(`build-model-drawings: ${report.missing.join(", ")}`); process.exit(1); }
console.log(JSON.stringify(report));
