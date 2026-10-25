import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles in triangles.",
  tools: {
    anglesInTriangle: {
      purpose: "Use the angles of a triangle to find a missing angle.",
      levels: [
        "Scalene triangles with two angles given: use the 180° total",
        "Isosceles triangles: use the equal base angles",
        "A first step before the 180° total: a triangle split by a line, or an exterior angle",
      ],
    },
  },
};
