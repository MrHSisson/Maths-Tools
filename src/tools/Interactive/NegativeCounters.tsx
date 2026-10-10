import { useState, useRef, useEffect, useCallback } from "react";
import { Home, Undo2, Trash2, LayoutGrid, RefreshCw, X, Menu, Plus, Minus } from "lucide-react";
import { CounterDot, pairBoxStyle, DrawHotbar, HotBtn, PEN_COLORS, eraseNear, strokePath, type Stroke, type CounterState } from "../../shared";

// Negative Counters — an interactive sandbox, the directed-number sibling of Algebra Tiles. Yellow counters
// are +1, red counters are −1, and one of each is a zero pair. Drag counters out of the tray, move them,
// flip them over, take them away. When a +1 meets a −1 the teacher chooses: they pair up as a circled zero
// pair, or collapse to nothing.
//
// The counters themselves are the shared representation (`CounterDot`, src/shared/counters.ts) — the same
// yellow and red appear in question working steps, so the sandbox and the solutions look identical.

interface CounterItem { id: number; sign: 1 | -1; x: number; y: number; pairId?: number; col?: number; }
/** What happens when a +1 is dropped onto a −1: they sit together as a boxed zero pair, or both collapse to nothing. */
type Meet = "pair" | "collapse";
/** "free": drag counters anywhere. "table": the + / − representation table — yellows sit in the top row, reds in
 *  the bottom row, aligned in columns, so a + above a − reads as a zero pair and nothing wanders. */
type Layout = "free" | "table";
/** move = the Select tool; flip / delete are this sandbox's own tools; pan / pen / eraser are the shared whiteboard tools. */
type Mode = "move" | "flip" | "delete" | "pan" | "pen" | "eraser";

const SIZE = 38;
const SNAP = 13;
const PAD = 12;
const SLOT = SIZE + 18;
const PAIR_GAP = 5;   // between the + and the − of a boxed zero pair
const SELECTED_BOX = { background: "rgba(56,169,224,0.14)", boxShadow: "0 0 0 3px rgba(56,169,224,0.28)" };   // a pair picked up as a group
const PAIR_PAD = 6;   // box margin around a zero pair
let nextId = 1;
let nextPairId = 1;

const LABEL_W = 48;
const LANE_H = SIZE + 20;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;

/** Table layout: every counter needs a column — keep the ones it has, give the rest the first column free in their
 *  own row. `skip` is a counter being dragged (it has no cell until it is dropped). */
const ensureCols = (items: CounterItem[], skip?: number): CounterItem[] => {
  const used = [new Set<number>(), new Set<number>()];
  for (const c of items) if (c.col !== undefined && c.id !== skip) used[c.sign > 0 ? 0 : 1].add(c.col);
  return items.map((c) => {
    if (c.id === skip || c.col !== undefined) return c;
    const lane = c.sign > 0 ? 0 : 1;
    let col = 0;
    while (used[lane].has(col)) col++;
    used[lane].add(col);
    return { ...c, col };
  });
};

/** Table layout: where each counter sits (column from its own `col`, row from its sign), how many columns, and
 *  which columns hold both a + and a − (the zero pairs the eye should see). */
const tableLayout = (items: CounterItem[]) => {
  const at = new Map<number, { col: number; lane: 0 | 1 }>();
  const lanes = new Map<number, Set<number>>();
  let cols = 0;
  for (const c of items) {
    if (c.col === undefined) continue;
    const lane: 0 | 1 = c.sign > 0 ? 0 : 1;
    at.set(c.id, { col: c.col, lane });
    if (!lanes.has(c.col)) lanes.set(c.col, new Set());
    lanes.get(c.col)!.add(lane);
    cols = Math.max(cols, c.col + 1);
  }
  const full = new Set<number>([...lanes].filter(([, l]) => l.size === 2).map(([col]) => col));
  return { at, cols, full };
};

/** Table layout: ids of every counter sitting in a zero-pair column. */
const tableMatched = (items: CounterItem[]): Set<number> => {
  const { at, full } = tableLayout(items);
  return new Set(items.filter((c) => at.has(c.id) && full.has(at.get(c.id)!.col)).map((c) => c.id));
};

/** Table layout, "collapse": a column holding a + over a − cancels and vanishes — unless it is a zero pair the
 *  teacher added on purpose (pairId), which stays until "Remove zero pairs". */
