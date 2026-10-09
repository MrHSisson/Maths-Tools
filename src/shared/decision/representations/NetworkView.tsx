import { useMemo } from "react";
import type { EdgeState, Network, NodeRole, SolveStep } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// NetworkView — a PURE, STATIC renderer of a weighted Network, optionally coloured by a
// single SolveStep's edgeStates. It generates nothing and never moves: a question's picture
// is a fixed, display-optimised drawing (see graphBank.ts). To move vertices or zoom, open
// the picture in the sandbox (SandboxBoard), which supplies `box` (a frame that stays put
// while vertices move) and `onNodeDown` (drag a vertex).
// ═══════════════════════════════════════════════════════════════════════════

const NODE_R = 22;

// Edge appearance keyed by its state this beat.
export const EDGE_STYLE: Record<EdgeState, { stroke: string; width: number; dash?: string; opacity: number }> = {
  idle: { stroke: "#94a3b8", width: 2.5, opacity: 1 },
  considering: { stroke: "#f59e0b", width: 4, opacity: 1 },
  tree: { stroke: "#16a34a", width: 4.5, opacity: 1 },
  rejected: { stroke: "#ef4444", width: 2.5, dash: "6 5", opacity: 0.55 },
  added: { stroke: "#7c3aed", width: 4.5, opacity: 1 },
};

// Vertex appearance keyed by its role this beat (none = plain white).
export const NODE_ROLE_STYLE: Record<NodeRole, { fill: string; stroke: string }> = {
  current: { fill: "#fef3c7", stroke: "#d97706" },
  visited: { fill: "#dcfce7", stroke: "#15803d" },
  deleted: { fill: "#e5e7eb", stroke: "#9ca3af" },
};

const WEIGHT_FILL: Record<EdgeState, string> = {
  idle: "#0f172a",
  considering: "#b45309",
  tree: "#15803d",
  rejected: "#b91c1c",
  added: "#6d28d9",
};

export interface NetworkViewProps {
  network: Network;
  /** Colour edges by this beat's states; omit for a plain idle network. */
  step?: SolveStep;
  directed?: boolean;
  showWeights?: boolean;
  /** Worksheet cell index — stamped as data-q-index for the (later) print path. */
  qIndex?: number;
  /** Background fill of the canvas. */
  background?: string;
  /** Frame the picture in this box instead of fitting the vertices (the sandbox keeps the frame fixed while a vertex is dragged). */
  box?: Box;
  /** Called when a vertex is pressed (sandbox only — a question's picture has no handler, so nothing in it can be moved). */
  onNodeDown?: (id: string, e: React.PointerEvent<SVGGElement>) => void;
  /** Called when a weight is clicked (the standalone sandbox lets a weight be edited; a question's weights are fixed). */
  onWeightClick?: (edgeId: string) => void;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The frame that fits a network's vertices with room for labels and badges. */
export function networkBox(network: Network): Box {
  const xs = network.nodes.map((n) => n.x);
  const ys = network.nodes.map((n) => n.y);
  const pad = NODE_R + 24;
  return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad - 14, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 + 14 };
}

export default function NetworkView({ network, step, directed = false, showWeights = true, qIndex, background = "#f8fafc", box, onNodeDown, onWeightClick }: NetworkViewProps) {
  const nodeById = useMemo(() => {
    const m: Record<string, { id: string; x: number; y: number }> = {};
    for (const n of network.nodes) m[n.id] = n;
    return m;
  }, [network.nodes]);
  const frame = useMemo(() => box ?? networkBox(network), [box, network]);
  const stateOf = (edgeId: string): EdgeState => step?.edgeStates[edgeId] ?? "idle";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: onNodeDown ? "visible" : "hidden", background }}>
      <svg
        viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
        style={{ display: "block", width: "100%", height: "100%", overflow: onNodeDown ? "visible" : undefined }}
        preserveAspectRatio="xMidYMid meet"
        {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
      >
        {directed && (
          <defs>
            <marker id="dm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
          </defs>
        )}

        {/* Edges */}
        {network.edges.map((e) => {
          const a = nodeById[e.from];
          const b = nodeById[e.to];
          if (!a || !b) return null;
          const st = stateOf(e.id);
          const sty = EDGE_STYLE[st];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = a.x + ux * NODE_R;
          const y1 = a.y + uy * NODE_R;
          const x2 = b.x - ux * NODE_R;
          const y2 = b.y - uy * NODE_R;
          const lt = e.labelAt ?? 0.5;
          const mx = a.x + dx * lt;
          const my = a.y + dy * lt;
          return (
            <g key={e.id} style={{ transition: "opacity 220ms" }} opacity={sty.opacity}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={sty.stroke}
                strokeWidth={sty.width}
                strokeLinecap="round"
                strokeDasharray={sty.dash}
                markerEnd={directed ? "url(#dm-arrow)" : undefined}
                style={{ transition: "stroke 220ms, stroke-width 220ms" }}
              />
              {showWeights && (
                <g onClick={onWeightClick ? () => onWeightClick(e.id) : undefined} onPointerDown={onWeightClick ? (ev) => ev.stopPropagation() : undefined} style={{ cursor: onWeightClick ? "pointer" : undefined }}>
                  <rect x={mx - 13} y={my - 12} width={26} height={22} rx={5} fill="#ffffff" stroke={onWeightClick ? "#93c5fd" : "#e2e8f0"} strokeWidth={1} />
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={WEIGHT_FILL[st]} style={{ transition: "fill 220ms" }}>
                    {e.weight}
                  </text>
                </g>
              )}
              {step?.edgeOrder?.[e.id] && (
                // the number this edge was chosen at, on the corner of its weight label
                <g style={{ pointerEvents: "none" }}>
                  <circle cx={mx + 15} cy={my - 15} r={10} fill="#15803d" stroke="#ffffff" strokeWidth={2} />
                  <text x={mx + 15} y={my - 15} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800} fill="#ffffff">
                    {step.edgeOrder[e.id]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {network.nodes.map((n) => {
          const annot = step?.nodeStates?.[n.id];
          const role = step?.nodeRoles?.[n.id];
          const ring = role ? NODE_ROLE_STYLE[role] : { fill: "#ffffff", stroke: "#1e3a8a" };
          return (
            <g key={n.id} onPointerDown={onNodeDown ? (ev) => onNodeDown(n.id, ev) : undefined} style={{ cursor: onNodeDown ? "move" : "default", touchAction: onNodeDown ? "none" : undefined }}>
              <circle cx={n.x} cy={n.y} r={NODE_R} fill={ring.fill} stroke={ring.stroke} strokeWidth={role === "current" ? 4 : 2.75} strokeDasharray={role === "deleted" ? "5 4" : undefined} style={{ transition: "fill 220ms, stroke 220ms" }} />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={800} fill={role === "deleted" ? "#6b7280" : "#1e3a8a"} style={{ userSelect: "none", pointerEvents: "none" }}>
                {n.label ?? n.id}
              </text>
              {annot && (
                // a solid badge on the vertex's top-right shoulder (visit order, labels…)
                <g style={{ pointerEvents: "none" }}>
                  <rect x={n.x + NODE_R * 0.55} y={n.y - NODE_R * 1.45} width={Math.max(22, annot.length * 9 + 12)} height={22} rx={11} fill="#1e3a8a" stroke="#ffffff" strokeWidth={2} />
                  <text x={n.x + NODE_R * 0.55 + Math.max(22, annot.length * 9 + 12) / 2} y={n.y - NODE_R * 1.45 + 11} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800} fill="#ffffff">
                    {annot}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
