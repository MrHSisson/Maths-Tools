import { useState, useRef, useEffect, useCallback } from "react";
import { Home, Undo2, Trash2, LayoutGrid, Hand, RefreshCw, X, Menu } from "lucide-react";
import { CounterDot, pairBoxStyle, type CounterState } from "../../shared";

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
type Mode = "move" | "flip" | "delete";

const SIZE = 52;
const SNAP = 13;
const PAD = 12;
const SLOT = SIZE + 20;
const PAIR_GAP = 6;   // between the + and the − of a boxed zero pair
const PAIR_PAD = 7;   // box margin around a zero pair
let nextId = 1;
let nextPairId = 1;

const LABEL_W = 56;
const LANE_H = SIZE + 24;

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
  const [meet, setMeet] = useState<Meet>("pair");
  const [layout, setLayout] = useState<Layout>("free");
  const [dragId, setDragId] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const meetRef = useRef(meet);
  meetRef.current = meet;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const dragRef = useRef<{ id: number; dx: number; dy: number; before: CounterItem[]; moved: boolean } | null>(null);

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
  const toBoard = (clientX: number, clientY: number) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const p = toBoard(e.clientX, e.clientY);
      d.moved = true;
      setItems((cur) => cur.map((c) => (c.id === d.id ? { ...c, x: p.x - d.dx, y: p.y - d.dy } : c)));
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDragId(null);
      const p = toBoard(e.clientX, e.clientY);
      const outside = p.x < 0 || p.y < 0 || p.x > p.w || p.y > p.h;
      const cur = itemsRef.current;
      if (outside) {
        // dropped back on the tray → put it away
        setHistory((h) => [...h.slice(-50), d.before]);
        setItems(cur.filter((c) => c.id !== d.id));
      } else if (d.moved && layoutRef.current === "table") {
        // Snap into the nearest column of the counter's own row; if that cell is taken the two swap places.
        const me = cur.find((c) => c.id === d.id)!;
        const maxCol = Math.max(0, Math.floor((p.w - LABEL_W - 10) / SLOT) - 1);
        const col = Math.max(0, Math.min(maxCol, Math.round((me.x - LABEL_W - 10) / SLOT)));
        const lane = me.sign > 0 ? 0 : 1;
        const occ = cur.find((c) => c.id !== me.id && (c.sign > 0 ? 0 : 1) === lane && c.col === col);
        let next = cur.map((c) => (c.id === me.id ? { ...c, col } : occ && c.id === occ.id ? { ...c, col: me.col } : c));
        next = ensureCols(next);
        if (meetRef.current === "collapse") next = collapseTable(next);
        setHistory((h) => [...h.slice(-50), d.before]);
        setItems(next);
      } else if (d.moved) {
        let next = cur.map((c) => (c.id === d.id
          ? { ...c, x: Math.max(0, Math.min(p.w - SIZE, snap(c.x))), y: Math.max(0, Math.min(p.h - SIZE, snap(c.y))) }
          : c));
        // A +1 dropped on a −1 (or the reverse) meets its opposite: pair up, or collapse to nothing.
        const me = next.find((c) => c.id === d.id)!;
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

  const startBoardDrag = (e: React.PointerEvent, c: CounterItem) => {
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
    if (c.pairId !== undefined) setItems(unpair(before));
    dragRef.current = { id: c.id, dx: p.x - c.x, dy: p.y - c.y, before, moved: false };
    setDragId(c.id);
  };
  // Pull a fresh counter out of the tray: it appears under the pointer and carries on as a normal drag.
  const startTrayDrag = (e: React.PointerEvent, sign: 1 | -1) => {
    e.preventDefault();
    const p = toBoard(e.clientX, e.clientY);
    const c: CounterItem = { id: nextId++, sign, x: p.x - SIZE / 2, y: p.y - SIZE / 2 };
    const before = itemsRef.current;
    setItems([...before, c]);
    dragRef.current = { id: c.id, dx: SIZE / 2, dy: SIZE / 2, before, moved: true };
    setDragId(c.id);
  };

  const pos = items.filter((c) => c.sign > 0).length;
  const neg = items.length - pos;
  // Table: the counter being dragged has no cell until it is dropped, so it is left out of the columns/bands.
  const placed = layout === "table" ? ensureCols(items.filter((c) => c.id !== dragId)) : items;
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
      <div className="bg-blue-900 shadow-lg flex-shrink-0">
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
              <BurgerMenu showReadout={showReadout} setShowReadout={setShowReadout} onClose={() => setMenuOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* ── Main: side panel + canvas ─────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Side panel ────────────────────────────────────────────────── */}
        <div style={{
          background: "#f5f3f0", flexShrink: 0, overflow: "auto", width: 168,
          display: "flex", flexDirection: "column", padding: 12, gap: 8,
          borderRight: "2px solid #d1d5db",
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
          <div ref={boardRef} className="relative flex-1"
            style={{ overflow: "hidden", touchAction: "none", background: "#f8fafc", minHeight: table ? LANE_H * 2 + 8 : 200,
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: `${SNAP * 2}px ${SNAP * 2}px` }}>
            {table && (
              <>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: LANE_H * 2, background: "#fff" }} />
                {/* zero pairs: a rounded box round the + over the − */}
                {[...table.full].filter((i) => items.filter((c) => table.at.get(c.id)?.col === i).every((c) => paired.has(c.id))).map((i) => (
                  <div key={`b${i}`} style={{ ...pairBoxStyle, position: "absolute", zIndex: 2, pointerEvents: "none",
                    left: LABEL_W + 10 + i * SLOT - PAIR_PAD, top: (LANE_H - SIZE) / 2 - PAIR_PAD,
                    width: SIZE + PAIR_PAD * 2, height: LANE_H + SIZE + PAIR_PAD * 2 }} />
                ))}
                {/* the two rules and the + / − labels */}
                <div style={{ position: "absolute", left: LABEL_W, top: 0, width: 3, height: LANE_H * 2, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: LANE_H - 1, height: 3, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: LANE_H * 2 - 1, height: 3, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, top: 0, width: LABEL_W, height: LANE_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#a16207" }}>+</div>
                <div style={{ position: "absolute", left: 0, top: LANE_H, width: LABEL_W, height: LANE_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#b91c1c" }}>−</div>
              </>
            )}
            {items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4, top: table ? LANE_H * 2 : 0 }}>
                <div className="text-center" style={{ color: "#94a3b8" }}>
                  <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 4px" }}>Drag counters from the panel</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{table ? "Yellow goes in the + row, red in the − row" : "or tap them in"}</p>
                </div>
              </div>
            )}
            {!table && [...new Set(items.filter((c) => c.pairId !== undefined).map((c) => c.pairId!))].map((pid) => {
              const two = items.filter((c) => c.pairId === pid);
              if (two.length !== 2) return null;
              const x = Math.min(two[0].x, two[1].x), y = Math.min(two[0].y, two[1].y), y2 = Math.max(two[0].y, two[1].y);
              return <div key={`p${pid}`} style={{ ...pairBoxStyle, position: "absolute", pointerEvents: "none", zIndex: 0,
                left: x - PAIR_PAD, top: y - PAIR_PAD, width: SIZE + PAIR_PAD * 2, height: y2 - y + SIZE + PAIR_PAD * 2 }} />;
            })}
            {items.map((c) => {
              const state: CounterState = paired.has(c.id) ? "paired" : "normal";
              const tp = table?.at.get(c.id);
              const left = tp ? LABEL_W + 10 + tp.col * SLOT : c.x;
              const top = tp ? tp.lane * LANE_H + (LANE_H - SIZE) / 2 : c.y;
              return (
                <div key={c.id} onPointerDown={(e) => startBoardDrag(e, c)}
                  style={{ position: "absolute", left, top, touchAction: "none", transition: table && dragId !== c.id ? "left 0.2s ease, top 0.2s ease" : undefined,
                    cursor: mode === "move" ? (dragId === c.id ? "grabbing" : "grab") : "pointer", zIndex: dragId === c.id ? 5 : 1 }}>
                  <CounterDot c={{ sign: c.sign, state }} size={SIZE} />
                </div>
              );
            })}

            {/* ── Floating tool hotbar ─────────────────────────────────── */}
            <div onPointerDown={(e) => e.stopPropagation()}
              style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 150, display: "flex", alignItems: "center", gap: 4,
                padding: "6px 8px", background: "#2d3340", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.35)" }}>
              <HotBtn active={mode === "move"} onClick={() => setMode("move")} title="Move"><Hand size={18} color="#e2e8f0" /></HotBtn>
              <HotBtn active={mode === "flip"} onClick={() => setMode("flip")} title="Flip a counter over"><RefreshCw size={18} color="#e2e8f0" /></HotBtn>
              <HotBtn active={mode === "delete"} onClick={() => setMode("delete")} title="Take away"><X size={18} color="#e2e8f0" /></HotBtn>
            </div>
          </div>

          {/* ── Value bar ───────────────────────────────────────────────── */}
          {showReadout && (
            <div className="flex items-center justify-center gap-3 px-4 py-2 flex-shrink-0"
              style={{ background: "#f5f3f0", borderTop: "2px solid #d1d5db" }}>
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
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = disabled ? "#f3f4f6" : "#fff"; }}>
      {children}
    </button>
  );
}

function HotBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 10, padding: 0, flexShrink: 0, cursor: "pointer",
        background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)",
        transition: "background 0.12s",
      }}
      onPointerEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.background = active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)"; }}>
      {children}
    </button>
  );
}

function BurgerMenu({ showReadout, setShowReadout, onClose }: {
  showReadout: boolean; setShowReadout: (v: boolean) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: 220 }}>
      <div className="py-1">
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
