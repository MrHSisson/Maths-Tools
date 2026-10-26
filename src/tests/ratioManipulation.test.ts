// Ratio Manipulation: Simplifying (every Question Type) and Equivalent Ratios (pick / scale / simplify-then-scale) re-derived independently.
import { describe, it, expect } from "vitest";
import { __test } from "../tools/Proportion/RatioManipulation";
import { gcd } from "../shared";
import type { DifficultyLevel } from "../shared";

const { generateQuestion } = __test;
const LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];
const N = 60;

type Q = { kind: string; lines: string[]; answer: string; answerLatex?: string; working: { type: string }[] };
const gen = (tool: string, level: DifficultyLevel, ms: Record<string, boolean> = {}) => generateQuestion(tool, level, {}, "", ms) as unknown as Q;
const only = (on: string, extra: Record<string, boolean> = {}) => ({
  wholeNumbers: false, units: false, decimals: false, fractions: false, letters: false, alreadySimplest: false, [on]: true, ...extra,
});
const maths = (q: Q) => q.lines[1].replace(/^\$|\$$/g, "");
const parts = (s: string) => s.split(":").map((x) => x.trim());
const num = (s: string) => Number(s);
const simplest = (ps: number[]) => ps.reduce(gcd) === 1;

// a term such as 6xy^{2} evaluated at x=2, y=3, z=5
const VALUES: Record<string, number> = { x: 2, y: 3, z: 5 };
const evalTerm = (t: string) => {
  const m = t.match(/^(\d*)(.*)$/)!;
  let v = m[1] === "" ? 1 : Number(m[1]);
  for (const [, letter, pow] of m[2].matchAll(/([xyz])(?:\^\{(\d+)\})?/g)) v *= VALUES[letter] ** (pow ? Number(pow) : 1);
  return v;
};

describe("Simplifying", () => {
  it("whole numbers: the answer is the simplest equivalent ratio", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, only("wholeNumbers"));
      const given = parts(maths(q)).map(num), ans = parts(q.answerLatex!).map(num);
      expect(given.length).toBe(level === "level3" ? 3 : 2);
      expect(simplest(ans)).toBe(true);
      const g = given.reduce(gcd);
      expect(given.map((x) => x / g)).toEqual(ans);
      expect(g).toBeGreaterThan(1);
    }
  });

  it("the working is a ratio table whose last row is the answer (every type but letters and already simplest)", () => {
    const types = ["wholeNumbers", "units", "decimals", "fractions"];
    for (const level of LEVELS) for (const type of types) for (let i = 0; i < 20; i++) {
      const q = gen("simplifying", level, only(type));
      const tables = q.working.filter((w) => w.type === "ratioTable") as unknown as { extra: { rows: string[][]; headers: string[] } }[];
      expect(tables.length).toBe(q.working.length);
      const last = tables[tables.length - 1].extra;
      expect(last.rows[last.rows.length - 1].join(" : ")).toBe(q.answerLatex);
      expect(last.headers.length).toBe(parts(q.answerLatex!).length);
    }
  });

  it("1 : n and n : 1 give a terminating decimal with the right part equal to 1", () => {
    for (const level of ["level1", "level2"] as DifficultyLevel[]) for (const ask of ["oneToN", "nToOne"]) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, { ...only("wholeNumbers"), simplest: false, oneToN: false, nToOne: false, [ask]: true });
      const given = parts(maths(q)).map(num), ans = parts(q.answerLatex!).map(num);
      expect(q.lines[0]).toBe(ask === "oneToN" ? "Write the ratio in the form 1 : n:" : "Write the ratio in the form n : 1:");
      expect(ans[ask === "oneToN" ? 0 : 1]).toBe(1);
      expect(ans[0] * given[1]).toBeCloseTo(ans[1] * given[0], 9);
      const other = ans[ask === "oneToN" ? 1 : 0];
      expect(String(other).length).toBeLessThan(8);
    }
  });

  it("1 : n is ignored unless whole numbers are ticked", () => {
    const q = gen("simplifying", "level1", { ...only("decimals"), simplest: false, oneToN: true });
    expect(q.lines[0]).toBe("Simplify the ratio:");
  });

  it("units: converts, then simplifies", () => {
    const factor: Record<string, number> = { m: 100, kg: 1000, km: 1000, l: 1000, h: 60 };
    const small: Record<string, string> = { m: "cm", kg: "g", km: "m", l: "ml", h: "min" };
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, only("units"));
      const m = [...maths(q).matchAll(/(\d+)\\,\\mathrm\{(\w+)\}/g)];
      expect(m.length).toBe(2);
      const bigIdx = m.findIndex((x, k) => small[x[2]] === m[1 - k][2]);
      expect(bigIdx).toBeGreaterThanOrEqual(0);
      const big = m[bigIdx], sm = m[1 - bigIdx];
      expect(sm[2]).toBe(small[big[2]]);
      const given = [0, 1].map((k) => (k === bigIdx ? num(big[1]) * factor[big[2]] : num(sm[1])));
      const g = gcd(given[0], given[1]);
      expect(parts(q.answerLatex!).map(num)).toEqual(given.map((x) => x / g));
    }
  });

  it("decimals: same ratio as the question, in simplest whole numbers", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, only("decimals"));
      const given = parts(maths(q)).map(num), ans = parts(q.answerLatex!).map(num);
      expect(simplest(ans)).toBe(true);
      expect(given[0] * ans[1]).toBeCloseTo(given[1] * ans[0], 9);
      expect(given.some((x) => !Number.isInteger(x))).toBe(true);
    }
  });

  it("fractions: same ratio as the question, in simplest whole numbers", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, only("fractions"));
      const fr = [...maths(q).matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)].map((m) => num(m[1]) / num(m[2]));
      const ans = parts(q.answerLatex!).map(num);
      expect(fr.length).toBe(2);
      expect(simplest(ans)).toBe(true);
      expect(fr[0] * ans[1]).toBeCloseTo(fr[1] * ans[0], 9);
    }
  });

  it("letters: the answer is the same ratio with the common factor removed", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, only("letters"));
      const a = parts(maths(q)), b = parts(q.answerLatex!);
      expect(evalTerm(a[0]) * evalTerm(b[1])).toBe(evalTerm(a[1]) * evalTerm(b[0]));
      expect(maths(q)).not.toBe(q.answerLatex);
    }
  });

  it("already simplest: the answer is the question", () => {
    for (const level of LEVELS) for (let i = 0; i < N; i++) {
      const q = gen("simplifying", level, only("alreadySimplest"));
      expect(q.answerLatex).toBe(maths(q));
      expect(simplest(parts(maths(q)).map(num))).toBe(true);
    }
  });
});

