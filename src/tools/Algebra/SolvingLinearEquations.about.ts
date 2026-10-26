import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Solve linear equations where the unknown appears on both sides.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "constantsL1": "The signs of the two numbers in the equation.",
    "xSide": "Which side the larger x term is on.",
    "solutionType": "Whether the answer is a whole number or a decimal.",
    "solutionSign": "Whether the answer is positive or negative.",
    "bracketSide": "Which side the bracket is on.",
    "constantSign": "Whether the constants are added or subtracted.",
    "negCount": "How many negative x terms the equation has.",
  },
  tools: {
    equations: {
      purpose: "Collect the x terms and the numbers to solve equations like ax + b = cx + d.",
      levels: [
        "Unknowns on both sides: ax + b = cx + d",
        "A bracket on one or both sides, such as 2(x + 3) = 3x + 1",
        "Negative x terms, such as 3 − x = 1 + x",
      ],
    },
  },
};
