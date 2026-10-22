# Release checklist — procurement layer

## Before merge

- [x] Full pipeline in README order; `validate-modunera.mjs` and `validate-seo-v7.mjs` exit 0
- [x] Second run changes nothing except the report timestamp (idempotent)
- [x] New pages are `index,follow`, in the sitemap, with a canonical, a single H1 and a breadcrumb
- [x] hreflang: `afrika/` ↔ `en/africa/` ↔ `fr/afrique/`
- [x] No horizontal scroll at 375 px on the home, family, industry, Africa EN/FR, capability and proposal pages
- [x] Quick enquiry: on a failed POST, the error shows and no confirmation appears. On a 2xx, the confirmation shows the reference. UTM, landing page and family reach the POST body
- [x] `?family=MOD-WC` preselects the solution on the full brief
- [x] Blocked-claim hits: 0
- [ ] Owner reviews the EN and FR copy on the Netlify preview
- [ ] Owner says "yayınla"

## After deploy (owner)

- [ ] Netlify → Forms: confirm `quick-enquiry` appears, and add an e-mail notification to emre@modunera.com. Do the same for `project-proposal` if it is not already set
- [ ] Send one real test enquiry from each form and check that it arrives
- [ ] Search Console: resubmit `sitemap.xml`; inspect `/en/solutions/workforce-camps/` and `/fr/afrique/`
- [ ] If analytics is wanted: add the GA4/GTM ID to `assets/js/integration-config.json` (consent-gated). The events are listed in `docs/modunera-implementation-plan.md`

## Rollback

Revert the merge commit on `main`. Netlify redeploys the previous state. There are no URL removals, so no redirects are needed.
