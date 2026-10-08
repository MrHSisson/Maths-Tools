// ═══════════════════════════════════════════════════════════════════════════
// Flow-network templates — the network STYLES the Network Flows tool draws from,
// each taken from a textbook shape (diamond, fan, ladder, hexagon, the big 8-node
// network). Node positions are authored so the picture is always clean; a template
// fixes only the TOPOLOGY — bounds and flows are sampled per question
// (flowGenerate.ts). Arcs are listed in reading order, so ids sort sensibly.
// `crossings` declares the arcs that deliberately cross (everything else must not —
// flow.test.ts checks this geometrically).
// ═══════════════════════════════════════════════════════════════════════════

import type { GNode } from "./types";
import type { ArcLabelPos } from "./flow";

export interface FlowTemplateArc extends ArcLabelPos {
  id: string;
  from: string;
  to: string;
  /** may be drawn reversed (the arrow flips) when the teacher asks for reversed arcs; the network stays acyclic */
  flippable?: boolean;
  /** present in only some questions (the network keeps S→T routes and every inner vertex keeps an arc in and one out) */
  optional?: boolean;
}

export interface FlowTemplate {
  id: string;
  name: string;
  /** difficulty bands this style is used in */
  levels: Array<1 | 2 | 3>; // the size band(s) this style belongs to: 1 = 4–5 vertices, 2 = 6–7, 3 = 8
  nodes: GNode[];
  arcs: FlowTemplateArc[];
  crossings?: Array<[string, string]>;
}

const n = (id: string, x: number, y: number): GNode => ({ id, x, y });
type Side = 1 | -1;
// Every arc is mapped by hand: a(from, to, label t, [flow t, side], [potential t, side], flippable?).
// t is a fraction along the arc from `from`; side +1 = above the line (right of a vertical arc), −1 = below.
// A reversed arc keeps the same PHYSICAL label positions (sampleInstance mirrors t), so the picture stays tidy.
type Opt = { flip?: boolean; opt?: boolean };
const a = (from: string, to: string, label: number, flow: [number, Side], pot: [number, Side], o: Opt = {}): FlowTemplateArc => ({
  id: from + to, from, to, label, flow, pot, ...(o.flip ? { flippable: true } : {}), ...(o.opt ? { optional: true } : {}),
});

// Diamond — S, A, B, T with a cross-link A→B (the smallest network).
const DIAMOND: FlowTemplate = {
  id: "diamond",
  name: "Diamond",
  levels: [1],
  nodes: [n("S", 60, 210), n("A", 300, 70), n("B", 300, 350), n("T", 540, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "B", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("A", "T", 0.3, [0.62, 1], [0.45, -1]),
    a("B", "T", 0.3, [0.62, 1], [0.45, -1]),
  ],
};

// Fan — S feeds three nodes that each reach T, linked down the middle.
const FAN: FlowTemplate = {
  id: "fan",
  name: "Fan",
  levels: [1],
  nodes: [n("S", 50, 210), n("A", 290, 60), n("B", 290, 210), n("C", 290, 360), n("T", 530, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.75, 1], [0.55, -1]),
    a("S", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "B", 0.3, [0.62, 1], [0.45, -1], { flip: true, opt: true }),
    a("B", "C", 0.3, [0.62, 1], [0.45, -1], { flip: true, opt: true }),
    a("A", "T", 0.3, [0.6, 1], [0.45, -1]),
    a("B", "T", 0.3, [0.6, 1], [0.45, -1]),
    a("C", "T", 0.3, [0.6, -1], [0.45, -1]),
  ],
};

// Ladder — two rails with rungs (S, A, B, C, D, T).
const LADDER: FlowTemplate = {
  id: "ladder",
  name: "Ladder",
  levels: [2],
  nodes: [n("S", 40, 210), n("A", 220, 70), n("B", 220, 350), n("C", 480, 70), n("D", 480, 350), n("T", 660, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "B", 0.3, [0.62, 1], [0.45, -1], { flip: true }),
    a("A", "C", 0.3, [0.6, 1], [0.45, -1]),
    a("A", "D", 0.25, [0.62, 1], [0.42, -1], { opt: true }),
    a("B", "D", 0.3, [0.6, 1], [0.45, -1]),
    a("C", "D", 0.3, [0.62, 1], [0.45, -1], { flip: true }),
    a("C", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "T", 0.3, [0.62, 1], [0.5, -1]),
  ],
};

// Hexagon — S, A, B, C, D, E, T with C in the middle. The outer route (S–A–D–T, S–B–E–T) is fixed; anything may
// connect INTO the centre (from S, A, B) and OUT of it (to D, E, T), so one layout gives many networks.
const HEXAGON: FlowTemplate = {
  id: "hexagon",
  name: "Hexagon",
  levels: [2],
  nodes: [n("S", 40, 210), n("A", 200, 70), n("B", 200, 350), n("C", 390, 210), n("D", 560, 70), n("E", 560, 350), n("T", 730, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "C", 0.28, [0.8, 1], [0.5, -1], { opt: true }),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1], { flip: true, opt: true }),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "C", 0.3, [0.62, 1], [0.5, -1], { flip: true, opt: true }),
    a("B", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "D", 0.3, [0.62, 1], [0.45, -1], { flip: true, opt: true }),
    a("C", "E", 0.3, [0.62, 1], [0.45, -1], { flip: true, opt: true }),
    a("C", "T", 0.22, [0.62, 1], [0.4, -1], { opt: true }),
    a("D", "T", 0.3, [0.6, 1], [0.5, -1]),
    a("E", "T", 0.3, [0.6, 1], [0.5, -1]),
  ],
};

// The big network — S, A–F, T with two deliberate crossing pairs.
const BIG8: FlowTemplate = {
  id: "big8",
  name: "Big network",
  levels: [3],
  nodes: [
    n("S", 40, 210), n("A", 200, 70), n("B", 200, 350), n("C", 400, 70), n("D", 400, 350),
    n("E", 600, 70), n("F", 600, 350), n("T", 760, 210),
  ],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.68, 1], [0.5, -1]),
    a("A", "D", 0.16, [0.78, 1], [0.36, -1], { flip: true, opt: true }),
    a("B", "C", 0.16, [0.78, 1], [0.36, -1], { flip: true, opt: true }),
    a("B", "D", 0.3, [0.68, 1], [0.5, -1]),
    a("C", "E", 0.3, [0.68, 1], [0.5, -1]),
    a("C", "F", 0.16, [0.78, 1], [0.36, -1], { flip: true, opt: true }),
    a("D", "E", 0.16, [0.78, 1], [0.36, -1], { flip: true, opt: true }),
    a("D", "F", 0.3, [0.68, 1], [0.5, -1]),
    a("E", "T", 0.3, [0.6, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.6, 1], [0.5, -1]),
  ],
  crossings: [["AD", "BC"], ["CF", "DE"]],
};

export const FLOW_TEMPLATES: FlowTemplate[] = [DIAMOND, FAN, LADDER, HEXAGON, BIG8];

export const templatesForLevel = (level: 1 | 2 | 3): FlowTemplate[] => FLOW_TEMPLATES.filter((t) => t.levels.includes(level));
