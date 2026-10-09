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
import { generateFlowProblem } from "../shared/decision/flowGenerate";
import { solveFlowProblem, questionView } from "../shared/decision/flowSolve";
import { allCuts, cutCapacity as cutCap, decomposeFlow, flowOfValue, peelMissing } from "../shared/decision/flow";
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

const subTools: FlowSubTool[] = ["initialFlow", "missingFlow", "potentials", "cutValue", "augment", "maxFlow"];
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
              // the question asks for 2 or 3 augmentations in turn, and the labelling procedure really yields that many
              expect(d.rounds === 2 || d.rounds === 3).toBe(true);
              expect(run.augmentations.length).toBeGreaterThanOrEqual(d.rounds!);
              expect(findAugmentingPath(d.net, d.flow)).not.toBeNull();
              expect(allAugmentingPaths(d.net, d.flow).length).toBeGreaterThanOrEqual(1);
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

describe("Find a flow of a set value on a min/max network", () => {
  for (const level of [1, 2, 3] as const)
    it(`L${level}: the prompt names the value, the answer is feasible and has exactly that value`, () => {
      let withTarget = 0;
      for (let i = 0; i < 25; i++) {
        const p = generateFlowProblem(level, "initialFlow", "minmax", undefined, "find", { target: "value" });
        const d = p.flow!;
        expect(d.target).toBeDefined();
        withTarget++;
        expect(p.prompt).toContain(`value ${d.target}`);
        expect(isFeasibleFlow(d.net, d.flow).ok).toBe(true);
        expect(flowValue(d.net, d.flow)).toBe(d.target);
        const steps = solveFlowProblem(p);
        expect(steps.some((s) => s.caption.includes("still needed") || s.caption.includes("reached"))).toBe(true);
        expect(steps[steps.length - 1].caption).toContain(`of value ${d.target}`);
      }
      expect(withTarget).toBe(25);
    });
  it("'any' still asks for just a feasible flow", () => {
    const p = generateFlowProblem(2, "initialFlow", "minmax", undefined, "find", { target: "any" });
    expect(p.flow!.target).toBeUndefined();
    expect(p.prompt).not.toContain("of value");
  });
});

