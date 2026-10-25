import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Round numbers to the nearest 10, 100 or 1000, to decimal places and to significant figures.",
  tools: {
    nearest: {
      purpose: "Round to the nearest 10, 100 or 1000.",
      levels: [
        "Labelled number line: the ends and the midpoint are shown",
        "Blank number line: work out the two ends and the midpoint yourself",
        "No number line, just the rounding question",
      ],
    },
    dp: {
      purpose: "Round to a number of decimal places.",
      levels: [
        "Labelled number line: the ends and the midpoint are shown",
        "Blank number line: work out the two ends and the midpoint yourself",
        "No number line, just the rounding question",
      ],
    },
    identifySf: {
      purpose: "Find the significant figures in a number.",
      levels: [
        "Numbers with no zeros, or only zeros between digits",
        "Leading and trailing zeros: mark, underline or count the significant figures",
        "All the zero types mixed, including combined zeros like 0.0030500",
      ],
    },
    sf: {
      purpose: "Round to a number of significant figures.",
      levels: [
        "1, 2 or 3 s.f., with no zeros or only zeros between digits",
        "Leading zeros (0.0164) and trailing zeros (63,800)",
        "All the zero types mixed, with halfway cases and a choice of method",
      ],
    },
  },
};
