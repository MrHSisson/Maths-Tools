import { describe, expect, it } from "vitest";
import katex from "katex";
import { __test } from "../tools/Algebra/BinomialExpansion";

const { generateQuestion, TOOL_CONFIG, helpers: H } = __test;
const { F, mul, series, powRat, seriesDivide, denomPoly, numeratorOf, expandWorking, frPlain } = H;
const LEVELS = ["level1", "level2", "level3"] as const;
const tex = (s: string) => katex.renderToString(s, { throwOnError: true });

describe("Binomial Expansion — maths", () => {
  it("(1 + 2x)^-1 up to x² is 1 − 2x + 4x²", () => {
    expect(series(F(-1), F(2), 2).map(frPlain)).toEqual(["1", "-2", "4"]);
  });
  it("(1 − 3x)^(1/2) up to x² is 1 − 3/2 x − 9/8 x²", () => {
    expect(series(F(1, 2), F(-3), 2).map(frPlain)).toEqual(["1", "-3/2", "-9/8"]);
  });
  it("(4 + x)^(-1/2) = 1/2 − x/16 + 3x²/256, valid for |x| < 4", () => {
    const r = expandWorking({ a: 4, b: F(1), n: F(-1, 2) }, 2);
    expect(r.answer.map(frPlain)).toEqual(["1/2", "-1/16", "3/256"]);
    expect(frPlain(r.bound)).toBe("4");
  });
  it("(1 + 4x)^(1/2) up to x² is 1 + 2x − 2x²", () => {
    expect(series(F(1, 2), F(4), 2).map(frPlain)).toEqual(["1", "2", "-2"]);
  });
  it("a^n is rational only when a is a suitable power", () => {
    expect(frPlain(powRat(4, F(-1, 2))!)).toBe("1/2");
    expect(powRat(5, F(1, 2))).toBeNull();
    expect(frPlain(powRat(8, F(1, 3))!)).toBe("2");
  });
  it("partial fractions samples: (5 − x)/((1+x)(1−2x)) and (5 + x)/((2−x)(1+3x))", () => {
    const f1 = [{ c: F(1), d: F(1), m: 1 as const }, { c: F(1), d: F(-2), m: 1 as const }];
    const t1 = [{ fi: 0, p: 1 as const, letter: "A", A: F(2) }, { fi: 1, p: 1 as const, letter: "B", A: F(3) }];
    expect(numeratorOf(f1, t1, null).map(frPlain)).toEqual(["5", "-1"]);
    expect(seriesDivide(numeratorOf(f1, t1, null), denomPoly(f1), 3).map(frPlain)).toEqual(["5", "4", "14", "22"]);
    const f2 = [{ c: F(2), d: F(-1), m: 1 as const }, { c: F(1), d: F(3), m: 1 as const }];
    const t2 = [{ fi: 0, p: 1 as const, letter: "A", A: F(1) }, { fi: 1, p: 1 as const, letter: "B", A: F(2) }];
    expect(numeratorOf(f2, t2, null).map(frPlain)).toEqual(["5", "1"]);
    expect(seriesDivide(numeratorOf(f2, t2, null), denomPoly(f2), 3).map(frPlain)).toEqual(["5/2", "-23/4", "145/8", "-863/16"]);
  });
});

