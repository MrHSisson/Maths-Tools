import { describe, it, expect } from "vitest";
import katex from "katex";
import { longDivisionData } from "../shared/longDivision";

describe("longDivision", () => {
  it("matches the textbook layout: (x³ − 6x² − 9x + 54) ÷ (x + 3)", () => {
    const d = longDivisionData([1, -6, -9, 54], 1, -3, "x+3");
    expect(d.quotient).toEqual(["", "x^{2}", "-9x", "+18"]);
    expect(d.dividend).toEqual(["x^{3}", "-6x^{2}", "-9x", "+54"]);
    expect(d.steps[0].product).toEqual(["x^{3}", "+3x^{2}", "", ""]);
    expect(d.steps[0].remainder).toEqual(["", "-9x^{2}", "-9x", "+54"]);
    expect(d.steps[1].product).toEqual(["", "-9x^{2}", "-27x", ""]);
    expect(d.steps[1].remainder).toEqual(["", "", "18x", "+54"]);
    expect(d.steps[2].remainder).toEqual(["", "", "", "0"]);
  });
  it("handles non-monic divisors and parameters, and every cell renders", () => {
    const cases = [
      longDivisionData([2, -9, 7, 6], 2, -1, "2x+1"),
      longDivisionData([2, -9, 13, -6], 2, 3, "2x-3a", true),
    ];
    for (const d of cases) {
      const cells = [d.divisor, ...d.quotient, ...d.dividend, ...d.steps.flatMap(s => [...s.product, ...s.remainder])].filter(Boolean);
      for (const c of cells) expect(() => katex.renderToString(c, { throwOnError: true })).not.toThrow();
    }
    expect(cases[0].quotient).toEqual(["", "x^{2}", "-5x", "+6"]);
    expect(cases[1].quotient).toEqual(["", "x^{2}", "-3ax", "+2a^{2}"]);
  });
});
