// Formulating Linear Programmes, "Formulate a problem" Level 1 (lpProblem.ts, and the working in lpSolve.ts): every generated model has a non-empty region and a single optimal
// corner (checked by the meaning of each constraint, not by its coefficients), the wording carries every number and never names a variable, and the working is valid KaTeX
// and ends on the model. Seeded, so no chance failures.
import { describe, it, expect, vi, afterEach } from "vitest";
import katex from "katex";
import { fr, type Fr } from "../shared/decision/dim";
import { OPS, bestVertices, isTidy, vertices } from "../shared/decision/lp";
import { constraintOf, type LpProblemData } from "../shared/decision/lpGen";
import { generateProblem } from "../shared/decision/lpProblem";
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
const asProblem = (data: LpProblemData, prompt = "", answerText = ""): DecisionProblem => ({ kind: data.kind, level: data.level, lp: data, prompt, answer: { text: answerText }, matrixMode: "off" });
const inPrompt = (prompt: string, n: number): boolean => new RegExp(`(?<![\\d.])${n}(?!\\d|\\.\\d)`).test(prompt);
const LATTICE: Record<number, number> = { 2: 60, 3: 25, 4: 12 };

describe("the working of a hand-made model", () => {
  const vars = [{ sym: "x", noun: "loaves", integer: true }, { sym: "y", noun: "cakes", integer: true }];
  const oven: LpProblemData = { kind: "resource", level: 1, vars, op: "≤", spec: { t: "linear", coeffs: [fr(10), fr(15)], op: "≤", rhs: fr(300), kind: "resource" }, slip: { spec: { t: "linear", coeffs: [fr(15), fr(10)], op: "≤", rhs: fr(300), kind: "resource" }, what: "the coefficients the wrong way round" }, info: { kind: "resource", per: [10, 15], amount: 300, unit: "minutes", of: "oven time", verb: "uses", label: "oven time used", topic: "oven time", sing: ["loaf", "cake"] } };
  const ratio: LpProblemData = { kind: "multiple", level: 1, vars, op: "≥", spec: { t: "rel", n: 2, a: [0], b: [1], m: fr(2), op: "≥", kind: "multiple" }, info: { kind: "multiple", a: 0, b: [1], m: fr(2) } };
  const d: LpProblemData = { kind: "problem", level: 1, vars, op: "≤", spec: oven.spec, info: { kind: "problem", sense: "max", name: "P", obj: [5, 8], parts: [oven, ratio], sing: ["loaf", "cake"] } };
  it("variables, objective P = 5x + 8y, both constraints, non-negativity, then the model in the book's layout", () => {
    const steps = solveLp(asProblem(d));
    const all = steps.flatMap((s) => s.lpView!.rows.slice(-s.lpView!.fresh!)).map((r) => r.t);
    expect(all).toContain("P = 5x + 8y");
    expect(all).toContain("10x + 15y \\le 300");
    expect(all).toContain("2x + 3y \\le 60");
    expect(all).toContain("x - 2y \\ge 0");
    expect(all).toContain("x \\ge 0,\\ y \\ge 0");
    const last = steps[steps.length - 1].lpView!.rows;
    expect(last.map((r) => r.t)).toEqual(expect.arrayContaining(["Maximise $P = 5x + 8y$", "subject to:", "2x + 3y \\le 60", "x - 2y \\ge 0", "x \\ge 0,\\ y \\ge 0"]));
    // the common slips are shown only on the last step
    expect(steps.slice(0, -1).some((s) => s.caption.startsWith("Common slips"))).toBe(false);
    expect(steps[steps.length - 1].caption).toContain("Common slips");
    expect(steps[steps.length - 1].caption).toContain("15x + 10y ≤ 300");
    expect(steps[steps.length - 1].lpView!.fresh).toBe(0);
  });
  it("the corner points of that model, exactly: (0, 0), (30, 0), (120/7, 60/7), and 1080/7 is the most", () => {
    const cons = [constraintOf(oven.spec), constraintOf(ratio.spec)];
    const vs = vertices(cons, 2).map((p) => p.map((f) => `${f[0]}/${f[1]}`).join(",")).sort();
    expect(vs).toEqual(["0/1,0/1", "120/7,60/7", "30/1,0/1"].sort());
    const best = bestVertices(vertices(cons, 2), [fr(5), fr(8)], "max")!;
    expect(best.value).toEqual(fr(1080, 7));
    expect(best.at).toEqual([[fr(120, 7), fr(60, 7)]]);
  });
});

