# MODUNERA Katalog 2026 (DE) — portrait A4, terracotta / anthracite design language.
import html, pathlib, asyncio, importlib.util
K = pathlib.Path(__file__).parent
e = html.escape
spec = importlib.util.spec_from_file_location("b2", K / "build2.py")
# reuse data (MODELS, LINES, ICONS) from build2 without executing its page code
src = (K / "build2.py").read_text()
ns = {"html": html, "pathlib": pathlib, "K": K, "e": e}
exec(src[src.index("MODELS = ["):src.index("def icon(")], ns)
MODELS, LINES, ICONS = ns["MODELS"], ns["LINES"], ns["ICONS"]
ICONS.update({
 "ruler": '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
 "width": '<path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
 "bed": '<path d="M3 18V8M21 18v-5a3 3 0 0 0-3-3H10v8"/><path d="M3 14h18"/><circle cx="6.5" cy="11" r="1.5"/>',
 "users": '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>',
 "layers": '<path d="M12 3 2 8l10 5 10-5z"/><path d="M2 13l10 5 10-5"/>',
 "truck": '<rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
 "shield": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 "euro": '<path d="M17 6a7 7 0 1 0 0 12"/><path d="M4 10h9M4 14h9"/>',
 "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 "pin": '<path d="M12 21s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
 "doc": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
 "factory": '<path d="M3 21V10l6 4V10l6 4V6h6v15z"/>',
 "flame": '<path d="M12 21c4 0 7-2.7 7-6.5 0-4-3.5-6-4.5-10.5-2 1.5-3 3.5-3 5.5-1-1-1.5-2.5-1.5-3.5C8 8 5 11 5 14.5 5 18.3 8 21 12 21z"/>',
})
def icon(k, s=26):
    return f'<svg class="ic" viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</svg>'
def img(k, cls=""):
    return f'<img class="{cls}" src="img/{k}.jpg" alt="">'
def bar(n, t):
    return f'<div class="bar"><span class="bn">{n}</span><span class="bt">{e(t)}</span></div>'
def head(kicker, l1, l2=""):
    return f'<p class="kick">{e(kicker)}</p><h2 class="hd"><span class="o">{l1}</span>{"<br>" + l2 if l2 else ""}</h2>'

SVG_HOUSE = (K / "exploded-house.svg").read_text().replace("#3A5A40", "#BC3A14").replace("Inter,sans-serif", "Barlow,sans-serif")
SVG_SECTION = (K / "exploded-section.svg").read_text().replace("#97311A", "#2E3B41").replace("Inter,sans-serif", "Barlow,sans-serif")

pages = []
def page(inner, cls="", foot=True):
    n = len(pages) + 1
    f = f'<footer class="ft"><span>MODUNERA · DESIGN YOUR NATURE · modunera.com · +90 553 543 5342</span><span class="pn">{n:02d}</span></footer>' if foot else ""
    pages.append(f'<section class="page {cls}"><div class="ghost"></div><header class="lg"><img src="img/modunera-master-logo-mountain-v1-900.png" alt="MODUNERA"></header>{inner}{f}</section>')

# 1 cover
page(f'''<p class="kick big">Tiny Houses · Katalog 2026</p><h1><span class="o">Weniger Haus.</span><br>Mehr Leben.</h1>
<p class="intro">Premium Tiny Houses aus Sakarya – bezugsfertig geliefert, für Wohnen, Ferienvermietung und ganze Tiny-House-Dörfer in Deutschland und Europa.</p>
<div class="cover-img">{img("cover")}<span class="tag">Visualisierung</span></div>
<div class="iconrow">{"".join(f'<div>{icon(i,34)}<b>{a}</b><span>{b}</span></div>' for i,a,b in [("home","9 Modelle","MD 1 – MD 9"),("width","2,55 m","straßentauglich"),("layers","10 cm","Steinwolle"),("factory","seit 2017","Sakarya"),("truck","500+","ausgeliefert")])}</div>
<div class="cta">Ihr Haus. Ihre Natur. Ihr Leben.<b>modunera.com</b></div>''', "cover")

# 2 contents + editorial
toc = [("01","Warum Tiny House"),("02","Natur und Gesundheit"),("03","Rechnen Sie nach"),("04","Warum Deutschland"),("05","MODUNERA & Aufbau"),("06","Die Modelle MD 1 – MD 9"),("07","Sonderanfertigungen & Projekte"),("08","Ausstattung & Extras"),("09","Ihr Weg zum Tiny House")]
page(f'''{head("Inhalt", "Ein Haus, das", "zum Leben passt.")}
<p class="lead">Wir haben uns daran gewöhnt, dass ein Zuhause groß sein muss – und dass man dreißig Jahre dafür bezahlt. Ein Tiny House stellt eine einfache Frage: Wie viel Raum brauchen Sie wirklich, um gut zu leben? Die Antwort ist kleiner, als man denkt. Was man dafür bekommt, ist größer: Zeit, Freiheit, Natur und finanzielle Luft.</p>
<div class="two"><div class="toc">{"".join(f'<div class="ti"><span class="bn">{a}</span><span>{e(b)}</span></div>' for a,b in toc)}</div>
<div class="edimg">{img("in3")}<span class="tag">Visualisierung</span></div></div>''')

