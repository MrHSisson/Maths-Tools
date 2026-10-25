import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work with indices: powers and roots, the laws of indices, zero, negative and fractional powers, and equations with a common base.",
  tools: {
    powersRoots: {
      purpose: "Work out squares, cubes, roots and other powers.",
      levels: [
        "Squares, cubes and their roots (a recap)",
        "Zero and negative powers",
        "Fractional and negative fractional powers",
      ],
    },
    writingIndices: {
      purpose: "Write numbers and roots as powers, and back again.",
      levels: [
        "Negative indices and roots, written as powers and back",
        "A coefficient, and powers like 2/3",
        "Negative fractional indices with a coefficient",
      ],
    },
    indexLaws: {
      purpose: "Simplify using the laws of indices.",
      levels: [
        "One law on one base",
        "Coefficients and bracketed terms",
        "Several laws together, more than one letter, and missing indices",
      ],
    },
    specialPowers: {
      purpose: "Use zero and negative indices.",
      levels: [
        "The laws with zero and negative indices, on plain terms",
        "A coefficient or a bracket",
        "Two letters and several laws together",
      ],
    },
    fractionalIndices: {
      purpose: "Use fractional indices.",
      levels: [
        "The laws with fractional indices, on plain terms",
        "A coefficient, or the root of a bracket",
        "Two letters and negative fractional indices",
      ],
    },
    commonBase: {
      purpose: "Solve equations by writing both sides with the same base.",
      levels: [
        "Write as a power and solve with matching bases",
        "Negative and fractional answers, and evaluating",
        "x on both sides, and expressions in terms of a letter",
      ],
    },
  },
};
