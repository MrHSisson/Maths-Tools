import type { PlaceValueTableData, PVCell, QOSnapshot, WorkingStep } from "../types";
import { PV_WORD_HEADERS_KEY } from "../placeValue";

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

/** The heading for column `i`: its letters, or its full name when the table is in words mode. */
const headerLabel = (d: PlaceValueTableData, i: number): string =>
  d.headerStyle === "words" && d.columnNames?.[i] ? d.columnNames[i] : d.columns[i];

const toneCls = (t?: PVCell["tone"]) =>
  t === "zero" ? "text-blue-600 bg-blue-50" : t === "answer" ? "text-green-800 bg-white" : t === "highlight" ? "bg-amber-100" : t === "current" ? "bg-sky-200" : t === "lost" ? "text-red-600 bg-red-50" : "";

export function PlaceValueTable({ data }: { data: PlaceValueTableData }) {
  const { columns, onesIndex, showPoint, rows, highlightCol } = data;
  const cellH = data.cellHeight ?? 72;
  const hasGutter = rows.some((r) => r.kind === "cells" && r.label);
  const words = data.headerStyle === "words";
  const tint = (i: number) => (i === highlightCol ? "bg-amber-100" : "bg-white");
  // A detached last column sits after a borderless spacer column, so it reads as separate from the places.
  const GAP = 28;
  const detach = !!data.detachLast && columns.length > 1;
  const gapBefore = (i: number) => detach && i === columns.length - 1;
  const nibbleRule = (i: number) => (data.groupEvery && i > 0 && (columns.length - i) % data.groupEvery === 0 ? { borderLeftWidth: 6 } : {});
  const spacer = (k: string, tag: "th" | "td") => (tag === "th" ? <th key={k} style={{ width: GAP }} /> : <td key={k} />);

  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`border-collapse ${data.colWidth ? "mx-auto" : "w-full"}`}
        style={{ tableLayout: "fixed", ...(data.colWidth ? { width: columns.length * data.colWidth + (detach ? GAP : 0) + (hasGutter ? 88 : 0), maxWidth: "100%" } : {}) }}
      >
        <thead>
          <tr>
            {hasGutter && <th className="w-6 sm:w-11" />}
            {columns.map((_col, i) => [
              gapBefore(i) ? spacer(`g${i}`, "th") : null,
              <th key={i} style={nibbleRule(i)} className={`border-2 border-black py-2 font-bold relative text-black leading-tight ${words ? (columns.length > 8 ? "text-[11px] px-0.5" : "text-sm px-1") : "text-base sm:text-lg"} ${i === highlightCol ? "bg-amber-200" : gapBefore(i) ? "bg-indigo-50" : "bg-gray-100"}`}>
                {words && data.columnNames?.[i] && columns.length <= 8
                  ? <><span className="sm:hidden">{columns[i]}</span><span className="hidden sm:inline">{data.columnNames[i]}</span></>   // phone: letters (the words don't fit a column)
                  : headerLabel(data, i)}
                {showPoint && i === onesIndex && <DecimalDot />}
              </th>,
            ])}
            {/* mirror of the operator gutter, so the table body (not body + operators) is what is centred */}
            {hasGutter && <th className="w-6 sm:w-11" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            if (row.kind === "banner") {
              return (
                <tr key={ri}>
                  {hasGutter && <td />}
                  <td colSpan={columns.length + (detach ? 1 : 0)} className="text-center py-3 font-bold text-2xl border-2 border-black bg-white text-black">
                    {row.text}
                  </td>
                  {hasGutter && <td />}
                </tr>
              );
            }
            return (
              <tr key={ri}>
                {hasGutter && <td className="text-center text-xl sm:text-3xl font-bold text-black">{row.label ?? ""}</td>}
                {columns.map((_c, i) => {
                  const raw = row.cells[i];
                  const cell: PVCell = typeof raw === "string" || raw === undefined ? { v: raw ?? "" } : raw;
                  return [
                    gapBefore(i) ? spacer(`g${i}`, "td") : null,
                    <td
                      key={i}
                      className={`border-2 border-black text-center text-2xl sm:text-3xl font-semibold text-black relative ${cell.tone ? toneCls(cell.tone) : tint(i)}`}
                      style={{ height: cellH, borderTopWidth: row.rule ? 5 : undefined, ...nibbleRule(i) }}
                    >
                      {cell.above !== undefined && (
                        <span className="absolute left-1 top-0 text-base font-bold text-indigo-600">{cell.above}</span>
                      )}
                      {cell.badge ? (
                        <span className={`inline-flex align-middle h-11 w-11 items-center justify-center rounded-full text-2xl font-bold ${cell.v ? "bg-indigo-600 text-white" : ""}`}>{cell.v}</span>
                      ) : cell.circle ? (
                        <span className={`inline-flex align-middle h-11 w-11 items-center justify-center rounded-full border-[3px] ${cell.circle === "dim" ? "border-indigo-300 text-slate-400" : "border-indigo-500 text-indigo-700"}`}>{cell.v}</span>
                      ) : (
                        <span className={cell.strike ? "line-through decoration-2 text-slate-400" : ""}>{cell.v}</span>
                      )}
                      {showPoint && i === onesIndex && <DecimalDot />}
                    </td>,
                  ];
                })}
                {hasGutter && <td />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** `stepRenderer` for tools whose working steps come from `pvStep`. Returns null for any other step. */
export const placeValueStepRenderer = (step: WorkingStep, _colorScheme?: string, qo?: QOSnapshot): JSX.Element | null => {
  const extra = step.extra as { kind?: string; caption?: string; table?: PlaceValueTableData } | undefined;
  if (extra?.kind !== "placeValueSnapshot" || !extra.table) return null;
  return (
    <div className="flex flex-col gap-3">
      {/* Reserve two lines so the card never changes height as the caption changes between steps. */}
      <p className="text-left" style={{ minHeight: "2.6em", lineHeight: 1.3 }}>{extra.caption}</p>
      <PlaceValueTable data={qo?.variables?.[PV_WORD_HEADERS_KEY] ? { ...extra.table, headerStyle: "words" } : extra.table} />
    </div>
  );
};

/** `stepVisualRenderer` for `pvStep` tools: just the table snapshot (no caption), so the cascade can
 *  keep ONE table updating in place while the list carries the captions. Null for any other step. */
export const placeValueStepVisual = (step: WorkingStep, _colorScheme?: string, qo?: QOSnapshot): JSX.Element | null => {
  const extra = step.extra as { kind?: string; table?: PlaceValueTableData } | undefined;
  if (extra?.kind !== "placeValueSnapshot" || !extra.table) return null;
  return <PlaceValueTable data={qo?.variables?.[PV_WORD_HEADERS_KEY] ? { ...extra.table, headerStyle: "words" } : extra.table} />;
};

// ── SVG rendering — for worksheet cells / print ───────────────────────────────
// The same PlaceValueTableData drawn as an SVG, so a worksheet can carry a grid per question
// and print it through the shared diagram printer (`handleDiagramPrint` clones
// `<svg data-q-index>` and lays cells out by `_aspect`). Fixed geometry: columns are CW wide,
// rows ROW_H tall, so a table with fewer columns is simply narrower.
const SVG_CW = 100, SVG_ROW_H = 72, SVG_HEAD_H = 40, SVG_TITLE_H = 64, SVG_GUTTER = 56, SVG_PAD = 14;

/** Header font size — shrinks long words so they stay inside a 100-wide column. */
const headFont = (label: string): number => Math.min(22, Math.floor(92 / (label.length * 0.56)));

export const pvSvgSize = (data: PlaceValueTableData, hasTitle: boolean, rowH: number = SVG_ROW_H) => {
  const gutter = data.rows.some((r) => r.kind === "cells" && r.label) ? SVG_GUTTER : 0;
  return {
    w: SVG_PAD * 2 + gutter * 2 + data.columns.length * SVG_CW,   // gutter mirrored on the right: the table body is centred
    h: SVG_PAD * 2 + (hasTitle ? SVG_TITLE_H : 0) + SVG_HEAD_H + data.rows.length * rowH,
    gutter,
  };
};

/** The row height that gives `PlaceValueSvg` (width fixed by its columns) the wanted width ÷ height —
 *  rows stretch taller so the table can fill a taller cell, within [min, max]. */
export const pvSvgRowHForAspect = (data: PlaceValueTableData, hasTitle: boolean, aspect: number, min = SVG_ROW_H, max = 120): number => {
  const { w } = pvSvgSize(data, hasTitle);
  const fixed = SVG_PAD * 2 + (hasTitle ? SVG_TITLE_H : 0) + SVG_HEAD_H;
  const rowH = (w / aspect - fixed) / Math.max(1, data.rows.length);
  return Math.round(Math.max(min, Math.min(max, rowH)));
};

/** width ÷ height of `PlaceValueSvg` — store on a question as `_aspect` for `handleDiagramPrint`. */
export const pvSvgAspect = (data: PlaceValueTableData, hasTitle: boolean, rowH: number = SVG_ROW_H): number => {
  const { w, h } = pvSvgSize(data, hasTitle, rowH);
  return w / h;
};

export function PlaceValueSvg({ data, title, idx, answerIdx, rowH = SVG_ROW_H, fill }: {
  data: PlaceValueTableData;
  /** Plain text drawn above the table (e.g. the question). */
  title?: string;
  /** Tags the SVG for the question print path (`data-q-index`). */
  idx?: number;
  /** Tags it as the hidden solved twin used on answer pages (`data-q-answer-index`). */
  answerIdx?: number;
  /** Row height (default 72) — print stretches it so fewer questions fill the page. */
  rowH?: number;
  /** Fit the cell's box (width AND height) instead of sizing from the width — used for print. */
  fill?: boolean;
}) {
  const { columns, onesIndex, showPoint, rows } = data;
  const { w, h, gutter } = pvSvgSize(data, !!title, rowH);
  const x0 = SVG_PAD + gutter;
  const yHead = SVG_PAD + (title ? SVG_TITLE_H : 0);
  const yRows = yHead + SVG_HEAD_H;
  const dotX = x0 + (onesIndex + 1) * SVG_CW;
  const tag = answerIdx !== undefined ? { "data-q-answer-index": answerIdx } : idx !== undefined ? { "data-q-index": idx } : {};

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", height: fill ? "100%" : "auto" }} preserveAspectRatio="xMidYMid meet" {...tag}>
      {title && <text x={x0 + (columns.length * SVG_CW) / 2} y={SVG_PAD + SVG_TITLE_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={700} fill="#000">{title}</text>}
      {columns.map((_c, i) => (
        <g key={`h${i}`}>
          <rect x={x0 + i * SVG_CW} y={yHead} width={SVG_CW} height={SVG_HEAD_H} fill="#f3f4f6" stroke="#000" strokeWidth={2.5} />
          <text x={x0 + i * SVG_CW + SVG_CW / 2} y={yHead + SVG_HEAD_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={headFont(headerLabel(data, i))} fontWeight={700} fill="#000">{headerLabel(data, i)}</text>
        </g>
      ))}
      {rows.map((row, ri) => {
        const y = yRows + ri * rowH;
        if (row.kind === "banner") {
          return (
            <g key={`r${ri}`}>
              <rect x={x0} y={y} width={columns.length * SVG_CW} height={rowH} fill="#fff" stroke="#000" strokeWidth={2.5} />
              <text x={x0 + (columns.length * SVG_CW) / 2} y={y + rowH / 2} textAnchor="middle" dominantBaseline="middle" fontSize={30} fontWeight={700} fill="#000">{row.text}</text>
            </g>
          );
        }
        return (
          <g key={`r${ri}`}>
            {row.label && <text x={SVG_PAD + gutter / 2} y={y + rowH / 2} textAnchor="middle" dominantBaseline="middle" fontSize={40} fontWeight={700} fill="#000">{row.label}</text>}
            {columns.map((_c, i) => {
              const raw = row.cells[i];
              const cell: PVCell = typeof raw === "string" || raw === undefined ? { v: raw ?? "" } : raw;
              const cx = x0 + i * SVG_CW + SVG_CW / 2;
              const fill = cell.tone === "zero" ? "#eff6ff" : cell.tone === "lost" ? "#fef2f2" : "#ffffff";
              const ink = cell.strike ? "#94a3b8" : cell.tone === "zero" ? "#2563eb" : cell.tone === "answer" ? "#166534" : cell.tone === "lost" ? "#dc2626" : "#000";
              return (
                <g key={i}>
                  <rect x={x0 + i * SVG_CW} y={y} width={SVG_CW} height={rowH} fill={fill} stroke="#000" strokeWidth={2.5} />
                  {cell.above !== undefined && <text x={x0 + i * SVG_CW + 8} y={y + 22} fontSize={22} fontWeight={700} fill="#4f46e5">{cell.above}</text>}
                  {cell.badge && cell.v !== "" && <circle cx={cx} cy={y + rowH / 2} r={22} fill="#4f46e5" />}
                  {cell.circle && <circle cx={cx} cy={y + rowH / 2} r={24} fill="none" stroke={cell.circle === "dim" ? "#a5b4fc" : "#6366f1"} strokeWidth={4} />}
                  {cell.v !== "" && <text x={cx} y={y + rowH / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontSize={44} fontWeight={600} fill={cell.badge ? "#fff" : cell.circle === "dim" ? "#94a3b8" : ink}>{cell.v}</text>}
                  {cell.strike && cell.v !== "" && <line x1={cx - 16} y1={y + rowH / 2 + 2} x2={cx + 16} y2={y + rowH / 2 + 2} stroke="#94a3b8" strokeWidth={4} />}
                </g>
              );
            })}
            {row.rule && <line x1={x0} y1={y} x2={x0 + columns.length * SVG_CW} y2={y} stroke="#000" strokeWidth={6} />}
          </g>
        );
      })}
      {showPoint && [yHead + SVG_HEAD_H / 2, ...rows.map((_r, ri) => yRows + ri * rowH + rowH / 2)].map((cy, i) => (
        <circle key={`d${i}`} cx={dotX} cy={cy} r={7} fill="#000" />
      ))}
    </svg>
  );
}
