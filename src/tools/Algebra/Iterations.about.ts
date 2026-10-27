import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Use iterative formulae to find roots of equations.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "calcSteps": "Switch on to show the calculator keys to press for each step.",
    "formulaType": "Which iterative formula comes up.",
    "targetFormula": "Switch on to show the formula you are aiming to rearrange into.",
    "answerType": "What the question asks for.",
  },
  tools: {
    numerical: {
      purpose: "Apply an iterative formula again and again from a starting value.",
      levels: [
        "Whole-number start: find x₁, x₂ and x₃ (roots and fractions)",
        "Decimal start: find x₁ to x₅",
        "Keep going until it settles, then give the root to 2 decimal places",
      ],
    },
    rearranging: {
      purpose: "Rearrange an equation into an iterative formula.",
      levels: [
        "Quadratic: x² − ax − b = 0 becomes x = √(ax + b)",
        "Cubic: x³ − ax − b = 0 becomes x = ∛(ax + b)",
        "Fractional: x² − bx − a = 0 becomes x = a/x + b",
      ],
    },
    verification: {
      purpose: "Show a root lies in an interval by checking the sign change.",
      levels: [
        "A root between two whole numbers",
        "A root correct to 1 decimal place (check at 2 d.p.)",
        "A root correct to 2 decimal places (check at 3 d.p.)",
      ],
    },
  },
};
