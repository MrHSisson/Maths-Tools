// Build script for the "Factors, common factors and HCF" deck (plan: specs/decks/factors-hcf-systematic-listing.md).
// It is the worked example of the shared deck pieces (src/decks/pieces.ts) and rules (src/decks/deckRules.ts): look at it before writing a new one.
//   npm run deck -- looks specs/decks/factors-hcf-systematic-listing.build.ts      the look card (one slide of each kind, every state; the repo is untouched)
//   npm run deck -- build specs/decks/factors-hcf-systematic-listing.build.ts --replace
//   npm run deck -- review factors-hcf-systematic-listing                          contact sheets of every slide: LOOK at them before showing the deck
import {
  LOOK, Q, S, assertCentred, assertFreshNumbers, green, hintLine, lineEl, makeSlide, mathsGrid, mathsStack, quiet, textEl, titleEls,
} from "/src/decks/builder";
import type { CuratedQuestion, DeckElement, Slide } from "/src/decks/types";

const ID = "factors-hcf-systematic-listing";
const P = "fhl";
const T = ID;

// ---------- the maths (every answer is computed, then asserted against the plan) ----------
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const factors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const common = (a: number, b: number) => factors(a).filter((d) => b % d === 0);
const pairs = (n: number) => factors(n).filter((d) => d <= n / d).map((d) => [d, n / d] as [number, number]);
const same = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b);
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

const list = (xs: number[]) => xs.map((x) => `$${x}$`).join(", ");
const dec = (x: number) => { const r = Math.round(x * 10) / 10; return Math.abs(r - x) < 1e-9 ? `= ${r}` : `\\approx ${r}`; };

/** The calculator working a pupil would do: divide by 1, 2, 3, ... and stop when the answer is smaller than the divisor. */
function factorWorking(n: number): string[] {
  const out: string[] = [];
  for (let d = 1; ; d++) {
    const q = n / d;
    if (q < d) { out.push(`$${n} \\div ${d} ${dec(q)}$ is smaller than $${d}$, so stop.`); break; }
    if (n % d === 0) out.push(q === d ? `$${n} \\div ${d} = ${q}$, so $${d} \\times ${q}$ ($${d}$ is written once).` : `$${n} \\div ${d} = ${q}$, so $${d} \\times ${q}$.`);
    else out.push(`$${n} \\div ${d} ${dec(q)}$ is not a whole number, so $${d}$ is not a factor.`);
  }
  out.push(`Factors of $${n}$: ${list(factors(n))}`);
  return out;
}

// ---------- the question forms ----------
const BLANK = "\\Box";
const pairText = (d: number, q: number, hide = false) => `${d}×${hide ? BLANK : q}`;
/** One number's pairs, one to a line and lined up; the partner is a box for the divisors in `hide`. */
const stackPairs = (n: number, hide: number[]) => mathsStack(pairs(n).map(([d, q]) => [d, "×", hide.includes(d) ? BLANK : q]));
/** Two numbers side by side as headings, each number's pairs underneath one to a line (partners hidden for `hideA` and `hideB`). */
const pairsGrid = (a: number, b: number, hideA: number[], hideB: number[]) =>
  mathsGrid([a, b], [pairs(a).map(([d, q]) => pairText(d, q, hideA.includes(d))), pairs(b).map(([d, q]) => pairText(d, q, hideB.includes(d)))]);
/** The completed table with the common factors in bold green, as the worked answer. */
const answerTable = (a: number, b: number) => {
  const c = common(a, b), mark = (n: number) => (c.includes(n) ? green(n) : String(n));
  const col = (n: number) => pairs(n).map(([d, q]) => `${mark(d)} \\times ${mark(q)}`);
  return mathsGrid([a, b], [col(a), col(b)], { roomy: true });
};
const pairsNote = (n: number) => quiet(`(${pairs(n).length} pairs)`, "small");

/** blanks: the pairs partly completed; pairs: the number of pairs in brackets, in grey; none: just the numbers. Book work: `book` (just the number) with an optional small grey hint. */
type Help = "blanks" | "pairs" | "none";

