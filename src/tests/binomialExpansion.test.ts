import { describe, expect, it } from "vitest";
import katex from "katex";
import { __test } from "../tools/Algebra/BinomialExpansion";
import { F, mul, series, powRat, polyTex, frPlain, div } from "../shared/binomial";

const { generateQuestion, TOOL_CONFIG, helpers: H } = __test;
const LEVELS = ["level1", "level2", "level3"] as const;
const tex = (s: string) => katex.renderToString(s, { throwOnError: true });

describe("Binomial Expansion — maths", () => {
  it("(1 + 2x)^-1 up to x² is 1 − 2x + 4x²", () => { expect(series(F(-1), F(2), 2).map(frPlain)).toEqual(["1", "-2", "4"]); });
  it("(1 − 3x)^(1/2) up to x² is 1 − 3/2 x − 9/8 x²", () => { expect(series(F(1, 2), F(-3), 2).map(frPlain)).toEqual(["1", "-3/2", "-9/8"]); });
  it("(4 + x)^(-1/2) = 1/2 − x/16 + 3x²/256, valid for |x| < 4", () => {
    const r = H.expandWorking({ a: 4, b: F(1), n: F(-1, 2) }, 2);
    expect(r.answer.map(frPlain)).toEqual(["1/2", "-1/16", "3/256"]);
    expect(frPlain(r.bound)).toBe("4");
  });
  it("(1 + 4x)^(1/2) up to x² is 1 + 2x − 2x²", () => { expect(series(F(1, 2), F(4), 2).map(frPlain)).toEqual(["1", "2", "-2"]); });
  it("a^n is rational only when a is a suitable power", () => {
    expect(frPlain(powRat(4, F(-1, 2))!)).toBe("1/2");
    expect(powRat(5, F(1, 2))).toBeNull();
    expect(frPlain(powRat(8, F(1, 3))!)).toBe("2");
  });
});

describe("Binomial Expansion — generated questions", () => {
  for (const tool of ["expand", "approx"]) for (const level of LEVELS) {
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

  it("expand: the answer matches an independent series for every question", () => {
    for (const level of LEVELS) for (let i = 0; i < 80; i++) {
      const q = generateQuestion("expand", level, {}, "", {}) as any;
      const { bn, m, ask } = q._raw;
      const k = div(bn.b, F(bn.a));
      const mult = bn.a === 1 ? F(1) : powRat(bn.a, bn.n)!;
      const want = series(bn.n, k, m).map((c: any) => mul(c, mult));
      expect(q.answer).toBe(ask === "coef" ? frPlain(want[m]) : polyTex(want));
      if (ask === "range") expect(q.answerSuffix).toContain(`|x| < ${frPlain(F(Math.abs(bn.a * bn.b.d), Math.abs(bn.b.n)))}`);
    }
  });

  it("Level 2 never repeats a Level 1 question: Level 1's powers come with a fractional k only", () => {
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion("expand", "level2", {}, "", {}) as any;
      const n = q._raw.bn.n, k = q._raw.bn.b;
      if ([[-1, 1], [-2, 1], [1, 2], [-1, 2]].some(([a, b]) => n.n === a && n.d === b)) expect(k.d).not.toBe(1);
    }
  });

  it("tool config: every level of every tab has options", () => {
    for (const t of Object.values(TOOL_CONFIG.tools)) for (const l of LEVELS) expect((t as any).difficultySettings[l].multiSelect.length).toBeGreaterThan(0);
  });
});
