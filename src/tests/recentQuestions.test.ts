// No repeats in the last 15 questions (Whiteboard, Worked Example, phone single view, Decision shell).
import { describe, it, expect } from "vitest";
import { questionFingerprint, remember, pickFresh, RECENT_WINDOW } from "../shared/recentQuestions";
import { normalizeMultiSelect } from "../shared/helpers";

describe("questionFingerprint", () => {
  const base = { kind: "simple", display: "3 + 4", displayLatex: "3 + 4", answer: "7", difficulty: "level1", _diagram: { a: 1, b: [1, 2] } };
  it("ignores the key, the seed, the calibration scores and the working: they say nothing about what the student sees", () => {
    const a = { ...base, key: "k1", _seed: 11, _difficultyScore: 2, _rawDifficulty: 5, _category: "x", working: [{ latex: "a" }] };
    const b = { ...base, key: "k2", _seed: 99, _difficultyScore: 7, _rawDifficulty: 1, _category: "y", working: [{ latex: "b" }, { latex: "c" }] };
    expect(questionFingerprint(a)).toBe(questionFingerprint(b));
  });
  it("does not depend on the order of an object's keys", () => {
    expect(questionFingerprint({ x: 1, y: { p: 1, q: 2 } })).toBe(questionFingerprint({ y: { q: 2, p: 1 }, x: 1 }));
  });
  it("tells questions apart by their wording, answer, level or picture data", () => {
    const fps = new Set([base, { ...base, display: "3 + 5" }, { ...base, answer: "8" }, { ...base, difficulty: "level2" }, { ...base, _diagram: { a: 1, b: [1, 3] } }].map((q) => questionFingerprint(q)));
    expect(fps.size).toBe(5);
  });
  it("copes with bigints, sets, functions and cycles without throwing", () => {
    const cyc: Record<string, unknown> = { n: BigInt(5), s: new Set([1, 2]), f: () => 1 };
    cyc.self = cyc;
    expect(() => questionFingerprint(cyc)).not.toThrow();
  });
});

describe("remember / pickFresh", () => {
  it("keeps the newest 15, moving a repeat to the end", () => {
    let seen: string[] = [];
    for (let i = 0; i < 40; i++) seen = remember(seen, String(i));
    expect(seen).toHaveLength(RECENT_WINDOW);
    expect(seen[RECENT_WINDOW - 1]).toBe("39");
    expect(remember(["a", "b", "c"], "a")).toEqual(["b", "c", "a"]);
  });

  it("never repeats one of the last 15 when the pool is big enough", () => {
    const draw = () => ({ n: Math.floor(Math.random() * 60) });
    let seen: string[] = [];
    const shown: string[] = [];
    for (let i = 0; i < 400; i++) {
      const q = pickFresh(draw, seen);
      const fp = questionFingerprint(q);
      expect(seen, `question ${i} repeated one of the last ${RECENT_WINDOW}`).not.toContain(fp);
      seen = remember(seen, fp);
      shown.push(fp);
    }
  });

  it("gives up after its tries when the pool is smaller than the window, instead of hanging", () => {
    let calls = 0;
    const draw = () => { calls++; return { n: calls % 3 }; };
    const seen = remember(remember(remember([], questionFingerprint({ n: 0 })), questionFingerprint({ n: 1 })), questionFingerprint({ n: 2 }));
    const q = pickFresh(draw, seen, 10);
    expect(q).toBeDefined();
    expect(calls).toBeLessThanOrEqual(10);
  });
});

// The real generators: whenever a tool's pool is large (many different questions at its default options), a run of New Question
// presses never repeats one of the last 15.
const loaders = import.meta.glob("../tools/**/*.tsx");
describe("real generators", () => {
  it("every tool with a large question pool shows no repeat within the last 15", async () => {
    const failures: string[] = [];
    let checked = 0;
    for (const [path, load] of Object.entries(loaders)) {
      const mod = (await load().catch(() => ({}))) as { __test?: { TOOL_CONFIG: any; generateQuestion: any; levels?: string[] } };
      const t = mod.__test;
      if (!t?.TOOL_CONFIG || !t.generateQuestion) continue;
      for (const [tool, entry] of Object.entries<any>(t.TOOL_CONFIG.tools)) for (const level of entry.levels ?? t.levels ?? ["level1", "level2", "level3"]) {
        const ds = entry.difficultySettings?.[level] ?? {};
        const vars = Object.fromEntries((ds.variables ?? entry.variables ?? []).map((v: any) => [v.key, v.defaultValue]));
        const dd = ds.dropdown !== undefined ? ds.dropdown : entry.dropdown;
        const ms: Record<string, boolean> = {};
        for (const g of normalizeMultiSelect(ds.multiSelect ?? entry.multiSelect)) for (const o of g.options) ms[o.value] = o.defaultActive;
        const gen = () => t.generateQuestion(tool, level, vars, dd?.defaultValue ?? "", ms);
        let sample: Set<string>;
        try { sample = new Set(Array.from({ length: 120 }, () => questionFingerprint(gen()))); } catch { continue; }
        if (sample.size < 80) continue;                       // a small pool cannot always avoid a repeat: not the point of the window
        checked++;
        let seen: string[] = [];
        for (let i = 0; i < 60; i++) {
          const fp = questionFingerprint(pickFresh(gen, seen));
          if (seen.includes(fp)) { failures.push(`${path.split("/").pop()} ${tool}/${level} (draw ${i})`); break; }
          seen = remember(seen, fp);
        }
      }
    }
    expect(checked, "expected to check many tool levels").toBeGreaterThan(40);
    expect(failures).toEqual([]);
  }, 300_000);
});
