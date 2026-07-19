// Grapher math-engine tests — the accuracy guarantees for SmartGrapher.
// Everything visual downstream trusts these numbers, so they are checked here
// rather than eyeballed in the lab.

import { describe, it, expect } from "vitest";
import {
  quadraticRoots, cubicRoots,
  getLinearFOIs, getQuadraticFOIs, getCubicFOIs, getCircleFOIs,
  buildCurveSpec, computeFrame, computeFOIs, niceStep, findFunctionIntersections,
  computeFeasibleRegion, optimiseLinear,
  type FOI, type EquationType, type LinearConstraint, type Point2,
} from "../shared/grapher/mathEngine";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
const sortedClose = (got: number[], want: number[], eps = 1e-6) => {
  const g = [...got].sort((x, y) => x - y);
  const w = [...want].sort((x, y) => x - y);
  return g.length === w.length && g.every((v, i) => close(v, w[i], eps));
};

describe("quadraticRoots", () => {
  it("two distinct real roots", () => {
    expect(sortedClose(quadraticRoots(1, -5, 6), [2, 3])).toBe(true); // (x-2)(x-3)
  });
  it("repeated root", () => {
    expect(sortedClose(quadraticRoots(1, -4, 4), [2])).toBe(true); // (x-2)²
  });
  it("no real roots", () => {
    expect(quadraticRoots(1, 0, 1)).toEqual([]); // x²+1
  });
  it("degenerate linear (a = 0)", () => {
    expect(sortedClose(quadraticRoots(0, 2, -4), [2])).toBe(true); // 2x-4
  });
});

describe("cubicRoots", () => {
  it("three distinct real roots", () => {
    // (x+1)(x-1)(x-2) = x³ - 2x² - x + 2
    expect(sortedClose(cubicRoots(1, -2, -1, 2), [-1, 1, 2])).toBe(true);
  });
  it("one real root (two complex)", () => {
    // x³ + x + 1 has a single real root ≈ -0.6823
    const r = cubicRoots(1, 0, 1, 1);
    expect(r.length).toBe(1);
    // verify it is genuinely a root
    const x = r[0];
    expect(close(x ** 3 + x + 1, 0, 1e-6)).toBe(true);
  });
  it("repeated roots", () => {
    // (x-1)²(x+2) = x³ - 3x + 2
    expect(sortedClose(cubicRoots(1, 0, -3, 2), [1, -2])).toBe(true);
  });
  it("falls back to quadratic when a = 0", () => {
    expect(sortedClose(cubicRoots(0, 1, -5, 6), [2, 3])).toBe(true);
  });
});

describe("preset FOIs", () => {
  it("linear intercepts", () => {
    const f = getLinearFOIs(2, -4); // y = 2x - 4
    expect(f.some((p) => p.kind === "intercept" && close(p.y, -4))).toBe(true);
    expect(f.some((p) => p.kind === "root" && close(p.x, 2))).toBe(true);
  });

  it("quadratic vertex, intercept and roots", () => {
    const f = getQuadraticFOIs(1, -2, -3); // (x-3)(x+1), vertex (1,-4)
    const v = f.find((p) => p.kind === "vertex");
    expect(v && close(v.x, 1) && close(v.y, -4)).toBe(true);
    expect(f.some((p) => p.kind === "intercept" && close(p.y, -3))).toBe(true);
    const roots = f.filter((p) => p.kind === "root").map((p) => p.x);
    expect(sortedClose(roots, [-1, 3])).toBe(true);
  });

  it("cubic turning points via derivative", () => {
    // y = x³ - 3x → turning points at x = ±1
    const f = getCubicFOIs(1, 0, -3, 0);
    const turns = f.filter((p) => p.kind === "turning").map((p) => p.x);
    expect(sortedClose(turns, [-1, 1])).toBe(true);
    expect(f.some((p) => p.kind === "intercept" && close(p.y, 0))).toBe(true);
  });

  it("circle centre and extents", () => {
    const f = getCircleFOIs(2, -1, 3);
    expect(f.some((p) => p.kind === "centre" && close(p.x, 2) && close(p.y, -1))).toBe(true);
    expect(f.some((p) => p.kind === "extent" && close(p.x, 5) && close(p.y, -1))).toBe(true);
    expect(f.some((p) => p.kind === "extent" && close(p.x, 2) && close(p.y, 2))).toBe(true);
  });
});

