# Concept site plan for the Büsum resort: 5,000 m² (assumed 100 m x 50 m), drawn to scale (SVG -> PNG/PDF).
# Footprints of MODUNERA models are real (2.55 m wide); shops, gastro, academy and spa sizes are assumptions.
import pathlib, asyncio
K = pathlib.Path(__file__).parent
S = 12            # px per metre
W, D = 100, 50    # plot width (road side) and depth, metres
PAD = 60
OR, DK, BG, GR, GR2, PATH, SAND = "#BC3A14", "#2E3B41", "#FAF7F2", "#cfdcc0", "#b9cca6", "#e9dfcf", "#efe6d6"

def X(m): return PAD + m * S
def Y(m): return PAD + (D - m) * S       # y = 0 at the road edge (bottom)

out = []
def rect(x, y, w, d, fill, stroke=DK, sw=1.2, rx=2, extra=""):
    out.append(f'<rect x="{X(x):.1f}" y="{Y(y + d):.1f}" width="{w*S:.1f}" height="{d*S:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{extra}/>')
def text(x, y, s, size=12, fill=DK, weight=600, anchor="middle", rot=0):
    tr = f' transform="rotate({rot} {X(x):.1f} {Y(y):.1f})"' if rot else ""
    out.append(f'<text x="{X(x):.1f}" y="{Y(y):.1f}" font-family="Barlow Semi Condensed,Barlow,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{tr}>{s}</text>')
def tree(x, y, r=1.6):
    out.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="{r*S:.1f}" fill="#8fae7f" stroke="#6f8f61" stroke-width="1" opacity=".9"/>')

# plot, road
rect(0, 0, W, D, GR, "#7f9a6f", 2, 0)
out.append(f'<rect x="{X(-6):.1f}" y="{Y(0):.1f}" width="{(W+12)*S:.1f}" height="{7*S:.1f}" fill="#3d464b"/>')
out.append(f'<line x1="{X(-6):.1f}" y1="{Y(-3.5):.1f}" x2="{X(W+6):.1f}" y2="{Y(-3.5):.1f}" stroke="#fff" stroke-width="2" stroke-dasharray="14 12"/>')
text(W / 2, -4.6, "S T R A S S E", 13, "#e8e4da", 600)
# parking left/right of entrance (depth 0-11 m)
for x0 in (2, 58):
    rect(x0, 1, 40, 10, "#d9d4ca", "#a9a398", 1, 1)
    for k in range(9):
        out.append(f'<line x1="{X(x0+2+k*4.4):.1f}" y1="{Y(1):.1f}" x2="{X(x0+2+k*4.4):.1f}" y2="{Y(6):.1f}" stroke="#fff" stroke-width="1.5"/>')
text(22, 8.2, "PARKPLÄTZE · ca. 16", 11, "#5d5a54"); text(78, 8.2, "PARKPLÄTZE · ca. 16", 11, "#5d5a54")
# entrance and main axis
rect(44, 0, 12, 24, PATH, "#cbbfa9", 1, 0)
text(50, 2.2, "EINGANG", 12, OR, 800)
# plaza band
rect(2, 12, 96, 9, SAND, "#d8ccb6", 1, 2)
# front row buildings (y 21.5..)
shops = [(4, "SHOP 1", "Art & Design"), (14, "SHOP 2", "Mode & Lifestyle"), (24, "SHOP 3", "Rezeption")]
for x0, a, b in shops:
    rect(x0, 13, 8, 7, "#ffffff", DK, 1.6)
    text(x0 + 4, 17.3, a, 11, DK, 800); text(x0 + 4, 15.3, b, 8.5, "#6e777b", 500)
