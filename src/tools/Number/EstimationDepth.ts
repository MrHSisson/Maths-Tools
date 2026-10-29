// Depth bank for Estimation — fixed, hand-written questions (see src/shared/depth.ts). A wrong option names its
// misconception in words and, where one exists, the shared tag (src/shared/misconceptions.ts). The items use their own
// numbers, never those of the Estimation deck's practice questions and boards, so a Depth check asks something new.
//   1  Whole numbers   round each number to 1 s.f., then calculate
//   2  Decimals        the first significant figure of a small decimal; dividing by a decimal
//   3  Fractions       round every number first, then calculate the top and bottom
// Every number below is checked in src/tests/estimationDepth.test.ts.

import type { DepthItem } from "../../shared/depth";

export const ESTIMATION_DEPTH: DepthItem[] = [
  // ── Level 1 ──
  {
    id: "est-who-l1", level: "level1", purpose: "diagnose", startHere: true, title: "Who estimated well?",
    speakers: [
      { name: "Ruby", says: ["$39 \\times 72 \\approx 30 \\times 70 = 2100$"] },
      { name: "Kofi", says: ["$39 \\times 72 \\approx 40 \\times 70 = 2800$"] },
      { name: "Mei", says: ["$39 \\times 72 \\approx 40 \\times 70 = 280$"] },
    ],
    question: ["Who has estimated $39 \\times 72$ correctly?"],
    options: [
      { text: "Ruby", misconception: "Drops the last digit instead of rounding: $39$ is nearer $40$ than $30$.", tag: "estimation-round-truncate" },
      { text: "Kofi", correct: true },
      { text: "Mei", misconception: "Loses a zero when multiplying: $4 \\times 7 = 28$, so $40 \\times 70 = 2800$.", tag: "estimation-calc-zeros" },
    ],
    answer: ["Round each number to 1 significant figure: $39 \\to 40$ and $72 \\to 70$.", "$40 \\times 70 = 2800$, so $39 \\times 72 \\approx 2800$."],
    teacherNote: "Ask Mei's supporters to say $40 \\times 70$ as $4 \\times 7$ tens times tens. Listen for 'round down because it is the first digit'.",
    ifNotSecure: "est-round-386", ifSecure: "est-asn-round-up",
  },
  {
    id: "est-round-386", level: "level1", purpose: "diagnose", title: "One significant figure",
    question: ["What is $386$ rounded to 1 significant figure?"],
    options: [
      { text: "$400$", correct: true },
      { text: "$390$", misconception: "Rounds to the nearest 10 instead of 1 significant figure.", tag: "estimation-round-wrong-place" },
      { text: "$300$", misconception: "Keeps the first digit and drops the rest instead of rounding.", tag: "estimation-round-truncate" },
      { text: "$4$", misconception: "Forgets the zeros that keep the place value: $386$ is about $400$, not $4$." },
    ],
    answer: ["The first significant figure is the $3$ in the hundreds column.", "The next digit, $8$, rounds it up: $386 \\to 400$."],
    teacherNote: "Ask which two hundreds $386$ sits between, and which it is nearer.",
  },
  {
    id: "est-mistake-587", level: "level1", purpose: "explain", title: "Ben's estimate",
    working: { intro: "Ben estimated $587 \\div 29$.", lines: ["587 \\to 590, \\quad 29 \\to 30", "590 \\div 30 \\approx 19.7"], wrongLine: 0 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: ["$587$ to 1 significant figure is $600$, not $590$: Ben rounded to the nearest 10.", "$600 \\div 30 = 20$, so $587 \\div 29 \\approx 20$: a number we can work out in our heads."],
    teacherNote: "The point of rounding to 1 s.f. is a calculation you can do mentally. Ask whether $590 \\div 30$ is easy.",
  },
  {
    id: "est-asn-round-up", level: "level1", purpose: "extend", title: "Both numbers rounded up",
    question: ["If both numbers are rounded up, the estimate is bigger than the exact answer.", "Always, sometimes or never true?"],
    answer: [
      "Sometimes. For $+$ and $\\times$ with positive numbers, rounding both up always gives an estimate that is too big.",
      "For $-$ it can go either way: $47 - 25 \\approx 50 - 30 = 20$, but the exact answer is $22$.",
    ],
    teacherNote: "Push for an example with $\\div$ too: rounding the divisor up makes the answer smaller.",
  },
  {
    id: "est-round-649", level: "level1", purpose: "diagnose", title: "Rounding 649",
    speakers: [
      { name: "Leo", says: ["$649 \\to 650 \\to 700$"] },
      { name: "Priya", says: ["$649 \\to 600$"] },
      { name: "Sam", says: ["$649 \\to 650$"] },
    ],
    question: ["Who has rounded $649$ to 1 significant figure correctly?"],
    options: [
      { text: "Leo", misconception: "Rounds in two steps: $649 \\to 650$ makes a new $5$ that then rounds up, but only the $4$ after the $6$ decides.", tag: "estimation-round-twice" },
      { text: "Priya", correct: true },
      { text: "Sam", misconception: "Rounds to the nearest 10 ($2$ significant figures) instead of 1 significant figure.", tag: "estimation-round-wrong-place" },
    ],
    answer: ["The first significant figure is the $6$ in the hundreds column. The digit after it, the $4$, decides.", "$4$ is less than $5$, so $649 \\to 600$. Round once, looking only at that digit."],
    teacherNote: "Ask Leo's supporters which digit decides. $649$ is below $650$, the halfway point between $600$ and $700$.",
    ifNotSecure: "est-round-386", ifSecure: "est-calc-slip",
  },
  {
    id: "est-calc-slip", level: "level1", purpose: "explain", title: "The calculator slip",
    question: ["Kofi types $36 \\times 58$ into his calculator and gets $208.8$.", "Use an estimate to show that this cannot be right."],
    answer: [
      "Round each number to 1 significant figure: $36 \\to 40$ and $58 \\to 60$.",
      "$40 \\times 60 = 2400$, so $36 \\times 58$ should be about $2400$.",
      "$208.8$ is far too small. Kofi has missed a digit: the exact answer is $2088$.",
    ],
    teacherNote: "Ask why an estimate still matters when calculators are allowed. Listen for 'it checks the size of the answer'.",
  },
  {
    id: "est-near-equal", level: "level1", purpose: "extend", title: "Nearly equal numbers",
    question: ["Rounding to 1 significant figure always gives an estimate close to the exact answer.", "Always, sometimes or never true? Try $502 - 498$."],
    answer: [
      "Sometimes. $502 - 498 \\approx 500 - 500 = 0$, but the exact answer is $4$: the estimate is nowhere near.",
      "Subtracting two numbers that are nearly equal cancels almost everything, so a small rounding change is a large share of what is left.",
    ],
    teacherNote: "Ask for another pair of numbers that behave like this. Does the estimate still tell us anything?",
  },
  // ── Level 2 ──
  {
    id: "est-who-028", level: "level2", purpose: "diagnose", startHere: true, title: "A small decimal",
    speakers: [
      { name: "Amara", says: ["$0.28$ rounds to $0$."] },
      { name: "Leo", says: ["$0.28$ rounds to $0.3$."] },
    ],
    question: ["Who is right about $0.28$ to 1 significant figure?"],
    options: [
      { text: "Amara", misconception: "Treats the zero before the point as the first significant figure, so the decimal rounds to 0.", tag: "estimation-leading-zeros" },
      { text: "Leo", correct: true },
      { text: "Neither: it is $0.2$", misconception: "Keeps the first figure and drops the rest instead of rounding.", tag: "estimation-round-truncate" },
    ],
    answer: ["The first significant figure is the first digit that is not zero: the $2$.", "The next digit, $8$, rounds it up: $0.28 \\to 0.3$."],
    teacherNote: "Ask what an estimate of $0$ would tell us about a calculation such as $9.1 \\times 0.28$.",
    ifNotSecure: "est-round-386", ifSecure: "est-divide-half",
  },
  {
    id: "est-divide-half", level: "level2", purpose: "diagnose", title: "Dividing by a decimal",
    question: ["Estimate $8.2 \\div 0.51$."],
    options: [
      { text: "$16$", correct: true },
      { text: "$4$", misconception: "Halves instead of dividing by a half: dividing by a number less than 1 makes the answer bigger.", tag: "estimation-divide-decimal" },
      { text: "$8$", misconception: "Rounds $0.51$ to $1$, a whole number, instead of to 1 significant figure.", tag: "estimation-round-to-whole" },
    ],
    answer: ["$8.2 \\to 8$ and $0.51 \\to 0.5$.", "$8 \\div 0.5$ asks how many halves there are in $8$: there are $16$."],
    teacherNote: "Draw eight bars split in halves if the class doubts $16$.",
  },
  {
    id: "est-mistake-031", level: "level2", purpose: "explain", title: "Jamal's estimate",
    working: { intro: "Jamal estimated $7.2 \\times 0.31$.", lines: ["7.2 \\to 7, \\quad 0.31 \\to 0", "7 \\times 0 = 0"], wrongLine: 0 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: ["$0.31$ to 1 significant figure is $0.3$, not $0$.", "$7 \\times 0.3 = 2.1$, so $7.2 \\times 0.31 \\approx 2.1$. An estimate of $0$ tells us nothing."],
    teacherNote: "Ask: is $7.2 \\times 0.31$ really close to nothing? Roughly how many lots of $0.3$ is it?",
  },
  {
    id: "est-make-20", level: "level2", purpose: "extend", title: "Make an estimate of twenty",
    question: ["Write a calculation with decimals whose estimate is $4 \\div 0.2$.", "Now write two different calculations that also have an estimate of $20$."],
    answer: ["For example $3.9 \\div 0.21$ or $4.2 \\div 0.19$: each rounds to $4 \\div 0.2 = 20$.", "Others: $9.6 \\times 2.1 \\approx 10 \\times 2 = 20$ and $41 \\div 1.9 \\approx 40 \\div 2 = 20$."],
    teacherNote: "Check each one by rounding it back. Which number in the class's examples is closest to its rounded value?",
  },
  {
    id: "est-size-sense", level: "level2", purpose: "diagnose", title: "Does the size make sense?",
    question: ["Estimate $0.53 \\times 0.062$."],
    options: [
      { text: "$0.03$", correct: true },
      { text: "$0.3$", misconception: "Rounds $0.062$ to $0.6$, losing the zero that holds its place.", tag: "estimation-answer-size" },
      { text: "$0.003$", misconception: "Puts one decimal place too many in the answer: $5 \\times 6 = 30$, and $0.5 \\times 0.06 = 0.030$.", tag: "estimation-answer-size" },
      { text: "$3$", misconception: "Takes $5 \\times 6 = 30$ and moves the decimal point one place instead of three.", tag: "estimation-answer-size" },
    ],
    answer: ["Round to 1 significant figure: $0.53 \\to 0.5$ and $0.062 \\to 0.06$.", "$5 \\times 6 = 30$. Three decimal places in $0.5 \\times 0.06$ make $0.030$, so the estimate is $0.03$."],
    teacherNote: "Ask the $0.3$ group to say $0.5 \\times 0.06$ as 'half of six hundredths'. Does $0.3$ sound like a sensible size?",
    ifNotSecure: "est-who-028", ifSecure: "est-over-under",
  },
  {
    id: "est-over-under", level: "level2", purpose: "extend", title: "Over or under?",
    question: ["Mei rounds one number up and the other down when she estimates a product. Her estimate is bigger than the exact answer.", "Always, sometimes or never true?"],
    answer: [
      "Sometimes. $4.4 \\times 3.6 \\approx 4 \\times 4 = 16$, and the exact answer is $15.84$: the estimate is bigger.",
      "But $4.6 \\times 3.4 \\approx 5 \\times 3 = 15$, and the exact answer is $15.64$: the estimate is smaller.",
      "It depends on which number is changed by the larger share of its own size.",
    ],
    teacherNote: "Ask for examples that go each way. Which number moved the most compared with its size?",
  },
  {
    id: "est-make-03", level: "level2", purpose: "extend", title: "Make an estimate of 0.3",
    question: ["Write a calculation with decimals whose estimate is $0.6 \\times 0.5$.", "Now write two different calculations that also have an estimate of $0.3$."],
    answer: [
      "For example $0.64 \\times 0.46$: it rounds to $0.6 \\times 0.5 = 0.3$.",
      "Others: $2.9 \\times 0.11 \\approx 3 \\times 0.1 = 0.3$ and $0.91 \\div 3.1 \\approx 0.9 \\div 3 = 0.3$.",
      "Other operations work too: $0.61 - 0.28 \\approx 0.6 - 0.3 = 0.3$.",
    ],
    teacherNote: "Check each one by rounding it back. Which example is furthest from its rounded version?",
  },
  // ── Level 3 ──
  {
    id: "est-frac-57", level: "level3", purpose: "diagnose", startHere: true, title: "A fraction to estimate",
    question: ["Estimate $\\dfrac{24 + 33}{12}$."],
    options: [
      { text: "$5$", correct: true },
      { text: "$6$", misconception: "Adds first ($57$), then rounds the result ($60$) instead of rounding every number first.", tag: "estimation-round-result" },
      { text: "$4.75$", misconception: "Works out the exact answer instead of estimating." },
      { text: "$50$", misconception: "Forgets to divide by the denominator." },
    ],
    answer: ["Round every number first: $24 \\to 20$, $33 \\to 30$, $12 \\to 10$.", "$\\dfrac{20 + 30}{10} = \\dfrac{50}{10} = 5$."],
    teacherNote: "Ask the $6$ group where their $60$ came from. Rounding must happen before any calculating.",
    ifNotSecure: "est-who-l1", ifSecure: "est-asn-ten-percent",
  },
  {
    id: "est-who-frac", level: "level3", purpose: "diagnose", title: "Who is right?",
    speakers: [
      { name: "Priya", says: ["$\\dfrac{61 \\times 39}{29} \\approx \\dfrac{60 \\times 40}{30} = 80$"] },
      { name: "Ben", says: ["$\\dfrac{61 \\times 39}{29} \\approx \\dfrac{60 \\times 40}{30} = 800$"] },
    ],
    question: ["Who has estimated correctly?"],
    options: [
      { text: "Priya", correct: true },
      { text: "Ben", misconception: "Gains a zero: $60 \\times 40 = 2400$ and $2400 \\div 30 = 80$.", tag: "estimation-calc-zeros" },
    ],
    answer: ["$60 \\times 40 = 2400$, and $2400 \\div 30 = 80$.", "Or simplify first: $60 \\div 30 = 2$, then $2 \\times 40 = 80$."],
    teacherNote: "Ask for the quickest route. Cancelling before multiplying avoids the big number.",
  },
  {
    id: "est-mistake-83", level: "level3", purpose: "explain", title: "Mei's estimate",
    working: { intro: "Mei estimated $\\dfrac{47 + 36}{23}$.", lines: ["47 + 36 = 83", "83 \\to 80, \\quad 23 \\to 20", "80 \\div 20 = 4"], wrongLine: 0 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: ["Mei added before rounding. To estimate, round every number first: $47 \\to 50$, $36 \\to 40$, $23 \\to 20$.", "$\\dfrac{50 + 40}{20} = \\dfrac{90}{20} = 4.5$."],
    teacherNote: "Both answers are near the exact $3.61$; the mistake is the method. Ask why the method matters on a non-calculator paper.",
  },
  {
    id: "est-asn-ten-percent", level: "level3", purpose: "extend", title: "How close is an estimate?",
    question: ["An estimate made by rounding to 1 significant figure is always within $10\\%$ of the exact answer.", "Always, sometimes or never true?"],
    answer: [
      "Sometimes. $\\dfrac{61 \\times 39}{29} \\approx 80$ and the exact answer is $82$: within $10\\%$.",
      "But $\\dfrac{15 \\times 15}{15} \\approx \\dfrac{20 \\times 20}{20} = 20$ and the exact answer is $15$: about $33\\%$ out.",
    ],
    teacherNote: "Ask which numbers make rounding to 1 s.f. least accurate (those just past a half, like $15$ or $150$).",
  },
  {
    id: "est-part-way", level: "level3", purpose: "explain", title: "Stopping part-way",
    working: { intro: "Priya estimated $\\dfrac{46 + 33}{39}$.", lines: ["46 \\to 50, \\quad 33 \\to 30", "\\dfrac{50 + 30}{39}", "\\dfrac{80}{39} \\approx 2.05"], wrongLine: 1 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: [
      "Priya rounded $46$ and $33$ but left $39$ as it was. Every number is rounded to 1 significant figure, the denominator too.",
      "$39 \\to 40$, so $\\dfrac{50 + 30}{40} = \\dfrac{80}{40} = 2$.",
    ],
    teacherNote: "Ask what $80 \\div 39$ needs that $80 \\div 40$ does not. The point of rounding is a calculation you can do in your head.",
  },
];
