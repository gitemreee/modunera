# ADR-001 — Evolve the static generator system; no framework migration

**Status:** accepted 2026-10-19.

**Context.** The brief (§20.1) asks for a comparison between evolving the
current static system and a controlled migration to a static-first framework.
The site is 15,182 generated HTML pages, 24 generators in a documented order,
two validators, Netlify publishing the repo root, three workflows that commit
to `main`, an index gate over 14,500 location pages, reciprocal hreflang
clusters and a claims register — all of it working and all of it verified
today by CI.

**Decision.** Option 1. The B2B layer is a data file (`data/b2b.json`) and
page functions inside the existing generators, styled by the existing design
system. No new build step, no framework, no second template language.

**Reasons.** A migration would have to reproduce the index gate, the hreflang
builder, the claims validator, the sitemap governance and 500 redirects before
it could publish a single page, with nothing a visitor would notice. The
things the brief needs — new routes, a stepped form, a new home — are exactly
what the generators do. Build time is seconds; the whole pipeline runs in
under ten minutes on CI.

**Consequences.** Templates stay as JS template strings, which is the cost of
this choice; the components are small enough that it is tolerable. A second
language is a sibling object in the data file, not a new codebase. If the
page count per language family grows past what one data file can carry,
split the data file first, not the generator.

**Revisit when:** more than three languages need the B2B layer, or an editor
other than a developer must change copy daily.
