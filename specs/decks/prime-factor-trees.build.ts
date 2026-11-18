// Build script for the "Prime factor trees" deck (plan: specs/decks/prime-factor-trees.md, revised 2026-11-18 after Harry's first look).
// Harry draws every tree live on the board, so no slide shows a tree and no question carries working: practice is a question on the left, a
// blank workspace on the right, and only the answer (the primes as a product, or index form) on a click.
//   npm run deck -- build specs/decks/prime-factor-trees.build.ts --replace
//   npm run deck -- check prime-factor-trees --layout
//   npm run deck -- review prime-factor-trees
import { LOOK, Q, S, assertCentred, assertFreshNumbers, lineEl, makeSlide, textEl, titleEls } from "/src/decks/builder";
import { misconceptionLabel } from "/src/shared/misconceptions";
import type { CuratedQuestion, DeckElement, Slide } from "/src/decks/types";

const ID = "prime-factor-trees";
const P = "pft";
const T = "prime-factors";
const { grey, green: GREEN, blue: BLUE } = LOOK;
const t = textEl;

// ---------- the maths (every answer is computed, then asserted against the plan) ----------
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const primeFactors = (n: number): number[] => { const out: number[] = []; for (let d = 2, m = n; m > 1; d++) while (m % d === 0) { out.push(d); m /= d; } return out; };
const BIG = [11, 13, 17, 19];
/** The plan's rule: 11, 13, 17 and 19 only ever to the power 1, and only beside 2, 3 or 5 (never 7, never each other). */
function checkPrimes(n: number, primes: number[]) {
  const big = primes.filter((p) => BIG.includes(p));
  must(big.every((p) => primes.filter((q) => q === p).length === 1), `${n}: a big prime is repeated`);
  if (big.length) must(big.length === 1 && primes.every((p) => BIG.includes(p) || [2, 3, 5].includes(p)), `${n}: a big prime sits beside 7 or another big prime`);
}
const same = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b);
const tex = (primes: number[]) => primes.join(" \\times ");
const counts = (primes: number[]) => { const m = new Map<number, number>(); primes.forEach((p) => m.set(p, (m.get(p) ?? 0) + 1)); return [...m].sort((a, b) => a[0] - b[0]); };
const idxTex = (primes: number[]) => counts(primes).map(([p, c]) => (c > 1 ? `${p}^{${c}}` : `${p}`)).join(" \\times ");

type Mistake = { response: string; reasoning: string };
const tagged = (q: CuratedQuestion, id: string): CuratedQuestion => ({ ...q, misconception: { id, label: misconceptionLabel(id) } });

/** "Write n as a product of primes" (or in index form): no working, because Harry draws the tree; the answer is the product or the index form.
 *  `book` makes plain book work (just the number, with an optional quiet hint). */
function treeQ(id: string, n: number, expect: number[], o: { form?: "product" | "index"; book?: boolean; tag?: string; mistakes?: Mistake[] } = {}): CuratedQuestion {
  const primes = primeFactors(n);
  must(same(primes, expect), `primes of ${n}: expected ${expect.join(" x ")}, got ${primes.join(" x ")}`);
  must(primes.reduce((a, b) => a * b, 1) === n, `${n}: the primes multiply back to the number`);
  checkPrimes(n, primes);
  const index = o.form === "index";
  const answer = o.book ? (index ? `$${idxTex(primes)}$` : `$${tex(primes)}$`) : index ? `$${n} = ${idxTex(primes)}$` : `$${n} = ${tex(primes)}$`;
  let lines: string[];
  if (o.book) lines = [`$${n}$`];
  else { lines = [index ? `Write $${n}$ in index form.` : `Write $${n}$ as a product of primes.`]; assertCentred(lines, `${n}`); }
  const base = Q.open(id, T, "level1", lines[0], answer, [], o.mistakes ?? []);
  const q: CuratedQuestion = { ...base, title: `$${n}$`, question: lines, rationale: index ? "Draw the tree, then count each prime." : "Split into two numbers, circle each prime, stop when every branch ends in a prime." };
  return o.tag ? tagged(q, o.tag) : q;
}

