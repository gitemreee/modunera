# MODUNERA Katalog 2026 (DE) — square magazine layout, HTML -> PDF via Chromium.
import html, pathlib, asyncio
K = pathlib.Path(__file__).parent
e = html.escape
SVG_HOUSE = (K / "exploded-house.svg").read_text()
SVG_SECTION = (K / "exploded-section.svg").read_text()

MODELS = [
  ("MD 1", "md1", "8,00 m / 9,70 m", "1 Loft", "Panorama und Tageslicht",
   "Licht ist der wichtigste Baustoff dieses Hauses.",
   "Raumhohe Glasflächen holen den Garten ins Wohnzimmer. Über dem Wohnbereich liegt das Loft – auf Wunsch mit Glasdach, durch das Sie nachts die Sterne sehen. Ein Haus für alle, die morgens mit der Sonne aufwachen möchten.",
   ["Großzügiger Wohnbereich mit raumhohen Glasflächen", "Loft mit optionalem Glasdach", "Küche und Bad in voller Größe", "Terrasse direkt am Wohnraum"], "2–3"),
  ("MD 2", "md2", "9,00 m", "2 Lofts", "Für Familien und Gäste",
   "Zwei Schlafebenen. Ein gemeinsamer Mittelpunkt.",
   "Zwei getrennte Lofts geben Eltern und Kindern oder Gastgebern und Gästen ihren eigenen Rückzugsort. Darunter: eine offene Wohnküche, in der man zusammenkommt. Privat genutzt ebenso stark wie in der Vermietung.",
   ["Zwei Lofts als getrennte Schlafbereiche", "Offene Wohnküche mit Essplatz", "Großes Bad", "Ideal für Familien und Ferienvermietung"], "3–4"),
  ("MD 3", "md3", "8,00 m / 9,70 m", "Loft + Zimmer", "Privatsphäre und Homeoffice",
   "Eine Tür mehr – und alles wird möglich.",
   "Ein abgeschlossenes Zimmer auf der Wohnebene macht MD 3 zum Haus für Menschen, die Wohnen und Arbeiten trennen wollen – oder Gäste lieben. Das Loft darüber bleibt der ruhige Schlafplatz.",
   ["Separates Zimmer auf Wohnebene", "Loft als zweiter Schlafbereich", "Homeoffice, Gäste- oder Kinderzimmer", "Erweiterbarer Grundriss"], "2–4"),
  ("MD 4", "md4", "8,00 m / 9,00 m", "Loft, Zimmer, Veranda", "Leben draußen",
   "Die Veranda ist hier kein Zubehör, sondern ein Zimmer.",
   "Die integrierte, überdachte Veranda verlängert den Wohnraum nach draußen – für Frühstück im Freien und lange Sommerabende. Dazu Loft, Zimmer, Bad und Küche: das Modell für Ferienhaus, Glamping und Vermietung.",
   ["Integrierte, überdachte Veranda", "Loft und separates Zimmer", "Bad und Küche in voller Größe", "Stark in Ferienparks und Glamping"], "3–4"),
  ("MD 5", "md5", "8,00 m / 9,00 m", "Loft + optionales Zimmer", "Urban und warm",
   "Klare Linien außen. Wärme innen.",
   "Eine moderne Fassade aus Holz und Metall, innen warme Naturmaterialien. MD 5 passt an den Stadtrand ebenso wie in den Garten – als Zuhause, Atelier oder Büro, mit einem optionalen zusätzlichen Zimmer.",
   ["Moderne Fassade aus Holz und Metall", "Loft mit Dachfenstern", "Optionales Zimmer", "Wohnen, Atelier oder Büro"], "2–3"),
  ("MD 6", "md6", "8,00 m / 9,00 m", "Chalet-Konzept", "Hohe Decken, viel Glas",
   "Ein Chalet, das überall zu Hause ist.",
   "Satteldach, deckenhoher Wohnraum, eine große Glasfront: MD 6 verbindet die Gemütlichkeit eines Chalets mit der Leichtigkeit eines Tiny Houses. Am See, im Wald, am Berg – oder als Herzstück eines Resorts.",
   ["Chalet-Architektur mit Satteldach", "Deckenhoher Wohnraum", "Große Glasfront", "Ideal für Resorts und Naturlagen"], "2–4"),
  ("MD 7", "md7", "8,00 m", "1 Loft", "Asymmetrische Architektur",
   "Architektur, nach der man sich umdreht.",
   "Die asymmetrische Dachform macht MD 7 unverwechselbar. Innen: ein offener Raum mit Loft und Fensterband. Als Studio, Büro oder Zuhause – in der Natur ebenso wie in der Stadt. Solarmodule passen aufs Dach.",
   ["Asymmetrische Dachform", "Loft mit Fensterband", "Studio, Büro oder Zuhause", "Solaranlage auf dem Dach möglich"], "1–2"),
  ("MD 8", "md8", "8,00 m", "1 Loft", "Kompakter Komfort",
   "Kompakt gedacht. Großzügig gelebt.",
   "Ein geräumiger Wohnbereich, ein bequemes Loft und Stauraum, der mitdenkt. MD 8 zeigt, wie viel Leben auf 8 Metern Platz hat – als erstes eigenes Haus, als Büro oder als Gästehaus im Garten.",
   ["Geräumiger Wohnbereich", "Komfortables Loft", "Durchdachter Stauraum", "Effizient auf 8 m"], "1–2"),
  ("MD 9", "md9", "8,00 m", "1 Loft", "Für Komfort-Liebhaber",
   "Für alle, die Komfort lieben.",
   "Ein großzügiges Wohnzimmer, ein bequemes Loft und eine markante Fassade aus dunklem Metall und Holz. MD 9 ist das Modell für Menschen, die auf kleinem Raum nichts vermissen möchten.",
   ["Großzügiges Wohnzimmer", "Bequemes Loft", "Markante Fassade aus Metall und Holz", "Zuhause, Ferienhaus oder Büro"], "2"),
]

LINES = [
  ("Fahrgestell", "Profilstahl, Anhänger Klasse O2", "Verzinkter Stahl oder Profilstahl", "Verzinkter Stahl oder Profilstahl"),
  ("Dämmung", "10 cm Steinwolle", "10 cm Steinwolle (Izocam)", "10 cm Steinwolle (Izocam)"),
  ("Feuchteschutz", "–", "Onduline-Feuchtigkeitssperre", "Onduline-Feuchtigkeitssperre"),
  ("Dach", "Onduline oder Stehfalzblech", "Onduline oder Stehfalzblech", "Onduline oder Stehfalzblech"),
  ("Fassade", "Thermowood oder Stehfalz", "Thermowood, Stehfalz oder Verbundplatte", "Thermowood, Stehfalz oder Verbundplatte"),
  ("Innenwände", "Sperrholz mit Tapete", "Sperrholz, Tapete oder AGT-Paneel", "Marine-Sperrholz, Tapete oder AGT-Paneel"),
  ("Boden", "8 mm Laminat", "8 mm AGT-Laminat", "8 oder 12 mm AGT-Laminat"),
  ("Fenster, Türen", "PVC", "PVC", "PVC oder Aluminium"),
  ("Elektro", "Schalter, Steckdosen, LED", "Halogenfrei, Viko", "Halogenfrei, Viko, LED Philips / Samsung"),
  ("Sanitär", "Armaturen, Dusche, Wand-WC", "Hochwertigere Armaturen und Keramik", "Grohe-Armaturen, Vitra-Keramik"),
  ("Küche", "Arbeitsplatte, Spüle", "Massivholz-Arbeitsplatte, lackierte Fronten", "Massivholz, lackierte oder Membranfronten"),
  ("Geräte", "–", "Beko: Kühlschrank, Wasch-, Spülmaschine, TV, E-Herd", "Bosch: Kühlschrank, Wasch-, Spülmaschine, TV, E-Herd"),
  ("Klima", "Vorinstallation", "Mitsubishi Electric oder York", "Mitsubishi Electric oder York"),
  ("Extra", "–", "–", "Dekorativer Pelletofen"),
]

