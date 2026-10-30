# Exploded isometric technical illustration of a MODUNERA tiny house (SVG, numbered callouts).
import math, pathlib
K = pathlib.Path(__file__).parent
C, SN = math.cos(math.radians(30)), math.sin(math.radians(30))
L, W, H = 8.0, 2.55, 2.75

def make(S=46, OX=0, OY=0):
    BND = []
    def P(x, y, z):
        r = (OX + (x - y) * C * S, OY + (x + y) * SN * S - z * S); BND.append(r); return r
    def pts(ps): return " ".join(f"{a:.1f},{b:.1f}" for a, b in (P(*p) for p in ps))
    def poly(ps, fill, stroke="#1f2a24", sw=.8, op=1, extra=""):
        return f'<polygon points="{pts(ps)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" fill-opacity="{op}" stroke-linejoin="round"{extra}/>'
    def ln(a, b, c="#1f2a24", w=.8, dash=""):
        (x1, y1), (x2, y2) = P(*a), P(*b)
        d = f' stroke-dasharray="{dash}"' if dash else ""
        return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d} stroke-linecap="round"/>'
    def box(x0, y0, z0, dx, dy, dz, m, op=1):
        x1, y1, z1 = x0 + dx, y0 + dy, z0 + dz
        t, a, b = MAT[m]
        return (poly([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], a, op=op) +
                poly([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], b, op=op) +
                poly([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], t, op=op))
    return P, poly, ln, box, BND

GRAD = {
 "wood": ("#c08a58", "#8f5f37"), "woodL": ("#a8774a", "#7c5130"), "woodT": ("#d3a06c", "#b27f4f"),
 "dark": ("#59636a", "#2e353a"), "darkL": ("#3d454a", "#22282c"), "darkT": ("#6b767d", "#4b5459"),
 "lin": ("#f7f2e8", "#e2d8c4"), "linL": ("#e8dfcd", "#d3c7ae"), "linT": ("#fbf8f1", "#ece4d4"),
 "ins": ("#efd690", "#d8b766"), "insL": ("#dcbd6c", "#c4a253"), "insT": ("#f5e2a6", "#e3c77c"),
 "stl": ("#b9c2c7", "#8b979e"), "stlL": ("#97a3a9", "#727f86"), "stlT": ("#cbd2d6", "#a7b1b7"),
 "glass": ("#e3f1f6", "#8fb7c9"),
 "white": ("#ffffff", "#e9e9e6"), "whiteL": ("#e6e6e2", "#cfcfca"), "whiteT": ("#ffffff", "#f3f3f0"),
 "sage": ("#93a58a", "#6f8266"), "sageL": ("#76886d", "#5d6e55"), "sageT": ("#a7b89e", "#8fa185"),
 "floor": ("#cf9d68", "#b07d4d"), "floorL": ("#9b6c40", "#7d5432"), "floorT": ("#dcae7c", "#c99764"),
}
def defs():
    g = "".join(f'<linearGradient id="g{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>' for k, (a, b) in GRAD.items())
    g += '<radialGradient id="shadow"><stop offset="0" stop-color="#1f2a24" stop-opacity=".22"/><stop offset="1" stop-color="#1f2a24" stop-opacity="0"/></radialGradient>'
    g += '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1f2a24" flood-opacity=".18"/></filter>'
    return f"<defs>{g}</defs>"
MAT = {m: (f"url(#g{m}T)", f"url(#g{m})", f"url(#g{m}L)") for m in ("wood", "dark", "lin", "ins", "stl", "white", "sage", "floor")}

