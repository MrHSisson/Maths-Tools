// Linear Programming, the level design: every level has its own questions in both tools. A higher level never draws a lower level's question, and a lower level never draws a
// higher level's: Formulating by the kinds of constraint and the features of a problem, the Simplex tool by the number of variables, the wording, the form and the tableau.
import { describe, it, expect } from "vitest";
import { generateConstraint } from "../shared/decision/lpGenL23";
import { generateProblem } from "../shared/decision/lpProblem";
import { generateSimplex, type SxKind, type SxOptions } from "../shared/decision/lpSimplexGen";
import { runSpec } from "../shared/decision/lpSimplex";
import { wholeAnalysis } from "../shared/decision/lpSimplexWhole";
import type { LpProblemData } from "../shared/decision/lpGen";

type PInfo = Extract<LpProblemData["info"], { kind: "problem" }>;

describe("Formulating: Write a constraint", () => {
  it("Level 1 is resource use and comparisons; Level 2 percentages, ratios, shares and decimal or fractional amounts; Level 3 blends and either-or limits worked out from the capacity", () => {
    const L1 = new Set(["resource", "multiple", "difference", "bound", "total"]);
    const L2 = new Set(["percent", "ratio", "decimal", "eitherOr"]);
    const L3 = new Set(["blend", "eitherOr"]);
    for (let i = 0; i < 150; i++) {
      for (const n of [2, 3, 4]) {
        const q1 = generateConstraint(1, { vars: [n], styles: ["resource", "compare"], pctOf: [], capGiven: "most" });
        expect(L1.has(q1.data.kind), q1.data.kind).toBe(true);
        const q2 = generateConstraint(2, { vars: [n], styles: ["percent", "ratio", "decimal", "fractional"], pctOf: ["one", "combined", "total", "morless"], capGiven: "most" });
        expect(L2.has(q2.data.kind), q2.data.kind).toBe(true);
        if (q2.data.info.kind === "eitherOr") expect(["perItem", "requirement"]).toContain(q2.data.info.given);
        const q3 = generateConstraint(3, { vars: [n], styles: ["blend", "eitherOr"], pctOf: [], capGiven: i % 2 ? "rate" : "most" });
        expect(L3.has(q3.data.kind), q3.data.kind).toBe(true);
        if (q3.data.info.kind === "eitherOr") expect(["most", "rate"]).toContain(q3.data.info.given);
      }
    }
  });
});

describe("Formulating: Formulate a problem", () => {
  const L1KINDS = new Set(["resource", "multiple", "difference", "bound", "total"]);
  it("Level 1 has none of the Level 2 or 3 features", () => {
    for (let i = 0; i < 200; i++) {
      const info = generateProblem(1, { vars: [2, 3, 4], objective: ["max", "min"], integers: true, limits: [1, 2, 3] }).data.info as PInfo;
      for (const p of info.parts) { expect(L1KINDS.has(p.kind), p.kind).toBe(true); if (p.info.kind === "resource") expect(p.info.conv).toBeUndefined(); }
      expect(info.pack).toBeUndefined();
      expect(info.price).toBeUndefined();
      expect(info.single).toBeUndefined();
      expect(info.rem).toBeUndefined();
      expect(info.link).toBeUndefined();
    }
  });
  it("Level 2 always has a Level 2 feature and never a Level 3 one", () => {
    for (let i = 0; i < 200; i++) {
      const info = generateProblem(2, { vars: [2, 3, 4], objective: ["max", "min"], integers: true, limits: [1, 2, 3], single: true }).data.info as PInfo;
      const kinds = info.parts.map((p) => p.kind);
      expect(kinds.some((k) => k === "percent" || k === "ratio" || k === "decimal") || info.parts.some((p) => p.info.kind === "resource" && !!p.info.conv) || !!info.pack || !!info.price || info.single !== undefined).toBe(true);
      expect(kinds.includes("eitherOr") || kinds.includes("blend")).toBe(false);
      expect(info.rem).toBeUndefined();
      expect(info.link).toBeUndefined();
    }
  }, 120_000);
  it("Level 3 is always one of the Level 3 situations", () => {
    for (let i = 0; i < 200; i++) {
      const info = generateProblem(3, { vars: [2, 3, 4], objective: ["max", "min"], integers: true, limits: [1, 2, 3] }).data.info as PInfo;
      const kinds = info.parts.map((p) => p.kind);
      expect(!!info.rem || !!info.link || kinds.includes("eitherOr") || kinds.includes("blend") || info.parts.some((p) => p.info.kind === "ratio" && p.op === "=")).toBe(true);
    }
  }, 120_000);
});

