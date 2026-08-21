#!/usr/bin/env node
/* The v3 shell: a floating frame, a left icon rail, and a background behind both.

   The reference design is not a rounded-corner treatment of a normal page. It is
   a different container: the whole interface sits inside one large rounded card
   that floats above a photographic background, with a vertical rail of circular
   icon buttons pinned to its left edge and a pill-shaped bar across its top. The
   first attempt at this styled the existing layout and missed all three, because
   none of them exist in the markup — a stylesheet cannot add an element that is
   not there.

   So this pass adds them, and adds them the way everything else on this site is
   added: mechanically, from a generator, idempotently.

     - <div class="app-shell"> wraps the navigation, main, the CTA band and the
       footer. Everything outside it — the skip link, the scroll progress bar, the
       WhatsApp dock, the cookie notice and the scripts — stays outside, because
       those are overlays and an overlay inside a clipped frame is an overlay that
       gets clipped.
     - <aside class="rail"> is the left column. Its buttons are real links to the
       pages they represent, not decoration: home, search, models, questions,
       contact, and the theme controls at the foot.

   Idempotency is by marker: a page already carrying data-shell="v3" on its body
   is left alone, so a second run changes nothing and a re-run after a content
   generator re-adds the shell to pages that were rebuilt.

   Order: run it AFTER build-modunera-v2.mjs, which rewrites every <nav> on the
   site and would otherwise replace the nav this has already wrapped.

   Usage: node tools/build-shell-v3.mjs
*/
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SKIP = /^(google[0-9a-f]+\.html|admin-demo\/|customer-portal\/|booking\/|saved-designs\/|demo-apple\/)/;

/* The rail. Six destinations and two controls, each with a label that is read by
   a screen reader and shown as a tooltip on hover — an icon with no accessible
   name is a button nobody can describe. Paths are per language, because the rail
   is site-wide and a German reader must not be sent to /en/. */
const RAIL = {
  de: [
    ["home", "Startseite", ""],
    ["search", "Suche", "standorte/"],
    ["grid", "Modelle", "modelle/"],
    ["chat", "Fragen", "faq/"],
    ["pin", "Länder", "laender/"],
    ["mail", "Kontakt", "kontakt/"],
  ],
  /* English destinations are checked against the tree, not assumed: /en/locations/
     and /en/contact/ do not exist — the location pages live under /en/locations/<country>/
     with no index, and contact is German-only. Guessing them put two broken links on
     7,652 pages and the link checker caught every one. */
  en: [
    ["home", "Home", "en/"],
    ["search", "Search", "en/price-comparison/"],
    ["grid", "Models", "en/models/"],
    ["chat", "Questions", "en/faq/"],
    ["pin", "Countries", "en/countries/"],
    ["mail", "Contact", "kontakt/"],
  ],
};

/* Single-path icons at one stroke weight, the same language as the highlight
   covers: no fill, round caps, 24-unit box. */
const ICONS = {
  home: 'M3 11.2 12 4l9 7.2M5.4 9.6V20h13.2V9.6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16.1 16.1 21 21',
  grid: 'M4 4h6.4v6.4H4ZM13.6 4H20v6.4h-6.4ZM4 13.6h6.4V20H4ZM13.6 13.6H20V20h-6.4Z',
  chat: 'M20 4H8v9h6l3 3v-3h3V4ZM4 8v9h3v3l3-3',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  mail: 'M3 6h18v12H3ZM3 6.6 12 13l9-6.4',
};

const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="${ICONS[name]}"/></svg>`;

function rail(file) {
  const depth = dirname(file) === "." ? 0 : dirname(file).split("/").length;
  const root = "../".repeat(depth);
  const lang = /^(en|nl|da|fr)\//.test(file) ? "en" : "de";
  const items = RAIL[lang]
    .map(([name, label, href]) => {
      const target = href === "" ? `${root}index.html` : `${root}${href}`;
      return `<a class="rail-btn" href="${target}" aria-label="${label}" data-tip="${label}">${icon(name)}</a>`;
    })
    .join("");
  return `<aside class="rail" aria-label="${lang === "de" ? "Schnellzugriff" : "Quick access"}"><div class="rail-group">${items}</div></aside>`;
}

async function walk(dir, out = []) {
  for (const entry of await readdir(join(ROOT, dir === "." ? "" : dir), { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "assets", "sitemaps", "docs", "social", "tools"].includes(entry.name)) continue;
    const rel = dir === "." ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(rel, out);
    else if (extname(entry.name) === ".html") out.push(rel);
  }
  return out;
}

/* The nav runs from navAt to its own </nav>; everything after that up to the end
   of the footer is the shell's content. */
const navEnd = (html, from) => html.indexOf("</nav>", from) + "</nav>".length;
const navOf = (html, from) => html.slice(from, navEnd(html, from));
const bodyAfterNav = (html, from, close) => html.slice(navEnd(html, from), close);

let wrapped = 0, already = 0, skipped = 0;
for (const file of await walk(".")) {
  if (SKIP.test(file)) { skipped += 1; continue; }
  const original = await readFile(join(ROOT, file), "utf8");
  if (original.includes('data-shell="v3"')) { already += 1; continue; }

  const navAt = original.indexOf('<nav class="nav"');
  const footEnd = original.indexOf("</footer>");
  if (navAt === -1 || footEnd === -1) { skipped += 1; continue; }

  const close = footEnd + "</footer>".length;
  const html =
    original.slice(0, navAt) +
    /* The rail is a SIBLING of the shell, not a child. .app-shell carries a
       backdrop-filter, and a backdrop-filter makes an element the containing
       block for position:fixed descendants — so a rail inside it was pinned to
       the page rather than to the window, and only came into view once the
       reader reached the very bottom. Outside the shell it is fixed to the
       viewport, which is what a rail is for. */
    /* The nav goes outside the shell too, and for the same reason the rail did.
       .app-shell clips with overflow:hidden, which makes it a scroll container,
       and a sticky child of a scroll container sticks to the container — which
       scrolls with the page. Measured before the move: nav top -2592 after a
       2600px scroll. Outside the shell it is fixed to the window and stays. */
    rail(file) + navOf(original, navAt, close) + `<div class="app-shell">` + `<div class="app-main">` +
    bodyAfterNav(original, navAt, close) +
    `</div></div>` +
    original.slice(close);

  await writeFile(join(ROOT, file), html.replace("<body>", '<body data-shell="v3">'), "utf8");
  wrapped += 1;
}

console.log(JSON.stringify({ wrapped, already, skipped }));
