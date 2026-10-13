// Lessons for Indices — ordered steps inside this tool (see src/shared/lessons.ts).
// Each step is a shareable-link setup: a Depth item, or a Whiteboard / Worked Example / Worksheet
// with its Question Options set. The lesson bar and the burger menu are provided by ToolShell.

import type { ToolLesson } from "../../shared";

export const LESSONS: ToolLesson[] = [
  {
    id: "laws-negatives-level1",
    title: "From the laws to negative powers (Level 1)",
    summary: "Learn the laws, practise them, then ask what happens when the bottom power is bigger. That leads into negative powers.",
    tool: "indexLaws",
    steps: [
      { title: "Teach: the laws of indices, from tiles", kind: "teach", level: "level1", deck: "laws",
        ms: { multiply: true, divide: true, powerOfPower: false, multiplyDivide: false, numeric: true, algebraic: true } },
      { title: "Practise: multiply, divide and multiply-then-divide", kind: "whiteboard", level: "level1",
        ms: { multiply: true, divide: true, powerOfPower: false, multiplyDivide: true, numeric: true, algebraic: true } },
      { title: "Set it: 10 questions on the three laws", kind: "worksheet", level: "level1", n: 10, cols: 2,
        ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true, numeric: true, algebraic: true } },
      { title: "Think: what if the bottom power is bigger?", kind: "depth", level: "level1", item: "indices-il-bottom-bigger",
        ms: { multiply: true, divide: true, powerOfPower: false, multiplyDivide: false, numeric: true, algebraic: true } },
      { title: "Teach: zero and negative powers, from the same tiles", kind: "teach", level: "level1", tool: "specialPowers", deck: "negatives",
        ms: { zero: true, negative: true, unitFraction: false, divideNegative: true } },
      { title: "Practise: zero and negative powers", kind: "whiteboard", level: "level1", tool: "specialPowers",
        ms: { zero: true, negative: true, unitFraction: false, divideNegative: true } },
      { title: "Set it: 12 questions on zero and negative powers", kind: "worksheet", level: "level1", tool: "specialPowers", n: 12, cols: 3,
        ms: { zero: true, negative: true, unitFraction: false, divideNegative: true } },
      { title: "Extend: when is the index negative?", kind: "depth", level: "level1", tool: "specialPowers", item: "indices-sp-divide-to-negative-when",
        ms: { zero: true, negative: true, unitFraction: false, divideNegative: true } },
    ],
  },
  {
    id: "laws-coefficients-level2",
    title: "Laws of indices with coefficients (Level 2)",
    summary: "Numbers do arithmetic, indices follow the laws. Teach, practise, set, then make your own.",
    tool: "indexLaws",
    steps: [
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
    id: "zero-negative-level1",
    title: "Zero and negative powers (Level 1)",
    summary: "What a⁰ and a⁻ⁿ mean, from the division law. Diagnose, explain, practise, set, extend.",
    tool: "specialPowers",
    steps: [
      { title: "Diagnose: what is 5⁰?", kind: "depth", level: "level1", item: "indices-sp-five-zero",
        ms: { zero: true, negative: true, unitFraction: true } },
      { title: "Explain: why a⁰ = 1", kind: "depth", level: "level1", item: "indices-sp-zero-division",
        ms: { zero: true, negative: true, unitFraction: true } },
      { title: "Practise: zero, negative and root powers", kind: "whiteboard", level: "level1",
        ms: { zero: true, negative: true, unitFraction: true } },
      { title: "Set it: 15 questions, zero, negative and root powers", kind: "worksheet", level: "level1", n: 15, cols: 3,
        ms: { zero: true, negative: true, unitFraction: true } },
      { title: "Extend: is 2⁻³ negative?", kind: "depth", level: "level1", item: "indices-sp-two-to-minus-three",
        ms: { zero: true, negative: true, unitFraction: true } },
    ],
  },
];
