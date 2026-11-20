// Template D9: a mass hanging from two strings fixed at two points A and B on a level ceiling. The distance AB, the lengths of the strings, the angles each makes with
// the ceiling, the tensions along the strings and the weight. The picture of "equilibrium with two strings": resolve horizontally and vertically.
// Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D9).
import { add, dir, mirrorScene, mul, withParts, type Lbl, type Scene, type SceneElement } from "../scene";

export interface TwoStringsParams {
  kind?: "elastic" | "string";
  /** Where the mass hangs between A and B, as a fraction of AB from A (clamped to 0.3 to 0.7). Pictorial only. */
  position?: number;
  mass?: Lbl;
  /** The distance AB, and the lengths of the two strings. */
  ab?: Lbl; lengthA?: Lbl; lengthB?: Lbl;
  /** The angles the strings make with the ceiling at A and at B. */
  angleA?: Lbl; angleB?: Lbl;
  /** Tension arrows along each string, drawn from the mass; the weight arrow down. */
  tensionA?: Lbl; tensionB?: Lbl; weight?: Lbl;
  names?: { a?: string; b?: string; p?: string };
  mirror?: boolean;
  alt?: string;
}

const W = 520, H = 360;
const CEIL_Y = 74, AX = 100, BX = 420, DROP = 170;

export function buildTwoStrings(p: TwoStringsParams = {}): Scene {
  const kind = p.kind ?? "elastic";
  const frac = Math.max(0.3, Math.min(0.7, p.position ?? 0.45));
  const px = AX + frac * (BX - AX), py = CEIL_Y + DROP;
  const A = { x: AX, y: CEIL_Y }, B = { x: BX, y: CEIL_Y }, P = { x: px, y: py };
  const angA = (Math.atan2(DROP, px - AX) * 180) / Math.PI;       // measured from the ceiling at A, downwards
  const angB = (Math.atan2(DROP, BX - px) * 180) / Math.PI;
  const els: SceneElement[] = [];

  els.push({ type: "surface", id: "ceiling", kind: "ceiling", a: { x: 24, y: CEIL_Y }, b: { x: W - 24, y: CEIL_Y }, hatch: true, hatchSide: 1 });
  els.push({ type: "spring", id: "string-a", kind, a: A, b: P });
  els.push({ type: "spring", id: "string-b", kind, a: B, b: P });
  els.push({ type: "body", id: "body", kind: "particle", at: { x: px, y: py + 14 } });
  if (p.mass) els.push({ type: "marker", id: "m-mass", at: P, name: p.mass.text, dir: 270, dist: 30, hideDot: true });

  if (p.ab) els.push({ type: "dim", id: "dim-ab", a: A, b: B, offset: 42, witness: false, label: p.ab });
  if (p.lengthA) els.push({ type: "marker", id: "m-len-a", at: { x: (AX + px) / 2, y: (CEIL_Y + py) / 2 }, name: p.lengthA.text, dir: 225, dist: 26, hideDot: true });
  if (p.lengthB) els.push({ type: "marker", id: "m-len-b", at: { x: (BX + px) / 2, y: (CEIL_Y + py) / 2 }, name: p.lengthB.text, dir: 315, dist: 26, hideDot: true });
  els.push({ type: "arc", id: "arc-a", at: A, r: 56, from: 360 - angA, to: 360, label: p.angleA });
  els.push({ type: "arc", id: "arc-b", at: B, r: 56, from: 180, to: 180 + angB, label: p.angleB });

  const toward = (from: { x: number; y: number }, ang: number, len: number) => add(from, mul(dir(ang), len));
  if (p.tensionA) els.push({ type: "force", id: "f-tension-a", kind: "tension", from: P, to: toward(P, 180 - angA, 74), label: p.tensionA });
  if (p.tensionB) els.push({ type: "force", id: "f-tension-b", kind: "tension", from: P, to: toward(P, angB, 74), label: p.tensionB });
  if (p.weight) els.push({ type: "force", id: "f-weight", kind: "weight", from: P, to: add(P, { x: 0, y: 66 }), label: p.weight });


  if (p.names?.a) els.push({ type: "marker", id: "m-a", at: A, name: p.names.a, dir: 270, dist: 20, hideDot: true });
  if (p.names?.b) els.push({ type: "marker", id: "m-b", at: B, name: p.names.b, dir: 270, dist: 20, hideDot: true });
  if (p.names?.p) els.push({ type: "marker", id: "m-p", at: P, name: p.names.p, dir: 0, dist: 24, hideDot: true });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A mass hanging from two strings fixed at two points on a level ceiling." },
    [
      { id: "setting", label: "the ceiling, the strings and the mass", given: true },
      { id: "measures", label: "the lengths and the angles", given: true },
      { id: "forces", label: "the forces", given: true },
    ],
    (id) => (id === "ceiling" || id.startsWith("string") || id === "body" || id === "m-a" || id === "m-b" || id === "m-p" || id === "m-mass" ? "setting" : id.startsWith("f-") ? "forces" : "measures"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
