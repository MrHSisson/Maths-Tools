// Linear programming maths core (src/shared/decision/lp.ts): the worked examples of specs/linear-programming-formulate.md (2, 4 and 4.6),
// and the tidy rule and `holds` checked over thousands of seeded draws. Seeded, so no chance failures.
import { describe, it, expect } from "vitest";
import { fr, type Fr } from "../shared/decision/dim";
import {
  type Constraint, type Op, OPS, blend, eitherOr, flipOp, gcdInt, intercept, isStrict, isTidy, linear, opHolds, percentOf, pt, ratioOf,
  relationship, tidy, tidyHolds, feasible, objective, type Model, type Var,
} from "../shared/decision/lp";

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const F = (n: number, d = 1) => fr(n, d);
/** [coeffs as plain numbers, op, rhs as plain number] */
const show = (c: Constraint) => [c.coeffs.map((f) => (f[1] === 1 ? f[0] : f[0] / f[1])), c.op, c.rhs[1] === 1 ? c.rhs[0] : c.rhs[0] / c.rhs[1]];

describe("tidy rule", () => {
  it("clears fractions, lowest terms, leading coefficient positive, flips the operator on a negation", () => {
    expect(tidy([F(1, 2), F(-1, 3)], "≥", F(0))).toEqual({ coeffs: [F(3), F(-2)], op: "≥", rhs: F(0) });
    expect(tidy([F(-3), F(2)], "≥", F(0))).toEqual({ coeffs: [F(3), F(-2)], op: "≤", rhs: F(0) });
    expect(tidy([F(-3), F(2)], ">", F(-6))).toEqual({ coeffs: [F(3), F(-2)], op: "<", rhs: F(6) });
    expect(tidy([F(-3), F(2)], "=", F(0))).toEqual({ coeffs: [F(3), F(-2)], op: "=", rhs: F(0) });
    expect(tidy([F(2), F(4)], "≤", F(10))).toEqual({ coeffs: [F(1), F(2)], op: "≤", rhs: F(5) });
  });
  it("leading coefficient is the first non-zero one", () => {
    expect(tidy([F(0), F(-2), F(4)], "≤", F(6))).toEqual({ coeffs: [F(0), F(1), F(-2)], op: "≥", rhs: F(-3) });
  });
  it("never returns −0", () => {
    const t = tidy([F(-1), F(1)], "≥", F(0));
    for (const f of [...t.coeffs, t.rhs]) expect(Object.is(f[0], -0)).toBe(false);
  });
  it("keeps a right-hand side that is not a multiple of the coefficients' common factor", () => {
    expect(tidy([F(2), F(4)], "≤", F(5))).toEqual({ coeffs: [F(2), F(4)], op: "≤", rhs: F(5) });
    expect(tidy([F(80)], "≤", F(500))).toEqual({ coeffs: [F(4)], op: "≤", rhs: F(25) });
  });
  it("strict operators stay strict", () => {
    for (const op of ["<", ">"] as Op[]) expect(isStrict(tidy([F(-2), F(3, 2)], op, F(1, 2)).op)).toBe(true);
    expect(flipOp(flipOp("<"))).toBe("<");
  });
});

