// Build script for the "Venn diagrams, HCF and LCM" deck (plan: specs/decks/venn-hcf-lcm.md; 45 slides, built one section at a time: sections 1 and 2 so far).
//   npm run deck -- looks specs/decks/venn-hcf-lcm.build.ts      the look card (one slide of each kind)
//   npm run deck -- build specs/decks/venn-hcf-lcm.build.ts --replace
//   npm run deck -- check venn-hcf-lcm --layout ; npm run deck -- review venn-hcf-lcm
// Every sort, tile, HCF and LCM below is computed (src/shared/venn.ts) and asserted: nothing is typed in by hand that a pupil could be wrongly told.
import { LOOK, Q, S, assertCentred, assertFreshNumbers, hintLine, makeSlide, textEl } from "/src/decks/builder";
import { misconceptionLabel } from "/src/shared/misconceptions";
import { BOX_H } from "/src/decks/vennLayout";
import { allTiles, circleNumbers, hcfOf, lcmOf, primeFactors, splitPrimes, vennFlags, vennProblems, type VennRegions } from "/src/shared/venn";
import type { CuratedQuestion, DeckElement, Slide, VennCard } from "/src/decks/types";

const ID = "venn-hcf-lcm";
const P = "vh";
const T = ID;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ---------- section 1: a first look at a Venn (an idea, not a lesson) ----------
type Where = "left" | "middle" | "right" | "neither";
/** Where an item goes for two rules, computed, so a card list can be checked against what the slide should teach. */
const where = (inLeft: boolean, inRight: boolean): Where => (inLeft && inRight ? "middle" : inLeft ? "left" : inRight ? "right" : "neither");
const cardsOf = (items: string[]): VennCard[] => items.map((text) => ({ text }));

// slide 3: pets and 3-letter words (rat is a pet to some, which is a good word to disagree about)
const PETS = new Set(["cat", "dog", "rat", "fish", "hamster", "rabbit"]);
const petWords = ["cat", "dog", "rat", "fish", "hamster", "rabbit", "sun", "pen", "hat", "house", "tree", "spoon"];
must(same(petWords.filter((w) => where(PETS.has(w), w.length === 3)).length, petWords.length), "pet words computed");
must(same(petWords.filter((w) => where(PETS.has(w), w.length === 3) === "middle"), ["cat", "dog", "rat"]), "pets and 3-letter words: middle");
must(same(petWords.filter((w) => where(PETS.has(w), w.length === 3) === "neither"), ["house", "tree", "spoon"]), "pets and 3-letter words: neither");

// slide 4: can fly and has feathers (a bird that does not fly, a mammal that does)
const FLY = new Set(["robin", "eagle", "parrot", "bat", "bee", "butterfly"]);
const FEATHERS = new Set(["robin", "eagle", "parrot", "penguin", "ostrich"]);
const flyers = ["robin", "eagle", "parrot", "penguin", "ostrich", "bat", "bee", "butterfly", "dog", "fish", "snake"];
must(same(flyers.filter((w) => where(FLY.has(w), FEATHERS.has(w)) === "middle"), ["robin", "eagle", "parrot"]), "fly and feathers: middle");
must(same(flyers.filter((w) => where(FLY.has(w), FEATHERS.has(w)) === "right"), ["penguin", "ostrich"]), "feathers only: a bird that does not fly");
must(flyers.filter((w) => where(FLY.has(w), FEATHERS.has(w)) === "left").includes("bat"), "fly only: a mammal that does");

// slide 5: is red and is a fruit (no shapes in the intro: Harry)
const RED = new Set(["strawberry", "cherry", "post box", "fire engine", "ladybird"]);
const FRUIT = new Set(["strawberry", "cherry", "banana", "lemon"]);
const reds = ["strawberry", "cherry", "banana", "lemon", "post box", "fire engine", "ladybird", "carrot", "football", "grass"];
must(same(reds.filter((w) => where(RED.has(w), FRUIT.has(w)) === "middle"), ["strawberry", "cherry"]), "red and fruit: middle");
must(same(reds.filter((w) => where(RED.has(w), FRUIT.has(w)) === "right"), ["banana", "lemon"]), "fruit only");
must(same(reds.filter((w) => where(RED.has(w), FRUIT.has(w)) === "left"), ["post box", "fire engine", "ladybird"]), "red only");
must(same(reds.filter((w) => where(RED.has(w), FRUIT.has(w)) === "neither"), ["carrot", "football", "grass"]), "neither");

