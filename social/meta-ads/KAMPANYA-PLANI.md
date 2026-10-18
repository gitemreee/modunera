# Meta Ads kampanya planı — MODUNERA Almanya (Ekim 2026)

Görseller: `a-natur/`, `b-abend/`, `c-innen/` klasörlerinde her biri 1:1, 4:5 ve 9:16.
Üretici: `tools/social/build_meta_ads.py`. Aşağıdaki değerler Ads Manager'a
(Werbeanzeigenmanager) sırayla girilir: Kampanya → Anzeigengruppe → Anzeige.

## 0. Başlamadan önce — iki uyumsuzluk, bir eksik

1. **Fiyat.** Reklam A "39.500 €, 7-Meter-Modell" diyor. Sitede en kısa model 8,00 m,
   en düşük fiyat MD 7 için 42.900 € (`data/pricing.json`). Tıklayan kişi iki rakamı
   yan yana görür. Almanya'da tüketiciye fiyat reklamı (PAngV) **KDV dahil toplam fiyat**
   ister; "ab Werk, zzgl. Lieferung" gibi kapsam metinde belirtilmek zorunda. Üç seçenek:
   siteyi 39.500'e çek, reklamı 42.900'e çek, ya da A'yı yayınlama ve B/C ile başla.
   Bu karar senin; reklam senin istediğin rakamla üretildi.
2. **"15 Tagen".** Sitenin üretim sayfaları bilinçli olarak gün sayısı vermiyor, "Termin
   bei Auftragsbestätigung" diyor. Reklamda 15 gün yazıyorsa bunu teklifte tutabilmelisin.
3. **Meta Pixel yok.** Sitede Google Tag Manager kancası var (çerez onayına bağlı), Meta
   Pixel yok. Pixel ID'yi (Events Manager → Datenquellen → Pixel) bana ver, GTM üzerinden
   onaylı şekilde eklerim. Pixel olmadan "Website-Conversions" hedefi çalışmaz; o yüzden
   ilk kampanya **Instant Form (Lead-Formular)** ile kurulur, site dönüşümü sonraki adım.

## 1. Kampanya

| Alan | Değer |
|---|---|
| Kaufen-Typ | Auktion |
| Kampagnenziel | **Leads** (Potansiyel müşteriler) |
| Kampagnenname | `DE-Leads-TinyHouse-2026-10` |
| Besondere Anzeigenkategorie | Ads Manager "Wohnen" kategorisini sorarsa seç; sormazsa "Keine" |
| Advantage+ Kampagnenbudget | Aus (bütçe anzeigengruppe seviyesinde) |
| A/B-Test | Aus (varyantlar aynı Anzeigengruppe içinde yarışır) |

İkinci kampanya (isteğe bağlı, bir hafta sonra): `DE-Messages-WhatsApp`, hedef
**Interaktionen → Nachrichten → WhatsApp**. Bunun için Facebook sayfasına WhatsApp
Business numarasının bağlı olması gerekir (Seite → Einstellungen → WhatsApp).

## 2. Anzeigengruppe 1 — Privat (B2C)

| Alan | Değer |
|---|---|
| Name | `DE-Privat-30-65` |
| Conversion-Ort | Instant-Formulare |
| Leistungsziel | Anzahl der Leads maximieren |
| Budget | **20 €/Tag**, Laufzeit 14 Tage, Startdatum: yarın 06:00 |
| Standort | Deutschland (gesamt). İkinci hafta iyi performans gösteren Bundesland'lara daraltılabilir |
| Alter | 30–65 |
| Sprache | Deutsch |
| Advantage+ Zielgruppe | An, mit Vorschlägen: Interessen **Tiny House, Tiny-House-Bewegung, Ferienhaus, Camping, Glamping, Gartenhaus, Fertighaus, Grundstück, Nachhaltiges Wohnen, Minimalismus** |
| Platzierungen | Advantage+ Platzierungen (hepsi). Feed'lerde 4:5, Stories/Reels'de 9:16, Rechte Spalte/Suche'de 1:1 görselini seç |

## 3. Anzeigengruppe 2 — Betreiber (B2B)

| Alan | Değer |
|---|---|
| Name | `DE-Betreiber-Camping-Hotel` |
| Conversion-Ort | Instant-Formulare (aynı form, "Nutzung" alanı ayırır) |
| Budget | **15 €/Tag**, 14 Tage |
| Alter | 30–65, Deutschland + Österreich + Schweiz (DE-sprachig) |
| Zielgruppe | Interessen: **Campingplatz, Glamping, Ferienpark, Hotellerie, Tourismus, Gastgewerbe**; Verhalten: **Inhaber kleiner Unternehmen / Facebook-Seitenadministratoren (Reisen & Tourismus)** |
| Platzierungen | Advantage+; LinkedIn değil, burada Facebook Feed ağırlıklı çalışır |
| Anzeige | Varyant C (innen) + Varyant B; metin aşağıdaki B2B sürümü |

## 4. Instant-Formular (her iki Anzeigengruppe için bir form)

