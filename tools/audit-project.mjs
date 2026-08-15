#!/usr/bin/env node
/* One pass over the built site that measures what a technical audit asks for.

   It reads only — it writes nothing except the JSON report on stdout — so it can
   be run at any point in the pipeline without changing the result of the next
   step. Everything it counts is counted from the committed HTML rather than from
   a build report, because a build report records what a generator believed it
   did and the audit needs what is actually on disk.

   Usage: node tools/audit-project.mjs [--json out.json]
*/
import { readFile, readdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com";
const WA_NUMBER = "905535435342";

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", ".github", "node_modules", "sitemaps"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

const all = await walk(ROOT);
const htmlFiles = all.filter((f) => extname(f).toLowerCase() === ".html");
const rel = (f) => relative(ROOT, f).replaceAll("\\", "/");
const route = (r) => (r === "index.html" ? "/" : `/${r.replace(/index\.html$/, "")}`);

/* --- what every page is asked to carry ------------------------------------- */

const counters = {
  pages: 0,
  indexable: 0,
  noindex: 0,
  missing_title: [],
  missing_description: [],
  title_too_long: 0,
  title_too_short: 0,
  description_too_long: 0,
  description_too_short: 0,
  missing_canonical: [],
  missing_lang: [],
  missing_og_title: 0,
  missing_og_image: 0,
  missing_twitter_card: 0,
  missing_h1: [],
  multiple_h1: [],
  with_hreflang: 0,
  with_breadcrumb_ld: 0,
  with_faq_ld: 0,
  with_org_ld: 0,
  with_website_ld: 0,
  with_service_ld: 0,
  with_product_ld: 0,
  with_article_ld: 0,
  with_localbusiness_ld: 0,
  invalid_ld: [],
  images_total: 0,
  images_missing_alt: 0,
  images_empty_alt: 0,
  images_missing_dimensions: 0,
  images_missing_loading: 0,
  wa_links: 0,
  wa_wrong_number: [],
  wa_without_prefill: 0,
  mailto: 0,
  tel: 0,
  forms: 0,
  duplicate_titles: new Map(),
  duplicate_descriptions: new Map(),
  render_blocking_external: [],
  inline_style_attr: 0,
};

const ldTypes = new Map();
const titles = new Map();
const descriptions = new Map();
const internalTargets = new Set();
const internalLinks = [];
const imageRefs = new Set();

const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i")) ?? [, null])[1];

for (const file of htmlFiles) {
  const r = rel(file);
  const html = await readFile(file, "utf8");
  counters.pages += 1;
  internalTargets.add(route(r));

  const robots = (html.match(/<meta name="robots" content="([^"]*)"/i) ?? [, ""])[1];
  const isNoindex = /noindex/i.test(robots);
  if (isNoindex) counters.noindex += 1; else counters.indexable += 1;

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) ?? [, ""])[1].trim();
  const description = (html.match(/<meta name="description" content="([^"]*)"/i) ?? [, ""])[1].trim();
  if (!title) counters.missing_title.push(r);
  if (!description) counters.missing_description.push(r);
  if (title && title.length > 65) counters.title_too_long += 1;
  if (title && title.length < 25) counters.title_too_short += 1;
  if (description && description.length > 165) counters.description_too_long += 1;
  if (description && description.length < 70) counters.description_too_short += 1;

  // duplicates only matter among pages that are allowed to be search results
  if (!isNoindex) {
    if (title) titles.set(title, (titles.get(title) ?? 0) + 1);
    if (description) descriptions.set(description, (descriptions.get(description) ?? 0) + 1);
  }

  if (!/<link rel="canonical"/i.test(html)) counters.missing_canonical.push(r);
  if (!/<html[^>]*\slang="/i.test(html)) counters.missing_lang.push(r);
  if (!/property="og:title"/i.test(html)) counters.missing_og_title += 1;
  if (!/property="og:image"/i.test(html)) counters.missing_og_image += 1;
  if (!/name="twitter:card"/i.test(html)) counters.missing_twitter_card += 1;
  if (/rel="alternate" hreflang=/i.test(html)) counters.with_hreflang += 1;

  const h1s = html.match(/<h1[\s>]/gi) ?? [];
  if (h1s.length === 0) counters.missing_h1.push(r);
  if (h1s.length > 1) counters.multiple_h1.push(r);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(m[1]); } catch { counters.invalid_ld.push(r); continue; }
    for (const node of Array.isArray(data) ? data : [data]) {
      const t = node?.["@type"];
      for (const one of Array.isArray(t) ? t : [t]) {
        if (!one) continue;
        ldTypes.set(one, (ldTypes.get(one) ?? 0) + 1);
      }
    }
    const flat = JSON.stringify(data);
    if (flat.includes('"BreadcrumbList"')) counters.with_breadcrumb_ld += 1;
    if (flat.includes('"FAQPage"')) counters.with_faq_ld += 1;
    if (flat.includes('"Organization"')) counters.with_org_ld += 1;
    if (flat.includes('"WebSite"')) counters.with_website_ld += 1;
    if (flat.includes('"Service"')) counters.with_service_ld += 1;
    if (flat.includes('"Product"')) counters.with_product_ld += 1;
    if (flat.includes('"Article"') || flat.includes('"NewsArticle"')) counters.with_article_ld += 1;
    if (flat.includes('"LocalBusiness"')) counters.with_localbusiness_ld += 1;
  }

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    counters.images_total += 1;
    const alt = attr(tag, "alt");
    if (alt === null) counters.images_missing_alt += 1;
    else if (alt.trim() === "") counters.images_empty_alt += 1;
    if (!attr(tag, "width") || !attr(tag, "height")) counters.images_missing_dimensions += 1;
    if (!attr(tag, "loading") && !/fetchpriority="high"/i.test(tag)) counters.images_missing_loading += 1;
    const src = attr(tag, "src");
    if (src && !src.startsWith("http") && !src.startsWith("data:")) {
      imageRefs.add(join(dirname(file), src.split("?")[0]));
    }
  }

  for (const m of html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/gi)) {
    counters.wa_links += 1;
    const url = m[1];
    const number = (url.match(/wa\.me\/(\d+)/) ?? [, ""])[1];
    if (number !== WA_NUMBER) counters.wa_wrong_number.push(`${r}: ${number}`);
    if (!url.includes("?text=")) counters.wa_without_prefill += 1;
  }
  counters.mailto += (html.match(/href="mailto:/gi) ?? []).length;
  counters.tel += (html.match(/href="tel:/gi) ?? []).length;
  counters.forms += (html.match(/<form[\s>]/gi) ?? []).length;
  counters.inline_style_attr += (html.match(/\sstyle="/gi) ?? []).length;

  for (const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(https?:\/\/[^"]+)"/gi)) {
    if (!m[1].startsWith(BASE)) counters.render_blocking_external.push(`${r}: ${m[1]}`);
  }

  // internal links, for the broken-link pass
  for (const m of html.matchAll(/\shref="([^"#?][^"]*)"/gi)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    internalLinks.push([r, href, join(dirname(file), href.split("#")[0].split("?")[0])]);
  }
}

/* --- resolve the internal links -------------------------------------------- */

const broken = [];
for (const [from, href, target] of internalLinks) {
  const candidates = [target, join(target, "index.html")];
  if (!candidates.some((c) => existsSync(c))) broken.push(`${from} -> ${href}`);
}

/* --- images referenced but absent, and images present but unused ----------- */

const missingImages = [...imageRefs].filter((f) => !existsSync(f)).map((f) => rel(f));
const assetFiles = all
  .filter((f) => /\.(webp|jpe?g|png|svg|avif)$/i.test(f))
  .filter((f) => rel(f).startsWith("assets/"));
const unusedImages = assetFiles.filter((f) => !imageRefs.has(f)).map((f) => rel(f));

let heaviestImages = [];
for (const f of assetFiles) {
  const s = await stat(f);
  heaviestImages.push({ file: rel(f), kb: Math.round(s.size / 1024) });
}
heaviestImages = heaviestImages.sort((a, b) => b.kb - a.kb).slice(0, 12);

/* --- the crawl contract ----------------------------------------------------- */

const readIf = async (f) => (existsSync(join(ROOT, f)) ? await readFile(join(ROOT, f), "utf8") : null);
const robotsTxt = await readIf("robots.txt");
const sitemapIndex = await readIf("sitemap.xml");
const llms = await readIf("llms.txt");
const llmsFull = await readIf("llms-full.txt");

const sitemapUrls = [];
if (existsSync(join(ROOT, "sitemaps"))) {
  for (const f of await readdir(join(ROOT, "sitemaps"))) {
    if (!f.endsWith(".xml")) continue;
    const xml = await readFile(join(ROOT, "sitemaps", f), "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.push(m[1]);
  }
}
const sitemapRoutes = new Set(sitemapUrls.map((u) => u.replace(BASE, "") || "/"));
const sitemapNot404 = sitemapUrls.filter((u) => !internalTargets.has(u.replace(BASE, "") || "/"));

const dupTitles = [...titles.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
const dupDescriptions = [...descriptions.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);

const report = {
  generated_at: new Date().toISOString().slice(0, 10),
  pages: counters.pages,
  indexable_pages: counters.indexable,
  noindex_pages: counters.noindex,
  head: {
    missing_title: counters.missing_title.length,
    missing_description: counters.missing_description.length,
    missing_canonical: counters.missing_canonical.length,
    missing_lang: counters.missing_lang.length,
    title_over_65_chars: counters.title_too_long,
    title_under_25_chars: counters.title_too_short,
    description_over_165_chars: counters.description_too_long,
    description_under_70_chars: counters.description_too_short,
    missing_og_title: counters.missing_og_title,
    missing_og_image: counters.missing_og_image,
    missing_twitter_card: counters.missing_twitter_card,
    pages_with_hreflang: counters.with_hreflang,
  },
  duplicates_among_indexable: {
    duplicate_title_strings: dupTitles.length,
    worst_title: dupTitles[0] ? { title: dupTitles[0][0].slice(0, 90), pages: dupTitles[0][1] } : null,
    duplicate_description_strings: dupDescriptions.length,
    worst_description: dupDescriptions[0] ? { pages: dupDescriptions[0][1] } : null,
  },
  headings: {
    pages_without_h1: counters.missing_h1.length,
    pages_with_more_than_one_h1: counters.multiple_h1.length,
    examples_without_h1: counters.missing_h1.slice(0, 5),
  },
  structured_data: {
    invalid_json_ld_pages: counters.invalid_ld.length,
    types: Object.fromEntries([...ldTypes.entries()].sort((a, b) => b[1] - a[1])),
    pages_with_breadcrumb: counters.with_breadcrumb_ld,
    pages_with_faqpage: counters.with_faq_ld,
    pages_with_organization: counters.with_org_ld,
    pages_with_website: counters.with_website_ld,
    pages_with_service: counters.with_service_ld,
    pages_with_product: counters.with_product_ld,
    pages_with_article: counters.with_article_ld,
    pages_with_localbusiness: counters.with_localbusiness_ld,
  },
  images: {
    img_tags: counters.images_total,
    missing_alt_attribute: counters.images_missing_alt,
    empty_alt_decorative: counters.images_empty_alt,
    missing_width_or_height: counters.images_missing_dimensions,
    missing_loading_attribute: counters.images_missing_loading,
    referenced_but_absent: missingImages.length,
    referenced_but_absent_examples: missingImages.slice(0, 8),
    files_present_but_unreferenced: unusedImages.length,
    heaviest: heaviestImages,
  },
  links: {
    internal_links_checked: internalLinks.length,
    broken: broken.length,
    broken_examples: broken.slice(0, 10),
  },
  conversion: {
    whatsapp_links: counters.wa_links,
    whatsapp_wrong_number: counters.wa_wrong_number.length,
    whatsapp_wrong_number_examples: counters.wa_wrong_number.slice(0, 5),
    whatsapp_without_prefilled_text: counters.wa_without_prefill,
    mailto_links: counters.mailto,
    tel_links: counters.tel,
    forms: counters.forms,
  },
  crawl_contract: {
    robots_txt: robotsTxt ? `${robotsTxt.split("\n").length} lines` : "MISSING",
    robots_blocks_ai: robotsTxt ? /GPTBot|ClaudeBot|PerplexityBot/i.test(robotsTxt) : null,
    sitemap_index: sitemapIndex ? "present" : "MISSING",
    sitemap_urls: sitemapUrls.length,
    sitemap_urls_without_a_page: sitemapNot404.length,
    sitemap_url_examples_without_a_page: sitemapNot404.slice(0, 5),
    indexable_pages_missing_from_sitemap: counters.indexable - [...sitemapRoutes].filter((r) => internalTargets.has(r)).length,
    llms_txt: llms ? `${llms.length} bytes` : "MISSING",
    llms_full_txt: llmsFull ? `${llmsFull.length} bytes` : "MISSING",
  },
  performance_signals: {
    external_render_blocking_references: counters.render_blocking_external.length,
    external_reference_examples: [...new Set(counters.render_blocking_external.map((s) => s.split(": ")[1]))].slice(0, 6),
    inline_style_attributes: counters.inline_style_attr,
  },
};

const jsonFlag = process.argv.indexOf("--json");
const out = JSON.stringify(report, null, 2);
if (jsonFlag > -1 && process.argv[jsonFlag + 1]) {
  await writeFile(join(ROOT, process.argv[jsonFlag + 1]), `${out}\n`, "utf8");
  console.log(`written to ${process.argv[jsonFlag + 1]}`);
} else {
  console.log(out);
}
