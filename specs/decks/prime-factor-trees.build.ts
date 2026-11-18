// Build script for the "Prime factor trees" deck (plan: specs/decks/prime-factor-trees.md).
// Harry draws every tree live on the board, so the slides hold the question and the answer (the primes as a product, or index form), never a tree.
//   npm run deck -- build specs/decks/prime-factor-trees.build.ts --replace
//   npm run deck -- check prime-factor-trees --layout
//   npm run deck -- review prime-factor-trees
import {
  LOOK, Q, S, assertCentred, assertFreshNumbers, hintLine, lineEl, makeSlide, quiet, textEl, titleEls,
} from "/src/decks/builder";
import { autoTree, indexText, productText, withSplit, type TreeNode } from "/src/shared/factorTree";
import { misconceptionLabel } from "/src/shared/misconceptions";
import type { CuratedQuestion, DeckElement, Slide } from "/src/decks/types";

const ID = "prime-factor-trees";
const P = "pft";
const T = "prime-factors";
const grey = LOOK.grey;
const t = textEl;

// ---------- the maths (every answer is computed, then asserted against the plan) ----------
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const isPrime = (n: number) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const BIG = [11, 13, 17, 19];
/** The plan's rule: 11, 13, 17 and 19 only ever to the power 1, and only beside 2, 3 or 5 (never 7, never each other). */
function checkPrimes(n: number, primes: number[]) {
  const big = primes.filter((p) => BIG.includes(p) || p > 19);
  must(big.every((p) => primes.filter((q) => q === p).length === 1), `${n}: a big prime is repeated`);
  if (big.length) must(primes.every((p) => big.includes(p) || [2, 3, 5].includes(p)), `${n}: a big prime sits beside a prime that is not 2, 3 or 5`);
}
const same = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b);
const tex = (primes: number[]) => primes.join(" \\times ");
const idxTex = (tree: TreeNode) => indexText(tree).replace(/(\d+)\^(\d+)/g, "$1^{$2}").replace(/ × /g, " \\times ");

/** A tree for n whose first split is `first × (n / first)` (the smaller prime is split off the rest, the way the class usually does it). */
const treeFor = (n: number, first?: number): TreeNode => (first ? withSplit(autoTree(n), [], first) : autoTree(n));

/** One way to draw it, as a teacher would say it: each split in reading order, with the primes circled as they appear. Harry draws his own. */
function treeWorking(tree: TreeNode): string[] {
  const lines: string[] = [];
  const queue: TreeNode[] = [tree];
  while (queue.length) {
    const node = queue.shift()!;
    if (!node.kids) continue;
    const [a, b] = node.kids;
    const circled = [a, b].filter((k) => !k.kids).map((k) => k.n);
    lines.push(`Split $${node.n} = ${a.n} \\times ${b.n}$${circled.length ? `, and circle ${circled.length > 1 ? "the primes" : "the prime"} $${circled.join(", ")}$` : ""}.`);
    queue.push(a, b);
  }
  return lines;
}

type Mistake = { response: string; reasoning: string };
const tagged = (q: CuratedQuestion, id: string, related: string[] = []): CuratedQuestion => ({
  ...q, misconception: { id, label: misconceptionLabel(id) }, ...(related.length ? { relatedMisconceptions: related.map((r) => ({ id: r, label: misconceptionLabel(r) })) } : {}),
});