// ---------- section 1: trees to a product of primes ----------
// whiteboards (10): the numbers climb from two or three small primes to four primes, a big prime and a 7
const WBA = ([
  [18, [2, 3, 3], "primes-repeat-once"], [30, [2, 3, 5]], [28, [2, 2, 7], "primes-circle-non-prime"], [24, [2, 2, 2, 3], "primes-repeat-once"], [50, [2, 5, 5]],
  [45, [3, 3, 5], "primes-repeat-once"], [52, [2, 2, 13]], [44, [2, 2, 11]], [66, [2, 3, 11]], [63, [3, 3, 7]],
] as [number, number[], string?][]).map(([n, e, tag], i) => treeQ(`${P}-wa${i + 1}`, n, e, { tag }));
// book work (12, plain numbers, no hints): not in ascending order
const bookA: [number, number[]][] = [
  [20, [2, 2, 5]], [12, [2, 2, 3]], [14, [2, 7]], [22, [2, 11]], [40, [2, 2, 2, 5]], [27, [3, 3, 3]], [55, [5, 11]], [90, [2, 3, 3, 5]], [75, [3, 5, 5]],
  [140, [2, 2, 5, 7]], [220, [2, 2, 5, 11]], [99, [3, 3, 11]],
];
const BKA = bookA.map(([n, e], i) => treeQ(`${P}-ba${i + 1}`, n, e, { book: true, ...(i === 1 || i === 4 || i === 5 ? { tag: "primes-repeat-once" } : {}) }));

// ---------- section 2: index form (from a product) ----------
function indexQ(id: string, given: number[], expectIdx: string, tag?: string, mistakes: Mistake[] = []): CuratedQuestion {
  const sorted = [...given].sort((x, y) => x - y);
  const idx = idxTex(sorted);
  must(idx === expectIdx, `index form of ${tex(given)}: expected ${expectIdx}, got ${idx}`);
  const q = { ...Q.open(id, T, "level1", `Write $${tex(given)}$ in index form.`, `$${idx}$`, [], mistakes), title: "Write the product in index form" };
  return tag ? tagged(q, tag) : q;
}
// the product is given in any order; the answer is always written smallest first. A good half are not written smallest first.
const setC: [number[], string, string?][] = [
  [[5, 5], "5^{2}"], [[3, 3, 3], "3^{3}"], [[2, 2, 2, 2], "2^{4}"], [[3, 3, 3, 3], "3^{4}"],
  [[5, 2, 2], "2^{2} \\times 5", "primes-index-wrong-base"], [[3, 2, 3], "2 \\times 3^{2}", "primes-index-wrong-base"], [[5, 3, 5], "3 \\times 5^{2}"], [[2, 11, 2], "2^{2} \\times 11"],
  [[7, 2, 2, 2], "2^{3} \\times 7"], [[3, 2, 3, 3], "2 \\times 3^{3}", "primes-index-wrong-base"], [[3, 2, 5, 2, 3], "2^{2} \\times 3^{2} \\times 5", "primes-index-wrong-base"], [[5, 2, 5, 5], "2 \\times 5^{3}"],
  [[2, 5, 3, 5, 2], "2^{2} \\times 3 \\times 5^{2}"], [[2, 3, 2, 2, 2, 2], "2^{5} \\times 3"], [[3, 2, 3, 2, 3, 2], "2^{3} \\times 3^{3}", "primes-index-as-multiply"],
];
const SETC = setC.map(([p, e, tag], i) => indexQ(`${P}-c${i + 1}`, p, e, tag));

// ---------- section 3: back to the trees, answers in index form ----------
const WBB = ([
  [25, [5, 5]], [16, [2, 2, 2, 2]], [100, [2, 2, 5, 5]], [32, [2, 2, 2, 2, 2]], [80, [2, 2, 2, 2, 5]], [200, [2, 2, 2, 5, 5]],
  [54, [2, 3, 3, 3]], [72, [2, 2, 2, 3, 3], "primes-index-wrong-base"], [120, [2, 2, 2, 3, 5]], [108, [2, 2, 3, 3, 3]], [88, [2, 2, 2, 11]], [42, [2, 3, 7]],
] as [number, number[], string?][]).map(([n, e, tag], i) => treeQ(`${P}-wb${i + 1}`, n, e, { form: "index", tag }));
const bookB: [number, number[]][] = [
  [36, [2, 2, 3, 3]], [150, [2, 3, 5, 5]], [64, [2, 2, 2, 2, 2, 2]], [250, [2, 5, 5, 5]], [81, [3, 3, 3, 3]], [300, [2, 2, 3, 5, 5]],
  [49, [7, 7]], [144, [2, 2, 2, 2, 3, 3]], [180, [2, 2, 3, 3, 5]], [400, [2, 2, 2, 2, 5, 5]], [126, [2, 3, 3, 7]], [135, [3, 3, 3, 5]],
];
const BKB = bookB.map(([n, e], i) => treeQ(`${P}-bb${i + 1}`, n, e, { form: "index", book: true }));

