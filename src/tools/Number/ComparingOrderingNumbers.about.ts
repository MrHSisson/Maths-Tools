import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Compare and order decimals and negative numbers, and learn to avoid the common slips.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "wholeNumberPart": "Whether numbers are all of the form 0.___, or can have a whole-number part too.",
    "trapType": "Which slip the numbers are built to catch: a longer decimal that is smaller, a shorter one that is smaller, a decoy digit later on, or a whole part that misleads. 'No trap' gives plain comparisons.",
    "notation": "Whether the answer is given in words (bigger, smaller) or with the symbols < and >.",
    "ask": "Whether you are asked for the bigger or the smaller number.",
    "pvWordHeaders": "Switch on to use words (Tens, Ones, tenths…) instead of letters in the place value table headings.",
    "sign": "Whether the numbers are all negative (focused practice) or a mix of positive and negative (harder).",
    "direction": "Which way to order the list: ascending or descending, or smallest to largest or largest to smallest.",
    "count": "How many numbers are in the list.",
  },
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
