import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Trash2, Undo2, RotateCw, Plus, Minus, Eye, EyeOff,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Menu, X,
  Pencil, Eraser, MousePointer2,
} from "lucide-react";

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

interface Stroke {
  color: string;
  points: { x: number; y: number }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const UNIT = 22;
const X_LEN = 92;
const Y_LEN = 70;
const SNAP = 2;
const EDGE_SNAP = 14;
let nextId = 1;

type PalCell = { kind: TileKind; rot: 0 | 90; row: number; col: number };
const PAL_POS_X: PalCell[] = [
  { kind: "x2", rot: 0, row: 1, col: 1 },
  { kind: "x", rot: 90, row: 1, col: 2 },
  { kind: "x", rot: 0, row: 2, col: 1 },
  { kind: "1", rot: 0, row: 2, col: 2 },
];
const PAL_NEG_X: PalCell[] = [
  { kind: "-x2", rot: 0, row: 1, col: 1 },
  { kind: "-x", rot: 90, row: 1, col: 2 },
  { kind: "-x", rot: 0, row: 2, col: 1 },
  { kind: "-1", rot: 0, row: 2, col: 2 },
];
const PAL_POS_XY: PalCell[] = [
  { kind: "x2", rot: 0, row: 1, col: 1 },
  { kind: "xy", rot: 90, row: 1, col: 2 },
  { kind: "x", rot: 90, row: 1, col: 3 },
  { kind: "xy", rot: 0, row: 2, col: 1 },
  { kind: "y2", rot: 0, row: 2, col: 2 },
  { kind: "y", rot: 90, row: 2, col: 3 },
  { kind: "x", rot: 0, row: 3, col: 1 },
  { kind: "y", rot: 0, row: 3, col: 2 },
  { kind: "1", rot: 0, row: 3, col: 3 },
];
const PAL_NEG_XY: PalCell[] = [
  { kind: "-x2", rot: 0, row: 1, col: 1 },
  { kind: "-xy", rot: 90, row: 1, col: 2 },
  { kind: "-x", rot: 90, row: 1, col: 3 },
  { kind: "-xy", rot: 0, row: 2, col: 1 },
  { kind: "-y2", rot: 0, row: 2, col: 2 },
  { kind: "-y", rot: 90, row: 2, col: 3 },
  { kind: "-x", rot: 0, row: 3, col: 1 },
  { kind: "-y", rot: 0, row: 3, col: 2 },
  { kind: "-1", rot: 0, row: 3, col: 3 },
];
const PAL_S = 1;

// ── Pen / eraser ─────────────────────────────────────────────────────────────

const PEN_COLORS = ["#1e3a5f", "#dc2626", "#16a34a", "#9333ea", "#ea580c"];
const ERASE_R = 14;

// Proximity eraser: drop every point within ERASE_R of (px,py) and split each
// stroke into the surviving runs, so an eraser pass cuts through a line rather
// than deleting the whole thing.
const eraseNear = (strokes: Stroke[], px: number, py: number): Stroke[] => {
  const out: Stroke[] = [];
  for (const s of strokes) {
    let cur: { x: number; y: number }[] = [];
    for (const pt of s.points) {
      if (Math.hypot(pt.x - px, pt.y - py) < ERASE_R) {
        if (cur.length >= 2) out.push({ color: s.color, points: cur });
        cur = [];
      } else cur.push(pt);
    }
    if (cur.length >= 2) out.push({ color: s.color, points: cur });
  }
  return out;
};

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

// Single source of truth for label sizing — keeps palette tiles, placed tiles
// and product-cell text consistent across the tool. `minD` is the tile's
// shorter side in px.
const labelFontSize = (minD: number): number =>
  minD >= X_LEN ? 20 : minD >= Y_LEN ? 18 : minD >= 30 ? 16 : minD >= UNIT ? 15 : 0;

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

// ── Grid table helpers ──────────────────────────────────────────────────────

const kindLen = (kind: TileKind): number => {
  const b = kind.replace("-", "");
  if (b === "x") return X_LEN;
  if (b === "y") return Y_LEN;
  return UNIT;
};

const MULT_BASE: Record<string, Record<string, string>> = {
  x: { x: "x2", y: "xy", "1": "x" },
  y: { x: "xy", y: "y2", "1": "y" },
  "1": { x: "x", y: "y", "1": "1" },
};

const multiplyKinds = (a: TileKind, b: TileKind): TileKind => {
  const sA = a.startsWith("-") ? -1 : 1;
  const sB = b.startsWith("-") ? -1 : 1;
  const bA = a.replace("-", "");
  const bB = b.replace("-", "");
  const base = MULT_BASE[bA]?.[bB] ?? "1";
  return (sA * sB < 0 ? `-${base}` : base) as TileKind;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [history, setHistory] = useState<TileState[][]>([]);
  const [showY, setShowY] = useState(false);
  const [eqMode, setEqMode] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showToolbar, setShowToolbar] = useState(false);
  const [lasso, setLasso] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [exprInput, setExprInput] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [colHeaders, setColHeaders] = useState<TileKind[]>(["x"]);
  const [rowHeaders, setRowHeaders] = useState<TileKind[]>(["x"]);
  const [openHdr, setOpenHdr] = useState<{ axis: "col" | "row"; idx: number } | null>(null);
  const [tableRevealed, setTableRevealed] = useState(false);
  const [tableSelected, setTableSelected] = useState(false);
  // Logical-coord centre of the table once it has been dragged; null = default
  // centred position.
  const [tablePos, setTablePos] = useState<{ x: number; y: number } | null>(null);
  const [tableDragging, setTableDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBuilder, setShowBuilder] = useState(true);
  const [showExprBar, setShowExprBar] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const drawingRef = useRef<{ x: number; y: number }[] | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableDragRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const tableMovedRef = useRef(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const showTableRef = useRef(showTable);
  showTableRef.current = showTable;
  const colHeadersRef = useRef(colHeaders);
  colHeadersRef.current = colHeaders;
  const rowHeadersRef = useRef(rowHeaders);
  rowHeadersRef.current = rowHeaders;
  const tableRevealedRef = useRef(tableRevealed);
  tableRevealedRef.current = tableRevealed;
  const revealedCellsRef = useRef(revealedCells);
  revealedCellsRef.current = revealedCells;
  const dragRef = useRef<{
    id: number; ox: number; oy: number;
    starts: Map<number, { x: number; y: number }>;
    moved: boolean;
    wasSelected: boolean;
    lastKind?: TileKind; lastRot?: 0 | 90;
    lastX?: number; lastY?: number;
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
    setShowToolbar(false);
  }, []);

