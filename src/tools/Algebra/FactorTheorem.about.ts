import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Use the factor theorem to test factors, factorise polynomials and solve f(x) = 0.",
  tools: {
    y12: {
      purpose: "Work with factors of the form (x − c).",
      levels: [
        "Is (x − c) a factor? Or factorise a cubic when one factor is given",
        "Show a factor and solve, find a factor by trial, or find unknown coefficients",
        "One real root, exact (surd) answers, quartics, or factors with k or a in them",
      ],
    },
    y13: {
      purpose: "Work with factors of the form (ax − b), where x has a coefficient.",
      levels: [
        "Is (ax − b) a factor? Or factorise a cubic when one factor is given",
        "Show a factor and solve, or find an unknown coefficient",
        "Two unknown coefficients, trial factors, quartics, surds, or one real root",
      ],
    },
  },
};