describe("computeFrame", () => {
  it("frames FOIs with padding at a locked 1:1 aspect ratio", () => {
    const fois: FOI[] = [
      { x: -1, y: 0, kind: "root" },
      { x: 3, y: 0, kind: "root" },
      { x: 1, y: -4, kind: "vertex" },
    ];
    const spec = buildCurveSpec("quadratic", [1, -2, -3]);
    const vp = computeFrame(fois, spec, 400, 400, { padding: 0.15 });
    // Centre x is the midpoint of the x-features.
    expect(close(vp.centreX, 1, 1e-6)).toBe(true);
    // 1:1 aspect ratio → both axes share unitsPerPixel (single scalar), positive.
    expect(vp.unitsPerPixel).toBeGreaterThan(0);
    // Every FOI must land inside the framed viewport.
    const halfW = (400 / 2) * vp.unitsPerPixel;
    const halfH = (400 / 2) * vp.unitsPerPixel;
    for (const f of fois) {
      expect(Math.abs(f.x - vp.centreX)).toBeLessThanOrEqual(halfW + 1e-6);
      expect(Math.abs(f.y - vp.centreY)).toBeLessThanOrEqual(halfH + 1e-6);
    }
  });

  it("honours a locked domain as the exact x-range", () => {
    const fn = (p: number) => -4 * p * p + 3 * p;
    const spec = buildCurveSpec("custom", [], fn);
    const vp = computeFrame([], spec, 300, 300, {
      domain: { xMin: 0, xMax: 1 },
      lockDomain: true,
      padding: 0.15,
    });
    // The padded domain [0,1] is centred at 0.5.
    expect(close(vp.centreX, 0.5, 1e-6)).toBe(true);
    // The whole domain fits.
    const halfW = (300 / 2) * vp.unitsPerPixel;
    expect(0.5 - halfW).toBeLessThanOrEqual(0 + 1e-6);
    expect(0.5 + halfW).toBeGreaterThanOrEqual(1 - 1e-6);
  });

  it("never produces a degenerate viewport for a single point", () => {
    const vp = computeFrame([{ x: 2, y: 2, kind: "point" }], undefined, 300, 300);
    expect(Number.isFinite(vp.unitsPerPixel)).toBe(true);
    expect(vp.unitsPerPixel).toBeGreaterThan(0);
  });
});

describe("findFunctionIntersections", () => {
  it("two lines meet at one point (simultaneous equations)", () => {
    // y = x + 1 and y = -x + 5 → (2, 3)
    const pts = findFunctionIntersections((x) => x + 1, (x) => -x + 5, -50, 50);
    expect(pts.length).toBe(1);
    expect(close(pts[0].x, 2, 1e-6) && close(pts[0].y, 3, 1e-6)).toBe(true);
  });

  it("line and parabola meet at two points", () => {
    // y = x² and y = x + 2 → x = -1, 2
    const pts = findFunctionIntersections((x) => x * x, (x) => x + 2, -50, 50);
    const xs = pts.map((p) => p.x);
    expect(sortedClose(xs, [-1, 2], 1e-5)).toBe(true);
  });

  it("mixed-strategy payoff lines cross inside [0,1]", () => {
    // 3p and 4 - 3p → p = 2/3, payoff 2
    const pts = findFunctionIntersections((p) => 3 * p, (p) => 4 - 3 * p, 0, 1);
    expect(pts.length).toBe(1);
    expect(close(pts[0].x, 2 / 3, 1e-5) && close(pts[0].y, 2, 1e-5)).toBe(true);
  });

  it("parallel lines never meet", () => {
    expect(findFunctionIntersections((x) => 2 * x + 1, (x) => 2 * x - 3, -50, 50)).toEqual([]);
  });
});

describe("computeFrame (multi-curve)", () => {
  it("frames both curves and their intersection", () => {
    const l1 = buildCurveSpec("linear", [1, 1]);
    const l2 = buildCurveSpec("linear", [-1, 5]);
    const inter: FOI = { x: 2, y: 3, kind: "point", label: "solution" };
    const vp = computeFrame([inter], [l1, l2], 400, 400, { padding: 0.15 });
    expect(vp.unitsPerPixel).toBeGreaterThan(0);
    const halfW = 200 * vp.unitsPerPixel;
    const halfH = 200 * vp.unitsPerPixel;
    expect(Math.abs(2 - vp.centreX)).toBeLessThanOrEqual(halfW + 1e-6);
    expect(Math.abs(3 - vp.centreY)).toBeLessThanOrEqual(halfH + 1e-6);
  });
});