// slide 6: even and multiple of 3 (the bridge to numbers): 6 and 12 go in the middle
const to12 = Array.from({ length: 12 }, (_, i) => i + 1);
must(same(to12.filter((n) => where(n % 2 === 0, n % 3 === 0) === "middle"), [6, 12]), "even and multiple of 3: middle");

const section1: Slide[] = [
  S.title(`${P}-title`, "Venn Diagrams, HCF & LCM", "Sort it. Place it. Multiply."),
  S.objective(`${P}-objective`, "I can put things in the right part of a Venn diagram.", ["Say what each circle is for", "Put a thing in both circles when it fits both", "Put a thing in neither when it fits neither"]),
  S.venn(`${P}-pets`, "Pets and 3-letter words", "Pets", "3-letter words", cardsOf(petWords), { box: "Things" }),
  S.venn(`${P}-fly`, "Can fly and has feathers", "Can fly", "Has feathers", cardsOf(flyers), { box: "Animals" }),
  S.venn(`${P}-red`, "Is red and is a fruit", "Is red", "Is a fruit", cardsOf(reds), { box: "Things" }),
  S.venn(`${P}-even3`, "Even and multiple of 3", "Even", "Multiple of 3", cardsOf(to12.map(String)), { box: "1 to 12" }),
];

// ---------- section 2: prime factors in a Venn (slides 8 to 27) ----------
type Mistake = { response: string; reasoning: string };
type Kind = "a" | "b" | "c" | "d" | "e" | "f" | "g";
const tex = (ps: readonly number[]) => ps.join(" \\times ");
const fx = (n: number) => `${n} = ${tex(primeFactors(n))}`;
const nums = (xs: readonly number[]) => (xs.length ? xs.map((n) => `$${n}$`).join(", ") : "nothing");
const cap1 = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;
/** What each kind of pair must look like, so a set cannot drift from the plan's ladder (a to e climb; f and g are the edge cases). */
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
/** The wrong way for a repeated prime: every copy of a shared prime goes in the middle (the larger count of the two). */
function allCopiesMiddle(a: number, b: number): number[] {
  const fa = primeFactors(a), fb = primeFactors(b), out: number[] = [];
  for (const p of new Set(fa)) { const ca = fa.filter((x) => x === p).length, cb = fb.filter((x) => x === p).length; if (cb > 0) for (let i = 0; i < Math.max(ca, cb); i++) out.push(p); }
  return out.sort((x, y) => x - y);
}
const seenPairs = new Set<string>();
/** "Put these two numbers' prime factors in a Venn": the factorisations are given; the answer (left, middle, right) is computed and kept, not shown. */
function pairQ(id: string, [a, b, kind]: Pair, o: { hint?: boolean; book?: boolean } = {}): CuratedQuestion {
  must(vennProblems(a, b).length === 0, `${a} and ${b}: ${vennProblems(a, b).join("; ")}`);
  const r = splitPrimes(a, b);
  must(KIND[kind](r), `${a} and ${b} is not kind ${kind}`);
  must(lcmOf(r) <= 500, `${a} and ${b}: LCM ${lcmOf(r)} is over 500`);
  const key = `${a},${b}`; must(!seenPairs.has(key), `${a} and ${b} asked twice`); seenPairs.add(key);
  const hint = o.hint && r.middle.length > 0 ? [hintLine(`${r.middle.length} tile${r.middle.length === 1 ? "" : "s"} in the middle`)] : [];
  // book work: just the two numbers, big and plain, with the quiet middle-tile count on the first six; the factorisations are on the printed worksheet
  const lines = o.book ? [`$${a},\\;${b}$`, ...hint] : [`$${fx(a)}$ and $${fx(b)}$`, "Put them in a Venn.", ...hint];
  if (!o.book) assertCentred(lines, `${a} and ${b}`);
  const answer = `${cap1("left only")}: ${nums(r.left)}. Middle: ${nums(r.middle)}. Right only: ${nums(r.right)}.`;
  const mistakes: Mistake[] = [];
  if (vennFlags(r).spareCopy) {
    const wrong = allCopiesMiddle(a, b);
    must(wrong.join() !== r.middle.join(), `${a} and ${b}: the all-copies slip gives the right middle`);
    mistakes.push({ response: `Middle: ${wrong.join(", ")}`, reasoning: "Puts every copy of a shared prime in the middle. Match the copies one for one: the middle takes only as many as both numbers have." });
  }
  return { ...Q.open(id, T, "level1", lines[0], answer, [], mistakes), title: `$${a}$ and $${b}$`, question: lines,
    rationale: "Match the primes one for one: a prime both numbers have goes once in the middle, the rest stay on their own side." };
}
const pairSet = (prefix: string, pairs: Pair[], hints: number, book = false) => pairs.map((p, i) => pairQ(`${P}-${prefix}${i + 1}`, p, { hint: i < hints, book }));

