import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/Rounding";

const gen = (tool: string, level: "level1" | "level2" | "level3", ms: Record<string, boolean>) =>
  __test.generateQuestion(tool, level, {}, "digit", ms) as any;

describe("Rounding — Numbers option (significant figures)", () => {
  for (const level of ["level1", "level2", "level3"] as const) {
    it(`${level}: wholes only never has a decimal part`, () => {
      for (let i = 0; i < 60; i++) {
        const q = gen("sf", level, { wholes: true, decimals: false });
        const num = (q.kind === "worded" ? q.lines[0] : q.display) as string;
        const n = num.match(/[\d,.{}]+/)![0];
        expect(n.includes(".")).toBe(false);
      }
    });
    it(`${level}: decimals only always has a decimal part`, () => {
      for (let i = 0; i < 60; i++) {
        const q = gen("sf", level, { wholes: false, decimals: true });
        const num = (q.kind === "worded" ? q.lines[0] : q.display) as string;
        expect(num.match(/[\d,.{}]+/)![0].includes(".")).toBe(true);
      }
    });
  }
});

describe("Rounding — Reveal ends & midpoint (Level 2)", () => {
  it("before the plot gives Show Ends then Show Plot when students plot it", () => {
    const q = gen("nearest", "level2", { blank: true, endsGiven: false, endsFirst: true, withAnswer: false, student: true, auto: false });
    expect(q._stagedReveal).toEqual(["Show Ends", "Show Plot"]);
  });
  it("plotted for them leaves only Show Ends", () => {
    const q = gen("nearest", "level2", { blank: true, endsGiven: false, endsFirst: true, withAnswer: false, student: false, auto: true });
    expect(q._stagedReveal).toEqual(["Show Ends"]);
  });
  it("default is unchanged: Show Plot", () => {
    const q = gen("nearest", "level2", {});
    expect(q._stagedReveal).toBe("Show Plot");
  });
});
