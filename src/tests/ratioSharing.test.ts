import { describe, it, expect } from "vitest";
import { __test } from "../tools/Proportion/RatioSharingTool";
import { buildSharing, buildKnown, buildDifference } from "../tools/Proportion/ratioSharing";
import { withSeededRandom } from "./seededRandom";

const { generateQuestion, TOOL_CONFIG } = __test as any;
const LEVELS = ["level1", "level2", "level3"] as const;
const pools = (three: boolean, quantities: boolean) => ({ two: !three, three, money: !quantities, quantities, personA: true, personB: true, personC: true, both: true, total: true, other: true, sharing: true, known: true, difference: true });

describe("Ratio Sharing builders (the numbers the deck's fixed questions use)", () => {
  it("shares a total, two and three parts, with the check", () => {
    const q: any = buildSharing({ names: ["Mia", "Jack"], parts: [2, 3], partValue: 12, ask: "both", check: true, bar: true });
    expect(q.answer).toBe("Mia: £24, Jack: £36");
    expect(q.working[q.working.length - 1].plain).toBe("Check: £24 + £36 = £60, the total shared.");
    const t: any = buildSharing({ names: ["A", "B", "C"], parts: [2, 3, 5], partValue: 9, ask: 2, bar: false, check: true });
    expect(t.answer).toBe("C: £45");
    expect(t.lines[0]).toContain("A, B and C share £90 in the ratio $2:3:5$");
  });
  it("a known share, and the unsimplified ratio simplifies first", () => {
    const q: any = buildKnown({ names: ["Ana", "Ben"], parts: [3, 5], partValue: 8, known: 0, ask: "total", bar: true });
    expect(q.lines[1]).toBe("Ana receives £24");
    expect(q.answer).toBe("Total: £64");
    const u: any = buildKnown({ names: ["Ana", "Ben"], parts: [3, 5], display: [6, 10], partValue: 8, known: 0, ask: 1, bar: true });
    expect(u.lines[0]).toContain("$6:10$");
    expect(u.working[0].plain).toBe("Simplify the ratio first: 6 : 10 = 3 : 5.");
    expect(u.answer).toBe("Ben: £40");
  });
  it("a difference, two and three parts", () => {
    const q: any = buildDifference({ names: ["Ana", "Ben"], parts: [3, 7], partValue: 12, a: 0, b: 1, style: 1, ask: "total", bar: false });
    expect(q.lines[1]).toBe("Ben receives £48 more than Ana");
    expect(q.answer).toBe("Total: £120");
    const t: any = buildDifference({ names: ["A", "B", "C"], parts: [2, 3, 7], partValue: 6, a: 0, b: 2, style: 3, ask: 1, bar: true, check: true });
    expect(t.lines[1]).toBe("The difference between A's and C's shares is £30");
    expect(t.answer).toBe("B: £18");
  });
  it("quantities carry their unit in the words and not in KaTeX", () => {
    const q: any = buildSharing({ names: ["Ana", "Ben"], parts: [3, 4], partValue: 5, ask: "both", ctx: "paint", bar: false });
    expect(q.lines[0]).toBe("Ana and Ben share 35 litres of paint in the ratio $3:4$");
    expect(q.answer).toBe("Ana: 15 litres, Ben: 20 litres");
    expect(JSON.stringify(q.working)).not.toContain("litres");
  });
});

