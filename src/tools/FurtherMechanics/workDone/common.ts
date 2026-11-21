// Shared bits of the Work Done builders: labels, the unit and number writing every working line uses, and how a scene is shown (given, built up, hidden).
import { buildInOrder, numTex, numText, type DiagramDisplay, type Lbl, type Scene } from "../../../shared/mechanics";

export const L = (text: string, ask?: string): Lbl => (ask ? { text, ask } : { text });

/** a unit as KaTeX text: `m s⁻¹` becomes `\text{m s}^{-1}` */
export const unitTex = (unit: string): string => (unit === "m s⁻¹" ? "\\text{m s}^{-1}" : unit === "N m⁻¹" ? "\\text{N m}^{-1}" : `\\text{${unit}}`);
/** a value with its unit, for a working line */
export const u = (x: number, unit: string): string => `${numTex(x)}\\ ${unitTex(unit)}`;
/** a value with its unit, in a sentence */
export const ut = (x: number, unit: string): string => `${numText(x)} ${unit}`;
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** The scene as the question asks to show it: built from nothing in the order given, or whole (the renderer hides it for `hidden`). */
export function staged(scene: Scene, display: DiagramDisplay, order: (string | string[])[]): Scene {
  return display === "build" ? buildInOrder(scene, order) : scene;
}

export interface Common {
  level: number;
  course: "AS" | "A2";
  display: DiagramDisplay;
}