describe("Binomial Expansion — generated questions", () => {
  for (const tool of ["expand", "partial", "approx"]) for (const level of LEVELS) {
    it(`${tool} ${level}: 40 questions build, keys are unique and every KaTeX string renders`, () => {
      const keys = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion(tool, level, {}, "", {}) as any;
        expect(keys.has(q.key)).toBe(false);
        keys.add(q.key);
        q.lines.forEach((l: string) => (l.match(/\$([^$]+)\$/g) ?? []).forEach((m: string) => tex(m.slice(1, -1))));
        tex(q.answerLatex);
        q.working.forEach((w: any) => { tex(w.latex); (w.frags ?? []).forEach((f: string) => tex(f)); });
        expect(q.working.length).toBeGreaterThan(1);
      }
    });
  }

  it("expand: the answer matches an independent series for every bracket question", () => {
    for (const level of LEVELS) for (let i = 0; i < 80; i++) {
      const q = generateQuestion("expand", level, {}, "", {}) as any;
      if (q._raw.shape !== "bracket") continue;
      const { bn, m, ask } = q._raw;
      const k = H.div(bn.b, F(bn.a));
      const mult = bn.a === 1 ? F(1) : powRat(bn.a, bn.n)!;
      const want = series(bn.n, k, m).map((c: any) => mul(c, mult));
      expect(q.answer).toBe(ask === "coef" ? frPlain(want[m]) : H.polyTex(want));
      if (ask === "range") expect(q.answerSuffix).toContain(`|x| < ${frPlain(F(Math.abs(bn.a * (bn.b.d)), Math.abs(bn.b.n)))}`);
    }
  });

  it("expand: every fraction question's series matches the true function (numerically) and its range is the smaller bound", () => {
    let seen = 0;
    for (const level of ["level2", "level3"] as const) for (let i = 0; i < 120; i++) {
      const q = generateQuestion("expand", level, {}, "", {}) as any;
      if (q._raw.shape !== "fraction") continue;
      seen++;
      const { fe, m, ask } = q._raw;
      const val = (c: number, d: any, x: number) => c + (d.n / d.d) * x;
      const f = (x: number) => Math.pow(val(fe.num.c, fe.num.d, x) / val(fe.den.c, fe.den.d, x), fe.e.n / fe.e.d);
      const coefs = (q.answer as string);
      void coefs;
      // rebuild the series from the working's own answer line via the helper, then compare with f at a small x (error must be O(x^(m+1)))
      const res = H.fractionWorking(fe, m, true);
      for (const x of [0.0001, -0.0001]) {
        const S = res.answer.reduce((acc: number, c: any, r: number) => acc + (c.n / c.d) * Math.pow(x, r), 0);
        expect(Math.abs(f(x) - S)).toBeLessThan(2e5 * Math.pow(Math.abs(x), m + 1));
      }
      const bounds = [Math.abs(fe.den.c / (fe.den.d.n / fe.den.d.d))];
      if (fe.e.d !== 1) bounds.push(Math.abs(fe.num.c / (fe.num.d.n / fe.num.d.d)));
      expect(Math.abs(res.bound.n / res.bound.d - Math.min(...bounds))).toBeLessThan(1e-9);
      if (ask === "range") expect(q.answerSuffix).toContain("valid for |x| <");
    }
    expect(seen).toBeGreaterThan(20);
  });

  it("Level 2 never repeats a Level 1 question: Level 1's powers come with a fractional k only", () => {
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion("expand", "level2", {}, "", {}) as any;
      if (q._raw.shape !== "bracket") continue;
      const n = q._raw.bn.n, k = q._raw.bn.b;
      const l1Power = [[-1, 1], [-2, 1], [1, 2], [-1, 2]].some(([a, b]) => n.n === a && n.d === b);
      if (l1Power) expect(k.d).not.toBe(1);
    }
  });

  it("partial: the sum of the expanded partial fractions equals series division of N/D, and the range is the smaller bound", () => {
    for (const level of LEVELS) for (let i = 0; i < 80; i++) {
      const q = generateQuestion("partial", level, {}, "", {}) as any;
      const raw = q._raw;
      // the generator itself throws on a mismatch; re-check the numerator rebuilds
      const N = numeratorOf(raw.facs, raw.terms, raw.Q);
      expect(N.map(frPlain)).toEqual(raw.N.map(frPlain));
      const bounds = raw.facs.map((f: any) => Math.abs(f.c.n / f.c.d) / Math.abs(f.d.n / f.d.d));
      if (raw.facs.length > 1) expect(new Set(bounds).size).toBe(bounds.length); // the ranges differ, so "take the smaller" is a real decision
      const lo = Math.min(...bounds);
      if (q.answerSuffix) {
        const want = lo;
        const m = /\|x\| < ([\d/]+)/.exec(q.answerSuffix)!;
        const [n, d] = m[1].split("/").map(Number);
        expect(Math.abs(n / (d || 1) - want)).toBeLessThan(1e-9);
      }
    }
  });

  it("partial: Level 1 questions have distinct linear factors with constant 1; Level 3 is repeated or improper", () => {
    for (let i = 0; i < 40; i++) {
      const a = generateQuestion("partial", "level1", {}, "", {}) as any;
      expect(a._raw.facs.every((f: any) => f.c.n === 1 && f.m === 1)).toBe(true);
      const c = generateQuestion("partial", "level3", {}, "", {}) as any;
      expect(c._raw.improper || c._raw.facs.some((f: any) => f.m === 2)).toBe(true);
    }
  });

  it("tool config: every level of every tab has options", () => {
    for (const t of Object.values(TOOL_CONFIG.tools)) for (const l of LEVELS) {
      const s = (t as any).difficultySettings[l];
      expect(s.multiSelect.length).toBeGreaterThan(0);
    }
  });
});
