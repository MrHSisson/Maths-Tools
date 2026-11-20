// Mechanics diagrams: drawing each kind of element as SVG. Pure functions from an element (and the layout's decisions) to JSX; no state.
import type { ReactElement } from "react";
import { bodyAnchors, bodyOutline, PARTICLE_R } from "./bodies";
import { coilPoints, slackControl } from "./elastics";
import { dimLine } from "./labelling";
import { FORCE_STYLES, HALO, INK, INK_SOFT } from "./palette";
import { add, dir, leftNormal, mul, rad, sub, unit, type Arc, type Body, type Dim, type Force, type Marker, type Pt, type Pulley, type Spring, type Surface } from "./scene";

const f1 = (n: number): string => (Math.round(n * 10) / 10).toString();
const pts = (p: Pt[]): string => p.map((q) => `${f1(q.x)},${f1(q.y)}`).join(" ");

/** A chevron head at `tip` pointing along `u`. */
const chevron = (tip: Pt, u: Pt, size: number, spread: number): [Pt, Pt, Pt] => {
  const c = Math.cos(rad(spread)), s = Math.sin(rad(spread));
  const rot = (sg: number): Pt => ({ x: -(u.x * c - sg * u.y * s) * size, y: -(u.y * c + sg * u.x * s) * size });
  return [add(tip, rot(1)), tip, add(tip, rot(-1))];
};

export function SurfaceEl({ s, dim }: { s: Surface; dim: boolean }): ReactElement {
  const u = unit(sub(s.b, s.a));
  const n = leftNormal(s.a, s.b);
  const side = s.hatchSide ?? -1;
  const hatch: ReactElement[] = [];
  if (s.hatch) {
    const L = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
    for (let t = 6; t < L - 2; t += 11) {
      const p = add(s.a, mul(u, t));
      const q = add(add(p, mul(n, side * 9)), mul(u, -9));
      hatch.push(<line key={t} x1={f1(p.x)} y1={f1(p.y)} x2={f1(q.x)} y2={f1(q.y)} stroke={INK_SOFT} strokeWidth={1.4} />);
    }
  }
  const dashed = s.kind === "datum" && s.dashed !== false;
  return (
    <g opacity={dim ? 0.4 : 1}>
      {hatch}
      <line x1={f1(s.a.x)} y1={f1(s.a.y)} x2={f1(s.b.x)} y2={f1(s.b.y)} stroke={s.kind === "datum" ? INK_SOFT : INK} strokeWidth={s.kind === "datum" ? 1.6 : 2.8} strokeLinecap="round" strokeDasharray={dashed ? "7 5" : undefined} />
    </g>
  );
}

export function BodyEl({ b, dim }: { b: Body; dim: boolean }): ReactElement {
  const o = bodyOutline(b);
  const an = bodyAnchors(b);
  const op = dim ? 0.4 : 1;
  if (b.kind === "particle") {
    return b.ghost
      ? <circle cx={f1(an.centre.x)} cy={f1(an.centre.y)} r={PARTICLE_R} fill="none" stroke={INK_SOFT} strokeWidth={1.8} strokeDasharray="4 3" opacity={op} />
      : <circle cx={f1(an.centre.x)} cy={f1(an.centre.y)} r={PARTICLE_R} fill={INK} opacity={op} />;
  }
  return b.ghost
    ? <polygon points={pts(o)} fill="none" stroke={INK_SOFT} strokeWidth={1.8} strokeDasharray="5 4" strokeLinejoin="round" opacity={op} />
    : <polygon points={pts(o)} fill="#f1f5f9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" opacity={op} />;
}

export function ForceEl({ f, dim }: { f: Force; dim: boolean }): ReactElement {
  const own = FORCE_STYLES[f.kind];
  const st = f.kind === "component" && f.tone ? { ...own, colour: FORCE_STYLES[f.tone].colour } : own;
  const dashed = own.dash;
  const u = unit(sub(f.to, f.from));
  const op = dim ? 0.4 : 1;
  let line = f.to, head: ReactElement | null = null;
  if (own.head === "filled") {
    const base = sub(f.to, mul(u, 10));
    const n = { x: -u.y, y: u.x };
    head = <polygon points={pts([f.to, add(base, mul(n, 4.6)), add(base, mul(n, -4.6))])} fill={st.colour} />;
    line = sub(f.to, mul(u, 8));
  } else {
    const heads = own.head === "double" ? [f.to, sub(f.to, mul(u, 8))] : [f.to];
    head = <>{heads.map((t, i) => <polyline key={i} points={pts(chevron(t, u, 11, 26))} fill="none" stroke={st.colour} strokeWidth={st.width} strokeLinecap="round" strokeLinejoin="round" />)}</>;
  }
  return (
    <g opacity={op}>
      <line x1={f1(f.from.x)} y1={f1(f.from.y)} x2={f1(line.x)} y2={f1(line.y)} stroke={st.colour} strokeWidth={st.width} strokeLinecap="round" strokeDasharray={dashed} />
      {head}
    </g>
  );
}

