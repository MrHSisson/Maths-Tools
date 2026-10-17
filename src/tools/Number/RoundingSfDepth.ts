// Depth items for Rounding → Significant Figures that follow the zeros ladder (specs/decks/sig-figs.md, Lesson 2): 1 none or trapped,
// 2 leading or trailing, 3 all four. Kept apart from RoundingDepth.ts (whose items follow the older "ideas" levels and all carry a number
// line). Every number below is asserted in src/tests/sigFigLessons.test.ts against an independent rounding.

import type { DepthItem } from "../../shared/depth";

export const SF_ROUND_DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — no zeros, or trapped zeros ─────────────────────────
  {
    id: "rnd-sfr-dp-or-sf", level: "level1", tool: "sf", purpose: "diagnose",
    title: "Same rounding?",
    speakers: [{ name: "Mei", says: ["Rounding $0.0472$ to $2$ decimal places and to $2$ significant figures gives the same answer."] }],
    question: ["Round $0.0472$ to $2$ decimal places, and then to $2$ significant figures."],
    options: [
      { text: "$0.05$ and $0.047$", correct: true },
      { text: "$0.047$ and $0.047$", misconception: "Treats decimal places and significant figures as the same thing" },
      { text: "$0.05$ and $0.05$", misconception: "Counts the zero after the point as a significant figure" },
      { text: "$0.04$ and $0.047$", misconception: "Cuts off after $2$ decimal places instead of rounding" },
    ],
    answer: [
      "Decimal places count digits after the point. The $2$ decimal places are the $0$ and the $4$. The next digit is $7$, so it rounds up: $0.05$.",
      "Significant figures start at the first non-zero digit, the $4$: the $4$ and the $7$ are the $2$ we keep, and the next digit $2$ is less than $5$, so $0.047$.",
      "The two are different counts, so the answers can differ.",
    ],
    teacherNote: "Ask where each count starts: after the decimal point, or at the first non-zero digit.",
  },
  {
    id: "rnd-sfr-trapped-decider", level: "level1", tool: "sf", purpose: "explain",
    title: "The zero that matters",
    speakers: [{ name: "Leo", says: ["$3.052$ to $2$ significant figures is $3.0$, because the zero is just a zero."] }],
    question: ["Explain what Leo has got wrong. What is $3.052$ to $2$ significant figures?"],
    answer: [
      "The zero is trapped between the $3$ and the $5$, so it counts. The $3$ and the $0$ are the $2$ significant figures we keep.",
      "The next digit is $5$, which is $5$ or more, so the last digit we keep goes up: $0 \\to 1$.",
      "$3.052$ to $2$ significant figures is $3.1$.",
    ],
    teacherNote: "Ask which digit is the last one we keep, and which digit decides.",
  },
  {
    id: "rnd-sfr-same-digits", level: "level1", tool: "sf", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["Rounding a whole number to $2$ significant figures gives an answer with the same number of digits.", "Always, sometimes or never? Give examples."],
    answer: [
      "Sometimes.",
      "$4612 \\to 4600$ has $4$ digits, the same as before.",
      "But $9960 \\to 10{,}000$ has $5$ digits: the $9$ rounds up to $10$ and carries.",
    ],
    teacherNote: "Push for the carry case: what makes the number get longer?",
  },

  // ───────────────────────── Level 2 — leading and trailing zeros ─────────────────────────
  {
    id: "rnd-sfr-leading", level: "level2", tool: "sf", purpose: "diagnose",
    title: "Zeros before the digits",
    question: ["Round $0.00836$ to $2$ significant figures."],
    options: [
      { text: "$0.0084$", correct: true },
      { text: "$0.0083$", misconception: "Cuts off after the $2$nd significant figure instead of looking at the next digit" },
      { text: "$0.01$", misconception: "Rounds to $1$ significant figure, not $2$" },
    ],
    answer: [
      "The zeros before the $8$ are leading zeros, so they do not count. The $8$ and the $3$ are the $2$ significant figures we keep.",
      "The next digit is $6$, which is $5$ or more, so the $3$ goes up to $4$.",
      "$0.00836$ to $2$ significant figures is $0.0084$.",
    ],
    teacherNote: "Ask where the first significant figure is, and what the leading zeros do.",
  },
  {
    id: "rnd-sfr-placeholder", level: "level2", tool: "sf", purpose: "diagnose",
    title: "What about the rest?",
    question: ["Round $46{,}720$ to $2$ significant figures."],
    options: [
      { text: "$47{,}000$", correct: true },
      { text: "$47$", misconception: "Drops the rest instead of replacing it with zeros, so the size is wrong" },
      { text: "$46{,}700$", misconception: "Rounds to $3$ significant figures, or cuts off instead of rounding up" },
    ],
    answer: [
      "The $4$ and the $6$ are the $2$ significant figures we keep. The next digit is $7$, so the $6$ goes up to $7$.",
      "The rest, $720$, is before the decimal point, so we replace it with zeros. The number must stay about $47$ thousand.",
      "$46{,}720$ to $2$ significant figures is $47{,}000$.",
    ],
    teacherNote: "Ask how big the answer should be, and what the zeros are doing.",
  },
  {
    id: "rnd-sfr-keep-zero", level: "level2", tool: "sf", purpose: "explain",
    title: "Can the zero go?",
    speakers: [{ name: "Jamal", says: ["$4.96$ to $2$ significant figures is $5$, so I can drop the zero."] }],
    question: ["Explain the mistake. What is $4.96$ to $2$ significant figures?"],
    answer: [
      "The $4$ and the $9$ are the $2$ we keep. The next digit is $6$, so the $9$ rounds up: $9 + 1 = 10$, so write $0$ and carry the $1$ to make $5.0$.",
      "The zero is a trailing zero after the decimal point, so it counts. Without it, $5$ would be only $1$ significant figure.",
      "$4.96$ to $2$ significant figures is $5.0$.",
    ],
    teacherNote: "Ask how many significant figures $5$ has, and how many $5.0$ has.",
  },
  {
    id: "rnd-sfr-range", level: "level2", tool: "sf", purpose: "extend",
    title: "Smallest and largest",
    question: ["A whole number is rounded to $2$ significant figures and the answer is $4600$.", "What is the smallest it could be? What is the largest?"],
    answer: [
      "Smallest: $4550$ (the next digit $5$ rounds the $5$ up to $6$).",
      "Largest: $4649$ ($4650$ would round up to $4700$).",
      "Every whole number from $4550$ to $4649$ rounds to $4600$.",
    ],
    teacherNote: "Many will say 4549 or 4650. Ask what the number just under 4550 rounds to.",
  },

  // ───────────────────────── Level 3 — all four kinds mixed ─────────────────────────
  {
    id: "rnd-sfr-mixed", level: "level3", tool: "sf", purpose: "diagnose",
    title: "Zeros in the middle",
    question: ["Round $30{,}061$ to $3$ significant figures."],
    options: [
      { text: "$30{,}100$", correct: true },
      { text: "$30{,}000$", misconception: "Ignores the digit that decides and cuts off after the $3$rd significant figure" },
      { text: "$30{,}060$", misconception: "Rounds to $4$ significant figures" },
      { text: "$301$", misconception: "Forgets to replace the rest with zeros, so the size is wrong" },
    ],
    answer: [
      "The $3$, and the two zeros trapped after it, are the $3$ significant figures we keep: the last digit we keep is the second zero.",
      "The next digit is $6$, which is $5$ or more, so that zero goes up to $1$.",
      "The digits after the last one we keep, $61$, are before the decimal point, so they become zeros: $30{,}061$ to $3$ significant figures is $30{,}100$.",
    ],
    teacherNote: "A trapped zero can be the digit that goes up. Ask which digit changes.",
  },
  {
    id: "rnd-sfr-same-value", level: "level3", tool: "sf", purpose: "explain",
    title: "Same answer?",
    speakers: [{ name: "Priya", says: ["$0.04503$ to $2$ significant figures is $0.045$, and to $3$ significant figures it is also $0.045$, so they are the same."] }],
    question: ["Is Priya right? What is $0.04503$ to $3$ significant figures?"],
    answer: [
      "To $2$ significant figures: keep the $4$ and the $5$. The next digit is $0$, so it stays: $0.045$.",
      "To $3$ significant figures: keep the $4$, the $5$ and the $0$. The next digit is $3$, so it stays: $0.0450$.",
      "The value is the same, but the trailing zero is the $3$rd significant figure, so $0.0450$ is the answer to $3$.",
    ],
    teacherNote: "Ask why the zero must be written. What does it tell the reader about the accuracy?",
  },
  {
    id: "rnd-sfr-eight-point-zero", level: "level3", tool: "sf", purpose: "extend",
    title: "Working backwards",
    question: ["A number is $8.0$ to $2$ significant figures.", "What is the smallest it could be? What is the largest (to $3$ decimal places)?"],
    answer: [
      "Smallest: $7.95$ (the next digit $5$ rounds the $9$ up and carries to make $8.0$).",
      "Largest: $8.049$ ($8.05$ would round up to $8.1$).",
      "Every number from $7.95$ up to $8.049$ rounds to $8.0$ to $2$ significant figures.",
    ],
    teacherNote: "Ask what $8.0$ tells you that $8$ does not.",
  },
];
