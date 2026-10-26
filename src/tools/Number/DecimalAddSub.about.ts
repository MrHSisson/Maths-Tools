import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add and subtract decimals using a place value table.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "places": "The most decimal places a number can have; the other number has fewer.",
    "pvWordHeaders": "Switch on to use words (Tens, Ones, tenths…) instead of letters in the place value table headings.",
    "wsGrid": "Switch on to give every worksheet question its own place value grid to work in. This limits the sheet to 2 columns.",
    "tableStart": "What the place value table shows at the start: empty, the numbers already placed, or the numbers with placeholder zeros.",
    "exchanges": "How many carries or exchanges the question needs: 1, 2, or 3 or more.",
    "addShape": "The kind of sum: numbers with different decimal places, a whole number plus a decimal, or an answer that ends in 0 (so the 0 can be dropped).",
    "subShape": "The kind of subtraction: needs a placeholder zero, a whole number minus a decimal, an exchange across a zero, or the longer number first.",
  },
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
      options: {
        "exchanges": "How many exchanges the subtraction needs: 1, 2, or 3 or more.",
      },
    },
  },
};
