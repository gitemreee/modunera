/* /tiny-house-leben/ — scroll scenes, charts, calculator and the enquiry form.
   No dependencies. Everything degrades: without JS the page is a readable long
   article with a working Netlify form; with prefers-reduced-motion the scenes
   stand still in a finished state. */
(() => {
  "use strict";
  const d = document, root = d.documentElement;
  root.classList.add("js");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = d) => el.querySelector(s);
  const $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`; };
  const ramp = (stops, t) => {
    if (t <= stops[0][0]) return mix(stops[0][1], stops[0][1], 0);
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) { const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, (t - t0) / (t1 - t0)); }
    }
    const last = stops[stops.length - 1][1];
    return mix(last, last, 0);
  };
  const nf = (dec) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const eur = (v) => `${nf(0).format(Math.round(v))} €`;
  let vh = innerHeight, vw = innerWidth;

  /* pinned-section progress: 0 when its top meets the viewport top, 1 when its bottom meets the viewport bottom */
  const pinProgress = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - vh)); };

  /* ------------------------------------------------------------ header, clock */
  const bar = $("[data-bar]"), prog = $("[data-progress]"), clock = $("[data-clock]"), clockBox = $(".bar-clock");
  function updateBar() {
    const max = Math.max(1, root.scrollHeight - vh);
    const p = clamp(scrollY / max);
    bar.classList.toggle("solid", scrollY > 30);
    prog.style.transform = `scaleX(${p})`;
    const mins = Math.round(lerp(5 * 60 + 40, 23 * 60 + 40, p));
    const hh = String(Math.floor(mins / 60)).padStart(2, "0"), mm = String(Math.floor((mins % 60) / 5) * 5).padStart(2, "0");
    const txt = `${hh}:${mm}`;
    if (clock.textContent !== txt) clock.textContent = txt;
    clockBox.classList.toggle("night", mins < 6 * 60 + 30 || mins > 20 * 60 + 45);
  }

  /* ------------------------------------------------------------ hero: night to morning */
  const hero = $("[data-hero]");
  const stage = $(".hero-stage", hero), sky = $("[data-sky]", hero), sun = $(".h-sun", hero);
  const layers = $$(".lyr", hero).map((g) => ({ g, depth: Number(g.dataset.depth) }));
  const lines = $$(".hl", hero), foot = $(".hero-foot", hero), cue = $(".hero-cue", hero);
  const SKY = {
    top: [[0, "#060A18"], [0.3, "#121B3B"], [0.55, "#2B4A80"], [0.8, "#5F9BD0"], [1, "#6FA8DC"]],
    mid: [[0, "#0F1730"], [0.3, "#383C69"], [0.55, "#D27E6C"], [0.8, "#A9CDE6"], [1, "#BFDDF0"]],
    bot: [[0, "#202A48"], [0.3, "#865C78"], [0.55, "#F7C68B"], [0.8, "#F3E3C3"], [1, "#EAF2E8"]],
  };
  const TONE = {
    "--c-far": [[0, "#161D38"], [0.45, "#5B5478"], [0.75, "#9DB0C4"], [1, "#A9BDCC"]],
    "--c-mid": [[0, "#111829"], [0.45, "#43415E"], [0.75, "#6F8F86"], [1, "#7C9C86"]],
    "--c-forest": [[0, "#0A111C"], [0.45, "#22283A"], [0.75, "#2E5139"], [1, "#2F5A3C"]],
    "--c-meadow": [[0, "#0A0F18"], [0.45, "#2B2E33"], [0.75, "#5D8549"], [1, "#668F4F"]],
    "--c-grass": [[0, "#0D1420"], [0.45, "#33362F"], [0.75, "#4F7640"], [1, "#557E45"]],
    "--c-fore": [[0, "#04070C"], [0.45, "#151A17"], [0.75, "#24402A"], [1, "#26402A"]],
    "--c-wall": [[0, "#141920"], [0.45, "#3E3230"], [0.75, "#8A5A36"], [1, "#94623B"]],
    "--c-roof": [[0, "#0A0D12"], [0.45, "#1E2025"], [0.75, "#2E3B41"], [1, "#2E3B41"]],
    "--c-glass": [[0, "#0D131F"], [0.45, "#2A3346"], [0.75, "#8FB8D0"], [1, "#A6CBDD"]],
    "--ink": [[0, "#F4EFE6"], [0.58, "#F4EFE6"], [0.8, "#10201A"], [1, "#10201A"]],
  };
  const LINE_WIN = [[-1, 0.27], [0.31, 0.57], [0.61, 2]];
  let heroP = -1;
  function setHero(p) {
    if (Math.abs(p - heroP) < 0.0005) return;
    heroP = p;
    sky.style.background = `linear-gradient(180deg,${ramp(SKY.top, p)} 0%,${ramp(SKY.mid, p)} 58%,${ramp(SKY.bot, p)} 100%)`;
    for (const k in TONE) stage.style.setProperty(k, ramp(TONE[k], p));
    stage.style.setProperty("--stars", (1 - smooth(0.25, 0.62, p)).toFixed(3));
    stage.style.setProperty("--glow", (1 - smooth(0.42, 0.82, p) * 0.88).toFixed(3));
    stage.style.setProperty("--mist", (0.12 + smooth(0.18, 0.45, p) * 0.7 * (1 - smooth(0.72, 1, p) * 0.75)).toFixed(3));
    stage.style.setProperty("--birds", smooth(0.62, 0.82, p).toFixed(3));
    sun.setAttribute("transform", `translate(${(lerp(30, -60, p)).toFixed(1)} ${(lerp(1080, 250, smooth(0.28, 1, p))).toFixed(1)})`);
    for (const { g, depth } of layers) g.setAttribute("transform", `translate(0 ${(depth * p * 70).toFixed(1)})`);
    lines.forEach((el, i) => {
      const [a, b] = LINE_WIN[i];
      const o = i === 0 ? 1 - smooth(b - 0.05, b + 0.03, p) : smooth(a - 0.03, a + 0.05, p) * (1 - smooth(b - 0.05, b + 0.03, p));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${((1 - o) * (p < a + 0.05 ? 34 : -34)).toFixed(1)}px) scale(${(0.97 + o * 0.03).toFixed(3)})`;
    });
    const f = smooth(0.7, 0.86, p);
    foot.style.opacity = f.toFixed(3);
    foot.style.transform = `translateY(${((1 - f) * 22).toFixed(1)}px)`;
    foot.style.pointerEvents = f > 0.5 ? "auto" : "none";
    cue.style.opacity = (1 - smooth(0.02, 0.1, p)).toFixed(3);
    heroFlies && heroFlies.alpha(1 - smooth(0.3, 0.56, p));
  }

  /* ------------------------------------------------------------ fireflies and stars on canvas */
  function sky2d(canvas, opts) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, visible = false, running = false, alpha = 1, raf = 0;
    const R = (() => { let s = opts.seed || 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const flies = Array.from({ length: opts.flies }, () => ({ x: R(), y: lerp(opts.yMin, opts.yMax, R()), a: R() * 6.28, sp: 0.00012 + R() * 0.00025, ph: R() * 6.28, r: 1.2 + R() * 1.6 }));
    const stars = Array.from({ length: opts.stars || 0 }, () => ({ x: R(), y: R() * (opts.starMax || 0.6), r: 0.4 + R() * R() * 1.6, ph: R() * 6.28, sp: 0.6 + R() * 2 }));
    let shoot = null, nextShoot = 2500;
    /* one soft glow sprite, drawn once: a radial gradient reads as light, a flat disc reads as grey */
    const sprite = d.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sg = sprite.getContext("2d"), grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,236,160,1)"); grad.addColorStop(0.18, "rgba(255,214,110,.75)"); grad.addColorStop(0.5, "rgba(255,190,80,.18)"); grad.addColorStop(1, "rgba(255,180,60,0)");
    sg.fillStyle = grad; sg.fillRect(0, 0, 64, 64);
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(t) {
      if (!visible || alpha < 0.01) { running = false; ctx.clearRect(0, 0, w, h); return; }
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = alpha * (0.45 + 0.55 * Math.abs(Math.sin(t * 0.001 * s.sp + s.ph)));
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, 6.283); ctx.fill();
      }
      if (opts.shooting) {
        if (!shoot && t > nextShoot) shoot = { x: 0.2 + R() * 0.6, y: 0.05 + R() * 0.25, t0: t };
        if (shoot) {
          const k = (t - shoot.t0) / 900;
          if (k > 1) { shoot = null; nextShoot = t + 4000 + R() * 5000; }
          else {
            const x = (shoot.x + k * 0.18) * w, y = (shoot.y + k * 0.09) * h;
            const g = ctx.createLinearGradient(x, y, x - 120, y - 60);
            g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.globalAlpha = alpha * Math.sin(k * Math.PI);
            ctx.strokeStyle = g; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 120, y - 60); ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = "lighter";
      for (const f of flies) {
        f.a += (Math.sin(t * 0.0004 + f.ph) * 0.02);
        f.x += Math.cos(f.a) * f.sp * 16; f.y += Math.sin(f.a) * f.sp * 10;
        if (f.x < -0.02) f.x = 1.02; if (f.x > 1.02) f.x = -0.02;
        if (f.y < opts.yMin) f.a = Math.abs(f.a); if (f.y > opts.yMax) f.a = -Math.abs(f.a);
        const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.002 + f.ph));
        const x = f.x * w, y = f.y * h;
        const R2 = f.r * 9;
        ctx.globalAlpha = alpha * pulse;
        ctx.drawImage(sprite, x - R2, y - R2, R2 * 2, R2 * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!running && visible && alpha >= 0.01 && !RM) { running = true; raf = requestAnimationFrame(frame); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { rootMargin: "100px" }).observe(canvas);
    size();
    if (RM) { visible = true; frame(0); cancelAnimationFrame(raf); running = false; }
    return { resize: () => { size(); if (RM) { frame(0); cancelAnimationFrame(raf); } }, alpha: (a) => { alpha = a; if (RM) { frame(0); cancelAnimationFrame(raf); running = false; } else kick(); } };
  }
  const heroFlies = sky2d($('[data-flies="hero"]'), { flies: vw < 700 ? 18 : 34, yMin: 0.58, yMax: 0.95, seed: 11 });
  const ctaSky = sky2d($('[data-flies="cta"]'), { flies: vw < 700 ? 14 : 26, yMin: 0.62, yMax: 0.92, stars: vw < 700 ? 90 : 190, starMax: 0.55, shooting: true, seed: 29 });

  /* ------------------------------------------------------------ manifesto */
  const mani = $("[data-manifesto]"), words = $$(".mani-text span", mani);
  let lit = -1;
  function updateMani() {
    const r = $(".mani-text", mani).getBoundingClientRect();
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25));
    const n = RM ? words.length : Math.round(p * words.length);
    if (n === lit) return;
    lit = n;
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  }

  /* ------------------------------------------------------------ reveal + count-up */
  function countUp(el) {
    const to = Number(el.dataset.to), dec = Number(el.dataset.dec || 0), f = nf(dec);
    if (RM) { el.textContent = f.format(to); return; }
    const t0 = performance.now(), dur = 1500;
    const step = (t) => { const k = clamp((t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = f.format(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      $$(".count", e.target).forEach(countUp);
      io.unobserve(e.target);
    }
  }, { threshold: 0.18 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ------------------------------------------------------------ tooltips */
  const tip = $("[data-tipbox]");
  let tipTimer = 0;
  const showTip = (text, x, y) => {
    tip.textContent = text; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = `${clamp(x - r.width / 2, 8, vw - r.width - 8)}px`;
    tip.style.top = `${y - r.height - 14 < 8 ? y + 18 : y - r.height - 14}px`;
  };
  const hideTip = () => { tip.hidden = true; };
  $$("[data-tip]").forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") showTip(el.dataset.tip, e.clientX, e.clientY); });
    el.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") showTip(el.dataset.tip, e.clientX, e.clientY); });
    el.addEventListener("pointerleave", hideTip);
    el.addEventListener("focus", () => { const r = el.getBoundingClientRect(); showTip(el.dataset.tip, r.left + r.width / 2, r.top); });
    el.addEventListener("blur", hideTip);
    el.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      showTip(el.dataset.tip, e.clientX, e.clientY);
      clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2600);
    });
  });
  addEventListener("scroll", () => { if (!tip.hidden) hideTip(); }, { passive: true });

  /* ------------------------------------------------------------ calculator */
  const calc = $("[data-calc]");
  const out = (k) => $(`[data-r="${k}"]`, calc), barOf = (k) => $(`[data-b="${k}"]`, calc);
  const delivery = Number(calc.dataset.delivery || 0);
  const annuity = (P, rate, years) => { if (P <= 0) return 0; const r = rate / 100 / 12, n = years * 12; return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n)); };
  let calcState = null;
  function runCalc() {
    const v = (n) => Number(calc.elements[n].value);
    const area = v("area"), m2 = v("eur_m2"), equity = v("equity"), rate = v("rate"), years = v("years");
    const opt = calc.elements.model.selectedOptions[0];
    const tiny = Number(opt.value) + (calc.elements.delivery.checked ? delivery : 0);
    const efh = area * m2;
    const n = years * 12;
    const rE = annuity(efh - equity, rate, years), rT = annuity(tiny - equity, rate, years);
    const iE = Math.max(0, rE * n - Math.max(0, efh - equity)), iT = Math.max(0, rT * n - Math.max(0, tiny - equity));
    $('[data-o="area"]', calc).textContent = `${area} m²`;
    $('[data-o="eur_m2"]', calc).textContent = eur(m2);
    $('[data-o="equity"]', calc).textContent = eur(equity);
    $('[data-o="rate"]', calc).textContent = `${nf(1).format(rate)} %`;
    $('[data-o="years"]', calc).textContent = `${years} Jahre`;
    $$('input[type="range"]', calc).forEach((r) => r.style.setProperty("--fillp", `${((r.value - r.min) / (r.max - r.min)) * 100}%`));
    out("efh").textContent = eur(efh);
    out("tiny").textContent = eur(tiny);
    out("tinyname").textContent = `${opt.dataset.name}${calc.elements.delivery.checked ? " inkl. Lieferung" : " ab Werk"}`;
    const max = Math.max(efh, tiny);
    barOf("efh").style.width = `${(efh / max) * 100}%`;
    barOf("tiny").style.width = `${(tiny / max) * 100}%`;
    out("diff").textContent = eur(efh - tiny);
    out("rate_efh").textContent = `${eur(rE)} / Monat`;
    out("rate_tiny").textContent = rT > 0 ? `${eur(rT)} / Monat` : "kein Kredit nötig";
    out("int_efh").textContent = eur(iE);
    out("int_tiny").textContent = eur(iT);
    out("free").textContent = equity >= tiny
      ? `Mit ${eur(equity)} Eigenkapital wäre das ${opt.dataset.name} ohne Kredit bezahlt – und ${eur(equity - tiny)} blieben übrig.`
      : `Rund ${eur(rE - rT)} weniger Rate pro Monat und ${eur(iE - iT)} weniger Zinsen über ${years} Jahre – bei denselben Annahmen.`;
    calcState = { name: opt.dataset.name, tiny, efh, area, m2, equity, rate, years, delivery: calc.elements.delivery.checked };
  }
  calc.addEventListener("input", runCalc);
  calc.addEventListener("change", runCalc);
  runCalc();

  /* ------------------------------------------------------------ hand-off to the form */
  const lead = $("[data-lead]"), projekt = $("[data-projekt]", lead);
  function ask(text) {
    if (!projekt.value.includes(text)) projekt.value = (projekt.value ? `${projekt.value.trim()}\n` : "") + text;
    $("#anfrage").scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    setTimeout(() => lead.elements.Name.focus({ preventScroll: true }), RM ? 0 : 900);
  }
  $("[data-calc-ask]").addEventListener("click", () => {
    const s = calcState;
    ask(`Interesse an ${s.name}. Rechenbeispiel: ${eur(s.tiny)}${s.delivery ? " inkl. Lieferung (Richtwert)" : " ab Werk"} statt ${eur(s.efh)} Neubau (${s.area} m² × ${eur(s.m2)}).`);
  });
  $$(".mcard-ask").forEach((b) => b.addEventListener("click", () => ask(`Interesse an ${b.dataset.ask}.`)));

  /* ------------------------------------------------------------ a day: vertical scroll drives the track */
  const day = $("[data-day]"), track = $("[data-track]", day);
  let dayPinned = false, dayOverflow = 0;
  function layoutDay() {
    dayPinned = !RM && vw > 860;
    day.classList.toggle("pinned", dayPinned);
    if (!dayPinned) { day.style.height = ""; track.style.transform = ""; return; }
    dayOverflow = Math.max(0, track.scrollWidth - vw);
    day.style.height = `${vh + dayOverflow}px`;
  }
  function updateDay() {
    if (!dayPinned) return;
    const p = pinProgress(day);
    track.style.transform = `translate3d(${(-p * dayOverflow).toFixed(1)}px,0,0)`;
  }

  /* ------------------------------------------------------------ seasons */
  const seasons = $("[data-seasons]"), scene = $("[data-scene]", seasons), panel = $("#s-panel"), tabs = $$(".s-tab", seasons);
  let sIdx = 0, sAuto = !RM, sTimer = 0, sVisible = false;
  function setSeason(i, user) {
    sIdx = (i + tabs.length) % tabs.length;
    const id = tabs[sIdx].dataset.season;
    scene.className = `s-scene season-${id}`;
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === sIdx)); t.tabIndex = k === sIdx ? 0 : -1; });
    panel.innerHTML = $(`template[data-season="${id}"]`, seasons).innerHTML;
    panel.setAttribute("aria-labelledby", tabs[sIdx].id);
    if (user) { sAuto = false; clearInterval(sTimer); }
  }
  tabs.forEach((t, k) => {
    t.addEventListener("click", () => setSeason(k, true));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setSeason(sIdx + (e.key === "ArrowRight" ? 1 : -1), true); tabs[sIdx].focus(); }
    });
  });
  setSeason(0, false);
  new IntersectionObserver(([e]) => {
    sVisible = e.isIntersecting;
    clearInterval(sTimer);
    if (sVisible && sAuto) sTimer = setInterval(() => setSeason(sIdx + 1, false), 5200);
  }, { threshold: 0.4 }).observe(scene);

  /* ------------------------------------------------------------ exploded house */
  const ex = $("[data-explode]"), xsvg = $(".x-svg", ex), groups = $$(".x-g", ex).map((g) => ({ g, dx: Number(g.dataset.dx), dy: Number(g.dataset.dy) }));
  const list = $("[data-layers]", ex), items = $$("li", list), order = items.map((li) => li.dataset.layer);
  const toggle = $("[data-explode-toggle]", ex);
  let exPinned = !RM, exE = -1, exActive = undefined, exLock = null, exManual = 0;
  ex.classList.toggle("pinned", exPinned);
  ex.classList.toggle("static", !exPinned);
  if (exPinned) ex.style.height = "260vh";
  function setExplode(e) {
    if (Math.abs(e - exE) < 0.001) return;
    exE = e;
    for (const { g, dx, dy } of groups) g.style.transform = `translate(${(dx * e).toFixed(1)}px,${(dy * e).toFixed(1)}px)`;
    xsvg.style.transform = `scale(${(1.34 - 0.34 * e).toFixed(3)})`;
    xsvg.style.setProperty("--be", smooth(0.35, 0.8, e).toFixed(3));
  }
  function setActive(id) {
    if (id === exActive) return;
    exActive = id;
    items.forEach((li) => li.classList.toggle("on", li.dataset.layer === id));
    groups.forEach(({ g }) => g.classList.toggle("on", g.dataset.layer === id));
    xsvg.classList.toggle("has-active", !!id);
    list.classList.toggle("has-on", !!id);
  }
  function updateExplode() {
    if (!exPinned) return;
    const p = pinProgress(ex);
    setExplode(smooth(0.03, 0.4, p));
    if (exLock) return;
    const idx = p < 0.44 ? -1 : Math.min(order.length - 1, Math.floor(((p - 0.44) / 0.54) * order.length));
    setActive(idx < 0 ? null : order[idx]);
  }
  items.forEach((li) => {
    const on = () => { exLock = li.dataset.layer; setActive(exLock); };
    const off = () => { exLock = null; exActive = undefined; updateExplode(); if (!exPinned) setActive(null); };
    li.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") on(); });
    li.addEventListener("pointerleave", off);
    li.addEventListener("focus", on);
    li.addEventListener("blur", off);
  });
  groups.forEach(({ g }) => {
    g.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && (exE > 0.5)) { exLock = g.dataset.layer; setActive(exLock); } });
    g.addEventListener("pointerleave", () => { if (exLock) { exLock = null; exActive = undefined; updateExplode(); if (!exPinned) setActive(null); } });
  });
  toggle.addEventListener("click", () => {
    exManual = exManual ? 0 : 1;
    xsvg.classList.add("anim");
    exE = -1; setExplode(exManual);
    toggle.textContent = exManual ? "Zusammenbauen" : "Zerlegen";
    toggle.setAttribute("aria-pressed", String(!!exManual));
  });
  if (!exPinned) setExplode(0);

  /* ------------------------------------------------------------ models: filter, sort, tilt, price strip */
  const grid = $("[data-models]"), cards = $$(".mcard", grid), chips = $$(".chip"), sortBtn = $("[data-sort]");
  chips.forEach((c) => c.addEventListener("click", () => {
    chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
    const f = c.dataset.filter;
    cards.forEach((card) => card.classList.toggle("out", f !== "alle" && !card.dataset.tags.split(" ").includes(f)));
  }));
  sortBtn.addEventListener("click", () => {
    const on = sortBtn.getAttribute("aria-pressed") !== "true";
    sortBtn.setAttribute("aria-pressed", String(on));
    const sorted = [...cards].sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    cards.forEach((card) => { card.style.order = on ? String(sorted.indexOf(card)) : ""; });
  });
  const dots = $$(".ps-dot");
  const link = (key, on) => {
    dots.forEach((dt) => dt.classList.toggle("on", on && dt.dataset.model === key));
    cards.forEach((c) => c.classList.toggle("glow", on && c.dataset.model === key));
  };
  dots.forEach((dt) => {
    dt.addEventListener("pointerenter", () => link(dt.dataset.model, true));
    dt.addEventListener("pointerleave", () => link(dt.dataset.model, false));
    dt.addEventListener("click", () => {
      const card = cards.find((c) => c.dataset.model === dt.dataset.model);
      if (card) { card.classList.remove("out"); card.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); link(dt.dataset.model, true); setTimeout(() => link(dt.dataset.model, false), 1800); }
    });
  });
  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => link(card.dataset.model, true));
    card.addEventListener("pointerleave", () => { link(card.dataset.model, false); card.style.removeProperty("--rx"); card.style.removeProperty("--ry"); });
    if (RM) return;
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    });
  });

  /* ------------------------------------------------------------ route */
  const route = $("[data-route]"), rfig = $(".r-fig", route), rsvg = $(".r-svg", route);
  const rTrack = $(".r-track", rsvg), rDone = $(".r-done", rsvg), truck = $(".r-truck", rsvg);
  const rNodes = $$(".r-node", rsvg), rSteps = $$(".r-steps li", route), rLen = rTrack.getTotalLength();
  let routeP = -1;
  function updateRoute() {
    const r = rsvg.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const p = RM ? 1 : clamp((vh * 0.78 - r.top) / (vh * 0.62));
    if (Math.abs(p - routeP) < 0.0008) return;
    routeP = p;
    const at = rTrack.getPointAtLength(p * rLen), ahead = rTrack.getPointAtLength(Math.min(rLen, p * rLen + 2));
    const ang = clamp((Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI, -24, 24);
    truck.setAttribute("transform", `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    rDone.style.strokeDashoffset = String(1 - p);
    const reached = Math.min(rSteps.length - 1, Math.floor(p * rSteps.length * 0.999));
    rNodes.forEach((n, i) => n.classList.toggle("on", i <= reached));
    rSteps.forEach((s, i) => s.classList.toggle("on", i === reached));
  }

  /* ------------------------------------------------------------ body map: cards and hotspots in step */
  const bm = $("[data-bodymap]");
  if (bm) {
    const spots = $$(".bm-spot", bm), bcards = $$(".bm-card", bm), ids = bcards.map((c) => c.dataset.spot);
    let bmIdx = -1, bmUser = false, bmTimer = 0;
    const bmSet = (id) => {
      spots.forEach((s) => s.classList.toggle("on", s.dataset.spot === id));
      bcards.forEach((c) => c.classList.toggle("on", c.dataset.spot === id));
    };
    const pick = (id) => { bmUser = true; clearInterval(bmTimer); bmSet(id); };
    [...spots, ...bcards].forEach((el) => {
      el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pick(el.dataset.spot); });
      el.addEventListener("focus", () => pick(el.dataset.spot));
      el.addEventListener("click", () => {
        pick(el.dataset.spot);
        if (el.classList.contains("bm-spot")) { const c = bcards.find((x) => x.dataset.spot === el.dataset.spot); c && c.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "nearest" }); }
      });
    });
    new IntersectionObserver(([e]) => {
      clearInterval(bmTimer);
      if (e.isIntersecting && !bmUser && !RM) bmTimer = setInterval(() => { bmIdx = (bmIdx + 1) % ids.length; bmSet(ids[bmIdx]); }, 3200);
    }, { threshold: 0.35 }).observe(bm);
  }

  /* ------------------------------------------------------------ the enquiry form */
  const status = $("[data-status]", lead);
  lead.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!lead.reportValidity()) return;
    const btn = $(".f-send", lead);
    btn.disabled = true; btn.textContent = "Wird gesendet …";
    status.className = "f-status"; status.textContent = "";
    try {
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(lead)).toString() });
      if (!res.ok) throw new Error(String(res.status));
      lead.classList.add("sent");
      status.className = "f-status ok";
      status.textContent = "Danke! Deine Anfrage ist bei uns angekommen. Wir melden uns per E-Mail.";
      btn.textContent = "Gesendet";
    } catch {
      status.className = "f-status err";
      status.innerHTML = 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib uns direkt per <a href="https://wa.me/905535435342?text=Hallo%20MODUNERA%2C%20ich%20interessiere%20mich%20f%C3%BCr%20ein%20Tiny%20House.%20Bitte%20kontaktieren%20Sie%20mich." rel="noopener">WhatsApp</a>.';
      btn.disabled = false; btn.textContent = "Anfrage senden";
    }
  });

  /* ------------------------------------------------------------ loop */
  let ticking = false;
  function tick() {
    ticking = false;
    updateBar();
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) setHero(RM ? 1 : pinProgress(hero));
    updateMani();
    updateDay();
    updateExplode();
    updateRoute();
  }
  const ask4 = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  addEventListener("scroll", ask4, { passive: true });
  let rz = 0;
  addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (Math.abs(innerWidth - vw) < 2 && Math.abs(innerHeight - vh) < 120) { vh = innerHeight; ask4(); return; }
      vw = innerWidth; vh = innerHeight;
      layoutDay(); heroFlies.resize(); ctaSky.resize(); heroP = -1; exE = -1; routeP = -1; ask4();
    }, 150);
  });
  layoutDay();
  addEventListener("load", () => { layoutDay(); ask4(); });
  tick();
})();
