// Template D1: horizontal motion. A body on level ground with its forces, an optional start and finish with the distance between them,
// and an optional velocity arrow. The picture of "a force acts along the line of motion": work = force × distance, power = force × speed.
// Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D1). The builder takes labels, never numbers: the caller formats them.
import { blockWidthFor, bodyAnchors } from "../bodies";
import { add, mirrorScene, withParts, type Force, type ForceKind, type Lbl, type Scene, type SceneElement } from "../scene";

export interface HorizontalForce {
  kind: Extract<ForceKind, "driving" | "resistance" | "applied" | "friction" | "tension">;
  label?: Lbl;
}

export interface HorizontalParams {
  body?: "block" | "particle";
  /** Forces acting along the line of motion. A `driving` or `applied` force points the way the body moves; `resistance`, `friction` the other way. */
  forces?: HorizontalForce[];
  /** Weight and normal reaction, drawn as vertical arrows. */
  weightAndNormal?: { weight?: Lbl; normal?: Lbl } | false;
  /** The distance moved: the body at the start, a faint copy at the finish, and a dimension line below the ground. */
  distance?: { label: Lbl; from?: string; to?: string };
  /** A velocity arrow above the body. */
  velocity?: Lbl;
  /** Text on the body (a mass). */
  bodyLabel?: Lbl;
  /** Rough ground is hatched; smooth ground is a plain line. */
  rough?: boolean;
  /** Flip left to right (the motion goes the other way). */
  mirror?: boolean;
  alt?: string;
}

const W = 540, H = 264;
const GROUND_Y = 168;

export function buildHorizontal(p: HorizontalParams = {}): Scene {
  const els: SceneElement[] = [];
  const kind = p.body ?? "block";

  els.push({ type: "surface", id: "ground", kind: "ground", a: { x: 16, y: GROUND_Y }, b: { x: W - 16, y: GROUND_Y }, hatch: true });

  const w = kind === "block" ? blockWidthFor(p.bodyLabel) : undefined;
  // the back face stays put whatever the width, so the room behind it for a force and its label is always the same
  const hw = (w ?? 14) / 2;
  const startX = (p.distance ? 150 : 210) + hw;
  const endX = 360 + hw;
  const start: SceneElement = { type: "body", id: "body", kind, at: { x: startX, y: GROUND_Y }, label: p.bodyLabel, w };
  const an = bodyAnchors(start as Extract<SceneElement, { type: "body" }>);
  if (p.distance) {
    els.push({ type: "body", id: "body-end", kind, at: { x: endX, y: GROUND_Y }, ghost: true, w });
  }
  els.push(start);
  // the distance is measured between the same face of the body at the start and at the finish (the front), so its witness lines never run down the weight arrow
  const half = hw;

  // forces along the line of motion: forward ones leave the front, backward ones leave the back, each a fixed schematic length
  const L = 64;
  const mid = an.centre.y;
  let fwd = 0, back = 0;
  for (const f of p.forces ?? []) {
    const forward = f.kind === "driving" || f.kind === "applied";
    const force: Force = forward
      ? { type: "force", id: `f-${f.kind}-${fwd}`, kind: f.kind, from: { x: an.front.x, y: mid - fwd * 22 }, to: { x: an.front.x + L, y: mid - fwd * 22 }, label: f.label }
      : { type: "force", id: `f-${f.kind}-${back}`, kind: f.kind, from: { x: an.back.x, y: mid - back * 22 }, to: { x: an.back.x - L, y: mid - back * 22 }, label: f.label };
    if (forward) fwd++; else back++;
    els.push(force);
  }

  if (p.weightAndNormal !== false) {
    const wn = p.weightAndNormal ?? {};
    // weight leaves the centre and runs on past the ground, as in the textbooks; it is long enough that its label can stand clear of the hatching
    els.push({ type: "force", id: "f-weight", kind: "weight", from: an.centre, to: add(an.centre, { x: 0, y: 76 }), label: wn.weight ?? { text: "mg" } });
    els.push({ type: "force", id: "f-normal", kind: "normal", from: an.top, to: add(an.top, { x: 0, y: -44 }), label: wn.normal ?? { text: "R" } });
  }

  if (p.velocity) {
    const y = an.top.y - (p.weightAndNormal === false ? 24 : 70);
    els.push({ type: "force", id: "f-velocity", kind: "velocity", from: { x: an.centre.x - 24, y }, to: { x: an.centre.x + 40, y }, label: p.velocity });
  }

  if (p.distance) {
    const d = p.distance;
    els.push({ type: "dim", id: "dim-distance", a: { x: startX + half, y: GROUND_Y }, b: { x: endX + half, y: GROUND_Y }, offset: -34, witness: true, label: d.label });
    // the names stand at the two ends of the dimension line, outside it, so they are never on the hatching or a witness line
    if (d.from) els.push({ type: "marker", id: "m-from", at: { x: startX + half, y: GROUND_Y + 34 }, name: d.from, dir: 180, hideDot: true });
    if (d.to) els.push({ type: "marker", id: "m-to", at: { x: endX + half, y: GROUND_Y + 34 }, name: d.to, dir: 0, hideDot: true });
  }

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A body on level ground with the forces acting along its line of motion." },
    [
      { id: "setting", label: "the ground and the body", given: true },
      { id: "motion", label: "the motion", given: true },
      { id: "forces", label: "the forces", given: true },
      { id: "measure", label: "the distance moved", given: true },
    ],
    (id) => (id === "ground" || id.startsWith("body") ? "setting" : id === "f-velocity" ? "motion" : id.startsWith("f-") ? "forces" : "measure"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
