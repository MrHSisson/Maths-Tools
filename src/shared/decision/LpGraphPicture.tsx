import { useId } from "react";
import { type Fr } from "./dim";
import { type GLine, type Objective, type Pt, hasInterior, isEnclosed, isStrictLine, regionVertices, toNum } from "./lpGraph";
import { type GWin, constraintText, fmtPt, graphWindow, lineSegment, regionPolygon, unwantedPolygon, type XY } from "./lpGraphView";

// The region picture of the Graphical LP tool (specs/linear-programming-graphical.md, section 4). It is a coordinate graph of lines, half-planes and points, which none
// of the eight core representations can show (docs/reference/pictures.md), so it is its own picture: axes with whole-number ticks, each boundary drawn continuous (or
// dotted when strict) and marked with a letter, its constraint written in a key below the graph, the unwanted side of each line in translucent grey, so what several lines rule out is darker (shade out), or the region tinted (shade in), R inside an enclosed
// region, corner points with their coordinates, the sliding objective lines and the whole-number points. The stepper reveals it a piece at a time, and the window
// is worked out from the whole problem, so the picture never changes size as it fills (R32). It is one <svg> with data-q-index (R31) and no fixed pixel height.

export interface GraphView {
  lines: readonly GLine[];
  /** how many lines are drawn so far (all by default) */
  drawn?: number;
  /** how many of them have their shading (the same as `drawn` by default); 0 for none */
  shaded?: number;
  shading?: "out" | "in";
  /** write R in the region (only an enclosed region has one) */
  region?: boolean;
  vertices?: readonly Pt[];
  /** the sliding objective: dashed lines at these values, and an arrow towards increasing value */
  objective?: { o: Objective; ks: readonly Fr[]; arrow?: boolean; label?: string };
  /** whole-number points in the region, the best one ringed, the four around the optimum ringed apart */
  lattice?: { pts: readonly Pt[]; best?: readonly Pt[]; around?: readonly Pt[] };
  /** one point picked out (the optimum) */
  mark?: Pt;
  grid?: boolean;
  /** corner coordinates: shown when the point is hovered, tapped or focused (the default), or always (print, and a step that is about them) */
  labels?: "hover" | "always";
  /** pass the same window to every step of a question; by default it is worked out from the lines */
  win?: GWin;
}

const W = 520, PLOT_H = 420, ML = 40, MR = 16, MT = 14, MB = 36;
const PW = W - ML - MR, PH = PLOT_H - MT - MB;
const KEY_ROW = 26;
const LETTERS = "ABCDEF";
const INK = "#0f172a", MUTED = "#64748b", GRIDC = "#f1f5f9", OBJ = "#1d4ed8", BEST = "#b91c1c";
const LINE_COLOURS = ["#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1"];

