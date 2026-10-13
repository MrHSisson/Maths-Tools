// Lessons for Indices — ordered steps inside this tool (see src/shared/lessons.ts).
// Each step is a shareable-link setup: a Depth item, or a Whiteboard / Worked Example / Worksheet
// with its Question Options set. The lesson bar and the burger menu are provided by ToolShell.

import type { ToolLesson } from "../../shared";

export const LESSONS: ToolLesson[] = [
  {
    id: "laws-level1",
    title: "Laws of indices (Level 1)",
    summary: "Multiply and divide powers of the same base. Starts by diagnosing, ends by extending.",
    tool: "indexLaws",
    steps: [
      { title: "Diagnose: who is right about a² × a³?", kind: "depth", level: "level1", item: "indices-il-a2-a3",
        ms: { multiply: true, divide: true, powerOfPower: false, numeric: true, algebraic: true } },
      { title: "Practise: multiply and divide, numbers and letters", kind: "whiteboard", level: "level1",
        ms: { multiply: true, divide: true, powerOfPower: false, numeric: true, algebraic: true } },
      { title: "Set it: 15 questions, multiply and divide", kind: "worksheet", level: "level1", n: 15, cols: 3,
        ms: { multiply: true, divide: true, powerOfPower: false, numeric: true, algebraic: true } },
      { title: "Extend: when do the indices add to the same as they multiply?", kind: "depth", level: "level1", item: "indices-il-multiply-or-add",
        ms: { multiply: true, divide: true, powerOfPower: false, numeric: true, algebraic: true } },
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
