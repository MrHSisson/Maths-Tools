import { pvStep, pvColumnSet, type PlaceValueTableData, type PVCell, type WorkingStep } from "../../shared";
import { ordinary } from "./StandardFormCore";

// The developing picture for Converting: the standard place value grid (M HTh TTh Th H T O · t h th tth hth mth, letters or words) with a Power column beside it.
// The decimal point stays where it is. Row by row, every digit moves one column and the power beside it changes by 1:
//   digits one column to the right  (each worth 10 times less)  →  the power goes UP by 1, to make up for it;
//   digits one column to the left   (each worth 10 times more)  →  the power goes DOWN by 1.
// To standard form the digits move until the first one is in the ones column; to an ordinary number they move until the power is 10⁰.
//   45 000 × 10⁰ → 4 500 × 10¹ → 450 × 10² → 45 × 10³ → 4.5 × 10⁴

/** What the picture needs to know about a question; stored on it (`_grid`) for the whiteboard scaffold. */
export interface GridSpec {
  mode: "toStd" | "toOrd" | "half";
  /** The significant digits, first and last not zero ("45", "304", "72"). */
  digits: string;
  /** The exponent of the column the first digit sits in, in the first row and in the last row. */
  fStart: number;
  fEnd: number;
  /** The power of 10 beside the first row. */
  power0: number;
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const sup = (n: number): string => String(n).split("").map((c) => SUP[c]).join("");
const power10 = (n: number): string => `10${sup(n)}`;

const withCommas = (s: string): string => {
  const [w, f] = s.split(".");
  const g = w.length > 3 ? w.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : w;
  return f === undefined ? g : `${g}.${f}`;
};

interface RowSpec { f: number; power: number; }

/** Every row of the staircase, first to last: where the first digit sits and the power beside it. */
const rowsOf = (spec: GridSpec): RowSpec[] => {
  const step = Math.sign(spec.fEnd - spec.fStart);
  const count = Math.abs(spec.fEnd - spec.fStart) + 1;
  return Array.from({ length: count }, (_, r) => ({ f: spec.fStart + step * r, power: spec.power0 - step * r }));
};

/** The exponents a row fills: its digits, and the zeros that hold places between them and the ones column. */
const extent = (spec: GridSpec, f: number): [number, number] => [Math.max(f, 0), Math.min(f - spec.digits.length + 1, 0)];

const columnsOf = (spec: GridSpec): { hi: number; lo: number } => {
  const spans = rowsOf(spec).map((r) => extent(spec, r.f));
  return { hi: Math.max(...spans.map((s) => s[0])), lo: Math.min(...spans.map((s) => s[1])) };
};

const rowHeight = (rows: number): number => (rows <= 4 ? 60 : rows <= 6 ? 52 : rows <= 9 ? 44 : 40);

type Look = "plain" | "newest" | "answer";

/** One row's cells: the digits where they sit, a blue 0 in every other column down to the ones column (or up to the first digit). */
const rowCells = (spec: GridSpec, hi: number, lo: number, r: RowSpec, look: Look, circleFirst: boolean): (PVCell | string)[] => {
  const [top, bottom] = extent(spec, r.f);
  const cells: (PVCell | string)[] = [];
  for (let e = hi; e >= lo; e--) {
    if (e > top || e < bottom) { cells.push(""); continue; }
    const i = r.f - e;
    if (i >= 0 && i < spec.digits.length) {
      const c: PVCell = { v: spec.digits[i] };
      if (look === "answer") c.tone = "answer";
      if (circleFirst && i === 0) c.circle = "on";
      cells.push(c);
    } else cells.push({ v: "0", tone: "zero" });
  }
  cells.push(look === "plain" ? { v: power10(r.power) } : { v: power10(r.power), tone: look === "newest" ? "highlight" : "answer" });
  return cells;
};

/** The grid with the first `shown` rows written in; the rest keep their space, blank, so the table never changes size. */
const tableOf = (spec: GridSpec, shown: number, finish: boolean): PlaceValueTableData => {
  const { hi, lo } = columnsOf(spec);
  const rows = rowsOf(spec);
  const exps = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  const blank = [...exps.map(() => ""), ""];
  // the standard place value headings (M … H T O · t h th …), one for each exponent, with the Power column set apart at the end
  const places = pvColumnSet(7, 6);
  const at = (e: number): number => {
    if (e > 6 || e < -6) throw new Error(`Standard Form grid: no place value column for 10^${e}`);
    return 6 - e;
  };
  return {
    columns: [...exps.map((e) => places.columns[at(e)]), "Power"],
    columnNames: [...exps.map((e) => places.columnNames[at(e)]), "Power"],
    onesIndex: hi,
    showPoint: true,
    detachLast: true,
    cellHeight: rowHeight(rows.length),
    rows: rows.map((r, i) => {
      if (i >= shown) return { kind: "cells" as const, cells: blank };
      const last = i === shown - 1;
      const finished = finish && last;
      return { kind: "cells" as const, cells: rowCells(spec, hi, lo, r, finished ? "answer" : last ? "newest" : "plain", finished && spec.mode !== "toOrd") };
    }),
  };
};

/** The grid before anything is written in it: the whiteboard scaffold. */
export const gridBlank = (spec: GridSpec): PlaceValueTableData => tableOf(spec, 0, false);

/** The whole staircase (the whiteboard scaffold once the answer is shown). */
export const gridFinal = (spec: GridSpec): PlaceValueTableData => {
  const { hi, lo } = columnsOf(spec);
  const rows = rowsOf(spec);
  const t = tableOf(spec, rows.length, true);
  // every earlier row stays plain; only the last row is marked as the answer
  return { ...t, rows: t.rows.map((row, i) => (i < rows.length - 1 && row.kind === "cells" ? { ...row, cells: rowCells(spec, hi, lo, rows[i], "plain", false) } : row)) };
};

/** The developing picture as worked-example steps: one more row of the staircase per step. */
export const gridSteps = (spec: GridSpec): WorkingStep[] => {
  const rows = rowsOf(spec);
  const step = Math.sign(spec.fEnd - spec.fStart);
  const toRight = step < 0;                       // digits move to the right: smaller places
  const first = ordinary(spec.digits, spec.fStart);
  const coef = ordinary(spec.digits, 0);
  const final = rows[rows.length - 1];
  const steps: WorkingStep[] = [];
  rows.forEach((r, i) => {
    const last = i === rows.length - 1;
    let caption: string;
    if (i === 0) {
      caption = spec.mode === "toStd"
        ? `Write ${withCommas(first)} in the grid, one digit in each column. Its power of 10 is ${power10(r.power)} for now.`
        : spec.mode === "half"
          ? `Write the coefficient ${first} in the grid, with its power of 10, ${power10(r.power)}, beside it.`
          : `Write the coefficient ${coef} in the grid with its first digit in the ones column, and its power of 10, ${power10(r.power)}, beside it.`;
    } else {
      caption = `Move every digit one column to the ${toRight ? "right" : "left"}. Each digit is now worth 10 times ${toRight ? "less" : "more"}, so the power of 10 goes ${toRight ? "up" : "down"} by 1, to ${power10(r.power)}.`;
    }
    if (last && rows.length > 1) {
      caption += spec.mode === "toOrd"
        ? ` The power is ${power10(final.power)}, so this is the ordinary number: ${withCommas(ordinary(spec.digits, spec.fEnd))}.`
        : ` The first digit is in the ones column, so this is standard form: ${coef} × ${power10(final.power)}.`;
    }
    steps.push(pvStep(caption, tableOf(spec, i + 1, last)));
  });
  return steps;
};