import {
  quadraticInequality, linearInequality, linearQuadraticIntersection, areaBetweenCurves,
  sketchQuadratic, graphicalSolution, simultaneousLinear, transformation, tangentAtPoint, cubicInequality,
  linearProgramming,
} from "../shared/grapher/recipes";

// A polygon contains a point (ray-cast); used to verify feasible regions.
const polyHasVertex = (poly: Point2[], x: number, y: number) =>
  poly.some((p) => close(p.x, x, 1e-4) && close(p.y, y, 1e-4));

describe("quadraticInequality recipe", () => {
  it("> shades outside the roots with open dots + dashed guides (a>0)", () => {
    // x² - x - 6 = (x+2)(x-3), roots -2 and 3
    const r = quadraticInequality(1, -1, -6, ">");
    expect(r.config?.autoFois).toBe(false);
    // Two bands: (-inf,-2) and (3,inf)
    const bands = (r.regions ?? []).filter((x) => x.kind === "xBand") as Array<{ from: number; to: number }>;
    expect(bands.length).toBe(2);
    expect(bands.some((b) => b.from === -Infinity && close(b.to, -2))).toBe(true);
    expect(bands.some((b) => close(b.from, 3) && b.to === Infinity)).toBe(true);
    // Strict → open root dots + dashed guides.
    const roots = (r.config?.fois ?? []).filter((f) => f.kind === "root");
    expect(roots.length).toBe(2);
    expect(roots.every((f) => f.open === true)).toBe(true);
    expect((r.guides ?? []).every((g) => g.dashed === true)).toBe(true);
  });

  it("≤ shades between the roots with closed dots (a>0)", () => {
    const r = quadraticInequality(1, -1, -6, "<=");
    const bands = (r.regions ?? []).filter((x) => x.kind === "xBand") as Array<{ from: number; to: number }>;
    expect(bands.length).toBe(1);
    expect(close(bands[0].from, -2) && close(bands[0].to, 3)).toBe(true);
    const roots = (r.config?.fois ?? []).filter((f) => f.kind === "root");
    expect(roots.every((f) => !f.open)).toBe(true);
  });

  it("flips the shaded side when a<0", () => {
    // -x² + 1 → roots ±1, negative outside, positive between.  ">" → between.
    const r = quadraticInequality(-1, 0, 1, ">");
    const bands = (r.regions ?? []).filter((x) => x.kind === "xBand") as Array<{ from: number; to: number }>;
    expect(bands.length).toBe(1);
    expect(close(bands[0].from, -1) && close(bands[0].to, 1)).toBe(true);
  });
});

describe("linearInequality recipe", () => {
  it("y > mx+c shades above with a dashed boundary", () => {
    const r = linearInequality(1, 0, ">");
    expect(r.series[0].dashed).toBe(true);
    const hp = r.regions?.[0] as { kind: string; side: string };
    expect(hp.kind).toBe("halfPlane");
    expect(hp.side).toBe("above");
  });
  it("y ≤ mx+c shades below with a solid boundary", () => {
    const r = linearInequality(2, 1, "<=");
    expect(r.series[0].dashed).toBe(false);
    expect((r.regions?.[0] as { side: string }).side).toBe("below");
  });
});

describe("linearQuadraticIntersection recipe", () => {
  it("returns both curves as series", () => {
    const r = linearQuadraticIntersection([1, 0, -4], [1, 0], { quadLabel: "q", lineLabel: "l" });
    expect(r.series.length).toBe(2);
    expect(r.series[0].equationType).toBe("quadratic");
    expect(r.series[1].equationType).toBe("linear");
  });
});

describe("areaBetweenCurves recipe", () => {
  it("clamps the shaded band to the intersection x-range", () => {
    // y = x² and y = x + 2 intersect at x = -1 and 2
    const r = areaBetweenCurves(
      { equationType: "quadratic", params: [1, 0, 0] },
      { equationType: "linear", params: [1, 2] },
    );
    const reg = r.regions?.[0] as { kind: string; from: number; to: number };
    expect(reg.kind).toBe("between");
    expect(close(reg.from, -1, 1e-4) && close(reg.to, 2, 1e-4)).toBe(true);
  });
});

