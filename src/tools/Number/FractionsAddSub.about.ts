import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add and subtract fractions and mixed numbers.",
  tools: {
    fractions: {
      purpose: "Add and subtract fractions.",
      levels: [
        "Same denominator: add or subtract the tops, then simplify",
        "One denominator is a multiple of the other: scale one fraction first",
        "Unrelated denominators: use the lowest common multiple (denominators up to 15 in Extended Range)",
      ],
    },
    mixedNumbers: {
      purpose: "Add and subtract mixed numbers.",
      levels: [
        "Same denominator: convert to improper fractions, calculate, convert back",
        "One denominator is a multiple of the other",
        "Unrelated denominators, using the lowest common multiple (up to 225 in Extended Range)",
      ],
    },
  },
};
