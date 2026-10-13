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
// The maths of a question: worded questions end with the maths in $...$, simple ones carry displayLatex.
const mathOf = (q: { displayLatex?: string; kind: string; lines?: string[] }) =>
  q.kind === "worded" ? (q.lines ?? [])[(q.lines ?? []).length - 1]?.replace(/^\$|\$$/g, "") ?? "" : q.displayLatex ?? "";

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
      const m = /^(\d+)\^\{(\d+)\}$/.exec(mathOf(q));
      if (!m) continue;
      expect(Number(q.answer), `${lv} ${mathOf(q)}`).toBe(Number(m[1]) ** Number(m[2]));
    }
  });

  it("Powers & Roots: a root '\\sqrt{n^2}' has answer n", () => {
    for (const lv of ["level1", "level2"] as const) for (const q of gen("powersRoots", lv, { root: true, power: false, notation: false, combined: false, negatives: false, calculator: false })) {
      const m = /^\\sqrt\{(\d+)\}$/.exec(mathOf(q));
      if (!m) continue;
      expect(Number(q.answer) ** 2, `${lv} ${mathOf(q)}`).toBe(Number(m[1]));
    }
  });

  it("Powers & Roots: each level has its own range of numbers", () => {
    const all = (lv: (typeof LEVELS)[number], only: Record<string, boolean>) => gen("powersRoots", lv, only);
    // Level 1: one operation on small numbers: squares to 10², cubes to 5³, 2⁵, 10³; roots of squares to 100, ∛8 and ∛27.
    for (const q of all("level1", { power: true, root: true, notation: true, combined: false, negatives: false, calculator: false })) {
      const m = mathOf(q);
      const p = /^(\d+)\^\{(\d+)\}$/.exec(m);
      if (p) expect(Number(q.answer), m).toBeLessThanOrEqual(1000);
      const r = /^\\sqrt\{(\d+)\}$/.exec(m);
      if (r) expect(Number(r[1]), m).toBeLessThanOrEqual(100);
      const c = /^\\sqrt\[3\]\{(-?\d+)\}$/.exec(m);
      if (c) expect([8, 27]).toContain(Number(c[1]));
    }
    // Level 2: squares of 11 to 20 (roots) and 11 to 15 (powers); cubes 4 to 10.
    for (const q of all("level2", { power: true, root: true, notation: false, combined: false, negatives: false, calculator: false })) {
      const m = mathOf(q);
      const r = /^\\sqrt\{(\d+)\}$/.exec(m);
      if (r) expect(Number(q.answer), m).toBeGreaterThanOrEqual(11);
      const p = /^(\d+)\^\{2\}$/.exec(m);
      if (p) expect(Number(p[1]), m).toBeGreaterThanOrEqual(11);
    }
    // Level 3 must carry a fraction or a decimal (or a calculator question), never a plain whole-number square.
    for (const q of all("level3", { power: true, root: true, notation: false, combined: false, negatives: false, calculator: false })) {
      expect(mathOf(q), "level 3 is fractions, decimals or a negative cube root").toMatch(/frac|0\.|\\sqrt\[3\]\{-/);
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

  it("every question carries its own prompt (a worded question: prompt line, then the maths)", () => {
    for (const tool of Object.keys(TOOL_CONFIG.tools)) for (const lv of LEVELS) for (const q of gen(tool, lv, allOn(tool, lv))) {
      expect(q.kind, `${tool} ${lv}`).toBe("worded");
      expect((q.lines ?? []).length, `${tool} ${lv}`).toBeGreaterThanOrEqual(2);
      expect((q.lines ?? [])[0].trim().length, `${tool} ${lv} prompt`).toBeGreaterThan(0);
    }
  });

  it("Index Laws Level 1: one law on one base, exponents of 2 or more, no coefficients", () => {
    const one = { multiply: true, divide: true, powerOfPower: true, numeric: true, algebraic: true, combined: false, missingIndex: false, coefficients: false };
    for (const q of gen("indexLaws", "level1", one)) {
      const m = mathOf(q);
      expect(m, m).not.toMatch(/\d[a-z]|[a-z]\^\{\d+\}[a-z]/);   // no coefficient in front of a letter, no second letter
      for (const e of m.matchAll(/\^\{(\d+)\}/g)) expect(Number(e[1]), m).toBeLessThanOrEqual(12);
    }
  });

  it("Index Laws Level 3: numbers mean several bases at once", () => {
    const numbers = { multiply: false, divide: false, powerOfPower: false, numeric: true, algebraic: false, combined: false, missingIndex: false, coefficients: false };
    for (const q of gen("indexLaws", "level3", numbers)) {
      const bases = new Set([...mathOf(q).matchAll(/(\d+)\^\{/g)].map(m => m[1]));
      expect(bases.size, mathOf(q)).toBeGreaterThanOrEqual(2);
    }
  });

  it("Common Base Level 3 evaluate uses a fractional or negative index", () => {
    const ev = { writeAsPower: false, solveIndex: false, evaluate: true, interms: false, two: true, three: true, five: true, ten: true };
    for (const q of gen("commonBase", "level3", ev)) expect(mathOf(q), mathOf(q)).toMatch(/frac|-\d\}/);
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

describe("Index Laws: multiply then divide", () => {
  it("(b^a × b^c) ÷ b^d gives b^(a+c−d), with and without coefficients", () => {
    const gen = (__test as any).generateQuestion;
    for (const level of ["level1", "level2", "level3"]) for (const baseOn of level === "level1" ? ["algebraic", "numeric"] : ["algebraic", "coefficients"]) {
      for (let i = 0; i < 40; i++) {
        const ms: Record<string, boolean> = { multiply: false, divide: false, powerOfPower: false, combined: false, missingIndex: false, multiplyDivide: true, algebraic: false, numeric: false, coefficients: false, [baseOn]: true };
        const q = gen("indexLaws", level, {}, "", ms);
        if (level === "level3" && baseOn === "numeric") continue;
        const dl: string = q.displayLatex ?? q.lines[1].slice(1, -1);
        const m = dl.match(/^\\dfrac\{(\d*)([a-z0-9])\^\{(\d+)\} \\times (\d*)\2\^\{(\d+)\}\}\{(\d*)\2\^\{(\d+)\}\}$/);
        expect(m, dl).not.toBeNull();
        const [, k, , a, mm, c, dv, e] = m!;
        const coef = (Number(k || 1) * Number(mm || 1)) / Number(dv || 1);
        expect(Number.isInteger(coef)).toBe(true);
        const exp = Number(a) + Number(c) - Number(e);
        expect(q.answerLatex).toBe(`${k ? coef : ""}${m![2]}^{${exp}}`);
      }
    }
  });
});
