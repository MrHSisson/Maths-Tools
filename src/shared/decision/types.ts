// ═══════════════════════════════════════════════════════════════════════════
// Decision Mathematics shell — the authoring contracts.
//
// A Decision Maths problem is a DATA STRUCTURE (a weighted network), not a KaTeX
// string, and its working is a STATEFUL WALKTHROUGH over that structure (highlight
// this edge into the tree, discount that one as a cycle) — which is why this family
// gets its own shell rather than living on ToolShell. See docs/architecture/DECISION_SHELL_PLAN.md.
// ═══════════════════════════════════════════════════════════════════════════

import type { ReactNode } from "react";
import type { InfoSection } from "../types";
import type { FlowProblemData, FlowViewState } from "./flow";
import type { CpaProblemData, CpaViewState, GanttViewState, HistViewState } from "./cpa";

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
  level?: number; // the level it was generated at (a tool may set it so the working can adapt, e.g. Prim on a table merges its beats at Levels 2–3)
  templateId?: string; // provenance (undefined for the free bypass)
  flow?: FlowProblemData; // Network Flows: the flow-specific data (the shell's default canvas ignores it)
  /** An exam-style question: one picture and a chain of lettered parts with marks, each with a model answer and a mark scheme to self-mark against. */
  exam?: ExamData;
  cpa?: CpaProblemData; // Critical Path Analysis: the activities, their times and the laid-out network
  /** Route Inspection: which question this is — the working and the independent reference are both rebuilt from the network and these ends */
  route?: { start: string; end?: string };
  start?: string; // the start vertex, for algorithms that begin somewhere (NN, Prim from X, Dijkstra)
  /** which question this is, for the CI validator to pick its independent reference ("kruskal", "primNetwork", "primMatrix", "tspNN", "tspLower", "tspBounds", "tspTable") */
  kind?: string;
  deleted?: string; // TSP lower bound: the vertex deleted
  starts?: string[]; // TSP nearest neighbour: every start vertex asked for (the first is `start`)
  /** TSP bounds: the numbers the question's answer is built from */
  bounds?: { lower?: number; upper?: number };
  /** Overrides config: show the distance matrix beside the network in the question, only in the working, or never. */
  /** A line shown under the picture in the question (Route Inspection: the total weight of the edges, before any are repeated). */
  caption?: string;
  matrixMode?: "question" | "working" | "off";
  /** Overrides config.legend for this question. */
  legend?: LegendItem[];
  /** TSP: the complete network of least distances (every pair joined, each weight the table entry), drawn once the table is complete */
  complete?: Network;
  /** The question hands the network over as a table only: Question mode draws the vertices without their edges. */
  vertexOnlyQuestion?: boolean;
}

// ── An exam-style question ───────────────────────────────────────────────────
/** One mark on a mark scheme: B1 independent · M1 method · A1 accuracy · E1 explanation · R1 reasoned argument (a trailing F = follow-through). */
export interface ExamMark { code: string; text: string }
export interface ExamPart {
  label: string; // "(a)", "(b)"
  prompt: string;
  marks: number; // = scheme.length
  scheme: ExamMark[];
  model: string[]; // the answer that earns the marks, a line each (shown when the answer is revealed)
  /** the answer is drawn on the picture (the blank figure the question gives, filled in): `model` is then empty and `view` is the filled-in figure. A print sheet draws the blank figure (`ExamData.blank`) under the question. */
  onDiagram?: boolean;
  /** what kind of part this is, for printing: the potentials / flow augmentation parts share a blank network the student works on; adding a supersource / supersink comes first */
  role?: "potentials" | "augment" | "superAdd";
  /** the step-by-step working, from the same solver as the skill question of this kind (so it cannot drift from the skills tabs); the (?) plays it like Worked Example. Parts with no matching skill keep `explain`. */
  working?: SolveStep[];
  explain?: string[]; // how to get there, a line each (shown only when the student presses the (?) beside the answer)
  /** how the picture looks while this part's answer is showing (a tool's own view state) */
  view?: unknown;
  /** …or, for a tool whose pictures are whole steps (Critical Path Analysis): the step the picture shows while this part's answer is showing */
  stepView?: SolveStep;
  /** …and the picture a printed paper gives the student to draw the answer on (blank axes, a blank network) */
  blankStep?: SolveStep;
}
export interface ExamData {
  id: string; // a fresh one per question, so the layout resets
  intro: string; // the context sentence(s)
  parts: ExamPart[];
  totalMarks: number;
  minutes: number; // suggested time
}

