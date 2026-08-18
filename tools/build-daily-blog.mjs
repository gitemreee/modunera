#!/usr/bin/env node
/* The daily practice series: /blog/praxis/

   WHY THIS IS A SEPARATE GENERATOR AND A SEPARATE TREE

   The 125 posts under /blog/ stay exactly as they are. They were rewritten once
   already — they had been produced from one seven-section skeleton with a
   keyword swapped in, which a search engine reads as one page published 125
   times, and getting mean pairwise overlap from ~95% down to 10% was real work.
   Nothing here touches them.

   This series is additive: one post per day, each written on its own subject,
   published under its own path so the two cannot be confused for each other.

   HOW "ONE PER DAY" ACTUALLY WORKS

   There is no server. Netlify publishes committed HTML, so a post appears when
   the pipeline runs on or after its publish_on date and the result is committed.
   .github/workflows/daily-post.yml runs the pipeline every morning and commits
   only if the output changed, which on most days is exactly one new post plus
   the sitemap.

   A post with a future publish_on is not written to disk at all. It is not
   hidden with CSS or noindex — it does not exist as a page until its day, so
   there is nothing for a crawler to find early.

   THE DUPLICATION GUARD

   A daily series is the single easiest way to recreate the problem this site
   already paid to fix, so the generator refuses to let it happen. Every pair of
   published posts is compared by 6-gram Jaccard similarity over the rendered
   body, and the build fails if any pair exceeds MAX_OVERLAP. Length is not a
   defence: two 2,000-word posts that say the same thing are still one post.
   The check runs on what is rendered, not on the source, because the source is
   not what Google reads.

   Usage: node tools/build-daily-blog.mjs
*/
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://modunera.com/";
const WA = "905535435342";
const SERIES = "blog/praxis";
const MAX_OVERLAP = 0.30;
const MIN_WORDS = 1800;

const TODAY = (process.env.MODUNERA_TODAY ?? new Date().toISOString().slice(0, 10));

const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const rootFor = (rel) => "../".repeat(rel.split("/").length - 1);
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replaceAll("<", "\\u003c")}</script>`;
const waLink = (m) => `https://wa.me/${WA}?text=${encodeURIComponent(m)}`;

/* --- the queue ------------------------------------------------------------- */

const files = (await readdir(join(ROOT, "data"))).filter((f) => /^blog-daily-\d+\.json$/.test(f)).sort();
const POSTS = [];
for (const f of files) {
  const batch = JSON.parse(await readFile(join(ROOT, "data", f), "utf8"));
  for (const p of batch.posts) POSTS.push({ ...p, _source: f });
}
POSTS.sort((a, b) => a.publish_on.localeCompare(b.publish_on));

