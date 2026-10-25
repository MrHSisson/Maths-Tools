import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Split an algebraic fraction into partial fractions.",
  tools: {
    two: {
      purpose: "Split a fraction with two brackets on the bottom.",
      levels: [
        "Two different brackets (x + a)(x + b), or one is x",
        "A bracket with a coefficient, like (px + q), or a negative x term, like (a − bx)",
        "A repeated bracket, such as (x + a)² or (px + q)²",
      ],
    },
    three: {
      purpose: "Split a fraction with three brackets on the bottom.",
      levels: [
        "Three different brackets, or two and x",
        "One bracket with a coefficient, or a negative x term",
        "One repeated bracket, like (x + a)(x + b)²",
      ],
    },
    divide: {
      purpose: "Divide first when the top is too big, then split what is left.",
      levels: [
        "Quadratic over quadratic: the quotient is a number",
        "Cubic over quadratic: the quotient is linear, and the bottom is shown expanded",
        "Cubic bottom, or a repeated bracket",
      ],
    },
  },
};
