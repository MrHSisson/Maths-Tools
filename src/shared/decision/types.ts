// ═══════════════════════════════════════════════════════════════════════════
// Decision Mathematics shell — the authoring contracts.
//
// A Decision Maths problem is a DATA STRUCTURE (a weighted network), not a KaTeX
// string, and its working is a STATEFUL WALKTHROUGH over that structure (highlight
// this edge into the tree, discount that one as a cycle) — which is why this family
// gets its own shell rather than living on ToolShell. See DECISION_SHELL_PLAN.md.
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
  answer: { text: string; edges?: string[]; value?: number }; // definite, checkable
  templateId?: string; // provenance (undefined for the free bypass)
}

// ── One beat of an algorithm walkthrough — the crux primitive ───────────────
export type EdgeState = "idle" | "considering" | "tree" | "rejected";

export interface MatrixCell {
  r: string; // row node id
  c: string; // column node id
  state: "highlight" | "strike";
}

export interface SolveStep {
  caption: string; // the teaching voice for this beat
  edgeStates: Record<string, EdgeState>; // edgeId → state
  nodeStates?: Record<string, string>; // nodeId → label/annotation (Dijkstra values, CPA times)
  matrixCells?: MatrixCell[];
  runningTotal?: number; // e.g. MST weight so far
}

// ── The tool → shell contract ───────────────────────────────────────────────
export interface DecisionShellProps {
  generate: (level: number) => DecisionProblem; // parameterised-template sampling inside
  solve: (p: DecisionProblem) => SolveStep[]; // the algorithm, as ordered beats
  config: { pageTitle: string; instruction?: string; levels?: number };
  // later: sandbox?, print?, questionTypes?, info?
}

// ── The CI-validation surface a tool exports as `__problem` ─────────────────
export interface DecisionProblemExport {
  templates: NetworkTemplate[];
  generate: (level: number) => DecisionProblem;
  solve: (p: DecisionProblem) => SolveStep[];
}
