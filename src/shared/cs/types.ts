// ─────────────────────────────────────────────────────────────────────────────
// CS shell — the shared type contract for a knowledge/revision topic.
// A topic supplies data shaped like these; the shell renders it. See
// CS_SHELL_PLAN.md. Spec tags are plain strings (each topic defines its own).
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

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

// A value token that animates between two diagram parts on a lesson beat. `kind`
// keys into the schematic's roleColor/roleTint palette — "addr"/"data" carry the
// usual blue/green; "slow" flags a costly transfer (e.g. a cache miss out to RAM).
export interface Flow { from: string; to: string; label: string; kind?: "addr" | "data" | "slow" }

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
  kind?: "diagram" | "trace" | "text";  // "text" = a deliberately diagram-free lesson
  scene?: string;                     // diagram lessons: names an entry in scenes.schematics
                                      // (omit to use the topic's default scenes.schematic)
  analogy?: string;                   // "Think of it like…" concrete anchor
  steps: LessonStep[];
}

export interface InfoItem { label: string; detail: string }
export interface InfoSection { title: string; items: InfoItem[] }

// ─────────────────────────────────────────────────────────────────────────────
// Representations — the CS "scheme of work": data-configurable visuals a topic
// picks from. See CS_SHELL_PLAN.md ("representations as data"). A brand-new
// representation needs a reason; extend an existing one where possible.
// ─────────────────────────────────────────────────────────────────────────────

// ── Box schematic (generalised CpuDiagram): labelled boxes that highlight, with
//    a value token flowing along a route. Nodes are keyed by id; a Flow names two
//    node ids. Roles key into the topic's roleColor / roleTint palettes.
export interface SchematicNode {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string;
  role: string;                    // key into SchematicConfig.roleColor / roleTint
}

// A dashed (or solid) grouping box drawn behind the nodes, with an optional
// corner label — e.g. the "CPU" boundary around the registers.
export interface SchematicContainer {
  x: number; y: number; w: number; h: number;
  rx?: number;
  dashed?: boolean;
  stroke?: string;
  label?: string;
  labelX?: number; labelY?: number;
  labelSize?: number; labelColor?: string;
}

// A free-standing text annotation (e.g. "REGISTERS", "main memory").
export interface SchematicText {
  x: number; y: number; text: string;
  size?: number; weight?: number; color?: string;
  anchor?: "start" | "middle" | "end";
  letterSpacing?: string;
}

// A connecting line that thickens/darkens when any of its endpoints are hot.
export interface SchematicBus {
  x1: number; y1: number; x2: number; y2: number;
  hotWhen?: string[];              // node ids whose highlight turns the bus hot
  hotStroke?: string; coldStroke?: string;
  hotWidth?: number; coldWidth?: number;
}

export interface SchematicConfig {
  viewBox: string;
  maxWidth?: number;
  roleColor: Record<string, string>;
  roleTint: Record<string, string>;
  nodes: SchematicNode[];
  containers?: SchematicContainer[];
  texts?: SchematicText[];
  buses?: SchematicBus[];
}

// ── Trace table: register/field contents shown row by row, updated per beat.
export interface TraceRow { key: string; role: string; holds: string }

export interface TraceConfig {
  rows: TraceRow[];
  roleColor: Record<string, string>;
  roleTint: Record<string, string>;
  maxWidth?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSTopic — the whole content contract for a knowledge/revision sub-topic. A tool
// file supplies one of these and renders <CSShell topic={…} />; everything the
// student sees (nav, glossary, self-marking, model answers, the crash-safe
// steppers) comes from the shell. This is the CS analog of a maths tool's config.
// ─────────────────────────────────────────────────────────────────────────────

// The scenes a topic's lessons draw on — schematic (kind:"diagram") and/or trace
// (kind:"trace"), plus an optional shared legend. Structurally the LearnMode's
// LearnScenes; kept here so CSTopic is self-describing.
export interface TopicScenes {
  schematic?: SchematicConfig;                  // default schematic for diagram lessons
  schematics?: Record<string, SchematicConfig>; // named schematics a lesson picks via `scene`
  trace?: TraceConfig;
  legend?: ReactNode;
}

export interface CSTopic {
  id: string;                                 // "1.1.1"
  title: string;                              // "CPU Architecture" (shown as "1.1.1 CPU Architecture")
  specTags: Record<SpecTag, string>;          // tag → description (the SpecBadge tooltips)
  glossary: Record<string, string>;           // term → definition (touch-first tooltip)
  lessons: Lesson[];                          // Learn mode: taught, stepped walkthroughs
  scenes: TopicScenes;                        // representations the lessons reference
  cards: FlashCard[];                         // Study / Flashcards / Quiz
  cloze: ClozeExercise[];                     // Fill-in
  myths: MythItem[];                          // Spot-the-Mistake
  exam: ExamQuestion[];                       // Exam mode
  synoptic: SynopticQuestion[];               // Exam mode — cross-topic synoptic section
  info: InfoSection[];                        // the topic-info modal
}
