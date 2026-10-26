import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Estimate answers by rounding each number first.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "operation": "Which operations come up: +, −, × and ÷.",
    "l3type": "The kind of fraction question: a fraction bar, or a fraction plus a term.",
    "bothSidesExpr": "Switch on to allow an expression on both sides of the fraction bar.",
  },
  tools: {
    estimation: {
      purpose: "Round each number to 1 significant figure, then calculate.",
      levels: [
        "Two whole numbers between 10 and 999, one operation",
        "Two numbers including decimals, one operation",
        "Fraction questions that need estimating and simplifying",
      ],
    },
  },
};