ICONS = {
 "freedom": '<path d="M4 20 L12 6 L20 20 M8 14 h8"/><circle cx="18" cy="5" r="2"/>',
 "time": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
 "money": '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>',
 "leaf": '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>',
 "home": '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 "move": '<rect x="2" y="8" width="13" height="8" rx="1"/><path d="M15 11h4l3 3v2h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
 "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 "tree": '<path d="M12 3 5 13h4l-3 5h12l-3-5h4z"/><path d="M12 18v3"/>',
 "wind": '<path d="M3 9h12a3 3 0 1 0-3-3M3 15h16a3 3 0 1 1-3 3"/>',
}
def icon(k, size=34):
    return f'<svg class="ic" viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</svg>'

def img(k, cls=""):
    return f'<img class="{cls}" src="img/{k}.jpg" alt="">'

pages = []
def page(inner, cls="", folio=True, section=""):
    n = len(pages) + 1
    run = f'<div class="run"><span>MODUNERA</span><span>{e(section)}</span></div>' if section else ""
    fol = f'<div class="folio">{n:02d}</div>' if folio else ""
    pages.append(f'<section class="page {cls}">{run}{inner}{fol}</section>')

LOGO_W = '<img class="logo" src="img/modunera-master-logo-mountain-v1-white-600.png" alt="MODUNERA">'
LOGO = '<img class="logo" src="img/modunera-master-logo-mountain-v1-900.png" alt="MODUNERA">'

# 1 cover
page(f'''{img("cover","bleed")}<div class="veil v-bottom"></div>
<div class="cover-top">{LOGO_W}<span class="claim">Design Your Nature</span></div>
<div class="cover-txt"><p class="kicker light">Tiny Houses · Katalog 2026</p><h1>Weniger Haus.<br><em>Mehr Leben.</em></h1></div>
<p class="vis light">Visualisierung</p>''', "dark", folio=False)

# 2 contents
toc = [("01", "Warum Tiny House", "Was Menschen suchen – und finden"), ("02", "Natur und Gesundheit", "Wald, Licht, frische Luft"),
       ("03", "Rechnen Sie nach", "Kosten, Wert und Ertrag"), ("04", "Warum Deutschland", "Zahlen, Trends und Regeln"),
       ("05", "MODUNERA", "Wer wir sind und wie wir bauen"), ("06", "Die Modelle", "MD 1 bis MD 9 und Sonderanfertigungen"),
       ("07", "Ausstattung", "Linien, Marken, Extras"), ("08", "Ihr Weg zum Tiny House", "Ablauf, Fragen, Kontakt")]
page(f'''<div class="toc-wrap"><div><p class="kicker">Inhalt</p><h2 class="serif xl">Ein Haus,<br>das zum Leben passt.</h2>
<p class="body lead-in">Dieser Katalog erzählt nicht nur von unseren Häusern. Er erzählt davon, warum immer mehr Menschen kleiner wohnen wollen – und was sie dafür gewinnen.</p></div>
<ol class="toc">{"".join(f'<li><b>{a}</b><span>{e(b)}<small>{e(c)}</small></span></li>' for a,b,c in toc)}</ol></div>''', "cream")

# 3 editorial
page(f'''<div class="ed">{img("in3","ed-img")}<div class="ed-txt"><p class="kicker">Editorial</p><h2 class="serif">Eine neue Art zu wohnen</h2>
<p class="body drop">Wir haben uns daran gewöhnt, dass ein Zuhause groß sein muss. Dass man dreißig Jahre dafür bezahlt. Dass man Zimmer heizt, die niemand betritt, und Dinge lagert, die niemand braucht.</p>
<p class="body">Ein Tiny House stellt eine einfache Frage: Wie viel Raum brauchen Sie wirklich, um gut zu leben? Die Antwort überrascht viele – sie ist kleiner, als man denkt. Was man dafür bekommt, ist größer: Zeit, Freiheit, Nähe zur Natur und finanzielle Luft.</p>
<p class="body">Seit 2017 bauen wir Häuser für genau diese Antwort. Auf den folgenden Seiten zeigen wir, warum.</p><p class="sig">Ihr MODUNERA Team</p></div></div>''', section="Editorial")

# 01 opener
def opener(no, title, sub, bg):
    page(f'''{img(bg,"bleed")}<div class="veil v-left"></div><div class="op"><span class="op-no">{no}</span><h2 class="serif op-h">{title}</h2><p class="op-sub">{e(sub)}</p></div><p class="vis light">Visualisierung</p>''', "dark", folio=False)

opener("01", "Warum<br>Tiny House?", "Was Menschen suchen – und finden.", "in1")
reasons = [("freedom", "Freiheit", "Wohnen, wo man leben will: am Waldrand, am See, im Garten der Eltern. Das Haus passt sich dem Leben an, nicht umgekehrt."),
           ("time", "Zeit", "Weniger Fläche heißt weniger putzen, weniger reparieren, weniger verwalten. Gewonnen werden Abende und Wochenenden."),
           ("money", "Finanzielle Luft", "Ein Bruchteil der Kosten eines Einfamilienhauses – ohne jahrzehntelangen Kredit. Geld bleibt für das, was zählt."),
           ("leaf", "Nachhaltigkeit", "Weniger Material, weniger Fläche zu heizen, auf Wunsch Solarstrom vom eigenen Dach."),
           ("tree", "Natur", "Große Fenster und Terrassen machen den Garten zum Wohnzimmer. Man lebt mit den Jahreszeiten."),
           ("home", "Bewusst leben", "Nur behalten, was man liebt. Viele Bewohner beschreiben genau das als größten Gewinn.")]
