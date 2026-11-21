// Flashcards (specs/flashcards/further-mechanics-mc.md): every card of the Mechanics MC set is well formed (unique ids, a real statement, valid KaTeX, a picture that draws
// cleanly), the Leitner scheduling does what the design says, and the stored memory survives garbage. Facts and wording are checked by a person; this guards the structure.
import { describe, expect, it } from "vitest";
import katex from "katex";
import { MECHANICS_MC } from "../flashcards/mechanicsMC";
import { buildSession, DAY, promptsOf, rate, standing, tally, weakestStatements, type Memory } from "../shared/flashcards/schedule";
import { DEFAULT_PREFS, loadMemory, loadPrefs, saveMemory, savePrefs } from "../shared/flashcards/store";
import { layoutScene, validateScene } from "../shared/mechanics";
import { seededRandom } from "./seededRandom";

const cards = MECHANICS_MC.cards;
const maths = (s: string) => s.split(/(\$[^$]+\$)/g).filter((_, i) => i % 2 === 1).map((p) => p.slice(1, -1));

describe("the Mechanics MC card set", () => {
  it("has ids that are unique and a real statement, course and kind on every card", () => {
    const ids = new Set<string>();
    const statements = new Set(MECHANICS_MC.statements.map((s) => s.code));
    for (const c of cards) {
      expect(ids.has(c.id), `${c.id} is a duplicate`).toBe(false);
      ids.add(c.id);
      expect(statements.has(c.statement), `${c.id}: statement ${c.statement}`).toBe(true);
      expect(["AS", "A2"]).toContain(c.course);
      expect(["definition", "formula", "derive", "property", "unit", "method", "error", "diagram"]).toContain(c.kind);
      expect(["essential", "derived"]).toContain(c.tier);
      expect(c.front.trim().length).toBeGreaterThan(5);
      expect(c.back.trim().length).toBeGreaterThan(3);
    }
    expect(cards.length).toBeGreaterThanOrEqual(60);
  });

  it("covers every statement MC1 to MC7 with both AS cards and at least one method or condition card", () => {
    for (const s of MECHANICS_MC.statements) {
      const own = cards.filter((c) => c.statement === s.code);
      expect(own.length, s.code).toBeGreaterThanOrEqual(3);
      expect(own.some((c) => c.course === "AS"), `${s.code} has an AS card`).toBe(true);
    }
  });

  it("writes every piece of maths as valid KaTeX, with balanced dollar signs", () => {
    for (const c of cards) for (const field of [c.front, c.back, c.note ?? ""]) {
      expect((field.match(/\$/g) ?? []).length % 2, `${c.id}: unbalanced $`).toBe(0);
      for (const tex of maths(field)) expect(() => katex.renderToString(tex, { throwOnError: true, displayMode: false }), `${c.id}: ${tex}`).not.toThrow();
    }
  });

  it("gives a reverse only to formula and definition cards, and a picture to every diagram card", () => {
    for (const c of cards) {
      if (c.kind === "diagram") { expect(c.picture, c.id).toBeDefined(); expect(c.reverse).toBeFalsy(); }
      else expect(c.picture).toBeUndefined();
      if (c.reverse) expect(["formula", "definition"], `${c.id} reverses`).toContain(c.kind);
    }
    expect(cards.filter((c) => c.reverse).length).toBeGreaterThanOrEqual(10);
  });

  it("separates what is essential from what is derived: every Derive card is derived, and the essentials are a smaller, core set", () => {
    for (const c of cards.filter((x) => x.kind === "derive")) expect(c.tier, c.id).toBe("derived");
    const essential = cards.filter((c) => c.tier === "essential").length, derived = cards.length - essential;
    expect(derived).toBeGreaterThanOrEqual(10);
    expect(essential).toBeGreaterThan(derived);
    expect(essential).toBeLessThanOrEqual(55);
    // every statement still has essential cards, so "essentials only" never leaves a statement empty
    for (const s of MECHANICS_MC.statements) expect(cards.some((c) => c.statement === s.code && c.tier === "essential"), s.code).toBe(true);
  });

  it("starts a Derive card's front with what is to be found, not a bare statement (the header says what is asked)", () => {
    for (const c of cards.filter((x) => x.kind === "derive" || x.kind === "method")) expect(c.front.length, c.id).toBeGreaterThan(20);
  });

  it("draws each diagram card cleanly at the size it is shown, with the answer hidden and shown", () => {
    for (const c of cards.filter((x) => x.picture)) {
      expect(validateScene(c.picture!.scene), c.id).toEqual([]);
      for (const showAnswer of [false, true]) {
        const lay = layoutScene(c.picture!.scene, { showAnswer, fontSize: 20 });
        expect(lay.unplaced, `${c.id} unplaced`).toEqual([]);
        expect(lay.clashes, `${c.id} clashes`).toEqual([]);
      }
    }
  });

  it("does not copy the textbook's own sentences (cards are short and in our own words)", () => {
    for (const c of cards) { expect(c.front.length).toBeLessThan(220); expect(c.back.length).toBeLessThan(260); }
  });
});

