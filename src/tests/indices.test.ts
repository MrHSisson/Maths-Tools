// Indices — generator invariants. The smoke suite (generators.test.ts) already checks every KaTeX string
// renders; these parse what each generator *displays* and check the answer it gives.
import { describe, it, expect } from "vitest";
import type { AnyQuestion } from "../shared";
import { __test } from "../tools/Number/Indices";

const { generateQuestion, TOOL_CONFIG } = __test;
const SAMPLES = 150;
const LEVELS = ["level1", "level2", "level3"] as const;

// Every option the tool offers on a sub-tool, at a level, switched on.
const allOn = (tool: string, level: (typeof LEVELS)[number]) => {
  const t = TOOL_CONFIG.tools[tool];
  const raw = t.difficultySettings?.[level]?.multiSelect ?? t.multiSelect;
  const groups = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const ms: Record<string, boolean> = {};
  groups.forEach(g => g.options.forEach(o => { ms[o.value] = true; }));
  return ms;
};
const gen = (tool: string, level: (typeof LEVELS)[number], ms = allOn(tool, level)) =>
  Array.from({ length: SAMPLES }, () => generateQuestion(tool, level, {}, "", ms) as AnyQuestion & { displayLatex?: string; answerLatex: string; answer: string; kind: string; lines?: string[] });

describe("Indices generators", () => {
  it("never produce an empty, NaN or undefined answer", () => {
    for (const tool of Object.keys(TOOL_CONFIG.tools)) for (const lv of LEVELS) for (const q of gen(tool, lv)) {
      expect(q.answerLatex, `${tool} ${lv}`).toBeTruthy();
      expect(`${q.answer} ${q.answerLatex}`, `${tool} ${lv}`).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it("Powers & Roots: a power 'b^{e}' is b multiplied e times, and its answer is that value", () => {
    for (const lv of LEVELS) for (const q of gen("powersRoots", lv, { power: true, root: false, notation: false, combined: false, negatives: false, calculator: false })) {
      const m = /^(\d+)\^\{(\d+)\}$/.exec(q.displayLatex ?? "");
      if (!m) continue;
      expect(Number(q.answer), `${lv} ${q.displayLatex}`).toBe(Number(m[1]) ** Number(m[2]));
    }
  });

  it("Powers & Roots: a root '\\sqrt{n^2}' has answer n", () => {
    for (const lv of ["level1", "level2"] as const) for (const q of gen("powersRoots", lv, { root: true, power: false, notation: false, combined: false, negatives: false, calculator: false })) {
      const m = /^\\sqrt\{(\d+)\}$/.exec(q.displayLatex ?? "");
      if (!m) continue;
      expect(Number(q.answer) ** 2, `${lv} ${q.displayLatex}`).toBe(Number(m[1]));
    }
  });

  it("Index Laws: 'b^{m} × b^{n}' has answer b^{m+n} (numbers and letters)", () => {
    const multiplyOnly = { multiply: true, divide: false, powerOfPower: false, numeric: true, algebraic: true, combined: false, missingIndex: false, coefficients: false };
    for (const lv of ["level1"] as const) for (const q of gen("indexLaws", lv, multiplyOnly)) {
      const m = /^([0-9a-z])\^\{(\d+)\} \\times \1\^\{(\d+)\}$/.exec(q.displayLatex ?? "");
      if (!m) continue;
      expect(q.answerLatex, q.displayLatex).toBe(`${m[1]}^{${Number(m[2]) + Number(m[3])}}`);
    }
  });

  it("Index Laws: 'b^{m} ÷ b^{n}' has answer b^{m−n}, with m − n at least 2", () => {
    const divideOnly = { multiply: false, divide: true, powerOfPower: false, numeric: true, algebraic: true, combined: false, missingIndex: false, coefficients: false };
    for (const q of gen("indexLaws", "level1", divideOnly)) {
      const m = /^([0-9a-z])\^\{(\d+)\} \\div \1\^\{(\d+)\}$/.exec(q.displayLatex ?? "");
      if (!m) continue;
      const diff = Number(m[2]) - Number(m[3]);
      expect(diff).toBeGreaterThanOrEqual(2);
      expect(q.answerLatex).toBe(`${m[1]}^{${diff}}`);
    }
  });

  it("Negative & Fractional: '2^{-n}'-style powers have answer 1/a^n", () => {
    for (const q of gen("specialPowers", "level1", { zero: false, negative: true, unitFraction: false })) {
      const m = /^(\d+)\^\{-(\d)\}$/.exec(q.displayLatex ?? "");
      if (!m) continue;
      expect(q.answerLatex).toBe(`\\dfrac{1}{${Number(m[1]) ** Number(m[2])}}`);
    }
  });

  it("Common Base: 'solve' answers are whole numbers or simple fractions in lowest terms", () => {
    for (const q of gen("commonBase", "level3", { solveIndex: true, evaluate: false, interms: false, writeAsPower: false, two: true, three: true, five: false, ten: false })) {
      const m = /x = \\dfrac\{(\d+)\}\{(\d+)\}$/.exec(q.answerLatex);
      if (m) {
        const a = Number(m[1]), b = Number(m[2]);
        let x = a, y = b; while (y) [x, y] = [y, x % y];
        expect(x, q.answerLatex).toBe(1);
      }
    }
  });
});
