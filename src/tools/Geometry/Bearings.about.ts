import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Read and give bearings from a diagram.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "range": "Whether the bearing is less than 180° or more than 180°.",
  },
  tools: {
    identify: {
      purpose: "Find the bearing of one point from another.",
      levels: [
        "Two points: read 'A from B' correctly, then find and draw the bearing (to the nearest 5°)",
        "Three points on a route: find a bearing along either part, forwards or back",
        "Real places with mixed wording, such as 'the bearing of the Shop from the Park'",
      ],
    },
  },
};