/** "Write n as a product of primes" (or in index form), checked against the plan and worked one way. `help` is the quiet line a whiteboard carries. */
function primeQ(id: string, n: number, expect: number[], o: { first?: number; form?: "product" | "index"; help?: string; book?: boolean; hint?: string; tag?: string; mistakes?: Mistake[] } = {}): CuratedQuestion {
  const tree = treeFor(n, o.first);
  const primes = productText(tree).split(" × ").map(Number);
  must(same(primes, expect), `primes of ${n}: expected ${expect.join(" x ")}, got ${primes.join(" x ")}`);
  must(primes.reduce((a, b) => a * b, 1) === n && primes.every(isPrime), `${n}: the primes multiply back to the number`);
  checkPrimes(n, primes);
  const index = o.form === "index";
  const answer = index ? `$${n} = ${idxTex(tree)}$` : `$${n} = ${tex(primes)}$`;
  const working = [`One way to draw it (yours may start differently):`, ...treeWorking(tree), `The primes at the ends: $${primes.join(", ")}$.`, `$${n} = ${tex(primes)}$`, ...(index ? [`In index form: $${n} = ${idxTex(tree)}$`] : [])];
  let lines: string[];
  if (o.book) {
    lines = [`$${n}$`];
    if (o.hint) lines.push(hintLine(o.hint));
  } else {
    lines = [index ? `Write $${n}$ as a product of primes, in index form.` : `Write $${n}$ as a product of primes.`];
    if (o.help) lines.push(`$${quiet(o.help)}$`);
    assertCentred(lines, `${n}`);
  }
  const base = Q.open(id, T, "level1", lines[0], answer, working, o.mistakes ?? []);
  const q: CuratedQuestion = { ...base, title: `$${n}$`, question: lines, rationale: index ? "Draw the tree, write the product of primes, then count each prime." : "Split into two numbers, circle each prime as it appears, and stop when every branch ends in a prime." };
  return o.tag ? tagged(q, o.tag) : q;
}

// ---------- slide 8: which prime goes in first? ----------
const whichQ = (id: string, n: number, goes: number[], why: string): CuratedQuestion => {
  for (const p of [2, 3, 5]) must((n % p === 0) === goes.includes(p), `${n}: does ${p} go in?`);
  const answer = goes.length === 1 ? `$${goes[0]}$` : `$${goes.join("$ and $")}$`;
  const base = Q.open(id, T, "level1", `Which of $2$, $3$ and $5$ go into $${n}$?`, answer, [why]);
  return { ...base, title: `$${n}$`, question: [`$${n}$`] };
};
const whichSet: CuratedQuestion[] = [
  whichQ(`${P}-w1`, 65, [5], "It ends in 5, so 5 goes in. It is odd, and the digits add to 11, so neither 2 nor 3 does."),
  whichQ(`${P}-w2`, 34, [2], "It is even, so 2 goes in. The digits add to 7, which is not in the 3 times table, and it does not end in 0 or 5."),
  whichQ(`${P}-w3`, 51, [3], "The digits add to 6, which is in the 3 times table, so 3 goes in. It is odd and does not end in 0 or 5."),
  whichQ(`${P}-w4`, 78, [2, 3], "It is even, so 2 goes in. The digits add to 15, which is in the 3 times table, so 3 goes in too."),
];

// ---------- slide 6: is it prime? (section 1, a quick check) ----------
const primeCheck = (id: string, n: number): CuratedQuestion => {
  const prime = isPrime(n);
  const fac = prime ? "" : (() => { let d = 2; while (n % d) d++; return `${d} \\times ${n / d}`; })();
  const base = Q.open(id, T, "level1", `Is $${n}$ prime?`, prime ? "Prime" : `Not prime: $${n} = ${fac}$`, [prime ? `Only $1$ and $${n}$ go into $${n}$.` : `$${n} = ${fac}$, so it has more than two factors.`]);
  return { ...base, title: `$${n}$`, question: [`$${n}$`] };
};
const primeSet = [21, 23, 26, 29, 38, 39].map((n, i) => primeCheck(`${P}-pc${i + 1}`, n));

