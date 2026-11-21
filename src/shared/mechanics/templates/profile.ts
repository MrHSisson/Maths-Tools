// Template D5: a path profile. A track that falls from a start height to a valley floor, runs along it, and climbs to an end height: the picture of a journey in
// stages (a cyclist coasting down and climbing a hill, a diver through air then water). The heights are dimension lines from the valley floor; the whole distance
// along the track is one dimension below. Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D5).
import { add, mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface ProfileParams {
  /** The start and end heights above the valley floor, as fractions 0 to 1 of the picture's height. Pictorial only: the dimension labels carry the numbers. */
  startRel?: number;
  endRel?: number;
  startHeight?: Lbl; endHeight?: Lbl;
  /** The whole distance travelled along the track. */
  distance?: Lbl;
  /** The body at the start of the track (a particle). */
  body?: boolean;
  bodyLabel?: Lbl;
  names?: { start?: string; end?: string };
  mirror?: boolean;
  alt?: string;
}

const W = 540, H = 320;
const FLOOR_Y = 250, TOP_Y = 60;

export function buildProfile(p: ProfileParams = {}): Scene {
  const rel = (v: number | undefined, d: number) => Math.max(0.25, Math.min(1, v ?? d));
  const y0 = FLOOR_Y - rel(p.startRel, 1) * (FLOOR_Y - TOP_Y);
  const y3 = FLOOR_Y - rel(p.endRel, 0.35) * (FLOOR_Y - TOP_Y);
  const P0 = { x: 60, y: y0 }, P1 = { x: 200, y: FLOOR_Y }, P2 = { x: 300, y: FLOOR_Y }, P3 = { x: 430, y: y3 };
  const els: SceneElement[] = [];
  // the track in three pieces, each a surface hatched below
  els.push({ type: "surface", id: "track-down", kind: "ground", a: P0, b: P1, hatch: true });
  els.push({ type: "surface", id: "track-flat", kind: "ground", a: P1, b: P2, hatch: true });
  els.push({ type: "surface", id: "track-up", kind: "ground", a: P2, b: P3, hatch: true });
  els.push({ type: "line", id: "floor", a: { x: 30, y: FLOOR_Y }, b: { x: 500, y: FLOOR_Y }, style: "dashed" });

  if (p.body) {
    const ang = (Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180) / Math.PI;          // downhill, so negative on screen terms
    const at = add(P0, { x: 30, y: ((P1.y - P0.y) / (P1.x - P0.x)) * 30 });
    const b = { type: "body" as const, id: "body", kind: "particle" as const, at, rot: -ang, label: p.bodyLabel };
    els.push(b);
  }
  if (p.startHeight) els.push({ type: "dim", id: "dim-start", a: { x: 40, y: FLOOR_Y }, b: { x: 40, y: y0 }, offset: 0, label: p.startHeight });
  if (p.endHeight) els.push({ type: "dim", id: "dim-end", a: { x: 470, y: FLOOR_Y }, b: { x: 470, y: y3 }, offset: 0, label: p.endHeight });
  els.push({ type: "line", id: "level-start", a: { x: 40, y: y0 }, b: { x: P0.x, y: y0 }, style: "thin" });
  els.push({ type: "line", id: "level-end", a: P3, b: { x: 470, y: y3 }, style: "thin" });
  if (p.distance) els.push({ type: "dim", id: "dim-distance", a: { x: P0.x, y: FLOOR_Y }, b: { x: P3.x, y: FLOOR_Y }, offset: -34, witness: true, label: p.distance });
  if (p.names?.start) els.push({ type: "marker", id: "m-start", at: P0, name: p.names.start, dir: 135, dist: 22, hideDot: true });
  if (p.names?.end) els.push({ type: "marker", id: "m-end", at: P3, name: p.names.end, dir: 45, dist: 22, hideDot: true });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A track that falls to a valley floor and climbs again, with the start and end heights above the floor." },
    [
      { id: "setting", label: "the track and the body", given: true },
      { id: "heights", label: "the heights above the valley floor", given: true },
      { id: "distance", label: "the distance along the track", given: true },
    ],
    (id) => (id.startsWith("track") || id === "floor" || id === "body" || id.startsWith("m-") ? "setting" : id === "dim-distance" ? "distance" : "heights"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