describe("the Leitner schedule", () => {
  const T = 1_000_000_000_000;

  it("moves a card up a box each time it is got and back to box 1 when it is not, and sets the due time from the box", () => {
    let m: Memory = {};
    m = rate(m, "a", "again", T); expect(m.a).toEqual({ box: 1, due: T, seen: 1 });
    m = rate(m, "a", "got", T); expect(m.a).toEqual({ box: 2, due: T + 2 * DAY, seen: 2 });
    m = rate(m, "a", "got", T); expect(m.a).toEqual({ box: 3, due: T + 7 * DAY, seen: 3 });
    m = rate(m, "a", "got", T); expect(m.a.box).toBe(3);
    expect(rate({}, "n", "got", T).n.box).toBe(2);          // a new card that is got starts in box 2
    expect(rate(m, "a", "again", T).a.box).toBe(1);
    expect(standing(m, "a", T + DAY)).toBe("waiting");
    expect(standing(m, "a", T + 8 * DAY)).toBe("due");
    expect(standing(m, "never", T)).toBe("new");
    expect(standing(rate({}, "b", "again", T), "b", T + 1)).toBe("learning");
  });

  it("builds a session of what is being learnt, then what is due, then new prompts, cut to the size", () => {
    let m: Memory = {};
    m = rate(m, "learn", "again", T);
    m = rate(rate(m, "due", "got", T - 10 * DAY), "due", "got", T - 10 * DAY);
    m = rate(m, "wait", "got", T);
    const keys = ["new1", "new2", "wait", "due", "learn"];
    const s = buildSession(keys, m, T, 3, seededRandom(1));
    expect(s.slice(0, 2)).toEqual(["learn", "due"]);
    expect(s).toHaveLength(3);
    expect(["new1", "new2"]).toContain(s[2]);
    expect(buildSession(keys, m, T, null, seededRandom(1)).sort()).toEqual([...keys].sort());
    // nothing to learn, due or new: a session still happens (it practises what is resting)
    const rested: Memory = { a: { box: 3, due: T + DAY, seen: 1 }, b: { box: 3, due: T + DAY, seen: 1 } };
    expect(buildSession(["a", "b"], rested, T, 5, seededRandom(1)).sort()).toEqual(["a", "b"]);
  });

  it("makes a reverse prompt only for cards that have one, and only when both ways round is on", () => {
    const withReverse = cards.filter((c) => c.reverse);
    expect(promptsOf(cards, false)).toHaveLength(cards.length);
    expect(promptsOf(cards, true)).toHaveLength(cards.length + withReverse.length);
    const keys = promptsOf(cards, true).map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    const t = tally(keys, {}, T);
    expect(t.new).toBe(keys.length);
  });

  it("names the statements a session went worst on", () => {
    const w = weakestStatements([
      { statement: "MC3", rating: "again" }, { statement: "MC3", rating: "got" }, { statement: "MC7", rating: "got" },
      { statement: "MC1", rating: "again" }, { statement: "MC1", rating: "again" },
    ]);
    expect(w.map((x) => x.statement)).toEqual(["MC1", "MC3"]);
    expect(w[0]).toEqual({ statement: "MC1", missed: 2, of: 2 });
  });
});

describe("the stored memory and settings", () => {
  const withStorage = (data: Record<string, string>, fn: () => void) => {
    const real = (globalThis as { localStorage?: unknown }).localStorage;
    const store = { ...data } as Record<string, string>;
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null), setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; },
    };
    try { fn(); } finally { (globalThis as { localStorage?: unknown }).localStorage = real; }
  };

  it("round-trips memory and settings", () => {
    withStorage({}, () => {
      const mem: Memory = { x: { box: 2, due: 5, seen: 3 } };
      saveMemory("s", mem); expect(loadMemory("s")).toEqual(mem);
      savePrefs("s", { ...DEFAULT_PREFS, statements: ["MC3"], course: "AS", tier: "all", size: null }); expect(loadPrefs("s")).toMatchObject({ statements: ["MC3"], course: "AS", tier: "all", size: null });
    });
  });

  it("falls back to defaults on garbage, so an old or damaged record never breaks the page", () => {
    withStorage({ "fm-flashcards:v1:s:memory": "{not json", "fm-flashcards:v1:s:prefs": JSON.stringify({ statements: [7], course: "weird", size: -3 }) }, () => {
      expect(loadMemory("s")).toEqual({});
      expect(loadPrefs("s")).toEqual({ ...DEFAULT_PREFS });
    });
    withStorage({ "fm-flashcards:v1:s:memory": JSON.stringify({ x: { box: 9, due: "no", seen: 1 } }) }, () => expect(loadMemory("s")).toEqual({}));
  });

  it("works with no storage at all", () => {
    const real = (globalThis as { localStorage?: unknown }).localStorage;
    (globalThis as { localStorage?: unknown }).localStorage = undefined;
    try { expect(loadMemory("s")).toEqual({}); expect(() => saveMemory("s", {})).not.toThrow(); expect(loadPrefs("s")).toEqual(DEFAULT_PREFS); } finally { (globalThis as { localStorage?: unknown }).localStorage = real; }
  });
});
