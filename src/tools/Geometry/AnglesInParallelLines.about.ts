import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles where a line crosses parallel lines, and give the reason.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "angleTypes": "Which angle rules can come up: corresponding, alternate, co-interior, angles on a straight line and vertically opposite.",
    "orientation": "The direction the parallel lines are drawn at: random, or fixed (diagonal either way, or upright).",
  },
  tools: {
    parallelLines: {
      purpose: "Use the parallel-line angle rules: corresponding, alternate and co-interior.",
      levels: [
        "One angle given: name the rule and find x",
        "Use one rule to find x, then a different rule to find y",
        "The given angle and x are not directly linked: find a missing angle in between first",
      ],
    },
  },
};