const collapseTable = (items: CounterItem[]): CounterItem[] => {
  const { at, full } = tableLayout(items);
  const gone = new Set<number>();
  for (const col of full) {
    const members = items.filter((c) => at.get(c.id)?.col === col);
    if (members.every((c) => c.pairId === undefined)) members.forEach((c) => gone.add(c.id));
  }
  return gone.size ? items.filter((c) => !gone.has(c.id)) : items;
};

/** Free layout: pair each yellow with its nearest unused red; the returned ids are the counters in a zero pair. */
const pairUp = (items: CounterItem[]): Set<number> => {
  // Counters already joined as a zero pair (pairId) come first; the rest are matched by nearest neighbour.
  const paired = new Set<number>(items.filter((c) => c.pairId !== undefined).map((c) => c.id));
  const free = items.filter((c) => !paired.has(c.id));
  const reds = free.filter((c) => c.sign < 0);
  const used = new Set<number>();
  for (const y of free.filter((c) => c.sign > 0)) {
    let best: CounterItem | null = null, bestD = Infinity;
    for (const r of reds) {
      if (used.has(r.id)) continue;
      const d = Math.hypot(r.x - y.x, r.y - y.y);
      if (d < bestD) { bestD = d; best = r; }
    }
    if (best) { used.add(best.id); paired.add(best.id); paired.add(y.id); }
  }
  return paired;
};

