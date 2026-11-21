// Formulating Linear Programmes, "Write a constraint" Level 1 (lpGen.ts, lpSolve.ts): seeded draws check that the constraint is tidy, that its meaning agrees with its
// coefficients, that the wording carries every number, and that the working is valid KaTeX and ends on the answer. Seeded, so no chance failures.
import { describe, it, expect, vi, afterEach } from "vitest";
import katex from "katex";
import { fr, type Fr } from "../shared/decision/dim";
import { OPS, type Op, gcdInt, isTidy, tidyHolds } from "../shared/decision/lp";
import { constraintOf, constraintText, opWord, type LpProblemData } from "../shared/decision/lpGen";
import { generateConstraint as gen, type LpGenOptionsFull } from "../shared/decision/lpGenL23";
import { constraintTex, solveLp } from "../shared/decision/lpSolve";
import type { DecisionProblem } from "../shared/decision/types";
import { __seed } from "../tools/Decision/FormulatingLP";

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const seeded = (seed: number) => vi.spyOn(Math, "random").mockImplementation(mulberry32(seed));
afterEach(() => vi.restoreAllMocks());

const asProblem = (q: { prompt: string; answerText: string; data: LpProblemData }): DecisionProblem => ({ kind: q.data.kind, level: 1, lp: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" });
const F = (n: number, d = 1) => fr(n, d);
const generateConstraint = (level: number, o: Pick<LpGenOptionsFull, "vars" | "styles"> & Partial<LpGenOptionsFull>) => gen(level, { pctOf: [], capGiven: "most", method: "fractions", ...o });

describe("the working of the brief's examples", () => {
  const vars2 = [{ sym: "x", noun: "loaves", integer: true }, { sym: "y", noun: "cakes", integer: true }];
  const resource: LpProblemData = {
    kind: "resource", level: 1, vars: vars2, op: "≤",
    spec: { t: "linear", coeffs: [F(10), F(15)], op: "≤", rhs: F(300), kind: "resource" },
    slip: { spec: { t: "linear", coeffs: [F(15), F(10)], op: "≤", rhs: F(300), kind: "resource" }, what: "the coefficients the wrong way round" },
    info: { kind: "resource", per: [10, 15], amount: 300, unit: "minutes", of: "oven time", verb: "uses", label: "oven time used", topic: "oven time", sing: ["loaf", "cake"] },
  };
  it("10x + 15y ≤ 300 is written, then divided by 5 to 2x + 3y ≤ 60; if only loaves, x ≤ 30; the slip is shown last", () => {
    const steps = solveLp(asProblem({ prompt: "", answerText: "", data: resource }));
    const all = steps.flatMap((s) => s.lpView!.rows.slice(-s.lpView!.fresh!)).map((r) => r.t);
    expect(all).toContain("10x + 15y \\le 300");
    expect(all).toContain("2x + 3y \\le 60");
    expect(all.join("\n")).toContain("$x \\le 30$");
    const last = steps[steps.length - 1].lpView!.rows;
    expect(last.find((r) => r.k === "result")!.t).toBe("2x + 3y \\le 60");
    expect(last.find((r) => r.k === "slip")!.t).toContain("15x + 10y \\le 300");
    // the slip is never shown before the answer
    expect(steps.slice(0, -1).some((s) => s.lpView!.rows.some((r) => r.k === "slip"))).toBe(false);
  });
  it("x at least twice y and z combined: x ≥ 2(y + z), then x ≥ 2y + 2z, then x − 2y − 2z ≥ 0", () => {
    const vars3 = [...vars2, { sym: "z", noun: "pies", integer: true }];
    const d: LpProblemData = {
      kind: "multiple", level: 1, vars: vars3, op: "≥",
      spec: { t: "rel", n: 3, a: [0], b: [1, 2], m: F(2), op: "≥", kind: "multiple" },
      slip: { spec: { t: "rel", n: 3, a: [1, 2], b: [0], m: F(2), op: "≥", kind: "multiple" }, what: "the comparison the wrong way round" },
      info: { kind: "multiple", a: 0, b: [1, 2], m: F(2) }, point: [40, 15, 5],
    };
    const rows = solveLp(asProblem({ prompt: "", answerText: "", data: d })).flatMap((s) => s.lpView!.rows.slice(-s.lpView!.fresh!)).map((r) => r.t);
    expect(rows).toContain("x \\ge 2(y + z)");
    expect(rows).toContain("x \\ge 2y + 2z");
    expect(rows).toContain("x - 2y - 2z \\ge 0");
    expect(rows.join("\n")).toContain("40 - 2(15) - 2(5) = 0");
  });
  it("y at least 3/2 times x: cleared, moved left, then multiplied by −1 to put x first (the sign reverses)", () => {
    const d: LpProblemData = {
      kind: "multiple", level: 1, vars: vars2, op: "≥",
      spec: { t: "rel", n: 2, a: [1], b: [0], m: F(3, 2), op: "≥", kind: "multiple" },
      info: { kind: "multiple", a: 1, b: [0], m: F(3, 2) },
    };
    const rows = solveLp(asProblem({ prompt: "", answerText: "", data: d })).flatMap((s) => s.lpView!.rows.slice(-s.lpView!.fresh!)).map((r) => r.t);
    expect(rows).toContain("y \\ge \\frac{3}{2}x");
    expect(rows).toContain("2y \\ge 3x");
    expect(rows).toContain("2y - 3x \\ge 0");
    expect(rows).toContain("3x - 2y \\le 0");
  });
  it("a strict bound keeps its sign and says what it means for whole numbers", () => {
    const d: LpProblemData = {
      kind: "bound", level: 1, vars: vars2, op: ">",
      spec: { t: "linear", coeffs: [F(1), F(0)], op: ">", rhs: F(15), kind: "bound" }, info: { kind: "bound", i: 0, N: 15, each: false },
    };
    const last = solveLp(asProblem({ prompt: "", answerText: "", data: d })).pop()!.lpView!.rows;
    expect(last.find((r) => r.k === "result")!.t).toBe("x > 15");
    expect(last.find((r) => r.k === "note")!.t).toContain("x \\ge 16");
  });
});

/** a number of the sentence, as it appears in the prompt (thousands are written plainly in the prompt) */
const inPrompt = (prompt: string, n: number): boolean => new RegExp(`(?<![\\d.])${n}(?!\\d|\\.\\d)`).test(prompt);

describe("random draws (seeded)", () => {
  for (const n of [2, 3, 4]) {
    it(`${n} variables, both styles: tidy, meaning agrees with the coefficients, wording carries the numbers, working renders`, () => {
      seeded(4100 + n);
      const seenOps = new Set<Op>();
      const seenKinds = new Set<string>();
      let withPoint = 0, needPoint = 0;
      for (let d = 0; d < 600; d++) {
        const q = generateConstraint(1, { vars: [n], styles: ["resource", "compare"] });
        const data = q.data;
        const c = constraintOf(data.spec);
        seenOps.add(data.op);
        seenKinds.add(data.kind);

        // the tidy form: whole numbers, lowest terms, leading coefficient positive, within the level's bound
        expect(isTidy(c)).toBe(true);
        expect(c.coeffs.reduce((g, f) => gcdInt(g, f[0]), 0)).toBe(1);
        expect(Math.max(...c.coeffs.map((f) => Math.abs(f[0])))).toBeLessThanOrEqual(data.kind === "resource" ? 20 : 9);
        expect(c.rhs[1]).toBe(1);
        expect(c.op === data.op || c.op === ({ "≤": "≥", "≥": "≤", "=": "=", "<": ">", ">": "<" } as Record<Op, Op>)[data.op]).toBe(true);
        expect(q.answerText).toBe(constraintText(c, data.vars));
        expect(data.vars).toHaveLength(n);

        // the meaning (from the sentence's own numbers) agrees with the tidy coefficients at random points and on the boundary
        const R = Math.max(20, Math.min(400, 2 * Math.abs(c.rhs[0])));
        for (let t = 0; t < 60; t++) {
          const p: Fr[] = Array.from({ length: n }, () => fr(Math.floor(Math.random() * R)));
          expect(c.holds(p)).toBe(tidyHolds(c, p));
        }
        for (let i = 0; i < n; i++) {
          if (c.coeffs[i][0] === 0) continue;
          const e: Fr[] = Array.from({ length: n }, (_, j) => (j === i ? fr(c.rhs[0], c.coeffs[i][0]) : fr(0)));
          if (e[i][1] === 1) expect(c.holds(e)).toBe(tidyHolds(c, e));
        }

        // the wording: the operator word is there, and so is every number of the sentence
        const count = data.kind !== "resource";
        expect(q.prompt).toContain(opWord(data.op, count));
        expect(q.prompt).not.toMatch(/undefined|NaN|\[object|\$\{|\{\w+\}/);
        for (const v of data.vars) expect(q.prompt).toContain(`$${v.sym}$`);
        if (data.info.kind === "resource") {
          for (const a of data.info.per) expect(inPrompt(q.prompt, a)).toBe(true);
          expect(inPrompt(q.prompt, data.info.amount)).toBe(true);
          expect(data.info.amount % data.info.per.find((a) => data.info.kind === "resource" && data.info.amount % a === 0)!).toBe(0);
        } else if (data.info.kind === "difference") expect(inPrompt(q.prompt, data.info.k)).toBe(true);
        else if (data.info.kind === "bound" || data.info.kind === "total") expect(inPrompt(q.prompt, data.info.N)).toBe(true);

        // the slip really is a different constraint, and the check point shows it
        if (data.slip) {
          const s = constraintOf(data.slip.spec);
          if (data.kind !== "resource") {
            needPoint++;
            if (data.point) {
              withPoint++;
              const p = data.point.map((v) => fr(v));
              expect(c.holds(p)).toBe(true);
              expect(s.holds(p)).toBe(false);
              expect(data.point.some((v) => v !== 0)).toBe(true);
            }
          } else expect(s.coeffs).not.toEqual(c.coeffs);
        }

        // the working: every step has a caption and rows, every piece of TeX renders, no \text, and it ends on the answer
        const steps = solveLp(asProblem(q));
        expect(steps.length).toBeGreaterThanOrEqual(3);
        for (const st of steps) {
          expect(st.caption.length).toBeGreaterThan(0);
          for (const r of st.lpView!.rows) {
            expect(r.t).not.toContain("\\text");
            const segs = r.k === "words" || r.k === "head" || r.k === "note" || r.k === "slip" ? r.t.split(/(\$[^$]+\$)/g).filter((_, i) => i % 2 === 1).map((s) => s.slice(1, -1)) : [r.t];
            for (const tex of segs) expect(() => katex.renderToString(tex, { throwOnError: true })).not.toThrow();
          }
        }
        const last = steps[steps.length - 1].lpView!.rows;
        expect(last.find((r) => r.k === "result")!.t).toBe(constraintTex(c, data.vars.map((v) => v.sym)));
        if (data.slip && data.kind !== "resource" && data.point) expect(last.some((r) => r.k === "slip")).toBe(true);
        expect(steps.slice(0, -1).some((st) => st.lpView!.rows.some((r) => r.k === "slip"))).toBe(false);
      }
      // comparisons give all five operators, resource use both ways round, and every kind turns up
      expect([...seenOps].sort()).toEqual([...OPS].sort());
      expect([...seenKinds].sort()).toEqual(["bound", "difference", "multiple", "resource", "total"]);
      expect(withPoint / needPoint).toBeGreaterThan(0.97);
    }, 120_000);
  }

  it("with two variables the 'combined' comparisons are not used; with three or four they are", () => {
    seeded(77);
    let combined2 = 0, combined3 = 0;
    for (let d = 0; d < 800; d++) {
      const q2 = generateConstraint(1, { vars: [2], styles: ["compare"] });
      if (q2.data.info.kind === "multiple" && q2.data.info.b.length > 1) combined2++;
      const q3 = generateConstraint(1, { vars: [3, 4], styles: ["compare"] });
      if (q3.data.info.kind === "multiple" && q3.data.info.b.length > 1) combined3++;
    }
    expect(combined2).toBe(0);
    expect(combined3).toBeGreaterThan(50);
  });
  it("styles and variable counts are respected", () => {
    seeded(5);
    for (let d = 0; d < 200; d++) {
      expect(generateConstraint(1, { vars: [3], styles: ["resource"] }).data.kind).toBe("resource");
      expect(generateConstraint(1, { vars: [4], styles: ["compare"] }).data.kind).not.toBe("resource");
      expect(generateConstraint(1, { vars: [4], styles: ["compare"] }).data.vars).toHaveLength(4);
    }
  });
  it("a worksheet of 30 questions at default options is 30 different questions", () => {
    seeded(11);
    for (const vars of [[2], [3], [4], [2, 3, 4]]) {
      const set = new Set<string>();
      for (let i = 0; i < 30; i++) set.add(__seed.generate(1, { subTool: "constraint", options: { lpVars: vars.join(",") } }).prompt);
      expect(set.size).toBe(30);
    }
  });
});
