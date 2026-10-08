// ─────────────────────────────────────────────────────────────────────────────
// Network Flows — solver reference numbers (specs/flow-networks.md §5) and
// property tests over every template × level × sub-tool × mode.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import {
  allAugmentingPaths, augment, cutCapacity, findAugmentingPath, flowValue, isAcyclic, isFeasibleFlow, maxFlow,
  minCutBruteForce, pathNodes, potentials, type Flow, type FlowNet,
} from "../shared/decision/flow";
import { FLOW_TEMPLATES } from "../shared/decision/flowTemplates";
import { sortedAugmentingPaths as sortedAug } from "../shared/decision/flow";
import { generateFlowProblem } from "../shared/decision/flowGenerate";
import { solveFlowProblem } from "../shared/decision/flowSolve";
import { allCuts, cutCapacity as cutCap, decomposeFlow, flowOfValue } from "../shared/decision/flow";
import { cutGeometry } from "../shared/decision/cutCurve";
import type { FlowMode, FlowSubTool } from "../shared/decision/flow";

const big = FLOW_TEMPLATES.find((t) => t.id === "big8")!;
const bounds0: Record<string, [number, number]> = {
  SA: [2, 10], SB: [3, 12], AC: [0, 8], AD: [0, 8], BC: [0, 5], BD: [0, 10],
  CE: [6, 10], CF: [0, 3], DE: [0, 8], DF: [5, 7], ET: [6, 12], FT: [5, 13],
};
const f0: Flow = { SA: 8, SB: 7, AC: 8, AD: 0, BC: 0, BD: 7, CE: 8, CF: 0, DE: 0, DF: 7, ET: 8, FT: 7 };
const mkNet = (b: Record<string, [number, number]>): FlowNet => ({
  nodes: big.nodes,
  arcs: big.arcs.map((a) => ({ id: a.id, from: a.from, to: a.to, lo: b[a.id][0], hi: b[a.id][1] })),
});
const N0 = mkNet(bounds0);
const N1 = mkNet({ ...bounds0, CE: [6, 8], DE: [0, 2] });

describe("reference network N0", () => {
  it("f0 is a feasible flow of value 15", () => {
    expect(isFeasibleFlow(N0, f0)).toEqual({ ok: true, violations: [] });
    expect(flowValue(N0, f0)).toBe(15);
  });
  it("potentials at f0", () => {
    const p = potentials(N0, f0);
    const got = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, `${v.fwd}/${v.bwd}`]));
    expect(got).toEqual({
      SA: "2/6", SB: "5/4", AC: "0/8", AD: "8/0", BC: "5/0", BD: "3/7",
      CE: "2/2", CF: "3/0", DE: "8/0", DF: "0/2", ET: "4/2", FT: "6/2",
    });
  });
  it("canonical augmentations are SADET 2, SBCET 2, SBCFT 3 → 22", () => {
    const run = maxFlow(N0, f0);
    expect(run.augmentations.map((a) => [pathNodes(a.path).join(""), a.path.bottleneck])).toEqual([
      ["SADET", 2], ["SBCET", 2], ["SBCFT", 3],
    ]);
    expect(run.value).toBe(22);
    expect(run.sSide).toEqual(["S"]);
    expect(minCutBruteForce(N0).capacity).toBe(22);
  });
  it("cut values", () => {
    expect(cutCapacity(N0, ["S", "A", "B", "D", "E"]).capacity).toBe(26); // 32 − 6
    expect(cutCapacity(N0, ["S", "A", "B", "C", "D"]).capacity).toBe(28);
    expect(cutCapacity(N0, ["S", "A", "C", "E"]).capacity).toBe(35);
  });
});

describe("reference network N1 (non-trivial minimum cut)", () => {
  it("max flow 20, min cut {S,A,B,C,D}", () => {
    expect(isFeasibleFlow(N1, f0).ok).toBe(true);
    const run = maxFlow(N1, f0);
    expect(run.augmentations.map((a) => [pathNodes(a.path).join(""), a.path.bottleneck])).toEqual([["SADET", 2], ["SBCFT", 3]]);
    expect(run.value).toBe(20);
    expect(run.sSide).toEqual(["S", "A", "B", "C", "D"]);
    expect(cutCapacity(N1, run.sSide).capacity).toBe(20);
  });
});