describe("Cut values draw the cut at every level", () => {
  for (const level of [1, 2, 3] as const)
    it(`L${level}: the question view carries the cut`, () => {
      const p = generateFlowProblem(level, "cutValue", "cap");
      expect(p.flow!.showCutLine).toBe(true);
      expect(questionView(p).sSide).toEqual(p.flow!.sSide);
    });
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
        expect(maxFlow(a.net, a.flow).augmentations.slice(0, a.rounds!).some((x) => x.path.steps.some((s) => s.dir === "back"))).toBe(true);
        const m = generateFlowProblem(level, "maxFlow", "minmax", undefined, "paths", { backSteps: true }).flow!;
        expect(maxFlow(m.net, m.flow).augmentations.some((x) => x.path.steps.some((s) => s.dir === "back"))).toBe(true);
      }
    });
  it("Include a backward arc: every cut has an arc coming back across it", () => {
    for (let i = 0; i < 12; i++) {
      const d = generateFlowProblem(2, "cutValue", "minmax", undefined, "paths", { cuts: "backward" }).flow!;
      expect(cutCap(d.net, d.sSide!).backward.length).toBeGreaterThan(0);
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

describe("minimums are real, not a string of zeros", () => {
  for (const sub of ["potentials", "cutValue", "augment", "maxFlow"] as const)
    it(`${sub} (min and max): at most about one arc in seven has a minimum of 0, and no arc is unused`, () => {
      for (const level of [1, 2, 3] as const)
        for (let i = 0; i < 12; i++) {
          const d = generateFlowProblem(level, sub, "minmax").flow!;
          const zeros = d.net.arcs.filter((a) => a.lo === 0).length;
          expect(zeros, `${d.templateId} ${d.net.arcs.map((a) => a.id + ":" + a.lo).join(" ")}`).toBeLessThanOrEqual(Math.max(1, Math.floor(d.net.arcs.length * 0.15)));
          expect(d.net.arcs.every((a) => d.flow[a.id] > 0)).toBe(true);
        }
    });
});

describe("missing flow and flow from potentials", () => {
  for (const level of [1, 2, 3] as const)
    for (const mode of ["cap", "minmax"] as FlowMode[])
      it(`L${level} ${mode} missing flow: 1–2 arcs left out, every one found by flow in = flow out, in order`, () => {
        for (let i = 0; i < 15; i++) {
          const p = generateFlowProblem(level, "missingFlow", mode);
          const d = p.flow!;
          expect(d.missing!.length).toBeGreaterThanOrEqual(1);
          expect(d.missing!.length).toBeLessThanOrEqual(level === 1 ? 1 : 2);
          const order = peelMissing(d.net, d.missing!);
          expect(order, "solvable").not.toBeNull();
          // at each stage the vertex really has exactly one unknown arc and conservation gives the true value
          const unknown = new Set(d.missing!);
          for (const { arc, vertex } of order!) {
            const inc = d.net.arcs.filter((a) => (a.from === vertex || a.to === vertex));
            expect(inc.filter((a) => unknown.has(a.id)).length).toBe(1);
            const inn = inc.filter((a) => a.to === vertex).reduce((t, a) => t + (unknown.has(a.id) && a.id !== arc ? 0 : d.flow[a.id]), 0);
            const out = inc.filter((a) => a.from === vertex).reduce((t, a) => t + (unknown.has(a.id) && a.id !== arc ? 0 : d.flow[a.id]), 0);
            expect(inn).toBe(out);
            unknown.delete(arc);
          }
          const steps = solveFlowProblem(p);
          expect(steps.length).toBe(order!.length + 2);
          expect(steps[steps.length - 1].flowView!.flow).toEqual(d.flow);
        }
      });
  it("flow from potentials: the working ends with every flow found, equal to the question's flow", () => {
    for (const mode of ["cap", "minmax"] as FlowMode[])
      for (let i = 0; i < 10; i++) {
        const p = generateFlowProblem(2, "potentials", mode);
        const steps = solveFlowProblem(p);
        const last = steps[steps.length - 1].flowView!;
        expect(last.flow).toEqual(p.flow!.flow);
        expect(steps[0].flowView!.potentials).toBeTruthy();
        expect(steps[0].flowView!.flow).toBeUndefined(); // the question does not show the flows
      }
  });
});

describe("wording regressions found by the audit", () => {
  it("missing flow never prints a tautology like 'x = 5 = 5'", () => {
    for (let i = 0; i < 60; i++) for (const lv of [1, 2, 3] as const) {
      const steps = solveFlowProblem(generateFlowProblem(lv, "missingFlow", i % 2 ? "cap" : "minmax"));
      for (const s of steps) expect(s.caption).not.toMatch(/\b([xyz]) = (\d+) = \2\b/);
    }
  });
  it("capacity-only working never mentions a minimum", () => {
    for (const sub of ["augment", "maxFlow", "potentials", "cutValue", "missingFlow", "initialFlow"] as const)
      for (const lv of [1, 2, 3] as const)
        for (let i = 0; i < 8; i++) {
          const p = generateFlowProblem(lv, sub, "cap");
          for (const s of solveFlowProblem(p)) expect(s.caption, `${sub} L${lv}`).not.toMatch(/(?<!no )minimums?(?! cut)/i);
        }
  });
  it("the potentials prompt names potential increase and decrease", () => {
    for (const mode of ["cap", "minmax"] as FlowMode[]) {
      const p = generateFlowProblem(2, "potentials", mode);
      expect(p.prompt).toMatch(/potential increase/);
      expect(p.prompt).toMatch(/potential decrease/);
    }
  });
  it("min/max cuts never have a backward arc with minimum 0 (a pointless '− 0')", () => {
    for (let i = 0; i < 40; i++) {
      const d = generateFlowProblem(2, "cutValue", "minmax", undefined, "paths", { cuts: "backward" }).flow!;
      expect(cutCap(d.net, d.sSide!).backward.every((a) => a.lo > 0)).toBe(true);
    }
  });
});

describe("Augment flow working: potentials are labelled once, then only updated", () => {
  for (const mode of ["cap", "minmax"] as FlowMode[])
    for (const level of [1, 2, 3] as const)
      it(`L${level} ${mode}: one labelling beat, then find / bottleneck / update per augmentation, each starting from the last update`, () => {
        for (let i = 0; i < 12; i++) {
          const p = generateFlowProblem(level, "augment", mode);
          const d = p.flow!;
          const steps = solveFlowProblem(p);
          const run = maxFlow(d.net, d.flow);
          const rounds = run.augmentations.slice(0, d.rounds!);
          expect(steps.length).toBe(1 + 3 * rounds.length + 1);
          // the formula appears once only
          expect(steps.filter((s) => /potential increase =/.test(s.caption)).length).toBe(1);
          expect(steps[0].flowView!.potentials).toEqual(Object.fromEntries(d.net.arcs.map((a) => [a.id, { fwd: a.hi - d.flow[a.id], bwd: d.flow[a.id] - a.lo }])));
          rounds.forEach((r, k) => {
            const [find, bottle, update] = steps.slice(1 + 3 * k, 4 + 3 * k);
            // the path beat reads potentials off the diagram: no recalculation
            expect(find.caption).not.toMatch(/ − /);
            expect(find.flowView!.potentials).toEqual(Object.fromEntries(d.net.arcs.map((a) => [a.id, { fwd: a.hi - r.before[a.id], bwd: r.before[a.id] - a.lo }])));
            expect(bottle.caption).toContain(`= ${r.path.bottleneck}`);
            // the update beat draws the NEW potentials, which are the next round's starting point
            expect(update.flowView!.potentials).toEqual(Object.fromEntries(d.net.arcs.map((a) => [a.id, { fwd: a.hi - r.after[a.id], bwd: r.after[a.id] - a.lo }])));
            expect(update.runningTotal).toBe(flowValue(d.net, r.after));
          });
          expect(steps[steps.length - 1].flowView!.flow).toEqual(rounds[rounds.length - 1].after);
          expect(steps[steps.length - 1].runningTotal).toBe(p.answer.value);
        }
      });
});