// ---------- exit ticket ----------
const exitItems: CuratedQuestion[] = [
  { ...treeQ(`${P}-x1`, 33, [3, 11]), question: ["Write $33$ as a product of primes."] },
  { ...treeQ(`${P}-x2`, 60, [2, 2, 3, 5], { form: "index" }), question: ["Write $60$ as primes in index form."] },
  { ...indexQ(`${P}-x3`, [2, 2, 3, 3, 3], "2^{2} \\times 3^{3}"), title: "Index form of a product" },
];

// ---------- Depth cards (authored; claims shape; numbers the deck does not use elsewhere) ----------
function depthQ(id: string, title: string, claims: { name: string; text: string }[], right: number | "both", correct: string, wrong: { text: string; reasoning: string }[], why: string[], mis: string): CuratedQuestion {
  const base = Q.open(id, T, "level1", "Who is right?", correct, why);
  const options = [
    ...claims.map((c, i) => ({ text: c.name, correct: right === i, reasoning: right === i ? "" : wrong.find((w) => w.text === c.name)?.reasoning ?? "" })),
    { text: "They are both right", correct: right === "both", reasoning: right === "both" ? "" : wrong.find((w) => w.text === "both")?.reasoning ?? "Both cannot be right." },
  ];
  must(options.filter((o) => o.correct).length === 1, `${id}: exactly one correct option`);
  must(options.every((o) => o.correct || o.reasoning), `${id}: every wrong option names its misconception`);
  return { ...base, title, purpose: "diagnose", format: "claims", claims, options, expectedErrors: [], depth: { prompt: "", takeaway: "" }, misconception: { id: mis, label: misconceptionLabel(mis) } } as CuratedQuestion;
}
const depth1 = depthQ(`${P}-dp1`, "Who is right about $7^{3}$?", [{ name: "Priya", text: "$7^{3} = 21$" }, { name: "Leo", text: "$7^{3} = 7 \\times 7 \\times 7 = 343$" }], 1,
  "Leo is right: $7^{3}$ means three 7s multiplied together, $7 \\times 7 \\times 7 = 343$.",
  [{ text: "Priya", reasoning: "Multiplies the 7 by the index: $7 \\times 3 = 21$. The index counts the 7s." }, { text: "both", reasoning: "$7 \\times 3 = 21$ is not $343$: the index is a count, not a times." }],
  ["The small 3 says the 7 is written three times.", "$7 \\times 3 = 21$ is a different calculation."], "primes-index-as-multiply");
must(7 ** 3 === 343 && 7 * 3 === 21, "7^3");
const depth2 = depthQ(`${P}-dp2`, "Two trees for $70$", [{ name: "Amara", text: "I split $70 = 7 \\times 10$, then $10 = 2 \\times 5$." }, { name: "Jamal", text: "I split $70 = 2 \\times 35$, then $35 = 5 \\times 7$." }], "both",
  "They are both right. Different trees, the same primes: $70 = 2 \\times 5 \\times 7$.",
  [{ text: "Amara", reasoning: "Thinks a number has only one correct tree, so the other first split must be wrong." }, { text: "Jamal", reasoning: "Thinks a number has only one correct tree, so the other first split must be wrong." }],
  ["Amara's primes: $7, 2, 5$.", "Jamal's primes: $2, 5, 7$.", "Written smallest first, both are $2 \\times 5 \\times 7$."], "primes-one-tree");
