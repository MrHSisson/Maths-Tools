// Template D7: a spring or elastic string along a horizontal surface. A fixed wall on the left, the spring or string, a mass on a table, and (when it is not at
// its natural length) a faint copy of the mass where the natural length would put it. The dimension rows above show the natural length l, the extension or
// compression x and, if wanted, the whole length; an applied force can act on the free end. Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D7).
import { PARTICLE_R, blockWidthFor, BLOCK_H } from "../bodies";
import { mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface ElasticHorizontalParams {
  /** A coiled spring (which can be compressed) or an elastic string (which can only stretch). */
  kind?: "spring" | "elastic";
  state?: "natural" | "extended" | "compressed";
  /** How far it is stretched or squashed, as a fraction of the natural length. Pictorial only: clamped to 0.3 to 0.6. */
  stretch?: number;
  body?: "block" | "particle";
  /** Text on the mass. */
  mass?: Lbl;
  /** Dimension labels: the natural length, the extension (or compression), and the whole length. */
  natural?: Lbl; extension?: Lbl; length?: Lbl;
  /** Text on the spring itself (a modulus of elasticity, a stiffness). */
  modulus?: Lbl;
  /** A force acting on the free end, pulling it out or pushing it in. */
  force?: Lbl;
  /** Names for the fixed end, the free end and the natural-length position. */
  names?: { fixed?: string; free?: string; natural?: string };
  mirror?: boolean;
  alt?: string;
}

const W = 540, H = 266;
const GROUND_Y = 196, WALL_X = 44, NAT = 190;

export function buildElasticHorizontal(p: ElasticHorizontalParams = {}): Scene {
  const kind = p.kind ?? "spring";
  const state = kind === "elastic" && p.state === "compressed" ? "natural" : p.state ?? "extended";
  const body = p.body ?? "block";
  const e = NAT * Math.max(0.3, Math.min(0.6, p.stretch ?? 0.4));
  const bw = body === "block" ? blockWidthFor(p.mass) : PARTICLE_R * 2;
  const bh = body === "block" ? BLOCK_H : PARTICLE_R * 2;
  const cy = GROUND_Y - bh / 2;
  const topY = GROUND_Y - bh;
  const xn = WALL_X + NAT;
  const xl = state === "extended" ? xn + e : state === "compressed" ? xn - e : xn;
  const els: SceneElement[] = [];

  els.push({ type: "surface", id: "wall", kind: "wall", a: { x: WALL_X, y: 42 }, b: { x: WALL_X, y: GROUND_Y }, hatch: true });
  els.push({ type: "surface", id: "ground", kind: "ground", a: { x: WALL_X, y: GROUND_Y }, b: { x: W - 16, y: GROUND_Y }, hatch: true });
  if (state !== "natural") els.push({ type: "body", id: "body-natural", kind: body, at: { x: xn + bw / 2, y: GROUND_Y }, ghost: true, w: body === "block" ? bw : undefined });
  els.push({ type: "body", id: "body", kind: body, at: { x: xl + bw / 2, y: GROUND_Y }, label: body === "block" ? p.mass : undefined, w: body === "block" ? bw : undefined });
  els.push({ type: "spring", id: "spring", kind, a: { x: WALL_X, y: cy }, b: { x: xl, y: cy }, label: p.modulus });

  // the natural length and the whole length are rows above the mass; the extension (or compression) is below the table, as the distance moved is in the horizontal template
  if (p.natural) els.push({ type: "dim", id: "dim-natural", a: { x: WALL_X, y: topY }, b: { x: xn, y: topY }, offset: 54, witness: true, label: p.natural });
  if (p.extension && state !== "natural") els.push({ type: "dim", id: "dim-extension", a: { x: Math.min(xn, xl), y: GROUND_Y }, b: { x: Math.max(xn, xl), y: GROUND_Y }, offset: -34, witness: true, label: p.extension });
  if (p.length) els.push({ type: "dim", id: "dim-length", a: { x: WALL_X, y: topY }, b: { x: xl, y: topY }, offset: 94, witness: true, label: p.length });

  if (p.force) {
    const x0 = xl + bw;
    els.push(state === "compressed"
      ? { type: "force", id: "f-applied", kind: "applied", from: { x: x0 + 64, y: cy }, to: { x: x0, y: cy }, label: p.force }
      : { type: "force", id: "f-applied", kind: "applied", from: { x: x0, y: cy }, to: { x: x0 + 64, y: cy }, label: p.force });
  }

  if (p.names?.fixed) els.push({ type: "marker", id: "m-fixed", at: { x: WALL_X, y: 42 }, name: p.names.fixed, dir: 90, hideDot: true });
  if (p.names?.free) els.push({ type: "marker", id: "m-free", at: { x: xl + bw / 2, y: cy }, name: p.names.free, dir: 90, dist: bh / 2 + 22, hideDot: true });
  if (p.names?.natural && state !== "natural") els.push({ type: "marker", id: "m-natural", at: { x: xn + bw / 2, y: cy }, name: p.names.natural, dir: 90, dist: bh / 2 + 22, hideDot: true });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A spring or elastic string fixed to a wall at one end and joined to a mass on a horizontal table at the other." },
    [
      { id: "setting", label: "the wall, the table and the mass", given: true },
      { id: "spring", label: kind === "spring" ? "the spring" : "the elastic string", given: true },
      { id: "lengths", label: "the lengths", given: true },
      { id: "force", label: "the force", given: true },
    ],
    (id) => (id === "wall" || id === "ground" || id.startsWith("body") || id.startsWith("m-") ? "setting" : id === "spring" ? "spring" : id === "f-applied" ? "force" : "lengths"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
