from __future__ import annotations

import csv
import hashlib
import html
import json
import math
import os
import re
import shutil
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from datetime import date, timedelta
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

from citiespy import all_cities
from scipy.spatial import cKDTree

SITE = Path('/mnt/data/mc-tiny-site')
BASE_URL = 'https://modunera.com/'
TODAY = '2026-07-20'
PHONE_DISPLAY = '+90 553 543 5342'
PHONE_TEL = '+905535435342'
WA = '905535435342'

STATE_NAMES = {
    '01': 'Baden-Württemberg', '02': 'Bayern', '03': 'Bremen', '04': 'Hamburg',
    '05': 'Hessen', '06': 'Niedersachsen', '07': 'Nordrhein-Westfalen',
    '08': 'Rheinland-Pfalz', '09': 'Saarland', '10': 'Schleswig-Holstein',
    '11': 'Brandenburg', '12': 'Mecklenburg-Vorpommern', '13': 'Sachsen',
    '14': 'Sachsen-Anhalt', '15': 'Thüringen', '16': 'Berlin'
}

STATE_INTROS = {
    'Baden-Württemberg': 'Zwischen Schwarzwald, Oberrhein, Bodensee und verdichteten Wirtschaftsregionen treffen naturnahe Rückzugsorte auf eine starke Nachfrage nach hochwertigen, platzsparenden Wohn- und Arbeitslösungen.',
    'Bayern': 'Von den Alpen bis zu den fränkischen Landschaften bietet Bayern sehr unterschiedliche Standortprofile. Schneelast, Zufahrt, Geländeverlauf und saisonale Nutzung sollten deshalb früh zusammen betrachtet werden.',
    'Bremen': 'Im Stadtstaat Bremen stehen urbane Nachverdichtung, mobile Arbeitsräume und kompakte Gäste- oder Gewerbelösungen im Vordergrund. Grundstücks- und Nutzungsklärung bleiben standortbezogen.',
    'Hamburg': 'In Hamburg verbinden sich urbaner Flächendruck, maritime Witterung und hohe Designansprüche. Feuchte-, Wind- und Korrosionsschutz verdienen besondere Aufmerksamkeit.',
    'Hessen': 'Hessen verbindet zentrale Logistiklagen, Mittelgebirge und starke Metropolräume. Tiny Houses können hier vom Homeoffice bis zum touristischen Rückzugsort sehr unterschiedliche Funktionen übernehmen.',
    'Niedersachsen': 'Zwischen Nordseeküste, Heide, Weserbergland und Harz reichen die Anforderungen von Wind- und Feuchteschutz bis zu wintertauglicher Haustechnik und touristischer Nutzung.',
    'Nordrhein-Westfalen': 'In Nordrhein-Westfalen treffen dicht besiedelte Regionen auf ländliche Erholungsräume. Kompakte Büros, Gästehäuser, Ferienobjekte und flexible Gewerbekonzepte sind besonders relevante Einsatzfelder.',
    'Rheinland-Pfalz': 'Weinregionen, Mittelgebirge und touristische Landschaften schaffen Potenzial für Ferienhäuser, Glamping und private Rückzugsorte. Hanglage, Zufahrt und Erschließung sind früh zu prüfen.',
    'Saarland': 'Kurze Wege, grüne Randlagen und grenznahe Märkte machen das Saarland interessant für private wie gewerbliche Tiny-House-Projekte. Lokale Bau- und Grundstücksfragen sind vor Bestellung zu klären.',
    'Schleswig-Holstein': 'Zwischen Nord- und Ostsee stehen Wind, Schlagregen, salzhaltige Luft und touristische Nutzung im Fokus. Materialschutz, Lüftung und robuste Außenflächen sind zentrale Planungspunkte.',
    'Brandenburg': 'Seenlandschaften, ländliche Räume und die Nähe zu Berlin schaffen Chancen für Ferien-, Arbeits- und Wohnkonzepte. Sommerlicher Wärmeschutz und winterliche Effizienz sollten gemeinsam geplant werden.',
    'Mecklenburg-Vorpommern': 'Küste, Seenplatte und dünner besiedelte Regionen bieten starke Voraussetzungen für naturnahe Ferien- und Betreiberkonzepte. Wind, Feuchte und saisonale Auslastung prägen die Planung.',
    'Sachsen': 'Sachsen kombiniert urbane Zentren, Mittelgebirge und touristische Regionen. Ein ausgewogenes Konzept für Sommerhitze, Winterkälte, Zufahrt und Nutzung erhöht die Projektsicherheit.',
    'Sachsen-Anhalt': 'Ländliche Räume, Harzregion und zentrale Verkehrslagen eröffnen private und gewerbliche Einsatzfelder. Standortprüfung, Energieplanung und Transportlogistik sollten integriert erfolgen.',
    'Thüringen': 'Waldreiche Mittelgebirge und kompakte Städte machen Thüringen attraktiv für naturnahe Wohn-, Ferien- und Arbeitslösungen. Höhenlage und Winterbedingungen sind projektbezogen zu berücksichtigen.',
    'Berlin': 'In Berlin stehen urbane Flächenknappheit, temporäre Arbeitsräume, Showrooms und innovative Betreiberkonzepte im Vordergrund. Eine belastbare planungsrechtliche Einordnung ist besonders wichtig.'
}

STATE_SLUGS = {}

IMAGES = [
    'mc1-exterior.webp','mc1-living.webp','mc2-exterior.webp','mc2-kitchen.webp',
    'mc3-exterior.webp','mc3-living.webp','mc4-exterior.webp','mc4-bedroom.webp',
    'mc5-exterior.webp','mc5-interior.webp','mc6-exterior.webp','mc6-living.webp',
    'mc7-exterior.webp','mc7-interior.webp','mc8-exterior.webp','mc8-interior.webp',
    'hero-forest.webp','nature-pool.webp','interior-feature.webp'
]

MODELS = [
    {'id':'mc-1','name':'MC 1','length':'8,00 oder 9,70 m','layout':'1 Loft','positioning':'Panorama, Tageslicht und großzügiger Wohnbereich','image':'mc1-exterior.webp'},
    {'id':'mc-2','name':'MC 2','length':'9,00 m','layout':'2 Lofts','positioning':'Familien, Gäste und getrennte Schlafbereiche','image':'mc2-exterior.webp'},
    {'id':'mc-3','name':'MC 3','length':'8,00 oder 9,70 m','layout':'Loft + optionaler Raum','positioning':'Privatsphäre, Homeoffice und flexible Nutzung','image':'mc3-exterior.webp'},
    {'id':'mc-4','name':'MC 4','length':'8,00 oder 9,00 m','layout':'Loft, Zimmer und Veranda','positioning':'Ferienhaus, Vermietung und Außenleben','image':'mc4-exterior.webp'},
    {'id':'mc-5','name':'MC 5','length':'8,00 oder 9,00 m','layout':'Loft + optionaler Raum','positioning':'Urbanes Design mit warmen Naturmaterialien','image':'mc5-exterior.webp'},
    {'id':'mc-6','name':'MC 6','length':'8,00 oder 9,00 m','layout':'Chalet-Konzept','positioning':'Hohe Decken, Glasflächen und Naturerlebnis','image':'mc6-exterior.webp'},
    {'id':'mc-7','name':'MC 7','length':'8,00 m','layout':'1 Loft','positioning':'Studio, Büro und asymmetrische Architektur','image':'mc7-exterior.webp'},
    {'id':'mc-8','name':'MC 8','length':'8,00 m','layout':'1 Loft','positioning':'Kompakter Komfort und effizienter Stauraum','image':'mc8-exterior.webp'},
]

KEYWORD_PATTERNS = [
    ('Tiny House {place}', 'informational', 2),
    ('Tiny House kaufen {place}', 'transactional', 1),
    ('Tiny House Hersteller {place}', 'commercial', 1),
    ('Tiny House Preise {place}', 'commercial', 1),
    ('Tiny House auf Rädern {place}', 'commercial', 2),
    ('Mobiles Tiny House {place}', 'commercial', 2),
    ('Winterfestes Tiny House {place}', 'commercial', 2),
    ('Tiny House mit Loft {place}', 'commercial', 3),
    ('Tiny House für Airbnb {place}', 'transactional', 2),
    ('Tiny House Ferienhaus {place}', 'transactional', 2),
    ('Tiny House Garten {place}', 'informational', 3),
    ('Tiny House Lieferung {place}', 'transactional', 1),
    ('Tiny House Konfigurator {place}', 'transactional', 1),
    ('Tiny House aus der Türkei {place}', 'commercial', 2),
    ('Tiny House schlüsselfertig {place}', 'transactional', 1),
]

FAQ_CATEGORIES = {
    'kauf': 'Kauf & Angebot', 'planung': 'Planung & Grundriss', 'recht': 'Standort & Genehmigung',
    'technik': 'Technik & Materialien', 'energie': 'Energie & Winter', 'transport': 'Transport & Lieferung',
    'nachhaltigkeit': 'Nachhaltigkeit & Betrieb', 'business': 'Airbnb & Gewerbe', 'service': 'Produktion & Service',
    'modelle': 'Modelle & Ausstattung'
}

