// ─────────────────────────────────────────────────────────────────────────────
// CS shell — the shared type contract for a knowledge/revision topic.
// A topic supplies data shaped like these; the shell renders it. See
// CS_SHELL_PLAN.md. Spec tags are plain strings (each topic defines its own).
// ─────────────────────────────────────────────────────────────────────────────

export type SpecTag = string;   // e.g. "1.1.1-R3"

// Exam formats — the same set for every CS topic (colours are shell-level).
export const MARK_FORMATS = {
  mcq:      { label: "Multiple choice",  short: "MCQ",       color: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" },
  state:    { label: "State / Identify", short: "State",     color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0" },
  short:    { label: "Short response",   short: "Short",     color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  scenario: { label: "Apply to scenario", short: "Scenario", color: "#7c2d12", bg: "#fff7ed", border: "#fed7aa" },
  extended: { label: "Extended response", short: "Extended", color: "#5b21b6", bg: "#f5f3ff", border: "#ddd6fe" },
} as const;

export type ExamFormat = keyof typeof MARK_FORMATS;

// Command-word guidance — what each format is really asking for (shell-level).
export const COMMAND_GUIDE: Record<ExamFormat, string> = {
  mcq:      "Multiple choice: pick the single best option. One mark, no working.",
  state:    "State / Identify: give the fact only — no explanation is needed for the mark.",
  short:    "Describe: say what happens, clearly and in the right order. 'Why' is not required.",
  scenario: "Apply: use the idea in THIS scenario — refer to the specific details you're given.",
  extended: "Explain: make each point AND justify it ('… because …'), and link your ideas together.",
};

export interface FlashCard {
  id: number;
  specTag: SpecTag;
  beyondSpec?: boolean;      // enrichment — excluded from default sessions
  q: string;
  a: string;
  terms?: string[];          // glossary terms to underline; [] = none
  distractors?: string[];    // for MCQ / Quiz mode
  explain?: string;          // elaboration — the "why" / how-to-remember, shown as feedback
}

export interface ClozeExercise {
  id: number;
  title: string;
  specTag: SpecTag;
  beyondSpec?: boolean;
  text: string;              // [WORD] marks a slot
  words: string[];           // correct answers + distractors
}

export interface ExamQuestion {
  id: string;
  specTag: SpecTag;
  beyondSpec?: boolean;
  format: ExamFormat;
  marks: number;
  prompt: string;            // may contain {context}
  contexts?: string[];
  options?: string[];        // mcq only
  answerIndex?: number;      // mcq only
  hint: string;
  markScheme: string[];
  modelNotes?: Record<string, string[]>;
  modelAnswer?: string;      // full prose model answer; **bold** marks the mark-earning parts
}

export interface SynopticQuestion {
  id: string;
  specTags: SpecTag[];       // the sub-topics this question spans
  format: ExamFormat;
  marks: number;
  prompt: string;
  hint: string;
  markScheme: { tag: SpecTag; points: string[] }[];  // per-tag mark attribution
  modelAnswer?: string;
}

// Misconception check — Spot-the-Mistake / True-or-False.
export interface MythItem {
  id: number;
  specTag: SpecTag;
  statement: string;
  isTrue: boolean;
  why: string;               // the correction / explanation shown after answering
}

// A value token that animates between two diagram parts on a lesson beat.
export interface Flow { from: string; to: string; label: string; kind?: "addr" | "data" }

export interface LessonStep {
  text: string;
  highlight?: string[];
  legend?: boolean;
  flow?: Flow;                        // animated token travelling between parts
  predict?: string;                   // You-do: a question posed before the answer (text)
  trace?: Record<string, string>;     // register snapshot for kind:"trace" lessons
}

export interface Lesson {
  id: string; title: string; specTags: SpecTag[];
  kind?: "diagram" | "trace";
  analogy?: string;                   // "Think of it like…" concrete anchor
  steps: LessonStep[];
}

export interface InfoItem { label: string; detail: string }
export interface InfoSection { title: string; items: InfoItem[] }
