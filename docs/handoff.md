# MODUNERA — handoff

Date: 2026-08-16
Branch: `codex/modunera-full-system` (not pushed; see §8)

Read this first, then `README-build.md`. Everything else is reference.

---

## 1. What this is

A 15,164-page static site for a Turkish tiny-house manufacturer selling into
Germany, the Netherlands, Denmark, Luxembourg and Switzerland. No framework, no
package manager, no build step at deploy time — `netlify.toml` publishes the
repository root, and the committed HTML is what ships.

The HTML is produced by fifteen Node generators in `tools/`, run in a fixed order
documented in `README-build.md`. Every one is idempotent: a second full run
changes nothing. If a run produces a diff you did not expect, that is a bug in a
generator, not noise.

Five languages: German at the root, English at `/en/`, then `/nl/`, `/da/`,
`/fr/`. Slugs are the ones each market actually uses, not translations of the
English ones; they live in `data/locales.json`.

## 2. The five rules this project runs on

Break any of these and the work stops being defensible.

1. **Nothing about the company, its products or the law is invented.** If a figure
   is not evidenced, it does not go on the site. Missing evidence goes in
   `REQUIRED-BUSINESS-INPUTS.md`, which is the register of what the business owes
   the website.
2. **Blocked claims are enforced, not remembered.** `data/blocked-claims.json`
   holds every phrase that may not be published yet.
   `build-modunera-depth.mjs --extend` strips them from the built HTML and
   `validate-seo-v7.mjs` fails the build if any survive.
3. **Content belongs in a generator or a data file, never in a hand-edited page.**
   Where no generator owned a page, one was written — see
   `tools/build-quality-spec.mjs`.
4. **Measure the rendered page, not the source.** This has caught something every
   single time it has been applied. The stylesheet and the browser disagree; the
   audit and the network tab disagree; the sentence count and the mail-merge
   disagree.
5. **The original photographs are never deleted, moved, renamed or altered.**
   Work on copies.

## 3. Where things are

| | |
|---|---|
| Build order and ordering traps | `README-build.md` |
| What the business still owes | `REQUIRED-BUSINESS-INPUTS.md` |
| Technical audit | `docs/project-audit.md` |
| SEO / GEO / AI answerability | `docs/seo-geo-ai-report.md` |
| Legal content and its sources | `docs/legal-content-sources.md` |
| Competitors in Poland and Romania | `docs/competitor-analysis-poland-romania.md` |
| Conversion events | `docs/conversion-events.md` |
| Prices, one source of truth | `data/pricing.json` |
| Claim register | `data/blocked-claims.json` |
| Location indexing gate | `data/location-index-policy.json` |
| Social artwork and copy | `social/instagram/` |
| Social generators | `tools/social/` |

## 4. Traps that have already caught someone

Each of these cost real time. They are listed so they cost it once.

- **Running one generator alone re-opens the sitemap.** The four V7 steps run
  after the content pipeline and read finished HTML. Running any content
  generator afterwards silently undoes them: `build-modunera-europe.mjs` on its
  own rebuilt the sitemap with all 15,160 URLs and dropped the location gate.
  Every command still succeeded. **Run the whole documented order, every time.**
- **The claim register matches literal strings.** A phrase walks past it by being
  capitalised differently or URL-encoded. Two capitalised glazing claims survived
  for weeks, and 7,406 pages carried the previous brand name inside encoded
  WhatsApp links while the literal rule reported zero. **When adding a rule, add
  its capitalised, sentence-initial and percent-encoded forms.**
- **`grep` over HTML does not prove there is nothing external.** The Google Fonts
  import lived in CSS and the audit had claimed zero external references for
  weeks. Load a page and watch the network.
- **A mail-merged sentence is textually unique and originally nothing.** Any
  measure of page uniqueness has to blank the place name first, or it rewards the
  template it is meant to detect. This turned 7,129 passing pages into 491.
- **`/standorte/` is the German-*language* tree, not the German-*market* tree.**
  It contains Dutch, Danish, Luxembourgish and Swiss pages too. Grepping for the
  German source URL across it gives the wrong answer.
- **Pillow discards the alpha in `fill=(r,g,b,a)` on an RGB canvas.** A 35% rule
  paints solid. Flatten first (`over()` in `tools/social/build_instagram_grid.py`).

## 5. What was done in this stretch

- `/qualitaet/`: twelve component cards had one identical sentence; they now have
  twelve, behind `data/quality-spec.json` and a generator that owns the page.
