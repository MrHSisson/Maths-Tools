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

import { quadraticRoots, buildCurveSpec, findFunctionIntersections } from "./mathEngine";
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
