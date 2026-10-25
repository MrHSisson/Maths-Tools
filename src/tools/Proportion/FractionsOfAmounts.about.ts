import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find a fraction of an amount, and write one amount as a fraction of another.",
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