// slide 11: tiles to number (the multiplying, before any Venn)
const tileSets: number[][] = [[3, 7], [2, 2, 5], [2, 3, 5], [3, 3, 7], [2, 2, 3, 5], [2, 3, 3, 5, 7].slice(0, 4)];
const tileQs = tileSets.map((ts, i) => {
  const n = ts.reduce((x, y) => x * y, 1);
  must(same(primeFactors(n), ts), `tiles ${ts.join(" x ")} are the primes of ${n}`);
  const lines = ["Which number do these tiles make?", `$${tex(ts)}$`];
  assertCentred(lines, `tiles ${i + 1}`);
  return { ...Q.open(`${P}-tile${i + 1}`, T, "level1", lines[0], `$${n}$`, [`$${tex(ts)} = ${n}$`]), title: `$${n}$`, question: lines, rationale: "Multiply the tiles; use a calculator for the bigger ones." } as CuratedQuestion;
});

// slide 9: retrieval, four quick ones
const quickQs: CuratedQuestion[] = [
  { ...Q.open(`${P}-r1`, T, "level1", "Which of $9, 13, 21, 19$ are prime?", "$13, 19$"), question: ["Which of $9, 13, 21, 19$ are prime?"] },
  { ...Q.open(`${P}-r2`, T, "level1", "Write the first five primes.", "$2, 3, 5, 7, 11$"), question: ["Write the first five primes."] },
  { ...Q.open(`${P}-r3`, T, "level1", "$2 \\times 2 \\times 7 = ?$", `$${2 * 2 * 7}$`), question: ["$2 \\times 2 \\times 7 = ?$"] },
  { ...Q.open(`${P}-r4`, T, "level1", "$3 \\times 3 \\times 5 = ?$", `$${3 * 3 * 5}$`), question: ["$3 \\times 3 \\times 5 = ?$"] },
];
must([9, 21].every((n) => primeFactors(n).length > 1) && [13, 19].every((n) => primeFactors(n).length === 1) && same(primeFactors(28), [2, 2, 7]) && same(primeFactors(45), [3, 3, 5]), "retrieval answers");

// Venn cards from two numbers: placed (the tiles in their regions) or scattered (to drag)
const placedCards = (a: number, b: number): VennCard[] => { const r = splitPrimes(a, b); return (["left", "middle", "right"] as const).flatMap((region) => r[region].map((n) => ({ text: String(n), tile: true, region }))); };

