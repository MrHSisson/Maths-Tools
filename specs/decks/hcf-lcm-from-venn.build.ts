// Build script for the second Venn deck, "HCF & LCM from a Venn" (plan: specs/decks/venn-hcf-lcm.md, sections 3 and 4; it follows deck 1,
// "Venn Diagrams & Product of Primes", built by venn-hcf-lcm.build.ts).
//   npm run deck -- looks specs/decks/hcf-lcm-from-venn.build.ts      the look card (one slide of each kind)
//   npm run deck -- build specs/decks/hcf-lcm-from-venn.build.ts --replace
//   npm run deck -- check hcf-lcm-from-venn --layout ; npm run deck -- review hcf-lcm-from-venn
// Every tile, HCF and LCM below is computed (src/shared/venn.ts) and asserted: nothing is typed in by hand that a pupil could be wrongly told.
import { Q, S, assertCentred, assertFreshNumbers, hintLine, makeSlide, textEl } from "/src/decks/builder";
import { misconceptionLabel } from "/src/shared/misconceptions";
import { factorList, factorListRegions, hcfLine, hcfOf, lcmLine, lcmOf, primeFactors, splitPrimes, vennFlags, vennProblems, type VennRegions } from "/src/shared/venn";
import type { CuratedQuestion, DeckElement, Slide, VennCard } from "/src/decks/types";

const ID = "hcf-lcm-from-venn";
const P = "hl";
const T = ID;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const tex = (ps: readonly number[]) => ps.join(" \\times ");
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// The pairs deck 1 already asked (never asked again here), read from its build script's lists.
const DECK1_PAIRS: [number, number][] = [[6, 14], [21, 35], [30, 42], [70, 105], [14, 35], [6, 21], [33, 77], [30, 105], [42, 70], [66, 110], [28, 63], [20, 90], [40, 44],
  [45, 75], [20, 30], [40, 56], [36, 63], [36, 48], [75, 100], [6, 35], [21, 63], [60, 84], [6, 25], [14, 42], [48, 72], [20, 44], [16, 21], [35, 105], [30, 50], [40, 100]];
const DECK1_KEYS = new Set(DECK1_PAIRS.map(([a, b]) => `${a},${b}`));

type Kind = "a" | "b" | "c" | "d" | "e" | "f" | "g";
const KIND: Record<Kind, (r: VennRegions) => boolean> = {
  a: (r) => r.middle.length === 1 && r.left.length > 0 && r.right.length > 0,
  b: (r) => r.middle.length === 2 && !vennFlags(r).repeatedInMiddle && r.left.length > 0 && r.right.length > 0,
  c: (r) => r.middle.length >= 2 && vennFlags(r).spareCopy,
  d: (r) => vennFlags(r).repeatedInMiddle && !vennFlags(r).spareCopy,
  e: (r) => r.middle.length >= 3,
  f: (r) => vennFlags(r).oneInside,
  g: (r) => vennFlags(r).emptyMiddle,
};
type Pair = [number, number, Kind];
const seenPairs = new Set<string>();
/** Every pair on a slide, sheet or question goes through here: a good Venn, the kind the ladder wants, an LCM of at most 500, new in this deck and in deck 1. */
function checkPair([a, b, kind]: Pair, where: string): VennRegions {
  must(vennProblems(a, b).length === 0, `${where}: ${a} and ${b}: ${vennProblems(a, b).join("; ")}`);
  const r = splitPrimes(a, b);
  must(KIND[kind](r), `${where}: ${a} and ${b} is not kind ${kind}`);
  must(lcmOf(r) <= 500, `${where}: ${a} and ${b}: LCM ${lcmOf(r)} is over 500`);
  must(hcfOf(r) === gcd(a, b) && lcmOf(r) === (a * b) / gcd(a, b), `${where}: ${a} and ${b}: HCF and LCM from the Venn match the arithmetic`);
  const key = `${a},${b}`;
  must(!seenPairs.has(key) && !DECK1_KEYS.has(key), `${where}: ${a} and ${b} already asked`);
  seenPairs.add(key);
  return r;
}
const placedCards = (a: number, b: number): VennCard[] => { const r = splitPrimes(a, b); return (["left", "middle", "right"] as const).flatMap((region) => r[region].map((n) => ({ text: String(n), tile: true, region }))); };

