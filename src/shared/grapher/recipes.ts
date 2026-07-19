// ─────────────────────────────────────────────────────────────────────────────
// recipes.ts — pedagogy-encoding helpers for SmartGrapher.
//
// The primitives (series, regions, guides, fois) stay generic — the grapher
// never hears the word "inequality". These pure functions encode the pedagogy
// of a specific use case and return ready-made props a tool spreads straight
// into <SmartGrapher/>:
//
//     <SmartGrapher {...quadraticInequality(1, -1, -6, ">")} />
//
// Each recipe is unit-tested (the shaded side / open-vs-closed dots are easy to
// get wrong by hand), so tools get correct visuals for free. New use case →
// usually a new recipe here, occasionally a new region kind in drawGraph.
// ─────────────────────────────────────────────────────────────────────────────

import { quadraticRoots, cubicRoots, buildCurveSpec, findFunctionIntersections } from "./mathEngine";
import type { FOI } from "./mathEngine";
import type { ShadeRegion, Guide } from "./drawGraph";
import type { GraphSeries, GrapherConfig } from "./SmartGrapher";

/** The subset of SmartGrapher props a recipe produces — spread onto the component. */
export interface GrapherRecipe {
  series: GraphSeries[];
  regions?: ShadeRegion[];
  guides?: Guide[];
  config?: GrapherConfig;
}

export type InequalityOp = ">" | ">=" | "<" | "<=";

const isStrict = (op: InequalityOp) => op === ">" || op === "<";
const wantsGreater = (op: InequalityOp) => op === ">" || op === ">=";

// ── Quadratic inequality — ax² + bx + c ⋛ 0 ─────────────────────────────────
//
// Shades the x-values that satisfy the inequality (between the roots, or outside
// them), with dashed root guides + open dots when strict.
export function quadraticInequality(
  a: number, b: number, c: number, op: InequalityOp,
  opts: { color?: string } = {},
): GrapherRecipe {
  const roots = quadraticRoots(a, b, c); // ascending, 0–2 entries
  const strict = isStrict(op);
  const greater = wantsGreater(op);
  const color = opts.color ?? "#2563eb";

  const series: GraphSeries[] = [{ equationType: "quadratic", params: [a, b, c], color }];
  const regions: ShadeRegion[] = [];
  const guides: Guide[] = [];
  const fois: FOI[] = [];

  // Vertex is always a useful landmark.
  if (Math.abs(a) > 1e-12) {
    const vx = -b / (2 * a);
    fois.push({ x: vx, y: a * vx * vx + b * vx + c, kind: "vertex", label: "vertex" });
  }

  const shade = (from: number, to: number) => regions.push({ kind: "xBand", from, to, color, opacity: 0.16 });

  if (roots.length === 2) {
    const [r1, r2] = roots;
    // With a>0 the parabola is positive OUTSIDE the roots; a<0 flips it.
    const positiveOutside = a > 0;
    // The set where the quadratic is > 0:
    const posBands: Array<[number, number]> = positiveOutside
      ? [[-Infinity, r1], [r2, Infinity]]
      : [[r1, r2]];
    const negBands: Array<[number, number]> = positiveOutside
      ? [[r1, r2]]
      : [[-Infinity, r1], [r2, Infinity]];
    for (const [from, to] of greater ? posBands : negBands) shade(from, to);
    for (const r of roots) {
      guides.push({ kind: "vLine", at: r, dashed: strict, color });
      fois.push({ x: r, y: 0, kind: "root", open: strict });
    }
  } else {
    // No two distinct roots → the quadratic keeps the sign of `a` everywhere
    // (touching zero at a repeated root, if any). Solution is all-x or empty.
    const alwaysPositive = a > 0;
    const solutionIsAll = greater ? alwaysPositive : !alwaysPositive;
    if (solutionIsAll) shade(-Infinity, Infinity);
    for (const r of roots) { // the single repeated root, if present
      guides.push({ kind: "vLine", at: r, dashed: strict, color });
      fois.push({ x: r, y: 0, kind: "root", open: strict });
    }
  }

  return { series, regions, guides, config: { autoFois: false, fois } };
}