describe("relationship rule — brief section 2", () => {
  const x = [0], y = [1], z = [2];
  it("the table", () => {
    expect(show(relationship({ n: 2, a: x, b: y, m: F(2), op: "≥" }))).toEqual([[1, -2], "≥", 0]); //                x at least twice y
    expect(show(relationship({ n: 3, a: x, b: [1, 2], m: F(2), op: "≥" }))).toEqual([[1, -2, -2], "≥", 0]); //     x at least twice y and z combined
    expect(show(relationship({ n: 2, a: x, b: y, m: F(3), op: "≤" }))).toEqual([[1, -3], "≤", 0]); //              x no more than three times y
    expect(show(percentOf({ n: 2, a: x, b: y, p: F(40), op: "=" }))).toEqual([[5, -2], "=", 0]); //                x is exactly 40% of y
    expect(show(percentOf({ n: 3, a: x, b: [1, 2], p: F(40), op: "≤" }))).toEqual([[5, -2, -2], "≤", 0]); //       at most 40% of y and z combined
    expect(show(percentOf({ n: 3, a: x, b: [0, 1, 2], p: F(40), op: "≥" }))).toEqual([[3, -2, -2], "≥", 0]); //    at least 40% of the total
    expect(show(percentOf({ n: 2, a: x, b: [0, 1], p: F(25), op: "≤" }))).toEqual([[3, -1], "≤", 0]); //           at most 25% of the total
    expect(show(relationship({ n: 2, a: x, b: y, m: F(6, 5), op: "=" }))).toEqual([[5, -6], "=", 0]); //           x is 20% more than y
    expect(show(ratioOf({ n: 2, a: x, b: y, num: 2, den: 3, op: "≥" }))).toEqual([[3, -2], "≥", 0]); //            ratio of x to y at least 2 : 3
    expect(show(relationship({ n: 2, a: x, b: y, m: F(4, 5), op: "=" }))).toEqual([[5, -4], "=", 0]); //           x is 20% less than y
    expect(show(relationship({ n: 2, a: x, b: y, m: F(3), op: ">" }))).toEqual([[1, -3], ">", 0]); //              more than three times (strict kept)
  });
  it("the three extensions", () => {
    // each plant at least one third of the run time: a pair
    expect(show(relationship({ n: 2, a: x, b: [0, 1], m: F(1, 3), op: "≥" }))).toEqual([[2, -1], "≥", 0]);
    expect(show(relationship({ n: 2, a: y, b: [0, 1], m: F(1, 3), op: "≥" }))).toEqual([[1, -2], "≤", 0]); // 2y − x ≥ 0 has a negative leading coefficient, so x − 2y ≤ 0
    // at least one adult to every two children: x + y ≥ z/2
    expect(show(relationship({ n: 3, a: [0, 1], b: z, m: F(1, 2), op: "≥" }))).toEqual([[2, 2, -1], "≥", 0]);
    // one senior to every trainee
    expect(show(relationship({ n: 2, a: x, b: y, m: F(1), op: "≥" }))).toEqual([[1, -1], "≥", 0]);
  });
  it("other direct styles", () => {
    expect(show(linear([F(1), F(-1)], "≥", F(5), "bound"))).toEqual([[1, -1], "≥", 5]); // x exceeds y by at least 5
    expect(show(linear([F(1), F(0)], "≤", F(40), "bound"))).toEqual([[1, 0], "≤", 40]); // at most 40 of x
    expect(show(linear([F(1), F(1)], "≤", F(50), "bound"))).toEqual([[1, 1], "≤", 50]); // 50 in all
    expect(show(linear([F(1), F(1)], "=", F(60), "bound"))).toEqual([[1, 1], "=", 60]); // exactly 60 in each packet
  });
  it("the check that is taught: y = 15, z = 5 means x is at least 40, not at most", () => {
    const right = relationship({ n: 3, a: x, b: [1, 2], m: F(2), op: "≥" });
    const reversed = relationship({ n: 3, a: [1, 2], b: x, m: F(2), op: "≥" });
    expect(right.holds(pt(40, 15, 5))).toBe(true);
    expect(right.holds(pt(39, 15, 5))).toBe(false);
    expect(reversed.holds(pt(40, 15, 5))).toBe(false);
  });
});

describe("decimal amounts per item", () => {
  it("scales to whole numbers and the right-hand side scales with it", () => {
    expect(show(linear([F(4, 5), F(3, 5)], "≤", F(3000)))).toEqual([[4, 3], "≤", 15000]);
    expect(show(linear([F(3, 5), F(1), F(2, 5)], "≤", F(35)))).toEqual([[3, 5, 2], "≤", 175]);
    expect(show(linear([F(3, 4), F(3, 4), F(1, 2)], "≤", F(40)))).toEqual([[3, 3, 2], "≤", 160]);
    expect(show(linear([F(2, 5), F(3, 25)], "≤", F(30)))).toEqual([[10, 3], "≤", 750]); // 0.4w + 0.12g ≤ 30
  });
});