type Ask = "hcf" | "lcm";
const ansTex = (ask: Ask, r: VennRegions): string => {
  if (ask === "hcf") return r.middle.length === 0 ? "\\mathrm{HCF} = 1" : r.middle.length === 1 ? `\\mathrm{HCF} = ${r.middle[0]}` : `\\mathrm{HCF} = ${tex(r.middle)} = ${hcfOf(r)}`;
  const all = [...r.left, ...r.middle, ...r.right].sort((x, y) => x - y);
  return all.length === 1 ? `\\mathrm{LCM} = ${all[0]}` : `\\mathrm{LCM} = ${tex(all)} = ${lcmOf(r)}`;
};
const lineOf = (ask: Ask, r: VennRegions) => (ask === "hcf" ? hcfLine(r) : lcmLine(r));

/** A question: the two numbers (as the book work or whiteboard shows them), the answer line computed and kept, and the tempting wrong answers. */
function pairQ(id: string, p: Pair, ask: Ask, o: { hint?: boolean; book?: boolean } = {}): CuratedQuestion {
  const [a, b] = p;
  const r = checkPair(p, id);
  const word = ask === "hcf" ? "HCF" : "LCM";
  const hint = o.hint && r.middle.length > 0 ? [hintLine(`${r.middle.length} tile${r.middle.length === 1 ? "" : "s"} in the middle`)] : [];
  const lines = o.book ? [`$${a},\\;${b}$`, ...hint] : [`Find the ${word} of $${a}$ and $${b}$.`];
  if (!o.book) assertCentred(lines, id);
  const right = ask === "hcf" ? hcfOf(r) : lcmOf(r);
  const mistakes: { response: string; reasoning: string }[] = [];
  const addWrong = (response: number, reasoning: string) => { must(response !== right, `${id}: the wrong answer ${response} is the right one`); mistakes.push({ response: String(response), reasoning }); };
  if (ask === "hcf") {
    addWrong(lcmOf(r), "Multiplies every tile in the Venn. That is the LCM: the HCF is only the middle.");
    if (r.middle.length === 0) addWrong(0, "Takes an empty middle as 0. Nothing is multiplied, so the HCF is 1.");
  } else {
    addWrong(hcfOf(r), "Multiplies only the middle. That is the HCF: the LCM needs every tile.");
    if (r.middle.length > 0) addWrong(a * b, "Multiplies the two numbers, which counts the shared tiles twice.");
  }
  return { ...Q.open(id, T, "level1", lines[0], `$${ansTex(ask, r)}$`, [], mistakes), title: `$${a}$ and $${b}$`, question: lines,
    rationale: ask === "hcf" ? "Build the Venn, then multiply the tiles in the middle." : "Build the Venn, then multiply every tile." };
}
const pairSet = (prefix: string, pairs: Pair[], ask: Ask, hints: number, book = false) => pairs.map((p, i) => pairQ(`${P}-${prefix}${i + 1}`, p, ask, { hint: i < hints, book }));

// ---------- the worked pair (never asked): 12 and 18 ----------
const w = splitPrimes(12, 18);
must(same(w, { left: [2], middle: [2, 3], right: [3] }) && hcfOf(w) === 6 && lcmOf(w) === 36, "12 and 18");
must(same(factorList(12), [1, 2, 3, 4, 6, 12]) && same(factorList(18), [1, 2, 3, 6, 9, 18]), "factors of 12 and 18");
const wf = factorListRegions(12, 18);
must(same(wf, { left: [4, 12], middle: [1, 2, 3, 6], right: [9, 18] }) && Math.max(...wf.middle) === hcfOf(w), "the biggest common factor is the HCF");
const WORKED = [12, 18];

const cardsAt = (r: VennRegions, tile: boolean): VennCard[] => (["left", "middle", "right"] as const).flatMap((region) => r[region].map((n) => ({ text: String(n), region, ...(tile ? { tile: true } : {}) })));
const vennEl = (x: number, y: number, a: number, b: number, cards: VennCard[], box: string, size: number): DeckElement =>
  ({ kind: "venn", x, y, w: 700, h: 490, left: String(a), right: String(b), box, cards, size } as unknown as DeckElement);

