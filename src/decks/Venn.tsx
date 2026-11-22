import { useRef, useState, type PointerEvent } from "react";
import { hcfLine, lcmLine, primeFactors, tileColour } from "../shared/venn";
import { BOX_H, BOX_W, CIRCLE_R, CIRCLE_Y, INK, LEFT_C, LEFT_X, LIST_W, PAL_H, RIGHT_C, RIGHT_X, layoutCards, regionsOf } from "./vennLayout";
import type { DeckElement } from "./types";

type El = Extract<DeckElement, { kind: "venn" }>;
const LINE_H = 56;
const HCF_C = "#334155", LCM_C = "#334155";
const TILE = 64;
const FONT = "'Segoe UI',Arial,sans-serif";

interface Item { key: string; text: string; tile: boolean; added: boolean; start: { x: number; y: number; w: number; h: number } }
interface Added { id: number; n: string; x: number; y: number }

/** The Venn diagram as a slide piece. The cards start where `layoutCards` puts them (scattered round the outside unless a card has a
 *  region) and in the player every card drags with a finger, stylus or mouse and stays where it is dropped: nothing is checked, ticked or
 *  saved, and leaving the slide puts them back. `stage` is the clicks since the diagram appeared: one card per click when staged, then the
 *  HCF line, then the LCM line. The diagram is always drawn at one size, with room kept for the answer lines, so it never shifts.
 *  Build mode (`listing`, `palette`): the numbers are listed as prime tiles on the left, and prime buttons along the bottom each add one more
 *  tile to drag in (dropped back on the buttons it goes away). */
