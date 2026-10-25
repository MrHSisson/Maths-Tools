import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles in quadrilaterals.",
  tools: {
    anglesInQuad: {
      purpose: "Use the properties of quadrilaterals to find missing angles.",
      levels: [
        "An irregular quadrilateral with three angles given: use the 360° total",
        "Kites and arrowheads: one pair of equal angles, shown by ticks",
        "Parallelograms, rhombuses and trapeziums: use the parallel-line rules",
      ],
    },
  },
};
