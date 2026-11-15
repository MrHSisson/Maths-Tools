import { pvStep, type PlaceValueTableData, type PVCell, type WorkingStep } from "../../shared";
import { ordinary } from "./StandardFormCore";

// The developing picture for Converting: a place value grid whose columns are headed with powers of ten (10⁵ … 10⁻⁵).
// Nothing moves. The digits sit in their columns; the power of 10 is read off from the column of the first non-zero digit.
//   · to standard form: write the number in the grid, circle the first non-zero digit, read its column as the power;
//   · to an ordinary number: put the first digit of the coefficient in the column of the power, then fill with zeros;
//   · half-way numbers (304 × 10⁵): the coefficient's ones digit sits in the 10⁵ column, and the first non-zero digit decides the power.

/** What the picture needs to know about a question; stored on it (`_grid`) for the whiteboard scaffold. */
export interface GridSpec {
  mode: "toStd" | "toOrd" | "half";
  /** The digits as written in the grid at the start: the ordinary number, the coefficient, or the half-way coefficient ("0.003"). */
  shown: string;
  /** The exponent of the column the ones digit of `shown` sits in (0, or the starting power for half-way numbers). */
  shownUnits: number;
  /** The coefficient of the answer in standard form ("4.5") and its power. */
  coef: string;
  power: number;
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const sup = (n: number): string => String(n).split("").map((c) => SUP[c]).join("");
const power10 = (n: number): string => `10${sup(n)}`;

/** digit by exponent: the string's ones digit sits in the column `units`. */
const digitMap = (s: string, units: number): Map<number, string> => {
  const [whole, frac = ""] = s.split(".");
  const m = new Map<number, string>();
  [...whole].forEach((d, i) => m.set(units + whole.length - 1 - i, d));
  [...frac].forEach((d, i) => m.set(units - 1 - i, d));
  return m;
};

const withCommas = (s: string): string => {
  const [w, f] = s.split(".");
  const g = w.length > 3 ? w.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : w;
  return f === undefined ? g : `${g}.${f}`;
};

interface Layout { hi: number; lo: number; units: number; }

const layoutOf = (spec: GridSpec): Layout => {
  const ord = spec.mode === "toOrd" ? ordinary(spec.coef.replace(".", ""), spec.power) : spec.shown;
  const exps = [...digitMap(spec.mode === "toOrd" ? ord : spec.shown, spec.mode === "toOrd" ? 0 : spec.shownUnits).keys()];
  const units = spec.mode === "toOrd" ? 0 : spec.shownUnits;
  const always = spec.mode === "half" ? [units] : [0];             // an ordinary number always shows its ones column
  const all = [...exps, ...always, spec.power];
  return { hi: Math.max(...all), lo: Math.min(...all), units };
};

const tableOf = (spec: GridSpec, banner: string, cells: Map<number, PVCell>, highlight?: number): PlaceValueTableData => {
  const { hi, lo, units } = layoutOf(spec);
  const exps = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  return {
    columns: exps.map(power10),
    onesIndex: hi - units,
    showPoint: true,
    cellHeight: 60,
    highlightCol: highlight === undefined ? undefined : hi - highlight,
    rows: [
      { kind: "banner", text: banner },
      { kind: "cells", cells: exps.map((e) => cells.get(e) ?? "") },
    ],
  };
};

/** The digits of the start of the picture, with zeros that only hold the place (before the first digit, after the last) in blue. */
const shownCells = (spec: GridSpec, upTo: "start" | "circled" | "coefficient"): { cells: Map<number, PVCell>; first: number; last: number } => {
  const m = digitMap(spec.shown, spec.shownUnits);
  const nonZero = [...m].filter(([, d]) => d !== "0").map(([e]) => e);
  const first = Math.max(...nonZero), last = Math.min(...nonZero);
  const cells = new Map<number, PVCell>();
  for (const [e, d] of m) {
    const holder = d === "0" && (e > first || e < last);
    const cell: PVCell = { v: d };
    if (holder) cell.tone = "zero";
    if (upTo === "circled" && e === first) cell.circle = "on";
    if (upTo === "coefficient" && e <= first && e >= last) cell.tone = "answer";
    cells.set(e, cell);
  }
  return { cells, first, last };
};

/** The grid before anything is written in it: the whiteboard scaffold, and the empty start of every picture. */
export const gridBlank = (spec: GridSpec): PlaceValueTableData => tableOf(spec, spec.mode === "toOrd" ? `${spec.coef} × ${power10(spec.power)}` : " ", new Map());

/** The finished picture (the whiteboard scaffold once the answer is shown). */
export const gridFinal = (spec: GridSpec): PlaceValueTableData => {
  const steps = gridSteps(spec);
  return (steps[steps.length - 1].extra as { table: PlaceValueTableData }).table;
};

/** The developing picture as worked-example steps: one snapshot of the grid per step. */
export const gridSteps = (spec: GridSpec): WorkingStep[] => {
  if (spec.mode === "toOrd") {
    const digits = spec.coef.replace(".", "");
    const placed = new Map<number, PVCell>();
    [...digits].forEach((d, i) => placed.set(spec.power - i, { v: d, ...(i === 0 ? { circle: "on" as const } : {}) }));
    const { hi, lo } = layoutOf(spec);
    const filled = new Map<number, PVCell>();
    for (let e = hi; e >= lo; e--) filled.set(e, placed.get(e) ? { v: placed.get(e)!.v } : { v: "0", tone: "zero" });
    const answer = new Map<number, PVCell>();
    for (let e = hi; e >= lo; e--) answer.set(e, { ...filled.get(e)!, tone: filled.get(e)!.tone ?? "answer" });
    const expr = `${spec.coef} × ${power10(spec.power)}`;
    const ord = ordinary(digits, spec.power);
    return [
      pvStep(`The power is ${spec.power}, so the first digit, ${digits[0]}, goes in the ${power10(spec.power)} column. The other digits of ${spec.coef} follow, one in each column to the right.`, tableOf(spec, expr, placed, spec.power)),
      pvStep("Put a 0 in every empty column, down to the ones column, so that every column has a digit.", tableOf(spec, expr, filled)),
      pvStep(`Read the number from the grid: ${withCommas(ord)}.`, tableOf(spec, withCommas(ord), answer)),
    ];
  }
  // to standard form (an ordinary number, or a half-way number whose coefficient is written in the grid)
  const start = shownCells(spec, "start");
  const circled = shownCells(spec, "circled");
  const coefficient = shownCells(spec, "coefficient");
  const d = digitMap(spec.shown, spec.shownUnits).get(start.first)!;
  const where = spec.mode === "half"
    ? `The coefficient ${spec.shown} goes in the grid with its ones digit in the ${power10(spec.shownUnits)} column, because it is multiplied by ${power10(spec.shownUnits)}.`
    : `Write ${withCommas(spec.shown)} in the grid, one digit in each column. Zeros that only hold a place are blue.`;
  return [
    pvStep(where, tableOf(spec, " ", start.cells)),
    pvStep(`The first non-zero digit, ${d}, is in the ${power10(start.first)} column. So the power of 10 is ${start.first}.`, tableOf(spec, " ", circled.cells, start.first)),
    pvStep(`The coefficient is the digits from the ${d} onwards, with the point after the first digit: ${spec.coef} × ${power10(spec.power)}.`, tableOf(spec, `${spec.coef} × ${power10(spec.power)}`, coefficient.cells, start.first)),
  ];
};