BLOG_TOPICS = [
    ('tiny-house-kaufen', 'Tiny House kaufen', 'Kaufprozess, Bedarfsanalyse und belastbare Angebotsprüfung', 'kauf'),
    ('tiny-house-preise', 'Tiny House Preise', 'Preisfaktoren, Gesamtkosten und Vergleichbarkeit von Angeboten', 'kauf'),
    ('tiny-house-grundstueck', 'Grundstück für ein Tiny House', 'Standortprüfung, Zufahrt, Erschließung und Nutzung', 'recht'),
    ('tiny-house-baugenehmigung', 'Tiny House Baugenehmigung', 'Frühe Abstimmung mit Behörden und vollständige Projektunterlagen', 'recht'),
    ('tiny-house-stellplatz', 'Tiny House Stellplatz', 'Untergrund, Rangierfläche, Anschlüsse und dauerhafte Nutzung', 'recht'),
    ('tiny-house-auf-raedern', 'Tiny House auf Rädern', 'Mobilität, Fahrgestell, Gewicht und Nutzungsgrenzen', 'transport'),
    ('tiny-house-transport', 'Tiny House Transport', 'Routenprüfung, Zufahrt, Entladung und Übergabe', 'transport'),
    ('tiny-house-import-tuerkei', 'Tiny House aus der Türkei importieren', 'Vertrag, Dokumentation, Logistik und Projektabgrenzung', 'transport'),
    ('tiny-house-winterfest', 'Winterfestes Tiny House', 'Dämmung, Wärmebrücken, Heizlast und Feuchteschutz', 'energie'),
    ('tiny-house-daemmung', 'Tiny House Dämmung', 'Materialwahl, Schichtaufbau und standortbezogene Auslegung', 'energie'),
    ('tiny-house-heizung', 'Tiny House Heizung', 'Wärmepumpe, Elektroheizung, Fußbodenheizung und Regelung', 'energie'),
    ('tiny-house-lueftung', 'Tiny House Lüftung', 'Luftqualität, Feuchteabfuhr und kontrollierter Betrieb', 'energie'),
    ('tiny-house-sommerhitze', 'Tiny House im Sommer', 'Verschattung, Glasflächen, Lüftung und Kühlung', 'energie'),
    ('tiny-house-solar', 'Tiny House mit Solaranlage', 'PV-Auslegung, Speicher und realistischer Eigenverbrauch', 'energie'),
    ('tiny-house-off-grid', 'Off-Grid Tiny House', 'Energie, Wasser, Abwasser und Betriebsreserven', 'energie'),
    ('tiny-house-strom', 'Stromversorgung im Tiny House', 'Anschlussleistung, Verbraucher und Sicherheitskonzept', 'technik'),
    ('tiny-house-wasser', 'Wasser im Tiny House', 'Frischwasser, Warmwasser, Tanks und Hygiene', 'technik'),
    ('tiny-house-abwasser', 'Abwasser beim Tiny House', 'Anschluss, Tanks, Entsorgung und Betreiberpflichten', 'technik'),
    ('tiny-house-stahlrahmen', 'Tiny House mit Stahlrahmen', 'Tragstruktur, Korrosionsschutz und Gewichtskontrolle', 'technik'),
    ('tiny-house-thermowood', 'Thermowood Fassade', 'Optik, Dauerhaftigkeit, Pflege und konstruktiver Holzschutz', 'technik'),
    ('tiny-house-fenster', 'Fenster im Tiny House', 'Tageslicht, Wärmeschutz, Sicherheit und Lüftung', 'technik'),
    ('tiny-house-brandschutz', 'Brandschutz im Tiny House', 'Materialien, Elektroinstallation und Fluchtwege', 'technik'),
    ('tiny-house-feuchteschutz', 'Feuchteschutz im Tiny House', 'Kondensation, Details, Lüftung und Nutzerverhalten', 'technik'),
    ('tiny-house-akustik', 'Akustik im Tiny House', 'Schallübertragung, Raumgefühl und Materialkonzept', 'technik'),
    ('tiny-house-loft', 'Tiny House mit Loft', 'Kopfhöhe, Treppe, Sicherheit und Stauraum', 'planung'),
    ('tiny-house-grundriss', 'Tiny House Grundriss', 'Wege, Sichtachsen, Privatsphäre und Mehrfachnutzung', 'planung'),
    ('tiny-house-kueche', 'Tiny House Küche', 'Arbeitsfläche, Stauraum, Geräte und Lüftung', 'planung'),
    ('tiny-house-bad', 'Tiny House Badezimmer', 'Dichtigkeit, Komfort, Lüftung und Wartung', 'planung'),
    ('tiny-house-stauraum', 'Stauraum im Tiny House', 'Einbaumöbel, Treppen, Sockel und flexible Flächen', 'planung'),
    ('tiny-house-familie', 'Tiny House für Familien', 'Schlafplätze, Rückzug, Alltag und Wachstum', 'planung'),
    ('tiny-house-senioren', 'Tiny House für Senioren', 'Barrierearme Wege, ebenerdiges Schlafen und Sicherheit', 'planung'),
    ('tiny-house-homeoffice', 'Tiny House als Homeoffice', 'Ergonomie, Technik, Akustik und Produktivität', 'business'),
    ('tiny-house-airbnb', 'Tiny House für Airbnb', 'Zielgruppe, Auslastung, Betrieb und Gästekomfort', 'business'),
    ('tiny-house-glamping', 'Tiny House für Glamping', 'Positionierung, Serienplanung und Betreiberprozesse', 'business'),
    ('tiny-house-ferienpark', 'Tiny House Ferienpark', 'Standortmasterplan, Einheitenmix und Betrieb', 'business'),
    ('tiny-house-gaestehaus', 'Tiny House als Gästehaus', 'Privatsphäre, Anschlüsse und flexible Nutzung', 'business'),
    ('tiny-house-gastronomie', 'Tiny House für Gastronomie und Retail', 'Pop-up, Verkaufsraum, Genehmigung und Kundenfluss', 'business'),
    ('tiny-house-rendite', 'Tiny House Rendite', 'Investitionskosten, Auslastung und konservative Kalkulation', 'business'),
    ('tiny-house-versicherung', 'Tiny House Versicherung', 'Risiken, Transport, Standort und Dokumentation', 'service'),
    ('tiny-house-finanzierung', 'Tiny House Finanzierung', 'Eigenkapital, Raten und Gesamtkosten', 'kauf'),
    ('tiny-house-wartung', 'Tiny House Wartung', 'Prüfintervalle, Fassade, Technik und Dichtungen', 'service'),
    ('tiny-house-reinigung', 'Tiny House Reinigung und Pflege', 'Materialgerechte Pflege und Werterhalt', 'service'),
    ('tiny-house-smart-home', 'Smart Home im Tiny House', 'Energieüberwachung, Sicherheit und Komfort', 'technik'),
    ('tiny-house-nachhaltigkeit', 'Nachhaltiges Tiny House', 'Flächeneffizienz, Materialwahl und Betrieb', 'nachhaltigkeit'),
    ('tiny-house-energieverbrauch', 'Tiny House Energieverbrauch', 'Nutzungsprofil, Klima und technische Effizienz', 'nachhaltigkeit'),
    ('tiny-house-scandinavian', 'Skandinavisches Tiny House', 'Licht, Materialruhe und funktionale Gestaltung', 'planung'),
    ('tiny-house-chalet', 'Tiny House im Chalet-Stil', 'Hohe Decken, Wärme und Naturbezug', 'planung'),
    ('tiny-house-modern', 'Modernes Tiny House', 'Klare Linien, große Verglasung und integrierte Technik', 'planung'),
    ('tiny-house-vs-wohnwagen', 'Tiny House oder Wohnwagen', 'Nutzung, Komfort, Mobilität und Kostenvergleich', 'kauf'),
    ('tiny-house-vs-modulhaus', 'Tiny House oder Modulhaus', 'Fläche, Transport, Standort und Erweiterbarkeit', 'kauf'),
]

@dataclass
class Place:
    name: str
    lat: float
    lng: float
    admin1: str
    admin2: str
    state: str
    state_slug: str
    slug: str
    path: str
    population: int | None = None
    nearby: list[int] | None = None


def slugify(value: str) -> str:
    value = value.replace('ß', 'ss').replace('Ä','Ae').replace('Ö','Oe').replace('Ü','Ue').replace('ä','ae').replace('ö','oe').replace('ü','ue')
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode('ascii').lower()
    value = re.sub(r'[^a-z0-9]+','-',value).strip('-')
    return value or 'ort'

for s in STATE_NAMES.values():
    STATE_SLUGS[s] = slugify(s)


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def haversine(lat1, lon1, lat2, lon2):
    p1,p2=math.radians(lat1),math.radians(lat2)
    dphi=math.radians(lat2-lat1); dl=math.radians(lon2-lon1)
    a=math.sin(dphi/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 6371*2*math.atan2(math.sqrt(a),math.sqrt(1-a))


def sphere_point(lat, lng):
    p=math.radians(lat); l=math.radians(lng)
    return (math.cos(p)*math.cos(l), math.cos(p)*math.sin(l), math.sin(p))


def climate_profile(p: Place) -> dict:
    if p.lat >= 53.0 or p.state in ('Schleswig-Holstein','Hamburg','Bremen','Mecklenburg-Vorpommern'):
        return {
            'label':'Nord- und Küstenprofil',
            'lead':'Wind, Schlagregen, hohe Luftfeuchte und gegebenenfalls salzhaltige Luft erfordern robuste Anschlussdetails und konsequenten Oberflächenschutz.',
            'points':['windstabile Aufstellung und standortbezogene Verankerung','korrosionsgeschützte Metallteile und kontrollierte Fassadenpflege','zuverlässige Lüftung für Feuchteabfuhr','geschützte Eingangssituation und langlebige Außenflächen']
        }
    if p.lat <= 49.2 or p.state in ('Bayern','Baden-Württemberg'):
        return {
            'label':'Süd- und Höhenlagenprofil',
            'lead':'Wintertemperaturen, mögliche Schneelasten und stärkere Tag-Nacht-Unterschiede machen eine abgestimmte Dämm-, Heiz- und Verschattungslösung besonders wichtig.',
            'points':['standortbezogene Prüfung von Schnee- und Windbeanspruchung','durchgängiger Wärmeschutz und minimierte Wärmebrücken','bedarfsgerechte Heizung mit effizienter Regelung','sommerlicher Wärmeschutz für große Glasflächen']
        }
    if p.lng >= 11.5:
        return {
            'label':'Kontinental geprägtes Profil',
            'lead':'Warme Sommer und kalte Winter verlangen ein ausgewogenes Konzept aus Verschattung, Lüftung, Dämmung und regelbarer Haustechnik.',
            'points':['außenliegende Verschattung oder intelligente Glasflächenplanung','Nachtlüftung und optional aktive Kühlung','wintertaugliche Dämm- und Heizkonfiguration','Feuchteführung an Anschlüssen und in Nassräumen']
        }
    return {
        'label':'Mittel- und Westdeutschland-Profil',
        'lead':'Wechselhafte Witterung, Regenperioden und moderate Winter machen Feuchteschutz, Lüftung und eine flexibel regelbare Heizung zu zentralen Planungsthemen.',
        'points':['regensichere Fassaden- und Fensteranschlüsse','kontrolliertes Lüftungs- und Feuchtekonzept','effiziente Heizung für Übergangszeiten','wartungsfreundliche Außenmaterialien']
    }


def use_profile(p: Place) -> tuple[str, list[str]]:
    name_seed=int(hashlib.md5(p.name.encode('utf-8')).hexdigest()[:8],16)
    if p.state in ('Berlin','Hamburg','Bremen') or (p.population and p.population>150000):
        return ('Urban & flexibel', ['Homeoffice oder Studio','Showroom und Beratungsraum','Gästehaus im privaten Umfeld','mobiles Marken- oder Projektbüro'])
    if p.state in ('Mecklenburg-Vorpommern','Schleswig-Holstein','Rheinland-Pfalz','Thüringen'):
        return ('Natur & Tourismus', ['Ferienhaus mit klarer Zielgruppe','Airbnb- oder Glamping-Einheit','Rückzugsort für Paare','Betreiberprojekt mit mehreren Einheiten'])
    variants=[
        ('Wohnen & Arbeiten',['privater Rückzugsort','Homeoffice mit separater Arbeitszone','Gästehaus','kompaktes Ferienobjekt']),
        ('Freizeit & Vermietung',['Ferienhaus','Airbnb-Einheit','Glamping-Unterkunft','Wochenendhaus']),
        ('Privat & Gewerblich',['Wohnlösung für ein bis vier Personen','mobiles Büro','Gästeunterkunft','kleines Betreiberprojekt'])
    ]
    return variants[name_seed%len(variants)]


def pick_model(p: Place) -> dict:
    h=int(hashlib.sha1(f'{p.name}|{p.state}'.encode()).hexdigest()[:8],16)
    return MODELS[h % len(MODELS)]


def pick_images(p: Place, n=3) -> list[str]:
    h=int(hashlib.sha1(f'{p.name}|{p.lat}|{p.lng}'.encode()).hexdigest()[:10],16)
    return [IMAGES[(h+i*5)%len(IMAGES)] for i in range(n)]


def nav(root: str) -> str:
    return f'''<a class="skip" href="#main">Zum Inhalt springen</a><div class="scroll-progress"></div>
<div class="topbar"><div class="container"><span>Direkt vom Hersteller · Eigene Produktion · Lieferung nach Europa</span><span><a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a></span></div></div>
<nav class="nav" aria-label="Hauptnavigation"><div class="container nav-inner"><a class="brand" href="{root}index.html"><img src="{root}assets/images/modunera-logo.png" alt="MODUNERA – Tiny House Hersteller"></a><div class="nav-links"><a href="{root}index.html#modelle">Modelle</a><a href="{root}standorte/">Standorte</a><a href="{root}konfigurator/">Konfigurator</a><a href="{root}qualitaet/">Qualität</a><a href="{root}nachhaltigkeit/">Nachhaltigkeit</a><a href="{root}blog/">Ratgeber</a><a href="{root}faq/">FAQ</a></div><div class="nav-actions"><a class="btn btn-primary" href="{root}konfigurator/">Preis berechnen</a><button class="mobile-toggle" aria-label="Menü öffnen">☰</button></div></div></nav>'''


def footer(root: str) -> str:
    return f'''<section class="cta-band"><div class="container cta-inner"><h2>Planen Sie Ihr Tiny House für Deutschland.</h2><a class="btn btn-light" href="{root}konfigurator/">Preis berechnen →</a></div></section>
<footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="{root}index.html"><img src="{root}assets/images/modunera-logo.png" alt="MODUNERA"></a><p>Premium Tiny Houses für Deutschland und Europa. Eigene Produktion, durchdachte Grundrisse und projektbezogene Konfiguration.</p><a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a></div><div><h4>Modelle</h4><a href="{root}modelle/mc-1/">MC 1</a><a href="{root}modelle/mc-2/">MC 2</a><a href="{root}modelle/mc-3/">MC 3</a><a href="{root}modelle/mc-6/">MC 6 Chalet</a><a href="{root}index.html#modelle">Alle Modelle</a></div><div><h4>Planung</h4><a href="{root}konfigurator/">Tiny House konfigurieren</a><a href="{root}standorte/">Deutschland-Standorte</a><a href="{root}tiny-house-preise/">Preise</a><a href="{root}tiny-house-deutschland/">Deutschland</a><a href="{root}tiny-house-fuer-airbnb/">Airbnb & Glamping</a></div><div><h4>Wissen</h4><a href="{root}blog/">Ratgeber</a><a href="{root}faq/">FAQ</a><a href="{root}qualitaet/">Material & Qualität</a><a href="{root}nachhaltigkeit/">Nachhaltigkeit</a><a href="{root}redaktion/">Redaktionsstandard</a></div></div><div class="footer-bottom"><span>© <span data-year>2026</span> MODUNERA. Alle Rechte vorbehalten.</span><span>Impressum · Datenschutz · Cookie-Einstellungen</span></div></div></footer>
<div class="floating-actions"><a href="https://wa.me/{WA}" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a><a href="tel:{PHONE_TEL}" aria-label="Telefon">☎</a></div><div class="cookie"><strong>Ihre Privatsphäre</strong><p class="legal-note">Diese Demo speichert nur Ihre Cookie-Auswahl lokal. Analyse- und Marketingdienste sind noch nicht aktiviert.</p><div class="cookie-actions"><button class="btn btn-dark" data-cookie="essential">Nur notwendig</button><button class="btn btn-primary" data-cookie="all">Alle akzeptieren</button></div></div>'''


def head(title: str, desc: str, canonical: str, root: str, image: str, schemas: list[dict], ogtype='website') -> str:
    s=''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",",":"))}</script>' for x in schemas)
    return f'''<!doctype html><html lang="de-DE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="theme-color" content="#0b3024"><link rel="canonical" href="{canonical}"><link rel="stylesheet" href="{root}assets/css/styles.css"><link rel="icon" href="{root}assets/images/modunera-logo.png"><meta property="og:type" content="{ogtype}"><meta property="og:site_name" content="MODUNERA"><meta property="og:locale" content="de_DE"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{BASE_URL}assets/images/gallery/{image}"><meta name="twitter:card" content="summary_large_image">{s}</head><body>'''


