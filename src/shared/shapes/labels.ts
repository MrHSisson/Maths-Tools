// Perimeter & Area — label placement. Each label is a small pill that hangs off its side on a short dashed leader. For every label we try
// a grid of candidate spots (slid along the side, pushed further out) and score each against everything it could collide with: the outline,
// the dashed helper lines, the other pills (touching or cramped), the leaders, the picture's edge. The cheapest spot wins; two more passes
// then re-place each label with all the others in view, so an early label that took a spot a later one needed can give way.

export interface Seg { x1: number; y1: number; x2: number; y2: number }
/** A pill by its centre. */
export interface Rect { x: number; y: number; w: number; h: number }

/** One label to place: the side it names (picture pixels), the outward normal, and the pill's size. */
export interface PillIn { ax: number; ay: number; bx: number; by: number; nx: number; ny: number; w: number; h: number; free?: boolean }
/** Where it goes: the pill's centre, and the point on the side its leader starts from. (A `free` pill names a dashed helper line: it sits
 *  right beside the line on whichever side is clearer, with no leader, and may be inside the shape.) */
interface PillOut { x: number; y: number; lx: number; ly: number }

export interface Scene {
  shape: Seg[];                       // every outline segment (holes included)
  helpers: Seg[];                     // dashed helper lines on show
  fixed: Rect[];                      // pills that are not ours to move
  bounds: { x0: number; y0: number; x1: number; y1: number };
  reach: number;                      // shortest visible leader, in pixels
  cramp: number;                      // closest two pills may sit before it counts as crowded
  inside: (x: number, y: number) => boolean;
}

/** Space between two centred rectangles: negative when they overlap. */
export const rectGap = (a: Rect, b: Rect): number =>
  Math.max(Math.abs(a.x - b.x) - (a.w + b.w) / 2, Math.abs(a.y - b.y) - (a.h + b.h) / 2);

