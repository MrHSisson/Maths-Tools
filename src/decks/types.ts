// ─────────────────────────────────────────────────────────────────────────────
// Decks — a combined, directed lesson. A deck is an ordered list of slide configs; a slide holds a reference
// plus presets, never a copy. Data only: nothing in here draws anything (the player is DeckPlayer.tsx), so the
// shell can list decks without loading the player. Authoring guide: docs/reference/decks.md.
// ─────────────────────────────────────────────────────────────────────────────

type DeckFamily = "structure" | "language" | "teach" | "practice";

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

/** The generator a practice slide falls back on once its hand-picked bank is used up, or when asked for more.
 *  `multiSelect` is the tool's Question Options (every option listed, true/false). */
interface GeneratorPreset {
  level: "level1" | "level2" | "level3";
  multiSelect?: Record<string, boolean>;
  variables?: Record<string, boolean>;
  dropdown?: string;
}

export type SlideConfig =
  // Structure — frame the lesson
  | { type: "title"; title: string; subtitle?: string }
  | { type: "objective"; objective: string; success?: string[] }
  | { type: "divider"; title: string; subtitle?: string }
  | { type: "plenary"; title?: string; points: string[] }
  // Language — shared meaning
  | { type: "vocab"; title?: string; terms: { term: string; meaning: string }[] }
  | { type: "definition"; term: string; definition: string }
  // Teach — show and explain; the working is left to the board
  | { type: "board"; title: string; prompt?: string; grid: BoardGrid; fill?: FillMode }
  // Practice — a targeted question: hand-picked bank first, generator as the backup
  | { type: "practice"; title?: string; prompt?: string; intention: string; bank: string[]; generator?: GeneratorPreset };

export interface DeckDef {
  /** URL-safe; the page is /decks/<id>. */
  id: string;
  title: string;
  summary: string;
  /** Registry id of the tool this deck belongs to (its burger menu lists the deck; practice slides use its generator and bank). */
  tool: string;
  /** Registry path of that tool (the "back to the tool" link). */
  toolPath: string;
  slides: SlideConfig[];
}

/** A hand-picked practice question, written against ONE misconception (src/shared/misconceptions.ts). */
export interface BankQuestion {
  id: string;
  tool: string;
  level: "level1" | "level2" | "level3";
  /** Misconception id this question is built to catch. */
  tag: string;
  /** The question as LaTeX (no `$`). */
  latex: string;
  /** The answer as LaTeX. */
  answer: string;
  /** The worked solution: a label and a line of LaTeX per step. */
  working: { label: string; latex: string }[];
}

export const FAMILY_OF: Record<SlideConfig["type"], DeckFamily> = {
  title: "structure", objective: "structure", divider: "structure", plenary: "structure",
  vocab: "language", definition: "language",
  board: "teach",
  practice: "practice",
};

/** Family accents: inside the site palette, and none of green / yellow / red (those are the level colours). */
export const FAMILY_STYLE: Record<DeckFamily, { label: string; colour: string }> = {
  structure: { label: "Lesson", colour: "#475569" },
  language: { label: "Language", colour: "#7c3aed" },
  teach: { label: "Teach", colour: "#0369a1" },
  practice: { label: "Practice", colour: "#1e3a8a" },
};

export const slideTitle = (s: SlideConfig): string => {
  switch (s.type) {
    case "title": case "divider": return s.title;
    case "objective": return "Learning objective";
    case "plenary": return s.title ?? "Summary";
    case "vocab": return s.title ?? "Key vocabulary";
    case "definition": return s.term;
    case "board": return s.title;
    case "practice": return s.title ?? "Practice";
  }
};
