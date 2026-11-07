import { histBaseAt, type HistogramData, type HistViewState } from "../cpa";
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

interface HistogramViewProps {
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
  const H = bodyBottom + (view.totals ? 66 : 46);
  const dim = new Set(view.dim ?? []);
  const knock = new Set(view.knock ?? []);

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
      <text x={LEFT + PLOT / 2} y={bodyBottom + (view.totals ? 58 : 38)} textAnchor="middle" fontSize={13} fill="#334155">Time ({unit})</text>
      {/* the daily totals: the workers needed in each time unit, red where they are over the limit */}
      {view.totals && (
        <g>
          <text x={LEFT - 8} y={bodyBottom + 36} textAnchor="end" fontSize={11} fontWeight={700} fill="#475569">Total</text>
          {/* one number per stretch where the total stays the same (a long project would run the digits together) */}
          {data.profile.reduce<{ from: number; to: number; v: number }[]>((runs, v, t) => { const l = runs[runs.length - 1]; if (l && l.v === v) l.to = t + 1; else runs.push({ from: t, to: t + 1, v }); return runs; }, []).map((r) => (
            <text key={`tot${r.from}`} x={(x(r.from) + x(r.to)) / 2} y={bodyBottom + 36} textAnchor="middle" fontSize={x(r.to) - x(r.from) >= 9 ? 12 : 9} fontWeight={700} fill={limit !== undefined && r.v > limit ? RED : "#0f172a"}>{x(r.to) - x(r.from) >= 5.5 ? r.v : ""}</text>
          ))}
        </g>
      )}
      <text x={14} y={TOP + (bodyBottom - TOP) / 2} textAnchor="middle" fontSize={13} fill="#334155" transform={`rotate(-90 14 ${TOP + (bodyBottom - TOP) / 2})`}>Workers</text>

      {data.blocks.map((b) => {
        if (!drawn.has(b.id)) return null;
        const cur = view.current === b.id;
        const wide = x(b.end) - x(b.start);
        const high = b.workers * cell;
        const kn = knock.has(b.id);
        const fill = b.moved ? AMBER_FILL : kn ? "#fed7aa" : b.critical ? GREEN_FILL : SKY;
        const stroke = cur ? BLUE : b.moved ? AMBER : kn ? "#ea580c" : b.critical ? GREEN : NAVY;
        const sw = cur ? 2.6 : 1.6;
        if (b.base && b.base.some((v) => v !== b.base![0])) {
          // a stepped block: the bottom edge follows the top of the blocks under it, so the block "jumps" where that changes height
          const segs: { from: number; to: number; base: number }[] = [];
          b.base.forEach((v, i) => { const t = b.start + i; const last = segs[segs.length - 1]; if (last && last.base === v) last.to = t + 1; else segs.push({ from: t, to: t + 1, base: v }); });
          // each stretch where the block sits at one height is a rectangle of its own, labelled, so a block that drops is E and E
          return (
            <g key={b.id} opacity={dim.has(b.id) ? 0.22 : 1}>
              {segs.map((g, i) => {
                const w = x(g.to) - x(g.from);
                return (
                  <g key={i}>
                    <rect x={x(g.from)} y={yOf(g.base + b.workers)} width={w} height={high} fill={fill} stroke={stroke} strokeWidth={sw} />
                    {w >= 12 && <text x={x(g.from) + w / 2} y={yOf(g.base + b.workers) + high / 2 + 5} textAnchor="middle" fontSize={15} fontStyle="italic" fontWeight={600} fill="#0f172a">{b.id}</text>}
                  </g>
                );
              })}
            </g>
          );
        }
        return (
          <g key={b.id} opacity={dim.has(b.id) ? 0.22 : 1}>
            <rect x={x(b.start)} y={yOf(b.y + b.workers)} width={wide} height={high} fill={fill} stroke={stroke} strokeWidth={sw} />
            {wide >= 12 && <text x={x(b.start) + wide / 2} y={yOf(b.y + b.workers) + high / 2 + 5} textAnchor="middle" fontSize={15} fontStyle="italic" fontWeight={600} fill="#0f172a">{b.id}</text>}
          </g>
        );
      })}
      {(view.clash ? [view.clash] : over ?? []).map((o, i) => (
        <g key={`o${i}`}>
          <rect x={x(o.from)} y={yOf(o.need)} width={x(o.to) - x(o.from)} height={(o.need - (limit ?? 0)) * cell} fill="#ef4444" fillOpacity={0.45} />
          {(view.clash || view.labelOver) && limit !== undefined && <text x={(x(o.from) + x(o.to)) / 2} y={yOf(o.need) - 5} textAnchor="middle" fontSize={12} fontWeight={700} fill={RED}>needs {o.need} / limit {limit}</text>}
        </g>
      ))}
      {/* the held block: dashed where it was, an arrow to where it is now */}
      {view.ghost && (() => {
        const g = view.ghost, nb = data.blocks.find((b) => b.id === g.id);
        const gx = (x(g.start) + x(g.end)) / 2, gy = yOf(g.y + g.workers / 2);
        const nx = nb ? (x(nb.start) + x(nb.end)) / 2 : gx, ny = nb ? yOf(histBaseAt(nb, nb.start) + nb.workers / 2) : gy;
        return (
          <g>
            <defs><marker id="ghostArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={AMBER} /></marker></defs>
            <rect x={x(g.start)} y={yOf(g.y + g.workers)} width={x(g.end) - x(g.start)} height={g.workers * cell} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="6 4" />
            <text x={gx} y={gy + 5} textAnchor="middle" fontSize={14} fontStyle="italic" fill={AMBER}>{g.id}</text>
            {nb && nx !== gx && <line x1={gx + 10} y1={gy - 12} x2={nx - 10} y2={ny - 12} stroke={AMBER} strokeWidth={2.2} markerEnd="url(#ghostArrow)" />}
          </g>
        );
      })()}
      {limit !== undefined && (
        <g>
          <line x1={LEFT} y1={yOf(limit)} x2={LEFT + PLOT} y2={yOf(limit)} stroke={RED} strokeWidth={2.2} strokeDasharray="8 4" />
          <text x={LEFT + PLOT + 4} y={yOf(limit) + 4} fontSize={12} fontWeight={700} fill={RED}>limit {limit}</text>
        </g>
      )}
    </svg>
  );
}