describe("Ratio Sharing generators", () => {
  const strip = (t: string) => t.replace(/\$[^$]*\$/g, "");
  const numbers = (t: string) => (strip(t).match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  /** Recompute the answer from the question's own words, by a route that does not use the builder. */
  const recompute = (q: any): { who: string | null; value: number } => {
    const ratio = /\$([\d:]+)\$/.exec(q.lines[0])![1].split(":").map(Number);
    const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
    const k = ratio.reduce((a: number, b: number) => g(a, b));
    const parts = ratio.map((p: number) => p / k);
    const rs = parts.reduce((a: number, b: number) => a + b, 0);
    const names = strip(q.lines[0]).split(" share")[0].split(/, | and /);
    let pv: number;
    if (q.lines.length === 2) pv = numbers(q.lines[0])[0] / rs;                    // sharing: the total is in line 1
    else if (!/ than |^The difference/.test(q.lines[1])) pv = numbers(q.lines[1])[0] / parts[names.indexOf(q.lines[1].split(" ")[0])];
    else {
      const d = numbers(q.lines[1])[0];
      const ns = names.filter((n: string) => q.lines[1].includes(n));
      const pair = ns.length === 2 ? ns.map((n: string) => parts[names.indexOf(n)]) : [parts[0], parts[1]];
      pv = d / Math.abs(pair[0] - pair[1]);
    }
    const last = q.lines[q.lines.length - 1];
    if (last.startsWith("What is the total")) return { who: "Total", value: pv * rs };
    const asked = names.find((n: string) => last.includes(n));
    if (asked) return { who: asked, value: pv * parts[names.indexOf(asked)] };
    return { who: null, value: pv * rs };                                              // "Find both / all shares": checked below
  };
  it("every answer is right from the question's own numbers, at every level, tab and shape", () => {
    withSeededRandom(7, () => {
      for (const level of LEVELS) for (const tool of ["sharing", "known", "difference", "mixed"]) for (const three of [false, true]) for (const quantities of [false, true]) for (const unsimplified of [false, true]) {
        for (let i = 0; i < 25; i++) {
          const q: any = generateQuestion(tool, level, { unsimplified, showCheck: true }, "", pools(three, quantities));
          const ratio = /\$([\d:]+)\$/.exec(q.lines[0])![1].split(":").map(Number);
          expect(ratio.length).toBe(three ? 3 : 2);
          const r = recompute(q);
          if (r.who) expect(numbers(q.answer)[0]).toBeCloseTo(r.value, 6);
          else expect(numbers(q.answer).reduce((a, b) => a + b, 0)).toBeCloseTo(r.value, 6);
          if (unsimplified) expect(ratio.reduce((a: number, b: number) => (function g(x: number, y: number): number { return y ? g(y, x % y) : x; })(a, b))).toBeGreaterThan(1);
          if (quantities) expect(q.lines[0]).not.toContain("£");
          expect(q.working.length).toBeGreaterThan(2);
        }
      }
    });
  });
  it("Person C is only asked of a three-part ratio", () => {
    withSeededRandom(3, () => {
      for (let i = 0; i < 200; i++) {
        const q: any = generateQuestion("sharing", "level2", {}, "", { ...pools(false, false), personA: false, personB: false, both: false });
        expect(q.answer).toMatch(/^[A-Z][a-z]+: £/);
      }
    });
  });
  it("defaults are the old tool: two parts, money, simplest form", () => {
    const cfg = TOOL_CONFIG.tools.sharing;
    const dflt = Object.fromEntries(cfg.multiSelect.flatMap((m: any) => m.options.map((o: any) => [o.value, o.defaultActive])));
    expect(dflt.three).toBe(false); expect(dflt.quantities).toBe(false);
    for (const level of LEVELS) for (let i = 0; i < 30; i++) {
      const q: any = generateQuestion("sharing", level, {}, "", dflt);
      expect(q.lines[0]).toContain("£");
      expect(/\$(\d+):(\d+)\$/.test(q.lines[0])).toBe(true);
    }
  });
});

import { Q } from "../decks/builder";
import { parsePictureLine } from "../decks/WorkedPicture";

describe("Ratio Sharing in a deck (Q.share, Q.known, Q.diff)", () => {
  it("keeps the tool's wording, its answer in plain words and its bar model as a picture", () => {
    const q = Q.known("rs-k1", { names: ["Ana", "Ben"], parts: [3, 5], partValue: 8, known: 0, ask: "total", bar: true, check: true });
    expect(q.question).toEqual(["Ana and Ben share money in the ratio $3:5$", "Ana receives £24", "What is the total amount shared?"]);
    expect(q.answer).toEqual(["Total: £64"]);
    const pics = q.explanation.map(parsePictureLine).filter(Boolean) as any[];
    expect(pics.length).toBe(3);   // the known share marked, the value of one part in every box, then the shares
    expect(pics[0].data.rows[0]).toMatchObject({ name: "Ana", units: 3, known: true, given: true, total: "£24" });
    expect(pics[1].data.rows.map((r: any) => r.unitLabel)).toEqual(["£8", "£8"]);
    expect(pics[1].data.rows.map((r: any) => r.total)).toEqual(["£24", undefined]);
    expect(pics[2].data.rows.map((r: any) => r.total)).toEqual(["£24", "£40"]);
    expect(q.explanation[q.explanation.length - 1]).toContain("Check: £24 : £40 ÷ £8 = 3 : 5");
  });
  it("marks the difference boxes on the larger person's row, three parts included", () => {
    const q = Q.diff("rs-d1", { names: ["A", "B", "C"], parts: [2, 3, 7], partValue: 6, a: 0, b: 2, style: 1, ask: 1, bar: true });
    const pic = parsePictureLine(q.explanation[0]) as any;
    expect(pic.data.rows[2]).toMatchObject({ name: "C", units: 7, extraFrom: 2 });
    expect(pic.data.rows[0].extraFrom).toBeUndefined();
  });
  it("a numerical-method question has no pictures", () => {
    const q = Q.share("rs-s1", { names: ["Mia", "Jack"], parts: [2, 3], partValue: 12, ask: "both", bar: false });
    expect(q.explanation.some((l) => parsePictureLine(l))).toBe(false);
    expect(q.explanation[0]).toBe("Total parts: $2 + 3 = 5$");
  });
});
