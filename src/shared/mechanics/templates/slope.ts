// Mechanics diagrams: the geometry of a slope, shared by the incline and the string-on-a-slope templates. The slope rises to the right from `foot`;
// a template that wants it rising to the left builds as usual and mirrors the scene.
import { add, type Pt, type SceneElement } from "../scene";

interface SlopeFrame {
  /** The angle to the horizontal in degrees, clamped to 10 to 60 so the picture stays readable. */
  alpha: number;
  foot: Pt;
  top: Pt;
  /** The length of the slope in picture units. */
  len: number;
  /** The point `s` units up the slope from the foot. */
  at: (s: number) => Pt;
}

export function slopeFrame(alphaDeg: number, foot: Pt = { x: 70, y: 262 }): SlopeFrame {
  const alpha = Math.max(10, Math.min(60, alphaDeg));
  const len = Math.min(350, 190 / Math.sin((alpha * Math.PI) / 180));
  const at = (s: number) => add(foot, { x: s * Math.cos((alpha * Math.PI) / 180), y: -s * Math.sin((alpha * Math.PI) / 180) });
  return { alpha, foot, top: at(len), len, at };
}

/** The slope itself, its horizontal base and vertical side as thin lines, and the right-angle mark at the foot of the side. */
export function slopeElements(f: SlopeFrame): SceneElement[] {
  const corner = { x: f.top.x, y: f.foot.y };
  const k = 11;
  return [
    { type: "surface", id: "slope", kind: "incline", a: f.foot, b: f.top, hatch: true },
    { type: "line", id: "base", a: f.foot, b: corner, style: "thin" },
    { type: "line", id: "side", a: corner, b: f.top, style: "thin" },
    { type: "line", id: "square-a", a: { x: corner.x - k, y: corner.y }, b: { x: corner.x - k, y: corner.y - k }, style: "thin" },
    { type: "line", id: "square-b", a: { x: corner.x - k, y: corner.y - k }, b: { x: corner.x, y: corner.y - k }, style: "thin" },
  ];
}

/** The unit direction up the slope, as an angle in degrees (for `toward` and `dir`). */
export const upSlope = (f: SlopeFrame): number => f.alpha;
export const downSlope = (f: SlopeFrame): number => f.alpha + 180;
/** Into the slope (the way the weight component acts) and out of it (the normal reaction). */
export const intoSlope = (f: SlopeFrame): number => f.alpha - 90;
export const outOfSlope = (f: SlopeFrame): number => f.alpha + 90;

