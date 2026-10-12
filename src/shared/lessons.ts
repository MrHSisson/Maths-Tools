// ─────────────────────────────────────────────────────────────────────────────
// Lessons — an ordered run of steps inside ONE tool (Depth → Whiteboard → Worksheet …).
//
// A step is a shareable-link setup: the same `mode`, `tool`, `level`, `ms`, `vars`, `dd`, `n`,
// `cols`, `diff` and `item` parameters ToolShell already reads from the URL (see CLAUDE.md →
// "Shareable links"). So a lesson adds no new state to the tool: stepping through it writes the
// step's link and the shell opens exactly that setup. The active lesson is kept in the URL as
// `lesson=<id>&step=<n>`, so it survives a refresh and can be shared.
//
// Lessons are listed in the burger menu of the tool they belong to; they never cross tools.
// ─────────────────────────────────────────────────────────────────────────────
import type { DifficultyLevel } from "./types";

export type LessonStepKind = "depth" | "whiteboard" | "example" | "worksheet";

export interface LessonStep {
  /** What this step is for, shown in the lesson bar, e.g. "Diagnose: who is right?". */
  title: string;
  kind: LessonStepKind;
  level: DifficultyLevel;
  /** Depth step: the bank item id to open. */
  item?: string;
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
  /** The sub-tool the lesson runs in: a lesson never crosses tools. */
  tool: string;
  steps: LessonStep[];
}

const MODE_PARAM: Record<LessonStepKind, string | null> = {
  depth: "depth",
  whiteboard: null,
  example: "example",
  worksheet: "worksheet",
};

/** The shareable-link setup for one step (plus lesson/step markers). */
export const lessonStepParams = (lesson: ToolLesson, index: number): URLSearchParams => {
  const s = lesson.steps[index];
  const p = new URLSearchParams();
  p.set("tool", lesson.tool);
  p.set("level", s.level.slice(-1));
  const mode = MODE_PARAM[s.kind];
  if (mode) p.set("mode", mode);
  if (s.kind === "depth" && s.item) p.set("item", s.item);
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
  p.set("lesson", lesson.id);
  p.set("step", String(index));
  return p;
};

/** The lesson and step named in the current URL, if they exist in `lessons`. */
export const readLessonFromUrl = (lessons: ToolLesson[] | undefined, search: string): { id: string; step: number } | null => {
  if (!lessons?.length) return null;
  const p = new URLSearchParams(search);
  const id = p.get("lesson");
  const lesson = id ? lessons.find(l => l.id === id) : undefined;
  if (!lesson) return null;
  const step = parseInt(p.get("step") ?? "0", 10);
  return { id: lesson.id, step: Number.isFinite(step) ? Math.max(0, Math.min(lesson.steps.length - 1, step)) : 0 };
};