const seen = new Set();
for (const p of POSTS) {
  if (seen.has(p.slug)) throw new Error(`duplicate slug in the queue: ${p.slug}`);
  seen.add(p.slug);
  for (const field of ["slug", "publish_on", "title", "description", "lead", "image", "imageAlt"]) {
    if (!p[field]) throw new Error(`${p.slug ?? "(no slug)"}: missing ${field}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.publish_on)) throw new Error(`${p.slug}: publish_on is not a date`);
}

const live = POSTS.filter((p) => p.publish_on <= TODAY);
const pending = POSTS.length - live.length;

/* --- page shell ------------------------------------------------------------ */

function head({ rel, title, description, image, extraLd = [] }) {
  const root = rootFor(rel);
  const canonical = BASE + rel.replace(/index\.html$/, "");
  return `<!DOCTYPE html><html lang="de-DE"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${esc(title)}</title><meta name="description" content="${esc(description)}">` +
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">` +
    `<meta name="theme-color" content="#3A5A40">` +
    `<link rel="canonical" href="${canonical}">` +
    `<meta property="og:type" content="article"><meta property="og:site_name" content="MODUNERA">` +
    `<meta property="og:locale" content="de_DE"><meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">` +
    `<meta property="og:image" content="${BASE}assets/images/gallery/${image}">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<link rel="icon" type="image/png" href="${root}assets/brand/modunera-mark-v1.png">` +
    `<link rel="stylesheet" href="${root}assets/css/styles.css">${extraLd.map(jsonLd).join("")}` +
    `</head><body><a class="skip" href="#main">Zum Inhalt springen</a><nav class="nav"></nav>`;
}

function footer(rel) {
  const root = rootFor(rel);
  return `<footer class="footer"><div class="container"><div class="footer-bottom">` +
    `<span>&copy; <span data-year>2026</span> MODUNERA.</span>` +
    `<span><a href="${root}legal/impressum/">Impressum</a> &middot; <a href="${root}legal/datenschutz/">Datenschutz</a></span>` +
    `</div></div></footer><script src="${root}assets/js/main.js"></script></body></html>`;
}

const DISCLAIMER = "Alle Angaben sind unverbindliche Projektorientierung und keine Rechts-, Behörden-, Statik-, Energie- oder Steuerberatung.";

/* --- one post -------------------------------------------------------------- */

function postPage(post, index, all) {
  const rel = `${SERIES}/${post.slug}/index.html`;
  const root = rootFor(rel);
  const toc = post.sections
    .map((s, i) => `<a href="#abschnitt-${i + 1}">${esc(s.h2)}</a>`)
    .join("");
  const body = post.sections
    .map((s, i) => `<section id="abschnitt-${i + 1}"><h2>${esc(s.h2)}</h2>${s.p.map((t) => `<p>${esc(t)}</p>`).join("")}</section>`)
    .join("");
  const checklist = post.checklist
    ? `<section id="checkliste"><h2>${esc(post.checklist.h2)}</h2><ul class="check-list">${post.checklist.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></section>`
    : "";
  const faq = post.faq?.length
    ? `<section id="fragen"><h2>Fragen dazu</h2><div class="faq-list">${post.faq.map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span>+</span></button><div class="faq-answer"><p>${esc(a)}</p></div></div>`).join("")}</div></section>`
    : "";

  /* Neighbours in the series, by date. Every post is reachable from the two
     around it, so a post published on day 60 is not an orphan with one link
     from the hub. */
  const prev = all[index - 1];
  const next = all[index + 1];
  const around = [
    prev ? `<a class="post-row" href="${root}${SERIES}/${prev.slug}/"><strong>${esc(prev.title)}</strong><span>Vorher</span></a>` : "",
    next ? `<a class="post-row" href="${root}${SERIES}/${next.slug}/"><strong>${esc(next.title)}</strong><span>Danach</span></a>` : "",
  ].join("");

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      inLanguage: "de-DE",
      datePublished: post.publish_on,
      dateModified: post.publish_on,
      mainEntityOfPage: BASE + rel.replace(/index\.html$/, ""),
      image: `${BASE}assets/images/gallery/${post.image}`,
      author: { "@type": "Organization", name: "MODUNERA" },
      publisher: { "@type": "Organization", name: "MODUNERA" },
    },
  ];
  if (post.faq?.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    });
  }

  const wa = `Hallo MODUNERA, ich habe Ihren Beitrag "${post.title}" gelesen. Meine Frage: __`;

  return head({ rel, title: `${post.title} | MODUNERA`, description: post.description, image: post.image, extraLd: ld }) +
    `<main id="main">` +
    `<header class="article-visual-hero"><img src="${root}assets/images/gallery/${post.image}" alt="${esc(post.imageAlt)}">` +
    `<div class="article-visual-overlay"></div><div class="container">` +
    `<div class="breadcrumbs"><a href="${root}index.html">Startseite</a> &middot; <a href="${root}blog/">Ratgeber</a> &middot; <a href="${root}${SERIES}/">Praxis</a></div>` +
    `<div class="eyebrow">Praxis &middot; ${esc(post.publish_on)}</div><h1>${esc(post.title)}</h1><p>${esc(post.description)}</p></div></header>` +
    `<section class="section section-tight"><div class="container"><div class="answer-box"><strong>Kurz gesagt</strong><p>${esc(post.lead)}</p></div></div></section>` +
    `<section class="section"><div class="container article-shell"><article class="article">` +
    `<div class="toc"><strong>Inhalt</strong>${toc}</div>${body}${checklist}${faq}` +
    `<p class="legal-note">${esc(DISCLAIMER)}</p>` +
    `</article></div></section>` +
    `<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">Praxis</div><h2>Weiter in dieser Reihe</h2></div></div><div class="post-list">${around}</div>` +
    `<div style="margin-top:24px"><a class="btn btn-primary" href="${waLink(wa)}" target="_blank" rel="noopener">Frage per WhatsApp stellen</a> <a class="btn btn-outline" href="${root}${SERIES}/">Alle Beiträge der Reihe</a></div></div></section>` +
    `</main>` + footer(rel);
}

/* --- the hub --------------------------------------------------------------- */

