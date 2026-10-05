// Depth bank for Rounding — fixed, hand-written questions (see src/shared/depth.ts and specs/depth/rounding.md).
// Levels follow the IDEAS, not the tool's number-line presentation levels:
//   1  Which way?            the two neighbours, the halfway value, the number line
//   2  Which digit decides?  rounding digit + decider; "round the digit but keep the rest"; trailing zeros
//   3  Edge cases & accuracy  carrying over 9s, leading zeros, double rounding, the range that rounds to a value
// Items with no `tool` show on every tab; tab-specific ones name `tool` and the pool option they use as `needs`.
// Every numeric claim below is asserted in src/tests/roundingDepth.test.ts.

import type { DepthItem, DepthVisual } from "../../shared/depth";
import { depthLine, type DepthLineSpec } from "./RoundingDepthLine";

const line = (spec: DepthLineSpec): DepthVisual => ({ type: "custom", render: (onAnswer) => depthLine(spec, onAnswer) });

export const DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — Which way? ─────────────────────────
  {
    id: "rnd-leo-mia", level: "level1", purpose: "diagnose", startHere: true,
    title: "Who is right?",
    speakers: [
      { name: "Leo", says: ["$47$ to the nearest $10$ is $40$ — the tens digit is $4$."] },
      { name: "Mia", says: ["$47$ to the nearest $10$ is $50$ — it is closer to $50$."] },
    ],
    visual: line({ lo: "40", mid: "45", hi: "50", num: "47", pos: 0.7 }),
    question: ["Who is right?"],
    options: [
      { text: "Leo", misconception: "Reads the tens digit and stops — never looks at how far through the interval the number is" },
      { text: "Mia", correct: true },
      { text: "They are both right", misconception: "Thinks either neighbour is an acceptable answer" },
    ],
    answer: [
      "Mia is right: $47$ lies between $40$ and $50$.",
      "Halfway is $45$, and $47$ is past it, so it is closer to $50$.",
      "Leo stopped at the $4$ in the tens place — rounding means choosing the nearer of the two neighbours.",
    ],
    teacherNote: "Ask where Leo's 40 came from. Listen for 'the tens digit stays the same' — that is the habit to break.",
    ifNotSecure: "rnd-explain-down", ifSecure: "rnd-halfway",
  },
  {
    id: "rnd-two-neighbours", level: "level1", tool: "nearest", needs: ["n100"], purpose: "diagnose",
    title: "The two neighbours",
    question: ["$3{,}482$ is going to be rounded to the nearest $100$.", "Which two numbers is it between?"],
    options: [
      { text: "$3{,}400$ and $3{,}500$", correct: true },
      { text: "$3{,}480$ and $3{,}490$", misconception: "Uses the neighbours for the nearest 10, not the nearest 100" },
      { text: "$3{,}000$ and $4{,}000$", misconception: "Uses the neighbours for the nearest 1000, not the nearest 100" },
    ],
    answer: [
      "The nearest $100$ means the neighbours are multiples of $100$: $3{,}400$ and $3{,}500$.",
      "Halfway is $3{,}450$; $3{,}482$ is past it, so it rounds to $3{,}500$.",
    ],
    teacherNote: "Make the link explicit: the thing you round to decides the neighbours.",
    ifNotSecure: "rnd-leo-mia", ifSecure: "rnd-halfway",
  },
  {
    id: "rnd-halfway", level: "level1", purpose: "diagnose",
    title: "Exactly in the middle",
    visual: line({ lo: "300", mid: "350", hi: "400", num: "350", pos: 0.5 }),
    question: ["Round $350$ to the nearest $100$."],
    options: [
      { text: "$300$", misconception: "Thinks a number exactly halfway has not gone 'past' halfway, so it stays down" },
      { text: "$400$", correct: true },
      { text: "$350$", misconception: "Thinks a number that is already 'nice' does not need rounding" },
    ],
    answer: [
      "$350$ is exactly halfway between $300$ and $400$.",
      "By convention a number exactly halfway rounds up, so $350 \\to 400$.",
      "This is the same as the digit rule: the decider is $5$, and $5$ or more rounds up.",
    ],
    teacherNote: "It is a convention, not a discovery — say so. Ask what the digit rule says.",
    ifNotSecure: "rnd-leo-mia", ifSecure: "rnd-extend-range-50",
  },
  {
    id: "rnd-explain-down", level: "level1", purpose: "explain",
    title: "Explain this mistake",
    speakers: [{ name: "Sam", says: ["$86$ to the nearest $10$ is $80$, because I look at the $8$ and keep it."] }],
    visual: line({ lo: "80", mid: "85", hi: "90", num: "86", pos: 0.6 }),
    question: ["Explain what Sam has done wrong. What should the answer be?"],
    answer: [
      "Sam kept the tens digit and ignored the units.",
      "$86$ is between $80$ and $90$. Halfway is $85$, and $86$ is past it.",
      "So $86$ is closer to $90$: $86 \\to 90$.",
    ],
    teacherNote: "Listen for 'he didn't check which end it is closer to'. Draw the line if they struggle.",
    ifNotSecure: "rnd-leo-mia", ifSecure: "rnd-halfway",
  },
  {
    id: "rnd-explain-already", level: "level1", purpose: "explain",
    title: "Nothing to do?",
    speakers: [{ name: "Zara", says: ["I rounded $340$ to the nearest $10$ and it did not change — I must have done it wrong."] }],
    question: ["Is Zara right to worry? Explain."],
    answer: [
      "Zara is not wrong: $340$ is already a multiple of $10$.",
      "It is one of the two neighbours, so it rounds to itself: $340 \\to 340$.",
      "A number that is already on a mark does not move.",
    ],
    teacherNote: "Link to the line: the number sits exactly on an end. Ask for another number that would not change.",
    ifNotSecure: "rnd-leo-mia", ifSecure: "rnd-extend-many",
  },
  {
    id: "rnd-extend-asn", level: "level1", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["A number rounded to the nearest $10$ is bigger than the original number.", "Always, sometimes or never? Give examples."],
    answer: [
      "Sometimes.",
      "Bigger: $47 \\to 50$. Smaller: $43 \\to 40$. The same: $40 \\to 40$.",
      "Rounding up makes it bigger, rounding down makes it smaller, and a number on a mark does not change.",
    ],
    teacherNote: "Push for all three cases. Ask what makes a number round up rather than down.",
    ifNotSecure: "rnd-leo-mia", ifSecure: "rnd-extend-range-50",
  },
  {
    id: "rnd-extend-range-50", level: "level1", purpose: "extend",
    title: "Smallest and largest",
    question: ["A whole number is rounded to the nearest $100$ and the answer is $500$.", "What is the smallest it could be? What is the largest?"],
    answer: [
      "Smallest: $450$ (halfway rounds up, so $450 \\to 500$).",
      "Largest: $549$ ($550$ would round up to $600$).",
      "So every whole number from $450$ to $549$ rounds to $500$ — that is $100$ numbers.",
    ],
    teacherNote: "Many will say 449 or 550. Use the line: where does the 'round to 500' region start and stop?",
    ifNotSecure: "rnd-halfway", ifSecure: "rnd-extend-range-dp",
  },

  // ───────────────────────── Level 2 — Which digit decides? ─────────────────────────
  {
    id: "rnd-keep-rest", level: "level2", purpose: "diagnose", startHere: true,
    title: "Who is right?",
    speakers: [
      { name: "Nina", says: ["$31.04$ to the nearest $10$ is $30.04$."] },
      { name: "Omar", says: ["$31.04$ to the nearest $10$ is $30$."] },
    ],
    visual: line({ lo: "30", mid: "35", hi: "40", num: "31.04", pos: 0.104 }),
    question: ["Who is right?"],
    options: [
      { text: "Nina", misconception: "Rounds the digit but keeps everything else — the decimal part is carried along untouched" },
      { text: "Omar", correct: true },
      { text: "They are both right", misconception: "Thinks the decimal part may stay if it is small" },
    ],
    answer: [
      "Omar is right: $31.04$ is between $30$ and $40$, and below halfway ($35$), so it rounds to $30$.",
      "Rounding to the nearest $10$ means the answer is a multiple of $10$ — $30.04$ is not one.",
      "Everything after the rounding digit is dropped (or replaced by zeros), never kept.",
    ],
    teacherNote: "Common when decimals meet whole-number rounding. Ask: 'Is 30.04 a multiple of 10?'",
    ifNotSecure: "rnd-explain-down", ifSecure: "rnd-explain-priya",
  },
  {
    id: "rnd-digit-nearest", level: "level2", tool: "nearest", needs: ["n100"], purpose: "diagnose",
    title: "Which digit decides?",
    question: ["Round $3{,}482$ to the nearest $100$.", "Which digit decides whether to round up or down?"],
    options: [
      { text: "$3$", misconception: "Looks at the first digit instead of the one after the rounding digit" },
      { text: "$4$", misconception: "Confuses the rounding digit (the one being rounded) with the decider" },
      { text: "$8$", correct: true },
      { text: "$2$", misconception: "Looks at the last digit" },
    ],
    answer: [
      "The rounding digit is the hundreds digit, $4$. The decider is the digit right after it: $8$.",
      "$8$ is $5$ or more, so round up: $3{,}482 \\to 3{,}500$.",
    ],
    teacherNote: "Have them name the rounding digit first, then the decider — two different digits.",
    ifNotSecure: "rnd-two-neighbours", ifSecure: "rnd-chain",
  },
  {
    id: "rnd-digit-dp", level: "level2", tool: "dp", needs: ["dp2"], purpose: "diagnose",
    title: "Which digit decides?",
    question: ["Round $6.738$ to $2$ decimal places.", "Which digit decides whether to round up or down?"],
    options: [
      { text: "$7$", misconception: "Looks at the first decimal digit instead of the one after the rounding digit" },
      { text: "$3$", misconception: "Confuses the rounding digit (the last one kept) with the decider" },
      { text: "$8$", correct: true },
      { text: "$6$", misconception: "Looks at the whole-number digit" },
    ],
    answer: [
      "$2$ d.p. means keeping two digits after the point: the rounding digit is $3$. The decider is the next digit: $8$.",
      "$8$ is $5$ or more, so round up: $6.738 \\to 6.74$.",
    ],
    teacherNote: "Have them draw the dotted line after the last digit they keep.",
    ifNotSecure: "rnd-keep-rest", ifSecure: "rnd-explain-trail",
  },
  {
    id: "rnd-cutoff", level: "level2", tool: "dp", needs: ["dp2"], purpose: "diagnose",
    title: "Round or cut off?",
    question: ["Round $2.678$ to $2$ decimal places."],
    options: [
      { text: "$2.67$", misconception: "Chops the number off after two decimal places without looking at the decider" },
      { text: "$2.68$", correct: true },
      { text: "$2.7$", misconception: "Rounds to 1 decimal place instead of 2" },
    ],
    answer: [
      "The rounding digit is $7$ and the decider is $8$, which is $5$ or more, so round up.",
      "$2.678 \\to 2.68$.",
      "Chopping off after two decimal places gives $2.67$ — that is truncating, not rounding.",
    ],
    teacherNote: "Ask them to put 2.67 and 2.68 on a line and place 2.678 — which is it nearer?",
    ifNotSecure: "rnd-digit-dp", ifSecure: "rnd-explain-trail",
  },
  {
    id: "rnd-chain", level: "level2", tool: "nearest", needs: ["n1000"], purpose: "explain",
    title: "Round, round, round",
    speakers: [{ name: "Tia", says: ["$3{,}462$ to the nearest $1000$: first to the nearest $10$ is $3{,}460$, then to the nearest $100$ is $3{,}500$, then to the nearest $1000$ is $4{,}000$."] }],
    question: ["Is Tia's answer right? Explain what she did."],
    answer: [
      "Tia's answer, $4{,}000$, is wrong. $3{,}462$ rounds to $3{,}000$.",
      "She rounded in stages, and each rounding built on the last one.",
      "Only the decider matters: the hundreds digit is $4$, which is less than $5$, so round down once.",
    ],
    teacherNote: "Draw 3000 — 3500 — 4000 and mark 3462. It never gets past the halfway mark.",
    ifNotSecure: "rnd-digit-nearest", ifSecure: "rnd-explain-double",
  },
  {
    id: "rnd-explain-priya", level: "level2", purpose: "explain",
    title: "Explain this mistake",
    speakers: [{ name: "Priya", says: ["$482.6$ to the nearest $100$ is $500.6$."] }],
    question: ["Explain what Priya has done. What should the answer be?"],
    answer: [
      "Priya rounded the hundreds digit but kept the rest of the number.",
      "The decider is $8$, so round up to $500$ — and everything after the rounding digit is dropped.",
      "$482.6 \\to 500$. The answer is a multiple of $100$, not $500.6$.",
    ],
    teacherNote: "Same misconception as Nina and Omar, one step further out. Ask what the answer should look like.",
    ifNotSecure: "rnd-keep-rest", ifSecure: "rnd-extend-zero",
  },
  {
    id: "rnd-explain-trail", level: "level2", tool: "dp", needs: ["dp2"], purpose: "explain",
    title: "The missing zero",
    speakers: [{ name: "Kai", says: ["$4.296$ to $2$ d.p. is $4.3$."] }],
    question: ["Is Kai right? Explain."],
    answer: [
      "Kai has the right value but not the right accuracy.",
      "$4.296 \\to 4.30$: the rounding digit $9$ goes up to $10$, which carries into the tenths.",
      "The final zero stays — it shows the answer is accurate to $2$ decimal places. $4.3$ only shows $1$.",
    ],
    teacherNote: "Ask what the 0 is telling the reader. Link to money: £4.3 is not how we write £4.30.",
    ifNotSecure: "rnd-cutoff", ifSecure: "rnd-extend-convince",
  },
  {
    id: "rnd-extend-zero", level: "level2", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["A number rounded to the nearest $10$ always ends in $0$.", "Always, sometimes or never? What about $47.3$?"],
    answer: [
      "Always.",
      "The answer is a multiple of $10$, so its last digit (units) is $0$.",
      "$47.3 \\to 50$, not $50.3$ — the decimal part does not survive rounding to the nearest $10$.",
    ],
    teacherNote: "Connect back to Nina's 30.04: a multiple of 10 cannot have a decimal part.",
    ifNotSecure: "rnd-keep-rest", ifSecure: "rnd-extend-range-dp",
  },
  {
    id: "rnd-extend-many", level: "level2", purpose: "extend",
    title: "How many?",
    question: ["How many whole numbers round to $70$ when rounded to the nearest $10$?", "What if the numbers can have one decimal place?"],
    answer: [
      "Whole numbers: $65, 66, \\dots, 74$ — that is $10$ numbers ($65$ rounds up, $75$ rounds to $80$).",
      "With one decimal place: from $65.0$ up to $74.9$ — that is $100$ numbers.",
      "In general, the numbers that round to $70$ form an interval, not a list.",
    ],
    teacherNote: "Look for 'there are two ends of the interval' and whether they include or exclude the ends.",
    ifNotSecure: "rnd-explain-already", ifSecure: "rnd-extend-range-dp",
  },

  // ───────────────────────── Level 3 — Edge cases & accuracy ─────────────────────────
  {
    id: "rnd-nines", level: "level3", purpose: "diagnose", startHere: true,
    title: "Carrying over",
    question: ["Round $396$ to the nearest $10$."],
    options: [
      { text: "$390$", misconception: "Cuts off after the tens digit without looking at the decider" },
      { text: "$3{,}100$", misconception: "Adds 1 to the 9 and writes '10' in the tens place without carrying" },
      { text: "$400$", correct: true },
    ],
    answer: [
      "The rounding digit is $9$ and the decider is $6$, so round up.",
      "$9 + 1 = 10$, so the $10$ carries into the hundreds: $396 \\to 400$.",
      "$396$ is $4$ away from $400$ but $6$ away from $390$.",
    ],
    teacherNote: "Draw the line 390 — 400. Rounding up a 9 always carries — ask where else that happens.",
    ifNotSecure: "rnd-explain-down", ifSecure: "rnd-extend-range-dp",
  },
  {
    id: "rnd-zero-sf", level: "level3", tool: "sf", needs: ["sf2"], purpose: "diagnose",
    title: "Which zeros count?",
    question: ["Round $0.00472$ to $2$ significant figures."],
    options: [
      { text: "$0.0$", misconception: "Counts the leading zeros as significant figures" },
      { text: "$0.0047$", correct: true },
      { text: "$0.005$", misconception: "Rounds to 1 significant figure instead of 2" },
    ],
    answer: [
      "The first significant figure is the first non-zero digit: the $4$.",
      "The two significant figures are $4$ and $7$; the decider is $2$, so round down.",
      "$0.00472 \\to 0.0047$. Leading zeros are only place-holders.",
    ],
    teacherNote: "Colour the first non-zero digit. Ask: how many sig figs does 0.0047 have?",
    ifNotSecure: "rnd-digit-nearest", ifSecure: "rnd-extend-sfdp",
  },
  {
    id: "rnd-placeholder-sf", level: "level3", tool: "sf", needs: ["sf2"], purpose: "diagnose",
    title: "Keep the size",
    question: ["Round $4{,}726$ to $2$ significant figures."],
    options: [
      { text: "$47$", misconception: "Drops the digits instead of replacing them with zeros, so the size of the number is lost" },
      { text: "$4{,}700$", correct: true },
      { text: "$4{,}730$", misconception: "Rounds to 3 significant figures instead of 2" },
    ],
    answer: [
      "The two significant figures are $4$ and $7$; the decider is $2$, so round down.",
      "The remaining places are filled with zeros as place-holders: $4{,}726 \\to 4{,}700$.",
      "$47$ is a hundred times too small.",
    ],
    teacherNote: "Estimate: is the answer about 4,700 or about 47? The size must survive rounding.",
    ifNotSecure: "rnd-zero-sf", ifSecure: "rnd-extend-sfdp",
  },
  {
    id: "rnd-nine-dp", level: "level3", tool: "dp", needs: ["dp2"], purpose: "diagnose",
    title: "Carrying over",
    question: ["Round $0.0996$ to $2$ decimal places."],
    options: [
      { text: "$0.09$", misconception: "Cuts off after two decimal places without looking at the decider" },
      { text: "$0.10$", correct: true },
      { text: "$0.1$", misconception: "Drops the trailing zero, losing the accuracy" },
    ],
    answer: [
      "The rounding digit is $9$ and the decider is $9$, so round up.",
      "$0.09 + 0.01 = 0.10$: the carry moves into the tenths.",
      "The $0$ stays — it shows the answer is accurate to $2$ decimal places.",
    ],
    teacherNote: "Draw the line from 0.09 to 0.10 and place 0.0996 close to the top.",
    ifNotSecure: "rnd-nines", ifSecure: "rnd-extend-convince",
  },
  {
    id: "rnd-explain-double", level: "level3", purpose: "explain",
    title: "Round twice?",
    speakers: [{ name: "Eli", says: ["Rounding $2.46$ to $1$ d.p. and then to the nearest whole number gives the same answer as rounding $2.46$ straight to the nearest whole number."] }],
    question: ["Test Eli's claim. Is it true?"],
    answer: [
      "Eli's claim is false.",
      "Straight to the nearest whole number: $2.46 \\to 2$ (the decider is $4$).",
      "Via $1$ d.p.: $2.46 \\to 2.5 \\to 3$.",
      "The first rounding creates a new halfway case that was not there originally — always round from the original number.",
    ],
    teacherNote: "Ask which answer is right: 2.46 is nearer 2 than 3. This links to why rounding in stages (as Tia did) goes wrong.",
    ifNotSecure: "rnd-chain", ifSecure: "rnd-extend-range-dp",
  },
  {
    id: "rnd-explain-zoe", level: "level3", tool: "sf", needs: ["sf2"], purpose: "explain",
    title: "Explain this mistake",
    speakers: [{ name: "Zoe", says: ["$0.0384$ to $2$ significant figures is $0.04$."] }],
    question: ["How many significant figures has Zoe used? What should the answer be?"],
    answer: [
      "$0.04$ has only $1$ significant figure: Zoe rounded to $1$ s.f. instead of $2$.",
      "The first significant figure is the $3$, the second is $8$, and the decider is $4$, so round down.",
      "$0.0384 \\to 0.038$.",
    ],
    teacherNote: "Have them underline the first non-zero digit. Ask Zoe where she started counting.",
    ifNotSecure: "rnd-zero-sf", ifSecure: "rnd-extend-sfdp",
  },
  {
    id: "rnd-extend-range-dp", level: "level3", purpose: "extend",
    title: "Smallest and largest",
    question: ["A number is rounded to $1$ decimal place and the answer is $2.4$.", "What is the smallest value it could be? Which value can it not quite reach?"],
    answer: [
      "Smallest: $2.35$ ($2.35$ rounds up to $2.4$).",
      "It cannot reach $2.45$ — that rounds up to $2.5$. So the number lies in $2.35 \\le x < 2.45$.",
      "The interval has width $0.1$ and $2.4$ is in the middle.",
    ],
    teacherNote: "This is the seed of error intervals — draw the interval on a number line.",
    ifNotSecure: "rnd-extend-range-50",
  },
  {
    id: "rnd-extend-sfdp", level: "level3", tool: "sf", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["Rounding to $3$ significant figures is more accurate than rounding to $2$ decimal places.", "Always, sometimes or never? Try $0.00472$ and $472.3$."],
    answer: [
      "Sometimes.",
      "$0.00472$: $3$ s.f. is $0.00472$ but $2$ d.p. is $0.00$ — significant figures is more accurate.",
      "$472.3$: $3$ s.f. is $472$ but $2$ d.p. is $472.30$ — decimal places is more accurate.",
    ],
    teacherNote: "Draw out: the two measures count from different places.",
    ifNotSecure: "rnd-explain-zoe",
  },
  {
    id: "rnd-extend-convince", level: "level3", tool: "dp", needs: ["dp2"], purpose: "extend",
    title: "Convince me",
    question: ["Convince me that $2.995$ to $2$ decimal places is $3.00$ — not $2.99$ and not $3.0$."],
    answer: [
      "The rounding digit is the second $9$ and the decider is $5$, so round up.",
      "$2.99 + 0.01 = 3.00$.",
      "It must be written $3.00$ so the reader knows it is accurate to $2$ decimal places; $3.0$ only shows $1$.",
    ],
    teacherNote: "A good convincing argument uses the line from 2.99 to 3.00 and says 2.995 is exactly halfway.",
    ifNotSecure: "rnd-nine-dp",
  },
];
