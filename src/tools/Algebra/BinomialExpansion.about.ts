import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Expand (a + bx)ⁿ with the binomial series, including negative and fractional powers, and use it for fractions, ranges of validity and approximations.",
  tools: {
    expand: {
      purpose: "Write out the first terms of (a + bx)ⁿ for any power n.",
      levels: [
        "(1 ± x)ⁿ for any power n",
        "(1 + kx)ⁿ, where k is a whole number or a fraction",
        "(a + bx)ⁿ where a is not 1: take aⁿ out first",
      ],
    },
    one: {
      purpose: "Expand a fraction with one bracket on the bottom by writing it as a power.",
      levels: [
        "Bracket is 1 ± x",
        "Bracket is 1 + kx",
        "Bracket is a + bx",
      ],
    },
    power: {
      purpose: "Expand a fraction whose bottom bracket is raised to a power.",
      levels: [
        "Bracket is 1 ± x",
        "Bracket is 1 + kx",
        "Bracket is a + bx",
      ],
    },
    partial: {
      purpose: "Split a fraction into partial fractions, then expand each part.",
      levels: [
        "Two brackets like (1 + ax)(1 + bx), up to x²",
        "Brackets like (2 − x)(1 + 3x), up to x³",
        "A repeated bracket, or divide first",
      ],
    },
    range: {
      purpose: "State the values of x for which an expansion works.",
      levels: [
        "One bracket (a + bx)ⁿ",
        "Two brackets: find where both ranges overlap",
        "Three brackets from a partial-fractions bottom, or one repeated bracket",
      ],
    },
    unknown: {
      purpose: "Use a given coefficient to find an unknown constant.",
      levels: [
        "Find a from the coefficient of x",
        "Find a from the coefficient of x²",
        "Find b from one coefficient, or a and b from the first two terms",
      ],
    },
    approx: {
      purpose: "Use the first few terms to estimate a value.",
      levels: [
        "The expansion is given: put in a small x",
        "Expand (1 + kx)ⁿ first, then estimate",
        "(a + bx)ⁿ with a not 1, and why a given x cannot be used",
      ],
    },
  },
};