describe("Equivalent Ratios", () => {
  it("Level 1: one lettered option is equivalent and the three others are not", () => {
    for (let i = 0; i < N; i++) {
      const q = gen("equivalentRatios", "level1");
      const [a, b] = parts(q.lines[0].match(/\$(.+)\$/)![1]).map(num);
      const opts = q.lines.slice(1).map((l) => ({ letter: l[0], v: parts(l.match(/\$(.+)\$/)![1]).map(num) }));
      expect(opts.length).toBe(4);
      expect(new Set(opts.map((o) => o.v.join(":"))).size).toBe(4);
      const eq = opts.filter((o) => o.v[0] * b === o.v[1] * a);
      expect(eq.length).toBe(1);
      expect(q.answer.startsWith(eq[0].letter)).toBe(true);
      expect(opts.map((o) => o.letter)).toEqual(["A", "B", "C", "D"]);
    }
  });

  it("Level 2: a whole-number scale factor in either direction, and either part can be asked", () => {
    const seen = { up: 0, down: 0, first: 0, second: 0 };
    for (let i = 0; i < 200; i++) {
      const q = gen("equivalentRatios", "level2", { secondPart: true, firstPart: true, up: true, down: true });
      const [lhs, rhs] = maths(q).split("=");
      const g = parts(lhs).map(num), t = parts(rhs);
      const askFirst = t[0].trim() === "\\,?";
      const ans = num(q.answer);
      const target = askFirst ? [ans, num(t[1])] : [num(t[0]), ans];
      expect(g[0] * target[1]).toBe(g[1] * target[0]);
      const k = Math.max(target[0] / g[0], g[0] / target[0]);
      expect(Number.isInteger(k)).toBe(true);
      expect(simplest([Math.min(g[0], target[0]), Math.min(g[1], target[1])])).toBe(true);
      seen[target[0] > g[0] ? "up" : "down"]++; seen[askFirst ? "first" : "second"]++;
      expect(q.working.some((s) => s.type === "ratioTable")).toBe(true);
    }
    expect(Object.values(seen).every((n) => n > 0)).toBe(true);
  });

  it("Level 2 defaults: scale up, second part", () => {
    for (let i = 0; i < N; i++) {
      const q = gen("equivalentRatios", "level2");
      const [lhs, rhs] = maths(q).split("=");
      expect(parts(rhs)[1]).toBe("\\,?");
      expect(parts(rhs).map(num)[0]).toBeGreaterThan(parts(lhs).map(num)[0]);
    }
  });

  it("Level 3: simplify first, then scale; the direct factor is never a whole number", () => {
    for (let i = 0; i < 200; i++) {
      const q = gen("equivalentRatios", "level3", { secondPart: true, firstPart: true });
      const [lhs, rhs] = maths(q).split("=");
      const g = parts(lhs).map(num), t = parts(rhs);
      const askFirst = t[0].trim() === "\\,?";
      const ans = num(q.answer);
      const target = askFirst ? [ans, num(t[1])] : [num(t[0]), ans];
      expect(g[0] * target[1]).toBe(g[1] * target[0]);
      expect(g[0] % target[0] === 0 || target[0] % g[0] === 0).toBe(false);
      expect(gcd(g[0], g[1])).toBeGreaterThan(1);
    }
  });
});
