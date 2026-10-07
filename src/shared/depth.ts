// ─────────────────────────────────────────────────────────────────────────────
// Depth — a bank of curated, fixed questions that go beyond the generated practice.
//
// Not a slide deck: a teacher dips into the bank by purpose and level, in whatever order
// the class needs. Each item is two beats — the question, then the answer and reasoning —
// and the answer can point to an easier / related item (class not secure) or an extension
// (class secure), so the route stays adaptive without a pre-planned sequence.
//
// Three purposes:
//   diagnose — surface a misconception (who is right? multiple choice with named misconceptions)
//   explain  — unpick reasoning (explain this mistake, spot the error in working)
//   extend   — go deeper (always / sometimes / never, convince me, make your own)
//
// A tool opts in with `<ToolShell depthItems={DEPTH_ITEMS} />`. Authoring guide: CLAUDE.md → "Depth".
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import type { DifficultyLevel } from "./types";
import type { PyramidTier } from "./components/BidmasPyramid";

export type DepthPurpose = "diagnose" | "explain" | "extend";

export interface DepthOption {
  /** Option text; `$...$` is inline maths. */
  text: string;
  /** Exactly the right answer(s). Leave unset on wrong options. */
  correct?: boolean;
  /** Wrong options: the misconception this choice reveals, shown on the answer beat. */
  misconception?: string;
}

/** A character making a claim — drawn as a speech bubble ("Jack says…"). */
export interface DepthSpeaker {
  name: string;
  /** What they say, one entry per line; `$...$` is inline maths. */
  says: string[];
}

/** Worked lines with a mistake in them. The class taps the line they think is wrong; the answer marks the first wrong line. */
export interface DepthWorking {
  /** Lead-in sentence; `$...$` is inline maths. */
  intro?: string;
  /** The lines, as LaTeX (no `$`). */
  lines: string[];
  /** 0-based index of the FIRST wrong line. */
  wrongLine: number;
}

/** A picture shown on the slide. `pyramid` sits in the panel's corner (lit on the answer slide). `custom` is a
 *  tool-drawn picture (e.g. Rounding's number line) shown full width above the question. Because a drawn picture
 *  can give the answer away, it is a SCAFFOLD the teacher switches on: two separate switches in the slide's side
 *  rail — `labels.show` (the picture) and `labels.plot` (the given point drawn on it; only offered once the picture
 *  is on) — both off to begin with and kept while moving between questions. `render(onAnswer, plot)` is called with
 *  `plot` false until the plot switch is on; the answer slide always calls it with `(true, true)`. */
export type DepthVisual =
  | { type: "pyramid"; strong?: PyramidTier[]; soft?: PyramidTier[] }
  | { type: "custom"; render: (onAnswer: boolean, plot: boolean) => ReactNode; labels?: { show: string; plot: string } };

export type DepthNeed = string | string[];

/** An option of the current sub-tool + level's Question Options: which pool it sits in and how it is labelled. */
export type DepthOptionInfo = Record<string, { pool: string; label: string }>;

