// Depth bank for Ratio Sharing — fixed, hand-written questions (see src/shared/depth.ts and specs/depth/ratio-sharing.md).
// Levels follow the IDEAS, not the tool's own levels:
//   1  Sharing a total       one part, then multiply back; whose share; checking
//   2  Sharing, known share, difference   the parts add to the total (a:b with bigger totals); which parts a given amount stands for
//   3  Choosing and stretching   the first step, three parts, simplifying first, checking
// Items with no `tool` show on every tab and link only to other general items; the four that name their tab link to general items.
// Every numeric claim below is asserted in src/tests/ratioSharingDepth.test.ts.

import type { DepthItem } from "../../shared";

const SHARING = ["sharing", "mixed"];

export const DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — Sharing a total ─────────────────────────
  {
    id: "rs-what-is-12", level: "level1", purpose: "diagnose", startHere: true,
    title: "What does the £12 show?",
    speakers: [{ name: "Leo", says: ["£60 is shared in the ratio $2 : 3$.", "$60 \\div 5 = 12$."] }],
    question: ["What does Leo's £12 show?"],
    options: [
      { text: "The smaller share", misconception: "Finds the value of one part and stops, or gives it as a share", tag: "sharing-no-multiply" },
      { text: "The value of one part", correct: true },
      { text: "The larger share", misconception: "Finds the value of one part and stops, or gives it as a share", tag: "sharing-no-multiply" },
    ],
    answer: [
      "£12 is the value of one part: the £60 is split into $5$ equal parts.",
      "The smaller share is $2$ parts, $2 \\times 12 = 24$, and the larger is $3$ parts, $3 \\times 12 = 36$.",
      "Finding one part is the middle of the method, not the end.",
    ],
    ifNotSecure: "rs-which-name", ifSecure: "rs-who-is-right",
  },
  {
    id: "rs-which-name", level: "level1", purpose: "explain",
    title: "Whose share is it?",
    speakers: [{ name: "Priya", says: ["Mia and Jack share £60 in the ratio Mia : Jack $= 2 : 3$.", "Jack gets £24, because £24 is the smaller amount and Jack's name comes second."] }],
    question: ["Explain Priya's mistake."],
    answer: [
      "The ratio is written in the order Mia, Jack, so Mia has $2$ parts and Jack has $3$.",
      "Jack has the larger share: $3 \\times 12 = 36$. Mia gets $2 \\times 12 = 24$.",
      "The number in the ratio goes with the name in the same place, not with the size of the amount.",
    ],
    ifNotSecure: "rs-what-is-12", ifSecure: "rs-whole-pounds",
  },
  {
    id: "rs-check-first", level: "level1", tool: SHARING, purpose: "explain",
    title: "The first mistake",
    working: {
      intro: "£75 is shared in the ratio $2 : 3$. Work out both shares.",
      lines: ["2 + 3 = 5", "\\pounds 75 \\div 5 = \\pounds 15", "2 \\times \\pounds 15 = \\pounds 30", "3 \\times \\pounds 15 = \\pounds 35"],
      wrongLine: 3,
    },
    question: ["Tap the first line that is wrong."],
    answer: [
      "The last line is wrong: $3 \\times 15 = 45$, not $35$.",
      "A check finds it: £30 + £35 = £65, which is not the £75 shared. £30 + £45 = £75.",
      "Adding the shares is the quickest check that nothing has gone missing.",
    ],
    ifNotSecure: "rs-what-is-12", ifSecure: "rs-whole-pounds",
  },
  {
    id: "rs-whole-pounds", level: "level1", purpose: "extend",
    title: "Always, sometimes or never?",
    question: ["Always, sometimes or never true?", "Sharing a whole number of pounds in a ratio gives shares that are whole numbers of pounds."],
    answer: [
      "Sometimes. £60 in the ratio $2 : 3$ has $5$ parts of £12, so £24 and £36.",
      "£50 in the ratio $3 : 4$ has $7$ parts, and $50 \\div 7$ is not a whole number, so the shares are not whole pounds.",
      "It works when the total is a multiple of the total number of parts.",
    ],
    ifNotSecure: "rs-which-name", ifSecure: "rs-who-is-right",
  },

  // ───────────────────────── Level 2 — Known share, difference ─────────────────────────
  {
    id: "rs-who-is-right", level: "level2", purpose: "diagnose",
    title: "Who is right?",
    speakers: [
      { name: "Kofi", says: ["£108 is shared in the ratio $4 : 5$.", "$108 \\div 4 = 27$ and $108 \\div 5 = 21.60$."] },
      { name: "Mei", says: ["£108 is shared in the ratio $4 : 5$.", "$4 + 5 = 9$ parts. $108 \\div 9 = 12$, so £48 and £60."] },
    ],
    question: ["Who is right?"],
    options: [
      { text: "Kofi", misconception: "Divides the total by one of the ratio numbers, not by the total number of parts", tag: "sharing-divide-by-part" },
      { text: "Mei", correct: true },
      { text: "They are both right", misconception: "Divides the total by one of the ratio numbers, not by the total number of parts", tag: "sharing-divide-by-part" },
    ],
    answer: [
      "Mei is right. The parts add to $4 + 5 = 9$, so the £108 is split into $9$ equal parts of £12.",
      "The shares are $4 \\times 12 = 48$ and $5 \\times 12 = 60$, and £48 + £60 = £108.",
      "Kofi's £27 and £21.60 add to £48.60, not £108: they cannot be the shares.",
    ],
    ifNotSecure: "rs-what-is-12", ifSecure: "rs-known-share",
  },
  {
    id: "rs-known-share", level: "level2", purpose: "diagnose", startHere: true,
    title: "Who is right?",
    speakers: [
      { name: "Ruby", says: ["The ratio is $3 : 5$ and the first person has £24.", "The other has $24 \\times 5 = 120$."] },
      { name: "Leo", says: ["The ratio is $3 : 5$ and the first person has £24.", "$24 \\div 3 = 8$ is one part, so the other has $8 \\times 5 = 40$."] },
    ],
    question: ["How much does the other person have? Who is right?"],
    options: [
      { text: "Ruby", misconception: "Treats the known share as the value of one part", tag: "sharing-known-as-part" },
      { text: "Leo", correct: true },
      { text: "They are both right", misconception: "Treats the known share as the value of one part", tag: "sharing-known-as-part" },
    ],
    answer: [
      "Leo is right. £24 is $3$ parts, so one part is $24 \\div 3 = 8$, and the other person's $5$ parts are $5 \\times 8 = 40$.",
      "Ruby treated £24 as one part. The first person's £24 is already $3$ parts.",
      "Check: £24 and £40 are in the ratio $3 : 5$, because both are multiples of £8.",
    ],
    ifNotSecure: "rs-who-is-right", ifSecure: "rs-diff-divisor",
  },
  {
    id: "rs-known-total", level: "level2", tool: ["known", "mixed"], purpose: "diagnose",
    title: "What is the total?",
    question: ["Ana and Ola share money in the ratio $3 : 5$.", "Ana gets £24.", "What is the total amount shared?"],
    options: [
      { text: "£24", misconception: "Treats the known share as the total", tag: "sharing-known-as-total" },
      { text: "£40", misconception: "Answers a different question: the other share, or the value of one part", tag: "sharing-wrong-question" },
      { text: "£192", misconception: "Treats the known share as the value of one part", tag: "sharing-known-as-part" },
      { text: "£64", correct: true },
    ],
    answer: [
      "£24 is $3$ parts, so one part is £8. The total is $3 + 5 = 8$ parts, $8 \\times 8 = 64$.",
      "£40 is Ola's share, not the total. £192 is $24 \\times 8$, which treats Ana's £24 as one part.",
      "Check: £24 + £40 = £64.",
    ],
    ifNotSecure: "rs-known-share", ifSecure: "rs-diff-divisor",
  },
  {
    id: "rs-diff-total", level: "level2", tool: ["difference", "mixed"], purpose: "diagnose",
    title: "What is the total?",
    question: ["Ana and Ola share money in the ratio $3 : 7$.", "Ola gets £48 more than Ana.", "What is the total amount shared?"],
    options: [
      { text: "£48", misconception: "Takes the difference as a share or as the total", tag: "sharing-diff-as-total" },
      { text: "£84", misconception: "Answers a different question: the other share, or the value of one part", tag: "sharing-wrong-question" },
      { text: "£120", correct: true },
    ],
    answer: [
      "The difference is $7 - 3 = 4$ parts, and that is £48, so one part is $48 \\div 4 = 12$.",
      "Ana has $3 \\times 12 = 36$, Ola has $7 \\times 12 = 84$, and the total is $36 + 84 = 120$.",
      "£48 is only the gap between the shares, and £84 is Ola's share.",
    ],
    ifNotSecure: "rs-known-share", ifSecure: "rs-diff-divisor",
  },
  {
    id: "rs-diff-divisor", level: "level2", purpose: "explain",
    title: "The first mistake",
    working: {
      intro: "Ana and Ola share money in the ratio $3 : 7$. Ola gets £48 more than Ana. Work out Ana's share.",
      lines: ["7 - 3 = 4", "\\pounds 48 \\div 10 = \\pounds 4.80", "3 \\times \\pounds 4.80 = \\pounds 14.40"],
      wrongLine: 1,
    },
    question: ["Tap the first line that is wrong."],
    answer: [
      "The second line is wrong: the £48 is the difference, which is $4$ parts, so one part is $48 \\div 4 = 12$.",
      "The $10$ is the total number of parts, and the difference does not show the total.",
      "Ana's share is $3 \\times 12 = 36$.",
    ],
    ifNotSecure: "rs-known-share", ifSecure: "rs-one-part-gap",
  },
  {
    id: "rs-one-part-gap", level: "level2", purpose: "extend",
    title: "A handy shortcut?",
    speakers: [{ name: "Jamal", says: ["The ratio is $4 : 5$ and the difference is £9.", "So one part is £9."] }],
    question: ["Is Jamal right? Would the same shortcut work for the ratio $3 : 7$ and a difference of £48?"],
    answer: [
      "Jamal is right here, because $5 - 4 = 1$: the difference is exactly one part. The shares are £36 and £45.",
      "For $3 : 7$ the difference is $7 - 3 = 4$ parts, so £48 is $4$ parts, not one, and one part is £12.",
      "The shortcut only works when the two numbers in the ratio differ by $1$.",
    ],
    ifNotSecure: "rs-diff-divisor", ifSecure: "rs-first-step",
  },

  // ───────────────────────── Level 3 — Choosing and stretching ─────────────────────────
  {
    id: "rs-first-step", level: "level3", purpose: "diagnose", startHere: true,
    title: "Which first step?",
    question: [
      "Three questions use the ratio $2 : 3$ and the amount £30.",
      "(a) £30 is shared in the ratio.",
      "(b) The first person gets £30.",
      "(c) The difference between the shares is £30.",
      "Which one starts with £30 ÷ 5?",
    ],
    options: [
      { text: "(a)", correct: true },
      { text: "(b)", misconception: "Treats the known share as the total", tag: "sharing-known-as-total" },
      { text: "(c)", misconception: "Takes the difference as a share or as the total", tag: "sharing-diff-as-total" },
    ],
    answer: [
      "Only (a). £30 ÷ 5 splits the whole £30 into the $2 + 3 = 5$ parts.",
      "In (b), £30 is $2$ parts, so one part is $30 \\div 2 = 15$.",
      "In (c), £30 is the difference $3 - 2 = 1$ part, so one part is $30 \\div 1 = 30$.",
    ],
    ifNotSecure: "rs-known-share", ifSecure: "rs-simplify-first",
  },
  {
    id: "rs-three-parts", level: "level3", purpose: "diagnose", needs: ["three"],
    title: "What is one part worth?",
    question: ["£90 is shared in the ratio $2 : 3 : 5$.", "What is the value of one part?"],
    options: [
      { text: "£18", misconception: "In a three-part ratio, uses only two of the parts", tag: "sharing-missed-part" },
      { text: "£9", correct: true },
      { text: "£30", misconception: "Divides the total by one of the ratio numbers, or by the number of people, not by the total number of parts", tag: "sharing-divide-by-part" },
    ],
    answer: [
      "The parts add to $2 + 3 + 5 = 10$, so one part is $90 \\div 10 = 9$.",
      "The shares are $2 \\times 9 = 18$, $3 \\times 9 = 27$ and $5 \\times 9 = 45$, and they add to £90.",
      "£18 is $90 \\div 5$, which adds only two of the parts. £30 is $90 \\div 3$, the number of people.",
    ],
    ifNotSecure: "rs-first-step", ifSecure: "rs-check-three",
  },
  {
    id: "rs-simplify-first", level: "level3", purpose: "explain",
    title: "Do they agree?",
    speakers: [
      { name: "Jamal", says: ["£120 is shared in the ratio $6 : 9$.", "$6 : 9$ is $2 : 3$, so $5$ parts of £24: £48 and £72."] },
      { name: "Amara", says: ["£120 is shared in the ratio $6 : 9$.", "$6 + 9 = 15$ parts of £8: £48 and £72."] },
    ],
    question: ["Explain why they get the same answer."],
    answer: [
      "$6 : 9$ and $2 : 3$ are the same ratio, so they describe the same split.",
      "Amara's $15$ parts of £8 and Jamal's $5$ parts of £24 are the same money: $3$ of Amara's parts make one of Jamal's.",
      "Neither has to simplify first. Simplifying only makes the numbers smaller.",
    ],
    ifNotSecure: "rs-first-step", ifSecure: "rs-biggest-share",
  },
  {
    id: "rs-check-three", level: "level3", purpose: "explain", needs: ["three"],
    title: "The first mistake",
    working: {
      intro: "£84 is shared in the ratio $1 : 2 : 4$. Work out the three shares.",
      lines: ["1 + 2 + 4 = 7", "\\pounds 84 \\div 7 = \\pounds 12", "1 \\times \\pounds 12 = \\pounds 12", "2 \\times \\pounds 12 = \\pounds 24", "4 \\times \\pounds 12 = \\pounds 58"],
      wrongLine: 4,
    },
    question: ["Tap the first line that is wrong."],
    answer: [
      "The last line is wrong: $4 \\times 12 = 48$, not $58$.",
      "A check finds it: £12 + £24 + £58 = £94, not £84. With £48 the shares add to £84.",
      "With three shares, a slip is easy to make, so always add them.",
    ],
    ifNotSecure: "rs-three-parts", ifSecure: "rs-biggest-share",
  },
  {
    id: "rs-biggest-share", level: "level3", purpose: "extend",
    title: "Always, sometimes or never?",
    question: ["Always, sometimes or never true?", "The person with the biggest share gets more than half of the total."],
    answer: [
      "With two different parts it is always true: $a > b$ gives $\\frac{a}{a+b} > \\frac12$.",
      "With three parts it is sometimes true. $1 : 2 : 4$ gives $\\frac47$, more than half. $2 : 3 : 5$ gives exactly $\\frac12$. $3 : 4 : 5$ gives $\\frac{5}{12}$, less than half.",
      "The biggest share is more than half exactly when it is bigger than all the other parts added together.",
    ],
    ifNotSecure: "rs-simplify-first",
  },
];
