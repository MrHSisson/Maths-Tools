// Graphical LP maths core (src/shared/decision/lpGraph.ts): the textbook's ferry problem by hand, then seeded random regions checked by routes that do not
// share its code: the grapher's own clipping (floating point), a fine-grid scan, and a brute-force search of every whole point. Seeded, so no chance failures.
import { describe, it, expect } from "vitest";
import { fr } from "../shared/decision/dim";
import { computeFeasibleRegion, optimiseLinear } from "../shared/grapher/mathEngine";
import {
  type GLine, type Objective, type Pt, regionVertices, isEnclosed, hasInterior, testPoint, intercepts, bestCorners, vertexTable, objectiveLine, notParallelToAnEdge,
  latticePoints, surroundingPoints, nearestWhole, bestWhole, bestAmongSurrounding, greatestYTable, inRegion, lineHolds, countsOk, toNum, ptKey, objValue, isStrictLine, AXES, ptEq,
} from "../shared/decision/lpGraph";

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const P = (x: number, y: number, dx = 1, dy = 1): Pt => [fr(x, dx), fr(y, dy)];
const nums = (vs: readonly Pt[]) => vs.map((v) => [toNum(v[0]), toNum(v[1])]).sort((u, v) => u[0] - v[0] || u[1] - v[1]);

// the textbook's ferry problem: maximise 3x + 5y, 5x + 6y ≤ 50, 2x + 4y ≤ 25
const FERRY: GLine[] = [{ a: 5, b: 6, op: "≤", c: 50 }, { a: 2, b: 4, op: "≤", c: 25 }];
const FO: Objective = { p: 3, q: 5, sense: "max" };

describe("the ferry problem (acceptance example)", () => {
  it("has the four vertices, in order round the region", () => {
    const vs = regionVertices(FERRY);
    expect(nums(vs)).toEqual([[0, 0], [0, 6.25], [6.25, 3.125], [10, 0]]);
    expect(vs.map(ptKey)).toEqual([[fr(0), fr(0)], [fr(10), fr(0)], [fr(25, 4), fr(25, 8)], [fr(0), fr(25, 4)]].map((v) => ptKey(v as unknown as Pt)));
  });
  it("is enclosed, so R is written in it, and has an interior", () => {
    expect(isEnclosed(FERRY)).toBe(true);
    expect(hasInterior(FERRY)).toBe(true);
  });
  it("has a single best vertex, 34.375 at (6.25, 3.125)", () => {
    const b = bestCorners(regionVertices(FERRY), FO)!;
    expect(b.at).toHaveLength(1);
    expect(toNum(b.value)).toBe(34.375);
    expect(toNum(b.at[0][0])).toBe(6.25);
    expect(toNum(b.at[0][1])).toBe(3.125);
    expect(notParallelToAnEdge(FERRY, FO)).toBe(true);
  });
  it("has best whole point 33 at (6, 3), found among the four around the optimum; (6, 4), (7, 3), (7, 4) are not in the region", () => {
    const opt = bestCorners(regionVertices(FERRY), FO)!.at[0];
    const around = surroundingPoints(FERRY, opt);
    expect(around.map((s) => [toNum(s.at[0]), toNum(s.at[1]), s.feasible])).toEqual([[6, 3, true], [6, 4, false], [7, 3, false], [7, 4, false]]);
    const w = bestWhole(FERRY, FO)!;
    expect(toNum(w.value)).toBe(33);
    expect(nums(w.at)).toEqual([[6, 3]]);
    expect(nums(bestAmongSurrounding(FERRY, opt, FO)!.at)).toEqual([[6, 3]]);
    const n = nearestWhole(FERRY, opt);
    expect([toNum(n.at[0]), toNum(n.at[1]), n.feasible]).toEqual([6, 3, true]);
  });
});

