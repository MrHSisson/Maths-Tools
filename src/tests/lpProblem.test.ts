// Formulating Linear Programmes, "Formulate a problem" Level 1 (lpProblem.ts, and the working in lpSolve.ts): every generated model has a non-empty region and a single optimal
// corner (checked by the meaning of each constraint, not by its coefficients), the wording carries every number and never names a variable, and the working is valid KaTeX
// and ends on the model. Seeded, so no chance failures.
import { describe, it, expect, vi, afterEach } from "vitest";
import katex from "katex";
import { fr, type Fr } from "../shared/decision/dim";
import { OPS, bestVertices, isTidy, vertices } from "../shared/decision/lp";
import { constraintOf, type LpProblemData } from "../shared/decision/lpGen";
import { decStr } from "../shared/decision/lpGenL23";
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
    expect(all).toContain("x \\ge 2y");
    expect(all).toContain("x \\ge 0,\\ y \\ge 0");
    const last = steps[steps.length - 1].lpView!.rows;
    expect(last.map((r) => r.t)).toEqual(expect.arrayContaining(["Maximise $P = 5x + 8y$", "subject to:", "2x + 3y \\le 60", "x \\ge 2y", "x \\ge 0,\\ y \\ge 0"]));
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

type PInfo = Extract<LpProblemData["info"], { kind: "problem" }>;

