import { describe, expect, it } from "vitest";
import { DEPTH_ITEMS } from "../tools/Proportion/RatioManipulationDepth";
import { MISCONCEPTIONS } from "../shared/misconceptions";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const item = (id: string) => DEPTH_ITEMS.find((i) => i.id === id)!;
const correct = (id: string) => item(id).options!.find((o) => o.correct)!.text;

describe("Ratio Manipulation Depth: the numbers", () => {
  it("every tag is in the misconception vocabulary", () => {
    for (const i of DEPTH_ITEMS) for (const o of i.options ?? []) if (o.tag) expect(MISCONCEPTIONS[o.tag], `${i.id}: ${o.tag}`).toBeTruthy();
  });
  it("12 : 8 simplifies to 3 : 2, and 6 : 4 is not simplest", () => {
    expect(12 / gcd(12, 8)).toBe(3); expect(8 / gcd(12, 8)).toBe(2);
    expect(correct("rm-simplify-stop")).toBe("$3 : 2$");
    expect(gcd(6, 4)).toBeGreaterThan(1);
  });
  it("2 : 5 doubled is 4 : 10; adding 2 to each is not equivalent", () => {
    expect(correct("rm-add-both")).toBe("$4 : 10$");
    expect(4 * 5).not.toBe(7 * 2);
    expect(4 * 5).toBe(10 * 2);
  });
  it("4 : 10 as 1 : 2.5; 9 : 6 as 1.5 : 1; 5 : 2 as 1 : 0.4 and 2.5 : 1", () => {
    expect(10 / 4).toBe(2.5); expect(9 / 6).toBe(1.5); expect(2 / 5).toBe(0.4); expect(5 / 2).toBe(2.5);
  });
  it("12 : 18 : 8 simplifies to 6 : 9 : 4 (common factor 2); 12 : 18 and 10 : 15 are both 2 : 3", () => {
    expect(gcd(gcd(12, 18), 8)).toBe(2);
    expect(correct("rm-three-part")).toBe("$6 : 9 : 4$");
    expect([12 / 6, 18 / 6]).toEqual([2, 3]); expect([10 / 5, 15 / 5]).toEqual([2, 3]);
  });
  it("fractions: 5 : 8 gives 5/13, 4 : 3 gives 4/7, 7 : 10 gives 7/17 and 7/10, 2 : 3 and 4 : 6 both give 2/5", () => {
    expect(correct("rm-total-denominator")).toBe("$\\frac5{13}$");
    expect(5 + 8).toBe(13); expect(4 + 3).toBe(7); expect(7 + 10).toBe(17);
    expect(7 / 10).toBeGreaterThan(7 / 17);
    expect(4 / 10).toBeCloseTo(2 / 5);
  });
  it("3/7 red gives 3 : 4; red 3/4 of blue gives 3/7 of all", () => {
    expect(7 - 3).toBe(4); expect(correct("rm-rest")).toBe("$3 : 4$");
    expect(3 + 4).toBe(7);
  });
});
