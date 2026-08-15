# Fonts

The site declares `--display: "Poppins","Manrope"` for headings and sets `body`
in Manrope. These are those faces, so the feed and the website are set in the
same type rather than in something that resembles it.

## Why they are committed

Pillow reads TTF and OTF. Google Fonts and Fontsource both ship **woff2**, which
it cannot open. And a render should not depend on a network fetch — the artwork
has to come out the same on any machine, including one with no outbound access.

## Where they came from

```bash
npm pack @fontsource/poppins @fontsource/manrope
tar xzf fontsource-*.tgz
# then, per face, strip the woff2 wrapper:
python3 -c "
from fontTools.ttLib import TTFont
f = TTFont('package/files/poppins-latin-700-normal.woff2')
f.flavor = None
f.save('Poppins-Bold.ttf')"
```

`fonttools` and `brotli` are needed for that conversion only. Neither is a
dependency of this project — the fonts are the artifact, the tools were scaffolding.

The Latin subset is used. These posts are set in English, German, Dutch, Danish
and French, all of which the Latin subset covers, and the full face is four times
the size for glyphs no post will use.

## Licence

Both are under the SIL Open Font License 1.1, which permits embedding and
redistribution. `OFL.txt` in each Fontsource package carries the full text.

## If a face is replaced

Change `F_TITLE` / `F_BODY` at the top of `build_instagram_grid.py`. Everything
else is metric-driven and will follow.