function hubPage(all) {
  const rel = `${SERIES}/index.html`;
  const root = rootFor(rel);
  const byCategory = new Map();
  for (const p of all) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category).push(p);
  }
  const newest = [...all].reverse();
  const rows = newest
    .map((p) => `<a class="post-row" href="${root}${SERIES}/${p.slug}/"><strong>${esc(p.title)}</strong><span>${esc(p.publish_on)}</span></a>`)
    .join("");
  const groups = [...byCategory.entries()]
    .map(([cat, list]) => `<article class="benefit-card"><h3>${esc(CATEGORY_LABEL[cat] ?? cat)}</h3><ul class="check-list">${list.slice(0, 8).map((p) => `<li><a href="${root}${SERIES}/${p.slug}/">${esc(p.title)}</a></li>`).join("")}</ul></article>`)
    .join("");
  const title = "Praxis: ein Beitrag pro Tag zu Tiny House, Modulbau und Container | MODUNERA";
  const description = "Wartung, typische Schäden, Betrieb und die Fragen, die Käufer wirklich stellen. Ein Beitrag pro Tag, jeder auf sein eigenes Thema geschrieben.";
  return head({
    rel, title, description, image: "hero-forest.webp",
    extraLd: [{
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "MODUNERA Praxis",
      description,
      inLanguage: "de-DE",
      url: BASE + SERIES + "/",
      blogPost: newest.slice(0, 30).map((p) => ({ "@type": "BlogPosting", headline: p.title, datePublished: p.publish_on, url: `${BASE}${SERIES}/${p.slug}/` })),
    }],
  }) +
    `<main id="main"><header class="page-hero"><div class="container">` +
    `<div class="breadcrumbs"><a href="${root}index.html">Startseite</a> &middot; <a href="${root}blog/">Ratgeber</a> &middot; Praxis</div>` +
    `<div class="eyebrow">Praxis</div><h1>Ein Beitrag pro Tag, aus der Werkstatt und vom Grundstück.</h1>` +
    `<p>Wartung, typische Schäden, Betrieb im Alltag und die Fragen, die vor einer Bestellung wirklich gestellt werden. Jeder Beitrag steht für sich; keiner ist die Variante eines anderen.</p></div></header>` +
    `<section class="section"><div class="container"><div class="benefit-grid">${groups}</div></div></section>` +
    `<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">Alle Beiträge</div><h2>${all.length} Beiträge, neueste zuerst.</h2></div></div><div class="post-list">${rows}</div></div></section>` +
    `</main>` + footer(rel);
}

const CATEGORY_LABEL = {
  "wartung": "Wartung und Pflege",
  "schaeden": "Typische Schäden",
  "wohnen": "Wohnen im Alltag",
  "modulbau": "Modulbau",
  "container": "Container",
  "kauf": "Kauf und Kundenfragen",
  "technik": "Technik im Betrieb",
};

/* --- the duplication guard -------------------------------------------------- */

function bodyText(post) {
  return [post.lead,
    ...post.sections.flatMap((s) => [s.h2, ...s.p]),
    ...(post.checklist?.items ?? []),
    ...(post.faq ?? []).flatMap(([q, a]) => [q, a])].join(" ");
}

function shingles(text) {
  const words = text.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + 6 <= words.length; i += 1) out.add(words.slice(i, i + 6).join(" "));
  return out;
}

function jaccard(a, b) {
  let inter = 0;
  for (const s of a) if (b.has(s)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const texts = live.map((p) => ({ slug: p.slug, words: bodyText(p).split(/\s+/).filter(Boolean).length, sh: shingles(bodyText(p)) }));
let worst = { pair: null, score: 0 };
for (let i = 0; i < texts.length; i += 1) {
  for (let j = i + 1; j < texts.length; j += 1) {
    const score = jaccard(texts[i].sh, texts[j].sh);
    if (score > worst.score) worst = { pair: [texts[i].slug, texts[j].slug], score };
  }
}
const failures = [];
if (worst.score > MAX_OVERLAP) {
  failures.push(`overlap ${(worst.score * 100).toFixed(1)}% between ${worst.pair[0]} and ${worst.pair[1]} exceeds ${(MAX_OVERLAP * 100).toFixed(0)}%`);
}
for (const t of texts) {
  if (t.words < MIN_WORDS) failures.push(`${t.slug} is ${t.words} words, below the ${MIN_WORDS} the series is written to`);
}
if (failures.length) {
  console.error("build-daily-blog: refusing to publish\n  " + failures.join("\n  "));
  process.exit(1);
}

/* --- write ------------------------------------------------------------------ */

async function put(rel, content) {
  const target = join(ROOT, rel);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

for (const [i, post] of live.entries()) {
  await put(`${SERIES}/${post.slug}/index.html`, postPage(post, i, live));
}
if (live.length) await put(`${SERIES}/index.html`, hubPage(live));

console.log(JSON.stringify({
  queued: POSTS.length,
  published: live.length,
  pending,
  today: TODAY,
  next: pending ? POSTS[live.length].publish_on : null,
  mean_words: texts.length ? Math.round(texts.reduce((n, t) => n + t.words, 0) / texts.length) : 0,
  worst_overlap_pct: Math.round(worst.score * 1000) / 10,
}));
