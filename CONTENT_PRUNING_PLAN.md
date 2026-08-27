# CONTENT_PRUNING_PLAN — the guide families

Date: 2026-08-25. 112 indexable `/blog/` folders; 50 topic families hold 2–3
URLs each on ONE intent (a `-leitfaden` and a `-fehler-checkliste`, sometimes a
third). Similarity below is the worst 6-gram Jaccard pair inside the family —
measured, not sampled. Healthy sibling pages sit under 0.20.

## The rule

Per family: the `-leitfaden` becomes the single guide. The checklist's unique
items fold in as a section (they are genuinely good checklists — the format is
the problem, not the content). Every other member 301s to the guide. These
pages are generated (`build-modunera-depth.mjs` ← `data/blog-topics.json`), so
the merge happens in the topic data + generator, and the 301s go through the
consolidations list in `build-nordic-redirects.mjs` — the same mechanism the
studio merge used.

Execution: batches of ~10 families, validators between batches, highest
similarity first. Titles are shortened in the same pass (they are most of the
remaining 531 over-long titles).

## Families, worst first

| Family | Members | Worst pair |
|---|---|---|
| tiny-house-auf-raedern | 3: ~, ~-fehler-checkliste, ~-leitfaden | 0.57 |
| tiny-house-rendite | 2: ~-fehler-checkliste, ~-leitfaden | 0.56 |
| tiny-house-gastronomie | 2: ~-fehler-checkliste, ~-leitfaden | 0.56 |
| tiny-house-vs-wohnwagen | 2: ~-fehler-checkliste, ~-leitfaden | 0.56 |
| tiny-house-ferienpark | 2: ~-fehler-checkliste, ~-leitfaden | 0.55 |
| tiny-house-preise | 3: ~-fehler-checkliste, ~-kosten, ~-leitfaden | 0.55 |
| tiny-house-glamping | 2: ~-fehler-checkliste, ~-leitfaden | 0.55 |
| tiny-house-vs-modulhaus | 2: ~-fehler-checkliste, ~-leitfaden | 0.55 |
| tiny-house-gaestehaus | 2: ~-fehler-checkliste, ~-leitfaden | 0.54 |
| tiny-house-transport | 2: ~-fehler-checkliste, ~-leitfaden | 0.54 |
| tiny-house-import-tuerkei | 2: ~-fehler-checkliste, ~-leitfaden | 0.53 |
| tiny-house-kaufen | 2: ~-fehler-checkliste, ~-leitfaden | 0.52 |
| tiny-house-versicherung | 2: ~-fehler-checkliste, ~-leitfaden | 0.52 |
| tiny-house-stellplatz | 2: ~-fehler-checkliste, ~-leitfaden | 0.52 |
| tiny-house-grundstueck | 2: ~-fehler-checkliste, ~-leitfaden | 0.51 |
| tiny-house-airbnb | 2: ~-fehler-checkliste, ~-leitfaden | 0.51 |
| tiny-house-finanzierung | 2: ~-fehler-checkliste, ~-leitfaden | 0.51 |
| tiny-house-baugenehmigung | 2: ~-fehler-checkliste, ~-leitfaden | 0.50 |
| tiny-house-nachhaltigkeit | 3: ~, ~-fehler-checkliste, ~-leitfaden | 0.36 |
| tiny-house-loft | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-grundriss | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-stauraum | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-akustik | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-homeoffice | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-senioren | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-kueche | 2: ~-fehler-checkliste, ~-leitfaden | 0.33 |
| tiny-house-familie | 2: ~-fehler-checkliste, ~-leitfaden | 0.32 |
| tiny-house-bad | 2: ~-fehler-checkliste, ~-leitfaden | 0.32 |
| tiny-house-modern | 2: ~-fehler-checkliste, ~-leitfaden | 0.31 |
| tiny-house-solar | 2: ~-fehler-checkliste, ~-leitfaden | 0.31 |
| tiny-house-scandinavian | 2: ~-fehler-checkliste, ~-leitfaden | 0.31 |
| tiny-house-wasser | 2: ~-fehler-checkliste, ~-leitfaden | 0.31 |
| tiny-house-chalet | 2: ~-fehler-checkliste, ~-leitfaden | 0.31 |
| tiny-house-smart-home | 2: ~-fehler-checkliste, ~-leitfaden | 0.31 |
| tiny-house-strom | 2: ~-fehler-checkliste, ~-leitfaden | 0.30 |
| tiny-house-off-grid | 2: ~-fehler-checkliste, ~-leitfaden | 0.30 |
| tiny-house-fenster | 2: ~-fehler-checkliste, ~-leitfaden | 0.30 |
| tiny-house-stahlrahmen | 2: ~-fehler-checkliste, ~-leitfaden | 0.30 |
| tiny-house-energieverbrauch | 2: ~-fehler-checkliste, ~-leitfaden | 0.30 |
| tiny-house-heizung | 2: ~-fehler-checkliste, ~-leitfaden | 0.30 |
| tiny-house-sommerhitze | 2: ~-fehler-checkliste, ~-leitfaden | 0.29 |
| tiny-house-winterfest | 2: ~-fehler-checkliste, ~-leitfaden | 0.29 |
| tiny-house-wartung | 2: ~-fehler-checkliste, ~-leitfaden | 0.29 |
| tiny-house-daemmung | 2: ~-fehler-checkliste, ~-leitfaden | 0.29 |
| tiny-house-lueftung | 2: ~-fehler-checkliste, ~-leitfaden | 0.29 |
| tiny-house-brandschutz | 2: ~-fehler-checkliste, ~-leitfaden | 0.29 |
| tiny-house-thermowood | 2: ~-fehler-checkliste, ~-leitfaden | 0.28 |
| tiny-house-reinigung | 2: ~-fehler-checkliste, ~-leitfaden | 0.28 |
| tiny-house-abwasser | 2: ~-fehler-checkliste, ~-leitfaden | 0.27 |
| tiny-house-feuchteschutz | 2: ~-fehler-checkliste, ~-leitfaden | 0.27 |

Total: 50 families, 103 URLs → 50 URLs after merge.
Expected: indexable blog set shrinks ~40%, and `organic traffic per indexed page` — the metric this plan optimises — rises on the survivors.
