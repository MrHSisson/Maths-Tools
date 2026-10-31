// Ratio Manipulation → Ratio to Fraction: levels by kind, every option, the language rules, and that every answer is right.
// Brief: specs/ratio-manipulation-fraction-of.md. The question key carries what was asked, so a test can read it back:
// rtf-<level>-<kind>-<parts>-<values joined by _>-<numerator part indices>-<denominator part indices>-<name|exclusion>-<s|u>-<tag>
import { describe, expect, it } from "vitest";
import { __test } from "../tools/Proportion/RatioManipulation";
import { gcd } from "../shared";
import type { DifficultyLevel } from "../shared";

const { generateQuestion } = __test;
const N = 300;
type Q = { lines: string[]; answerLatex: string; working: { type?: string; extra?: { rows?: unknown[] } }[]; key: string };
const gen = (level: DifficultyLevel, ms: Record<string, boolean> = {}, vars: Record<string, boolean> = {}): Q =>
  generateQuestion("ratioToFraction", level, { simplestForm: true, numerical: level === "level3", ...vars }, "", ms) as unknown as Q;
const many = (level: DifficultyLevel, ms: Record<string, boolean> = {}, vars: Record<string, boolean> = {}, n = N) => Array.from({ length: n }, () => gen(level, ms, vars));

interface Read { kind: string; k: number; v: number[]; num: number[]; den: number[]; named: string; simplest: boolean }
const read = (q: Q): Read => {
  const [, , kind, k, v, num, den, named, s] = q.key.split("-");
  return { kind, k: Number(k), v: v.split("_").map(Number), num: [...num].map(Number), den: [...den].map(Number), named, simplest: s === "s" };
};
const value = (r: Read) => ({ n: r.num.reduce((a, i) => a + r.v[i], 0), d: r.den.reduce((a, i) => a + r.v[i], 0) });
const fractionOf = (q: Q) => { const m = q.answerLatex.match(/^\\frac\{(\d+)\}\{(\d+)\}$/); return m ? { n: Number(m[1]), d: Number(m[2]) } : null; };
const sentence = (q: Q) => q.lines[1];                                                 // the question, on the line below the ratio
const OF_THE = /\bof the (beads|students|games|marbles|counters|fruit|coins|notes|pupils|people|ingredients|sweets|flowers)\b/;

describe("every answer is right, whatever the options", () => {
  const configs: [string, DifficultyLevel, Record<string, boolean>][] = [
    ["L1", "level1", {}], ["L1 three parts, both numerators", "level1", { threeParts: true, twoParts: true, twoTogether: true }],
    ["L1 not", "level1", { byExclusion: true, threeParts: true, twoTogether: true }], ["L2", "level2", {}],
    ["L2 three parts", "level2", { threeParts: true, twoParts: true, twoTogether: true, ofRest: true }], ["L3", "level3", {}],
    ["L3 everything", "level3", { threeParts: true, twoTogether: true, ofRest: true, byExclusion: true }],
  ];
  for (const [name, level, ms] of configs) it(name, () => {
    for (const q of many(level, ms, { numerical: false })) {
      const r = read(q), { n, d } = value(r), f = fractionOf(q)!;
      expect(f, q.lines[0]).not.toBeNull();
      const g = gcd(n, d);
      expect(f.n * d, q.lines[0]).toBe(f.d * n);                       // equal to n/d
      if (r.simplest) expect([f.n, f.d]).toEqual([n / g, d / g]);
      expect(r.v.length).toBe(r.k);
      expect(new Set(r.v).size, "never a ratio like 4 : 4").toBeGreaterThan(1);
      if (r.kind !== "total") { expect(n).not.toBe(d); expect(n % d, "never a whole number").not.toBe(0); }
      else expect(n).toBeLessThan(d);
    }
  });
});

