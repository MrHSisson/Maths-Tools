// Formulating Linear Programmes, "Write a constraint" Levels 2 and 3 (lpGenL23.ts, and the working in lpSolve.ts): the brief's worked examples reproduced line by line,
// and seeded draws that check the tidy form, the independent meaning (`holds`), the wording, the working and the slip. Seeded, so no chance failures.
import { describe, it, expect, vi, afterEach } from "vitest";
import katex from "katex";
import { fr, type Fr } from "../shared/decision/dim";
import { gcdInt, intercept, isStrict, isTidy, linear, tidyHolds, type Op } from "../shared/decision/lp";
import { constraintOf, constraintText, opWord, type LpProblemData } from "../shared/decision/lpGen";
import { decStr, generateConstraint, type LpGenOptionsFull } from "../shared/decision/lpGenL23";
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
const F = (n: number, d = 1) => fr(n, d);
const asProblem = (data: LpProblemData, prompt = "", answerText = ""): DecisionProblem => ({ kind: data.kind, level: data.level, lp: data, prompt, answer: { text: answerText }, matrixMode: "off" });
const V = (...syms: string[]) => syms.map((sym) => ({ sym, noun: sym === "x" ? "loaves" : sym === "y" ? "cakes" : sym === "z" ? "pies" : "buns", integer: true }));
const newRows = (data: LpProblemData): string[] => solveLp(asProblem(data)).flatMap((s) => s.lpView!.rows.slice(-s.lpView!.fresh!)).map((r) => r.t);
const ALL: LpGenOptionsFull = { vars: [2], styles: [], pctOf: ["one", "combined", "total", "morless"], capGiven: "most", method: "fractions" };

