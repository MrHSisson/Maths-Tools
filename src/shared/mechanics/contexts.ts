// The context library (specs/further-mechanics-mc.md §4.3): a thing, its realistic ranges and the way a question about it is worded. Ranges stop a cyclist
// of 800 kg or a crate pulled 3 km. A range is [lowest, highest, step]: values are always whole multiples of the step, so the numbers look chosen.
import { randInt } from "../helpers";

export type Range = [lo: number, hi: number, step: number];
export interface MechContext {
  id: string;
  /** "a crate" / "The crate" */
  a: string;
  the: string;
  /** how the story moves it: pulled by a force along the ground, or driven under its own power */
  style: "pulled" | "driven";
  mass: Range;   // kg
  force: Range;  // N
  dist: Range;   // m along the ground
  height: Range; // m
  /** forces and distances this large are naturally written in kN and km */
  large: boolean;
  serves: Array<"fd" | "grav" | "angle" | "several" | "vehicle">;
}

export const CONTEXTS: MechContext[] = [
  { id: "crate", a: "a crate", the: "The crate", style: "pulled", mass: [5, 80, 5], force: [20, 200, 5], dist: [4, 40, 2], height: [2, 20, 1], large: false, serves: ["fd", "grav", "angle"] },
  { id: "sledge", a: "a sledge", the: "The sledge", style: "pulled", mass: [20, 80, 5], force: [30, 180, 5], dist: [10, 120, 5], height: [2, 12, 1], large: false, serves: ["fd", "angle"] },
  { id: "suitcase", a: "a suitcase", the: "The suitcase", style: "pulled", mass: [8, 30, 1], force: [15, 80, 5], dist: [10, 150, 5], height: [1, 6, 1], large: false, serves: ["angle"] },
  { id: "cyclist", a: "a cyclist", the: "The cyclist", style: "driven", mass: [60, 110, 5], force: [20, 150, 5], dist: [100, 2000, 50], height: [5, 40, 1], large: false, serves: ["fd", "several"] },
  { id: "tractor", a: "a tractor", the: "The tractor", style: "driven", mass: [2000, 6000, 100], force: [1000, 6000, 100], dist: [100, 900, 10], height: [5, 40, 1], large: true, serves: ["fd", "several"] },
  { id: "car", a: "a car", the: "The car", style: "driven", mass: [800, 1800, 50], force: [500, 4000, 100], dist: [200, 3000, 100], height: [5, 60, 1], large: true, serves: ["fd", "several", "vehicle"] },
  { id: "van", a: "a van", the: "The van", style: "driven", mass: [1200, 3500, 100], force: [600, 3000, 100], dist: [200, 3000, 100], height: [5, 50, 1], large: true, serves: ["several", "vehicle"] },
  { id: "climber", a: "a climber", the: "The climber", style: "driven", mass: [50, 100, 2], force: [0, 0, 1], dist: [5, 60, 1], height: [5, 60, 1], large: false, serves: ["grav"] },
  { id: "crane", a: "a crane", the: "The crane", style: "driven", mass: [500, 5000, 100], force: [0, 0, 1], dist: [5, 80, 1], height: [5, 80, 1], large: true, serves: ["grav"] },
  { id: "ball", a: "a ball", the: "The ball", style: "driven", mass: [0.1, 2, 0.1], force: [0, 0, 1], dist: [2, 60, 1], height: [2, 60, 1], large: false, serves: ["grav"] },
];

/** A value from the range: a whole multiple of the step. */
export function inRange([lo, hi, step]: Range): number {
  const n = Math.round((hi - lo) / step);
  return Number((lo + step * randInt(0, n)).toPrecision(12));
}

/** A context that serves this sub-question, at random; `large` restricts it to the kN and km ones (or the small ones). */
export function pickContext(serves: MechContext["serves"][number], large?: boolean): MechContext {
  const pool = CONTEXTS.filter((c) => c.serves.includes(serves) && (large === undefined || c.large === large));
  const from = pool.length > 0 ? pool : CONTEXTS.filter((c) => c.serves.includes(serves));
  return from[randInt(0, from.length - 1)];
}