// ---------- stage 1: draw a tree, write the primes (whiteboards, then book work) ----------
const W1 = [
  primeQ(`${P}-wb1`, 28, [2, 2, 7], { first: 4, help: "(3 primes at the end)", tag: "primes-circle-non-prime", mistakes: [{ response: "$4 \\times 7$", reasoning: "Stopped at 4, which is not prime: $4 = 2 \\times 2$." }] }),
  primeQ(`${P}-wb2`, 45, [3, 3, 5], { first: 5, help: "(3 primes)", tag: "primes-repeat-once", mistakes: [{ response: "$3 \\times 5$", reasoning: "Wrote the repeated 3 once." }] }),
  primeQ(`${P}-wb3`, 30, [2, 3, 5], { first: 5, tag: "primes-circle-non-prime", mistakes: [{ response: "$5 \\times 6$", reasoning: "Circled 6, which is not prime: $6 = 2 \\times 3$." }] }),
];
const B1 = [
  primeQ(`${P}-b1`, 14, [2, 7], { book: true, hint: "Hint: 2 primes" }),
  primeQ(`${P}-b2`, 22, [2, 11], { book: true, hint: "Hint: 2 primes" }),
  primeQ(`${P}-b3`, 12, [2, 2, 3], { book: true, hint: "Hint: 3 primes", tag: "primes-repeat-once" }),
  primeQ(`${P}-b4`, 27, [3, 3, 3], { book: true, hint: "Hint: 3 primes", tag: "primes-repeat-once" }),
  primeQ(`${P}-b5`, 52, [2, 2, 13], { book: true, hint: "Hint: 3 primes" }),
  primeQ(`${P}-b6`, 40, [2, 2, 2, 5], { book: true, hint: "Hint: 4 primes", tag: "primes-repeat-once" }),
  primeQ(`${P}-b7`, 63, [3, 3, 7], { book: true }),
  primeQ(`${P}-b8`, 90, [2, 3, 3, 5], { book: true }),
  primeQ(`${P}-b9`, 220, [2, 2, 5, 11], { book: true }),
];

// ---------- stage 2: index form ----------
/** Write a product of primes in index form (the product is given). */
function indexQ(id: string, primes: number[], expectIdx: string, tag?: string, mistakes: Mistake[] = []): CuratedQuestion {
  const counts = new Map<number, number>();
  primes.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  const idx = [...counts].sort((a, b) => a[0] - b[0]).map(([p, c]) => (c > 1 ? `${p}^{${c}}` : `${p}`)).join(" \\times ");
  must(idx === expectIdx, `index form of ${tex(primes)}: expected ${expectIdx}, got ${idx}`);
  const tally = [...counts].sort((a, b) => a[0] - b[0]).map(([p, c]) => `$${p}$ appears ${c} time${c > 1 ? "s" : ""}${c > 1 ? `: $${p}^{${c}}$` : `, so it is written alone: $${p}$`}`);
  const q = Q.open(id, T, "level1", `Write $${tex(primes)}$ in index form.`, `$${idx}$`, ["Count how many times each prime appears.", ...tally, `$${tex(primes)} = ${idx}$`], mistakes);
  return tag ? tagged(q, tag) : q;
}
const setC: CuratedQuestion[] = [
  indexQ(`${P}-c1`, [5, 5], "5^{2}", undefined, [{ response: "$5 \\times 2$", reasoning: "Wrote the count as a times." }]),
  indexQ(`${P}-c2`, [2, 2, 2, 2], "2^{4}", undefined, [{ response: "$2^{3}$", reasoning: "Miscounted the 2s." }]),
  indexQ(`${P}-c3`, [2, 2, 5], "2^{2} \\times 5", undefined, [{ response: "$2^{2} \\times 5^{1}$", reasoning: "A prime that appears once is written alone." }]),
  indexQ(`${P}-c4`, [2, 3, 3, 3], "2 \\times 3^{3}", "primes-index-wrong-base", [{ response: "$2^{3} \\times 3$", reasoning: "Put the index on the wrong prime." }]),
  indexQ(`${P}-c5`, [2, 2, 3, 3, 5], "2^{2} \\times 3^{2} \\times 5", "primes-index-wrong-base", [{ response: "$2^{2} \\times 3^{2} \\times 5^{2}$", reasoning: "Gave every prime an index." }]),
  tagged({
    ...Q.open(`${P}-c6`, T, "level1", "Is $2^{3}$ the same as $2 \\times 3$? Explain.", "No: $2^{3} = 2 \\times 2 \\times 2 = 8$, but $2 \\times 3 = 6$.", ["The index counts how many 2s are multiplied together.", "$2^{3} = 2 \\times 2 \\times 2 = 8$", "$2 \\times 3 = 6$", "So they are not the same."]),
    title: "Is $2^{3}$ the same as $2 \\times 3$?",
  }, "primes-index-as-multiply"),
];
const W2 = [
  primeQ(`${P}-wb4`, 72, [2, 2, 2, 3, 3], { first: 8, form: "index", help: "(5 primes, 2 different)", tag: "primes-index-wrong-base" }),
  primeQ(`${P}-wb5`, 100, [2, 2, 5, 5], { first: 10, form: "index", help: "(2 different primes)", mistakes: [{ response: "$10 \\times 10$", reasoning: "Stopped at 10, which is not prime." }] }),
  primeQ(`${P}-wb6`, 80, [2, 2, 2, 2, 5], { first: 8, form: "index", tag: "primes-repeat-once" }),
];
const B2 = [
  primeQ(`${P}-b10`, 16, [2, 2, 2, 2], { form: "index", book: true, hint: "Hint: 1 prime" }),
  primeQ(`${P}-b11`, 25, [5, 5], { form: "index", book: true, hint: "Hint: 1 prime" }),
  primeQ(`${P}-b12`, 54, [2, 3, 3, 3], { form: "index", book: true, hint: "Hint: 2 primes" }),
  primeQ(`${P}-b13`, 32, [2, 2, 2, 2, 2], { form: "index", book: true, hint: "Hint: 1 prime" }),
  primeQ(`${P}-b14`, 75, [3, 5, 5], { form: "index", book: true, hint: "Hint: 2 primes" }),
  primeQ(`${P}-b15`, 42, [2, 3, 7], { form: "index", book: true, hint: "Hint: 3 primes" }),
  primeQ(`${P}-b16`, 120, [2, 2, 2, 3, 5], { form: "index", book: true }),
  primeQ(`${P}-b17`, 88, [2, 2, 2, 11], { form: "index", book: true }),
  primeQ(`${P}-b18`, 200, [2, 2, 2, 5, 5], { form: "index", book: true }),
];