export default function App() {
  const [items, setItems] = useState<CounterItem[]>([]);
  const [history, setHistory] = useState<CounterItem[][]>([]);
  const [mode, setMode] = useState<Mode>("move");
  const [showReadout, setShowReadout] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);
  const [writing, setWriting] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const scaleRef = useRef(scale); scaleRef.current = scale;
  const panRef = useRef(pan); panRef.current = pan;
  const modeRef = useRef<Mode>("move");
  const penColorRef = useRef(penColor); penColorRef.current = penColor;
  const drawingRef = useRef<{ x: number; y: number }[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const panDragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const [meet, setMeet] = useState<Meet>("pair");
  const [layout, setLayout] = useState<Layout>("free");
  const [dragIds, setDragIds] = useState<number[]>([]);
  const [selKey, setSelKey] = useState<string | null>(null);   // the zero pair (group) last pressed
  const pressedCounter = useRef(false);
  const lastDown = useRef<{ key: string; t: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const meetRef = useRef(meet);
  meetRef.current = meet;
  modeRef.current = mode;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  /** A drag moves one counter, or both counters of a zero pair together (a group), each keeping its own offset from the pointer. */
  const dragRef = useRef<{ ids: number[]; primary: number; offs: Record<number, { dx: number; dy: number }>; before: CounterItem[]; moved: boolean } | null>(null);

  const commit = useCallback((next: CounterItem[], before = itemsRef.current) => {
    setHistory((h) => [...h.slice(-50), before]);
    setItems(next);
  }, []);
  const undo = () => setHistory((h) => {
    if (!h.length) return h;
    setItems(h[h.length - 1]);
    return h.slice(0, -1);
  });

  // First free slot reading left→right, top→bottom, so tapped-in counters line up neatly.
  const freeSlot = (list: CounterItem[]): { x: number; y: number } => {
    const w = boardRef.current?.clientWidth ?? 600;
    const cols = Math.max(1, Math.floor((w - PAD) / SLOT));
    for (let i = 0; i < 400; i++) {
      const x = PAD + (i % cols) * SLOT, y = PAD + Math.floor(i / cols) * SLOT;
      if (!list.some((c) => Math.abs(c.x - x) < SIZE * 0.6 && Math.abs(c.y - y) < SIZE * 0.6)) return { x, y };
    }
    return { x: PAD, y: PAD };
  };

  // First slot with room for a stacked + over − pair (and its box).
  const freePairSlot = (list: CounterItem[]): { x: number; y: number } => {
    const w = boardRef.current?.clientWidth ?? 600;
    const cols = Math.max(1, Math.floor((w - PAD) / SLOT));
    const rowH = SIZE * 2 + PAIR_GAP + 2 * PAIR_PAD + 10;
    for (let i = 0; i < 400; i++) {
      const x = PAD + PAIR_PAD + (i % cols) * SLOT, y = PAD + PAIR_PAD + Math.floor(i / cols) * rowH;
      if (!list.some((c) => Math.abs(c.x - x) < SIZE && c.y > y - SIZE && c.y < y + SIZE * 2 + PAIR_GAP)) return { x, y };
    }
    return { x: PAD, y: PAD };
  };

  const addCounter = (sign: 1 | -1) => {
    if (layoutRef.current === "table") {
      // table: the counter drops into its own row (yellow top, red bottom); "collapse" cancels it at once
      const next = ensureCols([...itemsRef.current, { id: nextId++, sign, x: 0, y: 0 }]);
      commit(meetRef.current === "collapse" ? collapseTable(next) : next);
      return;
    }
    const { x, y } = freeSlot(itemsRef.current);
    commit([...itemsRef.current, { id: nextId++, sign, x, y }]);
  };
  const addZeroPair = () => {
    const cur = itemsRef.current;
    if (layoutRef.current === "table") {
      // one column that is free in both rows: the + over the −, tagged so "collapse" leaves it alone
      const used = new Set(cur.filter((c) => c.col !== undefined).map((c) => c.col!));
      let col = 0;
      while (used.has(col)) col++;
      const pid = nextPairId++;
      commit([...cur, { id: nextId++, sign: 1, x: 0, y: 0, pairId: pid, col }, { id: nextId++, sign: -1, x: 0, y: 0, pairId: pid, col }]);
      return;
    }
    const pid = nextPairId++;
    const a = freePairSlot(cur);
    commit([...cur,
      { id: nextId++, sign: 1 as const, x: a.x, y: a.y, pairId: pid },
      { id: nextId++, sign: -1 as const, x: a.x, y: a.y + SIZE + PAIR_GAP, pairId: pid }]);
  };

  // Take away every zero pair currently on the board (each yellow with its nearest red).
  const removeZeroPairs = () => {
    const paired = layoutRef.current === "table" ? tableMatched(ensureCols(itemsRef.current)) : pairUp(itemsRef.current);
    if (paired.size) commit(itemsRef.current.filter((c) => !paired.has(c.id)));
  };
  // Tidy: yellows in the top row, reds in the row beneath — makes counting and pairing easy to see.
  const tidy = () => {
    const w = boardRef.current?.clientWidth ?? 600;
    const cols = Math.max(1, Math.floor((w - PAD) / SLOT));
    const pos = itemsRef.current.filter((c) => c.sign > 0), neg = itemsRef.current.filter((c) => c.sign < 0);
    const place = (list: CounterItem[], startRow: number) => list.map((c, i) => ({ ...c, x: PAD + (i % cols) * SLOT, y: PAD + (startRow + Math.floor(i / cols)) * SLOT }));
    const posRows = Math.max(1, Math.ceil(pos.length / cols));
    commit([...place(pos, 0), ...place(neg, posRows + 0.5)]);
  };

  // ── Pointer dragging (works for a counter on the board and for one pulled out of the tray) ──
  // Board coordinates undo the pan / zoom; rx / ry are the raw position inside the canvas (to tell when a drop lands off it).
  const toBoard = (clientX: number, clientY: number) => {
    const r = boardRef.current!.getBoundingClientRect();
    const rx = clientX - r.left, ry = clientY - r.top;
    return { x: (rx - panRef.current.x) / scaleRef.current, y: (ry - panRef.current.y) / scaleRef.current, rx, ry, w: r.width / scaleRef.current, h: r.height / scaleRef.current, rw: r.width, rh: r.height };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const p = toBoard(e.clientX, e.clientY);
      d.moved = true;
      setItems((cur) => cur.map((c) => (d.offs[c.id] ? { ...c, x: p.x - d.offs[c.id].dx, y: p.y - d.offs[c.id].dy } : c)));
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDragIds([]);
      const p = toBoard(e.clientX, e.clientY);
      const outside = p.rx < 0 || p.ry < 0 || p.rx > p.rw || p.ry > p.rh;
      const cur = itemsRef.current;
      if (outside) {
        // dropped back on the tray → put it away
        setHistory((h) => [...h.slice(-50), d.before]);
        setItems(cur.filter((c) => !d.offs[c.id]));
      } else if (d.moved && layoutRef.current === "table") {
        // Snap into the nearest column of the counter's own row; if that cell is taken the two swap places.
        const me = cur.find((c) => c.id === d.primary)!;
        const maxCol = Math.max(0, Math.floor((p.w - LABEL_W - 10) / SLOT) - 1);
        const col = Math.max(0, Math.min(maxCol, Math.round((me.x - LABEL_W - 10) / SLOT)));
        let next: CounterItem[];
        if (d.ids.length > 1) {
          // a whole zero-pair column moves: whatever sits in the target column swaps into the vacated one
          next = cur.map((c) => (d.offs[c.id] ? { ...c, col } : c.col === col ? { ...c, col: me.col } : c));
        } else {
          const lane = me.sign > 0 ? 0 : 1;
          const occ = cur.find((c) => c.id !== me.id && (c.sign > 0 ? 0 : 1) === lane && c.col === col);
          next = cur.map((c) => (c.id === me.id ? { ...c, col } : occ && c.id === occ.id ? { ...c, col: me.col } : c));
        }
        next = ensureCols(next);
        if (meetRef.current === "collapse") next = collapseTable(next);
        setHistory((h) => [...h.slice(-50), d.before]);
        setItems(next);
      } else if (d.moved && d.ids.length > 1) {
        // a zero pair moved as one: snap it as a unit so the boxed pair stays together
        const me = cur.find((c) => c.id === d.primary)!;
        const ddx = snap(me.x) - me.x, ddy = snap(me.y) - me.y;
        setHistory((h) => [...h.slice(-50), d.before]);
        setItems(cur.map((c) => (d.offs[c.id] ? { ...c, x: c.x + ddx, y: c.y + ddy } : c)));
      } else if (d.moved) {
        let next = cur.map((c) => (c.id === d.primary
          ? { ...c, x: snap(c.x), y: snap(c.y) }
          : c));
        // A +1 dropped on a −1 (or the reverse) meets its opposite: pair up, or collapse to nothing.
        const me = next.find((c) => c.id === d.primary)!;
        const other = next
          .filter((c) => c.id !== me.id && c.sign !== me.sign && c.pairId === undefined)
          .map((c) => ({ c, dist: Math.hypot(c.x - me.x, c.y - me.y) }))
          .filter((o) => o.dist < SIZE * 0.8)
          .sort((a, b) => a.dist - b.dist)[0]?.c;
        if (other) {
          if (meetRef.current === "collapse") {
            next = next.filter((c) => c.id !== me.id && c.id !== other.id);
          } else {
            const pid = nextPairId++;
            // stack as a boxed zero pair: the + above the −, the dropped counter snapping next to its partner
            const topY = me.sign > 0 ? other.y - SIZE - PAIR_GAP : other.y;
            const lift = Math.max(0, PAIR_PAD - topY);
            next = next.map((c) => {
              if (c.id === me.id) return { ...c, x: other.x, y: (me.sign > 0 ? topY : other.y + SIZE + PAIR_GAP) + lift, pairId: pid };
              if (c.id === other.id) return { ...c, y: other.y + lift, pairId: pid };
              return c;
            });
          }
        }
        setHistory((h) => [...h.slice(-50), d.before]);
        setItems(next);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  // ── Freehand ink and board panning (same behaviour as Algebra Tiles) ──
  useEffect(() => {
    const flushLive = () => {
      rafRef.current = null;
      if (drawingRef.current) setLiveStroke({ color: penColorRef.current, points: drawingRef.current.slice() });
    };
    const toLocal = (cx: number, cy: number) => {
      const r = boardRef.current!.getBoundingClientRect();
      return { x: (cx - r.left - panRef.current.x) / scaleRef.current, y: (cy - r.top - panRef.current.y) / scaleRef.current };
    };
    const onMove = (e: PointerEvent) => {
      const pd = panDragRef.current;
      if (pd) { setPan({ x: pd.px + (e.clientX - pd.sx), y: pd.py + (e.clientY - pd.sy) }); return; }
      if (!drawingRef.current || !boardRef.current) return;
      const evs = e.getCoalescedEvents?.().length ? e.getCoalescedEvents() : [e];
      if (modeRef.current === "eraser") {
        for (const ev of evs) { const { x, y } = toLocal(ev.clientX, ev.clientY); setStrokes((prev) => eraseNear(prev, x, y)); }
        return;
      }
      for (const ev of evs) drawingRef.current.push(toLocal(ev.clientX, ev.clientY));
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(flushLive);
    };
    const onUp = () => {
      if (panDragRef.current) { panDragRef.current = null; setPanning(false); }
      if (!drawingRef.current) return;
      const pts = drawingRef.current;
      drawingRef.current = null;
      setWriting(false);
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setLiveStroke(null);
      if (modeRef.current !== "eraser" && pts.length >= 2) { const col = penColorRef.current; setStrokes((prev) => [...prev, { color: col, points: pts }]); }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  const onCanvasDown = (e: React.PointerEvent) => {
    if (pressedCounter.current) pressedCounter.current = false; else setSelKey(null);
    if (dragRef.current) return;
    if (mode === "pan") {
      panDragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
      setPanning(true);
      return;
    }
    if (mode === "pen" || mode === "eraser") {
      const { x, y } = toBoard(e.clientX, e.clientY);
      drawingRef.current = [{ x, y }];
      setWriting(true);
      if (mode === "eraser") setStrokes((prev) => eraseNear(prev, x, y));
      else setLiveStroke({ color: penColor, points: [{ x, y }] });
    }
  };

  const startBoardDrag = (e: React.PointerEvent, c: CounterItem) => {
    // pan / pen / eraser belong to the board: let the press bubble up to it
    if (mode === "pan" || mode === "pen" || mode === "eraser") return;
    e.preventDefault();
    // Touching a counter breaks any zero pair it was in (its partner stays, unpaired).
    const unpair = (list: CounterItem[]) => (c.pairId === undefined ? list : list.map((x) => (x.pairId === c.pairId ? { ...x, pairId: undefined } : x)));
    if (mode === "delete") { commit(unpair(itemsRef.current).filter((x) => x.id !== c.id)); return; }
    if (mode === "flip") {
      let flipped = unpair(itemsRef.current).map((x) => (x.id === c.id ? { ...x, sign: (x.sign * -1) as 1 | -1, col: undefined } : x));
      if (layoutRef.current === "table") {
        flipped = ensureCols(flipped);   // it lands in the first free column of its new row
        if (meetRef.current === "collapse") flipped = collapseTable(flipped);
      }
      commit(flipped);
      return;
    }
    const p = toBoard(e.clientX, e.clientY);
    const before = itemsRef.current;
    pressedCounter.current = true;
    // A zero pair is a group: one press picks up both, a quick second press breaks it and takes just this one.
    const tableMode = layoutRef.current === "table";
    const cols = tableMode ? ensureCols(before) : before;
    const mate = tableMode
      ? cols.filter((x) => x.col === (cols.find((y) => y.id === c.id)?.col) && x.id !== c.id && x.sign !== c.sign)[0]
      : c.pairId !== undefined ? before.find((x) => x.id !== c.id && x.pairId === c.pairId) : undefined;
    const key = mate ? (tableMode ? `c${cols.find((y) => y.id === c.id)!.col}` : `p${c.pairId}`) : null;
    const now = Date.now();
    const again = key !== null && lastDown.current?.key === key && now - lastDown.current.t < 450;
    lastDown.current = { key: key ?? "", t: now };
    const group = key !== null && !again;
    if (key !== null) setSelKey(again ? null : key); else setSelKey(null);
    if (again && c.pairId !== undefined) setItems(unpair(before));
    const members = group && mate ? [c, mate] : [c];
    // table counters have no x / y of their own: start from where they are drawn
    const vis = (m: CounterItem) => {
      const cm = cols.find((y) => y.id === m.id)!;
      return tableMode ? { x: LABEL_W + 10 + (cm.col ?? 0) * SLOT, y: (m.sign > 0 ? 0 : LANE_H) + (LANE_H - SIZE) / 2 } : { x: m.x, y: m.y };
    };
    const offs: Record<number, { dx: number; dy: number }> = {};
    const starts = new Map<number, { x: number; y: number }>();
    for (const m of members) { const v = vis(m); starts.set(m.id, v); offs[m.id] = { dx: p.x - v.x, dy: p.y - v.y }; }
    if (tableMode) setItems((cur) => cur.map((x) => (starts.has(x.id) ? { ...x, ...starts.get(x.id)! } : x)));
    dragRef.current = { ids: members.map((m) => m.id), primary: c.id, offs, before, moved: false };
    setDragIds(members.map((m) => m.id));
  };
  // Pull a fresh counter out of the tray: it appears under the pointer and carries on as a normal drag.
  const startTrayDrag = (e: React.PointerEvent, sign: 1 | -1) => {
    e.preventDefault();
    const p = toBoard(e.clientX, e.clientY);
    const c: CounterItem = { id: nextId++, sign, x: p.x - SIZE / 2, y: p.y - SIZE / 2 };
    const before = itemsRef.current;
    setItems([...before, c]);
    dragRef.current = { ids: [c.id], primary: c.id, offs: { [c.id]: { dx: SIZE / 2, dy: SIZE / 2 } }, before, moved: true };
    setDragIds([c.id]);
  };

  const pos = items.filter((c) => c.sign > 0).length;
  const neg = items.length - pos;
  // Table: the counter being dragged has no cell until it is dropped, so it is left out of the columns/bands.
  const placed = layout === "table" ? ensureCols(items.filter((c) => !dragIds.includes(c.id))) : items;
  const table = layout === "table" ? tableLayout(placed) : null;
  const paired = table
    ? (meet === "pair" ? tableMatched(placed) : new Set<number>(items.filter((c) => c.pairId !== undefined).map((c) => c.id)))
    : new Set<number>(items.filter((c) => c.pairId !== undefined).map((c) => c.id));
  const net = pos - neg;

  const panelLabel = { fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.8 };
  const hint = table
    ? "A + row above a − row. Drag counters in: they snap into columns, so a + over a − is a zero pair."
    : "Drag counters anywhere on the board.";
  const zpAvailable = (layout === "table" ? tableMatched(ensureCols(items)) : pairUp(items)).size > 0;

  // Same page layout as Algebra Tiles: blue header with burger menu, narrow tile panel, dot-grid canvas with a
  // floating dark hotbar, and a summary bar along the bottom.
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-blue-900 shadow-card flex-shrink-0">
        <div className="px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
            <Home size={24} color="#fff" /><span className="text-white font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {menuOpen && (
              <BurgerMenu showReadout={showReadout} setShowReadout={setShowReadout} scale={scale} setScale={setScale}
                onResetView={() => { setScale(1); setPan({ x: 0, y: 0 }); }} onClose={() => setMenuOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* ── Main: side panel + canvas ─────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Side panel ────────────────────────────────────────────────── */}
        <div style={{
          background: "#f8f9fb", flexShrink: 0, overflow: "auto", width: 168,
          display: "flex", flexDirection: "column", padding: 12, gap: 8,
          borderRight: "1px solid #e2e8f0",
        }}>
          {/* Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Btn on={layout === "table"} title={hint}
              onClick={() => { const l = layout === "table" ? "free" : "table"; setLayout(l); if (l === "table") setItems((cur) => ensureCols(cur)); }} label="Table" />
            <Btn on={meet === "collapse"} onClick={() => setMeet((m) => (m === "pair" ? "collapse" : "pair"))} label="Collapse"
              title={meet === "collapse" ? "A + meeting a − cancels and disappears. Click to pair them up instead." : "A + meeting a − sits as a boxed zero pair. Click to make them disappear instead."} />
            <Btn on={false} onClick={addZeroPair} label="+ Pair" title="Add a zero pair" />
            <Btn on={false} onClick={removeZeroPairs} label="ZP" disabled={!zpAvailable}
              activeColor="#dcfce7" activeText="#166534" title="Remove zero pairs" />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <SmBtn onClick={undo} disabled={!history.length} title="Undo">
              <Undo2 size={13} color={history.length ? "#374151" : "#d1d5db"} />
            </SmBtn>
            <SmBtn onClick={() => items.length && commit([])} disabled={!items.length} title="Clear">
              <Trash2 size={13} color={items.length ? "#ef4444" : "#d1d5db"} />
            </SmBtn>
            <SmBtn onClick={tidy} disabled={!items.length || layout === "table"} title="Tidy">
              <LayoutGrid size={13} color={items.length && layout !== "table" ? "#374151" : "#d1d5db"} />
            </SmBtn>
          </div>

          {/* Positive counters */}
          <div style={panelLabel}>Positive</div>
          <TrayCounter sign={1} onDrag={startTrayDrag} onTap={addCounter} />

          <div style={{ height: 1, background: "#d1d5db" }} />

          {/* Negative counters */}
          <div style={panelLabel}>Negative</div>
          <TrayCounter sign={-1} onDrag={startTrayDrag} onTap={addCounter} />
        </div>

        {/* ── Canvas column ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div ref={boardRef} className="relative flex-1" onPointerDown={onCanvasDown}
            style={{ overflow: "hidden", touchAction: "none", background: "#f8fafc", minHeight: table ? LANE_H * 2 + 8 : 200,
              cursor: mode === "pan" ? (panning ? "grabbing" : "grab") : writing ? "none" : mode === "pen" ? "crosshair" : mode === "eraser" ? "cell" : undefined }}>
            {/* ── Pan + zoom wrapper: dots, table, counters and ink all move together ── */}
            <div style={{ position: "absolute", inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}>
              <svg style={{ position: "absolute", left: -4000, top: -4000, width: 8000, height: 8000, pointerEvents: "none", zIndex: 0 }}>
                <defs>
                  <pattern id="ncg" width={SNAP * 2} height={SNAP * 2} patternUnits="userSpaceOnUse"><circle cx={SNAP * 2} cy={SNAP * 2} r="0.8" fill="#cbd5e1" /></pattern>
                </defs>
                <rect width="8000" height="8000" fill="url(#ncg)" />
              </svg>
            {table && (
              <>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: LANE_H * 2, background: "#fff" }} />
                {/* zero pairs: a rounded box round the + over the − */}
                {[...table.full].filter((i) => items.filter((c) => table.at.get(c.id)?.col === i).every((c) => paired.has(c.id))).map((i) => (
                  <div key={`b${i}`} style={{ ...pairBoxStyle, ...(selKey === `c${i}` ? SELECTED_BOX : null), position: "absolute", zIndex: 2, pointerEvents: "none",
                    left: LABEL_W + 10 + i * SLOT - PAIR_PAD, top: (LANE_H - SIZE) / 2 - PAIR_PAD,
                    width: SIZE + PAIR_PAD * 2, height: LANE_H + SIZE + PAIR_PAD * 2 }} />
                ))}
                {/* the two rules and the + / − labels */}
                <div style={{ position: "absolute", left: LABEL_W, top: 0, width: 3, height: LANE_H * 2, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: LANE_H - 1, height: 3, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: LANE_H * 2 - 1, height: 3, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, top: 0, width: LABEL_W, height: LANE_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#a16207", cursor: "pointer", zIndex: 3 }} title="Add a +1" onClick={() => addCounter(1)}>+</div>
                <div style={{ position: "absolute", left: 0, top: LANE_H, width: LABEL_W, height: LANE_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#b91c1c", cursor: "pointer", zIndex: 3 }} title="Add a −1" onClick={() => addCounter(-1)}>−</div>
              </>
            )}
            {!table && [...new Set(items.filter((c) => c.pairId !== undefined).map((c) => c.pairId!))].map((pid) => {
              const two = items.filter((c) => c.pairId === pid);
              if (two.length !== 2) return null;
              const x = Math.min(two[0].x, two[1].x), y = Math.min(two[0].y, two[1].y), y2 = Math.max(two[0].y, two[1].y);
              return <div key={`p${pid}`} style={{ ...pairBoxStyle, ...(selKey === `p${pid}` ? SELECTED_BOX : null), position: "absolute", pointerEvents: "none", zIndex: 0,
                left: x - PAIR_PAD, top: y - PAIR_PAD, width: SIZE + PAIR_PAD * 2, height: y2 - y + SIZE + PAIR_PAD * 2 }} />;
            })}
            {items.map((c) => {
              const state: CounterState = paired.has(c.id) ? "paired" : "normal";
              const tp = table?.at.get(c.id);
              const left = tp ? LABEL_W + 10 + tp.col * SLOT : c.x;
              const top = tp ? tp.lane * LANE_H + (LANE_H - SIZE) / 2 : c.y;
              return (
                <div key={c.id} onPointerDown={(e) => startBoardDrag(e, c)}
                  style={{ position: "absolute", left, top, touchAction: "none", transition: table && !dragIds.includes(c.id) ? "left 0.2s ease, top 0.2s ease" : undefined,
                    cursor: mode === "move" ? (dragIds.includes(c.id) ? "grabbing" : "grab") : "pointer", zIndex: dragIds.includes(c.id) ? 5 : 1 }}>
                  <CounterDot c={{ sign: c.sign, state }} size={SIZE} />
                </div>
              );
            })}

              {(strokes.length > 0 || liveStroke) && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 60, overflow: "visible" }}>
                  {strokes.map((st, i) => (
                    <path key={i} d={strokePath(st.points)} fill="none" stroke={st.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                  {liveStroke && <path d={strokePath(liveStroke.points)} fill="none" stroke={liveStroke.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
              )}
            </div>{/* end pan + zoom wrapper */}

            {items.length === 0 && strokes.length === 0 && mode !== "pen" && mode !== "eraser" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4, top: table ? LANE_H * 2 : 0 }}>
                <div className="text-center" style={{ color: "#94a3b8" }}>
                  <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Drag counters from the panel</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{table ? "Yellow goes in the + row, red in the − row" : "or tap them in"}</p>
                </div>
              </div>
            )}
            {/* ── Floating tool hotbar (same as Algebra Tiles, plus Flip and Take away) ── */}
            <DrawHotbar
              drawMode={mode === "pen"} eraserMode={mode === "eraser"} panMode={mode === "pan"}
              cursorActive={mode === "move"}
              penColor={penColor} setPenColor={setPenColor}
              hasStrokes={strokes.length > 0}
              onCursor={() => setMode("move")}
              onGrab={() => setMode("pan")}
              onPen={() => setMode("pen")}
              onEraser={() => setMode("eraser")}
              onClearBoard={() => setStrokes([])}
              extra={<>
                <HotBtn active={mode === "flip"} onClick={() => setMode("flip")} title="Flip a counter over"><RefreshCw size={18} color="#e2e8f0" /></HotBtn>
                <HotBtn active={mode === "delete"} onClick={() => setMode("delete")} title="Take away"><X size={18} color="#e2e8f0" /></HotBtn>
                <div style={{ width: 1, height: 26, background: "#475569", margin: "0 2px" }} />
              </>}
            />
          </div>

          {/* ── Value bar ───────────────────────────────────────────────── */}
          {showReadout && (
            <div className="flex items-center justify-center gap-3 px-4 py-2 flex-shrink-0"
              style={{ background: "#f8f9fb", borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Value:</span>
              <span className="font-bold" style={{ fontSize: 18, letterSpacing: 0.5, color: "#1f2937" }}>
                {pos} − {neg} = <span style={{ color: net >= 0 ? "#a16207" : "#b91c1c" }}>{net < 0 ? `−${-net}` : net}</span>
              </span>
              {items.length > 0 && (
                <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>
                  ({pos} positive, {neg} negative)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UI helpers (same look as the Algebra Tiles page) ─────────────────────────

function TrayCounter({ sign, onDrag, onTap }: { sign: 1 | -1; onDrag: (e: React.PointerEvent, s: 1 | -1) => void; onTap: (s: 1 | -1) => void }) {
  return (
    <div onPointerDown={(e) => onDrag(e, sign)} onClick={() => onTap(sign)} title="Drag onto the board, or tap to add"
      style={{ touchAction: "none", cursor: "grab", alignSelf: "flex-start" }}>
      <CounterDot c={{ sign }} size={SIZE} />
    </div>
  );
}

function Btn({ on, onClick, label, disabled, activeColor, activeText, title }: {
  on: boolean; onClick: () => void; label: string; disabled?: boolean; activeColor?: string; activeText?: string; title?: string;
}) {
  const ac = activeColor || "#dbeafe";
  const at = activeText || "#1e40af";
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        padding: "4px 10px", borderRadius: 8, fontWeight: 600,
        fontSize: 13, border: "1px solid " + (disabled ? "#e5e7eb" : on ? "#93c5fd" : "#e2e8f0"),
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
        border: "1px solid " + (disabled ? "#e5e7eb" : "#e2e8f0"), borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "#f3f4f6" : "#fff",
        transition: "background 0.15s", padding: 0, flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = disabled ? "#f3f4f6" : "#fff"; }}>
      {children}
    </button>
  );
}

function BurgerMenu({ showReadout, setShowReadout, scale, setScale, onResetView, onClose }: {
  showReadout: boolean; setShowReadout: (v: boolean) => void;
  scale: number; setScale: (fn: (s: number) => number) => void; onResetView: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 overflow-hidden" style={{ minWidth: 220 }}>
      <div className="py-1">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Zoom</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))} className="hover:bg-gray-100 transition-colors"
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
              <Minus size={14} color="#374151" />
            </button>
            <span className="text-sm font-semibold text-gray-600" style={{ minWidth: 36, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))} className="hover:bg-gray-100 transition-colors"
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
              <Plus size={14} color="#374151" />
            </button>
          </div>
        </div>
        <button onClick={onResetView}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}>
          <span>Reset view</span>
          <span className="text-xs font-medium text-gray-400">recentre</span>
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => setShowReadout(!showReadout)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}>
          <span>Value Summary</span>
          <TogglePill on={showReadout} />
        </button>
      </div>
    </div>
  );
}

function TogglePill({ on }: { on: boolean }) {
  return (
    <div style={{ width: 36, height: 20, borderRadius: 10, padding: 2, background: on ? "#1e40af" : "#d1d5db", transition: "background 0.15s", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "transform 0.15s", transform: on ? "translateX(16px)" : "translateX(0)" }} />
    </div>
  );
}
