import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MousePointer2, Pencil, Eraser, Trash2, Undo2, X, GripVertical } from "lucide-react";
import { HotBtn, PEN_COLORS, eraseNear, eraseWholeNear, strokePath, type Stroke } from "./BoardTools";

// ─────────────────────────────────────────────────────────────────────────────
// Ink overlay — write anywhere on any tool page.
//
// A transparent layer over the whole page with its own hotbar. Two states:
//   Draw   — the layer catches the pointer: DRAG = ink (pen) or erase; a short, still TAP is forwarded to whatever
//            is underneath, so buttons, tabs and switches still work without leaving Draw.
//   Frozen — the layer ignores the pointer (pointer-events: none): the ink stays visible and the page is fully live.
//
// Forwarded taps are synthetic events, so the browser won't run anything that needs a real click (popups — Print).
// Mark such a control `data-trusted-click`: tapping it while drawing freezes the layer and asks for a second tap,
// which then lands as a genuine click. Ink is stored in SCREEN (viewport) coordinates, like a screen-annotation tool:
// it stays exactly where it was drawn when the page re-lays out (Whiteboard fullscreen changes the page height and
// scroll position) or scrolls — page-anchored ink slid and skewed against the content when that happened.
// ─────────────────────────────────────────────────────────────────────────────

export type InkMode = "frozen" | "pen" | "eraser";

const TAP_MAX_MS = 300;          // a press shorter than this that stays put is a tap
const DRAG_PX = 6;               // moving further than this turns a press into ink
// Pen thickness and eraser size (radius) options, and how the eraser works: "part" rubs out just the bit it passes over
// (splitting a line), "line" deletes every whole continuous line it touches. Remembered between visits.
export const PEN_WIDTHS = [2, 4, 7, 12] as const;
export const ERASER_SIZES = [8, 16, 30] as const;
export type EraseMode = "part" | "line";
export interface InkPrefs { penWidth: number; eraserR: number; eraseMode: EraseMode }
export const DEFAULT_PREFS: InkPrefs = { penWidth: 4, eraserR: 16, eraseMode: "part" };
const PREFS_KEY = "mt-ink-prefs";
function loadPrefs(): InkPrefs {
  try {
    const d = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (d && (PEN_WIDTHS as readonly number[]).includes(d.penWidth) && (ERASER_SIZES as readonly number[]).includes(d.eraserR) && (d.eraseMode === "part" || d.eraseMode === "line")) return d;
  } catch { /* private mode etc. */ }
  return DEFAULT_PREFS;
}

/** Erase at (x, y) with the chosen mode and size. */
export const eraseAt = (strokes: Stroke[], x: number, y: number, prefs: InkPrefs): Stroke[] =>
  (prefs.eraseMode === "line" ? eraseWholeNear : eraseNear)(strokes, x, y, prefs.eraserR);


// ── Hotbar placement ─────────────────────────────────────────────────────────
// The hotbar is movable: drag its grip. Dropped against a side edge it docks there and turns vertical (out of the way
// of the question); anywhere else it lies flat. The snap zone is deliberately tight (EDGE px from the screen edge) — a wide
// zone made a docked bar "lock": a gentle drag away was still inside it and re-docked on release. The position is stored as the bar's CENTRE as a fraction of the
// viewport, so it survives resizes and the bar changing shape; double-click the grip to reset.
export interface HotbarDock { v: boolean; cx: number; cy: number }
const EDGE = 28, MARGIN = 8, CLICK_PX = 4, DOCK_KEY = "mt-ink-hotbar";
/** The area fixed-position elements actually live in: the window minus any classic scrollbar (innerWidth includes it,
 *  which pushed a right-docked bar ~15px under the scrollbar). */
const viewport = () => ({ w: document.documentElement.clientWidth || window.innerWidth, h: document.documentElement.clientHeight || window.innerHeight });
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const clamp01 = (n: number) => clamp(n, 0, 1);

