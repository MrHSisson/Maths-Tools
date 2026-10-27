import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find the best mixed strategy and the value of a zero-sum game from its payoff table.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "colinStrategy": "Switch on to show Colin's best strategy as well as Rose's.",
    "wrapper": "The size of the game you start from.",
  },
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
