# Price offer "Tiny-House-Resort Büsum" (DE, A4) in the catalogue design (build3.py CSS).
import html, pathlib, asyncio
K = pathlib.Path(__file__).parent
e = html.escape
src = (K / "build3.py").read_text()
ns = {"html": html, "pathlib": pathlib, "K": K, "e": e}
b2 = (K / "build2.py").read_text()
exec(b2[b2.index("ICONS = {"):b2.index("def icon(")], ns)
exec(src[src.index("ICONS.update({"):src.index("\ndef icon(")], {**ns, "ICONS": ns["ICONS"]})
ICONS = ns["ICONS"]
CSS_BASE = src[src.index("CSS = (K / \"fonts3.css\").read_text() + '''") + len("CSS = (K / \"fonts3.css\").read_text() + '''"):]
CSS_BASE = CSS_BASE[:CSS_BASE.index("'''")]

def icon(k, s=26):
    return f'<svg class="ic" viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</svg>'
def img(k, cls=""):
    return f'<img class="{cls}" src="img/{k}.jpg" alt="">'
def bar(n, t):
    return f'<div class="bar"><span class="bn">{n}</span><span class="bt">{e(t)}</span></div>'
def eur(v):
    return f"{v:,.0f}".replace(",", ".") + " €"

OFFER_NO, DATE, VALID = "MOD-2026-1103-BUS", "03.11.2026", "03.12.2026"
POS = [  # model, key, layout, length, persons, qty, unit price
    ("MD 1", "md1", "1 Loft, Panorama-Glasflächen", "8,00 m", "2–3", 2, 49000),
    ("MD 2", "md2", "2 Lofts, offene Wohnküche", "9,00 m", "3–4", 4, 55000),
    ("MD 4", "md4", "Loft, Zimmer, integrierte Veranda", "9,00 m", "3–4", 2, 55000),
    ("MD 7", "md7", "1 Loft, asymmetrisches Dach", "8,00 m", "1–2", 4, 55000),
]
TOTAL = sum(q * p for *_, q, p in POS)
UNITS = sum(q for *_, q, _ in POS)

pages = []
def page(inner):
    n = len(pages) + 1
    pages.append(f'<section class="page"><div class="ghost"></div><header class="lg"><img src="img/modunera-master-logo-mountain-v1-900.png" alt="MODUNERA"></header>{inner}'
                 f'<footer class="ft"><span>MODUNERA · Angebot {OFFER_NO} · {DATE} · modunera.com · +90 553 543 5342</span><span class="pn">{n:02d}</span></footer></section>')

# 1 cover
page(f'''<p class="kick big">Individuelles Angebot</p><h1><span class="o">Tiny-House-Resort</span><br>Büsum</h1>
<p class="intro">Angebot über {UNITS} schlüsselfertige Tiny Houses – Premium-Innenausstattung, Fußbodenheizung, Solaranlage, komplette Möblierung, Smart Home und Lieferung nach Büsum.</p>
<div class="meta"><div><span>Angebot Nr.</span><b>{OFFER_NO}</b></div><div><span>Datum</span><b>{DATE}</b></div><div><span>Gültig bis</span><b>{VALID}</b></div><div><span>Projekt</span><b>Büsum, Schleswig-Holstein</b></div></div>
<div class="cover-img short">{img("in5")}<span class="tag">Visualisierung</span></div>
<div class="iconrow">{"".join(f'<div>{icon(i,32)}<b>{a}</b><span>{b}</span></div>' for i,a,b in [("home",f"{UNITS} Häuser","4 Modelle"),("layers","Premium","Innenausstattung"),("flame","inklusive","Fußbodenheizung"),("sun","inklusive","Solaranlage"),("truck","inklusive","Lieferung Büsum")])}</div>
<div class="cta">Projektpreis für {UNITS} Tiny Houses:<b>{eur(TOTAL)}</b></div>''')