// ---------- the retrieval slides ----------
const quick = (id: string, qs: CuratedQuestion[]): Slide => { const q = S.quick(id, "Quickfire", qs, 2, "Four quick ones."); return { ...q, els: q.els.map((e) => (e.kind === "grid" ? { ...e, align: "center" as const } : e)) } as Slide; };
const must20 = same(primeFactors(20), [2, 2, 5]) && same(primeFactors(84), [2, 2, 3, 7]);
must(must20, "retrieval factorisations");
const mid1 = [2, 2, 3], mid2 = [5, 7];
const recapA: CuratedQuestion[] = [
  { ...Q.open(`${P}-r1`, T, "level1", "Write $20$ as a product of primes.", `$${tex(primeFactors(20))}$`), question: ["Write $20$ as a product of primes."] },
  { ...Q.open(`${P}-r2`, T, "level1", "Write $84$ as a product of primes.", `$${tex(primeFactors(84))}$`), question: ["Write $84$ as a product of primes."] },
  { ...Q.open(`${P}-r3`, T, "level1", "What goes in the middle of a Venn?", "The prime tiles both numbers have."), question: ["What goes in the middle of a Venn?"] },
  { ...Q.open(`${P}-r4`, T, "level1", "$10 = 2 \\times 5$ and $15 = 3 \\times 5$. Which tile is in the middle?", "$5$"), question: ["$10 = 2 \\times 5$ and $15 = 3 \\times 5$.", "Which tile goes in the middle?"] },
];
must(same(splitPrimes(10, 15).middle, [5]), "retrieval: 10 and 15 share a 5");
const recapB: CuratedQuestion[] = [
  { ...Q.open(`${P}-q1`, T, "level1", `The middle holds $${mid1.join(", ")}$. What is the HCF?`, `$${mid1.reduce((x, y) => x * y, 1)}$`), question: [`The middle holds $${mid1.join(", ")}$.`, "What is the HCF?"] },
  { ...Q.open(`${P}-q2`, T, "level1", `The middle holds $${mid2.join(", ")}$. What is the HCF?`, `$${mid2.reduce((x, y) => x * y, 1)}$`), question: [`The middle holds $${mid2.join(", ")}$.`, "What is the HCF?"] },
  { ...Q.open(`${P}-q3`, T, "level1", "The middle is empty. What is the HCF?", "$1$"), question: ["The middle is empty.", "What is the HCF?"] },
  { ...Q.open(`${P}-q4`, T, "level1", "What is the HCF of $6$ and $9$?", `$${gcd(6, 9)}$`), question: ["What is the HCF of $6$ and $9$?"] },
];
must(mid1.reduce((x, y) => x * y, 1) === 12 && mid2.reduce((x, y) => x * y, 1) === 35 && gcd(6, 9) === 3, "recap answers");

// ---------- section: HCF ----------
// Why the middle? 12 and 18 as lists of factors (the overlap is the common factors) and as prime tiles (the middle multiplies to the same number)
const whySlide = makeSlide(`${P}-why`, "teach", "Why the middle?", [
  textEl(70, 36, 1460, 100, "Why the middle?", 56, { bold: true }),
  vennEl(60, 170, 12, 18, cardsAt(wf, false), "Factors", 1.15), vennEl(840, 170, 12, 18, cardsAt(w, true), "Prime tiles", 1.15),
  textEl(60, 690, 700, 80, "Common factors: 1, 2, 3, 6", 38, { align: "center" }),
  textEl(60, 770, 700, 80, "The biggest is 6.", 38, { bold: true, align: "center" }),
  textEl(840, 690, 700, 80, "The middle: 2 and 3", 38, { align: "center" }),
  textEl(840, 770, 700, 80, "2 × 3 = 6", 38, { bold: true, align: "center" }),
]);
const keyHcf = S.venn(`${P}-key-hcf`, "HCF: the middle", "12", "18", placedCards(12, 18), { box: "Prime factors", lines: ["hcf"], prompt: "Multiply the tiles in the middle." });

// A build slide: the numbers as prime tiles (left 2/5), the Venn (right 3/5), prime buttons along the bottom; one click shows the answer line top right.
const buildAsk = (prefix: string, title: string, pairs: Pair[], ask: Ask, brief: string): Slide[] => pairs.map(([a, b], i) => {
  const r = splitPrimes(a, b);
  const slide = S.vennBuild(`${P}-${prefix}-${i + 1}`, title, String(a), String(b), [a, b], { box: "Prime factors" });
  const [head, ...rest] = slide.els;
  const shorter = { ...head, w: 720 } as DeckElement;
  const reveal = textEl(800, 48, 730, 80, lineOf(ask, r), 48, { bold: true, align: "right", middle: true, step: 1 });
  return { ...slide, els: [shorter, ...rest, reveal] as DeckElement[], ...(i === 0 ? { brief } : {}) };
});
const HCF_RUN: Pair[] = [[15, 40, "a"], [42, 66, "b"], [32, 56, "c"], [9, 28, "g"]];
const HCF_RUN_Q = pairSet("ha", HCF_RUN, "hcf", 0);
const hcfRun = buildAsk("hcf", "HCF: build the Venn", HCF_RUN, "hcf", "Build the Venn from the two numbers, then multiply the tiles in the middle to find the HCF. One shared prime, then two, then a repeated prime, then nothing shared (the HCF is 1, not 0). Four slides, one Venn each; one click shows the HCF line.");
const HCF_BOOK: Pair[] = [[22, 55, "a"], [15, 70, "a"], [28, 98, "b"], [50, 60, "b"], [52, 78, "b"], [72, 90, "c"], [96, 120, "e"], [27, 81, "f"], [8, 21, "g"]];
const HCF_BOOK_Q = pairSet("hb", HCF_BOOK, "hcf", 6, true);

