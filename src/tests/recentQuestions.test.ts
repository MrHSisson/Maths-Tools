// No repeats in the last 15 questions (Whiteboard, Worked Example, phone single view, Decision shell).
import { describe, it, expect } from "vitest";
import { questionFingerprint, shownFingerprint, fingerprintsOf, isRepeat, remember, pickFresh, RECENT_WINDOW, type Recent } from "../shared/recentQuestions";
import { normalizeMultiSelect, makeUniqueQ } from "../shared/helpers";

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

describe("shownFingerprint: the words and answer on screen", () => {
  const base = { kind: "simple", display: "3 + 4", displayLatex: "3 + 4", answer: "7", key: "k", _id: "aaa", _order: [1, 2, 3] };
  it("ignores every field the student does not read, so a repeat that differs only in an incidental field is still caught", () => {
    const other = { ...base, key: "z", _id: "bbb", _order: [3, 2, 1] };
    expect(questionFingerprint(base)).not.toBe(questionFingerprint(other));          // the full fingerprint is fooled…
    expect(shownFingerprint(base)).toBe(shownFingerprint(other));                    // …the shown one is not
    expect(isRepeat([fingerprintsOf(base)], fingerprintsOf(other))).toBe(true);
  });
  it("tells different wording or a different answer apart, whatever the spacing", () => {
    expect(shownFingerprint(base)).not.toBe(shownFingerprint({ ...base, display: "3 + 5", displayLatex: "3 + 5" }));
    expect(shownFingerprint(base)).not.toBe(shownFingerprint({ ...base, answer: "8" }));
    expect(shownFingerprint({ ...base, display: "3 +  4", displayLatex: "3  + 4" })).toBe(shownFingerprint(base));
  });
  it("counts the words drawn on the picture, so 'Find x' with different angle labels is not the same question", () => {
    const fig = (l1: string, l2: string) => ({ kind: "simple", display: "Find x", answer: "x = 20", angles: [{ label: l1, value: 40 }, { label: l2, value: 50 }], id: Math.random() });
    expect(shownFingerprint(fig("2x", "x + 30"))).not.toBe(shownFingerprint(fig("x", "3x + 10")));
    expect(shownFingerprint(fig("2x", "x + 30"))).toBe(shownFingerprint(fig("2x", "x + 30")));     // a random id is still ignored
    const circle = (given: string) => ({ kind: "simple", display: "Find the circumference", answer: "31.4 cm", _rv: { givenLabel: given } });
    expect(shownFingerprint(circle("r = 5 cm"))).not.toBe(shownFingerprint(circle("d = 10 cm")));
  });
  it("is left out for a picture-only question, so every such question is not refused as 'the same'", () => {
    const pic = { kind: "simple", display: "", answer: "", _diagram: { a: 1 } };
    expect(shownFingerprint(pic)).toBe("");
    expect(fingerprintsOf(pic)).toHaveLength(1);
    expect(isRepeat([fingerprintsOf(pic)], fingerprintsOf({ ...pic, _diagram: { a: 2 } }))).toBe(false);
  });
});

