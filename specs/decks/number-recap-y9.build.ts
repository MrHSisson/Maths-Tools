// Build script for the "Number recap (Y9 Foundation)" deck (plan: specs/decks/number-recap-y9.md).
// One whiteboard lesson before the Number 1 assessment: five blocks in order of the marks they carry on the test. Each block opens with a cold
// question (nobody helped, tally the boards), then the fix, then a confirmer; the last question in each set is a spare if time runs short.
//   npm run deck -- build specs/decks/number-recap-y9.build.ts --replace
//   npm run deck -- check number-recap-y9 --layout
//   npm run deck -- review number-recap-y9
import { LOOK, Q, S, assertCentred, makeSlide, textEl, titleEls } from "/src/decks/builder";
import type { CuratedQuestion, Slide } from "/src/decks/types";

const ID = "number-recap-y9";
const P = "nr";
const T = ID;
const t = textEl;

// ---------- the maths (every answer is computed, then asserted) ----------
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const r = (x: number) => Math.round(x * 1e6) / 1e6;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const primeFactors = (n: number): number[] => { const out: number[] = []; for (let d = 2, m = n; m > 1; d++) while (m % d === 0) { out.push(d); m /= d; } return out; };
const idx = (primes: number[]) => { const m = new Map<number, number>(); primes.forEach((p) => m.set(p, (m.get(p) ?? 0) + 1)); return [...m].sort((a, b) => a[0] - b[0]).map(([p, c]) => (c > 1 ? `${p}^{${c}}` : `${p}`)).join(" \\times "); };
const centred = (lines: string[], what: string) => assertCentred(lines, what);

/** An open question, one line of question (or several), the answer, and working one mark to a line. */
function open(id: string, question: string[], answer: string, working: string[], rationale: string): CuratedQuestion {
  centred(question, id);
  const base = Q.open(`${P}-${id}`, T, "level1", question[0], answer, working);
  return { ...base, title: question[0].replace(/\.$/, ""), question, rationale };
}

// ---------- block C: decimals, scaling, multiplying, closest to a fraction (11 marks on the test) ----------
const addDec = (id: string, a: string, b: string, sum: string) => {
  must(r(Number(a) + Number(b)) === Number(sum), `${a} + ${b}`);
  return open(id, [`Work out $${a} + ${b}$.`], `$${sum}$`, [`Line up the decimal points: $${a}$ above $${b}$.`, `Add from the right, carrying when a column reaches $10$.`, `$${a} + ${b} = ${sum}$`], "Line up the decimal points, then add column by column.");
};
const subDec = (id: string, a: string, b: string, diff: string, padded: string, verb: "work" | "difference") => {
  must(r(Number(a) - Number(b)) === Number(diff), `${a} - ${b}`);
  const q = verb === "work" ? `Work out $${a} - ${b}$.` : `Find the difference between $${a}$ and $${b}$.`;
  return open(id, [q], `$${diff}$`, [`Fill the gap with a zero so both have the same number of decimal places: $${padded}$.`, `Line up the decimal points and subtract: $${padded.replace(" - ", " - ")} = ${diff}$`], "Placeholder zero, line up the points, subtract.");
};
const cDecimals = S.whiteboard(`${P}-c-decimals`, "Decimals: add and subtract", [
  addDec("dec-1", "6.84", "3.57", "10.41"),
  subDec("dec-2", "8.2", "3.45", "4.75", "8.20 - 3.45", "work"),
  subDec("dec-3", "9.06", "4.8", "4.26", "9.06 - 4.80", "difference"),
], "Question 1 is cold: tally the boards. Lining up the points and the placeholder zero (8.2 as 8.20) are the usual slips. The third question is a spare.");

const scale = (id: string, a: string, op: "\\times" | "\\div", p: number, ans: string) => {
  const v = op === "\\times" ? r(Number(a) * p) : r(Number(a) / p);
  must(v === Number(ans), `${a} ${op} ${p}`);
  const places = String(p).length - 1;
  const dir = op === "\\times" ? "left" : "right";
  return open(id, [`Work out $${a} ${op} ${p.toLocaleString("en-GB")}$.`], `$${ans}$`, [
    `${op === "\\times" ? "Multiplying" : "Dividing"} by $${p.toLocaleString("en-GB")}$ moves every digit ${places} places to the ${dir}.`, `$${a} ${op} ${p.toLocaleString("en-GB")} = ${ans}$`,
  ], "The digits move; the decimal point does not.");
};
const cScale = S.whiteboard(`${P}-c-scale`, "Multiply and divide by 10, 100, 1000", [
  scale("sc-1", "4.05", "\\times", 100, "405"),
  scale("sc-2", "7.3", "\\div", 1000, "0.0073"),
  scale("sc-3", "0.63", "\\times", 1000, "630"),
], "Question 1 is cold. Say 'the digits move' not 'the point moves'. The third question is a spare.");

