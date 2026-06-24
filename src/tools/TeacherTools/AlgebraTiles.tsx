import { useState, useEffect, useRef, useCallback } from "react";
import { Home, Trash2, Undo2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TileKind = "x2" | "x" | "1" | "-x2" | "-x" | "-1"
  | "y2" | "y" | "-y2" | "-y" | "xy" | "-xy";

interface TileState {
  id: number;
  kind: TileKind;
  x: number;
  y: number;
  rot: 0 | 90;
}

// ── Constants ────────────────────────────────────────────────────────────────
// x ≈ 4.18 units, y ≈ 3.18 units — deliberately non-integer

const UNIT = 22;
const X_LEN = 92;
const Y_LEN = 70;
const SNAP = 2;
const EDGE_SNAP = 8;
let nextId = 1;

type PaletteItem = { kind: TileKind; rot: 0 | 90 };
const PALETTE_X: PaletteItem[] = [
  { kind: "x2", rot: 0 }, { kind: "x", rot: 0 }, { kind: "x", rot: 90 }, { kind: "1", rot: 0 },
  { kind: "-x2", rot: 0 }, { kind: "-x", rot: 0 }, { kind: "-x", rot: 90 }, { kind: "-1", rot: 0 },
];
const PALETTE_XY: PaletteItem[] = [
  { kind: "x2", rot: 0 }, { kind: "xy", rot: 0 }, { kind: "xy", rot: 90 }, { kind: "y2", rot: 0 },
  { kind: "x", rot: 0 }, { kind: "x", rot: 90 }, { kind: "y", rot: 0 }, { kind: "y", rot: 90 }, { kind: "1", rot: 0 },
  { kind: "-x2", rot: 0 }, { kind: "-xy", rot: 0 }, { kind: "-xy", rot: 90 }, { kind: "-y2", rot: 0 },
  { kind: "-x", rot: 0 }, { kind: "-x", rot: 90 }, { kind: "-y", rot: 0 }, { kind: "-y", rot: 90 }, { kind: "-1", rot: 0 },
];

const COLOR: Record<TileKind, string> = {
  "x2": "#3b82f6", "-x2": "#ef4444",
  "x": "#22c55e", "-x": "#f97316",
  "1": "#facc15", "-1": "#a855f7",
  "y2": "#06b6d4", "-y2": "#ec4899",
  "y": "#84cc16", "-y": "#f43f5e",
  "xy": "#6366f1", "-xy": "#d97706",
};

const TEXT_CLR: Record<TileKind, string> = {
  "x2": "rgba(255,255,255,0.6)", "-x2": "rgba(255,255,255,0.6)",
  "x": "rgba(255,255,255,0.6)", "-x": "rgba(255,255,255,0.6)",
  "1": "rgba(0,0,0,0.35)", "-1": "rgba(255,255,255,0.6)",
  "y2": "rgba(255,255,255,0.6)", "-y2": "rgba(255,255,255,0.6)",
  "y": "rgba(0,0,0,0.45)", "-y": "rgba(255,255,255,0.6)",
  "xy": "rgba(255,255,255,0.6)", "-xy": "rgba(255,255,255,0.6)",
};

const LBL: Record<TileKind, string> = {
  "x2": "x²", "-x2": "−x²", "x": "x", "-x": "−x", "1": "1", "-1": "−1",
  "y2": "y²", "-y2": "−y²", "y": "y", "-y": "−y", "xy": "xy", "-xy": "−xy",
};

const FLIP: Record<TileKind, TileKind> = {
  "x2": "-x2", "-x2": "x2", "x": "-x", "-x": "x", "1": "-1", "-1": "1",
  "y2": "-y2", "-y2": "y2", "y": "-y", "-y": "y", "xy": "-xy", "-xy": "xy",
};

const dims = (kind: TileKind, rot: 0 | 90): [number, number] => {
  const b = kind.replace("-", "");
  if (b === "x2") return [X_LEN, X_LEN];
  if (b === "y2") return [Y_LEN, Y_LEN];
  if (b === "xy") return rot === 0 ? [X_LEN, Y_LEN] : [Y_LEN, X_LEN];
  if (b === "x") return rot === 0 ? [X_LEN, UNIT] : [UNIT, X_LEN];
  if (b === "y") return rot === 0 ? [Y_LEN, UNIT] : [UNIT, Y_LEN];
  return [UNIT, UNIT];
};

const canRotate = (kind: TileKind) => {
  const b = kind.replace("-", "");
  return b === "x" || b === "y" || b === "xy";
};

// ── Edge-aware snapping ──────────────────────────────────────────────────────

const snapPos = (
  rawX: number, rawY: number, exclude: Set<number>,
  kind: TileKind, rot: 0 | 90, all: TileState[],
): [number, number] => {
  const [tw, th] = dims(kind, rot);
  let x = rawX, y = rawY;
  let sx = false, sy = false;

  for (const o of all) {
    if (exclude.has(o.id)) continue;
    const [ow, oh] = dims(o.kind, o.rot);
    if (!sx) {
      if (Math.abs(x - (o.x + ow)) < EDGE_SNAP) { x = o.x + ow; sx = true; }
      else if (Math.abs((x + tw) - o.x) < EDGE_SNAP) { x = o.x - tw; sx = true; }
      else if (Math.abs(x - o.x) < EDGE_SNAP) { x = o.x; sx = true; }
      else if (Math.abs((x + tw) - (o.x + ow)) < EDGE_SNAP) { x = o.x + ow - tw; sx = true; }
    }
    if (!sy) {
      if (Math.abs(y - (o.y + oh)) < EDGE_SNAP) { y = o.y + oh; sy = true; }
      else if (Math.abs((y + th) - o.y) < EDGE_SNAP) { y = o.y - th; sy = true; }
      else if (Math.abs(y - o.y) < EDGE_SNAP) { y = o.y; sy = true; }
      else if (Math.abs((y + th) - (o.y + oh)) < EDGE_SNAP) { y = o.y + oh - th; sy = true; }
    }
  }

  if (!sx) x = Math.round(x / SNAP) * SNAP;
  if (!sy) y = Math.round(y / SNAP) * SNAP;
  return [x, y];
};

// ── Expression builder ───────────────────────────────────────────────────────

const buildExpr = (tiles: TileState[]): string => {
  let x2 = 0, xy = 0, y2 = 0, x1 = 0, y1 = 0, c = 0;
  for (const t of tiles) {
    switch (t.kind) {
      case "x2": x2++; break; case "-x2": x2--; break;
      case "xy": xy++; break; case "-xy": xy--; break;
      case "y2": y2++; break; case "-y2": y2--; break;
      case "x": x1++; break; case "-x": x1--; break;
      case "y": y1++; break; case "-y": y1--; break;
      case "1": c++; break; case "-1": c--; break;
    }
  }
  if (x2 === 0 && xy === 0 && y2 === 0 && x1 === 0 && y1 === 0 && c === 0) return "0";
  const p: string[] = [];
  const add = (v: number, s: string) => {
    if (v === 0) return;
    const a = Math.abs(v);
    const pfx = v < 0 ? "− " : p.length ? "+ " : "";
    p.push(pfx + (s ? (a === 1 ? s : `${a}${s}`) : String(a)));
  };
  add(x2, "x²"); add(xy, "xy"); add(y2, "y²"); add(x1, "x"); add(y1, "y"); add(c, "");
  return p.join(" ");
};

// ── Expression parser ───────────────────────────────────────────────────────

const parseExpr = (raw: string): TileKind[] => {
  const s = raw.replace(/\s/g, "").replace(/−/g, "-")
    .replace(/x\^2/gi, "x²").replace(/y\^2/gi, "y²");
  if (!s) return [];
  const norm = s[0] + s.slice(1).replace(/-/g, "+-");
  const terms = norm.split("+").filter(Boolean);
  const tiles: TileKind[] = [];

  for (const term of terms) {
    let kind: TileKind;
    let count: number;
    if (term.includes("x²")) {
      const c = term.replace("x²", "");
      count = c === "" ? 1 : c === "-" ? -1 : parseInt(c);
      if (isNaN(count)) continue;
      kind = count < 0 ? "-x2" : "x2";
    } else if (term.includes("y²")) {
      const c = term.replace("y²", "");
      count = c === "" ? 1 : c === "-" ? -1 : parseInt(c);
      if (isNaN(count)) continue;
      kind = count < 0 ? "-y2" : "y2";
    } else if (term.toLowerCase().includes("xy")) {
      const c = term.toLowerCase().replace("xy", "");
      count = c === "" ? 1 : c === "-" ? -1 : parseInt(c);
      if (isNaN(count)) continue;
      kind = count < 0 ? "-xy" : "xy";
    } else if (term.toLowerCase().includes("x")) {
      const c = term.toLowerCase().replace("x", "");
      count = c === "" ? 1 : c === "-" ? -1 : parseInt(c);
      if (isNaN(count)) continue;
      kind = count < 0 ? "-x" : "x";
    } else if (term.toLowerCase().includes("y")) {
      const c = term.toLowerCase().replace("y", "");
      count = c === "" ? 1 : c === "-" ? -1 : parseInt(c);
      if (isNaN(count)) continue;
      kind = count < 0 ? "-y" : "y";
    } else {
      count = parseInt(term);
      if (isNaN(count)) continue;
      kind = count < 0 ? "-1" : "1";
    }
    for (let i = 0; i < Math.abs(count); i++) tiles.push(kind);
  }
  return tiles;
};

// ── Auto-layout ─────────────────────────────────────────────────────────

const layoutTiles = (kinds: TileKind[], startX: number, startY: number, maxW: number): TileState[] => {
  const result: TileState[] = [];
  const order: TileKind[] = ["x2", "xy", "y2", "x", "y", "1", "-x2", "-xy", "-y2", "-x", "-y", "-1"];
  let cx = startX, cy = startY;

  for (const k of order) {
    const count = kinds.filter(t => t === k).length;
    if (!count) continue;
    for (let i = 0; i < count; i++) {
      const [w] = dims(k, 0);
      if (cx + w > startX + maxW && cx > startX) { cx = startX; cy += X_LEN + 8; }
      result.push({ id: nextId++, kind: k, x: cx, y: cy, rot: 0 });
      cx += w + 4;
    }
    cx += 14;
  }
  return result;
};

// ── Zero pairs ───────────────────────────────────────────────────────────────

const ZP: [TileKind, TileKind][] = [
  ["x2", "-x2"], ["x", "-x"], ["1", "-1"],
  ["y2", "-y2"], ["y", "-y"], ["xy", "-xy"],
];

const zpPartner = (kind: TileKind): TileKind | null => {
  for (const [a, b] of ZP) { if (kind === a) return b; if (kind === b) return a; }
  return null;
};

const overlapFrac = (a: TileState, b: TileState): number => {
  const [aw, ah] = dims(a.kind, a.rot);
  const [bw, bh] = dims(b.kind, b.rot);
  const ox = Math.max(0, Math.min(a.x + aw, b.x + bw) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + ah, b.y + bh) - Math.max(a.y, b.y));
  const overlap = ox * oy;
  return overlap / Math.min(aw * ah, bw * bh);
};