// ── Linear ∩ Quadratic — a line crossing a parabola ─────────────────────────
//
// Both curves plus their (auto-detected) intersection point(s) — the solutions
// of the simultaneous pair. Intersections come from SmartGrapher automatically;
// this recipe just assembles the two labelled series.
export function linearQuadraticIntersection(
  quad: [number, number, number],
  line: [number, number],
  opts: { quadLabel?: string; lineLabel?: string } = {},
): GrapherRecipe {
  const [a, b, c] = quad;
  const [m, k] = line;
  return {
    series: [
      { equationType: "quadratic", params: [a, b, c], label: opts.quadLabel, color: "#2563eb" },
      { equationType: "linear", params: [m, k], label: opts.lineLabel, color: "#db2777" },
    ],
  };
}

// ── Linear inequality — y ⋛ mx + c (a half-plane) ───────────────────────────
export function linearInequality(
  m: number, c: number, op: InequalityOp,
  opts: { color?: string } = {},
): GrapherRecipe {
  const strict = isStrict(op);
  const greater = wantsGreater(op); // y > mx+c → above the line
  const color = opts.color ?? "#2563eb";
  return {
    series: [{ equationType: "linear", params: [m, c], color, dashed: strict }],
    regions: [{ kind: "halfPlane", curve: 0, side: greater ? "above" : "below", color, opacity: 0.16 }],
  };
}

// ── Area between two curves ──────────────────────────────────────────────────
//
// Shades the bounded region between two function curves, clamped to the x-range
// between their first and last intersection when they cross (otherwise the whole
// visible width).
export function areaBetweenCurves(
  a: GraphSeries, b: GraphSeries,
  opts: { color?: string } = {},
): GrapherRecipe {
  const color = opts.color ?? "#059669";
  const specA = buildCurveSpec(a.equationType, a.params ?? [], a.fn);
  const specB = buildCurveSpec(b.equationType, b.params ?? [], b.fn);

  let from: number | undefined;
  let to: number | undefined;
  if (specA.kind === "function" && specB.kind === "function") {
    const pts = findFunctionIntersections(specA.f, specB.f, -1000, 1000);
    if (pts.length >= 2) { from = pts[0].x; to = pts[pts.length - 1].x; }
  }

  return {
    series: [a, b],
    regions: [{ kind: "between", a: 0, b: 1, from, to, color, opacity: 0.18 }],
  };
}

// ── Sketch a quadratic ───────────────────────────────────────────────────────
//
// The "sketch this parabola" answer: roots, vertex and y-intercept labelled,
// with the axis of symmetry as a dashed guide.
export function sketchQuadratic(
  a: number, b: number, c: number,
  opts: { color?: string } = {},
): GrapherRecipe {
  const color = opts.color ?? "#2563eb";
  const fois: FOI[] = [{ x: 0, y: c, kind: "intercept", label: "y-intercept" }];
  const guides: Guide[] = [];
  if (Math.abs(a) > 1e-12) {
    const vx = -b / (2 * a);
    fois.push({ x: vx, y: a * vx * vx + b * vx + c, kind: "vertex", label: "vertex" });
    guides.push({ kind: "vLine", at: vx, dashed: true, color });
  }
  for (const r of quadraticRoots(a, b, c)) fois.push({ x: r, y: 0, kind: "root", label: "root" });
  return { series: [{ equationType: "quadratic", params: [a, b, c], color }], guides, config: { autoFois: false, fois } };
}

// ── Graphical solution of f(x) = k ───────────────────────────────────────────
//
// Draws y = f(x) and the horizontal line y = k; SmartGrapher auto-detects and
// dots the crossings — "use the graph to solve f(x) = k".
export function graphicalSolution(
  base: GraphSeries, k: number,
  opts: { baseLabel?: string } = {},
): GrapherRecipe {
  return {
    series: [
      { ...base, color: base.color ?? "#2563eb", label: base.label ?? opts.baseLabel },
      { equationType: "linear", params: [0, k], color: "#db2777", label: `y = ${k}` },
    ],
  };
}