describe("remember / pickFresh", () => {
  const fp = (q: object) => fingerprintsOf(q);
  it("keeps the newest 15, moving a repeat to the end", () => {
    let seen: Recent = [];
    for (let i = 0; i < 40; i++) seen = remember(seen, [String(i)]);
    expect(seen).toHaveLength(RECENT_WINDOW);
    expect(seen[RECENT_WINDOW - 1]).toEqual(["39"]);
    expect(remember([["a"], ["b"], ["c"]], ["a"])).toEqual([["b"], ["c"], ["a"]]);
  });

  it("never repeats one of the last 15 when the pool is big enough", () => {
    const draw = () => { const n = Math.floor(Math.random() * 60); return { display: `q${n}`, n, answer: "x" }; };
    let seen: Recent = [];
    for (let i = 0; i < 400; i++) {
      const q = pickFresh(draw, seen);
      expect(isRepeat(seen, fp(q)), `question ${i} repeated one of the last ${RECENT_WINDOW}`).toBe(false);
      seen = remember(seen, fp(q));
    }
  });

  it("refuses a repeat that differs only in a random id the student never sees", () => {
    let n = 0;
    const draw = () => ({ kind: "simple", display: `${Math.floor(Math.random() * 40)} + 1`, answer: "?", _id: ++n });
    let seen: Recent = [];
    for (let i = 0; i < 300; i++) {
      const q = pickFresh(draw, seen);
      expect(isRepeat(seen, fp(q))).toBe(false);
      seen = remember(seen, fp(q));
    }
  });

  it("gives up after its tries when the pool is smaller than the window, instead of hanging", () => {
    let calls = 0;
    const draw = () => { calls++; return { display: String(calls % 3), answer: "x" }; };
    const seen = [0, 1, 2].reduce<Recent>((s, n) => remember(s, fp({ display: String(n), answer: "x" })), []);
    const q = pickFresh(draw, seen, 10);
    expect(q).toBeDefined();
    expect(calls).toBeLessThanOrEqual(10);
  });
});

describe("makeUniqueQ: a worksheet repeat is decided by content, not by the key", () => {
  const gen = (draw: () => { display: string; key: string }) => makeUniqueQ((() => ({ kind: "simple", answer: "a", ...draw() })) as never) as (...a: never[]) => { display: string; key: string };
  const run = (draw: () => { display: string; key: string }, n: number) => {
    const unique = gen(draw);
    const used = new Set<string>();
    return Array.from({ length: n }, () => (unique as any)("t", "level1", {}, "", used, {}) as { display: string; key: string });
  };
  it("a random id in the key no longer lets the same question through twice", () => {
    let id = 0;
    const qs = run(() => ({ display: `q${Math.floor(Math.random() * 30)}`, key: `k-${++id}` }), 30);
    expect(new Set(qs.map((q) => q.display)).size).toBe(30);
  });
  it("a coarse key that two different questions share does not refuse either; the second is renamed so every cell keeps its own key", () => {
    let i = 0;
    const qs = run(() => ({ display: `q${i++}`, key: "same" }), 4);
    expect(qs.map((q) => q.display)).toEqual(["q0", "q1", "q2", "q3"]);
    expect(new Set(qs.map((q) => q.key)).size).toBe(4);
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
        try { sample = new Set(Array.from({ length: 120 }, () => fingerprintsOf(gen()).join("|"))); } catch { continue; }
        if (sample.size < 80) continue;                       // a small pool cannot always avoid a repeat: not the point of the window
        checked++;
        let seen: Recent = [];
        for (let i = 0; i < 60; i++) {
          const fps = fingerprintsOf(pickFresh(gen, seen));
          if (isRepeat(seen, fps)) { failures.push(`${path.split("/").pop()} ${tool}/${level} (draw ${i})`); break; }
          seen = remember(seen, fps);
        }
      }
    }
    expect(checked, "expected to check many tool levels").toBeGreaterThan(40);
    expect(failures).toEqual([]);
  }, 300_000);
});

// A full worksheet: at default options every tool level can fill a 30-question sheet without showing the same question twice.
// (A level whose pool is smaller than a sheet repeats; widen its pool rather than allow-list it.)
describe("worksheet pools", () => {
  it("every tool level fills a 30-question sheet with different questions", async () => {
    const failures: string[] = [];
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
        const unique = makeUniqueQ(t.generateQuestion);
        const used = new Set<string>();
        const seen = new Set<string>();
        let repeats = 0;
        try {
          for (let i = 0; i < 30; i++) {
            const q = unique(tool, level, vars, dd?.defaultValue ?? "", used, ms);
            const fps = fingerprintsOf(q);
            if (fps.some((f) => seen.has(f))) repeats++;
            fps.forEach((f) => seen.add(f));
          }
        } catch { continue; }
        if (repeats > 1) failures.push(`${path.split("/").pop()} ${tool}/${level}: ${repeats} repeats in 30`);
      }
    }
    expect(failures).toEqual([]);
  }, 300_000);
});

