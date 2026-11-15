import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Share an amount in a ratio of two or three parts: from the total, from one known share, or from a difference.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "shareType": "Which share to find.",
    "numerical": "Switch on to use the numerical method in the working instead of the bar model.",
    "showCheck": "Switch on to end the working with a check that the answer fits the question.",
    "unsimplified": "Switch on to give some ratios that are not in their simplest form, so the working starts by simplifying.",
    "partCount": "How many people share, so how many numbers the ratio has.",
    "context": "What kind of thing is shared, so the wording and units fit.",
    "knownType": "What to find once one share is known.",
    "diffType": "What to find from the difference.",
    "mixedPool": "Which of the three kinds of problem to include.",
  },
  tools: {
    sharing: {
      purpose: "Share a total in a ratio.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the numerical method is always used)",
      ],
    },
    known: {
      purpose: "One person's share is given: find the total or the other share.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the numerical method is always used)",
      ],
    },
    difference: {
      purpose: "The difference between two shares is given: find a share or the total.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the numerical method is always used)",
      ],
    },
    mixed: {
      purpose: "A mix of all three kinds of problem.",
      levels: [
        "Ratios and totals from the times tables (shares within 12 × 12)",
        "Random ratios that do not simplify, with every share at most 144",
        "Larger ratios with totals up to 600 (the numerical method is always used)",
      ],
    },
  },
};
