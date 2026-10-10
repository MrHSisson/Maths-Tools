// File-size recipe — the picture behind the File Sizes tool (OCR J277 1.2.4): "number of things × bits per thing = bits",
// as three or four boxes joined by × and =, then the unit ladder for the conversion. Colour questions use a doubling chain
// (1 bit → 2 colours, 2 bits → 4 …) instead. A recipe is defined ONCE per question; each working step (and the empty
// whiteboard scaffold) is a snapshot of it at a step number, so the boxes can fill left to right as the working goes.
//
//   const def: FsRecipeDef = { slots: [{ label: "characters", vals: [{ at: 0, v: "4,000" }] }, …], ops: ["×", "="] };
//   fsStep(mStep("Characters × bits per character:", [...], "bits"), { recipes: [recipeAt(def, i)], ladder: { a: 0, b: 3, reach: 0 } })
//
// Pair with `fileSizeStepVisual` (components/FileSizeRecipe.tsx) as the tool's `stepVisualRenderer`.

import type { WorkingStep } from "./types";

/** One box. `vals` are the values it shows from step `at` onward (the last one whose `at` has been reached wins);
 *  before the first, the box is blank — or "?" when `unknown` (a reverse question's missing input). */
export interface FsSlotDef { label: string; vals: { at: number; v: string }[]; unknown?: boolean }
export interface FsRecipeDef { title?: string; slots: FsSlotDef[]; ops: string[] }

/** A recipe at one moment, ready to draw. `value` is "" for a blank box; `fresh` marks a value that has just appeared. */
export interface FsSlot { label: string; value: string; unknown: boolean; fresh: boolean }
export interface FsRecipe { title?: string; slots: FsSlot[]; ops: string[] }
/** The unit ladder mid-walk: from unit `a` to unit `b`, having reached unit `reach` (a = nothing yet). */
export interface FsLadder { a: number; b: number; reach: number }
/** The doubling chain: rows n = 1…, each 2ⁿ colours; `shown` rows are drawn, `mark` is the row ringed, `need` the colour count to reach. */
export interface FsChain { n: number[]; shown: number; mark?: number; need?: number }
export interface FsVisual { recipes: FsRecipe[]; ladder?: FsLadder; chain?: FsChain }

/** The recipe at step `i` (use -1 for the blank whiteboard scaffold, Infinity for everything filled). */
export const recipeAt = (def: FsRecipeDef, i: number): FsRecipe => ({
  title: def.title,
  ops: def.ops,
  slots: def.slots.map((s) => {
    const reached = s.vals.filter((x) => x.at <= i);
    const cur = reached.length ? reached[reached.length - 1] : undefined;
    return { label: s.label, value: (cur?.v ?? "").replace(/\{,\}/g, ","), unknown: !cur && !!s.unknown, fresh: !!cur && cur.at === i && i > 0 };
  }),
});

/** A working step (as `mStep`) carrying a picture snapshot for `stepVisualRenderer`. */
export const fsStep = (base: WorkingStep, visual: FsVisual): WorkingStep => ({ ...base, extra: { kind: "fileSizeSnapshot", visual } });
