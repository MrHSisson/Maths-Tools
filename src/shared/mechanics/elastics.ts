// Mechanics diagrams: the geometry of springs, elastic strings and slack strings, shared by the drawing and by the label layout (which treats the coil band as solid).
import { add, leftNormal, len, mul, sub, unit, type Pt, type Spring } from "./scene";

const COIL_AMP = 9;

/** The points of a coiled spring from a to b: a straight lead at each end and `coils` zigzags between. */
export function coilPoints(a: Pt, b: Pt, coils = 8): Pt[] {
  const L = len(sub(b, a)), u = unit(sub(b, a)), n = leftNormal(a, b);
  const lead = Math.min(14, L * 0.12);
  const n2 = Math.max(2, Math.round(coils)) * 2;
  const pts: Pt[] = [a, add(a, mul(u, lead))];
  const span = L - 2 * lead;
  for (let i = 1; i < n2; i++) {
    const t = lead + (span * i) / n2;
    pts.push(add(add(a, mul(u, t)), mul(n, (i % 2 ? 1 : -1) * COIL_AMP)));
  }
  pts.push(add(a, mul(u, L - lead)), b);
  return pts;
}

/** A slack string: a gentle sag below the chord (gravity side), the control point of a quadratic curve. */
export function slackControl(a: Pt, b: Pt): Pt {
  const L = len(sub(b, a));
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + Math.min(34, L * 0.28) };
}

/** Solid line segments standing for a spring or string, for the label placer. A coil is a band, so the two edges of the band are included. */
export function springSegments(s: Spring): [Pt, Pt][] {
  if (s.slack) { const c = slackControl(s.a, s.b); return [[s.a, c], [c, s.b]]; }
  if (s.kind !== "spring") return [[s.a, s.b]];
  const n = leftNormal(s.a, s.b), o = mul(n, COIL_AMP + 2);
  return [[s.a, s.b], [add(s.a, o), add(s.b, o)], [sub(s.a, o), sub(s.b, o)]];
}