describe("hand-made models of the Level 2 and 3 kinds", () => {
  const vars = [{ sym: "x", noun: "hectares of wheat", integer: true }, { sym: "y", noun: "hectares of barley", integer: true }];
  it("a remainder: 40 hectares, wheat £4, barley £5, turf £3: P = 120 + x + 2y, x + y ≤ 40, 2x + 5y ≤ 80 from 5x + 8y + 3(40 − x − y) ≤ 200", () => {
    const parts: LpProblemData[] = [
      { kind: "total", level: 3, vars, op: "≤", spec: { t: "linear", coeffs: [fr(1), fr(1)], op: "≤", rhs: fr(40), kind: "bound" }, info: { kind: "total", N: 40 } },
      { kind: "resource", level: 3, vars, op: "≤", spec: { t: "linear", coeffs: [fr(2), fr(5)], op: "≤", rhs: fr(80), kind: "resource" }, info: { kind: "resource", per: [2, 5], amount: 80, unit: "hours", of: "labour", verb: "needs", label: "labour needed", topic: "labour", sing: ["hectare of wheat", "hectare of barley"] } },
    ];
    const rem = { T: 40, unit: "hectares", restNoun: "hectares of turf", restSing: "hectare of turf", rest: "turf", profits: [4, 5, 3], per: [5, 8, 3], amount: 200, resource: { topic: "labour", unit: "hours", verb: "needs", label: "labour needed", of: "labour" } };
    const d: LpProblemData = { kind: "problem", level: 3, vars, op: "≤", spec: parts[0].spec, info: { kind: "problem", sense: "max", name: "P", obj: [1, 2], konst: 120, parts, sing: ["hectare of wheat", "hectare of barley"], integers: true, rem } };
    const rows = solveLp(asProblem(d)).flatMap((s) => s.lpView!.rows.slice(-Math.max(1, s.lpView!.fresh!))).map((r) => r.t);
    for (const r of ["P = 4x + 5y + 3(40 - x - y)", "P = 4x + 5y + 120 - 3x - 3y", "P = 120 + x + 2y", "40 - x - y \\ge 0", "x + y \\le 40", "5x + 8y + 3(40 - x - y) \\le 200", "5x + 8y + 120 - 3x - 3y \\le 200", "120 + 2x + 5y \\le 200", "2x + 5y \\le 80"]) expect(rows).toContain(r);
    expect(rows.some((t) => t.includes("Maximise $P = 120 + x + 2y$"))).toBe(true);
  });
  it("a pack: buns in trays of 6, £2 an item and 5 minutes an item: P = 12x, 30x", () => {
    const v = [{ sym: "x", noun: "trays of buns", integer: true }, { sym: "y", noun: "loaves", integer: true }];
    const oven: LpProblemData = { kind: "resource", level: 2, vars: v, op: "≤", spec: { t: "linear", coeffs: [fr(30), fr(10)], op: "≤", rhs: fr(300), kind: "resource" }, info: { kind: "resource", per: [5, 10], packs: [6, 1], packText: ["tray of 6", ""], amount: 300, unit: "minutes", of: "oven time", verb: "uses", label: "oven time used", topic: "oven time", sing: ["bun", "loaf"] } };
    const other: LpProblemData = { kind: "resource", level: 2, vars: v, op: "≤", spec: { t: "linear", coeffs: [fr(6), fr(4)], op: "≤", rhs: fr(120), kind: "resource" }, info: { kind: "resource", per: [1, 4], packs: [6, 1], packText: ["tray of 6", ""], amount: 120, unit: "kg", of: "flour", verb: "uses", label: "flour used", topic: "flour", sing: ["bun", "loaf"] } };
    const d: LpProblemData = { kind: "problem", level: 2, vars: v, op: "≤", spec: oven.spec, info: { kind: "problem", sense: "max", name: "P", obj: [12, 7], itemObj: [2, 7], parts: [oven, other], sing: ["bun", "loaf"], integers: true, pack: { i: 0, k: 6, name: "tray", text: "tray of 6", item: "bun" } } };
    const text = solveLp(asProblem(d)).flatMap((s) => s.lpView!.rows.slice(-Math.max(1, s.lpView!.fresh!))).map((r) => r.t).join("\n");
    expect(text).toContain("$6 \\times 2 = 12$");
    expect(text).toContain("$6 \\times 5 = 30$");
    expect(text).toContain("P = 12x + 7y");
    expect(text).toContain("3x + y \\le 30");
  });
  it("a unit conversion: 5 hours against minutes per item is 300 minutes, shown as a step", () => {
    const v = [{ sym: "x", noun: "loaves", integer: true }, { sym: "y", noun: "cakes", integer: true }];
    const conv: LpProblemData = { kind: "resource", level: 2, vars: v, op: "≤", spec: { t: "linear", coeffs: [fr(10), fr(15)], op: "≤", rhs: fr(300), kind: "resource" }, info: { kind: "resource", per: [10, 15], amount: 300, unit: "minutes", of: "oven time", verb: "uses", label: "oven time used", topic: "oven time", sing: ["loaf", "cake"], conv: { n: 5, unit: "hours", factor: 60 } } };
    const text = solveLp(asProblem(conv)).flatMap((s) => s.lpView!.rows.slice(-Math.max(1, s.lpView!.fresh!))).map((r) => r.t).join("\n");
    expect(text).toContain("$5 \\times 60 = 300$ minutes.");
    expect(text).toContain("10x + 15y \\le 300");
  });
  it("a single-variable objective: N = y", () => {
    const v = [{ sym: "x", noun: "loaves", integer: true }, { sym: "y", noun: "cakes", integer: true }];
    const part: LpProblemData = { kind: "total", level: 2, vars: v, op: "≤", spec: { t: "linear", coeffs: [fr(1), fr(1)], op: "≤", rhs: fr(50), kind: "bound" }, info: { kind: "total", N: 50 } };
    const d: LpProblemData = { kind: "problem", level: 2, vars: v, op: "≤", spec: part.spec, info: { kind: "problem", sense: "max", name: "N", obj: [0, 1], parts: [part], sing: ["loaf", "cake"], single: 1 } };
    const text = solveLp(asProblem(d)).flatMap((s) => s.lpView!.rows.slice(-Math.max(1, s.lpView!.fresh!))).map((r) => r.t);
    expect(text).toContain("N = y");
  });
});

