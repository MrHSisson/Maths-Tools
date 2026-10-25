import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Compare two prices and decide which is better value.",
  tools: {
    unitCost: {
      purpose: "Work out the cost per unit to compare two packs.",
      levels: [
        "Counted items (eggs, biscuits) with quantities up to 12 and whole-number prices",
        "Weights and volumes (200 g, 500 ml): compare per 100 g/ml or per unit",
        "Awkward quantities (345 g, 685 ml) with prices that are very close",
      ],
    },
    specialOffers: {
      purpose: "Compare special offers.",
      levels: [
        "Buy N get 1 free against a pack of the same total quantity at a slightly different price",
        "A percentage discount against a bulk pack at full price",
        "Mixed offers: buy 1 get 1 free against a percentage discount",
      ],
    },
  },
};
