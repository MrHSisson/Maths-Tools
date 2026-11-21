// Mechanics diagrams: the visual conventions. One colour AND one line style AND a text label per force kind, so colour is never the only cue
// and a black-and-white print keeps every force identifiable (R30's rule applied to forces). See docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §4.
import type { ForceKind } from "./scene";

export interface ForceStyle {
  colour: string;
  width: number;
  /** SVG dash pattern, or undefined for solid. */
  dash?: string;
  /** Arrow head: filled triangle, an open chevron (velocity) or two chevrons (acceleration). */
  head: "filled" | "open" | "double";
  /** Plain words for the alt text. */
  word: string;
}

export const FORCE_STYLES: Record<ForceKind, ForceStyle> = {
  weight:       { colour: "#334155", width: 2.6, head: "filled", word: "weight" },
  driving:      { colour: "#15803d", width: 2.6, head: "filled", word: "driving force" },
  resistance:   { colour: "#b91c1c", width: 2.6, head: "filled", word: "resistance" },
  friction:     { colour: "#c2410c", width: 2.6, head: "filled", word: "friction" },
  tension:      { colour: "#1d4ed8", width: 2.6, head: "filled", word: "tension" },
  thrust:       { colour: "#1d4ed8", width: 2.6, head: "filled", word: "thrust" },
  normal:       { colour: "#64748b", width: 2.2, head: "filled", word: "normal reaction" },
  applied:      { colour: "#7c3aed", width: 2.6, head: "filled", word: "applied force" },
  component:    { colour: "#64748b", width: 2.2, dash: "6 4", head: "filled", word: "component" },
  velocity:     { colour: "#111827", width: 2.0, head: "open", word: "velocity" },
  acceleration: { colour: "#111827", width: 2.0, head: "double", word: "acceleration" },
};

export const INK = "#111827";          // surfaces, bodies, dimension lines
export const INK_SOFT = "#6b7280";     // ghost bodies, level lines, hatching
export const HALO = "#ffffff";         // behind text, so a label stays readable over a line

/** Label sizes in picture units for the three places a diagram shows (the picture itself is the same; only its text grows for a small cell). */
export const LABEL_SIZE = { worksheet: 24, board: 20, example: 18 } as const;
export type DiagramSize = keyof typeof LABEL_SIZE;
