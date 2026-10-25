import { describe, it, expect } from "vitest";
import { planQoChange, adaptQuestion } from "../shared/questionLifecycle";
import { generateSeeded } from "../shared/seededGenerate";
import type { AnyQuestion } from "../shared/types";

const base = { mode: "whiteboard", restoredCurrent: false, levelOrToolChanged: false };

describe("what happens to the question when the setup changes", () => {
  it("plans by mode, restore and level / sub-tool switch", () => {
    expect(planQoChange(base)).toBe("adapt");
    expect(planQoChange({ ...base, levelOrToolChanged: true })).toBe("fresh");
    for (const mode of ["worksheet", "teach", "depth"]) expect(planQoChange({ ...base, mode, levelOrToolChanged: true })).toBe("ignore");
    expect(planQoChange({ ...base, restoredCurrent: true, levelOrToolChanged: true })).toBe("ignore");
    expect(planQoChange({ ...base, mode: "single", levelOrToolChanged: true })).toBe("fresh");
  });

  const gen = (): AnyQuestion => { const n = Math.floor(Math.random() * 1e9); return { kind: "simple", display: String(n), answer: String(n), working: [], key: String(n), difficulty: "level1" } as unknown as AnyQuestion; };
  const q = generateSeeded(gen);
  it("keeps the question unless it is reformatted or only display options changed", () => {
    expect(adaptQuestion(q, undefined, false, gen)).toBeNull();
    const replayed = adaptQuestion(q, undefined, true, gen);
    expect(replayed?.key).toBe(q.key);   // the same question, redrawn from its seed
    const mine = { ...q, display: "mine" } as AnyQuestion;
    expect(adaptQuestion(q, () => mine, false, gen)).toBe(mine);
    expect(adaptQuestion(q, () => null, false, gen)).toBeNull();           // the tool declined: falls through
    expect(adaptQuestion(q, () => null, true, gen)?.key).toBe(q.key);
  });
});
