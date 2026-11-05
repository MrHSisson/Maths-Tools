// A flowchart as slide elements: boxes for steps, ovals for questions, arrows between them, drawn from the ordinary shape, text and line
// elements (so it saves, shares, undoes and prints like anything else, and each part can be moved by hand afterwards). Pure layout sums only.
import type { DeckElement } from "./types";

export type FlowKind = "step" | "decision" | "yes" | "no" | "start";
export interface FlowNode {
  id: string; text: string; kind: FlowKind;
  /** Grid position: columns and rows count from 0, and a column may be fractional (0.5 sits between columns 0 and 1). */
  col: number; row: number;
  /** The click on which it appears in the player; omit to show it from the start. An arrow appears on the later of its two ends' clicks, so one looping back to an earlier box waits for the box it leaves. */
  step?: number;
  /** Text size in slide units (default 36). */
  size?: number;
  /** Width and height in slide units, to override the size worked out from the cell. */
  w?: number; h?: number;
}
/** `route` says how an arrow bends when its ends are not in line: "hv" leaves sideways, then turns up or down into the target; "vh" leaves up or down, then turns sideways into it. */
export interface FlowEdge { from: string; to: string; label?: string; route?: "hv" | "vh" }
export interface FlowArea { x: number; y: number; w: number; h: number }

const STYLE: Record<FlowKind, { fill: string; stroke: string; text: string; shape: "rect" | "ellipse" }> = {
  start: { fill: "#dbeafe", stroke: "#1e3a8a", text: "#0f172a", shape: "rect" },
  step: { fill: "#dbeafe", stroke: "#1e3a8a", text: "#0f172a", shape: "rect" },
  decision: { fill: "#ede9fe", stroke: "#7c3aed", text: "#0f172a", shape: "ellipse" },
  yes: { fill: "#dcfce7", stroke: "#15803d", text: "#14532d", shape: "rect" },
  no: { fill: "#fee2e2", stroke: "#b91c1c", text: "#7f1d1d", shape: "rect" },
};
const LINE = "#475569", LINE_W = 5, GAP = 8;

interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number }

/** Where each node sits: centred in its grid cell, boxes a little shorter than ovals. */
export function layoutNodes(nodes: FlowNode[], area: FlowArea): Record<string, Box> {
  const cols = Math.max(...nodes.map((n) => n.col)) + 1, rows = Math.max(...nodes.map((n) => n.row)) + 1;
  const cw = area.w / Math.max(1, Math.ceil(cols)), ch = area.h / rows;
  const out: Record<string, Box> = {};
  for (const n of nodes) {
    const oval = STYLE[n.kind].shape === "ellipse";
    const w = n.w ?? Math.min(cw * 0.86, 420), h = n.h ?? Math.min(ch * (oval ? 0.82 : 0.6), oval ? 190 : 130);
    const cx = area.x + (n.col + 0.5) * cw, cy = area.y + (n.row + 0.5) * ch;
    out[n.id] = { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
  }
  return out;
}

/** The points an arrow passes through: from the edge of `a` to the edge of `b`, bending once if they are not in line. */
export function routeEdge(a: Box, b: Box, route: "hv" | "vh" = "hv"): { x: number; y: number }[] {
  if (Math.abs(a.cx - b.cx) < 1) return [{ x: a.cx, y: b.cy > a.cy ? a.y + a.h + GAP : a.y - GAP }, { x: b.cx, y: b.cy > a.cy ? b.y - GAP : b.y + b.h + GAP }];
  if (Math.abs(a.cy - b.cy) < 1) return [{ x: b.cx > a.cx ? a.x + a.w + GAP : a.x - GAP, y: a.cy }, { x: b.cx > a.cx ? b.x - GAP : b.x + b.w + GAP, y: b.cy }];
  if (route === "hv") {
    const sx = b.cx > a.cx ? a.x + a.w + GAP : a.x - GAP;
    return [{ x: sx, y: a.cy }, { x: b.cx, y: a.cy }, { x: b.cx, y: b.cy > a.cy ? b.y - GAP : b.y + b.h + GAP }];
  }
  const sy = b.cy > a.cy ? a.y + a.h + GAP : a.y - GAP;
  return [{ x: a.cx, y: sy }, { x: a.cx, y: b.cy }, { x: b.cx > a.cx ? b.x - GAP : b.x + b.w + GAP, y: b.cy }];
}

/** The slide elements for a flowchart in `area`: shapes, then the words on them, then the arrows and their Yes / No labels. */
export function flowchartEls(prefix: string, nodes: FlowNode[], edges: FlowEdge[], area: FlowArea): DeckElement[] {
  const box = layoutNodes(nodes, area), byId = new Map(nodes.map((n) => [n.id, n]));
  const els: DeckElement[] = [];
  const stepOf = (s?: number) => (s ? { step: s } : {});
  for (const n of nodes) {
    const b = box[n.id], st = STYLE[n.kind];
    els.push({ id: `${prefix}-s-${n.id}`, kind: "shape", shape: st.shape, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h), fill: st.fill, stroke: st.stroke, strokeWidth: 4, ...(st.shape === "rect" ? { radius: 18 } : {}), ...stepOf(n.step) });
  }
  for (const n of nodes) {
    const b = box[n.id], st = STYLE[n.kind], inset = st.shape === "ellipse" ? 0.16 : 0.05;
    els.push({ id: `${prefix}-t-${n.id}`, kind: "text", x: Math.round(b.x + b.w * inset), y: Math.round(b.y + 4), w: Math.round(b.w * (1 - 2 * inset)), h: Math.round(b.h - 8), text: n.text, size: n.size ?? 36, fixed: true, bold: n.kind === "yes" || n.kind === "no", colour: st.text, align: "center", middle: true, ...stepOf(n.step) });
  }
  edges.forEach((e, i) => {
    const a = box[e.from], b = box[e.to], to = byId.get(e.to), from = byId.get(e.from);
    if (!a || !b || !to || !from) throw new Error(`flowchart ${prefix}: edge ${e.from} -> ${e.to} names a node that is not there`);
    const pts = routeEdge(a, b, e.route);
    const at = Math.max(from.step ?? 0, to.step ?? 0);                    // an arrow waits until both of its ends are on the slide
    for (let k = 0; k < pts.length - 1; k++) {
      const p = pts[k], q = pts[k + 1], last = k === pts.length - 2;
      els.push({ id: `${prefix}-a-${i}-${k}`, kind: "line", x: Math.round(p.x), y: Math.round(p.y), w: Math.round(q.x - p.x), h: Math.round(q.y - p.y), colour: LINE, width: LINE_W, ...(last ? { arrow: true } : {}), ...stepOf(at) });
    }
    if (e.label) {
      const p = pts[0], q = pts[1], vertical = Math.abs(q.x - p.x) < 1;
      const yes = /^yes/i.test(e.label);
      els.push({ id: `${prefix}-l-${i}`, kind: "text", x: Math.round(vertical ? p.x + 14 : (p.x + q.x) / 2 - 40), y: Math.round(vertical ? (p.y + q.y) / 2 - 20 : p.y - 48), w: 80, h: 40, text: e.label, size: 30, fixed: true, bold: true, colour: yes ? "#15803d" : "#b91c1c", align: vertical ? "left" : "center", ...stepOf(at) });
    }
  });
  return els;
}