page(f'''<p class="kicker">01 · Warum Tiny House</p><h2 class="serif">Sechs Gründe, kleiner zu wohnen</h2>
<div class="reasons">{"".join(f'<div class="rs">{icon(i)}<h3>{e(h)}</h3><p>{e(t)}</p></div>' for i,h,t in reasons)}</div>''', section="Warum Tiny House")
page(f'''<div class="split">{img("in4","split-img")}<div class="split-txt"><p class="kicker">01 · Was Menschen sich wünschen</p><h2 class="serif">Jeder Vierte kann es sich vorstellen</h2>
<div class="stat-row"><div class="stat"><b>23 %</b><span>der Deutschen interessieren sich für ein Tiny House.<small>YouGov für Interhyp, 2021, n = 2.089</small></span></div>
<div class="stat"><b>34 %</b><span>der Studierenden finden Tiny Houses interessant.<small>Civey für DEVK, 2022</small></span></div>
<div class="stat"><b>58 %</b><span>der Tiny-House-Käufer wollen dauerhaft darin wohnen, 42 % nutzen es als Wochenend- oder Ferienhaus.<small>Marktstudie, Befragung von 24 Herstellern</small></span></div></div>
<blockquote>„Nicht das Haus wird kleiner. Das Leben wird größer.“</blockquote></div></div>''', section="Warum Tiny House")

# 02 nature
opener("02", "Natur und<br>Gesundheit", "Wald, Licht und frische Luft – mitten im Alltag.", "sp-a")
page(f'''<p class="kicker">02 · Natur und Gesundheit</p><h2 class="serif">Ein Drittel Deutschlands ist Wald</h2>
<div class="nat"><div class="bigfig"><b>32 %</b><span>der Landesfläche – 11,5 Millionen Hektar – sind bewaldet.<small>Bundeswaldinventur 2022</small></span></div>
<div class="body col2"><p>Bäume spenden Sauerstoff, filtern Staub aus der Luft, kühlen im Sommer und dämpfen Lärm. Wer am Waldrand oder im Grünen wohnt, spürt das jeden Tag: Die Luft ist frischer, die Nächte sind ruhiger.</p>
<p>Die Forschung bestätigt, was viele fühlen. Eine Meta-Analyse mehrerer Studien zum „Waldbaden“ fand nach Aufenthalten im Wald niedrigere Werte des Stresshormons Cortisol als in der Stadt (Antonelli et al., 2019). Die Effekte sind kurzfristig und werden weiter erforscht – aber die Richtung ist klar: Natur tut uns gut.</p>
<p>Ein Tiny House bringt diese Nähe in den Alltag. Raumhohe Fenster, Terrassen und ein Grundriss, der nach draußen offen ist, machen den Garten zum größten Zimmer des Hauses.</p></div></div>
<div class="icons3"><div>{icon("tree",40)}<b>Frische Luft</b><span>Bäume filtern Staub und spenden Sauerstoff</span></div><div>{icon("sun",40)}<b>Tageslicht</b><span>Große Glasflächen in jedem Modell</span></div><div>{icon("wind",40)}<b>Ruhe</b><span>Steinwolle dämmt Wärme und Schall</span></div></div>''', section="Natur und Gesundheit")
page(f'''<div class="mosaic">{img("in2","m1")}{img("md4-a","m2")}{img("md6-b","m3")}</div><div class="mos-cap"><h2 class="serif">Leben mit den Jahreszeiten</h2><p class="body">Morgens Kaffee auf der Terrasse, im Winter warme Füße dank Fußbodenheizung und abends der Blick in den Himmel durch das Dachfenster des Lofts. Ein Tiny House ist für vier Jahreszeiten gebaut – und dafür, sie zu erleben.</p></div><p class="vis">Visualisierungen</p>''', section="Natur und Gesundheit")

# 03 finance
opener("03", "Rechnen<br>Sie nach", "Kosten, Wert und Ertrag – ehrlich gerechnet.", "md2-a")
bars = [("Einfamilienhaus, 140 m²<br><small>nur Baukosten, ohne Grundstück</small>", 364, 532, "364.000 – 532.000 €"), ("MODUNERA Tiny House<br><small>ab Werk, Basisausstattung</small>", 43, 55, "ab 42.900 €")]
barhtml = "".join(f'<div class="bar"><div class="bl">{l}</div><div class="bt"><div class="bf" style="width:{lo/532*100:.1f}%"></div><div class="br" style="width:{(hi-lo)/532*100:.1f}%"></div></div><div class="bv">{v}</div></div>' for l,lo,hi,v in bars)
page(f'''<p class="kicker">03 · Rechnen Sie nach</p><h2 class="serif">Ein Bruchteil der Kosten</h2>
<div class="bars">{barhtml}</div><p class="note">Einfamilienhaus: 140 m² × 2.600–3.800 € Baukosten pro m² Wohnfläche ohne Grundstück (Spanne aus Bausparkassen- und Bankenangaben 2024/2025). Tiny House: Basisausstattung ab Werk; Lieferung, Aufstellung, Anschlüsse und Grundstück kommen hinzu.</p>
<div class="fin3"><div><b>+37 %</b><span>Baupreisindex für Wohngebäude seit 2021<small>Destatis, Q1 2026 (2021 = 100)</small></span></div><div><b>+4,5 %</b><span>Angebotsmieten 2025 im Jahresverlauf<small>IfW Kiel / GREIX</small></span></div><div><b>12 %</b><span>der Menschen in Deutschland geben über 40 % ihres Einkommens fürs Wohnen aus<small>EU-SILC 2024</small></span></div></div>''', section="Rechnen Sie nach")
page(f'''<div class="split rev"><div class="split-txt"><p class="kicker">03 · Ihr Haus arbeitet mit</p><h2 class="serif">Wohnen, vermieten, verdienen</h2>
<p class="body">Ein Tiny House kann mehr als Zuhause sein. Als Ferienhaus, Gästehaus oder in einem Feriendorf erwirtschaftet es Einnahmen – in einem Markt, der wächst: 2025 zählten Campingplätze in Deutschland 44,7 Millionen Übernachtungen, so viele wie nie zuvor (Destatis).</p>
<div class="calc"><p class="calc-h">Rechenbeispiel Ferienvermietung</p><table><tr><td>Preis pro Nacht</td><td>90 €</td></tr><tr><td>Belegte Nächte pro Jahr</td><td>120</td></tr><tr class="sum"><td>Umsatz pro Jahr</td><td>10.800 €</td></tr></table>
<p class="calc-n">Beispiel mit angenommenen Werten, keine Prognose. Auslastung, Preise, Kosten, Steuern und Genehmigung hängen vom Standort ab.</p></div>
<p class="body">Dazu kommen niedrige laufende Kosten: Weniger Fläche heißt weniger Energie zum Heizen und Kühlen – mit Solaranlage und Speicher erzeugen Sie einen Teil Ihres Stroms selbst.</p></div>{img("md4-c","split-img")}</div>''', section="Rechnen Sie nach")

