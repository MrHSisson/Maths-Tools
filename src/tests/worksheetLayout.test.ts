import { describe, it, expect } from "vitest";
import { computeWorksheetLayout, type WorksheetLayoutInput } from "../shared/worksheetLayout";

// Base input with neutral geometry. pxPerMm=1 so "px" heights read straight as
// mm, and GAP_MM=0 so rowHeights[r-1] == usableH / r — keeps expectations exact.
const base = (over: Partial<WorksheetLayoutInput>): WorksheetLayoutInput => ({
  isList: false,
  isDiff: false,
  hasSections: false,
  cols: 2,
  totalQ: 4,
  heightsPx: [90, 90, 90, 90],
  sectionIdx: [0, 0, 0, 0],
  sectionCols: [2, 2, 2, 2],
  itemHasHeader: [false, false, false, false],
  usableH: 300,
  GAP_MM: 0,
  PAD_MM: 2,
  DIV_MM: 4,
  HDR_MM: 6,
  diffHdrMM: 7,
  pxPerMm: 1,
  ...over,
});

describe("computeWorksheetLayout — non-section grid", () => {
  it("picks rows-per-page so cells fill the page and meet the needed height", () => {
    // needed_mm = 90 + PAD*2 + 6 = 100. rowHeights: r1=300, r2=150, r3=100…
    // Smallest r with capacity r*cols >= 4 and rowHeights >= 100 is r=2 (150).
    const plan = computeWorksheetLayout(base({}));
    expect(plan.needed_mm).toBe(100);
    expect(plan.rowsPerPage).toBe(2);
    expect(plan.chosenH_mm).toBe(150);
    expect(plan.pages).toEqual([[0, 1, 2, 3]]);
  });

  it("splits into multiple pages when capacity is exceeded", () => {
    // 8 questions, 2 cols. No (rows×cols ≥ 8) fits at the needed height, so it
    // falls back to the tallest rows-per-page that meets needed: 3 rows × 100mm
    // fill the 300mm page → pageCapacity 6 → pages of 6 then 2.
    const plan = computeWorksheetLayout(base({
      totalQ: 8,
      heightsPx: Array(8).fill(90),
      sectionIdx: Array(8).fill(0),
      sectionCols: Array(8).fill(2),
      itemHasHeader: Array(8).fill(false),
    }));
    expect(plan.rowsPerPage).toBe(3);
    expect(plan.pages).toEqual([[0, 1, 2, 3, 4, 5], [6, 7]]);
  });
});

describe("computeWorksheetLayout — list", () => {
  it("computes items per column and flows into pages", () => {
    // needed (list) = 48 + 2 = 50. listItemsPerCol = floor(300/50) = 6.
    const plan = computeWorksheetLayout(base({
      isList: true,
      totalQ: 5,
      heightsPx: [48, 48, 48, 48, 48],
      sectionIdx: [0, 0, 0, 0, 0],
      sectionCols: [2, 2, 2, 2, 2],
      itemHasHeader: [false, false, false, false, false],
    }));
    expect(plan.listItemsPerCol).toBe(6);
    expect(plan.pages).toEqual([[0, 1, 2, 3, 4]]);
  });
});

describe("computeWorksheetLayout — differentiated", () => {
  it("derives per-column rows and page count", () => {
    // 9 questions → diffPerCol 3. needed small (50) so all 3 rows fit in one page.
    const plan = computeWorksheetLayout(base({
      isDiff: true,
      totalQ: 9,
      heightsPx: Array(9).fill(40),
      sectionIdx: Array(9).fill(0),
      sectionCols: Array(9).fill(2),
      itemHasHeader: Array(9).fill(false),
    }));
    expect(plan.diffPerCol).toBe(3);
    expect(plan.diffRowsPerPage).toBe(3);
    expect(plan.numDiffPages).toBe(1);
    expect(plan.pages).toEqual([]); // diff paginates via numDiffPages
  });
});

