import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add and subtract decimals using a place value table.",
  tools: {
    add: {
      purpose: "Line up the decimal points and add column by column.",
      levels: [
        "Same number of decimal places, no carrying",
        "Same number of decimal places, with carrying (1, 2 or 3+ carries)",
        "Different numbers of decimal places, so a placeholder zero is needed",
      ],
    },
    subtract: {
      purpose: "Line up the decimal points and subtract column by column.",
      levels: [
        "Same number of decimal places, no exchanging",
        "Same number of decimal places, with exchanging (1, 2 or 3+ exchanges)",
        "Different numbers of decimal places: whole number minus decimal, and exchanging across a zero",
      ],
    },
  },
};