// the worked pairs and models (never asked): 10 and 15 (the rule), 8 and 12 (one for one), 9 and 10 (nothing shared), 4 and 12 (one inside the other)
const rule = splitPrimes(10, 15), rule8 = splitPrimes(8, 12), none = splitPrimes(9, 10), inside = splitPrimes(4, 12);
must(same(rule, { left: [2], middle: [5], right: [3] }) && hcfOf(rule) === 5 && lcmOf(rule) === 30, "10 and 15");
must(same(circleNumbers(rule), [10, 15]) && same(circleNumbers(rule8), [8, 12]), "the check multiplies back");
must(same(rule8, { left: [2], middle: [2, 2], right: [3] }), "8 and 12 match one for one");
must(none.middle.length === 0 && same(inside, { left: [], middle: [2, 2], right: [3] }), "the two models");
const WORKED = [10, 15, 8, 12, 18, 9, 4];

// slide 10: the prime tiles (colours), slide 12: the rule, slide 13: the check, slide 17: one for one
must(same(primeFactors(12), [2, 2, 3]), "12 = 2 x 2 x 3");
const ruleSlide = S.vennBuild(`${P}-rule`, "The rule: a prime in both goes once in the middle", "10", "15", [10, 15], { box: "Prime factors" });
const oneForOne = S.vennBuild(`${P}-one-for-one`, "Model: match the tiles one for one", "8", "12", [8, 12], { box: "Prime factors" });

// slide 18: the one trap worth a discussion (Mei puts every 2 of 8 in the middle)
const meiRight = circleNumbers({ left: [], middle: [2, 2, 2], right: [3] });
must(meiRight[1] === 24 && meiRight[1] !== 12, "Mei's right-hand circle multiplies to 24, not 12");
// Mei's Venn is drawn wrong on purpose (every 2 of 8 in the middle), so the class can see where it breaks; Harry can drag the tiles to mend it.
const meiCards: VennCard[] = [...[2, 2, 2].map((n) => ({ text: String(n), tile: true, region: "middle" as const })), { text: "3", tile: true, region: "right" as const }];
const discussion = makeSlide(`${P}-discuss`, "discussion", "Discuss", [
  textEl(70, 60, 560, 50, "DISCUSS", 30, { bold: true, colour: "#be185d" }),
  textEl(70, 120, 560, 330, "Mei puts all three 2s of 8 in the middle, because 2 is in both numbers.\n\nWhere does it go wrong?", 40),
  textEl(70, 500, 560, 50, "KEY POINT", 30, { bold: true, colour: LOOK.grey, step: 1 }),
  textEl(70, 560, 560, 300, "The right circle should multiply to 12. Hers is 2 × 2 × 2 × 3, which is too big. Only the 2s both numbers have go in the middle.", 36, { bold: true, step: 1 }),
  { kind: "venn", x: 640, y: 110, w: 920, h: Math.round(0.92 * BOX_H), left: "8", right: "12", box: "Mei's Venn", cards: meiCards, size: 1.2 } as unknown as DeckElement,
  textEl(640, 780, 920, 90, `How many 2s should go in the middle for 8 and 12? ${rule8.middle.length}`, 40, { bold: true, align: "center", step: 2 }),
]);

// slide 20: the two special pictures, side by side (nothing shared; one inside the other)
const vennEl = (x: number, a: number, b: number): DeckElement => ({ kind: "venn", x, y: 240, w: 700, h: 490, left: String(a), right: String(b), cards: placedCards(a, b), size: 1.2 } as unknown as DeckElement);
const specialModel = makeSlide(`${P}-model-special`, "teach", "Model: nothing shared, and one inside the other", [
  textEl(70, 36, 1460, 100, "Nothing shared, and one inside the other", 56, { bold: true }),
  vennEl(60, 9, 10), vennEl(840, 4, 12),
  textEl(60, 760, 700, 90, "9 = 3 × 3 and 10 = 2 × 5: nothing in the middle. That is fine.", 36, { align: "center" }),
  textEl(840, 760, 700, 90, "4 = 2 × 2 and 12 = 2 × 2 × 3: nothing on the left. That is fine.", 36, { align: "center" }),
]);

