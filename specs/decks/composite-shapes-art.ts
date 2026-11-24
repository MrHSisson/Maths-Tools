// Pictures for the Composite shapes lesson (plan: specs/decks/composite-shapes.md). Each picture is one SVG in the same style as the site's
// rectilinear pictures: an indigo outline, lengths in dark blue with an arrow running parallel to its own edge (the label sits in a break in the
// arrow, rotated on a vertical edge), dashed heights with a plain label beside them, right-angle marks. Shapes are given in cm (y up); the drawing
// is scaled to fit and the text keeps one size whatever the scale.
//
// What a length does, decided from where it is (so the build script only says which two points and which side):
//  - along an outline edge, level or upright: an arrow at a fixed gap outside the edge, with a thin dashed lead line to any end that is not on the outline;
//  - along a dashed line (a height): no arrow, a label beside the line;
//  - along a hole's edge, or a sloping edge: a label only, beside the edge (parallel to a sloping edge).
export type P = [number, number];
export interface Dim { a: P; b: P; label: string; side: P; /** kept for older calls; the gap is fixed */ off?: number; /** a dashed height: how far up from the base its label sits (0.4 by default) */ at?: number }
export interface Piece { pts: P[]; fill: string; name?: string; sign?: 1 | -1; /** shift the letter (cm) so it clears a length */ dx?: number; dy?: number }
export interface Art {
  outline: P[];                 // the outer boundary
  hole?: P[];                   // a cut-out, drawn white with its own outline
  holeFill?: string;            // colour the hole instead of leaving it white (the "split" view)
  base?: string;                // fill of the whole shape (shaded shapes use yellow)
  pieces?: Piece[];             // coloured parts, drawn over the base
  dims: Dim[];
  dashed?: [P, P][];
  right?: [P, P, P][];          // right-angle marks: the corner is the first point
  ticks?: [P, P][];             // edges marked equal: one short dash across the middle of each
  texts?: { at: P; text: string; colour?: string; size?: number }[];
}

export const shoelace = (pts: P[]) => Math.abs(pts.reduce((t, p, i) => t + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0)) / 2;

const INK = "#0f172a", EDGE = "#4338ca", DIM = "#1e3a8a", HELP = "#64748b", FONT = "'Segoe UI',Arial,sans-serif";
export const COL = { rect: "#bfdbfe", tri: "#fed7aa", para: "#bbf7d0", trap: "#e9d5ff", shade: "#fde68a", hole: "#fecaca", plain: "#e0e7ff" };
const GAP = 28, FS = 30, TICK = 10;

const sameSeg = (a: P, b: P, c: P, d: P) => (eq(a, c) && eq(b, d)) || (eq(a, d) && eq(b, c));
const eq = (a: P, b: P) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
const onSeg = (p: P, a: P, b: P) => { const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (Math.abs(cross) > 1e-9) return false; const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]); return dot >= -1e-9 && dot <= (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + 1e-9; };
const onPoly = (p: P, poly: P[]) => poly.some((q, i) => onSeg(p, q, poly[(i + 1) % poly.length]));
const edgeOf = (a: P, b: P, poly: P[]) => poly.some((q, i) => { const r = poly[(i + 1) % poly.length]; return onSeg(a, q, r) && onSeg(b, q, r); });