export function VennEl({ el, stage, live }: { el: El; stage: number; live: boolean }) {
  const size = el.size ?? 1;
  const listing = el.listing ?? [], palette = el.palette ?? [];
  const ox = listing.length ? LIST_W : 0;                  // the diagram sits to the right of the list
  const palH = palette.length ? PAL_H : 0;
  const start = layoutCards(el.cards, size);
  const svg = useRef<SVGSVGElement>(null);
  const [added, setAdded] = useState<Added[]>([]);
  const made = useRef(0);                                  // tiles added so far (never goes down), so each lands in its own place
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({});
  const [lifted, setLifted] = useState<string[]>([]);      // last dragged is drawn on top
  const grab = useRef<{ key: string; dx: number; dy: number } | null>(null);
  const lines = el.lines ?? [];
  const regions = lines.length ? regionsOf(el.cards) : null;
  const base = el.staged ? el.cards.length : 0;
  const showLine = (k: number) => stage >= base + k + 1;
  const text = Math.max(1, size);                       // labels and answer lines grow with the cards, so a small Venn stays readable
  const lineH = lines.length ? Math.round((2 * LINE_H + 10) * text) : 0;
  const height = BOX_H + palH + lineH;

  const items: Item[] = [
    ...el.cards.map((c, i): Item => ({ key: `c${i}`, text: c.text, tile: !!c.tile, added: false, start: start[i] })),
    ...added.map((a): Item => ({ key: `a${a.id}`, text: a.n, tile: true, added: true, start: { x: a.x, y: a.y, w: TILE * size, h: TILE * size } })),
  ];
  const at = (it: Item) => ({ ...it.start, ...moved[it.key] });
  const point = (e: { clientX: number; clientY: number }) => {
    const s = svg.current!, p = s.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(s.getScreenCTM()!.inverse());
    return { x: q.x - ox, y: q.y };                         // in the diagram's own units
  };
  const add = (n: number) => {
    if (!live) return;
    const k = made.current++, perRow = 8, t = TILE * size;
    setAdded((a) => [...a, { id: k, n: String(n), x: 70 + (k % perRow) * (t + 36), y: BOX_H - 56 - Math.floor(k / perRow) * (t + 14) }]);
  };
  // The dragged card moves to the top of the drawing order, which re-inserts it in the page and so drops any pointer capture: the move and
  // release are listened for on the window instead, for just that pointer.
  const down = (it: Item) => (e: PointerEvent<SVGGElement>) => {
    if (!live || grab.current) return;
    e.stopPropagation();
    e.preventDefault();
    const p = point(e), c = at(it), id = e.pointerId, box = it.start;
    grab.current = { key: it.key, dx: p.x - c.x, dy: p.y - c.y };
    let last = { x: c.x, y: c.y };
    setLifted((l) => [...l.filter((x) => x !== it.key), it.key]);
    const move = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== id || !grab.current) return;
      const q = point(ev), lowest = BOX_H + (it.added ? palH : 0);   // an added tile may be taken down onto the buttons to remove it
      last = { x: Math.min(BOX_W - box.w / 2, Math.max(box.w / 2, q.x - grab.current.dx)), y: Math.min(lowest - box.h / 2, Math.max(box.h / 2, q.y - grab.current.dy)) };
      setMoved((m) => ({ ...m, [it.key]: last }));
    };
    const end = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== id) return;
      grab.current = null;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end);
      if (it.added && last.y + box.h / 2 > BOX_H + 6) {      // dropped on the buttons: it goes away
        setAdded((a) => a.filter((x) => `a${x.id}` !== it.key));
        setMoved((m) => { const { [it.key]: _gone, ...rest } = m; void _gone; return rest; });
      }
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
  };

  const order = items.filter((it) => !lifted.includes(it.key)).concat(lifted.map((k) => items.find((it) => it.key === k)).filter((it): it is Item => !!it));
  const ts = TILE * 1.15;                                   // list and palette tiles: a touch bigger than the cards
  return (
    <svg ref={svg} viewBox={`0 0 ${BOX_W + ox} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block", touchAction: "none", userSelect: "none" }} role="img" aria-label="A Venn diagram" data-no-swipe="" data-venn="">
      {listing.map((n, r) => {
        const rowH = 150, y0 = (BOX_H - listing.length * rowH) / 2 + r * rowH, ps = primeFactors(n);
        return (
          <g key={n} data-listing={n}>
            <text x={40} y={y0 + rowH / 2 + 22} fontSize={64} fontWeight={700} fill={INK} fontFamily={FONT}>{n} =</text>
            {ps.map((p, k) => (
              <g key={k} transform={`translate(${250 + k * (ts + 12)} ${y0 + rowH / 2 - ts / 2})`}>
                <rect width={ts} height={ts} rx={11} fill={tileColour(p)} style={{ filter: "saturate(0.7)" }} />
                <text x={ts / 2} y={ts / 2 + 15} textAnchor="middle" fontSize={44} fontWeight={700} fill="white" fontFamily={FONT} pointerEvents="none">{p}</text>
              </g>
            ))}
          </g>
        );
      })}
      <g transform={`translate(${ox} 0)`}>
        <rect x={3} y={3} width={BOX_W - 6} height={BOX_H - 6} rx={14} fill="white" stroke="#94a3b8" strokeWidth={3} />
        {el.box && <text x={24} y={44 * text} fontSize={34 * text} fontWeight={700} fill={INK} fontFamily={FONT}>{el.box}</text>}
        <circle cx={LEFT_X} cy={CIRCLE_Y} r={CIRCLE_R} fill={LEFT_C} fillOpacity={0.07} stroke={LEFT_C} strokeWidth={4} />
        <circle cx={RIGHT_X} cy={CIRCLE_Y} r={CIRCLE_R} fill={RIGHT_C} fillOpacity={0.07} stroke={RIGHT_C} strokeWidth={4} />
        <text x={LEFT_X - 60} y={CIRCLE_Y - CIRCLE_R - 14} textAnchor="middle" fontSize={34 * text} fontWeight={700} fill={LEFT_C} fontFamily={FONT}>{el.left}</text>
        <text x={RIGHT_X + 60} y={CIRCLE_Y - CIRCLE_R - 14} textAnchor="middle" fontSize={34 * text} fontWeight={700} fill={RIGHT_C} fontFamily={FONT}>{el.right}</text>
        {palette.length > 0 && (
          <g data-palette="">
            <rect x={3} y={BOX_H + 14} width={BOX_W - 6} height={palH - 22} rx={14} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={2} />
            {palette.map((p, k) => {
              const x = BOX_W / 2 + (k - (palette.length - 1) / 2) * (ts + 34) - ts / 2, y = BOX_H + 14 + (palH - 22 - ts) / 2;
              return (
                <g key={p} transform={`translate(${x} ${y})`} data-add={p} data-no-swipe="" role="button" aria-label={`Add a ${p} tile`}
                  onPointerDown={(e) => { if (!live) return; e.stopPropagation(); e.preventDefault(); add(p); }} onClick={(e) => e.stopPropagation()} style={{ cursor: live ? "pointer" : "default", touchAction: "none" }}>
                  <rect width={ts} height={ts} rx={11} fill={tileColour(p)} style={{ filter: "saturate(0.7)" }} />
                  <text x={ts / 2} y={ts / 2 + 15} textAnchor="middle" fontSize={44} fontWeight={700} fill="white" fontFamily={FONT} pointerEvents="none">{p}</text>
                </g>
              );
            })}
          </g>
        )}
        {order.map((it) => {
          const p = at(it);
          if (!p || (el.staged && !it.added && stage < Number(it.key.slice(1)) + 1)) return null;
          const fs = (it.tile ? 40 : 32) * size;
          return (
            <g key={it.key} transform={`translate(${p.x - p.w / 2} ${p.y - p.h / 2})`} data-card={it.text} data-tile={it.tile ? "" : undefined} data-added={it.added ? "" : undefined} data-no-swipe=""
              onPointerDown={down(it)} style={{ cursor: live ? "grab" : "default", touchAction: "none" }}>
              <rect width={p.w} height={p.h} rx={it.tile ? 10 * size : 14 * size} fill={it.tile ? tileColour(Number(it.text)) : "white"} style={it.tile ? { filter: "saturate(0.7)" } : undefined} stroke={it.tile ? "none" : "#64748b"} strokeWidth={2.5} />
              <text x={p.w / 2} y={p.h / 2 + fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight={it.tile ? 700 : 600} fill={it.tile ? "white" : INK} fontFamily={FONT} pointerEvents="none">{it.text}</text>
            </g>
          );
        })}
        {lines.map((k, n) => regions && showLine(n) && (
          <text key={k} x={BOX_W / 2} y={BOX_H + palH + (52 + n * (LINE_H + 4)) * text} textAnchor="middle" fontSize={46 * text} fontWeight={700} fill={k === "hcf" ? HCF_C : LCM_C} fontFamily={FONT} data-line={k}>
            {k === "hcf" ? hcfLine(regions) : lcmLine(regions)}
          </text>
        ))}
      </g>
    </svg>
  );
}
