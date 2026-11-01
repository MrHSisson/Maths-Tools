import { strokePath } from "../shared/components/BoardTools";
import type { InkStroke } from "./types";

/** The points of a stroke as {x, y} pairs. */
export const inkPoints = (s: InkStroke) => Array.from({ length: Math.floor(s.p.length / 2) }, (_, i) => ({ x: s.p[2 * i], y: s.p[2 * i + 1] }));
/** A single tap is drawn as a dot: two points a hair apart. */
export const inkPath = (s: InkStroke) => { const pts = inkPoints(s); return strokePath(pts.length === 1 ? [pts[0], { x: pts[0].x + 0.1, y: pts[0].y }] : pts); };

/** A slide's hand-writing: the saved strokes over the slide, drawn the same in the editor, the player, a thumbnail and an export. */
export function InkLayer({ strokes, w, h }: { strokes: InkStroke[]; w: number; h: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: "block", pointerEvents: "none", overflow: "visible" }} role="img" aria-label="Writing on the slide">
      {strokes.map((s, i) => <path key={i} d={inkPath(s)} fill="none" stroke={s.c} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  );
}
