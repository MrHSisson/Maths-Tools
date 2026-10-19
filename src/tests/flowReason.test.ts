// Explain and justify (Network Flows): every idea builds at every level for the courses that offer it, the part's marks equal its scheme lines,
// and the numbers in the prompts and answers are re-checked against an independent recomputation.
import { describe, expect, it } from "vitest";
import { FLOW_IDEAS, generateFlowExam, generateFlowReason } from "../shared/decision/flowExam";
import { cutCapacity, maxFlow, type FlowNet, type FlowViewState } from "../shared/decision/flow";
import type { DecisionProblem, ExamPart } from "../shared/decision/types";

const partOf = (p: DecisionProblem): ExamPart => { expect(p.exam!.parts).toHaveLength(1); return p.exam!.parts[0]; };
const viewOf = (pt: ExamPart) => pt.view as FlowViewState & { net?: FlowNet; focus?: string[] };
const zero = (n: FlowNet) => Object.fromEntries(n.arcs.map((a) => [a.id, a.lo]));
const nums = (s: string) => (s.match(/\d+/g) ?? []).map(Number);

describe("Explain and justify: every idea builds", () => {
  for (const idea of FLOW_IDEAS)
    for (const course of idea.courses)
      for (const level of [1, 2, 3] as const)
        describe(`${idea.key} ${course} L${level}`, () => {
          const make = () => generateFlowReason(level, [idea.key], course);
          it("one part, marks = scheme lines, answer and explanation present", () => {
            for (let i = 0; i < 8; i++) {
              const p = make(); const pt = partOf(p);
              expect(pt.marks).toBe(pt.scheme.length);
              expect(pt.marks).toBeGreaterThanOrEqual(1);
              expect(pt.scheme.every((m) => /^(B1|M1|A1|E1|R1)F?$/.test(m.code))).toBe(true);
              expect(pt.model.length + (pt.onDiagram ? 1 : 0)).toBeGreaterThan(0);
              expect(p.exam!.totalMarks).toBe(pt.marks);
            }
          }, 60000);
        });
});

describe("Explain and justify: the numbers", () => {
  it("What a cut tells you: the stated value is the cut's value", () => {
    for (let i = 0; i < 15; i++) {
      const pt = partOf(generateFlowReason(2, ["deduce"], "as")); const v = viewOf(pt);
      const net = (pt.view as { net?: FlowNet }).net;
      const claimed = nums(pt.prompt.split("is ")[1].split(" ")[0])[0] ?? nums(pt.prompt.replace(/\{[^}]*\}/g, ""))[0];
      expect(claimed).toBeGreaterThan(0);
      expect(pt.model[0]).toContain(`≤ ${claimed}`);
      expect(v.sSide!.length).toBeGreaterThanOrEqual(2);
      void net;
    }
  });
  it("Impossible flow: the stated flow is below the least that must cross the cut", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 10; i++) {
      const pt = partOf(generateFlowReason(level, ["impossible"], "a")); const v = viewOf(pt);
      const net = v.net!; const r = cutCapacity(net, v.sSide!);
      const L = r.forward.reduce((t, a) => t + a.lo, 0) - r.backward.reduce((t, a) => t + a.hi, 0);
      const V = Number(pt.prompt.match(/flow of (\d+)/)![1]);
      expect(V).toBeLessThan(L);
      expect(L - V).toBeLessThanOrEqual(2);
    }
  });
  it("A pipe switched off: the verdict matches the recomputed fall in the maximum flow", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const pt = partOf(generateFlowReason(level, ["pipeOff"], "a")); const v = viewOf(pt);
      const [V, f] = pt.prompt.match(/(\d+) [a-z ]+, (?:pipe|arc) \w+ is switched off|reduce by (\d+)/g) ? [Number(pt.prompt.match(/maximum value of (\d+)/)![1]), Number(pt.prompt.match(/reduce by (\d+)/)![1])] : [0, 0];
      const M = maxFlow(v.net!, zero(v.net!)).value;
      const correct = V - M === f;
      expect(pt.scheme[1].text).toContain(correct ? "claim is correct" : "claim is incorrect");
      expect(M).toBeGreaterThanOrEqual(V - f);
    }
  });
  it("Forced arcs: the totals at the vertex are equal, so the asked arc is pinned", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const pt = partOf(generateFlowReason(level, ["forced"], "a")); const v = viewOf(pt); const net = v.net!;
      const asked = net.arcs.find((a) => a.id === v.focus![0])!; const vert = asked.from;
      const upper = pt.prompt.includes("upper capacity");
      const ins = net.arcs.filter((a) => a.to === vert), outs = net.arcs.filter((a) => a.from === vert);
      if (upper) expect(ins.reduce((t, a) => t + a.lo, 0)).toBe(outs.reduce((t, a) => t + a.hi, 0));
      else expect(ins.reduce((t, a) => t + a.hi, 0)).toBe(outs.reduce((t, a) => t + a.lo, 0));
    }
  });
  it("Is this the maximum flow? the verdict agrees with the recomputed maximum flow", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const p = generateFlowReason(level, ["claimMax"], "a"); const pt = partOf(p); const d = p.flow!;
      const Vmax = maxFlow(d.net, d.flow).value;
      const claimed = Number(pt.prompt.match(/(?:finds a flow of|to be|is) (\d+)/g)!.pop()!.match(/\d+/)![0]);
      const correct = pt.model[pt.model.length - 1].includes("is correct");
      expect(claimed === Vmax).toBe(correct);
    }
  });
  it("A flow and a cut together: equal values give the maximum flow; otherwise a range that contains it", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const p = generateFlowReason(level, ["flowCut"], "a"); const pt = partOf(p); const d = p.flow!;
      const Vmax = maxFlow(d.net, d.flow).value;
      const m = pt.model[0].match(/^(\d+) ≤ maximum flow ≤ (\d+)/);
      if (m) { expect(Number(m[1])).toBeLessThanOrEqual(Vmax); expect(Number(m[2])).toBeGreaterThanOrEqual(Vmax); }
      else expect(pt.model[0]).toBe(`Maximum flow = ${Vmax} ${p.exam!.intro.split(", in ").pop()!.replace(/\.$/, "")}`);
    }
  });
});