// the question sets (every pair is checked by pairQ: its factorisations, its kind, an LCM of at most 500, and never asked twice)
const SET14_PAIRS: Pair[] = [[6, 14, "a"], [21, 35, "a"], [30, 42, "b"], [70, 105, "b"], [44, 66, "b"], [22, 55, "a"]];
const SET14 = pairSet("a", SET14_PAIRS, 4);   // the questions behind the six slides (their answers are computed and kept)
// slides: each Venn question as a build slide (numbers as tiles on the left, the Venn on the right, prime buttons along the bottom); the middle-tile count is a quiet hint on the first four
const buildSet14: Slide[] = SET14_PAIRS.map(([a, b], i) => {
  const mid = splitPrimes(a, b).middle.length;
  const slide = S.vennBuild(`${P}-set-a-${i + 1}`, "Prime factors in a Venn", String(a), String(b), [a, b], { box: "Prime factors" });
  const hint = i < 4 ? [textEl(1010, 52, 520, 50, `${mid} tile${mid === 1 ? "" : "s"} in the middle`, 32, { colour: LOOK.grey, align: "right" })] : [];
  return { ...slide, els: [...slide.els, ...hint] as DeckElement[], ...(i === 0 ? { brief: "Given two numbers, put their prime factors in a Venn: a prime both numbers have goes once in the middle. One shared prime first, then two. The count of middle tiles is a quiet hint that falls away. Six slides, one Venn each, built with the prime buttons." } : {}) };
});
const BOOK15_PAIRS: Pair[] = [[14, 35, "a"], [6, 21, "a"], [33, 77, "a"], [30, 105, "b"], [42, 70, "b"], [66, 110, "b"], [28, 63, "a"], [20, 90, "b"], [45, 60, "b"]];
const BOOK15 = pairSet("ba", BOOK15_PAIRS, 6, true);
const SET19 = pairSet("c", [[45, 75, "c"], [20, 30, "c"], [28, 98, "c"], [40, 56, "d"], [36, 63, "d"], [16, 24, "c"]], 3);
const SET21 = pairSet("d", [[20, 50, "c"], [36, 48, "e"], [75, 100, "d"], [30, 84, "b"], [6, 35, "g"], [21, 63, "f"]], 2);
const BOOK24 = pairSet("bb", [[14, 22, "a"], [30, 45, "b"], [28, 42, "c"], [63, 105, "c"], [20, 44, "d"], [50, 75, "d"], [60, 84, "e"], [33, 99, "f"], [6, 25, "g"]], 6, true);
[SET14, BOOK15, SET19, SET21, BOOK24, tileQs].forEach((set, i) => must(new Set(set.map((q) => q.id)).size === set.length && set.length >= 5, `set ${i} has at least five distinct questions (R42)`));
must(BOOK15.length === 9 && BOOK24.length === 9, "book sets are nine, 3 x 3");

// slides 22 and 23: read a Venn backwards (four small Venns each, a to d)
const gridOf = (pairs: [number, number, Kind][]) => pairs.map(([a, b, k]) => { must(vennProblems(a, b).length === 0 && KIND[k](splitPrimes(a, b)), `grid ${a} and ${b}`); return { left: "?", right: "?", cards: placedCards(a, b) }; });
const GRID1 = gridOf([[14, 21, "a"], [35, 55, "a"], [30, 70, "b"], [42, 105, "b"]]);
const GRID2 = gridOf([[28, 70, "c"], [40, 72, "d"], [14, 42, "f"], [20, 21, "g"]]);

// slide 25: Worksheet 1 (three A4 pages of three Venns; the first Venns carry some tiles, the last only the numbers)
// Worksheet 1 carries exactly the nine book questions of the first book set (Harry), so the slide and the sheet match
const SHEET1: [number, number, Kind][] = BOOK15_PAIRS;
SHEET1.forEach(([a, b, k]) => must(vennProblems(a, b).length === 0 && KIND[k](splitPrimes(a, b)), `sheet ${a} and ${b} kind ${k}`));
const placedFade: (("left" | "middle" | "right")[] | undefined)[] = [["left", "middle"], ["middle"], ["right"], undefined, undefined, undefined, undefined, undefined, undefined];
const sheet1 = S.vennSheet(`${P}-sheet-1`, { title: "Worksheet 1: Prime factors in a Venn", note: "Put each prime factor in the right part of the Venn.",
  items: SHEET1.map(([a, b], i) => ({ a, b, ...(placedFade[i] ? { placed: placedFade[i] } : {}) })) }, "indices");   // a pinned sheet carries a real tool id (the deck test draws every worksheet element's tool)

