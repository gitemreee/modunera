#!/usr/bin/env node
/* The MODUNERA Intelligence screen — sections 62, 63 and 64.

   WHY IT IS A GENERATED PAGE AND NOT AN ADMIN PANEL

   The master prompt asks for an admin panel with a dashboard, a news-candidate
   screen and a business-opportunities screen. This site has no server, no
   database and no session: netlify.toml publishes the repository root and the
   committed HTML is what ships. An "admin panel" here can only be one of two
   things — a page generated from the repository's own data, or a login form that
   protects nothing. It is the first.

   That has a consequence worth stating rather than hiding: the URL is
   unlisted, not secret. /intelligence/ is noindex,nofollow and appears in no
   sitemap, no navigation and no internal link, but anyone who types it sees it.
   So the page shows what a competitor could read from the sources anyway — the
   authority, the procedure, the score, the recommendation — and never a named
   official's direct line, a price the site does not publish, or a lead's private
   contact details. Section 64 asks for e-mail and phone columns; they are rendered
   as a link to the source page that carries them, because this repository is
   public and those columns would publish a person's contact details.

   The donor shell is admin-demo/index.html: the same navigation, footer and dock
   the rest of the site has, taken from a page that already exists rather than
   copied into a template that would drift from it.

   Idempotent: the page is rebuilt from data every run and byte-identical when the
   data has not changed.

   Order: after build-daily-blog.mjs and before build-modunera-v2.mjs, so the nav
   pass rewrites this page's navigation like every other page's, and before
   build-seo-governance-v7.mjs, which is what actually stamps noindex,nofollow on
   it and keeps it out of the sitemap.

   Usage: node tools/build-intelligence-dashboard.mjs
*/
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DONOR = join(ROOT, "admin-demo/index.html");
const OUT = join(ROOT, "intelligence/index.html");

const read = async (p, fallback = null) => {
  if (!existsSync(p)) return fallback;
  return JSON.parse(await readFile(p, "utf8"));
};

const store = await read(join(ROOT, "data/market-signals.json"), { runs: [], signals: [], opportunities: [], tenders: [] });
const config = await read(join(ROOT, "data/market-scan-config.json"));
const news = await read(join(ROOT, "data/news.json"), { items: [] });
const inbox = await read(join(ROOT, "data/verified-signals-inbox.json"), { candidates: [] });

