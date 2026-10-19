# 14 — Deployment and rollback (M0)

Date: 2026-10-19. Sources: `netlify.toml`, `README-build.md` (build order,
Netlify Forms section), `.github/workflows/*.yml`, `docs/handoff.md` §8.
Nothing goes to production without the owner.

## 1. How the site deploys today

| Step | Mechanism | Evidence |
|---|---|---|
| Hosting | Netlify publishes the repository root (`publish = "."`); no build command, no framework; the committed HTML is the site | `netlify.toml` |
| Production branch | `main` (the three workflows check out and push `main`; Netlify's production-branch setting itself is a project setting outside the repo — evidence required: confirm in app.netlify.com) | workflows |
| Redirects / headers | `netlify.toml` (8 model 301s, security and cache headers) and the generated `_redirects` (494 lines) | files |
| Forms | Netlify Forms, project setting (Forms → enabled since 2026-10-18); detection at deploy time; a deploy whose commit changes no file is skipped by Netlify's default ignore rule; one field list per form name | README "Netlify Forms" |
| Notifications | Forms → Form notifications → Email → emre@modunera.com (MX/SPF/DKIM on Netlify DNS since 2026-10-18) | README |
| Analytics ids | `assets/js/integration-config.json` is empty in git; ids are meant to be written on the server at deploy, never committed | `docs/conversion-events.md` |

### Workflows that touch `main`

| Workflow | Schedule | Writes to `main`? |
|---|---|---|
| `build-modunera.yml` "Build and validate" | push to `main`, `codex/**`, `claude/**`; every pull request; manual | No. Runs the 24 steps, both gates, the audit, then checks committed HTML == fresh build and that a second pass is idempotent. Uploads reports. **`feat/**` is not in the push filter: this branch is only validated through a PR.** |
| `daily-post.yml` | 05:12 UTC daily | Yes — commits "Publish the daily practice post" when `data/blog-daily-*.json` has a post due; both gates must pass first; then IndexNow ping. |
| `market-intelligence.yml` | 04:35 UTC daily | Yes — commits "Daily European market scan" when anything changed (normally nothing without a provider key); `git pull --rebase origin main` with four retries; both gates first; IndexNow ping. |

Consequences: `main` can receive a bot commit every morning; the generated HTML
footprint of any pipeline run is site-wide (navigation and footer on ~15,000
pages), so a feature branch that is not kept current will conflict broadly and
fail the "committed HTML matches a fresh build" gate on merge.

## 2. Branch strategy for the redesign

1. All work on `feat/modunera-global-b2b-redesign`. No direct push to `main`.
2. Before every pipeline run on the branch, bring `main` in (merge or rebase) so
   the daily bot commits are included; then run the full documented order and
   both validators; commit generated output together with the source change.
3. Open a **pull request** to `main`. That triggers `build-modunera.yml`
   (pipeline + gates + build-equality + idempotency). A red check blocks review.
4. Netlify **deploy preview** on the PR (project setting "Deploy Previews" —
   evidence required: confirm it is enabled for this project). The preview is
   the owner's review surface; Forms submissions from a preview are tagged by
   Netlify as preview submissions.
5. **Owner sign-off** in writing on the PR (content, legal pages, claims).
6. Squash- or merge-commit to `main` → Netlify production deploy. Push a real
   file change if Forms markup changed, so detection re-runs.
7. After merge: watch Search Console and `data/gsc/` exports for `/en/*` and the
   approved location routes; re-run `tools/redesign-url-inventory.mjs` and
   commit `docs/redesign/02-url-inventory.csv`.

Scope rules for the PR: no change to `data/location-index-policy.json` status
fields; no new route family without governance classification and hreflang
registration; no hand-edited HTML; legal pages remain `noindex` until RBI §1.

## 3. Rollback

Three independent paths, from cheapest to most complete.

| Path | How | When |
|---|---|---|
| **Netlify "Publish deploy"** | app.netlify.com → modunera → Deploys → pick the last good production deploy → "Publish deploy". Instant, content-only; git is unchanged. Re-enable auto-publish afterwards. | First response to any production defect; buys time without touching history. |
| **Git revert of the merge commit** | `git revert -m 1 <merge-sha>` on `main`, run the full pipeline and both validators, commit, push. Netlify redeploys from `main`. | When `main` must be correct again for the daily workflows (otherwise the next 05:12 bot commit rebuilds and republishes the reverted state). |
| **Tag `pre-b2b-redesign-2026-10-19`** | The tag marks `main` immediately before the redesign merge. To restore: `git checkout -b hotfix/restore pre-b2b-redesign-2026-10-19`, PR to `main` (or `git revert` the range). Evidence required: confirm the tag exists on the remote before the merge; create it on the merge-base commit if it does not. | Full restore if several commits landed after the merge. |

Rollback checklist: Netlify Forms still enabled and field list intact; redirects
in `netlify.toml`/`_redirects` not reverted below what Google has indexed (never
drop a 301 that a previous release introduced); `sitemap.xml` regenerated by the
governance step; IndexNow ping optional.

## 4. The generator rule

Any new generator, or any change to the order, is made **in the same commit** in
all four places, or the idempotency gate fails for the wrong reason (this has
happened twice, documented at the top of `build-modunera.yml`):

1. `README-build.md` "Run order" — the documented truth, with the reason it sits
   where it sits.
2. `.github/workflows/build-modunera.yml` — both step lists (build pass and
   idempotency pass).
3. `.github/workflows/daily-post.yml` — the pipeline step list.
4. `.github/workflows/market-intelligence.yml` — the pipeline step list.

Placement rules the README states: content generators before `build-modunera-v2`
(it replaces every `<nav class="nav">`); nothing content-producing after the
V7 steps (`build-hreflang-v7`, `build-content-lastmod`, `build-seo-governance-v7`)
because they read finished HTML; `build-shell-v3` always last. A B2B generator
therefore slots between `build-modunera-locales` and `build-modunera-v2`, emits
an empty `<nav class="nav">` for v2 to fill, and registers its hub paths for the
menu and its slug tables for hreflang. Note the current order already places
`build-privacy`, `build-budget-bands`, `build-location-enquiry`,
`build-about-topic` and `build-de-source-block` after governance; the committed
`/en/legal/privacy/` carries `index,follow` although governance lists it as
incomplete (see `01-existing-site-audit.md` §8) — resolve before adding more
steps after the V7 block.

## 5. Netlify settings to record (outside git)

Production branch; deploy previews on/off; Forms enabled and notification
address; DNS records (MX/SPF/DKIM); environment for `integration-config.json`;
custom domain and HTTPS. None of these is in the repository, so a rollback of
git does not roll them back — evidence required: a dated screenshot or export
of each before the redesign merge.
