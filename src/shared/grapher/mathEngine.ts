// ─────────────────────────────────────────────────────────────────────────────
// mathEngine.ts — the mathematically load-bearing core of SmartGrapher.
//
// Pure, side-effect-free functions only (no DOM, no React) so they can be unit
// tested in CI. Two responsibilities:
//   1. Features of Interest (FOIs) — the points a teacher cares about for each
//      curve type (roots, vertices/turning points, intercepts, centres…).
//   2. Framing — turn a set of FOIs + the curve itself into an ideal viewport
//      (centreX, centreY, unitsPerPixel) that frames everything with padding at
//      a strictly locked 1:1 aspect ratio.
//
// Everything downstream (drawGraph, usePanZoom, SmartGrapher, the /grapher lab)
// consumes these; there is exactly one place the maths lives.
// ─────────────────────────────────────────────────────────────────────────────

export type EquationType =
  | "linear" | "quadratic" | "cubic" | "circle" | "custom"
  // Extended families:
  | "reciprocal"   // y = a/(x − h) + k        params [a, h, k]
  | "exponential"  // y = a·bˣ + k             params [a, b, k]
  | "logarithm"    // y = a·log_b(x − h)        params [a, b, h]
  | "sine"         // y = A·sin(Bx + C) + D     params [A, B, C, D]
  | "cosine"       // y = A·cos(Bx + C) + D     params [A, B, C, D]
  | "tangent"      // y = A·tan(Bx + C) + D     params [A, B, C, D]
  | "absolute";    // y = a·|x − h| + k         params [a, h, k]

/** A single Feature of Interest — a point worth framing and marking. */
export interface FOI {
  x: number;
  y: number;
  kind: "root" | "vertex" | "turning" | "intercept" | "centre" | "extent" | "point";
  /** Optional short label, e.g. "(2, 0)" or "vertex". */
  label?: string;
  /** Render as a hollow dot (a strict-inequality endpoint, x not included). */
  open?: boolean;
}

/** The mutable viewport — held in a ref by SmartGrapher, never in React state. */
export interface Viewport {
  centreX: number;
  centreY: number;
  /** Math units per CSS pixel. Same on both axes → 1:1 aspect ratio. */
  unitsPerPixel: number;
}

/** Optional per-embed conditions (domain locks, etc.). */
export interface FrameOptions {
  domain?: { xMin?: number; xMax?: number; yMin?: number; yMax?: number };
  /** When true, the framer uses the domain as the hard x-range instead of the
   *  FOI spread — used e.g. for probability graphs locked to p ∈ [0, 1]. */
  lockDomain?: boolean;
  /** Fractional visual padding around the framed content. Default 0.15 (15%). */
  padding?: number;
}

/**
 * A drawable curve. `function` curves are single-valued y = f(x); `circle` is
 * handled specially by the painter (it is not a function).
 */
export type CurveSpec =
  | { kind: "function"; f: (x: number) => number; hintX?: [number, number]; hintY?: [number, number] }
  | { kind: "circle"; cx: number; cy: number; r: number };

// ── Numeric helpers ──────────────────────────────────────────────────────────

const EPS = 1e-9;
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

/** Real roots of a x² + b x + c = 0 (a may be 0 → linear). */
export function quadraticRoots(a: number, b: number, c: number): number[] {
  if (near(a, 0)) {
    if (near(b, 0)) return [];
    return [-c / b];
  }
  const disc = b * b - 4 * a * c;
  if (disc < -EPS) return [];
  if (Math.abs(disc) <= EPS) return [-b / (2 * a)];
  const s = Math.sqrt(disc);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((p, q) => p - q);
}

/**
 * Real roots of a x³ + b x² + c x + d = 0 (a may be 0 → falls back to
 * quadratic). Uses the depressed-cubic + Cardano/trigonometric method for
 * analytic accuracy — no numeric scanning.
 */
