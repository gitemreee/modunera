# Conversion events

Date: 2026-08-16
Implementation: `assets/js/main.js`, the `track()` block.
Configuration: `assets/js/integration-config.json` — empty in the repository, and
it must stay that way. No measurement ID belongs in version control.

## What is being measured, and why these events

Nothing on this site posts to a server. A lead form writes to `localStorage` and
hands the text to WhatsApp. That makes **the WhatsApp click the conversion** —
and until now it was the one thing not measured. GA4, GTM and Clarity were being
loaded behind the consent gate and no code ever emitted an event, so the question
the business actually has had no answer:

> Which of 15,000 pages produce contact?

Five events answer it.

| Event | Fires when | Extra parameters |
|---|---|---|
| `whatsapp_click` | any `a[href^="https://wa.me/"]` is clicked | `link_place` |
| `whatsapp_panel_open` | the dock panel is opened by its button | `trigger` |
| `phone_click` | any `a[href^="tel:"]` is clicked | `link_place` |
| `document_download` | a `.pdf` or `.zip` link is clicked | `file` |
| `lead_form_submit` | a `form[data-lead-form]` is submitted | `form_id`, `fields` |

Every event also carries:

| Parameter | Value | Why it is there |
|---|---|---|
| `page_path` | `location.pathname` | the raw address |
| `page_type` | `home`, `model`, `location`, `country`, `service`, `guide`, `blog`, `faq`, `tool`, `contact`, `legal`, `other` | with 15,000 pages a raw path is noise; the useful cut is which *kind* of page produced the click, and the slugs are fixed per locale so this is decidable from the URL in all five languages |
| `page_lang` | `<html lang>` | which market |
| `link_place` | `dock`, `nav`, `hero`, `cta-band`, `footer`, `form`, `inline` | a dock click and a hero click are the same event with very different meaning — one is a reader who scrolled and decided, the other a reader who arrived ready |

## Consent

`track()` pushes to `window.dataLayer` and calls `window.gtag` **when they
exist**, and does nothing otherwise. It does not queue and it does not retain.

Both globals are created inside `initIntegrations()`, which returns immediately
unless `localStorage.mcCookie === 'all'`. So: no consent → no globals → no event.
This is the behaviour the cookie notice already promises in five languages
("Analyse- und Marketingdienste sind nicht aktiv"), and it now holds by
construction rather than by there being no events to send.

A reader who chooses "Nur notwendig" is measured in no way at all.

## Turning it on

1. Create the GA4 property, or the GTM container, or both.
2. Put the IDs in `assets/js/integration-config.json` **on the server**, not in
   the repository:
   ```json
   { "ga4MeasurementId": "G-XXXXXXX", "gtmContainerId": "", "clarityProjectId": "" }
   ```
   The file is fetched at runtime, so it can be written by the deploy rather than
   committed. If it is ever committed with a real ID, that is a value in public
   git history — recoverable but permanent.
3. In GA4, register the five event names as custom events, and
   `page_type`, `link_place`, `page_lang` as **custom dimensions**. Without the
   dimension registration the parameters arrive and are not reportable, which is
   the most common reason a GA4 setup looks empty when it is not.
4. Mark `whatsapp_click` and `lead_form_submit` as **key events** (conversions).

## The first three reports worth building

1. **`whatsapp_click` by `page_type`.** This is the whole question. If location
   pages produce a meaningful share of contact, the 14,650 `noindex` pages have a
   case for the quality gate. If they produce none, that case is closed and the
   effort belongs on models and guides.
2. **`whatsapp_panel_open` against `whatsapp_click`.** The gap between them is
   the dock panel's own drop-off — people who opened it and did not go through.
   If that gap is large, the panel's copy is the problem, not the traffic.
3. **`whatsapp_click` by `page_lang`.** Which of the five markets actually
   converts, against which produces traffic. They will not be the same list, and
   the difference is where the next language's effort should go.

## What is deliberately not measured

- **Scroll depth, time on page, rage clicks.** Clarity does these if it is
  configured; duplicating them costs bytes and adds nothing.
- **The content of a lead.** `lead_form_submit` carries the count of fields, not
  the fields. Names, addresses and project details stay in `localStorage` and in
  WhatsApp; sending them to an analytics vendor would be a data transfer the
  privacy notice does not describe.
- **Anything at all before consent.** See above.

## Verification

Checked in Chromium on `/`, `/standorte/bayern/schmidmuehlen/`,
`/leistungen/modulbau/` and `/qualitaet/`: `window.MODUNERA.track` exists on each,
a WhatsApp click emits `whatsapp_click` with `page_type` of `home`, `location`,
`service` and `other` respectively, and no page throws.

To repeat it: serve the repository root, open a page, run
`localStorage.setItem('mcCookie','all')`, reload, then in the console
`window.dataLayer = []` and click a WhatsApp link — the event is the first entry.