def house():
    P, poly, ln, box, BND = make(S=46, OX=0, OY=0)
    out, marks = [], {}
    # ground shadow under the chassis
    cx, cy = P(L / 2, W / 2, -3.6)
    out.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="330" ry="120" fill="url(#shadow)"/>')
    # 1 chassis
    zc = -3.5
    for yy in (0.3, W - 0.5):
        out.append(box(-1.0, yy, zc, L + 1.0, 0.18, 0.22, "stl"))
    for xx in (0.2, 2.5, 4.9, 7.6):
        out.append(box(xx, 0.3, zc, 0.15, W - 0.62, 0.16, "stl"))
    out.append(box(-1.9, W / 2 - 0.08, zc, 0.95, 0.16, 0.14, "stl"))
    for xx in (3.4, 4.4):
        a, b = P(xx, W + 0.02, zc - 0.2)
        out.append(f'<g transform="rotate(-30 {a:.1f} {b:.1f})"><ellipse cx="{a:.1f}" cy="{b:.1f}" rx="16" ry="22" fill="#1b1f22"/><ellipse cx="{a:.1f}" cy="{b:.1f}" rx="7" ry="10" fill="#8b979e"/></g>')
    for xx, yy in ((0.0, 0.1), (L - 0.2, 0.1), (0.0, W - 0.2), (L - 0.2, W - 0.2)):
        out.append(box(xx, yy, zc - 0.7, 0.12, 0.12, 0.7, "stl"))
    marks[1] = P(L + 0.2, W - 0.4, zc + 0.1)
    # 2 floor build-up, slightly separated
    zf = -2.0
    out.append(box(0, 0, zf, L, W, 0.14, "stl"))
    out.append(box(0, 0, zf + 0.42, L, W, 0.14, "ins"))
    out.append(box(0, 0, zf + 0.84, L, W, 0.07, "floor"))
    marks[2] = P(L, W * 0.5, zf + 0.48)
    # back wall (pulled to y = -2.3): inner lining visible, window opening
    def wall_back(y0):
        s = box(0, y0, 0, L, 0.08, H, "ins") + box(0, y0 + 0.08, 0, L, 0.05, H, "lin")
        s += poly([(1.2, y0 + 0.13, 1.1), (2.6, y0 + 0.13, 1.1), (2.6, y0 + 0.13, 2.1), (1.2, y0 + 0.13, 2.1)], "url(#gglass)", "#2b3437", 1.6)
        return s
    out.append(wall_back(-2.3))
    marks[6] = P(5.0, -2.3 + 0.13, 1.6)
    # left end wall (x pulled to -2.6)
    out.append(box(-2.6, 0, 0, 0.08, W, H, "ins") + box(-2.52, 0, 0, 0.05, W, H, "lin"))
    # 3 interior (sits on the floor deck)
    zi = zf + 0.91
    out.append(box(0.25, 0.12, zi, 2.4, 0.62, 0.88, "white"))                  # kitchen base
    out.append(box(0.25, 0.12, zi + 0.88, 2.4, 0.64, 0.05, "floor"))           # worktop
    out.append(poly([(1.2, 0.3, zi + 0.94), (1.7, 0.3, zi + 0.94), (1.7, 0.6, zi + 0.94), (1.2, 0.6, zi + 0.94)], "#9aa3a8", "#4b5459", .8))  # sink
    out.append(box(0.25, 0.12, zi + 1.55, 2.4, 0.34, 0.62, "white"))           # wall cabinets
    out.append(box(3.0, 1.55, zi, 1.9, 0.8, 0.4, "sage"))                      # sofa
    out.append(box(3.0, 2.17, zi + 0.4, 1.9, 0.18, 0.4, "sage"))
    out.append(box(3.3, 0.7, zi + 0.68, 0.9, 0.6, 0.04, "floor"))              # table
    out.append(box(3.7, 0.95, zi, 0.08, 0.08, 0.68, "stl"))
    out.append(box(5.95, 0.12, zi, 1.9, 1.3, 2.0, "white", op=.96))            # bathroom
    out.append(poly([(6.4, 1.42, zi + 0.05), (7.1, 1.42, zi + 0.05), (7.1, 1.42, zi + 1.9), (6.4, 1.42, zi + 1.9)], "url(#gwoodL)", "#1f2a24", .8))
    for k in range(5):                                                          # stairs
        out.append(box(5.4, 1.65, zi + k * 0.38, 0.45, 0.8, 0.38, "floor"))
    out.append(box(5.55, 0.08, zi + 2.12, 2.4, W - 0.16, 0.09, "floor"))       # loft
    out.append(box(5.9, 0.3, zi + 2.21, 1.9, 1.5, 0.18, "white"))              # mattress
    out.append(box(5.9, 0.3, zi + 2.39, 0.4, 1.5, 0.1, "white"))
    marks[3] = P(1.4, 0.4, zi + 0.95)
    marks[4] = P(6.9, 1.42, zi + 1.0)
    marks[5] = P(7.0, 1.0, zi + 2.42)
    # right end wall: dark standing seam, glass door (x pulled to L + 2.6)
    xr = L + 2.6
    out.append(box(xr - 0.18, 0, 0, 0.1, W, H, "ins") + box(xr - 0.08, 0, 0, 0.08, W, H, "dark"))
    for k in range(1, 9):
        out.append(ln((xr, k * 0.28, 0.02), (xr, k * 0.28, H - 0.02), "#1d2226", .7))
    out.append(poly([(xr, 0.55, 0.05), (xr, 1.75, 0.05), (xr, 1.75, 2.3), (xr, 0.55, 2.3)], "url(#gglass)", "#15191b", 2.4))
    out.append(ln((xr, 1.15, 0.05), (xr, 1.15, 2.3), "#15191b", 1.6))
    marks[8] = P(xr, 1.45, 1.5)
    # front long wall: thermowood facade with windows (y pulled to W + 3.0)
    yf = W + 3.0
    out.append(box(0, yf - 0.18, 0, L, 0.1, H, "ins") + box(0, yf - 0.08, 0, L, 0.08, H, "wood"))
    wins = ((0.7, 3.2, 0.25, 2.45), (4.3, 5.3, 1.25, 2.3), (6.1, 7.4, 1.25, 2.3))
    for k in range(1, 40):
        xx = k * 0.2
        if not any(a - .04 < xx < b + .04 for a, b, _, _ in wins):
            out.append(ln((xx, yf, 0.03), (xx, yf, H - 0.03), "#6f4a2a", .55))
    for a, b, z0, z1 in wins:
        out.append(poly([(a, yf, z0), (b, yf, z0), (b, yf, z1), (a, yf, z1)], "#22292c", "#15191b", 1))
        out.append(poly([(a + .06, yf, z0 + .06), (b - .06, yf, z0 + .06), (b - .06, yf, z1 - .06), (a + .06, yf, z1 - .06)], "url(#gglass)", "none", 0))
        out.append(ln(((a + b) / 2, yf, z0), ((a + b) / 2, yf, z1), "#15191b", 1.4))
        out.append(poly([(a + .2, yf, z1 - .1), (a + .45, yf, z1 - .1), (a + .15, yf, z0 + .3), (a + .1, yf, z0 + .55)], "#ffffff", "none", 0, ' fill-opacity=".35"'))
    marks[7] = P(2.0, yf, 1.6)
    marks[9] = P(7.6, yf - 0.1, H)
    # roof: insulation layer + standing-seam sheet (lifted)
    zr = H + 3.1
    out.append(box(-0.1, -0.1, zr, L + 0.2, W + 0.2, 0.16, "ins"))
    zs = zr + 0.9
    sheet = [(-0.3, -0.3, zs + 0.45), (L + 0.3, -0.3, zs + 0.45), (L + 0.3, W + 0.3, zs), (-0.3, W + 0.3, zs)]
    out.append(poly([(-0.3, W + 0.3, zs), (L + 0.3, W + 0.3, zs), (L + 0.3, W + 0.3, zs - 0.12), (-0.3, W + 0.3, zs - 0.12)], "#252b2f", "#15191b", .8))
    out.append(poly(sheet, "url(#gdarkT)", "#15191b", 1))
    for k in range(1, 18):
        xx = -0.3 + k * 0.48
        out.append(ln((xx, -0.3, zs + 0.45), (xx, W + 0.3, zs), "#2b3236", 1.1))
    marks[10] = P(L - 1.2, W * 0.45, zs + 0.2)
    marks[11] = P(L + 0.1, W * 0.5, zr + 0.1)
    # dashed assembly guides
    G = [((0, W, 0), (0, yf - 0.18, 0)), ((L, W, 0), (L, yf - 0.18, 0)), ((L, 0, 0), (xr - 0.18, 0, 0)), ((L, W, H), (xr - 0.18, W, H)),
         ((0, 0, H), (0, 0, zr)), ((L, 0, H), (L, 0, zr)), ((0, W, H), (0, W, zr)), ((0, 0, H), (0, -2.3, H)), ((0, 0, 0), (-2.52, 0, 0)),
         ((L, W, zf), (L, W - 0.32, zc + 0.22)), ((0, W, zf), (0, W - 0.32, zc + 0.22))]
    guides = "".join(ln(a, b, "#97311A", .9, "4 5") for a, b in G)
    callouts = ""
    for n, (x, y) in marks.items():
        callouts += f'<g><circle cx="{x:.1f}" cy="{y:.1f}" r="15" fill="#3A5A40" stroke="#fff" stroke-width="2.5"/><text x="{x:.1f}" y="{y+5.5:.1f}" text-anchor="middle" font-family="Inter,sans-serif" font-size="15" font-weight="600" fill="#fff">{n}</text></g>'
    xs = [a for a, _ in BND]; ys = [b for _, b in BND]
    x0, y0, x1, y1 = min(xs) - 30, min(ys) - 30, max(xs) + 30, max(ys) + 40
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {x1-x0:.0f} {y1-y0:.0f}">{defs()}{guides}{"".join(out)}{callouts}</svg>'

