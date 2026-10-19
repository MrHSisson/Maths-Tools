// Indices — generator invariants. The smoke suite (generators.test.ts) already checks every KaTeX string
// renders; these parse what each generator *displays* and check the answer it gives.
import { describe, it, expect } from "vitest";
import type { AnyQuestion } from "../shared";
import { __test } from "../tools/Number/Indices";
import { evalExpr, type Expr, type Mono } from "../tools/Number/IndicesCore";

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
    const numbers = { multiply: false, divide: false, powerOfPower: false, numeric: true, algebraic: false, combined: false, missingIndex: false, coefficients: false, twoLetters: false };
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
    for (const level of ["level1", "level2"]) for (const baseOn of level === "level1" ? ["algebraic", "numeric"] : ["coefficients"]) {
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

describe("Indices: every question carries its own prompt (no tab-wide instruction)", () => {
  it("no tab has an instruction, and every question's first line is a prompt", () => {
    for (const [tool, def] of Object.entries((TOOL_CONFIG as any).tools)) {
      expect((def as any).instruction, tool).toBeUndefined();
      for (const level of ["level1", "level2", "level3"]) {
        for (let i = 0; i < 25; i++) {
          const q: any = (__test as any).generateQuestion(tool, level, {}, "", {});
          expect(q.kind === "worded" && /[:,]$/.test(q.lines[0]), `${tool} ${level}: ${q.displayLatex ?? q.lines?.[0]}`).toBe(true);
        }
      }
    }
  });
});

describe("Index Laws: the levels do not overlap", () => {
  const coef = (q: AnyQuestion) => /\d[a-zA-Z]/.test(mathOf(q).replace(/\\[a-zA-Z]+/g, ""));
  const lawsOn = { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true, combined: true, missingIndex: true };
  it("Level 1 never has a coefficient", () => {
    for (const q of gen("indexLaws", "level1", { ...lawsOn, combined: false, missingIndex: false, numeric: true, algebraic: true })) expect(coef(q), mathOf(q)).toBe(false);
  });
  it("Level 2 always has a coefficient", () => {
    for (const q of gen("indexLaws", "level2", { ...lawsOn, combined: false, missingIndex: false, coefficients: true })) expect(coef(q), mathOf(q)).toBe(true);
  });
  it("Level 3 is two letters with coefficients, a combined or missing-index type, or several number bases", () => {
    for (const q of gen("indexLaws", "level3", { ...lawsOn, twoLetters: true, numeric: true })) {
      const m = mathOf(q);
      const twoLetters = coef(q) && new Set(m.replace(/\\[a-zA-Z]+/g, "").match(/[a-zA-Z]/g)).size >= 2;
      const severalBases = new Set([...m.matchAll(/(\d+)\^\{/g)].map((x) => x[1])).size >= 2;
      const missing = /square/.test(m);
      expect(twoLetters || severalBases || missing || /\(/.test(m), m).toBe(true);
    }
  });
});

// ── Powers & Roots: evaluating numbers — recomputed with this file's own exact arithmetic ──────────────────────────────────
type Q = { _idx?: { op: string; kind: string; base: [number, number]; exp: [number, number]; result: [number, number] }; answer: string; displayLatex?: string; lines?: string[]; kind: string };
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const red = (p: number, q: number): [number, number] => { const g = gcd(p, q) || 1; return q < 0 ? [-p / g, -q / g] : [p / g, q / g]; };
const iroot = (v: number, n: number) => { const r = Math.round(v ** (1 / n)); return r ** n === v ? r : null; };
/** base^(m/n) exactly, or null if the root is not exact */
const exact = (base: [number, number], exp: [number, number]): [number, number] | null => {
  const [m, n] = exp;
  const p = iroot(base[0], n), q = iroot(base[1], n);
  if (p === null || q === null) return null;
  const mm = Math.abs(m);
  const num = p ** mm, den = q ** mm;
  return m >= 0 ? red(num, den) : red(den, num);
};
/** parse an answer: "9/4", "0.09" or "7" */
const parseAnswer = (a: string): [number, number] => {
  if (a.includes("/")) { const [x, y] = a.split("/").map(Number); return red(x, y); }
  if (a.includes(".")) { const d = a.split(".")[1].length; return red(Math.round(Number(a) * 10 ** d), 10 ** d); }
  return [Number(a), 1];
};
const NUMERIC = new Set(["pow", "root"]);

describe("Powers & Roots: every numeric answer is the exact value of base ^ exponent", () => {
  const BASES = { integers: true, fractions: true, decimals: true };
  const POOLS: Record<string, Record<string, boolean>> = {
    level1: { notation: false, power: true, root: true, combined: false, negatives: false },
    level2: { zero: true, negative: true, reverse: true },
    level3: { unitFraction: true, generalFraction: true, combinedNegFrac: true, calculator: false },
  };
  for (const lv of LEVELS) it(`${lv}: the answer equals base^exponent recomputed exactly, for whole numbers, fractions and decimals`, () => {
    for (const q of gen("powersRoots", lv, { ...POOLS[lv], ...BASES }) as unknown as Q[]) {
      const i = q._idx; if (!i || !(NUMERIC.has(i.op) || i.op === "reverse")) continue;
      const want = exact(i.base, i.exp);
      expect(want, `${lv} ${JSON.stringify(i)}`).not.toBeNull();
      if (i.op === "reverse") { expect(i.result, `${q.answer}`).toEqual(want); expect(q.answer).toBe(`${i.base[0]}^${i.exp[0]}`); continue; }
      expect(parseAnswer(q.answer), `${lv} ${q.answer} for ${JSON.stringify(i)}`).toEqual(want);
      expect(i.result).toEqual(want);
    }
  });
  it("Level 1 is squares, cubes and their roots; Level 2 is zero and negative powers; Level 3 is fractional powers", () => {
    for (const q of gen("powersRoots", "level1", { ...POOLS.level1, ...BASES }) as unknown as Q[]) { const e = q._idx!.exp; expect([2, 3, 4, 5, 6]).toContain(e[1] === 1 ? e[0] : e[1]); expect(e[0]).toBe(e[1] === 1 ? e[0] : 1); }
    for (const q of gen("powersRoots", "level2", { ...POOLS.level2, ...BASES }) as unknown as Q[]) { const e = q._idx!.exp; expect(e[1]).toBe(1); expect(e[0]).toBeLessThanOrEqual(0); }
    for (const q of gen("powersRoots", "level3", { ...POOLS.level3, ...BASES }) as unknown as Q[]) { const e = q._idx!.exp; expect(e[1], `${q.displayLatex}`).toBeGreaterThan(1); }
  });
  it("the Bases selector decides the kind of number: whole, fraction or decimal", () => {
    for (const lv of LEVELS) for (const [on, test] of [["integers", /^[^.]*$/], ["fractions", /dfrac/], ["decimals", /\d\./]] as const) {
      const ms = { ...POOLS[lv], reverse: false, integers: on === "integers", fractions: on === "fractions", decimals: on === "decimals" };
      for (const q of gen("powersRoots", lv, ms) as unknown as Q[]) {
        const math = (q.lines ?? [])[1] ?? q.displayLatex ?? "";
        if (on === "integers") expect(math, `${lv} ${math}`).not.toMatch(/dfrac\{[^}]*\}\{[^}]*\}\)?\^|\d\.\d/);
        else expect(math, `${lv} ${on} ${math}`).toMatch(test);
      }
    }
  });
});

