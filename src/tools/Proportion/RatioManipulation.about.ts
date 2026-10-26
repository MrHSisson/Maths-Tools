import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Write, simplify and scale ratios, and change between ratios and fractions.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "questionTypes": "Which kinds of ratio to simplify: whole numbers, parts in different units, decimals, fractions, letters, or one that is already in its simplest form.",
    "askFor": "What form the answer is written in: simplest form, or with one part made 1 (1 : n or n : 1). The 1 : n and n : 1 forms are for whole numbers.",
    "askedPart": "Which part of the new ratio is missing: the second part, the first part, or a mix.",
    "direction": "Whether the new ratio is bigger than the one given (scale up) or smaller (scale down).",
    "threeWay": "Switch on to include three-part ratios.",
    "simplestForm": "Switch on to ask for the ratio or fraction in its simplest form.",
    "findCommonDenominators": "Switch on to give the fractions different denominators, so you find a common denominator first.",
    "given": "Which amount is given: Part A, Part B, the total, or a mix.",
    "target": "What to write as a fraction: a single part, two parts together, or a mix.",
  },
  tools: {
    simplifying: {
      purpose: "Divide every part of a ratio by a common factor.",
      levels: [
        "Small common factors, two parts; with letters, one shared factor",
        "Larger common factors; with letters, a number and a letter together",
        "Three parts for whole numbers; harder units, decimals and fractions; with letters, two letters at different powers",
      ],
    },
    equivalentRatios: {
      purpose: "Build a ratio that is equivalent by scaling.",
      levels: [
        "Pick the equivalent ratio from four options",
        "Scale directly by a whole number to find a missing value",
        "Simplify first, then scale, to find a missing value",
      ],
    },
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