describe("The Simplex tool", () => {
  const ALL: Omit<SxOptions, "kind"> = { vars: [], cons: [], sizes: [[2, 2], [2, 3], [3, 3], [4, 4]], forms: ["standard", "min", "ge", "lower", "eq"], context: ["bare", "story", "table"], whole: false, given: true, pivotGiven: false, layout: "A" };
  const kinds: SxKind[] = ["setup", "pivot", "solve", "interpret", "practical"];
  it("the number of variables: two at Level 1, three at Level 2, three or four at Level 3", () => {
    for (const kind of kinds) for (let i = 0; i < 30; i++) {
      expect(generateSimplex(1, { ...ALL, kind }).data.spec.c.length).toBe(2);
      expect(generateSimplex(2, { ...ALL, kind }).data.spec.c.length).toBe(3);
      expect([3, 4]).toContain(generateSimplex(3, { ...ALL, kind }).data.spec.c.length);
    }
  });
  it("Level 1 is the inequalities in standard form; Level 2 a situation in words or a table in standard form; Level 3 is standard form with more variables; a change of form is the Non-standard problems sub-tool", () => {
    for (const kind of ["setup", "solve"] as SxKind[]) for (let i = 0; i < 40; i++) {
      const a = generateSimplex(1, { ...ALL, kind }).data;
      expect(a.story).toBeUndefined();
      expect(a.startForm).toBe("standard");
      const b = generateSimplex(2, { ...ALL, kind }).data;
      expect(b.story).toBeTruthy();
      expect(b.startForm).toBe("standard");
      const c = generateSimplex(3, { ...ALL, kind }).data;
      expect(c.startForm).toBe("standard");
      // Non-standard problems: a change of form at every level, from the level's own forms
      const forms: Record<number, string[]> = { 1: ["min", "lower"], 2: ["ge"], 3: ["eq"] };
      for (const level of [1, 2, 3]) expect(forms[level]).toContain(generateSimplex(level, { ...ALL, kind, nonStandard: true, forms: forms[level], context: ["bare"] }).data.startForm);
    }
  });
  it("Level 3 Solve never asks the whole-number question, even when it is ticked: that is the Is it practical? sub-tool", () => {
    for (let i = 0; i < 20; i++) {
      const d = generateSimplex(3, { ...ALL, kind: "solve", whole: true }).data;
      expect(d.whole).toBeUndefined();
      expect(d.startForm).toBe("standard");
    }
  });
  it("One iteration starts from the initial tableau, or part-way through the run when asked; a ≥ start has a negative right-hand side", () => {
    for (let i = 0; i < 40; i++) {
      expect(generateSimplex(1, { ...ALL, kind: "pivot" }).data.at).toBe(0);
      const p2 = generateSimplex(2, { ...ALL, kind: "pivot", startAt: "later", forms: ["standard"] }).data;
      expect(p2.at).toBeGreaterThanOrEqual(1);
      expect(p2.startForm).toBe("standard");
      const p3 = generateSimplex(2, { ...ALL, kind: "pivot", nonStandard: true, forms: ["ge"] }).data;
      expect(runSpec(p3.spec).iters[0].start).toBe(true);
    }
  });
  it("Read a tableau: Level 1 the optimal tableau; Level 2 one that may or may not be optimal", () => {
    for (let i = 0; i < 40; i++) {
      const a = generateSimplex(1, { ...ALL, kind: "interpret" }).data;
      expect(a.at).toBe(runSpec(a.spec).tabs.length - 1);
      const b = generateSimplex(2, { ...ALL, kind: "interpret" }).data;
      expect(b.at).toBeGreaterThanOrEqual(1);
      expect(b.at).toBeLessThanOrEqual(runSpec(b.spec).tabs.length - 1);
    }
  });
  it("Is it practical?: Level 1 rounding down is the best plan; Level 2 it is not; Level 3 it is not and rounding to the nearest breaks a constraint", () => {
    for (let i = 0; i < 30; i++) {
      const w = (level: number): ReturnType<typeof wholeAnalysis> => { const q = generateSimplex(level, { ...ALL, kind: "practical" }); return wholeAnalysis(q.data.spec, runSpec(q.data.spec)); };
      const w1 = w(1), w2 = w(2), w3 = w(3);
      expect(w1.best.pt.join()).toBe(w1.down.pt.join());
      expect(w2.best.pt.join()).not.toBe(w2.down.pt.join());
      expect(w3.best.pt.join()).not.toBe(w3.down.pt.join());
      expect(w3.nearest.ok).toBe(false);
    }
  });
});
