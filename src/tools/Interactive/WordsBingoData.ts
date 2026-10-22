// Maths Words Bingo — word bank, clue model and pure game logic (no React).
// Scope: KS2 and below, plus a few easily recognisable KS3 words.

// ── Clue model ───────────────────────────────────────────────────────────────

export type ClueKind = "def" | "sym" | "pic";

export type Pic =
  | { t: "angle"; deg: number }
  | { t: "poly"; n: number }
  | { t: "tri"; k: "equilateral" | "isosceles" | "right" | "scalene" }
  | { t: "quad"; k: "square" | "rectangle" | "rhombus" | "kite" | "trapezium" | "parallelogram" }
  | { t: "lines"; k: "parallel" | "perpendicular" }
  | { t: "circle"; part: "radius" | "diameter" | "circumference" }
  | { t: "bar"; num: number; den: number }
  | { t: "pie"; num: number; den: number }
  | { t: "barchart" }
  | { t: "tally"; n: number };

export type Clue =
  | { k: "def"; s: string }   // plain-text definition
  | { k: "sym"; s: string }   // KaTeX: a symbol, number or notation
  | { k: "pic"; p: Pic };     // a drawn representation

export type PackId = "shapes" | "number" | "fractions" | "measures";

export interface BingoWord {
  id: string;
  word: string;
  pack: PackId;
  clues: Clue[];
}

export const PACKS: { id: PackId; name: string; blurb: string }[] = [
  { id: "shapes", name: "Shapes & angles", blurb: "Angles, polygons, circles, 3D shapes" },
  { id: "number", name: "Number & operations", blurb: "Operations, symbols, number families" },
  { id: "fractions", name: "Fractions", blurb: "A half, two thirds, five eighths… as bars, pies and symbols" },
  { id: "measures", name: "Measures & data", blurb: "Units, time, averages, charts" },
];

export const CLUE_KINDS: { id: ClueKind; name: string; blurb: string }[] = [
  { id: "def", name: "Definitions", blurb: "“The process of repeated addition”" },
  { id: "sym", name: "Symbols & numbers", blurb: "90°  ×  1, 4, 9, 16…" },
  { id: "pic", name: "Pictures", blurb: "Angles, shapes, bars, pies" },
];

