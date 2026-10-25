import type { AnyQuestion } from "./types";
import { replaySeeded } from "./seededGenerate";

/**
 * What the shell does with the question on screen when the setup changes (a Question Option, the level or the sub-tool).
 *  - ignore: leave it (Worksheet, Teach and Depth have no single question; or a recent / pinned question was just put back)
 *  - fresh:  a level or sub-tool switch always gives a new question
 *  - adapt:  an option changed; the question stays, redrawn only if the tool reformats it or every changed option is display-only
 */
export type QoAction = "ignore" | "fresh" | "adapt";

export function planQoChange(s: { mode: string; restoredCurrent: boolean; levelOrToolChanged: boolean }): QoAction {
  if (s.mode === "worksheet" || s.mode === "teach" || s.mode === "depth") return "ignore";
  if (s.restoredCurrent) return "ignore";
  return s.levelOrToolChanged ? "fresh" : "adapt";
}

/**
 * The question to show after an option changed, or null to keep the one on screen. The tool's own reformatter (same maths, new display)
 * wins when it returns a question; otherwise, if only display-only options changed, the question is replayed from its saved seed.
 */
export function adaptQuestion(
  current: AnyQuestion,
  reformat: (() => AnyQuestion | null) | undefined,
  onlyDisplayChanged: boolean,
  regenerate: () => AnyQuestion,
): AnyQuestion | null {
  if (reformat) { const r = reformat(); if (r !== null) return r; }
  return onlyDisplayChanged ? replaySeeded(current, regenerate) : null;
}