const hasZP = (tiles: TileState[]): boolean => {
  const c: Partial<Record<TileKind, number>> = {};
  for (const t of tiles) c[t.kind] = (c[t.kind] || 0) + 1;
  return ZP.some(([p, n]) => (c[p] || 0) > 0 && (c[n] || 0) > 0);
};

const removeZP = (tiles: TileState[]): TileState[] => {
  const r = [...tiles];
  for (const [pos, neg] of ZP) {
    let pi: number, ni: number;
    while ((pi = r.findIndex(t => t.kind === pos)) !== -1 &&
           (ni = r.findIndex(t => t.kind === neg)) !== -1) {
      r.splice(Math.max(pi, ni), 1);
      r.splice(Math.min(pi, ni), 1);
    }
  }
  return r;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [history, setHistory] = useState<TileState[][]>([]);
  const [showFrame, setShowFrame] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showY, setShowY] = useState(false);
  const [eqMode, setEqMode] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [exprInput, setExprInput] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: number; ox: number; oy: number;
    starts: Map<number, { x: number; y: number }>;
  } | null>(null);
  const preRef = useRef<TileState[]>([]);

  const pushUndo = useCallback((before: TileState[]) => {
    setHistory(h => [...h.slice(-50), before]);
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      setTiles(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  const startDrag = useCallback((id: number, ox: number, oy: number, sel: Set<number>, extra?: TileState) => {
    preRef.current = tiles;
    const starts = new Map<number, { x: number; y: number }>();
    for (const t of tiles) {
      if (sel.has(t.id)) starts.set(t.id, { x: t.x, y: t.y });
    }
    if (extra && !starts.has(extra.id)) starts.set(extra.id, { x: extra.x, y: extra.y });
    dragRef.current = { id, ox, oy, starts };
    setDragId(id);
  }, [tiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selectedIds.size) return;
        e.preventDefault();
        setTiles(ts => { pushUndo(ts); return ts.filter(t => !selectedIds.has(t.id)); });
        setSelectedIds(new Set());
        return;
      }

      if (e.key === "f" || e.key === "F") {
        if (!selectedIds.size) return;
        e.preventDefault();
        setTiles(ts => { pushUndo(ts); return ts.map(t => selectedIds.has(t.id) ? { ...t, kind: FLIP[t.kind] } : t); });
        return;
      }

      const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (!dir || !selectedIds.size) return;
      e.preventDefault();
      setTiles(ts => {
        pushUndo(ts);
        const newSel = new Set<number>();
        const clones: TileState[] = [];
        for (const t of ts) {
          if (!selectedIds.has(t.id)) continue;
          const [w, h] = dims(t.kind, t.rot);
          const nid = nextId++;
          clones.push({ ...t, id: nid, x: t.x + dir[0] * w, y: t.y + dir[1] * h });
          newSel.add(nid);
        }
        setSelectedIds(newSel);
        return [...ts, ...clones];
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, selectedIds, pushUndo]);

  // Global drag listeners
  useEffect(() => {
    if (dragId === null) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const r = cv.getBoundingClientRect();
      const rawX = e.clientX - r.left - d.ox;
      const rawY = e.clientY - r.top - d.oy;
      setTiles(ts => {
        const tile = ts.find(t => t.id === d.id);
        if (!tile) return ts;
        const exclude = new Set(d.starts.keys());
        const [sx, sy] = snapPos(rawX, rawY, exclude, tile.kind, tile.rot, ts);
        if (d.starts.size <= 1) {
          return ts.map(t => t.id === d.id ? { ...t, x: sx, y: sy } : t);
        }
        const ps = d.starts.get(d.id);
        if (!ps) return ts;
        const dx = sx - ps.x, dy = sy - ps.y;
        return ts.map(t => {
          const s = d.starts.get(t.id);
          return s ? { ...t, x: s.x + dx, y: s.y + dy } : t;
        });
      });
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const r = cv.getBoundingClientRect();
      pushUndo(preRef.current);
      if (e.clientY < r.top - UNIT) {
        setTiles(ts => ts.filter(t => !d.starts.has(t.id)));
        setSelectedIds(new Set());
      } else if (d.starts.size === 1) {
        setTiles(ts => {
          const dragged = ts.find(t => t.id === d.id);
          if (!dragged) return ts;
          const partner = zpPartner(dragged.kind);
          if (!partner) return ts;
          const match = ts.find(t => !d.starts.has(t.id) && t.kind === partner && overlapFrac(dragged, t) > 0.5);
          if (!match) return ts;
          return ts.filter(t => t.id !== d.id && t.id !== match.id);
        });
        setSelectedIds(new Set([d.id]));
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

  const onPaletteDown = (e: React.PointerEvent, kind: TileKind, rot: 0 | 90 = 0) => {
    e.preventDefault();
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const [w, h] = dims(kind, rot);
    const id = nextId++;
    const rx = Math.round((e.clientX - r.left - w / 2) / SNAP) * SNAP;
    const ry = Math.round((e.clientY - r.top - h / 2) / SNAP) * SNAP;
    const tile: TileState = { id, kind, x: rx, y: ry, rot };
    const sel = new Set([id]);
    setSelectedIds(sel);
    setTiles(ts => [...ts, tile]);
    startDrag(id, w / 2, h / 2, sel, tile);
  };

  const onTileDown = (e: React.PointerEvent, tile: TileState) => {
    e.preventDefault();
    e.stopPropagation();
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();

    let sel: Set<number>;
    if (e.shiftKey) {
      sel = new Set(selectedIds);
      if (sel.has(tile.id)) sel.delete(tile.id); else sel.add(tile.id);
      setSelectedIds(sel);
      if (!sel.has(tile.id)) return;
    } else if (selectedIds.has(tile.id)) {
      sel = selectedIds;
    } else {
      sel = new Set([tile.id]);
      setSelectedIds(sel);
    }

    setTiles(ts => [...ts.filter(t => t.id !== tile.id), tile]);
    startDrag(tile.id, e.clientX - (r.left + tile.x), e.clientY - (r.top + tile.y), sel);
  };

  const rotate = (tile: TileState) => {
    if (!canRotate(tile.kind)) return;
    pushUndo(tiles);
    setTiles(ts => ts.map(t => t.id === tile.id ? { ...t, rot: (t.rot === 0 ? 90 : 0) as 0 | 90 } : t));
  };

  const clear = () => {
    if (!tiles.length) return;
    pushUndo(tiles);
    setTiles([]);
    setSelectedIds(new Set());
  };

  const doZP = () => {
    const result = removeZP(tiles);
    if (result.length < tiles.length) { pushUndo(tiles); setTiles(result); setSelectedIds(new Set()); }
  };

  const buildFromInput = () => {
    const raw = exprInput.trim();
    if (!raw) return;
    const cv = canvasRef.current;
    const cw = cv ? cv.getBoundingClientRect().width : 700;

    if (eqMode && raw.includes("=")) {
      const [lRaw, rRaw] = raw.split("=");
      const lk = parseExpr(lRaw), rk = parseExpr(rRaw);
      const half = cw / 2;
      const lt = layoutTiles(lk, 20, 20, half - 60);
      const rt = layoutTiles(rk, half + 30, 20, half - 60);
      pushUndo(tiles);
      setTiles(ts => [...ts, ...lt, ...rt]);
    } else {
      const kinds = parseExpr(raw);
      if (!kinds.length) return;
      pushUndo(tiles);
      setTiles(ts => [...ts, ...layoutTiles(kinds, 20, 20, cw - 60)]);
    }
    setExprInput("");
  };

  const FRAME = X_LEN + UNIT;
  const zpOk = hasZP(tiles);
  const palette = showY ? PALETTE_XY : PALETTE_X;

  const exprDisplay = (() => {
    if (!eqMode) return buildExpr(tiles);
    const cv = canvasRef.current;
    const mid = cv ? cv.getBoundingClientRect().width / 2 : 400;
    const left = tiles.filter(t => t.x + dims(t.kind, t.rot)[0] / 2 < mid);
    const right = tiles.filter(t => t.x + dims(t.kind, t.rot)[0] / 2 >= mid);
    return `${buildExpr(left)}  =  ${buildExpr(right)}`;
  })();

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
        <Btn on={showY} onClick={() => setShowY(y => !y)} label="y tiles" />
        <Btn on={eqMode} onClick={() => setEqMode(m => !m)} label="Equation" />
        <Btn on={false} onClick={doZP} label="Zero Pairs" disabled={!zpOk}
          activeColor="rgba(34,197,94,0.2)" activeText="#86efac" />
        <IconBtn onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)">
          <Undo2 size={17} color={history.length ? "#e2e8f0" : "#475569"} />
        </IconBtn>
        <IconBtn onClick={clear} disabled={!tiles.length} title="Clear all">
          <Trash2 size={17} color={tiles.length ? "#fca5a5" : "#475569"} />
        </IconBtn>
      </div>

      {/* ── Palette + expression input ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-2 flex-shrink-0 flex-wrap"
        style={{ background: "#e2e8f0", borderBottom: "2px solid #cbd5e1" }}>

        <div className="flex gap-2 items-end flex-wrap">
          {palette.map(({ kind, rot }, i) => {
            const [w, h] = dims(kind, rot);
            const s = Math.min(1, 44 / Math.max(w, h));
            const prev = i > 0 ? palette[i - 1].kind : "";
            const isSep = kind.startsWith("-") && !prev.startsWith("-");
            return (
              <div key={`${kind}-${rot}`} className="flex flex-col items-center gap-0.5 select-none"
                style={{ cursor: "grab", touchAction: "none", marginLeft: isSep ? 10 : 0 }}
                onPointerDown={e => onPaletteDown(e, kind, rot)}>
                <div style={{
                  width: w * s, height: h * s, backgroundColor: COLOR[kind],
                  borderRadius: 3, border: "2px solid rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {Math.min(w, h) * s > 14 && Math.max(w, h) * s > 24 && (
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: TEXT_CLR[kind], pointerEvents: "none",
                      writingMode: w < h ? "vertical-lr" : undefined,
                    }}>{LBL[kind]}</span>
                  )}
                </div>
                <span className="font-semibold" style={{ fontSize: 9, color: "#475569" }}>{LBL[kind]}</span>
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        <form className="flex gap-1.5 items-center" onSubmit={e => { e.preventDefault(); buildFromInput(); }}>
          <input type="text" value={exprInput} onChange={e => setExprInput(e.target.value)}
            placeholder={eqMode ? "e.g. 2x + 3 = x + 5" : showY ? "e.g. x² + 2xy + y²" : "e.g. x² + 3x + 2"}
            className="rounded-lg px-2.5 py-1.5"
            style={{ border: "1.5px solid #94a3b8", background: "#fff", width: 190, fontSize: 13, outline: "none" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
            onBlur={e => (e.currentTarget.style.borderColor = "#94a3b8")} />
          <button type="submit" disabled={!exprInput.trim()}
            className="px-3 py-1.5 rounded-lg font-semibold"
            style={{
              fontSize: 13, border: "none",
              background: exprInput.trim() ? "#3b82f6" : "#cbd5e1",
              color: exprInput.trim() ? "#fff" : "#94a3b8",
              cursor: exprInput.trim() ? "pointer" : "default",
            }}>Build</button>
        </form>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div ref={canvasRef} className="relative flex-1"
        onPointerDown={() => setSelectedIds(new Set())}
        style={{ overflow: "visible", touchAction: "none", background: "#f1f5f9", minHeight: 200 }}>

        {showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <pattern id="atg" width={UNIT} height={UNIT} patternUnits="userSpaceOnUse">
                <circle cx={UNIT} cy={UNIT} r="0.8" fill="#b0bec5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#atg)" />
          </svg>
        )}

        {showFrame && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <rect x={0} y={0} width={FRAME} height={FRAME} fill="rgba(100,116,139,0.06)" rx="4" />
            <line x1={FRAME} y1={0} x2={FRAME} y2="100%" stroke="#475569" strokeWidth="2.5" strokeDasharray="6 4" />
            <line x1={0} y1={FRAME} x2="100%" y2={FRAME} stroke="#475569" strokeWidth="2.5" strokeDasharray="6 4" />
            <text x={FRAME / 2} y={FRAME / 2} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: 24, fontWeight: 800, fill: "#94a3b8", fontFamily: "serif" }}>{"×"}</text>
            <text x={FRAME + 10} y={14} textAnchor="start" style={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}>Factor 1</text>
            <text x={4} y={FRAME + 14} textAnchor="start" style={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}>Factor 2</text>
          </svg>
        )}

        {eqMode && (
          <div className="absolute pointer-events-none" style={{ top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ flex: 1, width: 2, background: "repeating-linear-gradient(to bottom, #475569 0, #475569 6px, transparent 6px, transparent 12px)" }} />
            <div style={{ padding: "6px 10px", background: "#334155", borderRadius: 8, color: "#e2e8f0", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>=</div>
            <div style={{ flex: 1, width: 2, background: "repeating-linear-gradient(to bottom, #475569 0, #475569 6px, transparent 6px, transparent 12px)" }} />
          </div>
        )}

        {tiles.map(tile => {
          const [w, h] = dims(tile.kind, tile.rot);
          const active = dragId === tile.id;
          const selected = selectedIds.has(tile.id);
          const minD = Math.min(w, h);
          const fs = minD >= X_LEN ? 15 : minD >= 30 ? 12 : minD >= UNIT ? 9 : 0;
          return (
            <div key={tile.id}
              onPointerDown={e => onTileDown(e, tile)}
              onDoubleClick={() => rotate(tile)}
              title={canRotate(tile.kind) ? "Double-click to rotate · F to flip · Arrows to duplicate" : "F to flip sign · Arrows to duplicate · Shift+click to multi-select"}
              style={{
                position: "absolute", left: tile.x, top: tile.y, width: w, height: h,
                backgroundColor: COLOR[tile.kind], borderRadius: 4,
                border: `2px solid ${active ? "rgba(0,0,0,0.45)" : selected ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.18)"}`,
                boxShadow: active ? "0 8px 24px rgba(0,0,0,0.3)" : selected ? "0 0 0 2px rgba(59,130,246,0.7), 0 1px 4px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.12)",
                cursor: active ? "grabbing" : "grab",
                zIndex: active ? 100 : selected ? 50 : 10,
                userSelect: "none", touchAction: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: active ? "none" : "box-shadow 0.15s ease",
              }}>
              {fs > 0 && (
                <span style={{
                  fontSize: fs, fontWeight: 700, color: TEXT_CLR[tile.kind], pointerEvents: "none",
                  writingMode: w < h && h > 40 ? "vertical-lr" : undefined,
                }}>{LBL[tile.kind]}</span>
              )}
            </div>
          );
        })}

        {tiles.length === 0 && dragId === null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ color: "#94a3b8" }}>
              <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Drag tiles from the palette</p>
              <p style={{ fontSize: 13, margin: 0 }}>or type an expression and click Build</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Expression bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 flex-shrink-0" style={{ background: "#1e293b" }}>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Expression:</span>
        <span className="font-bold text-white" style={{ fontSize: 20, letterSpacing: 0.5 }}>
          {exprDisplay}
        </span>
        {tiles.length > 0 && (
          <span style={{ fontSize: 12, color: "#475569", marginLeft: 4 }}>
            ({tiles.length} tile{tiles.length !== 1 ? "s" : ""})
          </span>
        )}
      </div>
    </div>
  );
}

// ── UI helpers ───────────────────────────────────────────────────────────────

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