const def = (s: string): Clue => ({ k: "def", s });
const sym = (s: string): Clue => ({ k: "sym", s });
const pic = (p: Pic): Clue => ({ k: "pic", p });
const W = (pack: PackId, word: string, ...clues: Clue[]): BingoWord => ({
  id: `${pack}-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  word, pack, clues,
});

// ── Shapes & angles ──────────────────────────────────────────────────────────

const SHAPES: BingoWord[] = [
  W("shapes", "Right angle", sym("90^\\circ"), pic({ t: "angle", deg: 90 }), def("The angle at the corner of a square")),
  W("shapes", "Acute angle", pic({ t: "angle", deg: 40 }), def("An angle smaller than a right angle")),
  W("shapes", "Obtuse angle", pic({ t: "angle", deg: 125 }), def("An angle bigger than a right angle but smaller than a straight line")),
  W("shapes", "Reflex angle", pic({ t: "angle", deg: 240 }), def("An angle bigger than a straight line")),
  W("shapes", "Straight angle", sym("180^\\circ"), pic({ t: "angle", deg: 180 })),
  W("shapes", "Full turn", sym("360^\\circ"), def("A complete rotation, back to where you started")),
  W("shapes", "Triangle", pic({ t: "tri", k: "scalene" }), def("A flat shape with 3 straight sides")),
  W("shapes", "Equilateral triangle", pic({ t: "tri", k: "equilateral" }), def("A triangle with 3 equal sides and 3 equal angles")),
  W("shapes", "Isosceles triangle", pic({ t: "tri", k: "isosceles" }), def("A triangle with 2 equal sides")),
  W("shapes", "Right-angled triangle", pic({ t: "tri", k: "right" }), def("A triangle with a 90° corner")),
  W("shapes", "Square", pic({ t: "quad", k: "square" }), def("4 equal sides and 4 right angles")),
  W("shapes", "Rectangle", pic({ t: "quad", k: "rectangle" }), def("4 right angles, with opposite sides equal")),
  W("shapes", "Rhombus", pic({ t: "quad", k: "rhombus" }), def("A slanted shape with 4 equal sides")),
  W("shapes", "Parallelogram", pic({ t: "quad", k: "parallelogram" }), def("A slanted shape with two pairs of parallel sides")),
  W("shapes", "Kite", pic({ t: "quad", k: "kite" }), def("A 4-sided shape with two pairs of equal sides next to each other")),
  W("shapes", "Trapezium", pic({ t: "quad", k: "trapezium" }), def("A 4-sided shape with exactly one pair of parallel sides")),
  W("shapes", "Pentagon", pic({ t: "poly", n: 5 }), def("A flat shape with 5 sides")),
  W("shapes", "Hexagon", pic({ t: "poly", n: 6 }), def("A flat shape with 6 sides")),
  W("shapes", "Octagon", pic({ t: "poly", n: 8 }), def("A flat shape with 8 sides, like a stop sign")),
  W("shapes", "Radius", pic({ t: "circle", part: "radius" }), def("The distance from the centre of a circle to its edge")),
  W("shapes", "Diameter", pic({ t: "circle", part: "diameter" }), def("A straight line across a circle, passing through the centre")),
  W("shapes", "Circumference", pic({ t: "circle", part: "circumference" }), def("The distance all the way around a circle")),
  W("shapes", "Parallel lines", pic({ t: "lines", k: "parallel" }), def("Lines that stay the same distance apart and never meet")),
  W("shapes", "Perpendicular lines", pic({ t: "lines", k: "perpendicular" }), def("Two lines that cross at 90°")),
  W("shapes", "Vertex", def("A corner of a shape")),
  W("shapes", "Edge", def("Where two faces of a 3D shape meet")),
  W("shapes", "Face", def("A flat surface of a 3D shape")),
  W("shapes", "Cube", def("A 3D shape with 6 identical square faces")),
  W("shapes", "Cuboid", def("A 3D shape with 6 rectangular faces, like a cereal box")),
  W("shapes", "Sphere", def("A perfectly round 3D shape, like a ball")),
  W("shapes", "Cylinder", def("A 3D shape with two circular ends and a curved side, like a tin of beans")),
  W("shapes", "Cone", def("A 3D shape with a circular base and a single point at the top")),
  W("shapes", "Pyramid", def("A 3D shape with a flat base and triangular faces that meet at a point")),
  W("shapes", "Line of symmetry", def("A mirror line that splits a shape into two matching halves")),
  W("shapes", "Rotation", def("Turning a shape around a point")),
];

// ── Number & operations ──────────────────────────────────────────────────────

const NUMBER: BingoWord[] = [
  W("number", "Addition", sym("+"), def("Putting amounts together to make a bigger amount")),
  W("number", "Subtraction", sym("-"), def("Taking one amount away from another")),
  W("number", "Multiplication", sym("\\times"), def("The process of repeated addition")),
  W("number", "Division", sym("\\div"), def("Sharing into equal groups")),
  W("number", "Sum", def("The answer when numbers are added together")),
  W("number", "Difference", def("The answer when one number is taken away from another")),
  W("number", "Product", def("The answer when numbers are multiplied together")),
  W("number", "Equals", sym("="), def("Has exactly the same value as")),
  W("number", "Less than", sym("<")),
  W("number", "Greater than", sym(">")),
  W("number", "Digit", def("One of the symbols 0 to 9 used to write numbers")),
  W("number", "Even number", sym("2, 4, 6, 8, 10, \\dots"), def("A whole number that divides exactly by 2")),
  W("number", "Odd number", sym("1, 3, 5, 7, 9, \\dots"), def("A whole number that leaves 1 when divided by 2")),
  W("number", "Prime number", sym("2, 3, 5, 7, 11, 13, \\dots"), def("A number with exactly two factors: 1 and itself")),
  W("number", "Square number", sym("1, 4, 9, 16, 25, \\dots"), def("The result of multiplying a whole number by itself")),
  W("number", "Cube number", sym("1, 8, 27, 64, \\dots")),
  W("number", "Factor", def("A number that divides exactly into another number")),
  W("number", "Multiple", sym("3, 6, 9, 12, 15, \\dots"), def("A number in a times table")),
  W("number", "Remainder", def("What is left over after dividing into equal groups")),
  W("number", "Estimate", def("A sensible guess, close to the real answer")),
  W("number", "Round", def("Change a number to a nearby, simpler one, such as the nearest 10")),
  W("number", "Place value", def("The value of a digit, decided by where it sits in the number")),
  W("number", "Negative number", sym("-3, -2, -1"), def("A number less than zero")),
  W("number", "Decimal", def("A number with a point separating the whole part from the parts smaller than one")),
  W("number", "Double", def("Multiply by 2")),
  W("number", "Halve", def("Divide by 2")),
  W("number", "Ascending order", def("Arranged from smallest to largest")),
  W("number", "Descending order", def("Arranged from largest to smallest")),
  W("number", "Thousand", sym("1000")),
  W("number", "Million", sym("1\\,000\\,000")),
  W("number", "Percent", sym("\\%"), def("A number out of 100")),
];

// ── Fractions (generated) ────────────────────────────────────────────────────

const NUM_WORDS = ["", "a", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const DEN_WORDS: Record<number, [string, string]> = {
  2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"],
  6: ["sixth", "sixths"], 7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
};
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Simplest form only, so no two fractions on a board can share a value.
const FRACTIONS: BingoWord[] = [];
for (let den = 2; den <= 10; den++) {
  for (let num = 1; num < den; num++) {
    if (gcd(num, den) !== 1) continue;
    const [one, many] = DEN_WORDS[den];
    const text = num === 1 ? `a ${one}` : `${NUM_WORDS[num]} ${many}`;
    FRACTIONS.push({
      id: `fractions-${num}-${den}`,
      word: text.charAt(0).toUpperCase() + text.slice(1),
      pack: "fractions",
      clues: [pic({ t: "bar", num, den }), sym(`\\dfrac{${num}}{${den}}`), pic({ t: "pie", num, den })],
    });
  }
}

// ── Measures & data ──────────────────────────────────────────────────────────

const MEASURES: BingoWord[] = [
  W("measures", "Perimeter", def("The distance around the outside of a shape")),
  W("measures", "Area", def("The amount of space inside a flat shape")),
  W("measures", "Volume", def("The amount of space inside a 3D shape")),
  W("measures", "Length", def("How long something is, from end to end")),
  W("measures", "Mass", def("How heavy something is")),
  W("measures", "Capacity", def("How much liquid a container can hold")),
  W("measures", "Millimetre", sym("\\mathrm{mm}"), def("A unit of length: 10 of these make a centimetre")),
  W("measures", "Centimetre", sym("\\mathrm{cm}"), def("A unit of length: 100 of these make a metre")),
  W("measures", "Metre", sym("\\mathrm{m}"), def("A unit of length: 1000 of these make a kilometre")),
  W("measures", "Kilometre", sym("\\mathrm{km}"), def("A unit for long distances: 1000 metres")),
  W("measures", "Gram", sym("\\mathrm{g}"), def("A unit of mass: 1000 of these make a kilogram")),
  W("measures", "Kilogram", sym("\\mathrm{kg}"), def("A unit of mass: 1000 grams")),
  W("measures", "Millilitre", sym("\\mathrm{ml}"), def("A unit of capacity: 1000 of these make a litre")),
  W("measures", "Litre", sym("\\mathrm{L}"), def("A unit of capacity: 1000 millilitres")),
  W("measures", "Second", def("A unit of time: 60 of these make a minute")),
  W("measures", "Minute", def("A unit of time: 60 seconds")),
  W("measures", "Hour", def("A unit of time: 60 minutes")),
  W("measures", "Day", def("A unit of time: 24 hours")),
  W("measures", "Week", def("A unit of time: 7 days")),
  W("measures", "Year", def("A unit of time: 12 months")),
  W("measures", "Mean", def("Add up all the values, then divide by how many there are")),
  W("measures", "Median", def("The middle value when the data is in order")),
  W("measures", "Mode", def("The value that appears most often")),
  W("measures", "Range", def("The difference between the biggest and smallest values")),
  W("measures", "Frequency", def("How many times something happens")),
  W("measures", "Tally chart", pic({ t: "tally", n: 8 }), def("A way of counting in groups of five using lines")),
  W("measures", "Bar chart", pic({ t: "barchart" }), def("A chart that uses bars of different heights to show data")),
  W("measures", "Pictogram", def("A chart that uses small pictures to show data")),
];

export const ALL_WORDS: BingoWord[] = [...SHAPES, ...NUMBER, ...FRACTIONS, ...MEASURES];

/** Words that must never share a board, because a clue for one could fit another. */
export const CONFLICTS: string[][] = [
  ["shapes-triangle", "shapes-equilateral-triangle", "shapes-isosceles-triangle", "shapes-right-angled-triangle"],
  ["shapes-square", "shapes-rectangle", "shapes-rhombus", "shapes-parallelogram"],
  ["shapes-cube", "shapes-cuboid"],
  ["shapes-right-angle", "shapes-perpendicular-lines"],
  ["shapes-circumference", "measures-perimeter"],
  ["number-addition", "number-sum"],
  ["number-subtraction", "number-difference"],
  ["number-multiplication", "number-product"],
];

// ── Randomness ───────────────────────────────────────────────────────────────

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Board and calls ──────────────────────────────────────────────────────────

export const BOARD_SIZE = 25;

export const cluesFor = (w: BingoWord, kinds: ClueKind[]): Clue[] => w.clues.filter(c => kinds.includes(c.k));

export const eligibleWords = (packs: PackId[], kinds: ClueKind[]): BingoWord[] =>
  ALL_WORDS.filter(w => packs.includes(w.pack) && cluesFor(w, kinds).length > 0);

const groupMates = (id: string): string[] => CONFLICTS.filter(g => g.includes(id)).flat();

/** Words in a fair order across the chosen packs, with conflicting words skipped. */
function candidateOrder(packs: PackId[], kinds: ClueKind[], rng: Rng): BingoWord[] {
  const pool = eligibleWords(packs, kinds);
  const lists = packs.map(p => shuffle(pool.filter(w => w.pack === p), rng));
  const interleaved: BingoWord[] = [];
  for (let i = 0; interleaved.length < pool.length; i++) {
    for (const l of lists) if (i < l.length) interleaved.push(l[i]);
  }
  const blocked = new Set<string>();
  const out: BingoWord[] = [];
  for (const w of interleaved) {
    if (blocked.has(w.id)) continue;
    out.push(w);
    groupMates(w.id).forEach(id => blocked.add(id));
  }
  return out;
}

/** How many words a board could draw on for these settings. */
export const maxBoardSize = (packs: PackId[], kinds: ClueKind[]): number =>
  candidateOrder(packs, kinds, () => 0.5).length;

export function buildBoard(packs: PackId[], kinds: ClueKind[], rng: Rng, size = BOARD_SIZE): BingoWord[] | null {
  const chosen = candidateOrder(packs, kinds, rng);
  if (chosen.length < size) return null;
  return shuffle(chosen.slice(0, size), rng);
}

/** A fresh word to replace one the class doesn't know yet: same pack where possible, never conflicting, never one already cycled out. */
export function swapWord(
  board: BingoWord[], outId: string, packs: PackId[], kinds: ClueKind[], exclude: Set<string>, rng: Rng,
): BingoWord | null {
  const out = board.find(w => w.id === outId);
  if (!out) return null;
  const rest = board.filter(w => w.id !== outId);
  const blocked = new Set<string>([...exclude, outId, ...rest.map(w => w.id), ...rest.flatMap(w => groupMates(w.id))]);
  const cands = shuffle(eligibleWords(packs, kinds).filter(w => !blocked.has(w.id)), rng);
  return cands.find(w => w.pack === out.pack) ?? cands[0] ?? null;
}

export const newRoundOrder = (board: BingoWord[], rng: Rng): string[] => shuffle(board.map(w => w.id), rng);

/** Pick a clue index for a word, preferring clues not yet used for it (so a recycled round shows something new). */
export function pickClueIndex(w: BingoWord, kinds: ClueKind[], used: Record<string, number[]>, rng: Rng): number {
  const all = w.clues.map((c, i) => (kinds.includes(c.k) ? i : -1)).filter(i => i >= 0);
  const seen = used[w.id] ?? [];
  const fresh = all.filter(i => !seen.includes(i));
  const from = fresh.length > 0 ? fresh : all;
  return from[Math.floor(rng() * from.length)];
}

// ── Winning ──────────────────────────────────────────────────────────────────

export type WinMode = "line" | "corners" | "house";

export const WIN_MODES: { id: WinMode; name: string; count: number; blurb: string }[] = [
  { id: "line", name: "A line", count: 3, blurb: "3 in a row on the 3×3 grid" },
  { id: "corners", name: "Four corners", count: 4, blurb: "All 4 corners of the grid" },
  { id: "house", name: "Full house", count: 9, blurb: "All 9 words" },
];

/** A claim is valid when every claimed word has been called. */
export function checkClaim(claimed: string[], called: Set<string>): { ok: boolean; missing: string[] } {
  const missing = claimed.filter(id => !called.has(id));
  return { ok: claimed.length > 0 && missing.length === 0, missing };
}
