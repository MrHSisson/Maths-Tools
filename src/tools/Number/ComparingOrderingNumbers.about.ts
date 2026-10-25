import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Compare and order decimals and negative numbers, and learn to avoid the common slips.",
  tools: {
    compare: {
      purpose: "Say which of two numbers is bigger.",
      levels: [
        "Decimals like 0.___ to thousandths, built to catch slips (a longer decimal that is smaller)",
        "Negative numbers: the bigger-looking negative is the smaller number",
        "Both kinds of slip together",
      ],
    },
    order: {
      purpose: "Put a list of numbers in order.",
      levels: [
        "Decimals like 0.___ up to thousandths, with the same slips",
        "Negative whole numbers: the bigger-looking negative is the smaller number",
        "Negative decimals and misleading decimals together in one list",
      ],
    },
  },
};
