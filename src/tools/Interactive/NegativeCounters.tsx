import { useState, useRef, useEffect, useCallback } from "react";
import { Home, Undo2, Trash2, Eye, EyeOff, LayoutGrid, Hand, RefreshCw, X, Link2 } from "lucide-react";
import { CounterDot, COUNTER_POS, COUNTER_NEG, type CounterState } from "../../shared";

// Negative Counters — an interactive sandbox, the directed-number sibling of Algebra Tiles. Yellow counters
// are +1, red counters are −1, and one of each is a zero pair. Drag counters out of the tray, move them,
// flip them over, take them away. When a +1 meets a −1 the teacher chooses: they pair up as a circled zero
// pair, or collapse to nothing.
//
// The counters themselves are the shared representation (`CounterDot`, src/shared/counters.ts) — the same
// yellow and red appear in question working steps, so the sandbox and the solutions look identical.

interface CounterItem { id: number; sign: 1 | -1; x: number; y: number; pairId?: number; col?: number; }
/** What happens when a +1 is dropped onto a −1: they sit together as a circled zero pair, or both collapse to nothing. */
type Meet = "pair" | "collapse";
/** "free": drag counters anywhere. "table": the + / − representation table — yellows sit in the top row, reds in
 *  the bottom row, aligned in columns, so a + above a − reads as a zero pair and nothing wanders. */
type Layout = "free" | "table";
type Mode = "move" | "flip" | "delete";