describe("blend rule — brief section 4", () => {
  it("oil that is 50% and 20% olive, at least 30% olive: 2x − y ≥ 0", () => {
    const c = blend({ contents: [F(1, 2), F(1, 5)], share: F(3, 10), op: "≥" });
    expect(show(c)).toEqual([[2, -1], "≥", 0]);
    expect(c.holds(pt(10, 10))).toBe(true); // 35% olive
  });
  it("(10, 20) is exactly on the boundary of the oil blend, so ≥ holds and > does not", () => {
    expect(blend({ contents: [F(1, 2), F(1, 5)], share: F(3, 10), op: "≥" }).holds(pt(10, 20))).toBe(true);
    expect(blend({ contents: [F(1, 2), F(1, 5)], share: F(3, 10), op: ">" }).holds(pt(10, 20))).toBe(false);
  });
  it("a bond paying 5% and a share paying 10%, at least 8% overall: 3x − 2y ≤ 0", () => {
    expect(show(blend({ contents: [F(1, 20), F(1, 10)], share: F(2, 25), op: "≥" }))).toEqual([[3, -2], "≤", 0]);
  });
  it("whisky 40% and ginger wine 12% alcohol, at least 20% alcohol: 5w − 2g ≥ 0", () => {
    expect(show(blend({ contents: [F(2, 5), F(3, 25)], share: F(1, 5), op: "≥" }))).toEqual([[5, -2], "≥", 0]);
  });
  it("the named slips give different constraints", () => {
    const right = blend({ contents: [F(1, 2), F(1, 5)], share: F(3, 10), op: "≥" });
    expect(right.holds(pt(10, 10))).toBe(true);
    expect(right.holds(pt(5, 20))).toBe(false); // 2.5 + 4 = 6.5 of 25 = 26%
  });
  it("the empty mix: tidy form and meaning agree (strict is false at 0 = 0)", () => {
    for (const op of OPS) {
      const c = blend({ contents: [F(1, 2), F(1, 5)], share: F(3, 10), op });
      expect(c.holds(pt(0, 0))).toBe(tidyHolds(c, pt(0, 0)));
    }
  });
});

describe("either-or rule — brief section 4.1 and 4.6", () => {
  it("1. 60 and 45: 3x + 4y ≤ 180, intercepts on the axes", () => {
    const c = eitherOr({ caps: [F(60), F(45)] });
    expect(show(c)).toEqual([[3, 4], "≤", 180]);
    expect(intercept(c, 0)).toEqual(F(60));
    expect(intercept(c, 1)).toEqual(F(45));
  });
  it("2. 30 and 50 (the book's): 5x + 3y ≤ 150", () => {
    expect(show(eitherOr({ caps: [F(30), F(50)] }))).toEqual([[5, 3], "≤", 150]);
  });
  it("3. rate and time: 60 an hour or 45 an hour, 8 hours: 3x + 4y ≤ 1440, intercepts (480, 0) and (0, 360)", () => {
    const c = eitherOr({ caps: [F(60), F(45)], amount: F(8) });
    expect(show(c)).toEqual([[3, 4], "≤", 1440]);
    expect(intercept(c, 0)).toEqual(F(480));
    expect(intercept(c, 1)).toEqual(F(360));
  });
  it("3b. time per item: each A takes 1 minute, each B 4/3 minutes, 480 minutes: the same line", () => {
    expect(show(linear([F(1), F(4, 3)], "≤", F(480)))).toEqual([[3, 4], "≤", 1440]);
  });
  it("4. three products 60, 45, 36: 3x + 4y + 5z ≤ 180", () => {
    expect(show(eitherOr({ caps: [F(60), F(45), F(36)] }))).toEqual([[3, 4, 5], "≤", 180]);
  });
  it("4b. four products: lcm of 60, 45, 36, 90 is 180", () => {
    expect(show(eitherOr({ caps: [F(60), F(45), F(36), F(90)] }))).toEqual([[3, 4, 5, 2], "≤", 180]);
  });
  it("5. requirement: x/60 + y/45 ≥ 1 is 3x + 4y ≥ 180", () => {
    expect(show(eitherOr({ caps: [F(60), F(45)], op: "≥" }))).toEqual([[3, 4], "≥", 180]);
  });
  it("the slips are different constraints: swapped coefficients put the x-intercept at 45, not 60", () => {
    const wrong = linear([F(4), F(3)], "≤", F(180));
    expect(intercept(wrong, 0)).toEqual(F(45));
    expect(eitherOr({ caps: [F(60), F(45)] }).holds(pt(60, 0))).toBe(true);
    expect(eitherOr({ caps: [F(60), F(45)] }).holds(pt(60, 45))).toBe(false); // "and", not "or"
    expect(eitherOr({ caps: [F(60), F(45)] }).holds(pt(105, 0))).toBe(false); // adding the capacities
  });
});