describe("a kind that is exactly a multiple of the others (substituted out)", () => {
  it("the model written in the letters only means the same as the full situation, and the wording says the relation", () => {
    seeded(777);
    let seen = 0;
    const forms = new Set<string>();
    let revSeen = 0;
    let withC = 0;
    for (let i = 0; i < 400 && seen < 60; i++) {
      const q = generateProblem(3, { vars: [2, 3], objective: ["max"], integers: true });
      const info = q.data.info as PInfo;
      const L = info.link;
      if (!L) continue;
      seen++;
      forms.add(L.form);
      const n = q.data.vars.length;
      expect(L.items).toHaveLength(n + 1);
      expect(q.prompt).toMatch(/must be exactly (twice |3 times |equal to |half of |one third of |\d+ (more|fewer) than )/);
      if (L.reverse) { expect(q.prompt).toMatch(new RegExp(`(half|one third) of the number of ${L.dep.plural}`)); revSeen++; }
      expect(q.prompt).toContain(L.dep.plural);
      expect(q.data.vars.map((v) => v.noun)).not.toContain(L.dep.plural);
      const c0 = L.c ?? 0;
      const konst = info.konst ?? 0;
      const dep = (pt: number[]): number => L.a * L.S.reduce((t, j) => t + pt[j], 0) + c0;
      const ptsOf = (k: number): number[][] => (k === 0 ? [[]] : ptsOf(k - 1).flatMap((q0) => [0, 1, 2, 5, 9, 14].map((v) => [...q0, v])));
      for (const pt of ptsOf(n)) {
        const full = [...pt, dep(pt)];
        // the objective, with the relation put in (and the constant it leaves)
        expect(L.profits.reduce((t, pr, k) => t + pr * full[k], 0)).toBe(info.obj.reduce((t, c, k) => t + c * pt[k], 0) + konst);
        // the full situation: every resource limit and the fixed kind not negative; the model: the substituted limits (and, with "fewer than", the lower limit)
        const fullOk = dep(pt) >= 0 && L.resources.every((r) => r.per.reduce((t, a, k) => t + a * full[k], 0) <= r.amount);
        const modelParts = info.parts.slice(0, L.resources.length + (c0 < 0 ? 1 : 0));
        expect(modelParts.every((part) => constraintOf(part.spec).holds(pt.map((v) => fr(v))))).toBe(fullOk);
      }
      if (c0 !== 0) withC++;
      for (const st of solveLp({ kind: "problem", level: 3, lp: q.data, prompt: "", answer: { text: "" }, matrixMode: "off" } as never)) {
        for (const r of st.lpView!.rows) if (r.k === "tex" || r.k === "result") expect(() => katex.renderToString(r.t, { throwOnError: true })).not.toThrow();
      }
    }
    expect(seen).toBeGreaterThan(10);
    expect(forms.size).toBeGreaterThanOrEqual(2);
    expect(revSeen).toBeGreaterThan(0);
    expect(withC).toBeGreaterThan(0);
  });
});

