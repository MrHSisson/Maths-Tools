// Build script for the "Venn diagrams, HCF and LCM" deck (plan: specs/decks/venn-hcf-lcm.md; 46 slides, built one section at a time).
//   npm run deck -- looks specs/decks/venn-hcf-lcm.build.ts      the look card (one slide of each kind)
//   npm run deck -- build specs/decks/venn-hcf-lcm.build.ts --replace
//   npm run deck -- check venn-hcf-lcm --layout ; npm run deck -- review venn-hcf-lcm
// Every sort, tile, HCF and LCM below is computed (src/shared/venn.ts) and asserted: nothing is typed in by hand that a pupil could be wrongly told.
import { Q, S, assertCentred, assertFreshNumbers } from "/src/decks/builder";
import type { CuratedQuestion, Slide, VennCard } from "/src/decks/types";

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

// slide 7 (if time): five sorting questions, full width; the answers are computed and kept (not shown on a click: Harry works them on the board)
interface Sort { left: string; right: string; inLeft: (n: number) => boolean; inRight: (n: number) => boolean; items: number[] }
const sorts: Sort[] = [
  { left: "even", right: "multiple of 5", inLeft: (n) => n % 2 === 0, inRight: (n) => n % 5 === 0, items: [7, 8, 10, 15, 20] },
  { left: "multiple of 4", right: "multiple of 6", inLeft: (n) => n % 4 === 0, inRight: (n) => n % 6 === 0, items: [6, 8, 12, 18, 21] },
  { left: "odd", right: "square number", inLeft: (n) => n % 2 === 1, inRight: (n) => Number.isInteger(Math.sqrt(n)), items: [4, 9, 11, 16, 18] },
  { left: "less than 10", right: "even", inLeft: (n) => n < 10, inRight: (n) => n % 2 === 0, items: [3, 6, 12, 14, 15] },
  { left: "factor of 12", right: "factor of 18", inLeft: (n) => 12 % n === 0, inRight: (n) => 18 % n === 0, items: [2, 4, 6, 9, 5] },
];
const cap = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;
const sortQ = (i: number, s: Sort): CuratedQuestion => {
  const place = (w: Where) => s.items.filter((n) => where(s.inLeft(n), s.inRight(n)) === w);
  const parts = ([["middle", "In both"], ["left", `${s.left[0].toUpperCase()}${s.left.slice(1)} only`], ["right", `${s.right[0].toUpperCase()}${s.right.slice(1)} only`], ["neither", "Neither"]] as [Where, string][])
    .map(([w, label]) => `${label}: ${place(w).length ? place(w).map((n) => `$${n}$`).join(", ") : "nothing"}`);
  must(place("middle").length > 0 && place("neither").length >= 0, `sort ${i + 1} has something in the middle`);
  const lines = [`${cap(s.left)} and ${s.right}:`, `Where do ${s.items.map((n) => `$${n}$`).join(", ")} go?`];
  assertCentred([lines.join(" ")], `sort ${i + 1}`);
  return { ...Q.open(`${P}-sort-${i + 1}`, T, "level1", lines[0], parts.join(". "), parts), title: `Sort into a Venn ${i + 1}`, question: lines,
    rationale: "Decide, for each number, whether it is in the left circle, the right circle, both or neither: a number can be in both." };
};
const sortSet = sorts.map((s, i) => sortQ(i, s));
must(sortSet.length >= 5, "at least five sorting questions (R42)");
// the five sorts together cover every place a number can go
const allWhere = new Set(sorts.flatMap((s) => s.items.map((n) => where(s.inLeft(n), s.inRight(n)))));
must(["left", "middle", "right", "neither"].every((w) => allWhere.has(w as Where)), "the sorts use all four places");

const section1: Slide[] = [
  S.title(`${P}-title`, "Venn Diagrams, HCF & LCM", "Sort it. Place it. Multiply."),
  S.objective(`${P}-objective`, "I can put things in the right part of a Venn diagram.", ["Say what each circle is for", "Put a thing in both circles when it fits both", "Put a thing in neither when it fits neither"]),
  S.venn(`${P}-pets`, "Pets and 3-letter words", "Pets", "3-letter words", cardsOf(petWords), { box: "Things" }),
  S.venn(`${P}-fly`, "Can fly and has feathers", "Can fly", "Has feathers", cardsOf(flyers), { box: "Animals" }),
  S.venn(`${P}-red`, "Is red and is a fruit", "Is red", "Is a fruit", cardsOf(reds), { box: "Things" }),
  S.venn(`${P}-even3`, "Even and multiple of 3", "Even", "Multiple of 3", cardsOf(to12.map(String)), { box: "1 to 12" }),
  S.whiteboard(`${P}-sort`, "If time: sort into a Venn", sortSet, "Five numbers to sort into a Venn for two rules, full width, with something in both circles and something in neither. Harry works them on the board."),
];

const slides: Slide[] = [...section1];

// The fresh-numbers rules (src/decks/deckRules.ts): no number twice inside a section, the worked numbers asked nowhere.
// The sorting questions reuse small numbers on purpose (each is a different pair of rules), so only the section 1 questions are listed.
assertFreshNumbers({ worked: [], sections: {} , exit: [] });

export default () => ({
  id: ID, title: "Venn Diagrams, HCF & LCM", strand: "Number", questionVersion: 2,
  summary: "Pupils meet the Venn diagram with no numbers at all, put the prime factors of two numbers into a Venn, then read the HCF (multiply the middle) and the LCM (multiply everything) off it. Heavy scaffold, with support taken away one step at a time. Every question is authored and its answer computed.",
  slides,
});
