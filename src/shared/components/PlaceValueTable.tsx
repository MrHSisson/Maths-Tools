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
