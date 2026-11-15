import { tStep, pvColumnSet, power10, type PlaceValueShiftFrame, type PlaceValueShiftStep, type WorkingStep } from "../../shared";
import { ordinary } from "./StandardFormCore";

// The developing picture for Converting: the standard place value grid (B HM TM M HTh TTh Th H T O · t h th tth hth mth, letters or words)
// with ONE row of digits and a Power cell beside it. The decimal point stays where it is. Each step the digits slide one column and the
// power rolls over by 1:
//   digits one column to the right  (each worth 10 times less)  →  the power rolls UP by 1, to make up for it;
//   digits one column to the left   (each worth 10 times more)  →  the power rolls DOWN by 1.
// To standard form the digits slide until the first one is in the ones column; to an ordinary number they slide until the power is 10⁰.
//   45 000 × 10⁰ → 4 500 × 10¹ → 450 × 10² → 45 × 10³ → 4.5 × 10⁴
// This file only works out WHAT the picture shows at each step (a `PlaceValueShiftFrame`); the shared `PlaceValueShift` draws it and animates the move.

/** What the picture needs to know about a question; stored on it (`_grid`) for the whiteboard scaffold. */
export interface GridSpec {
  mode: "toStd" | "toOrd" | "half";
  /** The significant digits, first and last not zero ("45", "304", "72"). */
  digits: string;
  /** The exponent of the column the first digit sits in, at the first step and at the last. */
  fStart: number;
  fEnd: number;
  /** The power of 10 beside the digits at the first step. */
  power0: number;
}

/** Placed beyond the shared M (10⁶): ten millions, hundred millions, billions. */
const BIG_PLACES: [string, string][] = [["B", "Billions"], ["HM", "Hundred millions"], ["TM", "Ten millions"]];
const TOP = 9;                                   // the left-most column is 10⁹
const BOTTOM = -6;                               // the right-most column is 10⁻⁶ (millionths)

const placeAt = (e: number): [string, string] => {
  if (e > TOP || e < BOTTOM) throw new Error(`Standard Form grid: no place value column for 10^${e}`);
  if (e >= 7) return BIG_PLACES[TOP - e];
  const shared = pvColumnSet(7, 6);
  const i = 6 - e;
  return [shared.columns[i], shared.columnNames[i]];
};

const withCommas = (s: string): string => {
  const [w, f] = s.split(".");
  const g = w.length > 3 ? w.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : w;
  return f === undefined ? g : `${g}.${f}`;
};

interface Step { f: number; power: number; }

/** Every step of the slide, first to last: where the first digit sits and the power beside it. */
const stepsOf = (spec: GridSpec): Step[] => {
  const dir = Math.sign(spec.fEnd - spec.fStart);
  const count = Math.abs(spec.fEnd - spec.fStart) + 1;
  return Array.from({ length: count }, (_, r) => ({ f: spec.fStart + dir * r, power: spec.power0 - dir * r }));
};

/** The exponents a step fills: its digits, and the zeros that hold places between them and the ones column. */
const extent = (spec: GridSpec, f: number): [number, number] => [Math.max(f, 0), Math.min(f - spec.digits.length + 1, 0)];

/** The columns shown: wide enough for every step, so the grid never changes size as the digits slide. */
const columnRange = (spec: GridSpec): { hi: number; lo: number } => {
  const spans = stepsOf(spec).map((s) => extent(spec, s.f));
  return { hi: Math.max(...spans.map((s) => s[0])), lo: Math.min(...spans.map((s) => s[1])) };
};

/** The picture at one step (`row` counts from 0), or the empty grid when `row` is null. */
const gridFrame = (spec: GridSpec, row: number | null, finish = false): PlaceValueShiftFrame => {
  const { hi, lo } = columnRange(spec);
  const exps = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  const base = { headings: exps.map((e) => placeAt(e)[0]), names: exps.map((e) => placeAt(e)[1]), onesIndex: hi };
  if (row === null) return { ...base, digits: [], zeroCols: [], power: null, finish: false };
  const s = stepsOf(spec)[row];
  const [top, bottom] = extent(spec, s.f);
  const colOf = (e: number): number => hi - e;
  const digits = [...spec.digits].map((ch, i) => ({ ch, col: colOf(s.f - i) }));
  const zeroCols: number[] = [];
  for (let e = top; e >= bottom; e--) if (e > s.f || e < s.f - spec.digits.length + 1) zeroCols.push(colOf(e));
  return { ...base, digits, zeroCols, power: s.power, finish };
};

/** The empty grid: the whiteboard scaffold. */
export const gridBlank = (spec: GridSpec): PlaceValueShiftFrame => gridFrame(spec, null);

/** The last step (the whiteboard scaffold once the answer is shown). */
export const gridFinal = (spec: GridSpec): PlaceValueShiftFrame => gridFrame(spec, stepsOf(spec).length - 1, true);

/** The developing picture as worked-example steps: each step slides the digits one more column. */
export const gridSteps = (spec: GridSpec): WorkingStep[] => {
  const steps = stepsOf(spec);
  const toRight = Math.sign(spec.fEnd - spec.fStart) < 0;         // digits slide to the right: smaller places
  const first = ordinary(spec.digits, spec.fStart);
  const coef = ordinary(spec.digits, 0);
  const final = steps[steps.length - 1];
  return steps.map((_s, i) => {
    const last = i === steps.length - 1;
    let caption: string;
    if (i === 0) {
      caption = spec.mode === "toStd"
        ? `Write ${withCommas(first)} in the grid, one digit in each column. Its power of 10 is 10⁰ for now.`
        : spec.mode === "half"
          ? `Write the coefficient ${first} in the grid, with its power of 10 beside it.`
          : `Write the coefficient ${coef} in the grid with its first digit in the ones column, and its power of 10 beside it.`;
    } else {
      caption = `Slide every digit one column to the ${toRight ? "right" : "left"}. Each digit is now worth 10 times ${toRight ? "less" : "more"}, so the power of 10 goes ${toRight ? "up" : "down"} by 1.`;
    }
    if (last && steps.length > 1) {
      caption += spec.mode === "toOrd"
        ? ` The power is 10⁰, so this is the ordinary number: ${withCommas(ordinary(spec.digits, spec.fEnd))}.`
        : ` The first digit is in the ones column, so this is standard form: ${coef} × ${power10(final.power)}.`;
    }
    const data: PlaceValueShiftStep = { kind: "placeValueShift", caption, frame: gridFrame(spec, i, last) };
    return { ...tStep(caption), extra: data };
  });
};