// ── Simultaneous linear equations ────────────────────────────────────────────
//
// Two lines and (only) their solution point — intercept clutter is suppressed so
// the single crossing reads as "the solution".
export function simultaneousLinear(
  line1: [number, number], line2: [number, number],
  opts: { label1?: string; label2?: string } = {},
): GrapherRecipe {
  const [m1, c1] = line1;
  const [m2, c2] = line2;
  return {
    series: [
      { equationType: "linear", params: [m1, c1], color: "#2563eb", label: opts.label1 ?? `y = ${m1}x + ${c1}` },
      { equationType: "linear", params: [m2, c2], color: "#db2777", label: opts.label2 ?? `y = ${m2}x + ${c2}` },
    ],
    config: { autoFois: false }, // keep only the auto-detected intersection
  };
}

// ── Graph transformation — y = f(x) → y = a·f(bx + c) + d ─────────────────────
//
// Overlays the base curve and its transform so the effect is visible side by
// side. `base` must be a function curve (not a circle).
export function transformation(
  base: GraphSeries,
  t: { a?: number; b?: number; c?: number; d?: number } = {},
  opts: { baseLabel?: string; label?: string } = {},
): GrapherRecipe {
  const spec = buildCurveSpec(base.equationType, base.params ?? [], base.fn);
  if (spec.kind !== "function") return { series: [base] };
  const { a = 1, b = 1, c = 0, d = 0 } = t;
  const f = spec.f;
  return {
    series: [
      { ...base, color: "#94a3b8", label: opts.baseLabel ?? "y = f(x)", dashed: true },
      { equationType: "custom", fn: (x) => a * f(b * x + c) + d, color: "#2563eb", label: opts.label ?? "y = a·f(bx + c) + d" },
    ],
  };
}

// ── Tangent to a curve at x₀ (intro to differentiation) ──────────────────────
//
// The curve plus its tangent line at x₀ (gradient by a central-difference
// derivative) and the point of tangency. The tangency point is supplied
// explicitly because a tangent touches without crossing (no sign change to
// auto-detect).
export function tangentAtPoint(
  base: GraphSeries, x0: number,
): GrapherRecipe {
  const spec = buildCurveSpec(base.equationType, base.params ?? [], base.fn);
  if (spec.kind !== "function") return { series: [base] };
  const f = spec.f;
  const h = 1e-4;
  const slope = (f(x0 + h) - f(x0 - h)) / (2 * h);
  const y0 = f(x0);
  const intercept = y0 - slope * x0;
  return {
    series: [
      { ...base, color: base.color ?? "#2563eb", label: base.label ?? "y = f(x)" },
      { equationType: "linear", params: [slope, intercept], color: "#db2777", label: "tangent" },
    ],
    guides: [{ kind: "vLine", at: x0, dashed: true, color: "#94a3b8" }],
    config: { autoFois: false, fois: [{ x: x0, y: y0, kind: "point", label: "point of tangency" }] },
  };
}

// ── Cubic inequality — ax³ + bx² + cx + d ⋛ 0 ────────────────────────────────
//
// Shades the sign-intervals satisfying the inequality. Robust to repeated roots
// because each interval's sign is decided by a test point rather than parity.
export function cubicInequality(
  a: number, b: number, c: number, d: number, op: InequalityOp,
  opts: { color?: string } = {},
): GrapherRecipe {
  const color = opts.color ?? "#2563eb";
  const strict = isStrict(op);
  const greater = wantsGreater(op);
  const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
  const roots = [...new Set(cubicRoots(a, b, c, d))].sort((p, q) => p - q);

  const regions: ShadeRegion[] = [];
  const guides: Guide[] = [];
  const fois: FOI[] = [];

  // Interval edges: -inf, each root, +inf.
  const edges = [-Infinity, ...roots, Infinity];
  for (let i = 0; i < edges.length - 1; i++) {
    const lo = edges[i], hi = edges[i + 1];
    const mid = lo === -Infinity ? hi - 1 : hi === Infinity ? lo + 1 : (lo + hi) / 2;
    const positive = f(mid) > 0;
    if (positive === greater) regions.push({ kind: "xBand", from: lo, to: hi, color, opacity: 0.16 });
  }
  for (const r of roots) {
    guides.push({ kind: "vLine", at: r, dashed: strict, color });
    fois.push({ x: r, y: 0, kind: "root", open: strict });
  }
  return { series: [{ equationType: "cubic", params: [a, b, c, d], color }], regions, guides, config: { autoFois: false, fois } };
}
