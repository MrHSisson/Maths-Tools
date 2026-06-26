import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Trash2, Undo2, RotateCw, Plus, Minus, Eye, EyeOff,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Menu, X,
  Pencil, Eraser, MousePointer2, Hand,
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

// A single multiplication grid on the board. The tool can hold any number of
// these — each is independently positioned, revealed and edited.
interface TableState {
  id: number;
  colHeaders: TileKind[];
  rowHeaders: TileKind[];
  pos: { x: number; y: number };      // logical-coord centre on the board
  revealed: boolean;                  // "reveal all" toggle
  revealedCells: Set<string>;         // per-cell reveal keys, "r-c"
}

// ── Constants ────────────────────────────────────────────────────────────────

const UNIT = 22;
const X_LEN = 92;
const Y_LEN = 70;
const SNAP = 2;
const EDGE_SNAP = 14;
let nextId = 1;
let nextTableId = 1;

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

// Smooth a freehand stroke into an SVG path: a quadratic curve through the
// midpoint of each pair of points rounds off the polyline so writing flows
// instead of looking jagged.
const strokePath = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
};

// Every negative tile is red, matching the back of physical algebra-tile
// manipulatives (tell them apart by size/shape, not colour).
const NEG_RED = "#ef4444";
const COLOR: Record<TileKind, string> = {
  "x2": "#3b82f6", "-x2": NEG_RED,
  "x": "#22c55e", "-x": NEG_RED,
  "1": "#facc15", "-1": NEG_RED,
  "y2": "#06b6d4", "-y2": NEG_RED,
  "y": "#84cc16", "-y": NEG_RED,
  "xy": "#6366f1", "-xy": NEG_RED,
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

// How many terms an expression collapses to (after combining like tiles).
// Used to decide whether a factor needs brackets: 3x -> 1, 2x+1 -> 2.
const termCount = (tiles: TileState[]): number => {
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
  return [x2, xy, y2, x1, y1, c].filter(v => v !== 0).length;
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
  const [tables, setTables] = useState<TableState[]>([]);
  const [openHdr, setOpenHdr] = useState<{ tableId: number; axis: "col" | "row"; idx: number } | null>(null);
  // Which table's settings menu (× corner) is open, or null.
  const [tableMenuOpen, setTableMenuOpen] = useState<number | null>(null);
  // Which table is currently lasso-selected (draggable / deletable), or null.
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableDragging, setTableDragging] = useState(false);
  const [scale, setScale] = useState(1);
  // Pan offset in *screen* px (applied as translate before scale, so it is
  // independent of the zoom level). Lets the whole canvas be dragged around.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [panning, setPanning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBuilder, setShowBuilder] = useState(true);
  const [showExprBar, setShowExprBar] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // The stroke currently being drawn. Kept separate from `strokes` so an
  // in-progress line re-renders on its own without copying/redrawing every
  // committed stroke each pointer move — that keeps writing fluid.
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const drawingRef = useRef<{ x: number; y: number }[] | null>(null);
  const rafRef = useRef<number | null>(null);
  // Pending long-press on a table's × corner (lets you pick the table up and
  // drag it without lasso-selecting first).
  const longPressRef = useRef<{ timer: number; sx: number; sy: number; fired: boolean } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const tableDragRef = useRef<{ tableId: number; sx: number; sy: number; cx: number; cy: number } | null>(null);
  const tableMovedRef = useRef(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const panRef = useRef(pan);
  panRef.current = pan;
  const panDragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const tablesRef = useRef(tables);
  tablesRef.current = tables;
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

  const addTable = useCallback(() => {
    const cv = canvasRef.current;
    let cx = 220, cy = 170;
    if (cv) {
      const r = cv.getBoundingClientRect();
      cx = (r.width / 2 - panRef.current.x) / scaleRef.current;
      cy = (r.height * 0.4 - panRef.current.y) / scaleRef.current;
    }
    setTables(tbls => {
      const off = tbls.length * 28;   // cascade so new tables don't stack exactly
      return [...tbls, {
        id: nextTableId++,
        // A new table starts genuinely blank — the teacher adds rows/columns
        // with the + buttons. No pre-filled x row/column.
        colHeaders: [],
        rowHeaders: [],
        pos: { x: cx + off, y: cy + off },
        revealed: false,
        revealedCells: new Set<string>(),
      }];
    });
    setOpenHdr(null);
    setTableMenuOpen(null);
  }, []);

  // Reset a table back to blank (no headers, nothing revealed) without removing
  // it from the board.
  const clearTable = useCallback((id: number) => {
    setTables(tbls => tbls.map(t => t.id === id
      ? { ...t, colHeaders: [], rowHeaders: [], revealed: false, revealedCells: new Set<string>() }
      : t));
    setOpenHdr(o => (o && o.tableId === id ? null : o));
  }, []);

  const deleteTable = useCallback((id: number) => {
    setTables(tbls => tbls.filter(t => t.id !== id));
    setSelectedTableId(s => (s === id ? null : s));
    setOpenHdr(o => (o && o.tableId === id ? null : o));
    setTableMenuOpen(m => (m === id ? null : m));
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedTableId !== null) { e.preventDefault(); deleteTable(selectedTableId); return; }
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
  }, [undo, selectedIds, deleteSelected, flipSelected, rotateSelected, duplicateDir, selectedTableId, deleteTable]);

  // ── Global drag listeners ──────────────────────────────────────────────

  useEffect(() => {
    if (dragId === null) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const s = scaleRef.current;
      const p = panRef.current;
      const r = cv.getBoundingClientRect();
      const rawX = (e.clientX - r.left - p.x) / s - d.ox;
      const rawY = (e.clientY - r.top - p.y) / s - d.oy;

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
        if (d.lastKind != null && d.lastX != null && d.lastY != null && tablesRef.current.length) {
          const cvEl = canvasRef.current;
          if (cvEl) {
            const cr = cvEl.getBoundingClientRect();
            const sc = scaleRef.current;
            const [tw, th] = dims(d.lastKind, d.lastRot ?? 0);

            const cells = cvEl.querySelectorAll<HTMLElement>("[data-product-cell]");
            for (const cell of cells) {
              // data-product-cell is "tableId:r-c"
              const [tIdStr, rc] = cell.getAttribute("data-product-cell")!.split(":");
              const tId = Number(tIdStr);
              const [ri, ci] = rc.split("-").map(Number);
              const tbl = tablesRef.current.find(t => t.id === tId);
              if (!tbl) continue;
              if (tbl.revealed || tbl.revealedCells.has(rc)) continue;
              if (d.lastKind !== multiplyKinds(tbl.rowHeaders[ri], tbl.colHeaders[ci])) continue;

              const br = cell.getBoundingClientRect();
              const ix = (br.left - cr.left - panRef.current.x) / sc;
              const iy = (br.top - cr.top - panRef.current.y) / sc;
              const iw = br.width / sc;
              const ih = br.height / sc;

              const ox = Math.max(0, Math.min(d.lastX + tw, ix + iw) - Math.max(d.lastX, ix));
              const oy = Math.max(0, Math.min(d.lastY! + th, iy + ih) - Math.max(d.lastY!, iy));
              if ((ox * oy) / (iw * ih) >= 0.8) {
                setTiles(ts => ts.filter(t => t.id !== d.id));
                setTables(tbls => tbls.map(t => t.id === tId
                  ? { ...t, revealedCells: new Set(t.revealedCells).add(rc) }
                  : t));
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
      const p = panRef.current;
      const x2 = (e.clientX - r.left - p.x) / s;
      const y2 = (e.clientY - r.top - p.y) / s;
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

      // Select a table if the lasso covers most of it (best match wins).
      const cv = canvasRef.current;
      if (cv) {
        const r = cv.getBoundingClientRect();
        const s = scaleRef.current;
        const p = panRef.current;
        let bestId: number | null = null;
        let bestFrac = 0;
        cv.querySelectorAll<HTMLElement>("[data-table-id]").forEach(el => {
          const id = Number(el.getAttribute("data-table-id"));
          const tr = el.getBoundingClientRect();
          const tx = (tr.left - r.left - p.x) / s, ty = (tr.top - r.top - p.y) / s;
          const tw = tr.width / s, th = tr.height / s;
          const ox = Math.max(0, Math.min(lx + lw, tx + tw) - Math.max(lx, tx));
          const oy = Math.max(0, Math.min(ly + lh, ty + th) - Math.max(ly, ty));
          const frac = tw * th > 0 ? (ox * oy) / (tw * th) : 0;
          if (frac >= 0.6 && frac > bestFrac) { bestFrac = frac; bestId = id; }
        });
        setSelectedTableId(bestId);
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
  const penColorRef = useRef(penColor);
  penColorRef.current = penColor;

  // Subscribed once; the handlers read live state through refs, so they never
  // need re-attaching mid-stroke (which used to churn on every points update).
  useEffect(() => {
    const flushLive = () => {
      rafRef.current = null;
      if (drawingRef.current) setLiveStroke({ color: penColorRef.current, points: drawingRef.current.slice() });
    };
    const scheduleLive = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(flushLive);
    };

    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const cv = canvasRef.current;
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      const s = scaleRef.current;
      const p = panRef.current;
      const toLocal = (cx: number, cy: number) => ({ x: (cx - r.left - p.x) / s, y: (cy - r.top - p.y) / s });
      // Coalesced events recover the high-frequency points the browser merged
      // into one move — denser samples make the line smoother.
      const evs = e.getCoalescedEvents?.().length ? e.getCoalescedEvents() : [e];

      if (eraserModeRef.current) {
        for (const ev of evs) { const { x, y } = toLocal(ev.clientX, ev.clientY); setStrokes(prev => eraseNear(prev, x, y)); }
        return;
      }
      for (const ev of evs) drawingRef.current.push(toLocal(ev.clientX, ev.clientY));
      scheduleLive();
    };

    const onUp = () => {
      if (!drawingRef.current) return;
      const pts = drawingRef.current;
      drawingRef.current = null;
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setLiveStroke(null);
      // Commit the finished line (drawn strokes only; eraser mutates as it goes).
      if (!eraserModeRef.current && pts.length >= 2) {
        const col = penColorRef.current;
        setStrokes(prev => [...prev, { color: col, points: pts }]);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // ── Table dragging (after lasso-selecting the whole table) ──────────────

  useEffect(() => {
    if (!tableDragging) return;

    const onMove = (e: PointerEvent) => {
      const d = tableDragRef.current;
      const cv = canvasRef.current;
      if (!d || !cv) return;
      const r = cv.getBoundingClientRect();
      const s = scaleRef.current;
      const p = panRef.current;
      const px = (e.clientX - r.left - p.x) / s;
      const py = (e.clientY - r.top - p.y) / s;
      const dx = px - d.sx, dy = py - d.sy;
      if (!tableMovedRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        tableMovedRef.current = true;
      }
      setTables(tbls => tbls.map(t => t.id === d.tableId ? { ...t, pos: { x: d.cx + dx, y: d.cy + dy } } : t));
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

  // ── Panning the whole canvas (grab tool) ────────────────────────────────

  useEffect(() => {
    if (!panning) return;

    const onMove = (e: PointerEvent) => {
      const d = panDragRef.current;
      if (!d) return;
      setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) });
    };

    const onUp = () => {
      panDragRef.current = null;
      setPanning(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [panning]);

  const onTableDown = (e: React.PointerEvent, table: TableState) => {
    // In pan mode, let the press fall through to the canvas so it pans the
    // whole board (including this table) instead of moving the table alone.
    if (panMode) return;
    e.stopPropagation();
    // Reset on every fresh press so a stale "moved" flag from an earlier drag
    // can never keep blocking clicks (add side / reveal / etc.).
    tableMovedRef.current = false;
    if (selectedTableId !== table.id) return;
    const cv = canvasRef.current;
    const tEl = e.currentTarget as HTMLElement;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const s = scaleRef.current;
    const p = panRef.current;
    const tr = tEl.getBoundingClientRect();
    tableDragRef.current = {
      tableId: table.id,
      sx: (e.clientX - r.left - p.x) / s,
      sy: (e.clientY - r.top - p.y) / s,
      cx: (tr.left + tr.width / 2 - r.left - p.x) / s,
      cy: (tr.top + tr.height / 2 - r.top - p.y) / s,
    };
    setTableDragging(true);
  };

  // Long-press the × corner of an *unselected* table to pick it up and drag it
  // straight away — no lasso needed. A short press still toggles the settings
  // menu; a selected table already drags from anywhere via onTableDown.
  const LONGPRESS_MS = 400;
  const onCornerDown = (e: React.PointerEvent, table: TableState) => {
    if (panMode) return;                          // let the board pan
    if (selectedTableId === table.id) return;     // already draggable via onTableDown
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const sx = (e.clientX - r.left - panRef.current.x) / scaleRef.current;
    const sy = (e.clientY - r.top - panRef.current.y) / scaleRef.current;

    const cleanup = () => {
      longPressRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const lp = longPressRef.current;
      if (!lp || lp.fired) return;
      const mx = (ev.clientX - r.left - panRef.current.x) / scaleRef.current;
      const my = (ev.clientY - r.top - panRef.current.y) / scaleRef.current;
      // Moving away before the hold completes means it wasn't a long-press.
      if (Math.hypot(mx - lp.sx, my - lp.sy) > 8) { clearTimeout(lp.timer); cleanup(); }
    };
    const onUp = () => {
      const lp = longPressRef.current;
      if (lp && !lp.fired) clearTimeout(lp.timer);
      cleanup();
    };

    const timer = window.setTimeout(() => {
      const lp = longPressRef.current;
      if (!lp) return;
      lp.fired = true;
      tableMovedRef.current = true;   // suppress the menu-toggle click on release
      tableDragRef.current = { tableId: table.id, sx, sy, cx: table.pos.x, cy: table.pos.y };
      setSelectedTableId(table.id);
      setTableMenuOpen(null);
      setTableDragging(true);
    }, LONGPRESS_MS);
    longPressRef.current = { timer, sx, sy, fired: false };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onCanvasDown = (e: React.PointerEvent) => {
    setOpenHdr(null);
    if (dragId !== null) return;
    const cv = canvasRef.current;
    if (!cv) return;

    // Pan / grab tool: drag the whole board (screen-space delta).
    if (panMode) {
      panDragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
      setPanning(true);
      return;
    }

    const r = cv.getBoundingClientRect();
    const s = scaleRef.current;
    const x = (e.clientX - r.left - pan.x) / s;
    const y = (e.clientY - r.top - pan.y) / s;

    if (drawMode || eraserMode) {
      drawingRef.current = [{ x, y }];
      if (eraserMode) setStrokes(prev => eraseNear(prev, x, y));
      else setLiveStroke({ color: penColor, points: [{ x, y }] });
      return;
    }

    lassoRef.current = { x1: x, y1: y };
    setLasso({ x1: x, y1: y, x2: x, y2: y });
    setSelectedIds(new Set());
    setSelectedTableId(null);
    setShowToolbar(false);
  };

  const onPaletteDown = (e: React.PointerEvent, kind: TileKind, rot: 0 | 90 = 0) => {
    e.preventDefault();
    setTableMenuOpen(null);
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const [w, h] = dims(kind, rot);
    const id = nextId++;
    const rx = Math.round(((e.clientX - r.left - pan.x) / scale - w / 2) / SNAP) * SNAP;
    const ry = Math.round(((e.clientY - r.top - pan.y) / scale - h / 2) / SNAP) * SNAP;
    const tile: TileState = { id, kind, x: rx, y: ry, rot };
    const sel = new Set([id]);
    setSelectedIds(sel);
    setShowToolbar(false);
    setTiles(ts => [...ts, tile]);
    startDrag(id, w / 2, h / 2, sel, false, tile);
  };

  const onTileDown = (e: React.PointerEvent, tile: TileState) => {
    if (panMode) return;  // let the press pan the board instead of grabbing a tile
    e.preventDefault();
    e.stopPropagation();
    setTableMenuOpen(null);
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
    startDrag(tile.id, (e.clientX - r.left - pan.x) / scale - tile.x, (e.clientY - r.top - pan.y) / scale - tile.y, sel, wasSelected);
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

  // When y is switched off, fold any y headers in every table back to x.
  useEffect(() => {
    if (showY) return;
    const fold = (h: TileKind[]) => h.map(k => k === "y" ? "x" as TileKind : k === "-y" ? "-x" as TileKind : k);
    setTables(tbls => tbls.map(t => ({ ...t, colHeaders: fold(t.colHeaders), rowHeaders: fold(t.rowHeaders) })));
  }, [showY]);

  const headerKinds: TileKind[] = showY
    ? ["x", "y", "1", "-x", "-y", "-1"]
    : ["x", "1", "-x", "-1"];
  const factorExpr = (kinds: TileKind[]) => {
    const t = kinds.map((k, i) => ({ id: -(i + 1), kind: k, x: 0, y: 0, rot: 0 as const }));
    return buildExpr(t);
  };
  // Column / row factor strings and the full product expression for one table.
  const tableExprs = (colHeaders: TileKind[], rowHeaders: TileKind[]) => {
    const colExpr = factorExpr(colHeaders);
    const rowExpr = factorExpr(rowHeaders);
    const products: TileKind[] = [];
    for (const rk of rowHeaders) for (const ck of colHeaders) products.push(multiplyKinds(rk, ck));
    const pt = products.map((k, i) => ({ id: -(i + 1), kind: k, x: 0, y: 0, rot: 0 as const }));
    const toTiles = (ks: TileKind[]) => ks.map((k, i) => ({ id: -(i + 1), kind: k, x: 0, y: 0, rot: 0 as const }));
    const rowN = termCount(toTiles(rowHeaders));
    const colN = termCount(toTiles(colHeaders));
    // Only bracket a factor when it has more than one term: 3x(2x+1), but
    // (x+1)(x+3). Two single-term factors get an explicit × to stay readable.
    const rowStr = rowN > 1 ? `(${rowExpr})` : `${rowExpr}`;
    const colStr = colN > 1 ? `(${colExpr})` : `${colExpr}`;
    const sep = rowN > 1 || colN > 1 ? "" : " × ";
    const tableExpr = `${rowStr}${sep}${colStr} = ${buildExpr(pt)}`;
    return { colExpr, rowExpr, tableExpr };
  };

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
                onResetView={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
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
            <Btn on={false} onClick={addTable} label="+ Table" />
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
              cursor: panMode ? (panning ? "grabbing" : "grab") : (drawMode || eraserMode) ? "none" : undefined }}>

            {/* ── Pan + scale content wrapper ───────────────────────────── */}
            <div style={{ position: "absolute", inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}>

              {/* Dot grid — oversized so the board feels endless while panning */}
              <svg style={{ position: "absolute", left: -4000, top: -4000, width: 8000, height: 8000, pointerEvents: "none", zIndex: 1 }}>
                <defs>
                  <pattern id="atg" width={UNIT} height={UNIT} patternUnits="userSpaceOnUse">
                    <circle cx={UNIT} cy={UNIT} r="0.8" fill="#cbd5e1" />
                  </pattern>
                </defs>
                <rect width="8000" height="8000" fill="url(#atg)" />
              </svg>

              {eqMode && (
                <div className="absolute pointer-events-none" style={{ top: 0, bottom: 0, left: `${50 / scale}%`, transform: "translateX(-50%)", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ flex: 1, width: 2, background: "repeating-linear-gradient(to bottom, #475569 0, #475569 6px, transparent 6px, transparent 12px)" }} />
                  <div style={{ padding: "6px 10px", background: "#334155", borderRadius: 8, color: "#e2e8f0", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>=</div>
                  <div style={{ flex: 1, width: 2, background: "repeating-linear-gradient(to bottom, #475569 0, #475569 6px, transparent 6px, transparent 12px)" }} />
                </div>
              )}

              {/* ── Multiplication tables (any number) ─────────────────────── */}
              {tables.map(table => {
                const { colHeaders, rowHeaders, pos } = table;
                const tableSelected = selectedTableId === table.id;
                const tableRevealed = table.revealed;
                const revealedCells = table.revealedCells;
                const isMenuOpen = tableMenuOpen === table.id;
                const { colExpr, rowExpr, tableExpr } = tableExprs(colHeaders, rowHeaders);
                // Per-table header mutators — keep the body below close to the
                // original single-table version.
                const setCol = (fn: (h: TileKind[]) => TileKind[]) =>
                  setTables(tbls => tbls.map(t => t.id === table.id ? { ...t, colHeaders: fn(t.colHeaders) } : t));
                const setRow = (fn: (h: TileKind[]) => TileKind[]) =>
                  setTables(tbls => tbls.map(t => t.id === table.id ? { ...t, rowHeaders: fn(t.rowHeaders) } : t));

                const HDR = UNIT, ADD = 30, PAD = 3, BDW = 2, GAP = 4;
                const BD = `${BDW}px solid #334155`;
                const cornerW = HDR + PAD * 2 + BDW * 2;
                // The first column/row draws a leading border too (borderLeft on
                // c===0, borderTop on r===0), so its track must budget two borders
                // — otherwise its coloured tile gets clipped 2px narrower/shorter
                // than the rest.
                const colWidths = colHeaders.map((k, i) => kindLen(k) + PAD * 2 + BDW + (i === 0 ? BDW : 0));
                const rowHeights = rowHeaders.map((k, i) => kindLen(k) + PAD * 2 + BDW + (i === 0 ? BDW : 0));
                const totalColW = colWidths.reduce((a, b) => a + b, 0);
                const totalRowH = rowHeights.reduce((a, b) => a + b, 0);
                const gridCols = `${cornerW}px ${GAP}px ${colWidths.map(w => `${w}px`).join(" ")} ${ADD}px`;
                const gridRows = `${cornerW}px ${GAP}px ${rowHeights.map(h => `${h}px`).join(" ")} ${ADD}px`;

                const hdrPicker = (axis: "col" | "row", idx: number, current: TileKind, canRemove: boolean) => {
                  const isOpen = openHdr?.tableId === table.id && openHdr.axis === axis && openHdr.idx === idx;
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
                              if (axis === "col") setCol(h => h.map((k, i) => i === idx ? hk : k));
                              else setRow(h => h.map((k, i) => i === idx ? hk : k));
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
                                if (axis === "col") setCol(h => h.filter((_, i) => i !== idx));
                                else setRow(h => h.filter((_, i) => i !== idx));
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
                  <div key={table.id} data-table-id={table.id} style={{
                    position: "absolute",
                    left: pos.x, top: pos.y,
                    transform: "translate(-50%, -50%)", zIndex: 5,
                    outline: tableSelected ? "2px dashed #3b82f6" : "none",
                    outlineOffset: 8,
                    cursor: tableSelected ? (tableDragging ? "grabbing" : "grab") : "default",
                  }}
                    onPointerDown={e => onTableDown(e, table)}>

                    {openHdr?.tableId === table.id && (
                      <div style={{ position: "fixed", inset: 0, zIndex: 5 }}
                        onClick={() => setOpenHdr(null)} />
                    )}

                    {/* Delete bin — shown when the table is lasso-selected */}
                    {tableSelected && (
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => deleteTable(table.id)}
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
                      {/* Corner cell — × shows it is a multiplication grid, and
                          doubles as the trigger for the table settings menu */}
                      <div
                        title="Click for settings · hold to drag"
                        onPointerDown={e => onCornerDown(e, table)}
                        onClick={() => {
                          if (tableMovedRef.current) return;
                          setOpenHdr(null);
                          setTableMenuOpen(o => o === table.id ? null : table.id);
                        }}
                        style={{
                          gridRow: 1, gridColumn: 1,
                          background: isMenuOpen ? "#cbd5e1" : "#e2e8f0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", padding: 1, touchAction: "none",
                          borderTop: BD, borderLeft: BD, borderRight: BD, borderBottom: BD,
                          borderTopLeftRadius: 6,
                        }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#475569" }}>×</span>
                      </div>

                      {/* Tramline = header's own far wall (already drawn on the header
                          cells) + the GAP column/row + the leading wall of the first
                          product cell (added below). No extra grey lines needed. */}

                      {/* Column headers */}
                      {colHeaders.map((k, c) => (
                        <div key={`ch-${c}`}
                          onClick={() => { if (tableMovedRef.current) return; setTableMenuOpen(null); setOpenHdr(prev =>
                            prev?.tableId === table.id && prev.axis === "col" && prev.idx === c ? null : { tableId: table.id, axis: "col", idx: c }); }}
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
                        setCol(h => [...h, "1"]);
                        setOpenHdr({ tableId: table.id, axis: "col", idx: ni });
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
                          onClick={() => { if (tableMovedRef.current) return; setTableMenuOpen(null); setOpenHdr(prev =>
                            prev?.tableId === table.id && prev.axis === "row" && prev.idx === r ? null : { tableId: table.id, axis: "row", idx: r }); }}
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
                        setRow(h => [...h, "1"]);
                        setOpenHdr({ tableId: table.id, axis: "row", idx: ni });
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
                                  setTables(tbls => tbls.map(t => {
                                    if (t.id !== table.id) return t;
                                    const n = new Set(t.revealedCells);
                                    if (n.has(cellKey)) n.delete(cellKey); else n.add(cellKey);
                                    return { ...t, revealedCells: n };
                                  }));
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
                              <div data-product-cell={`${table.id}:${r}-${c}`} style={{
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

                    {/* Table settings menu — opened from the × corner. Sits above
                        an invisible full-cover overlay so any outside click closes
                        it. Designed to hold more settings later. */}
                    {isMenuOpen && (
                      <>
                        <div
                          onPointerDown={e => { e.stopPropagation(); setTableMenuOpen(null); }}
                          style={{ position: "absolute", left: -5000, top: -5000, width: 10000, height: 10000, zIndex: 300 }} />
                        <div
                          onPointerDown={e => e.stopPropagation()}
                          style={{
                            position: "absolute", top: cornerW + 8, left: 0, zIndex: 320,
                            minWidth: 184, background: "#fff", borderRadius: 10,
                            boxShadow: "0 6px 24px rgba(0,0,0,0.22)", border: "1px solid #e2e8f0",
                            padding: 5,
                          }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, padding: "4px 8px 6px" }}>
                            Table settings
                          </div>
                          <button
                            onClick={() => {
                              // Turning off "reveal all" also clears any per-cell reveals.
                              setTables(tbls => tbls.map(t => t.id === table.id
                                ? { ...t, revealed: !t.revealed, revealedCells: t.revealed ? new Set<string>() : t.revealedCells }
                                : t));
                            }}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                              gap: 10, padding: "7px 8px", borderRadius: 7, border: "none", background: "transparent",
                              cursor: "pointer",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {tableRevealed
                                ? <EyeOff size={15} color="#475569" />
                                : <Eye size={15} color="#475569" />}
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Reveal all</span>
                            </span>
                            <TogglePill on={tableRevealed} />
                          </button>

                          <div style={{ height: 1, background: "#eef2f7", margin: "4px 6px" }} />

                          {/* Clear table — wipe back to a blank grid (no headers,
                              nothing revealed) without removing it from the board */}
                          <button
                            onClick={() => { clearTable(table.id); setTableMenuOpen(null); }}
                            style={{
                              width: "100%", display: "flex", alignItems: "center",
                              gap: 8, padding: "7px 8px", borderRadius: 7, border: "none", background: "transparent",
                              cursor: "pointer",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <Eraser size={15} color="#475569" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Clear table</span>
                          </button>
                        </div>
                      </>
                    )}

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
              })}

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

              {/* Drawing strokes — committed lines plus the live in-progress one */}
              {(strokes.length > 0 || liveStroke) && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 60, overflow: "visible" }}>
                  {strokes.map((s, i) => (
                    <path key={i} d={strokePath(s.points)}
                      fill="none" stroke={s.color} strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                  {liveStroke && (
                    <path d={strokePath(liveStroke.points)}
                      fill="none" stroke={liveStroke.color} strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              )}

            </div>{/* end scaled wrapper */}

            {/* Empty state — outside scale wrapper for proper centering. Hidden
                once the user starts writing (pen/eraser active, or any ink on
                the board) so the prompt never sits under their handwriting. */}
            {tiles.length === 0 && dragId === null && tables.length === 0 &&
              !drawMode && !eraserMode && strokes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
                <div className="text-center" style={{ color: "#94a3b8" }}>
                  <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Drag tiles from the panel</p>
                  <p style={{ fontSize: 13, margin: 0 }}>or type an expression and click Build</p>
                </div>
              </div>
            )}

            {/* ── Floating draw hotbar ──────────────────────────────────────── */}
            <DrawHotbar
              drawMode={drawMode} eraserMode={eraserMode} panMode={panMode}
              penColor={penColor} setPenColor={setPenColor}
              hasStrokes={strokes.length > 0}
              onCursor={() => { setDrawMode(false); setEraserMode(false); setPanMode(false); }}
              onGrab={() => { setPanMode(true); setDrawMode(false); setEraserMode(false); }}
              onPen={() => { setDrawMode(true); setEraserMode(false); setPanMode(false); }}
              onEraser={() => { setEraserMode(true); setDrawMode(false); setPanMode(false); }}
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
  drawMode, eraserMode, panMode, penColor, setPenColor, hasStrokes,
  onCursor, onGrab, onPen, onEraser, onClearBoard,
}: {
  drawMode: boolean; eraserMode: boolean; panMode: boolean;
  penColor: string; setPenColor: (c: string) => void; hasStrokes: boolean;
  onCursor: () => void; onGrab: () => void; onPen: () => void; onEraser: () => void; onClearBoard: () => void;
}) {
  const cursorActive = !drawMode && !eraserMode && !panMode;
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
      <HotBtn active={panMode} onClick={onGrab} title="Grab / pan board">
        <Hand size={18} color="#e2e8f0" />
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

function BurgerMenu({ scale, setScale, showBuilder, setShowBuilder, showExprBar, setShowExprBar, onResetView, onClose }: {
  scale: number; setScale: (fn: (s: number) => number) => void;
  showBuilder: boolean; setShowBuilder: (v: boolean) => void;
  showExprBar: boolean; setShowExprBar: (v: boolean) => void;
  onResetView: () => void;
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

        {/* Reset view — recentre & zoom to 100% (escape hatch for the infinite board) */}
        <button onClick={onResetView}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}>
          <span>Reset view</span>
          <span className="text-xs font-medium text-gray-400">recentre</span>
        </button>

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
