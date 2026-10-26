import { describe, it, expect } from "vitest";
import { buildWorksheet, type WorksheetBlock } from "../shared/worksheetGenerate";
import type { AnyQuestion, ToolMultiSelect } from "../shared/types";
import { pickActive } from "../shared/helpers";

const POOL: ToolMultiSelect = {
  key: "tier", label: "Tier", balanced: true,
  options: [
    { value: "easy", label: "Easy", defaultActive: true },
    { value: "mid", label: "Mid", defaultActive: true },
    { value: "hard", label: "Hard", defaultActive: true },
  ],
};
const TIER_NO: Record<string, number> = { easy: 1, mid: 2, hard: 3 };
let n = 0;
const gen = (_t: string, level: string, _v: Record<string, boolean>, _d: string, ms?: Record<string, boolean>) => {
  const tier = pickActive(ms ?? {}, POOL.options);
  return { kind: "simple", display: tier, answer: tier, working: [], key: `${level}-${tier}-${n++}`, difficulty: level } as unknown as AnyQuestion;
};
const uniq = (t: string, level: string, v: Record<string, boolean>, d: string, used: Set<string>, ms?: Record<string, boolean>) => {
  const q = gen(t, level, v, d, ms); used.add(q.key); return q;
};
const block = (level: "level1" | "level2" | "level3"): WorksheetBlock => ({
  level, variables: {}, dropdownValue: "", groups: [POOL], multiSelectValues: { easy: true, mid: true, hard: true }, calibratedMultiSelectValues: { easy: true, mid: true, hard: true },
});
const setup = (smart: boolean, blocks: WorksheetBlock[]) => ({ tool: "t", numQuestions: 15, smartProgressor: smart, generateQuestion: gen as never, generateUniqueQ: uniq as never, blocks });
const score = (q: AnyQuestion) => TIER_NO[(q as unknown as { display: string }).display];

describe("buildWorksheet", () => {
  it("balances a balanced group and stamps each slot's own options", () => {
    const ws = buildWorksheet(setup(true, [block("level1")]));
    expect(ws).toHaveLength(15);
    const s = ws.map(score);
    for (const w of [1, 2, 3]) expect(s.filter(x => x === w).length).toBeGreaterThanOrEqual(3);   // roughly a third each, never lopsided
    ws.forEach(q => expect((q as unknown as { _qo: { level: string } })._qo.level).toBe("level1"));
  });
  it("leaves the options unbalanced with Smart Progressor off", () => {
    const lopsided = Array.from({ length: 60 }, () => buildWorksheet(setup(false, [block("level1")])).map(score))
      .filter(s => [1, 2, 3].some(w => s.filter(x => x === w).length < 3));
    expect(lopsided.length).toBeGreaterThan(0);   // plain random draws sometimes land lopsided
  });
  it("a differentiated sheet is one block per level, in level order", () => {
    const ws = buildWorksheet(setup(true, [block("level1"), block("level3")]));
    expect(ws).toHaveLength(30);
    expect(ws.slice(0, 15).every(q => q.difficulty === "level1")).toBe(true);
    expect(ws.slice(15).every(q => q.difficulty === "level3")).toBe(true);
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
