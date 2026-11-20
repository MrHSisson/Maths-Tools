// Template D10: a spring or elastic string along a slope. The string is fixed at A near the top of the slope and joined to a mass lower down; the mass is shown at its
// natural-length position (B) and, when stretched, at its stretched position (C), with the natural length, the extension and the whole length marked along the slope.
// The picture of "a particle released on a slope, attached to a string". Docs: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D10).
import { blockWidthFor, bodyAnchors } from "../bodies";
import { mirrorScene, withParts, type Lbl, type Scene, type SceneElement } from "../scene";
import { slopeElements, slopeFrame } from "./slope";

export interface InclineStringParams {
  kind?: "spring" | "elastic";
  angle?: number;
  angleLabel?: Lbl;
  /** `natural`: the mass is at the natural length. `extended`: it is stretched down the slope and a faint copy shows the natural-length position. */
  state?: "natural" | "extended";
  /** How far it is stretched, as a fraction of the natural length. Pictorial only: clamped to 0.3 to 0.7. */
  stretch?: number;
  body?: "block" | "particle";
  bodyLabel?: Lbl;
  /** The natural length, the extension and the whole length, as dimensions along the slope below it. */
  natural?: Lbl; extension?: Lbl; length?: Lbl;
  /** Names for the fixed end, the natural-length position and the stretched position. */
  names?: { fixed?: string; natural?: string; free?: string };
  mirror?: boolean;
  alt?: string;
}

const W = 540, H = 360;
const FOOT = { x: 70, y: 250 };

export function buildInclineString(p: InclineStringParams = {}): Scene {
  const f = slopeFrame(p.angle ?? 30, FOOT);
  const a = f.alpha;
  const kind = p.kind ?? "elastic";
  const body = p.body ?? "block";
  const bw = body === "block" ? blockWidthFor(p.bodyLabel) : 14;
  const state = p.state ?? "extended";
  const stretch = Math.max(0.3, Math.min(0.7, p.stretch ?? 0.5));
  const sA = 0.93 * f.len;                       // where the string is fixed
  const natPx = Math.min(0.42 * f.len, 0.93 * f.len - bw - 20);
  const sNat = sA - natPx;                       // the end of the string at its natural length
  const sEnd = state === "extended" ? sNat - stretch * natPx : sNat;
  const els: SceneElement[] = [...slopeElements(f)];

  const A = f.at(sA), N = f.at(sNat), E = f.at(sEnd);
  // the mass hangs below the string's end, its up-slope face at the end
  const bodyAt = (id: string, face: number, ghost: boolean) => ({ type: "body" as const, id, kind: body, at: f.at(face - bw / 2), rot: a, ghost, label: ghost ? undefined : p.bodyLabel, w: body === "block" ? bw : undefined });
  if (state === "extended") els.push(bodyAt("body-natural", sNat, true));
  const mass = bodyAt("body", sEnd, false);
  els.push(mass);
  const an = bodyAnchors(mass);
  els.push({ type: "spring", id: "string", kind, a: A, b: an.front });

  if (p.natural) els.push({ type: "dim", id: "dim-natural", a: N, b: A, offset: -40, witness: true, label: p.natural });
  if (p.extension && state === "extended") els.push({ type: "dim", id: "dim-extension", a: E, b: N, offset: -40, witness: true, label: p.extension });
  if (p.length) els.push({ type: "dim", id: "dim-length", a: E, b: A, offset: -84, witness: true, label: p.length });
  els.push({ type: "arc", id: "arc-alpha", at: f.foot, r: 54, from: 0, to: a, label: p.angleLabel });
  if (p.names?.fixed) els.push({ type: "marker", id: "m-fixed", at: A, name: p.names.fixed, dir: a + 90, dist: 26, hideDot: true });
  if (p.names?.natural && state === "extended") els.push({ type: "marker", id: "m-natural", at: N, name: p.names.natural, dir: a + 90, dist: 26, hideDot: true });
  if (p.names?.free) els.push({ type: "marker", id: "m-free", at: E, name: p.names.free, dir: a + 90, dist: 26, hideDot: true });

  const scene = withParts(
    { w: W, h: H, elements: els, alt: p.alt ?? "A spring or elastic string along a slope, fixed near the top and joined to a mass lower down." },
    [
      { id: "setting", label: "the slope, the string and the mass", given: true },
      { id: "lengths", label: "the natural length, the extension and the angle", given: true },
    ],
    (id) => (id === "slope" || id === "base" || id === "side" || id.startsWith("square") || id.startsWith("body") || id === "string" || id.startsWith("m-") ? "setting" : "lengths"),
  );
  return p.mirror ? mirrorScene(scene) : scene;
}