# 3 Warum
reasons = [("freedom","Freiheit","Wohnen, wo man leben will – am Waldrand, am See, im Garten der Eltern."),("time","Zeit","Weniger putzen, reparieren, verwalten. Gewonnen werden Abende und Wochenenden."),
           ("euro","Finanzielle Luft","Ein Bruchteil der Kosten eines Einfamilienhauses – ohne jahrzehntelangen Kredit."),("leaf","Nachhaltigkeit","Weniger Material, weniger Fläche zu heizen, Solarstrom vom eigenen Dach."),
           ("tree","Natur","Große Fenster und Terrassen machen den Garten zum Wohnzimmer."),("home","Bewusst leben","Nur behalten, was man liebt – für viele der größte Gewinn.")]
page(f'''{head("01 · Warum Tiny House", "Sechs Gründe,", "kleiner zu wohnen.")}
<div class="wide">{img("in1")}<span class="tag">Visualisierung</span></div>
{bar(1,"Was Bewohner gewinnen")}<div class="cards3">{"".join(f'<div class="cd">{icon(i)}<b>{e(h)}</b><p>{e(t)}</p></div>' for i,h,t in reasons)}</div>
{bar(2,"Was Menschen in Deutschland sagen")}<div class="stats3">
<div><b>23 %</b><span>interessieren sich für ein Tiny House</span><small>YouGov für Interhyp, 2021</small></div>
<div><b>34 %</b><span>der Studierenden finden Tiny Houses interessant</span><small>Civey für DEVK, 2022</small></div>
<div><b>58 %</b><span>der Käufer wollen dauerhaft darin wohnen</span><small>Marktstudie, 24 Hersteller</small></div></div>''')

# 4 Natur
page(f'''{head("02 · Natur und Gesundheit", "Wald, Licht und", "frische Luft.")}
<div class="wide tall">{img("sp-a")}<span class="tag">Visualisierung</span></div>
<div class="nat"><div class="huge"><b>32 %</b><span>Deutschlands sind Wald – 11,5 Mio. Hektar</span><small>Bundeswaldinventur 2022</small></div>
<div><p>Bäume spenden Sauerstoff, filtern Staub, kühlen im Sommer und dämpfen Lärm. Wer im Grünen wohnt, spürt das jeden Tag: frischere Luft, ruhigere Nächte.</p>
<p>Eine Meta-Analyse zum „Waldbaden“ fand nach Aufenthalten im Wald niedrigere Werte des Stresshormons Cortisol als in der Stadt (Antonelli et al., 2019). Die Effekte sind kurzfristig und werden weiter erforscht – die Richtung ist klar: Natur tut uns gut.</p></div></div>
{bar(1,"So bringt ein Tiny House die Natur in den Alltag")}<div class="cards3">{"".join(f'<div class="cd">{icon(i)}<b>{e(h)}</b><p>{e(t)}</p></div>' for i,h,t in [("sun","Tageslicht","Raumhohe Glasflächen in jedem Modell."),("tree","Draußen wohnen","Terrassen und Veranden als zusätzliches Zimmer."),("wind","Ruhe","10 cm Steinwolle dämmt Wärme und Schall.")])}</div>''')

# 5 Finanzen
page(f'''{head("03 · Rechnen Sie nach", "Ein Bruchteil", "der Kosten.")}
{bar(1,"Kostenvergleich")}<div class="cmp">
<div class="cr"><span class="cl">Einfamilienhaus, 140 m²<small>nur Baukosten, ohne Grundstück</small></span><span class="ct"><i style="width:68%"></i><i class="h" style="width:32%"></i></span><b>364.000 – 532.000 €</b></div>
<div class="cr"><span class="cl">MODUNERA Tiny House<small>ab Werk, Basisausstattung</small></span><span class="ct"><i style="width:8.1%"></i></span><b class="o">ab 42.900 €</b></div>
<p class="note">Einfamilienhaus: 140 m² × 2.600–3.800 € Baukosten pro m² Wohnfläche (Angaben von Bausparkassen und Banken 2024/2025). Tiny House: ab Werk; Lieferung, Aufstellung, Anschlüsse und Grundstück kommen hinzu.</p></div>
{bar(2,"Warum gerade jetzt")}<div class="dark3"><div><b>+37 %</b><span>Baupreise für Wohngebäude seit 2021</span><small>Destatis, Q1 2026</small></div><div><b>+4,5 %</b><span>Angebotsmieten im Jahr 2025</span><small>IfW Kiel / GREIX</small></div><div><b>12 %</b><span>zahlen mehr als 40 % ihres Einkommens fürs Wohnen</span><small>EU-SILC 2024</small></div></div>
{bar(3,"Ihr Haus arbeitet mit: Ferienvermietung")}<div class="two"><div class="calc"><div class="r"><span>Preis pro Nacht</span><b>90 €</b></div><div class="r"><span>Belegte Nächte pro Jahr</span><b>120</b></div><div class="r s"><span>Umsatz pro Jahr</span><b>10.800 €</b></div><p>Rechenbeispiel mit angenommenen Werten, keine Prognose. Auslastung, Kosten, Steuern und Genehmigung hängen vom Standort ab.</p></div>
<div><p class="body">Naturnahes Reisen boomt: 2025 zählten Campingplätze in Deutschland <b>44,7 Millionen</b> Übernachtungen – so viele wie nie (Destatis). Dazu kommen niedrige laufende Kosten: Weniger Fläche heißt weniger Energie, mit Solaranlage erzeugen Sie einen Teil Ihres Stroms selbst.</p></div></div>
<div class="ctabar">{icon("euro",28)}<span>Tiny House ab Werk:</span><b>ab 42.900 €</b></div>''')

