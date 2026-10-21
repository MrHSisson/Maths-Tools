// Lessons for Indices — ordered steps inside this tool (see src/shared/lessons.ts).
// Each step is a shareable-link setup: a Depth item, or a Whiteboard / Worked Example / Worksheet
// with its Question Options set. The lesson bar and the burger menu are provided by ToolShell.

import type { ToolLesson } from "../../shared";

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
    summary: "Revisit the notation, then divide by the base down the indices to reach zero and negative powers. Cancelling tiles confirms it; then practise, set and extend.",
    tool: "indexLaws",
    steps: [
      { title: "Think: what if the bottom power is bigger?", kind: "depth", level: "level1", item: "indices-il-bottom-bigger",
        ms: { multiply: true, divide: true, powerOfPower: false, multiplyDivide: false, numeric: true, algebraic: true } },
      { title: "Teach: zero and negative powers, from the pattern of dividing", kind: "teach", level: "level1", tool: "specialPowers", deck: "negatives",
        ms: { zero: true, lawsNegative: false, divideNegative: true } },
      { title: "Practise: zero and negative powers", kind: "whiteboard", level: "level1", tool: "specialPowers",
        ms: { zero: true, lawsNegative: false, divideNegative: true } },
      { title: "Set it: 12 questions on zero and negative powers", kind: "worksheet", level: "level1", tool: "specialPowers", n: 12, cols: 3,
        ms: { zero: true, lawsNegative: false, divideNegative: true } },
      { title: "Extend: when is the index negative?", kind: "depth", level: "level1", tool: "specialPowers", item: "indices-sp-divide-to-negative-when",
        ms: { zero: true, lawsNegative: false, divideNegative: true } },
      { title: "Extend: is 2⁻³ negative?", kind: "depth", level: "level2", tool: "powersRoots", item: "indices-sp-two-to-minus-three",
        ms: { zero: true, negative: true, reverse: false } },
    ],
  },
  {
    id: "negative-coefficients",
    title: "Negative powers with coefficients and brackets",
    summary: "The next step on from zero and negative powers: only the letter carries the index, and a bracket carries everything inside it. Teach, practise, set and extend at Level 2.",
    tool: "specialPowers",
    steps: [
      { title: "Teach: coefficients, brackets and negative indices", kind: "teach", level: "level2", deck: "negatives-coefficients",
        ms: { coefficients: true, bracket: true } },
      { title: "Practise: coefficients and brackets with negative indices", kind: "whiteboard", level: "level2",
        ms: { coefficients: true, bracket: true } },
      { title: "Set it: 12 questions with coefficients and brackets", kind: "worksheet", level: "level2", n: 12, cols: 3,
        ms: { coefficients: true, bracket: true } },
      { title: "Extend: same answer, different question", kind: "depth", level: "level2", item: "indices-sp-l2-coef-extend",
        ms: { coefficients: true, bracket: true } },
    ],
  },
];
