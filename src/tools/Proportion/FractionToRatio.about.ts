import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Change between fractions and ratios.",
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
