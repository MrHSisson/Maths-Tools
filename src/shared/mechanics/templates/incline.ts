// Template D3: a body on a slope. The slope with its angle to the horizontal, its vertical height and the distance along it; the body (and, for a
// movement, a faint copy where it ends); forces up and down the slope, weight and normal reaction; the weight's components (dashed) along and across
// the slope; and an applied force at an angle to the slope (a strap). The picture of every slope question: work against gravity, GPE, resolving.
// Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D3). A slope rising to the left is the same scene mirrored.
// Intended combinations: a work picture (a distance moved, a height, maybe a length) and a resolving picture (the weight's components, an angled force) are
// different pictures and are not drawn together; more than one force up the slope, or down it, is too crowded to label and is not supported.
import { blockWidthFor, bodyAnchors } from "../bodies";
import { add, dir, mirrorScene, mul, withParts, type ForceKind, type Lbl, type Scene, type SceneElement } from "../scene";
import { downSlope, intoSlope, outOfSlope, slopeElements, slopeFrame, upSlope } from "./slope";

export interface InclineForce {
  /** `driving`, `applied` and `tension` act up the slope; `resistance` and `friction` act down it. */
  kind: Extract<ForceKind, "driving" | "applied" | "tension" | "resistance" | "friction">;
  label?: Lbl;
}

export interface InclineParams {
  /** The angle of the slope to the horizontal in degrees. Drawn true, clamped to 10 to 60. */
  angle?: number;
  angleLabel?: Lbl;
  body?: "block" | "particle";
  bodyLabel?: Lbl;
  forces?: InclineForce[];
  /** A force at an angle to the slope (up the slope and away from it), with the angle between them. */
  angled?: { label?: Lbl; angleFromSlope?: number; angleLabel?: Lbl };
  /** The weight, vertically down from the centre. `true` labels it mg. */
  weight?: Lbl | true;
  /** The normal reaction, at right angles to the slope. `true` labels it R. */
  normal?: Lbl | true;
  /** The weight's components, dashed: down the slope (mg sin α) and into it (mg cos α). */
  components?: { along?: Lbl; across?: Lbl };
  /** A velocity arrow along the slope above the body. */
  velocity?: Lbl;
  /** The distance moved along the slope between two positions (the body and a faint copy), with names for them. */
  distance?: { label: Lbl; from?: string; to?: string };
  /** The vertical height of the slope. */
  height?: Lbl;
  /** The whole length of the slope. */
  length?: Lbl;
  mirror?: boolean;
  alt?: string;
}

const W = 540, H = 364;
const FOOT = { x: 70, y: 250 };

const asLbl = (v: Lbl | true | undefined, d: string): Lbl | undefined => (v === true ? { text: d } : v);

