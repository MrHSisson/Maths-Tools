// The storage-unit ladder shared by Data Units and File Sizes (OCR J277 1.2.4 / 1.2.5):
//
//   bit  ──×4──  nibble  ──×2──  byte  ──×1000──  KB  ──×1000──  MB  ──×1000──  GB  ──×1000──  TB  ──×1000──  PB
//
// A conversion is a walk along the ladder; moving DOWN (to a smaller unit) multiplies, UP divides. Values are exact — held
// as BigInt TENTHS so a PB → byte answer never loses digits and a one-decimal value (2.5 GB) stays exact.
// The drawn ladder is `components/UnitLadder.tsx`.

import type { WorkingStep } from "./types";
import { mStep } from "./helpers";

export const UNIT_PLURAL = ["bits", "nibbles", "bytes", "KB", "MB", "GB", "TB", "PB"];
export const UNIT_SINGULAR = ["bit", "nibble", "byte", "KB", "MB", "GB", "TB", "PB"];
/** UNIT_FACTORS[i] = how many of unit i make one of unit i+1. */
export const UNIT_FACTORS = [4, 2, 1000, 1000, 1000, 1000, 1000];

export const unitName = (i: number, tenths: bigint): string => (tenths === 10n ? UNIT_SINGULAR[i] : UNIT_PLURAL[i]);

export const groupDigits = (digits: string, sep: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
/** Tenths → "40,000" / "2.5". `sep` is "," for prose, "{,}" inside KaTeX. */
export const fmtT = (t: bigint, sep = ","): string => {
  const whole = t / 10n;
  const frac = t % 10n;
  return groupDigits(whole.toString(), sep) + (frac !== 0n ? `.${frac}` : "");
};

export interface Hop { from: number; to: number; factor: number; up: boolean; before: bigint; after: bigint }

/** The walk from unit `a` to unit `b` starting at `startT` tenths — one hop per ladder step. */
export const buildHops = (a: number, b: number, startT: bigint): Hop[] => {
  const hops: Hop[] = [];
  let t = startT;
  if (a < b) {
    for (let i = a; i < b; i++) {
      const f = BigInt(UNIT_FACTORS[i]);
      if (t % f !== 0n) throw new Error("data-units: inexact division");
      hops.push({ from: i, to: i + 1, factor: UNIT_FACTORS[i], up: true, before: t, after: t / f });
      t /= f;
    }
  } else {
    for (let i = a - 1; i >= b; i--) {
      const f = BigInt(UNIT_FACTORS[i]);
      hops.push({ from: i + 1, to: i, factor: UNIT_FACTORS[i], up: false, before: t, after: t * f });
      t *= f;
    }
  }
  return hops;
};

/** One working line for a hop: label "bytes → KB: divide by 1000 (÷ 1024):" and the sum, revealed in three parts. */
export const hopStep = (h: Hop): WorkingStep => {
  const f = h.factor;
  const op = h.up ? "÷" : "×";
  const bracket = f === 1000 ? ` (${op} 1024)` : "";
  const label = `${UNIT_PLURAL[h.from]} → ${UNIT_PLURAL[h.to]}: ${h.up ? "divide" : "multiply"} by ${f === 1000 ? "1000" : f}${bracket}:`;
  const tex = h.up ? "\\div" : "\\times";
  return mStep(label, [fmtT(h.before, "{,}"), `${tex} ${f}`, `= ${fmtT(h.after, "{,}")}`]);
};
