import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Solve linear equations where the unknown appears on both sides.",
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
