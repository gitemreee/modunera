import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const BASE = "https://modunera.com/";
const EXPECTED_WHATSAPP = "905535435342";
const REQUIRED_COLORS = ["#C29B72", "#8D321F", "#3A4027", "#2B2D31"];
const SKIP_DIRECTORIES = new Set([".git", ".github", "node_modules"]);
const REQUIRED_FILES = [
  "assets/images/modunera-logo.png",
  "assets/images/modunera-mark.png",
  "laender/niederlande/index.html",
  "laender/daenemark/index.html",
  "laender/luxemburg/index.html",
  "laender/schweiz/index.html",
  "en/countries/netherlands/index.html",
  "en/countries/denmark/index.html",
  "en/countries/luxembourg/index.html",
  "en/countries/switzerland/index.html",
  "leistungen/moebel-nach-mass/index.html",
  "en/services/bespoke-furniture/index.html",
  "blog/europa/tiny-house-transport-tuerkei-europa/index.html",
  "en/guides/tiny-house-transport-turkiye-europe/index.html",
  "faq/europa/index.html",
  "en/faq/index.html",
  "sitemap.xml",
  "robots.txt",
  "llms.txt",
];

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

function repoPath(file) {
  return relative(ROOT, file).replaceAll("\\", "/");
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function localTarget(rawValue, sourceFile) {
  const value = rawValue.replaceAll("&amp;", "&").trim();
  if (!value || value.startsWith("#") || /^(?:mailto|tel|javascript|data|blob):/i.test(value)) return null;

  let pathname;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.origin !== new URL(BASE).origin) return null;
    pathname = url.pathname;
  } else if (value.startsWith("//")) {
    return null;
  } else {
    pathname = value.split(/[?#]/, 1)[0];
    if (!pathname) return sourceFile;
  }

  pathname = decodePath(pathname).replaceAll("\\", "/");
  let target = pathname.startsWith("/")
    ? posix.normalize(pathname.slice(1))
    : posix.normalize(posix.join(posix.dirname(sourceFile), pathname));
  if (target.startsWith("../")) return target;
  if (pathname.endsWith("/")) target = posix.join(target === "." ? "" : target, "index.html");
  else if (!target || target === ".") target = "index.html";
  return target;
}

function referenceValues(html) {
  const values = [];
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) values.push(match[1]);
  for (const match of html.matchAll(/\bsrcset="([^"]+)"/gi)) {
    for (const candidate of match[1].split(",")) values.push(candidate.trim().split(/\s+/, 1)[0]);
  }
  return values;
}

const allFiles = await walk(ROOT);
const paths = new Set(allFiles.map(repoPath));
const htmlFiles = allFiles.filter((file) => file.endsWith("index.html"));
const issues = [];
const canonicalOwners = new Map();
let jsonLdBlocks = 0;
let checkedReferences = 0;

for (const required of REQUIRED_FILES) {
  if (!paths.has(required)) issues.push(`Missing required file: ${required}`);
  else if ((await stat(join(ROOT, required))).size === 0) issues.push(`Empty required file: ${required}`);
}

if (htmlFiles.length < 14_700) issues.push(`Expected at least 14,700 HTML pages; found ${htmlFiles.length}.`);

for (const file of htmlFiles) {
  const rel = repoPath(file);
  const html = await readFile(file, "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/i)?.[1];
  if (!canonical) {
    issues.push(`Missing canonical: ${rel}`);
  } else {
    const owners = canonicalOwners.get(canonical) ?? [];
    owners.push(rel);
    canonicalOwners.set(canonical, owners);
  }

  if (!/<html\s+lang="[^"]+"/i.test(html)) issues.push(`Missing html lang: ${rel}`);

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    jsonLdBlocks += 1;
    try {
      JSON.parse(match[1]);
    } catch (error) {
      issues.push(`Invalid JSON-LD in ${rel}: ${error.message}`);
    }
  }

  for (const value of referenceValues(html)) {
    const target = localTarget(value, rel);
    if (target === null) continue;
    checkedReferences += 1;
    if (paths.has(target)) continue;
    if (!extname(target) && paths.has(posix.join(target, "index.html"))) continue;
    issues.push(`Broken local reference in ${rel}: ${value} -> ${target}`);
  }
}

for (const [canonical, owners] of canonicalOwners) {
  if (owners.length > 1) issues.push(`Duplicate canonical ${canonical}: ${owners.join(", ")}`);
}

const css = await readFile(join(ROOT, "assets/css/styles.css"), "utf8");
for (const color of REQUIRED_COLORS) if (!css.includes(color)) issues.push(`Brand color missing from CSS: ${color}`);

const home = await readFile(join(ROOT, "index.html"), "utf8");
if (!home.includes(EXPECTED_WHATSAPP)) issues.push("Homepage WhatsApp number is missing.");
if ((home.match(/<a href="laender\/">/g) ?? []).length !== 1) issues.push("Homepage Europe navigation link is duplicated or missing.");
if ((home.match(/<a href="leistungen\/">/g) ?? []).length !== 1) issues.push("Homepage services navigation link is duplicated or missing.");

const publicTextFiles = allFiles.filter((file) => [".html", ".css", ".js", ".json", ".xml", ".txt", ".md", ".webmanifest"].includes(extname(file).toLowerCase()));
for (const file of publicTextFiles) {
  const rel = repoPath(file);
  if (["tools/rebrand-modunera.mjs", "tools/build-modunera-europe.mjs", "tools/validate-modunera.mjs"].includes(rel)) continue;
  const text = await readFile(file, "utf8");
  if (/MC Tiny|MC TINY|MC-Tiny|MC-TINY|Mc-Tiny|mctiny\.com|mc-tiny-logo\.png/.test(text)) issues.push(`Legacy public brand reference: ${rel}`);
}

if (issues.length) {
  console.error(issues.slice(0, 200).join("\n"));
  if (issues.length > 200) console.error(`...and ${issues.length - 200} more issues.`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "ok",
    html_pages: htmlFiles.length,
    unique_canonicals: canonicalOwners.size,
    json_ld_blocks: jsonLdBlocks,
    checked_local_references: checkedReferences,
    sitemap_urls: Number(JSON.parse(await readFile(join(ROOT, "build-report-modunera.json"), "utf8")).sitemap_urls),
  }));
}