export function DimEl({ d, dim }: { d: Dim; dim: boolean }): ReactElement {
  const l = dimLine(d);
  const u = unit(sub(l.b, l.a));
  const n = { x: -u.y, y: u.x };
  const tick = (p: Pt, k: number) => <line key={k} x1={f1(p.x - n.x * 7)} y1={f1(p.y - n.y * 7)} x2={f1(p.x + n.x * 7)} y2={f1(p.y + n.y * 7)} stroke={INK} strokeWidth={1.8} />;
  const arrow = (tip: Pt, toward: Pt, k: number) => {
    const base = add(tip, mul(toward, 10));
    return <polygon key={k} points={pts([tip, add(base, mul(n, 3.6)), add(base, mul(n, -3.6))])} fill={INK} />;
  };
  return (
    <g opacity={dim ? 0.4 : 1}>
      {d.witness && <>
        <line x1={f1(d.a.x)} y1={f1(d.a.y)} x2={f1(l.a.x + (l.a.x - d.a.x) * 0.12)} y2={f1(l.a.y + (l.a.y - d.a.y) * 0.12)} stroke={INK_SOFT} strokeWidth={1.3} strokeDasharray="4 3" />
        <line x1={f1(d.b.x)} y1={f1(d.b.y)} x2={f1(l.b.x + (l.b.x - d.b.x) * 0.12)} y2={f1(l.b.y + (l.b.y - d.b.y) * 0.12)} stroke={INK_SOFT} strokeWidth={1.3} strokeDasharray="4 3" />
      </>}
      <line x1={f1(l.a.x)} y1={f1(l.a.y)} x2={f1(l.b.x)} y2={f1(l.b.y)} stroke={INK} strokeWidth={1.8} />
      {arrow(l.a, u, 0)}{arrow(l.b, mul(u, -1), 1)}
      {tick(l.a, 2)}{tick(l.b, 3)}
    </g>
  );
}

export function ArcEl({ a, dim }: { a: Arc; dim: boolean }): ReactElement {
  let to = a.to; if (to < a.from) to += 360;
  const p0 = add(a.at, mul(dir(a.from), a.r)), p1 = add(a.at, mul(dir(to), a.r));
  const large = to - a.from > 180 ? 1 : 0;
  return <path d={`M${f1(p0.x)} ${f1(p0.y)} A${a.r} ${a.r} 0 ${large} 0 ${f1(p1.x)} ${f1(p1.y)}`} fill="none" stroke={INK} strokeWidth={1.8} opacity={dim ? 0.4 : 1} />;
}

export function MarkerEl({ m, dim }: { m: Marker; dim: boolean }): ReactElement | null {
  if (m.hideDot) return null;
  return <circle cx={f1(m.at.x)} cy={f1(m.at.y)} r={3.6} fill={INK} opacity={dim ? 0.4 : 1} />;
}

/** A label: text over a white halo so it stays readable across a line; a dimension label also gets a white backing so its line breaks around it. */
export function LabelEl({ x, y, text, size, backing, w, h }: { x: number; y: number; text: string; size: number; backing: boolean; w: number; h: number }): ReactElement {
  return (
    <g>
      {backing && <rect x={f1(x - w / 2)} y={f1(y - h / 2)} width={f1(w)} height={f1(h)} fill={HALO} />}
      <text x={f1(x)} y={f1(y)} dy="0.35em" textAnchor="middle" fontSize={size} fill={INK} stroke={HALO} strokeWidth={4} strokeLinejoin="round" paintOrder="stroke" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{text}</text>
    </g>
  );
}

/** What has just been added: a soft warm band behind it, so a worked example shows where the new part went. */
const HOT = "#fde68a";

export function SpringEl({ s, dim, hot }: { s: Spring; dim: boolean; hot: boolean }): ReactElement {
  const colour = s.kind === "elastic" ? FORCE_STYLES.tension.colour : s.kind === "string" ? INK : INK;
  const width = s.kind === "string" ? 1.8 : 2.2;
  let d: string;
  if (s.slack) {
    const c = slackControl(s.a, s.b);
    d = `M${f1(s.a.x)} ${f1(s.a.y)} Q${f1(c.x)} ${f1(c.y)} ${f1(s.b.x)} ${f1(s.b.y)}`;
  } else if (s.kind === "spring") {
    d = "M" + pts(coilPoints(s.a, s.b, s.coils)).replace(/ /g, " L");
  } else {
    d = `M${f1(s.a.x)} ${f1(s.a.y)} L${f1(s.b.x)} ${f1(s.b.y)}`;
  }
  return (
    <g opacity={dim ? 0.4 : 1}>
      {hot && <path d={d} fill="none" stroke={HOT} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
      <path d={d} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function PulleyEl({ p, dim }: { p: Pulley; dim: boolean }): ReactElement {
  return (
    <g opacity={dim ? 0.4 : 1}>
      <circle cx={f1(p.at.x)} cy={f1(p.at.y)} r={p.r} fill="#f1f5f9" stroke={INK} strokeWidth={2.4} />
      <circle cx={f1(p.at.x)} cy={f1(p.at.y)} r={2.6} fill={INK} />
    </g>
  );
}

/** A soft band behind any straight element that has just been added. */
export function Band({ a, b }: { a: Pt; b: Pt }): ReactElement {
  return <line x1={f1(a.x)} y1={f1(a.y)} x2={f1(b.x)} y2={f1(b.y)} stroke={HOT} strokeWidth={9} strokeLinecap="round" />;
}
