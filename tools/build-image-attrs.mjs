#!/usr/bin/env node
/* Intrinsic size and loading policy for every <img> on the site, plus the
   deferral of the place index.

   The audit found 44,187 image tags with no width/height and 45,036 with no
   loading attribute. Both are layout and bandwidth faults rather than markup
   taste: a browser that does not know an image's aspect ratio reserves no space
   for it, which is cumulative layout shift, and an image with no loading
   attribute below the fold is fetched before anything the reader can see.

   Rather than edit the six generators that emit images, this runs after them and
   reads the intrinsic size out of the file itself, so the number in the markup
   cannot disagree with the picture. Dimensions are parsed from the container
   headers directly — WebP, PNG, JPEG, GIF and SVG — because adding an image
   library for four header formats is a dependency the project does not need.

   The policy:
     - width and height are added only where both are missing, so a template that
       sets its own is left alone;
     - loading="lazy" is added to everything except the first image on the page
       and anything already marked fetchpriority="high", because lazy-loading the
       largest contentful paint delays it;
     - decoding="async" is added where absent.

   It also rewrites the two pages that load assets/js/locations-data.js — a
   megabyte of JSON, one entry per town in five countries — so the file is
   fetched when the search box is first focused rather than on page load. The
   path moves to data-locations-src on the input; main.js reads it.

   Idempotent: a second run finds every attribute already present and writes
   nothing.

   Usage: node tools/build-image-attrs.mjs
*/
import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "sitemaps"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

/* --- intrinsic size, from the container header ----------------------------- */

const sizeCache = new Map();

async function intrinsicSize(file) {
  let size = null;
  try {
    const buf = await readFile(file);
    const ext = extname(file).toLowerCase();
    if (ext === ".webp") size = webpSize(buf);
    else if (ext === ".png") size = pngSize(buf);
    else if (ext === ".jpg" || ext === ".jpeg") size = jpegSize(buf);
    else if (ext === ".gif") size = gifSize(buf);
    else if (ext === ".svg") size = svgSize(buf.toString("utf8"));
  } catch {
    size = null;
  }
  return size;
}

function webpSize(b) {
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    // lossy: the frame header follows a 3-byte start code and the 3-byte sync
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return {
      w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
      h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
    };
  }
  return null;
}