describe("templates", () => {
  for (const t of FLOW_TEMPLATES) {
    it(`${t.id}: arcs reference real nodes, acyclic, only declared arcs cross`, () => {
      const ids = new Set(t.nodes.map((n) => n.id));
      for (const a of t.arcs) {
        expect(ids.has(a.from) && ids.has(a.to)).toBe(true);
      }
      expect(isAcyclic({ nodes: t.nodes, arcs: t.arcs.map((a) => ({ ...a, lo: 0, hi: 1 })) })).toBe(true);
      const P = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
      const ccw = (p: any, q: any, r: any) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
      const crossing: string[] = [];
      for (let i = 0; i < t.arcs.length; i++)
        for (let j = i + 1; j < t.arcs.length; j++) {
          const a = t.arcs[i], b = t.arcs[j];
          if (new Set([a.from, a.to, b.from, b.to]).size < 4) continue; // share a node
          const [p1, p2, p3, p4] = [P[a.from], P[a.to], P[b.from], P[b.to]];
          if (ccw(p1, p2, p3) * ccw(p1, p2, p4) < 0 && ccw(p3, p4, p1) * ccw(p3, p4, p2) < 0) crossing.push([a.id, b.id].sort().join("|"));
        }
      const declared = (t.crossings ?? []).map((c) => [...c].sort().join("|"));
      expect(crossing.sort()).toEqual(declared.sort());
    });
  }
});

const subTools: FlowSubTool[] = ["initialFlow", "potentials", "cutValue", "augment", "maxFlow"];
describe("generated questions", () => {
  for (const level of [1, 2, 3] as const)
    for (const sub of subTools)
      for (const mode of ["cap", "minmax"] as FlowMode[]) {
        it(`L${level} ${sub} ${mode}: valid flow, solver agrees with brute force`, () => {
          for (let i = 0; i < 15; i++) {
            const p = generateFlowProblem(level, sub, mode);
            const d = p.flow!;
            expect(isFeasibleFlow(d.net, d.flow).ok).toBe(true);
            expect(isAcyclic(d.net)).toBe(true);
            if (mode === "cap") expect(d.net.arcs.every((a) => a.lo === 0)).toBe(true);
            expect(d.net.arcs.every((a) => Number.isInteger(a.lo) && Number.isInteger(a.hi) && a.hi >= 1 && a.lo <= a.hi)).toBe(true);
            // max flow = brute-force min cut, from the given flow
            const run = maxFlow(d.net, d.flow);
            expect(isFeasibleFlow(d.net, run.flow).ok).toBe(true);
            expect(run.value).toBe(minCutBruteForce(d.net).capacity);
            expect(cutCapacity(d.net, run.sSide).capacity).toBe(run.value);
            for (const aug of run.augmentations) expect(isFeasibleFlow(d.net, augment(aug.before, aug.path)).ok).toBe(true);
            if (sub === "augment") {
              const paths = allAugmentingPaths(d.net, d.flow);
              expect(paths.length).toBeGreaterThanOrEqual(2);
              expect(paths.length).toBeLessThanOrEqual(3);
              // by default (no "backward step" selector) every path uses forward steps only
              expect(paths.every((q) => q.steps.every((s) => s.dir === "fwd"))).toBe(true);
              expect(findAugmentingPath(d.net, d.flow)).not.toBeNull();
            }

          }
        });
      }
});

describe("initial flow", () => {
  it("decomposeFlow splits N0's f0 back into its flow", () => {
    const paths = decomposeFlow(N0, f0);
    const sum: Flow = Object.fromEntries(N0.arcs.map((a) => [a.id, 0]));
    for (const p of paths) for (const id of p.arcs) sum[id] += p.amount;
    expect(sum).toEqual(f0);
  });
  it("flowOfValue builds a feasible flow of the asked value", () => {
    const capNet: FlowNet = { ...N0, arcs: N0.arcs.map((a) => ({ ...a, lo: 0 })) };
    const f = flowOfValue(capNet, 12)!;
    expect(isFeasibleFlow(capNet, f).ok).toBe(true);
    expect(flowValue(capNet, f)).toBe(12);
  });
  for (const level of [1, 2, 3] as const)
    for (const style of ["paths", "find"] as const)
      for (const mode of ["cap", "minmax"] as FlowMode[]) {
        it(`L${level} ${style} ${mode}: answer flow is feasible, paths rebuild it, working ends on a valid check`, () => {
          for (let i = 0; i < 12; i++) {
            const p = generateFlowProblem(level, "initialFlow", mode, undefined, style);
            const d = p.flow!;
            expect(isFeasibleFlow(d.net, d.flow).ok).toBe(true);
            const sum: Flow = Object.fromEntries(d.net.arcs.map((a) => [a.id, 0]));
            for (const pt of d.paths!) for (const id of pt.arcs) sum[id] += pt.amount;
            expect(sum).toEqual(d.flow);
            if (style === "paths" && level === 1) expect(d.paths!.length).toBe(2);
            if (level > 1) expect(d.paths!.some((pt) => pt.arcs.length >= 3), "uses a route through a cross arc").toBe(true);
            if (style === "find" && mode === "cap") expect(flowValue(d.net, d.flow)).toBe(d.target);
            if (style === "find" && mode === "minmax") expect(d.net.arcs.filter((a) => a.lo > 0).length).toBeGreaterThanOrEqual(2);
            const steps = solveFlowProblem(p);
            expect(steps.length).toBeGreaterThan(3);
            expect(steps[steps.length - 1].caption).not.toContain("(!)");
            expect(steps[steps.length - 2].caption).not.toContain("(!)");
          }
        });
      }
});

