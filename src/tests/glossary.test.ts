// The glossary behind the underlined words in Decision-tool working: every term must actually occur in some generated solution
// (no dead entries), the first occurrence only is marked, and a merged Prim-on-a-table solution keeps the table in step.
import { describe, expect, it } from "vitest";
import { DECISION_GLOSSARY, glossSegments } from "../shared/decision/glossary";
import { __problem as mst } from "../tools/Decision/MinimumSpanningTree";
import { __problem as tsp } from "../tools/Decision/TravellingSalesperson";
import { __problem as ri } from "../tools/Decision/RouteInspection";
import { __flow } from "../tools/Decision/NetworkFlows";
import { generateMstNetwork, primTrace } from "../shared/decision/mst";
import { solvePrimMatrix } from "../shared/decision/mstSolve";

function captions(): string[] {
  const out: string[] = [];
  for (const ex of [mst, tsp, ri]) for (const st of ex.subTools ?? []) {
    const ctx = typeof st === "string" ? { subTool: st, options: {} } : st;
    for (const lv of [1, 2, 3]) for (let i = 0; i < 3; i++) for (const s of ex.solve(ex.generate(lv, ctx))) out.push(s.caption);
  }
  for (const st of ["initialFlow", "missingFlow", "potentials", "augment", "cutValue", "maxFlow", "nodeCap", "superST"])
    for (const lv of [1, 2, 3]) for (const s of __flow.solve(__flow.generate(lv, { subTool: st, options: {} }))) out.push(s.caption);
  return out;
}

describe("glossary", () => {
  it("every term has a definition and occurs in some solution", () => {
    const all = captions();
    for (const t of DECISION_GLOSSARY) {
      expect(t.definition.length, t.id).toBeGreaterThan(20);
      expect(all.some((c) => t.pattern.test(c)), `no caption uses "${t.id}"`).toBe(true);
    }
  });
  it("marks only the first occurrence, and not twice across steps", () => {
    const seen = new Set<string>();
    const a = glossSegments("CD (8): C–E–D already joined → cycle. Reject.", seen);
    expect(a.filter((s) => s.term).map((s) => s.term!.id)).toEqual(["cycle"]);
    expect(a.map((s) => s.text).join("")).toBe("CD (8): C–E–D already joined → cycle. Reject.");
    const b = glossSegments("EF (12): E–D–F already joined → cycle. Reject.", seen);
    expect(b.some((s) => s.term)).toBe(false);
  });
  it("Eulerian does not swallow semi-Eulerian", () => {
    const segs = glossSegments("neither Eulerian nor semi-Eulerian", new Set());
    expect(segs.filter((s) => s.term).map((s) => s.term!.id)).toEqual(["eulerian", "semi"]);
  });
});

describe("Prim on a table, merged beats (Levels 2–3)", () => {
  it("one beat per edge: the new column is numbered and its row crossed out in the same beat", () => {
    for (let i = 0; i < 20; i++) {
      const { network, start } = generateMstNetwork(3, "primMatrix");
      const run = primTrace(network, start);
      const steps = solvePrimMatrix(network, start, true);
      expect(steps.length).toBe(run.entries.length + 2);
      run.entries.forEach((en, k) => {
        const s = steps[1 + k];
        expect(s.matrixOrder![en.added]).toBe(String(k + 2));
        expect(s.matrixCrossed).toContain(en.added);
        expect(s.matrixCells!.filter((c) => c.state === "highlight").length).toBe(2);
        expect(s.runningTotal).toBe(en.total);
      });
    }
  });
});