// ---------- exit ticket ----------
const exitItems: CuratedQuestion[] = [
  { ...primeQ(`${P}-x1`, 33, [3, 11]), question: ["Write $33$ as a product of primes."] },
  { ...primeQ(`${P}-x2`, 60, [2, 2, 3, 5], { first: 5, form: "index" }), question: ["Write $60$ as a product of primes, in index form."] },
  { ...indexQ(`${P}-x3`, [2, 2, 3, 3, 3], "2^{2} \\times 3^{3}"), title: "Index form of a product" },
];

// ---------- Depth cards (authored; claims shape; numbers the deck does not use elsewhere) ----------
function depthQ(id: string, title: string, claims: { name: string; text: string }[], right: number | "both", correct: string, wrong: { text: string; reasoning: string; tag?: string }[], why: string[], mis: string): CuratedQuestion {
  const base = Q.open(id, T, "level1", "Who is right?", correct, why);
  const options = [
    ...claims.map((c, i) => ({ text: c.name, correct: right === i, reasoning: right === i ? "" : wrong.find((w) => w.text === c.name)?.reasoning ?? "" })),
    { text: "They are both right", correct: right === "both", reasoning: right === "both" ? "" : wrong.find((w) => w.text === "both")?.reasoning ?? "Both cannot be right." },
  ];
  must(options.filter((o) => o.correct).length === 1, `${id}: exactly one correct option`);
  must(options.every((o) => o.correct || o.reasoning), `${id}: every wrong option names its misconception`);
  return {
    ...base, title, purpose: "diagnose", format: "claims", claims, options, expectedErrors: [], depth: { prompt: "", takeaway: "" },
    misconception: { id: mis, label: misconceptionLabel(mis) },
  } as CuratedQuestion;
}
const depth1 = depthQ(`${P}-dp1`, "Who is right about $5^{3}$?", [{ name: "Priya", text: "$5^{3} = 15$" }, { name: "Leo", text: "$5^{3} = 5 \\times 5 \\times 5 = 125$" }], 1,
  "Leo is right: $5^{3}$ means three 5s multiplied together, $5 \\times 5 \\times 5 = 125$.",
  [{ text: "Priya", reasoning: "Multiplies the 5 by the index: $5 \\times 3 = 15$. The index counts the 5s." }, { text: "both", reasoning: "$5 \\times 3 = 15$ is not $125$: the index is a count, not a times." }],
  ["The small 3 says the 5 is written three times.", "$5 \\times 5 = 25$, then $25 \\times 5 = 125$.", "$5 \\times 3 = 15$ is a different thing."], "primes-index-as-multiply");