# 2 price overview
rows = "".join(f'<tr><td>{i}</td><td><b>{e(m)}</b><small>{e(lay)}</small></td><td>{e(ln)}</td><td>{e(pe)}</td><td class="r">{q}</td><td class="r">{eur(p)}</td><td class="r"><b>{eur(q*p)}</b></td></tr>' for i,(m,k,lay,ln,pe,q,p) in enumerate(POS,1))
page(f'''<p class="kick">Kommerzielle Bedingungen</p><h2 class="hd"><span class="o">Preisstruktur,</span><br>Zahlung & Lieferung</h2>
{bar(1,"Preisübersicht – 12 Tiny Houses")}
<table class="ptab"><thead><tr><th>Pos.</th><th>Modell</th><th>Länge</th><th>Personen</th><th class="r">Anzahl</th><th class="r">Stückpreis</th><th class="r">Gesamt</th></tr></thead><tbody>{rows}</tbody>
<tfoot><tr><td colspan="4">Gesamt</td><td class="r">{UNITS}</td><td></td><td class="r">{eur(TOTAL)}</td></tr></tfoot></table>
<p class="note">Stückpreise schlüsselfertig inklusive Ausstattung nach Seite 4 und Lieferung nach Büsum. Preise in EUR netto.</p>
<div class="two">
<div>{bar(2,"Zahlungsbedingungen")}<div class="pay"><div><b>60 %</b><span>Anzahlung bei Auftragserteilung</span></div><div><b>40 %</b><span>Restzahlung vor Auslieferung</span></div></div></div>
<div>{bar(3,"Transport & Lieferung")}<ul class="chk"><li>Lieferung per Lkw von Sakarya nach Büsum</li><li>Auf eigener Achse oder per Tieflader</li><li>Abladen und Positionieren auf vorbereiteter Fläche</li><li>Lieferung in Etappen nach Bauabschnitt möglich</li></ul></div></div>
{bar(4,"Hinweise")}<div class="info">{icon("doc",28)}<p>Die Tiny Houses werden in der Türkei gefertigt; mit Warenverkehrsbescheinigung A.TR ist die Einfuhr in die EU in der Regel zollfrei. Die deutsche Einfuhrumsatzsteuer wird bei der Einfuhr gesondert erhoben. Produktions- und Liefertermine werden nach Auftragsklärung verbindlich abgestimmt.</p></div>
<div class="ctabar">{icon("euro",28)}<span>Projektpreis für {UNITS} Einheiten:</span><b>{eur(TOTAL)}</b></div>''')

# 3 models
cards = "".join(f'''<div class="om"><div class="omimg">{img(k+"-a")}<span class="omq">{q}×</span></div><div class="omb"><b>{e(m)}</b><span>{e(lay)}</span>
<div class="omf"><span>{icon("ruler",16)} {e(ln)}</span><span>{icon("width",16)} 2,55 m</span><span>{icon("users",16)} {e(pe)} Pers.</span></div>
<div class="omp"><span>Stückpreis</span><b>{eur(p)}</b></div></div><div class="ompl">{img(k+"-p")}</div></div>''' for m,k,lay,ln,pe,q,p in POS)
page(f'''<p class="kick">Die Häuser im Angebot</p><h2 class="hd"><span class="o">Vier Modelle,</span><br>ein Resort.</h2>
<p class="lead">Die Auswahl verbindet kompakte Studios (MD 7), Häuser für Paare (MD 1) und Familien- bzw. Gruppenunterkünfte (MD 2, MD 4) – für eine breite Gästestruktur im Resort.</p>
<div class="omgrid">{cards}</div><p class="note">Abbildungen und Grundrisse: Visualisierungen bzw. Beispiele; Grundriss, Fassade und Farben werden je Haus abgestimmt.</p>''')

# 4 scope
inc = ["Tragkonstruktion und Fahrgestell aus feuerverzinktem Stahl", "Dämmung 10 cm Steinwolle (Izocam) in Wand und Decke, Onduline-Feuchtigkeitssperre",
       "Fassade Thermowood, Stehfalz- oder Verbundplatte nach Wahl", "Fenster und Türen PVC oder Aluminium, Isolierverglasung",
       "Innenwände Marine-Sperrholz mit Tapete oder AGT-Paneel, Boden 8/12 mm AGT-Laminat",
       "Halogenfreie Elektroinstallation 230 V (Viko), LED Philips oder Samsung", "Sanitär: Grohe-Armaturen, Vitra-Keramik, Dusche, Wand-WC",
       "Küche mit Massivholz-Arbeitsplatte, lackierte oder Membranfronten", "Geräte Bosch: Kühlschrank, Waschmaschine, Spülmaschine, E-Herd, Dunstabzug, Warmwasser, TV",
       "Klimagerät Mitsubishi Electric oder York"]
