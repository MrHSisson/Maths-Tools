import { describe, expect, it } from "vitest";
import { barAtStage, barProblems, barStages, barUnits, braceRows, type BarModelData } from "../shared/barModel";

const bar: BarModelData = {
  parts: [{ units: 3 }, { units: 2 }],
  braces: [{ from: 0, to: 3, label: "red", below: true }, { from: 3, to: 5, label: "blue", below: true }, { from: 0, to: 5, label: "total" }],
};

describe("bar model data", () => {
  it("counts boxes and clicks", () => {
    expect(barUnits(bar)).toBe(5);
    expect(barStages(bar)).toBe(4);   // the second part, then three braces
  });
  it("builds up part by part, then brace by brace", () => {
    expect(barAtStage(bar, 0).parts).toHaveLength(1);
    expect(barAtStage(bar, 0).braces).toHaveLength(0);
    expect(barAtStage(bar, 1).parts).toHaveLength(2);
    expect(barAtStage(bar, 1).braces).toHaveLength(0);
    expect(barAtStage(bar, 2).braces).toHaveLength(1);
    expect(barAtStage(bar, 4)).toEqual(bar);
    expect(barAtStage(bar, 99)).toEqual(bar);
  });
  it("stacks braces that overlap on one side and keeps side-by-side ones on one row", () => {
    expect(braceRows(bar.braces!)).toEqual([0, 0, 0]);   // red and blue sit side by side below; total is alone above
    const stacked = braceRows([{ from: 0, to: 5, label: "a" }, { from: 1, to: 3, label: "b" }]);
    expect(stacked).toEqual([1, 0]);   // the narrower one sits closer to the bar
  });
  it("names what cannot be drawn", () => {
    expect(barProblems(bar)).toEqual([]);
    expect(barProblems({ parts: [] })).toContain("the bar has no boxes");
    expect(barProblems({ parts: [{ units: 2 }], braces: [{ from: 1, to: 4, label: "x" }] })[0]).toMatch(/does not sit inside/);
    expect(barProblems({ parts: [{ units: 30 }] }).join()).toMatch(/at most 24/);
    expect(barProblems({ parts: [{ units: 1.5 }] }).join()).toMatch(/whole number/);
  });
});
