import type { PlaceValueTableData, PVCell, WorkingStep } from "../types";

// Shared place value table — the visual behind Powers of 10 and decimal
// add/subtract (see src/shared/placeValue.ts). Fixed columns, a decimal point on
// the Ones column's right edge, optional operator gutter, carries/exchanges
// written above digits, and a "current column" tint.

const DecimalDot = () => (
  <div
    className="absolute w-3 h-3 bg-black rounded-full"
    style={{ right: "-8px", top: "50%", transform: "translateY(-50%)", zIndex: 10 }}
  />
);

const toneCls = (t?: PVCell["tone"]) =>
  t === "zero" ? "text-blue-600 bg-blue-50" : t === "answer" ? "text-green-800 bg-white" : t === "highlight" ? "bg-amber-100" : "";

export function PlaceValueTable({ data }: { data: PlaceValueTableData }) {
  const { columns, onesIndex, showPoint, rows, highlightCol } = data;
  const cellH = data.cellHeight ?? 72;
  const hasGutter = rows.some((r) => r.kind === "cells" && r.label);
  const tint = (i: number) => (i === highlightCol ? "bg-amber-100" : "bg-white");

  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`border-collapse ${data.colWidth ? "mx-auto" : "w-full"}`}
        style={{ tableLayout: "fixed", ...(data.colWidth ? { width: columns.length * data.colWidth + (hasGutter ? 44 : 0), maxWidth: "100%" } : {}) }}
      >
        <thead>
          <tr>
            {hasGutter && <th style={{ width: 44 }} />}
            {columns.map((col, i) => (
              <th key={i} className={`border-2 border-black py-2 font-bold text-lg relative text-black ${i === highlightCol ? "bg-amber-200" : "bg-gray-100"}`}>
                {col}
                {showPoint && i === onesIndex && <DecimalDot />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            if (row.kind === "banner") {
              return (
                <tr key={ri}>
                  <td colSpan={columns.length + (hasGutter ? 1 : 0)} className="text-center py-3 font-bold text-2xl border-2 border-black bg-white text-black">
                    {row.text}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={ri}>
                {hasGutter && <td className="text-center text-3xl font-bold text-black">{row.label ?? ""}</td>}
                {columns.map((_c, i) => {
                  const raw = row.cells[i];
                  const cell: PVCell = typeof raw === "string" || raw === undefined ? { v: raw ?? "" } : raw;
                  return (
                    <td
                      key={i}
                      className={`border-2 border-black text-center text-3xl font-semibold text-black relative ${cell.tone ? toneCls(cell.tone) : tint(i)}`}
                      style={{ height: cellH, borderTopWidth: row.rule ? 5 : undefined }}
                    >
                      {cell.above !== undefined && (
                        <span className="absolute left-1 top-0 text-base font-bold text-indigo-600">{cell.above}</span>
                      )}
                      <span className={cell.strike ? "line-through decoration-2 text-slate-400" : ""}>{cell.v}</span>
                      {showPoint && i === onesIndex && <DecimalDot />}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** `stepRenderer` for tools whose working steps come from `pvStep`. Returns null for any other step. */
export const placeValueStepRenderer = (step: WorkingStep): JSX.Element | null => {
  const extra = step.extra as { kind?: string; caption?: string; table?: PlaceValueTableData } | undefined;
  if (extra?.kind !== "placeValueSnapshot" || !extra.table) return null;
  return (
    <div className="flex flex-col gap-3">
      {/* Reserve two lines so the card never changes height as the caption changes between steps. */}
      <p className="text-left" style={{ minHeight: "2.6em", lineHeight: 1.3 }}>{extra.caption}</p>
      <PlaceValueTable data={extra.table} />
    </div>
  );
};

// ── SVG rendering — for worksheet cells / print ───────────────────────────────
// The same PlaceValueTableData drawn as an SVG, so a worksheet can carry a grid per question
// and print it through the shared diagram printer (`handleDiagramPrint` clones
// `<svg data-q-index>` and lays cells out by `_aspect`). Fixed geometry: columns are CW wide,
// rows ROW_H tall, so a table with fewer columns is simply narrower.
const SVG_CW = 100, SVG_ROW_H = 72, SVG_HEAD_H = 40, SVG_TITLE_H = 64, SVG_GUTTER = 56, SVG_PAD = 14;

export const pvSvgSize = (data: PlaceValueTableData, hasTitle: boolean) => {
  const gutter = data.rows.some((r) => r.kind === "cells" && r.label) ? SVG_GUTTER : 0;
  return {
    w: SVG_PAD * 2 + gutter + data.columns.length * SVG_CW,
    h: SVG_PAD * 2 + (hasTitle ? SVG_TITLE_H : 0) + SVG_HEAD_H + data.rows.length * SVG_ROW_H,
    gutter,
  };
};

/** width ÷ height of `PlaceValueSvg` — store on a question as `_aspect` for `handleDiagramPrint`. */
export const pvSvgAspect = (data: PlaceValueTableData, hasTitle: boolean): number => {
  const { w, h } = pvSvgSize(data, hasTitle);
  return w / h;
};

export function PlaceValueSvg({ data, title, idx, answerIdx }: {
  data: PlaceValueTableData;
  /** Plain text drawn above the table (e.g. the question). */
  title?: string;
  /** Tags the SVG for the question print path (`data-q-index`). */
  idx?: number;
  /** Tags it as the hidden solved twin used on answer pages (`data-q-answer-index`). */
  answerIdx?: number;
}) {
  const { columns, onesIndex, showPoint, rows } = data;
  const { w, h, gutter } = pvSvgSize(data, !!title);
  const x0 = SVG_PAD + gutter;
  const yHead = SVG_PAD + (title ? SVG_TITLE_H : 0);
  const yRows = yHead + SVG_HEAD_H;
  const dotX = x0 + (onesIndex + 1) * SVG_CW;
  const tag = answerIdx !== undefined ? { "data-q-answer-index": answerIdx } : idx !== undefined ? { "data-q-index": idx } : {};

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet" {...tag}>
      {title && <text x={w / 2} y={SVG_PAD + SVG_TITLE_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={700} fill="#000">{title}</text>}
      {columns.map((c, i) => (
        <g key={`h${i}`}>
          <rect x={x0 + i * SVG_CW} y={yHead} width={SVG_CW} height={SVG_HEAD_H} fill="#f3f4f6" stroke="#000" strokeWidth={2.5} />
          <text x={x0 + i * SVG_CW + SVG_CW / 2} y={yHead + SVG_HEAD_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight={700} fill="#000">{c}</text>
        </g>
      ))}
      {rows.map((row, ri) => {
        const y = yRows + ri * SVG_ROW_H;
        if (row.kind === "banner") {
          return (
            <g key={`r${ri}`}>
              <rect x={x0} y={y} width={columns.length * SVG_CW} height={SVG_ROW_H} fill="#fff" stroke="#000" strokeWidth={2.5} />
              <text x={x0 + (columns.length * SVG_CW) / 2} y={y + SVG_ROW_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={30} fontWeight={700} fill="#000">{row.text}</text>
            </g>
          );
        }
        return (
          <g key={`r${ri}`}>
            {row.label && <text x={SVG_PAD + gutter / 2} y={y + SVG_ROW_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={40} fontWeight={700} fill="#000">{row.label}</text>}
            {columns.map((_c, i) => {
              const raw = row.cells[i];
              const cell: PVCell = typeof raw === "string" || raw === undefined ? { v: raw ?? "" } : raw;
              const cx = x0 + i * SVG_CW + SVG_CW / 2;
              const fill = cell.tone === "zero" ? "#eff6ff" : "#ffffff";
              const ink = cell.strike ? "#94a3b8" : cell.tone === "zero" ? "#2563eb" : cell.tone === "answer" ? "#166534" : "#000";
              return (
                <g key={i}>
                  <rect x={x0 + i * SVG_CW} y={y} width={SVG_CW} height={SVG_ROW_H} fill={fill} stroke="#000" strokeWidth={2.5} />
                  {cell.above !== undefined && <text x={x0 + i * SVG_CW + 8} y={y + 22} fontSize={22} fontWeight={700} fill="#4f46e5">{cell.above}</text>}
                  {cell.v !== "" && <text x={cx} y={y + SVG_ROW_H / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontSize={44} fontWeight={600} fill={ink}>{cell.v}</text>}
                  {cell.strike && cell.v !== "" && <line x1={cx - 16} y1={y + SVG_ROW_H / 2 + 2} x2={cx + 16} y2={y + SVG_ROW_H / 2 + 2} stroke="#94a3b8" strokeWidth={4} />}
                </g>
              );
            })}
            {row.rule && <line x1={x0} y1={y} x2={x0 + columns.length * SVG_CW} y2={y} stroke="#000" strokeWidth={6} />}
          </g>
        );
      })}
      {showPoint && [yHead + SVG_HEAD_H / 2, ...rows.map((_r, ri) => yRows + ri * SVG_ROW_H + SVG_ROW_H / 2)].map((cy, i) => (
        <circle key={`d${i}`} cx={dotX} cy={cy} r={7} fill="#000" />
      ))}
    </svg>
  );
}