plus = [("flame","Fußbodenheizung"),("sun","Solaranlage mit Speicher"),("home","Komplette Möblierung"),("time","Smart Home"),("truck","Lieferung nach Büsum"),("doc","Technische Unterlagen für den Bauantrag")]
page(f'''<p class="kick">Leistungsumfang</p><h2 class="hd"><span class="o">Schlüsselfertig</span><br>und bezugsbereit.</h2>
{bar(1,"Premium-Ausstattung – in jedem Haus enthalten")}<ul class="chk cols">{"".join(f"<li>{e(x)}</li>" for x in inc)}</ul>
{bar(2,"Zusätzlich im Preis enthalten")}<div class="plus">{"".join(f'<div>{icon(i,28)}<b>{e(t)}</b></div>' for i,t in plus)}</div>
{bar(3,"Anschluss an Wasser und Strom")}<p class="body">Jedes Haus wird anschlussfertig geliefert: Elektro-, Wasser- und Abwasserinstallation sind komplett im Haus verlegt und enden an festen Übergabepunkten, deren Lage wir vor der Produktion mit Ihnen abstimmen. Die Leitungen auf dem Grundstück bis zu diesen Übergabepunkten (Erschließung) und der Anschluss durch zugelassene Fachbetriebe vor Ort sind Teil der Außenanlagen.</p>
{bar(4,"Nicht enthalten")}<div class="two tight"><ul class="chk x"><li>Grundstückserschließung, Wege, Beleuchtung</li><li>Fundamente bzw. Aufstellflächen</li><li>Hausanschlüsse durch örtliche Fachbetriebe</li></ul><ul class="chk x"><li>Genehmigungen, Statik vor Ort, Gebühren</li><li>Einfuhrumsatzsteuer</li><li>Art Academy (lokaler Partner)</li></ul></div>
<p class="note">Für die Außenanlagen erstellen wir auf Basis des Lageplans gern eine Kostenschätzung gemeinsam mit einem regionalen Partner.</p>''')

# 5 commercial modules + next steps
qs = ["Größe je Einheit: Grundfläche in m² und gewünschte Raumhöhe?","Nutzung je Shop: Verkauf, Café, Restaurantküche, Bar?","Gastro: Wird eine gewerbliche Küche mit Abluft, Fettabscheider und Starkstrom benötigt?",
      "Sanitär: Gäste-WC, barrierefrei, Personalräume?","Dauerhaft auf Fundament oder mobil auf Rädern?","Ausbau: Rohbau oder schlüsselfertig mit Theke, Möbeln und Technik?",
      "Fassade und Design passend zu den Tiny Houses?","Gibt es bereits einen Lageplan oder Grundrisse?"]
page(f'''<p class="kick">Gewerbemodule</p><h2 class="hd"><span class="o">3 Shops und</span><br>2 Gastro-Einheiten.</h2>
<p class="lead">Für die Shops und Gastro-Einheiten erstellen wir ein eigenes Angebot, sobald die Eckdaten feststehen. Größe, Nutzung und Technik verändern den Preis pro Quadratmeter erheblich – deshalb möchten wir hier nicht schätzen, sondern genau rechnen.</p>
{bar(1,"Zwei mögliche Bauweisen")}<div class="two"><div class="opt">{icon("home",30)}<b>A · Tiny-House-Modul</b><p>Auf Basis unserer Tiny-House-Bauweise: 2,55 m breit, gleiche Fassade wie die Häuser, mehrere Module kombinierbar. Schnell, einheitliches Erscheinungsbild.</p></div>
<div class="opt">{icon("factory",30)}<b>B · Leichtstahl-Modulbau</b><p>Freie Grundrisse und größere Spannweiten auf Fundament – ideal für Gastronomie. Auf Wunsch Fertigung bzw. Montage mit einem Partner in Deutschland.</p></div></div>
{bar(2,"Unsere Fragen an Sie")}<ol class="qs">{"".join(f"<li>{e(q)}</li>" for q in qs)}</ol>
{bar(3,"Nächste Schritte")}<div class="steps4">{"".join(f'<div><span class="bn">{i}</span><b>{e(t)}</b></div>' for i,t in enumerate(["Angebot Tiny Houses prüfen","Fragen zu Shops & Gastro beantworten","Lageplan & Termin abstimmen","Auftrag und Produktionsstart"],1))}</div>
<div class="ctabar">{icon("doc",28)}<span>Ansprechpartner: Emre</span><b>emre@modunera.com</b></div>''')

