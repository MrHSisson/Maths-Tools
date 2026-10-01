// Place value table — a core representation (see CLAUDE.md's "Core
// representations" table). Carries place value itself: multiplying/dividing by
// powers of 10, adding and subtracting decimals (and, later, ordering, rounding).
//
// Extracted from the original Powers of 10 grid. The table is a fixed set of
// columns with the decimal point drawn on the right edge of the Ones column, so
// digits in one column always share a place value whatever the number.
//
//   pvCells("4.1", cols, 2)            // ["", "", "4", "1", "", ""]
//   pvStep("Write both numbers …", data)   // a WorkingStep carrying a table snapshot
//
// Renders through `PlaceValueTable` (src/shared/components/PlaceValueTable.tsx);
// a tool passes `placeValueStepRenderer` as its `stepRenderer` for step snapshots.

import type { PlaceValueTableData, QOSnapshot, ToolDropdown, ToolVariable, WorkingStep } from "./types";
import { tStep } from "./helpers";

/** Every place the table can show, millions → millionths: [letters, full name]. */
const PV_PLACES: [string, string][] = [
  ["M", "Millions"], ["HTh", "Hundred thousands"], ["TTh", "Ten thousands"], ["Th", "Thousands"],
  ["H", "Hundreds"], ["T", "Tens"], ["O", "Ones"],
  ["t", "Tenths"], ["h", "Hundredths"], ["th", "Thousandths"],
  ["tth", "Ten-thousandths"], ["hth", "Hundred-thousandths"], ["mth", "Millionths"],
];
const PV_ONES_AT = 6;

/**
 * The canonical column set: the `whole` whole-number places ending at Ones (1–7) and the first
 * `dec` decimal places (0–6). Every tool builds its table from this, so a given place always
 * carries the same letters and the same words.
 */
export const pvColumnSet = (whole: number, dec: number) => {
  const places = PV_PLACES.slice(PV_ONES_AT + 1 - whole, PV_ONES_AT + 1 + dec);
  return { columns: places.map((p) => p[0]), columnNames: places.map((p) => p[1]), onesIndex: whole - 1 };
};

/** Standard column sets. `onesIndex` is where the decimal point sits (right edge). */
export const PV_COLS_DECIMAL = pvColumnSet(3, 3).columns;   // H T O t h th
export const PV_ONES_DECIMAL = 2;

/** The display switch every place-value tool offers: column headings as letters (default) or words. */
export const PV_WORD_HEADERS_KEY = "pvWordHeaders";
export const PV_WORD_HEADERS_VAR: ToolVariable = { key: PV_WORD_HEADERS_KEY, label: "Words in column headings", defaultValue: false };

/** Display-only "Table starts" setting (whiteboard / worksheet grids) — never changes the question. */
export const PV_TABLE_START_DD: ToolDropdown = {
  key: "tableStart",
  label: "Table starts",
  options: [
    { value: "empty", label: "Empty" },
    { value: "numbers", label: "Numbers in" },
    { value: "zeros", label: "Numbers + zeros" },
  ],
  defaultValue: "empty",
};

/** One row height for every whiteboard state (empty / pre-filled / answered), so the table never
 *  resizes or rescales when the answer is revealed. */
export const PV_CELL_H = 72;

/** Apply the live display settings to a table snapshot — row height, no column tint, heading style. */
export const pvDisplay = (data: PlaceValueTableData, qo?: QOSnapshot): PlaceValueTableData => ({
  ...data,
  cellHeight: PV_CELL_H,
  highlightCol: undefined,
  headerStyle: qo?.variables?.[PV_WORD_HEADERS_KEY] ? "words" : "letters",
});

/** Show only columns [start, end) of a table (cells, Ones index and highlight follow). */
export const pvSlice = (t: PlaceValueTableData, start: number, end: number): PlaceValueTableData => ({
  ...t,
  columns: t.columns.slice(start, end),
  columnNames: t.columnNames?.slice(start, end),
  onesIndex: t.onesIndex - start,
  highlightCol: t.highlightCol === undefined ? undefined : t.highlightCol - start,
  rows: t.rows.map((r) => (r.kind === "cells" ? { ...r, cells: r.cells.slice(start, end) } : r)),
});

/**
 * Place a plain decimal string (no commas, no sign) into columns — one string
 * per column, "" where the number has no digit. The ones column always gets a
 * digit ("0" for 0.45), matching how a number is written.
 */
export const pvCells = (numStr: string, columns: string[], onesIndex: number): string[] => {
  const [whole = "", frac = ""] = numStr.split(".");
  return columns.map((_c, i) => {
    if (i === onesIndex) return whole.length > 0 ? whole[whole.length - 1] : "0";
    if (i < onesIndex) {
      const idx = whole.length - 1 - (onesIndex - i);
      return idx >= 0 ? whole[idx] : "";
    }
    const idx = i - onesIndex - 1;
    return idx < frac.length ? frac[idx] : "";
  });
};

/** A WorkingStep whose card renders as a table snapshot plus a one-line caption. */
export const pvStep = (caption: string, table: PlaceValueTableData): WorkingStep => ({
  ...tStep(caption),
  extra: { kind: "placeValueSnapshot", caption, table },
});