export interface DepthItem {
  /** Unique within the tool (and across the site, ideally): `<tool>-<n>`. Used by links and `?item=`. */
  id: string;
  level: DifficultyLevel;
  /** Sub-tool key this item belongs to; omit to show on every sub-tool tab. */
  tool?: string;
  purpose: DepthPurpose;
  /** Short topic label for the picker card, e.g. "Who goes first?". Must not give the answer away. */
  title: string;
  /** Question beat — one entry per line; `$...$` is inline maths. With `speakers` / `working` this is the prompt below them. */
  question: string[];
  /** Characters whose claims the question is about, drawn as speech bubbles above the prompt. */
  speakers?: DepthSpeaker[];
  /** Worked lines containing a mistake, tappable on the slide. */
  working?: DepthWorking;
  /** A picture shown beside the reasoning once the answer is revealed. */
  visual?: DepthVisual;
  /** Optional lettered choices (diagnose items). */
  options?: DepthOption[];
  /** Answer beat — the reasoning, one entry per line; `$...$` is inline maths. Each line is its own build (one press each). */
  answer: string[];
  /** What Feathers (the owl) says on the QUESTION slide, to the class — a nudge, never the answer. Optional: every item gets a
   *  sensible default from its shape (see `feathersLine`). `$...$` is inline maths. */
  prompt?: string;
  /** What Feathers says on the ANSWER slide: the one idea to take away. Optional (default from the item's shape). */
  takeaway?: string;
  /** One line for the teacher: what to ask or listen for. Shown with the answer. */
  teacherNote?: string;
  /** Include in the cross-level "Start here" quick check. */
  startHere?: boolean;
  /** Question Options this item needs, so it is only offered when the class could actually meet it. A list of
   *  clauses that must ALL hold; a clause is an option value, or an array of values of which at least ONE must be on
   *  (e.g. `[["indices", "bracketsIndices"], "negatives"]`). Option values are the multiSelect option `value`s of the
   *  tool's pools, across its sub-tools: a clause naming no option offered on the current sub-tool / level is skipped,
   *  so one list can serve both a generator's tabs. Omit for an item that is always possible. */
  needs?: DepthNeed[];
  /** id of an easier or related item to offer when the class is not secure. */
  ifNotSecure?: string;
  /** id of an extension item to offer when the class is secure. */
  ifSecure?: string;
}

export const DEPTH_PURPOSES: { key: DepthPurpose; label: string; blurb: string }[] = [
  { key: "diagnose", label: "Diagnose", blurb: "Find out what the class thinks" },
  { key: "explain", label: "Explain", blurb: "Unpick the reasoning" },
  { key: "extend", label: "Extend", blurb: "Go deeper" },
];

/** Why `item` is not possible with the current Question Options, or null when it is. `info` lists every option
 *  offered now (value → pool/label); `active` is the subset switched on. Only items at the current level are
 *  filtered by the caller. A clause naming no offered option is skipped. */
export function depthUnmet(item: DepthItem, active: ReadonlySet<string>, info: DepthOptionInfo): string | null {
  const missing: string[] = [];
  for (const need of item.needs ?? []) {
    const clause = (Array.isArray(need) ? need : [need]).filter((v) => v in info);
    if (clause.length === 0 || clause.some((v) => active.has(v))) continue;
    const pools = new Map<string, string[]>();
    for (const v of clause) pools.set(info[v].pool, [...(pools.get(info[v].pool) ?? []), info[v].label]);
    missing.push([...pools].map(([pool, labels]) => `${pool}: ${labels.join(" or ")}`).join(", "));
  }
  return missing.length ? `Needs ${missing.join(" and ")}` : null;
}

/** What Feathers says on a slide: the item's own `prompt` / `takeaway`, else a default from its shape and purpose. Spoken to the
 *  class, so it is never the answer and never about marking. */
export function feathersLine(item: DepthItem, onAnswer: boolean): string {
  if (onAnswer) {
    if (item.takeaway) return item.takeaway;
    if (item.options) return "Each wrong answer is a real misconception. Which one tempted you?";
    if (item.working) return "Fix the first wrong line. Lines after it can look fine and still be wrong.";
    return item.purpose === "diagnose" ? "Notice what tempted you. That is the idea to remember."
      : item.purpose === "explain" ? "Name the mistake, then say how you would stop it."
      : "Make up an example of your own to test it.";
  }
  if (item.prompt) return item.prompt;
  if (item.working) return "Tap the line where it first goes wrong.";
  if (item.options && item.speakers) return "Decide who you agree with, then say why.";
  if (item.options) return "Choose one, then say why the others could tempt someone.";
  if (item.speakers) return "What did they do, and why might it feel right?";
  return item.purpose === "diagnose" ? "Think on your own first, then compare with a partner."
    : item.purpose === "explain" ? "Say what went wrong and how to fix it."
    : "Can you find a case that breaks it, or show why it always works?";
}