- Service pages: four near-identical 770-word pages became four real ~1,200-word
  pages, each with its own feasibility section and FAQ set. The hub now shows all
  five capabilities, with tiny houses pointing at the existing tree rather than a
  duplicate page.
- Fonts self-hosted; the Google Fonts import removed from every page.
- Conversion events added, consent-gated, with no identifier in the repository.
- 7,406 WhatsApp links stopped greeting the company by its old name.
- `tools/score-location-pages.mjs`: the location gate has an instrument.
- Four documents written, two existing ones corrected.

## 6. What is open, in priority order

1. **Publish the legal entity.** `REQUIRED-BUSINESS-INPUTS.md` §1. It unblocks
   the Impressum, the e-mail address, `LocalBusiness` schema and the biggest trust
   gap against EU competitors. Everything else on this list is smaller.
2. **Customs classification.** §6 of the same file. Whether the Customs Union's
   steel exclusion catches a building on a steel frame changes the landed cost in
   both directions. One broker consultation.
3. **The 7,478 German-market location pages with no source.**
   `docs/legal-content-sources.md` §4.1.
4. **Sitemap/robots cross-assertion** in `validate-seo-v7.mjs`.
   `docs/seo-geo-ai-report.md` §3.4.
5. **203 over-long titles** on indexable pages. In the generators.
6. **Production dates**, so a schedule shape can be published. Every competitor
   publishes a lead time; MODUNERA publishes none.
7. **Italian branch for Switzerland.** Unbuilt extension point, not a fault.

Closed 2026-08-18: *the Drive photographs*. Thirteen photographs from the owner's
Drive folder are ingested, graded and placed: /factory/ gains two production
frames, /projects/ six finished units, /modelle/ five interiors, and two join the
hero rotation. Sources kept in `social/instagram/16-drive-2026-08/`.

**Five files in that folder are CGI renders** — four aerial resort visualisations
and one 3D floor-plan cutaway — and one is a photograph of a supermarket shelf.
None of them is on the site. `tools/build-photo-placement.mjs` exists because
/factory/ and /projects/ were once illustrated with renders; putting a
forty-unit resort visualisation on a projects page would claim MODUNERA has
delivered one. If those renders are MODUNERA's own designs they can be published
as designs, labelled as such, on a page that says so — an owner decision, not an
image swap. See the README in the source folder.

Closed 2026-08-17: *tone*. Filler constructions were counted across the indexed
pages rather than hunted through 15,000: `tools/score-prose-style.mjs`. Total
filler 283 -> 36 (-87%), German 259 -> 20 (-92%); "professionell", "projektbezogen",
"Entscheidungslogik" and "hochwertige Materialien" now count zero across all
15,169 pages. Hedges went 1,051 -> 1,054 — not one legal sentence was softened.

Closed 2026-08-17: *the five-market appendix appears where it is off-topic*. It
was on 221 pages and is now on 96, scoped by subject in `data/appendix-scope.json`.
Mean originality across the 514 indexed pages went from 42.2% to 49.5%, median from
34% to 42.9%. See `docs/seo-geo-ai-report.md` §3.35 and
`tools/score-indexed-originality.mjs`, which is the instrument that measured it.

Not started, and deliberately: Meta automation (Phase 11). The standing
instruction is that automatic Instagram publishing stays off.

## 7. Social

`social/instagram/` holds the finished artwork and copy: nine launch posts with
captions and locations, nine highlight covers in two sets (`varied/` is the one to
use), a Facebook cover and bio, and a Pinterest cover, bio and pin texts. All
generated by `tools/social/*.py` from the repository's own photographs, with
contrast and glyph coverage measured rather than eyeballed.

The TEMA Vakfı tree-donation claim is held out of everything until three things
arrive; see the end of `REQUIRED-BUSINESS-INPUTS.md`.

## 8. Git

Everything is committed to `codex/modunera-full-system`. **Nothing has been
pushed**, and nothing has been deployed, on standing instruction from the owner.
The branch is the deliverable; pushing it is the owner's decision.

## 9. If you change one thing, change this

The site is honest, technically sound and unusually well structured for its size.
What it is missing is not on this list — it is the company's own registration
details. A German buyer comparing a Turkish supplier against a Polish one reads
the Impressum, finds it incomplete, and stops. Every hour spent on content is
worth less than the hour that fixes that.