describe("the dashed cut line", () => {
  for (const t of FLOW_TEMPLATES) {
    it(`${t.id}: a drawable cut is ONE line crossing exactly its arcs once, with ticks on them`, () => {
      const net: FlowNet = { nodes: t.nodes, arcs: t.arcs.map((a) => ({ id: a.id, from: a.from, to: a.to, lo: 1, hi: 2 })) };
      const byId = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
      let drawable = 0;
      let withBack = 0;
      let proper = 0;
      for (const sSide of allCuts(net)) {
        const r = cutCap(net, sSide);
        const ids = [...r.forward, ...r.backward].map((a) => a.id);
        const g = cutGeometry(net, sSide, ids);
        if (sSide.length >= 2 && net.nodes.length - sSide.length >= 2) proper++;
        if (!g) continue;
        if (sSide.length >= 2 && net.nodes.length - sSide.length >= 2) {
          drawable++;
          if (r.backward.length > 0) withBack++;
        }
        expect(g.paths.length).toBe(1);
        for (const a of [...r.forward, ...r.backward]) {
          const tk = g.ticks[a.id];
          const p = byId[a.from], q = byId[a.to];
          const cross = (q.x - p.x) * (tk.y - p.y) - (q.y - p.y) * (tk.x - p.x);
          const dot = (tk.x - p.x) * (q.x - p.x) + (tk.y - p.y) * (q.y - p.y);
          expect(Math.abs(cross) / Math.hypot(q.x - p.x, q.y - p.y)).toBeLessThan(0.5);
          expect(dot).toBeGreaterThan(0);
          expect(dot).toBeLessThan((q.x - p.x) ** 2 + (q.y - p.y) ** 2);
        }
      }
      void withBack;
      expect(drawable).toBeGreaterThanOrEqual(Math.min(3, proper));
    });
  }
});

describe("the question selectors", () => {
  for (const level of [1, 2, 3] as const)
    it(`L${level}: "Include a backward step" puts a backward step in augment and max-flow working`, () => {
      for (let i = 0; i < 8; i++) {
        const a = generateFlowProblem(level, "augment", "minmax", undefined, "paths", { backSteps: true }).flow!;
        expect(sortedAug(a.net, a.flow).some((q) => q.steps.some((s) => s.dir === "back"))).toBe(true);
        const m = generateFlowProblem(level, "maxFlow", "minmax", undefined, "paths", { backSteps: true }).flow!;
        expect(maxFlow(m.net, m.flow).augmentations.some((x) => x.path.steps.some((s) => s.dir === "back"))).toBe(true);
      }
    });
  it("Forward arcs only: every cut has no backward arc", () => {
    for (let i = 0; i < 12; i++) {
      const d = generateFlowProblem(2, "cutValue", "minmax", undefined, "paths", { cuts: "forward" }).flow!;
      expect(cutCap(d.net, d.sSide!).backward.length).toBe(0);
    }
  });
  it("Levels are graph size: the vertex count grows with the level", () => {
    const sizes = (lv: 1 | 2 | 3) => new Set(Array.from({ length: 25 }, () => generateFlowProblem(lv, "potentials", "cap").flow!.net.nodes.length));
    expect([...sizes(1)].every((n) => n >= 4 && n <= 5)).toBe(true);
    expect([...sizes(2)].every((n) => n >= 6 && n <= 7)).toBe(true);
    expect([...sizes(3)]).toEqual([8]);
  });
  it("Some reversed: a reversed question still has a feasible flow, stays acyclic and has some arc against the template", () => {
    let flipped = 0;
    for (let i = 0; i < 40; i++) {
      const d = generateFlowProblem(2, "potentials", "cap", undefined, "paths", { arcs: "reversed" }).flow!;
      expect(isAcyclic(d.net)).toBe(true);
      expect(isFeasibleFlow(d.net, d.flow).ok).toBe(true);
      const tpl = FLOW_TEMPLATES.find((t) => t.id === d.templateId)!;
      if (d.net.arcs.some((a) => !tpl.arcs.some((t) => t.from === a.from && t.to === a.to))) flipped++;
    }
    expect(flipped).toBeGreaterThan(0);
  });
  it("Hexagon hub: the centre vertex always has an arc in and an arc out, and the variants differ", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const d = generateFlowProblem(2, "potentials", "cap", "hexagon", "paths", { arcs: "reversed" }).flow!;
      if (d.templateId !== "hexagon") continue;
      expect(d.net.arcs.some((a) => a.to === "C")).toBe(true);
      expect(d.net.arcs.some((a) => a.from === "C")).toBe(true);
      seen.add(d.net.arcs.map((a) => a.id).sort().join(","));
    }
    expect(seen.size).toBeGreaterThan(8);
  });
});
