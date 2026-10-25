import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Multiply and divide by powers of 10 using a place value grid.",
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
