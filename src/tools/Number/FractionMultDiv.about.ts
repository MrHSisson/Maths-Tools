import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Multiply and divide fractions and mixed numbers.",
  tools: {
    multFractions: {
      purpose: "Multiply and divide fractions.",
      levels: [
        "Two proper fractions; the answer does not simplify",
        "Two proper fractions; the answer simplifies",
        "A fraction multiplied or divided by a whole number",
      ],
    },
    multMixed: {
      purpose: "Multiply and divide mixed numbers.",
      levels: [
        "A proper fraction and a mixed number, small numbers",
        "A mixed number and a whole number",
        "Two mixed numbers (bigger numbers with Harder Multiplication)",
      ],
    },
  },
};
