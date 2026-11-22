import { useRef, useState, type PointerEvent } from "react";
import { hcfLine, lcmLine, tileColour } from "../shared/venn";
import { BOX_H, BOX_W, CIRCLE_R, CIRCLE_Y, LEFT_X, RIGHT_X, layoutCards, regionsOf } from "./vennLayout";
import type { DeckElement } from "./types";

type El = Extract<DeckElement, { kind: "venn" }>;
const INK = "#1e293b", LINE_H = 56;
const LEFT_C = "#6683a8", RIGHT_C = "#a58b66", HCF_C = "#334155", LCM_C = "#334155";   // quiet colours: the cards carry the colour, not the circles

/** The Venn diagram as a slide piece. The cards start where `layoutCards` puts them (scattered round the outside unless a card has a
 *  region) and in the player every card drags with a finger, stylus or mouse and stays where it is dropped: nothing is checked, ticked or
 *  saved, and leaving the slide puts them back. `stage` is the clicks since the diagram appeared: one card per click when staged, then the
 *  HCF line, then the LCM line. The diagram is always drawn at one size, with room kept for the answer lines, so it never shifts. */
export function VennEl({ el, stage, live }: { el: El; stage: number; live: boolean }) {
  const size = el.size ?? 1;
  const start = layoutCards(el.cards, size);
  const svg = useRef<SVGSVGElement>(null);
  const [moved, setMoved] = useState<Record<number, { x: number; y: number }>>({});
  const [lifted, setLifted] = useState<number[]>([]);       // last dragged is drawn on top
  const grab = useRef<{ i: number; dx: number; dy: number } | null>(null);
  const lines = el.lines ?? [];
  const regions = lines.length ? regionsOf(el.cards) : null;
  const base = el.staged ? el.cards.length : 0;
  const showLine = (k: number) => stage >= base + k + 1;
  const text = Math.max(1, size);                       // labels and answer lines grow with the cards, so a small Venn stays readable
  const height = BOX_H + (lines.length ? Math.round((2 * LINE_H + 10) * text) : 0);

  const at = (i: number) => ({ ...start[i], ...moved[i] });
  const point = (e: { clientX: number; clientY: number }) => {
    const s = svg.current!, p = s.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(s.getScreenCTM()!.inverse());
  };
  // The dragged card moves to the top of the drawing order, which re-inserts it in the page and so drops any pointer capture: the move and
  // release are listened for on the window instead, for just that pointer.
  const down = (i: number) => (e: PointerEvent<SVGGElement>) => {
    if (!live || grab.current) return;
    e.stopPropagation();
    e.preventDefault();
    const p = point(e), c = at(i), box = start[i], id = e.pointerId;
    grab.current = { i, dx: p.x - c.x, dy: p.y - c.y };
    setLifted((l) => [...l.filter((x) => x !== i), i]);
    const move = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== id || !grab.current) return;
      const q = point(ev);
      setMoved((m) => ({ ...m, [i]: { x: Math.min(BOX_W - box.w / 2, Math.max(box.w / 2, q.x - grab.current!.dx)), y: Math.min(BOX_H - box.h / 2, Math.max(box.h / 2, q.y - grab.current!.dy)) } }));
    };
    const end = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== id) return;
      grab.current = null;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
  };

  const order = [...el.cards.keys()].filter((i) => !lifted.includes(i)).concat(lifted.filter((i) => i < el.cards.length));
  return (
    <svg ref={svg} viewBox={`0 0 ${BOX_W} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block", touchAction: "none", userSelect: "none" }} role="img" aria-label="A Venn diagram" data-no-swipe="" data-venn="">
      <rect x={3} y={3} width={BOX_W - 6} height={BOX_H - 6} rx={14} fill="white" stroke="#94a3b8" strokeWidth={3} />
      {el.box && <text x={24} y={44 * text} fontSize={34 * text} fontWeight={700} fill={INK} fontFamily="'Segoe UI',Arial,sans-serif">{el.box}</text>}
      <circle cx={LEFT_X} cy={CIRCLE_Y} r={CIRCLE_R} fill={LEFT_C} fillOpacity={0.07} stroke={LEFT_C} strokeWidth={4} />
      <circle cx={RIGHT_X} cy={CIRCLE_Y} r={CIRCLE_R} fill={RIGHT_C} fillOpacity={0.07} stroke={RIGHT_C} strokeWidth={4} />
      <text x={LEFT_X - 60} y={CIRCLE_Y - CIRCLE_R - 14} textAnchor="middle" fontSize={34 * text} fontWeight={700} fill={LEFT_C} fontFamily="'Segoe UI',Arial,sans-serif">{el.left}</text>
      <text x={RIGHT_X + 60} y={CIRCLE_Y - CIRCLE_R - 14} textAnchor="middle" fontSize={34 * text} fontWeight={700} fill={RIGHT_C} fontFamily="'Segoe UI',Arial,sans-serif">{el.right}</text>
      {order.map((i) => {
        const c = el.cards[i], p = at(i);
        if (!p || (el.staged && stage < i + 1)) return null;
        const fs = (c.tile ? 40 : 32) * size;
        return (
          <g key={i} transform={`translate(${p.x - p.w / 2} ${p.y - p.h / 2})`} data-card={c.text} data-tile={c.tile ? "" : undefined} data-no-swipe=""
            onPointerDown={down(i)} style={{ cursor: live ? "grab" : "default", touchAction: "none" }}>
            <rect width={p.w} height={p.h} rx={c.tile ? 10 * size : 14 * size} fill={c.tile ? tileColour(Number(c.text)) : "white"} style={c.tile ? { filter: "saturate(0.7)" } : undefined} stroke={c.tile ? "none" : "#64748b"} strokeWidth={2.5} />
            <text x={p.w / 2} y={p.h / 2 + fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight={c.tile ? 700 : 600} fill={c.tile ? "white" : INK} fontFamily="'Segoe UI',Arial,sans-serif" pointerEvents="none">{c.text}</text>
          </g>
        );
      })}
      {lines.map((k, n) => regions && showLine(n) && (
        <text key={k} x={BOX_W / 2} y={BOX_H + (52 + n * (LINE_H + 4)) * text} textAnchor="middle" fontSize={46 * text} fontWeight={700} fill={k === "hcf" ? HCF_C : LCM_C} fontFamily="'Segoe UI',Arial,sans-serif" data-line={k}>
          {k === "hcf" ? hcfLine(regions) : lcmLine(regions)}
        </text>
      ))}
    </svg>
  );
}