text(17, 21.2, "3 SHOPS · Leichtstahl-Modulbau · je ca. 8 × 7 m", 9.5, OR, 700)
rect(38, 13, 24, 9, "#e7e3dc", "#9aa0a3", 1.4, 2, ' stroke-dasharray="6 4"')
text(50, 18, "ART ACADEMY", 12, "#6e777b", 800); text(50, 15.8, "lokaler Partner", 9, "#6e777b", 500)
rect(66, 13, 30, 9, "#ffffff", DK, 1.6)
out.append(f'<line x1="{X(81):.1f}" y1="{Y(16.6):.1f}" x2="{X(81):.1f}" y2="{Y(22):.1f}" stroke="{DK}" stroke-width="1"/>')
text(73.5, 18, "FRÜHSTÜCKSCAFÉ", 10.5, DK, 800); text(88.5, 18, "RESTAURANT · BAR", 10.5, DK, 800)
text(81, 14.6, "GASTRO · Leichtstahl-Modulbau · ca. 30 × 9 m + Terrasse", 8.5, "#6e777b", 500)
rect(66, 22.5, 30, 3.5, "#f3e2d4", "#d9b9a3", 1, 1); text(81, 23.6, "TERRASSE", 8.5, OR, 700)
# spa back left
rect(3, 31, 18, 16, "#ffffff", "#9aa0a3", 1.4, 2, ' stroke-dasharray="6 4"')
rect(6, 35, 10, 6, "#9fd0e0", "#6aa4b8", 1, 2)
text(12, 43.5, "WELLNESS / SPA", 11, "#6e777b", 800); text(12, 33, "Umfang offen", 8.5, "#6e777b", 500)
# paths in housing area
rows = [(28.0, [("MD 7", 8.0)] * 4), (36.0, [("MD 1", 8.0), ("MD 1", 8.0), ("MD 4", 9.0), ("MD 4", 9.0)]), (44.0, [("MD 2", 9.0)] * 4)]
d = f"M{X(50):.1f},{Y(22):.1f} L{X(50):.1f},{Y(26.6):.1f} M{X(36):.1f},{Y(26.6):.1f} L{X(97):.1f},{Y(26.6):.1f} M{X(36):.1f},{Y(26.6):.1f} L{X(36):.1f},{Y(48.5):.1f}"
for y0, _ in rows[1:]:
    d += f" M{X(36):.1f},{Y(y0-1.4):.1f} L{X(97):.1f},{Y(y0-1.4):.1f}"
out.append(f'<path d="{d}" fill="none" stroke="{PATH}" stroke-width="{2.0*S:.0f}" stroke-linecap="round" stroke-linejoin="round"/>')
COL = {"MD 1": "#BC3A14", "MD 2": "#2E3B41", "MD 4": "#6f8f61", "MD 7": "#b0874f"}
for y0, row in rows:
    x = 40.5
    for m, ln in row:
        rect(x, y0 + 2.5, ln, 2.55, COL[m], "#1d2427", 1.2, 1.5)
        rect(x + 0.5, y0, ln - 1, 2.3, "#c99a68", "#9b6c40", 0.8, 1)
        text(x + ln / 2, y0 + 3.35, m, 9.5, "#fff", 800)
        tree(x + ln + 2.25, y0 + 3.6, 1.0)
        x += ln + 4.5
for tx, ty in [(24, 27), (30, 33), (27, 45), (32, 48), (2.5, 27), (8, 28.5)]:
    tree(tx, ty)
# plot dims
out.append(f'<text x="{X(W/2):.1f}" y="{Y(D)-14:.1f}" font-family="Barlow,sans-serif" font-size="12" fill="#5d5a54" text-anchor="middle">100 m</text>')
out.append(f'<text x="{X(W)+18:.1f}" y="{Y(D/2):.1f}" font-family="Barlow,sans-serif" font-size="12" fill="#5d5a54" text-anchor="middle" transform="rotate(90 {X(W)+18:.1f} {Y(D/2):.1f})">50 m · 5.000 m²</text>')
# scale bar + north
sb = [f'<g transform="translate({X(2):.0f},{Y(-9):.0f})"><rect width="{10*S}" height="6" fill="{DK}"/><rect x="{10*S}" width="{10*S}" height="6" fill="#fff" stroke="{DK}"/>'
      f'<text y="20" font-family="Barlow" font-size="11" fill="{DK}">0</text><text x="{10*S}" y="20" font-family="Barlow" font-size="11" fill="{DK}" text-anchor="middle">10</text><text x="{20*S}" y="20" font-family="Barlow" font-size="11" fill="{DK}" text-anchor="middle">20 m</text></g>']
