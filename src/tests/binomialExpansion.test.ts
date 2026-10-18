import { describe, expect, it } from "vitest";
import katex from "katex";
import { __test } from "../tools/Algebra/BinomialExpansion";
import { F, mul, series, powRat, polyTex, frPlain, div } from "../shared/binomial";

const { generateQuestion, TOOL_CONFIG, helpers: H } = __test;
const LEVELS = ["level1", "level2", "level3"] as const;
const tex = (s: string) => katex.renderToString(s, { throwOnError: true });

describe("Binomial Expansion — maths", () => {
  it("(1 + 2x)^-1 up to x² is 1 − 2x + 4x²", () => { expect(series(F(-1), F(2), 2).map(frPlain)).toEqual(["1", "−2", "4"]); });
  it("(1 − 3x)^(1/2) up to x² is 1 − 3/2 x − 9/8 x²", () => { expect(series(F(1, 2), F(-3), 2).map(frPlain)).toEqual(["1", "−3/2", "−9/8"]); });
  it("(4 + x)^(-1/2) = 1/2 − x/16 + 3x²/256, valid for |x| < 4", () => {
    const r = H.expandWorking({ a: 4, b: F(1), n: F(-1, 2) }, 2);
    expect(r.answer.map(frPlain)).toEqual(["1/2", "−1/16", "3/256"]);
    expect(frPlain(r.bound)).toBe("4");
  });
  it("(1 + 4x)^(1/2) up to x² is 1 + 2x − 2x²", () => { expect(series(F(1, 2), F(4), 2).map(frPlain)).toEqual(["1", "2", "−2"]); });
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

  it("the level is the bracket: Level 1 is (1 ± x), Level 2 (1 + kx) with k ≠ ±1, whole or fractional as ticked", () => {
    for (let i = 0; i < 200; i++) {
      const k1 = (generateQuestion("expand", "level1", {}, "", {}) as any)._raw.bn;
      expect([k1.a, Math.abs(k1.b.n), k1.b.d]).toEqual([1, 1, 1]);
      const wholeK = (generateQuestion("expand", "level2", {}, "", { kWhole: true, kFrac: false } as any) as any)._raw.bn.b;
      expect(wholeK.d).toBe(1); expect(Math.abs(wholeK.n)).toBeGreaterThanOrEqual(2);
      expect((generateQuestion("expand", "level2", {}, "", { kWhole: false, kFrac: true } as any) as any)._raw.bn.b.d).toBeGreaterThan(1);
    }
  });

  it("tool config: every level of every tab has options", () => {
    for (const [k, t] of Object.entries(TOOL_CONFIG.tools)) for (const l of LEVELS) if (k !== "approx" || l === "level3") expect((t as any).difficultySettings[l].multiSelect.length).toBeGreaterThan(0);
  });

  it("power n is a sign selector and a size selector: negatives of every fraction appear, and each tick narrows the powers", () => {
    const seen = (level: "level1" | "level2" | "level3", ms: Record<string, boolean>) => {
      const out = new Set<string>();
      for (let i = 0; i < 300; i++) { const n = (generateQuestion("expand", level, {}, "", ms) as any)._raw.bn.n; out.add(`${n.n}/${n.d}`); }
      return out;
    };
    const ext = seen("level2", { positive: true, negative: true, whole: false, standard: false, extended: true });
    expect([...ext].sort()).toEqual(["-1/4", "-2/5", "-3/4", "-3/5", "-4/5", "-1/5", "1/4", "1/5", "2/5", "3/4", "3/5", "4/5"].sort());
    for (const v of seen("level2", { positive: false, negative: true, whole: true, standard: false, extended: false })) expect(v).toMatch(/^-\d\/1$/);
    for (const v of seen("level3", { positive: true, negative: false, whole: false, standard: true, extended: true })) expect(Number(v.split("/")[0])).toBeGreaterThan(0);
  });

  it("Approximation can ask the student to work out x: the matching step is present and the answer names x", () => {
    for (const level of LEVELS) for (let i = 0; i < 30; i++) {
      const q = generateQuestion("approx", level, {}, "", { use: false, findx: true, valid: false }) as any;
      expect(q.working.some((w: any) => /Match the bracket/.test(w.label ?? ""))).toBe(true);
      expect(q.answerSuffix).toMatch(/x = /);
    }
  });

  it("Range of validity: the answer is the smallest bracket bound, and Levels 2 and 3 always have distinct bounds to overlap", () => {
    for (const level of LEVELS) for (let i = 0; i < 100; i++) {
      const q = generateQuestion("range", level, {}, "", {}) as any;
      const brs = q._raw.brs as { c: number; d: number }[];
      const bounds = brs.map((b) => Math.abs(b.c / b.d));
      expect(q._raw.smallest.n / q._raw.smallest.d).toBeCloseTo(Math.min(...bounds), 10);
      if (level !== "level1") expect(new Set(bounds.map((b) => b.toFixed(9))).size).toBe(bounds.length);
      expect(brs.length).toBe(level === "level1" ? 1 : level === "level2" ? 2 : brs.length);
    }
  });

  it("working never shows a leading 1(…), '|x| < 1 ⇒ |x| < 1', or a 'take the smaller' of equal bounds", () => {
    for (const t of ["expand", "one", "power", "partial", "range", "approx"]) for (const level of LEVELS) for (let i = 0; i < 60; i++) {
      const q = generateQuestion(t, level, {}, "", {}) as any;
      const text = q.working.map((w: any) => `${w.label ?? ""}|${w.latex}`).join("\n");
      expect(text).not.toMatch(/= 1\\left\(1 /);
      expect(text).not.toMatch(/\\left\|x\\right\| < 1 \\Rightarrow/);
      for (const w of q.working) if (/take the smaller/.test(w.label ?? "")) {
        const rows = w.extra?.rows as { c: number }[];
        expect(new Set(rows.map((r) => r.c.toFixed(9))).size).toBe(rows.length);
      }
    }
  });
});