function factorsQ(id: string, n: number, help: Help, expect: number[], o: { blank?: number[]; book?: boolean; hint?: boolean } = {}): CuratedQuestion {
  must(same(factors(n), expect), `factors of ${n}`);
  const lines = o.book ? [`$${n}$`] : [`List all the factors of $${n}${help === "pairs" ? `\\;${pairsNote(n)}` : ""}$.`];
  if (help === "blanks") lines.push(stackPairs(n, o.blank ?? []));
  if (o.book && o.hint) lines.push(hintLine(`Hint: ${pairs(n).length} pairs`));
  if (!o.book) assertCentred(lines, `factors of ${n}`);
  return {
    ...Q.open(id, T, "level1", lines[0], list(expect), factorWorking(n)),
    title: `Factors of $${n}$`, question: lines, rationale: "Divide by 1, 2, 3, ... in order, keep each exact pair and stop when the answer is smaller than the divisor.",
  };
}

type Two = { hideA?: number[]; hideB?: number[]; book?: boolean; hint?: boolean };
/** The two numbers are always on one line: in the sentence, as column headings, or in one expression with their pair counts. */
function twoLines(verb: string, a: number, b: number, help: Help, o: Two) {
  let lines: string[];
  if (o.book) {
    lines = [`$${a},\\;${b}$`];
    if (o.hint) lines.push(hintLine(`Hint: ${pairs(a).length} & ${pairs(b).length} pairs`));
  } else if (help === "pairs") {
    lines = [`${verb}:`, `$${a}\\;${pairsNote(a)}\\ \\text{ and }\\ ${b}\\;${pairsNote(b)}$`];
  } else {
    lines = [`${verb} $${a}$ and $${b}$.`];
    if (help === "blanks") lines.push(pairsGrid(a, b, o.hideA ?? [], o.hideB ?? []));
  }
  if (!o.book) assertCentred(lines, `${a} and ${b}`);
  return lines;
}

function commonQ(id: string, a: number, b: number, help: Help, expect: number[], o: Two = {}): CuratedQuestion {
  const c = common(a, b);
  must(same(c, expect), `common factors of ${a} and ${b}`);
  const lines = twoLines("Find all the common factors of", a, b, help, o);
  return {
    ...Q.open(id, T, "level1", lines[0], list(c), [answerTable(a, b), `Common factors: ${list(c)}`]),
    title: `Common factors of $${a}$ and $${b}$`, question: lines, rationale: "Write the factor pairs of both numbers and find every number that is in both.",
  };
}

function hcfQ(id: string, a: number, b: number, help: Help, expect: number, o: Two = {}): CuratedQuestion {
  const c = common(a, b);
  must(gcd(a, b) === expect && c[c.length - 1] === expect, `HCF of ${a} and ${b}`);
  const lines = twoLines("Find the HCF of", a, b, help, o);
  return {
    ...Q.open(id, T, "level1", lines[0], `$${expect}$`, [answerTable(a, b), `Common factors: ${list(c)}`, `The highest common factor is $${expect}$.`]),
    title: `HCF of $${a}$ and $${b}$`, question: lines, rationale: "Find all the common factors, then take the highest.",
  };
}

// ---------- the slides ----------
const { grey, green: GREEN, red: RED, blue: BLUE } = LOOK;
const t = textEl;
const calcTest = makeSlide(`${P}-calc-test`, "teach", "Testing a factor with the calculator", [
  ...titleEls("Testing a factor with the calculator", "Is $4$ a factor of $24$? Is $5$?"),
  lineEl(800, 260, 0, 440),
  // left: 4
  t(100, 270, 660, 80, "Is $4$ a factor of $24$?", 48, { bold: true, step: 1 }),
  t(100, 370, 660, 70, "Type:", 40, { colour: grey, step: 1 }),
  { kind: "shape", shape: "rect", x: 100, y: 440, w: 660, h: 120, fill: "#f1f5f9", stroke: "#94a3b8", strokeWidth: 3, radius: 14, step: 1 },
  t(100, 440, 660, 120, "$24 \\div 4 =$", 72, { bold: true, align: "center", middle: true, step: 1 }),
  t(100, 590, 660, 120, "It shows $6$. A whole number, so $4$ is a factor (and so is $6$).", 44, { bold: true, colour: GREEN, step: 2 }),
  // right: 5
  t(840, 270, 660, 80, "Is $5$ a factor of $24$?", 48, { bold: true, step: 3 }),
  t(840, 370, 660, 70, "Type:", 40, { colour: grey, step: 3 }),
  { kind: "shape", shape: "rect", x: 840, y: 440, w: 660, h: 120, fill: "#f1f5f9", stroke: "#94a3b8", strokeWidth: 3, radius: 14, step: 3 },
  t(840, 440, 660, 120, "$24 \\div 5 =$", 72, { bold: true, align: "center", middle: true, step: 3 }),
  t(840, 590, 660, 120, "It shows $\\frac{24}{5}$ (or $4.8$ if you press S⇔D). Not whole, so $5$ is not a factor.", 40, { bold: true, colour: RED, step: 4 }),
  t(100, 750, 1400, 100, "Whole number: it is a factor. Fraction or decimal: it is not.", 52, { bold: true, align: "center", middle: true, step: 5 }),
], "Type the sum as shown. The fx-85 shows a non-whole answer as a fraction; S⇔D swaps it to a decimal. Build up with each click.");