// Depth cards: one speaker and a "do you agree?"
type Mistake = { response: string; reasoning: string };
void (null as unknown as Mistake);
function agreeQ(id: string, who: string, claim: string, agrees: boolean, correct: string, wrong: string, why: string[], mis: string): CuratedQuestion {
  const base = Q.open(id, T, "level1", `Do you agree with ${who}?`, correct, why);
  const options = [{ text: "I agree", correct: agrees, reasoning: agrees ? "" : wrong }, { text: "I disagree", correct: !agrees, reasoning: agrees ? wrong : "" }];
  must(options.filter((o) => o.correct).length === 1 && options.every((o) => o.correct || o.reasoning), `${id}: one correct option, the wrong one explained`);
  return { ...base, title: `Do you agree with ${who}?`, purpose: "diagnose", format: "claims", claims: [{ name: who, text: claim }], options, expectedErrors: [], depth: { prompt: "", takeaway: "" }, misconception: { id: mis, label: misconceptionLabel(mis) } } as CuratedQuestion;
}
const depthPage = (id: string, q: CuratedQuestion): Slide =>
  makeSlide(id, "depth", "Depth", [{ kind: "questions", x: 24, y: 24, w: 1552, h: 852, presentation: "full", visualiser: false, items: [q] } as never]);
const d1 = splitPrimes(25, 63);
must(same(primeFactors(25), [5, 5]) && same(primeFactors(63), [3, 3, 7]) && d1.middle.length === 0 && hcfOf(d1) === 1, "25 and 63");
const depthHcf = agreeQ(`${P}-dp1`, "Dev", "The middle of the Venn for $25$ and $63$ is empty, so the HCF is $0$.", false,
  "Disagree: an empty middle means the HCF is $1$. Nothing to multiply is $1$, and $1$ divides everything.",
  "Takes an empty middle as 0. Multiplying no tiles leaves 1, and 1 is a factor of every number.",
  ["$25 = 5 \\times 5$ and $63 = 3 \\times 3 \\times 7$ share no tile.", "The middle is empty.", "HCF $= 1$."], "venn-empty-middle-zero");
const d2 = splitPrimes(26, 65);
must(same(primeFactors(26), [2, 13]) && same(primeFactors(65), [5, 13]) && same(d2.middle, [13]) && lcmOf(d2) === 130 && 26 * 65 !== 130, "26 and 65");
const depthLcm = agreeQ(`${P}-dp2`, "Amara", "The LCM of $26$ and $65$ is $26 \\times 65 = 1690$, because you multiply the two numbers.", false,
  "Disagree: $26 \\times 65$ counts the shared $13$ twice. Multiply every tile once: $2 \\times 5 \\times 13 = 130$.",
  "Multiplies the two numbers, which counts the shared tile twice. The LCM uses each tile in the Venn once.",
  ["The shared $13$ is one tile in the middle.", "Every tile once: $2 \\times 13 \\times 5$.", "LCM $= 130$."], "venn-tile-both-sides");

// ---------- section: LCM ----------
const keyLcm = S.venn(`${P}-key-lcm`, "LCM: everything", "12", "18", placedCards(12, 18), { box: "Prime factors", lines: ["hcf", "lcm"], prompt: "Multiply every tile in the Venn." });
const LCM_RUN: Pair[] = [[6, 10, "a"], [30, 36, "b"], [20, 28, "d"], [22, 66, "f"]];
const LCM_RUN_Q = pairSet("la", LCM_RUN, "lcm", 0);
const lcmRun = buildAsk("lcm", "LCM: build the Venn", LCM_RUN, "lcm", "Build the Venn from the two numbers, then multiply every tile to find the LCM. One shared prime, then two, then a repeated prime, then one number inside the other (the LCM is the bigger number). Four slides, one Venn each; one click shows the LCM line.");
const LCM_BOOK: Pair[] = [[6, 15, "a"], [21, 28, "a"], [24, 30, "b"], [45, 60, "b"], [42, 98, "b"], [36, 54, "c"], [80, 100, "c"], [14, 70, "f"], [9, 32, "g"]];
const LCM_BOOK_Q = pairSet("lb", LCM_BOOK, "lcm", 6, true);