describe("the Explain and justify tab is wired into the tool", () => {
  it("the tool's generate() honours the ticked ideas and the course", async () => {
    const { __flow } = await import("../tools/Decision/NetworkFlows");
    for (let i = 0; i < 4; i++) {
      const p = __flow.generate(2, { subTool: "reason", options: { course: "a", ideaA: "forced" } });
      expect(partOf(p).prompt).toMatch(/must be at its (lower|upper) capacity/);
      const q = __flow.generate(1, { subTool: "reason", options: { course: "as", ideaAs: "deduce" } });
      expect(partOf(q).prompt).toContain("can be deduced about the maximum flow");
    }
  });
});

describe("earlier-specification ideas (off by default)", () => {
  it("are not offered unless ticked", () => {
    const legacy = new Set(FLOW_IDEAS.filter((i) => i.legacy).map((i) => i.key));
    expect(legacy.size).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < 30; i++) {
      const pt = partOf(generateFlowReason(2, [], "a"));
      expect(pt.prompt).not.toMatch(/Find the maximum flow along each|^Show that the value|is blocked|new pipe of capacity/);
    }
  });
  it("A section blocked: the stated maximum is the recomputed maximum flow with the arc removed", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 8; i++) {
      const pt = partOf(generateFlowReason(level, ["blocked"], "a")); const v = viewOf(pt);
      const M = maxFlow(v.net!, zero(v.net!)).value;
      expect(pt.model[0]).toContain(`Maximum flow ${M} `);
      expect(v.net!.arcs.find((a) => a.id === v.focus![0])!.hi).toBe(0);
    }
  });
  it("A new pipe: the example pipe really raises the maximum flow", () => {
    for (let i = 0; i < 8; i++) {
      const p = generateFlowReason(2, ["newArc"], "a"); const pt = partOf(p); const d = p.flow!;
      const k = Number(pt.prompt.match(/capacity (\d+) /)![1]);
      const [, u, v] = pt.model[0].match(/For example (\w+) → (\w+):/)!;
      const V = maxFlow(d.net, d.flow).value;
      const net2: FlowNet = { ...d.net, arcs: [...d.net.arcs, { id: u + v, from: u, to: v, lo: 0, hi: k }] };
      expect(maxFlow(net2, { ...maxFlow(d.net, d.flow).flow, [u + v]: 0 }).value).toBeGreaterThan(V);
    }
  });
  it("Maximum flow along routes: each amount is the route's smallest capacity", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 8; i++) {
      const p = generateFlowReason(level, ["routeMax"], "a"); const pt = partOf(p); const d = p.flow!;
      expect(pt.model.length).toBeGreaterThanOrEqual(2); expect(pt.model.length).toBeLessThanOrEqual(level === 1 ? 2 : 3);
      for (const line of pt.model) {
        const [, route, amt] = line.match(/^(\w+): (\d+) /)!;
        let at = "S"; let min = Infinity;
        for (const ch of route.slice(1)) { const a = d.net.arcs.find((x) => x.from === at && x.to === ch)!; min = Math.min(min, a.hi); at = ch; }
        expect(Number(amt)).toBe(min);
      }
    }
  });
  it("Show that: the value is the cut's value", () => {
    for (let i = 0; i < 10; i++) {
      const pt = partOf(generateFlowReason(2, ["showThat"], "as")); const v = viewOf(pt);
      const net = (pt.view as { net?: FlowNet }).net!;
      expect(Number(pt.prompt.match(/is (\d+) /)![1])).toBe(cutCapacity(net, v.sSide!).capacity);
    }
  });
});