const gridMul = (id: string, a: number, b: number) => {
  const tens = (n: number) => Math.floor(n / 10) * 10, ones = (n: number) => n % 10;
  const parts = [tens(a) * tens(b), tens(a) * ones(b), ones(a) * tens(b), ones(a) * ones(b)];
  const total = parts.reduce((x, y) => x + y, 0);
  must(total === a * b, `${a} x ${b}`);
  return open(id, [`Work out $${a} \\times ${b}$.`], `$${total}$`, [
    `Split both numbers: $${a} = ${tens(a)} + ${ones(a)}$ and $${b} = ${tens(b)} + ${ones(b)}$.`,
    `$${tens(a)} \\times ${tens(b)} = ${parts[0]}$, $\\;${tens(a)} \\times ${ones(b)} = ${parts[1]}$, $\\;${ones(a)} \\times ${tens(b)} = ${parts[2]}$, $\\;${ones(a)} \\times ${ones(b)} = ${parts[3]}$`,
    `Add the four parts: $${parts.join(" + ")} = ${total}$`,
  ], "Grid or partition: four small products, then add.");
};
const cMultiply = S.whiteboard(`${P}-c-multiply`, "Multiplying two 2-digit numbers", [
  gridMul("mul-1", 67, 43), gridMul("mul-2", 54, 28), gridMul("mul-3", 83, 36),
], "Question 1 is cold. Students show the grid or the four products on the board, not just the answer (3 marks on the test). The third question is a spare.");

const dec = (n: number) => String(r(n));
/** Which is closest to a fraction: each option is a decimal or a fraction (a, b). */
type Opt = number | [number, number];
const val = (o: Opt) => (typeof o === "number" ? o : o[0] / o[1]);
const optTex = (o: Opt) => (typeof o === "number" ? dec(o) : `\\dfrac{${o[0]}}{${o[1]}}`);
function closest(id: string, target: [number, number], options: Opt[], answerIdx: number) {
  const tv = target[0] / target[1];
  const gaps = options.map((o) => r(Math.abs(val(o) - tv)));
  const best = Math.min(...gaps);
  must(gaps.filter((g) => g === best).length === 1 && gaps[answerIdx] === best, `${id}: closest is not option ${answerIdx}`);
  const asDec = options.map((o, i) => (typeof o === "number" ? null : `$\\dfrac{${o[0]}}{${o[1]}} = ${dec(val(o))}$`)).filter(Boolean).join(", ");
  return open(id, [`Which is closest to $\\dfrac{${target[0]}}{${target[1]}}$?`, `$${options.map(optTex).join(" \\qquad ")}$`], `$${optTex(options[answerIdx])}$`, [
    `Write everything as a decimal: $\\dfrac{${target[0]}}{${target[1]}} = ${dec(tv)}$, ${asDec}.`,
    `Find how far each is from $${dec(tv)}$: $${gaps.map(dec).join(", \\; ")}$`,
    `The smallest gap is $${dec(best)}$, so $${optTex(options[answerIdx])}$ is closest.`,
  ], "Convert to decimals, then compare the distance from the target. The biggest or smallest is not the answer.");
}
const cClosest = S.whiteboard(`${P}-c-closest`, "Which is closest to a fraction?", [
  closest("cl-1", [1, 4], [0.22, [3, 10], 0.27, [6, 25]], 3),
  closest("cl-2", [1, 5], [0.18, [3, 20], 0.23, [4, 25]], 0),
  closest("cl-3", [3, 4], [0.72, [4, 5], 0.78, [37, 50]], 3),
], "Question 1 is cold. The point is the distance from the target, not which is biggest. The third question is a spare.");

// ---------- block E: estimating and best buy (7 marks) ----------
const est = (id: string, a: string, b: string, c: string, expected: number) =>
  Q.fraction(`${P}-${id}`, "level1", [a, "\\times", b], c);
