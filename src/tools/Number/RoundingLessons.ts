// Lessons for Rounding — ordered steps inside this tool (see src/shared/lessons.ts and docs/design/LESSONS.md).
// Lesson 1 of specs/decks/sig-figs.md: identifying significant figures, on the zeros ladder (1 none or trapped · 2 leading or trailing · 3 all four).

import type { ToolLesson } from "../../shared";

const L1 = { wholes: true, decimals: true, none: true, trapped: true };
const L2 = { wholes: true, decimals: true, mark: true, name: true, count: true, leading: true, trailing: true };
const L3 = { wholes: true, decimals: true, mark: true, name: true, count: true, none: true, trapped: true, leading: true, trailing: true };

const LINE_OFF = { off: true, labelled: false, blank: false };
const SF1 = { wholes: true, decimals: true, none: true, trapped: true, sf1: true, sf2: true, sf3: true, ...LINE_OFF };
const SF1_LINE = { ...SF1, off: false, labelled: true };
const SF2 = { wholes: true, decimals: true, leading: true, trailing: true, sf1: true, sf2: true, sf3: true, ...LINE_OFF };
const SF3 = { wholes: true, decimals: true, none: true, trapped: true, leading: true, trailing: true, sf1: true, sf2: true, sf3: true };

export const LESSONS: ToolLesson[] = [
  {
    id: "identifying-sig-figs",
    title: "Identifying significant figures",
    summary: "Where significant figures start, the zero trapped between digits, then leading and trailing zeros with a before / after routine and four rules to write down.",
    tool: "identifySf",
    steps: [
      { title: "Teach: where do significant figures start?", kind: "teach", level: "level1", deck: "sf-start", ms: L1 },
      { title: "Practise: name the 1st, 2nd or 3rd", kind: "whiteboard", level: "level1", ms: L1 },
      { title: "Set it: 10 questions, no zeros or trapped zeros", kind: "worksheet", level: "level1", n: 10, cols: 2, ms: L1 },
      { title: "Teach: zeros at the start and the end", kind: "teach", level: "level2", deck: "sf-zeros", ms: L2 },
      { title: "Practise: leading and trailing zeros", kind: "whiteboard", level: "level2", ms: L2 },
      { title: "Set it: 12 questions with leading or trailing zeros", kind: "worksheet", level: "level2", n: 12, cols: 2, ms: L2 },
      { title: "Extend: is a zero always significant?", kind: "depth", level: "level2", item: "rnd-sfid-zero-always", ms: L2 },
      { title: "Practise: all four kinds mixed", kind: "whiteboard", level: "level3", ms: L3 },
      { title: "Set it: 12 mixed questions", kind: "worksheet", level: "level3", n: 12, cols: 3, ms: L3 },
      { title: "Extend: every kind of zero", kind: "depth", level: "level3", item: "rnd-sfid-all-three", ms: L3 },
    ],
  },
  {
    id: "rounding-sig-figs",
    title: "Rounding to significant figures",
    summary: "Find the last digit you keep, let the next digit decide, deal with the rest; then leading zeros, a trailing zero kept in the answer, and placeholders. Four rules to write down.",
    tool: "sf",
    steps: [
      { title: "Think: decimal places or significant figures?", kind: "depth", level: "level1", item: "rnd-sfr-dp-or-sf", ms: SF1 },
      { title: "Teach: rounding to significant figures", kind: "teach", level: "level1", deck: "sf-round", ms: SF1 },
      { title: "Practise: no zeros or trapped zeros", kind: "whiteboard", level: "level1", ms: SF1 },
      { title: "Practise: with a labelled number line", kind: "whiteboard", level: "level1", ms: SF1_LINE },
      { title: "Set it: 10 questions, no zeros or trapped zeros", kind: "worksheet", level: "level1", n: 10, cols: 2, ms: SF1 },
      { title: "Teach: zeros when you round", kind: "teach", level: "level2", deck: "sf-round-zeros", ms: SF2 },
      { title: "Practise: leading and trailing zeros", kind: "whiteboard", level: "level2", ms: SF2 },
      { title: "Set it: 12 questions with leading or trailing zeros", kind: "worksheet", level: "level2", n: 12, cols: 2, ms: SF2 },
      { title: "Extend: smallest and largest", kind: "depth", level: "level2", item: "rnd-sfr-range", ms: SF2 },
      { title: "Practise: all four kinds mixed", kind: "whiteboard", level: "level3", ms: SF3 },
      { title: "Set it: 12 mixed questions", kind: "worksheet", level: "level3", n: 12, cols: 3, ms: SF3 },
      { title: "Extend: working backwards", kind: "depth", level: "level3", item: "rnd-sfr-eight-point-zero", ms: SF3 },
    ],
  },
];