describe("random draws (seeded)", () => {
  for (const n of [2, 3, 4]) {
    it(`${n} variables, both objectives: a non-empty region, a single best corner, wording that names no variable, working that renders`, () => {
      seeded(6100 + n);
      const senses = new Set<string>();
      const counts = new Set<number>();
      for (let i = 0; i < 200; i++) {
        const q = generateProblem(1, { vars: [n], objective: ["max", "min"] });
        const d = q.data;
        const info = d.info as Extract<LpProblemData["info"], { kind: "problem" }>;
        senses.add(info.sense);
        counts.add(info.parts.length);
        expect(d.vars).toHaveLength(n);
        expect(info.parts.length).toBeGreaterThanOrEqual(2);
        const cons = info.parts.map((p) => constraintOf(p.spec));
        for (const c of cons) { expect(isTidy(c)).toBe(true); expect(c.rhs[1]).toBe(1); expect(c.op).toMatch(/^[≤≥]$/); }
        expect(OPS).toContain(d.op);

        // the model: a non-empty region and a single best corner (exact), the best corner is a plan that does something
        const obj = info.obj.map((k) => fr(k));
        const vs = vertices(cons, n);
        expect(vs.length).toBeGreaterThan(0);
        const best = bestVertices(vs, obj, info.sense)!;
        expect(best.at).toHaveLength(1);
        expect(best.at[0].some((f) => f[0] !== 0)).toBe(true);
        expect(new Set(info.obj).size).toBeGreaterThan(1);
        // independent: by meaning (each part's `holds`), no lattice point beats the best corner, and the best corner itself satisfies every sentence
        expect(info.parts.every((p) => constraintOf(p.spec).holds(best.at[0]))).toBe(true);
        const val = (p: Fr[]): number => p.reduce((s, f, k) => s + (f[0] / f[1]) * info.obj[k], 0);
        const target = best.value[0] / best.value[1];
        const R = LATTICE[n];
        const p = new Array<number>(n).fill(0);
        const walk = (k: number): void => {
          if (k === n) {
            const f = p.map((v) => fr(v));
            if (info.parts.every((part) => constraintOf(part.spec).holds(f))) expect(info.sense === "max" ? val(f) <= target + 1e-9 : val(f) >= target - 1e-9).toBe(true);
            return;
          }
          for (let v = 0; v <= R; v++) { p[k] = v; walk(k + 1); }
        };
        if (i < 15) walk(0);

        // the wording: no variable letter or $ at all (the student assigns them), every number of the model is there
        expect(q.prompt).not.toContain("$");
        expect(q.prompt).not.toMatch(/undefined|NaN|\[object|\$\{/);
        for (const v of info.obj) expect(q.prompt).toContain(`£${v}`);
        expect(q.prompt).toContain(info.sense === "max" ? "maximise the profit" : "minimise the cost");
        for (const part of info.parts) {
          const pi = part.info;
          if (pi.kind === "resource") { for (const a of pi.per) expect(inPrompt(q.prompt, a)).toBe(true); expect(inPrompt(q.prompt, pi.amount)).toBe(true); }
          else if (pi.kind === "difference") expect(inPrompt(q.prompt, pi.k)).toBe(true);
          else if (pi.kind === "bound" || pi.kind === "total") expect(inPrompt(q.prompt, pi.N)).toBe(true);
        }
        expect(q.answerText).toContain(info.sense === "max" ? "Maximise" : "Minimise");

        // the working: valid KaTeX, no \text, ends on the model with every constraint line and non-negativity
        const steps = solveLp(asProblem(d, q.prompt, q.answerText));
        expect(steps.length).toBeGreaterThanOrEqual(5);
        for (const st of steps) {
          expect(st.caption.length).toBeGreaterThan(0);
          for (const r of st.lpView!.rows) {
            expect(r.t).not.toContain("\\text");
            expect(r.t).not.toMatch(/undefined|NaN|\[object/);
            const segs = r.k === "tex" || r.k === "result" ? [r.t] : r.t.split(/(\$[^$]+\$)/g).filter((_, k) => k % 2 === 1).map((x) => x.slice(1, -1));
            for (const tex of segs) expect(() => katex.renderToString(tex, { throwOnError: true })).not.toThrow();
          }
        }
        const syms = d.vars.map((v) => v.sym);
        const last = steps[steps.length - 1].lpView!.rows.map((r) => r.t);
        for (const c of cons) expect(last).toContain(constraintTex(c, syms));
        expect(last).toContain(syms.map((s) => `${s} \\ge 0`).join(",\\ "));
        expect(last.join("\n")).toContain(`${info.name} = `);
        expect(steps.slice(0, -1).some((st) => st.caption.startsWith("Common slips"))).toBe(false);
      }
      expect([...senses].sort()).toEqual(["max", "min"]);
      expect(counts.has(2)).toBe(true);
    }, 180_000);
  }

  it("Objective is respected, and a worksheet of 30 problems is 30 different problems", () => {
    seeded(8);
    for (let i = 0; i < 100; i++) expect((generateProblem(1, { vars: [2, 3], objective: ["min"] }).data.info as { sense: string }).sense).toBe("min");
    for (const vars of ["2", "3", "2,3,4"]) {
      const set = new Set<string>();
      for (let i = 0; i < 30; i++) set.add(__seed.generate(1, { subTool: "problem", options: { lpVars: vars } }).prompt);
      expect(set.size).toBe(30);
    }
  });
});
