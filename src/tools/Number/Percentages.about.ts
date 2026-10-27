import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find percentages of amounts, percentage change and reverse percentages.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "useDecimals": "Switch on to allow amounts with decimals.",
    "method": "How the percentage is found.",
    "showMultiplier": "Switch on to show the multiplier in the working (for example ×1.2 for a 20% increase).",
    "direction": "Whether the change is an increase, a decrease, or a mix.",
    "unitaryMethod": "Switch on to use the unitary method (find 1%, then scale) instead of dividing by the multiplier.",
    "context": "The setting of the question.",
  },
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