describe("worked examples (brief 2, 4 and 4.6)", () => {
  it("x at least 40% of the total, three variables: 3x − 2y − 2z ≥ 0, line by line", () => {
    const d: LpProblemData = { kind: "percent", level: 2, vars: V("x", "y", "z"), op: "≥", spec: { t: "rel", n: 3, a: [0], b: [0, 1, 2], m: F(2, 5), op: "≥", kind: "percent" }, info: { kind: "percent", form: "total", a: [0], b: [0, 1, 2], m: F(2, 5), p: 40 } };
    const rows = newRows(d);
    for (const r of ["x \\ge 0.4(x + y + z)", "x \\ge 0.4x + 0.4y + 0.4z", "0.6x - 0.4y - 0.4z \\ge 0", "3x - 2y - 2z \\ge 0"]) expect(rows).toContain(r);
  });
  it("x is 20% more than y: 5x − 6y = 0 (1.2, multiplied by 5)", () => {
    const d: LpProblemData = { kind: "percent", level: 2, vars: V("x", "y"), op: "=", spec: { t: "rel", n: 2, a: [0], b: [1], m: F(6, 5), op: "=", kind: "percent" }, info: { kind: "percent", form: "more", a: [0], b: [1], m: F(6, 5), p: 20 } };
    const rows = newRows(d);
    for (const r of ["x = 1.2y", "x - 1.2y = 0", "5x - 6y = 0"]) expect(rows).toContain(r);
  });
  it("the ratio of x to y is at least 2 : 3: 3x − 2y ≥ 0", () => {
    const d: LpProblemData = { kind: "ratio", level: 2, vars: V("x", "y"), op: "≥", spec: { t: "rel", n: 2, a: [0], b: [1], m: F(2, 3), op: "≥", kind: "ratio" }, info: { kind: "ratio", form: "ratio", a: [0], b: [1], m: F(2, 3) } };
    const rows = newRows(d);
    for (const r of ["\\frac{x}{y} \\ge \\frac{2}{3}", "3x \\ge 2y", "3x - 2y \\ge 0"]) expect(rows).toContain(r);
  });
  it("each plant at least one third of the total: 2x − y − z ≥ 0 (three plants)", () => {
    const d: LpProblemData = { kind: "ratio", level: 2, vars: V("x", "y", "z"), op: "≥", spec: { t: "rel", n: 3, a: [0], b: [0, 1, 2], m: F(1, 3), op: "≥", kind: "ratio" }, info: { kind: "ratio", form: "share", a: [0], b: [0, 1, 2], m: F(1, 3) } };
    const rows = newRows(d);
    for (const r of ["x \\ge \\frac{1}{3}(x + y + z)", "\\frac{2}{3}x - \\frac{1}{3}y - \\frac{1}{3}z \\ge 0", "2x - y - z \\ge 0"]) expect(rows).toContain(r);
  });
  it("at least one adult to every two children (adults x + y, children z): 2x + 2y − z ≥ 0", () => {
    const d: LpProblemData = { kind: "ratio", level: 2, vars: V("x", "y", "z"), op: "≥", spec: { t: "rel", n: 3, a: [0, 1], b: [2], m: F(1, 2), op: "≥", kind: "ratio" }, info: { kind: "ratio", form: "every", a: [0, 1], b: [2], m: F(1, 2) } };
    expect(newRows(d)).toContain("2x + 2y - z \\ge 0");
  });
  it("decimal amounts: 0.8x + 0.6y ≤ 3000 gives 4x + 3y ≤ 15 000", () => {
    const d: LpProblemData = {
      kind: "decimal", level: 2, vars: V("x", "y"), op: "≤", spec: { t: "linear", coeffs: [F(4, 5), F(3, 5)], op: "≤", rhs: F(3000), kind: "resource" },
      slip: { spec: { t: "linear", coeffs: [F(4), F(3)], op: "≤", rhs: F(3000), kind: "resource" }, what: "multiplying the coefficients but not the right-hand side" },
      info: { kind: "decimal", a: [4, 3], den: 5, amount: 3000, unit: "kg", of: "oats", verb: "uses", label: "oats used", topic: "oats", sing: ["loaf", "cake"] },
    };
    const rows = newRows(d);
    expect(rows).toContain("0.8x + 0.6y \\le 3{,}000");
    expect(rows).toContain("4x + 3y \\le 15{,}000");
    expect(rows.join("\n")).toContain("$x \\le 3{,}750$");
    const last = solveLp(asProblem(d)).pop()!.lpView!.rows.find((r) => r.k === "slip")!.t;
    expect(last).toContain("4x + 3y \\le 3{,}000");
  });
  it("blends: oil 50% and 20% olive, at least 30%: 2x − y ≥ 0, and a mix of 10 of each gives 35%", () => {
    const d: LpProblemData = { kind: "blend", level: 3, vars: V("x", "y"), op: "≥", spec: { t: "blend", contents: [F(1, 2), F(1, 5)], share: F(3, 10), op: "≥" }, info: { kind: "blend", contents: [F(1, 2), F(1, 5)], share: F(3, 10), comp: "olive oil", invest: false }, point: [10, 10] };
    const rows = newRows(d);
    for (const r of ["0.5x + 0.2y \\ge 0.3(x + y)", "0.5x + 0.2y \\ge 0.3x + 0.3y", "0.2x - 0.1y \\ge 0", "2x - y \\ge 0"]) expect(rows).toContain(r);
    expect(constraintOf(d.spec).holds([fr(10), fr(10)])).toBe(true);
  });
  it("a bond paying 5% and a share paying 10%, at least 8% overall: 3x − 2y ≤ 0 (−0.03x + 0.02y ≥ 0, then ×−1)", () => {
    const d: LpProblemData = { kind: "blend", level: 3, vars: V("x", "y"), op: "≥", spec: { t: "blend", contents: [F(1, 20), F(1, 10)], share: F(2, 25), op: "≥" }, info: { kind: "blend", contents: [F(1, 20), F(1, 10)], share: F(2, 25), comp: "interest", invest: true } };
    const rows = newRows(d);
    for (const r of ["-0.03x + 0.02y \\ge 0", "-3x + 2y \\ge 0", "3x - 2y \\le 0"]) expect(rows).toContain(r);
  });
  it("either-or: 60 loaves or 45 cakes: x/60 + y/45 ≤ 1, ×180, 3x + 4y ≤ 180, ends of the line 60 and 45; with Common Units and Both", () => {
    const mk = (method: "fractions" | "units" | "both"): LpProblemData => ({ kind: "eitherOr", level: 3, vars: V("x", "y"), op: "≤", spec: { t: "either", caps: [F(60), F(45)], amount: F(1), op: "≤" }, info: { kind: "eitherOr", caps: [60, 45], given: "most", T: 1, method } });
    const f = newRows(mk("fractions")).join("\n");
    expect(f).toContain("\\frac{x}{60} + \\frac{y}{45} \\le 1");
    expect(f).toContain("3x + 4y \\le 180");
    expect(f).toContain("$x \\le 60$");
    expect(f).toContain("$y \\le 45$");
    const u = newRows(mk("units")).join("\n");
    expect(u).toContain("180 \\div 60 = 3");
    expect(u).not.toContain("\\frac{x}{60}");
    const both = newRows(mk("both")).join("\n");
    expect(both).toContain("\\frac{x}{60}");
    expect(both).toContain("180 \\div 45 = 4");
  });
  it("either-or: rate and time, 60 an hour or 45 an hour for 8 hours: 3x + 4y ≤ 1440, intercepts 480 and 360", () => {
    const d: LpProblemData = { kind: "eitherOr", level: 3, vars: V("x", "y"), op: "≤", spec: { t: "either", caps: [F(60), F(45)], amount: F(8), op: "≤" }, info: { kind: "eitherOr", caps: [60, 45], given: "rate", T: 8, method: "fractions" } };
    const text = newRows(d).join("\n");
    expect(text).toContain("\\frac{x}{60} + \\frac{y}{45} \\le 8");
    expect(text).toContain("3x + 4y \\le 1{,}440");
    expect(text).toContain("$x \\le 480$");
    expect(text).toContain("$y \\le 360$");
  });
  it("either-or: time per item, 1 minute and 4/3 minutes, 8 hours: x + (4/3)y ≤ 480, ×3, 3x + 4y ≤ 1440 (hours changed to minutes)", () => {
    const d: LpProblemData = { kind: "eitherOr", level: 3, vars: V("x", "y"), op: "≤", spec: { t: "either", caps: [F(60), F(45)], amount: F(8), op: "≤" }, info: { kind: "eitherOr", caps: [60, 45], given: "perItem", T: 8, method: "fractions" } };
    const text = newRows(d).join("\n");
    expect(text).toContain("8 \\times 60 = 480");
    expect(text).toContain("x + \\frac{4}{3}y \\le 480");
    expect(text).toContain("3x + 4y \\le 1{,}440");
  });
  it("either-or: three products 60, 45, 36: 3x + 4y + 5z ≤ 180; a requirement x/60 + y/45 ≥ 1 gives 3x + 4y ≥ 180", () => {
    const three: LpProblemData = { kind: "eitherOr", level: 3, vars: V("x", "y", "z"), op: "≤", spec: { t: "either", caps: [F(60), F(45), F(36)], amount: F(1), op: "≤" }, info: { kind: "eitherOr", caps: [60, 45, 36], given: "most", T: 1, method: "fractions" } };
    expect(newRows(three)).toContain("3x + 4y + 5z \\le 180");
    const req: LpProblemData = { kind: "eitherOr", level: 3, vars: V("x", "y"), op: "≥", spec: { t: "either", caps: [F(60), F(45)], amount: F(1), op: "≥" }, info: { kind: "eitherOr", caps: [60, 45], given: "requirement", T: 1, method: "fractions" } };
    expect(newRows(req)).toContain("3x + 4y \\ge 180");
  });
  it("every slip of brief 4.5 is a different constraint that the intercepts expose", () => {
    const right = constraintOf({ t: "either", caps: [F(60), F(45)], amount: F(1), op: "≤" });
    expect(intercept(right, 0)).toEqual(F(60));
    expect(intercept(right, 1)).toEqual(F(45));
    for (const wrong of [linear([F(60), F(45)], "≤", F(1), "capacity"), linear([F(4), F(3)], "≤", F(180), "capacity"), linear([F(1), F(1)], "≤", F(105), "capacity"), linear([F(3), F(4)], "≤", F(1), "capacity")]) {
      const w = constraintOf({ t: "linear", coeffs: wrong.coeffs, op: wrong.op, rhs: wrong.rhs, kind: "capacity" });
      expect(intercept(w, 0)).not.toEqual(F(60));
    }
  });
  it("rate, time-per-item and most-you-could-make forms agree for the same a, b, T (the same tidy constraint)", () => {
    seeded(3);
    for (let i = 0; i < 300; i++) {
      const pool = [12, 15, 20, 24, 30, 40, 45, 60];
      const a = pool[Math.floor(Math.random() * pool.length)];
      let b = pool[Math.floor(Math.random() * pool.length)];
      if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      const T = [2, 3, 4, 5, 8, 10][Math.floor(Math.random() * 6)];
      const rate = constraintOf({ t: "either", caps: [F(a), F(b)], amount: F(T), op: "≤" });
      const perItem = constraintOf({ t: "linear", coeffs: [F(60, a), F(60, b)], op: "≤", rhs: F(60 * T), kind: "capacity" });
      expect(perItem.coeffs).toEqual(rate.coeffs);
      expect(perItem.rhs).toEqual(rate.rhs);
      expect(perItem.op).toBe(rate.op);
      const most = constraintOf({ t: "either", caps: [F(a), F(b)], amount: F(1), op: "≤" });
      expect(most.coeffs).toEqual(rate.coeffs);
      expect(rate.rhs[0]).toBe(T * most.rhs[0]);
    }
  });
});