const calcBoard = (() => {
  const s = S.board(`${P}-calc-all`, "Finding all the factors of 24", "Stop when the answer is smaller than the number you divided by.", {
    head: ["Divide $24$ by", "Calculator shows", "Whole number?", "Factor pair"], given: 1,
    rows: [["$1$", "$24$", "Yes", "$1 \\times 24$"], ["$2$", "$12$", "Yes", "$2 \\times 12$"], ["$3$", "$8$", "Yes", "$3 \\times 8$"], ["$4$", "$6$", "Yes", "$4 \\times 6$"], ["$5$", "$\\frac{24}{5}$ or $4.8$", "No", "none"]],
  });
  const els = s.els.map((e) => (e.kind === "board" ? { ...e, h: 470 } : e));
  els.push({ ...t(100, 740, 1400, 130, "$4.8$ is smaller than $5$, so stop. Factors of $24$: $1, 2, 3, 4, 6, 8, 12, 24$", 44, { bold: true, step: 1 }), id: `${P}-calc-all-9` } as DeckElement);
  return { ...s, els, brief: "Pupils type 24 ÷ 1, 24 ÷ 2, ... and fill the rows. Stop at 5: the answer is smaller than 5. If the class is quick, check the replay key on the fx-85GT CW to change the divisor without retyping." };
})();

/** The worked 12 and 18 pairs, shared by the common-factors and HCF models. */
const model = (a: number, b: number) => [{ head: a, pairs: pairs(a) }, { head: b, pairs: pairs(b) }] as [{ head: number; pairs: [number, number][] }, { head: number; pairs: [number, number][] }];
const commonModel = S.pairModel(`${P}-common-model`, "Find the common factors", "Write the factor pairs of both numbers. Which numbers are in both?", model(12, 18), common(12, 18), [
  { text: `Common factors: ${list(common(12, 18))}`, size: 54, bold: true, colour: GREEN, step: 3 },
  { text: "Calculator check: $18 \\div 4 = 4.5$, so $4$ is not a factor of $18$.", size: 42, step: 4 },
], "Find the factor pairs of each number with the calculator, then circle every number that appears in both. Finish with a calculator check on a number that is not common.");
const hcfModel = S.pairModel(`${P}-hcf-model`, "Find the HCF", "Find the common factors, then take the highest. Here: $12$ and $18$.", model(12, 18), common(12, 18), [
  { text: `Common factors: ${list(common(12, 18))}`, size: 52, step: 3 },
  { text: "The highest is $6$, so the HCF of $12$ and $18$ is $6$.", size: 54, bold: true, colour: GREEN, step: 4 },
], "Reuse the 12 and 18 pairs from the common factors slide: circle the common factors, then pick the highest.");

const discussion = (id: string, prompt: string, keyPoint: string, question: string, answer: string, brief: string) => {
  const s = S.discuss(id, prompt, keyPoint, question, "1");
  const els = s.els.map((e) => (e.kind === "maths" ? t(e.x, e.y, e.w, 260, answer, 40, { colour: BLUE, step: 3 }) : e));
  return { ...s, els: els as DeckElement[], brief };
};
const disc1 = discussion(`${P}-disc-common`, "Kofi says: \"The only common factor of $12$ and $18$ is $6$.\" Is he right?",
  "No. $1$, $2$ and $3$ are common factors too. $1$ is a factor of every number.", "Do $8$ and $9$ have a common factor? How do you know?",
  "Yes: $1$. The factors of $8$ are $1, 2, 4, 8$ and of $9$ are $1, 3, 9$. Only $1$ is in both.",
  "Short discussion after the 12 and 18 model. Pupils meet the idea that two numbers can have several common factors, and that 1 is always one of them.");
