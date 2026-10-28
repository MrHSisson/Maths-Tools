import type { QuestionBrief } from "../../api/_questionBrief";
import type { CuratedQuestion } from "../../api/_questions";
export type { CuratedQuestion } from "../../api/_questions";

// ─────────────────────────────────────────────────────────────────────────────
// Decks — a combined, directed lesson, and a small slide editor built around it.
//
// A deck is an ordered list of slides; a slide is a 16:9 canvas (CANVAS_W × CANVAS_H units) holding positioned
// elements. Basic elements (text with $...$ maths, shapes, lines, images) sit beside integrated ones that only this
// site can offer (a practice question with its bank and generator, a board with fill modes). Data only: nothing in
// here draws anything, so the shell can list decks without loading the player. Guide: docs/reference/decks.md.
// ─────────────────────────────────────────────────────────────────────────────

export const CANVAS_W = 1600;
export const CANVAS_H = 900;
/** Smallest text a slide may carry, in canvas units (about 22px on a laptop, readable from the back of a room). */
export const MIN_TEXT = 26;

export type DeckFamily = "structure" | "language" | "teach" | "practice" | "depth" | "discussion" | "retrieval";

/** How much of a board is filled in: everything · the given columns only · nothing (blank boxes to write in). */
export type FillMode = "filled" | "structure" | "blank";

export interface BoardGrid {
  /** Column headings (`$...$` is inline maths). */
  head: string[];
  /** Rows of cells; `$...$` is inline maths. */
  rows: string[][];
  /** The first `given` columns stay visible in "structure" mode (the rest become blank boxes). Default 1. */
  given?: number;
}

/** The generator a practice question falls back on once its hand-picked bank is used up. `multiSelect` is the
 *  tool's Question Options (every option listed, true/false). */
export interface GeneratorPreset {
  /** The tool's sub-tool key (its tab); the first sub-tool when absent. */
  sub?: string;
  level: "level1" | "level2" | "level3";
  multiSelect?: Record<string, boolean>;
  variables?: Record<string, boolean>;
  dropdown?: string;
}

/** Every element is a box: `x, y` its top-left and `w, h` its size, in canvas units. A line runs from (x, y) to
 *  (x + w, y + h), so its `w` / `h` may be negative. `step` is the click it appears on when presenting (0 or absent:
 *  with the slide; 1: the first press of Next; …), for a slide with a fixed click order such as the split discussion. */
interface Box { id: string; x: number; y: number; w: number; h: number; step?: number }

type TextAlign = "left" | "center" | "right";
export type DeckElement = Box & (
  | { kind: "text"; text: string; size: number; bold?: boolean; colour?: string; align?: TextAlign; middle?: boolean }
  | { kind: "maths"; latex: string; size: number; colour?: string; align?: TextAlign }
  | { kind: "shape"; shape: "rect" | "ellipse"; fill?: string; stroke?: string; strokeWidth?: number; radius?: number }
  | { kind: "line"; colour?: string; width?: number; arrow?: boolean }
  | { kind: "image"; src: string }
  | { kind: "board"; grid: BoardGrid; fill?: FillMode; size?: number }
  | { kind: "questions"; items: CuratedQuestion[]; size?: number }
  | { kind: "practice"; tool: string; intention?: string; bank: string[]; generator?: GeneratorPreset; prompt?: string; size?: number }
  /** The tool's generator running live, like the Whiteboard: a stable first question (from `seed`), New question,
   *  the answer, and the working one step at a time. */
  | { kind: "generator"; tool: string; preset: GeneratorPreset; seed?: number; prompt?: string; size?: number }
  /** A book activity: `count` generated questions numbered in a grid, answers on demand, a new set, and Print. */
  | { kind: "worksheet"; tool: string; preset: GeneratorPreset; count: number; cols: number; seed?: number; prompt?: string; size?: number }
  /** One of a tool's Depth items (its `__test.depthItems`), drawn flat on the slide (DepthFlat): question, then answer. */
  | { kind: "depth"; tool: string; item: string }
  /** Several hand-picked questions at once (a quickfire block, a retrieval starter, an exit ticket); answers on demand. */
  | { kind: "grid"; items?: CuratedQuestion[]; bank: string[]; cols: number; size?: number }
);

export interface Slide {
  /** Stable within the deck (`<deck>-<slug>` for built decks). */
  id: string;
  family: DeckFamily;
  /** Shown in the jump list and the slide strip. */
  title: string;
  /** Authoring brief: the running teaching thread, saved/exported with the deck, never projected. */
  intent?: { purpose: string; questionFocus: string; evidence: string; next: string };
  questionBrief?: QuestionBrief;
  els: DeckElement[];
}

export interface DeckDef {
  /** URL-safe; the page is /decks/<id>. */
  id: string;
  title: string;
  summary: string;
  /** Registry id and path of the tool this deck belongs to (its burger menu lists the deck). Optional for a teacher's own deck. */
  tool?: string;
  toolPath?: string;
  slides: Slide[];
  /** When this copy was last saved (ISO time), stamped by the device that saved it; built decks have none. */
  updatedAt?: string;
  questionVersion?: 2;
}

/** A hand-picked practice question, written against ONE misconception (src/shared/misconceptions.ts). */
export interface BankQuestion {
  title?: string;
  teaching?: { rationale: string; expectedErrors: { response: string; reasoning: string }[]; followUp: string };
  id: string;
  tool: string;
  level: "level1" | "level2" | "level3";
  /** Misconception id this question is built to catch. */
  tag: string;
  /** The question as LaTeX (no `$`); empty for a worded question. */
  latex: string;
  /** A worded question's lines (`$...$` is inline maths), drawn instead of `latex`. */
  lines?: string[];
  /** The answer as LaTeX. */
  answer: string;
  /** The worked solution: a label and a line of LaTeX per step. */
  working: { label: string; latex: string }[];
}

/** Family accents: inside the site palette, and none of green / yellow / red (those are the level colours). */
export const FAMILY_STYLE: Record<DeckFamily, { label: string; colour: string }> = {
  structure: { label: "Lesson", colour: "#475569" },
  language: { label: "Language", colour: "#7c3aed" },
  teach: { label: "Teach", colour: "#0369a1" },
  practice: { label: "Practice", colour: "#1e3a8a" },
  depth: { label: "Depth", colour: "#0f766e" },
  discussion: { label: "Discussion", colour: "#be185d" },
  retrieval: { label: "Retrieval", colour: "#78350f" },
};

export type LibraryQuestion = BankQuestion | CuratedQuestion;

export type QuestionSlideDraft = Pick<Slide, "title" | "intent" | "questionBrief">;