const estOf = (a: number, b: number, c: number) => {
  const sf = (n: number) => Number(n.toPrecision(1));
  return (sf(a) * sf(b)) / sf(c);
};
must(estOf(28.7, 9.8, 0.52) === 600 && estOf(6.1, 19.7, 0.39) === 300 && estOf(82, 4.9, 0.21) === 2000, "estimates");
const eEstimate = S.whiteboard(`${P}-e-estimate`, "Estimating a calculation", [
  est("est-1", "28.7", "9.8", "0.52", 600), est("est-2", "6.1", "19.7", "0.39", 300), est("est-3", "82", "4.9", "0.21", 2000),
].map((q) => ({ ...q, rationale: "Round every number to 1 significant figure, work out the top, then divide." })), "Question 1 is cold. Round each number to 1 s.f. first. Dividing by 0.5 is the sticking point: say 'divide by a half is the same as double'. The third question is a spare.");

const pence = (p: number) => (p % 100 === 0 ? `£${p / 100}` : `£${(p / 100).toFixed(2)}`);
// plan X: £5 + 4p a text; plan Y: 6p a text; 150 texts
const xCost = 500 + 150 * 4, yCost = 150 * 6;
must(xCost === 1100 && yCost === 900, "plans X and Y");
// tiered call: first 20 minutes 4p, then 6p, 50 minutes
const tier = 20 * 4 + 30 * 6;
must(tier === 260, "tiered call");
// taxis: A £3 + 80p a mile, B £1.50 a mile, 5 miles
const taxiA = 300 + 5 * 80, taxiB = 5 * 150;
must(taxiA === 700 && taxiB === 750 && taxiA < taxiB, "taxis");
const eBestBuy = S.whiteboard(`${P}-e-bestbuy`, "Money: which is the best buy?", [
  open("buy-1", ["Plan X: £5 a month plus 4p for each text. Plan Y: 6p for each text. Sam sends 150 texts. Which plan is cheaper?"], `Plan Y (${pence(yCost)} against ${pence(xCost)})`, [
    `Plan X: 150 × 4p = 600p = £6, then £6 + £5 = ${pence(xCost)}.`, `Plan Y: 150 × 6p = 900p = ${pence(yCost)}.`, `${pence(yCost)} is less than ${pence(xCost)}, so Plan Y is cheaper.`,
  ], "Cost each plan for the same number of texts in the same unit, then compare."),
  open("buy-2", ["A phone plan charges 4p a minute for the first 20 minutes and 6p a minute after that. How much is a 50-minute call?"], pence(tier), [
    "First 20 minutes: 20 × 4p = 80p.", "The other 30 minutes: 30 × 6p = 180p.", `Total: 80p + 180p = 260p = ${pence(tier)}.`,
  ], "A tiered price: cost each band separately, then add."),
  open("buy-3", ["Taxi A charges £3 plus 80p a mile. Taxi B charges £1.50 a mile. Which is cheaper for 5 miles, and by how much?"], `Taxi A, by ${pence(taxiB - taxiA)} (${pence(taxiA)} against ${pence(taxiB)})`, [
    `Taxi A: 5 × 80p = 400p = £4, then £4 + £3 = ${pence(taxiA)}.`, `Taxi B: 5 × £1.50 = ${pence(taxiB)}.`, `${pence(taxiA)} is less than ${pence(taxiB)}, so Taxi A is cheaper by ${pence(taxiB - taxiA)}.`,
  ], "Same method with mixed pounds and pence: change everything to pence first, or everything to pounds."),
], "Question 1 is cold. Cost every option in the same unit, then compare in a sentence (the last mark on the test). The third question is a spare.");

// ---------- block D: prime factors to HCF (4 marks) ----------
function primesQ(id: string, n: number, split: [number, number], expect: number[]) {
  const pf = primeFactors(n);
  must(JSON.stringify(pf) === JSON.stringify(expect) && split[0] * split[1] === n, `primes of ${n}`);
  const work = (m: number) => primeFactors(m).join(" \\times ");
  return open(id, [`Write $${n}$ as a product of its prime factors.`], `$${n} = ${idx(pf)}$`, [
    `Split into a pair of factors: $${n} = ${split[0]} \\times ${split[1]}$.`,
    `Keep splitting until every branch ends in a prime: $${split[0]} = ${work(split[0])}$, $\\;${split[1]} = ${work(split[1])}$.`,
    `Write the primes in order: $${n} = ${pf.join(" \\times ")}$`, `In index form: $${n} = ${idx(pf)}$`,
  ], "A factor tree, circle the primes, then write the product in order.");
}
const dPrimes = S.whiteboard(`${P}-d-primes`, "Prime factors", [
  primesQ("pf-1", 90, [9, 10], [2, 3, 3, 5]), primesQ("pf-2", 140, [14, 10], [2, 2, 5, 7]), primesQ("pf-3", 252, [4, 63], [2, 2, 3, 3, 7]),
], "Question 1 is cold. Students draw the tree on their boards. The third question is a spare.");

