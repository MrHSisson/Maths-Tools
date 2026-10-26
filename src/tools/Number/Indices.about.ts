import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work with indices: powers and roots, the laws of indices, zero, negative and fractional powers, and equations with a common base.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "basePool": "The kind of number used as the base.",
    "writeBases": "Whether the base is a letter or a number.",
    "negNotation": "How the answer is written.",
    "negBases": "Whether the base is a letter or a number.",
    "answerForm": "Whether answers can keep negative indices or must be written with positive indices.",
  },
  tools: {
    powersRoots: {
      purpose: "Work out squares, cubes, roots and other powers.",
      levels: [
        "Squares, cubes and their roots (a recap)",
        "Zero and negative powers",
        "Fractional and negative fractional powers",
      ],
      options: {
        "questionPool@1": "Index notation; squares and cubes; roots; combined questions; and negative bases.",
        "questionPool@2": "Zero powers, negative powers, and writing a number as a power.",
        "questionPool@3": "Roots written as powers, fractional powers, negative fractional powers, and calculator questions.",
      },
    },
    writingIndices: {
      purpose: "Write numbers and roots as powers, and back again.",
      levels: [
        "Negative indices and roots, written as powers and back",
        "A coefficient, and powers like 2/3",
        "Negative fractional indices with a coefficient",
      ],
      options: {
        "questionPool@1": "Negative indices, and roots written as powers.",
        "questionPool@2": "Negative indices with a coefficient, powers like 2/3, and roots with a coefficient.",
        "questionPool@3": "Negative fractional indices, with a coefficient, and powers like 2/3.",
      },
    },
    indexLaws: {
      purpose: "Simplify using the laws of indices.",
      levels: [
        "One law on one base",
        "Coefficients and bracketed terms",
        "Several laws together, more than one letter, and missing indices",
      ],
      options: {
        "lawPool@12": "Which law to use.",
        "lawPool@3": "Which law to use.",
        "baseType@1": "Whether the base is a number or a letter.",
        "baseType@3": "Whether the question has two letters, or several different numbers.",
      },
    },
    specialPowers: {
      purpose: "Use zero and negative indices.",
      levels: [
        "The laws with zero and negative indices, on plain terms",
        "A coefficient or a bracket",
        "Two letters and several laws together",
      ],
      options: {
        "questionPool@1": "Zero index, dividing to get a negative index, laws with a negative index, and power of a power.",
        "questionPool@2": "Terms with a coefficient, or with brackets.",
        "questionPool@3": "Two letters, combined laws, and terms with coefficients.",
      },
    },
    fractionalIndices: {
      purpose: "Use fractional indices.",
      levels: [
        "The laws with fractional indices, on plain terms",
        "A coefficient, or the root of a bracket",
        "Two letters and negative fractional indices",
      ],
      options: {
        "questionPool@1": "Multiply, divide, power of a power, different denominators, and negative indices.",
        "questionPool@2": "Terms with a coefficient, or the root of a bracket.",
        "questionPool@3": "Two letters, negative fractional indices, and the laws with negatives.",
      },
    },
    commonBase: {
      purpose: "Solve equations by writing both sides with the same base.",
      levels: [
        "Write as a power and solve with matching bases",
        "Negative and fractional answers, and evaluating",
        "x on both sides, and expressions in terms of a letter",
      ],
      options: {
        "questionPool@12": "Write a number as a power, solve for x, or simplify and evaluate.",
        "questionPool@3": "Write a number as a power, solve for x, simplify and evaluate, or give an expression in terms of a letter.",
        "basePool": "The base the numbers are built from.",
      },
    },
  },
};
