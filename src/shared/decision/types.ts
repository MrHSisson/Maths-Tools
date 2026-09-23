// ═══════════════════════════════════════════════════════════════════════════
// Decision Mathematics shell — the authoring contracts.
//
// A Decision Maths problem is a DATA STRUCTURE (a weighted network), not a KaTeX
// string, and its working is a STATEFUL WALKTHROUGH over that structure (highlight
// this edge into the tree, discount that one as a cycle) — which is why this family
// gets its own shell rather than living on ToolShell. See docs/architecture/DECISION_SHELL_PLAN.md.
// ═══════════════════════════════════════════════════════════════════════════

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
  edgeStates: Record<string, EdgeState>; // edgeId → state
  nodeStates?: Record<string, string>; // nodeId → label/annotation (Dijkstra values, CPA times)
  nodeRoles?: Record<string, NodeRole>; // nodeId → highlight
  matrixCells?: MatrixCell[];
  matrix?: DistanceTable; // override the table MatrixView shows this beat
  matrixTitle?: string; // e.g. "Table of least distances"
  runningTotal?: number; // e.g. MST weight so far
}

// ── The tool → shell contract ───────────────────────────────────────────────
export interface DecisionShellProps {
  generate: (level: number) => DecisionProblem; // parameterised-template sampling inside
  solve: (p: DecisionProblem) => SolveStep[]; // the algorithm, as ordered beats
  config: {
    pageTitle: string;
    instruction?: string;
    levels?: number; // >1 shows a level picker in the header
    levelLabels?: string[]; // tooltip per level, e.g. ["Complete network", …]
    questionMatrix?: boolean; // show the distance matrix beside the network in Question mode
  };
  // later: sandbox?, print?, questionTypes?, info?
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
