import { useMemo } from "react";
import { END, START, type CpaActivity, type CpaLayout, type CpaViewState } from "../cpa";

// ═══════════════════════════════════════════════════════════════════════════
// ActivityNodeView — a PURE renderer of an activity-on-node network. Each box is the standard exam box: the activity above, then
// earliest start | duration | latest finish. It computes nothing: every number it shows is handed in via `view` (cpa.ts is the single source),
// and a cell whose time has not been found yet is left blank for the class to fill in.
// ═══════════════════════════════════════════════════════════════════════════

const NAVY = "#1e3a8a";
const SLATE = "#475569";
const GREEN = "#16a34a";
const AMBER = "#d97706";
const BLUE = "#2563eb";
const HEAD_H = 22;

export interface ActivityNodeViewProps {
  acts: CpaActivity[];
  layout: CpaLayout;
  view: CpaViewState;
  qIndex?: number;
  background?: string;
}

export default function ActivityNodeView({ acts, layout, view, qIndex, background = "#ffffff" }: ActivityNodeViewProps) {
  const dur = useMemo(() => Object.fromEntries([[START, 0], [END, 0], ...acts.map((a) => [a.id, a.duration])]), [acts]);
  const shown = view.shown ? new Set(view.shown) : null;
  const arrows = view.arrows ? new Set(view.arrows) : null;
  const compare = new Set(view.compare ?? []);
  const critical = new Set(view.critical ?? []);
  const critArrows = new Set(view.criticalArrows ?? []);
  const focusArrows = new Set(view.focusArrows ?? []);
  const boxes = Object.values(layout.boxes);

  const edgeColor = (id: string) => (critArrows.has(id) ? GREEN : focusArrows.has(id) ? BLUE : SLATE);
  const cellW = (w: number) => w / 3;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ display: "block", width: "100%", minWidth: 560, height: "auto", maxHeight: "100%", margin: "auto", background }}
      preserveAspectRatio="xMidYMid meet"
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      {layout.edges.map((e) => {
        if (arrows ? !arrows.has(e.id) : shown ? !(shown.has(e.from) && shown.has(e.to)) : false) return null;
        const c = edgeColor(e.id);
        const d = e.pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
        return <path key={e.id} d={d} fill="none" stroke={c} strokeWidth={critArrows.has(e.id) ? 2.6 : 1.6} strokeLinejoin="round" />;
      })}

      {boxes.map((b) => {
        if (shown && !shown.has(b.id)) return null;
        const isEnd = b.id === START || b.id === END;
        const crit = critical.has(b.id);
        const cur = view.current === b.id;
        const cmp = compare.has(b.id);
        const stroke = crit ? GREEN : cur ? BLUE : cmp ? AMBER : NAVY;
        const fill = crit ? "#dcfce7" : cmp ? "#fef3c7" : "#ffffff";
        const es = view.es?.[b.id];
        const lf = view.lf?.[b.id];
        const cw = cellW(b.w);
        const cy = b.y + HEAD_H;
        const ch = b.h - HEAD_H;
        const txt = (x: number, v: number | string | undefined, bold = false) => v === undefined ? null : (
          <text x={x} y={cy + ch / 2 + 7} textAnchor="middle" fontSize={19} fontWeight={bold ? 700 : 600} fill="#0f172a">{v}</text>
        );
        return (
          <g key={b.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={isEnd ? 12 : 3} fill={fill} stroke={stroke} strokeWidth={cur || crit ? 3 : 1.8} />
            <text x={b.x + b.w / 2} y={b.y + 16} textAnchor="middle" fontSize={isEnd ? 15 : 17} fontStyle={isEnd ? "normal" : "italic"} fontWeight={600} fill="#0f172a">{b.id}</text>
            <line x1={b.x} y1={cy} x2={b.x + b.w} y2={cy} stroke={stroke} strokeWidth={1.4} />
            <line x1={b.x + cw} y1={cy} x2={b.x + cw} y2={b.y + b.h} stroke={stroke} strokeWidth={1.4} />
            <line x1={b.x + 2 * cw} y1={cy} x2={b.x + 2 * cw} y2={b.y + b.h} stroke={stroke} strokeWidth={1.4} />
            {txt(b.x + cw / 2, es)}
            {txt(b.x + 1.5 * cw, view.durLabels?.[b.id] ?? dur[b.id], true)}
            {txt(b.x + 2.5 * cw, lf)}
            {view.float?.[b.id] !== undefined && (
              <g>
                <rect x={b.x + b.w / 2 - 30} y={b.y + b.h + 5} width={60} height={20} rx={10} fill={view.float[b.id] === 0 ? "#dcfce7" : "#ede9fe"} stroke={view.float[b.id] === 0 ? GREEN : "#7c3aed"} strokeWidth={1.2} />
                <text x={b.x + b.w / 2} y={b.y + b.h + 19} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#0f172a">float {view.float[b.id]}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
