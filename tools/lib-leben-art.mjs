/* Illustrations for /tiny-house-leben/, imported by tools/build-tiny-leben.mjs.

   Everything is drawn from code so the page stays one deterministic build:
   people as smooth silhouettes (Catmull-Rom through a hand-set outline), the
   golden-hour family scene, the body map for the health findings, the season
   scene in the hero's landscape style, and the dot map of the five markets
   built from the town coordinates the location pages already use. */

const r1 = (n) => Math.round(n * 10) / 10;

/* closed Catmull-Rom spline through points, as cubic Béziers */
export function smoothPath(pts) {
  const n = pts.length;
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return `${d}Z`;
}
/* open Catmull-Rom spline */
export function smoothLine(pts) {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

/* right half of a standing figure, 900 units tall, centre line x = 0 */
const HALF = [
  [16, 112], [26, 138], [64, 152], [88, 170], [98, 214], [102, 290], [106, 370], [110, 440], [106, 470], [92, 474],
  [86, 446], [82, 372], [78, 300], [70, 252], [64, 270], [60, 330], [62, 390], [70, 440], [66, 520], [58, 640],
  [54, 760], [58, 846], [68, 872], [46, 884], [28, 874], [26, 800], [22, 660], [14, 540], [5, 494],
];
const OUTLINE = [...HALF, ...HALF.slice().reverse().map(([x, y]) => [-x, y])];

/* a person: adult or child, standing, at (x, baseline) with a height in px */
export function person(x, base, h, { child = false, cls = "fig", lean = 0 } = {}) {
  const sy = h / 884, sx = sy * (child ? 1.08 : 1);
  const body = OUTLINE.map(([px, py]) => [x + px * sx + (py / 884 - 1) * -lean * h * 0.06, base - h + py * sy]);
  const headR = child ? 1.32 : 1;
  const neckTop = base - h + 112 * sy;
  const ry = 54 * sy * headR, rx = 44 * sx * headR;
  const hx = x + lean * h * 0.06;
  return `<g class="${cls}"><path d="${smoothPath(body)}"/><ellipse cx="${r1(hx)}" cy="${r1(neckTop + 6 * sy - ry)}" rx="${r1(rx)}" ry="${r1(ry)}"/></g>`;
}
export function dog(x, base, s = 1, cls = "fig") {
  const P = (px, py) => `${r1(x + px * s)} ${r1(base + py * s)}`;
  return `<g class="${cls}"><path d="M${P(-34, -30)} C${P(-20, -44)} ${P(20, -44)} ${P(30, -34)} L${P(36, -48)} C${P(40, -60)} ${P(56, -60)} ${P(60, -50)} L${P(72, -46)} L${P(70, -38)} L${P(56, -36)} L${P(46, -26)} L${P(40, -2)} L${P(34, 0)} L${P(32, -18)} L${P(-18, -18)} L${P(-22, 0)} L${P(-28, 0)} L${P(-30, -20)} C${P(-38, -26)} ${P(-48, -34)} ${P(-56, -52)} L${P(-52, -54)} C${P(-46, -42)} ${P(-40, -34)} ${P(-34, -30)}Z"/><path d="M${P(48, -58)} L${P(44, -70)} L${P(54, -60)}Z"/></g>`;
}

/* ---------------------------------------------------------------- family at golden hour */
export function familyScene({ ridge, forestPath, grassPath, heroHouse, rng }) {
  const far = ridge(201, 330, 90, 24), mid = ridge(203, 400, 50, 20), fr = ridge(205, 450, 26, 16), mead = ridge(207, 515, 14, 18);
  const R = rng(219);
  let birds = "";
  for (let i = 0; i < 4; i++) birds += `<path transform="translate(${r1(250 + i * 38 + R() * 20)} ${r1(120 + R() * 40)}) scale(${r1(0.8 + R() * 0.4)})" d="M0 0 Q7 -7 14 0 Q21 -7 28 0"/>`;
  const kidX = 640, kidBase = 548;
  const handX = kidX + 58, handY = kidBase - 66;
  const kite = [1010 - 470, 150];
  const kiteSvg = `<g class="kite"><path class="kite-string" d="M${handX} ${handY} Q ${handX - 30} ${r1((handY + kite[1]) / 2 + 60)} ${kite[0]} ${kite[1] + 34}"/><g class="kite-body" transform="translate(${kite[0]} ${kite[1]}) rotate(-12)"><path d="M0 -34 L24 0 L0 38 L-24 0Z" class="kite-a"/><path d="M0 -34 L24 0 L0 0Z" class="kite-b"/><path d="M0 0 L-24 0 L0 38Z" class="kite-b"/><path class="kite-tail" d="M0 38 C10 60 -12 76 2 96 C14 112 -6 126 6 146"/><path class="kite-bow" d="M-6 66 L6 72 L-6 78Z M-4 104 L8 110 L-4 116Z"/></g></g>`;
  return `<svg class="fam-svg" viewBox="0 0 1600 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs>
  <linearGradient id="famSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E3C4"/><stop offset=".55" stop-color="#F5C08C"/><stop offset="1" stop-color="#EE9C70"/></linearGradient>
  <radialGradient id="famSun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF4D6"/><stop offset=".25" stop-color="#FFE0A0"/><stop offset=".6" stop-color="#FFC27A" stop-opacity=".35"/><stop offset="1" stop-color="#FF9E5E" stop-opacity="0"/></radialGradient>
  <radialGradient id="famSpill" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFC46B" stop-opacity=".5"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1600" height="560" fill="url(#famSky)"/>
<circle cx="1210" cy="330" r="230" fill="url(#famSun)"/><circle cx="1210" cy="330" r="52" fill="#FFF1CF"/>
<g class="fam-birds">${birds}</g>
<path d="${far.d}" fill="#E2A889" opacity=".75"/>
<path d="${mid.d}" fill="#C08572"/>
<path d="${fr.d}" fill="#5B4D45"/><path d="${forestPath(209, fr.fn, 34, 92)}" fill="#5B4D45"/>
<path d="${mead.d}" fill="#7A6A3F"/>
<g transform="translate(960 385) scale(.62)" class="fam-house">${heroHouse("fh").replace('url(#hSpill)', 'url(#famSpill)')}</g>
<path d="${grassPath(211, mead.fn, 220, 8, 22)}" fill="#6A5B35"/>
${kiteSvg}
${person(560, 552, 152, { lean: 0.2 })}
${person(612, 552, 138, { lean: 0.1 })}
${person(kidX, kidBase, 92, { child: true, lean: -0.3 })}
${person(742, 556, 74, { child: true, lean: 0.4 })}
${dog(812, 556, 0.62)}
<path d="M-100 560 L-100 548 Q400 532 800 546 T1700 540 L1700 560Z" fill="#4E4429"/>
</svg>`;
}

/* ---------------------------------------------------------------- body map */
export function bodyMap(points) {
  // a bust: head to hips, so the head findings have room; the figure fades out below
  const fig = person(0, 884, 884, { cls: "bm-body" });
  const spots = points.map((p, i) => `<g class="bm-spot" data-spot="${p.id}" transform="translate(${p.x * 1.15} ${p.y})" tabindex="0" role="button" aria-label="${p.part}: ${p.title}"><circle class="bm-halo" r="20"/><circle class="bm-dot" r="11"/><text y="4.2">${i + 1}</text></g>`).join("");
  return `<svg class="bm-svg" viewBox="-150 -20 300 560" role="img" aria-label="Körperkarte mit sieben Befunden zu Natur und Gesundheit">
<defs><linearGradient id="bmFill" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E2EBD7"/><stop offset=".72" stop-color="#BED0AC"/><stop offset="1" stop-color="#BED0AC" stop-opacity="0"/></linearGradient>
<linearGradient id="bmLine" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7E9A6E"/><stop offset=".72" stop-color="#7E9A6E"/><stop offset="1" stop-color="#7E9A6E" stop-opacity="0"/></linearGradient></defs>
<circle cx="0" cy="70" r="104" class="bm-aura"/>
${fig}
${spots}
</svg>`;
}

/* ---------------------------------------------------------------- seasons, in the hero's style */
export function seasonScene({ ridge, forestPath, grassPath, heroHouse, rng }) {
  const far = ridge(301, 520, 120, 24), fr = ridge(303, 690, 30, 16), mead = ridge(305, 820, 18, 18);
  const R = rng(307);
  let blossoms = "", leaves = "", flakes = "";
  const crowns = [[300, 330, 120], [220, 380, 92], [384, 384, 96], [300, 250, 92], [240, 290, 80], [360, 290, 82]];
  for (let i = 0; i < 40; i++) blossoms += `<circle cx="${r1(170 + R() * 260)}" cy="${r1(190 + R() * 260)}" r="${r1(6 + R() * 5)}"/>`;
  for (let i = 0; i < 16; i++) leaves += `<g transform="translate(${r1(180 + R() * 260)} ${r1(330 + R() * 90)})"><path style="--d:${r1(R() * 6)}s;--x:${r1(-80 + R() * 160)}px" d="M0 0 q12 -12 24 0 q-12 12 -24 0Z"/></g>`;
  for (let i = 0; i < 70; i++) flakes += `<circle style="--d:${r1(R() * 9)}s;--x:${r1(-40 + R() * 80)}px" cx="${r1(R() * 1600)}" cy="${r1(-30 - R() * 120)}" r="${r1(3 + R() * 5)}"/>`;
  return `<svg class="s-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<defs><linearGradient id="sSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-st1"/><stop offset="1" class="s-st2"/></linearGradient>
<radialGradient id="sSpill" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFC46B" stop-opacity=".55"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="1000" fill="url(#sSky)"/>
<circle class="s-sun" cx="1250" cy="240" r="80"/>
<path class="s-far" d="${far.d}"/>
<path class="s-snowcap" d="${ridge(301, 528, 120, 24).d}"/>
<path class="s-forest" d="${fr.d}"/><path class="s-forest" d="${forestPath(309, fr.fn, 50, 140)}"/>
<path class="s-ground" d="${mead.d}"/>
<path class="s-grass" d="${grassPath(311, mead.fn, 200, 8, 22)}"/>
<path class="s-snowground" d="${ridge(305, 826, 18, 18).d}"/>
<g transform="translate(1000 600)">${heroHouse("sh").replace("url(#hSpill)", "url(#sSpill)")}</g>
<path class="s-snowroof" d="M976 659 L1364 626 L1364 615 Q1170 620 976 647Z"/>
<path class="s-trunk" d="M300 840 L306 470 L282 380 M305 520 L362 410 M303 600 L236 470 M300 430 L330 330"/>
<g class="s-crown">${crowns.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
<g class="s-blossom">${blossoms}</g>
<g class="s-leaves">${leaves}</g>
<g class="s-flakes">${flakes}</g>
</svg>`;
}

/* ---------------------------------------------------------------- dot map of the markets */
export function europeMap({ germany, others }) {
  const lon0 = 2.2, lon1 = 32.4, lat0 = 39.4, lat1 = 57.9, k = Math.cos((49 * Math.PI) / 180);
  const W = 1000, scale = W / ((lon1 - lon0) * k), H = Math.round((lat1 - lat0) * scale);
  const X = (lon) => (lon - lon0) * k * scale, Y = (lat) => (lat1 - lat) * scale;
  // bin the towns into a grid so the map stays light
  const cellLat = 0.13, cellLon = cellLat / k;
  const cells = new Map();
  const addPt = (lat, lon, c) => {
    if (lat == null || lon == null) return;
    const key = `${Math.round(lat / cellLat)}:${Math.round(lon / cellLon)}`;
    const cur = cells.get(key);
    if (cur) cur.n += 1; else cells.set(key, { lat: Math.round(lat / cellLat) * cellLat, lon: Math.round(lon / cellLon) * cellLon, n: 1, c });
  };
  for (const g of germany) addPt(g.lat, g.lng, "de");
  for (const [c, list] of Object.entries(others)) for (const p of list) addPt(p.lat, p.lon, c.toLowerCase());
  // one path per country and dot size: "M x y h0" with a round cap draws a dot in a dozen bytes
  const groups = new Map();
  for (const p of [...cells.values()].sort((a, b) => a.lat - b.lat || a.lon - b.lon)) {
    const size = p.n > 3 ? 7.2 : p.n > 1 ? 6.2 : 5.2;
    const key = `${p.c}|${size}`;
    groups.set(key, (groups.get(key) ?? "") + `M${Math.round(X(p.lon))} ${Math.round(Y(p.lat))}h0`);
  }
  const dots = [...groups.entries()].map(([key, d]) => { const [c, w] = key.split("|"); return `<path class="m-${c}" stroke-width="${w}" d="${d}"/>`; }).join("");
  const way = [[40.78, 30.4], [40.98, 28.9], [41.68, 26.55], [42.7, 23.32], [44.8, 20.46], [47.5, 19.04], [48.2, 16.37], [49.0, 12.1], [50.6, 10.2]];
  const pts = way.map(([la, lo]) => [X(lo), Y(la)]);
  const route = smoothLine(pts);
  const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
  const lab = (lat, lon, t, cls = "m-lab") => `<text class="${cls}" x="${r1(X(lon))}" y="${r1(Y(lat))}">${t}</text>`;
  return `<svg class="r-svg r-map" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="r-title"><title id="r-title">Karte: schematische Strecke vom Werk in Sakarya, Türkei, nach Deutschland; Punkte zeigen Orte in Deutschland, den Niederlanden, Dänemark, Luxemburg und der Schweiz</title>
<defs><pattern id="mGrid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.3" class="m-grid"/></pattern>
<radialGradient id="mGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#BC3A14" stop-opacity=".35"/><stop offset="1" stop-color="#BC3A14" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#mGrid)"/>
<g class="m-dots">${dots}</g>
${lab(51.3, 9.2, "Deutschland", "m-lab m-big")}${lab(52.9, 3.4, "Niederlande")}${lab(56.6, 7.6, "Dänemark")}${lab(46.2, 6.2, "Schweiz")}
<path class="r-track" d="${route}"/><path class="r-done" d="${route}" pathLength="1"/>
<circle cx="${r1(sx)}" cy="${r1(sy)}" r="46" fill="url(#mGlow)" class="m-pulse"/>
<circle class="m-start" cx="${r1(sx)}" cy="${r1(sy)}" r="9"/>
<text class="m-lab m-big" x="${r1(sx - 14)}" y="${r1(sy + 42)}" text-anchor="end">Sakarya, Türkei</text>
<text class="m-sub" x="${r1(sx - 14)}" y="${r1(sy + 66)}" text-anchor="end">Werk</text>
<circle class="m-end" cx="${r1(ex)}" cy="${r1(ey)}" r="11"/>
<text class="m-sub" x="${r1(ex + 18)}" y="${r1(ey + 34)}">Dein Stellplatz</text>
<text class="m-note" x="${W - 16}" y="${H - 16}" text-anchor="end">Schematische Strecke · Punkte: Orte in den Zielmärkten</text>
<g class="r-truck"><g transform="translate(-34 -34)"><rect class="r-trailer" x="0" y="26" width="52" height="6" rx="2"/><path class="r-house" d="M4 26 V10 L28 4 L48 8 V26 Z"/><rect class="r-cab" x="52" y="14" width="16" height="18" rx="3"/><circle class="r-wheel" cx="12" cy="34" r="4"/><circle class="r-wheel" cx="40" cy="34" r="4"/><circle class="r-wheel" cx="62" cy="34" r="4"/></g></g>
</svg>`;
}
