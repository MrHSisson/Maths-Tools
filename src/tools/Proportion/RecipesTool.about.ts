import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Scale recipes up and down, and find the most you can make from the ingredients you have.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "scaleDirection": "Whether the recipe is scaled up or scaled down.",
    "allowDecimalDiscrete": "Switch on to allow answers like 1.5 eggs (otherwise items that come in whole numbers stay whole).",
    "questionType": "Whether to find the most servings you can make, or which ingredient is the limit.",
    "showPlenty": "Switch on to show 'Plenty' for ingredients you have more than enough of.",
  },
  tools: {
    linearScaling: {
      purpose: "Scale a recipe to a different number of servings.",
      levels: [
        "Simple multipliers (×2, ×3, ×4, ÷2, ÷4)",
        "Awkward multipliers: find a common factor first",
        "Find the amount for 1 serving first (numbers with no common factor)",
      ],
    },
    constraints: {
      purpose: "Work out how many servings you can make when an ingredient runs out.",
      levels: [
        "One serving as the base, 3 ingredients, 1 limiting",
        "Several servings as the base, 4 ingredients, 2 limiting",
        "Several servings as the base, 4 ingredients, any could be the limit",
      ],
    },
  },
};
