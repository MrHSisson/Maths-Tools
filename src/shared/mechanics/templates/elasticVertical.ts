// Template D8: a spring or elastic string hanging from a fixed point, with a mass on the end, shown in one to three positions side by side (at its natural
// length, in equilibrium, at its lowest point). The dimension column on the left reads off the natural length l and the extension x; level lines carry the
// heights across to each position. Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D8).
import { PARTICLE_R, BLOCK_H, blockWidthFor } from "../bodies";
import { mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface VerticalStringState {
  /** How far the string is stretched here, as a fraction of its natural length. Pictorial only: clamped to 0 to 0.9 (0 is the natural length). */
  ext: number;
  /** A name for the position of the mass (A, B, P). */
  name?: string;
  /** Draw the mass faint and dashed (a position it passes through, or where it would hang with no extension). */
  ghost?: boolean;
  /** Arrows on the mass in this position. */
  weight?: Lbl; tension?: Lbl; speed?: Lbl;
}

export interface ElasticVerticalParams {
  kind?: "spring" | "elastic";
  states: VerticalStringState[];
  body?: "block" | "particle";
  mass?: Lbl;
  /** Dimension labels on the left: the natural length, and the extension of the position `dimState` (default: the last). */
  natural?: Lbl; extension?: Lbl; dimState?: number;
  /** Text on the string itself. */
  modulus?: Lbl;
  /** The name of the fixed point (O). */
  fixed?: string;
  mirror?: boolean;
  alt?: string;
}

const W = 500, H = 350;
const CEIL_Y = 46, NAT = 110, EXT_MAX = 110;

export function buildElasticVertical(p: ElasticVerticalParams): Scene {
  const kind = p.kind ?? "elastic";
  const body = p.body ?? "particle";
  const n = Math.min(3, Math.max(1, p.states.length));
  const states = p.states.slice(0, n);
  const bw = body === "block" ? blockWidthFor(p.mass) : PARTICLE_R * 2;
  const bh = body === "block" ? BLOCK_H : PARTICLE_R * 2;
  const xs = n === 1 ? [280] : n === 2 ? (body === "block" ? [190, 380] : [230, 370]) : [200, 300, 400];
  const els: SceneElement[] = [];
  const natY = CEIL_Y + NAT;
  const attachY = (s: VerticalStringState) => natY + Math.max(0, Math.min(0.9, s.ext)) * EXT_MAX;

  els.push({ type: "surface", id: "ceiling", kind: "ceiling", a: { x: 24, y: CEIL_Y }, b: { x: W - 24, y: CEIL_Y }, hatch: true, hatchSide: 1 });
  els.push({ type: "line", id: "level-natural", a: { x: 60, y: natY }, b: { x: xs[0] - bw / 2 - 12, y: natY }, style: "dashed" });

  states.forEach((s, i) => {
    const x = xs[i], y = attachY(s);
    // the mass hangs from its top centre; a particle's centre is its radius below the end of the string
    const base = y + bh;
    els.push({ type: "spring", id: `string-${i}`, kind, a: { x, y: CEIL_Y }, b: { x, y } });
    els.push({ type: "body", id: `body-${i}`, kind: body, at: { x, y: base }, ghost: s.ghost, label: body === "block" && i === 0 ? p.mass : undefined, w: body === "block" ? bw : undefined });
    const cyy = y + bh / 2;
    if (s.weight) els.push({ type: "force", id: `f-weight-${i}`, kind: "weight", from: { x, y: cyy }, to: { x, y: cyy + 56 }, label: s.weight });
    if (s.tension) els.push({ type: "force", id: `f-tension-${i}`, kind: "tension", from: { x: x + 18, y: y + 2 }, to: { x: x + 18, y: y - 52 }, label: s.tension });
    if (s.speed) els.push({ type: "force", id: `speed-${i}`, kind: "velocity", from: { x: x - bw / 2 - 22, y: cyy - 22 }, to: { x: x - bw / 2 - 22, y: cyy + 26 }, label: s.speed });
    if (s.name) els.push({ type: "marker", id: `m-${i}`, at: { x, y: cyy }, name: s.name, dir: 0, dist: bw / 2 + 36, hideDot: true });
  });
  // the modulus (or stiffness) stands to the left of the first string, near the top where nothing else is
  if (p.modulus) els.push({ type: "marker", id: "m-modulus", at: { x: xs[0], y: CEIL_Y + 34 }, name: p.modulus.text, dir: 180, dist: 16 + p.modulus.text.length * 7, hideDot: true });
  if (p.fixed) els.push({ type: "marker", id: "m-fixed", at: { x: xs[0], y: CEIL_Y }, name: p.fixed, dir: 135, dist: 24, hideDot: true });

  // the dimension column on the left
  const di = Math.min(states.length - 1, Math.max(0, p.dimState ?? states.length - 1));
  const lowY = attachY(states[di]);
  if (p.natural) els.push({ type: "dim", id: "dim-natural", a: { x: 90, y: CEIL_Y }, b: { x: 90, y: natY }, offset: 0, label: p.natural });
  if (p.extension && lowY - natY > 14) {
    els.push({ type: "dim", id: "dim-extension", a: { x: 90, y: natY }, b: { x: 90, y: lowY }, offset: 0, label: p.extension });
    els.push({ type: "line", id: "level-low", a: { x: 90, y: lowY }, b: { x: xs[di] - bw / 2 - 12, y: lowY }, style: "dashed" });
  }

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "An elastic string or spring hanging from a fixed point with a mass on the end, shown at different positions." },
    [
      { id: "setting", label: "the support and the string", given: true },
      { id: "mass", label: "the mass", given: true },
      { id: "lengths", label: "the lengths", given: true },
      { id: "forces", label: "the forces and speeds", given: true },
    ],
    (id) => (id === "ceiling" || id.startsWith("string") || id === "m-fixed" ? "setting" : id.startsWith("body") || id.startsWith("m-") ? "mass" : id.startsWith("f-") || id.startsWith("speed") ? "forces" : "lengths"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
