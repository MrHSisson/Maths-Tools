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

import type { PlaceValueTableData, WorkingStep } from "./types";
import { tStep } from "./helpers";

/** Standard column sets. `onesIndex` is where the decimal point sits (right edge). */
export const PV_COLS_DECIMAL = ["H", "T", "O", "t", "h", "th"];
export const PV_ONES_DECIMAL = 2;

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
