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

export interface FlowTemplateArc {
  id: string;
  from: string;
  to: string;
  /** may be drawn reversed at the top tier (the arrow flips; network stays acyclic) */
  flippable?: boolean;
  /** where the min/max label sits along the arc (fraction from tail; default 0.3) */
  labelAt?: number;
  /** where the circled flow sits (default 0.72) */
  flowAt?: number;
  /** where the potential labels sit (default 0.52) */
  potAt?: number;
}

export interface FlowTemplate {
  id: string;
  name: string;
  /** difficulty bands this style is used in */
  levels: Array<1 | 2 | 3>;
  nodes: GNode[];
  arcs: FlowTemplateArc[];
  crossings?: Array<[string, string]>;
}

const n = (id: string, x: number, y: number): GNode => ({ id, x, y });
const a = (from: string, to: string, extra: Partial<FlowTemplateArc> = {}): FlowTemplateArc => ({ id: from + to, from, to, ...extra });

// Diamond — S, A, B, T with a cross-link A→B (the smallest network).
const DIAMOND: FlowTemplate = {
  id: "diamond",
  name: "Diamond",
  levels: [1],
  nodes: [n("S", 60, 210), n("A", 300, 70), n("B", 300, 350), n("T", 540, 210)],
  arcs: [a("S", "A"), a("S", "B"), a("A", "B", { labelAt: 0.3, flowAt: 0.62, potAt: 0.46 }), a("A", "T"), a("B", "T")],
};

// Fan — S feeds three nodes that each reach T, linked down the middle.
const FAN: FlowTemplate = {
  id: "fan",
  name: "Fan",
  levels: [1, 2],
  nodes: [n("S", 50, 210), n("A", 290, 60), n("B", 290, 210), n("C", 290, 360), n("T", 530, 210)],
  arcs: [
    a("S", "A"), a("S", "B", { labelAt: 0.35, flowAt: 0.62 }), a("S", "C"),
    a("A", "B", { labelAt: 0.3, flowAt: 0.62, potAt: 0.46 }), a("B", "C", { labelAt: 0.3, flowAt: 0.62, potAt: 0.46 }),
    a("A", "T"), a("B", "T", { labelAt: 0.3, flowAt: 0.6 }), a("C", "T"),
  ],
};

// Ladder — two rails with rungs (S, A, B, C, D, T).
const LADDER: FlowTemplate = {
  id: "ladder",
  name: "Ladder",
  levels: [2],
  nodes: [n("S", 40, 210), n("A", 220, 70), n("B", 220, 350), n("C", 480, 70), n("D", 480, 350), n("T", 660, 210)],
  arcs: [
    a("S", "A"), a("S", "B"),
    a("A", "B", { labelAt: 0.3, flowAt: 0.62, potAt: 0.46 }),
    a("A", "C"), a("A", "D", { labelAt: 0.22, flowAt: 0.66, potAt: 0.46 }),
    a("B", "D"),
    a("C", "D", { labelAt: 0.3, flowAt: 0.62, potAt: 0.46 }),
    a("C", "T"), a("D", "T"),
  ],
};

// Hexagon — S, A, B, C, D, E, T: two routes meeting at C, two running round the edge.
const HEXAGON: FlowTemplate = {
  id: "hexagon",
  name: "Hexagon",
  levels: [2, 3],
  nodes: [n("S", 40, 210), n("A", 200, 70), n("B", 200, 350), n("C", 390, 210), n("D", 560, 70), n("E", 560, 350), n("T", 730, 210)],
  arcs: [
    a("S", "A"), a("S", "B"),
    a("A", "C"), a("A", "D"),
    a("B", "C"), a("B", "E"),
    a("C", "T", { labelAt: 0.3, flowAt: 0.72, potAt: 0.46 }),
    a("D", "T"), a("E", "T"),
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
    a("S", "A"), a("S", "B"),
    a("A", "C"), a("A", "D", { flippable: true, labelAt: 0.16, flowAt: 0.78, potAt: 0.36 }),
    a("B", "C", { flippable: true, labelAt: 0.16, flowAt: 0.78, potAt: 0.36 }), a("B", "D"),
    a("C", "E"), a("C", "F", { flippable: true, labelAt: 0.16, flowAt: 0.78, potAt: 0.36 }),
    a("D", "E", { flippable: true, labelAt: 0.16, flowAt: 0.78, potAt: 0.36 }), a("D", "F"),
    a("E", "T"), a("F", "T"),
  ],
  crossings: [["AD", "BC"], ["CF", "DE"]],
};

export const FLOW_TEMPLATES: FlowTemplate[] = [DIAMOND, FAN, LADDER, HEXAGON, BIG8];

export const templatesForLevel = (level: 1 | 2 | 3): FlowTemplate[] => FLOW_TEMPLATES.filter((t) => t.levels.includes(level));
