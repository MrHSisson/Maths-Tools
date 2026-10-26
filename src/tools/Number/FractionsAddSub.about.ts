import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add and subtract fractions and mixed numbers.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "operations": "Whether to add, subtract, or both.",
    "answerLessThanOne": "Switch on to keep every answer below 1.",
    "allowNegatives": "Switch on to allow negative answers.",
    "format": "How answers are written: as improper fractions or as mixed numbers.",
    "extendedRange": "Switch on for bigger denominators (up to 15 instead of 10 for fractions; lowest common multiple up to 225 instead of 100 for mixed numbers).",
    "partsMethod": "Switch on to work with the whole numbers and the fractions separately instead of converting to improper fractions.",
    "requiresCarrying": "Switch on to make sure the fractions add to more than 1, so you must carry.",
  },
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