const disc2 = discussion(`${P}-disc-hcf`, "Ruby says: \"The HCF of $12$ and $18$ is $36$.\" What has she found?",
  "$36$ is in the $12$ and $18$ times tables, so it is a common multiple, not a common factor.", "Can the HCF of $12$ and $18$ ever be bigger than $12$? Why not?",
  "No. A factor of $12$ is never bigger than $12$, so the HCF cannot be more than $12$.",
  "Separates the HCF from the common multiples of last lesson: 36 is the first common multiple of 12 and 18.");

// ---------- the question sets ----------
// Whiteboards climb in help: partly completed pairs (blanks), then the number of pairs in brackets, then just the numbers.
// Book work is 3 x 3: the number(s) with a small "Hint: N pairs" for the first six, and no hint for the last three (the stretch).
const listWb = [
  factorsQ(`${P}-list-1`, 48, "blanks", [1, 2, 3, 4, 6, 8, 12, 16, 24, 48], { blank: [3, 6] }),
  factorsQ(`${P}-list-2`, 60, "pairs", [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]),
  factorsQ(`${P}-list-3`, 30, "none", [1, 2, 3, 5, 6, 10, 15, 30]),
];
const listBook = [
  factorsQ(`${P}-book-1`, 28, "none", [1, 2, 4, 7, 14, 28], { book: true, hint: true }),
  factorsQ(`${P}-book-2`, 40, "none", [1, 2, 4, 5, 8, 10, 20, 40], { book: true, hint: true }),
  factorsQ(`${P}-book-3`, 45, "none", [1, 3, 5, 9, 15, 45], { book: true, hint: true }),
  factorsQ(`${P}-book-4`, 56, "none", [1, 2, 4, 7, 8, 14, 28, 56], { book: true, hint: true }),
  factorsQ(`${P}-book-5`, 72, "none", [1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72], { book: true, hint: true }),
  factorsQ(`${P}-book-6`, 80, "none", [1, 2, 4, 5, 8, 10, 16, 20, 40, 80], { book: true, hint: true }),
  factorsQ(`${P}-book-7`, 100, "none", [1, 2, 4, 5, 10, 20, 25, 50, 100], { book: true }),
  factorsQ(`${P}-book-8`, 84, "none", [1, 2, 3, 4, 6, 7, 12, 14, 21, 28, 42, 84], { book: true }),
  factorsQ(`${P}-book-9`, 96, "none", [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 96], { book: true }),
];

const cfWb = [
  commonQ(`${P}-cf-1`, 30, 45, "blanks", [1, 3, 5, 15], { hideA: [2, 5], hideB: [3] }),
  commonQ(`${P}-cf-2`, 40, 56, "pairs", [1, 2, 4, 8]),
  commonQ(`${P}-cf-3`, 20, 50, "none", [1, 2, 5, 10]),
];
const cfBook = [
  commonQ(`${P}-cfb-1`, 16, 28, "none", [1, 2, 4], { book: true, hint: true }),
  commonQ(`${P}-cfb-2`, 27, 63, "none", [1, 3, 9], { book: true, hint: true }),
  commonQ(`${P}-cfb-3`, 32, 72, "none", [1, 2, 4, 8], { book: true, hint: true }),
  commonQ(`${P}-cfb-4`, 21, 35, "none", [1, 7], { book: true, hint: true }),
  commonQ(`${P}-cfb-5`, 44, 66, "none", [1, 2, 11, 22], { book: true, hint: true }),
  commonQ(`${P}-cfb-6`, 14, 15, "none", [1], { book: true, hint: true }),
  commonQ(`${P}-cfb-7`, 54, 90, "none", [1, 2, 3, 6, 9, 18], { book: true }),
  commonQ(`${P}-cfb-8`, 70, 105, "none", [1, 5, 7, 35], { book: true }),
  commonQ(`${P}-cfb-9`, 48, 80, "none", [1, 2, 4, 8, 16], { book: true }),
];

