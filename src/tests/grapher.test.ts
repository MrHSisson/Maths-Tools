// Grapher math-engine tests — the accuracy guarantees for SmartGrapher.
// Everything visual downstream trusts these numbers, so they are checked here
// rather than eyeballed in the lab.

import { describe, it, expect } from "vitest";
import {
  quadraticRoots, cubicRoots,
  getLinearFOIs, getQuadraticFOIs, getCubicFOIs, getCircleFOIs,
  buildCurveSpec, computeFrame, niceStep,
  type FOI,
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
