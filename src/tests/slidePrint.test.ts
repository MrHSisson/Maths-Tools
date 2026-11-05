import { describe, it, expect } from "vitest";
import { PER_PAGE, PRINT_LAYOUTS, PAGE_GAP_MM, cellSize, keyPointSlides, pagesOf, repeatSlides, cutLines } from "../decks/slidePrint";
import type { Slide } from "../decks/types";

describe("printing slides to stick in", () => {
  it("every choice fits the A4 page, with the slides in the grid asked for (8 is two columns by four rows)", () => {
    expect(PRINT_LAYOUTS[8]).toMatchObject({ cols: 2, rows: 4, landscape: false });
    for (const per of PER_PAGE) {
      const l = PRINT_LAYOUTS[per], c = cellSize(per);
      expect(l.cols * l.rows).toBe(per);
      expect(l.cols * c.wMm + (l.cols - 1) * PAGE_GAP_MM).toBeLessThanOrEqual(c.usableW + 0.01);
      expect(l.rows * c.hMm + (l.rows - 1) * PAGE_GAP_MM).toBeLessThanOrEqual(c.usableH + 0.01);
      expect(c.wMm / c.hMm).toBeCloseTo(16 / 9, 5);
    }
  });
  it("two to a page sit centred in equal halves, with the cut line exactly between them", () => {
    const c = cellSize(2);
    expect(c.slotHMm * 2).toBeCloseTo(c.usableH, 5);
    expect(cutLines(2, 2)).toEqual([{ x1: 0, y1: c.slotHMm, x2: c.slotWMm, y2: c.slotHMm }]);
    expect(cutLines(2, 1)).toEqual([]);
    expect(cutLines(8, 8)).toHaveLength(3 + 1);
  });
  it("repeats each slide in a row", () => {
    expect(repeatSlides(["a", "b"], 2)).toEqual(["a", "a", "b", "b"]);
    expect(repeatSlides(["a"], 0)).toEqual(["a"]);
  });
  it("splits slides into pages and picks the key-point kinds", () => {
    expect(pagesOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    const s = (family: Slide["family"]) => ({ family }) as Slide;
    expect(keyPointSlides({ slides: [s("structure"), s("teach"), s("practice"), s("language")] })).toEqual([1, 3]);
  });
});