  const startDrag = useCallback((id: number, ox: number, oy: number, sel: Set<number>, wasSelected: boolean, extra?: TileState) => {
    preRef.current = tiles;
    const starts = new Map<number, { x: number; y: number }>();
    for (const t of tiles) {
      if (sel.has(t.id)) starts.set(t.id, { x: t.x, y: t.y });
    }
    if (extra && !starts.has(extra.id)) starts.set(extra.id, { x: extra.x, y: extra.y });
    dragRef.current = { id, ox, oy, starts, moved: false, wasSelected };
    setDragId(id);
  }, [tiles]);

  // ── Shared actions (keyboard + toolbar) ────────────────────────────────

  const duplicateDir = useCallback((dx: number, dy: number) => {
    if (!selectedIds.size) return;
    setTiles(ts => {
      pushUndo(ts);
      const newSel = new Set<number>();
      const clones: TileState[] = [];
      for (const t of ts) {
        if (!selectedIds.has(t.id)) continue;
        const [w, h] = dims(t.kind, t.rot);
        const nid = nextId++;
        clones.push({ ...t, id: nid, x: t.x + dx * w, y: t.y + dy * h });
        newSel.add(nid);
      }
      setSelectedIds(newSel);
      return [...ts, ...clones];
    });
  }, [selectedIds, pushUndo]);

  const flipSelected = useCallback(() => {
    if (!selectedIds.size) return;
    setTiles(ts => { pushUndo(ts); return ts.map(t => selectedIds.has(t.id) ? { ...t, kind: FLIP[t.kind] } : t); });
  }, [selectedIds, pushUndo]);

