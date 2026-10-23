// Maths word bank — shared by Words Bingo, Hangman and Pairs. Words, clues, packs and key stages (no React).
// Scope: KS2 and below, plus a few easily recognisable KS3 words.

// ── Clue model ───────────────────────────────────────────────────────────────

export type ClueKind = "def" | "sym" | "pic";

export type Pic =
  | { t: "angle"; deg: number }
  | { t: "poly"; n: number }
  | { t: "tri"; k: "equilateral" | "isosceles" | "right" | "scalene" }
  | { t: "quad"; k: "square" | "rectangle" | "rhombus" | "kite" | "trapezium" | "parallelogram" }
  | { t: "lines"; k: "parallel" | "perpendicular" }
  | { t: "circle"; part: "radius" | "diameter" | "circumference" | "chord" | "arc" | "sector" | "tangent" }
  | { t: "boxplot" }
  | { t: "tree" }
  | { t: "histogram" }
  | { t: "parabola" }
  | { t: "bar"; num: number; den: number }
  | { t: "pie"; num: number; den: number }
  | { t: "solid"; k: "cube" | "cuboid" | "cylinder" | "cone" | "sphere" | "pyramid" | "prism" }
  | { t: "line"; k: "horizontal" | "vertical" | "diagonal" }
  | { t: "semi" }
  | { t: "net" }
  | { t: "clock"; h: number; m: number }
  | { t: "linegraph" }
  | { t: "scatter" }
  | { t: "venn" }
  | { t: "machine" }
  | { t: "wall" }
  | { t: "numberline" }
  | { t: "piechart" }
  | { t: "barchart" }
  | { t: "tally"; n: number };

export type Clue =
  | { k: "def"; s: string }   // plain-text definition
  | { k: "sym"; s: string }   // KaTeX: a symbol, number or notation
  | { k: "pic"; p: Pic };     // a drawn representation

export type PackId = "shapes" | "number" | "fractions" | "measures" | "data" | "algebra";

export type Ks = 2 | 3 | 4;

type RawWord = Omit<MathsWord, "ks">;

export interface MathsWord {
  id: string;
  ks: Ks;
  word: string;
  pack: PackId;
  clues: Clue[];
}

export const PACKS: { id: PackId; name: string; blurb: string }[] = [
  { id: "shapes", name: "Shapes & angles", blurb: "Angles, polygons, circles, 3D shapes" },
  { id: "number", name: "Number & operations", blurb: "Operations, symbols, number families" },
  { id: "fractions", name: "Fractions & percentages", blurb: "A half, two thirds… as bars, circles and symbols, plus percentages and decimals" },
  { id: "measures", name: "Measures, time & money", blurb: "Units, clocks, time, money, temperature" },
  { id: "data", name: "Data & probability", blurb: "Averages, charts, graphs, chance" },
  { id: "algebra", name: "Algebra & patterns", blurb: "Letters, equations, sequences, graphs" },
];

export const CLUE_KINDS: { id: ClueKind; name: string; blurb: string }[] = [
  { id: "def", name: "Definitions", blurb: "“The process of repeated addition”" },
  { id: "sym", name: "Symbols & numbers", blurb: "90°  ×  1, 4, 9, 16…" },
  { id: "pic", name: "Pictures", blurb: "Angles, shapes, bars, pies" },
];

