// ─────────────────────────────────────────────────────────────────────────────
// Lessons — an ordered run of steps inside ONE tool (Depth → Whiteboard → Worksheet …).
//
// A step is a shareable-link setup: the same `mode`, `tool`, `level`, `ms`, `vars`, `dd`, `n`,
// `cols`, `diff` and `item` parameters ToolShell already reads from the URL (see docs/reference/toolshell.md →
// "Shareable links"). So a lesson adds no new state to the tool: stepping through it writes the
// step's link and the shell opens exactly that setup. The active lesson is kept in the URL as
// `lesson=<id>&step=<n>`, so it survives a refresh and can be shared.
//
// Lessons are listed in the burger menu of the tool they belong to; they never cross tools.
// ─────────────────────────────────────────────────────────────────────────────
import type { DifficultyLevel } from "./types";

export type LessonStepKind = "teach" | "depth" | "whiteboard" | "example" | "worksheet";

export interface LessonStep {
  /** What this step is for, shown in the lesson bar, e.g. "Diagnose: who is right?". */
  title: string;
  /** The sub-tool this step runs in, when it differs from the lesson's own (a lesson can move from one tab to the next). */
  tool?: string;
  kind: LessonStepKind;
  level: DifficultyLevel;
  /** Depth step: the bank item id to open. */
  item?: string;
  /** Teach step: the id of the Teach lesson (deck) to open; omit for the deck menu. */
  deck?: string;
  /** Question Options to set, by option value (true = on). Give every option the level offers. */
  ms?: Record<string, boolean>;
  vars?: Record<string, boolean>;
  dd?: string;
  /** Worksheet steps: question count, columns, and whether to make a differentiated sheet. */
  n?: number;
  cols?: number;
  diff?: boolean;
}

export interface ToolLesson {
  id: string;
  title: string;
  /** One line for the menu, for the teacher. */
  summary: string;
  /** The sub-tool the lesson starts in; a step may name another tab (`LessonStep.tool`), so a lesson can move on to the next topic. */
  tool: string;
  steps: LessonStep[];
}

const MODE_PARAM: Record<LessonStepKind, string | null> = {
  teach: "teach",
  depth: "depth",
  whiteboard: null,
  example: "example",
  worksheet: "worksheet",
};

/** The shareable-link setup for a step, without lesson markers (a Teach hand-off uses this directly). */
export const setupParams = (tool: string, s: Omit<LessonStep, "title">): URLSearchParams => {
  const p = new URLSearchParams();
  p.set("tool", tool);
  p.set("level", s.level.slice(-1));
  const mode = MODE_PARAM[s.kind];
  if (mode) p.set("mode", mode);
  if (s.kind === "depth" && s.item) p.set("item", s.item);
  if (s.kind === "teach" && s.deck) p.set("deck", s.deck);
  const toggles = (rec?: Record<string, boolean>) => Object.entries(rec ?? {}).map(([k, v]) => (v ? k : `-${k}`));
  const ms = toggles(s.ms);
  if (ms.length) p.set("ms", ms.join(","));
  const vars = toggles(s.vars);
  if (vars.length) p.set("vars", vars.join(","));
  if (s.dd) p.set("dd", s.dd);
  if (s.kind === "worksheet") {
    if (s.n) p.set("n", String(s.n));
    if (s.cols) p.set("cols", String(s.cols));
    if (s.diff) p.set("diff", "1");
  }
  return p;
};

/** The shareable-link setup for one step (plus lesson/step markers). */
export const lessonStepParams = (lesson: ToolLesson, index: number): URLSearchParams => {
  const p = setupParams(lesson.steps[index].tool ?? lesson.tool, lesson.steps[index]);
  p.set("lesson", lesson.id);
  p.set("step", String(index));
  return p;
};

/** Where a Teach slide's hand-off button sends the class: a step's setup on a sub-tool (see `setupParams`). */
export interface TeachHandoff { tool: string; step: Omit<LessonStep, "title"> }

/** The lesson overview's link: the tool and lesson only, no step. */
export const lessonOverviewParams = (lesson: ToolLesson): URLSearchParams => {
  const p = new URLSearchParams();
  p.set("tool", lesson.tool);
  p.set("lesson", lesson.id);
  return p;
};

/** The lesson named in the current URL and its step (null = the overview screen), if the lesson exists. */
export const readLessonFromUrl = (lessons: ToolLesson[] | undefined, search: string): { id: string; step: number | null } | null => {
  if (!lessons?.length) return null;
  const p = new URLSearchParams(search);
  const id = p.get("lesson");
  const lesson = id ? lessons.find(l => l.id === id) : undefined;
  if (!lesson) return null;
  const raw = p.get("step");
  if (raw === null) return { id: lesson.id, step: null };
  const step = parseInt(raw, 10);
  return { id: lesson.id, step: Number.isFinite(step) ? Math.max(0, Math.min(lesson.steps.length - 1, step)) : 0 };
};
