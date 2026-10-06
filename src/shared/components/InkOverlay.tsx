import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MousePointer2, Pencil, Eraser, Trash2, Undo2, X, GripVertical } from "lucide-react";
import { HotBtn, PEN_COLORS, eraseNear, strokePath, type Stroke } from "./BoardTools";

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
const INK_WIDTH = 3;


// ── Hotbar placement ─────────────────────────────────────────────────────────
// The hotbar is movable: drag its grip. Dropped against a side edge it docks there and turns vertical (out of the way
// of the question); anywhere else it lies flat. The position is stored as the bar's CENTRE as a fraction of the
// viewport, so it survives resizes and the bar changing shape; double-click the grip to reset.
export interface HotbarDock { v: boolean; cx: number; cy: number }
const EDGE = 90, MARGIN = 8, DOCK_KEY = "mt-ink-hotbar";
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
  return defaultDock(window.innerWidth);
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
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
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
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => { ro.disconnect(); window.removeEventListener("resize", onResize); };
  }, [open, dock.v]);

  const gripDown = (e: React.PointerEvent) => {
    const el = barRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    grab.current = { dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
    setDrag({ px: r.left + r.width / 2, py: r.top + r.height / 2, x: e.clientX, y: e.clientY });
  };
  const gripMove = (e: React.PointerEvent) => { if (grab.current) setDrag({ px: e.clientX - grab.current.dx, py: e.clientY - grab.current.dy, x: e.clientX, y: e.clientY }); };
  const gripUp = () => {
    if (grab.current && drag) { const d = dockFromDrop({ x: drag.x, y: drag.y }, { x: drag.px, y: drag.py }, window.innerWidth, window.innerHeight); setDock(d); saveDock(d); }
    grab.current = null;
    setDrag(null);
  };
  const resetDock = () => { const d = defaultDock(window.innerWidth); setDock(d); saveDock(null); };

  // Esc freezes the layer
  useEffect(() => {
    if (mode === "frozen") return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMode("frozen"); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mode]);

  const page = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY });

  const onDown = (e: React.PointerEvent) => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    layerRef.current?.setPointerCapture(e.pointerId);
    const p = page(e);
    // a stylus always inks; finger / mouse decide on movement
    press.current = { x0: e.clientX, y0: e.clientY, t0: performance.now(), type: e.pointerType, ink: e.pointerType === "pen", pts: [p] };
    if (press.current.ink) beginInk(p);
  };
  const beginInk = (p: { x: number; y: number }) => {
    if (mode === "eraser") setStrokes((s) => eraseNear(s, p.x, p.y));
    else { liveRef.current = { color, points: [p] }; setLive(liveRef.current); }
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
    if (mode === "eraser") setStrokes((s) => eraseNear(s, p.x, p.y));
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
      if (mode === "pen") setStrokes((s) => [...s, { color, points: [pr.pts[0], { x: pr.pts[0].x + 0.1, y: pr.pts[0].y }] }]);
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
              <path key={i} d={strokePath(s.points)} fill="none" stroke={s.color} strokeWidth={INK_WIDTH} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
        </svg>
      )}

      {/* the catching layer — only present while drawing */}
      {draw && (
        <div ref={layerRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ position: "fixed", inset: 0, zIndex: 2001, touchAction: "none", cursor: mode === "eraser" ? "cell" : "crosshair", background: "transparent" }} />
      )}

      {/* opener */}
      {!open && (
        <button onClick={() => { setOpen(true); setMode("pen"); }} title="Write on the page"
          style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2003, width: 46, height: 46, borderRadius: "50%", border: "none", cursor: "pointer", background: "#2d3340", boxShadow: "0 6px 20px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pencil size={20} color="#e2e8f0" />
        </button>
      )}

      {/* hotbar — movable: drag the grip; docks vertical against a side edge */}
      {open && (() => {
        const live = drag ? { v: dock.v, cx: drag.px / vp.w, cy: drag.py / vp.h } : dock;
        const pos = placeHotbar(live, vp.w, vp.h, size.w, size.h);
        const v = dock.v;
        const rule = v ? { width: 26, height: 1, background: "#475569", margin: "2px 0" } : { width: 1, height: 26, background: "#475569", margin: "0 2px" };
        return (
          <div ref={barRef} onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 2003, display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", gap: 4, padding: "6px 8px", background: "#2d3340", borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.35)", maxWidth: "calc(100vw - 16px)", maxHeight: "calc(100vh - 16px)", flexWrap: "wrap", justifyContent: "center", transition: drag ? "none" : "left 0.15s, top 0.15s" }}>
            <div onPointerDown={gripDown} onPointerMove={gripMove} onPointerUp={gripUp} onPointerCancel={gripUp} onDoubleClick={resetDock} title="Drag to move (double-click to reset). Dock on a side edge for a vertical bar."
              style={{ width: v ? 38 : 22, height: v ? 22 : 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: drag ? "grabbing" : "grab", touchAction: "none", flexShrink: 0 }}>
              <GripVertical size={18} color="#94a3b8" style={{ transform: v ? "rotate(90deg)" : "none" }} />
            </div>
            <HotBtn active={mode === "frozen"} onClick={() => setMode("frozen")} title="Freeze — use the page (ink stays)"><MousePointer2 size={18} color="#e2e8f0" /></HotBtn>
            <HotBtn active={mode === "pen"} onClick={() => setMode("pen")} title="Pen — drag to write, tap to press buttons"><Pencil size={18} color="#e2e8f0" /></HotBtn>
            <HotBtn active={mode === "eraser"} onClick={() => setMode("eraser")} title="Eraser"><Eraser size={18} color="#e2e8f0" /></HotBtn>
            <HotBtn active={false} onClick={() => setStrokes((s) => s.slice(0, -1))} title="Undo last stroke" disabled={strokes.length === 0}><Undo2 size={18} color={strokes.length ? "#e2e8f0" : "#64748b"} /></HotBtn>
            <HotBtn active={false} onClick={() => setStrokes([])} title="Clear all ink" disabled={strokes.length === 0}><Trash2 size={18} color={strokes.length ? "#fca5a5" : "#64748b"} /></HotBtn>
            <div style={rule} />
            {PEN_COLORS.map((c) => (
              <button key={c} onClick={() => { setColor(c); setMode("pen"); }} title="Pen colour"
                style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", padding: 0, flexShrink: 0, border: color === c ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.2)" }} />
            ))}
            <div style={rule} />
            <HotBtn active={false} onClick={() => { setMode("frozen"); setOpen(false); }} title="Close (ink stays)"><X size={18} color="#e2e8f0" /></HotBtn>
          </div>
        );
      })()}

      {hint && (
        <div role="status" style={{ position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)", zIndex: 2004, background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 999, boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>{hint}</div>
      )}
    </div>
  );
}