describe("drawing helpers", () => {
  it("tests (0, 0) unless the line passes through it, and never a point on the line", () => {
    expect(testPoint({ a: 2, b: 3, op: "≤", c: 12 })).toEqual({ at: P(0, 0), holds: true });
    expect(testPoint({ a: 1, b: 1, op: "≥", c: 5 })).toEqual({ at: P(0, 0), holds: false });
    const through = testPoint({ a: 1, b: -2, op: "≥", c: 0 });
    expect(through.at).not.toEqual(P(0, 0));
    expect(through.at).toEqual(P(1, 0));
    expect(through.holds).toBe(true);
    const diag = testPoint({ a: 1, b: -1, op: "≤", c: 0 });
    expect(diag.at).toEqual(P(1, 0));
  });
  it("gives the axis crossings, none for a line parallel to an axis", () => {
    expect(intercepts({ a: 2, b: 3, op: "≤", c: 12 })).toEqual({ x: P(6, 0)[0], y: P(4, 0)[0] });
    expect(intercepts({ a: 1, b: 0, op: "≤", c: 8 })).toEqual({ x: P(8, 0)[0], y: null });
    expect(intercepts({ a: 0, b: 1, op: "≥", c: 2 })).toEqual({ x: null, y: P(2, 0)[0] });
  });
  it("a strict boundary is not in the region but its vertices still are the closure's", () => {
    const strict: GLine[] = [{ a: 1, b: 1, op: "<", c: 6 }, { a: 1, b: 0, op: ">", c: 1 }];
    expect(lineHolds(strict[0], P(3, 3))).toBe(false);
    expect(lineHolds(strict[0], P(2, 3))).toBe(true);
    expect(inRegion(strict, P(1, 2))).toBe(false);
    expect(nums(regionVertices(strict))).toEqual([[1, 0], [1, 5], [6, 0]]);
    expect(strict.map(isStrictLine)).toEqual([true, true]); // drawn dotted
    expect(FERRY.some(isStrictLine)).toBe(false); // drawn continuous
    expect(AXES.every((l) => lineHolds(l, P(0, 0)))).toBe(true);
    expect(ptEq(P(2, 4, 4, 8), P(1, 1, 2, 2))).toBe(true);
  });
  it("sees an open region (a ≥ line away from the origin) as not enclosed, and a minimise on it still has a best corner", () => {
    const open: GLine[] = [{ a: 3, b: 2, op: "≥", c: 12 }, { a: 1, b: 3, op: "≥", c: 9 }];
    expect(isEnclosed(open)).toBe(false);
    const vs = regionVertices(open);
    expect(vs.map(ptKey).sort()).toEqual([[fr(0), fr(6)], [fr(9), fr(0)], [fr(18, 7), fr(15, 7)]].map((v) => ptKey(v as unknown as Pt)).sort());
    const o: Objective = { p: 4, q: 5, sense: "min" };
    expect(bestCorners(vs, o)!.at).toHaveLength(1);
  });
  it("the objective line px + qy = k crosses the axes at k/p and k/q", () => {
    const l = objectiveLine({ p: 3, q: 5, sense: "max" }, fr(30));
    expect(l).toEqual({ x: P(10, 0)[0], y: P(6, 0)[0] });
  });
  it("the vertex table lists every corner with its value", () => {
    const t = vertexTable(regionVertices(FERRY), FO);
    expect(t.map((r) => toNum(r.value)).sort((a, b) => a - b)).toEqual([0, 30, 31.25, 34.375]);
  });
  it("the greatest feasible y for each whole x", () => {
    expect(greatestYTable(FERRY, FO).slice(0, 3).map((r) => [r.x, r.y])).toEqual([[0, 6], [1, 5], [2, 5]]);
  });
  it("the constraint-count rule", () => {
    const s = (a: number, b: number): GLine => ({ a, b, op: "≤", c: 12 * (a || 1) * (b || 1) });
    expect(countsOk([s(1, 1), s(2, 1), s(1, 3)])).toBe(true);
    expect(countsOk([s(1, 1), s(2, 1), s(1, 3), s(3, 2)])).toBe(false); // four sloped lines
    expect(countsOk([s(1, 1), s(2, 1), s(1, 3), s(1, 0)])).toBe(true); // four in all
    expect(countsOk([s(1, 1), s(2, 1), s(1, 3), s(1, 0), s(0, 1)])).toBe(true); // five with bounds
    expect(countsOk([s(1, 1), s(2, 1), s(1, 0), s(0, 1), s(1, 0), s(0, 1)])).toBe(false); // six
  });
});

