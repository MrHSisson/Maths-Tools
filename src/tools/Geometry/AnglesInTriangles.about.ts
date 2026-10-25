import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles in triangles.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "noMinAngle": "Switch on to allow very small angles (under 20°); these can be hard to see on the diagram.",
    "rightAngle": "Whether a triangle has a right angle: never, sometimes or always.",
    "isoGiven": "For isosceles triangles, which angle you are given: the apex, the base, or either.",
    "type": "Which first step comes up: a triangle split by a line, an exterior angle, or a mix.",
  },
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
