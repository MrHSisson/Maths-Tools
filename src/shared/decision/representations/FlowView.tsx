import { useMemo } from "react";
import type { FlowArc, FlowMode, FlowNet, FlowProblemData, FlowViewState } from "../flow";
import { cutGeometry, flowBox } from "../cutCurve";
import { NODE_R, PILL_H, dist, layoutNetwork, type Shape } from "../flowGeometry";

// ═══════════════════════════════════════════════════════════════════════════
// FlowView — a PURE renderer of a flow network. Draws each arc with its bounds
// ("lo, hi", or just the capacity), the circled flow, potential increase / decrease
// labels, a highlighted augmenting path, a shaded cut (S side) with red ticks on the
// arcs that cross it, and the nodes the labelling procedure reached. It computes
// nothing: every number it shows is handed in (flow.ts is the single source).
// Static framed picture; `qIndex` stamps data-q-index for the print path.
// ═══════════════════════════════════════════════════════════════════════════

const NAVY = "#1e3a8a";
const FWD = "#2563eb"; // circled flow
const POT = "#0891b2"; // potentials — both arrows the same colour, as in the textbook (direction tells them apart)
const GREEN = "#16a34a";
const RED = "#dc2626";

export interface FlowViewProps {
  net: FlowNet;
  mode: FlowMode;
  view: FlowViewState;
  labelPos: FlowProblemData["labelPos"];
  qIndex?: number;
  background?: string;
}

