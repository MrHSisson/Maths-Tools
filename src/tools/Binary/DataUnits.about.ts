import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Convert between bits, nibbles, bytes and bigger units, using the OCR J277 scale.",
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
