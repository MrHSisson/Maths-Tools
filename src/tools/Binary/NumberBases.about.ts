import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Convert between denary, binary and hexadecimal, with place-value working.",
  tools: {
    denBin: {
      purpose: "Convert between denary and binary.",
      levels: [
        "One nibble: 4-bit binary, denary 0–15",
        "A full byte: 8-bit binary, denary 16–255",
      ],
    },
    denHex: {
      purpose: "Convert between denary and hexadecimal.",
      levels: [
        "One nibble: denary 0–15, one hex digit",
        "A full byte: denary 16–255, two hex digits",
      ],
    },
    binHex: {
      purpose: "Convert between binary and hexadecimal.",
      levels: [
        "One nibble: 4-bit binary, one hex digit",
        "A full byte: 8-bit binary, two hex digits",
      ],
    },
  },
};
