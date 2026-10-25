import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find the best mixed strategy and the value of a zero-sum game from its payoff table.",
  tools: {
    mixed: {
      purpose: "Find Rose's best mix and the value of the game.",
      levels: [
        "A 2×2 game: look for a saddle point, then find the mix p and the value",
        "A 3×3 game: remove the dominated row and column, then solve the 2×2 that is left",
        "A 2×3 game solved with a graph: read off the peak of the lower line",
      ],
    },
  },
};
