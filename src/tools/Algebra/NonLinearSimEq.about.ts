import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Solve simultaneous equations by substitution, including when one equation is a curve.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "signs": "Whether the solutions are positive, negative, or either.",
    "negEq1": "Switch on to allow negative coefficients in the first equation.",
    "zeroForm": "Switch on to write an equation in the form … = 0.",
    "coeffs": "How hard the curve is.",
    "display": "How answers are shown.",
  },
  tools: {
    linear: {
      purpose: "Substitute one linear equation into the other.",
      levels: [
        "A letter is already on its own: substitute straight in",
        "A letter has coefficient 1 but needs rearranging first",
        "A letter has coefficient −1: take care with the sign",
      ],
    },
    factorising: {
      purpose: "Solve a line and a curve where the quadratic factorises.",
      levels: [
        "Line already rearranged: substitute, then factorise",
        "Line needs rearranging first",
        "Circle or ellipse, with whole-number or fractional answers",
      ],
    },
    formula: {
      purpose: "Solve a line and a curve using the quadratic formula.",
      levels: [
        "Line already rearranged: substitute, then use the formula",
        "Line needs rearranging first, then use the formula",
        "Circle or ellipse with answers as surds or decimals",
      ],
    },
  },
};
