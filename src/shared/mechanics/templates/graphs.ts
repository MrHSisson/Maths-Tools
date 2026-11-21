// Templates D12 and D13: graphs. A force against displacement with the work done as the shaded area under it (D12), and a speed against time with its phases (D13).
// Plot units run 0 to 1 both ways, so the shapes are pictorial: the numbers are on the marks and in the labels, which the caller supplies.
// Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D12, D13).
import { withParts, type Graph, type Lbl, type Pt, type Scene } from "../scene";

const W = 520, H = 330;
const BOX = { x: 74, y: 52, w: 320, h: 200 };

export type ForceShape = "constant" | "linear" | "decreasing" | "quadratic" | "sqrt" | "sine" | "reciprocal";

const f = (shape: ForceShape, x: number): number => {
  switch (shape) {
    case "constant": return 0.55;
    case "linear": return 0.2 + 0.65 * x;
    case "decreasing": return 0.85 - 0.6 * x;
    case "quadratic": return 0.12 + 0.78 * x * x;
    case "sqrt": return 0.1 + 0.8 * Math.sqrt(x);
    case "sine": return 0.5 + 0.34 * Math.sin(2 * Math.PI * x);
    case "reciprocal": return 0.12 + 0.07 / (x + 0.08);
  }
};

export interface ForceDisplacementParams {
  shape?: ForceShape;
  /** The two displacements the work is measured between, as plot fractions (clamped so the area is wide enough to read). */
  from?: number; to?: number;
  xTitle?: Lbl; yTitle?: Lbl;
  /** The label at the end of the curve: F = 8x + 15. */
  curveLabel?: Lbl;
  /** Labels for the two limits on the x-axis, and (optionally) for the force at each on the y-axis. */
  x1?: Lbl; x2?: Lbl; f1?: Lbl; f2?: Lbl;
  /** The label inside the shaded area. */
  areaLabel?: Lbl;
  /** Draw the shaded area (work done) or only the curve. */
  shade?: boolean;
  alt?: string;
}

export function buildForceDisplacement(p: ForceDisplacementParams = {}): Scene {
  const shape = p.shape ?? "linear";
  const a = Math.max(0.05, Math.min(0.6, p.from ?? 0.2));
  const b = Math.max(a + 0.25, Math.min(0.95, p.to ?? 0.75));
  const curve: Pt[] = Array.from({ length: 41 }, (_, i) => ({ x: i / 40, y: f(shape, i / 40) }));
  const marks: NonNullable<Graph["marks"]> = [];
  if (p.x1) marks.push({ axis: "x", at: a, label: p.x1, guide: true });
  if (p.x2) marks.push({ axis: "x", at: b, label: p.x2, guide: true });
  if (p.f1) marks.push({ axis: "y", at: f(shape, a), label: p.f1, guide: true });
  if (p.f2) marks.push({ axis: "y", at: f(shape, b), label: p.f2, guide: true });
  const g: Graph = {
    type: "graph", id: "graph", ...BOX, curve, marks,
    xTitle: p.xTitle ?? { text: "x" }, yTitle: p.yTitle ?? { text: "F" }, curveLabel: p.curveLabel,
    area: p.shade === false ? undefined : { from: a, to: b, label: p.areaLabel },
  };
  return withParts(
    { w: W, h: H, elements: [g], alt: p.alt ?? "A graph of a force against displacement; the shaded area under the curve is the work done." },
    [{ id: "graph", label: "the graph", given: true }],
    () => "graph",
  );
}

export type SpeedShape = "trapezium" | "triangle" | "accelerating" | "steps";

export interface SpeedTimeParams {
  shape?: SpeedShape;
  xTitle?: Lbl; yTitle?: Lbl;
  /** Labels on the time axis at the changes of phase (t₁, t₂, t₃), and the speed mark on the y-axis. */
  times?: Lbl[];
  speed?: Lbl;
  /** A label at the end of the graph. */
  curveLabel?: Lbl;
  alt?: string;
}

/** The corners of each shape in plot units; the times marked are the x of the corners after the first. */
const speedCorners = (shape: SpeedShape): Pt[] => {
  switch (shape) {
    case "triangle": return [{ x: 0, y: 0 }, { x: 0.45, y: 0.82 }, { x: 0.9, y: 0 }];
    case "accelerating": return [{ x: 0, y: 0 }, { x: 0.8, y: 0.82 }];
    case "steps": return [{ x: 0, y: 0.25 }, { x: 0.3, y: 0.25 }, { x: 0.3, y: 0.7 }, { x: 0.65, y: 0.7 }, { x: 0.65, y: 0.4 }, { x: 0.92, y: 0.4 }];
    default: return [{ x: 0, y: 0 }, { x: 0.25, y: 0.8 }, { x: 0.7, y: 0.8 }, { x: 0.92, y: 0 }];
  }
};

export function buildSpeedTime(p: SpeedTimeParams = {}): Scene {
  const shape = p.shape ?? "trapezium";
  const curve = speedCorners(shape);
  const marks: NonNullable<Graph["marks"]> = [];
  (p.times ?? []).forEach((t, i) => { const c = curve[i + 1]; if (c) marks.push({ axis: "x", at: c.x, label: t, guide: true }); });
  if (p.speed) marks.push({ axis: "y", at: Math.max(...curve.map((c) => c.y)), label: p.speed, guide: true });
  const g: Graph = {
    type: "graph", id: "graph", ...BOX, curve, marks,
    xTitle: p.xTitle ?? { text: "t (s)" }, yTitle: p.yTitle ?? { text: "v (m s⁻¹)" }, curveLabel: p.curveLabel,
  };
  return withParts(
    { w: W, h: H, elements: [g], alt: p.alt ?? "A graph of speed against time." },
    [{ id: "graph", label: "the graph", given: true }],
    () => "graph",
  );
}