describe("sketchQuadratic recipe", () => {
  it("labels roots, vertex, y-intercept and the axis of symmetry", () => {
    // x² - 2x - 3 → roots -1, 3; vertex (1, -4); y-int (0,-3)
    const r = sketchQuadratic(1, -2, -3);
    const f = r.config?.fois ?? [];
    expect(f.some((p) => p.kind === "vertex" && close(p.x, 1) && close(p.y, -4))).toBe(true);
    expect(f.some((p) => p.kind === "intercept" && close(p.y, -3))).toBe(true);
    expect(f.filter((p) => p.kind === "root").length).toBe(2);
    // Axis of symmetry guide at x = 1, dashed.
    expect((r.guides ?? []).some((g) => g.kind === "vLine" && close(g.at, 1) && g.dashed)).toBe(true);
  });
});

describe("graphicalSolution recipe", () => {
  it("adds a horizontal line y = k as the second series", () => {
    const r = graphicalSolution({ equationType: "quadratic", params: [1, 0, -4] }, 5);
    expect(r.series.length).toBe(2);
    expect(r.series[1].equationType).toBe("linear");
    expect(r.series[1].params).toEqual([0, 5]);
  });
});

describe("simultaneousLinear recipe", () => {
  it("returns two lines and suppresses intercept FOIs", () => {
    const r = simultaneousLinear([1, 1], [-1, 5]);
    expect(r.series.length).toBe(2);
    expect(r.config?.autoFois).toBe(false);
  });
});

describe("transformation recipe", () => {
  it("overlays base and transformed curves", () => {
    // f(x) = x², transform g(x) = f(x - 2) + 1  (b=1, c=-2, d=1)
    const r = transformation({ equationType: "quadratic", params: [1, 0, 0] }, { c: -2, d: 1 });
    expect(r.series.length).toBe(2);
    const g = r.series[1].fn!;
    // g(2) should equal f(0) + 1 = 1
    expect(close(g(2), 1, 1e-6)).toBe(true);
    // g(3) = f(1) + 1 = 2
    expect(close(g(3), 2, 1e-6)).toBe(true);
  });
});

describe("tangentAtPoint recipe", () => {
  it("builds the correct tangent line for y = x² at x = 2", () => {
    // f'(2) = 4, tangent: y = 4x - 4
    const r = tangentAtPoint({ equationType: "quadratic", params: [1, 0, 0] }, 2);
    const [slope, intercept] = r.series[1].params as number[];
    expect(close(slope, 4, 1e-3)).toBe(true);
    expect(close(intercept, -4, 1e-3)).toBe(true);
    // Point of tangency (2, 4) supplied explicitly.
    expect((r.config?.fois ?? []).some((p) => close(p.x, 2) && close(p.y, 4))).toBe(true);
  });
});

describe("cubicInequality recipe", () => {
  it("shades the correct sign-intervals for x³ - x > 0", () => {
    // x³ - x = x(x-1)(x+1), roots -1, 0, 1. Positive on (-1,0) and (1,∞).
    const r = cubicInequality(1, 0, -1, 0, ">");
    const bands = (r.regions ?? []) as Array<{ from: number; to: number }>;
    expect(bands.some((b) => close(b.from, -1) && close(b.to, 0))).toBe(true);
    expect(bands.some((b) => close(b.from, 1) && b.to === Infinity)).toBe(true);
    // Not the negative intervals.
    expect(bands.some((b) => b.from === -Infinity && close(b.to, -1))).toBe(false);
    expect(bands.length).toBe(2);
    // Three roots, dashed (strict) with open dots.
    expect((r.config?.fois ?? []).filter((p) => p.kind === "root").length).toBe(3);
    expect((r.config?.fois ?? []).every((p) => p.kind !== "root" || p.open)).toBe(true);
  });
});