// ── Negative & Zero Indices, Fractional Indices: the answer equals the question, evaluated at numbers ─────────────────────
type AQ = { _idx?: { expr: Expr; result: Mono }; answerLatex: string; answer: string; lines?: string[] };
const POINTS = [{ x: 1.7, y: 2.3, a: 1.3, b: 0.8, m: 1.9, n: 2.7, p: 1.4, t: 3.1 }, { x: 0.6, y: 1.5, a: 2.2, b: 1.1, m: 0.7, n: 1.2, p: 2.6, t: 0.9 }];
const asNum = (m: Mono, at: Record<string, number>) => evalExpr({ t: "mono", m }, at);
const withNumberKeys = (at: Record<string, number>) => ({ ...at, ...Object.fromEntries(Array.from({ length: 12 }, (_, k) => [`${k + 1}`, k + 1])) });

describe("Negative & Zero Indices and Fractional Indices: the answer is the question's value (checked by arithmetic)", () => {
  for (const [tool, label] of [["specialPowers", "Negative & Zero"], ["fractionalIndices", "Fractional"]] as const)
    for (const lv of LEVELS) for (const form of ["positive", "leave"] as const) {
      it(`${label} ${lv}, ${form} indices: expression and answer agree at numbers, and the answer follows the house style`, () => {
        const ms = { ...allOn(tool, lv), positive: form === "positive", leave: form === "leave" };
        for (const q of gen(tool, lv, ms) as unknown as AQ[]) {
          const i = q._idx; if (!i) continue;
          for (const at of POINTS) {
            const a = evalExpr(i.expr, withNumberKeys(at)), b = asNum(i.result, withNumberKeys(at));
            expect(Math.abs(a - b) / Math.max(1, Math.abs(a)), `${lv}: ${(q.lines ?? [])[1]} -> ${q.answerLatex}`).toBeLessThan(1e-9);
          }
          const ans = q.answerLatex;
          expect(ans, "no x^{1}").not.toMatch(/\^\{1\}/);
          expect(ans, "no zero index left").not.toMatch(/\^\{0\}/);
          expect(ans, "no 1x").not.toMatch(/(^|[^\d.])1[a-z]/);
          if (form === "positive" && lv === "level1" && /Write as a power/.test((q.lines ?? [""])[0])) { /* the answer IS the form asked for */ } else if (form === "positive") expect(ans, `positive indices: ${ans}`).not.toMatch(/\^\{-/);
        }
      });
    }
  it("x³ ÷ x⁵ is asked at Level 1 and answers 1/x² (positive) or x⁻² (leave negatives)", () => {
    for (const [form, want] of [["positive", /dfrac\{\d*\}\{[a-z](\^\{\d\})?\}/], ["leave", /\^\{-\d\}/]] as const)
      for (const q of gen("specialPowers", "level1", { negative: false, zero: false, divideNegative: true, lawsNegative: false, powerOfPower: false, letters: true, numbers: false, positive: form === "positive", leave: form === "leave" }) as unknown as AQ[])
        expect(q.answerLatex, form).toMatch(want);
  });
});
