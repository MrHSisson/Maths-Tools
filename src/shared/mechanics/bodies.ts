// Mechanics diagrams: body geometry. A body is drawn in its own frame (x along the surface, y up from its base) and turned by `rot`.
// Anchors give every force the same attachment points whatever the glyph (docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §4).
import { add, dir, mul, type Body, type Pt } from "./scene";

export const PARTICLE_R = 7;
export const BLOCK_W = 64;
export const BLOCK_H = 48;

export interface BodyFrame { w: number; h: number }
export const bodySize = (b: Body): BodyFrame =>
  b.kind === "particle" ? { w: PARTICLE_R * 2, h: PARTICLE_R * 2 } : { w: b.w ?? BLOCK_W, h: b.h ?? BLOCK_H };

/** A point in the body's own frame (x along its surface, y up from its base), as a screen point. */
export function bodyPoint(b: Body, x: number, y: number): Pt {
  const rot = b.rot ?? 0;
  return add(b.at, add(mul(dir(rot), x), mul(dir(rot + 90), y)));
}

export interface BodyAnchors { centre: Pt; base: Pt; front: Pt; back: Pt; top: Pt }
export function bodyAnchors(b: Body): BodyAnchors {
  const { w, h } = bodySize(b);
  return {
    centre: bodyPoint(b, 0, h / 2),
    base: bodyPoint(b, 0, 0),
    front: bodyPoint(b, w / 2, h / 2),
    back: bodyPoint(b, -w / 2, h / 2),
    top: bodyPoint(b, 0, h),
  };
}

/** The outline as screen points, for drawing and for the label placer's obstacles. A particle is a small octagon. */
export function bodyOutline(b: Body): Pt[] {
  const { w, h } = bodySize(b);
  if (b.kind === "particle") {
    const c = { x: 0, y: h / 2 };
    return Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * 2 * Math.PI;
      return bodyPoint(b, c.x + Math.cos(a) * PARTICLE_R, c.y + Math.sin(a) * PARTICLE_R);
    });
  }
  return [bodyPoint(b, -w / 2, 0), bodyPoint(b, w / 2, 0), bodyPoint(b, w / 2, h), bodyPoint(b, -w / 2, h)];
}

/** A block wide enough to carry its label inside at the largest label size, so a mass never has to stand outside the block it belongs to. */
export const blockWidthFor = (label?: { text: string; ask?: string }, widest = 24): number =>
  label ? Math.min(112, Math.max(BLOCK_W, Math.ceil(Math.max(label.text.length, (label.ask ?? "").length) * widest * 0.6 + 16))) : BLOCK_W;