/** Out of the box: a vertical bar on the right edge (a phone gets it flat along the bottom). */
export const defaultDock = (vw: number): HotbarDock => (vw < 640 ? { v: false, cx: 0.5, cy: 1 } : { v: true, cx: 1, cy: 0.5 });

/** Where a bar dropped docks. The edge zones follow the POINTER (where the teacher is dragging to — the grip sits at one
 *  end of a flat bar, so its centre is far from the pointer and would make one side unreachable); the bar's position
 *  along the edge, or its free position, follows its centre. Side edges go vertical, everything else flat. */
export function dockFromDrop(pointer: { x: number; y: number }, centre: { x: number; y: number }, vw: number, vh: number): HotbarDock {
  const cx = clamp01(centre.x / vw), cy = clamp01(centre.y / vh);
  if (pointer.x < EDGE) return { v: true, cx: 0, cy };
  if (pointer.x > vw - EDGE) return { v: true, cx: 1, cy };
  if (pointer.y > vh - EDGE) return { v: false, cx, cy: 1 };
  if (pointer.y < EDGE) return { v: false, cx, cy: 0 };
  return { v: false, cx, cy };
}

/** Top-left of a bar of size w × h for a dock, kept fully on screen. */
export function placeHotbar(d: HotbarDock, vw: number, vh: number, w: number, h: number) {
  return { left: clamp(d.cx * vw - w / 2, MARGIN, Math.max(MARGIN, vw - w - MARGIN)), top: clamp(d.cy * vh - h / 2, MARGIN, Math.max(MARGIN, vh - h - MARGIN)) };
}

function loadDock(): HotbarDock {
  try {
    const d = JSON.parse(localStorage.getItem(DOCK_KEY) ?? "null");
    if (d && typeof d.v === "boolean" && Number.isFinite(d.cx) && Number.isFinite(d.cy)) return { v: d.v, cx: clamp01(d.cx), cy: clamp01(d.cy) };
  } catch { /* private mode etc. */ }
  return defaultDock(viewport().w);
}
const saveDock = (d: HotbarDock | null) => { try { if (d) localStorage.setItem(DOCK_KEY, JSON.stringify(d)); else localStorage.removeItem(DOCK_KEY); } catch { /* ignore */ } };

/** What a finished press was: a tap to forward, a held press that draws a dot, or nothing (it became ink). */
export function classifyPress(movedPx: number, ms: number, becameInk: boolean): "ink" | "tap" | "dot" {
  if (becameInk || movedPx > DRAG_PX) return "ink";
  return ms < TAP_MAX_MS ? "tap" : "dot";
}

/** Deliver a tap to the element under (x, y) as the events a real press would fire. Returns the target, or null. */
function forwardTap(x: number, y: number, pointerType: string): Element | null {
  const target = document.elementsFromPoint(x, y).find((e) => !e.closest("[data-ink-ui]")) ?? null;
  if (!target) return null;
  const base = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: window, button: 0 };
  target.dispatchEvent(new PointerEvent("pointerdown", { ...base, pointerId: 1, pointerType, isPrimary: true, buttons: 1 }));
  target.dispatchEvent(new MouseEvent("mousedown", { ...base, buttons: 1 }));
  if (target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable='true']")) target.focus();
  target.dispatchEvent(new PointerEvent("pointerup", { ...base, pointerId: 1, pointerType, isPrimary: true, buttons: 0 }));
  target.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
  target.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0 }));
  return target;
}

