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
    // exclusive pools arrive from ToolShell with exactly one option on
    const q = gen("nearest", "level2", { blank: true, endsGiven: false, endsFirst: false, withAnswer: true, student: true, auto: false });
    expect(q._stagedReveal).toBe("Show Plot");
  });
});

// ── Identify Significant Figures ──────────────────────────────────────────────

/** An independent significant-figure counter (regex based, not sharing code with the tool). */
function sfCount(n: string): number {
  if (n.includes(".")) return n.replace(".", "").replace(/^0+/, "").length;
  return n.replace(/^0+/, "").replace(/0+$/, "").length;
}
function sfDigits(n: string): string[] {
  const d = n.replace(".", "");
  const trimmed = n.includes(".") ? d.replace(/^0+/, "") : d.replace(/^0+/, "").replace(/0+$/, "");
  return trimmed.split("");
}
const numberIn = (line: string) => line.match(/\$([\d,{}.]+)\$/)![1].replace(/[,{}]/g, "");

describe("Rounding — Identify Sig. Figs", () => {
  const ordinals: Record<string, number> = { "1st": 1, "2nd": 2, "3rd": 3 };
  for (const level of ["level1", "level2", "level3"] as const) {
    it(`${level}: every answer matches an independent counter, with the right kind of number`, () => {
      for (let i = 0; i < 1200; i++) {
        const q = gen("identifySf", level, {});
        const line = q.lines[0] as string;
        const n = numberIn(line);
        const digits = sfDigits(n);
        if (line.startsWith("How many")) expect(q.answer).toBe(String(sfCount(n)));
        else if (line.startsWith("Circle")) expect(q.answer).toBe(digits.join(", "));
        else {
          const k = ordinals[line.match(/the (\dst|\dnd|\drd)/)![1]];
          expect(q.answer).toBe(digits[k - 1]);
        }
        if (level === "level1") expect(n.replace(".", "")).not.toContain("0");
        if (level === "level2") expect(n.endsWith("0") && n.includes(".")).toBe(false);
        if (level === "level3") expect(/0/.test(n)).toBe(true);
      }
    });
  }
  it("level 2 trapped-only never has leading zeros; leading-only has them and no trailing zero", () => {
    for (let i = 0; i < 300; i++) {
      const t = numberIn(gen("identifySf", "level2", { trapped: true, leading: false }).lines[0]);
      expect(/^0/.test(t)).toBe(false);
      const l = numberIn(gen("identifySf", "level2", { trapped: false, leading: true, wholes: false, decimals: true }).lines[0]);
      expect(l.startsWith("0.0")).toBe(true);
    }
  });
  it("level 3 with trailing only: every number ends in a zero", () => {
    for (let i = 0; i < 300; i++) {
      expect(numberIn(gen("identifySf", "level3", { trapped: false, leading: false, trailing: true }).lines[0]).endsWith("0")).toBe(true);
    }
  });
  it("whole numbers and decimals options are honoured and 120.00-style trailing zeros count", () => {
    for (let i = 0; i < 300; i++) {
      expect(numberIn(gen("identifySf", "level3", { wholes: true, decimals: false }).lines[0]).includes(".")).toBe(false);
      expect(numberIn(gen("identifySf", "level3", { wholes: false, decimals: true }).lines[0]).includes(".")).toBe(true);
    }
    expect(sfCount("120.00")).toBe(5);
    expect(sfCount("1200")).toBe(2);
    expect(sfCount("0.002040")).toBe(4);
  });
  it("tasks can be restricted (Levels 2–3); Level 1 is always 'name one'", () => {
    for (let i = 0; i < 100; i++) {
      expect((gen("identifySf", "level2", { mark: false, name: false, count: true }).lines[0] as string).startsWith("How many")).toBe(true);
      expect((gen("identifySf", "level1", {}).lines[0] as string).startsWith("Write the")).toBe(true);
    }
  });
  it("level 2 is equally likely to be leading or trapped (50% each)", () => {
    let leading = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) if (numberIn(gen("identifySf", "level2", {}).lines[0]).startsWith("0.")) leading++;
    expect(leading / N).toBeGreaterThan(0.45);
    expect(leading / N).toBeLessThan(0.55);
  });
});
