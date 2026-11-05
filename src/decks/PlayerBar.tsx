import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, GripVertical, Minimize, SlidersHorizontal } from "lucide-react";
import { usePref } from "./EditorChrome";

// The full-screen controls: one small bar that is the same on every slide (grip, Back, the count, Next, Slide options, Leave full screen), so it never changes size
// as slides with and without boards come and go. What a slide can offer (how much is filled in, a timer, jumping, printing, leaving full screen)
// is in the Slide options pop-out. The bar is dragged along the bottom by its grip, and keeps clear of the ink pencil and the ink hotbar.

const MARGIN = 8, BOTTOM = 16;
const INK_RESERVE = 74;        // the ink pencil docks bottom right: 16 from the edge, 46 wide
const POP_W = 340;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where the left edge of a bar `w` wide goes, given where its centre was left (a fraction of the window's width). Keeps it on screen and out of the ink pencil's corner. */
export function barLeft(cx: number, w: number, vw: number): number {
  const reserve = vw <= 640 ? MARGIN : INK_RESERVE;                      // on a phone the pencil is a tab at the side, not in the bottom corner
  const max = vw - reserve - w;
  return max < MARGIN ? MARGIN : clamp(cx * vw - w / 2, MARGIN, max);
}

/** How far the bar must rise to clear any ink control it would overlap (its own rectangle at the bottom, against the ink rectangles). */
export function liftAbove(bar: { left: number; right: number; height: number }, vh: number, ink: { left: number; right: number; top: number; bottom: number }[]): number {
  const bottom = vh - BOTTOM, top = bottom - bar.height;
  let lift = 0;
  for (const r of ink) {
    const across = bar.left < r.right + MARGIN && bar.right > r.left - MARGIN, down = bottom > r.top - MARGIN && top < r.bottom + MARGIN;
    if (across && down) lift = Math.max(lift, bottom - (r.top - MARGIN));
  }
  return lift;
}

export function PlayerBar({ visible, count, onBack, onNext, onLeave, backDisabled, nextDisabled, btn, children }: {
  /** Fades out when false (the bar is hidden after the mouse rests); it stays while the pop-out is open or the bar is being dragged. */
  visible: boolean; count: string; onBack: () => void; onNext: () => void; onLeave: () => void; backDisabled: boolean; nextDisabled: boolean; btn: string;
  /** The pop-out's contents; given `close` to shut it. */
  children: (close: () => void) => ReactNode;
}) {
  const [cx, setCx] = usePref("player-bar-x", 0.5);
  const [live, setLive] = useState<number | null>(null);                   // the centre while dragging
  const [open, setOpen] = useState(false);
  const [vp, setVp] = useState({ w: typeof window === "undefined" ? 1366 : window.innerWidth, h: typeof window === "undefined" ? 768 : window.innerHeight });
  const [size, setSize] = useState({ w: 330, h: 56 });
  const [lift, setLift] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const grab = useRef(0);

  useEffect(() => { const f = () => setVp({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  useLayoutEffect(() => { const r = ref.current?.getBoundingClientRect(); if (r && (Math.abs(r.width - size.w) > 0.5 || Math.abs(r.height - size.h) > 0.5)) setSize({ w: r.width, h: r.height }); }, [size.w, size.h, vp.w]);

  const left = barLeft(live ?? cx, size.w, vp.w);

  // keep clear of the ink pencil and hotbar, which can be anywhere: look now and then (they move when the teacher opens or drags them)
  const check = useCallback(() => {
    const ink = [...document.querySelectorAll("[data-ink-bar]")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
    const next = liftAbove({ left, right: left + size.w, height: size.h }, window.innerHeight, ink);
    setLift((l) => (Math.abs(l - next) < 1 ? l : next));
  }, [left, size.w, size.h]);
  useEffect(() => { check(); const t = window.setInterval(check, 300); return () => window.clearInterval(t); }, [check]);

  const down = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    grab.current = r.left + r.width / 2 - e.clientX;                       // keep the bar where it was grabbed
    e.currentTarget.setPointerCapture(e.pointerId);
    setLive(cx);
  };
  const move = (e: React.PointerEvent) => { if (live !== null) setLive((e.clientX + grab.current) / vp.w); };
  const up = () => { if (live !== null) { setCx(live); setLive(null); } };

  const shown = visible || open || live !== null;
  const popLeft = left + size.w - POP_W < MARGIN;                           // near the left edge, open to the right instead
  return (
    <div ref={ref} data-player-bar className="fixed z-30 flex items-center gap-2 rounded-2xl bg-white/90 p-1.5 shadow-lift backdrop-blur transition-opacity duration-300"
      style={{ left, bottom: BOTTOM + lift, opacity: shown ? 1 : 0, pointerEvents: shown ? "auto" : "none" }}>
      <button type="button" aria-label="Move these controls" title="Drag to move along the bottom" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        className="inline-flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"><GripVertical size={18} /></button>
      <button className={btn} onClick={onBack} disabled={backDisabled} aria-label="Back"><ChevronLeft size={20} /></button>
      <span className="w-16 text-center text-sm font-semibold tabular-nums text-slate-600">{count}</span>
      <button className={btn} onClick={onNext} disabled={nextDisabled} aria-label="Next"><ChevronRight size={20} /></button>
      <button className={`${btn} ${open ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Slide options" title="Options for this slide"><SlidersHorizontal size={18} />Slide options</button>
      <button className={btn} onClick={onLeave} aria-label="Leave full screen" title="Leave full screen (Esc)"><Minimize size={18} /></button>
      {open && (
        <div role="dialog" aria-label="Slide options" onPointerDown={(e) => e.stopPropagation()} className="absolute bottom-full mb-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-300 bg-white p-3 text-sm shadow-lift"
          style={{ width: Math.min(POP_W, vp.w - 2 * MARGIN), ...(popLeft ? { left: 0 } : { right: 0 }) }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
