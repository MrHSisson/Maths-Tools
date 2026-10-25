import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Write quadratics in completed-square form, and use it to solve them and find turning points.",
  tools: {
    completing: {
      purpose: "Rewrite a quadratic in the form a(x + p)² + q.",
      levels: [
        "Leading coefficient 1, whole-number p",
        "Leading coefficient 1, p is a half",
        "Leading coefficient 2 or more; can be negative",
      ],
    },
    roots: {
      purpose: "Solve a quadratic by completing the square.",
      levels: [
        "Leading coefficient 1, whole-number p",
        "Leading coefficient 1, p is a half",
        "Leading coefficient 2 or more; can be negative",
      ],
    },
    turning: {
      purpose: "Find the turning point of a quadratic from its completed-square form.",
      levels: [
        "Leading coefficient 1, whole-number p",
        "Leading coefficient 1, p is a half",
        "Leading coefficient 2 or more; can be negative",
      ],
    },
  },
};
