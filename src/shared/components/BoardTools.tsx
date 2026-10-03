import type React from "react";
import { MousePointer2, Hand, Pencil, Eraser, Trash2 } from "lucide-react";

// The floating whiteboard toolbar shared by the interactive sandboxes (Algebra Tiles, Negative Counters):
// Select · Grab/pan · Pen · Eraser · Clear drawings · pen colours — plus the freehand-ink helpers behind it.

export interface Stroke {
  color: string;
  points: { x: number; y: number }[];
}

export const PEN_COLORS = ["#1e3a5f", "#dc2626", "#16a34a", "#9333ea", "#ea580c"];
const ERASE_R = 14;

// Proximity eraser: drop every point within ERASE_R of (px,py) and split each
// stroke into the surviving runs, so an eraser pass cuts through a line rather
// than deleting the whole thing.
export const eraseNear = (strokes: Stroke[], px: number, py: number): Stroke[] => {
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
export const strokePath = (pts: { x: number; y: number }[]): string => {
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

export function DrawHotbar({
  drawMode, eraserMode, panMode, penColor, setPenColor, hasStrokes,
  onCursor, onGrab, onPen, onEraser, onClearBoard, extra, cursorActive: cursorActiveProp,
}: {
  /** Extra buttons placed before the standard tools (e.g. a sandbox's own Flip / Take away). */
  extra?: React.ReactNode;
  /** Override when Select should not read as active (e.g. one of the extra tools is on). */
  cursorActive?: boolean;
  drawMode: boolean; eraserMode: boolean; panMode: boolean;
  penColor: string; setPenColor: (c: string) => void; hasStrokes: boolean;
  onCursor: () => void; onGrab: () => void; onPen: () => void; onEraser: () => void; onClearBoard: () => void;
}) {
  const cursorActive = cursorActiveProp ?? (!drawMode && !eraserMode && !panMode);
  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 150, display: "flex", alignItems: "center", gap: 4,
        padding: "6px 8px", background: "#2d3340", borderRadius: 14,
        boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      }}>
      {extra}
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

export function HotBtn({ active, disabled, onClick, title, children }: {
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

