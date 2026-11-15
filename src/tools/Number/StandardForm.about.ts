import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work with numbers written in standard form: compare them, and put them in order.",
  options: {},
  tools: {
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
