// Geometry for the "inverse of sin x" animation (deck piece `inverseTrig`). Pure maths, no drawing: the renderer
// (src/decks/InverseTrig.tsx) turns these numbers into SVG, and a test checks them.
//
// The animation has `INVERSE_STAGES` clicks after the first view (stage 0, the whole sine curve):
//   1 restrict the domain to -π/2 ≤ x ≤ π/2   2 the mirror line y = x appears   3 the curve folds over y = x   4 the copy slides out to its own axes

export const HALF_PI = Math.PI / 2;
/** Clicks after the first view: restrict, mirror line, fold, separate. */
export const INVERSE_STAGES = 4;

/** Where one copy of the graph sits on its axes and how it is drawn, in slide units. */
export const K = 90;             // pixels per unit, the same on both axes so a reflection in y = x really looks like one
export const EXTENT = 3.4;       // each panel shows -EXTENT to EXTENT on both axes

/** Smooth 0 → 1 over one stage (no overshoot). */
export const ease = (t: number) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
/** Progress of one stage: `p` is the animated stage number, `stage` the click whose progress we want (1-based). */
export const phase = (p: number, stage: number) => ease(p - (stage - 1));

/** Points of y = sin x for x from `a` to `b`. */
export function sinPoints(a: number, b: number, n = 120): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, Math.sin(x)] as [number, number]; });
}

/** A point folded over the line y = x: `q` = 0 leaves it where it is, `q` = 1 swaps its coordinates (the reflection). Halfway it is on the line. */
export function fold([x, y]: [number, number], q: number): [number, number] {
  const u = (x + y) / 2, d = ((x - y) / 2) * Math.cos(Math.PI * q);
  return [u + d, u - d];
}

/** The inverse of sin on its restricted domain, for checking the reflection. */
export const arcsin = (x: number) => Math.asin(x);

/** The corners of the animation's bounds in slide units: a panel is `2 * EXTENT * K` wide. */
export const PANEL = 2 * EXTENT * K;