# 04 germany
opener("04", "Warum<br>Deutschland", "Zahlen, Trends – und was Sie wissen müssen.", "md3-a")
page(f'''<p class="kicker">04 · Warum Deutschland</p><h2 class="serif">Das Land ist bereit für kleinere Häuser</h2>
<div class="de-grid"><div class="de"><b>49,5 m²</b><span>Wohnfläche pro Kopf – so viel wie nie. Die Wohnung wächst, der Haushalt schrumpft.<small>Destatis, Ende 2025</small></span></div>
<div class="de"><b>41 %</b><span>aller Haushalte sind Einpersonenhaushalte. Viele brauchen weniger Raum, als sie bezahlen.<small>Destatis</small></span></div>
<div class="de"><b>24 %</b><span>des Einkommens gehen im Schnitt für das Wohnen drauf.<small>Destatis, 2025</small></span></div>
<div class="de"><b>44,7 Mio.</b><span>Übernachtungen auf Campingplätzen 2025 – Rekord. Naturnahes Reisen boomt.<small>Destatis</small></span></div></div>
<div class="know"><h3>Was Sie wissen müssen</h3><p>Wer in Deutschland dauerhaft in einem Tiny House wohnt, braucht in aller Regel eine Baugenehmigung – auch auf Rädern. Ob und wo ein Tiny House zulässig ist, entscheidet das Bauamt nach Bebauungsplan und Landesbauordnung. Unser Rat: vor dem Grundstückskauf eine Bauvoranfrage stellen. Die technischen Unterlagen dafür liefern wir.</p></div>''', section="Warum Deutschland")
page(f'''<div class="split">{img("delivery","split-img")}<div class="split-txt"><p class="kicker">04 · Lieferung nach Deutschland</p><h2 class="serif">Seit 2019 auf deutschen Straßen</h2>
<p class="body">Unser erstes Haus ging 2019 nach Bremen. Seitdem liefern wir regelmäßig nach Deutschland: 2,55 m breit, als Anhänger straßentauglich, auf eigener Achse oder per Tieflader direkt zu Ihrem Grundstück.</p>
<ul class="ticks"><li>Fertig ausgebaut – mit Möbeln und Geräten</li><li>230-V-Elektroinstallation nach europäischer Norm</li><li>Anschlusspunkte für Strom, Wasser und Abwasser vor Ort vorbereitet</li><li>Anschluss durch einen örtlichen Fachbetrieb</li></ul></div></div>''', section="Warum Deutschland")

# 05 MODUNERA
opener("05", "MODUNERA", "Wer wir sind und wie wir bauen.", "md6-a")
page(f'''<div class="about"><div><p class="kicker">05 · Über uns</p><h2 class="serif">Aus Sakarya.<br>Für das Leben in Europa.</h2>
<p class="body">Seit 2017 entwerfen und bauen wir Tiny Houses und modulare Gebäude. Rahmen, Hülle, Innenausbau und Möbel entstehen in einer Fertigung – so bestimmen wir Qualität und Details selbst.</p>
<p class="body">In der Türkei haben wir ein Tiny-House-Dorf mit 190 Häusern realisiert. Diese Erfahrung bringen wir in jedes Projekt ein: vom einzelnen Haus bis zum Feriendorf mit Rezeption, Café und Gemeinschaftsgebäuden.</p></div>
<div class="facts">{"".join(f'<div><b>{a}</b><span>{e(b)}</span></div>' for a,b in [("2017","Gründung in Sakarya"),("2019","Erste Lieferung nach Deutschland"),("500+","Tiny Houses ausgeliefert"),("190","Häuser in unserem Tiny-House-Dorf")])}</div></div>''', section="MODUNERA")
legend = [("1","Fahrgestell","Feuerverzinkter Stahl, Knott-Komponenten, Klasse O2"),("2","Bodenaufbau","Stahlrahmen, 10 cm Steinwolle, AGT-Laminat"),("3","Küche","Massive Arbeitsplatte, lackierte Fronten"),
          ("4","Bad","Dusche, Wand-WC, Armaturen nach Ausstattungslinie"),("5","Loft","Schlafebene mit Treppe"),("6","Innenverkleidung","Sperrholz mit Tapete oder AGT-Paneel"),
          ("7","Fassade und Fenster","Thermowood, PVC-Profile mit Isolierglas"),("8","Glastür","Raumhoch, wärmegedämmt"),("9","Wanddämmung","10 cm Steinwolle"),("10","Dach","Stehfalzblech"),("11","Dachdämmung","Steinwolle, gedämmte Dachebene")]
page(f'''<p class="kicker">05 · Aufbau</p><h2 class="serif">Ein Tiny House, Teil für Teil</h2>
<div class="xp">{SVG_HOUSE}</div><ol class="legend">{"".join(f'<li><i>{a}</i><b>{e(b)}</b><span>{e(c)}</span></li>' for a,b,c in legend)}</ol><p class="vis">Schematische Darstellung, nicht maßstäblich</p>''', "xp-page", section="Aufbau")
page(f'''<div class="sec"><div class="sec-ill">{SVG_SECTION}</div><div><p class="kicker">05 · Wandaufbau</p><h2 class="serif">Vier Schichten für vier Jahreszeiten</h2>
<ol class="legend abc">{"".join(f'<li><i>{a}</i><b>{e(b)}</b><span>{e(c)}</span></li>' for a,b,c in [("A","Innenverkleidung","Sperrholz mit Tapete oder AGT-Paneel – warm, ruhig, pflegeleicht"),("B","Tragkonstruktion","Geschweißtes Stahlskelett, feuerverzinkt – die Fassade trägt nichts"),("C","Dämmung","10 cm Steinwolle – nicht brennbar, dämmt Wärme und Schall"),("D","Fassade","Thermowood, Stehfalzblech oder Verbundplatte – nach Standort gewählt")])}</ol>
<p class="body">Dazu: wärmegedämmte PVC-Fenster mit Isolierglas aus gehärtetem Glas, eine halogenfreie Elektroinstallation in flammhemmenden Kanälen und die Vorinstallation für Klimaanlage.</p></div></div>''', section="Aufbau")