export default function FlowView({ net, mode, view, labelPos, qIndex, background = "#ffffff" }: FlowViewProps) {
  const box = useMemo(() => flowBox(net), [net]);

  // The dashed cut line (and where it crosses each cut arc) — traced from the geometry, see cutCurve.ts.
  const cut = useMemo(
    () => (view.sSide ? cutGeometry(net, view.sSide, Object.keys(view.cutArcs ?? {}), box) : null),
    [view.sSide, view.cutArcs, net, box],
  );

  const pathIdx = new Map((view.path ?? []).map((s) => [s.arc, s.dir]));
  const sSide = new Set(view.sSide ?? []);
  const labelled = new Set(view.labelled ?? []);
  const focus = new Set(view.focus ?? []);

  const layout = useMemo(() => layoutNetwork(net, labelPos, mode), [net, labelPos, mode]);
  // the dashed cut line as segments, so its labels keep off it
  const cutSegs: Shape[] = (cut?.paths ?? []).flatMap((d) => {
    const pts = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    const out: Shape[] = [];
    for (let i = 2; i + 1 < pts.length; i += 2) out.push({ k: "seg", a: { x: pts[i - 2], y: pts[i - 1] }, b: { x: pts[i], y: pts[i + 1] }, w: 3.5 });
    return out;
  });
  const placedCutLabels: Shape[] = []; // cut labels already positioned this render, so they keep clear of each other
  const arcEl = (a: FlowArc) => {
    const g = layout.get(a.id)!;
    const { ux, uy } = g;
    const at = g.at;
    const dir = pathIdx.get(a.id);
    const crossing = view.cutArcs?.[a.id];
    const stroke = dir ? GREEN : focus.has(a.id) ? "#d97706" : "#64748b";
    const width = dir ? 5 : focus.has(a.id) ? 4 : 2.75;
    const { x: x1, y: y1 } = g.line.a;
    const { x: x2, y: y2 } = g.line.b;
    const bounds = g.boundsText;
    const lab = g.pill.c;
    const replaced = !!view.replaceWithPotentials && view.potentials?.[a.id] !== undefined; // the potentials stand in for flow + bounds
    const showBounds = !view.hideBounds && !replaced;
    const w = g.pill.w;
    const isUnknown = !!view.unknown?.includes(a.id);
    const isSolved = !!view.solved?.includes(a.id);
    const fl = replaced || isUnknown ? undefined : view.flow?.[a.id];
    const prev = view.prevFlow?.[a.id];
    const fp = g.flowC; // beside the arc, not on it
    // one arrow either side of the arc: the increase beside it (along), the decrease on the opposite side (against)
    const fwdA = g.inc;
    const bwdA = g.dec;
    const tick = cut?.ticks[a.id] ?? at(0.5);
    // the cut label sits on the side of the arc opposite the circled flow, so the two never meet
    let cnx = -uy;
    let cny = ux;
    if (cny > 0 || (cny === 0 && cnx < 0)) { cnx = -cnx; cny = -cny; }
    // Where the "+max / −min" cut label goes: beside the crossing, on whichever side and distance keeps it clear of every
    // other label, vertex and arc (and off the dashed line itself, which passes through the tick).
    let cutLab = { x: tick.x - cnx * 26, y: tick.y - cny * 26 };
    if (crossing && view.cutLabels) {
      const txt = crossing === "fwd" ? `+${a.hi}` : mode === "cap" ? "back" : `−${a.lo}`;
      const hw = 5.4 * txt.length + 4, hh = 11;
      const obstacles: Shape[] = [
        ...net.nodes.map((n): Shape => ({ k: "circle", c: { x: n.x, y: n.y }, r: NODE_R })),
        ...net.arcs.flatMap((x) => layout.get(x.id)!.shapes),
        ...net.arcs.filter((x) => x.id !== a.id).map((x): Shape => { const l = layout.get(x.id)!.line; return { k: "seg", a: l.a, b: l.b, w: 3 }; }),
        { k: "seg", a: g.line.a, b: g.line.b, w: 3 },
        ...placedCutLabels,
        ...cutSegs,
      ];
      let best = -Infinity;
      for (const side of [1, -1]) for (const d of [24, 32, 42, 54, 66]) for (const sh of [0, 16, -16, 32, -32, 48, -48]) {
        const c = { x: tick.x - cnx * d * side + ux * sh, y: tick.y - cny * d * side + uy * sh };
        const box: Shape = { k: "rect", x0: c.x - hw, y0: c.y - hh, x1: c.x + hw, y1: c.y + hh };
        // prefer the side opposite the circled flow, and staying close to the crossing
        const score = Math.min(8, Math.min(...obstacles.map((o) => dist(box, o)))) + (side === 1 ? 1 : 0) - d * 0.2 - Math.abs(sh) * 0.1; // clear by 8px is enough — then stay close to the crossing
        if (score > best) { best = score; cutLab = c; }
      }
      placedCutLabels.push({ k: "rect", x0: cutLab.x - hw, y0: cutLab.y - hh, x1: cutLab.x + hw, y1: cutLab.y + hh });
    }
    const fwdPot = view.potentials?.[a.id]?.fwd;
    const bwdPot = view.potentials?.[a.id]?.bwd;
    return (
      <g key={a.id}>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={width} strokeLinecap="round"
          strokeDasharray={dir === "back" ? "9 6" : undefined}
          markerEnd={dir ? "url(#fv-arrow-g)" : "url(#fv-arrow)"}
        />
        {/* bounds label */}
        {showBounds && <g>
          <rect x={lab.x - w / 2} y={lab.y - PILL_H / 2} width={w} height={PILL_H} rx={5} fill="#ffffff" stroke="#e2e8f0" />
          <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="#0f172a">{bounds}</text>
        </g>}
        {/* circled flow ("?" while missing, green when just found) */}
        {(fl !== undefined || isUnknown) && (
          <g>
            {prev !== undefined && fl !== undefined && prev !== fl && (
              <text x={fp.x} y={fp.y - 22} textAnchor="middle" fontSize={13} fontWeight={700} fill="#94a3b8" textDecoration="line-through">{prev}</text>
            )}
            <circle cx={fp.x} cy={fp.y} r={g.flowR} fill={isUnknown ? "#fffbeb" : "#ffffff"} stroke={isUnknown ? "#d97706" : dir || isSolved ? GREEN : FWD} strokeWidth={2.25} />
            <text x={fp.x} y={fp.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill={isUnknown ? "#d97706" : dir || isSolved ? GREEN : FWD}>{isUnknown ? "?" : fl}</text>
          </g>
        )}
        {/* potentials: forward arrow (with the arc) and backward arrow (against it), each with its number */}
        {fwdPot !== undefined && (
          <g>
            <line x1={fwdA.s0.x} y1={fwdA.s0.y} x2={fwdA.e0.x} y2={fwdA.e0.y} stroke={POT} strokeWidth={2.25} markerEnd="url(#fv-arrow-p)" />
            <text x={fwdA.num.x} y={fwdA.num.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={800} fill={POT}>{fwdPot}</text>
          </g>
        )}
        {bwdPot !== undefined && (
          <g>
            <line x1={bwdA.s0.x} y1={bwdA.s0.y} x2={bwdA.e0.x} y2={bwdA.e0.y} stroke={POT} strokeWidth={2.25} markerEnd="url(#fv-arrow-p)" />
            <text x={bwdA.num.x} y={bwdA.num.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={800} fill={POT}>{bwdPot}</text>
          </g>
        )}
        {/* the cut crosses this arc */}
        {crossing && (
          <g>
            {view.cutLabels && (
              <text x={cutLab.x} y={cutLab.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill={RED} stroke="#ffffff" strokeWidth={4} paintOrder="stroke">
                {crossing === "fwd" ? `+${a.hi}` : mode === "cap" ? "back" : `−${a.lo}`}
              </text>
            )}
          </g>
        )}
      </g>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", background, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        style={{ display: "block", width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid meet"
        {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
      >
        <defs>
          <marker id="fv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
          <marker id="fv-arrow-p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={POT} />
          </marker>
          <marker id="fv-arrow-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={GREEN} />
          </marker>
        </defs>
        {net.arcs.map(arcEl)}
        {cut?.paths.map((d, i) => <path key={i} d={d} fill="none" stroke={RED} strokeWidth={3.5} strokeDasharray="13 8" strokeLinecap="butt" strokeLinejoin="round" />)}
        {net.nodes.map((n) => {
          const fill = sSide.has(n.id) ? "#dbeafe" : labelled.has(n.id) ? "#dcfce7" : "#ffffff";
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={NODE_R} fill={fill} stroke={NAVY} strokeWidth={2.75} />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={800} fill={NAVY} style={{ userSelect: "none" }}>
                {n.label ?? n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
