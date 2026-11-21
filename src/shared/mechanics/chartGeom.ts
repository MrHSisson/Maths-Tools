// Mechanics diagrams: the geometry of graphs and energy bars, shared by the drawing and by the label layout.
import type { Bars, Graph, Pt } from "./scene";

/** A point in plot units (0 to 1, y up) as a scene point. */
export const graphPoint = (g: Graph, p: Pt): Pt => ({ x: g.x + p.x * g.w, y: g.y + g.h - p.y * g.h });

export const graphAxes = (g: Graph): { x: [Pt, Pt]; y: [Pt, Pt] } => ({
  x: [{ x: g.x, y: g.y + g.h }, { x: g.x + g.w + 18, y: g.y + g.h }],
  y: [{ x: g.x, y: g.y + g.h }, { x: g.x, y: g.y - 18 }],
});

/** The curve's height (plot units) at plot x, by linear interpolation along its points. */
export function curveAt(g: Graph, x: number): number {
  const c = g.curve;
  if (!c.length) return 0;
  if (x <= c[0].x) return c[0].y;
  for (let i = 1; i < c.length; i++) if (x <= c[i].x) {
    const t = c[i].x === c[i - 1].x ? 0 : (x - c[i - 1].x) / (c[i].x - c[i - 1].x);
    return c[i - 1].y + t * (c[i].y - c[i - 1].y);
  }
  return c[c.length - 1].y;
}

/** The scene polygon of the shaded area: along the curve from `from` to `to`, then back along the axis. */
export function areaPolygon(g: Graph): Pt[] {
  if (!g.area) return [];
  const { from, to } = g.area;
  const xs = [from, ...g.curve.map((p) => p.x).filter((x) => x > from && x < to), to];
  const top = xs.map((x) => graphPoint(g, { x, y: curveAt(g, x) }));
  return [graphPoint(g, { x: from, y: 0 }), ...top, graphPoint(g, { x: to, y: 0 })];
}

type BarKind = "gpe" | "epe" | "ke" | "work";
interface BarRect { col: number; kind: BarKind; x: number; y: number; w: number; h: number }

/** The stacked rectangles of an energy chart, bottom to top: gravitational, elastic, kinetic, then work. */
export function barRects(b: Bars): { rects: BarRect[]; base: number; colX: number[]; barW: number; scale: number; firstTop: number } {
  const n = Math.max(1, b.columns.length);
  const total = (c: Bars["columns"][number]) => (c.gpe ?? 0) + (c.epe ?? 0) + (c.ke ?? 0) + (c.work ?? 0);
  const tallest = Math.max(0.0001, ...b.columns.map(total));
  const legendW = b.legend ? 96 : 0;
  const avail = b.w - legendW;
  const barW = Math.min(64, (avail / n) * 0.55);
  const colX = b.columns.map((_, i) => b.x + (avail * (i + 0.5)) / n);
  const base = b.y + b.h;
  const scale = (b.h * 0.92) / tallest;
  const rects: BarRect[] = [];
  b.columns.forEach((c, i) => {
    let top = base;
    for (const kind of ["gpe", "epe", "ke", "work"] as const) {
      const v = c[kind] ?? 0;
      if (v <= 0) continue;
      const h = v * scale;
      top -= h;
      rects.push({ col: i, kind, x: colX[i] - barW / 2, y: top, w: barW, h });
    }
  });
  const first = b.columns[0];
  return { rects, base, colX, barW, scale, firstTop: first ? base - total({ ...first, work: 0 }) * scale : base };
}
