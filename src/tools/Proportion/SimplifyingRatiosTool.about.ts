import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Simplify ratios, with numbers and with letters.",
  tools: {
    numeric: {
      purpose: "Divide every part of a ratio by a common factor.",
      levels: [
        "Two parts with a common factor of 2–5; both parts under 20",
        "Two parts with a common factor of 6–18; parts up to 60",
        "Three parts with a common factor of 6–18; parts up to 60",
      ],
    },
    algebraic: {
      purpose: "Divide out a common factor that can include letters.",
      levels: [
        "One shared factor: a number, a letter, or a letter to a power",
        "A number and a letter together (or one term with a squared letter)",
        "Two letters in both terms at different powers, plus a number",
      ],
    },
  },
};