- Formulartyp: **Mehr Volumen**
- Intro: Überschrift "Tiny House ab Werk – Projektcheck in 48 Stunden"; Beschreibung
  "Wir melden uns mit Modellvorschlag, Lieferweg und Preisindikation."
- Fragen (sırayla): Vorname · E-Mail · Telefon · **Bundesland** (Freitext) ·
  **Nutzung** (Mehrfachauswahl: Wohnen / Ferienhaus / Vermietung / Campingplatz-Ferienpark /
  Hotel / Gemeinde) · **Zeitraum** (Auswahl: in 3 Monaten / in 6 Monaten / 2027 / nur informieren)
- Datenschutz-Link: `https://modunera.com/legal/datenschutz/`
- Danke-Seite: Überschrift "Danke – wir melden uns innerhalb von 48 Stunden."
  Button "Modelle ansehen" → `https://modunera.com/modelle/?utm_source=meta&utm_medium=paid&utm_campaign=de-leads-2026-10&utm_content=thankyou`
- Leads: Ads Manager → Alle Tools → **Instant-Formulare / Leads Center**. Oradan CSV indirilir.
  E-posta bildirimi için Leads Center'da bildirim adresi ekle (modunera.com'un MX'i
  çalışana kadar Gmail adresi kullan).

## 5. Anzeigen (Werbeanzeige seviyesi) — üç varyant, aynı Anzeigengruppe içinde

Format: Einzelnes Bild. Her varyant için üç görsel yüklenir ve platzierunga göre atanır.
CTA: **"Mehr dazu"** (B2C) / **"Angebot anfordern"** (B2B).
Website-URL (formun thank-you'su dışında kullanılmaz; Leads hedefinde zorunlu değil).

### Anzeige A — Natur (fiyatlı; bölüm 0'daki karar sonrasında)
- Primärtext (125 karaktere kadar ilk satır görünür):
  `Ein Tiny House, komplett ausgestattet, ab Werk nach Deutschland geliefert. Stahlrahmen, Holzfassade, Loft, Küche und Bad – in 15 Tagen auf deinem Platz. Projektcheck in 48 Stunden.`
- Überschrift: `Dein Platz in der Natur – ab 39.500 €`
- Beschreibung: `Acht Modelle, 2,55 m breit. Preisindikation ab Werk.`

### Anzeige B — Abend (fiyatsız)
- Primärtext:
  `Ankommen und abschalten. MODUNERA baut Tiny Houses in Serie: Stahlrahmen, drei Fassadenvarianten, fertig ausgebaut ab Werk. Lieferung nach Deutschland per Tieflader. Sag uns, wo es stehen soll – wir sagen dir, was geht.`
- Überschrift: `Tiny House ab Werk, fertig ausgebaut`
- Beschreibung: `Modell, Lieferweg und Preisindikation in 48 Stunden.`

### Anzeige C — Innen (fiyatsız; B2B ve B2C)
- Primärtext (B2C):
  `Klein gebaut, groß gedacht: Loft, Küche, Bad und Stauraum auf 2,55 m Breite. Acht Grundrisse auf derselben technischen Basis – für Wohnen, Ferienhaus oder Vermietung.`
- Primärtext (B2B, Anzeigengruppe 2):
  `Für Campingplätze, Ferienparks und Hotels: Tiny Houses in Serie, ein Grundriss, eine Ausstattungsliste, Lieferung in der Nebensaison. Was ein Betreiber vor der Anfrage klären sollte, steht auf modunera.com/gewerblich.`
- Überschrift: `Acht Modelle, ein Standard`
- Beschreibung: `Fertig ausgebaut ab Werk. Projektcheck in 48 Stunden.`

## 6. Ölçüm ve karar kuralları

- 7. gün: CTR (Link) < %0,8 olan varyantı durdur. CPL (Lead başı maliyet) 25 €'nun
  üstündeyse metni değiştir, görseli değil.
- 14. gün: toplam lead, Nutzung dağılımı ve Bundesland dağılımına bak. Lead'leri
  Excel'deki alıcı listesinin yanına, CRM'e yaz.
- Pixel eklendikten sonra: ikinci kampanya "Website-Conversions" (Formular `projektanfrage`
  gönderimi = Lead event), landing `https://modunera.com/kontakt/?utm_source=meta&utm_medium=paid&utm_campaign=de-conv-2026-11`.
- Her hafta: Ads Manager → Spalten → "Leistung und Klicks"; Ergebnisse, Kosten pro Ergebnis,
  CTR, Frequenz (>3 ise görsel yorulmuş, varyant değiştir).

## 7. Meta'nın isteyecekleri

- Facebook-Seite'de **Impressum** alanı dolu olmalı (Almanya'da zorunlu): `https://modunera.com/legal/impressum/`
- Zahlungsmethode ve Unternehmensinformationen (Business Manager → Einstellungen).
- Görsellerde fotoğraf kullanıldı, render yok; "Visualisierung" etiketi gerekmez.
- Reklamda vaat edilen her şey (fiyat, 15 gün, "komplett ausgestattet") teklifte de aynı olmalı.