export function cubicRoots(a: number, b: number, c: number, d: number): number[] {
  if (near(a, 0)) return quadraticRoots(b, c, d);

  // Normalise to x³ + Bx² + Cx + D.
  const B = b / a, C = c / a, D = d / a;

  // Depress: x = t - B/3  →  t³ + p t + q.
  const p = C - (B * B) / 3;
  const q = (2 * B * B * B) / 27 - (B * C) / 3 + D;
  const shift = -B / 3;

  const roots: number[] = [];

  if (near(p, 0) && near(q, 0)) {
    roots.push(shift); // triple root
  } else {
    const disc = (q * q) / 4 + (p * p * p) / 27;
    if (disc > EPS) {
      // One real root.
      const sq = Math.sqrt(disc);
      const u = Math.cbrt(-q / 2 + sq);
      const v = Math.cbrt(-q / 2 - sq);
      roots.push(u + v + shift);
    } else if (Math.abs(disc) <= EPS) {
      // Repeated roots.
      const u = Math.cbrt(-q / 2);
      roots.push(2 * u + shift);
      roots.push(-u + shift);
    } else {
      // Three distinct real roots (trigonometric form).
      const m = 2 * Math.sqrt(-p / 3);
      const theta = Math.acos((3 * q) / (p * m)) / 3;
      for (let k = 0; k < 3; k++) {
        roots.push(m * Math.cos(theta - (2 * Math.PI * k) / 3) + shift);
      }
    }
  }

  // De-duplicate near-equal roots and sort ascending.
  const out: number[] = [];
  for (const r of roots.sort((x, y) => x - y)) {
    if (!out.some((o) => near(o, r, 1e-6))) out.push(r);
  }
  return out;
}

// ── FOI calculators (one per preset equation type) ───────────────────────────

/** y = m x + c. */
export function getLinearFOIs(m: number, c: number): FOI[] {
  const fois: FOI[] = [{ x: 0, y: c, kind: "intercept", label: "y-intercept" }];
  if (!near(m, 0)) fois.push({ x: -c / m, y: 0, kind: "root", label: "x-intercept" });
  return dedupeFOIs(fois);
}

/** y = a x² + b x + c. */
export function getQuadraticFOIs(a: number, b: number, c: number): FOI[] {
  const fois: FOI[] = [];
  if (!near(a, 0)) {
    const vx = -b / (2 * a);
    const vy = a * vx * vx + b * vx + c;
    fois.push({ x: vx, y: vy, kind: "vertex", label: "vertex" });
  }
  fois.push({ x: 0, y: c, kind: "intercept", label: "y-intercept" });
  for (const r of quadraticRoots(a, b, c)) fois.push({ x: r, y: 0, kind: "root" });
  return dedupeFOIs(fois);
}

/** y = a x³ + b x² + c x + d. Turning points via the derivative 3a x² + 2b x + c. */
export function getCubicFOIs(a: number, b: number, c: number, d: number): FOI[] {
  const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
  const fois: FOI[] = [{ x: 0, y: d, kind: "intercept", label: "y-intercept" }];
  for (const tx of quadraticRoots(3 * a, 2 * b, c)) {
    fois.push({ x: tx, y: f(tx), kind: "turning", label: "turning point" });
  }
  for (const r of cubicRoots(a, b, c, d)) fois.push({ x: r, y: 0, kind: "root" });
  return dedupeFOIs(fois);
}

/** (x − cx)² + (y − cy)² = r². */
export function getCircleFOIs(cx: number, cy: number, r: number): FOI[] {
  const R = Math.abs(r);
  return dedupeFOIs([
    { x: cx, y: cy, kind: "centre", label: "centre" },
    { x: cx + R, y: cy, kind: "extent" },
    { x: cx - R, y: cy, kind: "extent" },
    { x: cx, y: cy + R, kind: "extent" },
    { x: cx, y: cy - R, kind: "extent" },
  ]);
}

