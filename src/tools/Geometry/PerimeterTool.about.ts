import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work out the perimeter of 2D shapes.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "mixUnits": "Switch on to mix units (cm, mm, m) so you must convert first.",
    "missing1": "Switch on to include shapes with 1 side missing.",
    "missing2": "Switch on to include shapes with 2 sides missing.",
  },
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
