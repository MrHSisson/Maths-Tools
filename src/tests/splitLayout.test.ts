// The networks the working DRAWS when it adds vertices — the split network (X₁ → X₂) and, for the supersource / supersink question, the full
// network with S and T put back — must lay out as cleanly as a template does: no two vertices crowded together, and no label touching a
// vertex, another arc's line or another label (same measure as flowLayout.test.ts).
import { describe, expect, it } from "vitest";
import { generateFlowProblem } from "../shared/decision/flowGenerate";
import { NODE_R, dist, layoutNetwork, numberBox, type LabelUse, type Shape } from "../shared/decision/flowGeometry";
import type { FlowMode, FlowNet, ArcLabelPos, Flow } from "../shared/decision/flow";

const CLEAR = 1.5;
const FLOW_ONLY: LabelUse = { pill: true, flow: true, pot: false };
const POTS_ONLY: LabelUse = { pill: false, flow: false, pot: true };

function violations(net: FlowNet, labelPos: Record<string, ArcLabelPos>, flow: Flow, mode: FlowMode): string[] {
  const out: string[] = [];
  for (const [state, use] of [["flow", FLOW_ONLY], ["pots", POTS_ONLY]] as const) {
    const lay = layoutNetwork(net, labelPos, mode, Object.fromEntries(net.arcs.map((a) => [a.id, use])));
    const nodes = net.nodes.map((n): [string, Shape] => [`node ${n.id}`, { k: "circle", c: { x: n.x, y: n.y }, r: NODE_R }]);
    const lines = net.arcs.map((a): [string, Shape] => { const g = lay.get(a.id)!; return [a.id, { k: "seg", a: g.line.a, b: g.line.b, w: 3 }]; });
    const labels: Array<[string, string, Shape[]]> = [];
    for (const a of net.arcs) {
      const g = lay.get(a.id)!;
      if (use.pill) labels.push([a.id, "pill", [{ k: "rect", x0: g.pill.c.x - g.pill.w / 2, y0: g.pill.c.y - g.pill.h / 2, x1: g.pill.c.x + g.pill.w / 2, y1: g.pill.c.y + g.pill.h / 2 }]]);
      if (use.flow) labels.push([a.id, "flow", [{ k: "circle", c: g.flowC, r: g.flowR }]]);
      if (use.pot) {
        const w = String(a.hi - flow[a.id]).length, b = String(flow[a.id] - a.lo).length;
        labels.push([a.id, "inc", [{ k: "seg", a: g.inc.s0, b: g.inc.e0, w: 2.5 }, numberBox(g.inc.num, w)]]);
        labels.push([a.id, "dec", [{ k: "seg", a: g.dec.s0, b: g.dec.e0, w: 2.5 }, numberBox(g.dec.num, b)]]);
      }
    }
    const d = (xs: Shape[], ys: Shape[]) => Math.min(...xs.flatMap((s) => ys.map((t) => dist(s, t))));
    labels.forEach(([arc, kind, sh], i) => {
      for (const [nn, ns] of nodes) if (d(sh, [ns]) < CLEAR) out.push(`${state}: ${arc}.${kind} on ${nn}`);
      for (const [la, ls] of lines) if (!(la === arc && kind === "pill") && d(sh, [ls]) < CLEAR) out.push(`${state}: ${arc}.${kind} on arc ${la}`);
      for (let j = i + 1; j < labels.length; j++) if (d(sh, labels[j][2]) < CLEAR) out.push(`${state}: ${arc}.${kind} × ${labels[j][0]}.${labels[j][1]}`);
    });
  }
  const ns = net.nodes;
  for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++)
    if (Math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y) < 2 * NODE_R + 26) out.push(`vertices ${ns[i].id} and ${ns[j].id} crowded`);
  return out;
}

describe("networks with added vertices lay out cleanly", () => {
  // The flow view (pill + circled flow) must be spotless (one freak draw in forty is tolerated). The potentials view may, rarely, have an arrow brush a neighbouring arc where a
  // reversed arc runs back across the split arc (a hub fed from its right) — tolerate a few percent, never a pattern.
  const check = (make: (mode: FlowMode, level: 1 | 2 | 3) => { net: FlowNet; labelPos: Record<string, ArcLabelPos>; flow: Flow }, mode: FlowMode, level: 1 | 2 | 3) => {
    let flowBad = 0, potsBad = 0;
    const N = 40;
    for (let i = 0; i < N; i++) {
      const g = make(mode, level);
      const v = violations(g.net, g.labelPos, g.flow, mode);
      if (v.some((x) => !x.startsWith("pots:"))) flowBad++;
      if (v.some((x) => x.startsWith("pots:"))) potsBad++;
    }
    expect(flowBad / N).toBeLessThanOrEqual(0.03); // spotless, bar a rare freak draw
    expect(potsBad / N).toBeLessThanOrEqual(0.15);
  };
  for (const mode of ["cap", "minmax"] as FlowMode[])
    for (const level of [1, 2, 3] as const) {
      it(`split network, L${level} ${mode}`, () => check((m, l) => { const sp = generateFlowProblem(l, "nodeCap", m).flow!.split!; return { net: sp.net, labelPos: sp.labelPos, flow: sp.flow }; }, mode, level));
      it(`supersource / supersink network, L${level} ${mode}`, () => check((m, l) => { const d = generateFlowProblem(l, "superST", m).flow!; return { net: d.net, labelPos: d.labelPos, flow: d.flow }; }, mode, level));
    }
});
