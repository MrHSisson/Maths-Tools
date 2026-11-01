import type { InkStroke } from "./types";

/** Distance from point (x, y) to the segment (ax, ay)–(bx, by). */
const segDist = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
};
/** Does an eraser of radius `r` at (x, y) touch this stroke (its line, including half its thickness)? */
export function strokeTouches(s: InkStroke, x: number, y: number, r: number): boolean {
  const reach = r + s.w / 2, p = s.p;
  if (p.length < 2) return false;
  if (p.length < 4) return Math.hypot(p[0] - x, p[1] - y) <= reach;
  for (let i = 0; i + 3 < p.length; i += 2) if (segDist(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= reach) return true;
  return false;
}