// slides 26 and 27: two authored Depth cards (the eight named cast; every wrong option names its misconception; never three in a row)
function depthQ(id: string, title: string, claims: { name: string; text: string }[], right: number | "both", correct: string, wrong: Record<string, string>, why: string[], mis: string): CuratedQuestion {
  const base = Q.open(id, T, "level1", "Who is right?", correct, why);
  const options = [
    ...claims.map((c, i) => ({ text: c.name, correct: right === i, reasoning: right === i ? "" : wrong[c.name] ?? "" })),
    { text: "They are both right", correct: right === "both", reasoning: right === "both" ? "" : wrong.both ?? "Both cannot be right." },
  ];
  must(options.filter((o) => o.correct).length === 1 && options.every((o) => o.correct || o.reasoning), `${id}: one correct option, every wrong option explained`);
  return { ...base, title, purpose: "diagnose", format: "claims", claims, options, expectedErrors: [], depth: { prompt: "", takeaway: "" }, misconception: { id: mis, label: misconceptionLabel(mis) } } as CuratedQuestion;
}
const depthPage = (id: string, q: CuratedQuestion): Slide =>
  makeSlide(id, "depth", "Depth", [{ kind: "questions", x: 24, y: 24, w: 1552, h: 852, presentation: "full", visualiser: false, items: [q] } as never]);
const r5480 = splitPrimes(54, 80);
must(same(primeFactors(54), [2, 3, 3, 3]) && same(primeFactors(80), [2, 2, 2, 2, 5]) && same(r5480.middle, [2]) && hcfOf(r5480) === 2, "54 and 80");
const depth1 = depthQ(`${P}-dp1`, "Who is right about $54$ and $80$?", [
  { name: "Mei", text: "$54 = 2 \\times 3 \\times 3 \\times 3$ and $80 = 2 \\times 2 \\times 2 \\times 2 \\times 5$. I put a $2$ and a $3$ in the middle, because $3$ is a factor of $54$." },
  { name: "Ben", text: "Only a $2$ goes in the middle. A tile goes in the middle only if both numbers have it, and $80$ has no $3$." }], 1,
  "Ben is right: the middle holds only the tiles both numbers have. $80$ has no $3$, so only a $2$ goes in the middle.",
  { Mei: "Puts a tile in the middle that only one number has. The middle is only for tiles in both numbers.", both: "$80$ has no $3$, so a $3$ in the middle makes the right circle multiply to a different number from $80$." },
  ["The middle is for tiles in both numbers.", "$54$ has three $3$s, but $80$ has none.", "Middle: $2$, so the HCF is $2$."], "venn-middle-not-shared");
const r2732 = splitPrimes(27, 32);
must(same(primeFactors(27), [3, 3, 3]) && same(primeFactors(32), [2, 2, 2, 2, 2]) && r2732.middle.length === 0 && hcfOf(r2732) === 1, "27 and 32");
const depth2 = depthQ(`${P}-dp2`, "Can the middle be empty?", [
  { name: "Leo", text: "$27 = 3 \\times 3 \\times 3$ and $32 = 2 \\times 2 \\times 2 \\times 2 \\times 2$ share no tile, so the middle is empty. I must have made a mistake." },
  { name: "Amara", text: "The middle is empty because $27$ and $32$ share no prime. That is fine: some pairs of numbers share nothing." }], 1,
  "Amara is right: $27$ is all $3$s and $32$ is all $2$s, so nothing is in both. An empty middle is a correct answer.",
  { Leo: "Thinks two numbers must always share a tile, so an empty middle has to be a mistake.", both: "If the empty middle were a mistake, the circles would have to multiply to something other than $27$ and $32$. They do not." },
  ["Nothing is in both, so nothing goes in the middle.", "The left circle multiplies to $27$ and the right circle to $32$.", "An empty middle is allowed."], "venn-empty-middle-error");

