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

type InverseFn = "sin" | "cos" | "tan";
export const INVERSE_FNS: InverseFn[] = ["sin", "cos", "tan"];

/** What each function's animation needs: the restricted domain, how its ends are drawn, the words for the captions, and the horizontal reach of the kept curve. */
interface InverseSpec {
  f: (x: number) => number;
  /** The restricted domain (for tan, the open interval). */
  dom: [number, number];
  /** The range of the restricted function, as drawn (tan's is every real number, so the axis length). */
  rng: [number, number];
  /** The end points of the restricted curve belong to it (sin and cos) or are never reached (tan). */
  closed: boolean;
  domCaption: string;
  invDomCaption: string;
  /** tan: dashed asymptotes at the ends of the restricted domain. */
  asymptotes: boolean;
}

export const INVERSE_SPECS: Record<InverseFn, InverseSpec> = {
  sin: { f: Math.sin, dom: [-HALF_PI, HALF_PI], rng: [-1, 1], closed: true, domCaption: "−π/2 ≤ x ≤ π/2", invDomCaption: "−1 ≤ x ≤ 1", asymptotes: false },
  cos: { f: Math.cos, dom: [0, Math.PI], rng: [-1, 1], closed: true, domCaption: "0 ≤ x ≤ π", invDomCaption: "−1 ≤ x ≤ 1", asymptotes: false },
  tan: { f: Math.tan, dom: [-HALF_PI, HALF_PI], rng: [-EXTENT, EXTENT], closed: false, domCaption: "−π/2 < x < π/2", invDomCaption: "any real x", asymptotes: true },
};

/** Pieces of y = f(x) for x from `a` to `b`, broken wherever the curve leaves the panel (tan's branches). */
export function curveSegments(fn: InverseFn, a: number, b: number, n = 400): [number, number][][] {
  const f = INVERSE_SPECS[fn].f;
  const out: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n, y = f(x);
    if (Math.abs(y) <= EXTENT) cur.push([x, y]);
    else if (cur.length) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}

/** The part of the curve that is kept: the whole restricted domain, or for tan as much of it as fits in the panel. */
export function keptPoints(fn: InverseFn, n = 120): [number, number][] {
  const { dom } = INVERSE_SPECS[fn];
  const [a, b] = fn === "tan" ? [-Math.atan(EXTENT), Math.atan(EXTENT)] : dom;
  return Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, INVERSE_SPECS[fn].f(x)] as [number, number]; });
}

/** The inverse function, for checking the reflection. */
export const inverseOf = (fn: InverseFn) => (fn === "sin" ? Math.asin : fn === "cos" ? Math.acos : Math.atan);

/** A point folded over the line y = x: `q` = 0 leaves it where it is, `q` = 1 swaps its coordinates (the reflection). Halfway it is on the line. */
export function fold([x, y]: [number, number], q: number): [number, number] {
  const u = (x + y) / 2, d = ((x - y) / 2) * Math.cos(Math.PI * q);
  return [u + d, u - d];
}

/** The inverse of sin on its restricted domain, for checking the reflection. */
export const arcsin = (x: number) => Math.asin(x);

/** The corners of the animation's bounds in slide units: a panel is `2 * EXTENT * K` wide. */
export const PANEL = 2 * EXTENT * K;