def load_places() -> list[Place]:
    raw=[x for x in all_cities() if x.country=='DE' and x.admin1 in STATE_NAMES]
    raw.sort(key=lambda x:(x.admin1, x.name.lower(), x.lat, x.lng))
    counts=Counter((x.admin1, slugify(x.name)) for x in raw)
    used=set(); places=[]
    for x in raw:
        display_name = {'Munich':'München'}.get(x.name, x.name)
        state=STATE_NAMES[x.admin1]; base=slugify(display_name)
        slug=base
        if counts[(x.admin1,base)]>1:
            suffix=slugify(x.admin2) if x.admin2 and x.admin2!='00' else hashlib.md5(f'{x.lat},{x.lng}'.encode()).hexdigest()[:5]
            slug=f'{base}-{suffix}'
        while (x.admin1,slug) in used:
            slug=f'{base}-{hashlib.md5(f"{x.lat},{x.lng}".encode()).hexdigest()[:6]}'
        used.add((x.admin1,slug))
        state_slug=STATE_SLUGS[state]
        path=f'standorte/{state_slug}/{slug}/'
        places.append(Place(display_name,float(x.lat),float(x.lng),x.admin1,x.admin2,state,state_slug,slug,path))

    # Population merge from geonamescache for major cities where available.
    try:
        import geonamescache
        gc=geonamescache.GeonamesCache(); cities=gc.get_cities().values()
        popmap={}
        for c in cities:
            if c.get('countrycode')=='DE':
                key=(c.get('admin1code',''), slugify(c.get('name','')))
                popmap[key]=max(popmap.get(key,0),int(c.get('population') or 0))
        for p in places:
            p.population=popmap.get((p.admin1,slugify(p.name))) or None
    except Exception:
        pass

    coords=[sphere_point(p.lat,p.lng) for p in places]
    tree=cKDTree(coords)
    for i,p in enumerate(places):
        _, idxs=tree.query(coords[i],k=9)
        p.nearby=[int(j) for j in idxs if int(j)!=i][:6]
    return places


def location_faqs(p: Place) -> list[tuple[str,str]]:
    return [
        (f'Was kostet ein Tiny House in {p.name}?', f'Der Preis hängt von Modell, Länge, Innenausbau, Heiz- und Kühlsystem, Energiepaket, Transport sowie den örtlichen Anschlussarbeiten in {p.name} ab. Der Konfigurator liefert eine erste unverbindliche Indikation; ein verbindliches Angebot folgt nach technischer Prüfung.'),
        (f'Kann ein MODUNERA Tiny House nach {p.name} geliefert werden?', f'Eine Lieferung nach {p.name} wird projektbezogen geprüft. Entscheidend sind Abmessungen, Gewicht, Route, Zufahrt, Rangierfläche und Entladepunkt. Die finale Transportplanung erfolgt nach Standortfreigabe.'),
        (f'Benötige ich in {p.name} eine Genehmigung?', f'Mobilität oder Räder bedeuten nicht automatisch Genehmigungsfreiheit. Nutzung, Aufstellungsdauer, Grundstück und lokale Planungsvorgaben müssen mit der zuständigen Gemeinde oder Bauaufsicht für {p.name} geklärt werden.'),
        (f'Ist ein Tiny House in {p.name} winterfest?', f'Die MODUNERA-Modelle können für eine ganzjährige Nutzung konfiguriert werden. Dämmung, Fenster, Wärmebrücken, Lüftung und Heizleistung müssen jedoch auf das konkrete Klima und Grundstück in {p.name} abgestimmt werden.'),
        (f'Welches Modell passt für {p.name}?', f'Für Paare und Panoramaorientierung eignet sich häufig MC 1; Familien profitieren von MC 2 mit zwei Lofts; MC 3 und MC 4 bieten zusätzliche Raumtrennung; MC 6 setzt einen starken Chalet-Akzent. Die endgültige Auswahl richtet sich nach Personenanzahl, Nutzung und Standort.'),
        (f'Kann ich das Tiny House individuell ausstatten?', 'Ja. Fassade, Innenraum, Küche, Bad, Möbel, Heiz- und Kühlsystem, Solartechnik sowie weitere Optionen können innerhalb der technischen und gewichtsspezifischen Grenzen projektbezogen konfiguriert werden.')
    ]


