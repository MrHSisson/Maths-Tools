import { describe, it, expect } from "vitest";
import type { AnyQuestion } from "../shared/types";
import {
  splitIntoSections,
  hasSections,
  getSectionIdx,
  getSectionCols,
  getSectionHeader,
} from "../shared/sections";

// Build a minimal question carrying the section metadata the builder stamps on.
const q = (
  key: string,
  meta?: { sectionIdx?: number; sectionCols?: number; sectionHeader?: string },
): AnyQuestion => {
  const base = {
    kind: "simple" as const,
    display: key,
    answer: "0",
    working: [],
    key,
    difficulty: "level1",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = base as any;
  if (meta?.sectionIdx !== undefined) anyQ._sectionIdx = meta.sectionIdx;
  if (meta?.sectionCols !== undefined) anyQ._sectionCols = meta.sectionCols;
  if (meta?.sectionHeader !== undefined) anyQ._sectionHeader = meta.sectionHeader;
  return base as AnyQuestion;
};

describe("section accessors", () => {
  it("default to no section when untagged", () => {
    const plain = q("a");
    expect(getSectionIdx(plain)).toBe(0);
    expect(getSectionCols(plain)).toBeUndefined();
    expect(getSectionHeader(plain)).toBeUndefined();
  });

  it("read stamped values", () => {
    const tagged = q("a", { sectionIdx: 2, sectionCols: 4, sectionHeader: "Solve" });
    expect(getSectionIdx(tagged)).toBe(2);
    expect(getSectionCols(tagged)).toBe(4);
    expect(getSectionHeader(tagged)).toBe("Solve");
  });
});

describe("hasSections", () => {
  it("is false for an untagged flat worksheet", () => {
    expect(hasSections([q("a"), q("b"), q("c")])).toBe(false);
  });

  it("is false for a single unnamed section 0", () => {
    expect(hasSections([q("a", { sectionIdx: 0 }), q("b", { sectionIdx: 0 })])).toBe(false);
  });

  it("is true when a later section index appears", () => {
    expect(hasSections([q("a", { sectionIdx: 0 }), q("b", { sectionIdx: 1 })])).toBe(true);
  });

  it("is true when section 0 carries a header", () => {
    expect(hasSections([q("a", { sectionIdx: 0, sectionHeader: "Warm up" })])).toBe(true);
  });

  it("is false for an empty worksheet", () => {
    expect(hasSections([])).toBe(false);
  });
});

describe("splitIntoSections", () => {
  it("returns a single section for a flat worksheet, using defaultCols", () => {
    const secs = splitIntoSections([q("a"), q("b"), q("c")], 3);
    expect(secs).toHaveLength(1);
    expect(secs[0].idx).toBe(0);
    expect(secs[0].cols).toBe(3);
    expect(secs[0].header).toBeUndefined();
    expect(secs[0].items.map((it) => it.globalIdx)).toEqual([0, 1, 2]);
    expect(secs[0].items.map((it) => it.q.key)).toEqual(["a", "b", "c"]);
  });

  it("splits on section-index boundaries and preserves global indices", () => {
    const ws = [
      q("a", { sectionIdx: 0, sectionCols: 2, sectionHeader: "First" }),
      q("b", { sectionIdx: 0, sectionCols: 2, sectionHeader: "First" }),
      q("c", { sectionIdx: 1, sectionCols: 4, sectionHeader: "Second" }),
    ];
    const secs = splitIntoSections(ws, 3);
    expect(secs).toHaveLength(2);

    expect(secs[0].idx).toBe(0);
    expect(secs[0].cols).toBe(2);
    expect(secs[0].header).toBe("First");
    expect(secs[0].items.map((it) => it.globalIdx)).toEqual([0, 1]);

    expect(secs[1].idx).toBe(1);
    expect(secs[1].cols).toBe(4);
    expect(secs[1].header).toBe("Second");
    expect(secs[1].items.map((it) => it.globalIdx)).toEqual([2]);
  });

  it("takes columns/header from each section's first question", () => {
    const ws = [
      q("a", { sectionIdx: 1, sectionCols: 2, sectionHeader: "Heading" }),
      // trailing items in the same section carry the same stamp in practice;
      // the splitter must read from the first item regardless.
      q("b", { sectionIdx: 1 }),
    ];
    const secs = splitIntoSections(ws, 3);
    expect(secs).toHaveLength(1);
    expect(secs[0].cols).toBe(2);
    expect(secs[0].header).toBe("Heading");
  });

  it("falls back to defaultCols when a section has no explicit columns", () => {
    const secs = splitIntoSections([q("a", { sectionIdx: 1 })], 3);
    expect(secs[0].cols).toBe(3);
  });

  it("does not merge non-adjacent runs that share a section index", () => {
    // Defensive: section indices are expected to be contiguous, but a stray
    // re-appearance must start a fresh run rather than fold back in.
    const ws = [
      q("a", { sectionIdx: 0 }),
      q("b", { sectionIdx: 1 }),
      q("c", { sectionIdx: 0 }),
    ];
    const secs = splitIntoSections(ws, 3);
    expect(secs.map((s) => s.idx)).toEqual([0, 1, 0]);
    expect(secs.map((s) => s.items.length)).toEqual([1, 1, 1]);
  });

  it("returns no sections for an empty worksheet", () => {
    expect(splitIntoSections([], 3)).toEqual([]);
  });
});
