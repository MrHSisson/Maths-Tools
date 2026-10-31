import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Write, simplify and scale ratios, and change between ratios and fractions.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "method": "How the common factor is taken out in the working.",
    "questionTypes": "Which kinds of ratio to simplify.",
    "askFor": "What form the answer is written in: tick more than one to mix them in a set. The 1 : n and n : 1 forms are for whole numbers.",
    "askedPart": "Which part of the new ratio is missing.",
    "direction": "Whether the new ratio is bigger than the one given (scale up) or smaller (scale down).",
    "threeWay": "Switch on to include three-part ratios.",
    "simplestForm": "Switch on to ask for the ratio or fraction in its simplest form.",
    "findCommonDenominators": "Switch on to give the fractions different denominators, so you find a common denominator first.",
    "given": "Which amount is given.",
    "parts": "How many parts the ratio has.",
    "numerator": "Whether the fraction asked for is one part, or two parts together.",
    "fractionOf": "What the bottom of the fraction is taken from, so what the question compares with.",
    "partAsked": "Which part of the ratio the question is about, so it is not always the first. For two parts together it is the part left out.",
    "partNamed": "Whether the part is named directly (red) or by leaving the others out (not red).",
    "answerSize": "Whether the fraction is less than 1 or more than 1.",
    "numerical": "Switch on to work it with numbers only, leaving out the bar model.",
    "fractionGiven": "Whether the fraction given is of the total or of the other part.",
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
        "One fraction given, of the total or of the other part: write a two-part ratio",
        "Two fractions given: find the remainder and write a three-part ratio",
        "A real amount also given: work out every amount, then write the ratio",
      ],
    },
    ratioToFraction: {
      purpose: "Turn a ratio into fractions: of the total, of a part, or a mixture.",
      levels: [
        "Of the total: add the parts for the denominator",
        "Of a part: the denominator is one other part, not the total",
        "A mixture: decide from the wording whether the fraction is of the total or of a part",
      ],
    },
  },
};
