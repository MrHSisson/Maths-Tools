// Template D4: vertical motion. A ground (datum) line, a body at a starting height and a faint copy at a final height, with the heights and the drop
// as dimension lines on the left, and the starting and final speeds as arrows beside each position. The picture of "gravity does work through a height":
// work done by gravity, GPE, KE and conservation of energy. Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D4).
import { BLOCK_H, PARTICLE_R, blockWidthFor, bodyAnchors } from "../bodies";
import { add, mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface VerticalPosition {
  /** Height above the ground as a fraction of the full height (0 is the ground). Pictorial only: it is clamped so the two heights stay readable. */
  rel: number;
  /** The label of the height above ground (h₁, 12 m). */
  height?: Lbl;
  /** The speed there, drawn as an arrow beside the body. */
  speed?: Lbl;
  /** Which way it is moving, so the speed arrow points up or down. */
  moving?: "up" | "down";
  /** A name for the position (A, B, P). */
  name?: string;
}

export interface VerticalParams {
  body?: "block" | "particle";
  start: VerticalPosition;
  end?: VerticalPosition;
  /** The vertical distance between the two positions (shown as its own dimension), e.g. "h₁ − h₂" or "15 m". */
  drop?: Lbl;
  /** Weight arrow on the starting body. */
  weight?: Lbl;
  bodyLabel?: Lbl;
  mirror?: boolean;
  alt?: string;
}

const W = 440, H = 300;
const GROUND_Y = 262, TOP_Y = 78;

export function buildVertical(p: VerticalParams): Scene {
  const els: SceneElement[] = [];
  const span = GROUND_Y - TOP_Y;
  const yOf = (rel: number) => GROUND_Y - Math.max(0, Math.min(1, rel)) * span;
  const y1 = yOf(p.start.rel);
  let y2 = p.end ? yOf(p.end.rel) : y1;
  if (p.end && Math.abs(y2 - y1) < 44) y2 = y1 + (p.end.rel <= p.start.rel ? 44 : -44);
  // the final position is either on the ground (no height to measure) or clear of it by enough to draw a height
  const onGround = !!p.end && y2 > GROUND_Y - 30;
  if (onGround) y2 = GROUND_Y;
  const x1 = 210, x2 = 350;

  els.push({ type: "surface", id: "ground", kind: "ground", a: { x: 16, y: GROUND_Y }, b: { x: W - 16, y: GROUND_Y }, hatch: true });

  const half = p.body === "block" ? BLOCK_H / 2 : PARTICLE_R;
  // a position is the body's centre, so its base is half its height below the level; on the ground it simply rests there
  const bodyAt = (id: string, x: number, level: number, ghost: boolean, label?: Lbl) => {
    const base = Math.min(level + half, GROUND_Y);
    return { type: "body" as const, id, kind: p.body ?? "particle", at: { x, y: base }, ghost, label, w: p.body === "block" ? blockWidthFor(p.bodyLabel) : undefined };
  };
  // a particle carries its name and mass as one marker (A, m); a block carries its mass inside and its name above
  const particleText = (name?: string) => (p.body === "block" ? name : [name, p.bodyLabel?.text].filter(Boolean).join(", ") || undefined);
  const b1 = bodyAt("body-start", x1, y1, false, p.body === "block" ? p.bodyLabel : undefined);
  els.push(b1);
  const a1 = bodyAnchors(b1);
  const bEnd = p.end ? bodyAt("body-end", x2, y2, true) : undefined;
  if (bEnd) els.push(bEnd);

  // level lines from the left edge to each body, so the heights read across
  const clear = (p.body === "block" ? BLOCK_H : PARTICLE_R * 2) / 2 + 10;
  const reach = p.body === "block" ? 38 : 16;
  els.push({ type: "line", id: "level-start", a: { x: 56, y: y1 }, b: { x: x1 - reach, y: y1 }, style: "dashed" });
  if (p.end && !onGround) els.push({ type: "line", id: "level-end", a: { x: 56, y: y2 }, b: { x: x2 - reach, y: y2 }, style: "dashed" });
  void clear;

  // heights as dimension lines on the left; the drop in the gap between them
  if (p.start.height) els.push({ type: "dim", id: "dim-h1", a: { x: 56, y: GROUND_Y }, b: { x: 56, y: y1 }, offset: 0, label: p.start.height });
  if (p.end?.height && !onGround) els.push({ type: "dim", id: "dim-h2", a: { x: 100, y: GROUND_Y }, b: { x: 100, y: y2 }, offset: 0, label: p.end.height });
  if (p.end && p.drop && !onGround) els.push({ type: "dim", id: "dim-drop", a: { x: 144, y: y2 }, b: { x: 144, y: y1 }, offset: 0, label: p.drop });
  if (p.end && p.drop && !onGround) els.push({ type: "line", id: "level-end-2", a: { x: 56, y: y2 }, b: { x: 152, y: y2 }, style: "thin" });
  if (p.end && p.drop && !onGround) els.push({ type: "line", id: "level-start-2", a: { x: 56, y: y1 }, b: { x: 152, y: y1 }, style: "thin" });

  const speedArrow = (id: string, x: number, y: number, pos: VerticalPosition) => {
    if (!pos.speed) return;
    const up = pos.moving === "up";
    const ax = x + (p.body === "block" ? blockWidthFor(p.bodyLabel) / 2 + 20 : 46);
    const from = { x: ax, y: y + (up ? 10 : -24) }, to = { x: ax, y: y + (up ? -36 : 24) };
    els.push({ type: "force", id, kind: "velocity", from: add(from, { x: 0, y: 0 }), to, label: pos.speed });
  };
  speedArrow("speed-start", x1, y1, p.start);
  if (p.end) speedArrow("speed-end", x2, y2, p.end);

  if (p.weight) els.push({ type: "force", id: "f-weight", kind: "weight", from: a1.centre, to: add(a1.centre, { x: 0, y: 46 }), label: p.weight });

  // names sit above their body, clear of its outline
  const nameDist = half + 22;
  const t1 = particleText(p.start.name);
  if (t1) els.push({ type: "marker", id: "m-start", at: a1.centre, name: t1, dir: 90, dist: nameDist, hideDot: true });
  if (bEnd && p.end?.name) els.push({ type: "marker", id: "m-end", at: bodyAnchors(bEnd).centre, name: p.end.name, dir: 90, dist: nameDist, hideDot: true });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A body at a height above the ground, with its speed and the heights marked." },
    [
      { id: "setting", label: "the ground and the body", given: true },
      { id: "heights", label: "the heights", given: true },
      { id: "speeds", label: "the speeds", given: true },
      { id: "forces", label: "the weight", given: true },
    ],
    (id) => (id === "ground" || id.startsWith("body") || id.startsWith("m-") ? "setting" : id.startsWith("speed") ? "speeds" : id === "f-weight" ? "forces" : "heights"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
