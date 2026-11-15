// Exact number helpers for the Standard Form tool. Nothing here uses floating point: a value is an integer (or a ratio of two
// integers) and decimal strings are built from digit strings, so an answer can never be off by a rounding error.

/** Drop trailing zeros from a digit string ("4500" → "45"), keeping at least one digit. */
const stripZeros = (d: string): string => d.replace(/0+$/, "") || "0";

/**
 * The ordinary number for digits × 10^(n − (len − 1)), i.e. the digit string read as a coefficient d.ddd with the power n.
 * ordinary("45", 4) = "45000", ordinary("72", -4) = "0.00072", ordinary("41", -1) = "0.41", ordinary("32", 1) = "32".
 */
export const ordinary = (digits: string, n: number): string => {
  const d = stripZeros(digits);
  const intLen = n + 1;                       // how many digits sit before the decimal point
  if (intLen >= d.length) return d + "0".repeat(intLen - d.length);
  if (intLen <= 0) return "0." + "0".repeat(-intLen) + d;
  return d.slice(0, intLen) + "." + d.slice(intLen);
};

/** The decimal string for the integer N × 10^(−scale): decStr(325, 2) = "3.25", decStr(7, 1) = "0.7", decStr(40, 1) = "4". */
export const decStr = (N: number, scale: number): string => {
  const s = String(N);
  return ordinary(s, s.length - 1 - scale);
};

/** Value N/D (positive integers) written as c × 10^k with 1 ≤ c < 10; c is returned as the ratio cN/cD. */
export const standardise = (N: number, D: number): { cN: number; cD: number; k: number } => {
  let cN = N, cD = D, k = 0;
  while (cN >= 10 * cD) { cD *= 10; k++; }
  while (cN < cD) { cN *= 10; k--; }
  return { cN, cD, k };
};

/** The coefficient cN/cD to d decimal places if it is exact there, else null. Trailing zeros are dropped ("4.50" → "4.5"). */
export const exactCoef = (cN: number, cD: number, dp: number): string | null => {
  const scaled = cN * 10 ** dp;
  if (scaled % cD !== 0) return null;
  return decStr(scaled / cD, dp);
};

/** The coefficient cN/cD rounded half-up to 3 significant figures, as a fixed d.dd string; null if it rounds up to 10. */
export const round3sf = (cN: number, cD: number): string | null => {
  const r = Math.floor((2 * cN * 100 + cD) / (2 * cD));
  if (r >= 1000) return null;
  return (r / 100).toFixed(2);
};

/** Whole-number thousands commas for an ordinary number given as a digit string: "45000" → "45{,}000" (KaTeX). Decimals are left alone. */
export const texOrdinary = (s: string): string => {
  const [whole, frac] = s.split(".");
  const grouped = whole.length > 3 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, "{,}") : whole;
  return frac === undefined ? grouped : `${grouped}.${frac}`;
};
