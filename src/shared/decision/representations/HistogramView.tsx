import type { HistogramData, HistViewState } from "../cpa";
import { tickStep } from "./GanttView";

// ═══════════════════════════════════════════════════════════════════════════
// HistogramView — a PURE renderer of a resource histogram. Time runs along the bottom, the number of workers up the side; each activity
// is a labelled block as wide as its duration and as high as the workers it needs, the critical activities along the bottom. It computes
// nothing: positions come from HistogramData (cpa.ts); `view` says which blocks are drawn so far. No float is drawn (a histogram has none).
// ═══════════════════════════════════════════════════════════════════════════

const NAVY = "#1e3a8a";
const GREEN = "#16a34a";
const BLUE = "#2563eb";
const SKY = "#bae6fd";
const AMBER = "#d97706";
const AMBER_FILL = "#fde68a";
const RED = "#dc2626";
const GREEN_FILL = "#bbf7d0";
const LEFT = 52;
const PLOT = 700;
const TOP = 12;

export interface HistogramViewProps {
  data: HistogramData;
  view: HistViewState;
  unit: string;
  /** resource levelling: draw the worker limit as a line, and shade the times that need more workers than it allows */
  limit?: number;
  over?: { from: number; to: number; need: number }[];
  /** the time axis runs to this (default: the histogram's own finish), so a levelled histogram can share its axis with the unlevelled one */
  axisT?: number;
  /** the smallest the drawing is allowed to get before its box scrolls (default 560; 0 to shrink to fit a small box) */
  minWidth?: number;
  qIndex?: number;
  background?: string;
}

export default function HistogramView({ data, view, unit, limit, over, axisT, minWidth = 560, qIndex, background = "#ffffff" }: HistogramViewProps) {
  const T = Math.max(data.T, axisT ?? 0);
  const peak = Math.max(data.peak, limit ?? 0);
  const rows = peak + 1; // one spare unit of height above the tallest stack
  const cell = Math.max(18, Math.min(30, 230 / rows)); // height of one worker
  const x = (t: number) => LEFT + (t / T) * PLOT;
  const bodyBottom = TOP + rows * cell;
  const yOf = (level: number) => bodyBottom - level * cell;
  const step = tickStep(T);
  const ticks: number[] = [];
  for (let t = 0; t <= T; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] !== T) ticks.push(T);
  const drawn = new Set(view.blocks);
  const H = bodyBottom + 46;

  return (
    <svg
      viewBox={`0 0 ${LEFT + PLOT + 62} ${H}`}
      style={{ display: "block", width: "100%", minWidth, height: "auto", maxHeight: "100%", margin: "auto", background }}
      preserveAspectRatio="xMidYMid meet"
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      {/* dashed grid: a line for every worker, and along the time axis */}
      {Array.from({ length: rows + 1 }, (_, i) => i).map((i) => (
        <g key={`y${i}`}>
          <line x1={LEFT} y1={yOf(i)} x2={LEFT + PLOT} y2={yOf(i)} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 4" />
          <text x={LEFT - 8} y={yOf(i) + 4} textAnchor="end" fontSize={12} fill="#475569">{i}</text>
        </g>
      ))}
      {ticks.map((t, i) => (
        <g key={`x${t}`}>
          <line x1={x(t)} y1={TOP} x2={x(t)} y2={bodyBottom} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 4" />
          {(i < ticks.length - 1 || t - ticks[i - 1] >= step * 0.7) && <text x={x(t)} y={bodyBottom + 17} textAnchor="middle" fontSize={12} fill="#475569">{t}</text>}
        </g>
      ))}
      <line x1={LEFT} y1={bodyBottom} x2={LEFT + PLOT} y2={bodyBottom} stroke="#334155" strokeWidth={1.6} />
      <line x1={LEFT} y1={TOP} x2={LEFT} y2={bodyBottom} stroke="#334155" strokeWidth={1.6} />
      <text x={LEFT + PLOT / 2} y={bodyBottom + 38} textAnchor="middle" fontSize={13} fill="#334155">Time ({unit})</text>
      <text x={14} y={TOP + (bodyBottom - TOP) / 2} textAnchor="middle" fontSize={13} fill="#334155" transform={`rotate(-90 14 ${TOP + (bodyBottom - TOP) / 2})`}>Workers</text>

      {data.blocks.map((b) => {
        if (!drawn.has(b.id)) return null;
        const cur = view.current === b.id;
        const wide = x(b.end) - x(b.start);
        const high = b.workers * cell;
        const fill = b.moved ? AMBER_FILL : b.critical ? GREEN_FILL : SKY;
        const stroke = cur ? BLUE : b.moved ? AMBER : b.critical ? GREEN : NAVY;
        const sw = cur ? 2.6 : 1.6;
        if (b.base && b.base.some((v) => v !== b.base![0])) {
          // a stepped block: the bottom edge follows the top of the blocks under it, so the block "jumps" where that changes height
          const segs: { from: number; to: number; base: number }[] = [];
          b.base.forEach((v, i) => { const t = b.start + i; const last = segs[segs.length - 1]; if (last && last.base === v) last.to = t + 1; else segs.push({ from: t, to: t + 1, base: v }); });
          const top: string[] = [], bottom: string[] = [];
          segs.forEach((g, i) => {
            top.push(`${i === 0 ? "M" : "L"}${x(g.from)},${yOf(g.base + b.workers)} L${x(g.to)},${yOf(g.base + b.workers)}`);
            bottom.unshift(`L${x(g.to)},${yOf(g.base)} L${x(g.from)},${yOf(g.base)}`);
          });
          const widest = segs.reduce((m, g) => (g.to - g.from > m.to - m.from ? g : m), segs[0]);
          const lx = x((widest.from + widest.to) / 2);
          return (
            <g key={b.id}>
              <path d={`${top.join(" ")} ${bottom.join(" ")} Z`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
              {x(widest.to) - x(widest.from) >= 12 && <text x={lx} y={yOf(widest.base + b.workers) + high / 2 + 5} textAnchor="middle" fontSize={15} fontStyle="italic" fontWeight={600} fill="#0f172a">{b.id}</text>}
            </g>
          );
        }
        return (
          <g key={b.id}>
            <rect x={x(b.start)} y={yOf(b.y + b.workers)} width={wide} height={high} fill={fill} stroke={stroke} strokeWidth={sw} />
            {wide >= 12 && <text x={x(b.start) + wide / 2} y={yOf(b.y + b.workers) + high / 2 + 5} textAnchor="middle" fontSize={15} fontStyle="italic" fontWeight={600} fill="#0f172a">{b.id}</text>}
          </g>
        );
      })}
      {(over ?? []).map((o, i) => (
        <rect key={`o${i}`} x={x(o.from)} y={yOf(o.need)} width={x(o.to) - x(o.from)} height={(o.need - (limit ?? 0)) * cell} fill="#ef4444" fillOpacity={0.45} />
      ))}
      {limit !== undefined && (
        <g>
          <line x1={LEFT} y1={yOf(limit)} x2={LEFT + PLOT} y2={yOf(limit)} stroke={RED} strokeWidth={2.2} strokeDasharray="8 4" />
          <text x={LEFT + PLOT + 4} y={yOf(limit) + 4} fontSize={12} fontWeight={700} fill={RED}>limit {limit}</text>
        </g>
      )}
    </svg>
  );
}