const hcfWb = [
  hcfQ(`${P}-hcf-1`, 32, 48, "blanks", 16, { hideA: [2], hideB: [3, 6] }),
  hcfQ(`${P}-hcf-2`, 45, 60, "pairs", 15),
  hcfQ(`${P}-hcf-3`, 20, 30, "none", 10),
];
const hcfBook = [
  hcfQ(`${P}-hcfb-1`, 28, 42, "none", 14, { book: true, hint: true }),
  hcfQ(`${P}-hcfb-2`, 49, 63, "none", 7, { book: true, hint: true }),
  hcfQ(`${P}-hcfb-3`, 40, 64, "none", 8, { book: true, hint: true }),
  hcfQ(`${P}-hcfb-4`, 35, 55, "none", 5, { book: true, hint: true }),
  hcfQ(`${P}-hcfb-5`, 66, 90, "none", 6, { book: true, hint: true }),
  hcfQ(`${P}-hcfb-6`, 14, 25, "none", 1, { book: true, hint: true }),
  hcfQ(`${P}-hcfb-7`, 75, 100, "none", 25, { book: true }),
  hcfQ(`${P}-hcfb-8`, 52, 78, "none", 26, { book: true }),
  hcfQ(`${P}-hcfb-9`, 96, 160, "none", 32, { book: true }),
];

const exitItems = [
  factorsQ(`${P}-exit-1`, 99, "none", [1, 3, 9, 11, 33, 99]),
  commonQ(`${P}-exit-2`, 22, 33, "none", [1, 11]),
  hcfQ(`${P}-exit-3`, 26, 39, "none", 13),
];
must(listBook.length === 9 && cfBook.length === 9 && hcfBook.length === 9, "book sets have nine questions");
must(new Set(hcfBook.map((q) => q.answer[0])).size === 9, "HCF book answers differ");

// The fresh-numbers rules (src/decks/deckRules.ts): the worked numbers are asked about nowhere, no number twice inside a section,
// the exit ticket uses numbers asked about nowhere else, no pair twice. The build fails if any is broken.
assertFreshNumbers({
  worked: [24, 12, 18, 36],
  sections: { listing: [...listWb, ...listBook], "common factors": [...cfWb, ...cfBook], HCF: [...hcfWb, ...hcfBook] },
  exit: exitItems,
});

export default () => ({
  id: ID, title: "Factors, Common Factors & HCF", strand: "Number", questionVersion: 2,
  summary: "One lesson for Set 6 after listing common multiples: list the factors of a number (using the calculator to test each divisor), find common factors from factor pairs, and pick out the HCF. Scaffolding is weaned off through the whiteboards; all questions are authored by hand.",
  slides: [
    S.title(`${P}-title`, "Factors, Common Factors & HCF", "Test with the calculator. List in order."),
    S.definition(`${P}-definition`, "Factor", "A factor of a number divides into it exactly, with no remainder.\n\nFactors come in pairs: $3 \\times 8 = 24$, so $3$ and $8$ are both factors of $24$.\n\n$1$ and the number itself are always factors."),
    calcTest,
    calcBoard,
    S.whiteboard(`${P}-list-wb`, "List the factors", listWb, "Three whiteboard questions on bigger numbers, using the calculator: 48 with some partners missing, 60 with the number of pairs given, then 30 with no help."),
    S.plainBook(`${P}-list-book`, listBook, 3, "Copy into your book. List all the factors of each number.", "Factors book work"),
    S.definition(`${P}-common-definition`, "Common factor", "A common factor of two numbers is a number that is a factor of both."),
    commonModel,
    disc1,
    S.whiteboard(`${P}-cf-wb`, "Find the common factors", cfWb, "Three whiteboard questions: both numbers' pairs partly given, then the number of pairs in brackets, then 20 and 50 with no help.", { table: true }),
    S.plainBook(`${P}-cf-book`, cfBook, 3, "Copy into your book. List all the common factors of each pair.", "Common factors book work"),
    S.definition(`${P}-hcf-definition`, "Highest common factor (HCF)", "The highest common factor (HCF) of two numbers is the largest number that is a factor of both."),
    hcfModel,
    disc2,
    S.whiteboard(`${P}-hcf-wb`, "Find the HCF", hcfWb, "Three whiteboard questions: both numbers' pairs partly given, then the number of pairs in brackets, then 20 and 30 with no help.", { table: true }),
    S.plainBook(`${P}-hcf-book`, hcfBook, 3, "Copy into your book. Find the HCF of each pair.", "HCF book work"),
    S.exitRows(`${P}-exit`, exitItems, "Work on your own. Use your calculator."),
  ] as Slide[],
});