# 6 Deutschland
page(f'''{head("04 · Warum Deutschland", "Das Land ist bereit", "für kleinere Häuser.")}
<div class="stats4">{"".join(f'<div>{icon(i,30)}<b>{a}</b><span>{e(b)}</span><small>{e(c)}</small></div>' for i,a,b,c in [("home","49,5 m²","Wohnfläche pro Kopf – so viel wie nie","Destatis, Ende 2025"),("users","41 %","aller Haushalte sind Einpersonenhaushalte","Destatis"),("euro","24 %","des Einkommens gehen fürs Wohnen drauf","Destatis, 2025"),("tree","44,7 Mio.","Camping-Übernachtungen 2025 – Rekord","Destatis")])}</div>
{bar(1,"Lieferung nach Deutschland – seit 2019")}<div class="two"><div class="ph">{img("delivery")}<span class="tag">Foto: Auslieferung</span></div>
<div><p class="body">Unser erstes Haus ging 2019 nach Bremen. Seitdem liefern wir regelmäßig nach Deutschland – 2,55 m breit, als Anhänger straßentauglich, auf eigener Achse oder per Tieflader.</p>
<ul class="chk"><li>Fertig ausgebaut – mit Möbeln und Geräten</li><li>230-V-Elektroinstallation</li><li>Anschlusspunkte für Strom, Wasser, Abwasser vorbereitet</li><li>Anschluss durch örtlichen Fachbetrieb</li></ul></div></div>
{bar(2,"Was Sie wissen müssen")}<div class="info">{icon("doc",30)}<p>Für dauerhaftes Wohnen in Deutschland ist in aller Regel eine <b>Baugenehmigung</b> nötig – auch auf Rädern. Ob und wo ein Tiny House zulässig ist, entscheidet das Bauamt nach Bebauungsplan und Landesbauordnung. Unser Rat: vor dem Grundstückskauf eine Bauvoranfrage stellen. Die technischen Unterlagen liefern wir.</p></div>''')

# 7 MODUNERA
page(f'''{head("05 · Über uns", "Aus Sakarya.", "Für das Leben in Europa.")}
<div class="wide">{img("md6-a")}<span class="tag">Visualisierung</span></div>
<div class="facts4">{"".join(f'<div><b>{a}</b><span>{e(b)}</span></div>' for a,b in [("2017","Gründung in Sakarya"),("2019","Erste Lieferung nach Deutschland"),("500+","Tiny Houses ausgeliefert"),("190","Häuser in unserem Tiny-House-Dorf")])}</div>
{bar(1,"Wie wir arbeiten")}<div class="cards3">{"".join(f'<div class="cd">{icon(i)}<b>{e(h)}</b><p>{e(t)}</p></div>' for i,h,t in [("factory","Eine Fertigung","Rahmen, Hülle, Innenausbau und Möbel entstehen an einem Ort."),("shield","Geprüfte Qualität","Werksprüfung vor Auslieferung, Dokumentation zum Haus."),("pin","Projekterfahrung","Vom Einzelhaus bis zum Dorf mit 190 Häusern.")])}</div>''')

