import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Share amounts in a given ratio.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "shareType": "Which share to find: Person A's, Person B's, or both.",
    "numerical": "Switch on to use the numerical method in the working instead of the algebraic one.",
    "knownType": "What to find once one share is known: the total, or the other person's share.",
    "diffType": "What to find from the difference: the total, Person A's share or Person B's share.",
    "mixedPool": "Which of the three kinds of problem to include: sharing, known amounts, or given difference.",
  },
  tools: {
    sharing: {
      purpose: "Share a total in a ratio.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the algebra method is always used)",
      ],
    },
    known: {
      purpose: "One person's share is given: find the total or the other share.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the algebra method is always used)",
      ],
    },
    difference: {
      purpose: "The difference between two shares is given: find a share or the total.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the algebra method is always used)",
      ],
    },
    mixed: {
      purpose: "A mix of all three kinds of problem.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the algebra method is always used)",
      ],
    },
  },
};