/** Does the segment pass through the rectangle (grown by `m` on every side)? Liang–Barsky clipping. */
export function segHitsRect(s: Seg, r: Rect, m = 0): boolean {
  const hw = r.w / 2 + m, hh = r.h / 2 + m;
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const p = [-dx, dx, -dy, dy];
  const q = [s.x1 - (r.x - hw), r.x + hw - s.x1, s.y1 - (r.y - hh), r.y + hh - s.y1];
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

/** Do two segments cross? (Touching at an end does not count.) */
export function segsCross(a: Seg, b: Seg): boolean {
  const d = (a.x2 - a.x1) * (b.y2 - b.y1) - (a.y2 - a.y1) * (b.x2 - b.x1);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((b.x1 - a.x1) * (b.y2 - b.y1) - (b.y1 - a.y1) * (b.x2 - b.x1)) / d;
  const u = ((b.x1 - a.x1) * (a.y2 - a.y1) - (b.y1 - a.y1) * (a.x2 - a.x1)) / d;
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}

const T_STEPS = [0.5, 0.3, 0.7, 0.15, 0.85, 0.03, 0.97];       // where along the side the leader may start
const OUT_STEPS = [1, 1.6, 2.4, 3.4, 4.8, 6.8, 9.5];               // leader length, as multiples of `reach`

interface Spot { out: PillOut; rect: Rect; leader: Seg; free: boolean; onLine: boolean; flipped: boolean }

function candidates(it: PillIn, sc: Scene): { spot: Spot; soft: number }[] {
  const list: { spot: Spot; soft: number }[] = [];
  for (const sign of [1, -1]) {
    const nx = it.nx * sign, ny = it.ny * sign;
    const support = Math.abs(nx) * it.w / 2 + Math.abs(ny) * it.h / 2;
    OUT_STEPS.forEach((k, ki) => T_STEPS.forEach((t, ti) => {
      // a helper label hugs its line, but when the shape is too small for that it may stand off further with a leader
      const far = !!it.free && k > 2;
      const lx = it.ax + (it.bx - it.ax) * t, ly = it.ay + (it.by - it.ay) * t;
      const dist = support + (it.free && !far ? 3 + (k - 1) * 4 : sc.reach * k);
      const x = lx + nx * dist, y = ly + ny * dist;
      const noLeader = !!it.free && !far;
      list.push({
        spot: { out: { x, y, lx, ly }, rect: { x, y, w: it.w, h: it.h }, leader: noLeader ? { x1: x, y1: y, x2: x, y2: y } : { x1: lx + nx * 1.5, y1: ly + ny * 1.5, x2: x, y2: y }, free: noLeader, onLine: false, flipped: (!it.free && sign < 0) || far },
        soft: ki * 6 + ti * 2 + Math.abs(t - 0.5) * 20 + (sign < 0 ? (it.free ? 1 : 100) : 0) + (far ? 40 : 0),   // inside the shape only when outside has no room
      });
    }));
  }
  if (it.free) {
    // beyond either end of the helper line, as if the line carried on into its label
    const len = Math.hypot(it.bx - it.ax, it.by - it.ay) || 1, ux = (it.bx - it.ax) / len, uy = (it.by - it.ay) / len;
    const sup = Math.abs(ux) * it.w / 2 + Math.abs(uy) * it.h / 2;
    for (const [px, py, dir] of [[it.bx, it.by, 1], [it.ax, it.ay, -1]] as const) [0, 8, 16].forEach((extra, ei) => {
      const x = px + ux * dir * (sup + 4 + extra), y = py + uy * dir * (sup + 4 + extra);
      list.push({ spot: { out: { x, y, lx: px, ly: py }, rect: { x, y, w: it.w, h: it.h }, leader: { x1: x, y1: y, x2: x, y2: y }, free: true, onLine: true, flipped: false }, soft: 30 + ei * 4 });
    });
  }
  {
    // last resort in a crowded picture: the pill sits on its own side and breaks the line, as a dimension does on a drawing
    T_STEPS.forEach((t, ti) => {
      const x = it.ax + (it.bx - it.ax) * t, y = it.ay + (it.by - it.ay) * t;
      list.push({ spot: { out: { x, y, lx: x, ly: y }, rect: { x, y, w: it.w, h: it.h }, leader: { x1: x, y1: y, x2: x, y2: y }, free: true, onLine: true, flipped: false }, soft: 60 + ti * 4 });
    });
  }
  return list;
}

/** Is the segment part of the same straight line as the side (so a pill sitting on that side is not "on the outline")? */
const sameLine = (s: Seg, it: PillIn): boolean => {
  const len = Math.hypot(it.bx - it.ax, it.by - it.ay) || 1;
  const off = (x: number, y: number) => Math.abs((it.bx - it.ax) * (y - it.ay) - (it.by - it.ay) * (x - it.ax)) / len;
  return off(s.x1, s.y1) < 0.6 && off(s.x2, s.y2) < 0.6;
};

/** Cost of putting `c` down given everything already in the picture (lower is better; a clean spot costs only its `soft` part). */
function cost(c: Spot, soft: number, sc: Scene, others: Spot[], it: PillIn): number {
  let total = soft;
  const r = c.rect;
  const { bounds: b } = sc;
  total += (Math.max(0, b.x0 - (r.x - r.w / 2)) + Math.max(0, r.x + r.w / 2 - b.x1) + Math.max(0, b.y0 - (r.y - r.h / 2)) + Math.max(0, r.y + r.h / 2 - b.y1)) * 500;
  if (!c.free && !c.flipped && sc.inside(r.x, r.y)) total += 20000;
  for (const s of sc.shape) {
    if (segHitsRect(s, r, 2) && !(c.onLine && sameLine(s, it))) total += 20000;
    if (!c.free && segsCross(c.leader, s)) total += 6000;
  }
  for (const s of sc.helpers) {
    if (segHitsRect(s, r, 2) && !(c.onLine && sameLine(s, it))) total += 8000;
    if (!c.free && segsCross(c.leader, s)) total += 800;
  }
  const rects = [...sc.fixed, ...others.map((o) => o.rect)];
  for (const o of rects) {
    const g = rectGap(r, o);
    if (g < 0) total += 30000 - g * 100;
    else if (g < sc.cramp) total += (sc.cramp - g) * 300;
    if (!c.free && segHitsRect(c.leader, o, 1)) total += 8000;
  }
  for (const o of others) {
    if (!c.free && !o.free && segsCross(c.leader, o.leader)) total += 3000;
    if (!o.free && segHitsRect(o.leader, r, 1)) total += 8000;
  }
  return total;
}

export function placePills(items: PillIn[], sc: Scene): PillOut[] {
  const cands = items.map((it) => candidates(it, sc));
  const sideLen = items.map((it) => Math.hypot(it.bx - it.ax, it.by - it.ay));
  const idx = items.map((_, i) => i);
  // short sides have the fewest good spots, so by default they choose first; if the result is still crowded, try other orders and keep the best
  const orders = [
    [...idx].sort((p, q) => sideLen[p] - sideLen[q]),
    [...idx].sort((p, q) => sideLen[q] - sideLen[p]),
    idx,
    [...idx].reverse(),
  ];
  let best: { spot: Spot; soft: number }[] = [], bestTotal = Infinity;
  for (const order of orders) {
    const chosen: ({ spot: Spot; soft: number } | undefined)[] = items.map(() => undefined);
    const othersOf = (i: number) => chosen.filter((s, j): s is { spot: Spot; soft: number } => !!s && j !== i).map((s) => s.spot);
    const choose = (i: number) => {
      const others = othersOf(i);
      let pick = cands[i][0], pickCost = Infinity;
      for (const c of cands[i]) {
        const v = cost(c.spot, c.soft, sc, others, items[i]);
        if (v < pickCost) { pick = c; pickCost = v; }
        if (v === c.soft && v < 14) break;           // a clean spot that is already close: no need to look further
      }
      chosen[i] = pick;
    };
    order.forEach(choose);
    for (let pass = 0; pass < 3; pass++) order.forEach(choose);
    const total = idx.reduce((t, i) => t + cost(chosen[i]!.spot, chosen[i]!.soft, sc, othersOf(i), items[i]), 0);
    if (total < bestTotal) { bestTotal = total; best = chosen as { spot: Spot; soft: number }[]; }
    if (bestTotal < 1000) break;                     // nothing collides: done
  }
  return best.map((c) => c.spot.out);
}
