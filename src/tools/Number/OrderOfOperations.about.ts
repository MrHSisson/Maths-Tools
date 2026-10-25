import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work out expressions in the right order (BIDMAS), and spot or fix mistakes.",
  tools: {
    evaluate: {
      purpose: "Work out an expression in the right order.",
      levels: [
        "Operations only: × and ÷ before + and −; the same tier goes left to right",
        "Brackets and powers first, then it is a Level 1 question",
        "Roots and fraction bars work like brackets; also brackets inside brackets, innermost first",
      ],
    },
    fixIt: {
      purpose: "Find and correct the mistake in a worked answer.",
      levels: [
        "Mistakes with operations only: × and ÷ before + and −",
        "Mistakes with brackets and powers",
        "Mistakes with roots, fraction bars and brackets inside brackets",
      ],
    },
  },
};
