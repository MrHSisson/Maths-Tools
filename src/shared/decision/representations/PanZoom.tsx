import { useEffect, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// PanZoom — a frame the sandbox puts a picture in: drag the background to pan, wheel / pinch / buttons to zoom.
// It knows nothing about networks. A child that handles its own press (dragging a vertex) calls stopPropagation()
// on pointerdown and the frame leaves it alone. A question's picture is NEVER wrapped in this — it is static.
// ═══════════════════════════════════════════════════════════════════════════

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function PanZoom({ children, resetKey, background = "#f8fafc", grid = false }: { children: React.ReactNode; resetKey?: string | number; background?: string; grid?: boolean }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);

  const reset = () => { setPan({ x: 0, y: 0 }); setScale(1); };
  useEffect(reset, [resetKey]);

  /** zoom about a point of the frame (client coordinates) */
  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const r = frame.current!.getBoundingClientRect();
    const cx = clientX - r.left, cy = clientY - r.top;
    setScale((prev) => {
      const next = clamp(prev * factor, 0.4, 4);
      setPan((p) => ({ x: cx - (cx - p.x) * (next / prev), y: cy - (cy - p.y) * (next / prev) }));
      return next;
    });
  };
  const zoomCentre = (factor: number) => {
    const r = frame.current!.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  };

  // wheel needs a non-passive listener to stop the page scrolling
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const on = (e: WheelEvent) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 1 / 1.1); };
    el.addEventListener("wheel", on, { passive: false });
    return () => el.removeEventListener("wheel", on);
  }, []);

  const down = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale };
      drag.current = null;
    } else drag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.current.s * (d / pinch.current.d)) / scale);
      return;
    }
    const p = drag.current;
    if (p) setPan({ x: p.px + (e.clientX - p.sx), y: p.py + (e.clientY - p.sy) });
  };
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  return (
    <div
      ref={frame}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{
        position: "absolute", inset: 0, overflow: "hidden", touchAction: "none", cursor: "grab", background,
        ...(grid ? { backgroundImage: "radial-gradient(#cfd6df 1.2px, transparent 1.2px)", backgroundSize: "28px 28px" } : null),
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}>{children}</div>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: "absolute", left: 12, bottom: 12, display: "flex", alignItems: "center", gap: 2, padding: 3, borderRadius: 12, background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.12)" }}
      >
        <Btn onClick={() => zoomCentre(1 / 1.2)} title="Zoom out"><ZoomOut size={17} /></Btn>
        <div style={{ minWidth: 42, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b" }}>{Math.round(scale * 100)}%</div>
        <Btn onClick={() => zoomCentre(1.2)} title="Zoom in"><ZoomIn size={17} /></Btn>
        <Btn onClick={reset} title="Reset view"><Maximize2 size={17} /></Btn>
      </div>
    </div>
  );
}

function Btn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
  );
}
