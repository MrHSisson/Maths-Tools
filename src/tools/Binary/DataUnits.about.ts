import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Convert between bits, nibbles, bytes and bigger units, using the OCR J277 scale.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "direction": "Whether you convert from a larger unit to a smaller one (multiply), or a smaller to a larger one (divide).",
    "numbers": "Whether the starting number is whole or has one decimal place.",
    "wording": "How the question is worded: 'Convert … to …', or 'How many … in …?'.",
    "scaleRelevantOnly": "Switch on to show only the units used in the question on the scale, not the whole ladder.",
  },
  tools: {
    bytesUp: {
      purpose: "Convert between bytes and bigger units; every step is ×1000.",
      levels: [
        "One step, such as 40 000 KB to MB",
        "Two steps, such as 5 GB to KB",
        "Three to five steps, such as 2 PB to GB",
      ],
    },
    bitsNibbles: {
      purpose: "Convert when a bit or a nibble is at one end, so ×4 and ×2 steps join in.",
      levels: [
        "One step, such as 3 bytes to bits",
        "Two steps, such as 2 KB to bits",
        "Three to five steps, such as 2 MB to nibbles",
      ],
    },
  },
};