// ── One beat of an algorithm walkthrough — the crux primitive ───────────────
export type EdgeState = "idle" | "considering" | "tree" | "rejected" | "added";

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
export type NodeRole = "current" | "visited" | "deleted";

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
  /** exam chains: which chart sits under the network on this step */
  examChart?: "cascade" | "alloc" | "histogram" | "level" | "choose";
  histView?: HistViewState; // Critical Path Analysis: which blocks of the resource histogram are drawn this beat
  ganttView?: GanttViewState; // Critical Path Analysis: which bars and floats of the cascade chart are drawn this beat
  cpaView?: CpaViewState; // Critical Path Analysis: which boxes and arrows are drawn this beat, and which times are filled in
  /** Draw THIS network instead of the question's (TSP: the complete network of least distances, then the original again for the real route); `edgeStates` then refer to its edges */
  network?: Network;
  edgeOrder?: Record<string, string>; // edgeId → the number it was chosen at, drawn as a badge on its weight
  matrixOrder?: Record<string, string>; // vertex → the number written over its column heading (Prim on a matrix)
  matrixCrossed?: string[]; // vertices whose ROW is crossed out (Prim on a matrix)
  list?: StepList; // a titled row of chips (Kruskal's sorted edges, Prim's candidates, the tour…)
}

export interface StepListItem {
  text: string;
  tone?: "pending" | "current" | "good" | "bad" | "note";
}
export interface StepList {
  title: string;
  items: StepListItem[];
}

// ── A colour-key entry — the swatch reuses the renderers' own styles ──────────
export interface LegendItem {
  swatch: EdgeState | NodeRole | "indirect";
  label: string;
}

// ── The tool → shell contract ───────────────────────────────────────────────
// A tool with several question types ("sub-tools") and Question Options gets a tab row
// and a segmented control under the header; the chosen values reach generate() as ctx.
/** Show this tab / option only while another option has one of these values (e.g. A-level tabs only when the course is A-level). */
export interface ShellWhen { key: string; values: string[] }
export interface ShellSubTool {
  key: string;
  label: string;
  when?: ShellWhen | ShellWhen[]; // an array: every condition must hold
  /** one line under the label on the topic chooser's tile */
  blurb?: string;
  /** how many levels this tab has (default: the tool's `levels`); one level hides the level picker on this tab */
  levels?: number;
}
/** A tool with many question types swaps its option row + tab row for one collapsible chooser: the top-tier options it names become filters inside it, and the tabs become grouped tiles. */
export interface ShellChooser {
  /** `top` option keys shown as filters inside the chooser (the shell stops drawing them as big tabs) */
  filters: string[];
  /** sub-tool keys in titled groups (a group with no tab on offer for the current options is hidden) */
  groups: Array<{ title: string; keys: string[] }>;
  /** a small picture for a topic's tile (drawn on a light panel at the top of the tile) */
  art?: (key: string) => ReactNode;
}
export interface ShellOption {
  key: string;
  label: string;
  choices: Array<{ value: string; label: string }>;
  /** shown as the top tier of big tabs above the sub-tool tabs, not inside the Question Options popover */
  top?: boolean;
  /** only show this option while another option has one of these values (an array: every condition must hold) */
  when?: ShellWhen | ShellWhen[];
  /** only show this option on these sub-tool tabs (default: all) */
  forSubTools?: string[];
  /** the value this option takes for a level (reset whenever the level changes) */
  defaultFor?: (level: number, subTool?: string) => string;
  /**
   * Several of the choices can be ticked at once (never none). The value is the ticked choices joined with commas ("one,more"), and a question draws
   * from them at random, so "both" is simply both ticked. `defaultFor` gives the ticks for a level and sub-tool (a comma list); until the teacher
   * changes the ticks the value is "" and follows the level, so choosing a level selects what that level needs.
   */
  multi?: boolean;
}
export interface GenerateContext {
  subTool: string;
  options: Record<string, string>;
}

