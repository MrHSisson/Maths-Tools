import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find a fraction of an amount, and write one amount as a fraction of another.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "denomRange": "How big the denominators can be: standard (2–10) or extended (2–20).",
    "questionType": "Whether the fraction is given directly, given indirectly (find the rest), or a mix.",
    "showHint": "Switch on to show a hint about which unit conversion to make first.",
    "asFracOfOriginal": "Switch on to give the answer as a fraction of the original amount.",
    "l3Mode": "The kind of two-step question: fraction of a fraction, amount of a fraction, or a mix.",
    "allowUnsimplified": "Switch on to include fractions that are already in their simplest form.",
    "afPool": "How big the numbers are: standard (up to the 12 times table) or extended (up to 19).",
    "afQuestionType": "Whether the information is given directly, indirectly, or a mix.",
    "afSteps": "How many steps the problem takes: 1, 2, or a mix.",
  },
  tools: {
    findFraction: {
      purpose: "Find a fraction of an amount.",
      levels: [
        "Unit fractions (such as ¼ of 20), whole-number answers",
        "Other fractions (such as ³⁄₅ of 40), whole-number answers",
        "Other fractions of amounts that do not divide exactly, so the answer is a fraction",
      ],
    },
    worded: {
      purpose: "Find a fraction of an amount in a word problem.",
      levels: [
        "One-step problems, finding the amount or the rest",
        "A unit conversion first (the hint can be switched on or off)",
        "Two-step problems; for extra challenge, give the answer as a fraction of the original",
      ],
    },
    asFraction: {
      purpose: "Write one amount as a fraction of another.",
      levels: [
        "Simplify a fraction using the highest common factor",
        "Word problems with direct or indirect information",
        "One- or two-step problems: spend or give away, then write what is left as a fraction",
      ],
    },
  },
};
