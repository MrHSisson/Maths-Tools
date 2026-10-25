import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add binary numbers and shift them, as in OCR J277.",
  tools: {
    binaryAddition: {
      purpose: "Add 8-bit binary numbers column by column and check for overflow.",
      levels: [
        "Two numbers with a carry, but never a column of 1 + 1 + 1",
        "Two numbers that include a column of 1 + 1 + 1",
        "Three numbers, added one after another",
      ],
    },
    binaryShifts: {
      purpose: "Shift an 8-bit number left or right and see what it does to its value.",
      levels: [
        "Do the shift and write the 8-bit result",
        "Do the shift, then say what happens to the denary value (×2ⁿ or ÷2ⁿ)",
      ],
    },
  },
};
