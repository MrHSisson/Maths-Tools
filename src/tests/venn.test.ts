import { describe, expect, it } from "vitest";
import { allTiles, circleNumbers, factorList, factorListRegions, hcfLine, hcfOf, lcmLine, lcmOf, primeFactors, splitPrimes, tileColour, vennFlags, vennProblems } from "../shared/venn";
import { primeColour } from "../shared/factorTree";
import type { VennFlags, VennRegions } from "../shared/venn";

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

describe("the Venn of prime factors", () => {
  it("splits 12 and 18 into a spare 2, a shared 2 and 3, and a spare 3", () => {
    const expected: VennRegions = { left: [2], middle: [2, 3], right: [3] };
    expect(splitPrimes(12, 18)).toEqual(expected);
  });

  it("matches repeated primes one for one: 8 and 12 share two 2s, not three", () => {
    expect(splitPrimes(8, 12)).toEqual({ left: [2], middle: [2, 2], right: [3] });
  });

  it("handles nothing shared, one inside the other, and the same number twice", () => {
    expect(splitPrimes(8, 15)).toEqual({ left: [2, 2, 2], middle: [], right: [3, 5] });
    expect(splitPrimes(9, 18)).toEqual({ left: [], middle: [3, 3], right: [2] });
    expect(splitPrimes(6, 6)).toEqual({ left: [], middle: [2, 3], right: [] });
  });

  it("gives the HCF from the middle and the LCM from everything, and the circles multiply back", () => {
    const r = splitPrimes(12, 18);
    expect(hcfOf(r)).toBe(6);
    expect(lcmOf(r)).toBe(36);
    expect(allTiles(r)).toEqual([2, 2, 3, 3]);
    expect(circleNumbers(r)).toEqual([12, 18]);
  });

  it("is right for every pair up to 130 (HCF, LCM, circles, and a clean problem list)", () => {
    for (let a = 2; a <= 130; a++) for (let b = 2; b <= 130; b++) {
      const r = splitPrimes(a, b);
      expect(vennProblems(a, b), `${a},${b}`).toEqual([]);
      expect(hcfOf(r)).toBe(gcd(a, b));
      expect(lcmOf(r)).toBe((a * b) / gcd(a, b));
      expect(hcfOf(r) * lcmOf(r)).toBe(a * b);
    }
  });

  it("writes the one-line answers, with an empty middle and a single tile spelt out", () => {
    expect(hcfLine(splitPrimes(12, 18))).toBe("HCF = 2 × 3 = 6");
    expect(lcmLine(splitPrimes(12, 18))).toBe("LCM = 2 × 2 × 3 × 3 = 36");
    expect(hcfLine(splitPrimes(10, 15))).toBe("HCF = 5");
    expect(hcfLine(splitPrimes(8, 15))).toBe("HCF = 1");
    expect(lcmLine(splitPrimes(8, 15))).toBe("LCM = 2 × 2 × 2 × 3 × 5 = 120");
    expect(lcmLine(splitPrimes(7, 7))).toBe("LCM = 7");
  });

  it("flags what a pair can catch a pupil out with", () => {
    const flags: VennFlags = vennFlags(splitPrimes(12, 18));
    expect(flags).toEqual({ emptyMiddle: false, oneInside: false, spareCopy: true, repeatedInMiddle: false });
    expect(vennFlags(splitPrimes(8, 15))).toMatchObject({ emptyMiddle: true, oneInside: false });
    expect(vennFlags(splitPrimes(9, 18))).toMatchObject({ oneInside: true, repeatedInMiddle: true });
    expect(vennFlags(splitPrimes(10, 15))).toMatchObject({ spareCopy: false, repeatedInMiddle: false });
  });

  it("says what is wrong with numbers that cannot go in a Venn", () => {
    expect(vennProblems(1, 12)).toHaveLength(1);
    expect(vennProblems(2.5, 12)).toHaveLength(1);
  });

  it("the candidate pairs in the plan come out as written (HCF, LCM)", () => {
    const plan: [number, number, number, number][] = [[10, 15, 5, 30], [14, 21, 7, 42], [6, 10, 2, 30], [12, 18, 6, 36], [20, 30, 10, 60], [28, 42, 14, 84], [30, 45, 15, 90], [8, 12, 4, 24], [18, 24, 6, 72], [45, 75, 15, 225], [16, 24, 8, 48], [24, 40, 8, 120], [50, 75, 25, 150], [36, 48, 12, 144], [60, 84, 12, 420], [40, 100, 20, 200], [32, 48, 16, 96], [9, 18, 9, 18], [6, 30, 6, 30], [21, 63, 21, 63], [8, 15, 1, 120], [15, 28, 1, 420]];
    for (const [a, b, h, l] of plan) { const r = splitPrimes(a, b); expect([hcfOf(r), lcmOf(r)], `${a},${b}`).toEqual([h, l]); }
  });
});

describe("prime factors and factor lists", () => {
  it("lists prime factors smallest first, repeats kept", () => {
    expect(primeFactors(12)).toEqual([2, 2, 3]);
    expect(primeFactors(97)).toEqual([97]);
    expect(primeFactors(360)).toEqual([2, 2, 2, 3, 3, 5]);
  });

  it("the Venn of the factor lists of 12 and 18 has the common factors in the middle, the biggest being the HCF", () => {
    expect(factorList(12)).toEqual([1, 2, 3, 4, 6, 12]);
    const r = factorListRegions(12, 18);
    expect(r).toEqual({ left: [4, 12], middle: [1, 2, 3, 6], right: [9, 18] });
    expect(Math.max(...r.middle)).toBe(hcfOf(splitPrimes(12, 18)));
  });

  it("prime tiles use the same colours as the factor tree and the number grid", () => {
    for (const p of [2, 3, 5, 7, 11, 13]) expect(tileColour(p)).toBe(primeColour(p));
  });
});