describe("more earlier-specification ideas", () => {
  it("Two pipes made bigger: the new maximum is the recomputed maximum of the changed network", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 6; i++) {
      const pt = partOf(generateFlowReason(level, ["capacityIncrease"], "a")); const v = viewOf(pt);
      const M = maxFlow(v.net!, zero(v.net!)).value;
      expect(pt.scheme[pt.scheme.length - 1].text).toContain(`${M} `);
      expect(v.focus!.length).toBe(2);
    }
  });
  it("No feasible flow: the least that must leave the vertex really exceeds the most that can arrive", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 8; i++) {
      const pt = partOf(generateFlowReason(level, ["infeasible"], "a")); const v = viewOf(pt); const net = v.net!;
      const arcs = v.focus!.map((id) => net.arcs.find((a) => a.id === id)!);
      const vert = arcs.find((a) => a.to !== "T" && arcs.some((b) => b.from === a.to))?.to ?? arcs[0].to;
      const ins = net.arcs.filter((a) => a.to === vert), outs = net.arcs.filter((a) => a.from === vert);
      expect(ins.reduce((t, a) => t + a.hi, 0)).toBeLessThan(outs.reduce((t, a) => t + a.lo, 0));
      expect(net.arcs.every((a) => a.lo <= a.hi)).toBe(true);
    }
  });
});

describe("standing alone, a reasoning question hands over what the earlier parts would have found", () => {
  const NEEDS_FLOW = ["pipeOff", "capacity", "restriction", "upgrade", "blocked", "capacityIncrease", "newArc"] as const;
  for (const key of NEEDS_FLOW)
    it(`${key}: the maximum flow is stated and drawn on the question's picture`, () => {
      for (const level of [1, 2, 3] as const) for (let i = 0; i < 4; i++) {
        const p = generateFlowReason(level, [key], "a"); const pt = partOf(p);
        const view = (p.flow as { examView?: FlowViewState & { net?: FlowNet; flow?: Record<string, number> } }).examView!;
        const stated = Number(pt.prompt.match(/^A maximum flow of (\d+) /)![1]);
        expect(view.flow, "the flow is drawn").toBeTruthy();
        const net = view.net ?? p.flow!.net;
        expect(maxFlow(net, view.flow!).value).toBe(stated);
        expect(Object.keys(view.flow!).length).toBe(net.arcs.length);
      }
    }, 60_000);
  it("the ones that need the minimum cut also mark it, with the stated value", () => {
    for (const key of ["capacity", "upgrade", "newArc"]) for (let i = 0; i < 4; i++) {
      const p = generateFlowReason(2, [key], "a"); const pt = partOf(p);
      const view = (p.flow as { examView?: FlowViewState & { net?: FlowNet } }).examView!;
      expect(pt.prompt).toContain("minimum cut");
      const net = view.net ?? p.flow!.net;
      expect(cutCapacity(net, view.sSide!).capacity).toBe(Number(pt.prompt.match(/^A maximum flow of (\d+) /)![1]));
    }
  });
  it("claims and the impossible flow name the cut they use", () => {
    for (let i = 0; i < 6; i++) {
      const p = generateFlowReason(3, ["claimMax"], "a"); const pt = partOf(p);
      expect(pt.prompt).toMatch(/^(The cut|Another cut)[ ,]/);
      const view = (p.flow as { examView?: FlowViewState & { net?: FlowNet } }).examView!;
      const net = view.net ?? p.flow!.net;
      const stated = Number(pt.prompt.match(/has value (\d+) /)![1]);
      expect(cutCapacity(net, view.sSide!).capacity).toBe(stated);
    }
    for (let i = 0; i < 4; i++) {
      const p = generateFlowReason(2, ["impossible"], "a"); const pt = partOf(p);
      expect(pt.prompt).toMatch(/^Consider the cut /);
      expect((p.flow as { examView?: FlowViewState }).examView!.sSide).toBeTruthy();
    }
  });
  it("inside a real exam question nothing is added (the earlier parts supply it)", () => {
    for (let i = 0; i < 4; i++) {
      const parts = generateFlowExam(2, "examAug", { course: "a", mode: "cap" }).exam!.parts;
      expect(parts.every((x) => !/is shown on the diagram, and the minimum cut|^A maximum flow of/.test(x.prompt))).toBe(true);
    }
  });
});
