import { useMemo } from "react";
import type { FlowArc, FlowMode, FlowNet, FlowProblemData, FlowViewState } from "../flow";

// ═══════════════════════════════════════════════════════════════════════════
// FlowView — a PURE renderer of a flow network. Draws each arc with its bounds
// ("lo, hi", or just the capacity), the circled flow, forward / backward potential
// labels, a highlighted augmenting path, a shaded cut (S side) with red ticks on the
// arcs that cross it, and the nodes the labelling procedure reached. It computes
// nothing: every number it shows is handed in (flow.ts is the single source).
// Static framed picture; `qIndex` stamps data-q-index for the print path.
// ═══════════════════════════════════════════════════════════════════════════

const NODE_R = 22;
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
  const box = useMemo(() => {
    const xs = net.nodes.map((n) => n.x);
    const ys = net.nodes.map((n) => n.y);
    const pad = NODE_R + 34;
    return {
      x: Math.min(...xs) - pad, y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    };
  }, [net]);

  // The dotted cut line: a smooth curve through the midpoints of the arcs the cut crosses, running
  // top to bottom. Drawn ONLY when every vertex lies on its correct side of it, so an unusual cut
  // (one that loops round a vertex) falls back to the red ticks alone rather than misleading.
  const cutCurve = useMemo(() => {
    const ids = Object.keys(view.cutArcs ?? {});
    if (ids.length === 0 || !view.sSide) return null;
    const raw = ids.map((id) => {
      const a = net.arcs.find((x) => x.id === id)!;
      const p = byId[a.from];
      const q = byId[a.to];
      return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    }).sort((u, v) => u.y - v.y || u.x - v.x);
    const pts = raw.filter((pt, i) => i === 0 || Math.hypot(pt.x - raw[i - 1].x, pt.y - raw[i - 1].y) > 6);
    const top = { x: pts[0].x, y: box.y };
    const bottom = { x: pts[pts.length - 1].x, y: box.y + box.h };
    const all = [top, ...pts, bottom];
    const xAt = (y: number) => {
      for (let i = 0; i < all.length - 1; i++) {
        const a = all[i];
        const b = all[i + 1];
        if (y >= a.y && y <= b.y) return b.y === a.y ? Math.min(a.x, b.x) : a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
      }
      return all[all.length - 1].x;
    };
    const sSet = new Set(view.sSide);
    const ok = net.nodes.every((n) => (n.x < xAt(n.y)) === sSet.has(n.id));
    if (!ok) return null;
    let d = `M ${all[0].x} ${all[0].y}`;
    for (let i = 1; i < all.length - 1; i++) {
      const mx = (all[i].x + all[i + 1].x) / 2;
      const my = (all[i].y + all[i + 1].y) / 2;
      d += ` Q ${all[i].x} ${all[i].y} ${mx} ${my}`;
    }
    d += ` L ${all[all.length - 1].x} ${all[all.length - 1].y}`;
    return d;
  }, [view.cutArcs, view.sSide, net, byId, box]);

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
    const w = pillW(bounds, 15);
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
    const tick = at(0.5);
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
          <rect x={lab.x - w / 2} y={lab.y - 11} width={w} height={22} rx={5} fill="#ffffff" stroke="#e2e8f0" />
          <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="#0f172a">{bounds}</text>
        </g>}
        {/* circled flow */}
        {fl !== undefined && (
          <g>
            {prev !== undefined && prev !== fl && (
              <text x={fp.x} y={fp.y - 22} textAnchor="middle" fontSize={13} fontWeight={700} fill="#94a3b8" textDecoration="line-through">{prev}</text>
            )}
            <circle cx={fp.x} cy={fp.y} r={14} fill="#ffffff" stroke={dir ? GREEN : FWD} strokeWidth={2.25} />
            <text x={fp.x} y={fp.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={800} fill={dir ? GREEN : FWD}>{fl}</text>
          </g>
        )}
        {/* potentials: forward arrow (with the arc) and backward arrow (against it), each with its number */}
        {fwdPot !== undefined && (
          <g>
            <line x1={fwdA.s0.x} y1={fwdA.s0.y} x2={fwdA.e0.x} y2={fwdA.e0.y} stroke={POT} strokeWidth={2} markerEnd="url(#fv-arrow-p)" />
            <text x={fwdA.num.x} y={fwdA.num.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={800} fill={POT}>{fwdPot}</text>
          </g>
        )}
        {bwdPot !== undefined && (
          <g>
            <line x1={bwdA.s0.x} y1={bwdA.s0.y} x2={bwdA.e0.x} y2={bwdA.e0.y} stroke={POT} strokeWidth={2} markerEnd="url(#fv-arrow-p)" />
            <text x={bwdA.num.x} y={bwdA.num.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={800} fill={POT}>{bwdPot}</text>
          </g>
        )}
        {/* the cut crosses this arc */}
        {crossing && (
          <g>
            <line x1={tick.x - uy * 15} y1={tick.y + ux * 15} x2={tick.x + uy * 15} y2={tick.y - ux * 15} stroke={RED} strokeWidth={4} strokeLinecap="round" />
            {view.cutLabels && (
              <text x={tick.x} y={tick.y - 22} textAnchor="middle" fontSize={13} fontWeight={800} fill={RED}>
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
        {cutCurve && <path d={cutCurve} fill="none" stroke={RED} strokeWidth={3.5} strokeDasharray="1 8" strokeLinecap="round" />}
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
