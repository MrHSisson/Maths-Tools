import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Use coordinates to find gradients, line equations and missing values.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "randomOrder": "Switch on to give the two points in a random order.",
    "negativeCoords": "Switch on to allow negative coordinates.",
    "fracSign": "Whether fraction gradients are positive, negative or mixed.",
    "missingVars": "Which value is missing: x, y, the gradient m, or the intercept c.",
  },
  tools: {
    gradient: {
      purpose: "Find the gradient between two points.",
      levels: [
        "Positive whole-number gradients",
        "Negative whole-number gradients",
        "Fraction gradients (denominators 2–10): positive, negative or mixed",
      ],
    },
    equation: {
      purpose: "Find the equation of a line from two points.",
      levels: [
        "Positive whole-number gradient; the intercept is a whole number",
        "Negative whole-number gradient; the intercept is a whole number",
        "Fraction gradient; the intercept is a whole number or zero",
      ],
    },
    missing: {
      purpose: "Find a missing coordinate or value on a line.",
      levels: [
        "All values are positive whole numbers",
        "Values can be negative",
        "One value is a fraction, and so may be the answer",
      ],
    },
  },
};
