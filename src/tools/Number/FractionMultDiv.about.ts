import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Multiply and divide fractions and mixed numbers.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "operations": "Whether to multiply, divide, or both.",
    "unitFraction": "Switch on to force a fraction with a numerator of 1.",
    "format": "How answers are written.",
    "noIntDiv": "Switch on to allow a whole number divided by a whole number.",
    "harderMultiplication": "Switch on for bigger numbers: whole parts up to 8 and denominators up to 10 (otherwise whole parts 1–3 and denominators 2–5).",
  },
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