const BOUND = (level: number, d: LpProblemData): number => (d.kind === "eitherOr" ? (d.vars.length === 4 ? 12 : 9) : 20) + 0 * level;

describe("random draws, Levels 2 and 3 (seeded)", () => {
  for (const level of [2, 3]) {
    for (const n of [2, 3, 4]) {
      it(`Level ${level}, ${n} variables, every style: tidy, meaning agrees with the coefficients, wording carries the numbers, working renders and ends on the answer`, () => {
        seeded(9100 + level * 10 + n);
        const styles = level === 2 ? ["percent", "ratio", "decimal"] : ["blend", "eitherOr"];
        const kinds = new Set<string>(), forms = new Set<string>(), ops = new Set<Op>(), givens = new Set<string>();
        let withPoint = 0, needPoint = 0;
        for (let i = 0; i < 240; i++) {
          const q = generateConstraint(level, { ...ALL, vars: [n], styles, capGiven: level === 3 ? ["most", "rate", "perItem", "requirement"][i % 4] : "most", method: (["fractions", "units", "both"] as const)[i % 3] });
          const d = q.data;
          const c = constraintOf(d.spec);
          kinds.add(d.kind); ops.add(d.op);
          if (d.info.kind === "percent" || d.info.kind === "ratio") forms.add(`${d.info.kind}:${d.info.form}`);
          if (d.info.kind === "eitherOr") givens.add(d.info.given);

          // the tidy form, within the level's bound
          expect(isTidy(c)).toBe(true);
          expect(c.coeffs.reduce((g, f) => gcdInt(g, f[0]), 0)).toBe(1);
          expect(Math.max(...c.coeffs.map((f) => Math.abs(f[0])))).toBeLessThanOrEqual(BOUND(level, d));
          expect(c.rhs[1]).toBe(1);
          if (d.kind === "eitherOr") expect(Math.abs(c.rhs[0])).toBeLessThanOrEqual(1500);
          expect(q.answerText).toBe(constraintText(c, d.vars));
          expect(d.vars).toHaveLength(n);

          // the meaning (from the sentence's own numbers) agrees with the tidy coefficients: random points, and the ends of the line
          const R = Math.max(20, Math.min(400, 2 * Math.abs(c.rhs[0])));
          for (let t = 0; t < 40; t++) {
            const p: Fr[] = Array.from({ length: n }, () => fr(Math.floor(Math.random() * R)));
            expect(c.holds(p)).toBe(tidyHolds(c, p));
          }
          for (let k = 0; k < n; k++) {
            const x = intercept(c, k);
            if (!x || x[1] !== 1) continue;
            const e: Fr[] = Array.from({ length: n }, (_, j) => (j === k ? x : fr(0)));
            expect(c.holds(e)).toBe(tidyHolds(c, e));
            // at the boundary a strict operator is false and a non-strict one true
            if (d.kind === "eitherOr") expect(c.holds(e)).toBe(!isStrict(d.op));
          }

          // wording: no unreplaced slots, every variable named, every number of the sentence present
          expect(q.prompt).not.toMatch(/undefined|NaN|\[object|\$\{|\{[A-Za-z_]+\}/);
          for (const v of d.vars) expect(q.prompt).toContain(`$${v.sym}$`);
          const info = d.info;
          if (info.kind === "percent") { expect(q.prompt).toContain(`${info.p}%`); expect(q.prompt).toContain(opWord(d.op, true)); }
          else if (info.kind === "ratio") { expect(q.prompt).toContain(opWord(d.op, true)); if (info.form === "ratio") expect(q.prompt).toContain(`${info.m[0]} : ${info.m[1]}`); }
          else if (info.kind === "decimal") {
            for (const v of info.a) expect(q.prompt).toContain(decStr(fr(v, info.den)));
            expect(q.prompt).toContain(`${info.amount} ${info.unit}`);
            expect(q.prompt).toContain(opWord(d.op, false));
          } else if (info.kind === "blend") {
            for (const f of info.contents) expect(q.prompt).toContain(`${decStr(fr(f[0] * 100, f[1]))}%`);
            expect(q.prompt).toContain(`${decStr(fr(info.share[0] * 100, info.share[1]))}%`);
            expect(q.prompt).toContain(opWord(d.op, false));
          } else if (info.kind === "eitherOr") {
            if (info.given === "requirement") for (const a of info.caps) expect(q.prompt).toContain(`\\frac{1}{${a}}`);
            else if (info.given === "perItem") for (const a of info.caps) expect(q.prompt).toMatch(new RegExp(`takes (${60 / a}|\\$\\\\frac\\{${fr(60, a)[0]}\\}\\{${fr(60, a)[1]}\\}\\$) minutes`));
            else for (const a of info.caps) expect(q.prompt).toMatch(new RegExp(`(?<!\\d)${a}(?!\\d)`));
            if (info.given === "rate" || info.given === "perItem") expect(q.prompt).toContain(`${info.T} hours`);
            expect(info.caps.length).toBe(n);
            expect(new Set(info.caps).size).toBe(n);
          }

          // the slip really is a different constraint, and the check shows it
          if (d.slip) {
            const s = constraintOf(d.slip.spec);
            expect(s.coeffs.map((f) => f[0] / f[1]).join() + s.op + s.rhs[0] / s.rhs[1]).not.toBe(c.coeffs.map((f) => f[0] / f[1]).join() + c.op + c.rhs[0] / c.rhs[1]);
            if (d.kind === "percent" || d.kind === "ratio" || d.kind === "blend") {
              needPoint++;
              if (d.point) {
                withPoint++;
                const p = d.point.map((v) => fr(v));
                // the point fits the words and the slip refuses it, or the words rule it out and the slip allows it
                const fits = d.pointFits !== false;
                expect(c.holds(p)).toBe(fits);
                expect(s.holds(p)).toBe(!fits);
              }
            }
          }

          // the working: valid KaTeX throughout, no \text, ends on the answer, the last line of working is the answer
          const steps = solveLp(asProblem(d, q.prompt, q.answerText));
          for (const st of steps) {
            expect(st.caption.length).toBeGreaterThan(0);
            for (const r of st.lpView!.rows) {
              expect(r.t).not.toContain("\\text");
              expect(r.t).not.toMatch(/undefined|NaN|\[object/);
              const segs = r.k === "tex" || r.k === "result" ? [r.t] : r.t.split(/(\$[^$]+\$)/g).filter((_, k) => k % 2 === 1).map((x) => x.slice(1, -1));
              for (const tex of segs) expect(() => katex.renderToString(tex, { throwOnError: true })).not.toThrow();
            }
          }
          const rows = steps[steps.length - 1].lpView!.rows;
          const result = rows.find((r) => r.k === "result")!.t;
          expect(result).toBe(constraintTex(c, d.vars.map((v) => v.sym)));
          const texRows = rows.filter((r) => r.k === "tex").map((r) => r.t);
          // working that ends on a line of TeX ends on the tidy constraint (either-or by common units writes it as its last tex row too)
          expect(texRows[texRows.length - 1]).toBe(result);
          expect(steps.slice(0, -1).some((st) => st.lpView!.rows.some((r) => r.k === "slip"))).toBe(false);
          if (d.slip) expect(rows.some((r) => r.k === "slip")).toBe(true);
        }
        if (level === 2) {
          expect([...kinds].sort()).toEqual(["decimal", "percent", "ratio"]);
          for (const f of ["percent:one", "percent:total", "percent:more", "percent:less", "ratio:ratio", "ratio:every", "ratio:share"]) expect(forms.has(f)).toBe(true);
          if (n >= 3) expect(forms.has("percent:combined")).toBe(true);
          else expect(forms.has("percent:combined")).toBe(false);
          expect(ops.size).toBe(5);
          expect(withPoint / needPoint).toBeGreaterThan(0.97);
        } else {
          expect([...kinds].sort()).toEqual(["blend", "eitherOr"]);
          expect([...givens].sort()).toEqual(["most", "perItem", "rate", "requirement"]);
          expect(withPoint / needPoint).toBeGreaterThan(0.97);
        }
      }, 120_000);
    }
  }

  it("Percentages Of is respected, and the tool's Level 2 and 3 defaults give questions", () => {
    seeded(21);
    for (let i = 0; i < 200; i++) {
      const q = generateConstraint(2, { ...ALL, vars: [3], styles: ["percent"], pctOf: ["total"] });
      expect(q.data.info.kind === "percent" && q.data.info.form).toBe("total");
    }
    for (const level of [2, 3]) {
      const set = new Set<string>();
      for (let i = 0; i < 30; i++) set.add(__seed.generate(level, { subTool: "constraint", options: {} }).prompt);
      expect(set.size).toBe(30);
    }
  });
  it("Capacity Method changes only the working, never the numbers", () => {
    for (const method of ["fractions", "units", "both"] as const) {
      seeded(33);
      const q = generateConstraint(3, { ...ALL, vars: [3], styles: ["eitherOr"], capGiven: "rate", method });
      seeded(33);
      const base = generateConstraint(3, { ...ALL, vars: [3], styles: ["eitherOr"], capGiven: "rate", method: "fractions" });
      expect(q.prompt).toBe(base.prompt);
      expect(q.answerText).toBe(base.answerText);
    }
  });
});