def section():
    P, poly, ln, box, BND = make(S=120)
    out = []
    layers = [("lin", 0.04, "A"), ("stl", 0.08, "B"), ("ins", 0.14, "C"), ("wood", 0.06, "D")]
    y = 0.0
    marks = []
    for m, t, tag in layers:
        if m == "stl":
            for xx in (0.05, 0.7, 1.35):
                out.append(box(xx, y, 0, 0.1, t, 1.5, m))
        else:
            out.append(box(0, y, 0, 1.5, t, 1.5, m))
            if m == "wood":
                for k in range(1, 8):
                    out.append(ln((k * 0.19, y + t, 0.03), (k * 0.19, y + t, 1.47), "#6f4a2a", .7))
        marks.append((P(1.5, y + t / 2, 1.5), tag))
        y += t + 0.5
    c = "".join(f'<circle cx="{x:.1f}" cy="{yy:.1f}" r="13" fill="#97311A" stroke="#fff" stroke-width="2"/><text x="{x:.1f}" y="{yy+5:.1f}" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="600" fill="#fff">{tag}</text>' for (x, yy), tag in marks)
    xs = [a for a, _ in BND]; ys = [b for _, b in BND]
    x0, y0, x1, y1 = min(xs) - 20, min(ys) - 20, max(xs) + 20, max(ys) + 20
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {x1-x0:.0f} {y1-y0:.0f}">{defs()}{"".join(out)}{c}</svg>'

(K / "exploded-house.svg").write_text(house(), encoding="utf-8")
(K / "exploded-section.svg").write_text(section(), encoding="utf-8")
print("ok")
