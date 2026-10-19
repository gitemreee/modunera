#!/usr/bin/env node
/* docs/redesign/02-url-inventory.csv — every HTML page on disk with what the
   markup says about itself: language, canonical, robots, page type (by path),
   and the migration action, which is "keep" for all of them on 2026-10-19: the
   B2B redesign adds routes and touches the English home; it retires nothing.
   Re-run after each milestone; the file is derived, never edited by hand. */
import { readFile, writeFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const files = [];
(function walk(d) { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith(".html")) files.push(relative(ROOT, p)); } })(ROOT);
files.sort();
const type = (f) => {
  if (/^(standorte|en\/locations)\//.test(f)) return f.split("/").length === 3 ? "state-hub" : "location";
  if (/^(regionen|en\/regions)\//.test(f)) return "tourism-region";
  if (/^(gewerblich|en\/commercial)\//.test(f)) return "operator";
  if (/^(modelle|en\/models|nl\/modellen|da\/modeller|fr\/modeles)\//.test(f)) return "model";
  if (/^(blog|en\/blog|nl\/blog|da\/blog|fr\/blog)\//.test(f)) return "blog";
  if (/^(laender|en\/countries|nl\/landen|da\/lande|fr\/pays)\//.test(f)) return "country";
  if (/^(news|en\/news)\//.test(f)) return "news";
  if (/^legal\/|\/legal\//.test(f)) return "legal";
  if (/^(faq|en\/faq|produktions-faq|en\/production-faq)/.test(f)) return "faq";
  if (/index\.html$/.test(f) && f.split("/").length <= 2) return "hub";
  return "page";
};
const rows = [["path", "lang", "type", "canonical", "robots", "in_sitemap", "action", "new_target", "note"]];
let sitemap = "";
try { for (const n of readdirSync(join(ROOT, "sitemaps"))) sitemap += await readFile(join(ROOT, "sitemaps", n), "utf8"); } catch {}
for (const f of files) {
  const h = await readFile(join(ROOT, f), "utf8");
  const lang = (h.match(/<html[^>]*lang="([^"]+)"/) || [])[1] || "";
  const canonical = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || "";
  const robots = (h.match(/<meta name="robots" content="([^"]+)"/) || [])[1] || "";
  rows.push([f, lang, type(f), canonical, robots.split(",")[0], canonical && sitemap.includes(canonical) ? "yes" : "no", "keep", "", ""]);
}
const csv = rows.map((r) => r.map((v) => /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v).join(",")).join("\n") + "\n";
await writeFile(join(ROOT, "docs/redesign/02-url-inventory.csv"), csv);
const by = {}; for (const r of rows.slice(1)) { const k = `${r[2]}|${r[4] || "none"}`; by[k] = (by[k] || 0) + 1; }
console.log(JSON.stringify({ pages: rows.length - 1, by_type_and_robots: by }, null, 1));