# 8 Aufbau
legend = [("1","Fahrgestell","Feuerverzinkter Stahl, Knott, Klasse O2"),("2","Bodenaufbau","Stahlrahmen, 10 cm Steinwolle, AGT-Laminat"),("3","Küche","Massive Arbeitsplatte, lackierte Fronten"),("4","Bad","Dusche, Wand-WC, Markenarmaturen"),("5","Loft","Schlafebene mit Treppe"),("6","Innenverkleidung","Sperrholz mit Tapete oder AGT-Paneel"),("7","Fassade & Fenster","Thermowood, PVC mit Isolierglas"),("8","Glastür","Raumhoch, wärmegedämmt"),("9","Wanddämmung","10 cm Steinwolle"),("10","Dach","Stehfalzblech"),("11","Dachdämmung","Steinwolle")]
page(f'''{head("05 · Aufbau", "Ein Tiny House,", "Teil für Teil.")}
<div class="xp">{SVG_HOUSE}</div>
<div class="leg">{"".join(f'<div><span class="bn">{a}</span><b>{e(b)}</b><small>{e(c)}</small></div>' for a,b,c in legend)}</div>
{bar(1,"Wandaufbau im Detail")}<div class="two sec"><div>{SVG_SECTION}</div><div class="leg2">{"".join(f'<div><span class="bn d">{a}</span><b>{e(b)}</b><small>{e(c)}</small></div>' for a,b,c in [("A","Innenverkleidung","Sperrholz, Tapete oder AGT-Paneel"),("B","Tragkonstruktion","Stahlskelett, feuerverzinkt"),("C","Dämmung","10 cm Steinwolle – nicht brennbar"),("D","Fassade","Thermowood, Stehfalz oder Verbundplatte")])}</div></div>
<p class="note">Schematische Darstellung, nicht maßstäblich.</p>''')

# 9 overview
cards = "".join(f'<div class="mc">{img(k+"-a")}<b>{e(n)}</b><span>{e(lay)} · {e(ln)}</span></div>' for n,k,ln,lay,*_ in MODELS)
cards += f'<div class="mc">{img("sp-a")}<b>Spiegelhaus</b><span>Sonderanfertigung</span></div><div class="mc">{img("bu-a")}<b>Bungalow</b><span>Ohne Räder</span></div><div class="mc">{img("in5")}<b>Projekte</b><span>Tiny-House-Dörfer</span></div>'
page(f'''{head("06 · Die Modelle", "Finden Sie", "Ihr Haus.")}<p class="lead">Alle Modelle 2,55 m breit, Stahlskelett, 10 cm Steinwolle. Weitere Längen von 6 bis 10 m auf Anfrage.</p><div class="mgrid">{cards}</div><p class="note">Alle Abbildungen: Visualisierungen.</p>''')

# 10-18 models
for i, (name, k, ln, lay, tag, quote, text, pts, pers) in enumerate(MODELS, 1):
    page(f'''<p class="kick">06 · Modell {i:02d} · {e(tag)}</p><h2 class="hd"><span class="o">{e(name)}</span> Tiny House</h2><p class="lead q">{e(quote)}</p>
<div class="mhero">{img(k+"-a")}<span class="tag">Visualisierung</span><span class="mno">{i:02d}</span></div>
<div class="iconrow sm">{"".join(f'<div>{icon(ic,28)}<b>{e(a)}</b><span>{e(b)}</span></div>' for ic,a,b in [("ruler",ln,"Länge"),("width","2,55 m","Breite"),("bed",lay,"Grundriss"),("users",pers,"Personen"),("layers","10 cm","Steinwolle")])}</div>
<div class="mrow">{img(k+"-b")}{img(k+"-c")}<div class="mplan">{img(k+"-p")}<span>Grundriss (Beispiel)</span></div></div>
<div class="two">{bar(1,"Das Modell")}{bar(2,"Highlights")}</div>
<div class="two tight"><p class="body">{e(text)}</p><ul class="chk">{"".join(f"<li>{e(p)}</li>" for p in pts)}</ul></div>''')

# specials
page(f'''<p class="kick">07 · Sonderanfertigung</p><h2 class="hd"><span class="o">Spiegelhaus</span></h2><p class="lead q">Von außen ein Spiegel. Von innen mitten in der Natur.</p>
<div class="mhero">{img("sp-a")}<span class="tag">Visualisierung</span></div>
<div class="iconrow sm">{"".join(f'<div>{icon(ic,28)}<b>{e(a)}</b><span>{e(b)}</span></div>' for ic,a,b in [("ruler","7 – 10 m","Länge"),("width","3,30 m","Breite, Sondertransport"),("shield","Stahlskelett","verzinkt"),("sun","3-seitig","Silberglas")])}</div>
<div class="two">{img("sp-b","ph2")}<div>{bar(1,"Für wen")}<p class="body">Für alle, die ein besonderes Zuhause suchen – oder als Hotelzimmer mit Wow-Effekt. Die verspiegelte Verglasung lässt das Haus in der Landschaft verschwinden.</p></div></div>''')
page(f'''<p class="kick">07 · Ohne Räder, in Wunschmaßen</p><h2 class="hd"><span class="o">Bungalow</span></h2><p class="lead q">Minimalistisch leben – auf einer Ebene.</p>
<div class="mhero">{img("bu-a")}<span class="tag">Visualisierung</span></div>
<div class="iconrow sm">{"".join(f'<div>{icon(ic,28)}<b>{e(a)}</b><span>{e(b)}</span></div>' for ic,a,b in [("ruler","Wunschmaß","Größe"),("shield","Leicht-/Schwerstahl","Konstruktion"),("layers","Mineralwolle / PU","Dämmung"),("home","Thermowood","Fassade")])}</div>
<div class="mrow">{img("bu-b")}{img("bu-c")}{img("bu-d")}</div>''')
page(f'''{head("07 · Projekte", "Vom Einzelhaus", "zum Tiny-House-Dorf.")}
<div class="wide tall">{img("in5")}<span class="tag">Visualisierung</span></div>
{bar(1,"Unsere Leistungen für Ihr Projekt")}<div class="cards3">{"".join(f'<div class="cd">{icon(i)}<b>{e(h)}</b><p>{e(t)}</p></div>' for i,h,t in [("pin","Konzept & Lageplan","Gemeinsam mit Ihnen, passend zum Grundstück."),("home","Mehrere Haustypen","Auswahl für Käufer und Investoren."),("truck","Schlüsselfertig","Mit Möbeln, Geräten und Lieferung."),("factory","Gemeinschaftsbauten","Rezeption, Shops, Café in Modulbauweise."),("users","Ein Ansprechpartner","Von der Planung bis zur Übergabe."),("chart","Erfahrung","Ein Dorf mit 190 Häusern in der Türkei realisiert.")])}</div>
<div class="ctabar">{icon("doc",28)}<span>Projektanfrage:</span><b>emre@modunera.com</b></div>''')

