// Template D11: two particles joined by a string through a hole in a table. A on the table top, B hanging below the hole; the distance of A from the hole, the depth of B
// below it, friction on A and the weight of B. The picture of the connected-particles question. Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D11).
import { BLOCK_H, blockWidthFor } from "../bodies";
import { mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface HoleParams {
  kind?: "elastic" | "string";
  /** The masses on the table (A) and hanging (B). */
  massA?: Lbl; massB?: Lbl;
  /** The distance of A from the hole, and the depth of B below it. */
  distanceA?: Lbl; depthB?: Lbl;
  /** Friction on A (it opposes the motion, toward the right, away from the hole), and the weight of B. */
  friction?: Lbl; weightB?: Lbl;
  /** The tension in the string, drawn on both particles. */
  tension?: Lbl;
  names?: { a?: string; b?: string; hole?: string };
  mirror?: boolean;
  alt?: string;
}

const W = 500, H = 380;
const TABLE_Y = 130, HOLE_X = 330;

export function buildHole(p: HoleParams = {}): Scene {
  const kind = p.kind ?? "elastic";
  const bwA = blockWidthFor(p.massA), bwB = blockWidthFor(p.massB, 22);
  const ax = 120 + bwA / 2, by = 240;               // A's centre x on the table; the top of B
  const els: SceneElement[] = [];

  // the table top has a gap at the hole; the string runs along the top, into the gap, and down to B
  els.push({ type: "surface", id: "table-left", kind: "ground", a: { x: 30, y: TABLE_Y }, b: { x: HOLE_X - 14, y: TABLE_Y }, hatch: true });
  els.push({ type: "surface", id: "table-right", kind: "ground", a: { x: HOLE_X + 14, y: TABLE_Y }, b: { x: W - 20, y: TABLE_Y }, hatch: true });
  els.push({ type: "body", id: "body-a", kind: "block", at: { x: ax, y: TABLE_Y }, label: p.massA, w: bwA });
  els.push({ type: "spring", id: "string-a", kind, a: { x: ax + bwA / 2, y: TABLE_Y - BLOCK_H / 2 }, b: { x: HOLE_X, y: TABLE_Y - BLOCK_H / 2 } });
  els.push({ type: "spring", id: "string-b", kind, a: { x: HOLE_X, y: TABLE_Y - BLOCK_H / 2 }, b: { x: HOLE_X, y: by } });
  els.push({ type: "body", id: "body-b", kind: "block", at: { x: HOLE_X, y: by + BLOCK_H }, label: p.massB, w: bwB });

  if (p.distanceA) els.push({ type: "dim", id: "dim-a", a: { x: ax + bwA / 2, y: TABLE_Y }, b: { x: HOLE_X, y: TABLE_Y }, offset: -34, witness: true, label: p.distanceA });
  if (p.depthB) els.push({ type: "dim", id: "dim-b", a: { x: HOLE_X + 70, y: TABLE_Y }, b: { x: HOLE_X + 70, y: by + BLOCK_H / 2 }, offset: 0, witness: false, label: p.depthB });
  if (p.depthB) els.push({ type: "line", id: "level-b", a: { x: HOLE_X + 70, y: by + BLOCK_H / 2 }, b: { x: HOLE_X + bwB / 2, y: by + BLOCK_H / 2 }, style: "dashed" });
  if (p.friction) els.push({ type: "force", id: "f-friction", kind: "friction", from: { x: ax - bwA / 2, y: TABLE_Y - BLOCK_H / 2 }, to: { x: ax - bwA / 2 - 60, y: TABLE_Y - BLOCK_H / 2 }, label: p.friction });
  if (p.weightB) els.push({ type: "force", id: "f-weight-b", kind: "weight", from: { x: HOLE_X, y: by + BLOCK_H / 2 }, to: { x: HOLE_X, y: by + BLOCK_H / 2 + 76 }, label: p.weightB });
  if (p.tension) els.push({ type: "force", id: "f-tension", kind: "tension", from: { x: HOLE_X - 18, y: by - 6 }, to: { x: HOLE_X - 18, y: by - 56 }, label: p.tension });
  if (p.names?.a) els.push({ type: "marker", id: "m-a", at: { x: ax, y: TABLE_Y - BLOCK_H }, name: p.names.a, dir: 90, dist: 26, hideDot: true });
  if (p.names?.b) els.push({ type: "marker", id: "m-b", at: { x: HOLE_X, y: by + BLOCK_H / 2 }, name: p.names.b, dir: 180, dist: bwB / 2 + 24, hideDot: true });
  if (p.names?.hole) els.push({ type: "marker", id: "m-hole", at: { x: HOLE_X, y: TABLE_Y }, name: p.names.hole, dir: 60, dist: 30, hideDot: true });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A particle on a table joined by a string through a hole to a particle hanging below." },
    [
      { id: "setting", label: "the table, the string and the two particles", given: true },
      { id: "measures", label: "the distances", given: true },
      { id: "forces", label: "the forces", given: true },
    ],
    (id) => (id.startsWith("table") || id.startsWith("string") || id.startsWith("body") || id.startsWith("m-") ? "setting" : id.startsWith("f-") ? "forces" : "measures"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
