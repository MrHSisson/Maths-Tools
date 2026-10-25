import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Solve pairs of simultaneous equations by elimination.",
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
