// Template D6: a load raised by a string over a pulley. A beam (ceiling) carries the pulley; the load hangs on one side, and the other end of the string is pulled
// down with a tension. A faint copy of the load shows the height it is raised through. The picture of "a package raised by a rope and pulley".
// Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D6).
import { BLOCK_H, blockWidthFor } from "../bodies";
import { mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface PulleyParams {
  load?: Lbl;
  /** The tension in the string where it is pulled. */
  tension?: Lbl;
  weight?: Lbl;
  /** The height the load is raised through (the load and a faint copy where it started). */
  height?: Lbl;
  /** An arrow for the speed of the load. */
  speed?: Lbl;
  mirror?: boolean;
  alt?: string;
}

const W = 460, H = 372;
const CEIL_Y = 34, PX = 250, PY = 84, R = 22;

export function buildPulley(p: PulleyParams = {}): Scene {
  const bw = blockWidthFor(p.load);
  const loadX = PX + R, pullX = PX - R;
  const startTop = 262, endTop = p.height ? 170 : 262;     // the top of the load at the start and (raised) at the end
  const els: SceneElement[] = [];

  els.push({ type: "surface", id: "ceiling", kind: "ceiling", a: { x: 24, y: CEIL_Y }, b: { x: W - 24, y: CEIL_Y }, hatch: true, hatchSide: 1 });
  els.push({ type: "line", id: "support", a: { x: PX, y: CEIL_Y }, b: { x: PX, y: PY }, style: "solid" });
  els.push({ type: "pulley", id: "pulley", at: { x: PX, y: PY }, r: R });
  // the string: down to the load on one side, down to where it is pulled on the other
  els.push({ type: "spring", id: "string-load", kind: "string", a: { x: loadX, y: PY }, b: { x: loadX, y: endTop } });
  els.push({ type: "spring", id: "string-pull", kind: "string", a: { x: pullX, y: PY }, b: { x: pullX, y: 214 } });
  if (p.height) els.push({ type: "body", id: "body-start", kind: "block", at: { x: loadX, y: startTop + BLOCK_H }, ghost: true, w: bw });
  els.push({ type: "body", id: "body", kind: "block", at: { x: loadX, y: endTop + BLOCK_H }, label: p.load, w: bw });

  if (p.tension) els.push({ type: "force", id: "f-tension", kind: "tension", from: { x: pullX, y: 214 }, to: { x: pullX, y: 214 + 62 }, label: p.tension });
  if (p.weight) els.push({ type: "force", id: "f-weight", kind: "weight", from: { x: loadX, y: endTop + BLOCK_H / 2 }, to: { x: loadX, y: endTop + BLOCK_H / 2 + 62 }, label: p.weight });
  if (p.speed) els.push({ type: "force", id: "speed", kind: "velocity", from: { x: loadX + bw / 2 + 22, y: endTop + 40 }, to: { x: loadX + bw / 2 + 22, y: endTop - 14 }, label: p.speed });
  if (p.height) {
    els.push({ type: "line", id: "level-start", a: { x: 60, y: startTop }, b: { x: loadX - bw / 2 - 8, y: startTop }, style: "dashed" });
    els.push({ type: "line", id: "level-end", a: { x: 60, y: endTop }, b: { x: loadX - bw / 2 - 8, y: endTop }, style: "dashed" });
    els.push({ type: "dim", id: "dim-height", a: { x: 60, y: startTop }, b: { x: 60, y: endTop }, offset: 0, label: p.height });
  }

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A load raised by a string that passes over a pulley fixed to a beam." },
    [
      { id: "setting", label: "the pulley, the string and the load", given: true },
      { id: "height", label: "the height raised", given: true },
      { id: "forces", label: "the forces and the speed", given: true },
    ],
    (id) => (id === "ceiling" || id === "support" || id === "pulley" || id.startsWith("string") || id.startsWith("body") ? "setting" : id.startsWith("level") || id === "dim-height" ? "height" : "forces"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