describe("a model", () => {
  it("feasible is by meaning; objective adds the constant", () => {
    const m: Model = {
      vars: ([{ sym: "x", noun: "loaves", integer: true }, { sym: "y", noun: "cakes", integer: true }] as Var[]),
      sense: "max", obj: [F(2), F(3)], objConst: F(-5),
      constraints: [eitherOr({ caps: [F(60), F(45)] }), linear([F(1), F(0)], "≤", F(40), "bound")],
    };
    expect(feasible(m, pt(30, 22))).toBe(true); // 30/60 + 22/45 < 1
    expect(feasible(m, pt(45, 0))).toBe(false); // over the bound
    expect(objective(m, pt(10, 10))).toEqual(F(45));
  });
});

// ── Random draws: the tidy form and `holds` agree everywhere ─────────────────
const SIZE: Record<number, number> = { 2: 30, 3: 12, 4: 8 };
const MULTIPLES: Fr[] = [F(2), F(3), F(4), F(3, 2), F(5, 2), F(1, 2), F(1, 3), F(1), ...[10, 20, 25, 30, 40, 50, 60, 75, 80].map((p) => F(p, 100)), F(6, 5), F(4, 5), F(5, 4), F(3, 4)];
const caps = [6, 8, 9, 10, 12, 15, 20, 24, 30, 36, 45, 50, 60, 75, 90];

/** every lattice point 0..max in n variables, with the boundary points counted */
function agreement(c: Constraint, n: number): { points: number; boundary: number } {
  const max = SIZE[n];
  const p = new Array<Fr>(n);
  let points = 0, boundary = 0;
  const walk = (i: number): void => {
    if (i === n) {
      points++;
      const t = tidyHolds(c, p), h = c.holds(p);
      if (t !== h) throw new Error(`holds disagrees with the tidy form: ${JSON.stringify(c.coeffs)} ${c.op} ${JSON.stringify(c.rhs)} at ${JSON.stringify(p)} (holds ${h}, tidy ${t}) source "${c.source}"`);
      // boundary: the tidy left side equals the right side
      if (c.coeffs.reduce((s, f, k) => s + f[0] * p[k][0], 0) === c.rhs[0] && c.rhs[1] === 1) boundary++;
      return;
    }
    for (let v = 0; v <= max; v++) { p[i] = fr(v); walk(i + 1); }
  };
  walk(0);
  return { points, boundary };
}

function expectTidy(c: Constraint, needCoeffGcd1 = true): void {
  expect(c.coeffs.every((f) => f[1] === 1)).toBe(true);
  expect(isTidy(c)).toBe(true);
  expect(c.coeffs.find((f) => f[0] !== 0)![0]).toBeGreaterThan(0);
  if (needCoeffGcd1) expect(c.coeffs.reduce((g, f) => gcdInt(g, f[0]), 0)).toBe(1);
  expect(c.rhs[1]).toBe(1);
}

