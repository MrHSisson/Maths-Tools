import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Add and subtract positive and negative numbers on a number line.",
  tools: {
    addSub: {
      purpose: "Add and subtract whole numbers, shown as jumps on a number line.",
      levels: [
        "a + b or a − b, with a between −10 and 10 (add, subtract or both)",
        "Adding a negative number, a + (−b): always a jump to the left",
        "Subtracting a negative number, a − (−b): always a jump to the right",
      ],
    },
  },
};