must(5 ** 3 === 125, "5^3");
const depth2 = depthQ(`${P}-dp2`, "Two trees for $70$", [{ name: "Amara", text: "I split $70 = 7 \\times 10$, then $10 = 2 \\times 5$." }, { name: "Jamal", text: "I split $70 = 2 \\times 35$, then $35 = 5 \\times 7$." }], "both",
  "They are both right. Different trees, the same primes: $70 = 2 \\times 5 \\times 7$.",
  [{ text: "Amara", reasoning: "Thinks a number has only one correct tree, so the other first split must be wrong." }, { text: "Jamal", reasoning: "Thinks a number has only one correct tree, so the other first split must be wrong." }],
  ["Amara's primes: $7, 2, 5$.", "Jamal's primes: $2, 5, 7$.", "Written smallest first, both are $2 \\times 5 \\times 7$."], "primes-one-tree");
must(7 * 10 === 70 && 2 * 35 === 70 && 2 * 5 * 7 === 70, "70");
const depth3 = depthQ(`${P}-dp3`, "Is the tree for $48$ finished?", [{ name: "Kofi", text: "$48 = 6 \\times 8$. I circled the 6 and the 8, so $48 = 6 \\times 8$ is a product of primes." }, { name: "Ruby", text: "The 6 and the 8 can still split, so the tree is not finished." }], 1,
  "Ruby is right: $6$ and $8$ are not prime. $6 = 2 \\times 3$ and $8 = 2 \\times 4$, so keep splitting.",
  [{ text: "Kofi", reasoning: "Circles a number that can still be split, so the tree stops too early." }, { text: "both", reasoning: "$6$ and $8$ are not prime, so Kofi's circles are wrong." }],
  ["Circle a number only when it is prime.", "$6 = 2 \\times 3$ and $8 = 2 \\times 2 \\times 2$.", "$48 = 2 \\times 2 \\times 2 \\times 2 \\times 3$."], "primes-circle-non-prime");
must(6 * 8 === 48 && 2 ** 4 * 3 === 48, "48");

const depthSlide = (id: string, q: CuratedQuestion): Slide =>
  makeSlide(id, "depth", "Depth", [{ kind: "questions", x: 24, y: 24, w: 1552, h: 852, presentation: "full", visualiser: false, items: [q] } as never]);

// ---------- the plan's checks ----------
// Worked numbers (slides): no question asks about them. No number twice inside a section; the exit ticket uses numbers asked nowhere else.
assertFreshNumbers({
  worked: [20, 24, 18, 36],
  sections: { "is it prime": primeSet, "which prime first": whichSet, "stage 1": [...W1, ...B1], "stage 2": [...W2, ...B2], depth: [] },
  exit: exitItems.filter((q) => q.id !== `${P}-x3`),
});

