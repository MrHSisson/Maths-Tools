import { describe, it, expect } from "vitest";
import { PER_PAGE, PRINT_LAYOUTS, PAGE_GAP_MM, cellSize, keyPointSlides, pagesOf } from "../decks/slidePrint";
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
  it("splits slides into pages and picks the key-point kinds", () => {
    expect(pagesOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    const s = (family: Slide["family"]) => ({ family }) as Slide;
    expect(keyPointSlides({ slides: [s("structure"), s("teach"), s("practice"), s("language")] })).toEqual([1, 3]);
  });
});
