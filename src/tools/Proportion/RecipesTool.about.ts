import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Scale recipes up and down, and find the most you can make from the ingredients you have.",
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
