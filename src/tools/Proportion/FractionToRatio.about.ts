import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Change between fractions and ratios.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "threeWay": "Switch on to include three-part ratios.",
    "simplestForm": "Switch on to ask for the ratio or fraction in its simplest form.",
    "findCommonDenominators": "Switch on to give the fractions different denominators, so you find a common denominator first.",
    "given": "Which amount is given: Part A, Part B, the total, or a mix.",
    "target": "What to write as a fraction: a single part, two parts together, or a mix.",
  },
  tools: {
    formingRatios: {
      purpose: "Write a ratio from counts, totals or clues.",
      levels: [
        "From counts: write the ratio in the order asked",
        "From a total with some counts given: find the rest, then write the ratio",
        "From a percentage or fraction of the total: find every part, then write the ratio",
      ],
    },
    fractionToRatio: {
      purpose: "Turn fractions into a ratio.",
      levels: [
        "One fraction given: find the rest and write a two-part ratio",
        "Two fractions given: find the remainder and write a three-part ratio",
        "A real amount also given: work out every amount, then write the ratio",
      ],
    },
    ratioToFraction: {
      purpose: "Turn a ratio into fractions.",
      levels: [
        "Two-part ratio: one part as a fraction of the total",
        "Three-part ratio: one part (or two parts together) as a fraction of the total",
        "Part to part: one part as a fraction of the other",
      ],
    },
  },
};
