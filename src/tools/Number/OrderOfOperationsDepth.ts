// Depth bank for Order of Operations — fixed, hand-written questions (see src/shared/depth.ts).
// Pilot for the Depth mode. Levels follow the tool's three ideas:
//   1  Who goes first?              2  Things that jump the queue      3  Symbols that act as brackets
// Every numeric claim below is asserted in src/tests/orderOfOperations.test.ts.

import type { DepthItem } from "../../shared";

export const DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — Who goes first? ─────────────────────────
  {
    id: "ooo-jack-jo", level: "level1", purpose: "diagnose", startHere: true,
    title: "Who is right?",
    question: ["Jack says $7 + 2 \\times 3 = 27$.", "Jo says $7 + 2 \\times 3 = 13$.", "Who is right?"],
    options: [
      { text: "Jack", misconception: "Worked left to right: $7 + 2 = 9$, then $9 \\times 3 = 27$" },
      { text: "Jo", correct: true },
      { text: "They are both right", misconception: "Thinks the order of working doesn't change the answer" },
    ],
    answer: [
      "Jo is right: $7 + 2 \\times 3 = 7 + 6 = 13$.",
      "Multiplication comes before addition, so $2 \\times 3$ is done first.",
      "Jack worked left to right: $7 + 2 = 9$, then $9 \\times 3 = 27$.",
    ],
    teacherNote: "Ask what exactly Jack did. Listen for 'he just went left to right'.",
    ifNotSecure: "ooo-matthew", ifSecure: "ooo-why-multiply-first",
  },
  {
    id: "ooo-sub-add", level: "level1", purpose: "diagnose",
    title: "Same tier",
    question: ["What is $20 - 8 + 3$?"],
    options: [
      { text: "$9$", misconception: "Added first: $8 + 3 = 11$, then $20 - 11$" },
      { text: "$15$", correct: true },
      { text: "It could be either", misconception: "Thinks the order is a matter of choice" },
    ],
    answer: [
      "$20 - 8 + 3 = 12 + 3 = 15$.",
      "$+$ and $-$ share a tier of the pyramid, so work from left to right.",
      "Doing $8 + 3$ first gives $20 - 11 = 9$: a different answer, so the order matters.",
    ],
    teacherNote: "Point at the pyramid: A and S side by side means equal priority.",
    ifNotSecure: "ooo-student-working", ifSecure: "ooo-div-mul",
  },
  {
    id: "ooo-div-mul", level: "level1", purpose: "diagnose",
    title: "Divide then multiply",
    question: ["What is $24 \\div 4 \\times 2$?"],
    options: [
      { text: "$3$", misconception: "Multiplied before dividing: $4 \\times 2 = 8$, then $24 \\div 8$" },
      { text: "$12$", correct: true },
      { text: "It could be either", misconception: "Thinks the order is a matter of choice" },
    ],
    answer: [
      "$24 \\div 4 \\times 2 = 6 \\times 2 = 12$.",
      "$\\div$ and $\\times$ share a tier, so work from left to right.",
      "Multiplying first gives $24 \\div 8 = 3$, which is wrong.",
    ],
    ifNotSecure: "ooo-sub-add", ifSecure: "ooo-make-answers",
  },
  {
    id: "ooo-matthew", level: "level1", purpose: "explain",
    title: "Matthew's mistake",
    question: ["Matthew says $9 + 3 \\times 2 = 24$.", "Explain Matthew's mistake and give the correct answer."],
    answer: [
      "Matthew added first: $9 + 3 = 12$, then $12 \\times 2 = 24$.",
      "Multiplication comes before addition: $3 \\times 2 = 6$, then $9 + 6 = 15$.",
    ],
    teacherNote: "Push for the word 'before' or 'priority' in the explanation.",
    ifNotSecure: "ooo-jack-jo", ifSecure: "ooo-make-answers",
  },
  {
    id: "ooo-student-working", level: "level1", purpose: "explain",
    title: "Spot the error in working",
    question: [
      "A student works out $9 + 4 \\times 3 + 2$:",
      "$9 + 4 \\times 3 + 2$",
      "$= 13 \\times 3 + 2$",
      "$= 39 + 2$",
      "$= 41$",
      "What went wrong, and what should the answer be?",
    ],
    answer: [
      "The first step is wrong: $9 + 4$ was done before $4 \\times 3$.",
      "Correct: $9 + 4 \\times 3 + 2 = 9 + 12 + 2 = 23$.",
    ],
    teacherNote: "Ask which line is the first one that is wrong. Later lines are 'right' given the mistake.",
    ifNotSecure: "ooo-matthew", ifSecure: "ooo-make-answers",
  },
  {
    id: "ooo-why-multiply-first", level: "level1", purpose: "extend",
    title: "Why multiply first?",
    question: [
      "Ana says: 'The order of operations is just a rule somebody made up.'",
      "Can you explain why $2 + 3 \\times 4$ is $14$ and not $20$?",
    ],
    answer: [
      "$3 \\times 4$ means 3 lots of 4: $4 + 4 + 4$.",
      "So $2 + 3 \\times 4 = 2 + 4 + 4 + 4 = 14$.",
      "Multiplication is repeated addition, so it is one chunk that must be worked out before it joins the $2$.",
    ],
    teacherNote: "Draw 3 groups of 4 counters plus 2 more. The picture makes the rule feel necessary, not arbitrary.",
    ifNotSecure: "ooo-jack-jo", ifSecure: "ooo-bracket-first",
  },
  {
    id: "ooo-make-answers", level: "level1", purpose: "extend",
    title: "How many answers?",
    question: [
      "Use the numbers $2$, $3$ and $4$ once each, with $+$, $-$ and $\\times$ (no brackets).",
      "How many different answers can you make?",
    ],
    answer: [
      "For example: $2 + 3 + 4 = 9$, $2 \\times 3 + 4 = 10$, $2 + 3 \\times 4 = 14$, $2 \\times 3 \\times 4 = 24$.",
      "And with subtraction: $2 - 3 \\times 4 = -10$, $4 - 2 \\times 3 = -2$.",
    ],
    teacherNote: "Ask how they know they have them all. Encourage a system: which two numbers are multiplied?",
    ifNotSecure: "ooo-div-mul",
  },

  // ─────────────────── Level 2 — Things that jump the queue ───────────────────
  {
    id: "ooo-bracket-first", level: "level2", purpose: "diagnose", startHere: true,
    title: "Brackets first",
    question: ["What is $5 + (4 + 2) \\times 3$?"],
    options: [
      { text: "$33$", misconception: "Worked left to right: $(5 + 4 + 2) \\times 3$" },
      { text: "$23$", correct: true },
      { text: "$15$", misconception: "Ignored the brackets: $5 + 4 + 2 \\times 3$" },
    ],
    answer: [
      "$5 + (4 + 2) \\times 3 = 5 + 6 \\times 3 = 5 + 18 = 23$.",
      "Brackets first, then the multiplication, then the addition.",
      "Once the bracket is cleared you are left with a Level 1 question.",
    ],
    teacherNote: "Ask pupils to say which operation they would do first, before anyone calculates.",
    ifNotSecure: "ooo-student-working", ifSecure: "ooo-one-pair",
  },
  {
    id: "ooo-square-product", level: "level2", purpose: "diagnose",
    title: "What gets squared?",
    question: ["What is $3 \\times 2^2$?"],
    options: [
      { text: "$36$", misconception: "Multiplied before squaring: $(3 \\times 2)^2$" },
      { text: "$12$", correct: true },
    ],
    answer: [
      "$3 \\times 2^2 = 3 \\times 4 = 12$.",
      "The power only applies to the $2$, and it comes before the multiplication.",
      "To square the whole product you would need brackets: $(3 \\times 2)^2 = 36$.",
    ],
    teacherNote: "Compare with $(3 \\times 2)^2$ on the board and ask what the brackets change.",
    ifNotSecure: "ooo-kofi-power", ifSecure: "ooo-sum-squared",
  },
  {
    id: "ooo-neg-square", level: "level2", purpose: "diagnose",
    title: "A negative squared",
    question: ["What is the difference between $-3^2$ and $(-3)^2$?"],
    options: [
      { text: "They are both $9$", misconception: "Thinks the negative sign is always squared with the $3$" },
      { text: "$-3^2 = -9$ and $(-3)^2 = 9$", correct: true },
      { text: "They are both $-9$", misconception: "Thinks squaring a negative gives a negative" },
    ],
    answer: [
      "$-3^2 = -(3 \\times 3) = -9$: only the $3$ is squared.",
      "$(-3)^2 = -3 \\times -3 = 9$: the brackets mean the negative is squared too.",
    ],
    teacherNote: "Link to the pyramid: the power (I) is done before the 'make it negative'.",
    ifNotSecure: "ooo-square-product", ifSecure: "ooo-sum-squared",
  },
  {
    id: "ooo-priya-square", level: "level2", purpose: "explain",
    title: "Priya's square",
    question: ["Priya says $(3 + 4)^2 = 3^2 + 4^2 = 25$.", "Explain Priya's mistake and find the correct answer."],
    answer: [
      "$(3 + 4)^2 = 7^2 = 49$.",
      "The bracket is worked out first, then the whole result is squared.",
      "$3^2 + 4^2 = 9 + 16 = 25$ squares each number separately, which is a different calculation.",
    ],
    ifNotSecure: "ooo-square-product", ifSecure: "ooo-sum-squared",
  },
  {
    id: "ooo-kofi-power", level: "level2", purpose: "explain",
    title: "Kofi's order",
    question: ["Kofi says $2 + 3^2 = 25$.", "What did Kofi do, and what should the answer be?"],
    answer: [
      "Kofi added first: $2 + 3 = 5$, then squared: $5^2 = 25$.",
      "The power comes before the addition: $3^2 = 9$, so $2 + 3^2 = 2 + 9 = 11$.",
    ],
    ifNotSecure: "ooo-matthew", ifSecure: "ooo-priya-square",
  },
  {
    id: "ooo-one-pair", level: "level2", purpose: "extend",
    title: "One pair of brackets",
    question: [
      "Put one pair of brackets anywhere in $2 + 3 \\times 4 + 1$.",
      "How many different answers can you make?",
    ],
    answer: [
      "With no brackets: $2 + 12 + 1 = 15$.",
      "$(2 + 3) \\times 4 + 1 = 21$ and $2 + 3 \\times (4 + 1) = 17$.",
      "Brackets round $3 \\times 4$, $2 + 3 \\times 4$ or $3 \\times 4 + 1$ change nothing: still $15$.",
      "So one pair of brackets can give three different answers: $15$, $17$ and $21$.",
    ],
    teacherNote: "Ask: which brackets 'do something', and why do the others do nothing?",
    ifNotSecure: "ooo-bracket-first", ifSecure: "ooo-root-bracket",
  },
  {
    id: "ooo-sum-squared", level: "level2", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["Always, sometimes or never true?", "$(a + b)^2 = a^2 + b^2$", "Test it with numbers, then explain."],
    answer: [
      "Sometimes: only when $a = 0$ or $b = 0$.",
      "For $a = 3$, $b = 4$: $(3 + 4)^2 = 49$ but $3^2 + 4^2 = 25$.",
      "In fact $(a + b)^2 = a^2 + 2ab + b^2$, so they match only when $2ab = 0$.",
    ],
    teacherNote: "Don't let 'never' stand after one example. Ask for numbers where it does work.",
    ifNotSecure: "ooo-priya-square",
  },

  // ─────────────── Level 3 — Symbols that act as brackets ───────────────
  {
    id: "ooo-root-bracket", level: "level3", purpose: "diagnose", startHere: true,
    title: "Under the root",
    question: ["What is $\\sqrt{9 + 16}$?"],
    options: [
      { text: "$7$", misconception: "Took the root of each number, then added: $3 + 4$" },
      { text: "$5$", correct: true },
      { text: "$19$", misconception: "Took the root of only the first number: $\\sqrt{9} + 16$" },
    ],
    answer: [
      "$\\sqrt{9 + 16} = \\sqrt{25} = 5$.",
      "The root sign works like a bracket: add under it first, then take the root.",
      "$\\sqrt{9} + \\sqrt{16} = 7$ is a different calculation.",
    ],
    teacherNote: "Ask where the 'invisible brackets' are, and draw them under the root.",
    ifNotSecure: "ooo-bracket-first", ifSecure: "ooo-sum-root",
  },
  {
    id: "ooo-fraction-bar", level: "level3", purpose: "diagnose",
    title: "The fraction bar",
    question: ["What is $\\dfrac{8 + 4}{5 - 1}$?"],
    options: [
      { text: "$7.8$", misconception: "Treated the bar as divide only: $8 + 4 \\div 5 - 1$" },
      { text: "$3$", correct: true },
      { text: "$1.4$", misconception: "Bracketed only the top: $(8 + 4) \\div 5 - 1$" },
    ],
    answer: [
      "$\\dfrac{8 + 4}{5 - 1} = \\dfrac{12}{4} = 3$.",
      "The bar acts like brackets round the top and the bottom: work each out, then divide.",
    ],
    ifNotSecure: "ooo-root-bracket", ifSecure: "ooo-build-your-own",
  },
  {
    id: "ooo-nested", level: "level3", purpose: "diagnose",
    title: "Brackets inside brackets",
    question: ["What is $2 \\times (3 + (4 - 1) \\times 5)$?"],
    options: [
      { text: "$60$", misconception: "Added $3 + 3$ before multiplying by $5$ inside the bracket" },
      { text: "$36$", correct: true },
      { text: "$21$", misconception: "Multiplied only the first term by $2$: $2 \\times 3 + 3 \\times 5$" },
    ],
    answer: [
      "Innermost bracket first: $4 - 1 = 3$.",
      "Inside the outer bracket, $3 \\times 5 = 15$ comes before $3 + 15 = 18$.",
      "Then $2 \\times 18 = 36$.",
    ],
    teacherNote: "Each time a bracket is cleared, ask what kind of question is left.",
    ifNotSecure: "ooo-bracket-first", ifSecure: "ooo-build-your-own",
  },
  {
    id: "ooo-elena-root", level: "level3", purpose: "explain",
    title: "Elena's root",
    question: ["Elena says $\\sqrt{9 + 16} = \\sqrt{9} + \\sqrt{16} = 7$.", "Explain her mistake and show why $5$ is correct."],
    answer: [
      "$9 + 16 = 25$ and $\\sqrt{25} = 5$.",
      "The root of a sum is not the sum of the roots.",
      "Check Elena's answer: $7^2 = 49$, which is not $9 + 16$.",
    ],
    ifNotSecure: "ooo-root-bracket", ifSecure: "ooo-sum-root",
  },
  {
    id: "ooo-jamal-bar", level: "level3", purpose: "explain",
    title: "Jamal's fraction",
    question: [
      "Jamal says $\\dfrac{12}{4 + 2} = 5$.",
      "He worked out $12 \\div 4 = 3$, then $3 + 2 = 5$.",
      "Explain his mistake and find the correct answer.",
    ],
    answer: [
      "The bar acts like a bracket round the bottom: $4 + 2 = 6$ first.",
      "$\\dfrac{12}{4 + 2} = \\dfrac{12}{6} = 2$.",
      "Jamal divided by $4$ only, instead of by the whole bottom.",
    ],
    ifNotSecure: "ooo-fraction-bar", ifSecure: "ooo-build-your-own",
  },
  {
    id: "ooo-sum-root", level: "level3", purpose: "extend",
    title: "Always, sometimes, never",
    question: ["Always, sometimes or never true?", "$\\sqrt{a + b} = \\sqrt{a} + \\sqrt{b}$", "Test it, then explain."],
    answer: [
      "Sometimes: only when $a = 0$ or $b = 0$.",
      "$\\sqrt{9 + 16} = 5$ but $\\sqrt{9} + \\sqrt{16} = 7$.",
      "Squaring the right-hand side gives $a + 2\\sqrt{ab} + b$, which equals $a + b$ only when $ab = 0$.",
    ],
    ifNotSecure: "ooo-elena-root",
  },
  {
    id: "ooo-build-your-own", level: "level3", purpose: "extend",
    title: "Build your own",
    question: [
      "Use one square root and one fraction bar to make a calculation with the answer $4$.",
      "Then swap with a partner and solve theirs.",
    ],
    answer: [
      "For example $\\dfrac{\\sqrt{9 + 16} + 3}{2} = \\dfrac{5 + 3}{2} = 4$.",
      "Or $\\sqrt{\\dfrac{32}{2}} = \\sqrt{16} = 4$.",
    ],
    teacherNote: "Look for pupils who check their own question by working it through before swapping.",
    ifNotSecure: "ooo-fraction-bar",
  },
];