describe("extended curve families", () => {
  const fnOf = (type: EquationType, params: number[]) => {
    const spec = buildCurveSpec(type, params);
    if (spec.kind !== "function") throw new Error("expected function spec");
    return spec.f;
  };

  it("reciprocal y = a/(x−h) + k evaluates correctly (and is undefined at the asymptote)", () => {
    const f = fnOf("reciprocal", [2, 1, 3]); // 2/(x−1) + 3
    expect(close(f(3), 4)).toBe(true);        // 2/2 + 3
    expect(Number.isNaN(f(1))).toBe(true);    // vertical asymptote
  });

  it("exponential y = a·bˣ + k", () => {
    const f = fnOf("exponential", [1, 2, 0]);
    expect(close(f(3), 8)).toBe(true);
    expect(close(f(0), 1)).toBe(true);
  });

  it("logarithm y = a·log_b(x−h), undefined below the domain", () => {
    const f = fnOf("logarithm", [1, 10, 0]);
    expect(close(f(10), 1)).toBe(true);   // log10(10)
    expect(close(f(100), 2)).toBe(true);  // log10(100)
    expect(Number.isNaN(f(-1))).toBe(true);
  });

  it("sine / cosine / tangent", () => {
    expect(close(fnOf("sine", [2, 1, 0, 0])(Math.PI / 2), 2)).toBe(true);
    expect(close(fnOf("cosine", [2, 1, 0, 0])(0), 2)).toBe(true);
    expect(close(fnOf("tangent", [1, 1, 0, 0])(Math.PI / 4), 1, 1e-6)).toBe(true);
  });

  it("modulus y = a·|x−h| + k with a vertex FOI", () => {
    const f = fnOf("absolute", [1, 0, 0]);
    expect(close(f(-3), 3) && close(f(3), 3)).toBe(true);
    const v = computeFOIs("absolute", [2, 1, -1]).find((p) => p.kind === "vertex");
    expect(v && close(v.x, 1) && close(v.y, -1)).toBe(true);
  });

  it("each extended family frames to a finite, positive-scale viewport", () => {
    const cases: Array<[EquationType, number[]]> = [
      ["reciprocal", [1, 0, 0]], ["exponential", [1, 2, 0]], ["logarithm", [1, 10, 0]],
      ["sine", [2, 1, 0, 0]], ["cosine", [2, 1, 0, 0]], ["tangent", [1, 1, 0, 0]], ["absolute", [1, 0, 0]],
    ];
    for (const [type, params] of cases) {
      const spec = buildCurveSpec(type, params);
      const vp = computeFrame(computeFOIs(type, params), spec, 300, 300);
      expect(Number.isFinite(vp.unitsPerPixel) && vp.unitsPerPixel > 0).toBe(true);
      expect(Number.isFinite(vp.centreX) && Number.isFinite(vp.centreY)).toBe(true);
    }
  });
});

describe("computeFeasibleRegion + optimiseLinear (linear programming)", () => {
  // x ≥ 0, y ≥ 0, x + y ≤ 4  → triangle with vertices (0,0), (4,0), (0,4)
  const constraints: LinearConstraint[] = [
    { a: 1, b: 0, c: 0, op: ">=" },
    { a: 0, b: 1, c: 0, op: ">=" },
    { a: 1, b: 1, c: 4, op: "<=" },
  ];

  it("produces the correct feasible polygon vertices", () => {
    const poly = computeFeasibleRegion(constraints);
    expect(poly.length).toBe(3);
    expect(polyHasVertex(poly, 0, 0)).toBe(true);
    expect(polyHasVertex(poly, 4, 0)).toBe(true);
    expect(polyHasVertex(poly, 0, 4)).toBe(true);
  });

  it("finds the maximising vertex of an objective", () => {
    const poly = computeFeasibleRegion(constraints);
    // maximise 3x + 2y → (4,0) gives 12, beats (0,4)=8 and (0,0)=0
    const opt = optimiseLinear(poly, { a: 3, b: 2 }, true);
    expect(opt && close(opt.x, 4) && close(opt.y, 0) && close(opt.value, 12)).toBe(true);
  });

  it("returns [] for an infeasible system", () => {
    const bad: LinearConstraint[] = [
      { a: 1, b: 0, c: 0, op: "<=" }, // x ≤ 0
      { a: 1, b: 0, c: 2, op: ">=" }, // x ≥ 2
      { a: 0, b: 1, c: 0, op: ">=" },
    ];
    expect(computeFeasibleRegion(bad)).toEqual([]);
  });

  it("recipe: shades the polygon, draws boundaries, marks the optimum", () => {
    const r = linearProgramming(constraints, { objective: { a: 3, b: 2 }, maximise: true });
    // The x+y≤4 boundary is a sloped line; x≥0 / y≥0 are handled as a vertical
    // guide and a horizontal line respectively.
    expect(r.regions?.[0].kind).toBe("polygon");
    const opt = (r.config?.fois ?? []).find((f) => f.label?.startsWith("optimum"));
    expect(opt && close(opt.x, 4) && close(opt.y, 0)).toBe(true);
  });
});

describe("niceStep", () => {
  it("snaps to 1 / 2 / 5 × 10ⁿ", () => {
    expect(niceStep(1)).toBe(1);
    expect(niceStep(1.3)).toBe(1);
    expect(niceStep(3)).toBe(2);
    expect(niceStep(4)).toBe(5);
    expect(niceStep(9)).toBe(10);
    expect(niceStep(23)).toBe(20);
    expect(niceStep(0.03)).toBeCloseTo(0.02, 10);
  });
});
