// Worksheet page-fill engine — the pure, testable core of PDF pagination.
//
// This used to live as an inline <script> string inside the print popup, where
// it could not be imported or unit-tested. It is a *pure* function: given the
// measured question heights (in px) plus page geometry and section metadata, it
// returns the full layout plan — chosen cell heights, rows per page, per-section
// heights, and the grouping of question indices into pages.
//
// Measurement stays in the popup (the only place heights can be measured against
// the real print surface). The popup calls this engine via window.opener after
// measuring, so the same compiled, vitest-tested code drives both tests and
// print. See print.ts for the bridge.

export interface WorksheetLayoutInput {
  isList: boolean;
  isDiff: boolean;
  hasSections: boolean;
  cols: number;
  totalQ: number;
  /** Measured probe height per question, in px (parallel to the section arrays). */
  heightsPx: number[];
  sectionIdx: number[];
  sectionCols: number[];
  itemHasHeader: boolean[];
  /** Page geometry, all in mm. */
  usableH: number;
  GAP_MM: number;
  PAD_MM: number;
  DIV_MM: number;
  HDR_MM: number;
  diffHdrMM: number;
  pxPerMm: number;
}

export interface WorksheetLayoutPlan {
  needed_mm: number;
  chosenH_mm: number;
  rowsPerPage: number;
  /** Per-section cell height (mm), keyed by section index. */
  sectionCellH: Record<number, number>;
  diffPerCol: number;
  diffRowsPerPage: number;
  diffCellH_mm: number;
  numDiffPages: number;
  listItemsPerCol: number;
  /** Page groupings as arrays of question indices. For the list layout, a value
   *  of -1 marks a section-divider spacer slot. Not populated for the
   *  differentiated layout (which paginates via numDiffPages). */
  pages: number[][];
}

const range = (a: number, b: number): number[] => {
  const out: number[] = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
};

