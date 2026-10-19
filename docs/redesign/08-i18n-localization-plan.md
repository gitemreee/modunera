# 08 — i18n and localisation plan

## Today
German root, English `/en/`, Dutch `/nl/`, Danish `/da/`, French `/fr/`
sections exist; hreflang clusters are built by `tools/build-hreflang-v7.mjs`
only for pages with real equivalents; `x-default` is German.

## The B2B layer
English only in this phase. `data/b2b.json` is keyed so that a second
language is added as a sibling object (the pattern `data/commercial.json`
already uses for de/en). No machine translation; no language goes live until
menu, home, the three solution pages, the proposal form, privacy summary and
contact exist in it at editorial quality (brief §7.3).

## Order (brief §7.1), with the gate for each
1. English — live in this branch.
2. German — next: the B2B hub pages need German twins before the German home
   changes; translation by a native editor; hreflang pairs added in the
   generator, not by hand.
3. French, Dutch — after German; the market sections exist, the B2B pages do not.
4. Turkish — company origin; no section exists yet; a new locale in
   `data/locales.json` plus the locales generator.
5. Phase 2/3 languages — only with a translation workflow (memory, glossary,
   review) in place; Arabic needs an RTL pass over nav, forms and numerals first.

## Technical rules kept
BCP 47 codes limited to the validator's set (`de-DE`, `en`, `nl-NL`, `da-DK`,
`fr`, `x-default`) until a new code is added to `tools/validate-seo-v7.mjs`
and the hreflang generator in the same commit; no IP redirects; prices dated
and scoped, never auto-converted.
