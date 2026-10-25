import type { CascadeData, GanttViewState } from "../cpa";

// ═══════════════════════════════════════════════════════════════════════════
// GanttView — a PURE renderer of a cascade (Gantt) chart. Time runs along the bottom with dashed grid lines (as in an exam answer
// booklet), one row per activity or the critical activities together on one row, and each non-critical activity's float drawn as a
// dashed block (or dashed line, in "bars" style) after it (early start) or before it (late start). It computes nothing: every
// position is read from CascadeData (cpa.ts, the same times the passes found); `view` says what is drawn so far.
// ═══════════════════════════════════════════════════════════════════════════

const NAVY = "#1e3a8a";
const GREEN = "#16a34a";
const BLUE = "#2563eb";
const PURPLE = "#7c3aed";
const SKY = "#bae6fd";
const GREEN_FILL = "#bbf7d0";
const LEFT = 64;
const PLOT = 700;
const TOP = 12;

/** a tidy tick spacing so the axis has about 10–25 labelled marks */
export const tickStep = (T: number): number => [1, 2, 5, 10, 20].find((s) => T / s <= 25) ?? 50;

interface GanttViewProps {
  data: CascadeData;
  view: GanttViewState;
  unit: string;
  /** draw the time axis out to this (so a histogram under it lines up) */
  axisT?: number;
  qIndex?: number;
  background?: string;
}

export default function GanttView({ data, view, unit, axisT, qIndex, background = "#ffffff" }: GanttViewProps) {
  const { rowLabels, style } = data;
  const T = Math.max(data.T, axisT ?? 0);
  const blocks = style === "blocks";
  const rowH = blocks ? 36 : 30;
  const rows = rowLabels.length;
  const x = (t: number) => LEFT + (t / T) * PLOT;
  // rows read from the bottom up: the first row (the critical activities, or activity A) sits just above the time axis
  const rowTop = (r: number) => TOP + (rows - 1 - r) * rowH;
  const bodyBottom = TOP + rows * rowH;
  const step = tickStep(T);
  const ticks: number[] = [];
  for (let t = 0; t <= T; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] !== T) ticks.push(T);
  const drawn = new Set(view.bars);
  const floats = new Set(view.floats);
  const H = bodyBottom + 46;

  return (
    <svg
      viewBox={`0 0 ${LEFT + PLOT + 62} ${H}`}
      style={{ display: "block", width: "100%", minWidth: 560, height: "auto", maxHeight: "100%", margin: "auto", background }}
      preserveAspectRatio="xMidYMid meet"
      {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
    >
      {/* dashed time grid */}
      {ticks.map((t, i) => (
        <g key={t}>
          <line x1={x(t)} y1={TOP} x2={x(t)} y2={bodyBottom} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 4" />
          {(i < ticks.length - 1 || t - ticks[i - 1] >= step * 0.7) && <text x={x(t)} y={bodyBottom + 17} textAnchor="middle" fontSize={12} fill="#475569">{t}</text>}
        </g>
      ))}
      {/* row separators and labels */}
      {rowLabels.map((label, r) => (
        <g key={r}>
          <line x1={LEFT} y1={rowTop(r)} x2={LEFT + PLOT} y2={rowTop(r)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={LEFT - 10} y={rowTop(r) + rowH / 2 + 5} textAnchor="end" fontSize={label.length > 2 ? 12 : 15} fontStyle={label.length > 2 ? "normal" : "italic"} fontWeight={600} fill="#0f172a">{label}</text>
        </g>
      ))}
      <line x1={LEFT} y1={bodyBottom} x2={LEFT + PLOT} y2={bodyBottom} stroke="#334155" strokeWidth={1.6} />
      <line x1={LEFT} y1={TOP} x2={LEFT} y2={bodyBottom} stroke="#334155" strokeWidth={1.6} />
      <text x={LEFT + PLOT / 2} y={bodyBottom + 38} textAnchor="middle" fontSize={13} fill="#334155">Time ({unit})</text>

      {data.bars.map((b) => {
        if (!drawn.has(b.id)) return null;
        const cur = view.current === b.id;
        const y0 = rowTop(b.row);
        const bh = blocks ? rowH - 8 : 12;
        const by = y0 + (rowH - bh) / 2;
        const stroke = cur ? BLUE : b.critical ? GREEN : NAVY;
        const fill = b.critical ? GREEN_FILL : SKY;
        const wide = x(b.end) - x(b.start);
        const fx0 = data.start === "early" ? b.end : b.start - b.float;
        const fx1 = fx0 + b.float;
        const showFloat = floats.has(b.id) && b.float > 0;
        const fw = x(fx1) - x(fx0);
        return (
          <g key={b.id}>
            <rect x={x(b.start)} y={by} width={wide} height={bh} fill={fill} stroke={stroke} strokeWidth={cur ? 2.6 : 1.6} />
            {wide >= 14 && <text x={x(b.start) + wide / 2} y={by + bh / 2 + (blocks ? 5 : 4)} textAnchor="middle" fontSize={blocks ? 15 : 12} fontStyle="italic" fontWeight={600} fill="#0f172a">{b.id}</text>}
            {showFloat && (blocks
              ? <rect x={x(fx0)} y={by} width={fw} height={bh} fill="none" stroke={PURPLE} strokeWidth={1.5} strokeDasharray="5 3" />
              : <line x1={x(fx0)} y1={by + bh / 2} x2={x(fx1)} y2={by + bh / 2} stroke={PURPLE} strokeWidth={2} strokeDasharray="5 3" />)}
            {showFloat && (
              <text x={x(fx0) + fw / 2} y={blocks ? by + bh / 2 + 4.5 : by - 3} textAnchor="middle" fontSize={12} fontWeight={700} fill={PURPLE}>{b.float}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