# equipment
rows = "".join(f"<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td><td>{e(d)}</td></tr>" for a,b,c,d in LINES)
page(f'''{head("08 · Ausstattung", "Drei Linien.", "Bekannte Marken.")}
{bar(1,"Standard · Standard Plus · Premium")}<table class="lines"><thead><tr><th></th><th>Standard</th><th>Standard Plus</th><th class="pr">Premium</th></tr></thead><tbody>{rows}</tbody></table>
<p class="note">„oder gleichwertig“: Bei Lieferengpässen setzen wir gleichwertige Produkte ein.</p>
{bar(2,"Extras, die das Leben leichter machen")}<div class="cards3">{"".join(f'<div class="cd">{icon(i)}<b>{e(h)}</b><p>{e(t)}</p></div>' for i,h,t in [("sun","Solaranlage & Speicher","Strom vom eigenen Dach, auch nachts."),("flame","Fußbodenheizung","Warme Böden, effizient und sparsam."),("leaf","Grauwasser","Sammeln oder aufbereiten – nach Abstimmung mit der Behörde."),("wind","Frischwassertank","Für Standorte ohne Leitung."),("time","Smart Home","Licht, Heizung, Klima per App."),("move","Satelliten-TV & Internet","Mit Setcom überall verbunden.")])}</div>''')

# journey
steps = ["Modell wählen und Kontakt aufnehmen","Preisangebot erhalten","Angebot annehmen","Technische Abstimmung","Design und Ausstattung festlegen","Anzahlung 60 %","Produktion","Fertigstellung und Lieferung","Restzahlung","Übergabe"]
faq = [("Individuelle Designs?","Ja – Grundriss, Länge von 6 bis 10 m, Materialien und Ausstattung nach Ihren Wünschen."),("Lieferung?","Nach Deutschland per Lkw, auf eigener Achse oder per Tieflader."),
       ("Strom und Wasser?","Netz, Solar oder Generator; Leitung oder Tank. Anschluss durch örtlichen Fachbetrieb."),("Baugenehmigung?","Für dauerhaftes Wohnen in Deutschland in aller Regel ja – auch auf Rädern."),
       ("Ohne Räder?","Ja, als Bungalow oder Modul auf Fundament."),("Werksbesuch?","Gern, Mo–Sa 9–18 Uhr nach Vereinbarung.")]
page(f'''{head("09 · Ihr Weg", "In zehn Schritten", "zu Ihrem Haus.")}
<div class="steps">{"".join(f'<div><span class="bn">{i:02d}</span><b>{e(s)}</b></div>' for i,s in enumerate(steps,1))}</div>
{bar(1,"Häufige Fragen")}<div class="faq">{"".join(f'<div><b>{e(q)}</b><p>{e(a)}</p></div>' for q,a in faq)}</div>
<div class="ctabar">{icon("doc",28)}<span>Angebot anfordern:</span><b>emre@modunera.com · +90 553 543 5342</b></div>''')

