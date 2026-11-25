import { describe, it, expect } from "vitest";
import { buildTrigQuestion, ex, exactValues, decimalValues, RANGES, kNumber, type TrigSpec } from "../tools/Algebra/trigEquations";
import katex from "katex";
import { withSeededRandom } from "./seededRandom";

const S = (o: Partial<TrigSpec> & Pick<TrigSpec, "fn">): TrigSpec => ({ unit: "deg", form: "direct", a: 1, b: 0, kArg: 1, cDeg: 0, range: "r360", ...o });
const edge = (q: { solutions: number[] }, unit: string, lo: number, hi: number) => q.solutions.some((t) => { const d = unit === "rad" ? (t * 180) / Math.PI : t; return Math.abs(d - lo) < 1e-6 || Math.abs(d - hi) < 1e-6; });
const deg = (x: number, unit: string) => (unit === "rad" ? (x * 180) / Math.PI : x);
const sol = (s: TrigSpec) => buildTrigQuestion(s)!.solutions.map((x) => Math.round(deg(x, s.unit) * 1000) / 1000);

describe("Solving trig equations: the acceptance set", () => {
  it("Level 1", () => {
    expect(sol(S({ fn: "cos", kEx: ex(1, 2) }))).toEqual([60, 300]);
    expect(sol(S({ fn: "sin", kEx: ex(-1, 2, 3), range: "r720" }))).toEqual([240, 300, 600, 660]);
    expect(sol(S({ fn: "tan", kEx: ex(1, 1) }))).toEqual([45, 225]);
    expect(sol(S({ fn: "tan", kEx: ex(-1, 3, 3), range: "rSym180" }))).toEqual([-30, 150]);
    expect(sol(S({ fn: "cos", kEx: ex(-1, 2, 2), unit: "rad" }))).toEqual([135, 225]);
    expect(sol(S({ fn: "sin", kEx: ex(1, 2), unit: "rad", range: "r720" }))).toEqual([30, 150, 390, 510]);
  });
  it("rearranged forms", () => {
    const shifted = buildTrigQuestion(S({ fn: "sin", kEx: ex(-1, 2), form: "shifted", a: 2, b: 2 }))!;
    expect(shifted.displayLatex).toContain("2\\sin\\theta + 2 = 1");
    expect(shifted.solutions).toEqual([210, 330].map((d) => expect.closeTo(d, 6)));
    const negative = buildTrigQuestion(S({ fn: "sin", kEx: ex(-1, 2), form: "negative", a: 2, b: 1 }))!;
    expect(negative.displayLatex).toContain("1 - 2\\sin\\theta = 2");
    expect(negative.solutions.map((x) => Math.round(x))).toEqual([210, 330]);
  });
  it("Level 2", () => {
    expect(sol(S({ fn: "cos", kEx: ex(1, 2), kArg: 2 }))).toEqual([30, 150, 210, 330]);
    expect(sol(S({ fn: "sin", kEx: ex(1, 2, 3), kArg: 3 }))).toEqual([20, 40, 140, 160, 260, 280]);
    expect(sol(S({ fn: "tan", kEx: ex(-1, 1, 3), kArg: 2 }))).toEqual([60, 150, 240, 330]);
    expect(sol(S({ fn: "sin", kEx: ex(-1, 2), kArg: 2, unit: "rad" }))).toEqual([105, 165, 285, 345]);
  });
  it("Level 3", () => {
    expect(sol(S({ fn: "cos", kEx: ex(1, 2), kArg: 2, cDeg: -40 }))).toEqual([50, 170, 230, 350]);
    expect(sol(S({ fn: "sin", kEx: ex(-1, 2), kArg: 2, cDeg: 30 }))).toEqual([90, 150, 270, 330]);
    expect(sol(S({ fn: "tan", kEx: ex(1, 1), kArg: 2, cDeg: -25 }))).toEqual([35, 125, 215, 305]);
    expect(sol(S({ fn: "cos", kEx: ex(-1, 2), kArg: 2, cDeg: -30, unit: "rad" }))).toEqual([75, 135, 255, 315]);
    expect(buildTrigQuestion(S({ fn: "cos", kEx: ex(1, 2), kArg: 2, cDeg: -40 }))!.answerLatex).toBe("\\theta = 50^\\circ,\\ 170^\\circ,\\ 230^\\circ,\\ 350^\\circ");
  });
  it("decimal values, rounded once at the end", () => {
    const a = (s: TrigSpec) => buildTrigQuestion(s)!.answerLatex;
    expect(a(S({ fn: "sin", kDec: 30 }))).toBe("\\theta = 17.5^\\circ,\\ 162.5^\\circ");
    expect(a(S({ fn: "cos", kDec: -72 }))).toBe("\\theta = 136.1^\\circ,\\ 223.9^\\circ");
    expect(a(S({ fn: "tan", kDec: 250 }))).toBe("\\theta = 68.2^\\circ,\\ 248.2^\\circ");
    expect(a(S({ fn: "tan", kDec: 50, unit: "rad" }))).toBe("\\theta = 0.464,\\ 3.61");
    expect(a(S({ fn: "sin", kDec: 40, kArg: 2 }))).toBe("\\theta = 11.8^\\circ,\\ 78.2^\\circ,\\ 191.8^\\circ,\\ 258.2^\\circ");
    expect(a(S({ fn: "sin", kDec: 60, kArg: 2, unit: "rad" }))).toBe("\\theta = 0.322,\\ 1.25,\\ 3.46,\\ 4.39");
    expect(a(S({ fn: "cos", kDec: 30, kArg: 2, cDeg: -40 }))).toBe("\\theta = 56.3^\\circ,\\ 163.7^\\circ,\\ 236.3^\\circ,\\ 343.7^\\circ");
  });
});

