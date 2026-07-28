import { useState, useRef, useCallback, useMemo } from "react";
import {
  Home, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  Table, Hash, MoveRight, Circle,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// Network Sandbox — an exploratory workspace for Decision Mathematics.
//
// This is NOT a finished tool and NOT built on ToolShell. It is a deliberate
// spike: a full-screen, pannable/zoomable canvas (borrowing the workspace
// chrome from AlgebraTiles) that simply *renders a weighted network* well — so
// we can judge node/edge/weight styling, the matrix view, spacing and layout
// before committing to a "DecisionShell" architecture.
//
// Everything is local state, no shared shell. Data model is the thing to look
// at: a network is { nodes, edges } — a structure, not a KaTeX string. That is
// the whole reason ToolShell is the wrong home for this family of problems.
// ═══════════════════════════════════════════════════════════════════════════

// ── Data model ──────────────────────────────────────────────────────────────

interface GNode {
  id: string;
  x: number; // logical board coordinates
  y: number;
}

interface GEdge {
  from: string;
  to: string;
  weight: number;
}

interface Network {
  name: string;
  nodes: GNode[];
  edges: GEdge[];
}

// ── Sample networks (classic AQA-style weighted graphs) ─────────────────────

const SAMPLES: Network[] = [
  {
    name: "Network A",
    nodes: [
      { id: "A", x: 140, y: 120 },
      { id: "B", x: 360, y: 90 },
      { id: "C", x: 560, y: 150 },
      { id: "D", x: 170, y: 360 },
      { id: "E", x: 400, y: 360 },
      { id: "F", x: 600, y: 380 },
    ],
    edges: [
      { from: "A", to: "B", weight: 4 },
      { from: "A", to: "D", weight: 8 },
      { from: "B", to: "C", weight: 6 },
      { from: "B", to: "D", weight: 5 },
      { from: "B", to: "E", weight: 7 },
      { from: "C", to: "E", weight: 3 },
      { from: "C", to: "F", weight: 9 },
      { from: "D", to: "E", weight: 6 },
      { from: "E", to: "F", weight: 5 },
    ],
  },
  {
    name: "Network B",
    nodes: [
      { id: "S", x: 110, y: 250 },
      { id: "A", x: 300, y: 110 },
      { id: "B", x: 300, y: 390 },
      { id: "C", x: 500, y: 110 },
      { id: "D", x: 500, y: 390 },
      { id: "E", x: 680, y: 180 },
      { id: "T", x: 690, y: 340 },
    ],
    edges: [
      { from: "S", to: "A", weight: 7 },
      { from: "S", to: "B", weight: 9 },
      { from: "A", to: "B", weight: 3 },
      { from: "A", to: "C", weight: 5 },
      { from: "B", to: "D", weight: 8 },
      { from: "C", to: "D", weight: 4 },
      { from: "C", to: "E", weight: 6 },
      { from: "D", to: "T", weight: 5 },
      { from: "E", to: "T", weight: 2 },
      { from: "D", to: "E", weight: 4 },
    ],
  },
];

// ── Geometry helpers ────────────────────────────────────────────────────────

const NODE_R = 22;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Start panned clear of the top-left matrix panel so the whole graph is visible.
const DEFAULT_PAN = { x: 170, y: 40 };

// ── Component ───────────────────────────────────────────────────────────────

export default function App() {
  const [sampleIdx, setSampleIdx] = useState(0);
  // Node positions live in state so nodes are draggable; reset restores the sample.
  const [nodes, setNodes] = useState<GNode[]>(() => SAMPLES[0].nodes.map(n => ({ ...n })));
  const edges = SAMPLES[sampleIdx].edges;

  const [showWeights, setShowWeights] = useState(true);
  const [showMatrix, setShowMatrix] = useState(true);
  const [directed, setDirected] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const [pan, setPan] = useState(DEFAULT_PAN);
  const [scale, setScale] = useState(1);

  const boardRef = useRef<HTMLDivElement>(null);

  const loadSample = (i: number) => {
    setSampleIdx(i);
    setNodes(SAMPLES[i].nodes.map(n => ({ ...n })));
    resetView();
  };

  const resetLayout = () => setNodes(SAMPLES[sampleIdx].nodes.map(n => ({ ...n })));
  const resetView = () => { setPan(DEFAULT_PAN); setScale(1); };

  const nodeById = useMemo(() => {
    const m: Record<string, GNode> = {};
    for (const n of nodes) m[n.id] = n;
    return m;
  }, [nodes]);

  // ── Pan (drag empty board) ────────────────────────────────────────────────
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const onBoardPointerDown = (e: React.PointerEvent) => {
    panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onBoardPointerMove = (e: React.PointerEvent) => {
    // Snapshot the refs into locals: the setNodes/setPan updaters can run after
    // onBoardPointerUp has nulled them, so never deref the ref inside an updater.
    const drag = dragRef.current;
    if (drag && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const lx = (e.clientX - rect.left - pan.x) / scale;
      const ly = (e.clientY - rect.top - pan.y) / scale;
      setNodes(ns => ns.map(n => n.id === drag.id
        ? { ...n, x: lx - drag.dx, y: ly - drag.dy }
        : n));
      return;
    }
    const p = panRef.current;
    if (p) {
      setPan({
        x: p.px + (e.clientX - p.sx),
        y: p.py + (e.clientY - p.sy),
      });
    }
  };
  const onBoardPointerUp = (e: React.PointerEvent) => {
    panRef.current = null;
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  // ── Node drag ─────────────────────────────────────────────────────────────
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const onNodePointerDown = (e: React.PointerEvent, n: GNode) => {
    e.stopPropagation();
    const rect = boardRef.current!.getBoundingClientRect();
    const lx = (e.clientX - rect.left - pan.x) / scale;
    const ly = (e.clientY - rect.top - pan.y) / scale;
    dragRef.current = { id: n.id, dx: lx - n.x, dy: ly - n.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  // ── Zoom (wheel toward cursor) ────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    const rect = boardRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setScale(prev => {
      const next = clamp(prev * factor, 0.4, 3);
      setPan(p => ({
        x: cx - (cx - p.x) * (next / prev),
        y: cy - (cy - p.y) * (next / prev),
      }));
      return next;
    });
  }, []);

  const zoomBtn = (dir: 1 | -1) => {
    setScale(prev => clamp(prev * (dir > 0 ? 1.15 : 1 / 1.15), 0.4, 3));
  };

  // ── Distance matrix (from edges) ──────────────────────────────────────────
  const ids = useMemo(() => nodes.map(n => n.id).sort(), [nodes]);
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number | null>> = {};
    for (const a of ids) { m[a] = {}; for (const b of ids) m[a][b] = null; }
    for (const e of edges) {
      m[e.from][e.to] = e.weight;
      if (!directed) m[e.to][e.from] = e.weight;
    }
    return m;
  }, [ids, edges, directed]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="bg-blue-900 shadow-lg flex-shrink-0">
        <div className="px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
            <Home size={22} color="#fff" /><span className="text-white font-semibold text-lg">Home</span>
          </button>
          <div className="text-white font-bold text-lg tracking-wide">Network Sandbox</div>
          <div style={{ width: 90 }} />
        </div>
      </div>

      {/* Main: side panel + board */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Side panel */}
        <div style={{
          background: "#f5f3f0", flexShrink: 0, width: 200, overflow: "auto",
          display: "flex", flexDirection: "column", padding: 14, gap: 14,
          borderRight: "2px solid #d1d5db",
        }}>
          <PanelLabel>Network</PanelLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SAMPLES.map((s, i) => (
              <PanelBtn key={s.name} active={i === sampleIdx} onClick={() => loadSample(i)}>
                {s.name}
              </PanelBtn>
            ))}
          </div>

          <div style={{ height: 1, background: "#d1d5db" }} />

          <PanelLabel>Display</PanelLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Toggle icon={<Hash size={15} />} on={showWeights} onClick={() => setShowWeights(v => !v)}>Weights</Toggle>
            <Toggle icon={<Table size={15} />} on={showMatrix} onClick={() => setShowMatrix(v => !v)}>Matrix</Toggle>
            <Toggle icon={<MoveRight size={15} />} on={directed} onClick={() => setDirected(v => !v)}>Directed</Toggle>
            <Toggle icon={<Circle size={15} />} on={showGrid} onClick={() => setShowGrid(v => !v)}>Grid</Toggle>
          </div>

          <div style={{ height: 1, background: "#d1d5db" }} />

          <PanelLabel>Layout</PanelLabel>
          <PanelBtn active={false} onClick={resetLayout}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={14} /> Reset layout
            </span>
          </PanelBtn>

          <div style={{ marginTop: "auto", fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
            Drag nodes to reposition · drag the board to pan · scroll to zoom.
          </div>
        </div>

        {/* Board */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div
            ref={boardRef}
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={onBoardPointerUp}
            onWheel={onWheel}
            style={{
              position: "absolute", inset: 0, overflow: "hidden",
              background: "#f8fafc", touchAction: "none",
              cursor: panRef.current ? "grabbing" : "grab",
            }}
          >
            {/* Pan + scale wrapper */}
            <div style={{ position: "absolute", inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}>
              <svg style={{ position: "absolute", left: -2000, top: -2000, width: 4000, height: 4000, overflow: "visible" }}>
                {showGrid && (
                  <>
                    <defs>
                      <pattern id="nsgrid" width={28} height={28} patternUnits="userSpaceOnUse">
                        <circle cx={28} cy={28} r="1" fill="#d5dbe3" />
                      </pattern>
                    </defs>
                    <rect x={0} y={0} width={4000} height={4000} fill="url(#nsgrid)" />
                  </>
                )}

                {directed && (
                  <defs>
                    <marker id="nsarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                    </marker>
                  </defs>
                )}

                {/* Edges — drawn relative to the same (2000,2000) origin as nodes */}
                <g transform="translate(2000,2000)">
                  {edges.map((e, i) => {
                    const a = nodeById[e.from], b = nodeById[e.to];
                    if (!a || !b) return null;
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const ux = dx / len, uy = dy / len;
                    // shorten to node edges so arrowheads/lines meet the circle
                    const x1 = a.x + ux * NODE_R, y1 = a.y + uy * NODE_R;
                    const x2 = b.x - ux * NODE_R, y2 = b.y - uy * NODE_R;
                    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                    return (
                      <g key={i}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#64748b" strokeWidth={2.5} strokeLinecap="round"
                          markerEnd={directed ? "url(#nsarrow)" : undefined} />
                        {showWeights && (
                          <g>
                            <rect x={mx - 13} y={my - 12} width={26} height={22} rx={5}
                              fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} />
                            <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                              fontSize={15} fontWeight={700} fill="#0f172a">{e.weight}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map(n => (
                    <g key={n.id}
                      onPointerDown={e => onNodePointerDown(e, n)}
                      style={{ cursor: "move" }}>
                      <circle cx={n.x} cy={n.y} r={NODE_R}
                        fill="#ffffff" stroke="#1e3a8a" strokeWidth={2.75} />
                      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                        fontSize={18} fontWeight={800} fill="#1e3a8a"
                        style={{ userSelect: "none", pointerEvents: "none" }}>{n.id}</text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>

            {/* Zoom controls (screen-fixed, over the board) */}
            <div style={{ position: "absolute", right: 16, bottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <IconBtn onClick={() => zoomBtn(1)} title="Zoom in"><ZoomIn size={18} /></IconBtn>
              <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748b" }}>{Math.round(scale * 100)}%</div>
              <IconBtn onClick={() => zoomBtn(-1)} title="Zoom out"><ZoomOut size={18} /></IconBtn>
              <IconBtn onClick={resetView} title="Reset view"><Maximize2 size={18} /></IconBtn>
            </div>

            {/* Distance matrix (screen-fixed panel) */}
            {showMatrix && (
              <div style={{
                position: "absolute", left: 16, top: 16,
                background: "#ffffff", borderRadius: 12, boxShadow: "0 6px 24px rgba(15,23,42,0.12)",
                border: "1px solid #e2e8f0", padding: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                  Distance matrix
                </div>
                <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={mcell(true)}></th>
                      {ids.map(c => <th key={c} style={mcell(true)}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ids.map(r => (
                      <tr key={r}>
                        <th style={mcell(true)}>{r}</th>
                        {ids.map(c => {
                          const v = matrix[r][c];
                          return (
                            <td key={c} style={mcell(false, r === c)}>
                              {r === c ? "–" : v ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small UI atoms ──────────────────────────────────────────────────────────

function PanelLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{children}</div>;
}

function PanelBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "8px 10px", borderRadius: 8, fontWeight: 600, fontSize: 13,
      border: active ? "2px solid #1e3a8a" : "2px solid #d1d5db",
      background: active ? "#1e3a8a" : "#ffffff",
      color: active ? "#ffffff" : "#334155",
      cursor: "pointer", textAlign: "left",
    }}>{children}</button>
  );
}

function Toggle({ icon, on, onClick, children }: { icon: React.ReactNode; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "7px 10px", borderRadius: 8, fontWeight: 600, fontSize: 13,
      border: on ? "2px solid #1e3a8a" : "2px solid #d1d5db",
      background: on ? "#dbeafe" : "#ffffff",
      color: on ? "#1e3a8a" : "#64748b",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
    }}>{icon}{children}</button>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 38, height: 38, borderRadius: 10, border: "1px solid #e2e8f0",
      background: "#ffffff", boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
      color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}

const mcell = (head: boolean, diag = false): React.CSSProperties => ({
  border: "1px solid #e2e8f0",
  padding: "4px 9px",
  textAlign: "center",
  minWidth: 26,
  fontWeight: head ? 800 : 600,
  color: head ? "#1e3a8a" : diag ? "#cbd5e1" : "#334155",
  background: head ? "#f1f5f9" : "#ffffff",
});
