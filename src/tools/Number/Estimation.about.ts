import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Estimate answers by rounding each number first.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "operation": "Which operations come up.",
    "l2numbers": "The kind of numbers in a Level 2 question.",
    "l3type": "The kind of fraction question.",
    "bothSidesExpr": "Switch on to allow an expression on both sides of the fraction bar.",
    "order1": "Which operations sit with the addition or subtraction.",
    "order2": "Whether the brackets go with a multiplication or a division.",
    "order3": "Decimal numbers, or squares.",
  },
  tools: {
    estimation: {
      purpose: "Round each number to 1 significant figure, then calculate.",
      levels: [
        "Two whole numbers between 10 and 999, one operation",
        "Two numbers including decimals (also below 1), one operation",
        "Fraction questions that need estimating and simplifying",
      ],
    },
    orderOfOperations: {
      purpose: "Round every number to 1 significant figure, then work the rounded expression in the order of operations.",
      levels: [
        "Three whole numbers with × or ÷ and + or −, no brackets",
        "Three whole numbers with brackets",
        "Decimals, and squares",
      ],
    },
  },
};