// the worksheets: blank Venns with the numbers and factorisations beside them and an HCF and an LCM line to fill in (no scaffold)
const sheet = (id: string, title: string, note: string, pairs: Pair[]) => S.vennSheet(id, { title, note, items: pairs.map(([a, b]) => ({ a, b, lines: true })) }, "indices");   // a pinned sheet carries a real tool id
const sheetHcf = sheet(`${P}-sheet-1`, "Worksheet 1: HCF from a Venn", "Put each prime factor in the right part of the Venn, then find the HCF.", HCF_BOOK);
const sheetLcm = sheet(`${P}-sheet-2`, "Worksheet 2: LCM from a Venn", "Put each prime factor in the right part of the Venn, then find the LCM.", LCM_BOOK);

const book = (id: string, qs: CuratedQuestion[], ask: Ask, title: string, brief: string): Slide =>
  ({ ...S.plainBook(id, qs, 3, `Copy into your book. Draw a Venn, then find the ${ask === "hcf" ? "HCF" : "LCM"}.`, title), brief });

const slides: Slide[] = [
  S.title(`${P}-title`, "HCF & LCM from a Venn", "Multiply the middle. Multiply the lot."),
  S.objective(`${P}-objective`, "I can find the HCF and the LCM of two numbers from a Venn diagram.", ["Build a Venn from the prime factors of two numbers", "Multiply the tiles in the middle to get the HCF", "Multiply every tile to get the LCM"]),
  S.divider(`${P}-d1`, "HCF from the Venn"),
  quick(`${P}-recap-a`, recapA),
  whySlide,
  keyHcf,
  ...hcfRun,
  book(`${P}-book-hcf`, HCF_BOOK_Q, "hcf", "Book work: HCF from a Venn", "Nine in a 3 by 3 grid, plain numbers: the first six carry a quiet count of the middle tiles. Draw the Venn, multiply the middle."),
  S.visualiser(`${P}-answers-1`, "Visualiser: worksheet 1 answers"),
  depthPage(`${P}-depth-1`, depthHcf),
  S.divider(`${P}-d2`, "LCM from the Venn"),
  quick(`${P}-recap-b`, recapB),
  keyLcm,
  ...lcmRun,
  book(`${P}-book-lcm`, LCM_BOOK_Q, "lcm", "Book work: LCM from a Venn", "Nine in a 3 by 3 grid, plain numbers: the first six carry a quiet count of the middle tiles. Draw the Venn, multiply every tile."),
  S.visualiser(`${P}-answers-2`, "Visualiser: worksheet 2 answers"),
  depthPage(`${P}-depth-2`, depthLcm),
  S.divider(`${P}-d-sheets`, "Worksheet slides"),
  sheetHcf,
  sheetLcm,
];
must(slides.length === 26, `the deck is 26 slides (is ${slides.length})`);
must(HCF_BOOK_Q.length === 9 && LCM_BOOK_Q.length === 9 && [...HCF_RUN_Q, ...LCM_RUN_Q].length === 8, "the book sets are nine, 3 x 3; the runs are four each");
[HCF_BOOK_Q, LCM_BOOK_Q].forEach((set, i) => must(new Set(set.map((q) => q.id)).size === set.length && set.length >= 5, `book set ${i} has at least five distinct questions (R42)`));

// The fresh-numbers rules (src/decks/deckRules.ts): the worked numbers asked nowhere, no number twice inside a set, the Depth numbers asked nowhere.
const DEPTH_NUMBERS = [25, 63, 26, 65];
const allSets: [string, CuratedQuestion[]][] = [["hcf run", HCF_RUN_Q], ["hcf book", HCF_BOOK_Q], ["lcm run", LCM_RUN_Q], ["lcm book", LCM_BOOK_Q]];
for (const [name, qs] of allSets) for (const q of qs) for (const n of (q.title.match(/\d+/g) ?? []).map(Number)) must(!DEPTH_NUMBERS.includes(n), `${name}: ${q.id} uses a Depth number ${n}`);
assertFreshNumbers({ worked: WORKED, sections: Object.fromEntries(allSets), exit: [] });

export default () => ({
  id: ID, title: "HCF & LCM from a Venn", strand: "Number", questionVersion: 2,
  summary: "Follows Venn Diagrams & Product of Primes. Pupils see why the middle of a Venn gives the HCF (the common factors, then the prime tiles), then build a Venn tile by tile and multiply the middle for the HCF, and every tile for the LCM, with the answer line on a click. Two book sets with printable worksheets, visualiser slides for the answers and two Depth cards. Every question is authored and its answer computed.",
  slides,
});
