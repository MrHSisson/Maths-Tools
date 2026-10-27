// Depth bank for Estimation — fixed, hand-written questions (see src/shared/depth.ts). Built together with the
// hand-picked practice questions of the Estimation deck (src/decks/estimationBank.ts): a wrong option names its
// misconception in words and, where one exists, the shared tag (src/shared/misconceptions.ts).
//   1  Whole numbers   round each number to 1 s.f., then calculate
//   2  Decimals        the first significant figure of a small decimal; dividing by a decimal
//   3  Fractions       round every number first, then calculate the top and bottom
// Every number below is checked in src/tests/estimationDepth.test.ts.

import type { DepthItem } from "../../shared/depth";

export const ESTIMATION_DEPTH: DepthItem[] = [
  // ── Level 1 ──
  {
    id: "est-who-48x31", level: "level1", purpose: "diagnose", startHere: true, title: "Who estimated well?",
    speakers: [
      { name: "Ruby", says: ["$48 \\times 31 \\approx 40 \\times 30 = 1200$"] },
      { name: "Kofi", says: ["$48 \\times 31 \\approx 50 \\times 30 = 1500$"] },
      { name: "Mei", says: ["$48 \\times 31 \\approx 50 \\times 30 = 150$"] },
    ],
    question: ["Who has estimated $48 \\times 31$ correctly?"],
    options: [
      { text: "Ruby", misconception: "Drops the last digit instead of rounding: $48$ is nearer $50$ than $40$.", tag: "estimation-round-truncate" },
      { text: "Kofi", correct: true },
      { text: "Mei", misconception: "Loses a zero when multiplying: $5 \\times 3 = 15$, so $50 \\times 30 = 1500$.", tag: "estimation-calc-zeros" },
    ],
    answer: ["Round each number to 1 significant figure: $48 \\to 50$ and $31 \\to 30$.", "$50 \\times 30 = 1500$, so $48 \\times 31 \\approx 1500$."],
    teacherNote: "Ask Mei's supporters to say $50 \\times 30$ as $5 \\times 3$ tens times tens. Listen for 'round down because it is the first digit'.",
    ifNotSecure: "est-round-794", ifSecure: "est-asn-round-up",
  },
  {
    id: "est-round-794", level: "level1", purpose: "diagnose", title: "One significant figure",
    question: ["What is $794$ rounded to 1 significant figure?"],
    options: [
      { text: "$800$", correct: true },
      { text: "$790$", misconception: "Rounds to the nearest 10 instead of 1 significant figure.", tag: "estimation-round-wrong-place" },
      { text: "$700$", misconception: "Keeps the first digit and drops the rest instead of rounding.", tag: "estimation-round-truncate" },
      { text: "$8$", misconception: "Forgets the zeros that keep the place value: $794$ is about $800$, not $8$." },
    ],
    answer: ["The first significant figure is the $7$ in the hundreds column.", "The next digit, $9$, rounds it up: $794 \\to 800$."],
    teacherNote: "Ask which two hundreds $794$ sits between, and which it is nearer.",
  },
  {
    id: "est-mistake-587", level: "level1", purpose: "explain", title: "Ben's estimate",
    working: { intro: "Ben estimated $587 \\div 31$.", lines: ["587 \\to 590, \\quad 31 \\to 30", "590 \\div 30 \\approx 19.7"], wrongLine: 0 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: ["$587$ to 1 significant figure is $600$, not $590$: Ben rounded to the nearest 10.", "$600 \\div 30 = 20$, so $587 \\div 31 \\approx 20$: a number we can work out in our heads."],
    teacherNote: "The point of rounding to 1 s.f. is a calculation you can do mentally. Ask whether $590 \\div 30$ is easy.",
  },
  {
    id: "est-asn-round-up", level: "level1", purpose: "extend", title: "Both numbers rounded up",
    question: ["If both numbers are rounded up, the estimate is bigger than the exact answer.", "Always, sometimes or never true?"],
    answer: [
      "Sometimes. For $+$ and $\\times$ with positive numbers, rounding both up always gives an estimate that is too big.",
      "For $-$ it can go either way: $48 - 26 \\approx 50 - 30 = 20$, but the exact answer is $22$.",
    ],
    teacherNote: "Push for an example with $\\div$ too: rounding the divisor up makes the answer smaller.",
  },
  // ── Level 2 ──
  {
    id: "est-who-039", level: "level2", purpose: "diagnose", startHere: true, title: "A small decimal",
    speakers: [
      { name: "Amara", says: ["$0.39$ rounds to $0$."] },
      { name: "Leo", says: ["$0.39$ rounds to $0.4$."] },
    ],
    question: ["Who is right about $0.39$ to 1 significant figure?"],
    options: [
      { text: "Amara", misconception: "Treats the zero before the point as the first significant figure, so the decimal rounds to 0.", tag: "estimation-leading-zeros" },
      { text: "Leo", correct: true },
      { text: "Neither: it is $0.3$", misconception: "Keeps the first figure and drops the rest instead of rounding.", tag: "estimation-round-truncate" },
    ],
    answer: ["The first significant figure is the first digit that is not zero: the $3$.", "The next digit, $9$, rounds it up: $0.39 \\to 0.4$."],
    teacherNote: "Ask what an estimate of $0$ would tell us about $4.8 \\times 0.39$.",
    ifNotSecure: "est-round-794", ifSecure: "est-divide-half",
  },
  {
    id: "est-divide-half", level: "level2", purpose: "diagnose", title: "Dividing by a decimal",
    question: ["Estimate $6.1 \\div 0.48$."],
    options: [
      { text: "$12$", correct: true },
      { text: "$3$", misconception: "Halves instead of dividing by a half: dividing by a number less than 1 makes the answer bigger.", tag: "estimation-divide-decimal" },
      { text: "$6$", misconception: "Rounds $0.48$ to $1$, a whole number, instead of to 1 significant figure.", tag: "estimation-round-to-whole" },
    ],
    answer: ["$6.1 \\to 6$ and $0.48 \\to 0.5$.", "$6 \\div 0.5$ asks how many halves there are in $6$: there are $12$."],
    teacherNote: "Draw six bars split in halves if the class doubts $12$.",
  },
  {
    id: "est-mistake-048", level: "level2", purpose: "explain", title: "Jamal's estimate",
    working: { intro: "Jamal estimated $4.8 \\times 0.39$.", lines: ["4.8 \\to 5, \\quad 0.39 \\to 0", "5 \\times 0 = 0"], wrongLine: 0 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: ["$0.39$ to 1 significant figure is $0.4$, not $0$.", "$5 \\times 0.4 = 2$, so $4.8 \\times 0.39 \\approx 2$. An estimate of $0$ tells us nothing."],
    teacherNote: "Ask: is $4.8 \\times 0.39$ really close to nothing? Roughly how many lots of $0.4$ is it?",
  },
  {
    id: "est-make-12", level: "level2", purpose: "extend", title: "Make an estimate of twelve",
    question: ["Write a calculation with decimals whose estimate is $6 \\div 0.5$.", "Now write two different calculations that also have an estimate of $12$."],
    answer: ["For example $5.8 \\div 0.47$ or $6.3 \\div 0.52$: each rounds to $6 \\div 0.5 = 12$.", "Others: $2.9 \\times 4.1 \\approx 3 \\times 4 = 12$ and $59 \\div 4.8 \\approx 60 \\div 5 = 12$."],
    teacherNote: "Check each one by rounding it back. Which number in the class's examples is closest to its rounded value?",
  },
  // ── Level 3 ──
  {
    id: "est-frac-55", level: "level3", purpose: "diagnose", startHere: true, title: "A fraction to estimate",
    question: ["Estimate $\\dfrac{34 + 21}{11}$."],
    options: [
      { text: "$5$", correct: true },
      { text: "$6$", misconception: "Adds first ($55$), then rounds the result ($60$) instead of rounding every number first.", tag: "estimation-round-result" },
      { text: "$5.5$", misconception: "Works out the exact answer instead of estimating." },
      { text: "$50$", misconception: "Forgets to divide by the denominator." },
    ],
    answer: ["Round every number first: $34 \\to 30$, $21 \\to 20$, $11 \\to 10$.", "$\\dfrac{30 + 20}{10} = \\dfrac{50}{10} = 5$."],
    teacherNote: "Ask the $6$ group where their $60$ came from. Rounding must happen before any calculating.",
    ifNotSecure: "est-who-48x31", ifSecure: "est-asn-ten-percent",
  },
  {
    id: "est-who-frac", level: "level3", purpose: "diagnose", title: "Who is right?",
    speakers: [
      { name: "Priya", says: ["$\\dfrac{82 \\times 19}{41} \\approx \\dfrac{80 \\times 20}{40} = 40$"] },
      { name: "Ben", says: ["$\\dfrac{82 \\times 19}{41} \\approx \\dfrac{80 \\times 20}{40} = 400$"] },
    ],
    question: ["Who has estimated correctly?"],
    options: [
      { text: "Priya", correct: true },
      { text: "Ben", misconception: "Gains a zero: $80 \\times 20 = 1600$ and $1600 \\div 40 = 40$.", tag: "estimation-calc-zeros" },
    ],
    answer: ["$80 \\times 20 = 1600$, and $1600 \\div 40 = 40$.", "Or simplify first: $80 \\div 40 = 2$, then $2 \\times 20 = 40$."],
    teacherNote: "Ask for the quickest route. Cancelling before multiplying avoids the big number.",
  },
  {
    id: "est-mistake-83", level: "level3", purpose: "explain", title: "Mei's estimate",
    working: { intro: "Mei estimated $\\dfrac{47 + 36}{19}$.", lines: ["47 + 36 = 83", "83 \\to 80, \\quad 19 \\to 20", "80 \\div 20 = 4"], wrongLine: 0 },
    question: ["Find the first line that goes wrong, and explain the mistake."],
    answer: ["Mei added before rounding. To estimate, round every number first: $47 \\to 50$, $36 \\to 40$, $19 \\to 20$.", "$\\dfrac{50 + 40}{20} = \\dfrac{90}{20} = 4.5$."],
    teacherNote: "Both answers are near the exact $4.37$; the mistake is the method. Ask why the method matters on a non-calculator paper.",
  },
  {
    id: "est-asn-ten-percent", level: "level3", purpose: "extend", title: "How close is an estimate?",
    question: ["An estimate made by rounding to 1 significant figure is always within $10\\%$ of the exact answer.", "Always, sometimes or never true?"],
    answer: [
      "Sometimes. $\\dfrac{82 \\times 19}{41} \\approx 40$ and the exact answer is $38$: within $10\\%$.",
      "But $\\dfrac{15 \\times 15}{15} \\approx \\dfrac{20 \\times 20}{20} = 20$ and the exact answer is $15$: about $33\\%$ out.",
    ],
    teacherNote: "Ask which numbers make rounding to 1 s.f. least accurate (those just past a half, like $15$ or $150$).",
  },
];
