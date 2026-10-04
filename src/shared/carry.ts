// Carry ripple — "add 1" explained one column at a time, in any base (2, 10 or 16).
//
// A pure model, no UI: `rippleIncrement(n, base, width)` returns one beat per column the carry touches, each with
// the digits as they stand after that column is written, which digits have changed so far, where the carry sits,
// and a plain-English sentence for the teacher to read out. If the carry runs off the left-hand end there is a
// final overflow beat (the number wraps to 0).
//
// Built for the Binary Counting odometer; the shift / addition / base-conversion tools can reuse the same beats
// (`pvBaseCells`-style digit rows + an `above` carry marker) so every binary explanation reads the same way.

import { pvBaseCells } from "./placeValue";

export type RippleBase = 2 | 10 | 16;

export interface RippleBeat {
  /** Digits left → right (most significant first), after this beat. */
  cells: string[];
  /** Per column: has this digit changed since the start of the increment? */
  changed: boolean[];
  /** Column (left → right index) being written this beat; -1 on the overflow beat. */
  focusCol: number;
  /** Column that has just received a carry (to draw a carry mark above it), or -1. */
  carryCol: number;
  kind: "fits" | "carry" | "overflow";
  text: string;
}

export interface RippleResult {
  beats: RippleBeat[];
  /** The value after the increment (0 after overflow). */
  result: number;
  overflow: boolean;
}

const BASE_NAME: Record<RippleBase, string> = { 2: "binary", 10: "denary", 16: "hex" };
const RANGE: Record<RippleBase, string> = { 2: "0 or 1", 10: "0 to 9", 16: "0 to F" };
const TEN_NAMES = ["ones", "tens", "hundreds"];

/** Name of the j-th column from the right ("ones", "tens", … for denary; "2s", "4s", … otherwise). */
export const columnName = (base: RippleBase, j: number): string =>
  j === 0 ? "ones" : base === 10 && j < TEN_NAMES.length ? TEN_NAMES[j] : `${base ** j}s`;

const ch = (v: number): string => v.toString(16).toUpperCase();
const dtxt = (base: RippleBase, v: number): string => (base === 16 && v > 9 ? `${ch(v)} (${v})` : ch(v));

export const rippleIncrement = (n: number, base: RippleBase, width: number): RippleResult => {
  const cur = pvBaseCells(n, base, width).map((c) => parseInt(c, 16));
  const changed: boolean[] = Array(width).fill(false);
  const beats: RippleBeat[] = [];
  const name = BASE_NAME[base];
  const snap = () => cur.map(ch);

  for (let j = 0; j < width; j++) {
    const c = width - 1 - j;
    const v = cur[c];
    const sum = v + 1;
    const lead = j === 0 ? "Add 1 to the ones column. " : `The carry arrives in the ${columnName(base, j)} column. `;
    changed[c] = true;
    if (sum < base) {
      cur[c] = sum;
      beats.push({
        cells: snap(), changed: [...changed], focusCol: c, carryCol: -1, kind: "fits",
        text: `${lead}${dtxt(base, v)} + 1 = ${sum} — that fits in one ${name} column, so write ${ch(sum)}. Nothing is left to carry, so we stop.`,
      });
      return { beats, result: n + 1, overflow: false };
    }
    cur[c] = 0;
    const how = base === 10
      ? `${dtxt(base, v)} + 1 = ${sum}. A column only holds ${RANGE[base]}, so write 0 and carry the 1 to the next column.`
      : `${dtxt(base, v)} + 1 = ${sum}, which is written ${sum.toString(base).toUpperCase()} in ${name}: write the 0 and carry the 1 to the next column.`;
    beats.push({ cells: snap(), changed: [...changed], focusCol: c, carryCol: c - 1, kind: "carry", text: lead + how });
  }

  const unit = base === 2 ? "bit" : "digit";
  beats.push({
    cells: snap(), changed: Array(width).fill(true), focusCol: -1, carryCol: -1, kind: "overflow",
    text: `The carry has nowhere to go — there is no column to the left of the last one. With only ${width} ${unit}${width === 1 ? "" : "s"} the carry is lost: this is overflow, and every column is now 0.`,
  });
  return { beats, result: 0, overflow: true };
};
