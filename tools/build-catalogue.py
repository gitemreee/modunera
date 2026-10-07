#!/usr/bin/env python3
"""MODUNERA catalogue, A4 PDF — the sales document the model pages never were.

Built because a competitor's catalogue arrived and the obvious move was to copy
it. That was not possible and should not have been: their specification names
their own procurement — Ariston water heaters, Fibo wall panels, C24 timber,
aluminium frames — and MODUNERA's published /qualitaet/ contradicts three of
those outright. It is a steel frame, not a timber one; PVC joinery, not
aluminium; solid panel worktops, not laminate. Transcribing their list would
have published false product claims and broken the site's own page at the same
time.

So this takes their COVERAGE — what a buyer wants answered, in what order — and
fills it only from what MODUNERA has already published and can stand behind:
data/models.json, data/pricing.json, data/quality-spec.json, and the price
scope sentence the model pages already carry.

What it deliberately does NOT contain is the equipment table: appliance makes
and models, insulation thickness, U-values, trailer dimensions, glazing
build-ups. Those are section 3 of REQUIRED-BUSINESS-INPUTS.md and have been
open since August. The catalogue is complete in structure and honest about the
hole, which is the only version of it that can be sent to a customer.

Writes build/MODUNERA-Katalog-de.pdf

Usage: python3 tools/build-catalogue.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab import rl_config

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "build" / "MODUNERA-Katalog-de.pdf"
FONTS = Path("/tmp/claude-0/-home-user/07ebb7b7-0ba0-51c9-9b93-57389bbfb169/scratchpad/fonts")

FOREST = HexColor("#3A5A40")
DEEP   = HexColor("#2E4733")
ROOF   = HexColor("#97311A")
SAGE   = HexColor("#A3B18A")
CREAM  = HexColor("#DAD7CD")
PAPER  = HexColor("#E2E7DE")
INK    = HexColor("#2E4733")
MUTED  = HexColor("#44513F")

for w, n in [("400", "P"), ("500", "P-Md"), ("600", "P-Sb"), ("700", "P-Bd")]:
    pdfmetrics.registerFont(TTFont(n, str(FONTS / f"Poppins-{w}.ttf")))
rl_config.canvas_basefontname = "P"

W, H = A4
M = 20 * mm


def data():
    models = json.loads((ROOT / "data/models.json").read_text("utf8"))
    models = models if isinstance(models, list) else list(models.values())[0]
    prices = json.loads((ROOT / "data/pricing.json").read_text("utf8"))["models"]
    quality = json.loads((ROOT / "data/quality-spec.json").read_text("utf8"))
    return models, prices, quality


def wrap(c, text, font, size, width):
    c.setFont(font, size)
    out, line = [], ""
    for word in text.split():
        t = (line + " " + word).strip()
        if c.stringWidth(t, font, size) <= width:
            line = t
        else:
            out.append(line); line = word
    if line:
        out.append(line)
    return out


def para(c, x, y, text, font, size, colour, width, leading=None):
    leading = leading or size * 1.45
    c.setFillColor(colour)
    for ln in wrap(c, text, font, size, width):
        c.setFont(font, size)
        c.drawString(x, y, ln)
        y -= leading
    return y


def footer(c, page):
    c.setFont("P", 7.5); c.setFillColor(MUTED)
    c.drawString(M, 12 * mm, "modunera.com")
    c.drawRightString(W - M, 12 * mm, str(page))


def logo(c, x, y, w, white=False):
    name = ("modunera-master-logo-mountain-v1-white-600.png" if white
            else "modunera-master-logo-mountain-v1.png")
    im = Image.open(ROOT / "assets/brand" / name).convert("RGBA")
    bb = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bb)
    h = w * im.size[1] / im.size[0]
    c.drawImage(ImageReader(im), x, y - h, width=w, height=h, mask="auto")
    return h


def cover(c):
    c.setFillColor(DEEP); c.rect(0, 0, W, H, stroke=0, fill=1)
    im = Image.open(ROOT / "assets/images/gallery/mc1-exterior.webp").convert("RGB")
    ph = H * 0.52
    iw, ih = im.size
    scale = max(W / iw, ph / ih)
    im = im.resize((int(iw * scale), int(ih * scale)), Image.LANCZOS)
    left = (im.size[0] - W) / 2
    im = im.crop((int(left), 0, int(left + W), int(ph)))
    c.drawImage(ImageReader(im), 0, H - ph, width=W, height=ph)
    logo(c, M, H - ph - 22 * mm, 58 * mm, white=True)
    c.setFont("P-Sb", 34); c.setFillColor(HexColor("#FFFFFF"))
    c.drawString(M, H - ph - 56 * mm, "Katalog")
    c.setFont("P", 13); c.setFillColor(CREAM)
    c.drawString(M, H - ph - 68 * mm, "Tiny Houses für Deutschland und Europa")
    c.setFont("P", 10); c.setFillColor(SAGE)
    c.drawString(M, 24 * mm, "Acht Modelle · Preisindikationen ab Werk · Konstruktion und Komponenten")
    c.drawString(M, 18 * mm, "modunera.com")
    c.showPage()


def about(c, page):
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    logo(c, M, H - M, 42 * mm)
    y = H - 58 * mm
    c.setFont("P-Sb", 24); c.setFillColor(DEEP)
    c.drawString(M, y, "Über MODUNERA"); y -= 14 * mm
    y = para(c, M, y, "MODUNERA ist ein Tiny-House-Hersteller mit eigener Produktion "
             "für Deutschland und Europa. Acht Modelle, von 8,00 bis 9,70 m Länge, "
             "alle auf derselben Grundbreite von 2,55 m — das ist die Breite, die "
             "den Transport auf der Straße offen hält.", "P", 11.5, MUTED, W - 2 * M)
    y -= 8 * mm
    c.setFont("P-Sb", 13); c.setFillColor(DEEP)
    c.drawString(M, y, "Was dieser Katalog enthält"); y -= 9 * mm
    for t in ["Die acht Modelle mit Länge, Grundriss und Preisindikation ab Werk.",
              "Die zwölf Komponenten, aus denen eine Einheit gebaut wird, und warum.",
              "Den Lieferweg und das, was der Werkspreis nicht abdeckt."]:
        c.setFillColor(ROOF); c.setFont("P-Sb", 11); c.drawString(M, y, "—")
        y = para(c, M + 7 * mm, y, t, "P", 11, MUTED, W - 2 * M - 7 * mm) - 2 * mm
    y -= 6 * mm
    c.setFont("P-Sb", 13); c.setFillColor(DEEP)
    c.drawString(M, y, "Was er noch nicht enthält"); y -= 9 * mm
    y = para(c, M, y, "Die Geräte- und Ausstattungsliste — Fabrikate und Typen von "
             "Warmwasserbereiter, Kochfeld, Sanitärobjekten, die Dämmstärken, die "
             "U-Werte und die Fahrgestellmaße. Diese Angaben werden erst "
             "veröffentlicht, wenn die Datenblätter und Prüfberichte dazu vorliegen. "
             "Eine Zahl, die wir nicht belegen können, steht hier nicht.",
             "P", 11.5, MUTED, W - 2 * M)
    footer(c, page); c.showPage()


def models_pages(c, models, prices, page):
    per = 4
    chunks = [models[i:i + per] for i in range(0, len(models), per)]
    for ci, chunk in enumerate(chunks):
        c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
        y = H - M
        if ci == 0:
            c.setFont("P-Sb", 24); c.setFillColor(DEEP)
            c.drawString(M, y - 8 * mm, "Die Modelle")
            c.setFont("P", 10.5); c.setFillColor(MUTED)
            c.drawString(M, y - 16 * mm,
                         "Preisindikation ab Werk. Verbindlich ist ausschließlich "
                         "ein geprüftes Angebot nach technischer Klärung.")
            c.setFont("P-Md", 9); c.setFillColor(ROOF)
            c.drawString(M, y - 22 * mm,
                         "Die Modellbilder sind Visualisierungen, keine Fotografien "
                         "gebauter Einheiten.")
            y -= 32 * mm
        else:
            y -= 4 * mm
        card_h = (y - 26 * mm) / len(chunk)
        for m in chunk:
            key = m["id"].replace("md-", "mc")
            p = prices.get(key, {})
            img = ROOT / f"assets/images/gallery/{key}-exterior.webp"
            top = y
            ih = card_h - 6 * mm
            iw = ih * 1.45
            if img.exists():
                im = Image.open(img).convert("RGB")
                sw, sh = im.size
                sc = max(iw / sw, ih / sh)
                im = im.resize((int(sw * sc), int(sh * sc)), Image.LANCZOS)
                l = (im.size[0] - iw) / 2; t = (im.size[1] - ih) / 2
                im = im.crop((int(l), int(t), int(l + iw), int(t + ih)))
                c.drawImage(ImageReader(im), M, top - ih, width=iw, height=ih)
                # the render is labelled on the picture itself: a catalogue page
                # gets cut out, forwarded and screenshotted, and the caption at
                # the top of the page does not travel with it.
                tag = "VISUALISIERUNG"
                c.setFont("P-Md", 5.6)
                tw = c.stringWidth(tag, "P-Md", 5.6)
                c.setFillColor(HexColor("#2E4733")); c.setFillAlpha(0.78)
                c.rect(M, top - ih, tw + 7 * mm, 5.2 * mm, stroke=0, fill=1)
                c.setFillAlpha(1)
                c.setFillColor(HexColor("#FFFFFF"))
                c.drawString(M + 3.5 * mm, top - ih + 1.8 * mm, tag)
            tx = M + iw + 8 * mm
            c.setFont("P-Sb", 17); c.setFillColor(DEEP)
            c.drawString(tx, top - 7 * mm, m["name"])
            c.setFont("P-Md", 9); c.setFillColor(ROOF)
            c.drawString(tx, top - 13 * mm,
                         f"{m['length']}  ·  {m['layout']}  ·  Breite 2,55 m")
            para(c, tx, top - 20 * mm, m.get("positioning", ""), "P", 10, MUTED,
                 W - M - tx)
            if p.get("base_eur"):
                c.setFont("P-Sb", 14); c.setFillColor(DEEP)
                c.drawRightString(W - M, top - ih + 2 * mm,
                                  f"ab {p['base_eur']:,} €".replace(",", "."))
            y -= card_h
        footer(c, page); page += 1; c.showPage()
    return page


def components(c, quality, page):
    cards = quality["cards"]
    half = (len(cards) + 1) // 2
    for ci, chunk in enumerate([cards[:half], cards[half:]]):
        c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
        y = H - M
        if ci == 0:
            c.setFont("P-Sb", 24); c.setFillColor(DEEP)
            c.drawString(M, y - 8 * mm, "Konstruktion und Komponenten")
            c.setFont("P", 10.5); c.setFillColor(MUTED)
            c.drawString(M, y - 16 * mm,
                         "Woraus eine Einheit gebaut wird — und welche Aufgabe "
                         "jedes Bauteil hat.")
            y -= 28 * mm
        else:
            y -= 6 * mm
        for card in chunk:
            c.setFont("P-Sb", 12); c.setFillColor(DEEP)
            c.drawString(M, y, card["match"]); y -= 6.5 * mm
            c.setStrokeColor(SAGE); c.setLineWidth(0.5)
            c.line(M, y + 2 * mm, M + 14 * mm, y + 2 * mm)
            y = para(c, M, y, card["de"], "P", 9.8, MUTED, W - 2 * M, leading=13.4)
            y -= 5 * mm
        footer(c, page); page += 1; c.showPage()
    return page


def delivery(c, page):
    c.setFillColor(DEEP); c.rect(0, 0, W, H, stroke=0, fill=1)
    logo(c, M, H - M, 42 * mm, white=True)
    y = H - 56 * mm
    c.setFont("P-Sb", 24); c.setFillColor(HexColor("#FFFFFF"))
    c.drawString(M, y, "Lieferung und Preis"); y -= 14 * mm
    c.setFont("P-Sb", 12); c.setFillColor(SAGE)
    c.drawString(M, y, "Der Weg"); y -= 8 * mm
    y = para(c, M, y, "Auf der Straße, je nach Ziel und Route teilweise per Ro-Ro "
             "oder Fähre. Alle acht Modelle bleiben auf 2,55 m Grundbreite, damit "
             "der Transportweg offen bleibt. Ro-Ro ist ein Abschnitt der Route und "
             "kein Haus-zu-Haus-Dienst: Vorlauf, Hafenabfertigung, Ladungssicherung "
             "und die letzte Straßenstrecke werden getrennt geplant.",
             "P", 11, CREAM, W - 2 * M)
    y -= 10 * mm
    c.setFont("P-Sb", 12); c.setFillColor(SAGE)
    c.drawString(M, y, "Was die Preisindikation abdeckt"); y -= 8 * mm
    y = para(c, M, y, "Die genannten Beträge sind Preisindikationen ab Werk. "
             "Nicht enthalten sind Lieferung ins Zielland, Untergrund, Anschlüsse, "
             "Entladung sowie örtliche Planung und Genehmigung. Verbindlich ist "
             "ausschließlich ein geprüftes Angebot nach technischer Klärung.",
             "P", 11, CREAM, W - 2 * M)
    y -= 14 * mm
    c.setFont("P-Sb", 12); c.setFillColor(SAGE)
    c.drawString(M, y, "Kontakt"); y -= 8 * mm
    c.setFont("P", 11); c.setFillColor(HexColor("#FFFFFF"))
    for ln in ["Yunus Emre ÇELEBİ · emre@modunera.com · +90 553 543 53 42",
               "Ersan KULAKÇI · ersan@modunera.com · +90 530 497 81 41",
               "modunera.com"]:
        c.drawString(M, y, ln); y -= 7 * mm
    c.setFont("P", 8); c.setFillColor(SAGE)
    c.drawString(M, 20 * mm, "Stand: siehe Dateiname. Änderungen und Irrtümer vorbehalten.")
    c.drawString(M, 15 * mm, "Dieser Katalog ist eine Information und kein Angebot.")
    c.showPage()


PAGE = ROOT / "katalog/index.html"
LINK_ID = "katalog-pdf"


def publish(pdf: Path) -> str:
    """Copy the PDF next to /katalog/ and give that page a download link.

    No generator owns katalog/index.html — it is one of the pages baked by the
    retired tools/generate_scale_v3.py — so the link is injected here, by the
    tool that produces the file it points at. Keeping the two together means the
    link cannot outlive the PDF or point at an older one.

    Idempotent by id: a page that already carries the block is left alone, so a
    second run changes nothing.
    """
    target = ROOT / "katalog" / pdf.name
    target.write_bytes(pdf.read_bytes())
    html = PAGE.read_text("utf8")
    if LINK_ID in html:
        return "already linked"
    anchor = "</p></div></header>"
    if anchor not in html:
        return "anchor not found — link NOT added"
    size = round(target.stat().st_size / 1_000_000, 1)
    block = (f'</p><p id="{LINK_ID}"><a class="btn" href="{pdf.name}" '
             f'download>Katalog als PDF ({size} MB)</a></p>'
             "</div></header>")
    PAGE.write_text(html.replace(anchor, block, 1), "utf8")
    return "linked"


def main():
    models, prices, quality = data()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("MODUNERA Katalog"); c.setAuthor("MODUNERA")
    page = 2
    cover(c)
    about(c, page); page += 1
    page = models_pages(c, models, prices, page)
    page = components(c, quality, page)
    delivery(c, page)
    c.save()
    state = publish(OUT)
    print(json.dumps({"out": str(OUT.relative_to(ROOT)), "models": len(models),
                      "components": len(quality["cards"]), "page": state}))


if __name__ == "__main__":
    main()