/** Dispatch: derive FOIs for a preset type. `custom` returns [] (supply via config.fois). */
export function computeFOIs(type: EquationType, params: number[] = []): FOI[] {
  switch (type) {
    case "linear":    return getLinearFOIs(params[0] ?? 1, params[1] ?? 0);
    case "quadratic": return getQuadraticFOIs(params[0] ?? 1, params[1] ?? 0, params[2] ?? 0);
    case "cubic":     return getCubicFOIs(params[0] ?? 1, params[1] ?? 0, params[2] ?? 0, params[3] ?? 0);
    case "circle":    return getCircleFOIs(params[0] ?? 0, params[1] ?? 0, params[2] ?? 1);
    case "absolute": {
      const [a = 1, h = 0, k = 0] = params;
      void a;
      return [{ x: h, y: k, kind: "vertex", label: "vertex" }];
    }
    default:          return []; // custom + extended families supply markers via recipes
  }
}

/** Build the drawable curve for a preset type (or wrap a custom fn). */
export function buildCurveSpec(
  type: EquationType,
  params: number[] = [],
  fn?: (x: number) => number,
): CurveSpec {
  switch (type) {
    case "linear": {
      const [m = 1, c = 0] = params;
      return { kind: "function", f: (x) => m * x + c };
    }
    case "quadratic": {
      const [a = 1, b = 0, c = 0] = params;
      return { kind: "function", f: (x) => a * x * x + b * x + c };
    }
    case "cubic": {
      const [a = 1, b = 0, c = 0, d = 0] = params;
      return { kind: "function", f: (x) => a * x * x * x + b * x * x + c * x + d };
    }
    case "circle": {
      const [cx = 0, cy = 0, r = 1] = params;
      return { kind: "circle", cx, cy, r: Math.abs(r) };
    }
    case "reciprocal": {
      const [a = 1, h = 0, k = 0] = params;
      const m = Math.max(6, Math.abs(a) * 6);
      return { kind: "function", f: (x) => (x === h ? NaN : a / (x - h) + k), hintX: [h - 6, h + 6], hintY: [k - m, k + m] };
    }
    case "exponential": {
      const [a = 1, b = 2, k = 0] = params;
      const base = b > 0 ? b : 2;
      return { kind: "function", f: (x) => a * Math.pow(base, x) + k, hintX: [-4, 4] };
    }
    case "logarithm": {
      const [a = 1, b = 10, h = 0] = params;
      const lb = Math.log(b > 0 && b !== 1 ? b : 10);
      return { kind: "function", f: (x) => (x > h ? (a * Math.log(x - h)) / lb : NaN), hintX: [h + 0.01, h + 10] };
    }
    case "sine": {
      const [A = 1, B = 1, C = 0, D = 0] = params;
      const T = (2 * Math.PI) / (Math.abs(B) || 1);
      return { kind: "function", f: (x) => A * Math.sin(B * x + C) + D, hintX: [-T, T] };
    }
    case "cosine": {
      const [A = 1, B = 1, C = 0, D = 0] = params;
      const T = (2 * Math.PI) / (Math.abs(B) || 1);
      return { kind: "function", f: (x) => A * Math.cos(B * x + C) + D, hintX: [-T, T] };
    }
    case "tangent": {
      const [A = 1, B = 1, C = 0, D = 0] = params;
      const P = Math.PI / (Math.abs(B) || 1); // asymptote spacing
      const m = Math.max(6, Math.abs(A) * 6);
      return { kind: "function", f: (x) => A * Math.tan(B * x + C) + D, hintX: [-1.5 * P, 1.5 * P], hintY: [D - m, D + m] };
    }
    case "absolute": {
      const [a = 1, h = 0, k = 0] = params;
      return { kind: "function", f: (x) => a * Math.abs(x - h) + k, hintX: [h - 5, h + 5] };
    }
    case "custom":
      return { kind: "function", f: fn ?? ((x) => x) };
  }
}

// ── Intersections (for simultaneous equations / mixed strategies) ────────────

/**
 * Real intersection points of two single-valued curves y = f(x) and y = g(x)
 * over [xMin, xMax], found by scanning h(x) = f(x) − g(x) for sign changes and
 * refining each with bisection. Robust for the teaching cases (line/line,
 * line/quadratic, quadratic/quadratic, payoff lines) without any analytic
 * special-casing.
 */
