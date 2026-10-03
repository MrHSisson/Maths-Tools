// Negative counters — a core representation for directed numbers (alongside the number line, bar model,
// algebra tiles…; see CLAUDE.md "Core representations"). A yellow counter is +1, a red counter is −1, and one
// of each makes a ZERO PAIR (value 0) — the idea that makes adding/subtracting negatives make sense.
//
// Colours match the algebra tiles' unit tile (yellow `1`) and negative tiles (red), so a student meets the
// same yellow/red everywhere. Every counter is labelled +1 / −1 so it never relies on colour alone.
//
//   cStep("Start with 3 positives and 2 negatives", { rows: [{ counters: ctr(3, 2) }] })
//
// Renders via `CounterBoard` (src/shared/components/Counters.tsx). In a worked example pass
// `countersStepVisual` as ToolShell's `stepVisualRenderer` — one board updates in place beside the captions,
// exactly like the place value table.

import type { WorkingStep } from "./types";
import { tStep } from "./helpers";

export const COUNTER_POS = "#facc15";   // = algebra tiles' "1"
export const COUNTER_NEG = "#ef4444";   // = algebra tiles' negatives

/** normal · paired (circled as part of a zero pair) · removed (taken away, ghosted) · new (just placed). */
export type CounterState = "normal" | "paired" | "removed" | "new";
export interface Counter { sign: 1 | -1; state?: CounterState; }
export interface CounterRow {
  /** Left-hand label, e.g. "Start" or "Take away". */
  label?: string;
  counters: Counter[];
}
export interface CounterBoardData {
  rows: CounterRow[];
  /** Optional footer, e.g. "Net value: −1". */
  footer?: string;
}

/** `pos` yellow counters then `neg` red ones, all in `state`. */
export const ctr = (pos: number, neg: number, state?: CounterState): Counter[] => [
  ...Array.from({ length: Math.max(0, pos) }, (): Counter => ({ sign: 1, state })),
  ...Array.from({ length: Math.max(0, neg) }, (): Counter => ({ sign: -1, state })),
];

/** `n` zero pairs, each a yellow then a red, so a pair sits side by side. */
export const zeroPairs = (n: number, state: CounterState = "paired"): Counter[] =>
  Array.from({ length: Math.max(0, n) }).flatMap((): Counter[] => [{ sign: 1, state }, { sign: -1, state }]);

/** Net value of the counters that are still on the board (removed ones don't count). */
export const netValue = (counters: Counter[]): number =>
  counters.reduce((sum, c) => (c.state === "removed" ? sum : sum + c.sign), 0);

/** How many whole zero pairs a set of counts contains. */
export const pairCount = (pos: number, neg: number): number => Math.min(Math.max(0, pos), Math.max(0, neg));

/** A WorkingStep whose picture is a counter board snapshot, with a one-line caption. */
export const cStep = (caption: string, board: CounterBoardData): WorkingStep => ({
  ...tStep(caption),
  extra: { kind: "countersSnapshot", caption, board },
});