def location_page(p: Place, places: list[Place]) -> str:
    root='../../../'; canonical=BASE_URL+p.path
    model=pick_model(p); imgs=pick_images(p); climate=climate_profile(p); use_label, uses=use_profile(p)
    km=round(haversine(40.75,30.0,p.lat,p.lng)/50)*50
    near=[places[i] for i in (p.nearby or [])]
    faqs=location_faqs(p)
    title=f'Tiny House in {p.name} kaufen | Hersteller & Lieferung | MODUNERA'
    desc=f'Tiny House für {p.name}: Modelle, Preise, Lieferung, winterfeste Ausstattung und Standortplanung. Direkt vom Hersteller für {p.state}.'
    schema=[
        {'@context':'https://schema.org','@type':'WebPage','name':title,'url':canonical,'description':desc,'about':{'@type':'Product','name':f'Tiny House für {p.name}','brand':{'@type':'Brand','name':'MODUNERA'}}},
        {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
            {'@type':'ListItem','position':1,'name':'Startseite','item':BASE_URL},
            {'@type':'ListItem','position':2,'name':'Standorte','item':BASE_URL+'standorte/'},
            {'@type':'ListItem','position':3,'name':p.state,'item':BASE_URL+f'standorte/{p.state_slug}/'},
            {'@type':'ListItem','position':4,'name':p.name,'item':canonical}]},
        {'@context':'https://schema.org','@type':'FAQPage','mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in faqs]}
    ]
    loc_stats=f'''<div class="data-strip"><div><span>Bundesland</span><strong>{esc(p.state)}</strong></div><div><span>Standortprofil</span><strong>{esc(climate['label'])}</strong></div><div><span>Produktionsregion</span><strong>ca. {km:,} km Luftlinie*</strong></div><div><span>Planungsstatus</span><strong>Projektbezogene Prüfung</strong></div></div>'''.replace(',', '.')
    benefits=''.join(f'<div class="benefit"><span class="benefit-number">0{i+1}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></div>' for i,(t,d) in enumerate([
        ('Mehr Nutzwert pro Quadratmeter','Lofts, Einbaumöbel, klare Laufwege und große Sichtachsen machen kompakte Fläche spürbar großzügiger.'),
        ('Direkt ab Werk','Eigene Produktion reduziert unnötige Zwischenstufen und schafft klare Ansprechpartner für Modell, Ausstattung und Qualitätskontrolle.'),
        ('Vier Jahreszeiten planbar','Dämmung, Fenster, Lüftung sowie Heiz- und Kühlsystem werden auf Nutzung und Standortprofil abgestimmt.'),
        ('Weniger Betriebsfläche','Eine kleinere, gut geplante Hülle kann Material-, Reinigungs- und Energieaufwand gegenüber deutlich größeren Wohnflächen reduzieren.')
    ]))
    technical=''.join(f'<li>{esc(x)}</li>' for x in [
        'feuerverzinkte Stahlkonstruktion und Stahlfahrgestell',
        'Thermowood-, Verbund- und projektabhängige Metallfassaden',
        'wärmeisolierte PVC-Elemente und doppelt gehärtetes Thermopane',
        'flammhemmende Kabelkanäle und halogenfreie 220-Volt-Installation',
        'Klimaanlagen-Infrastruktur und konfigurierbare Heizlösungen',
        'lackierte Küchenschränke und massive Paneel-Arbeitsflächen'
    ])
    climate_points=''.join(f'<li>{esc(x)}</li>' for x in climate['points'])
    use_cards=''.join(f'<div class="use-card"><span>✓</span><strong>{esc(x)}</strong><p>Grundriss, Technik und Ausstattung werden auf dieses Nutzungsszenario abgestimmt.</p></div>' for x in uses)
    near_links=''.join(f'<a class="place-link" href="{root}{n.path}"><strong>{esc(n.name)}</strong><span>{esc(n.state)}</span></a>' for n in near)
    faq_html=''.join(f'<div class="faq-item" data-category="location"><button class="faq-question">{esc(q)}<span>+</span></button><div class="faq-answer"><p>{esc(a)}</p></div></div>' for q,a in faqs)
    whatsapp=quote(f'Hallo MODUNERA, ich interessiere mich für ein Tiny House in {p.name}, {p.state}. Bitte senden Sie mir Informationen zu Modellen, Preis und Lieferung.')
    return head(title,desc,canonical,root,imgs[0],schema)+nav(root)+f'''
<main id="main"><header class="location-hero"><img src="{root}assets/images/gallery/{imgs[0]}" alt="Tiny House für {esc(p.name)} in {esc(p.state)}"><div class="location-hero-overlay"></div><div class="container location-hero-content"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · <a href="{root}standorte/">Standorte</a> · <a href="../">{esc(p.state)}</a> · {esc(p.name)}</div><span class="hero-kicker">MODUNERA · {esc(p.state)}</span><h1>Tiny House in {esc(p.name)} kaufen</h1><p>Premium Tiny Houses direkt vom Hersteller: intelligent geplant, für vier Jahreszeiten konfigurierbar und projektbezogen nach {esc(p.name)} lieferbar.</p><div class="hero-actions"><a class="btn btn-primary" href="{root}konfigurator/?ort={quote(p.name)}">Preis konfigurieren</a><a class="btn btn-light" href="https://wa.me/{WA}?text={whatsapp}">Projekt über WhatsApp starten</a></div></div></header>
<section class="section section-tight"><div class="container">{loc_stats}<div class="answer-box"><strong>Direkte Antwort</strong><p>MODUNERA produziert acht Tiny-House-Modelle in eigener Fertigung und plant Lieferungen nach {esc(p.name)} sowie in ganz {esc(p.state)}. Für ein belastbares Angebot werden Nutzung, Modell, Ausstattung, Grundstückszufahrt und lokale Anforderungen gemeinsam geprüft.</p></div></div></section>
<section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Lokal geplant, industriell gefertigt</div><h2>Warum ein MODUNERA Tiny House für {esc(p.name)}?</h2></div><p>{esc(STATE_INTROS[p.state])}</p></div><div class="benefit-grid">{benefits}</div></div></section>
<section class="section section-dark"><div class="container wide-feature"><div class="visual"><img src="{root}assets/images/gallery/{imgs[1]}" alt="Innenraum eines MODUNERA Tiny House für {esc(p.name)}" loading="lazy"></div><div class="wide-copy"><div class="eyebrow">{esc(climate['label'])}</div><h2>Standortgerechter Komfort statt Standardpaket.</h2><p>{esc(climate['lead'])}</p><ul class="check-list">{climate_points}</ul><p class="legal-note light">Die Angaben sind eine geografisch abgeleitete Orientierung. Statik, Energie, Genehmigung und Aufstellung müssen für das konkrete Grundstück fachlich geprüft werden.</p></div></div></section>
<section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Empfohlenes Modellprofil</div><h2>{model['name']}: {esc(model['positioning'])}</h2></div><p>Für viele Projekte rund um {esc(p.name)} ist {model['name']} ein guter Ausgangspunkt. Die endgültige Modellwahl erfolgt nach Personenanzahl, gewünschter Privatsphäre, Nutzung und Transportbedingungen.</p></div><div class="model-highlight"><img src="{root}assets/images/gallery/{model['image']}" alt="{model['name']} Tiny House" loading="lazy"><div><span class="model-label">{esc(model['length'])} · {esc(model['layout'])}</span><h3>{model['name']} individuell konfigurieren</h3><p>{esc(model['positioning'])}. Farben, Fassaden, Küche, Bad, Möbel, Heiztechnik und Energieoptionen können projektbezogen angepasst werden.</p><a class="btn btn-primary" href="{root}modelle/{model['id']}/">Modell ansehen →</a></div></div></div></section>
<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">{esc(use_label)}</div><h2>Nutzungsideen für {esc(p.name)}</h2></div><p>Ein Tiny House kann Zuhause, Ferienobjekt, Arbeitsraum oder Teil eines Betreiberprojekts sein. Wirtschaftlichkeit und Komfort hängen von einer klaren Zieldefinition ab.</p></div><div class="use-grid">{use_cards}</div></div></section>
<section class="section"><div class="container story-grid"><div class="story-large"><img src="{root}assets/images/gallery/{imgs[2]}" alt="Naturnahes Tiny House in der Region {esc(p.name)}" loading="lazy"><div class="story-overlay"><span class="eyebrow">Material & Qualität</span><h2>Technische Substanz, die sichtbar und prüfbar bleibt.</h2></div></div><div class="technical-panel"><h3>MODUNERA Produktionsbasis</h3><ul class="check-list">{technical}</ul><a href="{root}qualitaet/">Materialien im Detail →</a></div></div></section>
<section class="section section-soft"><div class="container"><div class="section-header"><div><div class="eyebrow">Ressourcen & Betrieb</div><h2>Kompakter leben, gezielter investieren.</h2></div><p>Nachhaltigkeit entsteht nicht durch ein Etikett, sondern durch passende Größe, langlebige Konstruktion, effizienten Betrieb und bewusste Materialwahl.</p></div><div class="sustain-grid"><div><strong>Weniger Fläche</strong><p>Kleinere beheizte und zu reinigende Flächen können laufenden Aufwand reduzieren.</p></div><div><strong>Gezielte Technik</strong><p>Heizung, Kühlung, Solar und Speicher werden nach realem Nutzungsprofil dimensioniert.</p></div><div><strong>Langlebige Hülle</strong><p>Wartbare Fassaden, robuste Stahlstruktur und dokumentierte Details unterstützen den Werterhalt.</p></div><div><strong>Flexible Nutzung</strong><p>Ein durchdachter Grundriss kann Wohnen, Arbeiten, Gäste und Vermietung kombinieren.</p></div></div></div></section>
<section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Projektablauf</div><h2>Von {esc(p.name)} zur fertigen Konfiguration.</h2></div><p>Ein sauberer Prozess reduziert Nachträge, Transportprobleme und Fehlentscheidungen.</p></div><div class="process-grid"><div><span>01</span><h3>Anforderungen</h3><p>Nutzung, Personen, Budget, Grundstück und gewünschter Termin.</p></div><div><span>02</span><h3>Konfiguration</h3><p>Modell, Grundriss, Fassade, Innenausbau und technische Pakete.</p></div><div><span>03</span><h3>Standortprüfung</h3><p>Zufahrt, Entladung, Untergrund, Anschlüsse und lokale Freigaben.</p></div><div><span>04</span><h3>Produktion & Lieferung</h3><p>Qualitätskontrolle, Dokumentation und abgestimmter Transport nach {esc(p.name)}.</p></div></div></div></section>
<section class="section section-dark"><div class="container"><div class="section-header"><div><div class="eyebrow">Fragen aus der Region</div><h2>FAQ: Tiny House in {esc(p.name)}</h2></div><p>Klare Antworten für die erste Projektphase. Verbindliche Aussagen entstehen nach Standort- und Vertragsprüfung.</p></div><div class="faq-list">{faq_html}</div></div></section>
<section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">In der Nähe</div><h2>Weitere Tiny-House-Standorte</h2></div><p>Entdecken Sie regionale Informationsseiten und vergleichen Sie standortbezogene Planungsprofile.</p></div><div class="places-list">{near_links}</div><p class="legal-note">* Luftlinienentfernung zur Produktionsregion Kartepe/Türkei, auf 50 km gerundet. Keine Routen-, Lieferzeit- oder Kostenangabe.</p></div></section></main>'''+footer(root)+f'<script src="{root}assets/js/main.js"></script></body></html>'


