import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add binary numbers and shift them, as in OCR J277.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "overflow": "Whether the sum overflows 8 bits: never, sometimes (mixed), or always (exclusive).",
    "direction": "Whether the shift is to the left or the right.",
    "notation": "Whether the number is written in binary or denary.",
    "lostBits": "Whether bits fall off the end in the shift: never, sometimes (mixed), or always (exclusive).",
  },
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
