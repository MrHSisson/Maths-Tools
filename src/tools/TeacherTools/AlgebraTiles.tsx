import { useState, useEffect, useRef, useCallback } from "react";
import { Home, Trash2, Undo2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TileKind = "x2" | "x" | "1" | "-x2" | "-x" | "-1";

interface TileState {
  id: number;
  kind: TileKind;
  x: number;
  y: number;
  rot: 0 | 90;
}

// ── Constants ────────────────────────────────────────────────────────────────

const UNIT = 28;
const X_LEN = UNIT * 3;
let nextId = 1;

const KINDS: TileKind[] = ["x2", "x", "1", "-x2", "-x", "-1"];

const COLOR: Record<TileKind, string> = {
  "x2": "#3b82f6", "-x2": "#ef4444",
  "x": "#22c55e", "-x": "#f97316",
  "1": "#facc15", "-1": "#a855f7",
};

const LBL: Record<TileKind, string> = {
  "x2": "x²", "-x2": "−x²",
  "x": "x", "-x": "−x",
  "1": "1", "-1": "−1",
};

const dims = (kind: TileKind, rot: 0 | 90): [number, number] => {
  const b = kind.replace("-", "");
  if (b === "x2") return [X_LEN, X_LEN];
  if (b === "x") return rot === 0 ? [X_LEN, UNIT] : [UNIT, X_LEN];
  return [UNIT, UNIT];
};

const snap = (v: number) => Math.round(v / UNIT) * UNIT;
const canRotate = (kind: TileKind) => kind === "x" || kind === "-x";

// ── Expression ───────────────────────────────────────────────────────────────

const buildExpression = (tiles: TileState[]): string => {
  let x2 = 0, x1 = 0, c = 0;
  for (const t of tiles) {
    if (t.kind === "x2") x2++;
    else if (t.kind === "-x2") x2--;
    else if (t.kind === "x") x1++;
    else if (t.kind === "-x") x1--;
    else if (t.kind === "1") c++;
    else c--;
  }
  if (x2 === 0 && x1 === 0 && c === 0) return "0";
  const parts: string[] = [];
  const add = (val: number, sym: string) => {
    if (val === 0) return;
    const a = Math.abs(val);
    const pfx = val < 0 ? "− " : parts.length ? "+ " : "";
    parts.push(pfx + (sym ? (a === 1 ? sym : `${a}${sym}`) : String(a)));
  };
  add(x2, "x²");
  add(x1, "x");
  add(c, "");
  return parts.join(" ");
};

// ── Zero pairs ───────────────────────────────────────────────────────────────

const zeroPairTypes: [TileKind, TileKind][] = [["x2", "-x2"], ["x", "-x"], ["1", "-1"]];

const hasZP = (tiles: TileState[]): boolean => {
  const c: Partial<Record<TileKind, number>> = {};
  for (const t of tiles) c[t.kind] = (c[t.kind] || 0) + 1;
  return zeroPairTypes.some(([p, n]) => (c[p] || 0) > 0 && (c[n] || 0) > 0);
};

const removeZP = (tiles: TileState[]): TileState[] => {
  const r = [...tiles];
  for (const [pos, neg] of zeroPairTypes) {
    let pi: number, ni: number;
    while ((pi = r.findIndex(t => t.kind === pos)) !== -1 &&
           (ni = r.findIndex(t => t.kind === neg)) !== -1) {
      r.splice(Math.max(pi, ni), 1);
      r.splice(Math.min(pi, ni), 1);
    }
  }
  return r;
};

// ── Main component ───────────────────────────────────────────────────────────

export default function App() {
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [history, setHistory] = useState<TileState[][]>([]);
  const [showFrame, setShowFrame] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [dragId, setDragId] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const preRef = useRef<TileState[]>([]);

  const pushUndo = useCallback((before: TileState[]) => {
    setHistory(h => [...h.slice(-50), before]);
  }, []);

  const startDrag = useCallback((id: number, ox: number, oy: number) => {
    preRef.current = [...tiles];
    dragRef.current = { id, ox, oy };
    setDragId(id);
  }, [tiles]);

  // Global pointer listeners while dragging
  useEffect(() => {
    if (dragId === null) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const r = cv.getBoundingClientRect();
      const x = snap(e.clientX - r.left - d.ox);
      const y = snap(e.clientY - r.top - d.oy);
      setTiles(ts => ts.map(t => t.id === d.id ? { ...t, x, y } : t));
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const r = cv.getBoundingClientRect();
      pushUndo(preRef.current);
      if (e.clientY < r.top - UNIT) {
        setTiles(ts => ts.filter(t => t.id !== d.id));
      }
      dragRef.current = null;
      setDragId(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragId, pushUndo]);

  const onPaletteDown = (e: React.PointerEvent, kind: TileKind) => {
    e.preventDefault();
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const [w, h] = dims(kind, 0);
    const id = nextId++;
    const tile: TileState = { id, kind, x: snap(e.clientX - r.left - w / 2), y: snap(e.clientY - r.top - h / 2), rot: 0 };
    setTiles(ts => [...ts, tile]);
    startDrag(id, w / 2, h / 2);
  };

  const onTileDown = (e: React.PointerEvent, tile: TileState) => {
    e.preventDefault();
    e.stopPropagation();
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    setTiles(ts => [...ts.filter(t => t.id !== tile.id), tile]);
    startDrag(tile.id, e.clientX - (r.left + tile.x), e.clientY - (r.top + tile.y));
  };

  const rotate = (tile: TileState) => {
    if (!canRotate(tile.kind)) return;
    const before = [...tiles];
    setTiles(ts => ts.map(t => t.id === tile.id ? { ...t, rot: (t.rot === 0 ? 90 : 0) as 0 | 90 } : t));
    pushUndo(before);
  };

  const undo = () => {
    if (!history.length) return;
    setTiles(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  };

  const clear = () => {
    if (!tiles.length) return;
    pushUndo(tiles);
    setTiles([]);
  };

  const doZeroPairs = () => {
    const result = removeZP(tiles);
    if (result.length < tiles.length) {
      pushUndo(tiles);
      setTiles(result);
    }
  };

  const FRAME = X_LEN + UNIT;
  const zpOk = hasZP(tiles);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ background: "#1e293b" }}>
        <button onClick={() => { window.location.href = "/"; }}
          className="p-1.5 rounded-lg" style={{ border: "none", background: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
          <Home size={20} color="#e2e8f0" />
        </button>
        <h1 className="font-bold text-white flex-1 m-0" style={{ fontSize: 17 }}>Algebra Tiles</h1>

        <Btn on={showGrid} onClick={() => setShowGrid(g => !g)} label="Grid" />
        <Btn on={showFrame} onClick={() => setShowFrame(f => !f)} label="Frame" />
        <Btn on={false} onClick={doZeroPairs} label="Zero Pairs" disabled={!zpOk}
          activeColor="rgba(34,197,94,0.2)" activeText="#86efac" />
        <IconBtn onClick={undo} disabled={!history.length} title="Undo">
          <Undo2 size={17} color={history.length ? "#e2e8f0" : "#475569"} />
        </IconBtn>
        <IconBtn onClick={clear} disabled={!tiles.length} title="Clear all">
          <Trash2 size={17} color={tiles.length ? "#fca5a5" : "#475569"} />
        </IconBtn>
      </div>

      {/* ── Palette ─────────────────────────────────────────────────────── */}
      <div className="flex gap-4 px-3 py-2.5 justify-center flex-wrap flex-shrink-0"
        style={{ background: "#e2e8f0", borderBottom: "2px solid #cbd5e1" }}>
        {KINDS.map(kind => {
          const [w, h] = dims(kind, 0);
          const s = Math.min(1, 50 / Math.max(w, h));
          return (
            <div key={kind} className="flex flex-col items-center gap-1 select-none"
              style={{ cursor: "grab", touchAction: "none" }}
              onPointerDown={e => onPaletteDown(e, kind)}>
              <div style={{
                width: w * s, height: h * s, backgroundColor: COLOR[kind],
                borderRadius: 4, border: "2px solid rgba(0,0,0,0.2)",
              }} />
              <span className="font-semibold" style={{ fontSize: 11, color: "#475569" }}>{LBL[kind]}</span>
            </div>
          );
        })}
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div ref={canvasRef} className="relative flex-1"
        style={{ overflow: "visible", touchAction: "none", background: "#f1f5f9", minHeight: 200 }}>

        {/* Grid dots */}
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <pattern id="atg" width={UNIT} height={UNIT} patternUnits="userSpaceOnUse">
                <circle cx={UNIT} cy={UNIT} r="1" fill="#b0bec5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#atg)" />
          </svg>
        )}

        {/* Corner frame */}
        {showFrame && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <rect x={0} y={0} width={FRAME} height={FRAME} fill="rgba(100,116,139,0.06)" />
            <line x1={FRAME} y1={0} x2={FRAME} y2="100%" stroke="#475569" strokeWidth="2.5" strokeDasharray="6 4" />
            <line x1={0} y1={FRAME} x2="100%" y2={FRAME} stroke="#475569" strokeWidth="2.5" strokeDasharray="6 4" />
            <text x={FRAME / 2} y={FRAME / 2} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: 26, fontWeight: 800, fill: "#94a3b8", fontFamily: "serif" }}>{"×"}</text>
          </svg>
        )}

        {/* Placed tiles */}
        {tiles.map(tile => {
          const [w, h] = dims(tile.kind, tile.rot);
          const active = dragId === tile.id;
          const showLbl = Math.min(w, h) >= X_LEN;
          return (
            <div key={tile.id}
              onPointerDown={e => onTileDown(e, tile)}
              onDoubleClick={() => rotate(tile)}
              title={canRotate(tile.kind) ? "Double-click to rotate" : undefined}
              style={{
                position: "absolute", left: tile.x, top: tile.y, width: w, height: h,
                backgroundColor: COLOR[tile.kind], borderRadius: 5,
                border: `2px solid ${active ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.18)"}`,
                boxShadow: active ? "0 8px 24px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.12)",
                cursor: active ? "grabbing" : "grab",
                zIndex: active ? 100 : 10,
                userSelect: "none", touchAction: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: active ? "none" : "box-shadow 0.15s ease",
              }}>
              {showLbl && (
                <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.55)", pointerEvents: "none" }}>
                  {LBL[tile.kind]}
                </span>
              )}
            </div>
          );
        })}

        {/* Empty state hint */}
        {tiles.length === 0 && dragId === null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p style={{ color: "#94a3b8", fontSize: 16, fontWeight: 500 }}>Drag tiles from the palette above</p>
          </div>
        )}
      </div>

      {/* ── Expression bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ background: "#1e293b" }}>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Expression:</span>
        <span className="font-bold text-white" style={{ fontSize: 20, letterSpacing: 0.5 }}>
          {buildExpression(tiles)}
        </span>
        {tiles.length > 0 && (
          <span style={{ fontSize: 12, color: "#475569", marginLeft: 8 }}>
            ({tiles.length} tile{tiles.length !== 1 ? "s" : ""})
          </span>
        )}
      </div>
    </div>
  );
}

// ── Small UI helpers ─────────────────────────────────────────────────────────

function Btn({ on, onClick, label, disabled, activeColor, activeText }: {
  on: boolean; onClick: () => void; label: string; disabled?: boolean;
  activeColor?: string; activeText?: string;
}) {
  const ac = activeColor || "rgba(96,165,250,0.25)";
  const at = activeText || "#93c5fd";
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-2.5 py-1 rounded-lg font-semibold"
      style={{
        fontSize: 13, border: "none", cursor: disabled ? "default" : "pointer",
        background: disabled ? "rgba(255,255,255,0.04)" : on ? ac : "rgba(255,255,255,0.08)",
        color: disabled ? "#475569" : on ? at : "#94a3b8",
        transition: "background 0.15s, color 0.15s",
      }}>
      {label}
    </button>
  );
}

function IconBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="p-1.5 rounded-lg"
      style={{
        border: "none", cursor: disabled ? "default" : "pointer",
        background: disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"; }}>
      {children}
    </button>
  );
}