must(7 * 10 === 70 && 2 * 35 === 70 && same(primeFactors(70), [2, 5, 7]), "70");
const depth3 = depthQ(`${P}-dp3`, "Is the tree for $48$ finished?", [{ name: "Kofi", text: "$48 = 6 \\times 8$. I circled the 6 and the 8, so $48 = 6 \\times 8$ is a product of primes." }, { name: "Ruby", text: "The 6 and the 8 can still split, so the tree is not finished." }], 1,
  "Ruby is right: $6$ and $8$ are not prime. $6 = 2 \\times 3$ and $8 = 2 \\times 4$, so keep splitting.",
  [{ text: "Kofi", reasoning: "Circles a number that can still be split, so the tree stops too early." }, { text: "both", reasoning: "$6$ and $8$ are not prime, so Kofi's circles are wrong." }],
  ["Circle a number only when it is prime.", "$6 = 2 \\times 3$ and $8 = 2 \\times 2 \\times 2$.", "$48 = 2 \\times 2 \\times 2 \\times 2 \\times 3$."], "primes-circle-non-prime");
must(6 * 8 === 48 && same(primeFactors(48), [2, 2, 2, 2, 3]), "48");
const depthSlide = (id: string, q: CuratedQuestion): Slide =>
  makeSlide(id, "depth", "Depth", [{ kind: "questions", x: 24, y: 24, w: 1552, h: 852, presentation: "full", visualiser: false, items: [q] } as never]);

// ---------- the plan's checks ----------
// No number is asked twice anywhere in the deck, and the exit ticket uses numbers asked nowhere else.
{
  const asked = [...WBA, ...BKA, ...WBB, ...BKB, ...exitItems.slice(0, 2)].map((q) => Number(q.title.replace(/\D/g, "")));
  const dup = asked.filter((n, i) => asked.indexOf(n) !== i);
  must(dup.length === 0, `a number is asked twice: ${dup.join(", ")}`);
  must(WBA.length === 10 && BKA.length === 12 && SETC.length === 15 && WBB.length === 12 && BKB.length === 12, "the plan's counts");
}
assertFreshNumbers({
  worked: [],
  sections: { "trees to a product": [...WBA, ...BKA], "trees to index form": [...WBB, ...BKB] },
  exit: exitItems.slice(0, 2),
});

// ---------- the slides ----------
/** Practice: the question on the left, a blank workspace on the right, and only the answer (no working) under the question on a click. */
const practice = (id: string, title: string, items: CuratedQuestion[], brief: string, size = 48): Slide => {
  const s = S.deliberate(id, title, items, brief);
  return { ...s, family: "teach", els: s.els.map((e) => (e.kind === "questions" ? { ...e, presentation: "whiteboard", visualiser: false, size } : e)) as DeckElement[] };
};

/** The flow chart: start with a number, is it prime? yes: circle it and stop; no: split it into two numbers, then ask the same of each new number. */
const box = (x: number, y: number, w: number, h: number, stroke: string, step: number) =>
  ({ kind: "shape", shape: "rect", x, y, w, h, fill: "#f8fafc", stroke, strokeWidth: 5, radius: 22, step }) as never;
const flow = makeSlide(`${P}-flow`, "teach", "How to draw a factor tree", [
  ...titleEls("How to draw a factor tree"),
  // start
  box(560, 175, 420, 95, "#94a3b8", 1),
  t(560, 175, 420, 95, "Start with a number", 38, { bold: true, align: "center", middle: true, step: 1 }),
  lineEl(770, 270, 0, 50, { arrow: true, colour: "#64748b", step: 2 }),
  // the question
  { kind: "shape", shape: "ellipse", x: 560, y: 320, w: 420, h: 190, fill: "#eff6ff", stroke: BLUE, strokeWidth: 6, step: 2 } as never,
  t(560, 320, 420, 190, "Is it prime?", 52, { bold: true, align: "center", middle: true, colour: BLUE, step: 2 }),
  // yes
  lineEl(980, 415, 130, 0, { arrow: true, colour: "#64748b", step: 3 }),
  t(990, 360, 110, 50, "Yes", 36, { bold: true, colour: GREEN, align: "center", step: 3 }),
  box(1110, 350, 400, 130, GREEN, 3),
  t(1110, 350, 400, 130, "Circle it.\nIt stops.", 40, { bold: true, align: "center", middle: true, colour: GREEN, step: 3 }),
  // no
  lineEl(770, 510, 0, 90, { arrow: true, colour: "#64748b", step: 4 }),
  t(790, 530, 100, 50, "No", 36, { bold: true, colour: "#b91c1c", step: 4 }),
  box(540, 600, 460, 150, "#b91c1c", 4),
  t(540, 600, 460, 150, "Split it into two numbers\n(not using 1)", 38, { bold: true, align: "center", middle: true, step: 4 }),
  // loop back
  lineEl(540, 675, -130, 0, { colour: "#64748b", step: 5 }),
  lineEl(410, 675, 0, -260, { colour: "#64748b", step: 5 }),
  lineEl(410, 415, 150, 0, { arrow: true, colour: "#64748b", step: 5 }),
  t(60, 470, 330, 130, "Ask it again for each new number", 34, { bold: true, colour: grey, align: "center", step: 5 }),
], "The method as a flow chart, one click at a time. You draw the trees; the practice slides give the number and, on a click, the answer.");

