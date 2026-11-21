// Mechanics diagrams: drawing each kind of element as SVG. Pure functions from an element (and the layout's decisions) to JSX; no state.
import type { ReactElement } from "react";
import { bodyAnchors, bodyOutline, PARTICLE_R } from "./bodies";
import { areaPolygon, barRects, curveAt, graphAxes, graphPoint } from "./chartGeom";
import { coilPoints, slackControl } from "./elastics";
import { dimLine } from "./labelling";
import { FORCE_STYLES, HALO, INK, INK_SOFT } from "./palette";
import { add, dir, leftNormal, mul, rad, sub, unit, type Arc, type Bars, type Body, type Dim, type Force, type Graph, type Marker, type Pt, type Pulley, type Spring, type Surface } from "./scene";

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

const CURVE = "#1e3a8a";
const AREA = "#bfdbfe";

/** Axes with arrowheads, the curve, tick marks with their guides, and the shaded area. Text (titles, marks, curve and area labels) is drawn by the layout. */
export function GraphEl({ g, dim }: { g: Graph; dim: boolean }): ReactElement {
  const ax = graphAxes(g);
  const head = (tip: Pt, u: Pt) => {
    const base = sub(tip, mul(u, 10)), n = { x: -u.y, y: u.x };
    return <polygon points={pts([tip, add(base, mul(n, 4.4)), add(base, mul(n, -4.4))])} fill={INK} />;
  };
  const ux = unit(sub(ax.x[1], ax.x[0])), uy = unit(sub(ax.y[1], ax.y[0]));
  const curve = g.curve.map((p) => graphPoint(g, p));
  const area = areaPolygon(g);
  return (
    <g opacity={dim ? 0.4 : 1}>
      {area.length > 0 && <polygon points={pts(area)} fill={AREA} opacity={0.75} />}
      <line x1={f1(ax.x[0].x)} y1={f1(ax.x[0].y)} x2={f1(ax.x[1].x - 8)} y2={f1(ax.x[1].y)} stroke={INK} strokeWidth={2} />
      <line x1={f1(ax.y[0].x)} y1={f1(ax.y[0].y)} x2={f1(ax.y[1].x)} y2={f1(ax.y[1].y + 8)} stroke={INK} strokeWidth={2} />
      {head(ax.x[1], ux)}{head(ax.y[1], uy)}
      {(g.marks ?? []).map((m, i) => {
        const p = m.axis === "x" ? graphPoint(g, { x: m.at, y: 0 }) : graphPoint(g, { x: 0, y: m.at });
        const tick = m.axis === "x" ? [add(p, { x: 0, y: -5 }), add(p, { x: 0, y: 5 })] : [add(p, { x: -5, y: 0 }), add(p, { x: 5, y: 0 })];
        const guide = m.guide
          ? (m.axis === "x"
            ? [p, graphPoint(g, { x: m.at, y: curveAt(g, m.at) })]
            : [p, graphPoint(g, { x: 1, y: m.at })])
          : null;
        return (
          <g key={i}>
            {guide && <line x1={f1(guide[0].x)} y1={f1(guide[0].y)} x2={f1(guide[1].x)} y2={f1(guide[1].y)} stroke={INK_SOFT} strokeWidth={1.4} strokeDasharray="5 4" />}
            <line x1={f1(tick[0].x)} y1={f1(tick[0].y)} x2={f1(tick[1].x)} y2={f1(tick[1].y)} stroke={INK} strokeWidth={1.8} />
          </g>
        );
      })}
      {curve.length > 1 && <polyline points={pts(curve)} fill="none" stroke={CURVE} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" />}
    </g>
  );
}

const BAR_FILL: Record<string, string> = { gpe: "#93c5fd", epe: "#86efac", ke: "#fcd34d", work: "#e2e8f0" };

/** Energy bars: stacked rectangles (gravitational at the bottom, then elastic, kinetic and work), a dashed line at the first column's total, and a baseline. */
export function BarsEl({ b, dim }: { b: Bars; dim: boolean }): ReactElement {
  const g = barRects(b);
  const pid = (k: string) => `pat-${b.id}-${k}`;
  return (
    <g opacity={dim ? 0.4 : 1}>
      <defs>
        <pattern id={pid("epe")} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke={INK} strokeWidth="1.2" opacity="0.55" /></pattern>
        <pattern id={pid("work")} width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.2" fill={INK} opacity="0.5" /></pattern>
      </defs>
      <line x1={f1(b.x)} y1={f1(g.base)} x2={f1(b.x + b.w)} y2={f1(g.base)} stroke={INK} strokeWidth={2.4} />
      {b.conserved && b.columns.length > 1 && <line x1={f1(b.x + 6)} y1={f1(g.firstTop)} x2={f1(b.x + b.w - (b.legend ? 96 : 0))} y2={f1(g.firstTop)} stroke={INK_SOFT} strokeWidth={1.6} strokeDasharray="7 5" />}
      {g.rects.map((r, i) => (
        <g key={i}>
          <rect x={f1(r.x)} y={f1(r.y)} width={f1(r.w)} height={f1(r.h)} fill={BAR_FILL[r.kind]} stroke={INK} strokeWidth={1.8} />
          {(r.kind === "epe" || r.kind === "work") && <rect x={f1(r.x)} y={f1(r.y)} width={f1(r.w)} height={f1(r.h)} fill={`url(#${pid(r.kind)})`} />}
        </g>
      ))}
      {b.legend && ["gpe", "epe", "ke", "work"].map((k, i) => (
        <g key={k}>
          <rect x={f1(b.x + b.w - 90)} y={f1(b.y + 12 + i * 31 - 8)} width={14} height={14} fill={BAR_FILL[k]} stroke={INK} strokeWidth={1.4} />
          {(k === "epe" || k === "work") && <rect x={f1(b.x + b.w - 90)} y={f1(b.y + 12 + i * 31 - 8)} width={14} height={14} fill={`url(#${pid(k)})`} />}
        </g>
      ))}
    </g>
  );
}
