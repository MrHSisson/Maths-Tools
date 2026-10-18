import { describe, expect, it } from "vitest";
import katex from "katex";
import { __test } from "../tools/Algebra/BinomialExpansion";
import { F, frPlain } from "../shared/binomial";

const { generateQuestion, helpers: H } = __test;
const { numeratorOf, denomPoly, seriesDivide } = H;
const LEVELS = ["level1", "level2", "level3"] as const;
const tex = (s: string) => katex.renderToString(s, { throwOnError: true });

describe("Binomial Expansion with Partial Fractions — maths", () => {
  it("partial fractions samples: (5 − x)/((1+x)(1−2x)) and (5 + x)/((2−x)(1+3x))", () => {
    const f1 = [{ c: F(1), d: F(1), m: 1 as const }, { c: F(1), d: F(-2), m: 1 as const }];
    const t1 = [{ fi: 0, p: 1 as const, letter: "A", A: F(2) }, { fi: 1, p: 1 as const, letter: "B", A: F(3) }];
    expect(numeratorOf(f1, t1, null).map(frPlain)).toEqual(["5", "−1"]);
    expect(seriesDivide(numeratorOf(f1, t1, null), denomPoly(f1), 3).map(frPlain)).toEqual(["5", "4", "14", "22"]);
    const f2 = [{ c: F(2), d: F(-1), m: 1 as const }, { c: F(1), d: F(3), m: 1 as const }];
    const t2 = [{ fi: 0, p: 1 as const, letter: "A", A: F(1) }, { fi: 1, p: 1 as const, letter: "B", A: F(2) }];
    expect(numeratorOf(f2, t2, null).map(frPlain)).toEqual(["5", "1"]);
    expect(seriesDivide(numeratorOf(f2, t2, null), denomPoly(f2), 3).map(frPlain)).toEqual(["5/2", "−23/4", "145/8", "−863/16"]);
  });
});

describe("Binomial Expansion with Partial Fractions — generated questions", () => {
  for (const level of LEVELS) {
    it(`${level}: 40 questions build, keys are unique and every KaTeX string renders`, () => {
      const keys = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion("partial", level, {}, "", {}) as any;
        expect(keys.has(q.key)).toBe(false);
        keys.add(q.key);
        q.lines.forEach((l: string) => (l.match(/\$([^$]+)\$/g) ?? []).forEach((m: string) => tex(m.slice(1, -1))));
        tex(q.answerLatex);
        q.working.forEach((w: any) => { tex(w.latex); (w.frags ?? []).forEach((f: string) => tex(f)); });
      }
    });
  }

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


  it("a repeated factor's single constant is found by letting x = 0 (an A + B + C = … equation)", () => {
    let seen = 0;
    for (let i = 0; i < 80; i++) {
      const q = generateQuestion("partial", "level3", {}, "", { repeated: true, improper: false } as any) as any;
      if (!q._raw.facs.some((f: any) => f.m === 2)) continue;
      seen++;
      expect(q.working.some((w: any) => w.label === "x = 0:")).toBe(true);
    }
    expect(seen).toBeGreaterThan(5);
  });
});
