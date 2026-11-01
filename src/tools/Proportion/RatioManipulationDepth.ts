// Depth bank for Ratio Manipulation — fixed, hand-written questions (see src/shared/depth.ts and specs/depth/ratio-manipulation.md).
// Levels follow the IDEAS, not the tabs' own levels:
//   1  Reading a ratio        order matters, a ratio is not a fraction, what "for every" means
//   2  Equivalent ratios      scale both parts, one form each (1 : n), reading a ratio as counts or as a fraction
//   3  Which fraction?        of the total, of the other part, both from one ratio; three parts; n : 1
// General items (no `tool`) show on every tab and link only to general items. The rest name the tabs they suit and link
// only within them (or to a general item), so a follow-up button is never missing.
// Every numeric claim below is asserted in src/tests/ratioManipulationDepth.test.ts.

import type { DepthItem } from "../../shared";

/** Tabs about the ratio itself: forming, simplifying and scaling. */
const BASICS = ["formingRatios", "simplifying", "equivalentRatios"];
/** Tabs that move between a ratio and a fraction. */
const FRACTIONS = ["ratioToFraction", "fractionToRatio"];

export const DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — Reading a ratio ─────────────────────────
  {
    id: "rm-order", level: "level1", purpose: "diagnose", startHere: true,
    title: "Who is right?",
    speakers: [
      { name: "Ruby", says: ["A bag has $7$ red and $4$ blue counters.", "Red to blue is $4 : 7$."] },
      { name: "Kofi", says: ["A bag has $7$ red and $4$ blue counters.", "Red to blue is $7 : 4$."] },
    ],
    question: ["Who is right?"],
    options: [
      { text: "Ruby", misconception: "Puts the smaller number first, or writes the ratio in the wrong order for the question", tag: "ratio-order" },
      { text: "Kofi", correct: true },
      { text: "They are both right", misconception: "Thinks the order of a ratio does not matter", tag: "ratio-order" },
    ],
    answer: [
      "Kofi is right: red to blue means the red number comes first, so $7 : 4$.",
      "Ruby's $4 : 7$ is the ratio of blue to red: the same numbers, a different ratio.",
      "The order of the words in the question is the order of the numbers.",
    ],
    ifNotSecure: "rm-one-third", ifSecure: "rm-first-bigger",
  },
  {
    id: "rm-one-third", level: "level1", purpose: "explain",
    title: "Is it one third?",
    question: ["Red : blue $= 1 : 3$.", "Explain why $\\frac13$ of the counters are not red."],
    answer: [
      "The ratio says: for every $1$ red there are $3$ blue.",
      "So every group has $1 + 3 = 4$ counters, and only $1$ of the $4$ is red.",
      "Red is $\\frac14$ of all the counters. The $\\frac13$ compares the red with the blue only.",
    ],
    ifNotSecure: "rm-order", ifSecure: "rm-first-bigger",
  },
  {
    id: "rm-first-bigger", level: "level1", purpose: "extend",
    title: "Always, sometimes or never?",
    question: ["Always, sometimes or never true?", "In a ratio, the first number is bigger than the second."],
    answer: [
      "Sometimes. Red to blue is $7 : 4$ for $7$ red and $4$ blue, but blue to red is $4 : 7$.",
      "Which number is bigger depends on which thing there is more of, and the ratio is written in the order the question asks.",
      "The same bag gives both $7 : 4$ and $4 : 7$, and equal amounts give $3 : 3$, where neither is bigger.",
    ],
    ifNotSecure: "rm-order", ifSecure: "rm-reads",
  },

  // ───────────────────────── Level 2 — Equivalent ratios ─────────────────────────
  {
    id: "rm-reads", level: "level2", purpose: "diagnose", startHere: true,
    title: "What does it tell you?",
    question: ["Red : blue $= 2 : 3$.", "Which statement must be true?"],
    options: [
      { text: "There are $2$ red counters and $3$ blue counters", misconception: "Reads a ratio as the actual amounts: there could be $4$ and $6$, or $20$ and $30$", tag: "ratio-as-amount" },
      { text: "For every $2$ red counters there are $3$ blue counters", correct: true },
      { text: "$\\frac23$ of the counters are red", misconception: "Reads a ratio as a fraction of all the counters", tag: "ratio-as-fraction" },
    ],
    answer: [
      "Only 'for every $2$ red there are $3$ blue' is certain.",
      "It could be $2$ and $3$, but also $4$ and $6$ or $20$ and $30$: that is why $2 : 3$ is called a ratio.",
      "Red is $\\frac25$ of all the counters ($2 + 3 = 5$ equal parts), and $\\frac23$ of the blue ones.",
    ],
    ifNotSecure: "rm-order", ifSecure: "rm-same-ratio",
  },
  {
    id: "rm-wrong-factor", level: "level2", purpose: "explain",
    title: "Find the mistake",
    working: {
      intro: "Simplify $12 : 8$.",
      lines: ["12 : 8", "= 12 \\div 4 : 8 \\div 2", "= 3 : 4"],
      wrongLine: 1,
    },
    question: ["Tap the first line that is wrong."],
    answer: [
      "Line 2 is the first wrong line: $12$ was divided by $4$ but $8$ by $2$.",
      "Both parts must be divided by the same number to keep the ratio: $12 \\div 4 = 3$ and $8 \\div 4 = 2$, so $3 : 2$.",
      "$3 : 4$ is a different ratio: $12 : 8$ has the first part bigger, $3 : 4$ has the second.",
    ],
    ifNotSecure: "rm-order", ifSecure: "rm-same-ratio",
  },
  {
    id: "rm-same-ratio", level: "level2", purpose: "extend",
    title: "Convince me",
    question: ["Convince me that $12 : 18$ and $10 : 15$ are the same ratio."],
    answer: [
      "Simplify both. $12 : 18$: divide by $6$ to get $2 : 3$.",
      "$10 : 15$: divide by $5$ to get $2 : 3$.",
      "They simplify to the same ratio, $2 : 3$. Different numbers, same ratio: one is the other scaled up.",
    ],
    ifNotSecure: "rm-reads", ifSecure: "rm-both-fractions",
  },

  // ───────────────────────── Level 3 — Which fraction? ─────────────────────────
  {
    id: "rm-both-fractions", level: "level3", purpose: "diagnose", startHere: true,
    title: "Who is right?",
    speakers: [
      { name: "Ruby", says: ["Red : blue $= 7 : 10$.", "Red is $\\frac7{17}$ of all the counters."] },
      { name: "Kofi", says: ["Red : blue $= 7 : 10$.", "Red is $\\frac7{10}$ of the blue counters."] },
    ],
    question: ["Who is right?"],
    options: [
      { text: "Ruby", misconception: "Thinks a ratio gives only one fraction, so rejects 'of the blue'", tag: "ratio-two-fractions" },
      { text: "Kofi", misconception: "Thinks a ratio gives only one fraction, the one written straight from the numbers", tag: "ratio-two-fractions" },
      { text: "They are both right", correct: true },
    ],
    answer: [
      "They are both right: they answer different questions about the same ratio.",
      "Of all the counters: $7 + 10 = 17$ equal parts, red is $7$ of them, so $\\frac7{17}$.",
      "Of the blue counters: red is $7$ parts and blue is $10$ parts, so $\\frac7{10}$.",
      "The words 'of all' and 'of the blue' choose the whole you compare with.",
    ],
    ifNotSecure: "rm-reads", ifSecure: "rm-other-bigger",
  },
  {
    id: "rm-which-whole", level: "level3", purpose: "explain",
    title: "Same ratio, two fractions",
    question: ["Red : blue $= 7 : 10$.", "Explain why red is $\\frac7{10}$ of the blue but only $\\frac7{17}$ of all the counters. Which is bigger?"],
    answer: [
      "Red is $7$ parts. The blue is $10$ parts, but all the counters is $7 + 10 = 17$ parts.",
      "$\\frac7{10}$ compares red with the blue only; $\\frac7{17}$ compares red with the red and the blue together.",
      "$\\frac7{10}$ is bigger: the whole it is compared with, $10$ parts, is smaller than $17$ parts.",
    ],
    ifNotSecure: "rm-both-fractions", ifSecure: "rm-other-bigger",
  },
  {
    id: "rm-other-bigger", level: "level3", purpose: "extend",
    title: "Always, sometimes or never?",
    question: ["Always, sometimes or never true?", "Red is a bigger fraction of the other part than of the total."],
    answer: [
      "Always. For red : blue $= a : b$, red is $\\frac{a}{b}$ of the blue and $\\frac{a}{a + b}$ of the total.",
      "The top is the same and $b$ is smaller than $a + b$, so $\\frac{a}{b}$ is always the bigger.",
      "For $7 : 10$: $\\frac7{10}$ against $\\frac7{17}$. They are never equal, because $b$ is never $a + b$.",
    ],
    ifNotSecure: "rm-which-whole",
  },

  // ───────────────── Tabs about the ratio itself: forming, simplifying, equivalent ─────────────────
  {
    id: "rm-simplify-stop", level: "level1", tool: BASICS, purpose: "diagnose",
    title: "Which is simplest?",
    question: ["Simplify $12 : 8$."],
    options: [
      { text: "$3 : 2$", correct: true },
      { text: "$6 : 4$", misconception: "Stops after one division: $6 : 4$ can still be divided by $2$", tag: "ratio-stops-early" },
      { text: "$3 : 8$", misconception: "Divides only the first part", tag: "ratio-one-part" },
    ],
    answer: [
      "$12 : 8$ divided by $4$ is $3 : 2$, and nothing divides both $3$ and $2$.",
      "$6 : 4$ is equivalent but not simplest: both numbers are still even.",
      "$3 : 8$ is a different ratio: both parts must be divided by the same number.",
    ],
    ifNotSecure: "rm-order", ifSecure: "rm-add-both",
  },
  {
    id: "rm-add-both", level: "level2", tool: BASICS, purpose: "diagnose",
    title: "Which is equivalent?",
    question: ["Which ratio is equivalent to $2 : 5$?"],
    options: [
      { text: "$4 : 7$", misconception: "Adds the same amount to both parts instead of multiplying them", tag: "ratio-add-not-multiply" },
      { text: "$4 : 10$", correct: true },
      { text: "$5 : 2$", misconception: "Swaps the parts, so the first is now the bigger", tag: "ratio-order" },
    ],
    answer: [
      "$4 : 10$ is $2 : 5$ with both parts doubled.",
      "$4 : 7$ adds $2$ to each part. The gap stays $3$ but the ratio is different: $2 : 5$ has the second part $2.5$ times the first, $4 : 7$ only $1.75$ times.",
      "$5 : 2$ is the ratio the other way round.",
    ],
    ifNotSecure: "rm-simplify-stop", ifSecure: "rm-same-ratio",
  },
  {
    id: "rm-one-to-n", level: "level2", tool: BASICS, purpose: "explain",
    title: "Find the mistake",
    working: {
      intro: "Write $4 : 10$ in the form $1 : n$.",
      lines: ["4 : 10", "= 4 \\div 10 : 10 \\div 10", "= 0.4 : 1"],
      wrongLine: 1,
    },
    question: ["Tap the first line that is wrong."],
    answer: [
      "Line 2 is the first wrong line: the form $1 : n$ needs the first part to become $1$, so divide both parts by $4$.",
      "$4 \\div 4 : 10 \\div 4 = 1 : 2.5$.",
      "The working divided by $10$ and made the second part $1$, which gives $0.4 : 1$, the form $n : 1$ instead.",
    ],
    ifNotSecure: "rm-simplify-stop", ifSecure: "rm-one-n-or-n-one",
  },
  {
    id: "rm-three-part", level: "level3", tool: BASICS, purpose: "diagnose",
    title: "Simplify three parts",
    question: ["Simplify $12 : 18 : 8$."],
    options: [
      { text: "$6 : 9 : 4$", correct: true },
      { text: "$2 : 3 : 1\\frac13$", misconception: "Divides by a factor of just two of the parts and accepts a fraction in the third", tag: "ratio-factor-of-two" },
      { text: "It cannot be simplified", misconception: "Thinks one part that does not divide by $3$ or $6$ stops the whole ratio being simplified", tag: "ratio-factor-of-two" },
    ],
    answer: [
      "The number that goes into all three parts is $2$: $12 : 18 : 8$ becomes $6 : 9 : 4$.",
      "$6$ goes into $12$ and $18$ but not $8$, so dividing by $6$ gives the fraction $1\\frac13$: not wrong, but not a simplified ratio.",
      "A ratio can be simplified whenever one number divides every part, even if it does not suit all of them as neatly as for two.",
    ],
    ifNotSecure: "rm-simplify-stop", ifSecure: "rm-one-n-or-n-one",
  },
  {
    id: "rm-n-to-one", level: "level3", tool: BASICS, purpose: "explain",
    title: "Find the mistake",
    working: {
      intro: "Write $9 : 6$ in the form $n : 1$.",
      lines: ["9 : 6", "= 9 \\div 9 : 6 \\div 9", "= 1 : 0.67"],
      wrongLine: 1,
    },
    question: ["Tap the first line that is wrong."],
    answer: [
      "Line 2 is the first wrong line: the form $n : 1$ needs the second part to become $1$, so divide both parts by $6$.",
      "$9 \\div 6 : 6 \\div 6 = 1.5 : 1$.",
      "Dividing by $9$ made the first part $1$, which is the form $1 : n$ (and $0.67$ is rounded).",
    ],
    ifNotSecure: "rm-one-to-n", ifSecure: "rm-one-n-or-n-one",
  },
  {
    id: "rm-one-n-or-n-one", level: "level3", tool: BASICS, purpose: "extend",
    title: "Two forms",
    question: ["Write $5 : 2$ as $1 : n$ and as $n : 1$.", "In which form is $n$ bigger than $1$?"],
    answer: [
      "As $1 : n$: divide by $5$ to get $1 : 0.4$. As $n : 1$: divide by $2$ to get $2.5 : 1$.",
      "In $n : 1$, $n$ is $2.5$, bigger than $1$. In $1 : n$, $n$ is $0.4$, smaller than $1$.",
      "$5 : 2$ has the first part bigger, so the first part is the one that is more than $1$ when the other is made $1$.",
    ],
    ifNotSecure: "rm-n-to-one",
  },

  // ───────────────── Tabs that move between a ratio and a fraction ─────────────────
  {
    id: "rm-total-denominator", level: "level1", tool: FRACTIONS, purpose: "diagnose",
    title: "What fraction is red?",
    question: ["Red : blue $= 5 : 8$.", "What fraction of the counters are red?"],
    options: [
      { text: "$\\frac5{13}$", correct: true },
      { text: "$\\frac58$", misconception: "Writes the ratio as a fraction: puts the other part on the bottom, not the total", tag: "ratio-as-fraction" },
      { text: "$\\frac8{13}$", misconception: "Takes the fraction for the other colour", tag: "ratio-wrong-part" },
    ],
    answer: [
      "$5 + 8 = 13$ equal parts in all, red is $5$ of them: $\\frac5{13}$.",
      "$\\frac58$ compares red with the blue only, not with all the counters.",
      "$\\frac8{13}$ is the fraction that are blue: always check which colour the question asks for.",
    ],
    ifNotSecure: "rm-one-third", ifSecure: "rm-same-fraction",
  },
  {
    id: "rm-boxes", level: "level1", tool: FRACTIONS, purpose: "explain",
    title: "Explain with boxes",
    question: ["Red : blue $= 4 : 3$.", "Use boxes to explain why $\\frac47$ of the counters are red."],
    answer: [
      "Draw $4$ boxes for red and $3$ boxes for blue: $7$ equal boxes in all.",
      "Red is $4$ of the $7$ boxes, so $\\frac47$ of the counters are red.",
      "The denominator is the whole bar, red and blue together.",
    ],
    ifNotSecure: "rm-one-third", ifSecure: "rm-same-fraction",
  },
  {
    id: "rm-same-fraction", level: "level1", tool: FRACTIONS, purpose: "extend",
    title: "Convince me",
    question: ["Red : blue $= 2 : 3$ in one bag and $4 : 6$ in another.", "Convince me that the same fraction of each bag is red."],
    answer: [
      "$2 : 3$ has $5$ parts, so red is $\\frac25$.",
      "$4 : 6$ has $10$ parts, so red is $\\frac{4}{10} = \\frac25$.",
      "The two ratios are equivalent, so the share is the same however many counters are in the bag.",
    ],
    ifNotSecure: "rm-total-denominator", ifSecure: "rm-rest",
  },
  {
    id: "rm-rest", level: "level2", tool: FRACTIONS, purpose: "diagnose",
    title: "And the rest",
    question: ["$\\frac37$ of the counters are red and the rest are blue.", "What is the ratio of red to blue?"],
    options: [
      { text: "$3 : 4$", correct: true },
      { text: "$3 : 7$", misconception: "Reads the fraction straight into a ratio and forgets that the rest are blue", tag: "ratio-forgets-rest" },
      { text: "$4 : 3$", misconception: "Finds the rest but writes the colours in the wrong order", tag: "ratio-order" },
    ],
    answer: [
      "$\\frac37$ red means $3$ parts out of $7$; the rest is $7 - 3 = 4$ parts blue. Red to blue is $3 : 4$.",
      "$3 : 7$ would compare red with all the counters, but a ratio compares parts: red with blue.",
      "$4 : 3$ is blue to red.",
    ],
    ifNotSecure: "rm-total-denominator", ifSecure: "rm-other-part-fraction",
  },
  {
    id: "rm-of-the-blue", level: "level2", tool: FRACTIONS, purpose: "explain",
    title: "Explain the slip",
    speakers: [{ name: "Amara", says: ["Red is $\\frac23$ of the blue.", "So the ratio of red to blue is $2 : 5$."] }],
    question: ["Explain what Amara has done wrong."],
    answer: [
      "'Red is $\\frac23$ of the blue' compares red with the blue only: $2$ parts of red for every $3$ parts of blue.",
      "So red to blue is $2 : 3$. Amara has added the parts ($2 + 3 = 5$), as if the $\\frac23$ was of all the counters.",
      "Adding the parts belongs to 'of all'. 'Of the blue' keeps the numbers as they are.",
    ],
    ifNotSecure: "rm-rest", ifSecure: "rm-other-part-fraction",
  },
  {
    id: "rm-other-part-fraction", level: "level3", tool: FRACTIONS, purpose: "extend",
    title: "Two readings",
    question: ["Red is $\\frac34$ of the blue counters.", "What fraction of all the counters is red? Explain."],
    answer: [
      "'Red is $\\frac34$ of the blue' gives red : blue $= 3 : 4$.",
      "There are $3 + 4 = 7$ parts in all, red is $3$ of them: $\\frac37$ of all the counters.",
      "The same ratio, two fractions: $\\frac34$ of the blue and $\\frac37$ of all.",
    ],
    ifNotSecure: "rm-of-the-blue",
  },
];
