#!/usr/bin/env python3
"""Meta ad creatives for the 9 m offer at 44,900 EUR — terracotta / anthracite design.

Three variants (one real photograph, one message each), four placements:
  1x1    1080x1080  feed
  4x5    1080x1350  feed, tall
  9x16   1080x1920  stories / reels (top 250 px and bottom 340 px kept free of type)
  191x1  1200x628   Facebook link / right column

The photographs are MODUNERA's own, from social/instagram/. The phone's
watermark strip at the bottom of each original is cropped away here. The price
and the "9 Meter" are the owner's figures for this campaign; the site's
data/pricing.json is not changed by this script.

Writes social/meta-ads/9m-44900/<variant>/<placement>.jpg and manifest.json.
Needs Python with Pillow and Playwright (Chromium at /opt/pw-browsers/chromium).

Usage: python3 tools/social/build_meta_ads_9m.py
"""
import asyncio, json, tempfile
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
IG = ROOT / "social/instagram"
OUT = ROOT / "social/meta-ads/9m-44900"
FONTS = Path(__file__).resolve().parent / "fonts"
LOGO = ROOT / "assets/brand/modunera-master-logo-mountain-v1-white-600.png"

PRICE = "44.900 €"
# crop = fraction of the original kept (left, top, right, bottom); pos = CSS object-position per placement family
VARIANTS = {
    "a-natur": dict(photo=IG / "00-candidates/IMG_20250519_183120.jpg", crop=(0, 0, 1, 0.86),
                    head=["Dein Zuhause", "in der Natur."], pos="50% 62%", pos_tall="42% 60%"),
    "b-abend": dict(photo=IG / "01-selected/IMG_20250913_193621.jpg", crop=(0, 0.22, 1, 0.80),
                    head=["Ankommen.", "Abschalten."], pos="50% 45%", pos_tall="50% 40%"),
    "c-innen": dict(photo=IG / "01-selected/20240227_113020.jpg", crop=(0, 0, 0.92, 1),
                    head=["Einziehen.", "Fertig."], pos="30% 50%", pos_tall="28% 50%"),
}
PLACEMENTS = {"1x1": (1080, 1080), "4x5": (1080, 1350), "9x16": (1080, 1920), "191x1": (1200, 628)}

CSS = """
@font-face{font-family:BSC;src:url(%(f)s/BarlowSemiCondensed-800-latin.woff2);font-weight:800}
@font-face{font-family:BSC;src:url(%(f)s/BarlowSemiCondensed-700-latin.woff2);font-weight:700}
@font-face{font-family:BSC;src:url(%(f)s/BarlowSemiCondensed-600-latin.woff2);font-weight:600}
@font-face{font-family:B;src:url(%(f)s/Barlow-500-latin.woff2);font-weight:500}
@font-face{font-family:B;src:url(%(f)s/Barlow-600-latin.woff2);font-weight:600}
*{box-sizing:border-box;margin:0}body{background:#2E3B41}
.ad{position:relative;overflow:hidden;background:#2E3B41;color:#fff;font-family:B,sans-serif;display:flex;flex-direction:column}
.ph{position:relative;flex:1;min-height:0}.ph img.bg{width:100%%;height:100%%;object-fit:cover;display:block}
.ph:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,28,32,.45) 0,rgba(20,28,32,0) 26%%,rgba(20,28,32,0) 70%%,rgba(46,59,65,.9) 100%%)}
.logo{position:absolute;left:var(--m);top:var(--m);height:var(--lg);z-index:2}
.tag{position:absolute;right:var(--m);top:var(--m);z-index:2;background:#BC3A14;font-family:BSC;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:var(--tg);padding:.45em .9em;border-radius:.3em}
.band{position:relative;padding:var(--bp) var(--m) var(--bb);border-top:var(--bar) solid #BC3A14}
.kick{font-family:BSC;font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:var(--kk);color:#F2B9A3}
h1{font-family:BSC;font-weight:800;font-size:var(--h1);line-height:.98;margin:.12em 0 .22em;letter-spacing:-.005em}
.row{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--m)}
.price{font-family:BSC;font-weight:800;font-size:var(--pr);line-height:.9;color:#fff;white-space:nowrap}
.price small{display:block;font-family:B;font-weight:500;font-size:var(--sm);color:#cfd6d9;letter-spacing:.02em;margin-top:.5em}
.pts{list-style:none;padding:0;font-size:var(--pt);font-weight:500;line-height:1.5;color:#eef1f2}
.pts li{padding-left:1.2em;position:relative}.pts li:before{content:"";position:absolute;left:0;top:.5em;width:.5em;height:.5em;border-radius:50%%;background:#BC3A14}
.cta{display:flex;align-items:center;justify-content:space-between;margin-top:var(--cm);gap:var(--m)}
.btn{background:#BC3A14;font-family:BSC;font-weight:800;font-size:var(--bt);padding:.5em 1.2em;border-radius:.3em;letter-spacing:.03em;white-space:nowrap}
.url{font-family:BSC;font-weight:700;font-size:var(--bt);letter-spacing:.04em}
/* placements */
.p1x1{--m:56px;--lg:54px;--tg:26px;--bp:38px;--bb:44px;--bar:10px;--kk:26px;--h1:86px;--pr:104px;--sm:24px;--pt:29px;--bt:34px;--cm:30px}
.p4x5{--m:56px;--lg:56px;--tg:27px;--bp:44px;--bb:52px;--bar:10px;--kk:28px;--h1:98px;--pr:118px;--sm:25px;--pt:31px;--bt:36px;--cm:36px}
.p9x16{--m:64px;--lg:60px;--tg:28px;--bp:48px;--bb:360px;--bar:10px;--kk:30px;--h1:108px;--pr:128px;--sm:27px;--pt:34px;--bt:38px;--cm:40px}
.p9x16 .logo,.p9x16 .tag{top:270px}
.p9x16 .row{flex-direction:column;align-items:flex-start;gap:34px}
.p191x1{--m:40px;--lg:38px;--tg:19px;--bp:0px;--bb:0px;--bar:0px;--kk:19px;--h1:58px;--pr:74px;--sm:17px;--pt:21px;--bt:24px;--cm:20px;flex-direction:row}
.p191x1 .ph{flex:0 0 56%%}.p191x1 .ph:after{background:linear-gradient(90deg,rgba(20,28,32,.25) 0,rgba(20,28,32,0) 40%%)}
.p191x1 .band{flex:1;border-top:0;border-left:8px solid #BC3A14;padding:34px 36px;display:flex;flex-direction:column;justify-content:center}
.p191x1 .row{flex-direction:column;align-items:flex-start;gap:14px}.p191x1 .tag{right:auto;left:var(--m);top:auto;bottom:var(--m)}
"""

