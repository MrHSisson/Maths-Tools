import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles where a line crosses parallel lines, and give the reason.",
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
