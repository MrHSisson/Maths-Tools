// Supersource / supersink arcs carry exactly what leaves the source (arrives at the sink), so their bounds are the SUMS of the bounds
// of those arcs: capacity 8 + 6 = 14; with minimums [Σ minimums, Σ maximums]. A restricted vertex splits into X₁ → X₂ whose bounds are the
// restriction tightened by the sums of the arcs arriving / leaving.
import { describe, expect, it } from "vitest";
import { generateFlowProblem } from "../shared/decision/flowGenerate";
import { isFeasibleFlow, maxFlow, type FlowMode } from "../shared/decision/flow";
import { solveFlowProblem } from "../shared/decision/flowSolve";

const MODES: FlowMode[] = ["cap", "minmax"];

describe("Supersource / supersink arcs are the sums of what leaves / arrives", () => {
  for (const mode of MODES)
    for (const level of [1, 2, 3] as const)
      it(`L${level} ${mode}: each added arc's bounds are the sums over the arcs leaving the source / arriving at the sink, and its flow is their total flow`, () => {
        for (let i = 0; i < 15; i++) {
          const p = generateFlowProblem(level, "superST", mode);
          const d = p.flow!, sp = d.superST!;
          expect(d.mode).toBe(mode);
          expect(isFeasibleFlow(d.net, d.flow).ok).toBe(true);
          const q = sp.question.arcs;
          for (const v of Object.keys(sp.sources)) {
            const a = d.net.arcs.find((x) => x.id === "S" + v)!;
            const out = q.filter((x) => x.from === v);
            expect(a.hi).toBe(out.reduce((t, x) => t + x.hi, 0));
            expect(a.lo).toBe(out.reduce((t, x) => t + x.lo, 0));
            expect(d.flow[a.id]).toBe(out.reduce((t, x) => t + d.flow[x.id], 0));
          }
          for (const v of Object.keys(sp.sinks)) {
            const a = d.net.arcs.find((x) => x.id === v + "T")!;
            const inn = q.filter((x) => x.to === v);
            expect(a.hi).toBe(inn.reduce((t, x) => t + x.hi, 0));
            expect(a.lo).toBe(inn.reduce((t, x) => t + x.lo, 0));
          }
          // the vertices are named S₁… / T₁…, and no caption or prompt talks about a supply or demand limit
          for (const v of Object.keys(sp.sources)) expect(v).toMatch(/^S[₁₂₃₄]$/);
          for (const v of Object.keys(sp.sinks)) expect(v).toMatch(/^T[₁₂₃₄]$/);
          expect(p.prompt).not.toMatch(/supply|supplies|demand|brackets/i);
          const steps = solveFlowProblem(p);
          expect(steps.every((s) => !s.flowView?.nodeTags || Object.keys(s.flowView.nodeTags).length === 0)).toBe(true);
          expect(maxFlow(d.net, d.flow).value).toBe(p.answer.value);
        }
      });
});

describe("Restricted vertices on a min and max network", () => {
  for (const level of [1, 2, 3] as const)
    it(`L${level}: the split arc is [max of the sums of minimums, the restriction], and the working agrees`, () => {
      for (let i = 0; i < 15; i++) {
        const p = generateFlowProblem(level, "nodeCap", "minmax");
        const d = p.flow!, sp = d.split!;
        expect(d.mode).toBe("minmax");
        expect(isFeasibleFlow(sp.net, sp.flow).ok).toBe(true);
        for (const id of Object.keys(d.nodeCaps!)) {
          const arc = sp.net.arcs.find((a) => a.id === sp.nodeArc[id])!;
          const into = d.net.arcs.filter((a) => a.to === id), outOf = d.net.arcs.filter((a) => a.from === id);
          expect(arc.hi).toBe(d.nodeCaps![id]);
          expect(d.nodeCaps![id]).toBeLessThan(Math.min(into.reduce((t, a) => t + a.hi, 0), outOf.reduce((t, a) => t + a.hi, 0)));
          expect(arc.lo).toBe(Math.max(into.reduce((t, a) => t + a.lo, 0), outOf.reduce((t, a) => t + a.lo, 0)));
          expect(sp.flow[arc.id]).toBeGreaterThanOrEqual(arc.lo);
          expect(sp.flow[arc.id]).toBeLessThanOrEqual(arc.hi);
        }
        expect(solveFlowProblem(p).length).toBeGreaterThan(4);
        expect(p.answer.value).toBe(maxFlow(sp.net, sp.flow).value);
      }
    });
});