export function buildIncline(p: InclineParams = {}): Scene {
  const f = slopeFrame(p.angle ?? 30, FOOT);
  const a = f.alpha;
  const kind = p.body ?? "block";
  const bw = kind === "block" ? blockWidthFor(p.bodyLabel) : 14;
  const hw = bw / 2;
  const els: SceneElement[] = [...slopeElements(f)];

  const s1 = p.distance ? 0.3 * f.len : 0.5 * f.len;
  const s2 = Math.min(0.9 * f.len - hw, s1 + 0.4 * f.len);
  const bodyEl = { type: "body" as const, id: "body", kind, at: f.at(s1), rot: a, label: p.bodyLabel, w: kind === "block" ? bw : undefined };
  const an = bodyAnchors(bodyEl);
  if (p.distance) els.push({ type: "body", id: "body-end", kind, at: f.at(s2), rot: a, ghost: true, w: kind === "block" ? bw : undefined });
  els.push(bodyEl);

  // forces along the slope: up-slope ones leave the front, down-slope ones leave the back, stacked across the slope when there are several
  const L = 62;
  let up = 0, down = 0;
  for (const fo of p.forces ?? []) {
    const isUp = fo.kind === "driving" || fo.kind === "applied" || fo.kind === "tension";
    const k = isUp ? up++ : down++;
    const shift = mul(dir(outOfSlope(f)), -k * 22);
    const from = add(isUp ? an.front : an.back, shift);
    els.push({ type: "force", id: `f-${fo.kind}-${k}`, kind: fo.kind, from, to: add(from, mul(dir(isUp ? upSlope(f) : downSlope(f)), L)), label: fo.label });
  }
  if (p.angled) {
    const th = Math.max(20, Math.min(60, p.angled.angleFromSlope ?? 30));
    els.push({ type: "force", id: "f-angled", kind: "tension", from: an.front, to: add(an.front, mul(dir(a + th), 88)), label: p.angled.label });
    els.push({ type: "arc", id: "arc-angled", at: an.front, r: 42, from: a, to: a + th, label: p.angled.angleLabel });
  }
  const w = asLbl(p.weight, "mg"), n = asLbl(p.normal, "R");
  if (w) els.push({ type: "force", id: "f-weight", kind: "weight", from: an.centre, to: add(an.centre, { x: 0, y: Math.max(44, (kind === "block" ? 24 : 7) + 24) }), label: w });
  if (n) els.push({ type: "force", id: "f-normal", kind: "normal", from: an.top, to: add(an.top, mul(dir(outOfSlope(f)), 46)), label: n });
  if (p.components) {
    if (p.components.along) els.push({ type: "force", id: "f-comp-along", kind: "component", tone: "weight", from: an.centre, to: add(an.centre, mul(dir(downSlope(f)), hw + 48)), label: p.components.along });
    if (p.components.across) els.push({ type: "force", id: "f-comp-across", kind: "component", tone: "weight", from: an.centre, to: add(an.centre, mul(dir(intoSlope(f)), 64)), label: p.components.across });
  }
  if (p.velocity) {
    const from = add(add(an.top, mul(dir(outOfSlope(f)), 30)), mul(dir(upSlope(f)), -30));
    els.push({ type: "force", id: "f-velocity", kind: "velocity", from, to: add(from, mul(dir(upSlope(f)), 64)), label: p.velocity });
  }

  // measurements: the angle at the foot, the height on the right, the distance and the whole length below the slope
  els.push({ type: "arc", id: "arc-alpha", at: f.foot, r: 54, from: 0, to: a, label: p.angleLabel });
  if (p.height) els.push({ type: "dim", id: "dim-height", a: { x: f.top.x, y: f.foot.y }, b: f.top, offset: -30, label: p.height });
  if (p.distance) {
    const d = p.distance;
    const a1 = add(f.at(s1), mul(dir(a), hw)), b1 = add(f.at(s2), mul(dir(a), hw));
    els.push({ type: "dim", id: "dim-distance", a: a1, b: b1, offset: -58, witness: true, label: d.label });
    const end = (pt: { x: number; y: number }) => add(pt, mul(dir(a - 90), 58));
    if (d.from) els.push({ type: "marker", id: "m-from", at: end(a1), name: d.from, dir: downSlope(f), dist: 48, hideDot: true });
    if (d.to) els.push({ type: "marker", id: "m-to", at: end(b1), name: d.to, dir: upSlope(f), dist: 44, hideDot: true });
  }
  if (p.length) els.push({ type: "dim", id: "dim-length", a: f.foot, b: f.top, offset: -102, witness: true, label: p.length });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A body on a slope, with the angle of the slope, its height and the forces acting." },
    [
      { id: "setting", label: "the slope and the body", given: true },
      { id: "motion", label: "the motion", given: true },
      { id: "forces", label: "the forces", given: true },
      { id: "components", label: "the weight resolved along and across the slope", given: !p.components },
      { id: "measure", label: "the angle, the height and the distances", given: true },
    ],
    (id) => (id === "slope" || id === "base" || id === "side" || id.startsWith("square") || id.startsWith("body") ? "setting"
      : id === "f-velocity" ? "motion"
      : id.startsWith("f-comp") ? "components"
      : id.startsWith("f-") || id === "arc-angled" ? "forces"
      : "measure"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}