const def = (s: string): Clue => ({ k: "def", s });
const sym = (s: string): Clue => ({ k: "sym", s });
const pic = (p: Pic): Clue => ({ k: "pic", p });
const idOf = (pack: PackId, word: string) => `${pack}-${word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const W = (pack: PackId, word: string, ...clues: Clue[]): RawWord => ({ id: idOf(pack, word), word, pack, clues });

// ── Shapes & angles ──────────────────────────────────────────────────────────

const SHAPES: RawWord[] = [
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
  W("shapes", "Cube", pic({ t: "solid", k: "cube" }), def("A 3D shape with 6 identical square faces")),
  W("shapes", "Cuboid", pic({ t: "solid", k: "cuboid" }), def("A 3D shape with 6 rectangular faces, like a cereal box")),
  W("shapes", "Sphere", pic({ t: "solid", k: "sphere" }), def("A perfectly round 3D shape, like a ball")),
  W("shapes", "Cylinder", pic({ t: "solid", k: "cylinder" }), def("A 3D shape with two circular ends and a curved side, like a tin of beans")),
  W("shapes", "Cone", pic({ t: "solid", k: "cone" }), def("A 3D shape with a circular base and a single point at the top")),
  W("shapes", "Pyramid", pic({ t: "solid", k: "pyramid" }), def("A 3D shape with a flat base and triangular faces that meet at a point")),
  W("shapes", "Triangular prism", pic({ t: "solid", k: "prism" }), def("A 3D shape with two triangular ends and three rectangular faces")),
  W("shapes", "Coordinates", sym("(3, 4)"), def("A pair of numbers that gives a position on a grid")),
  W("shapes", "Heptagon", pic({ t: "poly", n: 7 }), def("A flat shape with 7 sides")),
  W("shapes", "Decagon", pic({ t: "poly", n: 10 }), def("A flat shape with 10 sides")),
  W("shapes", "Semicircle", pic({ t: "semi" }), def("Half of a circle")),
  W("shapes", "Hemisphere", def("Half of a sphere")),
  W("shapes", "Net", pic({ t: "net" }), def("A flat shape that folds up to make a 3D shape")),
  W("shapes", "Horizontal", pic({ t: "line", k: "horizontal" }), def("Flat and level, like the horizon")),
  W("shapes", "Vertical", pic({ t: "line", k: "vertical" }), def("Straight up and down")),
  W("shapes", "Diagonal", pic({ t: "line", k: "diagonal" }), def("A slanted line joining two opposite corners of a shape")),
  W("shapes", "Degrees", def("The unit used to measure angles")),
  W("shapes", "Protractor", def("A tool for measuring angles")),
  W("shapes", "Compasses", def("A tool for drawing circles")),
  W("shapes", "Reflection", def("Flipping a shape in a mirror line")),
  W("shapes", "Translation", def("Sliding a shape without turning or flipping it")),
  W("shapes", "Enlargement", def("Making a shape bigger or smaller by a scale factor")),
  W("shapes", "Congruent", def("Exactly the same shape and size")),
  W("shapes", "Clockwise", def("Turning the same way as the hands of a clock")),
  W("shapes", "Anticlockwise", def("Turning the opposite way to the hands of a clock")),
  W("shapes", "Origin", sym("(0, 0)"), def("The point where the axes of a graph cross")),
  W("shapes", "Line of symmetry", def("A mirror line that splits a shape into two matching halves")),
  W("shapes", "Rotation", def("Turning a shape around a point")),
];

// ── Number & operations ──────────────────────────────────────────────────────

const NUMBER: RawWord[] = [
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
  W("number", "Whole number", sym("0, 1, 2, 3, 4, \\dots"), def("A number with no fraction or decimal part")),
  W("number", "Number line", pic({ t: "numberline" }), def("A straight line marked with numbers in order")),
  W("number", "Square root", sym("\\sqrt{49}"), def("The number that multiplies by itself to make the number you started with")),
  W("number", "Inverse operation", def("The operation that undoes another operation")),
  W("number", "Ratio", sym("3:2"), def("Compares the sizes of two or more amounts")),
  W("number", "Roman numerals", sym("\\mathrm{I,\\ V,\\ X,\\ L,\\ C}"), def("A number system that uses letters instead of digits")),
  W("number", "Positive number", def("A number greater than zero")),
  W("number", "Zero", def("The number that means nothing, or none at all")),
  W("number", "Divisible", def("Can be divided exactly, with nothing left over")),
  W("number", "Common factor", def("A number that is a factor of two or more different numbers")),
  W("number", "Power", sym("2^{5}"), def("A small raised number showing how many times to multiply a number by itself")),
  W("number", "BIDMAS", def("A rule that tells you which part of a calculation to do first")),
  W("number", "Not equal to", sym("\\neq")),
  W("number", "Less than or equal to", sym("\\leq")),
  W("number", "Greater than or equal to", sym("\\geq")),
  W("number", "Triple", def("Multiply by 3")),
  W("number", "Infinity", sym("\\infty"), def("A size that never ends")),
  W("number", "Triangular number", sym("1, 3, 6, 10, 15, \\dots")),
  W("number", "Consecutive", def("Following one after another in order, such as 4, 5, 6")),
  W("number", "Hundred", sym("100")),
  W("number", "Percent", sym("\\%"), def("A number out of 100")),
];

// ── Fractions ────────────────────────────────────────────────────────────────

const NUM_WORDS = ["", "a", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const DEN_WORDS: Record<number, [string, string]> = {
  2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"],
  6: ["sixth", "sixths"], 8: ["eighth", "eighths"], 10: ["tenth", "tenths"],
};

// A deliberately small, classroom-core set (simplest form only, so no two share a value).
const CORE_FRACTIONS: [number, number][] = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 6], [1, 8], [1, 10], [3, 10], [7, 10], [9, 10],
];

const FRACTIONS: RawWord[] = CORE_FRACTIONS.map(([num, den]) => {
  const [one, many] = DEN_WORDS[den];
  const text = num === 1 ? `${den === 8 ? "an" : "a"} ${one}` : `${NUM_WORDS[num]} ${many}`;
  return {
    id: `fractions-${num}-${den}`,
    word: text.charAt(0).toUpperCase() + text.slice(1),
    pack: "fractions" as PackId,
    // Bar model and fraction circle both appear, alongside the symbol.
    clues: [pic({ t: "bar", num, den }), pic({ t: "pie", num, den }), sym(`\\dfrac{${num}}{${den}}`)],
  };
});

const FRACTION_VOCAB: RawWord[] = [
  W("fractions", "Numerator", def("The top number of a fraction")),
  W("fractions", "Denominator", def("The bottom number of a fraction")),
  W("fractions", "Equal parts", def("Pieces that are exactly the same size")),
  W("fractions", "Equivalent fractions", def("Fractions that look different but have the same value")),
  W("fractions", "Improper fraction", sym("\\dfrac{7}{4}"), def("A fraction with a top number bigger than the bottom number")),
  W("fractions", "Mixed number", sym("2\\dfrac{1}{2}"), def("A whole number and a fraction written together")),
  W("fractions", "Simplify", def("Make a fraction as simple as possible without changing its value")),
  W("fractions", "Common denominator", def("Making the bottom numbers of fractions the same")),
  W("fractions", "Fraction of an amount", def("Dividing a number into equal parts and taking some of them")),
  W("fractions", "Fifty percent", sym("50\\%")),
  W("fractions", "Twenty-five percent", sym("25\\%")),
  W("fractions", "Seventy-five percent", sym("75\\%")),
  W("fractions", "Ten percent", sym("10\\%")),
  W("fractions", "Zero point five", sym("0.5")),
  W("fractions", "Zero point two five", sym("0.25")),
  W("fractions", "Zero point one", sym("0.1")),
  W("fractions", "Fraction wall", pic({ t: "wall" }), def("A chart of stacked bars used to compare fractions")),
];

// ── Measures & data ──────────────────────────────────────────────────────────

const MEASURES: RawWord[] = [
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
  W("measures", "Month", def("One of the 12 parts of a year")),
  W("measures", "Decade", def("A period of 10 years")),
  W("measures", "Century", def("A period of 100 years")),
  W("measures", "O'clock", pic({ t: "clock", h: 3, m: 0 }), def("The time when the minute hand points straight up")),
  W("measures", "Quarter past", pic({ t: "clock", h: 3, m: 15 })),
  W("measures", "Half past", pic({ t: "clock", h: 3, m: 30 })),
  W("measures", "Quarter to", pic({ t: "clock", h: 3, m: 45 })),
  W("measures", "AM", def("Times from midnight until noon")),
  W("measures", "PM", def("Times from noon until midnight")),
  W("measures", "Calendar", def("A chart showing the days, weeks and months of the year")),
  W("measures", "Leap year", def("A year with 366 days")),
  W("measures", "Pound", sym("\\pounds 1"), def("A unit of money worth 100 pence")),
  W("measures", "Pence", sym("\\mathrm{p}"), def("The small coins in our money; there are 100 in a pound")),
  W("measures", "Change", def("The money you get back when you pay more than the price")),
  W("measures", "Temperature", def("How hot or cold something is")),
  W("measures", "Celsius", sym("^\\circ\\mathrm{C}")),
  W("measures", "Thermometer", def("An instrument for measuring temperature")),
  W("measures", "Ruler", def("A tool for measuring and drawing straight lines")),
  W("measures", "Tonne", def("A unit of mass: 1000 kilograms")),
  W("measures", "Square centimetre", sym("\\mathrm{cm}^2")),
  W("measures", "Cubic centimetre", sym("\\mathrm{cm}^3")),
];

// ── Data & probability ───────────────────────────────────────────────────────

const DATA: RawWord[] = [
  W("data", "Mean", def("Add up all the values, then divide by how many there are")),
  W("data", "Median", def("The middle value when the data is in order")),
  W("data", "Mode", def("The value that appears most often")),
  W("data", "Range", def("The difference between the biggest and smallest values")),
  W("data", "Frequency", def("How many times something happens")),
  W("data", "Tally chart", pic({ t: "tally", n: 8 }), def("A way of counting in groups of five using lines")),
  W("data", "Bar chart", pic({ t: "barchart" }), def("A chart that uses bars of different heights to show data")),
  W("data", "Pie chart", pic({ t: "piechart" }), def("A circle chart split into slices to show data")),
  W("data", "Pictogram", def("A chart that uses small pictures to show data")),
  W("data", "Data", def("Facts and numbers collected to answer a question")),
  W("data", "Survey", def("Asking many people the same questions to collect information")),
  W("data", "Average", def("A typical value that stands for a whole set of numbers")),
  W("data", "Maximum", def("The largest value in a set of data")),
  W("data", "Minimum", def("The smallest value in a set of data")),
  W("data", "Outlier", def("A value that is very different from the rest")),
  W("data", "Table", def("Rows and columns used to organise information")),
  W("data", "Key", def("Explains what each symbol on a chart stands for")),
  W("data", "Line graph", pic({ t: "linegraph" }), def("A graph that joins points with lines, often showing change over time")),
  W("data", "Scatter graph", pic({ t: "scatter" }), def("A graph of dots used to see whether two things are linked")),
  W("data", "Venn diagram", pic({ t: "venn" }), def("A diagram of overlapping circles used to sort things")),
  W("data", "Carroll diagram", def("A table that sorts things using yes or no rules")),
  W("data", "Probability", def("How likely something is to happen")),
  W("data", "Certain", def("Will definitely happen")),
  W("data", "Impossible", def("Cannot ever happen")),
  W("data", "Likely", def("More chance of happening than not")),
  W("data", "Unlikely", def("Less chance of happening than not")),
  W("data", "Even chance", def("Equally likely to happen or not, like a coin landing on heads")),
  W("data", "Outcome", def("One possible result of an experiment")),
  W("data", "Random", def("Happening by chance, with no pattern")),
  W("data", "Dice", def("A small cube with 1 to 6 spots on its faces, used in games")),
  W("data", "Spinner", def("A wheel split into sections that stops at random")),
];

// ── Algebra & patterns ───────────────────────────────────────────────────────

const ALGEBRA: RawWord[] = [
  W("algebra", "Algebra", def("Using letters to stand for numbers")),
  W("algebra", "Unknown", def("A letter standing for a number we have not found yet")),
  W("algebra", "Expression", def("Numbers, letters and operations with no equals sign, like 3x + 2")),
  W("algebra", "Equation", def("A statement with an equals sign that can be solved, like x + 3 = 7")),
  W("algebra", "Formula", def("A rule linking quantities, such as A = l × w")),
  W("algebra", "Term", def("A single number, letter or product in an expression")),
  W("algebra", "Coefficient", def("The number multiplying a letter, like the 3 in 3x")),
  W("algebra", "Constant", def("A number on its own with no letter, like the 5 in 3x + 5")),
  W("algebra", "Like terms", def("Terms with the same letter part, such as 3x and 5x")),
  W("algebra", "Substitute", def("Replace a letter with its number value")),
  W("algebra", "Solve", def("Find the value that makes an equation true")),
  W("algebra", "Expand brackets", def("Multiply every term inside the brackets by the term outside")),
  W("algebra", "Factorise", def("Write an expression with brackets by taking out a common factor")),
  W("algebra", "Subject of a formula", def("The letter on its own on one side, such as the A in A = l × w")),
  W("algebra", "Simultaneous equations", def("Two equations with two unknowns that are solved together")),
  W("algebra", "Inequality", sym("x > 3"), def("Compares two values using signs such as < and >")),
  W("algebra", "Sequence", sym("5, 8, 11, 14, \\dots")),
  W("algebra", "Pattern", def("Numbers or shapes that follow a rule")),
  W("algebra", "Fibonacci sequence", sym("1, 1, 2, 3, 5, 8, 13, \\dots")),
  W("algebra", "Nth term", def("A formula that gives any term in a sequence")),
  W("algebra", "Term-to-term rule", def("A rule for getting from one term to the next")),
  W("algebra", "Function machine", pic({ t: "machine" }), def("A diagram showing an input, a rule and an output")),
  W("algebra", "Input", def("The number that goes into a function machine")),
  W("algebra", "Output", def("The number that comes out of a function machine")),
  W("algebra", "Gradient", def("How steep a line is")),
  W("algebra", "x-axis", def("The horizontal axis of a graph")),
  W("algebra", "y-axis", def("The vertical axis of a graph")),
];

// ── Harder words (KS3 and KS4 additions) ─────────────────────────────────────

const EXTRA: RawWord[] = [
  W("shapes", "Hypotenuse", def("The longest side of a right-angled triangle")),
  W("shapes", "Pythagoras' theorem", sym("a^2+b^2=c^2"), def("In a right-angled triangle, the squares on the two shorter sides add up to the square on the longest")),
  W("shapes", "Chord", pic({ t: "circle", part: "chord" }), def("A straight line joining two points on a circle")),
  W("shapes", "Arc", pic({ t: "circle", part: "arc" }), def("A part of the edge of a circle")),
  W("shapes", "Sector", pic({ t: "circle", part: "sector" }), def("A slice of a circle, like a piece of pizza")),
  W("shapes", "Tangent", pic({ t: "circle", part: "tangent" }), def("A straight line that just touches a circle at one point")),
  W("shapes", "Bearing", def("A direction given as an angle measured clockwise from north")),
  W("shapes", "Trigonometry", def("Maths that links the angles and side lengths of right-angled triangles")),
  W("shapes", "Sine rule", sym("\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}")),
  W("shapes", "Cosine rule", sym("a^2=b^2+c^2-2bc\\cos A")),
  W("shapes", "Vector", sym("\\begin{pmatrix}3\\\\2\\end{pmatrix}"), def("A quantity that has both size and direction")),
  W("shapes", "Locus", def("The set of all the points that follow a rule")),
  W("shapes", "Similar shapes", def("Same shape but a different size, with all lengths in the same ratio")),
  W("number", "Highest common factor", def("The largest number that divides exactly into two or more numbers")),
  W("number", "Lowest common multiple", def("The smallest number that is a multiple of two or more numbers")),
  W("number", "Prime factor", def("A factor that is also a prime number")),
  W("number", "Reciprocal", def("The number you multiply by to get 1")),
  W("number", "Significant figures", def("The digits of a number that matter, counted from the first one that is not zero")),
  W("number", "Decimal places", def("The number of digits after the point")),
  W("number", "Percentage change", def("How much something has gone up or down, as a percentage of where it started")),
  W("number", "Pi", sym("\\pi"), def("The circumference of a circle divided by its diameter, about 3.14")),
  W("number", "Direct proportion", def("When one quantity doubles, the other doubles too")),
  W("number", "Inverse proportion", def("When one quantity doubles, the other halves")),
  W("number", "Standard form", sym("3.2\\times10^{5}")),
  W("number", "Surd", sym("\\sqrt{2}"), def("A root that cannot be written as a whole number or a fraction")),
  W("number", "Compound interest", def("Interest that is added to the amount and then earns interest itself")),
  W("fractions", "Recurring decimal", sym("0.\\dot{3}"), def("A decimal with a digit or pattern of digits that repeats forever")),
  W("measures", "Speed", sym("s=\\dfrac{d}{t}"), def("How far something travels in a given time")),
  W("measures", "Density", sym("\\rho=\\dfrac{m}{V}"), def("How much mass is packed into each unit of volume")),
  W("measures", "Surface area", def("The total area of all the faces of a 3D shape")),
  W("measures", "Upper bound", def("The largest value a rounded measurement could really have been")),
  W("data", "Correlation", def("A link between two sets of data")),
  W("data", "Sample", def("A small group chosen to represent a larger group")),
  W("data", "Histogram", pic({ t: "histogram" }), def("A chart with bars of different widths, where the area shows the frequency")),
  W("data", "Cumulative frequency", def("A running total of the frequencies")),
  W("data", "Quartile", def("One of the three values that split ordered data into four equal parts")),
  W("data", "Interquartile range", def("The difference between the upper and lower quartiles")),
  W("data", "Box plot", pic({ t: "boxplot" }), def("A diagram showing the median, quartiles and the spread of data")),
  W("data", "Tree diagram", pic({ t: "tree" }), def("A diagram with branches used to show the outcomes of events in order")),
  W("data", "Relative frequency", def("The fraction of the trials in which an outcome happened")),
  W("data", "Mutually exclusive", def("Events that cannot happen at the same time")),
  W("data", "Independent events", def("Events where one has no effect on the other")),
  W("data", "Conditional probability", def("The chance of something happening given that something else already has")),
  W("algebra", "Y-intercept", def("The point where a graph crosses the y-axis")),
  W("algebra", "Quadratic", sym("x^2+5x+6"), def("An expression or equation whose highest power is x squared")),
  W("algebra", "Quadratic formula", sym("x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}")),
  W("algebra", "Completing the square", def("Rewriting a quadratic as a squared bracket plus a number")),
  W("algebra", "Difference of two squares", sym("a^2-b^2"), def("A squared number subtracted from another squared number")),
  W("algebra", "Parabola", pic({ t: "parabola" }), def("The U-shaped curve of a quadratic graph")),
  W("algebra", "Turning point", def("The highest or lowest point of a curve")),
  W("algebra", "Geometric sequence", sym("3, 6, 12, 24, 48, \\dots")),
  W("algebra", "Exponential growth", def("Growth that multiplies by the same factor each time")),
  W("algebra", "Proof", def("A logical argument showing that a statement is always true")),
];

const RAW_WORDS: RawWord[] = [...SHAPES, ...NUMBER, ...FRACTIONS, ...FRACTION_VOCAB, ...MEASURES, ...DATA, ...ALGEBRA, ...EXTRA];

// Key stage of each word. Everything not listed here is KS2 (KS2 and below).
const idsOf = (pack: PackId, names: string[]) => names.map(n => idOf(pack, n));

const KS3_IDS = new Set<string>([
  ...idsOf("shapes", ["Decagon", "Heptagon", "Congruent", "Enlargement", "Hemisphere", "Origin", "Rotation", "Hypotenuse", "Pythagoras' theorem", "Chord", "Arc", "Sector", "Bearing"]),
  ...idsOf("number", ["Square root", "Power", "Less than or equal to", "Greater than or equal to", "Triangular number", "Highest common factor", "Lowest common multiple", "Prime factor", "Reciprocal", "Significant figures", "Decimal places", "Percentage change", "Pi", "Direct proportion"]),
  ...idsOf("fractions", ["Recurring decimal"]),
  ...idsOf("measures", ["Speed", "Density", "Surface area"]),
  ...idsOf("data", ["Median", "Mode", "Range", "Scatter graph", "Venn diagram", "Outlier", "Probability", "Outcome", "Random", "Correlation", "Sample"]),
  ...idsOf("algebra", ["Algebra", "Expression", "Term", "Coefficient", "Constant", "Like terms", "Substitute", "Solve", "Expand brackets", "Factorise", "Subject of a formula", "Inequality", "Nth term", "Gradient", "Fibonacci sequence", "Y-intercept"]),
]);
const KS4_IDS = new Set<string>([
  ...idsOf("shapes", ["Tangent", "Trigonometry", "Sine rule", "Cosine rule", "Vector", "Locus", "Similar shapes"]),
  ...idsOf("number", ["Inverse proportion", "Standard form", "Surd", "Compound interest"]),
  ...idsOf("measures", ["Upper bound"]),
  ...idsOf("data", ["Histogram", "Cumulative frequency", "Quartile", "Interquartile range", "Box plot", "Tree diagram", "Relative frequency", "Mutually exclusive", "Independent events", "Conditional probability"]),
  ...idsOf("algebra", ["Simultaneous equations", "Quadratic", "Quadratic formula", "Completing the square", "Difference of two squares", "Parabola", "Turning point", "Geometric sequence", "Exponential growth", "Proof"]),
]);

export const ALL_WORDS: MathsWord[] = RAW_WORDS.map(w => ({ ...w, ks: KS4_IDS.has(w.id) ? 4 : KS3_IDS.has(w.id) ? 3 : 2 }));

/** Words that must never share a board, because a clue for one could fit another. */
export const CONFLICTS: string[][] = [
  ["shapes-triangle", "shapes-equilateral-triangle", "shapes-isosceles-triangle", "shapes-right-angled-triangle"],
  ["shapes-square", "shapes-rectangle", "shapes-rhombus", "shapes-parallelogram"],
  ["shapes-cube", "shapes-cuboid"],
  ["shapes-right-angle", "shapes-perpendicular-lines"],
  ["shapes-circumference", "measures-perimeter", "shapes-arc"],
  ["shapes-diameter", "shapes-chord"],
  ["shapes-congruent", "shapes-similar-shapes"],
  ["number-common-factor", "number-highest-common-factor"],
  ["number-square-root", "number-surd"],
  ["algebra-quadratic", "algebra-quadratic-formula", "algebra-completing-the-square", "algebra-parabola", "algebra-turning-point"],
  ["number-addition", "number-sum"],
  ["number-subtraction", "number-difference"],
  ["number-multiplication", "number-product"],
  ["shapes-reflection", "shapes-line-of-symmetry"],
  ["shapes-coordinates", "shapes-origin"],
  ["fractions-1-2", "fractions-fifty-percent", "fractions-zero-point-five"],
  ["fractions-1-4", "fractions-twenty-five-percent", "fractions-zero-point-two-five"],
  ["fractions-3-4", "fractions-seventy-five-percent"],
  ["fractions-1-10", "fractions-ten-percent", "fractions-zero-point-one"],
  ["data-average", "data-mean", "data-median", "data-mode"],
  ["algebra-sequence", "algebra-pattern"],
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


// ── Key stages and filters ───────────────────────────────────────────────────

export const KEY_STAGES: { id: Ks; name: string; blurb: string }[] = [
  { id: 2, name: "KS2", blurb: "KS2 and below" },
  { id: 3, name: "KS3", blurb: "Years 7–9" },
  { id: 4, name: "KS4", blurb: "GCSE" },
];

/** What a game draws from: topic packs, clue types and key stages. */
export interface WordFilter { packs: PackId[]; kinds: ClueKind[]; ks: Ks[] }

export const cluesFor = (w: MathsWord, kinds: ClueKind[]): Clue[] => w.clues.filter(c => kinds.includes(c.k));

export const eligibleWords = (f: WordFilter): MathsWord[] =>
  ALL_WORDS.filter(w => f.packs.includes(w.pack) && f.ks.includes(w.ks) && cluesFor(w, f.kinds).length > 0);

export const groupMates = (id: string): string[] => CONFLICTS.filter(g => g.includes(id)).flat();

/** Words in a fair order across the chosen packs, with conflicting words skipped. */
function candidateOrder(f: WordFilter, rng: Rng): MathsWord[] {
  const pool = eligibleWords(f);
  const lists = f.packs.map(p => shuffle(pool.filter(w => w.pack === p), rng));
  const interleaved: MathsWord[] = [];
  for (let i = 0; interleaved.length < pool.length; i++) {
    for (const l of lists) if (i < l.length) interleaved.push(l[i]);
  }
  const blocked = new Set<string>();
  const out: MathsWord[] = [];
  for (const w of interleaved) {
    if (blocked.has(w.id)) continue;
    out.push(w);
    groupMates(w.id).forEach(id => blocked.add(id));
  }
  return out;
}

/** How many words (never conflicting with each other) these settings can supply. */
export const maxDistinct = (f: WordFilter): number => candidateOrder(f, () => 0.5).length;

/** n distinct, non-conflicting words, taking an even share from each chosen pack; null if there are not enough. */
export function pickWords(f: WordFilter, rng: Rng, n: number): MathsWord[] | null {
  const chosen = candidateOrder(f, rng);
  return chosen.length < n ? null : shuffle(chosen.slice(0, n), rng);
}

/** Pick a clue index for a word, preferring clues not yet used for it. */
export function pickClueIndex(w: MathsWord, kinds: ClueKind[], used: Record<string, number[]>, rng: Rng): number {
  const all = w.clues.map((c, i) => (kinds.includes(c.k) ? i : -1)).filter(i => i >= 0);
  const seen = used[w.id] ?? [];
  const fresh = all.filter(i => !seen.includes(i));
  const from = fresh.length > 0 ? fresh : all;
  return from[Math.floor(rng() * from.length)];
}
