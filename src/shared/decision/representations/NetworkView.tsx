import { useEffect, useMemo, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { EdgeState, Network, SolveStep } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// NetworkView — a PURE renderer of a weighted Network, optionally coloured by a
// single SolveStep's edgeStates. Seeded from the NetworkSandbox spike (SVG node/
// edge/weight styling, pan/zoom/drag). It generates nothing: give it a network
// and (optionally) a step and it draws that state. Embeddable inline in the shell.
// ═══════════════════════════════════════════════════════════════════════════

const NODE_R = 22;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Edge appearance keyed by its state this beat.
const EDGE_STYLE: Record<EdgeState, { stroke: string; width: number; dash?: string; opacity: number }> = {
  idle: { stroke: "#94a3b8", width: 2.5, opacity: 1 },
  considering: { stroke: "#f59e0b", width: 4, opacity: 1 },
  tree: { stroke: "#16a34a", width: 4.5, opacity: 1 },
  rejected: { stroke: "#ef4444", width: 2.5, dash: "6 5", opacity: 0.55 },
};

const WEIGHT_FILL: Record<EdgeState, string> = {
  idle: "#0f172a",
  considering: "#b45309",
  tree: "#15803d",
  rejected: "#b91c1c",
};

export interface NetworkViewProps {
  network: Network;
  /** Colour edges by this beat's states; omit for a plain idle network. */
  step?: SolveStep;
  directed?: boolean;
  showWeights?: boolean;
  /** Enable pan / zoom / drag-to-tidy. Off = a static, framed picture. */
  interactive?: boolean;
  /** Worksheet cell index — stamped as data-q-index for the (later) print path. */
  qIndex?: number;
  /** Background fill of the canvas. */
  background?: string;
}

export default function NetworkView({
  network,
  step,
  directed = false,
  showWeights = true,
  interactive = false,
  qIndex,
  background = "#f8fafc",
}: NetworkViewProps) {
  // Node positions live in local state so nodes are draggable when interactive.
  // Reset whenever the network identity changes (new question / template sample).
  const netKey = useMemo(
    () => network.nodes.map((n) => n.id).join(",") + "|" + network.edges.map((e) => e.id).join(","),
    [network],
  );
  const [nodes, setNodes] = useState(() => network.nodes.map((n) => ({ ...n })));
  useEffect(() => {
    setNodes(network.nodes.map((n) => ({ ...n })));
  }, [netKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const nodeById = useMemo(() => {
    const m: Record<string, { id: string; x: number; y: number }> = {};
    for (const n of nodes) m[n.id] = n;
    return m;
  }, [nodes]);

  // Frame the graph so the whole thing is centred regardless of authored coords.
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, w: 100, h: 100 };
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const pad = NODE_R + 24;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    return {
      minX,
      minY,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    };
  }, [nodes]);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const boardRef = useRef<HTMLDivElement>(null);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setScale(1);
  };
  useEffect(() => {
    resetView();
  }, [netKey]);

  // ── Pan (drag empty board) / node drag — snapshot refs into locals in updaters ──
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const toLogical = (clientX: number, clientY: number) => {
    const rect = boardRef.current!.getBoundingClientRect();
    // screen → viewBox: account for the fitted viewBox scale (bounds.w / rect.width)
    const vbScale = bounds.w / rect.width;
    const sx = (clientX - rect.left - pan.x) / scale;
    const sy = (clientY - rect.top - pan.y) / scale;
    return { x: bounds.minX + sx * vbScale, y: bounds.minY + sy * vbScale };
  };

  const onBoardPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onBoardPointerMove = (e: React.PointerEvent) => {
    if (!interactive) return;
    const drag = dragRef.current;
    if (drag) {
      const p = toLogical(e.clientX, e.clientY);
      setNodes((ns) => ns.map((n) => (n.id === drag.id ? { ...n, x: p.x - drag.dx, y: p.y - drag.dy } : n)));
      return;
    }
    const p = panRef.current;
    if (p) setPan({ x: p.px + (e.clientX - p.sx), y: p.py + (e.clientY - p.sy) });
  };
  const onBoardPointerUp = (e: React.PointerEvent) => {
    panRef.current = null;
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };
  const onNodePointerDown = (e: React.PointerEvent, n: { id: string; x: number; y: number }) => {
    if (!interactive) return;
    e.stopPropagation();
    const p = toLogical(e.clientX, e.clientY);
    dragRef.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    const rect = boardRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setScale((prev) => {
      const next = clamp(prev * factor, 0.5, 3);
      setPan((p) => ({ x: cx - (cx - p.x) * (next / prev), y: cy - (cy - p.y) * (next / prev) }));
      return next;
    });
  };
  const zoomBtn = (dir: 1 | -1) => setScale((prev) => clamp(prev * (dir > 0 ? 1.15 : 1 / 1.15), 0.5, 3));

  const stateOf = (edgeId: string): EdgeState => step?.edgeStates[edgeId] ?? "idle";

  return (
    <div ref={boardRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background }}>
      <div
        onPointerDown={onBoardPointerDown}
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onWheel={onWheel}
        style={{
          position: "absolute",
          inset: 0,
          touchAction: "none",
          cursor: interactive ? (panRef.current ? "grabbing" : "grab") : "default",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
            style={{ display: "block", width: "100%", height: "100%" }}
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
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
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
                    <g>
                      <rect x={mx - 13} y={my - 12} width={26} height={22} rx={5} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} />
                      <text
                        x={mx}
                        y={my}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={15}
                        fontWeight={700}
                        fill={WEIGHT_FILL[st]}
                        style={{ transition: "fill 220ms" }}
                      >
                        {e.weight}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const annot = step?.nodeStates?.[n.id];
              return (
                <g key={n.id} onPointerDown={(ev) => onNodePointerDown(ev, n)} style={{ cursor: interactive ? "move" : "default" }}>
                  <circle cx={n.x} cy={n.y} r={NODE_R} fill="#ffffff" stroke="#1e3a8a" strokeWidth={2.75} />
                  <text
                    x={n.x}
                    y={n.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={18}
                    fontWeight={800}
                    fill="#1e3a8a"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {n.label ?? n.id}
                  </text>
                  {annot && (
                    <text x={n.x + NODE_R + 4} y={n.y - NODE_R} textAnchor="start" fontSize={13} fontWeight={700} fill="#0f766e" style={{ pointerEvents: "none" }}>
                      {annot}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {interactive && (
        <div style={{ position: "absolute", right: 12, bottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <IconBtn onClick={() => zoomBtn(1)} title="Zoom in"><ZoomIn size={18} /></IconBtn>
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748b" }}>{Math.round(scale * 100)}%</div>
          <IconBtn onClick={() => zoomBtn(-1)} title="Zoom out"><ZoomOut size={18} /></IconBtn>
          <IconBtn onClick={resetView} title="Reset view"><Maximize2 size={18} /></IconBtn>
        </div>
      )}
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
        color: "#334155",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
