import { describe, expect, it } from "vitest";
import katex from "katex";
import { __test } from "../tools/Algebra/BinomialExpansion";

const { generateQuestion, helpers: H } = __test;
const LEVELS = ["level1", "level2", "level3"] as const;
const tex = (s: string) => katex.renderToString(s, { throwOnError: true });

describe("Binomial Expansion of Fractions", () => {
  for (const tool of ["one", "power"]) for (const level of LEVELS) {
    it(`${tool} ${level}: 40 questions build, keys are unique and every KaTeX string renders`, () => {
      const keys = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion(tool, level, {}, "", {}) as any;
        expect(keys.has(q.key)).toBe(false);
        keys.add(q.key);
        q.lines.forEach((l: string) => (l.match(/\$([^$]+)\$/g) ?? []).forEach((m: string) => tex(m.slice(1, -1))));
        tex(q.answerLatex);
        q.working.forEach((w: any) => { tex(w.latex); (w.frags ?? []).forEach((f: string) => tex(f)); });
      }
    });
  }

  it("every question's series matches the true function numerically, and its range is the smaller bound", () => {
    for (const tool of ["one", "power"]) for (const level of LEVELS) for (let i = 0; i < 60; i++) {
      const q = generateQuestion(tool, level, {}, "", {}) as any;
      const { fe, m, ask } = q._raw;
      const val = (c: number, d: any, x: number) => c + (d.n / d.d) * x;
      const f = (x: number) => Math.pow(val(fe.num.c, fe.num.d, x), fe.num.n.n / fe.num.n.d) * Math.pow(val(fe.den.c, fe.den.d, x), fe.den.n.n / fe.den.n.d);
      const res = H.fractionWorking(fe, m, true);
      // the truncation error must be the NEXT coefficient times x^(m+1): a wrong coefficient up to x^m would show as a far bigger error
      const next = H.fractionWorking(fe, m + 1, true).answer[m + 1];
      for (const x of [0.0001, -0.0001]) {
        const S = res.answer.reduce((acc: number, c: any, r: number) => acc + (c.n / c.d) * Math.pow(x, r), 0);
        const expected = Math.abs((next.n / next.d) * Math.pow(x, m + 1));
        expect(Math.abs(Math.abs(f(x) - S) - expected)).toBeLessThanOrEqual(0.2 * expected + 1e-13);
      }
      // only a bracket that is not a positive whole power restricts x
      const bounds: number[] = [];
      if (!(fe.num.n.d === 1 && fe.num.n.n >= 0)) bounds.push(Math.abs(fe.num.c / (fe.num.d.n / fe.num.d.d)));
      if (!(fe.den.n.d === 1 && fe.den.n.n >= 0)) bounds.push(Math.abs(fe.den.c / (fe.den.d.n / fe.den.d.d)));
      expect(Math.abs(res.bound.n / res.bound.d - Math.min(...bounds))).toBeLessThan(1e-9);
      if (ask === "range") expect(q.answerSuffix).toContain("valid for |x| <");
    }
  });

  it("the level is the denominator bracket: 1 ± x, then 1 + kx (|k| ≥ 2), then a + bx (a ≥ 2)", () => {
    for (const tool of ["one", "power"]) for (let i = 0; i < 60; i++) {
      const d1 = (generateQuestion(tool, "level1", {}, "", {}) as any)._raw.fe.den;
      expect([d1.c, Math.abs(d1.d.n)]).toEqual([1, 1]);
      const d2 = (generateQuestion(tool, "level2", {}, "", {}) as any)._raw.fe.den;
      expect(d2.c).toBe(1);
      expect(Math.abs(d2.d.n)).toBeGreaterThanOrEqual(2);
      expect((generateQuestion(tool, "level3", {}, "", {}) as any)._raw.fe.den.c).toBeGreaterThanOrEqual(2);
    }
  });

  it("Whole and Roots are on by default (2, 3, ½, ⅓); Extended is opt-in on every level of Power of a fraction", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) { const q = (generateQuestion("power", "level2", {}, "", {}) as any)._raw.fe.num.n; seen.add(`${q.n}/${q.d}`); }
    expect([...seen].sort()).toEqual(["1/2", "1/3", "2/1", "3/1"].sort());
  });

  it("for a root the numerator follows the same ladder as the denominator (1 ± x, 1 + kx, a + bx with a a perfect power); only whole-number powers take any px + q", () => {
    for (let i = 0; i < 200; i++) {
      for (const level of LEVELS) {
        const fe = (generateQuestion("power", level, {}, "", { whole: false, roots: true, extended: true } as any) as any)._raw.fe;
        if (fe.num.n.d === 1) continue;
        if (level === "level1") expect([fe.num.c, Math.abs(fe.num.d.n)]).toEqual([1, 1]);
        if (level === "level2") expect(fe.num.c).toBe(1);
        const perfect = [1, 2 ** fe.num.n.d, 3 ** fe.num.n.d];
        expect(perfect).toContain(fe.num.c);
      }
    }
  });

  it("One bracket below takes roots in the denominator: any px + q on top, a perfect-power constant below, and the expansion matches the function", () => {
    const only = (k: string) => Object.fromEntries(["whole", "roots", "extended"].map((o) => [o, o === k])) as any;
    for (const k of ["roots", "extended"]) {
      for (const level of LEVELS) {
        for (let i = 0; i < 40; i++) {
          const q = generateQuestion("one", level, {}, "", only(k)) as any;
          const { fe, m } = q._raw;
          expect(fe.num.n).toEqual({ n: 1, d: 1 });
          expect(fe.den.n.d).toBeGreaterThan(1);
          if (level === "level3") expect(Math.round(fe.den.c ** (1 / fe.den.n.d)) ** fe.den.n.d).toBe(fe.den.c);
          const toNum = (f: any) => f.n / f.d, x = 0.01, val = (fe.num.c + toNum(fe.num.d) * x) * (fe.den.c + toNum(fe.den.d) * x) ** toNum(fe.den.n);
          const series = H.fractionWorking(fe, m, false).answer.reduce((a: number, c: any, j: number) => a + toNum(c) * x ** j, 0);
          expect(Math.abs(val - series)).toBeLessThan(1e-3);
        }
      }
    }
  });
});
