# 08 — i18n and localisation plan

## Today
German root, English `/en/`, Dutch `/nl/`, Danish `/da/`, French `/fr/`
sections exist; hreflang clusters are built by `tools/build-hreflang-v7.mjs`
only for pages with real equivalents; `x-default` is German.

## The B2B layer
English and German since 2026-10-19 (slice 2): `data/b2b.json` and its
German twin `data/b2b-de.json`, same structure, one set of page functions.
DE/EN pairs are clustered by `tools/build-hreflang-v7.mjs`. The German home is
unchanged; German readers reach the B2B layer through the new "Lösungen" menu. `data/b2b.json` is keyed so that a second
language is added as a sibling object (the pattern `data/commercial.json`
already uses for de/en). No machine translation; no language goes live until
menu, home, the three solution pages, the proposal form, privacy summary and
contact exist in it at editorial quality (brief §7.3).

## Order (brief §7.1), with the gate for each
1. English — built.
2. German — B2B layer built; German home deliberately unchanged. Originally: the B2B hub pages need German twins before the German home
   changes; translation by a native editor; hreflang pairs added in the
   generator, not by hand.
3. French, Dutch — after German; the market sections exist, the B2B pages do not.
4. Turkish — **not planned** (owner decision, 2026-10-19). No `/tr/` section will be built.
5. Phase 2/3 languages — only with a translation workflow (memory, glossary,
   review) in place; Arabic needs an RTL pass over nav, forms and numerals first.

## Technical rules kept
BCP 47 codes limited to the validator's set (`de-DE`, `en`, `nl-NL`, `da-DK`,
`fr`, `x-default`) until a new code is added to `tools/validate-seo-v7.mjs`
and the hreflang generator in the same commit; no IP redirects; prices dated
and scoped, never auto-converted.