describe("Solving trig equations: every question is correct", () => {
  const F = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
  it("each solution satisfies the equation and lies in range, for random specs", () => {
    withSeededRandom(7, () => {
      const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
      let built = 0;
      const mismatches: string[] = [];
      for (let i = 0; i < 4000; i++) {
        const fn = rnd(["sin", "cos", "tan"] as const);
        const unit = rnd(["deg", "rad"] as const);
        const decimal = Math.random() < 0.3;
        const extremes = Math.random() < 0.2;
        const kArg = rnd([1, 1, 2, 3, 0.5]);
        const cDeg = rnd([0, 0, 15, -15, 30, -30, 45, -45, 60, -60, 5, -25, 40, -40]);
        const s: TrigSpec = { fn, unit, kArg, cDeg: unit === "rad" ? rnd([0, 15, -15, 30, -30, 45, -45, 60, -60]) : cDeg, form: "direct", a: 1, b: 0, range: rnd(Object.keys(RANGES) as (keyof typeof RANGES)[]),
          allowEdge: extremes, ...(decimal ? { kDec: rnd(decimalValues(fn)) } : { kEx: rnd(exactValues(fn, extremes)) }) };
        const q = buildTrigQuestion(s);
        if (!q) continue;
        built++;
        const [lo, hi] = Array.isArray(s.range) ? s.range : RANGES[s.range];
        const k = kNumber(s);
        const c = (s.cDeg * Math.PI) / 180;
        for (const th of q.solutions) {
          const d = unit === "rad" ? (th * 180) / Math.PI : th;
          expect(d).toBeGreaterThanOrEqual(lo - 1e-6);
          expect(d).toBeLessThanOrEqual(hi + 1e-6);
          const thRad = unit === "rad" ? th : (th * Math.PI) / 180;
          expect(F[fn](kArg * thRad + c)).toBeCloseTo(k, 6);
        }
        expect(new Set(q.solutions.map((x) => x.toFixed(6))).size).toBe(q.solutions.length);
        // nothing missed: count the crossings of f(kθ + c) = k on a fine grid (not for tan, whose asymptotes also change sign)
        if (fn !== "tan") {
          let crossings = 0, prev: number | null = null;
          const N = 20000;
          for (let j = 0; j <= N; j++) {
            const thRad = ((lo + ((hi - lo) * j) / N) * Math.PI) / 180;
            const g = F[fn](kArg * thRad + c) - k;
            if (prev !== null && prev * g < 0) crossings++;
            else if (g === 0) crossings++;
            prev = g;
          }
          // tangential touches (k = ±1) give no sign change, so only compare when no extremes are involved
          if (Math.abs(Math.abs(k) - 1) > 1e-9 && !edge(q, unit, lo, hi) && crossings !== q.solutions.length) mismatches.push(`${q.display} → ${q.solutions.length} vs ${crossings}`);
        }
      }
      expect(built).toBeGreaterThan(800);
      expect(mismatches).toEqual([]);
    });
  });
});

