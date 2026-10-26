import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Use the factor theorem to test factors, factorise polynomials and solve f(x) = 0.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "division": "How much of the long division is shown.",
  },
  tools: {
    y12: {
      purpose: "Work with factors of the form (x − c).",
      levels: [
        "Is (x − c) a factor? Or factorise a cubic when one factor is given",
        "Show a factor and solve, find a factor by trial, or find unknown coefficients",
        "One real root, exact (surd) answers, quartics, or factors with k or a in them",
      ],
      options: {
        "questionType@1": "Is (x − c) a factor of f(x), or factorise a cubic when one factor is given.",
        "questionType@2": "Show a factor then solve, find a factor by trial, find an unknown coefficient, or find two unknown coefficients.",
        "questionType@3": "One real root only, exact (surd) answers, quartics, or a factor containing k or a.",
      },
    },
    y13: {
      purpose: "Work with factors of the form (ax − b), where x has a coefficient.",
      levels: [
        "Is (ax − b) a factor? Or factorise a cubic when one factor is given",
        "Show a factor and solve, or find an unknown coefficient",
        "Two unknown coefficients, trial factors, quartics, surds, or one real root",
      ],
      options: {
        "questionType@1": "Is (ax − b) a factor of f(x), or factorise a cubic when one factor is given.",
        "questionType@2": "Show a factor then solve, or find an unknown coefficient.",
        "questionType@3": "One real root only, find a factor by trial, two unknown coefficients, exact (surd) answers, quartics, or a factor containing a.",
      },
    },
  },
};
