import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Spot like terms and simplify expressions by collecting them.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "subtractionCases": "Which kinds of question come up: only adding positive terms; subtracting but staying positive; or subtracting so the answer crosses zero (a negative result).",
    "splitCases": "How the four terms split between the two letters: two of each (2 and 2), or three of one and one of the other (3 and 1).",
  },
  tools: {
    subtool1: {
      purpose: "Pick out which terms are like terms: the same letter to the same power.",
      levels: [
        "One letter, powers 1–5. Exactly one right answer",
        "Negative coefficients added. Exactly one right answer",
        "Five options with none, one or two right answers; some with two letters",
      ],
    },
    subtool2: {
      purpose: "Collect like terms in expressions with one letter.",
      levels: [
        "Only x terms, 2–4 of them (up to 8 with no coefficients)",
        "Adds constants and x² terms that cannot be collected",
        "x, x² and x³ with constants mixed: sort, collect and write in order",
      ],
      options: {
        "termOptions": "An extra, uncollectable term to add: a constant, or an x² term.",
      },
    },
    subtool3: {
      purpose: "Collect like terms in expressions with two or more letters.",
      levels: [
        "Two letters, four terms: a 2 + 2 or 3 + 1 split",
        "One extra complication: a constant, a squared letter or a third letter",
        "Both letters always have a pair to collect, so two groups at once",
      ],
      options: {
        "termOptions@2": "An extra complication: a constant, a squared letter, or a third letter.",
        "termOptions@3": "Extra features: no coefficients (just x + y + x…), a constant, or squared terms.",
      },
    },
  },
};