# 06 models
opener("06", "Die<br>Modelle", "MD 1 bis MD 9 – und Häuser nach Maß.", "md7-a")
cards = "".join(f'<div class="mc">{img(k+"-a")}<b>{e(n)}</b><span>{e(lay)} · {e(ln)}</span></div>' for n,k,ln,lay,*_ in MODELS)
cards += f'<div class="mc">{img("sp-a")}<b>Spiegelhaus</b><span>Sonderanfertigung · 7–10 m</span></div><div class="mc">{img("bu-a")}<b>Bungalow</b><span>Ohne Räder · Wunschmaß</span></div><div class="mc">{img("in5")}<b>Projekte</b><span>Tiny-House-Dörfer und Resorts</span></div>'
page(f'''<p class="kicker">06 · Übersicht</p><h2 class="serif">Finden Sie Ihr Haus</h2><p class="body">Alle Modelle 2,55 m breit. Weitere Längen von 6 bis 10 m auf Anfrage.</p><div class="mgrid">{cards}</div><p class="vis">Visualisierungen</p>''', section="Die Modelle")
for i, (name, k, ln, lay, tag, quote, text, pts, pers) in enumerate(MODELS, 1):
    page(f'''{img(k+"-a","bleed")}<div class="veil v-bottom"></div><div class="mh"><span class="mh-no">{i:02d}</span><p class="kicker light">{e(tag)}</p><h2 class="mh-name">{e(name)}</h2><p class="mh-q">{e(quote)}</p></div><p class="vis light">Visualisierung</p>''', "dark", folio=False)
    page(f'''<div class="mg">{img(k+"-b","g1")}{img(k+"-c","g2")}<div class="g3"><p class="kicker">{e(name)}</p><p class="body">{e(text)}</p></div>{img(k+"-d","g4")}</div><p class="vis">Visualisierungen</p>''', section=name)
    page(f'''<div class="spec-pg2"><div class="planwrap">{img(k+"-p","plan")}<span class="pl-cap">Grundriss (Beispiel) – Anpassungen möglich</span></div>
<div class="spec2"><div><p class="kicker">{e(name)} · Daten</p><table class="mini"><tr><td>Länge</td><td>{e(ln)}</td></tr><tr><td>Breite</td><td>2,55 m</td></tr><tr><td>Grundriss</td><td>{e(lay)}</td></tr><tr><td>Personen</td><td>{e(pers)}</td></tr><tr><td>Konstruktion</td><td>Stahlskelett, feuerverzinkt</td></tr><tr><td>Dämmung</td><td>10 cm Steinwolle</td></tr></table></div>
<div><p class="kicker">Highlights</p><ul class="ticks">{"".join(f"<li>{e(p)}</li>" for p in pts)}</ul><p class="note">Ausstattung nach Linie Standard, Standard Plus oder Premium – siehe Kapitel 07.</p></div></div></div>''', section=name)

# specials
page(f'''{img("sp-a","bleed")}<div class="veil v-bottom"></div><div class="mh"><span class="mh-no">S1</span><p class="kicker light">Sonderanfertigung</p><h2 class="mh-name">Spiegelhaus</h2><p class="mh-q">Von außen ein Spiegel. Von innen mitten in der Natur.</p></div><p class="vis light">Visualisierung</p>''', "dark", folio=False)
page(f'''<div class="spec-pg">{img("sp-b","planphoto")}<div class="spec"><p class="kicker">Spiegelhaus · Daten</p><p class="body">Verspiegelte Verglasung auf drei Seiten lässt das Haus in der Landschaft verschwinden – innen sitzt man mitten im Grünen. Als besonderes Zuhause oder als Hotelzimmer mit Wow-Effekt.</p>
<table><tr><td>Länge</td><td>7, 8, 9 oder 10 m</td></tr><tr><td>Breite</td><td>3,30 m (Sondertransport)</td></tr><tr><td>Konstruktion</td><td>Verzinktes Stahlskelett</td></tr><tr><td>Fassade</td><td>Silberglas, dreiseitig</td></tr><tr><td>Innenwände</td><td>Bordex- oder AGT-Paneel</td></tr></table></div></div><p class="vis">Visualisierung</p>''', section="Spiegelhaus")
page(f'''{img("bu-a","bleed")}<div class="veil v-bottom"></div><div class="mh"><span class="mh-no">S2</span><p class="kicker light">Ohne Räder, in Wunschmaßen</p><h2 class="mh-name">Bungalow</h2><p class="mh-q">Minimalistisch leben – auf einer Ebene.</p></div><p class="vis light">Visualisierung</p>''', "dark", folio=False)
page(f'''<div class="mg">{img("bu-b","g1")}{img("bu-c","g2")}<div class="g3"><p class="kicker">Bungalow · Daten</p><table class="mini"><tr><td>Maße</td><td>nach Wunsch</td></tr><tr><td>Konstruktion</td><td>Leicht- oder Schwerstahl, verzinkt</td></tr><tr><td>Dämmung</td><td>Mineralwolle oder PU-Schaum</td></tr><tr><td>Fassade</td><td>Thermowood oder Sandwichpaneel</td></tr></table></div>{img("bu-d","g4")}</div><p class="vis">Visualisierungen</p>''', section="Bungalow")
page(f'''<div class="split">{img("in5","split-img")}<div class="split-txt"><p class="kicker">Projekte</p><h2 class="serif">Vom Einzelhaus zum Tiny-House-Dorf</h2>
<p class="body">Wir planen und liefern ganze Anlagen – Ferienhäuser, Rezeption, Shops, Café und Gemeinschaftsgebäude in Modulbauweise. Mit einheitlicher Qualität und einem Ansprechpartner. In der Türkei haben wir so ein Dorf mit 190 Häusern umgesetzt.</p>
<ul class="ticks"><li>Konzept und Lageplan gemeinsam mit Ihnen</li><li>Mehrere Haustypen mit Auswahl für Käufer und Investoren</li><li>Schlüsselfertig mit Möbeln, Geräten und Lieferung</li><li>Außenanlagen gemeinsam mit regionalen Partnern</li></ul></div></div><p class="vis">Visualisierung</p>''', section="Projekte")

# 07 equipment
opener("07", "Ausstattung", "Drei Linien. Bekannte Marken. Viele Extras.", "md5-b")
rows = "".join(f"<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td><td>{e(d)}</td></tr>" for a,b,c,d in LINES)
page(f'''<p class="kicker">07 · Ausstattungslinien</p><h2 class="serif">Standard · Standard Plus · Premium</h2><table class="lines"><thead><tr><th></th><th>Standard</th><th>Standard Plus</th><th class="pr">Premium</th></tr></thead><tbody>{rows}</tbody></table><p class="note">„oder gleichwertig“: Bei Lieferengpässen setzen wir gleichwertige Produkte ein.</p>''', section="Ausstattung")
extras = [("sun","Solaranlage mit Speicher","Module auf dem Dach, Batteriespeicher für die Nacht – Strom vom eigenen Haus."),("home","Fußbodenheizung","Warme Böden an den kältesten Tagen, effizient und sparsam."),
          ("leaf","Grauwasser und Aufbereitung","Sammeln oder biologisch aufbereiten – Nutzung vor Ort nach Abstimmung mit der Behörde."),("wind","Frischwassertank","Für Standorte ohne Leitung oder als Reserve."),
          ("time","Smart Home","Licht, Heizung und Klima per App steuern."),("move","Satelliten-TV und Internet","Mit Setcom überall verbunden.")]
page(f'''<p class="kicker">07 · Extras</p><h2 class="serif">Extras, die das Leben leichter machen</h2><div class="reasons">{"".join(f'<div class="rs">{icon(i)}<h3>{e(h)}</h3><p>{e(t)}</p></div>' for i,h,t in extras)}</div><div class="strip">{img("md7-c")}{img("md6-c")}{img("md2-c")}</div><p class="vis">Visualisierungen</p>''', section="Ausstattung")