export default function LpGraphPicture({ view, qIndex }: { view: GraphView; qIndex?: number }) {
  const uid = useId().replace(/:/g, "");
  const { lines } = view;
  const drawn = view.drawn ?? lines.length;
  const shaded = view.shaded ?? drawn;
  const win = view.win ?? graphWindow(lines, view.vertices ?? []);
  const X = (x: number) => ML + (x / win.xMax) * PW;
  const Y = (y: number) => MT + PH - (y / win.yMax) * PH;
  const path = (poly: readonly XY[]) => poly.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ") + "Z";
  const ticks = (m: number) => Array.from({ length: Math.floor(m / win.step) + 1 }, (_, i) => i * win.step);
  const enclosed = isEnclosed(lines) && hasInterior(lines);
  const drawnLines = lines.slice(0, drawn);
  const regionVs = regionVertices(lines);
  const cx = regionVs.length ? regionVs.reduce((s, v) => s + toNum(v[0]), 0) / regionVs.length : 0;
  const cy = regionVs.length ? regionVs.reduce((s, v) => s + toNum(v[1]), 0) / regionVs.length : 0;
  const dot = (p: Pt) => [X(toNum(p[0])), Y(toNum(p[1]))] as const;
  // the key below the graph has a row for every line of the problem (and the objective), so its height, and the picture's, is the same at every step
  const keyRows = Math.ceil(lines.length / 2) + (view.objective?.label ? 1 : 0);
  const H = PLOT_H + keyRows * KEY_ROW + 6;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Graph of the constraints and the feasible region"
      style={{ display: "block", width: "100%", height: "auto", maxHeight: "min(62vh, 640px)" }}
      preserveAspectRatio="xMidYMid meet"
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      <defs>
        <style>{`.v${uid} .vl{opacity:0;transition:opacity .12s}.v${uid}:hover .vl,.v${uid}:focus .vl,.v${uid}:active .vl{opacity:1}.v${uid}{outline:none;cursor:default}`}</style>
        <marker id={`arrow${uid}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill={OBJ} /></marker>
        <clipPath id={`clip${uid}`}><rect x={ML} y={MT} width={PW} height={PH} /></clipPath>
      </defs>
      <rect x={ML} y={MT} width={PW} height={PH} fill="#ffffff" />
      {view.grid !== false && (
        <g stroke={GRIDC} strokeWidth="1">
          {ticks(win.xMax).slice(1).map((t) => <line key={`gx${t}`} x1={X(t)} y1={MT} x2={X(t)} y2={MT + PH} />)}
          {ticks(win.yMax).slice(1).map((t) => <line key={`gy${t}`} x1={ML} y1={Y(t)} x2={ML + PW} y2={Y(t)} />)}
        </g>
      )}
      <g clipPath={`url(#clip${uid})`}>
        {view.shading === "in" && shaded > 0 && <path d={path(regionPolygon(lines.slice(0, shaded), win))} fill="#bfdbfe" fillOpacity="0.55" />}
        {view.shading !== "in" && lines.slice(0, shaded).map((l, i) => <path key={i} d={path(unwantedPolygon(l, win))} fill="#64748b" fillOpacity="0.2" data-shade-out="" />)}
      </g>
      {/* axes and ticks */}
      <g stroke={INK} strokeWidth="1.6">
        <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} /><line x1={ML} y1={MT} x2={ML} y2={MT + PH} />
      </g>
      <g fontSize="14" fill={MUTED} fontFamily="system-ui, sans-serif">
        {ticks(win.xMax).map((t) => <g key={`tx${t}`}><line x1={X(t)} y1={MT + PH} x2={X(t)} y2={MT + PH + 5} stroke={INK} /><text x={X(t)} y={MT + PH + 19} textAnchor="middle">{t}</text></g>)}
        {ticks(win.yMax).map((t) => <g key={`ty${t}`}><line x1={ML - 5} y1={Y(t)} x2={ML} y2={Y(t)} stroke={INK} /><text x={ML - 9} y={Y(t) + 4} textAnchor="end">{t}</text></g>)}
        <text x={ML + PW} y={MT + PH + 33} textAnchor="end" fontSize="17" fill={INK} fontStyle="italic">x</text>
        <text x={ML - 30} y={MT + 14} fontSize="17" fill={INK} fontStyle="italic">y</text>
      </g>
      {/* boundary lines */}
      <g clipPath={`url(#clip${uid})`} fill="none" strokeWidth="2.4">
        {drawnLines.map((l, i) => {
          const seg = lineSegment(l, win);
          if (!seg) return null;
          return <line key={i} x1={X(seg[0][0])} y1={Y(seg[0][1])} x2={X(seg[1][0])} y2={Y(seg[1][1])} stroke={LINE_COLOURS[i % LINE_COLOURS.length]} strokeDasharray={isStrictLine(l) ? "3 6" : undefined} strokeLinecap="round" data-line={i} data-dotted={isStrictLine(l) ? "" : undefined} />;
        })}
        {view.objective && view.objective.ks.map((k, i) => {
          const o = view.objective!.o;
          const seg = lineSegment({ a: o.p, b: o.q, c: toNum(k) }, win);
          return seg ? <line key={`o${i}`} x1={X(seg[0][0])} y1={Y(seg[0][1])} x2={X(seg[1][0])} y2={Y(seg[1][1])} stroke={OBJ} strokeWidth="2" strokeDasharray="9 6" data-objective={i} /> : null;
        })}
      </g>
      {/* a letter at the end of each line, and the key below the graph */}
      <g fontSize="15" fontFamily="system-ui, sans-serif" fontWeight="700">
        {drawnLines.map((l, i) => {
          const seg = lineSegment(l, win);
          if (!seg) return null;
          // the end that is higher up (the right-hand one for a horizontal line): clear of the corner labels on the x-axis
          const p = seg[0][1] !== seg[1][1] ? (seg[0][1] > seg[1][1] ? seg[0] : seg[1]) : seg[0][0] > seg[1][0] ? seg[0] : seg[1];
          const atRight = p[0] >= win.xMax - 1e-9, atTop = p[1] >= win.yMax - 1e-9;
          const x = atRight ? X(p[0]) - 12 : atTop ? X(p[0]) + 12 : X(p[0]) + 12;
          const y = atTop ? Y(p[1]) + 18 : Y(p[1]) - 6;
          return <text key={i} x={x} y={y} textAnchor="middle" fill={LINE_COLOURS[i % LINE_COLOURS.length]} stroke="#fff" strokeWidth="3" paintOrder="stroke">{LETTERS[i]}</text>;
        })}
      </g>
      <g fontSize="16" fontFamily="system-ui, sans-serif" data-key="">
        {lines.map((l, i) => {
          if (i >= drawn) return null;
          const col = i % 2, row = Math.floor(i / 2);
          const x = ML + col * (PW / 2), y = PLOT_H + row * KEY_ROW + 18;
          return (
            <g key={i}>
              <line x1={x} y1={y - 5} x2={x + 26} y2={y - 5} stroke={LINE_COLOURS[i % LINE_COLOURS.length]} strokeWidth="2.6" strokeDasharray={isStrictLine(l) ? "3 6" : undefined} strokeLinecap="round" />
              <text x={x + 34} y={y} fill={INK}><tspan fontWeight="700" fill={LINE_COLOURS[i % LINE_COLOURS.length]}>{LETTERS[i]}</tspan>{"  "}{constraintText(l)}</text>
            </g>
          );
        })}
        {view.objective?.label && <text x={ML} y={PLOT_H + Math.ceil(lines.length / 2) * KEY_ROW + 18} fill={OBJ}>{view.objective.label}</text>}
      </g>
      {/* the arrow of increasing objective value */}
      {view.objective?.arrow && (() => {
        const o = view.objective.o;
        const mx = win.xMax * 0.5, my = win.yMax * 0.5;
        // along (p/xMax, q/yMax) in picture terms
        const s = o.sense === "min" ? -1 : 1; // the arrow points the way the objective gets better: smaller when minimising
        const dx = s * (o.p / win.xMax) * PW, dy = -s * (o.q / win.yMax) * PH;
        const len = Math.hypot(dx, dy) || 1;
        const sx = X(mx), sy = Y(my), L = 46;
        return <line x1={sx} y1={sy} x2={sx + (dx / len) * L} y2={sy + (dy / len) * L} stroke={OBJ} strokeWidth="2.4" markerEnd={`url(#arrow${uid})`} data-arrow="" />;
      })()}
      {/* R */}
      {view.region && enclosed && <text x={X(cx)} y={Y(cy) + 7} textAnchor="middle" fontSize="26" fontWeight="700" fill={INK} fontFamily="Georgia, serif" data-r="">R</text>}
      {/* whole-number points */}
      {view.lattice && (
        <g>
          {view.lattice.pts.map((p, i) => <circle key={i} cx={dot(p)[0]} cy={dot(p)[1]} r="2.4" fill="#94a3b8" />)}
          {view.lattice.around?.map((p, i) => <circle key={`a${i}`} cx={dot(p)[0]} cy={dot(p)[1]} r="8" fill="none" stroke={OBJ} strokeWidth="1.8" />)}
          {view.lattice.best?.map((p, i) => <circle key={`b${i}`} cx={dot(p)[0]} cy={dot(p)[1]} r="9" fill="none" stroke={BEST} strokeWidth="2.6" data-best="" />)}
        </g>
      )}
      {/* corner points */}
      {view.vertices && (
        <g fontSize="14" fontFamily="system-ui, sans-serif" fill={INK}>
          {view.vertices.map((v, i) => {
            const [px, py] = dot(v);
            const left = px > ML + PW * 0.7;
            const always = view.labels === "always";
            return (
              <g key={i} data-vertex="" className={always ? undefined : `v${uid}`} tabIndex={always ? undefined : 0}>
                <title>{fmtPt(v)}</title>
                {!always && <circle cx={px} cy={py} r="16" fill="transparent" />}
                <circle cx={px} cy={py} r="4.5" fill={INK} />
                <text className={always ? undefined : "vl"} x={left ? px - 8 : px + 8} y={py - 8} textAnchor={left ? "end" : "start"} stroke="#fff" strokeWidth="3" paintOrder="stroke">{fmtPt(v)}</text>
              </g>
            );
          })}
        </g>
      )}
      {view.mark && <circle cx={dot(view.mark)[0]} cy={dot(view.mark)[1]} r="9" fill="none" stroke={BEST} strokeWidth="2.6" />}
    </svg>
  );
}