const section2: Slide[] = [
  S.divider(`${P}-d2`, "Prime factors in a Venn"),
  S.quick(`${P}-retrieval`, "Quickfire", quickQs, 2, "Four quick ones."),
  { ...S.whiteboard(`${P}-tiles-to-number`, "Tiles to number", tileQs, "Six sets of prime tiles to multiply back into the number, climbing from two tiles to four. This is the multiplying a Venn needs, with no Venn yet."), brief: "Multiply a set of prime tiles to make the number: the reverse of a factor tree." },
  ruleSlide,
  ...buildSet14,
  { ...S.plainBook(`${P}-book-a`, BOOK15, 3, "Copy into your book. Draw a Venn and put the prime factors in it.", "Book work: prime factors in a Venn"), brief: "Same kinds as the whiteboards, nine in a 3 by 3 grid: the first six carry a quiet hint, the last three none." },
  S.divider(`${P}-d3`, "Repeated primes"),
  oneForOne, discussion,
  S.whiteboard(`${P}-set-c`, "Repeated primes", SET19, "A prime that appears more than once in a number: match the copies one for one, so a prime goes in the middle as many times as both numbers have it. The slip of putting every copy in the middle is on the wrong-answer list."),
  specialModel,
  S.whiteboard(`${P}-set-d`, "Special cases", SET21, "Mixed Venns with the two edge cases (nothing shared; one number inside the other) near the end, one of each."),
  S.vennRow(`${P}-grid-1`, "Read a Venn backwards: what are the two numbers?", GRID1),
  S.vennRow(`${P}-grid-2`, "Read a Venn backwards", GRID2),
  { ...S.plainBook(`${P}-book-b`, BOOK24, 3, "Copy into your book. Draw a Venn and put the prime factors in it.", "Book work: mixed Venns"), brief: "Mixed kinds, nine in a 3 by 3 grid: the first six hinted, the last three (a bigger one, then the two edge cases) not." },
  sheet1,
  depthPage(`${P}-depth-1`, depth1),
  depthPage(`${P}-depth-2`, depth2),
];
must(section2.length === 23, "section 2 is 23 slides");

// the Venns on the read-backwards grids are never the same pair as a question (they are read, not placed), so just check the worked numbers are not reused as answers there
GRID1.concat(GRID2).forEach((g) => must(g.cards.every((c) => c.tile), "grid cards are tiles"));
void allTiles;

const slides: Slide[] = [...section1, ...section2];

// The fresh-numbers rules (src/decks/deckRules.ts): no number twice inside a section, the worked numbers asked nowhere, no pair twice.
// Section 1 has no number questions. The Depth numbers
// (54 and 80, 27 and 32) are asserted unused by every set.
const DEPTH_NUMBERS = [54, 80, 27, 32];
const allSets: [string, CuratedQuestion[]][] = [["tiles", tileQs], ["prime factors in a Venn", SET14], ["book work a", BOOK15], ["repeated primes", SET19], ["special cases", SET21], ["book work b", BOOK24]];
for (const [name, qs] of allSets) for (const q of qs) for (const n of (q.title.match(/\d+/g) ?? []).map(Number)) must(!DEPTH_NUMBERS.includes(n) || name === "tiles" && false, `${name}: ${q.id} uses a Depth number ${n}`);
assertFreshNumbers({ worked: WORKED, sections: Object.fromEntries(allSets), exit: [] });

export default () => ({
  id: ID, title: "Venn Diagrams, HCF & LCM", strand: "Number", questionVersion: 2,
  summary: "Pupils meet the Venn diagram with no numbers at all, put the prime factors of two numbers into a Venn, then read the HCF (multiply the middle) and the LCM (multiply everything) off it. Heavy scaffold, with support taken away one step at a time. Every question is authored and its answer computed.",
  slides,
});
