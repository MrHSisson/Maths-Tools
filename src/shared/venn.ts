// The Venn diagram: the pure logic behind the deck's Venn slide piece, the printed Venn sheets and the build scripts that make the
// Venn questions. Two numbers are split by their prime factors into three regions (left only, both, right only); the HCF is the
// product of the middle and the LCM the product of everything. The regions are always computed from the two numbers, so a wrong
// Venn cannot be authored. No React in here.

import { primeColour } from "./factorTree";

/** The prime factors of `n`, smallest first, repeats kept: 12 gives [2, 2, 3]. */
export function primeFactors(n: number): number[] {
  const out: number[] = [];
  let rest = n;
  for (let d = 2; d * d <= rest; d++) while (rest % d === 0) { out.push(d); rest /= d; }
  if (rest > 1) out.push(rest);
  return out;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
/** The product of a list of numbers (1 for an empty list, which is what an empty middle multiplies to). */
export const product = (xs: readonly number[]): number => xs.reduce((a, b) => a * b, 1);

/** The three regions of a prime-factor Venn, each smallest first. A prime that both numbers contain goes in the middle once for each
 *  copy BOTH have (matched one for one), so 8 = 2 × 2 × 2 and 12 = 2 × 2 × 3 share two 2s, not three. */
export interface VennRegions { left: number[]; middle: number[]; right: number[] }

export function splitPrimes(a: number, b: number): VennRegions {
  const fa = primeFactors(a);
  const rest = [...primeFactors(b)];
  const left: number[] = [];
  const middle: number[] = [];
  for (const p of fa) {
    const i = rest.indexOf(p);
    if (i >= 0) { middle.push(p); rest.splice(i, 1); } else left.push(p);
  }
  return { left, middle, right: rest };
}

/** Everything in the diagram, smallest first (a shared tile counted once). */
export const allTiles = (r: VennRegions): number[] => [...r.left, ...r.middle, ...r.right].sort((x, y) => x - y);
/** The HCF: the product of the middle (1 when nothing is shared). */
export const hcfOf = (r: VennRegions): number => product(r.middle);
/** The LCM: the product of every tile in the diagram. */
export const lcmOf = (r: VennRegions): number => product(allTiles(r));
/** What a circle multiplies back to: the left circle is the left only and the middle, the right circle the middle and the right only. */
export const circleNumbers = (r: VennRegions): [number, number] => [product([...r.left, ...r.middle]), product([...r.middle, ...r.right])];

/** The one-line answers shown on the reveal: "HCF = 2 × 3 = 6", "LCM = 2 × 2 × 3 × 3 = 36". A single tile is just "HCF = 5" and an empty
 *  middle says so, because nothing multiplies to 1. */
export function hcfLine(r: VennRegions): string {
  if (r.middle.length === 0) return "HCF = 1";
  return r.middle.length === 1 ? `HCF = ${r.middle[0]}` : `HCF = ${r.middle.join(" × ")} = ${hcfOf(r)}`;
}
export function lcmLine(r: VennRegions): string {
  const t = allTiles(r);
  return t.length === 1 ? `LCM = ${t[0]}` : `LCM = ${t.join(" × ")} = ${lcmOf(r)}`;
}

/** The ways a pair can catch a pupil out, so a build script can make sure a set has each and a ladder can climb. */
export interface VennFlags {
  /** Nothing in the middle (HCF 1). */
  emptyMiddle: boolean;
  /** One number sits wholly inside the other (one side empty, something shared). */
  oneInside: boolean;
  /** A prime is shared AND one number has a spare copy of it, so matching must be one for one (12 and 18 leave a spare 2 and 3). */
  spareCopy: boolean;
  /** The same prime is in the middle more than once. */
  repeatedInMiddle: boolean;
}
export function vennFlags(r: VennRegions): VennFlags {
  const outer = [...r.left, ...r.right];
  return {
    emptyMiddle: r.middle.length === 0,
    oneInside: r.middle.length > 0 && (r.left.length === 0 || r.right.length === 0),
    spareCopy: r.middle.some((p) => outer.includes(p)),
    repeatedInMiddle: r.middle.some((p, i) => r.middle.indexOf(p) !== i),
  };
}

/** What is wrong with a Venn of two numbers, in plain words (empty when it is a good one). `a` and `b` must be whole numbers above 1. */
export function vennProblems(a: number, b: number): string[] {
  const problems: string[] = [];
  for (const n of [a, b]) if (!Number.isInteger(n) || n < 2) problems.push(`${n} cannot go in a Venn of prime factors (a whole number bigger than 1)`);
  if (problems.length) return problems;
  const r = splitPrimes(a, b);
  const [ca, cb] = circleNumbers(r);
  if (ca !== a || cb !== b) problems.push(`the circles multiply back to ${ca} and ${cb}, not ${a} and ${b}`);
  if (hcfOf(r) !== gcd(a, b)) problems.push(`the middle gives ${hcfOf(r)} but the HCF of ${a} and ${b} is ${gcd(a, b)}`);
  if (lcmOf(r) !== (a * b) / gcd(a, b)) problems.push(`the whole Venn gives ${lcmOf(r)} but the LCM of ${a} and ${b} is ${(a * b) / gcd(a, b)}`);
  return problems;
}

/** All the factors of `n`, smallest first (for a Venn of two factor lists, whose overlap is the common factors). */
export const factorList = (n: number): number[] => {
  const out: number[] = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
  return out;
};
/** The factors in neither list only, in both, and in the second only: the three regions of a Venn of two factor lists. */
export function factorListRegions(a: number, b: number): VennRegions {
  const fa = factorList(a), fb = factorList(b);
  return { left: fa.filter((x) => !fb.includes(x)), middle: fa.filter((x) => fb.includes(x)), right: fb.filter((x) => !fa.includes(x)) };
}

/** A prime tile's colour: the number grid's for 2, 3, 5 and 7, one neutral ring for the rest, the same as the factor tree. */
export const tileColour = (p: number): string => primeColour(p);
