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
  "sharing-divide-by-part": { label: "Divides the total by one ratio number, or by the number of people, not by the total number of parts", example: "$\\pounds 60$ in $2 : 3$: $60 \\div 2 = 30$" },
  "sharing-no-multiply": { label: "Finds the value of one part and stops, or gives it as a share", example: "$\\pounds 60$ in $2 : 3$: $\\pounds 12$ each" },
  "sharing-wrong-person": { label: "Gives a share to the wrong person: the order of the ratio is not matched to the order of the names", example: "Mia : Jack $= 2 : 3$, gives Mia the larger share" },
  "sharing-known-as-part": { label: "Treats the known share as the value of one part", example: "$3 : 5$, the first has $\\pounds 24$: the other has $24 \\times 5 = 120$" },
  "sharing-known-as-total": { label: "Treats the known share as the total", example: "$3 : 5$, the first has $\\pounds 24$: the total is $\\pounds 24$" },
  "sharing-diff-as-total": { label: "Takes the difference as a share or as the total", example: "$3 : 7$, difference $\\pounds 48$: the total is $\\pounds 48$" },
  "sharing-diff-over-total": { label: "Divides the difference by all the parts, not by the difference in parts", example: "$48 \\div 10 = 4.80$" },
  "sharing-wrong-question": { label: "Answers a different question: the other share, or the value of one part", example: "gives one share when the total is asked" },
  "sharing-missed-part": { label: "In a three-part ratio, uses only two of the parts", example: "$\\pounds 90$ in $2 : 3 : 5$: $90 \\div 5 = 18$" },
  "sharing-unsimplified": { label: "Thinks a ratio must be simplified before it can be shared, or that simplifying changes the shares", example: "$6 : 9$ cannot be shared as it is" },
  "primes-circle-non-prime": { label: "Circles a number that can still be split, so the tree stops too early", example: "$48 = 6 \\times 8$, both circled" },
  "primes-repeat-once": { label: "Lists a repeated prime only once", example: "$12 = 2 \\times 3$" },
  "primes-one-tree": { label: "Thinks a number has only one correct factor tree, so a different first split must be wrong", example: "$70 = 7 \\times 10$ is right, so $2 \\times 35$ is wrong" },
  "primes-index-as-multiply": { label: "Reads the index as a multiplier instead of a count of repeats", example: "$5^3 = 15$" },
  "primes-index-wrong-base": { label: "Puts the index on the wrong prime, or on every prime", example: "$2 \\times 3 \\times 3 \\times 3 = 2^3 \\times 3$" },
  "venn-all-copies-middle": { label: "Puts every copy of a shared prime in the middle, instead of matching the copies one for one", example: "$8 = 2 \\times 2 \\times 2$ and $12 = 2 \\times 2 \\times 3$: all three $2$s in the middle" },
  "venn-tile-both-sides": { label: "Counts a shared tile twice, so the LCM is just the two numbers multiplied", example: "LCM of $12$ and $18$ is $12 \\times 18 = 216$" },
  "venn-hcf-everything": { label: "Finds the HCF by multiplying every tile in the Venn, not just the middle", example: "HCF of $12$ and $18$ is $36$" },
  "venn-lcm-outsides": { label: "Finds the LCM from the two leftover sides only, leaving out the middle", example: "LCM of $12$ and $18$ is $2 \\times 3 = 6$" },
  "venn-empty-middle-zero": { label: "Reads an empty middle as no HCF, or as $0$, instead of $1$", example: "$8$ and $15$ share nothing: HCF is $0$" },
  "venn-one-side-lost": { label: "When one number sits inside the other, loses the number that has nothing on its own side", example: "$9$ and $18$: HCF is $18$" },
  "venn-neither-forgotten": { label: "Leaves out an item that belongs in neither circle, instead of placing it outside the circles but inside the box", example: "a card for $5$ in an even and multiple of $3$ Venn is left off" },
};

export const misconceptionLabel = (id: string): string => MISCONCEPTIONS[id]?.label ?? id;
