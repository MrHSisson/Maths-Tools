import { describe, expect, it } from "vitest";
import { HALF_PI, arcsin, fold, phase, sinPoints } from "../shared/inverseTrig";

describe("inverse of sin x animation geometry", () => {
  it("folding over y = x leaves the point alone at 0, puts it on the line halfway and swaps x and y at 1", () => {
    for (const [x, y] of sinPoints(-HALF_PI, HALF_PI, 20)) {
      const [a, b] = fold([x, y], 0); expect(a).toBeCloseTo(x); expect(b).toBeCloseTo(y);
      const [m, n] = fold([x, y], 0.5); expect(m).toBeCloseTo(n);
      const [u, v] = fold([x, y], 1); expect(u).toBeCloseTo(y); expect(v).toBeCloseTo(x);
    }
  });
  it("the folded copy of sin x on its restricted domain is exactly y = arcsin x", () => {
    for (const pt of sinPoints(-HALF_PI, HALF_PI, 40)) { const [x, y] = fold(pt, 1); expect(y).toBeCloseTo(arcsin(x), 9); }
  });
  it("each stage's progress runs 0 to 1 over its own click and holds either side", () => {
    expect(phase(0, 1)).toBe(0); expect(phase(1, 1)).toBe(1); expect(phase(1, 2)).toBe(0); expect(phase(4, 3)).toBe(1); expect(phase(2.5, 3)).toBe(0.5 * 0.5 * (3 - 1));
  });
});

import { INVERSE_FNS, INVERSE_SPECS, curveSegments, inverseOf, keptPoints } from "../shared/inverseTrig";

describe("every function's restricted graph folds into its inverse", () => {
  for (const fn of INVERSE_FNS) {
    it(`${fn}: the folded kept curve is y = arc${fn} x, and the restriction is one-to-one`, () => {
      const kept = keptPoints(fn, 60);
      for (const pt of kept) { const [x, y] = fold(pt, 1); expect(y).toBeCloseTo(inverseOf(fn)(Math.max(-1, Math.min(1, x))), 8); }
      const ys = kept.map(([, y]) => y);
      const dir = Math.sign(ys[1] - ys[0]);
      for (let i = 1; i < ys.length; i++) expect(Math.sign(ys[i] - ys[i - 1])).toBe(dir);   // strictly one way: no output repeats
    });
  }
  it("the restricted domains are the ones taught", () => {
    expect(INVERSE_SPECS.cos.dom).toEqual([0, Math.PI]);
    expect(INVERSE_SPECS.sin.dom).toEqual([-HALF_PI, HALF_PI]);
    expect(INVERSE_SPECS.tan.dom).toEqual([-HALF_PI, HALF_PI]);
  });
  it("tan's branches are split where the curve leaves the panel", () => {
    expect(curveSegments("tan", -3.4, 3.4).length).toBeGreaterThanOrEqual(3);
  });
});
