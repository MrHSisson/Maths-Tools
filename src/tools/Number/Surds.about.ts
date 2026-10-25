import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Simplify and calculate with surds, including expanding brackets and rationalising the denominator.",
  tools: {
    simplify: {
      purpose: "Write a surd with the smallest possible number under the root.",
      levels: [
        "Take out a factor up to 10 (such as √50 = 5√2), with the number under the root at most 400",
        "As Level 1, but with a coefficient to multiply through (such as 7√50 = 35√2)",
        "Numbers over 400, with more than one square factor to spot, and a coefficient of 2–6",
      ],
    },
    addSub: {
      purpose: "Add and subtract surds by simplifying, then combining like surds.",
      levels: [
        "Already like surds: combine the coefficients",
        "Simplify each term first to find the like surds (such as √12 + √27)",
        "Harder expressions: two surd families, a negative bracket, or an x in the coefficient",
      ],
    },
    multiplyDivide: {
      purpose: "Multiply and divide surds.",
      levels: [
        "Plain surds with no coefficient",
        "Every surd has a coefficient",
        "Fractions with surds on the top and bottom, multiplied or divided into one reduced fraction",
      ],
    },
    expand: {
      purpose: "Expand brackets that contain surds.",
      levels: [
        "A single bracket: a surd times (a whole number ± a surd)",
        "Single or double brackets (FOIL)",
        "Harder cases: collecting like surds, simplifying after expanding, or the difference of two squares",
      ],
    },
    rationalise: {
      purpose: "Remove the surd from the bottom of a fraction.",
      levels: [
        "A single surd on the bottom with a whole-number top (a unit fraction or any whole number)",
        "A single surd on the bottom with a top like k ± c√a",
        "A bracket on the bottom: multiply by the conjugate",
      ],
    },
  },
};
