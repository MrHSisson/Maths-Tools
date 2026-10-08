import { useMemo } from "react";
import type { FlowArc, FlowMode, FlowNet, FlowProblemData, FlowViewState } from "../flow";
import { NODE_R, cutGeometry, flowBox } from "../cutCurve";

// ═══════════════════════════════════════════════════════════════════════════
// FlowView — a PURE renderer of a flow network. Draws each arc with its bounds
// ("lo, hi", or just the capacity), the circled flow, forward / backward potential
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

const pillW = (s: string, size: number) => Math.max(size * 1.5, s.length * size * 0.62 + 10);

export default function FlowView({ net, mode, view, labelPos, qIndex, background = "#ffffff" }: FlowViewProps) {
  const byId = useMemo(() => Object.fromEntries(net.nodes.map((n) => [n.id, n])), [net]);
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

  const arcEl = (a: FlowArc) => {
    const p = byId[a.from];
    const q = byId[a.to];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const at = (t: number, off = 0) => {
      // a normal that points "up" the screen (or right, for a vertical arc) so beside-the-line labels stay on one side
      let nx = -uy;
      let ny = ux;
      if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
      return { x: p.x + dx * t + nx * off, y: p.y + dy * t + ny * off };
    };
    const dir = pathIdx.get(a.id);
    const crossing = view.cutArcs?.[a.id];
    const stroke = dir ? GREEN : focus.has(a.id) ? "#d97706" : "#64748b";
    const width = dir ? 5 : focus.has(a.id) ? 4 : 2.75;
    const lp = labelPos[a.id];
    const x1 = p.x + ux * NODE_R;
    const y1 = p.y + uy * NODE_R;
    const x2 = q.x - ux * (NODE_R + 2);
    const y2 = q.y - uy * (NODE_R + 2);
    const bounds = mode === "cap" ? `${a.hi}` : `${a.lo}, ${a.hi}`;
    const lab = at(lp.label);
    const showBounds = !view.hideBounds;
    const w = pillW(bounds, 17);
    const fl = view.flow?.[a.id];
    const prev = view.prevFlow?.[a.id];
    const fp = at(lp.flow[0], 19 * lp.flow[1]); // beside the arc, not on it
    // potentials: two small parallel arrows on the far side of the arc — one along it, one against it
    const pc = (off: number) => at(lp.pot[0], lp.pot[1] * off);
    const arrowAt = (off: number, dirSign: 1 | -1) => {
      const c = pc(off);
      const s0 = { x: c.x - ux * 11 * dirSign, y: c.y - uy * 11 * dirSign };
      const e0 = { x: c.x + ux * 13 * dirSign, y: c.y + uy * 13 * dirSign };
      const num = { x: c.x + ux * 25 * dirSign, y: c.y + uy * 25 * dirSign }; // beyond the arrowhead
      return { s0, e0, num, dirSign };
    };
    const fwdA = arrowAt(23, 1);
    const bwdA = arrowAt(39, -1);
    const tick = cut?.ticks[a.id] ?? at(0.5);
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
          <rect x={lab.x - w / 2} y={lab.y - 12} width={w} height={24} rx={5} fill="#ffffff" stroke="#e2e8f0" />
          <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="#0f172a">{bounds}</text>
        </g>}
        {/* circled flow */}
        {fl !== undefined && (
          <g>
            {prev !== undefined && prev !== fl && (
              <text x={fp.x} y={fp.y - 22} textAnchor="middle" fontSize={13} fontWeight={700} fill="#94a3b8" textDecoration="line-through">{prev}</text>
            )}
            <circle cx={fp.x} cy={fp.y} r={16} fill="#ffffff" stroke={dir ? GREEN : FWD} strokeWidth={2.25} />
            <text x={fp.x} y={fp.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill={dir ? GREEN : FWD}>{fl}</text>
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
            <line x1={tick.x - uy * 15} y1={tick.y + ux * 15} x2={tick.x + uy * 15} y2={tick.y - ux * 15} stroke={RED} strokeWidth={4} strokeLinecap="round" />
            {view.cutLabels && (
              <text x={tick.x} y={tick.y - 22} textAnchor="middle" fontSize={15} fontWeight={800} fill={RED} stroke="#ffffff" strokeWidth={4} paintOrder="stroke">
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
