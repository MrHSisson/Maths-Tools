// rStepSolve — the "known first, then work it out" developing ratio table (src/shared/ratioTable.ts).
import { describe, it, expect } from "vitest";
import { rStepSolve } from "../shared";
import type { RatioTableData } from "../shared";

const data = (s: { extra?: unknown }) => s.extra as RatioTableData;

describe("rStepSolve", () => {
  it("5 mph for 6 hours: known values, then the time arrow, then the distance arrow, then 30", () => {
    const steps = rStepSolve("Scale from 1 hour to the given time:", ["miles", "Hours"], [[5, 1], [30, 6]], ["\\times 6"], 1);
    expect(steps.map((s) => s.plain)).toEqual([
      "Scale from 1 hour to the given time: write what we know",
      "How do we get from 1 to 6? Multiply by 6",
      "Do the same to the miles: multiply by 6",
      "5 × 6 = 30",
    ]);
    expect(data(steps[0]).rows).toEqual([["5", "1"], ["", "6"]]);
    expect(data(steps[0]).opSides).toEqual(["none"]);
    expect(data(steps[1]).opSides).toEqual(["right"]);      // time column side only
    expect(data(steps[2]).opSides).toEqual(["both"]);
    expect(data(steps[2]).rows).toEqual([["5", "1"], ["", "6"]]); // still blank
    expect(data(steps[3]).rows).toEqual([["5", "1"], ["30", "6"]]);
    expect(data(steps[3]).fresh).toEqual([1, 0]);
  });
  it("a chain (÷ then ×) fills the unit row first; a find-the-time question drives from the distance", () => {
    const sp = rStepSolve("Scale to find the speed:", ["miles", "Minutes"], [[40, 20], [20, 10], [120, 60]], ["\\div 2", "\\times 6"], 1);
    expect(sp.length).toBe(1 + 3 * 2);   // 20 → 60 is a whole-number step apart, so no "why this middle row" beat
    expect(data(sp[3]).rows).toEqual([["40", "20"], ["20", "10"], ["", "60"]]);
    expect(sp[3].plain).toBe("40 ÷ 2 = 20");
    expect(data(sp[sp.length - 1]).rows).toEqual([["40", "20"], ["20", "10"], ["120", "60"]]);
    const tm = rStepSolve("Scale from 1 hour to find the time:", ["miles", "Minutes"], [[30, 60], [10, 20]], ["\\div 3"], 0);
    expect(data(tm[0]).rows).toEqual([["30", "60"], ["10", ""]]);
    expect(data(tm[1]).opSides).toEqual(["left"]);           // distance side first
    expect(tm[3].plain).toBe("60 ÷ 3 = 20");
  });
  it("explains the middle row when start and end are not a whole-number step apart (18 → 9 → 63)", () => {
    const st = rStepSolve("Scale to find the time:", ["miles", "Minutes"], [[18, 60], [9, 30], [63, 210]], ["\\div 2", "\\times 7"], 0);
    expect(st[1].plain).toBe("18 doesn't scale to 63 by a whole number. 9 is a common factor of 18 and 63 (18 ÷ 2 = 9, 9 × 7 = 63), so use 9 as a stepping stone");
    expect(st.length).toBe(1 + 1 + 3 * 2);
    expect(st[2].plain).toBe("How do we get from 18 to 9? Divide by 2");
  });
});
