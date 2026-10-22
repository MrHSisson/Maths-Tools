import { describe, it, expect } from "vitest";
import katex from "katex";
import {
  ALL_WORDS, CONFLICTS, PACKS, BOARD_SIZE, buildBoard, maxBoardSize, swapWord, mulberry32, pickClueIndex, checkClaim,
  type ClueKind, type PackId,
} from "../tools/Interactive/WordsBingoData";

const KINDS: ClueKind[] = ["def", "sym", "pic"];
const PACK_IDS = PACKS.map(p => p.id) as PackId[];

describe("Maths Words Bingo data", () => {
  it("has unique ids and at least one clue per word", () => {
    expect(new Set(ALL_WORDS.map(w => w.id)).size).toBe(ALL_WORDS.length);
    ALL_WORDS.forEach(w => expect(w.clues.length, w.id).toBeGreaterThan(0));
  });
  it("renders every symbol clue as KaTeX", () => {
    ALL_WORDS.forEach(w => w.clues.forEach(c => {
      if (c.k === "sym") expect(() => katex.renderToString(c.s, { throwOnError: true }), w.id).not.toThrow();
    }));
  });
  it("never gives the word away in its own definition", () => {
    ALL_WORDS.forEach(w => w.clues.forEach(c => {
      if (c.k === "def") expect(new RegExp(`\\b${w.word.toLowerCase()}\\b`).test(c.s.toLowerCase()), w.id).toBe(false);
    }));
  });
  it("never reuses a clue between two words", () => {
    const seen = new Map<string, string>();
    ALL_WORDS.forEach(w => w.clues.forEach(c => {
      const key = JSON.stringify(c);
      expect(seen.get(key), `${w.id} repeats a clue of ${seen.get(key)}`).toBeUndefined();
      seen.set(key, w.id);
    }));
  });
  it("conflict groups name real words, each word in at most one group", () => {
    const ids = new Set(ALL_WORDS.map(w => w.id));
    const count = new Map<string, number>();
    CONFLICTS.flat().forEach(id => { expect(ids.has(id), id).toBe(true); count.set(id, (count.get(id) ?? 0) + 1); });
    count.forEach((n, id) => expect(n, id).toBe(1));
  });
  it("every pack alone can fill a board with all clue types", () => {
    PACK_IDS.forEach(p => expect(maxBoardSize([p], KINDS), p).toBeGreaterThanOrEqual(BOARD_SIZE));
  });
});

describe("Maths Words Bingo boards", () => {
  it("builds 25 distinct, conflict-free words from any single pack", () => {
    PACK_IDS.forEach(p => {
      for (let s = 1; s <= 30; s++) {
        const b = buildBoard([p], KINDS, mulberry32(s))!;
        expect(b.length).toBe(BOARD_SIZE);
        expect(new Set(b.map(w => w.id)).size).toBe(BOARD_SIZE);
        CONFLICTS.forEach(g => expect(g.filter(id => b.some(w => w.id === id)).length).toBeLessThanOrEqual(1));
      }
    });
  });
  it("is repeatable from a seed and mixes packs evenly", () => {
    const a = buildBoard(PACK_IDS, KINDS, mulberry32(7))!.map(w => w.id);
    const b = buildBoard(PACK_IDS, KINDS, mulberry32(7))!.map(w => w.id);
    expect(a).toEqual(b);
    const perPack = PACK_IDS.map(p => a.filter(id => id.startsWith(p)).length);
    expect(Math.max(...perPack) - Math.min(...perPack)).toBeLessThanOrEqual(2);
  });
  it("only uses enabled clue kinds", () => {
    const b = buildBoard(PACK_IDS, ["pic"], mulberry32(3))!;
    b.forEach(w => expect(w.clues.some(c => c.k === "pic")).toBe(true));
    expect(buildBoard(["measures"], ["pic"], mulberry32(3))).toBeNull();
  });
  it("prefers unseen clues, so a recycled round shows something new", () => {
    const w = ALL_WORDS.find(x => x.id === "fractions-1-3")!;
    const used: Record<string, number[]> = {};
    const seen = new Set<number>();
    for (let i = 0; i < w.clues.length; i++) {
      const idx = pickClueIndex(w, KINDS, used, mulberry32(i + 1));
      expect(seen.has(idx)).toBe(false);
      seen.add(idx); used[w.id] = [...(used[w.id] ?? []), idx];
    }
  });
  it("swaps a word for a fresh, non-conflicting one and never returns a cycled-out word", () => {
    const board = buildBoard(PACK_IDS, KINDS, mulberry32(11))!;
    const cycled = new Set<string>();
    let b = board;
    for (let i = 0; i < 20; i++) {
      const out = b[0].id;
      const w = swapWord(b, out, PACK_IDS, KINDS, cycled, mulberry32(i + 5))!;
      expect(w).not.toBeNull();
      expect(cycled.has(w.id)).toBe(false);
      cycled.add(out);
      b = [w, ...b.slice(1)];
      expect(new Set(b.map(x => x.id)).size).toBe(BOARD_SIZE);
      CONFLICTS.forEach(g => expect(g.filter(id => b.some(x => x.id === id)).length).toBeLessThanOrEqual(1));
    }
  });
  it("checks a claim against the words called", () => {
    const called = new Set(["a", "b", "c"]);
    expect(checkClaim(["a", "b", "c"], called).ok).toBe(true);
    expect(checkClaim(["a", "d"], called)).toEqual({ ok: false, missing: ["d"] });
  });
});
