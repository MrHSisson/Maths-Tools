import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Read and give bearings from a diagram.",
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