# back
src = ["Destatis: Wohnfläche pro Kopf, Ende 2025; Einpersonenhaushalte; Wohnkostenanteil 2025; Baupreisindex Q1 2026; Camping-Übernachtungen 2025","EU-SILC 2024: Wohnkostenüberbelastung","IfW Kiel / GREIX Mietpreisindex 2025","Thünen-Institut: Bundeswaldinventur 2022","YouGov für Interhyp (2021); Civey für DEVK (2022)","Antonelli et al. (2019), Int. J. Biometeorol.","Baukosten Einfamilienhaus: Bausparkassen- und Bankangaben 2024/2025"]
page(f'''{head("Kontakt", "Lassen Sie uns über", "Ihr Haus sprechen.")}
<div class="wide tall">{img("bu-a")}<span class="tag">Visualisierung</span></div>
<div class="contact">{"".join(f'<div>{icon(i,30)}<b>{a}</b><span>{b}</span></div>' for i,a,b in [("doc","E-Mail","emre@modunera.com"),("users","Telefon & WhatsApp","+90 553 543 5342"),("pin","Web","modunera.com")])}</div>
<p class="addr">MC TİNY HOUSE ÜRETİM VE DIŞ TİCARET LTD. ŞTİ. · Yeşiltepe Mah. 8036 Sk. No: 3A · Erenler / Sakarya · Türkei</p>
{bar(1,"Quellen")}<ol class="src">{"".join(f"<li>{e(s)}</li>" for s in src)}</ol>
<p class="note">Abbildungen der Modelle sind Visualisierungen. Ausstattung, Maße und Preise können sich ändern; verbindlich ist allein das schriftliche Angebot. 500+ ausgelieferte Häuser und das Dorf mit 190 Häusern nach eigenen Angaben.</p>''')

