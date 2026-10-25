import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find percentages of amounts, percentage change and reverse percentages.",
  tools: {
    findingPercentages: {
      purpose: "Find a percentage of an amount.",
      levels: [
        "Friendly percentages (multiples of 10, 25%, 75%) of multiples of 10",
        "Any whole-number percentage of any whole-number amount",
        "Percentages over 100%, or fractional percentages like 12.5%",
      ],
    },
    percentageChange: {
      purpose: "Increase or decrease an amount by a percentage.",
      levels: [
        "Simple whole-number percentages of amounts under 100",
        "Real contexts like VAT or sales, with prices to 1 d.p.",
        "Large single changes, or an increase followed by a decrease",
      ],
    },
    reversePercentages: {
      purpose: "Work back to the original amount after a percentage change.",
      levels: [
        "Friendly percentages (20%, 25%, 40%, 50%) of a clean original",
        "Sale or VAT contexts with realistic prices",
        "Increases over 100%, or very small changes",
      ],
    },
  },
};