const esc = (v) => String(v ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

/* A value the source did not state is shown as that, in words. An em dash in a
   table cell reads as "zero" to half the people who look at it. */
const stated = (v) => (v === null || v === undefined || v === "" ? '<span class="muted">nicht angegeben</span>' : esc(v));

const lastRun = store.runs.at(-1) ?? null;
const cron = config?.run?.schedule_cron_utc ?? "not configured";
const tz = config?.run?.timezone ?? "UTC";
/* The cron is UTC and the office is not. Printing "cron 35 4 * * * (Europe/
   Istanbul)" invites the reader to add three hours to a number that already
   accounts for them, so both clocks are spelled out. */
const cronClock = (() => {
  const m = /^(\d+)\s+(\d+)\s/.exec(cron);
  if (!m) return cron;
  const [, min, hour] = m;
  const local = (Number(hour) + 3) % 24;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")} UTC · ${String(local).padStart(2, "0")}:${String(min).padStart(2, "0")} ${tz}`;
})();

function nextRunAfter(dateIso) {
  if (!dateIso) return null;
  const d = new Date(Date.parse(dateIso) + 86400000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/* --- section 62, the dashboard ------------------------------------------- */

const dueForReview = news.items.filter((i) => i.nextReviewAt && lastRun && i.nextReviewAt <= lastRun.date);
const publishedSignals = store.signals.filter((s) => s.published);
const waiting = store.signals.filter((s) => !s.published);

const tiles = [
  ["Today's Run", lastRun ? `${lastRun.date} · ${lastRun.runId}` : "noch kein Lauf", lastRun ? `Provider: ${lastRun.provider}` : ""],
  ["Next Run", nextRunAfter(lastRun?.date) ?? "—", cronClock],
  ["Market Signals", store.signals.length, `${publishedSignals.length} veröffentlicht, ${waiting.length} offen`],
  ["News Candidates", waiting.length, "warten auf eine Entscheidung"],
  ["SEO Opportunities", "0", "kein Provider konfiguriert"],
  ["GSC Opportunities", lastRun?.gscOpportunities ?? 0, lastRun?.gsc ?? "not connected"],
  ["Municipal Projects", store.signals.filter((s) => s.type === "MUNICIPAL_TINY_HOUSE_SITE").length, "kommunale Verfahren"],
  ["Commercial Leads", store.opportunities.length, "öffentliche Geschäftskontakte"],
  ["Tenders", store.tenders.length, "Ausschreibungen"],
  ["Regulation Changes", "0", "keine erfasst"],
  ["Content Updates", lastRun?.contentUpdated ?? 0, "in diesem Lauf"],
  ["Published Articles", news.items.length, `${dueForReview.length} zur Prüfung fällig`],
  ["Errors", lastRun?.errors?.length ?? 0, lastRun?.errors?.length ? "siehe unten" : "keine"],
];

/* Classes are taken from assets/css/styles.css, not invented. The first draft of
   this page used .card, .grid-4 and .stat; none of the three exists in the
   stylesheet, and the page would have rendered as an unstyled column while every
   command exited 0. .stat-grid, .stat-card, h4, h3 and .legal-note all have rules. */
const tileCards = tiles.map(([label, value, note]) =>
  `<div class="stat-card"><h4>${esc(label)}</h4><h3>${esc(value)}</h3>` +
  (note ? `<p class="legal-note">${esc(note)}</p>` : "") + `</div>`).join("");

/* --- section 63, the news-candidate screen -------------------------------- */

const candidateRows = store.signals.length
  ? store.signals.map((s) => `<tr>` +
      `<td>${esc(s.title)}</td>` +
      `<td>${esc(s.country)}</td>` +
      `<td>${stated(s.municipality)}</td>` +
      `<td><a href="${esc(s.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(s.publisher)}</a></td>` +
      `<td>${esc(s.status)}</td>` +
      `<td>${stated(s.publishedAt)}</td>` +
      `<td>Tier ${esc(s.sourceAuthority)}</td>` +
      `<td>${esc(s.seoScore)}</td>` +
      `<td>${esc(s.commercialScore)}</td>` +
      `<td>${esc(s.recommendedAction)}${s.published ? " <small>(veröffentlicht)</small>" : ""}</td>` +
    `</tr>`).join("")
  : `<tr><td colspan="10" class="muted">Keine Kandidaten. Ohne konfigurierten Search-Provider wird nicht gescannt und nichts erfunden.</td></tr>`;

/* --- section 64, the business-opportunities screen ------------------------- */

const opportunityRows = store.opportunities.length
  ? store.opportunities.map((o) => `<tr>` +
      `<td>${esc(o.organization)}</td><td>${esc(o.country)}</td><td>${stated(o.city)}</td>` +
      `<td>${esc(o.opportunityType)}</td><td>${stated(o.project)}</td><td>${stated(o.units)}</td>` +
      `<td>${esc(o.status)}</td>` +
      `<td><a href="${esc(o.sourceUrl)}" rel="nofollow noopener" target="_blank">Quelle</a></td>` +
      `<td>${esc(o.score)}</td><td>${esc(o.lastCheckedAt)}</td></tr>`).join("")
  : `<tr><td colspan="10" class="muted">Keine erfassten Geschäftsgelegenheiten.</td></tr>`;

/* --- sections 37 and 38, Search Console ------------------------------------ */

/* The queries themselves are only rendered when the config says so. This page is
   unlisted, not secret, and the list of what a site ranks for and nearly ranks
   for is exactly what a competitor would like. Counts are safe; the list is a
   decision, and its default is no. */
const gscOpps = store.gscOpportunities ?? [];
const showQueries = config?.gsc?.render_on_dashboard === true;
const KIND_LABEL = {
  HIGH_IMPRESSION_LOW_CTR: ["Viele Impressionen, kaum Klicks", "Titel und Description sind der Test — die Seite rankt bereits."],
  NEAR_PAGE_ONE: ["Knapp vor Seite eins (Position 8–20)", "Die vorhandene Seite stärken, keine zweite anlegen."],
  MISSING_CONTENT: ["Impressionen ohne passende Seite", "Eine neue Seite ist einen Gedanken wert."],
  RANKS_TOO_LOW: ["Seite vorhanden, aber zu weit hinten", "Stärken und von rankenden Seiten verlinken — keine zweite Seite."],
  COUNTRY_GROWTH: ["Wachsender Markt", "Der Cluster für diesen Markt wirkt; ihn stärken."],
};
const gscCounts = {};
for (const o of gscOpps) gscCounts[o.kind] = (gscCounts[o.kind] ?? 0) + 1;

const gscSection = `<section class="section"><div class="container">` +
  `<h2>Search Console</h2>` +
  (gscOpps.length
    ? `<p>${esc(lastRun?.gsc ?? "")} — vier Kategorien nach Abschnitt 38.</p>` +
      `<div class="compare"><table><thead><tr><th>Kategorie</th><th>Anzahl</th><th>Was daraus folgt</th>` +
      (showQueries ? `<th>Suchanfrage</th><th>Klicks</th><th>Impressionen</th><th>Position</th>` : "") +
      `</tr></thead><tbody>` +
      Object.keys(KIND_LABEL).filter((k) => gscCounts[k]).map((k) => {
        const [label, follows] = KIND_LABEL[k];
        const rows = gscOpps.filter((o) => o.kind === k);
        if (!showQueries) {
          return `<tr><td>${esc(label)}</td><td>${gscCounts[k]}</td><td>${esc(follows)}</td></tr>`;
        }
        return rows.map((o, i) =>
          `<tr>` +
          (i === 0 ? `<td rowspan="${rows.length}">${esc(label)}</td><td rowspan="${rows.length}">${gscCounts[k]}</td><td rowspan="${rows.length}">${esc(follows)}</td>` : "") +
          `<td>${esc(o.subject)}</td><td>${esc(o.clicks)}</td><td>${esc(o.impressions)}</td>` +
          `<td>${o.position === null ? stated(null) : esc(o.position)}</td></tr>`).join("");
      }).join("") +
      `</tbody></table></div>` +
      (showQueries ? "" : `<p class="legal-note">Die Suchanfragen selbst stehen nicht auf dieser Seite. Sie stehen in <code>build-report-market-intelligence.txt</code>. Diese Seite ist unverlinkt, aber nicht geheim.</p>`)
    : `<p class="muted">${esc(lastRun?.gsc ?? "not connected")}. Ein Export aus der Search Console gehört nach <code>data/gsc/</code> — siehe die README dort.</p>`) +
  `</div></section>`;

/* --- errors --------------------------------------------------------------- */

const errorList = lastRun?.errors?.length
  ? `<ul>${lastRun.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>`
  : `<p class="muted">Keine Fehler im letzten Lauf.</p>`;

const counters = lastRun ? [
  ["Queries geplant", lastRun.queriesPlanned], ["Quellen besucht", lastRun.sourcesChecked],
  ["Quellen akzeptiert", lastRun.sourcesAccepted], ["Quellen verworfen", lastRun.sourcesRejected],
  ["Projekte gefunden", lastRun.projectsDiscovered], ["Projekte aktualisiert", lastRun.existingProjectsUpdated],
  ["Hand geprüfte Kandidaten", lastRun.verifiedInboxCandidates], ["Ausschreibungen", lastRun.tenderOpportunities],
  ["Geschäftskontakte", lastRun.businessLeads], ["Inhalte erzeugt", lastRun.contentGenerated],
  ["Inhalte aktualisiert", lastRun.contentUpdated],
] : [];

const main = `<main id="main"><header class="page-hero"><div class="container">` +
  `<div class="breadcrumbs"><a href="../index.html">Startseite</a> · MODUNERA Intelligence</div>` +
  `<div class="eyebrow" style="color:var(--sand)">Intern · nicht indexiert</div>` +
  `<h1>Was sich in den fünf Zielmärkten bewegt.</h1>` +
  `<p>Erzeugt aus <code>data/market-signals.json</code> von <code>tools/market-intelligence.mjs</code>. Diese Seite ist unverlinkt und auf noindex, aber sie ist nicht geheim: sie zeigt nur, was auf den genannten amtlichen Quellen ohnehin öffentlich steht.</p>` +
  `</div></header>` +

  `<section class="section"><div class="container">` +
  `<h2>Dashboard</h2><div class="stat-grid">${tileCards}</div>` +
  `</div></section>` +

  `<section class="section section-soft"><div class="container">` +
  `<h2>News-Kandidaten</h2>` +
  `<p>Jede Zeile wurde auf der genannten Quelle gelesen. Eine Angabe, die dort nicht steht, steht auch hier nicht.</p>` +
  `<div class="compare"><table><thead><tr>` +
  `<th>Titel</th><th>Land</th><th>Kommune</th><th>Quelle</th><th>Status</th><th>Datum der Quelle</th>` +
  `<th>Autorität</th><th>SEO-Score</th><th>Commercial-Score</th><th>Empfohlene Handlung</th>` +
  `</tr></thead><tbody>${candidateRows}</tbody></table></div>` +
  `</div></section>` +

  `<section class="section"><div class="container">` +
  `<h2>Geschäftsgelegenheiten</h2>` +
  `<p>Nur öffentliche Geschäftskontakte. Direktdurchwahl und E-Mail einzelner Mitarbeitender werden nicht übernommen; sie stehen auf der verlinkten Quellseite.</p>` +
  `<div class="compare"><table><thead><tr>` +
  `<th>Organisation</th><th>Land</th><th>Ort</th><th>Art</th><th>Projekt</th><th>Einheiten</th>` +
  `<th>Status</th><th>Kontakt</th><th>Score</th><th>Zuletzt geprüft</th>` +
  `</tr></thead><tbody>${opportunityRows}</tbody></table></div>` +
  `</div></section>` +

  gscSection +

  `<section class="section section-soft"><div class="container">` +
  `<h2>Letzter Lauf</h2>` +
  (lastRun
    ? `<p><strong>${esc(lastRun.decision)}</strong> — ${esc(lastRun.decisionWhy)}</p>` +
      `<div class="compare"><table><tbody>${counters.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>` +
      `<h3>Fehler</h3>${errorList}`
    : `<p class="muted">Noch kein Lauf aufgezeichnet.</p>`) +
  `<h3>Prüfung fällig</h3>` +
  (dueForReview.length
    ? `<ul>${dueForReview.map((i) => `<li>${esc(i.id)} — fällig seit ${esc(i.nextReviewAt)}</li>`).join("")}</ul>`
    : `<p class="muted">Nichts fällig.</p>`) +
  `<h3>Hand geprüfte Kandidaten in der Warteschlange</h3>` +
  `<p class="muted">${esc(inbox.candidates.length)} Eintrag/Einträge in <code>data/verified-signals-inbox.json</code>.</p>` +
  `</div></section></main>`;

/* --- assemble from the donor shell ---------------------------------------- */

const donor = await readFile(DONOR, "utf8");
let html = donor;
html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>MODUNERA Intelligence</title>");
html = html.replace(/<meta name="description" content="[^"]*">/,
  '<meta name="description" content="Interne Übersicht der Marktsignale aus den fünf Zielmärkten.">');
html = html.replace(/<link rel="canonical" href="[^"]*">/,
  '<link rel="canonical" href="https://modunera.com/intelligence/">');
html = html.replace(/<main id="main">[\s\S]*?<\/main>/, () => main);
/* The donor carries its own page scripts at the foot. This page has none. */
html = html.replace(/<script>document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/, "");

if (!/MODUNERA Intelligence/.test(html)) throw new Error("shell assembly failed: main was not replaced");

await mkdir(dirname(OUT), { recursive: true });
const before = existsSync(OUT) ? await readFile(OUT, "utf8") : null;
if (before !== html) await writeFile(OUT, html, "utf8");

console.log(`intelligence dashboard: ${store.signals.length} signal(s), ${store.opportunities.length} opportunity(ies), ${news.items.length} published article(s)${before === html ? " — unchanged" : ""}`);