/** The HCF from prime factorisations: the lowest power of each shared prime. */
function hcfFromPrimes(a: number, b: number) {
  const ca = new Map(primeFactors(a).reduce((m, p) => m.set(p, (m.get(p) ?? 0) + 1), new Map<number, number>()));
  const cb = new Map(primeFactors(b).reduce((m, p) => m.set(p, (m.get(p) ?? 0) + 1), new Map<number, number>()));
  const shared: number[] = [];
  ca.forEach((n, p) => { for (let i = 0; i < Math.min(n, cb.get(p) ?? 0); i++) shared.push(p); });
  const product = shared.reduce((x, y) => x * y, 1);
  must(product === gcd(a, b), `HCF of ${a} and ${b}`);
  return { shared, product };
}
const hcfGiven = (id: string, a: number, b: number) => {
  const h = hcfFromPrimes(a, b);
  return open(id, [`$${a} = ${idx(primeFactors(a))}$ and $${b} = ${idx(primeFactors(b))}$.`, `Find the HCF of $${a}$ and $${b}$.`], `$${h.product}$`, [
    `Circle the primes that are in both: $${h.shared.join(", ")}$.`, `Multiply them: $${h.shared.join(" \\times ")} = ${h.product}$`, `The HCF of $${a}$ and $${b}$ is $${h.product}$.`,
  ], "Both numbers' primes are shown: take every prime they share, at the lower power, and multiply.");
};
const hcfOne = (id: string, a: number, b: number) => {
  const h = hcfFromPrimes(a, b);
  return open(id, [`$${a} = ${idx(primeFactors(a))}$.`, `Write $${b}$ as a product of primes, then find the HCF of $${a}$ and $${b}$.`], `$${b} = ${idx(primeFactors(b))}$ and HCF $= ${h.product}$`, [
    `$${b} = ${primeFactors(b).join(" \\times ")} = ${idx(primeFactors(b))}$`, `The primes in both: $${h.shared.join(", ")}$.`, `$${h.shared.join(" \\times ")} = ${h.product}$, so the HCF of $${a}$ and $${b}$ is $${h.product}$.`,
  ], "As the test asks: write one number in primes yourself, use the other as given, then take the shared primes.");
};
const hcfBoth = (id: string, a: number, b: number) => {
  const h = hcfFromPrimes(a, b);
  return open(id, [`Find the HCF of $${a}$ and $${b}$.`], `$${h.product}$`, [
    `$${a} = ${idx(primeFactors(a))}$ and $${b} = ${idx(primeFactors(b))}$`, `The primes in both: $${h.shared.join(", ")}$.`, `$${h.shared.join(" \\times ")} = ${h.product}$, so the HCF is $${h.product}$.`,
  ], "Prime factors of both, then the shared primes.");
};
const dHcf = S.whiteboard(`${P}-d-hcf`, "HCF from prime factors", [hcfGiven("hcf-1", 126, 84), hcfOne("hcf-2", 150, 210), hcfBoth("hcf-3", 132, 198)],
  "Question 1 is cold: both prime forms are given. Question 2 has one given, as on the test. The third question is a spare.");