describe("random draws (seeded)", () => {
  for (const level of [1, 2, 3]) for (const n of [2, 3, 4]) {
    it(`Level ${level}, ${n} variables, both objectives: a non-empty region, a single best corner, wording that names no variable, working that renders`, () => {
      seeded(6100 + n + level * 10);
      const senses = new Set<string>(), seen = new Set<string>();
      let strictSeen = 0;
      for (let i = 0; i < 110; i++) {
        const q = generateProblem(level, { vars: [n], objective: ["max", "min"], integers: true, table: i % 4 === 3 });
        const d = q.data;
        const info = d.info as PInfo;
        senses.add(info.sense);
        const kinds = info.parts.map((p) => p.kind);
        if (info.rem) seen.add("rem"); if (info.link) seen.add("link"); if (info.pack) seen.add("pack"); if (info.single !== undefined) seen.add("single"); if (info.price) seen.add("price");
        if (kinds.includes("eitherOr")) seen.add("eitherOr"); if (kinds.includes("blend")) seen.add("blend"); if (info.parts.some((p) => p.info.kind === "resource" && p.info.conv)) seen.add("conv");
        if (kinds.includes("decimal")) seen.add("decimal"); if (kinds.includes("percent")) seen.add("percent"); if (info.parts.some((p) => p.info.kind === "ratio" && p.op === "=")) seen.add("half");
        const nVars = d.vars.length;
        expect(nVars).toBe(info.rem ? Math.min(n, 3) : n);
        expect(info.parts.length).toBeGreaterThanOrEqual(2);
        const cons = info.parts.map((p) => constraintOf(p.spec));
        for (const c of cons) { expect(isTidy(c)).toBe(true); expect(c.rhs[1]).toBe(1); expect(c.op).toMatch(level === 1 ? /^[≤≥<>]$/ : /^[≤≥<>=]$/); }
        const strict = cons.some((c) => c.op === "<" || c.op === ">");
        if (strict) { strictSeen++; expect(info.integers).toBe(true); }
        if (level >= 2 && !info.parts.some((p) => p.kind === "blend")) expect(info.integers).toBe(true);
        expect(OPS).toContain(d.op);

        // the model: a non-empty region and a single best corner (exact), the best corner is a plan that does something
        const obj = info.obj.map((k) => fr(k));
        const vs = vertices(cons, nVars);
        expect(vs.length).toBeGreaterThan(0);
        const best = bestVertices(vs, obj, info.sense)!;
        expect(best.at).toHaveLength(1);
        expect(best.at[0].some((f) => f[0] !== 0)).toBe(true);
        // independent: by meaning (each part's `holds`), no lattice point beats the best corner, and the best corner satisfies every sentence it can (strict ones only in the closure)
        if (!strict) expect(info.parts.every((p) => constraintOf(p.spec).holds(best.at[0]))).toBe(true);
        const val = (p: Fr[]): number => p.reduce((s, f, k) => s + (f[0] / f[1]) * info.obj[k], 0);
        const target = best.value[0] / best.value[1];
        const R = LATTICE[nVars];
        const p = new Array<number>(nVars).fill(0);
        const walk = (k: number): void => {
          if (k === nVars) {
            const f = p.map((v) => fr(v));
            if (info.parts.every((part) => constraintOf(part.spec).holds(f))) expect(info.sense === "max" ? val(f) <= target + 1e-9 : val(f) >= target - 1e-9).toBe(true);
            return;
          }
          for (let v = 0; v <= R; v++) { p[k] = v; walk(k + 1); }
        };
        if (i < 8) walk(0);

        // the wording: no variable letter (the student assigns them), every number of the model is there (as sentences, or in the table)
        expect(q.prompt).not.toMatch(/\$[wxyz]\$/);
        expect(q.prompt).not.toMatch(/undefined|NaN|\[object|\$\{/);
        if (!info.showTable) {
          if (info.single !== undefined) { /* the aim is a single letter: no profits */ }
          else if (info.rem) for (const pr of info.rem.profits) expect(q.prompt).toContain(`£${pr}`);
          else if (info.link) for (const pr of info.link.profits) expect(q.prompt).toContain(`£${pr}`);
          else if (info.price && info.cost) for (let k = 0; k < nVars; k++) expect(q.prompt).toContain(`£${info.price[k]} and costs £${info.cost[k]}`);
          else for (const v of info.itemObj ?? info.obj) expect(q.prompt).toContain(`£${v}`);
        } else expect(info.table!.rows.length).toBe(nVars + 1);
        if (info.parts.some((part) => part.kind === "blend")) expect(q.prompt).toContain("minimise the cost of the mix");
        else if (info.single !== undefined) expect(q.prompt).toContain("as many");
        else expect(q.prompt).toContain(info.sense === "max" ? "maximise the profit" : "minimise the cost");
        if (info.integers) expect(q.prompt).toMatch(/Only whole numbers of (items can be made|hectares can be used|square metres can be used)\./);
        else expect(q.prompt).not.toContain("Only whole numbers");
        if (!info.showTable && !info.rem && !info.link) for (const part of info.parts) {
          const pi = part.info;
          if (pi.kind === "resource") { for (const a of pi.per) expect(inPrompt(q.prompt, a)).toBe(true); expect(inPrompt(q.prompt, pi.conv ? pi.conv.n : pi.amount)).toBe(true); }
          else if (pi.kind === "difference") expect(inPrompt(q.prompt, pi.k)).toBe(true);
          else if (pi.kind === "bound" || pi.kind === "total") expect(inPrompt(q.prompt, pi.N)).toBe(true);
          else if (pi.kind === "percent") expect(q.prompt).toContain(`${pi.p}%`);
          else if (pi.kind === "decimal") { for (const v of pi.a) expect(q.prompt).toContain(decStr(fr(v, pi.den))); expect(inPrompt(q.prompt, pi.amount)).toBe(true); }
          else if (pi.kind === "blend") for (const f of pi.contents) expect(q.prompt).toContain(`${decStr(fr(f[0] * 100, f[1]))}%`);
          else if (pi.kind === "eitherOr") for (const a of pi.caps) expect(q.prompt).toMatch(pi.given === "perItem" ? /minutes/ : new RegExp(`(?<!\\d)${a}(?!\\d)`));
        }
        expect(q.answerText).toContain(info.sense === "max" ? "Maximise" : "Minimise");
        expect(q.answerText).toContain(`${info.name} = `);

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
        if (info.integers) expect(last.some((t) => t.includes("integers"))).toBe(true);
        if (info.price) expect(steps[steps.length - 1].caption).toContain("using the selling prices");
        expect(steps.slice(0, -1).some((st) => st.caption.startsWith("Common slips"))).toBe(false);
      }
      expect([...senses].sort()).toEqual(["max", "min"]);
      if (level === 1) expect(strictSeen).toBeGreaterThan(0);
      if (level >= 2) expect(strictSeen).toBeGreaterThan(0);
      if (level === 2) for (const k of ["price", "decimal", "percent"]) expect(seen.has(k)).toBe(true);
      if (level === 3) for (const k of ["blend", "eitherOr"]) expect(seen.has(k)).toBe(true);
    }, 300_000);
  }

  it("the rarer kinds turn up: single-variable objective, pack, unit conversion (Level 2); half, remainder (Level 3)", () => {
    seeded(1234);
    const seen = new Set<string>();
    for (let i = 0; i < 600; i++) {
      const level = i % 2 === 0 ? 2 : 3;
      const info = generateProblem(level, { vars: [2, 3], objective: ["max"], integers: true, single: true }).data.info as PInfo;
      if (info.single !== undefined) seen.add("single"); if (info.pack) seen.add("pack");
      if (info.parts.some((p) => p.info.kind === "resource" && p.info.conv)) seen.add("conv");
      if (info.parts.some((p) => p.info.kind === "ratio" && p.op === "=")) seen.add("half");
      if (info.rem) seen.add("rem");
      if (info.link) seen.add("link");
    }
    expect([...seen].sort()).toEqual(["conv", "half", "link", "pack", "rem", "single"]);
  }, 120_000);
  it("Leave Out: with no integers there are no strict inequalities at Levels 2 and 3", () => {
    seeded(55);
    for (let i = 0; i < 150; i++) {
      const level = 2 + (i % 2);
      const d = generateProblem(level, { vars: [2, 3], objective: ["max"], integers: false }).data;
      expect((d.info as PInfo).integers).toBeFalsy();
      for (const part of (d.info as PInfo).parts) expect(["<", ">"]).not.toContain(part.op);
    }
  });
  it("Objective is respected, the table is only a different way of showing the same numbers, and a worksheet of 30 problems is 30 different problems", () => {
    seeded(8);
    for (let i = 0; i < 100; i++) expect((generateProblem(1, { vars: [2, 3], objective: ["min"] }).data.info as { sense: string }).sense).toBe("min");
    seeded(9);
    const a = generateProblem(2, { vars: [3], objective: ["max"], integers: true, table: false });
    seeded(9);
    const b = generateProblem(2, { vars: [3], objective: ["max"], integers: true, table: true });
    expect(b.answerText).toBe(a.answerText);
    for (const level of [1, 2, 3]) for (const vars of ["2", "3", "2,3,4"]) {
      const set = new Set<string>();
      for (let i = 0; i < 30; i++) set.add(__seed.generate(level, { subTool: "problem", options: { lpVars: vars } }).prompt);
      expect(set.size).toBe(30);
    }
  });
});

describe("audit notes: limits, situations, display toggles", () => {
  it("three resource limits: a florist's roses, tulips and sunflowers, one limit each", () => {
    seeded(31);
    let seen = 0;
    for (let i = 0; i < 60; i++) {
      const q = generateProblem(2, { vars: [3], objective: ["max"], integers: true, limits: [3] });
      const info = q.data.info as PInfo;
      const res = info.parts.filter((p) => p.info.kind === "resource");
      if (res.length < 3 || !q.prompt.includes("florist")) continue;
      seen++;
      expect(q.prompt).toMatch(/roses/);
      expect(q.prompt).toMatch(/tulips/);
      expect(q.prompt).toMatch(/sunflowers/);
      expect(res.length).toBeGreaterThanOrEqual(3);
    }
    expect(seen).toBeGreaterThan(10);
  });
  it("the Situations option picks the model: a remainder, a relation, and the question says which letters to use", () => {
    seeded(32);
    for (let i = 0; i < 25; i++) {
      const r = generateProblem(3, { vars: [2], objective: ["max"], integers: true, situations: ["remainder"] });
      expect((r.data.info as PInfo).rem).toBeTruthy();
      expect(r.prompt).toMatch(/using only x, y|using only x and y/);
      const l = generateProblem(3, { vars: [2, 3], objective: ["max"], integers: true, situations: ["relation"] });
      expect((l.data.info as PInfo).link).toBeTruthy();
      expect(l.prompt).toMatch(/using only x and y|using only x, y and z/);
      const b = generateProblem(3, { vars: [2], objective: ["max"], integers: true, situations: ["blend"] });
      expect(b.prompt).toContain("minimise the cost of the mix");
    }
  });
  it("the display toggles take out the number check and the common slips, and nothing else", () => {
    seeded(33);
    for (const level of [1, 2, 3]) for (let i = 0; i < 12; i++) {
      for (const sub of ["constraint", "problem"] as const) {
        const q = sub === "problem" ? generateProblem(level, { vars: [2], objective: ["max"], integers: true }) : { data: __seed.generate(level, { subTool: "constraint", options: {} }).lp! };
        const data = q.data as LpProblemData;
        const all = solveLp({ kind: "x", level, lp: { ...data }, prompt: "", answer: { text: "" }, matrixMode: "off" } as DecisionProblem);
        const none = solveLp({ kind: "x", level, lp: { ...data, view: { slips: false, checks: false } }, prompt: "", answer: { text: "" }, matrixMode: "off" } as DecisionProblem);
        expect(none.some((st) => st.phase === "Check" || st.phase === "Common slip" || st.phase === "Common slips")).toBe(false);
        expect(none.length).toBe(all.filter((st) => st.phase !== "Check" && st.phase !== "Common slip" && st.phase !== "Common slips").length);
        expect(none[none.length - 1].lpView!.rows.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("the single-variable aim is off unless asked for", () => {
  it("never drawn by default, drawn when included", () => {
    seeded(41);
    let on = 0;
    for (let i = 0; i < 300; i++) {
      for (const level of [2, 3]) {
        expect((generateProblem(level, { vars: [2], objective: ["max"], integers: true }).data.info as PInfo).single).toBeUndefined();
        if ((generateProblem(level, { vars: [2], objective: ["max"], integers: true, single: true }).data.info as PInfo).single !== undefined) on++;
      }
    }
    expect(on).toBeGreaterThan(0);
  }, 120_000);
});