describe("random draws (seeded)", () => {
  const DRAWS: Record<number, number> = { 2: 400, 3: 150, 4: 60 }; // per family: each draw is checked at up to 31² / 13³ / 9⁴ lattice points
  for (const n of [2, 3, 4]) {
    it(`${n} variables: tidy form, gcd, leading coefficient, and holds at every lattice point`, () => {
      const rnd = mulberry32(7000 + n);
      const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
      const pick = <T,>(xs: readonly T[]): T => xs[int(0, xs.length - 1)];
      const subset = (): number[] => {
        const s = Array.from({ length: n }, (_, i) => i).filter(() => rnd() < 0.5);
        return s.length ? s : [int(0, n - 1)];
      };
      let draws = 0, boundary = 0, strictBoundary = 0, flipped = 0;
      const check = (c: Constraint, coeffGcd1 = true) => {
        expectTidy(c, coeffGcd1);
        const r = agreement(c, n);
        boundary += r.boundary;
        if (isStrict(c.op)) strictBoundary += r.boundary;
        draws++;
      };
      for (let d = 0; d < DRAWS[n]; d++) {
        const op = pick(OPS);
        // relationship: A and B any non-empty groups, B may be the total
        const a = subset(), b = rnd() < 0.3 ? Array.from({ length: n }, (_, i) => i) : subset();
        const m = pick(MULTIPLES);
        const rel = relationship({ n, a, b, m, op, source: `rel ${a}|${b}|${m}` });
        if (rel.coeffs.some((f) => f[0] !== 0)) check(rel);
        // percent of the total, written as a percentage
        check(percentOf({ n, a: [int(0, n - 1)], b: Array.from({ length: n }, (_, i) => i), p: fr(pick([10, 20, 25, 30, 40, 50, 60, 75, 80])), op }));
        // blend: contents multiples of 1/20, share a multiple of 1/100
        const contents = Array.from({ length: n }, () => fr(int(0, 20), 20));
        const share = fr(int(1, 99), 100);
        const bl = blend({ contents, share, op });
        if (bl.coeffs.some((f) => f[0] !== 0)) { check(bl); if (bl.op !== op) flipped++; }
        // either-or: caps, amount of the resource, any operator
        const cp = Array.from({ length: n }, () => fr(pick(caps)));
        check(eitherOr({ caps: cp, amount: pick([F(1), F(2), F(8), F(12)]), op }));
        // a resource use with the awkward scalings: original numbers (c·G·k) with coprime c, and the right-hand side scaled the same
        const cs = Array.from({ length: n }, () => int(1, 20));
        const g0 = cs.reduce((h, v) => gcdInt(h, v), 0);
        const co = cs.map((v) => v / g0);
        const G = pick([1, 2, 3, 5]), k = pick([F(1), F(1, 2), F(1, 5), F(1, 10), F(1, 4)]);
        const N = int(5, 300);
        const res = linear(co.map((v) => fr(v * G * k[0], k[1])), op, fr(N * G * k[0], k[1]));
        check(res);
        expect(res.coeffs).toEqual(co.map((v) => F(v)));
        expect(res.rhs).toEqual(F(N));
      }
      // the draws must actually reach boundary points, strict ones among them (where holds is false and the tidy inequality agrees)
      expect(draws).toBeGreaterThan(DRAWS[n]);
      expect(boundary).toBeGreaterThan(0);
      expect(strictBoundary).toBeGreaterThan(0);
      expect(flipped).toBeGreaterThan(0); // some draws exercised the negation and flip
    }, 120_000);
  }

  it("strict operators at a boundary point: false for < and >, true for ≤ and ≥ and =", () => {
    for (const op of OPS) {
      const c = eitherOr({ caps: [F(60), F(45)], op });
      expect(c.holds(pt(60, 0))).toBe(op === "≤" || op === "≥" || op === "=");
      expect(tidyHolds(c, pt(60, 0))).toBe(c.holds(pt(60, 0)));
    }
    expect(opHolds(F(1), "<", F(1))).toBe(false);
  });
});