CSS = (K / "fonts3.css").read_text() + '''
@page{size:210mm 297mm;margin:0}
:root{--o:#BC3A14;--o2:#CE4C25;--d:#2E3B41;--d2:#3A474D;--bg:#FAF7F2;--t:#F3E6DE;--ink:#2a3338;--mu:#6e777b;--ln:#e6ddd2}
*{box-sizing:border-box}html,body{margin:0}body{font-family:Barlow,sans-serif;color:var(--ink);font-size:9.2pt;line-height:1.45}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:30mm 14mm 18mm;page-break-after:always;background:var(--bg)}
.ghost{position:absolute;right:-14mm;top:-10mm;width:110mm;height:90mm;background:url(img/modunera-mark-ghost.png) no-repeat center/contain;opacity:.07}
.lg{position:absolute;top:10mm;left:14mm}.lg img{height:9mm}
.ft{position:absolute;left:14mm;right:14mm;bottom:7mm;display:flex;justify-content:space-between;align-items:center;font-size:6.6pt;letter-spacing:.14em;color:var(--mu);border-top:1px solid var(--ln);padding-top:2.5mm}
.pn{width:8mm;height:8mm;border-radius:50%;background:var(--o);color:#fff;display:grid;place-items:center;font-weight:700;letter-spacing:0;font-size:7.5pt}
.kick{font-family:'Barlow Semi Condensed';font-weight:600;font-size:11pt;letter-spacing:.06em;text-transform:uppercase;color:var(--d);margin:0 0 1.5mm}.kick.big{font-size:14pt}
h1,.hd{font-family:'Barlow Semi Condensed';font-weight:800;color:var(--d);line-height:.98;letter-spacing:-.005em;margin:0 0 4mm}
h1{font-size:52pt;margin-top:2mm}.hd{font-size:33pt}.o{color:var(--o)}
.hd:after,h1:after{content:"";display:block;width:16mm;height:1.2mm;background:var(--o);margin-top:4mm}
.lead{font-size:11pt;line-height:1.45;color:#3c4549;margin:0 0 5mm;max-width:165mm}.lead.q{font-style:italic;font-size:12pt;color:var(--d)}
.intro{font-size:11.5pt;max-width:150mm;color:#3c4549;margin:0 0 5mm}
.body{font-size:9.4pt;line-height:1.5;margin:0 0 2mm}.note{font-size:6.8pt;color:var(--mu);margin:2mm 0 0}
.tag{position:absolute;left:3mm;bottom:3mm;background:var(--o);color:#fff;font-size:6.4pt;font-weight:600;padding:.8mm 2.4mm;border-radius:1mm;letter-spacing:.04em}
.cover-img,.wide,.edimg,.ph,.mhero{position:relative;border-radius:2mm;overflow:hidden}
.cover-img{height:118mm;margin:0 0 6mm}.cover-img img,.wide img,.edimg img,.ph img,.mhero img{width:100%;height:100%;object-fit:cover;display:block}
.wide{height:62mm;margin:0 0 5mm}.wide.tall{height:84mm}
.iconrow{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid var(--ln);border-bottom:1px solid var(--ln);padding:4mm 0;margin:0 0 5mm}
.iconrow div{text-align:center;border-right:1px solid var(--ln);padding:0 2mm}.iconrow div:last-child{border:0}.iconrow .ic{color:var(--o)}
.iconrow b{display:block;font-family:'Barlow Semi Condensed';font-weight:700;font-size:12.5pt;color:var(--d);margin-top:1.5mm;line-height:1.1}.iconrow span{font-size:7.4pt;color:var(--mu)}
.iconrow.sm{grid-template-columns:repeat(5,1fr);padding:3mm 0;margin:0 0 4mm}.iconrow.sm b{font-size:10.5pt}
.cta,.ctabar{background:var(--o);color:#fff;border-radius:1.5mm;padding:5mm 7mm;display:flex;align-items:center;gap:4mm;font-family:'Barlow Semi Condensed';font-size:14pt;font-weight:600}
.cta b,.ctabar b{margin-left:auto;font-weight:800;font-size:17pt}.ctabar{position:absolute;left:14mm;right:14mm;bottom:20mm}
.bar{display:flex;align-items:stretch;background:var(--d);color:#fff;border-radius:1mm;overflow:hidden;margin:0 0 3mm}
.bn{background:var(--o);color:#fff;font-family:'Barlow Semi Condensed';font-weight:800;min-width:7.5mm;display:grid;place-items:center;font-size:10pt;padding:0 1.5mm}
.bt{padding:1.8mm 3.5mm;font-family:'Barlow Semi Condensed';font-weight:700;font-size:9.6pt;letter-spacing:.06em;text-transform:uppercase}
.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin:0 0 4mm}.two.tight{margin-top:-1mm}.two .bar{margin:0}
.toc{display:flex;flex-direction:column;gap:2.4mm}.ti{display:flex;align-items:stretch;background:#fff;border:1px solid var(--ln);border-radius:1mm;overflow:hidden}.ti span:last-child{padding:3mm 4mm;font-family:'Barlow Semi Condensed';font-weight:700;font-size:12pt;color:var(--d)}
.ti .bn{min-width:11mm;font-size:12pt}.edimg{height:130mm}
.cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:0 0 5mm}.cd{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:4mm}
.cd .ic{color:var(--o)}.cd b{display:block;font-family:'Barlow Semi Condensed';font-weight:700;font-size:11.5pt;color:var(--d);margin:1.5mm 0 1mm}.cd p{margin:0;font-size:8.2pt;line-height:1.4;color:#4b5559}
.stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.stats3 div{background:var(--t);border-radius:1.5mm;padding:4mm}
.stats3 b,.huge b,.dark3 b,.stats4 b,.facts4 b{display:block;font-family:'Barlow Semi Condensed';font-weight:800;color:var(--o);line-height:1}
.stats3 b{font-size:30pt}.stats3 span{display:block;font-size:8.8pt;margin-top:1mm;color:var(--d);font-weight:500}small{display:block;font-size:6.4pt;color:var(--mu);margin-top:1mm}
.nat{display:grid;grid-template-columns:62mm 1fr;gap:7mm;margin:0 0 4mm}.nat p{margin:0 0 2mm;font-size:9.2pt}.huge b{font-size:64pt}.huge span{font-size:10pt;font-weight:600;color:var(--d)}
.cmp{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:5mm;margin:0 0 4mm}.cr{display:grid;grid-template-columns:52mm 1fr 42mm;gap:4mm;align-items:center;margin:0 0 4mm}
.cl{font-family:'Barlow Semi Condensed';font-weight:700;font-size:11pt;color:var(--d)}.ct{height:9mm;background:#f1ebe3;border-radius:1mm;display:flex;overflow:hidden}.ct i{background:var(--d)}.ct i.h{background:repeating-linear-gradient(45deg,#7c868a,#7c868a 3px,#a9b0b3 3px,#a9b0b3 6px)}
.cr:nth-child(2) .ct i{background:var(--o)}.cr b{font-family:'Barlow Semi Condensed';font-weight:800;font-size:14pt;color:var(--d);text-align:right}.cr b.o{color:var(--o)}
.dark3{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:0 0 4mm}.dark3 div{background:var(--d);color:#fff;border-radius:1.5mm;padding:4mm}.dark3 b{font-size:28pt;color:#F08A63}.dark3 span{display:block;font-size:8.6pt;margin-top:1mm}.dark3 small{color:#aab4b8}
.calc{background:#fff;border:1px solid var(--ln);border-left:1.2mm solid var(--o);border-radius:1.5mm;padding:4mm}.calc .r{display:flex;justify-content:space-between;padding:1.5mm 0;border-bottom:1px solid var(--ln);font-size:9.2pt}
.calc .r.s{border:0;font-family:'Barlow Semi Condensed';font-weight:800;font-size:15pt;color:var(--o)}.calc p{font-size:6.6pt;color:var(--mu);margin:1.5mm 0 0}
.stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:0 0 5mm}.stats4 div{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:4mm}.stats4 .ic{color:var(--o)}.stats4 b{font-size:22pt;color:var(--d);margin-top:1mm}.stats4 span{display:block;font-size:8.2pt;margin-top:1mm}
.ph{height:58mm}.chk{list-style:none;padding:0;margin:0}.chk li{position:relative;padding:1.6mm 0 1.6mm 6mm;border-bottom:1px solid var(--ln);font-size:9pt}
.chk li:before{content:"";position:absolute;left:.4mm;top:2.8mm;width:2.8mm;height:1.4mm;border-left:1.6px solid var(--o);border-bottom:1.6px solid var(--o);transform:rotate(-45deg)}
.info{display:flex;gap:4mm;background:var(--t);border-radius:1.5mm;padding:4.5mm}.info .ic{color:var(--o);flex:none}.info p{margin:0;font-size:9pt}
.facts4{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:0 0 5mm}.facts4 div{background:var(--d);border-radius:1.5mm;padding:4.5mm;color:#fff}.facts4 b{font-size:28pt;color:#F08A63}.facts4 span{font-size:8.2pt}
.xp{height:140mm;margin:-4mm 50mm 2mm -4mm}.xp svg{width:100%;height:100%}
.leg{position:absolute;right:14mm;top:66mm;width:52mm;display:flex;flex-direction:column;gap:1.6mm}.leg div,.leg2 div{display:grid;grid-template-columns:7mm 1fr;column-gap:2mm;align-items:center}
.leg .bn,.leg2 .bn{grid-row:span 2;width:6.5mm;height:6.5mm;border-radius:50%;font-size:8pt;min-width:0;padding:0}.leg2 .bn.d{background:var(--d)}
.leg b,.leg2 b{font-family:'Barlow Semi Condensed';font-weight:700;font-size:9.4pt;color:var(--d);line-height:1.1}.leg small,.leg2 small{margin:0;font-size:7pt}
.sec{align-items:center}.sec svg{width:100%;height:48mm}.leg2{display:flex;flex-direction:column;gap:3mm}.leg2 b{font-size:11pt}.leg2 small{font-size:8pt}
.mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.mc{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;overflow:hidden}.mc img{width:100%;height:27mm;object-fit:cover;display:block}
.mc b{display:block;font-family:'Barlow Semi Condensed';font-weight:800;font-size:13pt;color:var(--o);padding:2mm 3mm 0}.mc span{display:block;font-size:7.6pt;color:var(--mu);padding:0 3mm 2.5mm}
.mhero{height:80mm;margin:0 0 4mm}.mno{position:absolute;right:4mm;bottom:0;font-family:'Barlow Semi Condensed';font-weight:800;font-size:80pt;line-height:.85;color:rgba(255,255,255,.92);text-shadow:0 2mm 6mm rgba(0,0,0,.35)}
.mrow{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:3mm;height:36mm;margin:0 0 4mm}.mrow>img{width:100%;height:100%;object-fit:cover;border-radius:1.5mm}
.mplan{position:relative;background:#26302f;border-radius:1.5mm;overflow:hidden}.mplan img{width:100%;height:100%;object-fit:contain}.mplan span{position:absolute;left:2mm;bottom:1.5mm;color:#e9e3da;font-size:6pt}
.ph2{width:100%;height:62mm;object-fit:cover;border-radius:1.5mm}
.lines{width:100%;border-collapse:collapse;font-size:7.6pt;background:#fff;border:1px solid var(--ln)}.lines th{background:var(--t);color:var(--d);text-align:left;font-family:'Barlow Semi Condensed';font-weight:800;font-size:10.5pt;padding:2mm}
.lines th.pr{background:var(--o);color:#fff}.lines td{padding:1.5mm 2mm;border-top:1px solid var(--ln);vertical-align:top}.lines td:first-child{font-weight:700;color:var(--d);width:16%}.lines td:last-child{background:#fbf1ec}
.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin:0 0 5mm}.steps div{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:3mm;min-height:26mm}
.steps .bn{display:inline-grid;min-width:8mm;height:8mm;border-radius:1mm;margin-bottom:2mm}.steps b{display:block;font-family:'Barlow Semi Condensed';font-weight:700;font-size:10pt;color:var(--d);line-height:1.15}
.faq{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.faq div{background:#fff;border:1px solid var(--ln);border-radius:1.5mm;padding:3.5mm}.faq b{font-family:'Barlow Semi Condensed';font-weight:700;font-size:11pt;color:var(--o)}.faq p{margin:1mm 0 0;font-size:8.4pt}
.contact{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:0 0 3mm}.contact div{background:var(--d);color:#fff;border-radius:1.5mm;padding:4.5mm}.contact .ic{color:#F08A63}.contact b{display:block;font-family:'Barlow Semi Condensed';font-weight:700;font-size:11pt;margin-top:1mm}.contact span{font-size:9.6pt}
.addr{font-size:7.4pt;color:var(--mu);margin:0 0 4mm}.src{font-size:7.6pt;line-height:1.5;margin:0;padding-left:5mm;color:#4b5559}
.cover h1{font-size:58pt}
'''
doc = f'<!doctype html><html lang="de"><head><meta charset="utf-8"><title>MODUNERA Katalog 2026</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
(K / "katalog3.html").write_text(doc, encoding="utf-8")
async def pdf():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = await b.new_page()
        await pg.goto((K / "katalog3.html").as_uri(), wait_until="load")
        await pg.evaluate("document.fonts.ready")
        await pg.pdf(path=str(K / "MODUNERA-Katalog-2026-DE.pdf"), width="210mm", height="297mm", print_background=True)
        await b.close()
asyncio.run(pdf())
print("pages", len(pages))
