import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Estimate answers by rounding each number first.",
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