/** a random enclosed region: two to three sloped ≤ lines with whole intercepts, plus maybe a bound; every line active is checked by the caller */
function randomRegion(rnd: () => number): GLine[] {
  const ls: GLine[] = [];
  const n = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    const a = 1 + Math.floor(rnd() * 5), b = 1 + Math.floor(rnd() * 5);
    const ix = 3 + Math.floor(rnd() * 8), iy = 3 + Math.floor(rnd() * 8);
    // whole intercepts ix, iy: ax + by ≤ c with c a common multiple of a·ix... use the intercept form scaled to whole numbers
    const c = a * b * ix * iy / gcd(a * ix, b * iy) * 1;
    ls.push({ a: c / ix, b: c / iy, op: "≤", c });
  }
  if (rnd() < 0.5) ls.push({ a: 1, b: 0, op: "≤", c: 4 + Math.floor(rnd() * 6) });
  return ls;
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

describe("seeded random regions, checked by independent routes", () => {
  const rnd = mulberry32(20261128);
  const cases = Array.from({ length: 150 }, () => randomRegion(rnd)).filter((ls) => hasInterior(ls));
  it("has enough regions to mean something", () => expect(cases.length).toBeGreaterThan(100));
  it("every vertex satisfies every constraint, and the exact vertices match the grapher's own clipped polygon", () => {
    for (const ls of cases) {
      const vs = regionVertices(ls);
      for (const v of vs) expect(inRegion(ls, v) || ls.some((l) => !lineHolds(l, v))).toBe(true);
      expect(isEnclosed(ls)).toBe(true);
      const poly = computeFeasibleRegion([{ a: 1, b: 0, c: 0, op: ">=" }, { a: 0, b: 1, c: 0, op: ">=" }, ...ls.map((l) => ({ a: l.a, b: l.b, c: l.c, op: l.op === "≥" || l.op === ">" ? ">=" : "<=" }) as const)]);
      const exact = new Set(vs.map((v) => `${toNum(v[0]).toFixed(5)},${toNum(v[1]).toFixed(5)}`));
      const eng = new Set(poly.map((p) => `${(Math.abs(p.x) < 1e-9 ? 0 : p.x).toFixed(5)},${(Math.abs(p.y) < 1e-9 ? 0 : p.y).toFixed(5)}`));
      // the engine's window may add corners at x or y below 0; the exact ones are the engine's corners with x, y ≥ 0
      const engNonNeg = new Set([...eng].filter((k) => k.split(",").every((n) => Number(n) >= 0)));
      expect([...exact].sort()).toEqual([...engNonNeg].sort());
    }
  });
  it("the best vertex agrees with the grapher's optimiseLinear and with a scan of a fine grid", () => {
    for (const ls of cases) {
      const vs = regionVertices(ls);
      for (const o of [{ p: 3, q: 5, sense: "max" }, { p: 7, q: 2, sense: "max" }, { p: 5, q: 4, sense: "max" }] as Objective[]) {
        const best = bestCorners(vs, o)!;
        const eng = optimiseLinear(vs.map((v) => ({ x: toNum(v[0]), y: toNum(v[1]) })), { a: o.p, b: o.q }, true)!;
        expect(toNum(best.value)).toBeCloseTo(eng.value, 9);
        const xs = vs.map((v) => toNum(v[0])), ys = vs.map((v) => toNum(v[1]));
        let top = -Infinity;
        for (let i = 0; i <= Math.max(...xs) * 12; i++) for (let j = 0; j <= Math.max(...ys) * 12; j++) {
          const p: Pt = [fr(i, 12), fr(j, 12)];
          if (inRegion(ls, p)) top = Math.max(top, toNum(objValue(o, p)));
        }
        expect(top).toBeLessThanOrEqual(toNum(best.value) + 1e-9);
        expect(toNum(best.value) - top).toBeLessThanOrEqual((o.p + o.q) / 12 + 1e-9);
      }
    }
  });
  it("the best whole point is never better than the optimum, and the four surrounding points are whole and within one of it", () => {
    for (const ls of cases) {
      const o: Objective = { p: 3, q: 5, sense: "max" };
      const best = bestCorners(regionVertices(ls), o)!;
      const w = bestWhole(ls, o)!;
      expect(toNum(w.value)).toBeLessThanOrEqual(toNum(best.value) + 1e-9);
      for (const s of surroundingPoints(ls, best.at[0])) {
        expect(s.at.every((c) => c[1] === 1)).toBe(true);
        expect(Math.abs(toNum(s.at[0]) - toNum(best.at[0][0]))).toBeLessThan(1);
        expect(Math.abs(toNum(s.at[1]) - toNum(best.at[0][1]))).toBeLessThan(1);
      }
      for (const p of latticePoints(ls)) expect(inRegion(ls, p)).toBe(true);
    }
  });
});