/** One picture as an SVG string, `w` × `h` in its own units. */
export function drawArt(art: Art, w = 880, h = 700, pad = 120): string {
  const all = [...art.outline, ...(art.hole ?? [])];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let x1 = Math.max(...xs);
  const fit = () => Math.min((w - 2 * pad) / (x1 - x0 || 1), (h - 2 * pad) / (y1 - y0 || 1));
  let s = fit();
  for (const d of art.dims) {   // a height label to the right of a dashed vertical that sits outside the shape needs room beyond it
    const dashedHeight = (art.dashed ?? []).some(([p, q]) => sameSeg(d.a, d.b, p, q));
    if (dashedHeight && Math.abs(d.a[0] - d.b[0]) < 1e-9 && d.side[0] > 0) { x1 = Math.max(x1, d.a[0] + (d.label.length * FS * 0.56 + 36) / s); s = fit(); }
  }
  const ox = (w - (x1 - x0) * s) / 2 - x0 * s, oy = (h + (y1 - y0) * s) / 2 + y0 * s;
  const X = (p: P) => +(ox + p[0] * s).toFixed(1), Y = (p: P) => +(oy - p[1] * s).toFixed(1);
  const poly = (pts: P[], fill: string, stroke = "none", sw = 0) => `<polygon points="${pts.map((p) => `${X(p)},${Y(p)}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const halo = (x: number, y: number, text: string, o: { anchor?: string; rotate?: number; size?: number; fill?: string; weight?: number } = {}) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.size ?? FS}" font-weight="${o.weight ?? 700}" fill="${o.fill ?? DIM}" text-anchor="${o.anchor ?? "middle"}" dominant-baseline="central" font-family="${FONT}" stroke="#fff" stroke-width="7" paint-order="stroke" stroke-linejoin="round"${o.rotate ? ` transform="rotate(${o.rotate.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"` : ""}>${text}</text>`;
  const textW = (t: string, size = FS) => t.length * size * 0.56 + 10;
  const out: string[] = [`<rect width="${w}" height="${h}" fill="#ffffff"/>`];
  out.push(poly(art.outline, art.base ?? COL.plain));
  for (const pc of art.pieces ?? []) out.push(poly(pc.pts, pc.fill));
  if (art.hole) out.push(poly(art.hole, art.holeFill ?? "#ffffff"));
  for (const [a, b] of art.dashed ?? []) out.push(`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${HELP}" stroke-width="3" stroke-dasharray="9 7"/>`);
  out.push(poly(art.outline, "none", EDGE, 4));
  if (art.hole) out.push(poly(art.hole, "none", EDGE, 4));
  for (const [c, p, q] of art.right ?? []) {
    const u = (r: P): P => { const dx = X(r) - X(c), dy = Y(r) - Y(c), l = Math.hypot(dx, dy) || 1; return [(dx / l) * 17, (dy / l) * 17]; };
    const a = u(p), b = u(q), cx = X(c), cy = Y(c);
    out.push(`<polyline points="${cx + a[0]},${cy + a[1]} ${cx + a[0] + b[0]},${cy + a[1] + b[1]} ${cx + b[0]},${cy + b[1]}" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
  }
  for (const pc of art.pieces ?? []) {
    if (!pc.name) continue;
    const c: P = [pc.pts.reduce((t, p) => t + p[0], 0) / pc.pts.length + (pc.dx ?? 0), pc.pts.reduce((t, p) => t + p[1], 0) / pc.pts.length + (pc.dy ?? 0)];
    out.push(halo(X(c), Y(c), pc.name, { size: 36, fill: INK }));
  }
  const arrowHead = (px: number, py: number, ux: number, uy: number) => `<polygon points="${px},${py} ${px - ux * 13 - uy * 5},${py - uy * 13 + ux * 5} ${px - ux * 13 + uy * 5},${py - uy * 13 - ux * 5}" fill="${DIM}"/>`;
  for (const d of art.dims) {
    const onDash = (art.dashed ?? []).some(([a, b]) => sameSeg(d.a, d.b, a, b));
    const onHole = !!art.hole && edgeOf(d.a, d.b, art.hole);
    const onEdge = edgeOf(d.a, d.b, art.outline);
    const sx = d.side[0], sy = -d.side[1];                                  // screen direction of "outside"
    const ax = X(d.a), ay = Y(d.a), bx = X(d.b), by = Y(d.b), mx = (ax + bx) / 2, my = (ay + by) / 2;
    const axisAligned = Math.abs(ax - bx) < 0.5 || Math.abs(ay - by) < 0.5, vertical = Math.abs(ax - bx) < 0.5;
    if (onDash) {            // a height: the label beside its dashed line
      if (vertical) out.push(halo(mx + (sx >= 0 ? 12 : -12), ay + (d.at ?? 0.4) * (by - ay), d.label, { anchor: sx >= 0 ? "start" : "end" }));   // 40% up from the base, where a pointed shape is widest
      else out.push(halo(mx, my + (sy >= 0 ? 22 : -22), d.label));
      continue;
    }
    if (onHole || (!axisAligned && onEdge) || !axisAligned) {   // a hole's edge or a sloping edge: a label beside it, parallel to a sloping edge
      let ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      const slope = !axisAligned;
      if (slope) { const nx = sx, ny = sy, l = Math.hypot(nx, ny) || 1; out.push(halo(mx + (nx / l) * 26, my + (ny / l) * 26, d.label, { rotate: ang })); }
      else if (vertical) out.push(halo(mx + (sx >= 0 ? 14 : -14), my, d.label, { anchor: sx >= 0 ? "start" : "end" }));
      else {                // level hole edge: the label on the outside, unless that runs into the outline, then just inside
        const outsideY = my + (sy >= 0 ? 24 : -24), floor = Y([0, y0]), roof = Y([0, y1]);
        out.push(halo(mx, outsideY > floor - 16 || outsideY < roof + 16 ? my - (sy >= 0 ? 24 : -24) : outsideY, d.label));
      }
      continue;
    }
    // an arrow parallel to an upright or level edge, at a fixed gap outside it
    const nx = vertical ? Math.sign(sx || 1) : 0, ny = vertical ? 0 : Math.sign(sy || 1);
    const gx = nx * GAP, gy = ny * GAP;
    const pa: [number, number] = [ax + gx, ay + gy], pb: [number, number] = [bx + gx, by + gy];
    const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1, ux = (pb[0] - pa[0]) / len, uy = (pb[1] - pa[1]) / len;
    for (const [p, q, e] of [[d.a, pa, ax], [d.b, pb, bx]] as [P, [number, number], number][]) {      // a thin lead line to an end that is not on the outline
      if (onPoly(p, art.outline)) continue;
      const px = X(p), py = Y(p);
      out.push(`<line x1="${px}" y1="${py}" x2="${q[0] + nx * TICK}" y2="${q[1] + ny * TICK}" stroke="${HELP}" stroke-width="2" stroke-dasharray="6 5"/>`); void e;
    }
    const tw = (vertical ? FS : textW(d.label)) + 8, room = len - 2 * 20;
    const label = vertical ? [pa[0], (pa[1] + pb[1]) / 2] : [(pa[0] + pb[0]) / 2, pa[1]];
    const gapHalf = (vertical ? textW(d.label) : tw) / 2 + 2;
    if (room > (vertical ? textW(d.label) : tw) + 10) {
      out.push(`<line x1="${pa[0]}" y1="${pa[1]}" x2="${pa[0] + ux * (len / 2 - gapHalf)}" y2="${pa[1] + uy * (len / 2 - gapHalf)}" stroke="${DIM}" stroke-width="2.5"/>`);
      out.push(`<line x1="${pb[0]}" y1="${pb[1]}" x2="${pb[0] - ux * (len / 2 - gapHalf)}" y2="${pb[1] - uy * (len / 2 - gapHalf)}" stroke="${DIM}" stroke-width="2.5"/>`);
      out.push(arrowHead(pa[0], pa[1], -ux, -uy), arrowHead(pb[0], pb[1], ux, uy));
      out.push(halo(label[0], label[1], d.label, { rotate: vertical ? -90 : 0 }));
    } else {                                        // too short for a label in the break: the arrow alone, the label just outside it
      out.push(`<line x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="${DIM}" stroke-width="2.5"/>`, arrowHead(pa[0], pa[1], -ux, -uy), arrowHead(pb[0], pb[1], ux, uy));
      out.push(halo(label[0] + nx * 30, label[1] + ny * 22, d.label, { rotate: vertical ? -90 : 0 }));
    }
  }
  for (const [p, q] of art.ticks ?? []) {
    const mx = (X(p) + X(q)) / 2, my = (Y(p) + Y(q)) / 2, dx = X(q) - X(p), dy = Y(q) - Y(p), l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * 9, ny = (dx / l) * 9;
    out.push(`<line x1="${(mx - nx).toFixed(1)}" y1="${(my - ny).toFixed(1)}" x2="${(mx + nx).toFixed(1)}" y2="${(my + ny).toFixed(1)}" stroke="${INK}" stroke-width="3.5"/>`);
  }
  for (const t of art.texts ?? []) out.push(halo(X(t.at), Y(t.at), t.text, { size: t.size, fill: t.colour }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out.join("")}</svg>`;
}

export const toSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