describe("computeWorksheetLayout — sections", () => {
  it("distributes spare height across sections when everything fits on one page", () => {
    // Two 2-question sections at 2 cols → 1 row each. needed=100.
    // totalMinH = 100 + 100 + DIV(4) = 204 ≤ 300 → extra 96 split by rows (1:1)
    // → +48 each → sectionCellH 148.
    const plan = computeWorksheetLayout(base({
      hasSections: true,
      cols: 2,
      totalQ: 4,
      sectionIdx: [0, 0, 1, 1],
      sectionCols: [2, 2, 2, 2],
    }));
    expect(plan.rowsPerPage).toBe(2);
    expect(plan.sectionCellH[0]).toBeCloseTo(148, 5);
    expect(plan.sectionCellH[1]).toBeCloseTo(148, 5);
    expect(plan.pages).toEqual([[0, 1, 2, 3]]);
  });

  it("exposes per-section natural heights for diagram rendering", () => {
    const plan = computeWorksheetLayout(base({
      hasSections: true,
      cols: 2,
      totalQ: 4,
      sectionIdx: [0, 0, 1, 1],
      sectionCols: [2, 2, 2, 2],
    }));
    // sectionMinH is the un-inflated needed height (90 + PAD*2 + 6 = 100),
    // distinct from the page-filling sectionCellH (148 here).
    expect(plan.sectionMinH[0]).toBeCloseTo(100, 5);
    expect(plan.sectionMinH[1]).toBeCloseTo(100, 5);
    expect(plan.sectionCellH[0]).toBeCloseTo(148, 5);
  });

  it("paginates a tall single section across pages", () => {
    // One headed section, 3 questions at 1 col, needed=100, usableH=100 → one
    // question per page.
    const plan = computeWorksheetLayout(base({
      hasSections: true,
      cols: 1,
      totalQ: 3,
      heightsPx: [90, 90, 90],
      sectionIdx: [0, 0, 0],
      sectionCols: [1, 1, 1],
      itemHasHeader: [true, true, true],
      usableH: 100,
      HDR_MM: 0,
    }));
    expect(plan.pages).toEqual([[0], [1], [2]]);
  });
});

describe("computeWorksheetLayout — diagram model (density floor)", () => {
  // Mirrors handleDiagramPrint: a square diagram's synthetic height is its column
  // width capped at the density floor (40 mm) so worksheets stay dense. Real
  // print geometry, pxPerMm=1 so px reads as mm.
  const PAGE_W = 186, GAP = 2, FLOOR = 40;
  const colW = (c: number) => (PAGE_W - GAP * (c - 1)) / c;
  const diagram = (cols: number, totalQ: number, sectionIdx?: number[], sectionCols?: number[]) =>
    computeWorksheetLayout({
      isList: false, isDiff: false, hasSections: !!sectionIdx, cols, totalQ,
      heightsPx: Array.from({ length: totalQ }, (_, i) =>
        Math.min(colW((sectionCols ?? Array(totalQ).fill(cols))[i]), FLOOR)),
      sectionIdx: sectionIdx ?? Array(totalQ).fill(0),
      sectionCols: sectionCols ?? Array(totalQ).fill(cols),
      itemHasHeader: (sectionIdx ?? Array(totalQ).fill(0)).map((s, i, a) => i === 0 || s !== a[i - 1]),
      usableH: 259, GAP_MM: GAP, PAD_MM: 2, DIV_MM: 4, HDR_MM: 6, diffHdrMM: 7, pxPerMm: 1,
    });

  it("density floor keeps the per-row height capped at 40 + chrome", () => {
    // colW(3) ≈ 60.7, but the fed height is capped at 40 → needed = 50.
    expect(diagram(3, 15).needed_mm).toBeCloseTo(50, 5);
  });

  it("15 diagrams fit one page at 3 columns (old density preserved)", () => {
    expect(diagram(3, 15).pages.length).toBe(1);
  });

  it("two sections of six fit one page at 3 columns", () => {
    const secIdx = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
    const secCols = Array(12).fill(3);
    expect(diagram(3, 12, secIdx, secCols).pages.length).toBe(1);
  });

  it("more columns pack more per page", () => {
    expect(diagram(4, 20).pages.length).toBe(1); // 5 rows × 4 cols
  });
});