// ---------- the teaching slides ----------
const draw20 = makeSlide(`${P}-draw20`, "teach", "Draw a tree for 20", [
  ...titleEls("Draw a tree for 20"),
  t(100, 230, 640, 80, "1  Split it into two numbers.", 44, { bold: true, step: 1 }),
  t(100, 340, 640, 130, "2  Is a number prime? Circle it. It stops.", 44, { bold: true, step: 2 }),
  t(100, 500, 640, 130, "3  Not prime? Split it again.", 44, { bold: true, step: 3 }),
  lineEl(780, 230, 0, 520),
  t(820, 220, 680, 200, "20", 150, { bold: true, align: "center", middle: true }),
  t(820, 620, 680, 120, "$20 = 2 \\times 2 \\times 5$", 64, { bold: true, align: "center", middle: true, colour: LOOK.green, step: 4 }),
  t(100, 780, 1400, 44, "Primes to 20:  2   3   5   7   11   13   17   19", 30, { colour: grey, align: "center" }),
  t(100, 828, 1400, 44, "Even: 2 goes in  ·  Ends in 0 or 5: 5 goes in  ·  Digits add to a 3 table number: 3 goes in", 28, { colour: grey, align: "center" }),
], "The model slide: you draw the tree for 20 on the board with the class. The three rules appear one click at a time; the answer is the check.");

const noOne = makeSlide(`${P}-no-one`, "teach", "Never split with 1", [
  ...titleEls("Never split with 1", "Every split must use two numbers bigger than 1."),
  t(100, 300, 1400, 150, "$20 = 1 \\times 20$", 110, { bold: true, align: "center", middle: true }),
  t(100, 500, 1400, 100, "The 20 is still there. The tree would never end.", 56, { align: "center", step: 1 }),
  t(100, 640, 1400, 100, "$20 = 4 \\times 5$ gets us somewhere.", 56, { align: "center", bold: true, colour: LOOK.green, step: 2 }),
]);

const asProduct = makeSlide(`${P}-as-product`, "teach", "Write the primes as a product", [
  ...titleEls("Write the primes as a product", "Read off the circled primes. Write them smallest first."),
  t(100, 300, 1400, 140, "$20 = 2 \\times 2 \\times 5$", 110, { bold: true, align: "center", middle: true }),
  t(100, 500, 1400, 100, "The 2s come first, then the 5.", 56, { align: "center", step: 1 }),
  t(100, 640, 1400, 100, "A product is what you get when you multiply.", 52, { align: "center", colour: grey, step: 2 }),
]);