# 08 journey
opener("08", "Ihr Weg zum<br>Tiny House", "Von der ersten Frage bis zur Schlüsselübergabe.", "md1-d")
steps = ["Modell wählen und Kontakt aufnehmen","Preisangebot erhalten","Angebot annehmen","Technische Abstimmung","Design und Ausstattung festlegen","Anzahlung 60 %","Produktion","Fertigstellung und Lieferung","Restzahlung","Übergabe"]
page(f'''<p class="kicker">08 · Ablauf</p><h2 class="serif">In zehn Schritten zu Ihrem Haus</h2><ol class="road">{"".join(f'<li><b>{i:02d}</b><span>{e(s)}</span></li>' for i,s in enumerate(steps,1))}</ol><div class="strip two">{img("delivery")}{img("md4-a")}</div>''', section="Ihr Weg")
faq = [("Erstellen Sie individuelle Designs?","Ja. Grundriss, Länge von 6 bis 10 m, Materialien und Ausstattung planen wir nach Ihren Wünschen."),
       ("Wie wird geliefert?","Nach Deutschland per Lkw – auf eigener Achse oder auf dem Tieflader – mit unseren Logistikpartnern."),
       ("Wie werden Strom und Wasser angeschlossen?","Über Netz, Solaranlage oder Generator; Wasser über Leitung oder Tank. Der Anschluss erfolgt durch einen örtlichen Fachbetrieb."),
       ("Und das Abwasser?","Kanal, Sammelgrube oder unsere optionale Aufbereitung – welche Lösung zulässig ist, klärt die Behörde."),
       ("Brauche ich eine Baugenehmigung?","Für dauerhaftes Wohnen in Deutschland in aller Regel ja – auch auf Rädern. Wir liefern die technischen Unterlagen."),
       ("Bauen Sie auch ohne Räder?","Ja, als Bungalow oder Modul auf Fundament, in jeder Größe."),
       ("Kann ich die Produktion besuchen?","Gern, Montag bis Samstag 9–18 Uhr nach Vereinbarung."),
       ("Bauen Sie ganze Anlagen?","Ja – vom Einzelhaus bis zum Tiny-House-Dorf mit Gemeinschaftsgebäuden.")]
page(f'''<p class="kicker">08 · Fragen</p><h2 class="serif">Häufig gestellte Fragen</h2><div class="faq">{"".join(f'<div><h3>{e(q)}</h3><p>{e(a)}</p></div>' for q,a in faq)}</div>''', section="Ihr Weg")
src = ["Destatis: Wohnungsbestand und Wohnfläche pro Kopf, Ende 2025","Destatis: Haushalte und Familien, Anteil Einpersonenhaushalte","Destatis / EU-SILC: Wohnkostenbelastung 2024 und 2025","Destatis: Baupreisindex für Wohngebäude, Q1 2026","Destatis: Übernachtungen auf Campingplätzen 2025","IfW Kiel / GREIX Mietpreisindex 2025","Thünen-Institut: Bundeswaldinventur 2022","YouGov im Auftrag von Interhyp, Oktober 2021","Civey im Auftrag der DEVK, Mai 2022","Antonelli et al. (2019): Effects of forest bathing on cortisol levels, Int. J. Biometeorol.","Baukosten Einfamilienhaus: Angaben von Bausparkassen und Banken 2024/2025"]
page(f'''<p class="kicker">Quellen</p><h2 class="serif">Woher unsere Zahlen kommen</h2><ol class="src">{"".join(f"<li>{e(s)}</li>" for s in src)}</ol>
<p class="note">Abbildungen der Modelle sind Visualisierungen. Ausstattung, Maße und Preise können sich ändern; verbindlich ist allein das schriftliche Angebot. Angaben zu Unternehmen: 500+ ausgelieferte Häuser und das Tiny-House-Dorf mit 190 Häusern nach eigenen Angaben.</p>''', "cream", section="Quellen")

# back cover
page(f'''{img("bu-a","bleed")}<div class="veil v-full"></div><div class="back">{LOGO_W}<span class="claim">Design Your Nature</span>
<h2 class="serif">Lassen Sie uns über<br>Ihr Haus sprechen.</h2>
<p>E-Mail · emre@modunera.com<br>Telefon und WhatsApp · +90 553 543 5342<br>modunera.com</p>
<p class="addr">MC TİNY HOUSE ÜRETİM VE DIŞ TİCARET LTD. ŞTİ. · Yeşiltepe Mah. 8036 Sk. No: 3A · Erenler / Sakarya · Türkei</p></div>''', "dark", folio=False)

