import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work out the perimeter of 2D shapes.",
  tools: {
    polygons: {
      purpose: "Find the perimeter of regular and irregular polygons.",
      levels: [
        "Regular polygons: side length × number of sides",
        "Irregular polygons with two groups of equal sides (shown by ticks)",
        "The same shapes with mixed units (cm, mm, m): convert to cm first",
      ],
    },
    rectilinear: {
      purpose: "Find the perimeter of shapes with only right angles.",
      levels: [
        "Every side is given: add them all up",
        "One or two sides are missing: use the opposite sides to find them",
        "Every side is shown, with mixed units: convert to cm before adding",
      ],
    },
  },
};
