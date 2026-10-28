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
  "estimation-round-result": { label: "Calculates the top or bottom of a fraction first, then rounds the result", example: "$\\dfrac{34 + 21}{11} \\to \\dfrac{55}{11}$ rounded to $\\dfrac{60}{10}$" },
};

export const misconceptionLabel = (id: string): string => MISCONCEPTIONS[id]?.label ?? id;