const SIZE = 52;
const SNAP = 13;
const PAD = 12;
const SLOT = SIZE + 8;
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
    const a = freeSlot(cur);
    const pid = nextPairId++;
    const first = { id: nextId++, sign: 1 as const, ...a, pairId: pid };
    const b = freeSlot([...cur, first]);
    commit([...cur, first, { id: nextId++, sign: -1 as const, ...b, pairId: pid }]);
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
            // sit side by side: the dropped counter snaps to the right of its partner
            next = next.map((c) => (c.id === me.id ? { ...c, x: other.x + SIZE + 4, y: other.y, pairId: pid } : c.id === other.id ? { ...c, pairId: pid } : c));
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

  const modeBtn = (m: Mode, label: string, icon: JSX.Element) => (
    <button key={m} onClick={() => setMode(m)}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold border-2 transition-colors"
      style={{ background: mode === m ? "#1e3a8a" : "#fff", color: mode === m ? "#fff" : "#475569", borderColor: mode === m ? "#1e3a8a" : "#cbd5e1" }}>
      {icon}{label}
    </button>
  );
  const actBtn = (label: string, onClick: () => void, icon: JSX.Element, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
      {icon}{label}
    </button>
  );

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "#f5f3f0" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "#1e3a8a", color: "#fff" }}>
        <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 font-bold"><Home size={20} />Home</button>
        <div className="text-lg font-extrabold">Negative Counters</div>
        <div style={{ width: 70 }} />
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Tray + tools */}
        <div className="flex flex-col gap-3 p-3 md:w-64 shrink-0 overflow-y-auto" style={{ borderRight: "2px solid #d1d5db", background: "#f5f3f0" }}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Counters — drag or tap</div>
          <div className="flex items-center justify-around rounded-xl border-2 border-slate-200 bg-white p-3">
            {([1, -1] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div onPointerDown={(e) => startTrayDrag(e, s)} onClick={() => addCounter(s)} style={{ touchAction: "none", cursor: "grab" }}>
                  <CounterDot c={{ sign: s }} size={SIZE} />
                </div>
              </div>
            ))}
          </div>
          {actBtn("Add zero pair", addZeroPair, <Link2 size={14} />)}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Board</div>
          <div className="flex gap-2">
            {([["free", "Free"], ["table", "Table"]] as [Layout, string][]).map(([l, label]) => (
              <button key={l} onClick={() => { setLayout(l); if (l === "table") setItems((cur) => ensureCols(cur)); }} className="flex-1 rounded-lg px-3 py-1.5 text-sm font-bold border-2 transition-colors"
                style={{ background: layout === l ? "#1e3a8a" : "#fff", color: layout === l ? "#fff" : "#475569", borderColor: layout === l ? "#1e3a8a" : "#cbd5e1" }}>{label}</button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 -mt-1">{layout === "table" ? "A + row above a − row. Drag counters in: they snap into columns, so a + over a − is a zero pair." : "Drag counters anywhere on the board."}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">When +1 meets −1</div>
          <div className="flex gap-2">
            {([["pair", "Pair up"], ["collapse", "Collapse"]] as [Meet, string][]).map(([m, label]) => (
              <button key={m} onClick={() => setMeet(m)} className="flex-1 rounded-lg px-3 py-1.5 text-sm font-bold border-2 transition-colors"
                style={{ background: meet === m ? "#1e3a8a" : "#fff", color: meet === m ? "#fff" : "#475569", borderColor: meet === m ? "#1e3a8a" : "#cbd5e1" }}>{label}</button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 -mt-1">{layout === "table"
            ? (meet === "pair" ? "A + above a − is shaded and circled as a zero pair." : "Add a + and a − and they cancel and disappear.")
            : (meet === "pair" ? "Drop one onto the other: they sit together as a circled zero pair." : "Drop one onto the other: both disappear — they made zero.")}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Tool</div>
          <div className="flex flex-wrap gap-2">
            {modeBtn("move", "Move", <Hand size={14} />)}
            {modeBtn("flip", "Flip", <RefreshCw size={14} />)}
            {modeBtn("delete", "Take away", <X size={14} />)}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Actions</div>
          <div className="grid grid-cols-2 gap-2">
            {actBtn("Undo", undo, <Undo2 size={14} />, history.length === 0)}
            {actBtn("Clear", () => items.length && commit([]), <Trash2 size={14} />, items.length === 0)}
            {actBtn("Tidy", tidy, <LayoutGrid size={14} />, items.length === 0 || layout === "table")}
          </div>
          {actBtn("Remove zero pairs", removeZeroPairs, <X size={14} />, (layout === "table" ? tableMatched(ensureCols(items)) : pairUp(items)).size === 0)}
          {actBtn(showReadout ? "Hide value" : "Show value", () => setShowReadout((v) => !v), showReadout ? <EyeOff size={14} /> : <Eye size={14} />)}
        </div>

        {/* Board */}
        <div className="flex flex-1 min-h-0 min-w-0 flex-col p-3 gap-3">
          <div ref={boardRef} className="relative flex-1 min-h-[260px] overflow-hidden rounded-2xl border-2 border-slate-300 bg-white"
            style={{ touchAction: "none", minHeight: table ? LANE_H * 2 + 8 : undefined,
              ...(table ? {} : { backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: `${SNAP * 2}px ${SNAP * 2}px` }) }}>
            {table && (
              <>
                {/* zero-pair columns */}
                {[...table.full].map((i) => (
                  <div key={`b${i}`} style={{ position: "absolute", left: LABEL_W + i * SLOT, top: 0, width: SLOT, height: LANE_H * 2, background: "rgba(79,70,229,0.07)", borderLeft: "1px dashed #a5b4fc", borderRight: "1px dashed #a5b4fc" }} />
                ))}
                {/* the two rules and the + / − labels */}
                <div style={{ position: "absolute", left: LABEL_W, top: 0, width: 3, height: LANE_H * 2, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: LANE_H - 1, height: 3, background: "#334155" }} />
                <div style={{ position: "absolute", left: 0, top: 0, width: LABEL_W, height: LANE_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#a16207" }}>+</div>
                <div style={{ position: "absolute", left: 0, top: LANE_H, width: LABEL_W, height: LANE_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#b91c1c" }}>−</div>
              </>
            )}
            {items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold pointer-events-none">{table ? "Drag or tap counters in — yellow goes in the + row, red in the − row" : "Drag counters here, or tap them in"}</div>
            )}
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
          </div>
          {showReadout && (
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold">
              <span className="flex items-center gap-2"><span style={{ background: COUNTER_POS, width: 18, height: 18, borderRadius: "50%", display: "inline-block" }} />{pos} positive</span>
              <span className="flex items-center gap-2"><span style={{ background: COUNTER_NEG, width: 18, height: 18, borderRadius: "50%", display: "inline-block" }} />{neg} negative</span>
              <span className="text-slate-800">Value: {pos} − {neg} = <span style={{ color: net >= 0 ? "#a16207" : "#b91c1c" }}>{net < 0 ? `−${-net}` : net}</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
