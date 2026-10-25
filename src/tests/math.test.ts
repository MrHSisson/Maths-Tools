import { describe, it, expect } from "vitest";
import { gcd, lcm, gcdAll, shuffle, formatNumber, texNumber } from "../shared/math";

describe("shared maths helpers", () => {
  it("gcd is non-negative and handles zero", () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(-12, 18)).toBe(6);
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(0, 0)).toBe(0);
  });
  it("lcm", () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(-4, 6)).toBe(12);
    expect(lcm(0, 6)).toBe(0);
  });
  it("gcdAll", () => {
    expect(gcdAll([12, 18, 30])).toBe(6);
    expect(gcdAll([])).toBe(0);
  });
  it("shuffle returns a permutation and never mutates", () => {
    const a = [1, 2, 3, 4, 5];
    const s = shuffle(a);
    expect(a).toEqual([1, 2, 3, 4, 5]);
    expect([...s].sort()).toEqual(a);
  });
  it("shuffle is unbiased (each of 3 items lands first ~1/3)", () => {
    const first = [0, 0, 0];
    for (let i = 0; i < 30000; i++) first[shuffle([0, 1, 2])[0]]++;
    for (const c of first) expect(Math.abs(c / 30000 - 1 / 3)).toBeLessThan(0.02);
  });
  it("formatNumber puts a comma in from four digits, keeps decimals and negatives", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(4372)).toBe("4,372");
    expect(formatNumber(-5000)).toBe("-5,000");
    expect(formatNumber(1234567.8912)).toBe("1,234,567.8912");
    expect(formatNumber("12500")).toBe("12,500");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(0.0000001)).toBe("0.0000001");
    expect(texNumber(1234.5)).toBe("1{,}234.5");
  });
});
