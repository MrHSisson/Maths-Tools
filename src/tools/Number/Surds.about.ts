import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Simplify and calculate with surds, including expanding brackets and rationalising the denominator.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "radicandTypeL1": "Whether a perfect square (such as √16 = 4) can come up. It is rare, about 1 question in 12, as a check on students who always expect a surd.",
    "coeffL3": "Whether the surd has a coefficient in front to multiply through.",
    "operationAS": "Whether to add, subtract, or both.",
    "trapAS": "Whether some questions are not like surds and so cannot be combined (a rare check, about 1 in 10).",
    "coeffL2": "Whether each term also has a coefficient (such as 4√12).",
    "formL3": "The harder extension.",
    "operation": "Whether to multiply, divide, or both.",
    "radicandCaseL1": "Whether a product that collapses to a perfect square can come up (such as √2 × √8 = 4). It is rare, about 1 in 10.",
    "algebraicForm": "Whether the coefficient is a number or an x term.",
    "radicandCaseL2": "Whether the same surd can be multiplied by itself (√a × √a = a), about 1 question in 5.",
    "bracketType": "Whether the question has one bracket or two.",
    "advancedCase": "The harder case.",
    "denomForm": "Whether the surd on the bottom is already simplified, or needs simplifying first.",
    "numFormL1": "Whether the top is 1 (a unit fraction) or another whole number.",
    "l3Form": "Whether the top is a single term or a binomial (two terms).",
  },
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
