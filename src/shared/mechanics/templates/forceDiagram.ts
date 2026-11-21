// Template D15: a free-standing force diagram. A particle with every force on it drawn at its true direction and labelled, optionally one force resolved
// along and across an axis (dashed) and angle marks between two directions. The "draw a clearly labelled diagram" step of a resolving question.
// Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D15). Angles are degrees anticlockwise from the right, as in the rest of the scene model.
import { add, dir, mul, rad, withParts, type ForceKind, type Lbl, type Scene, type SceneElement } from "../scene";

export interface DiagramForce {
  kind: Exclude<ForceKind, "component" | "velocity" | "acceleration">;
  label?: Lbl;
  /** The direction of the force in degrees anticlockwise from the right. */
  angle: number;
}

export interface ForceDiagramParams {
  forces: DiagramForce[];
  /** The axis the forces are resolved along (a slope, the road): shown as a dashed line through the particle. */
  axisAngle?: number;
  /** Resolve the force at this index along and across the axis, with the two component labels. */
  resolve?: { force: number; along?: Lbl; across?: Lbl };
  /** An angle marked between two directions. */
  angleMark?: { from: number; to: number; label?: Lbl };
  /** The label of the particle (a mass). */
  body?: Lbl;
  alt?: string;
}

const W = 440, H = 360;
const C = { x: 220, y: 180 };

export function buildForceDiagram(p: ForceDiagramParams): Scene {
  const els: SceneElement[] = [];
  const axis = p.axisAngle;
  if (axis != null) {
    els.push({ type: "line", id: "axis", a: add(C, mul(dir(axis), 150)), b: add(C, mul(dir(axis + 180), 150)), style: "dashed" });
    els.push({ type: "line", id: "axis-perp", a: add(C, mul(dir(axis + 90), 120)), b: add(C, mul(dir(axis - 90), 120)), style: "dashed" });
  }
  els.push({ type: "body", id: "body", kind: "particle", at: add(C, { x: 0, y: 7 }), label: p.body });
  p.forces.forEach((fo, i) => {
    const len = fo.kind === "weight" ? 96 : 106;
    els.push({ type: "force", id: `f-${fo.kind}-${i}`, kind: fo.kind, from: C, to: add(C, mul(dir(fo.angle), len)), label: fo.label });
  });
  if (p.resolve) {
    const fo = p.forces[p.resolve.force];
    const ax = axis ?? 0;
    if (fo) {
      const len = fo.kind === "weight" ? 96 : 106;
      const rel = rad(fo.angle - ax);
      const along = len * Math.cos(rel), across = len * Math.sin(rel);
      // a force nearly along or across the axis has a component too short to draw, so it is left unresolved
      if (Math.abs(along) >= 16 && Math.abs(across) >= 16) els.push({ type: "force", id: "f-comp-along", kind: "component", tone: fo.kind, from: C, to: add(C, mul(dir(ax), along)), label: p.resolve.along });
      if (Math.abs(along) >= 16 && Math.abs(across) >= 16) els.push({ type: "force", id: "f-comp-across", kind: "component", tone: fo.kind, from: C, to: add(C, mul(dir(ax + 90), across)), label: p.resolve.across });
    }
  }
  if (p.angleMark) {
    const a = ((p.angleMark.from % 360) + 360) % 360;
    let b = ((p.angleMark.to % 360) + 360) % 360;
    if (b < a) b += 360;
    els.push({ type: "arc", id: "arc-mark", at: C, r: 44, from: a, to: b, label: p.angleMark.label });
  }
  return withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A particle with the forces acting on it, each drawn in its true direction." },
    [
      { id: "setting", label: "the particle and the axes", given: true },
      { id: "forces", label: "the forces", given: true },
      { id: "components", label: "the resolved components and the angle", given: !p.resolve },
    ],
    (id) => (id === "body" || id.startsWith("axis") ? "setting" : id.startsWith("f-comp") || id === "arc-mark" ? "components" : "forces"),
  );
}
