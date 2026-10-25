import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Multiply out brackets, from a single bracket to a pair of brackets.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "multiplier": "What sits in front of the bracket: a number, or an algebraic term such as 3x.",
    "method": "How the working is shown: FOIL, a grid, or both. This changes the working only, not the question.",
  },
  tools: {
    expand: {
      purpose: "Multiply a single bracket out.",
      levels: [
        "A positive number outside and positive terms inside",
        "Negative constants inside, or the bracket written first",
        "Negative numbers outside and mixed signs inside",
      ],
    },
    simplify: {
      purpose: "Expand two brackets that are added or subtracted, then collect like terms.",
      levels: [
        "Two brackets added, all positive",
        "Subtracting one bracket from the other",
        "Negative multipliers and subtraction mixed",
      ],
    },
    double: {
      purpose: "Multiply out two brackets, such as (x + a)(x + b).",
      levels: [
        "(x + a)(x + b) with positive numbers",
        "(x + a)(x + b) with positive and negative numbers",
        "x has a coefficient, such as (2x + 3), with mixed signs",
      ],
    },
  },
};
