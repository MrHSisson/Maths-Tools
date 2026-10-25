import { describe, it, expect } from "vitest";
import { buildWorksheet, type WorksheetBlock } from "../shared/worksheetGenerate";
import type { AnyQuestion, ToolMultiSelect } from "../shared/types";
import { pickActive } from "../shared/helpers";

const POOL: ToolMultiSelect = {
  key: "tier", label: "Tier",
  options: [
    { value: "easy", label: "Easy", defaultActive: true, weight: 1 },
    { value: "mid", label: "Mid", defaultActive: true, weight: 2 },
    { value: "hard", label: "Hard", defaultActive: true, weight: 3 },
  ],
};
let n = 0;
const gen = (_t: string, level: string, _v: Record<string, boolean>, _d: string, ms?: Record<string, boolean>) => {
  const tier = pickActive(ms ?? {}, POOL.options);
  return { kind: "simple", display: tier, answer: tier, working: [], key: `${level}-${tier}-${n++}`, difficulty: level, _difficultyScore: POOL.options.find(o => o.value === tier)!.weight } as unknown as AnyQuestion;
};
const uniq = (t: string, level: string, v: Record<string, boolean>, d: string, used: Set<string>, ms?: Record<string, boolean>) => {
  const q = gen(t, level, v, d, ms); used.add(q.key); return q;
};
const block = (level: "level1" | "level2" | "level3"): WorksheetBlock => ({
  level, variables: {}, dropdownValue: "", groups: [POOL], multiSelectValues: { easy: true, mid: true, hard: true }, calibratedMultiSelectValues: { easy: true, mid: true, hard: true },
});
const setup = (smart: boolean, blocks: WorksheetBlock[]) => ({ tool: "t", numQuestions: 15, smartProgressor: smart, generateQuestion: gen as never, generateUniqueQ: uniq as never, blocks });
const score = (q: AnyQuestion) => (q as unknown as { _difficultyScore: number })._difficultyScore;

describe("buildWorksheet", () => {
  it("balances weighted options, sorts easy to hard and stamps each slot's own options", () => {
    const ws = buildWorksheet(setup(true, [block("level1")]));
    expect(ws).toHaveLength(15);
    const s = ws.map(score);
    expect(s).toEqual([...s].sort((a, b) => a - b));
    for (const w of [1, 2, 3]) expect(s.filter(x => x === w).length).toBeGreaterThanOrEqual(3);   // roughly a third each, never lopsided
    ws.forEach(q => expect((q as unknown as { _qo: { level: string } })._qo.level).toBe("level1"));
  });
  it("leaves the order alone with Smart Progressor off", () => {
    const sorted = Array.from({ length: 10 }, () => buildWorksheet(setup(false, [block("level1")])).map(score))
      .filter(s => s.every((x, i) => i === 0 || s[i - 1] <= x));
    expect(sorted.length).toBeLessThan(10);   // a random order is almost never sorted
  });
  it("a differentiated sheet is one sorted block per level, in level order", () => {
    const ws = buildWorksheet(setup(true, [block("level1"), block("level3")]));
    expect(ws).toHaveLength(30);
    expect(ws.slice(0, 15).every(q => q.difficulty === "level1")).toBe(true);
    expect(ws.slice(15).every(q => q.difficulty === "level3")).toBe(true);
    const second = ws.slice(15).map(score);
    expect(second).toEqual([...second].sort((a, b) => a - b));
  });
  it("uses the calibrated path for questions that carry a raw difficulty", () => {
    const genCal = (t: string, l: string, v: Record<string, boolean>, d: string, ms?: Record<string, boolean>) =>
      ({ ...(gen(t, l, v, d, ms) as object), _rawDifficulty: Math.random() * 10, _difficultyScore: Math.floor(Math.random() * 8) }) as unknown as AnyQuestion;
    const uniqCal = (t: string, l: string, v: Record<string, boolean>, d: string, used: Set<string>, ms?: Record<string, boolean>) => { const q = genCal(t, l, v, d, ms); used.add(q.key); return q; };
    const ws = buildWorksheet({ ...setup(true, [block("level2")]), generateQuestion: genCal as never, generateUniqueQ: uniqCal as never });
    expect(ws).toHaveLength(15);
    expect(new Set(ws.map(q => q.key)).size).toBe(15);
  });
});
