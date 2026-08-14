#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(process.argv.find(a => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]) || path.join(HERE, ".."));
const BASE = "https://modunera.com";
const SITEMAP_DIR = path.join(ROOT, "sitemaps");
const MAX_URLS_PER_SITEMAP = 20_000;
const INDEX_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const PRIVATE_ROBOTS = "noindex,nofollow";
const PRIVATE_PREFIXES = ["/admin-demo/", "/customer-portal/", "/booking/", "/saved-designs/"];
/* Sweden and Türkiye are not target markets. Both are single legacy pages; they
   stay reachable and keep their links, but they are not search results. */
const NON_MARKET_PREFIXES = ["/sv/", "/tr/"];
const LOCATION_PREFIXES = [
  "/standorte/",
  "/en/locations/",
  "/nl/locaties/",
  "/da/steder/",
  "/fr/lieux/"
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function routeFor(file) {
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  return relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
}

function normaliseRoute(value) {
  if (!value) return "";
  try {
    const url = new URL(value, BASE);
    return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  } catch {
    return "";
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getCanonical(html) {
  return html.match(/<link[^>]*\srel=["']canonical["'][^>]*\shref=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]*\shref=["']([^"']+)["'][^>]*\srel=["']canonical["']/i)?.[1]
    || "";
}

function getRobots(html) {
  return html.match(/<meta[^>]*\sname=["']robots["'][^>]*\scontent=["']([^"']*)["']/i)?.[1]
    || html.match(/<meta[^>]*\scontent=["']([^"']*)["'][^>]*\sname=["']robots["']/i)?.[1]
    || "";
}

function setRobots(html, content) {
  const tag = `<meta name="robots" content="${content}">`;
  const pattern = /<meta[^>]*\sname=["']robots["'][^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

function isLocation(route) {
  return LOCATION_PREFIXES.some(prefix => route.startsWith(prefix));
}

function isPrivate(route) {
  return PRIVATE_PREFIXES.some(prefix => route.startsWith(prefix));
}

function isNonMarket(route) {
  return NON_MARKET_PREFIXES.some(prefix => route.startsWith(prefix));
}

/* Statutory pages that are still missing register data. They stay published and
   linked, but an incomplete Impressum should not be a search result. Remove a
   route here once REQUIRED-BUSINESS-INPUTS.md section 1 is satisfied. */
const INCOMPLETE_LEGAL = ["/legal/impressum/", "/legal/datenschutz/", "/legal/cookies/"];

function collectImages(html, canonical) {
  const images = [];
  for (const match of html.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1].trim();
    if (!src || src.startsWith("data:")) continue;
    try {
      const absolute = new URL(src, canonical);
      if (absolute.origin !== BASE) continue;
      images.push(absolute.href);
    } catch {
      // Ignore malformed image URLs; the general site validator reports broken references.
    }
  }
  return [...new Set(images)];
}

async function loadJson(relative, fallback) {
  const file = path.join(ROOT, relative);
  if (!existsSync(file)) return fallback;
  return JSON.parse(await readFile(file, "utf8"));
}

const policy = await loadJson("data/location-index-policy.json", { approved_urls: [], entries: [] });
const lastmodData = await loadJson("data/content-lastmod.json", { urls: {} });
const approved = new Set((policy.approved_urls || []).map(normaliseRoute).filter(Boolean));
for (const entry of policy.entries || []) {
  const score = Number(entry.quality_score || 0);
  if (entry.status === "approved" && score >= Number(policy.minimum_quality_score || 75)) {
    const route = normaliseRoute(entry.url);
    if (route) approved.add(route);
  }
}

const htmlFiles = (await walk(ROOT)).filter(file => file.endsWith("index.html"));
const pages = [];
const failures = [];
let changedRobots = 0;
let excludedLocations = 0;
let excludedNonMarket = 0;
let excludedLegal = 0;

for (const file of htmlFiles) {
  const route = routeFor(file);
  let html = await readFile(file, "utf8");
  const location = isLocation(route);
  const privatePage = isPrivate(route);

  if (privatePage) {
    const updated = setRobots(html, PRIVATE_ROBOTS);
    if (updated !== html) {
      await writeFile(file, updated);
      html = updated;
      changedRobots += 1;
    }
  } else if (isNonMarket(route) || INCOMPLETE_LEGAL.includes(route)) {
    const updated = setRobots(html, NOINDEX_ROBOTS);
    if (updated !== html) {
      await writeFile(file, updated);
      html = updated;
      changedRobots += 1;
    }
  } else if (location) {
    const shouldIndex = approved.has(normaliseRoute(route));
    const updated = setRobots(html, shouldIndex ? INDEX_ROBOTS : NOINDEX_ROBOTS);
    if (updated !== html) {
      await writeFile(file, updated);
      html = updated;
      changedRobots += 1;
    }
    if (!shouldIndex) excludedLocations += 1;
  }

  const robots = getRobots(html);
  if (/noindex/i.test(robots)) {
    if (isNonMarket(route)) excludedNonMarket += 1;
    if (INCOMPLETE_LEGAL.includes(route)) excludedLegal += 1;
    continue;
  }

  const canonical = getCanonical(html);
  if (!canonical) {
    failures.push(`${route}: missing canonical`);
    continue;
  }
  let canonicalUrl;
  try {
    canonicalUrl = new URL(canonical);
  } catch {
    failures.push(`${route}: invalid canonical ${canonical}`);
    continue;
  }
  if (canonicalUrl.origin !== BASE) {
    failures.push(`${route}: off-domain canonical ${canonical}`);
    continue;
  }
  if (normaliseRoute(canonicalUrl.href) !== normaliseRoute(route)) {
    failures.push(`${route}: canonical is not self-referential (${canonical})`);
    continue;
  }

  const lastmod = lastmodData.urls?.[route] || null;
  if (lastmod) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) failures.push(`${route}: invalid lastmod ${lastmod}`);
    else if (lastmod > new Date().toISOString().slice(0, 10)) failures.push(`${route}: future lastmod ${lastmod}`);
  }
  pages.push({ route, loc: canonicalUrl.href, lastmod, images: collectImages(html, canonicalUrl.href) });
}

if (failures.length) {
  console.error(failures.slice(0, 100).join("\n"));
  console.error(`SEO governance failed with ${failures.length} issue(s).`);
  process.exit(1);
}

pages.sort((a, b) => a.loc.localeCompare(b.loc, "en"));
await mkdir(SITEMAP_DIR, { recursive: true });
for (const file of await readdir(SITEMAP_DIR)) {
  if (/^sitemap-.*\.xml$/i.test(file)) await unlink(path.join(SITEMAP_DIR, file));
}

const sitemapFiles = [];
for (let offset = 0, part = 1; offset < pages.length; offset += MAX_URLS_PER_SITEMAP, part += 1) {
  const chunk = pages.slice(offset, offset + MAX_URLS_PER_SITEMAP);
  const name = `sitemap-${String(part).padStart(4, "0")}.xml`;
  const body = chunk.map(page => {
    const lastmod = page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : "";
    return `<url><loc>${escapeXml(page.loc)}</loc>${lastmod}</url>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`;
  await writeFile(path.join(SITEMAP_DIR, name), xml);
  sitemapFiles.push(name);
}

const imageBody = pages
  .filter(page => page.images.length)
  .map(page => `<url><loc>${escapeXml(page.loc)}</loc>${page.images.map(image => `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`).join("")}</url>`)
  .join("");
await writeFile(
  path.join(ROOT, "image-sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${imageBody}</urlset>\n`
);

const sitemapIndexEntries = [
  ...sitemapFiles.map(name => `${BASE}/sitemaps/${name}`),
  `${BASE}/image-sitemap.xml`
];
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapIndexEntries.map(loc => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join("")}</sitemapindex>\n`;
await writeFile(path.join(ROOT, "sitemap.xml"), indexXml);

const report = {
  generated_at: new Date().toISOString(),
  html_pages_seen: htmlFiles.length,
  indexable_canonical_pages: pages.length,
  approved_location_routes: approved.size,
  excluded_location_pages: excludedLocations,
  excluded_non_market_pages: excludedNonMarket,
  excluded_incomplete_legal_pages: excludedLegal,
  robots_tags_changed: changedRobots,
  sitemap_files: sitemapFiles,
  sitemap_urls: pages.length,
  pages_with_images: pages.filter(page => page.images.length).length,
  pages_with_explicit_lastmod: pages.filter(page => page.lastmod).length
};
await writeFile(path.join(ROOT, "build-report-seo-v7.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));