/** What the sandbox hands a tool's canvas renderer so the SAME drawing can be shown with moved vertices (a static question gets none of these). */
export interface CanvasExtras {
  /** the vertices at their current (dragged) positions */
  nodes?: GNode[];
  /** a fixed frame, so the picture does not rescale as vertices move */
  box?: { x: number; y: number; w: number; h: number };
  /** pressing a vertex (the sandbox drags it) */
  onNodeDown?: (id: string, e: React.PointerEvent<SVGGElement>) => void;
}

export interface DecisionShellProps {
  generate: (level: number, ctx?: GenerateContext) => DecisionProblem; // parameterised-template sampling inside
  solve: (p: DecisionProblem) => SolveStep[]; // the algorithm, as ordered beats
  /** Replace the default NetworkView canvas (e.g. FlowView). `step` is undefined in Question mode. */
  renderCanvas?: (problem: DecisionProblem, step: SolveStep | undefined, extras?: CanvasExtras) => ReactNode;
  config: {
    pageTitle: string;
    instruction?: string;
    levels?: number; // >1 shows a level picker in the header
    /** extra items in the burger menu (e.g. printing a blank template); each gets the menu's trusted-click treatment so a print popup is allowed */
    menuItems?: { label: string; hint?: string; onClick: () => void }[];
    /** show what each level means in an (i) pop-up beside the level buttons (this sub-tool's levels, the current one marked) instead of a "Levels" section in the burger menu's Info */
    levelInfo?: boolean;
    levelLabels?: string[] | Record<string, string[]>; // tooltip per level, e.g. ["Complete network", …] — or per sub-tool key (a `default` entry covers the rest)
    questionMatrix?: boolean; // show the distance matrix beside the network in Question mode
    hideMatrix?: boolean; // never show the matrix (tools whose working isn't a table)
    noSandbox?: boolean; // hide the Sandbox button (tools whose picture is not a network of movable vertices)
    matrixMissing?: string; // what a table cell with no edge shows (default blank; Prim on a matrix uses "–")
    subTools?: ShellSubTool[]; // tab row of question types
    options?: ShellOption[]; // segmented controls (Question Options)
    chooser?: ShellChooser; // collapsible topic chooser in place of the top-tier tabs and the tab row
    infoSections?: InfoSection[]; // teacher-facing guide shown by the menu's Info item
    legend?: LegendItem[]; // colour key shown under the matrix in Solution mode
    /** a key shown under the canvas in every mode (for tools whose colours aren't edge states) */
    canvasFooter?: ReactNode | ((p: DecisionProblem) => ReactNode);
  };
  // later: sandbox?, print?
}

// ── The CI-validation surface a tool exports as `__problem` ─────────────────
export interface DecisionProblemExport {
  templates: NetworkTemplate[];
  levels?: number[]; // levels to validate (default [1])
  /** Sub-tools to validate: a key (generated with default options) or a full { subTool, options } context to cover an option. */
  subTools?: Array<string | GenerateContext>;
  // Which independent brute-force reference validate.ts checks the answer against when the problem has no `kind` (default "mst").
  reference?: "mst" | "nearestNeighbour";
  generate: (level: number, ctx?: GenerateContext) => DecisionProblem;
  solve: (p: DecisionProblem) => SolveStep[];
}