// ---------- block B: order of operations (2 marks) ----------
must(2 + 3 * 4 - 1 === 13 && (2 + 3) * 4 - 1 === 19 && 6 * (10 - 4) === 36 && 6 * 10 - 4 === 56, "BIDMAS");
// brackets: only one placement gives 19
const placements = [(2 + 3) * 4 - 1, 2 + (3 * 4) - 1, 2 + 3 * (4 - 1)];
must(placements.filter((v) => v === 19).length === 1, "one bracket placement gives 19");
const bOrder = S.whiteboard(`${P}-b-order`, "Order of operations", [
  open("bod-1", ["Work out $2 + 3 \\times 4 - 1$."], "$13$", ["Multiply first: $3 \\times 4 = 12$.", "$2 + 12 - 1$", "Add and subtract from left to right: $13$"], "Multiplication before addition and subtraction."),
  open("bod-2", ["Add one pair of brackets so that", "$2 + 3 \\times 4 - 1 = 19$"], "$(2 + 3) \\times 4 - 1 = 19$", ["Try bracketing $2 + 3$: $(2 + 3) \\times 4 - 1$.", "Bracket first: $5 \\times 4 - 1$.", "Multiply, then subtract: $20 - 1 = 19$"], "Brackets change the order; try the placements and check."),
  open("bod-3", ["Dev works out $6 \\times (10 - 4)$.", "His working: $6 \\times (10 - 4) = 60 - 4 = 56$", "What mistake has he made?"], "He multiplied by $10$ and ignored the bracket: it is $36$", [
    "He did $6 \\times 10$ first, but the bracket must be worked out first.", "Bracket first: $10 - 4 = 6$.", "Then $6 \\times 6 = 36$."], "Brackets come first, even when the multiplication is written before them."),
], "Question 1 is cold. Question 3 is the error-spot; the sentence 'he did ... but should have done ...' is the answer. The third question is a spare.");

// ---------- block A: negatives and powers (2 marks) ----------
must((-6) ** 2 === 36 && -(6 ** 2) === -36 && (-5) ** 2 === 25, "squares");
const bandA = S.whiteboard(`${P}-a-negatives`, "Negatives and squares", [
  open("neg-1", ["Write in order, smallest first:", "$-9, \\quad 4, \\quad -2, \\quad -15, \\quad 0$"], "$-15, \\; -9, \\; -2, \\; 0, \\; 4$", ["The negatives are smallest, and the bigger the number after the minus sign, the smaller the number: $-15 < -9 < -2$.", "Then $0$, then $4$."], "Order on a number line, negatives first."),
  open("neg-2", ["Work out $(-6)^2$.", "Then work out $-6^2$."], "$(-6)^2 = 36$ and $-6^2 = -36$", ["$(-6)^2 = -6 \\times -6 = 36$, since a negative times a negative is positive.", "$-6^2$: square the $6$ first, then make it negative: $-(6 \\times 6) = -36$."], "The brackets decide what is squared."),
  open("neg-3", ["Zoe says $(-5)^2 = -25$.", "What mistake has she made?"], "She squared only the $5$ and kept the minus: $(-5)^2 = 25$", ["She worked out $5 \\times 5 = 25$ and put the minus back on.", "$(-5)^2$ means $-5 \\times -5$, and a negative times a negative is positive: $25$."], "Squaring a negative gives a positive."),
], "Question 1 is cold. Squaring a negative is the idea to leave them with (the test asks whether a squared negative can be negative). The third question is a spare.");

// ---------- the Friday list ----------
const tally = S.board(`${P}-tally`, "Friday's list", "Which blocks had fewer than 6 in 10 right on question 1?", {
  head: ["Block", "Right on Q1"], given: 1,
  rows: [["Decimals and scaling", ""], ["Estimating and money", ""], ["Prime factors and HCF", ""], ["Order of operations", ""], ["Negatives and squares", ""]],
});

// quick sanity on the pence helper
must(pence(1100) === "£11" && pence(260) === "£2.60" && pence(50) === "£0.50", "pence helper");

export default () => ({
  id: ID, title: "Number Recap (Y9 Foundation)", strand: "Number", questionVersion: 2,
  summary: "A whiteboard recap before the Year 9 Number 1 assessment, in order of the marks each block carries: decimals, scaling and multiplying; estimating and money; prime factors and HCF; order of operations; negatives and squares. Question 1 of each block is cold and gives the tally for the next lesson's starter.",
  slides: [
    S.title(`${P}-title`, "Number Recap", "Whiteboards up"),
    S.summary(`${P}-how`, "How this works", ["Question 1: on your own, no help. Hold it up.", "We sort out any mistakes together.", "Questions 2 and 3: have another go."]),
    cDecimals, cScale, cMultiply,
    bOrder, bandA,
    eEstimate, eBestBuy,
    dPrimes, dHcf,
    cClosest,
    tally,
  ] as Slide[],
});

void makeSlide; void t; void titleEls; void LOOK;
