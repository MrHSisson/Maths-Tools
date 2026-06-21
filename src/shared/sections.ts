// Worksheet section helpers — the single source of truth for the section model.
//
// The worksheet builder produces a FLAT `AnyQuestion[]` and tags each question
// with private underscore fields describing which section it belongs to:
//   _sectionIdx    — section number (0, 1, 2 …)
//   _sectionCols   — how many columns that section renders in
//   _sectionHeader — optional heading text for the section
//
// Any consumer that wants to draw dividers, headers, or per-section columns must
// reconstruct the contiguous section runs from those tags. That reconstruction
// used to be hand-rolled in every preview/print path and drifted between copies;
// `splitIntoSections` / `hasSections` centralise it so there is one tested
// implementation.

import type { AnyQuestion } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WorksheetSectionItem {
  q: AnyQuestion;
  /** Index of this question in the original flat worksheet array. */
  globalIdx: number;
}

export interface WorksheetSection {
  idx: number;
  cols: number;
  header?: string;
  items: WorksheetSectionItem[];
}

export const getSectionIdx = (q: AnyQuestion): number =>
  ((q as any)._sectionIdx ?? 0) as number;

export const getSectionCols = (q: AnyQuestion): number | undefined =>
  (q as any)._sectionCols as number | undefined;

export const getSectionHeader = (q: AnyQuestion): string | undefined =>
  (q as any)._sectionHeader as string | undefined;

/** True when the worksheet carries any real section structure (a non-first
 *  section index, or any section header). A single unnamed section reads as no
 *  sections, so plain worksheets keep their simple flat rendering. */
export const hasSections = (qs: AnyQuestion[]): boolean =>
  qs.some((q) => getSectionIdx(q) > 0 || !!getSectionHeader(q));

/** Split a flat, section-tagged worksheet into contiguous section runs. Each
 *  section's column count and header are taken from its first question (the
 *  builder stamps every question in a section identically). `defaultCols` is
 *  used when a question carries no explicit `_sectionCols`. */
export const splitIntoSections = (
  qs: AnyQuestion[],
  defaultCols: number,
): WorksheetSection[] => {
  const sections: WorksheetSection[] = [];
  let curSec = -1;
  qs.forEach((q, globalIdx) => {
    const si = getSectionIdx(q);
    if (si !== curSec) {
      sections.push({ idx: si, cols: defaultCols, items: [] });
      curSec = si;
    }
    sections[sections.length - 1].items.push({ q, globalIdx });
  });
  for (const sec of sections) {
    const first = sec.items[0]?.q;
    sec.cols = (first ? getSectionCols(first) : undefined) ?? defaultCols;
    sec.header = first ? getSectionHeader(first) : undefined;
  }
  return sections;
};
