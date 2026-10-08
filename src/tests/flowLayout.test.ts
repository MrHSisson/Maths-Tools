// ─────────────────────────────────────────────────────────────────────────────
// Diagram layout: no label may touch another label, a vertex, or a different arc's line. Measured with the SAME
// geometry FlowView draws (flowGeometry.ts), with exact circle / rectangle / segment distances, over every template
// and many sampled variants (optional arcs, reversed arcs, capacity-only and min/max).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import { FLOW_TEMPLATES } from "../shared/decision/flowTemplates";
import { sampleInstance, variantNet, usableNet } from "../shared/decision/flowGenerate";
import { FLOW_R, NODE_R, arcGeometry, dist, numberBox, type Shape } from "../shared/decision/flowGeometry";
import type { FlowMode } from "../shared/decision/flow";

interface El { arc: string; kind: string; shapes: Shape[] }
const elDist = (a: El, b: El) => Math.min(...a.shapes.flatMap((s) => b.shapes.map((t2) => dist(s, t2))));

const CLEAR = 1.5; // minimum gap in diagram units

export function layoutViolations(_tpl: (typeof FLOW_TEMPLATES)[number], mode: FlowMode, state: "flow" | "pots" | "arrowsOnly", inst: NonNullable<ReturnType<typeof sampleInstance>>) {
  const nodes: El[] = inst.net.nodes.map((n) => ({ arc: "-", kind: `node ${n.id}`, shapes: [{ k: "circle", c: { x: n.x, y: n.y }, r: NODE_R }] }));
  const lines: El[] = [];
  const labels: El[] = [];
  for (const a of inst.net.arcs) {
    const g = arcGeometry(inst.net, a, inst.labelPos[a.id], mode);
    lines.push({ arc: a.id, kind: "line", shapes: [{ k: "seg", a: g.line.a, b: g.line.b, w: 3 }] });
    if (state !== "arrowsOnly") labels.push({ arc: a.id, kind: "pill", shapes: [{ k: "rect", x0: g.pill.c.x - g.pill.w / 2, y0: g.pill.c.y - g.pill.h / 2, x1: g.pill.c.x + g.pill.w / 2, y1: g.pill.c.y + g.pill.h / 2 }] });
    if (state === "flow") labels.push({ arc: a.id, kind: "flow", shapes: [{ k: "circle", c: g.flowC, r: FLOW_R }] });
    if (state !== "flow") {
      const pots = { fwd: inst.net.arcs.length > 0 ? a.hi - inst.flow[a.id] : 0, bwd: inst.flow[a.id] - a.lo };
      labels.push({ arc: a.id, kind: "inc", shapes: [{ k: "seg", a: g.inc.s0, b: g.inc.e0, w: 2.5 }, numberBox(g.inc.num, String(pots.fwd).length)] });
      labels.push({ arc: a.id, kind: "dec", shapes: [{ k: "seg", a: g.dec.s0, b: g.dec.e0, w: 2.5 }, numberBox(g.dec.num, String(pots.bwd).length)] });
    }
  }
  const out: string[] = [];
  for (let i = 0; i < labels.length; i++) {
    const L = labels[i];
    for (const n of nodes) if (elDist(L, n) < CLEAR) out.push(`${L.arc}.${L.kind} on ${n.kind}`);
    for (const ln of lines) {
      if (ln.arc === L.arc && L.kind === "pill") continue; // the pill is meant to sit ON its own arc
      if (elDist(L, ln) < CLEAR) out.push(`${L.arc}.${L.kind} on arc ${ln.arc}`);
    }
    for (let j = i + 1; j < labels.length; j++) {
      const M = labels[j];
      if (elDist(L, M) < CLEAR) out.push(`${[L.arc + "." + L.kind, M.arc + "." + M.kind].sort().join(" × ")}`);
    }
  }
  return out;
}

// A label must read as belonging to ITS arc: clearly nearer to its own line than to any other arc's line.
const nearLine = (c: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
  const vx = b.x - a.x, vy = b.y - a.y; const u = Math.max(0, Math.min(1, ((c.x - a.x) * vx + (c.y - a.y) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(c.x - (a.x + vx * u), c.y - (a.y + vy * u));
};
export function ambiguousLabels(mode: FlowMode, inst: NonNullable<ReturnType<typeof sampleInstance>>): string[] {
  const geo = inst.net.arcs.map((a) => ({ a, g: arcGeometry(inst.net, a, inst.labelPos[a.id], mode) }));
  const out: string[] = [];
  for (const { a, g } of geo) {
    const marks: Array<[string, { x: number; y: number }]> = [["flow", g.flowC], ["inc", g.inc.num], ["dec", g.dec.num], ["pill", g.pill.c]];
    for (const [kind, c] of marks) {
      const own = nearLine(c, g.line.a, g.line.b);
      for (const o of geo) if (o.a.id !== a.id) { const d = nearLine(c, o.g.line.a, o.g.line.b); if (d < own + 8) out.push(`${a.id}.${kind} is as near to arc ${o.a.id} (${d.toFixed(0)}px) as to its own (${own.toFixed(0)}px)`); }
    }
  }
  return out;
}

type Inst = NonNullable<ReturnType<typeof sampleInstance>>;
// Every variant a template can produce: each subset of its optional arcs x every set of 0-2 flipped flippable arcs.
function* variants(tpl: (typeof FLOW_TEMPLATES)[number]): Generator<{ name: string; inst: Inst }> {
  const opt = tpl.arcs.filter((a) => a.optional), flp = tpl.arcs.filter((a) => a.flippable);
  for (let m = 0; m < 1 << opt.length; m++) {
    const present = new Set(tpl.arcs.filter((a) => !a.optional || opt.indexOf(a) < 0 || m & (1 << opt.indexOf(a))).map((a) => a.id));
    const sets: string[][] = [[]];
    for (const a of flp) if (present.has(a.id)) sets.push([a.id]);
    for (let i = 0; i < flp.length; i++) for (let j = i + 1; j < flp.length; j++) if (present.has(flp[i].id) && present.has(flp[j].id)) sets.push([flp[i].id, flp[j].id]);
    for (const f of sets) {
      const { net, labelPos } = variantNet(tpl, present, new Set(f));
      if (!usableNet(net)) continue;
      // worst case for label width: two-digit numbers everywhere
      const arcs = net.arcs.map((a) => ({ ...a, lo: 0, hi: 20 }));
      const flow = Object.fromEntries(arcs.map((a) => [a.id, 10]));
      yield { name: `${tpl.id}[${[...present].join(",")}|flip ${f.join(",")}]`, inst: { net: { ...net, arcs }, labelPos, flow } as unknown as Inst };
    }
  }
}

describe("diagram layout: every variant, worst-case numbers", () => {
  for (const tpl of FLOW_TEMPLATES)
    it(tpl.id, () => {
      const bad = new Set<string>(); let n = 0;
      for (const { name, inst } of variants(tpl)) {
        n++;
        for (const mode of ["cap", "minmax"] as FlowMode[]) {
          for (const st of ["flow", "pots", "arrowsOnly"] as const) for (const v of layoutViolations(tpl, mode, st, inst)) bad.add(`${name} ${mode}/${st}: ${v}`);
          for (const v of ambiguousLabels(mode, inst)) bad.add(`${name} ${mode}: ${v}`);
        }
      }
      expect(n).toBeGreaterThan(0);
      expect([...bad].slice(0, 15)).toEqual([]);
    });
});