def state_page(state: str, group: list[Place]) -> str:
    state_slug=STATE_SLUGS[state]; root='../../'; canonical=BASE_URL+f'standorte/{state_slug}/'
    title=f'Tiny House {state}: Hersteller, Modelle & Lieferung | MODUNERA'
    desc=f'Tiny Houses für {state}: {len(group)} regionale Standortseiten, Modelle, Preise, Lieferung und winterfeste Ausstattung direkt vom Hersteller.'
    img=IMAGES[int(hashlib.md5(state.encode()).hexdigest()[:8],16)%len(IMAGES)]
    schema=[
        {'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':canonical,'description':desc},
        {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Startseite','item':BASE_URL},{'@type':'ListItem','position':2,'name':'Standorte','item':BASE_URL+'standorte/'},{'@type':'ListItem','position':3,'name':state,'item':canonical}]}
    ]
    links=''.join(f'<a href="{p.slug}/"><strong>{esc(p.name)}</strong><span>Tiny House kaufen · Preise · Lieferung</span></a>' for p in sorted(group,key=lambda x:x.name.lower()))
    return head(title,desc,canonical,root,img,schema)+nav(root)+f'''<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · <a href="../">Standorte</a> · {esc(state)}</div><div class="eyebrow">Deutschland-Netzwerk</div><h1>Tiny House in {esc(state)}</h1><p>{esc(STATE_INTROS[state])}</p><div class="hero-actions"><a class="btn btn-light" href="{root}konfigurator/">Preis konfigurieren</a><a class="btn btn-primary" href="tel:{PHONE_TEL}">Projekt besprechen</a></div></div></header><section class="section"><div class="container"><div class="answer-box"><strong>Regionale Abdeckung</strong><p>Diese Hub-Seite bündelt {len(group):,} Ortsseiten in {esc(state)}. Jede Ortsseite kombiniert lokale Geodaten, ein standortbezogenes Klima- und Nutzungsszenario, passende Modelle, FAQ und direkte Projektwege.</p></div><div class="section-header" style="margin-top:60px"><div><div class="eyebrow">{len(group):,} Orte</div><h2>Ort auswählen</h2></div><p>Eine Seite pro Ort – mehrere Suchintentionen gebündelt, statt dünner Einzel-Seiten für jede Keyword-Variante.</p></div><div class="state-place-grid">{links}</div></div></section></main>'''.replace(',', '.')+footer(root)+f'<script src="{root}assets/js/main.js"></script></body></html>'


def locations_index(places: list[Place], states: dict[str,list[Place]]) -> str:
    root='../'; canonical=BASE_URL+'standorte/'
    title='Tiny House Standorte Deutschland | 7.000+ regionale Seiten | MODUNERA'
    desc=f'Finden Sie Tiny-House-Informationen für {len(places):,} Orte in allen 16 Bundesländern: Modelle, Preise, Lieferung, Klima und Projektplanung.'
    schema=[{'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':canonical,'description':desc}]
    cards=''.join(f'<a class="state-card" href="{STATE_SLUGS[s]}/"><span>{len(states[s]):,} Orte</span><h3>{esc(s)}</h3><p>{esc(STATE_INTROS[s][:145])}…</p></a>' for s in sorted(states))
    return head(title,desc,canonical,root,'hero-forest.webp',schema)+nav(root)+f'''<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · Standorte</div><div class="eyebrow">Deutschlandweite Themenabdeckung</div><h1>Tiny House in Ihrer Stadt und Region</h1><p>{len(places):,} lokale Informationsseiten verbinden regionale Suchintentionen mit echter Projektinformation: Modellwahl, Klima, Nutzung, Lieferung, Qualität und FAQ.</p></div></header><section class="section section-tight"><div class="container"><div class="location-search"><label for="locationSearch"><strong>Ort direkt suchen</strong><span>Stadt, Gemeinde oder Dorf eingeben</span></label><input id="locationSearch" type="search" placeholder="z. B. München, Zwota oder Bad Dürkheim" autocomplete="off"><div id="locationResults" class="location-results" aria-live="polite"></div></div><div class="answer-box"><strong>SEO-Architektur mit Qualitätskontrolle</strong><p>Pro Ort wird eine inhaltlich substanzielle Seite aufgebaut. Synonyme und Long-Tail-Begriffe werden auf derselben Seite natürlich beantwortet; es werden keine separaten Seiten für bloße Wortvarianten erzeugt.</p></div></div></section><section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">16 Bundesländer</div><h2>Region auswählen</h2></div><p>Die Bundesland-Hubs bündeln alle Ortsseiten und stärken Navigation, Crawlbarkeit und thematische Einordnung.</p></div><div class="state-grid">{cards}</div></div></section></main>'''.replace(',', '.')+footer(root)+f'<script src="{root}assets/js/locations-data.js"></script><script src="{root}assets/js/main.js"></script></body></html>'


def blog_sections(topic: tuple[str,str,str,str], angle: str) -> list[tuple[str,str]]:
    slug,name,focus,cat=topic
    if angle=='leitfaden':
        return [
            (f'{name}: zuerst Ziel und Nutzung definieren', f'Bei {name.lower()} sollte die Planung mit dem gewünschten Ergebnis beginnen. Dauerwohnen, Feriennutzung, Vermietung, Homeoffice oder Betreiberprojekt stellen unterschiedliche Anforderungen an Grundriss, Technik, Budget und Dokumentation. Wer die Nutzung präzise beschreibt, kann Angebote besser vergleichen und vermeidet teure spätere Änderungen. Im Mittelpunkt stehen {focus.lower()}.'),
            ('Standort und Rahmenbedingungen als System betrachten', 'Grundstück, Zufahrt, Rangierfläche, Untergrund, Strom, Frisch- und Abwasser sowie lokale Vorgaben gehören zusammen. Eine technisch gute Einheit kann am falschen Standort trotzdem wirtschaftlich oder organisatorisch scheitern. Deshalb werden standortbezogene Informationen möglichst früh gesammelt und schriftlich dokumentiert.'),
            ('Technische Spezifikation belastbar formulieren', 'Ein Angebot sollte nicht nur schöne Bilder enthalten, sondern klare Angaben zu Abmessungen, Gewicht, Tragstruktur, Fahrgestell, Dämmung, Fenstern, Elektroinstallation, Lüftung, Heizung, Oberflächen und Einbauten. Bei MODUNERA bilden feuerverzinkte Stahlkonstruktion, Stahlfahrgestell, wärmeisolierte PVC-Elemente, doppelt gehärtetes Thermopane und halogenfreie 220-Volt-Installation eine technische Basis, die projektbezogen ergänzt wird.'),
            ('Kosten über den gesamten Projektumfang vergleichen', 'Zum Gesamtbudget gehören neben Produktion und Ausstattung auch Transport, mögliche Einfuhr- und Abwicklungsleistungen, Entladung, Untergrund, Anschlüsse, Planung, Genehmigung, Versicherung und laufender Betrieb. Ein niedriger Einstiegspreis ist nur dann vorteilhaft, wenn Leistungsgrenzen und Zusatzkosten transparent bleiben.'),
            ('Komfort und Nachhaltigkeit gemeinsam optimieren', 'Flächeneffizienz reduziert nicht automatisch jeden Ressourcenverbrauch. Entscheidend sind passende Größe, langlebige Materialien, ein geringer Wärmeverlust, bedarfsgerechte Technik und ein realistisches Nutzerverhalten. Gute Sichtachsen, Tageslicht, Stauraum und Mehrfachnutzung erhöhen den empfundenen Raum, ohne unnötig Fläche hinzuzufügen.'),
            ('Produktion, Prüfung und Übergabe organisieren', 'Vor Versand sollten definierte Qualitätskontrollen, Funktionsprüfungen und eine Fotodokumentation erfolgen. Transportdaten, Entladepunkt, Ansprechpartner, Übergabeunterlagen und Wartungshinweise werden vorab abgestimmt. So wird aus einem Produkt ein steuerbares Projekt.'),
            ('Entscheidung mit einer klaren Checkliste abschließen', f'Für {name.lower()} sollten mindestens Nutzung, Standort, Modell, Ausstattung, Gesamtbudget, lokale Prüfung, Transportweg, Terminplan und Verantwortlichkeiten schriftlich feststehen. Der MODUNERA-Konfigurator liefert eine erste Orientierung; ein verbindliches Angebot entsteht erst nach technischer Validierung.')
        ]
    return [
        (f'Die häufigste Fehlannahme bei {name}', f'Der größte Fehler besteht darin, {name.lower()} isoliert zu betrachten. {focus} funktionieren nur, wenn Nutzung, Standort, Technik und Budget zusammenpassen. Einzelne Produktmerkmale oder Keyword-Versprechen ersetzen keine systematische Projektprüfung.'),
        ('Nur den Grundpreis betrachten', 'Ein scheinbar günstiges Angebot kann durch Transport, Anschlüsse, lokale Arbeiten, Sonderausstattung oder fehlende Dokumentation deutlich teurer werden. Vergleichen Sie deshalb Leistungsumfang, Ausnahmen, Zahlungsplan, Lieferbedingungen und Gewährleistung auf derselben Basis.'),
        ('Standortprüfung zu spät beginnen', 'Genehmigung, Zufahrt, Rangierfläche, Untergrund und Anschlüsse werden häufig erst nach der Modellauswahl geklärt. Das kann Grundriss, Gewicht, Länge oder Terminplanung nachträglich verändern. Eine frühe Vorprüfung schafft Entscheidungssicherheit.'),
        ('Dämmung, Lüftung und Heizung getrennt planen', 'Wärmeschutz ohne Feuchteführung kann ebenso problematisch sein wie eine starke Heizung ohne passende Regelung. Gebäudehülle, Fenster, Wärmebrücken, Lüftung, Verschattung und Haustechnik müssen als Gesamtsystem betrachtet werden.'),
        ('Raumgefühl mit Quadratmetern verwechseln', 'Mehr Länge ist nicht automatisch mehr Komfort. Sichtachsen, Kopfhöhe, Treppenführung, Stauraum, Tageslicht und die Trennung von Ruhe- und Aktivitätszonen bestimmen den Alltag. Ein guter Grundriss vermeidet tote Flächen und wiederkehrende Konflikte.'),
        ('Transport und Übergabe unterschätzen', 'Eine fahrbare Einheit benötigt trotzdem eine belastbare Routen-, Zufahrts- und Entladeplanung. Gewicht, Wendekreis, Böschung, Torbreite und Bodenverhältnisse gehören in die Projektakte. Auch die Verantwortlichkeit für lokale Leistungen muss eindeutig sein.'),
        ('Ohne Dokumentation bestellen', f'Fordern Sie für {name.lower()} eine nachvollziehbare Spezifikation, Planunterlagen, Materialbeschreibung, Zahlungs- und Lieferbedingungen sowie einen definierten Abnahmeprozess. Gute Dokumentation erleichtert Finanzierung, Versicherung, Wartung und spätere Änderungen.')
    ]


def blog_page(topic, angle, index) -> tuple[str,str,str,str]:
    slug,name,focus,cat=topic
    suffix='leitfaden' if angle=='leitfaden' else 'fehler-checkliste'
    page_slug=f'{slug}-{suffix}'
    if angle=='leitfaden':
        title=f'{name}: Leitfaden für Planung, Kosten und Qualität'
        desc=f'{name} professionell planen: {focus}. Mit Entscheidungslogik, Kostenrahmen, Technik und Checkliste.'
    else:
        title=f'{name}: 7 Fehler vermeiden – Praxis-Checkliste'
        desc=f'Die wichtigsten Fehler bei {name.lower()}: Standort, Preis, Technik, Transport und Dokumentation strukturiert prüfen.'
    root='../../'; canonical=BASE_URL+f'blog/{page_slug}/'; image=IMAGES[index%len(IMAGES)]
    sections=blog_sections(topic,angle)
    reading=max(8,round(sum(len(t.split())+len(p.split()) for t,p in sections)/160))
    pub=(date(2026,3,1)+timedelta(days=(index*3)%140)).isoformat()
    schema=[
        {'@context':'https://schema.org','@type':'BlogPosting','headline':title,'description':desc,'datePublished':pub,'dateModified':TODAY,'author':{'@type':'Organization','name':'MODUNERA Redaktion'},'publisher':{'@id':BASE_URL+'#organization'},'mainEntityOfPage':canonical,'image':BASE_URL+'assets/images/gallery/'+image,'articleSection':FAQ_CATEGORIES.get(cat,cat)},
        {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Startseite','item':BASE_URL},{'@type':'ListItem','position':2,'name':'Ratgeber','item':BASE_URL+'blog/'},{'@type':'ListItem','position':3,'name':title,'item':canonical}]}
    ]
    section_html=''.join(f'<section id="section-{i+1}"><h2>{esc(h)}</h2><p>{esc(p)}</p></section>' for i,(h,p) in enumerate(sections))
    toc=''.join(f'<a href="#section-{i+1}">{esc(h)}</a>' for i,(h,_) in enumerate(sections))
    page=head(title+' | MODUNERA Ratgeber',desc,canonical,root,image,schema,'article')+nav(root)+f'''<main id="main"><header class="article-visual-hero"><img src="{root}assets/images/gallery/{image}" alt="{esc(name)}"><div class="article-visual-overlay"></div><div class="container"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · <a href="../">Ratgeber</a> · {esc(title)}</div><div class="blog-meta">{pub} · {reading} Min. · MODUNERA Redaktion</div><h1>{esc(title)}</h1><p>{esc(desc)}</p></div></header><section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>Direkte Antwort</strong><p>{esc(focus)} sollten nicht als Einzelentscheidung behandelt werden. Ein belastbares Projekt verbindet Nutzung, Standort, technische Spezifikation, Gesamtkosten, Transport und dokumentierte Übergabe.</p></div>{section_html}<div class="notice" style="margin-top:50px"><strong>Nächster Schritt:</strong> Nutzen Sie den Konfigurator für eine erste Preisindikation oder besprechen Sie Ihr Projekt unter <a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a>.</div><p class="legal-note" style="margin-top:22px">Redaktioneller Fachbeitrag zur Projektorientierung. Keine Rechts-, Steuer-, Finanz- oder Statikberatung. Lokale Vorgaben und technische Nachweise sind projektbezogen zu prüfen.</p></article><aside class="article-aside"><div class="toc"><strong>Inhalt</strong>{toc}</div><div class="toc" style="margin-top:18px"><strong>Projekt planen</strong><p class="legal-note">Modell, Ausstattung und Lieferregion strukturiert erfassen.</p><a class="btn btn-primary" style="width:100%" href="{root}konfigurator/">Konfigurator öffnen</a></div><div class="toc" style="margin-top:18px"><strong>Weiterlesen</strong><a href="{root}faq/">150+ FAQ</a><a href="{root}standorte/">Lokale Seiten</a><a href="{root}qualitaet/">Material & Qualität</a></div></aside></div></section></main>'''+footer(root)+f'<script src="{root}assets/js/main.js"></script></body></html>'
    return page_slug,title,desc,page


def build_faqs() -> list[dict]:
    subjects={
        'kauf':['Kaufpreis','Angebotsvergleich','Zahlungsplan','Finanzierung','Gesamtkosten','Ausstattungsbudget','Wiederverkaufswert','Vertragsumfang','Lieferumfang','Preisbindung','Mehrkosten','Budgetreserve','Rabatte','Serienbestellung','Anzahlung','Abnahme'],
        'planung':['Grundriss','Loft','separates Schlafzimmer','Küche','Badezimmer','Stauraum','Treppe','Tageslicht','Privatsphäre','Familiennutzung','Seniorennutzung','Homeoffice','Möblierung','Haustiere','Barrierearmut','Individualisierung'],
        'recht':['Baugenehmigung','Stellplatz','Dauerwohnen','Feriennutzung','Gemeindeanfrage','Bauvoranfrage','Grundstück','Erschließung','Abstandsflächen','Campingplatz','Meldeadresse','Gewerbenutzung','Airbnb','lokale Satzung','Dokumente','Rechtsberatung'],
        'technik':['Stahlrahmen','Fahrgestell','Thermowood','Fenster','Verglasung','Elektroinstallation','Brandschutz','Dach','Fassade','Gewicht','Korrosionsschutz','Nassraum','Wärmebrücken','Schallschutz','Qualitätskontrolle','Dokumentation'],
        'energie':['Winterfestigkeit','Dämmung','Heizung','Wärmepumpe','Fußbodenheizung','Klimaanlage','Lüftung','Feuchtigkeit','Solar','Batteriespeicher','Off Grid','Warmwasser','Energieverbrauch','Verschattung','Frostschutz','Sommerkomfort'],
        'transport':['Lieferung Deutschland','Transportkosten','Routenprüfung','Zufahrt','Entladung','Kran','Rangierfläche','Straßenzulassung','Kennzeichen','Gewichtslimit','Versicherung Transport','Lieferzeit','Grenzabwicklung','Schäden','Übergabe','Standortvorbereitung'],
        'nachhaltigkeit':['Flächenverbrauch','Materialeinsatz','Energieeffizienz','Solarstrom','Wasserverbrauch','Langlebigkeit','Reparierbarkeit','Fassadenpflege','CO₂-Betrachtung','Rückbau','Mehrfachnutzung','lokale Anschlüsse','Abfall','Holzherkunft','Lebenszyklus','Greenwashing'],
        'business':['Airbnb','Glamping','Ferienpark','Serienproduktion','Betreiberkonzept','Auslastung','Rendite','Gästekomfort','Reinigung','Wartung','Zielgruppe','Preisstrategie','Standortmix','Corporate Housing','Pop-up Office','Händler'],
        'service':['Produktionsdauer','Planungsphase','Bemusterung','Änderungswünsche','Fabrikbesuch','Qualitätsbericht','Garantie','Gewährleistung','Ersatzteile','Wartung','Fernsupport','Dokumente','Sprachen','Projektmanager','After Sales','Reklamation'],
        'modelle':['MC 1','MC 2','MC 3','MC 4','MC 5','MC 6','MC 7','MC 8','8 Meter','9 Meter','9,70 Meter','ein Loft','zwei Lofts','Veranda','Chalet','Modellvergleich']
    }
    faqs=[]
    for cat,items in subjects.items():
        for i,sub in enumerate(items):
            if cat=='modelle':
                q=f'Was sollte ich über {sub} wissen?'
                a=f'{sub} ist Teil der MODUNERA-Modell- oder Ausstattungslogik. Entscheidend sind Personenanzahl, Nutzung, gewünschte Raumtrennung, Standort, technische Ausstattung und Gewicht. Der Modellvergleich und die technische Beratung grenzen die passende Konfiguration ein.'
            elif cat=='recht':
                q=f'Wie wird das Thema {sub} beim Tiny House geklärt?'
                a=f'{sub} ist standort- und nutzungsabhängig. Eine allgemeine Website-Antwort ersetzt keine schriftliche Prüfung durch Gemeinde, Bauaufsicht oder qualifizierte lokale Fachplanung. Halten Sie Grundstücksdaten, Nutzung, Abmessungen, Grundriss, Anschlüsse und Aufstelldauer bereit.'
            elif cat=='kauf':
                q=f'Wie beeinflusst {sub} den Kauf eines Tiny House?'
                a=f'{sub} sollte im Angebot klar definiert und in die Gesamtkostenrechnung aufgenommen werden. Vergleichen Sie nicht nur den Grundpreis, sondern Leistungsumfang, Ausnahmen, Transport, lokale Arbeiten, Zahlungsplan und dokumentierte Abnahme.'
            elif cat=='technik':
                q=f'Welche Bedeutung hat {sub} bei einem Tiny House?'
                a=f'{sub} beeinflusst Sicherheit, Komfort, Gewicht, Wartung oder Lebensdauer. Die konkrete Ausführung muss zur Nutzung, zum Standort und zur übrigen Konstruktion passen. Fordern Sie eine nachvollziehbare Spezifikation und projektbezogene Freigabe.'
            elif cat=='energie':
                q=f'Wie plane ich {sub} für ein Tiny House?'
                a=f'{sub} wird nicht isoliert gewählt. Klima, Nutzungsdauer, Dämmung, Fenster, Lüftung, Anschlussleistung und Nutzerprofil bilden ein System. Die Dimensionierung sollte technisch geprüft und auf den konkreten Standort abgestimmt werden.'
            elif cat=='transport':
                q=f'Was ist bei {sub} zu beachten?'
                a=f'{sub} erfordert klare Angaben zu Abmessungen, Gewicht, Route, Zufahrt, Rangierfläche, Untergrund, Entladepunkt und Verantwortlichkeiten. Eine verbindliche Zusage erfolgt erst nach logistischer Prüfung.'
            elif cat=='nachhaltigkeit':
                q=f'Wie trägt {sub} zur Nachhaltigkeit eines Tiny House bei?'
                a=f'{sub} kann die Umweltwirkung verbessern, wenn Größe, Material, Haltbarkeit, Energiebedarf und tatsächliche Nutzung zusammenpassen. Einzelne „grüne“ Merkmale reichen ohne Lebenszyklus- und Betriebsperspektive nicht aus.'
            elif cat=='business':
                q=f'Wie plane ich {sub} als Tiny-House-Geschäftsmodell?'
                a=f'{sub} sollte mit Zielgruppe, Standort, Genehmigung, Investitionskosten, Auslastung, Reinigung, Wartung und konservativer Erlösplanung bewertet werden. MODUNERA kann Produkt- und Serienkonfiguration unterstützen; Wirtschaftlichkeitsannahmen bleiben Betreiberverantwortung.'
            else:
                q=f'Wie funktioniert {sub} bei MODUNERA?'
                a=f'{sub} wird im Projektablauf transparent abgegrenzt. Anforderungen, technische Machbarkeit, Termin, Verantwortlichkeiten und Dokumentation werden vor Freigabe festgehalten. Verbindlich sind ausschließlich Angebot und Vertrag.'
            faqs.append({'category':cat,'question':q,'answer':a})
    return faqs


def faq_page(faqs: list[dict]) -> str:
    root='../'; canonical=BASE_URL+'faq/'; title='Tiny House FAQ: 160 Antworten zu Kauf, Technik & Lieferung | MODUNERA'; desc='160 klare Antworten zu Tiny-House-Kauf, Preisen, Genehmigung, Modellen, Winterfestigkeit, Transport, Nachhaltigkeit, Airbnb und Service.'
    schema=[{'@context':'https://schema.org','@type':'FAQPage','mainEntity':[{'@type':'Question','name':f['question'],'acceptedAnswer':{'@type':'Answer','text':f['answer']}} for f in faqs]}]
    filters='<button class="filter active" data-faq-filter="all">Alle</button>'+''.join(f'<button class="filter" data-faq-filter="{k}">{esc(v)}</button>' for k,v in FAQ_CATEGORIES.items())
    items=''.join(f'<div class="faq-item" data-category="{f["category"]}"><button class="faq-question">{esc(f["question"])}<span>+</span></button><div class="faq-answer"><p>{esc(f["answer"])}</p></div></div>' for f in faqs)
    return head(title,desc,canonical,root,'mc2-living.webp',schema)+nav(root)+f'''<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · FAQ</div><div class="eyebrow">{len(faqs)} geprüfte Antwortbausteine</div><h1>Tiny House FAQ</h1><p>Kauf, Standort, Technik, Winter, Transport, Nachhaltigkeit und Betreiberprojekte – präzise beantwortet und klar abgegrenzt.</p></div></header><section class="section"><div class="container faq-layout"><aside class="faq-controls"><label><strong>Fragen durchsuchen</strong><input id="faqSearch" type="search" placeholder="Suchbegriff eingeben"></label><div class="faq-filters">{filters}</div><div class="answer-box"><strong>Wichtiger Hinweis</strong><p>Allgemeine Informationen ersetzen keine lokale Genehmigungs-, Rechts-, Steuer-, Statik- oder Energieberatung. Verbindlich sind projektbezogene Prüfungen und Vertragsunterlagen.</p></div></aside><div class="faq-list">{items}</div></div></section></main>'''+footer(root)+f'<script src="{root}assets/js/main.js"></script></body></html>'


def blog_index(entries: list[dict]) -> str:
    root='../'; canonical=BASE_URL+'blog/'; title='Tiny House Ratgeber: Planung, Preise, Technik & Business | MODUNERA'; desc=f'{len(entries)} fundierte Tiny-House-Ratgeber zu Kauf, Standort, Technik, Energie, Gestaltung, Transport, Nachhaltigkeit und Betreiberprojekten.'
    schema=[{'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':canonical,'description':desc}]
    cards=''.join(f'''<article class="blog-card" data-blog-category="{e['category']}"><img src="{root}assets/images/gallery/{e['image']}" alt="{esc(e['title'])}" loading="lazy"><div class="blog-card-body"><div class="blog-meta">{esc(FAQ_CATEGORIES.get(e['category'],e['category']))} · {e['minutes']} Min.</div><h3><a href="{e['slug']}/">{esc(e['title'])}</a></h3><p>{esc(e['desc'])}</p><a href="{e['slug']}/">Artikel lesen →</a></div></article>''' for e in entries)
    filters='<button class="filter active" data-blog-filter="all">Alle</button>'+''.join(f'<button class="filter" data-blog-filter="{k}">{esc(v)}</button>' for k,v in FAQ_CATEGORIES.items())
    return head(title,desc,canonical,root,'interior-feature.webp',schema)+nav(root)+f'''<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · Ratgeber</div><div class="eyebrow">Themenautorität statt Keyword-Füllung</div><h1>MODUNERA Ratgeber</h1><p>{len(entries)} Fachartikel beantworten konkrete Fragen vor Kauf, Planung, Lieferung und Betrieb. Jeder Beitrag bündelt eine Suchintention mit Entscheidungslogik, Risiken und nächsten Schritten.</p></div></header><section class="section section-tight"><div class="container"><div class="blog-toolbar">{filters}<input id="blogSearch" type="search" placeholder="Ratgeber durchsuchen"></div><div class="answer-box"><strong>Redaktioneller Standard</strong><p>Inhalte werden nach Nutzen, fachlicher Nachvollziehbarkeit, transparenter Abgrenzung und interner Verlinkung strukturiert. Rechts- und Standortfragen werden nicht pauschal als verbindlich dargestellt.</p></div></div></section><section class="section"><div class="container"><div class="blog-grid blog-grid-large">{cards}</div></div></section></main>'''+footer(root)+f'<script src="{root}assets/js/main.js"></script></body></html>'


def editorial_page() -> str:
    root='../'; canonical=BASE_URL+'redaktion/'; title='Redaktionsstandard, Quellen & SEO-Qualität | MODUNERA'; desc='So erstellt und prüft MODUNERA Inhalte: Nutzerintention, technische Daten, lokale Quellen, rechtliche Abgrenzung, Aktualisierung und Qualitätskontrolle.'
    schema=[{'@context':'https://schema.org','@type':'WebPage','name':title,'url':canonical,'description':desc}]
    return head(title,desc,canonical,root,'mc7-interior.webp',schema)+nav(root)+f'''<main id="main"><header class="page-hero"><div class="container"><div class="breadcrumbs"><a href="{root}index.html">Startseite</a> · Redaktion</div><div class="eyebrow">Trust & Governance</div><h1>MODUNERA Redaktionsstandard</h1><p>Skalierbare SEO- und GEO-Inhalte müssen nützlich, überprüfbar, transparent und laufend aktualisierbar bleiben.</p></div></header><section class="section"><div class="container article-shell"><article class="article"><div class="answer-box"><strong>Grundprinzip</strong><p>Wir erstellen keine separaten Seiten für bloße Wortvarianten. Eine Seite bündelt eine reale Nutzeraufgabe und liefert Entscheidungshilfe, lokale Orientierung, technische Substanz und klare nächste Schritte.</p></div><h2>1. Primärquellen und Produktdaten</h2><p>Modell- und Materialangaben basieren auf freigegebenen MODUNERA-Unterlagen. Lokale Verwaltungsdaten werden vor Livegang mit aktuellen amtlichen Quellen abgeglichen. Aussagen zu Preisen, Lieferzeiten und Zulassung gelten nur, wenn sie im konkreten Angebot oder technischen Dokument bestätigt sind.</p><h2>2. Lokale Seiten</h2><p>Ortsseiten verwenden Ortsname, Bundesland und Geokoordinaten zur Ableitung eines vorsichtigen Klima- und Nutzungsszenarios. Sie geben keine lokale Genehmigung oder konkrete Lieferbarkeit vor. Die zuständige Behörde, Zufahrt und Aufstellung werden projektbezogen geprüft.</p><h2>3. Fachartikel</h2><p>Ratgeber beginnen mit einer direkten Antwort, erläutern Entscheidungen und Risiken, vermeiden unbelegte Superlative und trennen allgemeine Orientierung von Rechts-, Finanz-, Steuer-, Energie- oder Statikberatung.</p><h2>4. Aktualisierung</h2><p>Inhalte erhalten Veröffentlichungs- und Änderungsdatum. Kritische Seiten zu Recht, Preisen, Transport und Produktdaten werden priorisiert geprüft. Veraltete oder nicht mehr belegbare Inhalte werden korrigiert, zusammengeführt oder aus dem Index genommen.</p><h2>5. Qualität vor Menge</h2><p>Der Seitenbestand wird nicht allein nach Anzahl bewertet. Relevante Kennzahlen sind qualifizierte Anfragen, organische Sichtbarkeit, Nutzerinteraktion, Indexqualität, interne Suchanfragen und redaktionell bestätigte Aktualität.</p></article><aside class="article-aside"><div class="toc"><strong>Transparenz</strong><a href="{root}standorte/">Standortarchitektur</a><a href="{root}blog/">Ratgeber</a><a href="{root}faq/">FAQ</a><a href="{root}qualitaet/">Produktqualität</a></div></aside></div></section></main>'''+footer(root)+f'<script src="{root}assets/js/main.js"></script></body></html>'


def add_css_js():
    css=SITE/'assets/css/styles.css'
    additions='''
/* V3: scalable local SEO, GEO and editorial content */
.section-tight{padding-top:42px;padding-bottom:42px}.section-soft{background:#f1f5f2}.light{color:#d7e4dc!important}.location-hero{min-height:680px;display:grid;align-items:end;position:relative;overflow:hidden;color:white}.location-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.location-hero-overlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(3,25,18,.94),rgba(3,25,18,.12) 70%)}.location-hero-content{position:relative;z-index:2;padding:90px 0}.location-hero h1{font-size:clamp(3.3rem,7vw,7rem);line-height:.92;margin:18px 0}.location-hero p{max-width:760px;font-size:1.15rem;color:#e2eee7}.data-strip{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:22px;overflow:hidden;background:white}.data-strip>div{padding:22px;border-right:1px solid var(--line)}.data-strip>div:last-child{border-right:0}.data-strip span,.data-strip strong{display:block}.data-strip span{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px}.answer-box{border-left:5px solid var(--wine);background:#f6f0ed;border-radius:0 18px 18px 0;padding:22px 26px;margin:24px 0}.answer-box strong{font-size:1.05rem}.answer-box p{margin:7px 0 0;color:#46534c}.check-list{padding-left:0;list-style:none}.check-list li{position:relative;padding:8px 0 8px 28px}.check-list li:before{content:"✓";position:absolute;left:0;color:var(--sand);font-weight:900}.model-highlight{display:grid;grid-template-columns:1.25fr 1fr;gap:42px;align-items:center;border:1px solid var(--line);border-radius:28px;overflow:hidden;background:white}.model-highlight img{width:100%;height:480px;object-fit:cover}.model-highlight>div{padding:40px 45px 40px 0}.model-highlight h3{font-size:2.2rem;margin:10px 0}.technical-panel{background:var(--forest);color:white;border-radius:24px;padding:35px}.technical-panel a{color:var(--sand);font-weight:800}.sustain-grid>div{background:white;border:1px solid var(--line);border-radius:20px;padding:24px}.sustain-grid strong{font-size:1.15rem}.process-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.process-grid>div{border:1px solid var(--line);border-radius:20px;padding:24px}.process-grid span{font-size:2.2rem;color:var(--sand);font-weight:900}.process-grid h3{margin:8px 0}.places-list{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.place-link,.state-place-grid a{display:flex;justify-content:space-between;gap:18px;border:1px solid var(--line);border-radius:14px;padding:15px 18px;background:white}.place-link span,.state-place-grid span{color:var(--muted);font-size:.78rem}.state-place-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.state-place-grid a{flex-direction:column;gap:5px}.state-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.state-card{border:1px solid var(--line);border-radius:22px;padding:25px;background:white;min-height:235px;transition:.25s}.state-card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}.state-card>span{font-size:.74rem;color:var(--wine);font-weight:800;text-transform:uppercase}.state-card h3{font-size:1.45rem;margin:12px 0}.state-card p{color:var(--muted)}.location-search{position:relative;background:var(--forest);color:white;border-radius:24px;padding:28px;display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:center}.location-search label span{display:block;color:#bcd0c5;font-size:.82rem;margin-top:4px}.location-search input,.blog-toolbar input,.faq-controls input{width:100%;padding:15px 18px;border:0;border-radius:14px;font-size:1rem}.location-results{position:absolute;z-index:30;left:328px;right:28px;top:88px;background:white;color:var(--ink);border-radius:16px;box-shadow:var(--shadow);overflow:hidden;display:none}.location-results.open{display:block}.location-results a{display:flex;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--line)}.location-results a:last-child{border:0}.location-results span{color:var(--muted);font-size:.8rem}.article-visual-hero{min-height:580px;display:grid;align-items:end;position:relative;color:white;overflow:hidden}.article-visual-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.article-visual-overlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(3,25,18,.96),rgba(3,25,18,.22))}.article-visual-hero .container{position:relative;z-index:2;padding:90px 0}.article-visual-hero h1{font-size:clamp(2.7rem,6vw,5.8rem);line-height:.98;max-width:1000px;margin:16px 0}.article-visual-hero p{max-width:760px;color:#dfebe4;font-size:1.08rem}.blog-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.blog-toolbar input{max-width:330px;border:1px solid var(--line);margin-left:auto}.blog-grid-large{grid-template-columns:repeat(3,1fr)}.blog-card.hidden{display:none}.filter{border:1px solid var(--line);border-radius:999px;background:white;padding:9px 13px;cursor:pointer}.filter.active{background:var(--forest);color:white;border-color:var(--forest)}
@media(max-width:980px){.data-strip,.process-grid,.state-grid{grid-template-columns:repeat(2,1fr)}.model-highlight{grid-template-columns:1fr}.model-highlight>div{padding:10px 35px 38px}.state-place-grid,.places-list{grid-template-columns:repeat(2,1fr)}.blog-grid-large{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.location-hero{min-height:650px}.data-strip,.process-grid,.state-grid,.state-place-grid,.places-list,.blog-grid-large{grid-template-columns:1fr}.data-strip>div{border-right:0;border-bottom:1px solid var(--line)}.location-search{grid-template-columns:1fr}.location-results{left:14px;right:14px;top:145px}.model-highlight img{height:330px}.blog-toolbar input{max-width:none;margin-left:0}.article-visual-hero{min-height:620px}}
'''
    txt=css.read_text(encoding='utf-8')
    if '/* V3: scalable local SEO' not in txt:
        css.write_text(txt+'\n'+additions,encoding='utf-8')

    js=SITE/'assets/js/main.js'; txt=js.read_text(encoding='utf-8')
    insert='''
  const locInput=qs('#locationSearch'),locResults=qs('#locationResults');
  if(locInput&&locResults&&window.MC_LOCATIONS){const renderLoc=()=>{const term=locInput.value.trim().toLocaleLowerCase('de-DE');if(term.length<2){locResults.classList.remove('open');locResults.innerHTML='';return;}const hits=window.MC_LOCATIONS.filter(x=>(x.n+' '+x.s).toLocaleLowerCase('de-DE').includes(term)).slice(0,12);locResults.innerHTML=hits.length?hits.map(x=>`<a href="${x.u}"><strong>${x.n}</strong><span>${x.s}</span></a>`).join(''):'<div style="padding:15px">Kein Ort gefunden.</div>';locResults.classList.add('open');};locInput.addEventListener('input',renderLoc);document.addEventListener('click',e=>{if(!locResults.contains(e.target)&&e.target!==locInput)locResults.classList.remove('open')});}
  const blogSearch=qs('#blogSearch'),blogFilters=qsa('[data-blog-filter]');const applyBlog=()=>{if(!blogSearch)return;const term=blogSearch.value.toLowerCase(),active=qs('[data-blog-filter].active')?.dataset.blogFilter||'all';qsa('.blog-card[data-blog-category]').forEach(i=>{const okCat=active==='all'||i.dataset.blogCategory===active,okText=i.textContent.toLowerCase().includes(term);i.classList.toggle('hidden',!(okCat&&okText));});};if(blogSearch)blogSearch.addEventListener('input',applyBlog);blogFilters.forEach(b=>b.onclick=()=>{blogFilters.forEach(x=>x.classList.remove('active'));b.classList.add('active');applyBlog();});
'''
    if 'const locInput=' not in txt:
        txt=txt.replace("  qsa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());",insert+"\n  qsa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());")
        js.write_text(txt,encoding='utf-8')


def update_existing_html():
    for path in SITE.rglob('*.html'):
        if 'standorte' in path.parts or 'redaktion' in path.parts:
            continue
        txt=path.read_text(encoding='utf-8')
        # Insert Standorte after Modelle, preserving relative prefix.
        txt=re.sub(r'<a href="((?:\.\./)*)index\.html#modelle">Modelle</a>(?!<a href="\1standorte/">)',lambda m:f'<a href="{m.group(1)}index.html#modelle">Modelle</a><a href="{m.group(1)}standorte/">Standorte</a>',txt)
        path.write_text(txt,encoding='utf-8')


def update_home(places_count: int):
    path=SITE/'index.html'; txt=path.read_text(encoding='utf-8')
    marker='<section class="section" id="modelle">'
    if 'id="standort-finder"' not in txt:
        section=f'''<section class="section section-soft" id="standort-finder"><div class="container"><div class="section-header"><div><div class="eyebrow">Deutschlandweit sichtbar</div><h2>Finden Sie MODUNERA für Ihren Ort.</h2></div><p>{places_count:,} lokale Informationsseiten verbinden Ihre Region mit passenden Modellen, Klimaüberlegungen, Lieferung, FAQ und direkter Konfiguration.</p></div><div class="location-search"><label for="locationSearch"><strong>Stadt, Gemeinde oder Dorf suchen</strong><span>Direkt zur regionalen Projektseite</span></label><input id="locationSearch" type="search" placeholder="z. B. Berlin, München oder Zwota" autocomplete="off"><div id="locationResults" class="location-results" aria-live="polite"></div></div><div style="margin-top:20px"><a class="btn btn-dark" href="standorte/">Alle 16 Bundesländer öffnen →</a></div></div></section>'''.replace(',', '.')
        txt=txt.replace(marker,section+marker)
    if 'locations-data.js' not in txt:
        txt=txt.replace('<script src="assets/js/main.js"></script>','<script src="assets/js/locations-data.js"></script><script src="assets/js/main.js"></script>')
    path.write_text(txt,encoding='utf-8')


def generate_sitemaps(urls: list[str]):
    smdir=SITE/'sitemaps'
    if smdir.exists(): shutil.rmtree(smdir)
    smdir.mkdir()
    chunks=[urls[i:i+900] for i in range(0,len(urls),900)]
    names=[]
    for i,chunk in enumerate(chunks,1):
        name=f'sitemap-{i:04d}.xml'; names.append(name)
        body=''.join(f'<url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>{"weekly" if "/blog/" in u else "monthly"}</changefreq><priority>{"0.8" if "/standorte/" in u else "0.7"}</priority></url>' for u in chunk)
        write(smdir/name,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+body+'</urlset>')
    idx=''.join(f'<sitemap><loc>{BASE_URL}sitemaps/{n}</loc><lastmod>{TODAY}</lastmod></sitemap>' for n in names)
    write(SITE/'sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+idx+'</sitemapindex>')
    return names


def main():
    print('Loading German places…')
    places=load_places(); states=defaultdict(list)
    for p in places: states[p.state].append(p)
    print('Places:',len(places),'states:',len(states))

    # Clear generated areas for repeatable builds.
    for rel in ['standorte','sitemaps','redaktion']:
        d=SITE/rel
        if d.exists(): shutil.rmtree(d)
    (SITE/'standorte').mkdir()

    # Data files and search JS.
    data_dir=SITE/'data'; data_dir.mkdir(exist_ok=True)
    compact=[{'n':p.name,'s':p.state,'u':'/'+p.path} for p in places]
    # Browser can resolve absolute / paths after deployment; local preview uses a patch below.
    write(data_dir/'locations.json',json.dumps([asdict(p) for p in places],ensure_ascii=False,separators=(',',':')))
    write(data_dir/'models.json',json.dumps(MODELS,ensure_ascii=False,indent=2))
    write(SITE/'assets/js/locations-data.js','window.MC_LOCATIONS='+json.dumps(compact,ensure_ascii=False,separators=(',',':'))+';')

    # Local pages.
    for idx,p in enumerate(places,1):
        write(SITE/p.path/'index.html',location_page(p,places))
        if idx%1000==0: print(' location pages',idx)
    for state,group in states.items():
        write(SITE/'standorte'/STATE_SLUGS[state]/'index.html',state_page(state,group))
    write(SITE/'standorte/index.html',locations_index(places,states))

    # Keyword architecture CSV.
    kw_path=SITE/'seo/keyword-strategy.csv'; kw_path.parent.mkdir(exist_ok=True)
    with kw_path.open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(['keyword','intent','location','state','target_url','priority'])
        for p in places:
            for pattern,intent,priority in KEYWORD_PATTERNS:
                w.writerow([pattern.format(place=p.name),intent,p.name,p.state,BASE_URL+p.path,priority])

    # Blog generation.
    blog_entries=[]
    existing=[]
    for f in (SITE/'blog').glob('*/index.html'):
        if f.parent.name not in {t[0]+'-leitfaden' for t in BLOG_TOPICS} and f.parent.name not in {t[0]+'-fehler-checkliste' for t in BLOG_TOPICS}:
            existing.append(f)
    for i,topic in enumerate(BLOG_TOPICS):
        for j,angle in enumerate(('leitfaden','checkliste')):
            slug,title,desc,page=blog_page(topic,angle,i*2+j)
            write(SITE/'blog'/slug/'index.html',page)
            blog_entries.append({'slug':slug,'title':title,'desc':desc,'category':topic[3],'image':IMAGES[(i*2+j)%len(IMAGES)],'minutes':9 if angle=='leitfaden' else 8})
    # Include links to original 10 pages.
    existing_meta=[
        ('tiny-house-kaufen-deutschland','Tiny House in Deutschland kaufen: Projektleitfaden','Von Bedarf und Grundstück bis Produktion und Übergabe.','kauf','mc1-exterior.webp'),
        ('tiny-house-preise-kosten','Tiny-House-Preise und Kosten','Gesamtkosten, Ausstattung und Vergleichbarkeit.','kauf','mc2-exterior.webp'),
        ('tiny-house-genehmigung-deutschland','Tiny House Genehmigung in Deutschland','Standort, Nutzung und lokale Prüfung.','recht','mc4-exterior.webp'),
        ('tiny-house-winterfest','Winterfestes Tiny House','Dämmung, Heizung, Lüftung und Feuchte.','energie','mc6-exterior.webp'),
        ('tiny-house-auf-raedern','Tiny House auf Rädern','Fahrgestell, Transport und Standort.','transport','mc7-exterior.webp'),
        ('nachhaltiges-tiny-house','Nachhaltiges Tiny House ohne Greenwashing','Fläche, Material, Betrieb und Lebensdauer.','nachhaltigkeit','hero-forest.webp'),
        ('tiny-house-airbnb-glamping','Tiny House für Airbnb und Glamping','Betreiberplanung, Gäste und Wirtschaftlichkeit.','business','mc4-bedroom.webp'),
        ('tiny-house-import-tuerkei','Tiny House aus der Türkei importieren','Dokumente, Logistik und Projektabgrenzung.','transport','mc3-exterior.webp'),
        ('tiny-house-innenraum-planen','Tiny-House-Innenraum planen','Sichtachsen, Stauraum und Mehrfachnutzung.','planung','interior-feature.webp'),
        ('tiny-house-vier-jahreszeiten','Tiny House für vier Jahreszeiten','Standortbezogene Hülle und Technik.','energie','mc5-exterior.webp')
    ]
    for slug,title,desc,cat,img in existing_meta:
        if (SITE/'blog'/slug/'index.html').exists(): blog_entries.append({'slug':slug,'title':title,'desc':desc,'category':cat,'image':img,'minutes':8})
    write(SITE/'blog/index.html',blog_index(blog_entries))

    # FAQ + machine-readable answer library.
    faqs=build_faqs(); write(SITE/'faq/index.html',faq_page(faqs)); write(data_dir/'faq.json',json.dumps(faqs,ensure_ascii=False,indent=2))
    write(SITE/'redaktion/index.html',editorial_page())
    knowledge={
        '@context':'https://schema.org','@graph':[
            {'@type':'Organization','@id':BASE_URL+'#organization','name':'MODUNERA','url':BASE_URL,'telephone':PHONE_DISPLAY,'description':'Tiny-House-Hersteller mit eigener Produktion für Deutschland und Europa.','areaServed':['DE','AT','CH','NL','BE','FR','SE','NO','DK','FI']},
            *[{'@type':'Product','@id':BASE_URL+f'modelle/{m["id"]}/#product','name':m['name'],'brand':{'@type':'Brand','name':'MODUNERA'},'description':m['positioning'],'url':BASE_URL+f'modelle/{m["id"]}/'} for m in MODELS]
        ]
    }
    write(data_dir/'knowledge-graph.json',json.dumps(knowledge,ensure_ascii=False,indent=2))
    write(data_dir/'answer-library.json',json.dumps({'updated':TODAY,'answers':faqs},ensure_ascii=False,indent=2))

    add_css_js(); update_existing_html(); update_home(len(places))

    # Patch location search URLs to work both deployed and in local static preview.
    # Main JS computes relative navigation for file:// from current page.
    js=SITE/'assets/js/main.js'; txt=js.read_text(encoding='utf-8')
    old='x=>`<a href="${x.u}"><strong>${x.n}</strong><span>${x.s}</span></a>`'
    new='x=>{const u=location.protocol===\'file:\'?((location.pathname.includes(\'/standorte/\')?\'../\':\'\')+x.u.replace(/^\\//,\'\')):x.u;return `<a href="${u}"><strong>${x.n}</strong><span>${x.s}</span></a>`}'
    if old in txt: txt=txt.replace(old,new)
    js.write_text(txt,encoding='utf-8')

    # Robots and LLMS/README.
    write(SITE/'robots.txt',f'User-agent: *\nAllow: /\nDisallow: /tools/\nSitemap: {BASE_URL}sitemap.xml\nSitemap: {BASE_URL}image-sitemap.xml\n')
    write(SITE/'llms.txt',f'''# MODUNERA\n\n> Premium Tiny Houses für Deutschland und Europa. Eigene Produktion, acht Modelle, Standortplanung und Konfiguration.\n\n- Hauptseite: {BASE_URL}\n- Modelle: {BASE_URL}#modelle\n- Konfigurator: {BASE_URL}konfigurator/\n- Standorte: {BASE_URL}standorte/\n- Ratgeber: {BASE_URL}blog/\n- FAQ: {BASE_URL}faq/\n- Redaktion: {BASE_URL}redaktion/\n- Telefon: {PHONE_DISPLAY}\n\nMaschinenlesbare Daten:\n- {BASE_URL}data/knowledge-graph.json\n- {BASE_URL}data/answer-library.json\n- {BASE_URL}data/locations.json\n''')

    core=[]
    for f in SITE.rglob('index.html'):
        if 'tools' in f.parts: continue
        rel=f.parent.relative_to(SITE).as_posix()
        core.append(BASE_URL if rel=='.' else BASE_URL+rel.strip('/')+'/')
    sm_names=generate_sitemaps(sorted(set(core)))

    # Build feed for generated articles.
    latest=blog_entries[:50]
    feed_items=''.join(f'<entry><title>{esc(e["title"])}</title><id>{BASE_URL}blog/{e["slug"]}/</id><link href="{BASE_URL}blog/{e["slug"]}/"/><updated>{TODAY}T00:00:00Z</updated><summary>{esc(e["desc"])}</summary></entry>' for e in latest)
    write(SITE/'feed.xml',f'<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>MODUNERA Ratgeber</title><id>{BASE_URL}blog/</id><updated>{TODAY}T00:00:00Z</updated>{feed_items}</feed>')

    # Verification report.
    html_files=list(SITE.rglob('*.html'))
    keyword_rows=len(places)*len(KEYWORD_PATTERNS)
    report={
        'generated_at':TODAY,'html_pages':len(html_files),'location_pages':len(places),
        'state_hubs':len(states),'blog_articles':len(blog_entries),'faq_entries':len(faqs),
        'keyword_rows':keyword_rows,'sitemap_files':len(sm_names),'canonical_base':BASE_URL,
        'phone':PHONE_DISPLAY,'data_source_note':'Ortsentwürfe basieren auf citiespy/GeoNames-Ortsdaten. Vor öffentlichem Livegang mit dem aktuellen amtlichen Destatis-Gemeindeverzeichnis abgleichen.'
    }
    write(SITE/'BUILD-REPORT.json',json.dumps(report,ensure_ascii=False,indent=2))
    write(SITE/'README-V3.txt',f'''MODUNERA WEBSITE V3 — SCALE SEO / GEO BUILD\n\nGenerated: {TODAY}\nHTML pages: {len(html_files):,}\nLocation pages: {len(places):,}\nState hubs: {len(states)}\nBlog articles in index: {len(blog_entries)}\nFAQ answers: {len(faqs)}\nKeyword mapping rows: {keyword_rows:,}\nSitemap files: {len(sm_names)}\nPhone: {PHONE_DISPLAY}\n\nIMPORTANT PRODUCTION CHECKS\n1. Replace/confirm canonical domain if modunera.com/ is not the final live URL.\n2. Reconcile every location against the latest official Destatis GV-ISys municipality register before claiming complete municipal coverage.\n3. Editorially review local, legal, pricing, transport and technical content before mass indexation.\n4. Connect real forms, CRM, analytics consent, Impressum and Datenschutz.\n5. Replace any indicative configurator prices with approved commercial pricing.\n6. Submit sitemap.xml in Google Search Console after deployment.\n7. llms.txt is provided as a general machine-readable summary; it should not be treated as a Google ranking factor.\n\nSTRATEGY\nOne substantial page per place. Keyword variants map to that page in seo/keyword-strategy.csv. Do not publish separate doorway pages for each word-order variation.\n'''.replace(',', '.'))
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
