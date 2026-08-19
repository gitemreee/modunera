# Search Console exports go here

There is no live Search Console connection and there cannot be one from this
repository: an OAuth token or a service-account key committed here is a
credential handed to whoever reads the repository. So the engine reads an export
instead. It costs nothing and needs no key.

## How to produce one

In Search Console → **Performance** → set the date range (7, 28 or 90 days, per
section 37) → the **Export** button at the top right → *Download CSV*. Unzip it
and drop the CSV files into this folder. `Queries.csv`, `Pages.csv` and
`Countries.csv` are the ones that carry anything the engine can act on.

Headings come out in the interface language of whoever downloaded the file. Both
English and Turkish are recognised — `Tıklamalar` and `Clicks`, `Ortalama konum`
and `Average position`, and the comma decimal separator (`9,4`) as well as the
point (`9.4`). A heading that is neither is reported by name in the daily run
rather than being silently misread as another column.

The API shape works too: `data/gsc-export.json` with `{"rows":[…]}`.

## What it produces

Section 38's four buckets:

| Bucket | What it means | What to do |
|---|---|---|
| `HIGH_IMPRESSION_LOW_CTR` | The page already ranks and nobody clicks it | Rewrite the title and description |
| `NEAR_PAGE_ONE` | Position 8–20 | Strengthen the page that ranks — do not create a second one |
| `MISSING_CONTENT` | Impressions exist, no page answers the query | A new page is worth considering |
| `COUNTRY_GROWTH` | Clicks from a market rose against the last export | That cluster is working; strengthen it |

`COUNTRY_GROWTH` needs two exports. On the first one it is simply absent, because
"rising" is a comparison and one file has nothing to compare with. It is not
faked out of a single number.

## Before you drop a file in

Whatever is in this folder is in the repository, and the derived opportunities go
into `data/market-signals.json`. If this repository is public, so are they — and
a list of the queries you rank for and nearly rank for is exactly what a
competitor would like to have. The `/intelligence/` page shows only the counts
per bucket unless `gsc.render_on_dashboard` is set to `true` in
`data/market-scan-config.json`, because that page is unlisted rather than secret.

That is a decision about your own data, not a technical setting. If the answer is
no, keep the exports out of here and read the buckets by running the engine
locally: `MODUNERA_MI_GSC_DIR=/some/local/folder node tools/market-intelligence.mjs`.