export function findFunctionIntersections(
  f: (x: number) => number,
  g: (x: number) => number,
  xMin: number,
  xMax: number,
  samples = 800,
): Array<{ x: number; y: number }> {
  if (!(xMax > xMin)) return [];
  const h = (x: number) => f(x) - g(x);
  const out: Array<{ x: number; y: number }> = [];
  const push = (x: number) => {
    const y = f(x);
    if (Number.isFinite(x) && Number.isFinite(y) && !out.some((o) => near(o.x, x, 1e-6))) {
      out.push({ x, y });
    }
  };

  let prevX = xMin;
  let prevH = h(xMin);
  if (Number.isFinite(prevH) && Math.abs(prevH) < 1e-9) push(prevX);

  for (let i = 1; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    const hx = h(x);
    if (Number.isFinite(prevH) && Number.isFinite(hx)) {
      if ((prevH < 0 && hx > 0) || (prevH > 0 && hx < 0)) {
        // Bisection between the bracketing samples.
        let lo = prevX, hi = x, flo = prevH;
        for (let k = 0; k < 60; k++) {
          const mid = (lo + hi) / 2;
          const fm = h(mid);
          if (Math.abs(fm) < 1e-12) { lo = hi = mid; break; }
          if ((flo < 0 && fm < 0) || (flo > 0 && fm > 0)) { lo = mid; flo = fm; }
          else { hi = mid; }
        }
        push((lo + hi) / 2);
      } else if (Math.abs(hx) < 1e-9) {
        push(x);
      }
    }
    prevX = x;
    prevH = hx;
  }
  return out.sort((a, b) => a.x - b.x);
}

// ── Framing — FOIs + curve → ideal viewport ──────────────────────────────────

function dedupeFOIs(fois: FOI[]): FOI[] {
  const out: FOI[] = [];
  for (const f of fois) {
    if (!Number.isFinite(f.x) || !Number.isFinite(f.y)) continue;
    if (!out.some((o) => near(o.x, f.x, 1e-6) && near(o.y, f.y, 1e-6))) out.push(f);
  }
  return out;
}

interface Box { xMin: number; xMax: number; yMin: number; yMax: number }

/** Sample a function across [xMin, xMax] to capture its y-extent (clamped). */
function sampleYExtent(f: (x: number) => number, xMin: number, xMax: number): [number, number] {
  const N = 240;
  const CLAMP = 1e6;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= N; i++) {
    const x = xMin + ((xMax - xMin) * i) / N;
    const y = f(x);
    if (Number.isFinite(y) && Math.abs(y) < CLAMP) {
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
  }
  if (lo === Infinity) return [0, 0];
  return [lo, hi];
}

/**
 * Compute the ideal viewport to frame `fois` (and the curve) within a canvas of
 * `cssW × cssH` CSS pixels, with padding, at a locked 1:1 aspect ratio.
 *
 * The x-range is taken from the FOIs (or from `domain` when `lockDomain`), then
 * the curve is sampled across that range so it is always visible even when the
 * FOIs alone would clip it. Both ranges get `padding` on every side; the larger
 * scale wins so nothing is ever cut off, and the smaller axis is centred within
 * the leftover space.
 */
