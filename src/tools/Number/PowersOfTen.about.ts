import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Multiply and divide by powers of 10 using a place value grid.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "powersNotation": "Switch on to write the power of 10 as 10ⁿ (for example 10³) instead of 1000.",
    "pvWordHeaders": "Switch on to use words (Tens, Ones, tenths…) instead of letters in the grid headings.",
    "operation": "Whether to multiply, divide, or a mix.",
  },
  tools: {
    directCalc: {
      purpose: "Slide the digits along a place value grid.",
      levels: [
        "Whole numbers only; the answer is always a whole number",
        "Decimals (1–2 d.p.), with the grid showing tenths, hundredths and beyond",
        "Very large and very small numbers, shown as a movement instead of a grid",
      ],
    },
  },
};