export default () => ({
  id: ID, title: "Prime Factor Trees", strand: "Number", questionVersion: 2,
  summary: "One lesson for a weak group after LCM and HCF: split a number into two with a factor tree, circling each prime until every branch ends in a prime, write the primes as a product, then write that product in index form. Harry draws the trees; the deck holds the questions and the answers. No calculators.",
  slides: [
    S.title(`${P}-title`, "Prime Factor Trees", "Split. Circle the primes. Write the product."),
    S.objective(`${P}-objective`, "Write a number as a product of its prime factors using a factor tree, and give the answer in index form.", [
      "Split a number into two numbers and circle every prime",
      "Write the primes as a product, smallest first",
      "Write a product of primes in index form, such as $2^2 \\times 3$",
    ]),
    S.divider(`${P}-d1`, "Section 1: What is a prime?"),
    S.vocab(`${P}-vocab`, [
      { term: "Prime", meaning: "A number with exactly two factors: 1 and itself." },
      { term: "Factor", meaning: "A number that divides exactly into another number." },
      { term: "Product", meaning: "The answer to a multiplication. $2 \\times 3 = 6$, so 6 is the product." },
      { term: "Index", meaning: "The small raised number (also called a power). It counts how many times a number is multiplied by itself: the 3 in $2^3$." },
    ]),
    S.definition(`${P}-prime`, "Prime number", "A prime number has exactly two factors: 1 and itself.\n\nThe primes up to 20 are 2, 3, 5, 7, 11, 13, 17 and 19.\n\n1 is not a prime number."),
    S.quick(`${P}-primecheck`, "Is it prime?", primeSet, 3, "Say prime or not prime. If not, name two numbers that multiply to it."),
    S.divider(`${P}-d2`, "Section 2: Factor trees"),
    S.quick(`${P}-which`, "Which prime goes in first?", whichSet, 2, "Even: 2 goes in  ·  Ends in 0 or 5: 5 goes in  ·  Digits add to a 3 table number: 3 goes in"),
    draw20,
    S.whiteboard(`${P}-wb-1`, "Your turn: write it as a product of primes", W1, "Three whiteboard questions: a count of the primes at the end, a smaller count, then nothing. You draw the tree; the answer is the product of primes.", { size: 64 }),
    S.discuss(`${P}-disc`, "Kofi starts $24$ with $3 \\times 8$. Ruby starts with $4 \\times 6$. Can they both be right?",
      "Yes. Different trees can start differently, but they always end in the same primes: $24 = 2 \\times 2 \\times 2 \\times 3$.",
      "Draw your own tree for $24$. Which primes do you end with?", "2 \\times 2 \\times 2 \\times 3"),
    noOne,
    S.plainBook(`${P}-book-1`, B1, 3, "Copy into your book. Draw a tree and write each number as a product of primes.", "Prime factors book work"),
    S.divider(`${P}-d3`, "Section 3: Writing it as a product"),
    asProduct,
    S.board(`${P}-check`, "Check by multiplying back", "Multiply the primes. Do you get the number?", {
      head: ["Primes", "Multiply", "The number"], given: 1,
      rows: [["$2 \\times 2 \\times 5$", "$4 \\times 5$", "$20$"], ["$2 \\times 3 \\times 3$", "$6 \\times 3$", "$18$"], ["$2 \\times 2 \\times 2 \\times 3$", "$8 \\times 3$", "$24$"]],
    }),
    S.divider(`${P}-d4`, "Section 4: Index form"),
    S.board(`${P}-tally`, "How many of each? (18)", "Draw a tree for 18. Count each prime.", {
      head: ["Prime", "How many", "Index form"], given: 1, rows: [["$2$", "$1$", "$2$"], ["$3$", "$2$", "$3^2$"]],
    }),
    S.definition(`${P}-index`, "Index form", "Index form is a short way to write the same prime multiplied again and again.\n\n$3 \\times 3 = 3^2$\n\nThe small raised number, the index, counts how many times the prime is written."),
    S.board(`${P}-meaning`, "What does the small number mean?", "It counts the repeats. It does not multiply.", {
      head: ["Index form", "Written out", "Value"], given: 1, rows: [["$3^2$", "$3 \\times 3$", "$9$"], ["$2^3$", "$2 \\times 2 \\times 2$", "$8$"], ["$7^2$", "$7 \\times 7$", "$49$"]],
    }),
    S.deliberate(`${P}-set-c`, "Set C: write in index form", setC, "Six questions climbing from one repeated prime to a mix of three, ending with a question on what an index means. The product is given."),
    S.board(`${P}-index-18`, "Tree to index form", "A prime that appears once has no small number.", {
      head: ["Product of primes", "Index form"], given: 1,
      rows: [["$18 = 2 \\times 3 \\times 3$", "$18 = 2 \\times 3^2$"], ["$24 = 2 \\times 2 \\times 2 \\times 3$", "$24 = 2^3 \\times 3$"]],
    }),
    S.whiteboard(`${P}-wb-2`, "Your turn: write it in index form", W2, "Three whiteboard questions: a count of the primes and how many are different, a smaller count, then nothing. You draw the tree; the answer is the index form.", { size: 64 }),
    depthSlide(`${P}-depth-1`, depth1),
    S.plainBook(`${P}-book-2`, B2, 3, "Copy into your book. Draw a tree and write each number in index form.", "Index form book work"),
    depthSlide(`${P}-depth-2`, depth2),
    depthSlide(`${P}-depth-3`, depth3),
    S.exitRows(`${P}-exit`, exitItems, "Work on your own."),
    S.summary(`${P}-summary`, "Summary", [
      "Split a number into two numbers bigger than 1. Circle a prime when you reach one.",
      "Keep splitting until every branch ends in a circled prime.",
      "Write the primes as a product, smallest first.",
      "Index form counts the repeats: $2 \\times 2 \\times 3 = 2^2 \\times 3$.",
    ]),
  ] as Slide[],
});

void ({} as DeckElement);
