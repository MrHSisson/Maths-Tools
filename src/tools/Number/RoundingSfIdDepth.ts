// Depth bank for Rounding → Identify Sig. Figs (see specs/rounding-identify-sf.md). One diagnose, explain and extend item per level,
// all on the `identifySf` tab only. Kept apart from RoundingDepth.ts (whose items all carry a number-line picture and the one Start here
// per level). Every count below follows the rule: leading zeros never count, trapped zeros always count, trailing zeros count only
// after a decimal point — asserted in src/tests/roundingOptions.test.ts.

import type { DepthItem } from "../../shared/depth";

export const SF_ID_DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — no zeros, or trapped zeros ─────────────────────────
  {
    id: "rnd-sfid-point", level: "level1", tool: "identifySf", purpose: "diagnose",
    title: "Counting digits",
    speakers: [{ name: "Ruby", says: ["I count the digits after the decimal point, so $3.526$ has three significant figures."] }],
    question: ["How many significant figures does $3.526$ have?"],
    options: [
      { text: "$3$", misconception: "Counts only the digits after the decimal point" },
      { text: "$4$", correct: true },
      { text: "$5$", misconception: "Counts the decimal point as if it were a digit" },
    ],
    answer: [
      "The significant figures start at the first non-zero digit, which is the $3$.",
      "$3.526$ has the digits $3$, $5$, $2$, $6$ — that is $4$ significant figures.",
      "The decimal point is not a digit and does not change where the first significant figure is.",
    ],
    teacherNote: "Ask where the first significant figure is, and whether the point moves it.",
  },
  {
    id: "rnd-sfid-first", level: "level1", tool: "identifySf", purpose: "explain",
    title: "Which is the first?",
    speakers: [{ name: "Kofi", says: ["The first significant figure of $62.41$ is $2$, because it is the last digit before the point."] }],
    question: ["Explain what Kofi has got wrong. What is the first significant figure?"],
    answer: [
      "The first significant figure is the first non-zero digit, reading from the left.",
      "In $62.41$ that is the $6$. The decimal point does not start the count.",
      "The significant figures are $6$, $2$, $4$, $1$.",
    ],
    teacherNote: "Listen for 'the first digit' versus 'the digit by the point'. Ask for the 3rd significant figure too.",
  },
  {
    id: "rnd-sfid-four-digits", level: "level1", tool: "identifySf", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["A whole number with $4$ digits has $4$ significant figures.", "Always, sometimes or never? Give examples."],
    answer: [
      "Sometimes.",
      "$4718$ has $4$ significant figures, and so does $4007$ (the zeros are trapped).",
      "But $4700$ has only $2$ (the zeros at the end are placeholders) and $4070$ has $3$.",
    ],
    teacherNote: "This runs ahead of the level: it is a seed for zeros. Do not insist on the rule yet.",
  },

  // ───────────────────────── Level 2 — leading and trailing zeros ─────────────────────────
  {
    id: "rnd-sfid-leading-zeros", level: "level2", tool: "identifySf", purpose: "diagnose",
    title: "Zeros after the point",
    speakers: [{ name: "Mei", says: ["I count every digit in $0.00305$, so it has six significant figures."] }],
    question: ["How many significant figures does $0.00305$ have?"],
    options: [
      { text: "$2$", misconception: "Ignores the trapped zero between the $3$ and the $5$" },
      { text: "$3$", correct: true },
      { text: "$5$", misconception: "Ignores only the zero before the decimal point, not the zeros after it" },
      { text: "$6$", misconception: "Counts every digit, including the leading zeros" },
    ],
    answer: [
      "The leading zeros only hold the place of the $3$, so they do not count.",
      "The zero between the $3$ and the $5$ is trapped, so it does count.",
      "The significant figures are $3$, $0$, $5$ — that is $3$.",
    ],
    teacherNote: "Ask which zeros 'do a job'. Contrast the zero before the $3$ with the zero before the $5$.",
  },
  {
    id: "rnd-sfid-trapped", level: "level1", tool: "identifySf", purpose: "explain",
    title: "Does the zero count?",
    speakers: [{ name: "Leo", says: ["In $3052$ the zero does not count, because zero means nothing."] }],
    question: ["Explain the mistake. How many significant figures does $3052$ have?"],
    answer: [
      "The zero is between the $3$ and the $5$, so it holds a place and changes the size of the number.",
      "Without it we would have $352$. A zero trapped between non-zero digits always counts.",
      "$3052$ has $4$ significant figures.",
    ],
    teacherNote: "Ask what $3052$ would become if the zero were taken out.",
  },
  {
    id: "rnd-sfid-zero-always", level: "level2", tool: "identifySf", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["A zero in a number is a significant figure.", "Always, sometimes or never? Give examples."],
    answer: [
      "Sometimes.",
      "In $3052$ the zero is trapped, so it counts.",
      "In $0.0472$ the zeros are leading, so they do not.",
    ],
    teacherNote: "Push for a rule for each case: which zeros count, which do not, and why.",
  },

  // ───────────────────────── Level 3 — all four kinds mixed ─────────────────────────
  {
    id: "rnd-sfid-trailing", level: "level2", tool: "identifySf", purpose: "diagnose",
    title: "Zeros at the end",
    speakers: [{ name: "Priya", says: ["$120.00$ and $120$ have the same number of significant figures."] }],
    question: ["How many significant figures does $120.00$ have?"],
    options: [
      { text: "$2$", misconception: "Ignores every zero after the $1$" },
      { text: "$3$", misconception: "Treats the trailing zeros as never counting, as in $120$" },
      { text: "$4$", misconception: "Counts only some of the zeros" },
      { text: "$5$", correct: true },
    ],
    answer: [
      "The zeros after the decimal point at the end of the number show how accurate it is, so they count.",
      "The zero between the $1$ and the $2$ is also trapped. The significant figures are $1$, $2$, $0$, $0$, $0$ — that is $5$.",
      "Without the decimal point, $120$ has only $2$ (taken as $2$ significant figures).",
    ],
    teacherNote: "Ask what writing the zeros after the point tells the reader about the measurement.",
  },
  {
    id: "rnd-sfid-1200", level: "level2", tool: "identifySf", purpose: "explain",
    title: "All the digits are there",
    speakers: [{ name: "Ben", says: ["$1200$ has four significant figures because all the digits are there."] }],
    question: ["Explain what Ben has missed. How many significant figures does $1200$ have?"],
    answer: [
      "The zeros at the end of a whole number only hold place value, so they do not count.",
      "$1200$ is taken as $2$ significant figures: $1$ and $2$.",
      "To show more, write the zeros after a decimal point: $1200.0$ has $5$.",
    ],
    teacherNote: "Name it as a convention. Ask why a zero after a decimal point cannot just be a placeholder.",
  },
  {
    id: "rnd-sfid-mixed-count", level: "level3", tool: "identifySf", purpose: "diagnose",
    title: "Zeros everywhere",
    speakers: [{ name: "Jamal", says: ["I only count the digits that are not zero, so $30.040$ has two significant figures."] }],
    question: ["How many significant figures does $30.040$ have?"],
    options: [
      { text: "$2$", misconception: "Counts only the non-zero digits" },
      { text: "$3$", misconception: "Drops the trapped zeros but keeps the trailing zero" },
      { text: "$4$", misconception: "Forgets that the zero at the end, after the decimal point, counts" },
      { text: "$5$", correct: true },
    ],
    answer: [
      "The first significant figure is the $3$, and there are no leading zeros.",
      "The two zeros between the $3$ and the $4$ are trapped, so they count. The last zero comes after the decimal point at the end, so it counts too.",
      "The significant figures are $3$, $0$, $0$, $4$, $0$ — that is $5$.",
    ],
    teacherNote: "Take each zero in turn: ask which kind it is and whether that kind counts.",
  },
  {
    id: "rnd-sfid-trailing-point", level: "level3", tool: "identifySf", purpose: "explain",
    title: "The zero at the end",
    speakers: [{ name: "Ruby", says: ["$0.0450$ has two significant figures, because the zero at the end is only a placeholder."] }],
    question: ["Explain what Ruby has got wrong. How many significant figures does $0.0450$ have?"],
    answer: [
      "The zeros before the $4$ are leading, so they do not count — Ruby is right about those.",
      "But the zero at the end comes after the decimal point, where it shows the number is accurate to that place, so it counts.",
      "The significant figures are $4$, $5$, $0$ — that is $3$.",
    ],
    teacherNote: "Ask what is different between this zero and the one in $1200$.",
  },
  {
    id: "rnd-sfid-all-three", level: "level3", tool: "identifySf", purpose: "extend",
    title: "Every kind of zero",
    question: ["Write a number that has a leading zero, a trapped zero and a trailing zero, and exactly $4$ significant figures."],
    answer: [
      "One answer is $0.002040$.",
      "The zeros before the $2$ are leading, so they do not count.",
      "The significant figures are $2$, $0$, $4$, $0$: the zero between the $2$ and the $4$ is trapped, and the last zero is trailing after the point. That makes $4$.",
    ],
    teacherNote: "Many answers work. Ask students to check each other's: count, then say which zeros did not count.",
  },
];