legend = [("MD 1", "2 × · 8,00 m"), ("MD 2", "4 × · 9,00 m"), ("MD 4", "2 × · 9,00 m"), ("MD 7", "4 × · 8,00 m")]
lg = "".join(f'<g transform="translate({X(44)+k*190:.0f},{Y(-9):.0f})"><rect width="26" height="14" rx="2" fill="{COL[m]}"/><text x="34" y="12" font-family="Barlow Semi Condensed" font-weight="800" font-size="13" fill="{DK}">{m}</text><text x="80" y="12" font-family="Barlow" font-size="12" fill="#5d5a54">{d}</text></g>' for k, (m, d) in enumerate(legend))
north = f'<g transform="translate({X(W)+10:.0f},{Y(D)-20:.0f})"><path d="M0,-18 L8,10 L0,4 L-8,10z" fill="{DK}"/><text y="26" font-family="Barlow" font-weight="700" font-size="12" text-anchor="middle" fill="{DK}">N</text></g>'
Wpx, Hpx = PAD * 2 + W * S + 40, PAD + (D + 12) * S
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {Wpx} {Hpx}" width="{Wpx}" height="{Hpx}"><rect width="100%" height="100%" fill="{BG}"/>' + "".join(out) + "".join(sb) + lg + north + "</svg>"
(K / "lageplan-buesum.svg").write_text(svg, encoding="utf-8")

fonts = (K / "fonts3.css").read_text()
page = f'''<!doctype html><html><head><meta charset="utf-8"><style>{fonts}
body{{margin:0;background:{BG};font-family:Barlow,sans-serif;color:{DK}}}.w{{width:{Wpx}px;padding:34px 0 26px}}
.h{{padding:0 {PAD}px}}.k{{font-family:'Barlow Semi Condensed';font-weight:600;font-size:15px;letter-spacing:.08em;text-transform:uppercase;margin:0}}
h1{{font-family:'Barlow Semi Condensed';font-weight:800;font-size:46px;line-height:1;margin:6px 0 8px}}h1 span{{color:{OR}}}
p{{margin:0;font-size:15px;color:#4b5559;max-width:1000px}}img{{height:36px}}.n{{padding:6px {PAD}px 0;font-size:12px;color:#6e777b}}</style></head><body><div class="w">
<div class="h"><img src="img/modunera-master-logo-mountain-v1-900.png"><p class="k" style="margin-top:14px">Konzept-Lageplan · Tiny-House-Resort Büsum</p><h1><span>12 Tiny Houses</span> auf 5.000 m²</h1>
<p>Die angebotenen Modelle in drei Reihen mit eigenen Terrassen: vorn die Studios (MD 7), in der Mitte MD 1 und MD 4, hinten die Familienhäuser (MD 2), dazu Shops, Gastronomie, Art Academy, Wellness und Parkplätze.</p></div>
{svg}<p class="n">Konzeptskizze, maßstäblich für die Tiny Houses (2,55 m breit). Grundstück mit 100 × 50 m angenommen. Größen von Shops, Gastronomie, Art Academy und Spa sind Annahmen. Abstände, Brandschutz und Zufahrten sind mit Bauamt und Planer zu prüfen.</p></div></body></html>'''
(K / "lageplan_buesum.html").write_text(page, encoding="utf-8")

async def render():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = await b.new_page(viewport={"width": Wpx, "height": 900}, device_scale_factor=2)
        await pg.goto((K / "lageplan_buesum.html").as_uri()); await pg.evaluate("document.fonts.ready")
        await pg.locator(".w").screenshot(path=str(K / "MODUNERA-Lageplan-Buesum.png")); await b.close()
asyncio.run(render())
print("ok")
