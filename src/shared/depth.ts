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

/** A picture shown on the slide once the answer is revealed. */
export type DepthVisual = { type: "pyramid"; strong?: PyramidTier[]; soft?: PyramidTier[] };

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
  /** One line for the teacher: what to ask or listen for. Shown with the answer. */
  teacherNote?: string;
  /** Include in the cross-level "Start here" quick check. */
  startHere?: boolean;
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