describe("Solving trig equations: every string renders", () => {
  it("question, answer, each step and each fragment are valid KaTeX, across every variant", () => {
    withSeededRandom(11, () => {
      const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
      const render = (t: string) => katex.renderToString(t, { throwOnError: true, displayMode: false });
      let built = 0;
      const forms = new Set<string>();
      for (let i = 0; i < 3000; i++) {
        const fn = rnd(["sin", "cos", "tan"] as const);
        const unit = rnd(["deg", "rad"] as const);
        const form = rnd(["direct", "scaled", "shifted", "negative"] as const);
        const decimal = Math.random() < 0.3;
        const kEx = decimal ? undefined : rnd(exactValues(fn, true));
        const kDec = decimal ? rnd(decimalValues(fn)) : undefined;
        const q = kEx ? kEx.q : 1;
        const A = [2, 3, 4, 5, 6].filter((a) => a % q === 0 && (q > 1 || a <= 4));
        const s: TrigSpec = { fn, unit, form, kEx, kDec, a: decimal ? rnd([2, 3, 4]) : rnd(A), b: form === "shifted" ? rnd([-3, -2, -1, 1, 2, 3]) : form === "negative" ? rnd([1, 2, 3, 4, 5]) : 0,
          kArg: rnd([1, 1, 2, 3, 0.5]), cDeg: unit === "rad" ? rnd([0, 15, -15, 30, -30, 45, -45, 60, -60]) : rnd([0, 5, -5, 10, -25, 30, -30, 40, -40, 45, 60]),
          range: rnd(Object.keys(RANGES) as (keyof typeof RANGES)[]), allowEdge: true };
        const b = buildTrigQuestion(s);
        if (!b) continue;
        built++;
        forms.add(`${unit}-${form}-${decimal ? "dec" : "exact"}`);
        render(b.displayLatex); render(b.answerLatex);
        for (const st of b.working) expect(st.label ?? "").not.toMatch(/\\/);   // prose labels never carry LaTeX
        for (const st of b.working) { render(st.latex); for (const f of st.frags ?? []) render(f); }
        expect(b.working.length).toBeGreaterThan(1);
        expect(b.working[b.working.length - 1].latex).toBe(b.answerLatex);   // the closing step states the answer (hideAnswerStep)
      }
      expect(built).toBeGreaterThan(500);
      expect(forms.size).toBe(16);                                             // every unit × form × value-kind was exercised
    });
  });
});

describe("Solving trig equations: range bar ranges", () => {
  it("builds questions over wide and negative ranges, with every solution in range", () => {
    withSeededRandom(5, () => {
      for (const [lo, hi] of [[-720, 1080], [-180, 0], [360, 540], [-720, 1080]] as [number, number][]) {
        let built = 0;
        for (let i = 0; i < 300; i++) {
          const fn = (["sin", "cos", "tan"] as const)[i % 3];
          const q = buildTrigQuestion({ fn, unit: i % 2 ? "rad" : "deg", form: "direct", a: 1, b: 0, kArg: [1, 2, 3, 0.5][i % 4], cDeg: 0, range: [lo, hi], kEx: exactValues(fn, false)[i % 6] });
          if (!q) continue;
          built++;
          for (const th of q.solutions) {
            const d = i % 2 ? (th * 180) / Math.PI : th;
            expect(d).toBeGreaterThanOrEqual(lo - 1e-6);
            expect(d).toBeLessThanOrEqual(hi + 1e-6);
          }
        }
        expect(built).toBeGreaterThan(20);
      }
    });
  });
});
