// Pictures for the Composite shapes lesson (plan: specs/decks/composite-shapes.md). Each picture is one SVG, drawn like Harry's reference sheet:
// lengths in blue between red arrows, right-angle marks, dashed heights. Shapes are given in cm (y up); the drawing is scaled to fit.
// No site code is involved: a picture is saved in the deck as an image.
export type P = [number, number];
export interface Dim { a: P; b: P; label: string; side: P; off?: number }
export interface Piece { pts: P[]; fill: string; name?: string; sign?: 1 | -1; /** shift the letter sideways (cm) so it clears a dimension */ dx?: number; dy?: number }
export interface Art {
  outline: P[];                 // the outer boundary
  hole?: P[];                   // a cut-out, drawn white with its own outline
  holeFill?: string;            // colour the hole instead of leaving it white (the "split" view)
  base?: string;                // fill of the whole shape (shaded shapes use yellow)
  pieces?: Piece[];             // coloured parts, drawn over the base
  dims: Dim[];
  dashed?: [P, P][];
  right?: [P, P, P][];          // right-angle marks: the corner is the first point
  texts?: { at: P; text: string; colour?: string; size?: number }[];
}

export const shoelace = (pts: P[]) => Math.abs(pts.reduce((t, p, i) => t + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0)) / 2;

const RED = "#dc2626", BLUE = "#1d4ed8", INK = "#0f172a";
export const COL = { rect: "#bfdbfe", tri: "#fed7aa", para: "#bbf7d0", trap: "#e9d5ff", shade: "#fde68a", hole: "#fecaca", plain: "#e2e8f0" };

/** One picture as an SVG string, `w` × `h` in its own units. */
export function drawArt(art: Art, w = 880, h = 700, pad = 120): string {
  const all = [...art.outline, ...(art.hole ?? [])];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min((w - 2 * pad) / (x1 - x0 || 1), (h - 2 * pad) / (y1 - y0 || 1));
  const ox = (w - (x1 - x0) * s) / 2 - x0 * s, oy = (h + (y1 - y0) * s) / 2 + y0 * s;
  const X = (p: P) => +(ox + p[0] * s).toFixed(1), Y = (p: P) => +(oy - p[1] * s).toFixed(1);
  const poly = (pts: P[], fill: string, stroke = INK, sw = 4, dash = "") =>
    `<polygon points="${pts.map((p) => `${X(p)},${Y(p)}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  const out: string[] = [`<rect width="${w}" height="${h}" fill="#ffffff"/>`];
  out.push(poly(art.outline, art.base ?? COL.plain, "none", 0));
  for (const pc of art.pieces ?? []) out.push(poly(pc.pts, pc.fill, "none", 0));
  if (art.hole) out.push(poly(art.hole, art.holeFill ?? "#ffffff", "none", 0));
  for (const pc of art.pieces ?? []) {
    if (!pc.name) continue;
    const c: P = [pc.pts.reduce((t, p) => t + p[0], 0) / pc.pts.length + (pc.dx ?? 0), pc.pts.reduce((t, p) => t + p[1], 0) / pc.pts.length];
    out.push(`<text x="${X(c)}" y="${Y(c) + 12}" font-size="38" font-weight="700" fill="${INK}" text-anchor="middle" font-family="sans-serif">${pc.name}</text>`);
  }
  for (const [a, b] of art.dashed ?? []) out.push(`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${INK}" stroke-width="3" stroke-dasharray="10 8"/>`);
  out.push(poly(art.outline, "none"));
  if (art.hole) out.push(poly(art.hole, "none"));
  for (const [c, p, q] of art.right ?? []) {
    const u = (r: P): P => { const dx = X(r) - X(c), dy = Y(r) - Y(c), l = Math.hypot(dx, dy) || 1; return [(dx / l) * 20, (dy / l) * 20]; };
    const a = u(p), b = u(q), cx = X(c), cy = Y(c);
    out.push(`<polyline points="${cx + a[0]},${cy + a[1]} ${cx + a[0] + b[0]},${cy + a[1] + b[1]} ${cx + b[0]},${cy + b[1]}" fill="none" stroke="${INK}" stroke-width="3"/>`);
  }
  for (const d of art.dims) {
    const off = d.off ?? 38, nx = d.side[0] * off, ny = -d.side[1] * off;
    const ax = X(d.a) + nx, ay = Y(d.a) + ny, bx = X(d.b) + nx, by = Y(d.b) + ny;
    const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
    const head = (px: number, py: number, k: number) => `<polygon points="${px},${py} ${px - k * ux * 16 - uy * 6},${py - k * uy * 16 + ux * 6} ${px - k * ux * 16 + uy * 6},${py - k * uy * 16 - ux * 6}" fill="${RED}"/>`;
    out.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${RED}" stroke-width="3"/>${head(ax, ay, -1)}${head(bx, by, 1)}`);
    const mx = (ax + bx) / 2 + d.side[0] * 4, my = (ay + by) / 2 + ny / off * 4, tw = d.label.length * 17 + 14;
    out.push(`<rect x="${mx - tw / 2}" y="${my - 20}" width="${tw}" height="36" fill="#ffffff"/><text x="${mx}" y="${my + 10}" font-size="32" font-weight="700" fill="${BLUE}" text-anchor="middle" font-family="sans-serif">${d.label}</text>`);
  }
  for (const t of art.texts ?? []) out.push(`<text x="${X(t.at)}" y="${Y(t.at)}" font-size="${t.size ?? 32}" font-weight="700" fill="${t.colour ?? BLUE}" text-anchor="middle" font-family="sans-serif">${t.text}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out.join("")}</svg>`;
}

export const toSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