describe("Level 1: of the total (today's Level 1 by default)", () => {
  const qs = many("level1");
  it("is always two parts over the total, one part", () => {
    for (const q of qs) { const r = read(q); expect(r.kind).toBe("total"); expect(r.k).toBe(2); expect(r.num).toHaveLength(1); expect(r.den).toEqual([0, 1]); expect(r.named).toBe("name"); }
  });
  it("asks about the first and the second part (not always the first)", () => {
    expect(new Set(qs.map((q) => read(q).num[0]))).toEqual(new Set([0, 1]));
  });
  it("draws the bar-model scaffold, then the numbers", () => {
    for (const q of qs.slice(0, 40)) { expect(q.working[0].type).toBe("fracBar"); expect(q.working[1].type).toBe("fracBar"); expect(q.working[0].extra!.rows).toHaveLength(2); }
  });
  it("Three Parts with both Numerators is today's Level 2: three parts, one part or two together, over the total", () => {
    const three = many("level1", { threeParts: true, twoParts: false, onePart: true, twoTogether: true });
    for (const q of three) { const r = read(q); expect(r.kind).toBe("total"); expect(r.k).toBe(3); expect(r.den).toEqual([0, 1, 2]); r.v.forEach((x) => { expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(10); }); }
    expect(new Set(three.map((q) => read(q).num.length))).toEqual(new Set([1, 2]));
  });
  it("Two Parts Together alone gives a pair every time with three parts", () => {
    for (const q of many("level1", { threeParts: true, twoParts: false, onePart: false, twoTogether: true })) expect(read(q).num).toHaveLength(2);
  });
  it("Part Asked About isolates a part", () => {
    for (const q of many("level1", { askFirst: true, askSecond: false })) expect(read(q).num).toEqual([0]);
    for (const q of many("level1", { askFirst: false, askSecond: true })) expect(read(q).num).toEqual([1]);
    for (const q of many("level1", { threeParts: true, twoParts: false, askFirst: false, askSecond: false, askThird: true })) expect(read(q).num).toEqual([2]);
  });
});

describe("Level 2: of a part (today's Level 3 by default)", () => {
  const qs = many("level2");
  it("is always two parts, a part over the other part, either order", () => {
    for (const q of qs) { const r = read(q); expect(r.kind).toBe("part"); expect(r.k).toBe(2); expect(r.num).toHaveLength(1); expect(r.den).toHaveLength(1); expect(r.den[0]).not.toBe(r.num[0]); }
    const sizes = qs.map((q) => { const { n, d } = value(read(q)); return n < d ? "less" : "more"; });
    expect(new Set(sizes)).toEqual(new Set(["less", "more"]));
  });
  it("Answer Size isolates less than 1 or more than 1", () => {
    for (const q of many("level2", { moreThanOne: false })) { const { n, d } = value(read(q)); expect(n).toBeLessThan(d); }
    for (const q of many("level2", { lessThanOne: false })) { const { n, d } = value(read(q)); expect(n).toBeGreaterThan(d); }
  });
  it("Three Parts: one part over another, the third stated and unused", () => {
    for (const q of many("level2", { threeParts: true, twoParts: false })) { const r = read(q); expect(r.k).toBe(3); expect(r.num).toHaveLength(1); expect(r.den).toHaveLength(1); expect(q.lines[0]).toMatch(/^.+ : .+ : .+ = /); }
  });
  it("The Rest: one part over the other two added, never the total", () => {
    for (const q of many("level2", { threeParts: true, twoParts: false, ofRest: true, ofOtherPart: false })) {
      const r = read(q); expect(r.kind).toBe("rest"); expect(r.num).toHaveLength(1); expect(r.den).toHaveLength(2); expect(r.den).not.toContain(r.num[0]);
      expect(sentence(q)).toContain("the rest");
    }
  });
  it("The Rest is ignored (not offered) with two parts only", () => {
    for (const q of many("level2", { ofRest: true, ofOtherPart: false })) expect(read(q).kind).toBe("part");
  });
  it("Two Parts Together is over the one remaining part", () => {
    for (const q of many("level2", { threeParts: true, twoParts: false, onePart: false, twoTogether: true })) {
      const r = read(q); expect(r.num).toHaveLength(2); expect(r.den).toHaveLength(1); expect(r.num).not.toContain(r.den[0]);
    }
  });
  it("By Leaving Others Out applies only to a pair over a part, and is ignored otherwise", () => {
    for (const q of many("level2", { byExclusion: true, byName: false })) expect(read(q).named).toBe("name");          // two parts: nothing to leave out
    for (const q of many("level2", { byExclusion: true, byName: false, threeParts: true, twoParts: false, onePart: false, twoTogether: true })) {
      const r = read(q); expect(r.named).toBe("exclusion"); expect(r.num).toHaveLength(2); expect(sentence(q)).toContain("not");
    }
  });
});