export function InkOverlay() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InkMode>("frozen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [prefs, setPrefsState] = useState<InkPrefs>(loadPrefs);
  const setPrefs = (patch: Partial<InkPrefs>) => setPrefsState((p) => { const n = { ...p, ...patch }; try { localStorage.setItem(PREFS_KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);   // eraser size ring follows the pointer
  const lastErase = useRef<{ x: number; y: number } | null>(null);
  const [menu, setMenu] = useState<"pen" | "eraser" | null>(null);   // which tool's options flyout is open
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [live, setLive] = useState<Stroke | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ x0: number; y0: number; t0: number; type: string; ink: boolean; pts: { x: number; y: number }[] } | null>(null);
  const [dock, setDock] = useState<HotbarDock>(loadDock);
  const [drag, setDrag] = useState<{ px: number; py: number; x: number; y: number } | null>(null);   // live centre (px, py) and pointer (x, y) while dragging
  const [size, setSize] = useState({ w: 56, h: 460 });
  const barRef = useRef<HTMLDivElement>(null);
  const grab = useRef<{ dx: number; dy: number } | null>(null);
  // The latest drag position lives in a ref too: React batches pointermove updates, so when the last move and the release
  // arrive together (a quick flick) the release handler's `drag` state is a render behind and would dock from a stale spot.
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const [vp, setVp] = useState(viewport);
  const liveRef = useRef<Stroke | null>(null);   // the stroke being drawn (state mirrors it for rendering)
  const hintTimer = useRef<number | undefined>(undefined);

  const showHint = useCallback((s: string) => {
    setHint(s);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  // measure the bar (its size changes with orientation and wrapping) and track the viewport
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const m = () => setSize((z) => (Math.abs(z.w - el.offsetWidth) < 1 && Math.abs(z.h - el.offsetHeight) < 1 ? z : { w: el.offsetWidth, h: el.offsetHeight }));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    // the scrollbar can appear or vanish without a window resize (the page grows or shrinks), so watch the root element too
    const onResize = () => setVp((v) => { const n = viewport(); return n.w === v.w && n.h === v.h ? v : n; });
    const rootRo = new ResizeObserver(onResize);
    rootRo.observe(document.documentElement);
    window.addEventListener("resize", onResize);
    return () => { ro.disconnect(); rootRo.disconnect(); window.removeEventListener("resize", onResize); };
  }, [open, dock.v]);

  const gripDown = (e: React.PointerEvent) => {
    const el = barRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    grab.current = { dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
    dragRef.current = { px: r.left + r.width / 2, py: r.top + r.height / 2, x: e.clientX, y: e.clientY };
    downAt.current = { x: e.clientX, y: e.clientY };
    setDrag(dragRef.current);
  };
  const gripMove = (e: React.PointerEvent) => {
    if (!grab.current) return;
    dragRef.current = { px: e.clientX - grab.current.dx, py: e.clientY - grab.current.dy, x: e.clientX, y: e.clientY };
    setDrag(dragRef.current);
  };
  const gripUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const moved = downAt.current ? Math.hypot(e.clientX - downAt.current.x, e.clientY - downAt.current.y) > CLICK_PX : true;
    if (grab.current && d && moved) {
      // use the release position itself when we have it (the final move may not have been processed yet)
      const last = grab.current;
      const x = e.clientX, y = e.clientY;
      const v = viewport();
      const dock = dockFromDrop({ x, y }, { x: x - last.dx, y: y - last.dy }, v.w, v.h);
      setDock(dock); saveDock(dock);
    }
    grab.current = null;
    dragRef.current = null;
    downAt.current = null;
    setDrag(null);
  };
  const resetDock = () => { const d = defaultDock(viewport().w); setDock(d); saveDock(null); };

  // Esc freezes the layer
  useEffect(() => {
    if (mode === "frozen") return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { if (menu) setMenu(null); else setMode("frozen"); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mode, menu]);

  const page = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY });

  const onDown = (e: React.PointerEvent) => {
    setMenu(null);
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    layerRef.current?.setPointerCapture(e.pointerId);
    const p = page(e);
    // a stylus always inks; finger / mouse decide on movement
    press.current = { x0: e.clientX, y0: e.clientY, t0: performance.now(), type: e.pointerType, ink: e.pointerType === "pen", pts: [p] };
    if (press.current.ink) beginInk(p);
  };
  // sweep the eraser from where it last was to here, so a fast move leaves no un-erased gaps
  const eraseTo = (p: { x: number; y: number }) => {
    const from = lastErase.current ?? p;
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / Math.max(2, prefs.eraserR / 2)));
    setStrokes((s) => { let out = s; for (let i = 1; i <= steps; i++) out = eraseAt(out, from.x + ((p.x - from.x) * i) / steps, from.y + ((p.y - from.y) * i) / steps, prefs); return out; });
    lastErase.current = p;
  };
  const beginInk = (p: { x: number; y: number }) => {
    if (mode === "eraser") { lastErase.current = null; eraseTo(p); }
    else { liveRef.current = { color, width: prefs.penWidth, points: [p] }; setLive(liveRef.current); }
  };
  const onMove = (e: React.PointerEvent) => {
    const pr = press.current;
    if (!pr || !e.isPrimary) return;
    const p = page(e);
    if (!pr.ink && Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0) > DRAG_PX) {
      pr.ink = true;
      beginInk(pr.pts[0]);                       // start the stroke where the press began
    }
    if (!pr.ink) return;
    if (mode === "eraser") eraseTo(p);
    else if (liveRef.current) { liveRef.current = { ...liveRef.current, points: [...liveRef.current.points, p] }; setLive(liveRef.current); }
  };
  const onUp = (e: React.PointerEvent) => {
    const pr = press.current;
    press.current = null;
    if (!pr) return;
    const kind = classifyPress(Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0), performance.now() - pr.t0, pr.ink);
    if (kind === "ink") {
      const done = liveRef.current;
      liveRef.current = null;
      setLive(null);
      if (done && done.points.length >= 2) setStrokes((s) => [...s, done]);
    } else if (kind === "dot") {
      if (mode === "pen") setStrokes((s) => [...s, { color, width: prefs.penWidth, points: [pr.pts[0], { x: pr.pts[0].x + 0.1, y: pr.pts[0].y }] }]);
    } else {
      // a tap: let the page have it
      const under = document.elementsFromPoint(e.clientX, e.clientY).find((el) => !el.closest("[data-ink-ui]"));
      if (under?.closest("[data-trusted-click]")) { setMode("frozen"); showHint("Frozen — tap again"); return; }
      forwardTap(e.clientX, e.clientY, pr.type);
    }
  };

  const draw = mode !== "frozen";
  const all = live ? [...strokes, live] : strokes;

  return (
    <div data-ink-ui>
      <style>{"@media print { [data-ink-ui] { display: none !important; } }"}</style>

      {/* the ink — screen coordinates: it stays where it was drawn */}
      {all.length > 0 && (
        <svg aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2000 }}>
          <g>
            {all.map((s, i) => (
              <path key={i} d={strokePath(s.points)} fill="none" stroke={s.color} strokeWidth={s.width ?? 3} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
        </svg>
      )}

      {/* the catching layer — only present while drawing */}
      {draw && (
        <div ref={layerRef} onPointerDown={onDown} onPointerMove={(e) => { if (mode === "eraser") setCursor({ x: e.clientX, y: e.clientY }); onMove(e); }} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => setCursor(null)}
          style={{ position: "fixed", inset: 0, zIndex: 2001, touchAction: "none", cursor: mode === "eraser" ? "none" : "crosshair", background: "transparent" }} />
      )}

      {/* the eraser's size, drawn at the pointer */}
      {draw && mode === "eraser" && cursor && (
        <div aria-hidden="true" style={{ position: "fixed", left: cursor.x - prefs.eraserR, top: cursor.y - prefs.eraserR, width: prefs.eraserR * 2, height: prefs.eraserR * 2, borderRadius: "50%", border: `2px solid ${prefs.eraseMode === "line" ? "#dc2626" : "#475569"}`, background: "rgba(255,255,255,0.35)", pointerEvents: "none", zIndex: 2002 }} />
      )}

      {/* opener */}
      {!open && (
        <button onClick={() => { setOpen(true); setMode("pen"); }} title="Write on the page"
          style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2003, width: 46, height: 46, borderRadius: "50%", border: "none", cursor: "pointer", background: "#2d3340", boxShadow: "0 6px 20px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pencil size={20} color="#e2e8f0" />
        </button>
      )}

      {/* while dragging: light the edge the bar will dock to if released now */}
      {open && drag && (() => {
        const t = dockFromDrop({ x: drag.x, y: drag.y }, { x: drag.px, y: drag.py }, vp.w, vp.h);
        const edge = t.v ? (t.cx === 0 ? "left" : "right") : t.cy === 1 ? "bottom" : t.cy === 0 ? "top" : null;
        if (!edge) return null;
        const thick = 6;
        const st: React.CSSProperties = { position: "fixed", zIndex: 2002, pointerEvents: "none", background: "rgba(59,130,246,0.55)", borderRadius: 3,
          ...(edge === "left" ? { left: 0, top: 0, bottom: 0, width: thick } : edge === "right" ? { right: 0, top: 0, bottom: 0, width: thick } : edge === "top" ? { top: 0, left: 0, right: 0, height: thick } : { bottom: 0, left: 0, right: 0, height: thick }) };
        return <div aria-hidden="true" style={st} />;
      })()}

      {/* hotbar — movable: drag the grip; docks vertical against a side edge */}
      {open && (() => {
        const live = drag ? { v: dock.v, cx: drag.px / vp.w, cy: drag.py / vp.h } : dock;
        const pos = placeHotbar(live, vp.w, vp.h, size.w, size.h);
        const v = dock.v;
        const rule = v ? { width: 26, height: 1, background: "#475569", margin: "2px 0" } : { width: 1, height: 26, background: "#475569", margin: "0 2px" };
        // Options flyouts open PERPENDICULAR to the bar (a flat bar gets a column above/below, a vertical bar a row to the side)
        // on whichever side has more room. They are absolutely positioned children of the tool button, so they never
        // affect the bar's own size, measurement or docking.
        const above = v ? false : pos.top > vp.h - (pos.top + size.h);
        const towardsLeft = v ? pos.left > vp.w - (pos.left + size.w) : false;
        const place: React.CSSProperties = v
          ? { top: "50%", transform: "translateY(-50%)", ...(towardsLeft ? { right: "calc(100% + 16px)" } : { left: "calc(100% + 16px)" }) }
          : { left: "50%", transform: "translateX(-50%)", ...(above ? { bottom: "calc(100% + 16px)" } : { top: "calc(100% + 16px)" }) };
        const flyout = (children: React.ReactNode) => (
          <div role="menu" style={{ position: "absolute", ...place, display: "flex", flexDirection: v ? "row" : "column", alignItems: "center", gap: 4, padding: "6px", background: "#2d3340", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.35)", zIndex: 2005 }}>{children}</div>
        );
        const sizeLabel = (i: number, n: number) => (i === 0 ? "small" : i === n - 1 ? "large" : "medium");
        const menuFor = (t: "pen" | "eraser") => t === "pen" ? flyout(
          PEN_WIDTHS.map((w, i) => (
            <HotBtn key={w} active={prefs.penWidth === w} onClick={() => { setPrefs({ penWidth: w }); setMenu(null); }} title={`Pen thickness — ${sizeLabel(i, PEN_WIDTHS.length)}`}>
              <span style={{ width: 20, height: w, borderRadius: w, background: "#e2e8f0", display: "block" }} />
            </HotBtn>
          )),
        ) : flyout(
          <>
            {ERASER_SIZES.map((r, i) => (
              <HotBtn key={r} active={prefs.eraserR === r} onClick={() => { setPrefs({ eraserR: r }); setMenu(null); }} title={`Eraser size — ${sizeLabel(i, ERASER_SIZES.length)}`}>
                <span style={{ width: 6 + r / 2.2, height: 6 + r / 2.2, borderRadius: "50%", border: "2px solid #e2e8f0", display: "block" }} />
              </HotBtn>
            ))}
            <div style={v ? { width: 1, height: 26, background: "#475569", margin: "0 2px" } : { width: 26, height: 1, background: "#475569", margin: "2px 0" }} />
            <HotBtn active={prefs.eraseMode === "part"} onClick={() => { setPrefs({ eraseMode: "part" }); setMenu(null); }} title="Part — rub out just the bit you touch">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2.2" strokeLinecap="round"><path d="M2.5 15h6M15.5 15h6" /><circle cx="12" cy="15" r="3" strokeDasharray="2 2" strokeWidth="1.6" /></svg>
            </HotBtn>
            <HotBtn active={prefs.eraseMode === "line"} onClick={() => { setPrefs({ eraseMode: "line" }); setMenu(null); }} title="Whole line — delete the entire continuous line you touch">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17C6 8 10 22 14 13s6-3 7.5-4" stroke="#e2e8f0" strokeWidth="2.2" /><path d="M16.5 3.5l5 5M21.5 3.5l-5 5" stroke="#fca5a5" strokeWidth="2.2" /></svg>
            </HotBtn>
          </>,
        );
        // a tool button: first tap selects the tool, a second tap opens its options (a small corner tick marks that it has some)
        const toolBtn = (t: "pen" | "eraser", icon: React.ReactNode, title: string) => (
          <div key={t} style={{ position: "relative", flexShrink: 0 }}>
            <HotBtn active={mode === t} onClick={() => { if (mode === t) setMenu(menu === t ? null : t); else { setMode(t); setMenu(null); } }} title={title}>{icon}</HotBtn>
            <span aria-hidden="true" style={{ position: "absolute", right: 3, bottom: 3, width: 0, height: 0, borderLeft: "5px solid transparent", borderBottom: `5px solid ${menu === t ? "#4ade80" : "rgba(226,232,240,0.55)"}`, pointerEvents: "none" }} />
            {menu === t && mode === t && menuFor(t)}
          </div>
        );
        return (
          <div ref={barRef} onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 2003, display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", gap: 4, padding: "6px 8px", background: "#2d3340", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.35)", width: "max-content", height: "max-content", maxWidth: vp.w - 16, maxHeight: vp.h - 16, flexWrap: "wrap", justifyContent: "center" }}>
            <div onPointerDown={gripDown} onPointerMove={gripMove} onPointerUp={gripUp} onPointerCancel={gripUp} onDoubleClick={resetDock} title="Drag to move (double-click to reset). Dock on a side edge for a vertical bar."
              style={{ width: v ? 38 : 22, height: v ? 22 : 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: drag ? "grabbing" : "grab", touchAction: "none", flexShrink: 0 }}>
              <GripVertical size={18} color="#94a3b8" style={{ transform: v ? "rotate(90deg)" : "none" }} />
            </div>
            <HotBtn active={mode === "frozen"} onClick={() => { setMode("frozen"); setMenu(null); }} title="Freeze — use the page (ink stays)"><MousePointer2 size={18} color="#e2e8f0" /></HotBtn>
            {toolBtn("pen", <Pencil size={18} color="#e2e8f0" />, "Pen — drag to write, tap to press buttons. Tap again for thickness")}
            {toolBtn("eraser", <Eraser size={18} color="#e2e8f0" />, "Eraser — tap again for size and what it deletes")}
            <HotBtn active={false} onClick={() => setStrokes((s) => s.slice(0, -1))} title="Undo last stroke" disabled={strokes.length === 0}><Undo2 size={18} color={strokes.length ? "#e2e8f0" : "#64748b"} /></HotBtn>
            <HotBtn active={false} onClick={() => setStrokes([])} title="Clear all ink" disabled={strokes.length === 0}><Trash2 size={18} color={strokes.length ? "#fca5a5" : "#64748b"} /></HotBtn>
            <div style={rule} />
            {PEN_COLORS.map((c) => (
              <button key={c} onClick={() => { setColor(c); setMode("pen"); setMenu(null); }} title="Pen colour"
                style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", padding: 0, flexShrink: 0, border: color === c ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.2)" }} />
            ))}
            <div style={rule} />
            <HotBtn active={false} onClick={() => { setMode("frozen"); setMenu(null); setOpen(false); }} title="Close (ink stays)"><X size={18} color="#e2e8f0" /></HotBtn>
          </div>
        );
      })()}

      {hint && (
        <div role="status" style={{ position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)", zIndex: 2004, background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 999, boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>{hint}</div>
      )}
    </div>
  );
}
