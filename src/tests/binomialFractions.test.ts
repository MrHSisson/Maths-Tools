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

  it("Level 1 'one bracket below' has denominator 1 + kx; Level 3 has the denominator squared or cubed", () => {
    for (let i = 0; i < 40; i++) {
      expect((generateQuestion("one", "level1", {}, "", {}) as any)._raw.fe.den.c).toBe(1);
      const m = -(generateQuestion("one", "level3", {}, "", {}) as any)._raw.fe.den.n.n;
      expect([2, 3]).toContain(m);
    }
  });
});