describe("Level 3: a mixture", () => {
  const qs = many("level3", {}, {}, 400);
  it("draws the total and a part, two parts, either order, in every set", () => {
    const kinds = new Set(qs.map((q) => read(q).kind));
    expect(kinds).toEqual(new Set(["total", "part"]));
    qs.forEach((q) => expect(read(q).k).toBe(2));
    const sizes = new Set(qs.filter((q) => read(q).kind === "part").map((q) => { const { n, d } = value(read(q)); return n < d ? "less" : "more"; }));
    expect(sizes).toEqual(new Set(["less", "more"]));
  });
  it("starts on the numbers-only method, and the bar comes back when Numerical method is off", () => {
    qs.forEach((q) => expect(q.working.some((w) => w.type === "fracBar")).toBe(false));
    for (const q of many("level3", {}, { numerical: false }, 30)) expect(q.working[0].type).toBe("fracBar");
  });
  it("can be one kind alone", () => {
    for (const q of many("level3", { ofOtherPart: false })) expect(read(q).kind).toBe("total");
    for (const q of many("level3", { ofTotal: false })) expect(read(q).kind).toBe("part");
  });
  it("with three parts offers every kind", () => {
    const kinds = new Set(many("level3", { threeParts: true, twoParts: false, ofRest: true, twoTogether: true }, {}, 600).map((q) => read(q).kind));
    expect(kinds).toEqual(new Set(["total", "part", "rest"]));
  });
});

describe("the language is unambiguous (the point of the lesson)", () => {
  const all = [
    ...many("level1", { threeParts: true, twoParts: true, twoTogether: true, byExclusion: true }, {}, 200),
    ...many("level2", { threeParts: true, twoParts: true, twoTogether: true, ofRest: true, byExclusion: true }, {}, 400),
    ...many("level3", { threeParts: true, twoParts: true, twoTogether: true, ofRest: true, byExclusion: true }, {}, 400),
  ];
  it("a question of the total never names another part as the thing compared with", () => {
    for (const q of all.filter((x) => read(x).kind === "total")) {
      const s = sentence(q);
      if (s.includes("as a fraction of")) expect(s, s).toContain("as a fraction of the total");
    }
  });
  it("a question of a part or the rest never says total or altogether, and never says 'of the <collection>'", () => {
    for (const q of all.filter((x) => read(x).kind !== "total")) {
      const s = sentence(q);
      expect(s, s).not.toMatch(/total|altogether/i);
      expect(s, s).not.toMatch(OF_THE);
    }
  });
  it("a question of the rest says 'the rest' and names the parts it is made of", () => {
    for (const q of all.filter((x) => read(x).kind === "rest")) expect(sentence(q), sentence(q)).toMatch(/the rest \(.+ together\)/);
  });
  it("'not' wording appears only when the question leaves parts out", () => {
    for (const q of all) if (read(q).named !== "exclusion") expect(sentence(q), sentence(q)).not.toMatch(/\bnot\b/);
    for (const q of all.filter((x) => read(x).named === "exclusion")) expect(sentence(q)).toMatch(/\bnot\b/);
  });
});

describe("Simplest Form and the scaffold", () => {
  it("Simplest Form off leaves the fraction as it comes", () => {
    const qs = many("level1", {}, { simplestForm: false });
    for (const q of qs) { const r = read(q), { n, d } = value(r), f = fractionOf(q)!; expect([f.n, f.d]).toEqual([n, d]); }
    expect(qs.some((q) => { const { n, d } = value(read(q)); return gcd(n, d) > 1; })).toBe(true);
  });
  it("Numerical method leaves out the bar at every level; the bar is a row per part", () => {
    for (const level of ["level1", "level2", "level3"] as DifficultyLevel[]) {
      for (const q of many(level, {}, { numerical: true }, 30)) expect(q.working.some((w) => w.type === "fracBar")).toBe(false);
      for (const q of many(level, { threeParts: true, twoParts: false }, { numerical: false }, 30)) expect(q.working[0].extra!.rows).toHaveLength(3);
    }
  });
});

describe("Fraction to Ratio, Level 1: Fraction Given As", () => {
  const ftr = (ms: Record<string, boolean>) => generateQuestion("fractionToRatio", "level1", {}, "", ms) as unknown as { lines: string[]; answerLatex: string; key: string };
  it("The Other Part: 'red is 2/3 of blue' gives 2 : 3 (the ratio is numerator : denominator, in lowest terms)", () => {
    for (let i = 0; i < 200; i++) {
      const q = ftr({ givenOfPart: true, givenOfTotal: false });
      const m = q.lines[0].match(/\\frac\{(\d+)\}\{(\d+)\}\$ of the number/)!;
      expect(m, q.lines[0]).not.toBeNull();
      const [num, den] = [Number(m[1]), Number(m[2])], ans = q.answerLatex.split(" : ").map(Number);
      expect(gcd(num, den)).toBe(1);
      expect(ans.slice().sort((a, b) => a - b)).toEqual([num, den]);
      expect(q.key).toContain("ftr-l1p");
    }
  });
  it("The Total (the default) is unchanged: 'a fraction are red and the rest blue'", () => {
    for (let i = 0; i < 100; i++) expect(ftr({}).lines[0]).toMatch(/and the rest are/);
  });
});
