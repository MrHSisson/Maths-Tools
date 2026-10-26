import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Expand (a + bx)ⁿ with the binomial series, including negative and fractional powers, and use it for fractions, ranges of validity and approximations.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "powerSign": "Whether the power n is positive or negative. Negative powers give an infinite series, so the range of validity matters.",
    "powerSize": "How awkward n is: whole numbers; simple fractions such as ½, ⅓ and 3/2; or the extended set (¼ to ⅘, beyond the spec).",
    "written": "How the power is written in the question: as an index (a power) or as roots and fractions that you must rewrite as a power first.",
    "ask": "What the question asks for: the expansion, the expansion and its range of validity, or just one coefficient.",
    "upTo": "How many terms to find: up to x², x³ or x⁴ (x⁴ is beyond the spec).",
    "kForm": "Whether the number k in (1 + kx)ⁿ is a whole number or a fraction.",
    "denPower": "The power on the bottom bracket: whole numbers 1, 2, 3; roots (√ and ∛); or the extended set of fractions (¼ to ⅘, beyond the spec).",
    "raised": "The power the fraction is raised to: 2 and 3; roots (√ and ∛); or the extended set of fractions (¼ to ⅘, beyond the spec).",
    "numer": "Whether the top of the fraction is a linear expression or just a number.",
    "denom": "Whether the bottom has a repeated bracket, or the top is too big so you divide first (beyond the spec).",
    "rangeForm": "What the bottom brackets look like: three different brackets (beyond the spec), or one repeated bracket.",
    "followUp": "What you are asked for after finding the unknown: nothing more, a coefficient, or the range of validity.",
    "aValues": "When two values of a would fit: say which (the sign is given), or find both.",
    "unknown": "Which constant to find: just b, or both a and b.",
    "given": "Which coefficient you are given to work from: the coefficient of x or of x².",
    "accuracy": "Whether the final answer is rounded to 4 decimal places or left exact.",
  },
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
      options: {
        "ask": "What the question asks: use a given x, work out which x to use, or decide whether a given x can be used.",
      },
    },
  },
};