export function computeFrame(
  fois: FOI[],
  specs: CurveSpec | CurveSpec[] | undefined,
  cssW: number,
  cssH: number,
  opts: FrameOptions = {},
): Viewport {
  const W = cssW > 0 ? cssW : 300;
  const H = cssH > 0 ? cssH : 300;
  const pad = opts.padding ?? 0.15;
  const dom = opts.domain;
  const specList: CurveSpec[] = specs == null ? [] : Array.isArray(specs) ? specs : [specs];

  const box: Box = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity };
  const addX = (x: number) => { if (x < box.xMin) box.xMin = x; if (x > box.xMax) box.xMax = x; };
  const addY = (y: number) => { if (y < box.yMin) box.yMin = y; if (y > box.yMax) box.yMax = y; };

  // 1. X-range: locked domain overrides; otherwise FOI spread.
  if (opts.lockDomain && dom && dom.xMin !== undefined && dom.xMax !== undefined) {
    addX(dom.xMin); addX(dom.xMax);
  } else {
    for (const f of fois) addX(f.x);
    if (dom?.xMin !== undefined) addX(dom.xMin);
    if (dom?.xMax !== undefined) addX(dom.xMax);
    // Curve-supplied hint ranges (trig period, exponential/reciprocal window)
    // so unbounded/periodic curves frame to a meaningful window on their own.
    for (const spec of specList) {
      if (spec.kind === "function" && spec.hintX) { addX(spec.hintX[0]); addX(spec.hintX[1]); }
    }
  }

  // Fallbacks when the x-range is empty or degenerate.
  if (!Number.isFinite(box.xMin) || !Number.isFinite(box.xMax)) { box.xMin = -5; box.xMax = 5; }
  if (near(box.xMin, box.xMax)) { box.xMin -= 5; box.xMax += 5; }

  // 2. Y-range: FOIs plus a sample of every curve across the x-range.
  for (const f of fois) addY(f.y);
  for (const spec of specList) {
    if (spec.kind === "function") {
      if (spec.hintY) {
        // Bounded window (asymptotic curves) — trust it over raw sampling.
        addY(spec.hintY[0]); addY(spec.hintY[1]);
      } else {
        const [lo, hi] = sampleYExtent(spec.f, box.xMin, box.xMax);
        addY(lo); addY(hi);
      }
    } else if (spec.kind === "circle") {
      addX(spec.cx - spec.r); addX(spec.cx + spec.r);
      addY(spec.cy - spec.r); addY(spec.cy + spec.r);
    }
  }
  if (dom?.yMin !== undefined) addY(dom.yMin);
  if (dom?.yMax !== undefined) addY(dom.yMax);

  if (!Number.isFinite(box.yMin) || !Number.isFinite(box.yMax)) { box.yMin = -5; box.yMax = 5; }
  if (near(box.yMin, box.yMax)) { box.yMin -= 5; box.yMax += 5; }

  // 3. Pad both ranges.
  const xSpan = (box.xMax - box.xMin) * (1 + 2 * pad);
  const ySpan = (box.yMax - box.yMin) * (1 + 2 * pad);
  const centreX = (box.xMin + box.xMax) / 2;
  const centreY = (box.yMin + box.yMax) / 2;

  // 4. Lock 1:1 — the axis needing more units-per-pixel wins so both fit.
  const unitsPerPixel = Math.max(xSpan / W, ySpan / H);

  return { centreX, centreY, unitsPerPixel };
}

// ── Coordinate transforms (pure) ─────────────────────────────────────────────
// Screen coordinates are in CSS pixels; (0,0) is the canvas top-left.

export function mathToScreenX(x: number, vp: Viewport, cssW: number): number {
  return cssW / 2 + (x - vp.centreX) / vp.unitsPerPixel;
}
export function mathToScreenY(y: number, vp: Viewport, cssH: number): number {
  return cssH / 2 - (y - vp.centreY) / vp.unitsPerPixel;
}
export function screenToMathX(px: number, vp: Viewport, cssW: number): number {
  return vp.centreX + (px - cssW / 2) * vp.unitsPerPixel;
}
export function screenToMathY(py: number, vp: Viewport, cssH: number): number {
  return vp.centreY - (py - cssH / 2) * vp.unitsPerPixel;
}

/**
 * A "nice" gridline step (1, 2 or 5 × 10ⁿ) closest to `targetUnits`. Keeps
 * gridlines at readable pixel spacing regardless of zoom.
 */
export function niceStep(targetUnits: number): number {
  if (!(targetUnits > 0) || !Number.isFinite(targetUnits)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(targetUnits)));
  const norm = targetUnits / pow; // 1..10
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * pow;
}
