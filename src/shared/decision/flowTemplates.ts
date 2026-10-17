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
  nodes: [n("S", 50, 230), n("A", 290, 20), n("B", 290, 230), n("C", 290, 440), n("T", 530, 230)],
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

// Mini hub — five vertices with C in the middle; the two side routes may feed C, and a rung may join A and B.
const MINIHUB: FlowTemplate = {
  id: "minihub",
  name: "Mini hub",
  levels: [1],
  nodes: [n("S", 40, 230), n("A", 250, 60), n("B", 250, 400), n("C", 430, 230), n("T", 720, 230)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.5, [0.62, 1], [0.5, -1], { flip: true, opt: true }),
    a("B", "C", 0.5, [0.62, 1], [0.5, -1], { flip: true, opt: true }),
    a("C", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "B", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("A", "T", 0.72, [0.4, 1], [0.58, -1], { opt: true }),
    a("B", "T", 0.72, [0.4, 1], [0.58, -1], { opt: true }),
  ],
};

// Double hub — S, A, B, C, D, E, F, T: a middle spine C–D with a pair of routes either side.
const DOUBLEHUB: FlowTemplate = {
  id: "doublehub",
  name: "Double hub",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 190, 60), n("B", 190, 360), n("C", 330, 210), n("D", 560, 210), n("E", 690, 60), n("F", 690, 360), n("T", 830, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("B", "C", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("C", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "E", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("D", "F", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("E", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.62, [0.3, 1], [0.3, -1]),
    a("A", "B", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("E", "F", 0.5, [0.62, 1], [0.4, -1], { opt: true }),
  ],
};

// Zigzag — S, A, B, C, T: a top route and a bottom route joined by a rung, so flow can step across.
const ZIGZAG: FlowTemplate = {
  id: "zigzag",
  name: "Zigzag",
  levels: [1],
  nodes: [n("S", 40, 230), n("A", 230, 60), n("B", 520, 60), n("C", 330, 400), n("T", 710, 230)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "B", 0.4, [0.62, 1], [0.5, -1], { flip: true }),
    a("A", "C", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
  ],
};

// Tower — S, A, B, C, D, E, F, T: two inner columns of two and three, with rungs between neighbours.
const TOWER: FlowTemplate = {
  id: "tower",
  name: "Tower",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 210, 70), n("B", 210, 350), n("C", 380, 30), n("D", 380, 215), n("E", 380, 400), n("F", 620, 210), n("T", 860, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("B", "D", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("B", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "T", 0.3, [0.5, 1], [0.38, -1]),
    a("D", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.62, [0.3, 1], [0.3, -1]),
    a("E", "T", 0.3, [0.5, 1], [0.38, -1]),
    a("A", "B", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("C", "D", 0.6, [0.6, 1], [0.28, -1], { opt: true, flip: true }),
    a("D", "E", 0.6, [0.6, 1], [0.28, -1], { opt: true }),
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
    a("A", "D", 0.16, [0.84, 1], [0.6, -1], { flip: true, opt: true }),
    a("B", "C", 0.16, [0.84, 1], [0.6, -1], { flip: true, opt: true }),
    a("B", "D", 0.3, [0.68, 1], [0.5, -1]),
    a("C", "E", 0.3, [0.68, 1], [0.5, -1]),
    a("C", "F", 0.16, [0.84, 1], [0.6, -1], { flip: true, opt: true }),
    a("D", "E", 0.16, [0.84, 1], [0.6, -1], { flip: true, opt: true }),
    a("D", "F", 0.3, [0.68, 1], [0.5, -1]),
    a("E", "T", 0.3, [0.6, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.6, 1], [0.5, -1]),
  ],
  crossings: [["AD", "BC"], ["CF", "DE"]],
};

export const FLOW_TEMPLATES: FlowTemplate[] = [DIAMOND, FAN, MINIHUB, ZIGZAG, LADDER, HEXAGON, DOUBLEHUB, TOWER, BIG8];

export const templatesForLevel = (level: 1 | 2 | 3): FlowTemplate[] => FLOW_TEMPLATES.filter((t) => t.levels.includes(level));

// ── Several sources / several sinks (the Supersource / supersink tab) ────────
// Full networks WITH S and T; the question removes them, so the heads of S's arcs become sources and the tails of T's arcs become sinks. Source
// vertices have nothing flowing into them and sink vertices nothing flowing out (so no arc is flippable). Kept out of FLOW_TEMPLATES, hence out of the
// graph bank and the other tabs.

// 5 vertices: two sources feeding one vertex. (Several SOURCES only.)
const TWO_SOURCES: FlowTemplate = {
  id: "twoSources",
  name: "Two sources",
  levels: [1],
  nodes: [n("S", 40, 210), n("A", 230, 70), n("B", 230, 350), n("C", 440, 210), n("T", 740, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "T", 0.72, [0.4, 1], [0.58, -1], { opt: true }),
    a("B", "T", 0.72, [0.4, 1], [0.58, -1], { opt: true }),
  ],
};

// 5 vertices: one vertex feeding two sinks. (Several SINKS only.)
const TWO_SINKS: FlowTemplate = {
  id: "twoSinks",
  name: "Two sinks",
  levels: [1],
  nodes: [n("S", 40, 150), n("C", 260, 330), n("A", 500, 40), n("B", 500, 400), n("T", 760, 220)],
  arcs: [
    a("S", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "A", 0.55, [0.35, 1], [0.7, -1]),
  ],
};

// 6 vertices: two sources, two sinks, one cross arc.
const TWO_BY_TWO: FlowTemplate = {
  id: "twoByTwo",
  name: "Two sources, two sinks",
  levels: [2],
  nodes: [n("S", 40, 210), n("A", 220, 70), n("B", 220, 350), n("C", 450, 70), n("D", 450, 350), n("T", 640, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1], { opt: true }),
    a("C", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "T", 0.3, [0.62, 1], [0.5, -1]),
  ],
};

// 7 vertices: two sources, two sinks, a hub between them.
const HUB_BETWEEN: FlowTemplate = {
  id: "hubBetween",
  name: "Hub between",
  levels: [2],
  nodes: [n("S", 40, 210), n("A", 210, 60), n("B", 210, 360), n("M", 400, 210), n("C", 590, 60), n("D", 590, 360), n("T", 780, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "M", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "M", 0.3, [0.62, 1], [0.5, -1]),
    a("M", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("M", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.5, [0.5, 1], [0.35, -1], { opt: true }),
    a("B", "D", 0.5, [0.5, -1], [0.35, 1], { opt: true }),
    a("C", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "T", 0.3, [0.62, 1], [0.5, -1]),
  ],
};

// 8 vertices: three sources, three sinks.
const THREE_BY_THREE: FlowTemplate = {
  id: "threeByThree",
  name: "Three sources, three sinks",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 250, 20), n("B", 250, 210), n("C", 250, 400), n("D", 560, 20), n("E", 560, 210), n("F", 560, 400), n("T", 800, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "E", 0.4, [0.62, 1], [0.5, -1]),
    a("B", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "F", 0.4, [0.62, 1], [0.5, -1]),
    a("C", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.62, 1], [0.5, -1]),
  ],
};

export const SUPER_TEMPLATES: FlowTemplate[] = [TWO_SOURCES, TWO_SINKS, TWO_BY_TWO, HUB_BETWEEN, THREE_BY_THREE];
export const superTemplatesForLevel = (level: 1 | 2 | 3): FlowTemplate[] => SUPER_TEMPLATES.filter((t) => t.levels.includes(level));

// ── Exam-sized networks (Exam style, Level 3) ────────────────────────────────
// AQA's biggest flow questions have 9–10 vertices (A–J, or S and A–H plus the added T) and 11–17 arcs. These templates are that size. They are used
// ONLY by the exam-style generator (flowExam.ts) — kept out of FLOW_TEMPLATES, so the skills tabs, the graph bank and the 4–8 vertex levels are
// unchanged. `levels: [3]` is nominal.

// Pipeline — S, A–G, T (9 vertices): two columns of inner vertices feeding a pair and then the sink, with optional rungs.
const PIPELINE9: FlowTemplate = {
  id: "pipeline9",
  name: "Pipeline",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 200, 60), n("B", 200, 360), n("C", 400, 30), n("D", 400, 210), n("E", 400, 390), n("F", 610, 100), n("G", 610, 320), n("T", 800, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("B", "D", 0.3, [0.62, 1], [0.5, -1], { flip: true }),
    a("B", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("G", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "B", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("C", "D", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("D", "E", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("F", "G", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
  ],
};

// Double ladder — S, A–H, T (10 vertices): two rails of four with rungs and one diagonal in each gap (no two cross).
const LADDER10: FlowTemplate = {
  id: "ladder10",
  name: "Double ladder",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 200, 60), n("B", 200, 360), n("C", 380, 60), n("D", 380, 360), n("E", 560, 60), n("F", 560, 360), n("G", 740, 60), n("H", 740, 360), n("T", 900, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "H", 0.3, [0.62, 1], [0.5, -1]),
    a("G", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("H", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "D", 0.5, [0.62, 1], [0.4, -1], { flip: true }),
    a("E", "F", 0.5, [0.62, 1], [0.4, -1], { flip: true }),
    a("A", "D", 0.2, [0.8, 1], [0.6, -1], { opt: true }),
    a("D", "E", 0.2, [0.8, 1], [0.6, -1], { opt: true }),
    a("E", "H", 0.2, [0.8, 1], [0.6, -1], { opt: true }),
    a("A", "B", 0.5, [0.62, 1], [0.4, -1], { opt: true }),
    a("G", "H", 0.5, [0.62, 1], [0.4, -1], { opt: true }),
  ],
};

// Hub — S, A, B, C, M, D, E, F, T (9 vertices): three vertices into a central hub and three out, with a bypass over the top and under the bottom.
const HUB9: FlowTemplate = {
  id: "hub9",
  name: "Hub",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 260, 40), n("C", 260, 210), n("B", 260, 380), n("M", 480, 210), n("D", 700, 40), n("F", 700, 210), n("E", 700, 380), n("T", 900, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "M", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "M", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "M", 0.3, [0.62, 1], [0.5, -1]),
    a("M", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("M", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("M", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.5, [0.62, 1], [0.4, -1], { opt: true }),
    a("B", "E", 0.5, [0.62, -1], [0.4, 1], { opt: true }),
    a("A", "C", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("C", "B", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
  ],
};

export const EXAM_TEMPLATES: FlowTemplate[] = [PIPELINE9, LADDER10, HUB9];

// Several sources / sinks, exam-sized (9 and 10 vertices including S and T). Same rules as SUPER_TEMPLATES: nothing flows INTO a source or OUT of a sink.
const BIG_TWO_BY_TWO: FlowTemplate = {
  id: "bigTwoByTwo",
  name: "Two sources, two sinks (large)",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 200, 90), n("B", 200, 330), n("C", 410, 30), n("D", 410, 210), n("E", 410, 390), n("F", 620, 110), n("G", 620, 310), n("T", 800, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("G", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "D", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
    a("D", "E", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
  ],
};

const BIG_THREE: FlowTemplate = {
  id: "bigThree",
  name: "Three sources, three sinks (large)",
  levels: [3],
  nodes: [n("S", 40, 210), n("A", 270, 40), n("B", 270, 210), n("C", 270, 380), n("D", 490, 110), n("E", 490, 320), n("F", 710, 40), n("G", 710, 210), n("H", 710, 380), n("T", 920, 210)],
  arcs: [
    a("S", "A", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "B", 0.3, [0.62, 1], [0.5, -1]),
    a("S", "C", 0.3, [0.62, 1], [0.5, -1]),
    a("A", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "D", 0.3, [0.62, 1], [0.5, -1]),
    a("B", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("C", "E", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "F", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "G", 0.3, [0.62, 1], [0.5, -1]),
    a("E", "H", 0.3, [0.62, 1], [0.5, -1]),
    a("F", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("G", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("H", "T", 0.3, [0.62, 1], [0.5, -1]),
    a("D", "E", 0.5, [0.62, 1], [0.4, -1], { opt: true, flip: true }),
  ],
};

export const EXAM_SUPER_TEMPLATES: FlowTemplate[] = [BIG_TWO_BY_TWO, BIG_THREE];