export function computeWorksheetLayout(input: WorksheetLayoutInput): WorksheetLayoutPlan {
  const {
    isList, isDiff, hasSections, cols, totalQ,
    heightsPx, sectionIdx, sectionCols, itemHasHeader,
    usableH, GAP_MM, PAD_MM, DIV_MM, HDR_MM, diffHdrMM, pxPerMm,
  } = input;

  const probeHts = heightsPx;
  const n = probeHts.length;

  // Row heights: the height each row gets if a page is divided into r rows.
  const rowHeights: number[] = [];
  for (let r = 1; r <= 10; r++) rowHeights.push((usableH - GAP_MM * (r - 1)) / r);

  // Per-question / per-section needed heights.
  const secMaxProbeH: Record<number, number> = {};
  for (let i = 0; i < n; i++) {
    const psi = sectionIdx[i];
    const hMm = probeHts[i] / pxPerMm;
    if (secMaxProbeH[psi] === undefined || hMm > secMaxProbeH[psi]) secMaxProbeH[psi] = hMm;
  }
  const secNeeded: Record<number, number> = {};
  for (const sn in secMaxProbeH) {
    secNeeded[sn] = isList ? secMaxProbeH[sn] + 2 : secMaxProbeH[sn] + PAD_MM * 2 + 6;
  }
  const maxH_px = Math.max.apply(null, probeHts.length > 0 ? probeHts : [0]);
  const maxH_mm = maxH_px / pxPerMm;
  const needed_mm = isList ? maxH_mm + 2 : maxH_mm + PAD_MM * 2 + 6;

  // Differentiated layout.
  const diffPerCol = Math.floor(totalQ / 3);
  const diffUsableH = usableH - diffHdrMM - GAP_MM;
  let diffRowsPerPage = 1;
  let diffCellH_mm = diffUsableH;
  for (let rd = 0; rd < diffPerCol; rd++) {
    const rows2 = rd + 1;
    const h = (diffUsableH - GAP_MM * rd) / rows2;
    const dNeeded = needed_mm - diffHdrMM / rows2;
    if (h >= dNeeded) { diffRowsPerPage = rows2; diffCellH_mm = h; }
  }

  // Grid layout: cell heights (per-section when sectioned).
  let chosenH_mm = rowHeights[0];
  let rowsPerPage = 1;
  const sectionCellH: Record<number, number> = {};
  const sectionMinH: Record<number, number> = {};

  if (hasSections && !isDiff && !isList) {
    interface SecInfo { idx: number; count: number; cols: number; rows: number; needed: number; hasHeader: boolean; }
    const secInfo: SecInfo[] = [];
    let prevSI = -1, secIC = 0, secCV = cols, secHdr = false;
    for (let qi2 = 0; qi2 < n; qi2++) {
      if (sectionIdx[qi2] !== prevSI) {
        if (prevSI >= 0) secInfo.push({ idx: prevSI, count: secIC, cols: secCV, rows: Math.ceil(secIC / secCV), needed: secNeeded[prevSI] ?? needed_mm, hasHeader: secHdr });
        prevSI = sectionIdx[qi2]; secIC = 0; secCV = sectionCols[qi2]; secHdr = itemHasHeader[qi2];
      }
      secIC++;
    }
    if (prevSI >= 0) secInfo.push({ idx: prevSI, count: secIC, cols: secCV, rows: Math.ceil(secIC / secCV), needed: secNeeded[prevSI] ?? needed_mm, hasHeader: secHdr });

    let totalMinH = 0, totalSecRows = 0;
    for (let si2 = 0; si2 < secInfo.length; si2++) {
      const sec = secInfo[si2];
      totalMinH += sec.rows * sec.needed + (sec.rows - 1) * GAP_MM;
      if (si2 > 0) totalMinH += DIV_MM;
      if (sec.hasHeader) totalMinH += HDR_MM;
      totalSecRows += sec.rows;
    }
    for (let si4 = 0; si4 < secInfo.length; si4++) {
      sectionMinH[secInfo[si4].idx] = secInfo[si4].needed;
      sectionCellH[secInfo[si4].idx] = secInfo[si4].needed;
    }
    if (totalMinH <= usableH) {
      // Fits on one page — distribute remaining space proportionally by row count.
      const extraH = usableH - totalMinH;
      for (let si3 = 0; si3 < secInfo.length; si3++) {
        const sec2 = secInfo[si3];
        const share = totalSecRows > 0 ? extraH * (sec2.rows / totalSecRows) / sec2.rows : 0;
        sectionCellH[sec2.idx] = sec2.needed + share;
      }
      rowsPerPage = totalSecRows;
    } else {
      for (let r3 = 0; r3 < rowHeights.length; r3++) {
        if (rowHeights[r3] >= needed_mm) { chosenH_mm = rowHeights[r3]; rowsPerPage = r3 + 1; }
      }
    }
  } else {
    let found = false;
    for (let r = 0; r < rowHeights.length; r++) {
      const capacity = (r + 1) * cols;
      if (capacity >= totalQ && rowHeights[r] >= needed_mm) { chosenH_mm = rowHeights[r]; rowsPerPage = r + 1; found = true; break; }
    }
    if (!found) {
      for (let r2 = 0; r2 < rowHeights.length; r2++) {
        if (rowHeights[r2] >= needed_mm) { chosenH_mm = rowHeights[r2]; rowsPerPage = r2 + 1; }
      }
    }
  }

  // List layout: items per column.
  const listItemH_mm = needed_mm;
  const listItemsPerCol = Math.max(1, Math.floor(usableH / listItemH_mm));

  // Pagination → page groupings of question indices.
  let pages: number[][] = [];
  if (isList) {
    const listItems: number[] = [];
    for (let li = 0; li < n; li++) {
      if (hasSections && li > 0 && sectionIdx[li] !== sectionIdx[li - 1]) listItems.push(-1);
      listItems.push(li);
    }
    const itemsPerPage = listItemsPerCol * cols;
    for (let lp = 0; lp < listItems.length; lp += itemsPerPage) pages.push(listItems.slice(lp, lp + itemsPerPage));
    if (pages.length === 0) pages.push([]);
  } else if (isDiff) {
    pages = []; // differentiated layout paginates via numDiffPages
  } else if (hasSections) {
    // Height-budget pagination accounting for dividers and section headers.
    const gridPages: number[][] = [];
    let curPage: number[] = [];
    let usedH = 0;
    let prevSection = n > 0 ? sectionIdx[0] : 0;
    let secColsInPage = 0;
    const hdrMM = HDR_MM;
    if (n > 0 && itemHasHeader[0]) usedH += hdrMM;
    for (let qi = 0; qi < n; qi++) {
      const curSecH = sectionMinH[sectionIdx[qi]] ?? chosenH_mm;
      const curSecCols = sectionCols[qi];
      const needsDivider = qi > 0 && sectionIdx[qi] !== prevSection;
      if (needsDivider) {
        if (secColsInPage > 0) { const prevH = sectionMinH[prevSection] ?? chosenH_mm; usedH += prevH + GAP_MM; secColsInPage = 0; }
        const divCost = DIV_MM + (itemHasHeader[qi] ? hdrMM : 0);
        if (usedH + divCost + curSecH > usableH && curPage.length > 0) {
          gridPages.push(curPage); curPage = []; usedH = itemHasHeader[qi] ? hdrMM : 0;
        } else { usedH += divCost; }
        prevSection = sectionIdx[qi];
      }
      curPage.push(qi);
      secColsInPage++;
      if (secColsInPage >= curSecCols) {
        usedH += curSecH + GAP_MM;
        secColsInPage = 0;
        if (qi + 1 < n) {
          const nxtDiv = sectionIdx[qi + 1] !== sectionIdx[qi];
          const nxtH = sectionMinH[sectionIdx[qi + 1]] ?? chosenH_mm;
          const nxtHdr = nxtDiv && itemHasHeader[qi + 1] ? hdrMM : 0;
          const nxtNeed = (nxtDiv ? DIV_MM : 0) + nxtHdr + nxtH;
          if (usedH + nxtNeed > usableH) { gridPages.push(curPage); curPage = []; usedH = 0; prevSection = sectionIdx[qi + 1]; }
        }
      }
    }
    if (curPage.length > 0) gridPages.push(curPage);
    pages = gridPages;
  } else {
    const pageCapacity = rowsPerPage * cols;
    for (let s = 0; s < n; s += pageCapacity) pages.push(range(s, Math.min(s + pageCapacity, n)));
  }

  const numDiffPages = Math.ceil(diffPerCol / diffRowsPerPage);

  return {
    needed_mm, chosenH_mm, rowsPerPage, sectionCellH,
    diffPerCol, diffRowsPerPage, diffCellH_mm, numDiffPages,
    listItemsPerCol, pages,
  };
}