CSS = (K / "fonts3.css").read_text() + CSS_BASE + '''
.cover-img.short{height:92mm}
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:0 0 5mm}.meta div{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:3mm}.meta span{display:block;font-size:7pt;color:var(--mu);text-transform:uppercase;letter-spacing:.08em}.meta b{font-family:'Barlow Semi Condensed';font-size:11pt;color:var(--d)}
.ptab{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--ln);font-size:9pt;margin:0 0 2mm}.ptab th{background:var(--t);text-align:left;padding:2.2mm;font-family:'Barlow Semi Condensed';font-weight:800;color:var(--d)}
.ptab td{padding:2.4mm 2.2mm;border-top:1px solid var(--ln);vertical-align:top}.ptab td b{font-family:'Barlow Semi Condensed';font-size:11.5pt;color:var(--o)}.ptab td small{margin:0;font-size:7.4pt}
.ptab .r{text-align:right}.ptab tfoot td{background:var(--d);color:#fff;font-family:'Barlow Semi Condensed';font-weight:800;font-size:12pt}
.pay{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.pay div{background:var(--t);border-radius:1.5mm;padding:4mm}.pay b{display:block;font-family:'Barlow Semi Condensed';font-weight:800;font-size:28pt;color:var(--o);line-height:1}.pay span{font-size:8.6pt;color:var(--d);font-weight:500}
.omgrid{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.om{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;overflow:hidden}
.omimg{position:relative;height:31mm}.omimg img{width:100%;height:100%;object-fit:cover;display:block}.omq{position:absolute;right:2mm;top:2mm;background:var(--o);color:#fff;font-family:'Barlow Semi Condensed';font-weight:800;font-size:15pt;padding:.5mm 3mm;border-radius:1mm}
.omb{padding:3mm 3.5mm}.omb>b{font-family:'Barlow Semi Condensed';font-weight:800;font-size:16pt;color:var(--o)}.omb>span{display:block;font-size:8.4pt;color:var(--d)}
.omf{display:flex;gap:4mm;margin:2mm 0;font-size:8pt;color:var(--mu)}.omf span{display:flex;align-items:center;gap:1mm}.omf .ic{color:var(--o)}
.omp{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--ln);padding-top:2mm}.omp span{font-size:8pt;color:var(--mu)}.omp b{font-family:'Barlow Semi Condensed';font-weight:800;font-size:15pt;color:var(--d)}
.ompl{height:22mm;background:#26302f}.ompl img{width:100%;height:100%;object-fit:contain;display:block}
.chk.cols{columns:2;column-gap:6mm;margin:0 0 4mm}.chk.cols li{break-inside:avoid;font-size:8.4pt}
.chk.x li:before{border:0;transform:none;content:"–";color:var(--o);top:1.2mm;font-weight:700;width:auto;height:auto}
.plus{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:0 0 4mm}.plus div{background:#fff;border:1px solid var(--ln);border-left:1.2mm solid var(--o);border-radius:1.5mm;padding:3mm;display:flex;align-items:center;gap:3mm}.plus .ic{color:var(--o);flex:none}.plus b{font-family:'Barlow Semi Condensed';font-weight:700;font-size:10.5pt;color:var(--d)}
.opt{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:4mm}.opt .ic{color:var(--o)}.opt b{display:block;font-family:'Barlow Semi Condensed';font-weight:800;font-size:12.5pt;color:var(--d);margin:1.5mm 0}.opt p{margin:0;font-size:8.6pt}
.qs{margin:0 0 4mm;padding-left:6mm;columns:2;column-gap:8mm;font-size:8.8pt}.qs li{break-inside:avoid;margin:0 0 2mm}.qs li::marker{color:var(--o);font-weight:700}
.steps4{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}.steps4 div{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:3mm;min-height:20mm}.steps4 .bn{display:inline-grid;min-width:7mm;height:7mm;border-radius:1mm;margin-bottom:1.5mm}.steps4 b{display:block;font-family:'Barlow Semi Condensed';font-weight:700;font-size:10pt;color:var(--d);line-height:1.15}
'''
doc = f'<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Angebot {OFFER_NO}</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
(K / "angebot_buesum.html").write_text(doc, encoding="utf-8")
async def pdf():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = await b.new_page()
        await pg.goto((K / "angebot_buesum.html").as_uri(), wait_until="load")
        await pg.evaluate("document.fonts.ready")
        await pg.pdf(path=str(K / f"MODUNERA-Angebot-{OFFER_NO}.pdf"), width="210mm", height="297mm", print_background=True)
        await b.close()
asyncio.run(pdf())
print("pages", len(pages), "total", TOTAL)