/** What index form means, at a size that reads from the back of the room. */
const indexSlide = makeSlide(`${P}-index`, "language", "Index form", [
  t(100, 70, 1400, 50, "KEY DEFINITION", 30, { bold: true, colour: "#6d28d9" }),
  t(100, 130, 1400, 130, "Index form", 100, { bold: true }),
  t(100, 290, 1400, 190, "Index form is a short way to write the same number multiplied by itself again and again.", 62),
  t(100, 510, 1400, 150, "$2 \\times 2 \\times 2 = 2^3$", 110, { bold: true, align: "center", middle: true }),
  t(100, 700, 1400, 160, "The small raised number is the index. It counts how many times the number is written.", 54, { colour: grey }),
]);

export default () => ({
  id: ID, title: "Prime Factor Trees", strand: "Number", questionVersion: 2,
  summary: "One lesson for a weak group after LCM and HCF: draw factor trees to write a number as a product of primes, then in index form. Harry draws the trees; the deck has the method as a flow chart, lots of whiteboard and book practice with answers only, and a short index-form section. No calculators.",
  slides: [
    S.title(`${P}-title`, "Prime Factor Trees", "Split. Circle the primes."),
    S.objective(`${P}-objective`, "Use a factor tree to write a number as a product of primes, then in index form.", [
      "Draw a factor tree, circling every prime",
      "Write a product of primes in index form, such as $2^2 \\times 3$",
    ]),
    S.divider(`${P}-d1`, "Factor trees"),
    S.definition(`${P}-prime`, "Prime number", "A prime number has exactly two factors: 1 and itself.\n\nThe primes up to 20 are 2, 3, 5, 7, 11, 13, 17 and 19.\n\n1 is not a prime number."),
    flow,
    practice(`${P}-wb-a`, "Factor tree whiteboards", WBA, "Ten whiteboards: the number on the left, your tree on the right, the product of primes on a click.", 44),
    S.plainBook(`${P}-book-a`, BKA, 3, "Copy into your book. Draw a tree and write each number as a product of primes.", "Factor tree book work"),
    S.divider(`${P}-d2`, "Index form"),
    indexSlide,
    S.board(`${P}-table`, "Write it in index form", "", {
      head: ["Product of primes", "Index form"], given: 1,
      rows: [["$7 \\times 7$", "$7^2$"], ["$2 \\times 2 \\times 2$", "$2^3$"], ["$3 \\times 5 \\times 3$", "$3^2 \\times 5$"], ["$3 \\times 2 \\times 3 \\times 2 \\times 3$", "$2^2 \\times 3^3$"]],
    }),
    practice(`${P}-set-c`, "Index form whiteboards", SETC, "Fifteen products of primes to write in index form, climbing from one repeated prime to three. Many are not written smallest first. The product is given; the answer, always smallest first, is on a click.", 44),
    S.divider(`${P}-d3`, "Back to the trees"),
    practice(`${P}-wb-b`, "Factor trees in index form", WBB, "Twelve whiteboards: draw the tree, then write the answer in index form."),
    depthSlide(`${P}-depth-1`, depth1),
    S.plainBook(`${P}-book-b`, BKB, 3, "Copy into your book. Draw a tree and write each number in index form.", "Index form book work"),
    depthSlide(`${P}-depth-2`, depth2),
    depthSlide(`${P}-depth-3`, depth3),
    S.exitRows(`${P}-exit`, exitItems, "Work on your own."),
    S.summary(`${P}-summary`, "Summary", [
      "Is it prime? Circle it. If not, split it into two numbers and ask again.",
      "A factor tree ends when every branch ends in a circled prime.",
      "Index form counts the repeats: $2 \\times 2 \\times 3 = 2^2 \\times 3$.",
    ]),
  ] as Slide[],
});