function pngSize(b) {
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function jpegSize(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    // SOF0..SOF15, skipping the four that are not frame headers
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

function gifSize(b) {
  if (b.toString("ascii", 0, 3) !== "GIF") return null;
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
}

function svgSize(text) {
  const w = text.match(/\swidth="(\d+(?:\.\d+)?)/);
  const h = text.match(/\sheight="(\d+(?:\.\d+)?)/);
  if (w && h) return { w: Math.round(+w[1]), h: Math.round(+h[1]) };
  const vb = text.match(/viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"/);
  return vb ? { w: Math.round(+vb[1]), h: Math.round(+vb[2]) } : null;
}

/* --- the rewrite ------------------------------------------------------------ */

const attrOf = (tag, name) => new RegExp(`\\s${name}=`, "i").test(tag);
const srcOf = (tag) => (tag.match(/\ssrc="([^"]+)"/i) ?? [, null])[1];

let pagesChanged = 0;
let dimensionsAdded = 0;
let lazyAdded = 0;
let decodingAdded = 0;
let srcsetAdded = 0;
let bgSwapped = 0;
let unresolved = new Set();
let deferredScripts = 0;

const htmlFiles = (await walk(ROOT)).filter((f) => extname(f).toLowerCase() === ".html");

/* Sizes are read before the rewrite because the rewrite is a synchronous
   callback and cannot await a file read. Every distinct src is measured once. */
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = srcOf(m[0]);
    if (!src || src.startsWith("data:") || /^https?:/i.test(src)) continue;
    const target = resolve(dirname(file), src.split("?")[0]);
    if (sizeCache.has(target)) continue;
    sizeCache.set(target, existsSync(target) ? await intrinsicSize(target) : null);
  }
}

for (const file of htmlFiles) {
  const original = await readFile(file, "utf8");
  let seenFirstImage = false;

  /* One pass with a callback rather than a collect-then-replace loop. The first
     version replaced each tag by string, which silently skipped the second of two
     identical tags — the same brand lockup appears in the navigation and again in
     the footer — so a second run of the pipeline found work left to do and the
     step was not idempotent. A callback visits every occurrence exactly once. */
  let html = original.replace(/<img\b[^>]*>/gi, (tag) => {
    let next = tag;
    // The first image on a page is the likely largest contentful paint. It, and
    // anything a template has already marked high priority, stays eager.
    const eager = !seenFirstImage || /fetchpriority="high"/i.test(tag);
    seenFirstImage = true;

    if (!attrOf(tag, "width") && !attrOf(tag, "height")) {
      const src = srcOf(tag);
      if (src && !src.startsWith("data:") && !/^https?:/i.test(src)) {
        const target = resolve(dirname(file), src.split("?")[0]);
        const size = sizeCache.get(target);
        if (size?.w && size?.h) {
          next = next.replace(/<img\b/i, `<img width="${size.w}" height="${size.h}"`);
          dimensionsAdded += 1;
        } else {
          unresolved.add(relative(ROOT, target));
        }
      }
    }
    if (!attrOf(next, "loading") && !eager) {
      next = next.replace(/<img\b/i, '<img loading="lazy"');
      lazyAdded += 1;
    }
    if (!attrOf(next, "decoding")) {
      next = next.replace(/<img\b/i, '<img decoding="async"');
      decodingAdded += 1;
    }
    /* Responsive gallery images, wherever a -900 sibling exists. The heavy
       originals (mc1-exterior.webp alone is 441 KB) are referenced from many
       templates; teaching each generator about siblings would be six edits that
       drift. Here, one rule: a lazy gallery <img> without a srcset gets the
       -900 as its default and the original as the 2x candidate. Eager images —
       heroes — are left to their templates, which already choose deliberately.
       Siblings come from tools/make_image_derivatives.py. */
    if (!attrOf(next, "srcset") && !eager) {
      const src = srcOf(next);
      const m = src && src.match(/^(.*assets\/images\/gallery\/)([a-z0-9-]+)\.webp$/i);
      if (m && !m[2].endsWith("-900")) {
        const sibling = resolve(dirname(file), `${m[1]}${m[2]}-900.webp`.split("?")[0]);
        /* existsSync, not the size cache: the cache holds only files some <img>
           already references, and a sibling nothing references yet is exactly
           the case this rule exists for. */
        if (existsSync(sibling)) {
          const small = `${m[1]}${m[2]}-900.webp`;
          next = next
            .replace(`src="${src}"`, `src="${small}" srcset="${small} 900w, ${src} 1600w" sizes="(max-width:920px) 100vw, 760px"`);
          srcsetAdded += 1;
        }
      }
    }
    return next;
  });

  /* Inline-style backgrounds get the same sibling treatment. CSS knows no
     srcset, but the quality cards paint a ~500 px visual from a full gallery
     original — mc3-exterior.webp is 282 KB where its -900 is 91. A background
     the CSS file owns is the stylesheet's business; one written inline into the
     page is this pass's. */
  html = html.replace(/background-image:url\('([^']*assets\/images\/gallery\/)([a-z0-9-]+)\.webp'\)/gi,
    (whole, prefix, name) => {
      if (name.endsWith("-900")) return whole;
      const sibling = resolve(dirname(file), `${prefix}${name}-900.webp`.split("?")[0]);
      if (!existsSync(sibling)) return whole;
      bgSwapped += 1;
      return `background-image:url('${prefix}${name}-900.webp')`;
    });

  /* The place index: 1,003 KB fetched on load for a search box most visitors
     never use. The path moves onto the input and main.js loads it on focus. */
  const scriptTag = html.match(/<script src="([^"]*assets\/js\/locations-data\.js)"><\/script>/);
  if (scriptTag) {
    html = html.replace(scriptTag[0], "");
    html = html.replace(/(<input\b[^>]*id="locationSearch")/, `$1 data-locations-src="${scriptTag[1]}"`);
    deferredScripts += 1;
  }

  if (html !== original) {
    await writeFile(file, html, "utf8");
    pagesChanged += 1;
  }
}

console.log(JSON.stringify({
  pages_changed: pagesChanged,
  dimensions_added: dimensionsAdded,
  lazy_added: lazyAdded,
  decoding_added: decodingAdded,
  responsive_srcset_added: srcsetAdded,
  inline_backgrounds_swapped: bgSwapped,
  locations_script_deferred: deferredScripts,
  images_without_a_readable_size: unresolved.size,
  unreadable_examples: [...unresolved].slice(0, 5),
}));
