import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Round numbers to the nearest 10, 100 or 1000, to decimal places and to significant figures.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "nearestPool": "What to round to: the nearest 10, 100, 1000, or whole number.",
    "dpPool": "How many decimal places to round to: 1, 2 or 3.",
    "sfPool": "How many significant figures to round to: 1, 2 or 3.",
    "labelMode": "How much of the number line is labelled: just the ends and the midpoint, or every mark so you only see where the number sits.",
    "plotMode": "Whether the students plot the number on the line themselves (the plot is revealed, then the answer), or it is plotted for them.",
    "precision": "How many digits there are past the rounding position: one extra (the number sits on a mark) or two (it sits between marks).",
    "position": "Whether the number can be anywhere, or is always exactly halfway between the two ends (so you need the rounding rule).",
    "method": "How the working is shown: the digit rule, or the number line. This changes the working only.",
    "blankMode": "On a blank number line, what the students fill in: both ends and the midpoint, or only the midpoint with the ends given.",
    "endsReveal": "When the ends and the midpoint appear: with the answer, or before the plot (Show Ends, then plot).",
    "sfKind": "Whether the numbers are whole numbers or decimals (including numbers below 1).",
    "sfTask": "What to do with the significant figures: mark them, underline one (the 1st, 2nd or 3rd), or count them.",
    "sfLine": "Whether a number line is shown: off, labelled (ends and midpoint shown), or blank (students fill in).",
  },
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
      options: {
        "sfZeros@1": "Which zeros appear: none, or zeros trapped between digits.",
        "sfZeros@2": "Which zeros appear: leading (before the first digit) or trailing (after the last digit).",
        "sfZeros@3": "Which zeros appear: none, trapped, leading, trailing, or combined (two or more kinds in one number).",
      },
    },
    sf: {
      purpose: "Round to a number of significant figures.",
      levels: [
        "1, 2 or 3 s.f., with no zeros or only zeros between digits",
        "Leading zeros (0.0164) and trailing zeros (63,800)",
        "All the zero types mixed, with halfway cases and a choice of method",
      ],
      options: {
        "sfZeros@1": "Which zeros appear: none, or zeros trapped between digits.",
        "sfZeros@2": "Which zeros appear: leading (before the first digit) or trailing (after the last digit).",
        "sfZeros@3": "Which zeros appear: none, trapped, leading or trailing.",
      },
    },
  },
};