  const rotateSelected = useCallback(() => {
    if (!selectedIds.size) return;
    setTiles(ts => {
      pushUndo(ts);
      return ts.map(t =>
        selectedIds.has(t.id) && canRotate(t.kind)
          ? { ...t, rot: (t.rot === 0 ? 90 : 0) as 0 | 90 }
          : t
      );
    });
  }, [selectedIds, pushUndo]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return;
    setTiles(ts => { pushUndo(ts); return ts.filter(t => !selectedIds.has(t.id)); });
    setSelectedIds(new Set());
    setShowToolbar(false);
  }, [selectedIds, pushUndo]);

  const deleteTable = useCallback(() => {
    setShowTable(false);
    setTableSelected(false);
    setTablePos(null);
    setOpenHdr(null);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (tableSelected) { e.preventDefault(); deleteTable(); return; }
        if (!selectedIds.size) return;
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        if (!selectedIds.size) return;
        e.preventDefault();
        flipSelected();
        return;
      }

      if (e.key === "r" || e.key === "R") {
        if (!selectedIds.size) return;
        e.preventDefault();
        rotateSelected();
        return;
      }

      const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (!dir || !selectedIds.size) return;
      e.preventDefault();
      duplicateDir(dir[0], dir[1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, selectedIds, deleteSelected, flipSelected, rotateSelected, duplicateDir, tableSelected, deleteTable]);

  // ── Global drag listeners ──────────────────────────────────────────────

  useEffect(() => {
    if (dragId === null) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const s = scaleRef.current;
      const r = cv.getBoundingClientRect();
      const rawX = (e.clientX - r.left) / s - d.ox;
      const rawY = (e.clientY - r.top) / s - d.oy;

      if (!d.moved) {
        const ps = d.starts.get(d.id);
        if (ps && (Math.abs(rawX - ps.x) > 3 || Math.abs(rawY - ps.y) > 3)) d.moved = true;
      }

      setTiles(ts => {
        const tile = ts.find(t => t.id === d.id);
        if (!tile) return ts;
        const exclude = new Set(d.starts.keys());
        const [sx, sy] = snapPos(rawX, rawY, exclude, tile.kind, tile.rot, ts);
        if (d.starts.size <= 1) {
          d.lastKind = tile.kind; d.lastRot = tile.rot; d.lastX = sx; d.lastY = sy;
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

      if (e.clientY < r.top - UNIT || e.clientX < r.left - UNIT) {
        setTiles(ts => ts.filter(t => !d.starts.has(t.id)));
        setSelectedIds(new Set());
        setShowToolbar(false);
      } else if (d.starts.size === 1) {
        let snapped = false;
        if (d.lastKind != null && d.lastX != null && d.lastY != null && showTableRef.current) {
          const cvEl = canvasRef.current;
          if (cvEl) {
            const cr = cvEl.getBoundingClientRect();
            const sc = scaleRef.current;
            const cols = colHeadersRef.current;
            const rows = rowHeadersRef.current;
            const revealed = revealedCellsRef.current;
            const [tw, th] = dims(d.lastKind, d.lastRot ?? 0);

            const cells = cvEl.querySelectorAll<HTMLElement>("[data-product-cell]");
            for (const cell of cells) {
              const ck = cell.getAttribute("data-product-cell")!;
              const [ri, ci] = ck.split("-").map(Number);
              if (tableRevealedRef.current || revealed.has(ck)) continue;
              if (d.lastKind !== multiplyKinds(rows[ri], cols[ci])) continue;

              const br = cell.getBoundingClientRect();
              const ix = (br.left - cr.left) / sc;
              const iy = (br.top - cr.top) / sc;
              const iw = br.width / sc;
              const ih = br.height / sc;

              const ox = Math.max(0, Math.min(d.lastX + tw, ix + iw) - Math.max(d.lastX, ix));
              const oy = Math.max(0, Math.min(d.lastY! + th, iy + ih) - Math.max(d.lastY!, iy));
              if ((ox * oy) / (iw * ih) >= 0.8) {
                setTiles(ts => ts.filter(t => t.id !== d.id));
                setRevealedCells(s => { const n = new Set(s); n.add(ck); return n; });
                snapped = true;
                break;
              }
            }
          }
        }
        if (!snapped) {
          setTiles(ts => {
            const dragged = ts.find(t => t.id === d.id);
            if (!dragged) return ts;
            const partner = zpPartner(dragged.kind);
            if (!partner) return ts;
            const match = ts.find(t => !d.starts.has(t.id) && t.kind === partner && overlapFrac(dragged, t) > 0.5);
            if (!match) return ts;
            return ts.filter(t => t.id !== d.id && t.id !== match.id);
          });
        }
        setSelectedIds(new Set([d.id]));
      }

      if (!d.moved && d.wasSelected) {
        setShowToolbar(v => !v);
      } else {
        setShowToolbar(false);
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

  // ── Lasso (marquee) selection ──────────────────────────────────────────

  const lassoRef = useRef<{ x1: number; y1: number } | null>(null);

  useEffect(() => {
    if (!lassoRef.current) return;

    const onMove = (e: PointerEvent) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      const s = scaleRef.current;
      const x2 = (e.clientX - r.left) / s;
      const y2 = (e.clientY - r.top) / s;
      const { x1, y1 } = lassoRef.current!;
      setLasso({ x1, y1, x2, y2 });
    };

    const onUp = () => {
      const l = lasso;
      lassoRef.current = null;
      setLasso(null);
      if (!l) return;
      const lx = Math.min(l.x1, l.x2), ly = Math.min(l.y1, l.y2);
      const lw = Math.abs(l.x2 - l.x1), lh = Math.abs(l.y2 - l.y1);
      if (lw < 5 && lh < 5) return;
      const hit = new Set<number>();
      for (const t of tiles) {
        const [tw, th] = dims(t.kind, t.rot);
        if (t.x + tw > lx && t.x < lx + lw && t.y + th > ly && t.y < ly + lh) {
          hit.add(t.id);
        }
      }
      setSelectedIds(hit);
      setShowToolbar(hit.size > 0);

      // Select the whole table if the lasso covers most of it.
      const cv = canvasRef.current;
      const tEl = tableRef.current;
      if (showTableRef.current && cv && tEl) {
        const r = cv.getBoundingClientRect();
        const s = scaleRef.current;
        const tr = tEl.getBoundingClientRect();
        const tx = (tr.left - r.left) / s, ty = (tr.top - r.top) / s;
        const tw = tr.width / s, th = tr.height / s;
        const ox = Math.max(0, Math.min(lx + lw, tx + tw) - Math.max(lx, tx));
        const oy = Math.max(0, Math.min(ly + lh, ty + th) - Math.max(ly, ty));
        const frac = tw * th > 0 ? (ox * oy) / (tw * th) : 0;
        setTableSelected(frac >= 0.6);
      } else {
        setTableSelected(false);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [lasso, tiles]);

  // ── Drawing (freehand pen) ──────────────────────────────────────────

  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;
  const eraserModeRef = useRef(eraserMode);
  eraserModeRef.current = eraserMode;
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const penColorRef = useRef(penColor);
  penColorRef.current = penColor;

  useEffect(() => {
    if (!drawingRef.current) return;

    const onMove = (e: PointerEvent) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      const s = scaleRef.current;
      const px = (e.clientX - r.left) / s;
      const py = (e.clientY - r.top) / s;

      if (eraserModeRef.current) {
        setStrokes(prev => eraseNear(prev, px, py));
        return;
      }

      if (!drawingRef.current) return;
      drawingRef.current.push({ x: px, y: py });
      const cur = drawingRef.current;
      const col = penColorRef.current;
      setStrokes(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { color: col, points: [...cur] };
        return copy;
      });
    };

    const onUp = () => {
      drawingRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [strokes]);

  // ── Table dragging (after lasso-selecting the whole table) ──────────────

  useEffect(() => {
    if (!tableDragging) return;

    const onMove = (e: PointerEvent) => {
      const d = tableDragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const r = cv.getBoundingClientRect();
      const s = scaleRef.current;
      const px = (e.clientX - r.left) / s;
      const py = (e.clientY - r.top) / s;
      const dx = px - d.sx, dy = py - d.sy;
      if (!tableMovedRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        tableMovedRef.current = true;
      }
      setTablePos({ x: d.cx + dx, y: d.cy + dy });
    };

    const onUp = () => {
      tableDragRef.current = null;
      setTableDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [tableDragging]);

  // Clear table selection when the table is hidden.
  useEffect(() => {
    if (!showTable) setTableSelected(false);
  }, [showTable]);

  const onTableDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Reset on every fresh press so a stale "moved" flag from an earlier drag
    // can never keep blocking clicks (add side / reveal / etc.).
    tableMovedRef.current = false;
    if (!tableSelected) return;
    const cv = canvasRef.current;
    const tEl = tableRef.current;
    if (!cv || !tEl) return;
    const r = cv.getBoundingClientRect();
    const s = scaleRef.current;
    const tr = tEl.getBoundingClientRect();
    tableDragRef.current = {
      sx: (e.clientX - r.left) / s,
      sy: (e.clientY - r.top) / s,
      cx: (tr.left + tr.width / 2 - r.left) / s,
      cy: (tr.top + tr.height / 2 - r.top) / s,
    };
    setTableDragging(true);
  };

  const onCanvasDown = (e: React.PointerEvent) => {
    setOpenHdr(null);
    if (dragId !== null) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const s = scaleRef.current;
    const x = (e.clientX - r.left) / s;
    const y = (e.clientY - r.top) / s;

    if (drawMode || eraserMode) {
      if (eraserMode) {
        setStrokes(prev => eraseNear(prev, x, y));
      }
      drawingRef.current = [{ x, y }];
      if (!eraserMode) setStrokes(prev => [...prev, { color: penColor, points: [{ x, y }] }]);
      return;
    }

    lassoRef.current = { x1: x, y1: y };
    setLasso({ x1: x, y1: y, x2: x, y2: y });
    setSelectedIds(new Set());
    setTableSelected(false);
    setShowToolbar(false);
  };

  const onPaletteDown = (e: React.PointerEvent, kind: TileKind, rot: 0 | 90 = 0) => {
    e.preventDefault();
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const [w, h] = dims(kind, rot);
    const id = nextId++;
    const rx = Math.round(((e.clientX - r.left) / scale - w / 2) / SNAP) * SNAP;
    const ry = Math.round(((e.clientY - r.top) / scale - h / 2) / SNAP) * SNAP;
    const tile: TileState = { id, kind, x: rx, y: ry, rot };
    const sel = new Set([id]);
    setSelectedIds(sel);
    setShowToolbar(false);
    setTiles(ts => [...ts, tile]);
    startDrag(id, w / 2, h / 2, sel, false, tile);
  };

  const onTileDown = (e: React.PointerEvent, tile: TileState) => {
    e.preventDefault();
    e.stopPropagation();
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();

    let sel: Set<number>;
    let wasSelected: boolean;

    if (e.shiftKey) {
      sel = new Set(selectedIds);
      if (sel.has(tile.id)) sel.delete(tile.id); else sel.add(tile.id);
      setSelectedIds(sel);
      setShowToolbar(false);
      wasSelected = false;
      if (!sel.has(tile.id)) return;
    } else if (selectedIds.has(tile.id)) {
      sel = selectedIds;
      wasSelected = true;
    } else {
      sel = new Set([tile.id]);
      setSelectedIds(sel);
      setShowToolbar(false);
      wasSelected = false;
    }

    setTiles(ts => [...ts.filter(t => t.id !== tile.id), tile]);
    startDrag(tile.id, (e.clientX - r.left) / scale - tile.x, (e.clientY - r.top) / scale - tile.y, sel, wasSelected);
  };

  const clear = () => {
    if (!tiles.length) return;
    pushUndo(tiles);
    setTiles([]);
    setSelectedIds(new Set());
    setShowToolbar(false);
  };

  const doZP = () => {
    const result = removeZP(tiles);
    if (result.length < tiles.length) {
      pushUndo(tiles);
      setTiles(result);
      setSelectedIds(new Set());
      setShowToolbar(false);
    }
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

  const zpOk = hasZP(tiles);
  const anyRotatable = tiles.some(t => selectedIds.has(t.id) && canRotate(t.kind));
  const posGrid = showY ? PAL_POS_XY : PAL_POS_X;
  const negGrid = showY ? PAL_NEG_XY : PAL_NEG_X;

  useEffect(() => {
    if (showY) return;
    setColHeaders(h => h.map(k => k === "y" ? "x" as TileKind : k === "-y" ? "-x" as TileKind : k));
    setRowHeaders(h => h.map(k => k === "y" ? "x" as TileKind : k === "-y" ? "-x" as TileKind : k));
  }, [showY]);

  const headerKinds: TileKind[] = showY
    ? ["x", "y", "1", "-x", "-y", "-1"]
    : ["x", "1", "-x", "-1"];
  const factorExpr = (kinds: TileKind[]) => {
    const t = kinds.map((k, i) => ({ id: -(i + 1), kind: k, x: 0, y: 0, rot: 0 as const }));
    return buildExpr(t);
  };
  const colExpr = showTable ? factorExpr(colHeaders) : null;
  const rowExpr = showTable ? factorExpr(rowHeaders) : null;
  const tableExpr = showTable ? (() => {
    const products: TileKind[] = [];
    for (const rk of rowHeaders) for (const ck of colHeaders) products.push(multiplyKinds(rk, ck));
    const pt = products.map((k, i) => ({ id: -(i + 1), kind: k, x: 0, y: 0, rot: 0 as const }));
    return `(${rowExpr})(${colExpr}) = ${buildExpr(pt)}`;
  })() : null;

  const toolbarPos = (() => {
    if (!showToolbar || !selectedIds.size) return null;
    const sel = tiles.filter(t => selectedIds.has(t.id));
    if (!sel.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const t of sel) {
      const [w, h] = dims(t.kind, t.rot);
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);
      maxX = Math.max(maxX, t.x + w);
      maxY = Math.max(maxY, t.y + h);
    }
    const cx = (minX + maxX) / 2;
    const above = minY > 56;
    return { x: cx, y: above ? minY - 8 : maxY + 8, above };
  })();

  const exprDisplay = (() => {
    if (!eqMode) return buildExpr(tiles);
    const cv = canvasRef.current;
    const mid = cv ? cv.getBoundingClientRect().width / (2 * scale) : 400;
    const left = tiles.filter(t => t.x + dims(t.kind, t.rot)[0] / 2 < mid);
    const right = tiles.filter(t => t.x + dims(t.kind, t.rot)[0] / 2 >= mid);
    return `${buildExpr(left)}  =  ${buildExpr(right)}`;
  })();

  const palColsTpl = showY
    ? `${X_LEN * PAL_S}px ${Y_LEN * PAL_S}px ${UNIT * PAL_S}px`
    : `${X_LEN * PAL_S}px ${UNIT * PAL_S}px`;
  const palRowsTpl = palColsTpl;

  const renderPalGrid = (items: PalCell[]) => (
    <div style={{ display: "grid", gridTemplateColumns: palColsTpl, gridTemplateRows: palRowsTpl, gap: 2 }}>
      {items.map(({ kind, rot, row, col }) => {
        const [w, h] = dims(kind, rot);
        const minD = Math.min(w, h);
        const fs = labelFontSize(minD);
        return (
          <div key={`pal-${kind}-${rot}`}
            onPointerDown={e => onPaletteDown(e, kind, rot)}
            style={{
              gridRow: row, gridColumn: col,
              backgroundColor: COLOR[kind], borderRadius: 4,
              border: "2px solid rgba(0,0,0,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "grab", touchAction: "none",
            }}>
            {fs > 0 && (
              <span style={{
                fontSize: fs, fontWeight: 700, color: TEXT_CLR[kind], pointerEvents: "none",
                writingMode: w < h && h > 40 ? "vertical-lr" : undefined,
              }}>{LBL[kind]}</span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-blue-900 shadow-lg flex-shrink-0">
        <div className="px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
            <Home size={24} color="#fff" /><span className="text-white font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {menuOpen && (
              <BurgerMenu
                scale={scale} setScale={setScale}
                showBuilder={showBuilder} setShowBuilder={setShowBuilder}
                showExprBar={showExprBar} setShowExprBar={setShowExprBar}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Main: side panel + canvas ─────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Side panel ────────────────────────────────────────────────── */}
        <div style={{
          background: "#f5f3f0", flexShrink: 0, overflow: "hidden",
          display: "flex", flexDirection: "column", padding: 12, gap: 8,
          borderRight: "2px solid #d1d5db",
        }}>
          {/* Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Btn on={showTable} onClick={() => { setShowTable(t => !t); setOpenHdr(null); }} label="Table" />
            <Btn on={showY} onClick={() => setShowY(y => !y)} label="y" />
            <Btn on={eqMode} onClick={() => setEqMode(m => !m)} label="=" />
            <Btn on={false} onClick={doZP} label="ZP" disabled={!zpOk}
              activeColor="#dcfce7" activeText="#166534" />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <SmBtn onClick={undo} disabled={!history.length} title="Undo">
              <Undo2 size={13} color={history.length ? "#374151" : "#d1d5db"} />
            </SmBtn>
            <SmBtn onClick={clear} disabled={!tiles.length} title="Clear">
              <Trash2 size={13} color={tiles.length ? "#ef4444" : "#d1d5db"} />
            </SmBtn>
          </div>

          {/* Positive tiles */}
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Positive</div>
          {renderPalGrid(posGrid)}

          <div style={{ height: 1, background: "#d1d5db" }} />

          {/* Negative tiles */}
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Negative</div>
          {renderPalGrid(negGrid)}

          {/* Expression input */}
          {showBuilder && (
            <form style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: "auto" }}
              onSubmit={e => { e.preventDefault(); buildFromInput(); }}>
              <input type="text" value={exprInput} onChange={e => setExprInput(e.target.value)}
                placeholder={eqMode ? "2x+3 = x+5" : showY ? "x^2+2xy" : "x^2+3x+2"}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 8, boxSizing: "border-box",
                  border: "2px solid #d1d5db", background: "#fff",
                  color: "#1f2937", fontSize: 13, outline: "none",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={e => (e.currentTarget.style.borderColor = "#d1d5db")} />
              <button type="submit" disabled={!exprInput.trim()}
                style={{
                  width: "100%", padding: "6px", borderRadius: 8, fontWeight: 600,
                  fontSize: 13, border: "none", cursor: exprInput.trim() ? "pointer" : "default",
                  background: exprInput.trim() ? "#1e3a5f" : "#e5e7eb",
                  color: exprInput.trim() ? "#fff" : "#9ca3af",
                }}>Build</button>
            </form>
          )}
        </div>

        {/* ── Canvas column ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div ref={canvasRef} className="relative flex-1"
            onPointerDown={onCanvasDown}
            style={{ overflow: "hidden", touchAction: "none", background: "#f8fafc", minHeight: 200,
              cursor: drawMode ? "crosshair" : eraserMode ? "cell" : undefined }}>

            {/* ── Scaled content wrapper ────────────────────────────────── */}
            <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>

              {/* Dot grid */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <defs>
                  <pattern id="atg" width={UNIT} height={UNIT} patternUnits="userSpaceOnUse">
                    <circle cx={UNIT} cy={UNIT} r="0.8" fill="#cbd5e1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#atg)" />
              </svg>

              {eqMode && (
                <div className="absolute pointer-events-none" style={{ top: 0, bottom: 0, left: `${50 / scale}%`, transform: "translateX(-50%)", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ flex: 1, width: 2, background: "repeating-linear-gradient(to bottom, #475569 0, #475569 6px, transparent 6px, transparent 12px)" }} />
                  <div style={{ padding: "6px 10px", background: "#334155", borderRadius: 8, color: "#e2e8f0", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>=</div>
                  <div style={{ flex: 1, width: 2, background: "repeating-linear-gradient(to bottom, #475569 0, #475569 6px, transparent 6px, transparent 12px)" }} />
                </div>
              )}

              {/* ── Multiplication table ───────────────────────────────────── */}
              {showTable && (() => {
                const HDR = UNIT, ADD = 30, PAD = 3, BDW = 2, GAP = 4;
                const BD = `${BDW}px solid #334155`;
                const cornerW = HDR + PAD * 2 + BDW * 2;
                const colWidths = colHeaders.map(k => kindLen(k) + PAD * 2 + BDW);
                const rowHeights = rowHeaders.map(k => kindLen(k) + PAD * 2 + BDW);
                const totalColW = colWidths.reduce((a, b) => a + b, 0);
                const totalRowH = rowHeights.reduce((a, b) => a + b, 0);
                const gridCols = `${cornerW}px ${GAP}px ${colWidths.map(w => `${w}px`).join(" ")} ${ADD}px`;
                const gridRows = `${cornerW}px ${GAP}px ${rowHeights.map(h => `${h}px`).join(" ")} ${ADD}px`;

                const hdrPicker = (axis: "col" | "row", idx: number, current: TileKind, canRemove: boolean) => {
                  const isOpen = openHdr?.axis === axis && openHdr.idx === idx;
                  return (
                    <>
                      {isOpen && (
                        <div style={{
                          position: "absolute",
                          ...(axis === "col"
                            ? { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }
                            : { top: "50%", left: "calc(100% + 8px)", transform: "translateY(-50%)" }),
                          zIndex: 300, display: "flex", alignItems: "center", gap: 3,
                          padding: 5, background: "#1e293b", borderRadius: 10,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                        }}>
                          {headerKinds.map(hk => (
                            <button key={hk} onClick={e => {
                              e.stopPropagation();
                              if (axis === "col") setColHeaders(h => h.map((k, i) => i === idx ? hk : k));
                              else setRowHeaders(h => h.map((k, i) => i === idx ? hk : k));
                              setOpenHdr(null);
                            }}
                              style={{
                                width: 34, height: 34, background: COLOR[hk], borderRadius: 6,
                                border: current === hk ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", padding: 0, flexShrink: 0,
                              }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_CLR[hk] }}>{LBL[hk]}</span>
                            </button>
                          ))}
                          {canRemove && (
                            <>
                              <div style={{ width: 1, height: 24, background: "#475569", flexShrink: 0 }} />
                              <button onClick={e => {
                                e.stopPropagation();
                                if (axis === "col") setColHeaders(h => h.filter((_, i) => i !== idx));
                                else setRowHeaders(h => h.filter((_, i) => i !== idx));
                                setOpenHdr(null);
                              }}
                                style={{
                                  width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                                  border: "none", borderRadius: 6, cursor: "pointer", padding: 0, flexShrink: 0,
                                  background: "rgba(239,68,68,0.15)",
                                }}><Trash2 size={15} color="#fca5a5" /></button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  );
                };

                return (
                  <div ref={tableRef} style={{
                    position: "absolute",
                    ...(tablePos
                      ? { left: tablePos.x, top: tablePos.y }
                      : { left: `${50 / scale}%`, top: `${40 / scale}%` }),
                    transform: "translate(-50%, -50%)", zIndex: 5,
                    outline: tableSelected ? "2px dashed #3b82f6" : "none",
                    outlineOffset: 8,
                    cursor: tableSelected ? (tableDragging ? "grabbing" : "grab") : "default",
                  }}
                    onPointerDown={onTableDown}>

                    {openHdr && (
                      <div style={{ position: "fixed", inset: 0, zIndex: 5 }}
                        onClick={() => setOpenHdr(null)} />
                    )}

                    {/* Delete bin — shown when the table is lasso-selected */}
                    {tableSelected && (
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={deleteTable}
                        title="Delete table"
                        style={{
                          position: "absolute", top: -46, right: -10, zIndex: 250,
                          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                          background: "#1e293b", border: "none", borderRadius: 9, cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                        }}>
                        <Trash2 size={17} color="#fca5a5" />
                      </button>
                    )}

                    <div style={{
                      position: "relative", zIndex: 10,
                      display: "grid", gridTemplateColumns: gridCols, gridTemplateRows: gridRows,
                      gap: 0,
                    }}>
                      {/* Corner cell */}
                      <div onClick={() => {
                        if (tableMovedRef.current) return;
                        if (tableRevealed) { setTableRevealed(false); setRevealedCells(new Set()); }
                        else setTableRevealed(true);
                      }}
                        style={{
                          gridRow: 1, gridColumn: 1, background: "#e2e8f0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", gap: 2, padding: 1,
                          borderTop: BD, borderLeft: BD, borderRight: BD, borderBottom: BD,
                          borderTopLeftRadius: 6,
                        }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#475569" }}>×</span>
                        {tableRevealed
                          ? <EyeOff size={10} color="#64748b" />
                          : <Eye size={10} color="#64748b" />}
                      </div>

                      {/* Tramline = header's own far wall (already drawn on the header
                          cells) + the GAP column/row + the leading wall of the first
                          product cell (added below). No extra grey lines needed. */}

                      {/* Column headers */}
                      {colHeaders.map((k, c) => (
                        <div key={`ch-${c}`}
                          onClick={() => { if (tableMovedRef.current) return; setOpenHdr(prev =>
                            prev?.axis === "col" && prev.idx === c ? null : { axis: "col", idx: c }); }}
                          style={{
                            gridRow: 1, gridColumn: c + 3, position: "relative",
                            background: "#f1f5f9", cursor: "pointer", padding: PAD,
                            display: "flex",
                            borderTop: BD, borderRight: BD, borderBottom: BD,
                            ...(c === 0 ? { borderLeft: BD } : null),
                          }}>
                          <div style={{
                            flex: 1, background: COLOR[k], borderRadius: 3,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: TEXT_CLR[k] }}>{LBL[k]}</span>
                          </div>
                          {hdrPicker("col", c, k, colHeaders.length > 1)}
                        </div>
                      ))}

                      {/* Add column button */}
                      <button onClick={() => {
                        if (tableMovedRef.current) return;
                        const ni = colHeaders.length;
                        setColHeaders(h => [...h, "1"]);
                        setOpenHdr({ axis: "col", idx: ni });
                      }}
                        style={{
                          gridRow: 1, gridColumn: colHeaders.length + 3,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(148,163,184,0.08)", cursor: "pointer",
                          border: "1px dashed #94a3b8", borderRadius: 6, padding: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(148,163,184,0.2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(148,163,184,0.08)")}
                      ><Plus size={14} color="#94a3b8" /></button>

                      {/* Row headers */}
                      {rowHeaders.map((k, r) => (
                        <div key={`rh-${r}`}
                          onClick={() => { if (tableMovedRef.current) return; setOpenHdr(prev =>
                            prev?.axis === "row" && prev.idx === r ? null : { axis: "row", idx: r }); }}
                          style={{
                            gridRow: r + 3, gridColumn: 1, position: "relative",
                            background: "#f1f5f9", cursor: "pointer", padding: PAD,
                            display: "flex",
                            borderLeft: BD, borderRight: BD, borderBottom: BD,
                            ...(r === 0 ? { borderTop: BD } : null),
                          }}>
                          <div style={{
                            flex: 1, background: COLOR[k], borderRadius: 3,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{
                              fontSize: 15, fontWeight: 700, color: TEXT_CLR[k],
                              writingMode: kindLen(k) > 40 ? "vertical-lr" : undefined,
                            }}>{LBL[k]}</span>
                          </div>
                          {hdrPicker("row", r, k, rowHeaders.length > 1)}
                        </div>
                      ))}

                      {/* Add row button */}
                      <button onClick={() => {
                        if (tableMovedRef.current) return;
                        const ni = rowHeaders.length;
                        setRowHeaders(h => [...h, "1"]);
                        setOpenHdr({ axis: "row", idx: ni });
                      }}
                        style={{
                          gridRow: rowHeaders.length + 3, gridColumn: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(148,163,184,0.08)", cursor: "pointer",
                          border: "1px dashed #94a3b8", borderRadius: 6, padding: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(148,163,184,0.2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(148,163,184,0.08)")}
                      ><Plus size={14} color="#94a3b8" /></button>

                      {/* Product cells */}
                      {rowHeaders.map((rk, r) =>
                        colHeaders.map((ck, c) => {
                          const pk = multiplyKinds(rk, ck);
                          const cellKey = `${r}-${c}`;
                          const isRevealed = tableRevealed || revealedCells.has(cellKey);
                          const cw = kindLen(ck), rh = kindLen(rk);
                          const minD = Math.min(cw, rh);
                          const fs = labelFontSize(minD);
                          return (
                            <div key={`p-${r}-${c}`}
                              onClick={() => {
                                if (tableMovedRef.current) return;
                                if (!tableRevealed) {
                                  setRevealedCells(s => {
                                    const n = new Set(s);
                                    if (n.has(cellKey)) n.delete(cellKey); else n.add(cellKey);
                                    return n;
                                  });
                                }
                              }}
                              style={{
                                gridRow: r + 3, gridColumn: c + 3,
                                background: "#fff", padding: PAD,
                                display: "flex", cursor: "pointer",
                                borderRight: BD, borderBottom: BD,
                                ...(c === 0 ? { borderLeft: BD } : null),
                                ...(r === 0 ? { borderTop: BD } : null),
                              }}>
                              <div data-product-cell={`${r}-${c}`} style={{
                                flex: 1, borderRadius: 3,
                                background: isRevealed ? COLOR[pk] : "rgba(148,163,184,0.08)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.2s ease",
                              }}>
                                {isRevealed && fs > 0 && (
                                  <span style={{
                                    fontSize: fs, fontWeight: 700, color: TEXT_CLR[pk],
                                    writingMode: cw < rh && rh > 30 ? "vertical-lr" : undefined,
                                  }}>{LBL[pk]}</span>
                                )}
                                {!isRevealed && (
                                  <span style={{ fontSize: 10, color: "#cbd5e1" }}>?</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Curly braces for column and row expressions */}
                    {tableRevealed && (
                      <>
                        {/* Column brace — above column headers */}
                        <div style={{
                          position: "absolute", top: -34,
                          left: cornerW + GAP, width: totalColW,
                          display: "flex", flexDirection: "column", alignItems: "center",
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 2, whiteSpace: "nowrap" }}>
                            {colExpr}
                          </span>
                          <svg width={totalColW} height={14} viewBox={`0 0 ${totalColW} 14`} style={{ display: "block" }}>
                            <path d={`M 0 14 Q 0 7 ${totalColW * 0.25} 7 Q ${totalColW * 0.5} 7 ${totalColW * 0.5} 0 Q ${totalColW * 0.5} 7 ${totalColW * 0.75} 7 Q ${totalColW} 7 ${totalColW} 14`}
                              fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>

                        {/* Row brace — left of row headers */}
                        <div style={{
                          position: "absolute", left: -34,
                          top: cornerW + GAP, height: totalRowH,
                          display: "flex", alignItems: "center",
                        }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: "#334155",
                            writingMode: "vertical-lr", transform: "rotate(180deg)",
                            marginRight: 2, whiteSpace: "nowrap",
                          }}>
                            {rowExpr}
                          </span>
                          <svg width={14} height={totalRowH} viewBox={`0 0 14 ${totalRowH}`} style={{ display: "block" }}>
                            <path d={`M 14 0 Q 7 0 7 ${totalRowH * 0.25} Q 7 ${totalRowH / 2} 0 ${totalRowH / 2} Q 7 ${totalRowH / 2} 7 ${totalRowH * 0.75} Q 7 ${totalRowH} 14 ${totalRowH}`}
                              fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </>
                    )}

                    {tableRevealed && tableExpr && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#475569", fontWeight: 600, textAlign: "center" }}>
                        {tableExpr}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Placed tiles */}
              {tiles.map(tile => {
                const [w, h] = dims(tile.kind, tile.rot);
                const active = dragId === tile.id;
                const selected = selectedIds.has(tile.id);
                const minD = Math.min(w, h);
                const fs = labelFontSize(minD);
                return (
                  <div key={tile.id}
                    onPointerDown={e => onTileDown(e, tile)}
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

              {/* ── Floating toolbar ──────────────────────────────────────────── */}
              {toolbarPos && (
                <div onPointerDown={e => e.stopPropagation()}
                  style={{
                    position: "absolute", left: toolbarPos.x, top: toolbarPos.y,
                    transform: toolbarPos.above ? "translate(-50%, -100%)" : "translateX(-50%)",
                    zIndex: 200, display: "flex", alignItems: "center", gap: 2,
                    padding: "3px 5px", background: "#1e293b", borderRadius: 10,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                  }}>
                  <TBBtn onClick={() => duplicateDir(-1, 0)} title="Duplicate left"><ArrowLeft size={16} color="#e2e8f0" /></TBBtn>
                  <TBBtn onClick={() => duplicateDir(0, -1)} title="Duplicate up"><ArrowUp size={16} color="#e2e8f0" /></TBBtn>
                  <TBBtn onClick={() => duplicateDir(0, 1)} title="Duplicate down"><ArrowDown size={16} color="#e2e8f0" /></TBBtn>
                  <TBBtn onClick={() => duplicateDir(1, 0)} title="Duplicate right"><ArrowRight size={16} color="#e2e8f0" /></TBBtn>
                  <div style={{ width: 1, height: 22, background: "#475569", margin: "0 2px" }} />
                  {anyRotatable && (
                    <TBBtn onClick={rotateSelected} title="Rotate"><RotateCw size={16} color="#e2e8f0" /></TBBtn>
                  )}
                  <TBBtn onClick={flipSelected} title="Flip sign (±)">
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0", lineHeight: 1 }}>±</span>
                  </TBBtn>
                  <TBBtn onClick={deleteSelected} title="Delete">
                    <Trash2 size={16} color="#fca5a5" />
                  </TBBtn>
                </div>
              )}

              {/* Lasso selection rectangle */}
              {lasso && (
                <div style={{
                  position: "absolute",
                  left: Math.min(lasso.x1, lasso.x2),
                  top: Math.min(lasso.y1, lasso.y2),
                  width: Math.abs(lasso.x2 - lasso.x1),
                  height: Math.abs(lasso.y2 - lasso.y1),
                  border: "1.5px dashed #3b82f6",
                  background: "rgba(59,130,246,0.08)",
                  borderRadius: 2,
                  pointerEvents: "none",
                  zIndex: 50,
                }} />
              )}

              {/* Drawing strokes */}
              {strokes.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 60 }}>
                  {strokes.map((s, i) => (
                    <polyline key={i}
                      points={s.points.map(p => `${p.x},${p.y}`).join(" ")}
                      fill="none" stroke={s.color} strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                </svg>
              )}

            </div>{/* end scaled wrapper */}

            {/* Empty state — outside scale wrapper for proper centering */}
            {tiles.length === 0 && dragId === null && !showTable && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
                <div className="text-center" style={{ color: "#94a3b8" }}>
                  <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Drag tiles from the panel</p>
                  <p style={{ fontSize: 13, margin: 0 }}>or type an expression and click Build</p>
                </div>
              </div>
            )}

            {/* ── Floating draw hotbar ──────────────────────────────────────── */}
            <DrawHotbar
              drawMode={drawMode} eraserMode={eraserMode}
              penColor={penColor} setPenColor={setPenColor}
              hasStrokes={strokes.length > 0}
              onCursor={() => { setDrawMode(false); setEraserMode(false); }}
              onPen={() => { setDrawMode(true); setEraserMode(false); }}
              onEraser={() => { setEraserMode(true); setDrawMode(false); }}
              onClearBoard={() => setStrokes([])}
            />
          </div>

          {/* ── Expression bar ──────────────────────────────────────────────── */}
          {showExprBar && (
            <div className="flex items-center justify-center gap-3 px-4 py-2 flex-shrink-0"
              style={{ background: "#f5f3f0", borderTop: "2px solid #d1d5db" }}>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Expression:</span>
              <span className="font-bold" style={{ fontSize: 18, letterSpacing: 0.5, color: "#1f2937" }}>
                {exprDisplay}
              </span>
              {tiles.length > 0 && (
                <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>
                  ({tiles.length} tile{tiles.length !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function Btn({ on, onClick, label, disabled, activeColor, activeText }: {
  on: boolean; onClick: () => void; label: string; disabled?: boolean;
  activeColor?: string; activeText?: string;
}) {
  const ac = activeColor || "#dbeafe";
  const at = activeText || "#1e40af";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: "4px 10px", borderRadius: 8, fontWeight: 600,
        fontSize: 13, border: "2px solid " + (disabled ? "#e5e7eb" : on ? "#93c5fd" : "#d1d5db"),
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "#f3f4f6" : on ? ac : "#fff",
        color: disabled ? "#d1d5db" : on ? at : "#374151",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}>
      {label}
    </button>
  );
}

function SmBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        border: "2px solid " + (disabled ? "#e5e7eb" : "#d1d5db"), borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "#f3f4f6" : "#fff",
        transition: "background 0.15s", padding: 0, flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={e => { e.currentTarget.style.background = disabled ? "#f3f4f6" : "#fff"; }}>
      {children}
    </button>
  );
}

function DrawHotbar({
  drawMode, eraserMode, penColor, setPenColor, hasStrokes,
  onCursor, onPen, onEraser, onClearBoard,
}: {
  drawMode: boolean; eraserMode: boolean;
  penColor: string; setPenColor: (c: string) => void; hasStrokes: boolean;
  onCursor: () => void; onPen: () => void; onEraser: () => void; onClearBoard: () => void;
}) {
  const cursorActive = !drawMode && !eraserMode;
  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 150, display: "flex", alignItems: "center", gap: 4,
        padding: "6px 8px", background: "#2d3340", borderRadius: 14,
        boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      }}>
      <HotBtn active={cursorActive} onClick={onCursor} title="Select">
        <MousePointer2 size={18} color="#e2e8f0" />
      </HotBtn>
      <HotBtn active={drawMode} onClick={onPen} title="Pen">
        <Pencil size={18} color="#e2e8f0" />
      </HotBtn>
      <HotBtn active={eraserMode} onClick={onEraser} title="Eraser">
        <Eraser size={18} color="#e2e8f0" />
      </HotBtn>
      <HotBtn active={false} onClick={onClearBoard} title="Clear all drawings" disabled={!hasStrokes}>
        <Trash2 size={18} color={hasStrokes ? "#fca5a5" : "#64748b"} />
      </HotBtn>

      <div style={{ width: 1, height: 26, background: "#475569", margin: "0 2px" }} />

      {/* Pen colours */}
      {PEN_COLORS.map(c => (
        <button key={c}
          onClick={() => { setPenColor(c); onPen(); }}
          title="Pen colour"
          style={{
            width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
            padding: 0, flexShrink: 0,
            border: penColor === c ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.2)",
            boxShadow: penColor === c ? "0 0 0 2px rgba(255,255,255,0.25)" : "none",
            transition: "border-color 0.12s, box-shadow 0.12s",
          }} />
      ))}
    </div>
  );
}

function HotBtn({ active, disabled, onClick, title, children }: {
  active: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      style={{
        width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 10, padding: 0, flexShrink: 0,
        cursor: disabled ? "default" : "pointer",
        background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)",
        transition: "background 0.12s",
      }}
      onPointerEnter={e => { if (!disabled && !active) e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
      onPointerLeave={e => { e.currentTarget.style.background = active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)"; }}>
      {children}
    </button>
  );
}

function TBBtn({ onClick, title, children }: {
  onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 7, cursor: "pointer",
        background: "rgba(255,255,255,0.06)", transition: "background 0.12s",
      }}
      onPointerEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
      onPointerLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
      {children}
    </button>
  );
}

function BurgerMenu({ scale, setScale, showBuilder, setShowBuilder, showExprBar, setShowExprBar, onClose }: {
  scale: number; setScale: (fn: (s: number) => number) => void;
  showBuilder: boolean; setShowBuilder: (v: boolean) => void;
  showExprBar: boolean; setShowExprBar: (v: boolean) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: 220 }}>
      <div className="py-1">
        {/* Zoom */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Zoom</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
              className="hover:bg-gray-100 transition-colors"
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
              <Minus size={14} color="#374151" />
            </button>
            <span className="text-sm font-semibold text-gray-600" style={{ minWidth: 36, textAlign: "center" }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
              className="hover:bg-gray-100 transition-colors"
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
              <Plus size={14} color="#374151" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        {/* Expression Builder toggle */}
        <button onClick={() => setShowBuilder(!showBuilder)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}>
          <span>Expression Builder</span>
          <TogglePill on={showBuilder} />
        </button>

        {/* Expression Bar toggle */}
        <button onClick={() => setShowExprBar(!showExprBar)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}>
          <span>Expression Summary</span>
          <TogglePill on={showExprBar} />
        </button>
      </div>
    </div>
  );
}

function TogglePill({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 36, height: 20, borderRadius: 10, padding: 2,
      background: on ? "#1e40af" : "#d1d5db",
      transition: "background 0.15s", cursor: "pointer", flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 8, background: "#fff",
        transition: "transform 0.15s",
        transform: on ? "translateX(16px)" : "translateX(0)",
      }} />
    </div>
  );
}
