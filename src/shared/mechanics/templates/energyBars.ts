// Template D14: energy bars. One column per state of a moving thing (the start, a point on the way, the end), each a stack of gravitational potential, elastic
// potential and kinetic energy (and work added or removed), so a loss in one bar is seen as a gain in another. A dashed line across shows what is conserved.
// The picture of conservation of mechanical energy and of the work-energy equation. Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D14).
import { withParts, type Bars, type BarColumn, type Scene } from "../scene";

export interface EnergyBarsParams {
  /** The states, left to right. Each height is relative: only the proportions matter. */
  columns: BarColumn[];
  /** The dashed line at the first column's total (only when gravity and the spring do all the work). */
  conserved?: boolean;
  legend?: boolean;
  alt?: string;
}

const W = 520, H = 320;

export function buildEnergyBars(p: EnergyBarsParams): Scene {
  const b: Bars = { type: "bars", id: "bars", x: 40, y: 36, w: 440, h: 210, columns: p.columns.slice(0, 4), conserved: p.conserved, legend: p.legend ?? true };
  return withParts(
    { w: W, h: H, elements: [b], alt: p.alt ?? "Bars showing the potential and kinetic energy at each stage of the motion." },
    [{ id: "bars", label: "the energy bars", given: true }],
    () => "bars",
  );
}
