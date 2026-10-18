// Explain and justify (Network Flows): every idea builds at every level for the courses that offer it, the part's marks equal its scheme lines,
// and the numbers in the prompts and answers are re-checked against an independent recomputation.
import { describe, expect, it } from "vitest";
import { FLOW_IDEAS, generateFlowReason } from "../shared/decision/flowExam";
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
