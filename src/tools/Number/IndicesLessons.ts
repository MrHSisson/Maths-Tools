// Lessons for Indices — ordered steps inside this tool (see src/shared/lessons.ts).
// Each step is a shareable-link setup: a Depth item, or a Whiteboard / Worked Example / Worksheet
// with its Question Options set. The lesson bar and the burger menu are provided by ToolShell.

import type { ToolLesson } from "../../shared";

// the laws with negative indices, both notations, answers left in index form ("Write in index form:")
const NEG_LAWS = { zero: true, divideNegative: true, lawsNegative: true, powerOfPower: true, power: true, fraction: true, positive: false, leave: true };
// Writing Indices: negative indices only, letters and number bases
const WRITE_NEG = { negative: true, unit: false, letters: true, numbers: true };

export const LESSONS: ToolLesson[] = [
  {
    id: "laws-of-indices",
    title: "Laws of indices (no negatives)",
    summary: "The three laws from tiles, practised, then the same laws with coefficients. Every answer is a positive power; negative powers are the next lesson.",
    tool: "indexLaws",
    steps: [
      { title: "Teach: the laws of indices, from tiles", kind: "teach", level: "level1", deck: "laws",
        ms: { multiply: true, divide: true, powerOfPower: false, multiplyDivide: false, numeric: true, algebraic: true } },
      { title: "Practise: multiply, divide and multiply-then-divide", kind: "whiteboard", level: "level1",
        ms: { multiply: true, divide: true, powerOfPower: false, multiplyDivide: true, numeric: true, algebraic: true } },
      { title: "Set it: 10 questions on the three laws", kind: "worksheet", level: "level1", n: 10, cols: 2,
        ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true, numeric: true, algebraic: true } },
      { title: "Teach: coefficients and the laws", kind: "teach", level: "level2", deck: "coefficients",
        ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true } },
      { title: "Practise: multiply, divide and powers of a bracket", kind: "whiteboard", level: "level2",
        ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: false } },
      { title: "Set it: 12 questions with coefficients", kind: "worksheet", level: "level2", n: 12, cols: 3,
        ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true } },
      { title: "Extend: make 6x⁶ two ways", kind: "depth", level: "level2", item: "indices-il-letters-power",
        ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true } },
    ],
  },
  {
    id: "negative-powers",
    title: "Zero and negative powers",
    summary: "Divide by the base down the indices to reach zero and negative powers, practise writing negative indices, then see that every index law still holds with negative indices and practise those.",
    tool: "specialPowers",
    steps: [
      { title: "Teach: zero and negative powers, from the pattern of dividing", kind: "teach", level: "level1", tool: "specialPowers", deck: "negatives",
        ms: { zero: true, lawsNegative: false, divideNegative: true } },
      { title: "Practise: writing negative indices (whiteboard)", kind: "whiteboard", level: "level1", tool: "writingIndices", ms: WRITE_NEG },
      { title: "Practise: writing negative indices (worksheet)", kind: "worksheet", level: "level1", tool: "writingIndices", n: 12, cols: 3, ms: WRITE_NEG },
      { title: "Teach: the index laws still hold with negative indices", kind: "teach", level: "level1", tool: "specialPowers", deck: "negative-laws", ms: NEG_LAWS },
      { title: "Practise: the laws with negative indices (whiteboard)", kind: "whiteboard", level: "level1", tool: "specialPowers", ms: NEG_LAWS },
      { title: "Practise: the laws with negative indices (worksheet)", kind: "worksheet", level: "level1", tool: "specialPowers", n: 12, cols: 3, ms: NEG_LAWS },
      { title: "Extend: always, sometimes, never", kind: "depth", level: "level1", tool: "specialPowers", item: "indices-sp-laws-negative-extend", ms: NEG_LAWS },
    ],
  },
];
