// ─────────────────────────────────────────────────────────────────────────────
// Network Flows — logic check. A flow network models a COMMODITY moving from a source S to a sink T, so every
// question has to make sense as one: the commodity is conserved at every inner vertex, nothing flows into S or out
// of T, no arc is over- or under-used, whole numbers throughout, and every number the question or its working
// shows scales with the chosen number size. Run over every sub-tool × level × mode × scale.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import {
  cutCapacity, flowValue, isAcyclic, isFeasibleFlow, maxFlow, minCutBruteForce, peelMissing, sortedAugmentingPaths, SINK, SOURCE,
  type FlowMode, type FlowSubTool,
} from "../shared/decision/flow";
import { generateFlowProblem } from "../shared/decision/flowGenerate";
import { solveFlowProblem } from "../shared/decision/flowSolve";

const SUBS: FlowSubTool[] = ["initialFlow", "missingFlow", "potentials", "cutValue", "augment", "maxFlow"];
const nums = (s: string) => (s.match(/\d+/g) ?? []).map(Number);

for (const scale of [1, 10, 100] as const)
  for (const mode of ["cap", "minmax"] as FlowMode[])
    for (const sub of SUBS)
      for (const level of [1, 2, 3] as const)
        describe(`logic: ×${scale} ${mode} ${sub} L${level}`, () => {
          it("is a sensible commodity-flow question with a correct answer", () => {
            for (let i = 0; i < 12; i++) {
              const p = generateFlowProblem(level, sub, mode, undefined, sub === "initialFlow" ? "find" : "paths", { scale });
              const d = p.flow!;
              const { net, flow } = d;
              // the network
              expect(net.arcs.filter((a) => a.to === SOURCE)).toEqual([]);
              expect(net.arcs.filter((a) => a.from === SINK)).toEqual([]);
              expect(isAcyclic(net)).toBe(true);
              for (const a of net.arcs) {
                expect(Number.isInteger(a.lo) && Number.isInteger(a.hi)).toBe(true);
                expect(a.lo).toBeLessThanOrEqual(a.hi);
                expect(a.hi % scale).toBe(0);
                expect(a.lo % scale).toBe(0);
                if (mode === "cap") expect(a.lo).toBe(0);
                else expect(a.lo < a.hi || a.hi === 0).toBe(true); // never a fixed [k, k] arc
              }
              // the commodity: conserved at inner vertices, within the bounds, out of S = into T
              const check = isFeasibleFlow(net, flow);
              expect(check.violations).toEqual([]);
              const outS = net.arcs.filter((a) => a.from === SOURCE).reduce((t, a) => t + flow[a.id], 0);
              const inT = net.arcs.filter((a) => a.to === SINK).reduce((t, a) => t + flow[a.id], 0);
              expect(outS).toBe(inT);
              expect(flowValue(net, flow)).toBe(outS);
              for (const a of net.arcs) expect(flow[a.id] % scale).toBe(0);

              // question-specific logic
              if (sub === "augment") {
                const found = sortedAugmentingPaths(net, flow);
                const word = ["", "one", "two", "three", "four", "five"][found.length];
                expect(p.prompt).toContain(`There are ${word} flow-augmenting paths`);
                for (const path of found) {
                  expect(path.bottleneck).toBeGreaterThan(0);
                  expect(path.bottleneck % scale).toBe(0);
                }
              }
              if (sub === "cutValue") {
                const r = cutCapacity(net, d.sSide!);
                expect(p.answer.value).toBe(r.capacity);
                expect(d.sSide).toContain(SOURCE);
                expect(d.sSide).not.toContain(SINK);
                expect(r.capacity).toBeGreaterThanOrEqual(flowValue(net, flow) - 0); // a cut can never be below a feasible flow's value
              }
              if (sub === "maxFlow") {
                const run = maxFlow(net, flow);
                expect(run.value).toBe(minCutBruteForce(net).capacity); // max-flow min-cut
                expect(run.value).toBeGreaterThan(flowValue(net, flow)); // there is something to do
                expect(isFeasibleFlow(net, run.flow).ok).toBe(true);
              }
              if (sub === "initialFlow" && d.target !== undefined) {
                expect(d.target % scale).toBe(0);
                expect(d.target).toBeLessThanOrEqual(maxFlow(net, Object.fromEntries(net.arcs.map((a) => [a.id, 0]))).value);
                expect(flowValue(net, flow)).toBe(d.target);
              }
              if (sub === "missingFlow") {
                expect(d.missing!.length).toBeGreaterThan(0);
                expect(peelMissing(net, d.missing!)).not.toBeNull();
              }

              // numbers scale: nothing in the prompt or the working is a stray small number
              const steps = solveFlowProblem(p);
              const texts = [p.prompt, ...steps.map((s) => s.caption)];
              for (const t of texts) for (const n of nums(t.replace(/[A-Z]{2,}\d*/g, ""))) {
                if (n % scale !== 0 && n > 5) expect.fail(`stray number ${n} in: ${t}`);
              }
            }
          });
        });