FONTS = (K / "fonts.css").read_text()
CSS = FONTS + '''
@font-face{font-family:Claim;src:url(fonts/caveat-claim-600.woff2)format("woff2")}
@page{size:250mm 250mm;margin:0}
:root{--forest:#1d2b22;--moss:#3A5A40;--sage:#A3B18A;--cream:#f4f0e8;--sand:#e8e0cf;--roof:#97311A;--ink:#26332a;--mute:#6b7568}
*{box-sizing:border-box}html,body{margin:0}body{font-family:Inter,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.55;-webkit-font-smoothing:antialiased}
.page{width:250mm;height:250mm;position:relative;overflow:hidden;padding:24mm 20mm 20mm;page-break-after:always;background:#fbf9f4}
.page.cream{background:var(--cream)}.page.dark{padding:0;background:var(--forest);color:#fff}
.run{position:absolute;top:9mm;left:20mm;right:20mm;display:flex;justify-content:space-between;font-size:6.8pt;letter-spacing:.22em;text-transform:uppercase;color:var(--mute)}
.folio{position:absolute;bottom:9mm;right:20mm;font-family:Fraunces,serif;font-size:10pt;color:var(--mute)}
.bleed{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.veil{position:absolute;inset:0}.v-bottom{background:linear-gradient(180deg,rgba(18,28,22,.35) 0%,rgba(18,28,22,0) 30%,rgba(18,28,22,0) 50%,rgba(18,28,22,.85) 100%)}
.v-left{background:linear-gradient(90deg,rgba(18,28,22,.86) 0%,rgba(18,28,22,.45) 45%,rgba(18,28,22,0) 75%)}.v-full{background:rgba(18,28,22,.72)}
.vis{position:absolute;bottom:9mm;left:20mm;font-size:6.2pt;letter-spacing:.08em;color:var(--mute);margin:0}.vis.light{color:rgba(255,255,255,.7)}
.logo{height:11mm}.claim{font-family:Claim,cursive;font-size:17pt;color:#efe8d8;margin-left:4mm}
.cover-top{position:absolute;top:16mm;left:18mm;display:flex;align-items:center}
.cover-txt{position:absolute;left:18mm;bottom:26mm;right:18mm}
h1{font-family:Fraunces,serif;font-weight:500;font-size:62pt;line-height:.98;margin:3mm 0 0;letter-spacing:-.01em}h1 em{font-style:italic;font-weight:300;color:#e9dfc9}
.kicker{font-size:7.2pt;letter-spacing:.24em;text-transform:uppercase;color:var(--roof);font-weight:600;margin:0 0 3mm}.kicker.light{color:#f0c9b8}
.serif{font-family:Fraunces,serif;font-weight:500;letter-spacing:-.005em}
h2.serif{font-size:27pt;line-height:1.08;margin:0 0 7mm;color:var(--forest)}h2.xl{font-size:34pt}
.body{font-size:9.6pt;line-height:1.62;margin:0 0 3.5mm;color:#36433a}.lead-in{font-size:11.5pt;line-height:1.55;max-width:95mm}
.note{font-size:7pt;color:var(--mute);line-height:1.5;margin-top:4mm}
.toc-wrap{display:grid;grid-template-columns:1fr 1fr;gap:12mm;height:100%;align-items:center}
.toc{list-style:none;padding:0;margin:0}.toc li{display:flex;gap:6mm;padding:3.6mm 0;border-bottom:1px solid #d9d1bf}.toc b{font-family:Fraunces,serif;font-weight:300;font-size:20pt;color:var(--roof);width:13mm;line-height:1}
.toc span{font-family:Fraunces,serif;font-size:12.5pt;color:var(--forest)}.toc small{display:block;font-family:Inter,sans-serif;font-size:7.6pt;color:var(--mute)}
.ed{display:grid;grid-template-columns:92mm 1fr;gap:10mm;height:100%}.ed-img{width:100%;height:206mm;object-fit:cover;border-radius:1mm}
.ed-txt{padding-top:6mm}.drop::first-letter{font-family:Fraunces,serif;float:left;font-size:44pt;line-height:.85;padding:1mm 2mm 0 0;color:var(--moss)}.sig{font-family:Claim,cursive;font-size:18pt;color:var(--moss)}
.op{position:absolute;left:20mm;bottom:26mm;width:150mm}.op-no{font-family:Fraunces,serif;font-weight:300;font-size:96pt;line-height:.8;color:rgba(255,255,255,.9);display:block}
.op-h{font-size:46pt !important;line-height:1;margin:5mm 0 4mm !important;color:#fff !important}.op-sub{font-size:12pt;color:#e9e4d6;margin:0}
.reasons{display:grid;grid-template-columns:repeat(3,1fr);gap:9mm 8mm;margin-top:8mm}.rs .ic{color:var(--moss)}.rs h3{font-family:Fraunces,serif;font-weight:500;font-size:14pt;margin:3mm 0 2mm;color:var(--forest)}.rs p{margin:0;font-size:8.8pt;line-height:1.55;color:#4a5648}
.rs{border-top:1px solid #d9d1bf;padding-top:5mm}
.split{display:grid;grid-template-columns:1fr 1fr;gap:10mm;height:100%;align-items:center}.split.rev{grid-template-columns:1.1fr .9fr}
.split-img{width:100%;height:206mm;object-fit:cover;border-radius:1mm}
.stat-row{display:flex;flex-direction:column;gap:5mm}.stat{display:flex;gap:5mm;align-items:baseline;border-bottom:1px solid #ddd5c4;padding-bottom:4mm}
.stat b{font-family:Fraunces,serif;font-weight:300;font-size:34pt;color:var(--moss);min-width:30mm;line-height:1}.stat span{font-size:8.8pt;color:#3c483f}.stat small,.bigfig small,.fin3 small,.de small{display:block;font-size:6.6pt;color:var(--mute);margin-top:1.2mm;letter-spacing:.02em}
blockquote{font-family:Fraunces,serif;font-style:italic;font-weight:300;font-size:15pt;line-height:1.35;color:var(--roof);margin:7mm 0 0;padding-left:5mm;border-left:2px solid var(--roof)}
.nat{display:grid;grid-template-columns:62mm 1fr;gap:10mm}.bigfig b{display:block;font-family:Fraunces,serif;font-weight:300;font-size:72pt;line-height:.9;color:var(--moss)}.bigfig span{font-size:9pt}
.col2{columns:2;column-gap:7mm}.col2 p{margin:0 0 3mm;font-size:8.9pt}
.icons3{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin-top:9mm;padding-top:7mm;border-top:1px solid #d9d1bf}.icons3 div{color:var(--moss)}.icons3 b{display:block;font-family:Fraunces,serif;font-weight:500;font-size:13pt;color:var(--forest);margin-top:2mm}.icons3 span{font-size:8.4pt;color:#4a5648}
.mosaic{display:grid;grid-template-columns:1.3fr 1fr;grid-template-rows:84mm 66mm;gap:4mm}.mosaic img{width:100%;height:100%;object-fit:cover;border-radius:1mm}.m1{grid-row:1 / span 2}
.mos-cap{display:grid;grid-template-columns:1fr 1.3fr;gap:8mm;margin-top:7mm}.mos-cap h2{font-size:20pt !important;margin:0 !important}
.bars{margin-top:6mm}.bar{display:grid;grid-template-columns:55mm 1fr 38mm;gap:5mm;align-items:center;margin:0 0 7mm}.bl{font-family:Fraunces,serif;font-size:12pt;color:var(--forest);line-height:1.2}.bl small{font-family:Inter;font-size:7pt;color:var(--mute)}
.bt{height:13mm;background:#ece5d6;border-radius:1mm;display:flex;overflow:hidden}.bf{background:var(--moss)}.br{background:repeating-linear-gradient(45deg,var(--sage),var(--sage) 3px,#c3cdb2 3px,#c3cdb2 6px)}
.bv{font-family:Fraunces,serif;font-size:14pt;color:var(--forest)}
.fin3{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm;margin-top:9mm}.fin3 div{background:var(--forest);color:#fff;padding:7mm 6mm;border-radius:1mm}.fin3 b{display:block;font-family:Fraunces,serif;font-weight:300;font-size:30pt;line-height:1;color:#e9dfc9;margin-bottom:3mm}.fin3 span{font-size:8.4pt;color:#dfe4dc}.fin3 small{color:#a9b5a6}
.calc{background:var(--cream);border-left:3px solid var(--roof);padding:5mm 6mm;margin:4mm 0 5mm}.calc-h{font-family:Fraunces,serif;font-size:12pt;margin:0 0 2mm;color:var(--forest)}.calc table{width:100%;border-collapse:collapse;font-size:9pt}.calc td{padding:1.4mm 0;border-bottom:1px solid #ddd3bf}.calc td:last-child{text-align:right;font-weight:600}
.calc tr.sum td{font-family:Fraunces,serif;font-size:13pt;color:var(--moss);border-bottom:0}.calc-n{font-size:6.8pt;color:var(--mute);margin:2mm 0 0}
.de-grid{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.de{background:#fff;border:1px solid #e3dbc9;padding:6mm;border-radius:1mm}.de b{display:block;font-family:Fraunces,serif;font-weight:300;font-size:30pt;color:var(--moss);line-height:1;margin-bottom:2mm}.de span{font-size:8.6pt}
.know{margin-top:7mm;background:var(--forest);color:#e7ebe4;padding:6mm 7mm;border-radius:1mm}.know h3{font-family:Fraunces,serif;font-weight:500;color:#fff;margin:0 0 2mm;font-size:13pt}.know p{margin:0;font-size:8.8pt;line-height:1.55}
.ticks{list-style:none;padding:0;margin:4mm 0}.ticks li{padding:1.6mm 0 1.6mm 7mm;position:relative;font-size:9pt;border-bottom:1px solid #e3dbc9}.ticks li:before{content:"";position:absolute;left:0;top:3.3mm;width:3.2mm;height:1.6mm;border-left:1.6px solid var(--moss);border-bottom:1.6px solid var(--moss);transform:rotate(-45deg)}
.about{display:grid;grid-template-columns:1.15fr 1fr;gap:12mm;height:100%;align-items:center}.facts{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.facts div{background:var(--forest);color:#fff;padding:8mm 6mm;border-radius:1mm}.facts b{display:block;font-family:Fraunces,serif;font-weight:300;font-size:34pt;line-height:1;color:#e9dfc9}.facts span{font-size:8.4pt;color:#d6ddd3}
.xp-page{background:#f3efe6}.xp{position:absolute;left:8mm;right:58mm;top:42mm;bottom:20mm}.xp svg{width:100%;height:100%}
.legend{position:absolute;right:14mm;top:44mm;width:50mm;list-style:none;padding:0;margin:0}.legend li{display:grid;grid-template-columns:7mm 1fr;column-gap:2mm;margin:0 0 3mm;font-size:7.4pt;line-height:1.35;color:#4a5648}
.legend i{grid-row:span 2;font-style:normal;width:6mm;height:6mm;border-radius:50%;background:var(--moss);color:#fff;font-size:7pt;font-weight:600;display:grid;place-items:center}.legend b{font-family:Fraunces,serif;font-weight:500;font-size:9.6pt;color:var(--forest)}
.legend.abc{position:static;width:auto;margin:5mm 0}.legend.abc i{background:var(--roof)}.legend.abc li{font-size:8.6pt;margin-bottom:4mm}.legend.abc b{font-size:11pt}
.sec{display:grid;grid-template-columns:1fr 1fr;gap:10mm;height:100%;align-items:center}.sec-ill svg{width:100%;height:auto}
.mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm 4mm;margin-top:5mm}.mc img{width:100%;height:30mm;object-fit:cover;border-radius:1mm}.mc b{display:block;font-family:Fraunces,serif;font-weight:500;font-size:12pt;color:var(--forest);margin-top:1.5mm}.mc span{font-size:7pt;color:var(--mute)}
.mh{position:absolute;left:20mm;right:20mm;bottom:24mm}.mh-no{position:absolute;right:0;bottom:-4mm;font-family:Fraunces,serif;font-weight:300;font-size:120pt;line-height:.8;color:rgba(255,255,255,.88)}
.mh-name{font-family:Fraunces,serif;font-weight:500;font-size:58pt;line-height:1;margin:1mm 0 3mm;color:#fff}.mh-q{font-family:Fraunces,serif;font-style:italic;font-weight:300;font-size:16pt;color:#efe8d8;margin:0;max-width:130mm}
.mg{display:grid;grid-template-columns:1.25fr 1fr;grid-template-rows:96mm 104mm;gap:5mm;height:205mm}.mg img{width:100%;height:100%;object-fit:cover;border-radius:1mm}.g1{grid-row:1}.g2{grid-row:1}.g3{grid-row:2;align-self:center;padding-right:4mm}.g4{grid-row:2}
.g3 .body{font-size:10.4pt;line-height:1.6}.mini{width:100%;border-collapse:collapse;font-size:8.8pt}.mini td{padding:1.8mm 0;border-bottom:1px solid #ddd5c4}.mini td:first-child{color:var(--mute);width:32%}
.spec-pg{display:grid;grid-template-columns:1.2fr 1fr;gap:9mm;height:205mm}.planwrap{background:var(--forest);border-radius:1mm;position:relative;display:flex;align-items:center;justify-content:center}.plan{width:100%;height:100%;object-fit:contain}
.spec-pg2{display:grid;grid-template-rows:118mm auto;gap:8mm;height:205mm}.spec-pg2 .planwrap{height:118mm}.spec2{display:grid;grid-template-columns:1fr 1fr;gap:10mm}
.planphoto{width:100%;height:205mm;object-fit:cover;border-radius:1mm}
.pl-cap{position:absolute;left:4mm;bottom:4mm;font-size:6.6pt;color:#dfe4dc;letter-spacing:.06em}
.spec table{width:100%;border-collapse:collapse;font-size:9pt;margin:2mm 0 5mm}.spec td{padding:2.1mm 0;border-bottom:1px solid #ddd5c4}.spec td:first-child{color:var(--mute);width:38%}
.spec h3{font-family:Fraunces,serif;font-weight:500;font-size:13pt;color:var(--forest);margin:4mm 0 0}
.lines{width:100%;border-collapse:collapse;font-size:7.2pt;line-height:1.35}.lines th{text-align:left;font-family:Fraunces,serif;font-weight:500;font-size:11pt;color:var(--forest);padding:2mm 2mm 3mm;border-bottom:2px solid var(--forest)}
.lines td{padding:1.7mm 2mm;border-bottom:1px solid #e3dbc9;vertical-align:top}.lines td:first-child{font-weight:600;color:var(--moss);width:17%}.lines td:nth-child(4),.lines th.pr{background:#efe9db}
.road{list-style:none;padding:0;margin:8mm 0 0;display:grid;grid-template-columns:repeat(2,1fr);gap:0 12mm;counter-reset:r}.road li{display:flex;gap:5mm;align-items:center;padding:4.2mm 0;border-bottom:1px solid #ddd5c4}
.road b{font-family:Fraunces,serif;font-weight:300;font-size:24pt;color:var(--roof);width:14mm;line-height:1}.road span{font-family:Fraunces,serif;font-size:12.5pt;color:var(--forest)}
.faq{display:grid;grid-template-columns:1fr 1fr;gap:5mm 10mm}.faq h3{font-family:Fraunces,serif;font-weight:500;font-size:11.5pt;color:var(--forest);margin:0 0 1.5mm}.faq p{margin:0;font-size:8.5pt;line-height:1.5;color:#4a5648}.faq div{border-top:1px solid #d9d1bf;padding-top:3.5mm}
.strip{position:absolute;left:20mm;right:20mm;bottom:20mm;height:72mm;display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.strip.two{grid-template-columns:1fr 1fr}.strip img{width:100%;height:100%;object-fit:cover;border-radius:1mm}
.src{font-size:8.6pt;line-height:1.7;padding-left:5mm;color:#3c483f}
.back{position:absolute;left:20mm;right:20mm;top:50%;transform:translateY(-50%);color:#fff}.back h2{font-size:34pt;line-height:1.08;margin:12mm 0 8mm;color:#fff}.back p{font-size:11pt;line-height:1.8;color:#e6e9e3}.back .addr{font-size:7.2pt;color:#b7c1b4;margin-top:10mm}
'''
doc = f'<!doctype html><html lang="de"><head><meta charset="utf-8"><title>MODUNERA Katalog 2026</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
(K / "katalog2.html").write_text(doc, encoding="utf-8")

async def pdf():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = await b.new_page()
        await pg.goto((K / "katalog2.html").as_uri(), wait_until="load")
        await pg.evaluate("document.fonts.ready")
        await pg.pdf(path=str(K / "MODUNERA-Katalog-2026.pdf"), width="250mm", height="250mm", print_background=True)
        await b.close()
asyncio.run(pdf())
print("pages", len(pages))
