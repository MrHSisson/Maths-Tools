// Supersource / supersink: nothing limits what a source supplies or a sink takes — the arcs the working adds are unlimited (∞).
import { describe, expect, it } from "vitest";
import { generateFlowProblem } from "../shared/decision/flowGenerate";
import { FLOW_INF, fmtNum, isInf, maxFlow } from "../shared/decision/flow";
import { arcGeometry } from "../shared/decision/flowGeometry";
import { solveFlowProblem } from "../shared/decision/flowSolve";

describe("Supersource / supersink have no supply or demand limit", () => {
  for (const level of [1, 2, 3] as const)
    it(`L${level}: the added arcs are unlimited, drawn ∞, never named in a caption as a number, and the vertices carry no supply tags`, () => {
      for (let i = 0; i < 15; i++) {
        const p = generateFlowProblem(level, "superST", "cap");
        const d = p.flow!, sp = d.superST!;
        for (const id of sp.superArcs) expect(isInf(d.net.arcs.find((a) => a.id === id)!.hi)).toBe(true);
        expect(p.prompt).not.toMatch(/supply|supplies|demand|brackets/i);
        // the source / sink vertices are named S₁… / T₁…
        for (const v of Object.keys(sp.sources)) expect(v).toMatch(/^S[₁₂₃₄]$/);
        for (const v of Object.keys(sp.sinks)) expect(v).toMatch(/^T[₁₂₃₄]$/);
        const arc = d.net.arcs.find((a) => a.id === sp.superArcs[0])!;
        const g = arcGeometry(d.net, arc, d.labelPos[arc.id], "cap");
        expect(g.boundsText).toBe("∞");
        const steps = solveFlowProblem(p);
        for (const s of steps) {
          expect(s.caption).not.toContain(String(FLOW_INF));
          expect(s.caption).not.toMatch(/\b9999\d\d\b/);
          expect(s.flowView?.nodeTags ?? {}).toEqual({});
        }
        expect(maxFlow(d.net, d.flow).value).toBe(p.answer.value);
      }
    });
  it("fmtNum shows ∞ for an unlimited capacity and plain numbers otherwise", () => {
    expect(fmtNum(FLOW_INF)).toBe("∞");
    expect(fmtNum(FLOW_INF - 3)).toBe("∞");
    expect(fmtNum(12)).toBe("12");
  });
});
