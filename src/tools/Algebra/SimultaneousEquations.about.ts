import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Solve pairs of simultaneous equations by elimination.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "operation": "Whether to add the equations, subtract them, or either.",
    "allowNegSolutions": "Switch on to allow negative solutions.",
    "rearrangeMode": "How many of the equations are given rearranged: none, one or both need rearranging first.",
    "method": "How the worked example is solved: direct elimination, scaling by a factor, or using the lowest common multiple.",
    "l2types": "The kind of word problem: a sum and difference, 'more than', or a ratio.",
    "l3types": "The setting: a purchase, or an equilateral, isosceles or scalene triangle.",
  },
  tools: {
    elimination: {
      purpose: "Add or subtract equations whose matching terms already line up.",
      levels: [
        "At least one of the matching terms is positive",
        "Both matching terms are negative",
        "A mix of both",
      ],
    },
    scaling: {
      purpose: "Multiply one equation by a whole number so the terms match, then eliminate.",
      levels: [
        "At least one of the matching terms is positive",
        "Both matching terms are negative",
        "A mix of both",
      ],
    },
    lcm: {
      purpose: "Multiply both equations so the terms reach their lowest common multiple, then eliminate.",
      levels: [
        "At least one of the matching terms is positive",
        "Both matching terms are negative",
        "A mix of both",
      ],
    },
    worded: {
      purpose: "Turn a word problem into two equations, then solve them.",
      levels: [
        "Both equations come straight from the wording",
        "A mix of sum and difference, 'more than' and ratio problems",
        "Shopping problems and triangle problems (equilateral, isosceles, scalene)",
      ],
    },
  },
};
