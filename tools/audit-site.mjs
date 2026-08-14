#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || "./SITE-SOURCE");
const outputRoot = path.resolve(process.argv[3] || "./AUDIT");
const baseUrl = "https://modunera.com";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(absolute));
    else results.push(absolute);
  }
  return results;
}

function first(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || "";
}

function decode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function relativeUrl(file) {
  const rel = path.relative(sourceRoot, file).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  return `/${rel.replace(/index\.html$/, "")}`;
}

function pathLocale(url, htmlLang) {
  if (url.startsWith("/en/")) return "en";
  if (url.startsWith("/nl/")) return "nl";
  if (url.startsWith("/da/")) return "da";
  if (url.startsWith("/fr/")) return "fr";
  if (url.startsWith("/sv/")) return "sv";
  if (url.startsWith("/tr/")) return "tr";
  return htmlLang.toLowerCase().split("-")[0] || "de";
}

function collectMap(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    const list = map.get(value) || [];
    list.push(row.url);
    map.set(value, list);
  }
  return [...map.entries()]
    .filter(([, urls]) => urls.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([value, urls]) => ({ value, count: urls.length, urls }));
}

if (!existsSync(sourceRoot)) {
  console.error(`Source root not found: ${sourceRoot}`);
  process.exit(1);
}

const allFiles = await walk(sourceRoot);
const htmlFiles = allFiles.filter(file => file.endsWith("index.html"));

const sitemapUrls = new Set();
const sitemapFiles = allFiles.filter(file => /(?:^|\/)sitemap[^/]*\.xml$/i.test(file));
for (const file of sitemapFiles) {
  const xml = await readFile(file, "utf8");
  for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
    if (!match[1].endsWith(".xml")) sitemapUrls.add(match[1].trim());
  }
}

const rows = [];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const url = relativeUrl(file);
  const title = decode(first(html, /<title>([\s\S]*?)<\/title>/i));
  const description = decode(first(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i));
  const htmlLang = first(html, /<html[^>]*\slang=["']([^"']+)["']/i);
  const canonical = first(html, /<link[^>]*\srel=["']canonical["'][^>]*\shref=["']([^"']+)["']/i)
    || first(html, /<link[^>]*\shref=["']([^"']+)["'][^>]*\srel=["']canonical["']/i);
  const robots = first(html, /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  const hreflangs = [...html.matchAll(/<link[^>]*\srel=["']alternate["'][^>]*\shreflang=["']([^"']+)["'][^>]*\shref=["']([^"']+)["']/gi)]
    .map(match => `${match[1]}=${match[2]}`);
  const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
  const jsonLdCount = (html.match(/type=["']application\/ld\+json["']/gi) || []).length;
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = visible ? visible.split(" ").length : 0;
  const indexable = !/(?:noindex)/i.test(robots);
  const absoluteUrl = canonical || `${baseUrl}${url}`;
  rows.push({
    url,
    locale: pathLocale(url, htmlLang),
    html_lang: htmlLang,
    title,
    title_length: [...title].length,
    meta_description: description,
    description_length: [...description].length,
    canonical,
    robots,
    indexable,
    in_sitemap: sitemapUrls.has(absoluteUrl),
    h1_count: h1Count,
    hreflang_count: hreflangs.length,
    hreflangs: hreflangs.join(" | "),
    jsonld_blocks: jsonLdCount,
    word_count: wordCount,
    page_family: url.startsWith("/standorte/") || url.startsWith("/en/locations/") ? "programmatic-location" : "editorial-or-commercial",
    placeholder_flag: /platzhalter|placeholder|demo version|demo-version|vor livegang/i.test(html),
    file: path.relative(sourceRoot, file).split(path.sep).join("/")
  });
}

rows.sort((a, b) => a.url.localeCompare(b.url, "en"));
const duplicateTitles = collectMap(rows.filter(row => row.indexable), "title");
const duplicateDescriptions = collectMap(rows.filter(row => row.indexable), "meta_description");
const duplicateCanonicals = collectMap(rows, "canonical");
const counts = (key) => Object.fromEntries([...new Set(rows.map(row => row[key]))]
  .sort()
  .map(value => [String(value), rows.filter(row => row[key] === value).length]));

const summary = {
  generated_at: new Date().toISOString(),
  source_root: sourceRoot,
  html_pages: rows.length,
  indexable_pages: rows.filter(row => row.indexable).length,
  sitemap_urls_seen: sitemapUrls.size,
  pages_in_sitemap: rows.filter(row => row.in_sitemap).length,
  missing_title: rows.filter(row => !row.title).length,
  missing_description: rows.filter(row => !row.meta_description).length,
  missing_canonical: rows.filter(row => !row.canonical).length,
  missing_html_lang: rows.filter(row => !row.html_lang).length,
  invalid_h1_count: rows.filter(row => row.h1_count !== 1).length,
  no_hreflang: rows.filter(row => row.hreflang_count === 0).length,
  incomplete_target_hreflang: rows.filter(row => row.indexable && row.hreflang_count < 6).length,
  placeholder_pages: rows.filter(row => row.placeholder_flag).length,
  programmatic_location_pages: rows.filter(row => row.page_family === "programmatic-location").length,
  locale_counts: counts("locale"),
  hreflang_count_distribution: counts("hreflang_count"),
  duplicate_title_groups: duplicateTitles.length,
  duplicate_description_groups: duplicateDescriptions.length,
  duplicate_canonical_groups: duplicateCanonicals.length,
  notes: [
    "A complete five-language cluster requires de-DE, en, nl-NL, da-DK, fr plus x-default (6 entries).",
    "The script reports technical signals; it does not certify legal or engineering claims.",
    "Generated location pages need a separate local-value review before indexation."
  ]
};

await mkdir(outputRoot, { recursive: true });
const headers = Object.keys(rows[0] || {});
const csvBody = [headers.join(","), ...rows.map(row => headers.map(key => csv(row[key])).join(","))].join("\n") + "\n";
await writeFile(path.join(outputRoot, "url-language-inventory.csv"), csvBody);
await writeFile(path.join(outputRoot, "site-audit-summary.json"), JSON.stringify(summary, null, 2) + "\n");
await writeFile(path.join(outputRoot, "duplicate-titles.json"), JSON.stringify(duplicateTitles, null, 2) + "\n");
await writeFile(path.join(outputRoot, "duplicate-descriptions.json"), JSON.stringify(duplicateDescriptions, null, 2) + "\n");
await writeFile(path.join(outputRoot, "duplicate-canonicals.json"), JSON.stringify(duplicateCanonicals, null, 2) + "\n");

console.log(JSON.stringify(summary, null, 2));
