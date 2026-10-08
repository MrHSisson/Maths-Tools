// ═══════════════════════════════════════════════════════════════════════════
// Decision Mathematics shell — the authoring contracts.
//
// A Decision Maths problem is a DATA STRUCTURE (a weighted network), not a KaTeX
// string, and its working is a STATEFUL WALKTHROUGH over that structure (highlight
// this edge into the tree, discount that one as a cycle) — which is why this family
// gets its own shell rather than living on ToolShell. See docs/architecture/DECISION_SHELL_PLAN.md.
// ═══════════════════════════════════════════════════════════════════════════

import type { ReactNode } from "react";
import type { FlowProblemData, FlowViewState } from "./flow";

// ── A network, concrete ─────────────────────────────────────────────────────
export interface GNode {
  id: string;
  x: number; // logical board coordinates (authored, crossing-free)
  y: number;
  label?: string;
}

export interface GEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  directed?: boolean;
  labelAt?: number; // where the weight label sits, as a fraction from→to (default 0.5, the midpoint)
}

export interface Network {
  nodes: GNode[];
  edges: GEdge[];
}

// ── A hand-authored SHAPE with declared degrees of freedom ──────────────────
// sampleTemplate() draws a concrete Network within these bounds — because node
// positions are authored the diagram is always clean; because bounds are authored
// the question is always solvable.
export interface TemplateEdge {
  id: string;
  from: string;
  to: string;
  weight: [min: number, max: number]; // sampled per generation
  optional?: boolean; // may or may not appear this time (coin-flip)
}

export interface NetworkTemplate {
  id: string;
  nodes: GNode[]; // fixed positions (the clean layout)
  edges: TemplateEdge[];
}

// ── A generated problem the shell renders ───────────────────────────────────
export interface DecisionProblem {
  network: Network;
  prompt: string; // "Find the minimum spanning tree and its total weight."
  answer: {
    text: string;
    edges?: string[];
    value?: number;
    tour?: string[]; // TSP: vertex order of the closed tour, start repeated at the end
  }; // definite, checkable
  templateId?: string; // provenance (undefined for the free bypass)
  flow?: FlowProblemData; // Network Flows: the flow-specific data (the shell's default canvas ignores it)
  start?: string; // the start vertex, for algorithms that begin somewhere (NN, Prim from X, Dijkstra)
}

// ── One beat of an algorithm walkthrough — the crux primitive ───────────────
export type EdgeState = "idle" | "considering" | "tree" | "rejected";

// highlight = chosen/accepted (green) · strike = rejected (red) · considering =
// being scanned this beat (amber) · dim = out of play, e.g. a visited column (grey).
export type MatrixCellState = "highlight" | "strike" | "considering" | "dim";

export interface MatrixCell {
  r: string; // row node id
  c: string; // column node id
  state: MatrixCellState;
}

// An explicit table for MatrixView to show instead of the one read off the
// network's edges — e.g. a table of least distances being filled in, where some
// entries are routes through other vertices rather than direct edges.
export interface DistanceTable {
  values: Record<string, Record<string, number | null>>; // row → col → value (null = blank)
  indirect?: string[]; // "r|c" keys whose value is a route via other vertices, not a direct edge
}

// How a vertex is drawn this beat: the one the algorithm is at, or one already done.
export type NodeRole = "current" | "visited";

export interface SolveStep {
  caption: string; // the teaching voice for this beat
  phase?: string; // short stage label shown above the caption, e.g. "Complete the table"
  route?: string[]; // vertices visited so far, shown as a trail (TSP tours, Prim order)
  edgeStates: Record<string, EdgeState>; // edgeId → state
  nodeStates?: Record<string, string>; // nodeId → label/annotation (Dijkstra values, CPA times)
  nodeRoles?: Record<string, NodeRole>; // nodeId → highlight
  matrixCells?: MatrixCell[];
  matrix?: DistanceTable; // override the table MatrixView shows this beat
  matrixTitle?: string; // e.g. "Table of least distances"
  runningTotal?: number; // e.g. MST weight so far
  totalLabel?: string; // label for the running-total badge (default "Total")
  flowView?: FlowViewState; // Network Flows: how the flow diagram is drawn this beat
}

// ── A colour-key entry — the swatch reuses the renderers' own styles ──────────
export interface LegendItem {
  swatch: EdgeState | NodeRole | "indirect";
  label: string;
}

// ── The tool → shell contract ───────────────────────────────────────────────
// A tool with several question types ("sub-tools") and Question Options gets a tab row
// and a segmented control under the header; the chosen values reach generate() as ctx.
export interface ShellSubTool {
  key: string;
  label: string;
}
export interface ShellOption {
  key: string;
  label: string;
  choices: Array<{ value: string; label: string }>;
  /** only show this option on these sub-tool tabs (default: all) */
  forSubTools?: string[];
  /** the value this option takes for a level (reset whenever the level changes) */
  defaultFor?: (level: number) => string;
}
export interface GenerateContext {
  subTool: string;
  options: Record<string, string>;
}

export interface DecisionShellProps {
  generate: (level: number, ctx?: GenerateContext) => DecisionProblem; // parameterised-template sampling inside
  solve: (p: DecisionProblem) => SolveStep[]; // the algorithm, as ordered beats
  /** Replace the default NetworkView canvas (e.g. FlowView). `step` is undefined in Question mode. */
  renderCanvas?: (problem: DecisionProblem, step: SolveStep | undefined) => ReactNode;
  config: {
    pageTitle: string;
    instruction?: string;
    levels?: number; // >1 shows a level picker in the header
    levelLabels?: string[]; // tooltip per level, e.g. ["Complete network", …]
    questionMatrix?: boolean; // show the distance matrix beside the network in Question mode
    hideMatrix?: boolean; // never show the matrix (tools whose working isn't a table)
    subTools?: ShellSubTool[]; // tab row of question types
    options?: ShellOption[]; // segmented controls (Question Options)
    legend?: LegendItem[]; // colour key shown under the matrix in Solution mode
    /** a key shown under the canvas in every mode (for tools whose colours aren't edge states) */
    canvasFooter?: ReactNode | ((p: DecisionProblem) => ReactNode);
  };
  // later: sandbox?, print?, info?
}

// ── The CI-validation surface a tool exports as `__problem` ─────────────────
export interface DecisionProblemExport {
  templates: NetworkTemplate[];
  levels?: number[]; // levels to validate (default [1])
  // Which independent brute-force reference validate.ts checks the answer against (default "mst").
  reference?: "mst" | "nearestNeighbour";
  generate: (level: number) => DecisionProblem;
  solve: (p: DecisionProblem) => SolveStep[];
}
