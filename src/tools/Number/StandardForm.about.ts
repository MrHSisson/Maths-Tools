import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work with numbers written in standard form: convert them, calculate with them, compare them and put them in order.",
  options: {},
  tools: {
    converting: {
      purpose: "Change between ordinary numbers and standard form.",
      levels: [
        "Large numbers, with positive powers",
        "Small numbers, with negative powers",
        "Numbers in parts, like 304 × 10⁵ or 0.003 × 10⁻², to be rewritten in standard form",
      ],
      options: {
        "convAsk": "Whether you convert to standard form, from it, or both.",
        "convDigits": "How many digits the coefficient has.",
        "convZeros": "Whether a zero sits between the other digits of the coefficient.",
        "convCoef": "Whether the coefficient given is too big or too small to be standard form.",
        "convStart": "Whether the power of 10 given in the question is positive or negative.",
      },
    },
    multiplyDivide: {
      purpose: "Multiply and divide numbers in standard form.",
      levels: [
        "Positive powers, and the answer is already in standard form",
        "Positive powers, and the coefficient has to be adjusted",
        "Negative powers too, and the coefficient has to be adjusted",
      ],
      options: {
        "mdOps": "Whether the question multiplies, divides, or both.",
        "mdCoef": "What kind of coefficients are used, and whether the answer is rounded.",
      },
    },
    addSubtract: {
      purpose: "Add and subtract numbers in standard form.",
      levels: [
        "The same power of 10",
        "Powers of 10 one apart, so one term has to be matched",
        "Powers of 10 two or more apart",
      ],
      options: {
        "asOps": "Whether the question adds, subtracts, or both.",
        "asResult": "Whether the combined coefficient already sits between 1 and 10 or has to be adjusted.",
        "asPowers": "Whether the powers of 10 are positive or negative.",
        "asMatch": "Which term is rewritten when the powers do not match, and so whether the answer then needs adjusting.",
      },
    },
    comparing: {
      purpose: "Compare two numbers in standard form with < and >, then put a list of them in order.",
      levels: [
        "Compare two numbers with < or >",
        "Put four numbers in order",
      ],
      options: {
        "powers": "Which powers of 10 the two numbers use, and whether they are the same.",
        "coefficients": "Whether the bigger coefficient is on the bigger number, or on the smaller one so the power has to decide.",
        "askFor": "Which way round the list is put in order.",
        "orderPowers": "Which powers of 10 the numbers in the list use.",
      },
    },
  },
};
