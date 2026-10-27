import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles in quadrilaterals.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "algebra": "How the angles are written.",
    "exterior": "How many exterior angles are shown as well.",
    "shape": "Which shape the question is about.",
    "findType": "What the question asks you to find.",
    "markEqual": "Switch on to mark the equal angles on the diagram.",
    "shape3": "Which shape the question is about.",
    "find3": "Which angle to find.",
    "ext3": "Whether an exterior angle is shown on an extended side (using alternate angles or a straight line).",
  },
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
