// Pure geometry for the slide editor: bounding boxes, smart guides (snap to other elements and the slide), align
// and distribute. No React here, so src/tests/deckGeometry.test.ts can check it directly.
import { CANVAS_H, CANVAS_W, type DeckElement } from "./types";

export interface Rect { x: number; y: number; w: number; h: number }
export interface Guide { axis: "x" | "y"; at: number }

/** The element's on-canvas box (a line's runs between its two points). */
export const bbox = (el: DeckElement): Rect => el.kind === "line"
  ? { x: Math.min(el.x, el.x + el.w), y: Math.min(el.y, el.y + el.h), w: Math.abs(el.w), h: Math.abs(el.h) }
  : { x: el.x, y: el.y, w: el.w, h: el.h };

export const unionBox = (rs: Rect[]): Rect => {
  const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
};

export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Lines a moving box can snap to: the slide's edges and centre lines, and every other element's edges and centres. */
export const snapTargets = (els: DeckElement[], moving: ReadonlySet<string>) => {
  const xs = [0, CANVAS_W / 2, CANVAS_W], ys = [0, CANVAS_H / 2, CANVAS_H];
  for (const el of els) {
    if (moving.has(el.id)) continue;
    const b = bbox(el);
    xs.push(b.x, b.x + b.w / 2, b.x + b.w);
    ys.push(b.y, b.y + b.h / 2, b.y + b.h);
  }
  return { xs, ys };
};

/** The nearest target within `threshold` of any of `values`: how far to shift, and the guide to draw. */
const nearest = (values: number[], targets: number[], threshold: number): { shift: number; at: number } | null => {
  let best: { shift: number; at: number } | null = null;
  for (const v of values) for (const t of targets) {
    const d = t - v;
    if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.shift))) best = { shift: d, at: t };
  }
  return best;
};

/** Snaps a moved box: its left / centre / right to an x target, its top / middle / bottom to a y target. */
export function snapBox(box: Rect, targets: { xs: number[]; ys: number[] }, threshold: number): { dx: number; dy: number; guides: Guide[] } {
  const nx = nearest([box.x, box.x + box.w / 2, box.x + box.w], targets.xs, threshold);
  const ny = nearest([box.y, box.y + box.h / 2, box.y + box.h], targets.ys, threshold);
  const guides: Guide[] = [];
  if (nx) guides.push({ axis: "x", at: nx.at });
  if (ny) guides.push({ axis: "y", at: ny.at });
  return { dx: nx?.shift ?? 0, dy: ny?.shift ?? 0, guides };
}

/** Snaps one edge being dragged (resizing) to the nearest target. */
export function snapEdge(v: number, targets: number[], threshold: number): { v: number; at: number | null } {
  const n = nearest([v], targets, threshold);
  return n ? { v: v + n.shift, at: n.at } : { v, at: null };
}

const moveBy = (el: DeckElement, dx: number, dy: number): DeckElement => ({ ...el, x: el.x + dx, y: el.y + dy });

export type AlignHow = "left" | "centre" | "right" | "top" | "middle" | "bottom";

/** Lines the chosen elements up: with one chosen, against the slide; with several, against the box around them. */
export function align(els: DeckElement[], ids: ReadonlySet<string>, how: AlignHow): DeckElement[] {
  const chosen = els.filter((e) => ids.has(e.id));
  if (!chosen.length) return els;
  const frame: Rect = chosen.length === 1 ? { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H } : unionBox(chosen.map(bbox));
  return els.map((e) => {
    if (!ids.has(e.id)) return e;
    const b = bbox(e);
    switch (how) {
      case "left": return moveBy(e, frame.x - b.x, 0);
      case "centre": return moveBy(e, frame.x + frame.w / 2 - (b.x + b.w / 2), 0);
      case "right": return moveBy(e, frame.x + frame.w - (b.x + b.w), 0);
      case "top": return moveBy(e, 0, frame.y - b.y);
      case "middle": return moveBy(e, 0, frame.y + frame.h / 2 - (b.y + b.h / 2));
      case "bottom": return moveBy(e, 0, frame.y + frame.h - (b.y + b.h));
    }
  });
}

/** Spaces three or more elements evenly between the outermost two (equal gaps, not equal centres). */
export function distribute(els: DeckElement[], ids: ReadonlySet<string>, axis: "x" | "y"): DeckElement[] {
  const chosen = els.filter((e) => ids.has(e.id)).map((e) => ({ e, b: bbox(e) }));
  if (chosen.length < 3) return els;
  const pos = (b: Rect) => (axis === "x" ? b.x : b.y), size = (b: Rect) => (axis === "x" ? b.w : b.h);
  chosen.sort((a, b) => pos(a.b) - pos(b.b));
  const first = chosen[0].b, last = chosen[chosen.length - 1].b;
  const span = pos(last) + size(last) - pos(first);
  const gap = (span - chosen.reduce((s, c) => s + size(c.b), 0)) / (chosen.length - 1);
  const moved = new Map<string, DeckElement>();
  let at = pos(first);
  for (const c of chosen) {
    const d = Math.round(at - pos(c.b));
    moved.set(c.e.id, axis === "x" ? moveBy(c.e, d, 0) : moveBy(c.e, 0, d));
    at += size(c.b) + gap;
  }
  return els.map((e) => moved.get(e.id) ?? e);
}