def html(v, key, w, h, img):
    tall = key in ("9x16", "4x5")
    return f"""<!doctype html><html lang="de"><head><meta charset="utf-8"><style>{CSS % {"f": FONTS.as_uri()}}</style></head><body>
<div class="ad p{key}" style="width:{w}px;height:{h}px">
 <div class="ph"><img class="bg" src="{img.as_uri()}" style="object-position:{v['pos_tall'] if tall else v['pos']}">
  <img class="logo" src="{LOGO.as_uri()}"><span class="tag">9 Meter</span></div>
 <div class="band"><p class="kick">Tiny House · bezugsfertig</p><h1>{'<br>'.join(v['head'])}</h1>
  <div class="row"><div class="price">{PRICE}<small>9-Meter-Modell · Preis ab Werk</small></div>
   <ul class="pts"><li>Küche, Bad und Loft</li><li>10 cm Steinwolle, Stahlrahmen</li><li>Lieferung nach Deutschland</li></ul></div>
  <div class="cta"><span class="btn">Jetzt anfragen</span><span class="url">modunera.com</span></div></div>
</div></body></html>"""

async def main():
    from playwright.async_api import async_playwright
    manifest = {"price": PRICE, "variants": {}}
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
            for name, v in VARIANTS.items():
                im = ImageOps.exif_transpose(Image.open(v["photo"])).convert("RGB")
                W, H = im.size; l, t, r, bt = v["crop"]
                im = im.crop((int(W * l), int(H * t), int(W * r), int(H * bt)))
                im.thumbnail((2600, 2600)); src = td / f"{name}.jpg"; im.save(src, quality=92)
                (OUT / name).mkdir(parents=True, exist_ok=True)
                manifest["variants"][name] = {"photo": str(v["photo"].relative_to(ROOT)), "headline": " ".join(v["head"]), "files": {}}
                for key, (w, h) in PLACEMENTS.items():
                    page = td / f"{name}-{key}.html"; page.write_text(html(v, key, w, h, src), encoding="utf-8")
                    pg = await b.new_page(viewport={"width": w, "height": h})
                    await pg.goto(page.as_uri()); await pg.evaluate("document.fonts.ready")
                    png = td / "s.png"; await pg.locator(".ad").screenshot(path=str(png)); await pg.close()
                    out = OUT / name / f"{key}.jpg"; Image.open(png).convert("RGB").save(out, quality=90, optimize=True)
                    manifest["variants"][name]["files"][key] = {"file": str(out.relative_to(ROOT)), "px": f"{w}x{h}"}
            await b.close()
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("ok", sum(len(x["files"]) for x in manifest["variants"].values()), "files")

asyncio.run(main())
