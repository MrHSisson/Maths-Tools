// ─────────────────────────────────────────────────────────────────────────────
// Misconception tags — one vocabulary for Depth options and deck practice questions.
//
// A hand-picked question (src/decks) is written against ONE tag; a Depth option can name the same tag
// (`tag` on DepthOption), so a misconception is searchable across both. The label is the plain-English
// description a teacher reads; the id is what configs and banks refer to. Ids are `<tool>-<slug>`.
// Authoring guide: docs/reference/decks.md.
// ─────────────────────────────────────────────────────────────────────────────

export interface Misconception {
  /** What the student does wrong, in one line a teacher would say. */
  label: string;
  /** A wrong answer this misconception produces, where there is one worth showing (`$...$` is inline maths). */
  example?: string;
}

export const MISCONCEPTIONS: Record<string, Misconception> = {
  "estimation-calc-zeros": { label: "Loses or gains zeros when multiplying rounded numbers", example: "$50 \\times 30 = 150$" },
  "estimation-round-truncate": { label: "Drops the last digit instead of rounding", example: "$48 \\to 40$" },
  "estimation-round-wrong-place": { label: "Rounds to the nearest 10 (or a decimal place) instead of 1 significant figure", example: "$794 \\to 790$" },
  "estimation-leading-zeros": { label: "Rounds a small decimal to zero instead of preserving its first significant figure", example: "$0.39 \\to 0$" },
  "estimation-round-to-whole": { label: "Rounds every number to a whole number", example: "$0.82 \\to 1$" },
  "estimation-divide-decimal": { label: "Thinks dividing by a number less than 1 makes the answer smaller", example: "$6 \\div 0.5 = 3$" },
  "estimation-round-twice": { label: "Rounds in two steps, using a digit the first rounding created", example: "$649 \\to 650 \\to 700$" },
  "estimation-skips-number": { label: "Rounds some of the numbers but leaves another unrounded", example: "$\\dfrac{50 + 30}{21}$" },
  "estimation-answer-size": { label: "Misplaces the decimal point, so the answer is the wrong size", example: "$0.5 \\times 0.06 = 0.3$" },
  "estimation-round-result": { label: "Calculates the top or bottom of a fraction first, then rounds the result", example: "$\\dfrac{34 + 21}{11} \\to \\dfrac{55}{11}$ rounded to $\\dfrac{60}{10}$" },
  "ratio-order": { label: "Writes a ratio in the wrong order, or thinks the order does not matter", example: "$7$ red, $4$ blue: red to blue is $4 : 7$" },
  "ratio-as-amount": { label: "Reads a ratio as the actual amounts, not as a relationship that can be scaled", example: "$2 : 3$ means exactly $2$ and $3$" },
  "ratio-as-fraction": { label: "Reads a ratio as a fraction, with the other part (not the total) on the bottom", example: "$2 : 7$ gives $\\frac27$ red" },
  "ratio-two-fractions": { label: "Thinks a ratio gives only one fraction, whatever the whole is", example: "$3 : 5$ is only ever $\\frac35$" },
  "ratio-wrong-part": { label: "Gives the fraction for the other colour than the one asked", example: "$2 : 7$ gives $\\frac79$ red" },
  "ratio-forgets-rest": { label: "Turns a fraction into a ratio without finding the rest", example: "$\\frac25$ red gives $2 : 5$" },
  "ratio-stops-early": { label: "Stops simplifying after one division", example: "$12 : 8 = 6 : 4$" },
  "ratio-one-part": { label: "Divides or multiplies only one part of a ratio", example: "$12 : 8 = 3 : 8$" },
  "ratio-add-not-multiply": { label: "Adds the same amount to both parts to make an equivalent ratio", example: "$2 : 5 = 4 : 7$" },
  "ratio-factor-of-two": { label: "Simplifies a three-part ratio using a factor of only two of the parts", example: "$12 : 18 : 8 = 2 : 3 : 1\\frac13$" },
};

export const misconceptionLabel = (id: string): string => MISCONCEPTIONS[id]?.label ?? id;
