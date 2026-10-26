import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles in quadrilaterals.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "algebra": "How the angles are written: just x, x plus a number, a multiple of x, or both.",
    "exterior": "How many exterior angles are shown as well: none, one or two.",
    "shape": "Which shape: a kite or an arrowhead.",
    "findType": "What to find: the equal angles, the apex angle, or a base angle from its pair.",
    "markEqual": "Switch on to mark the equal angles on the diagram.",
    "shape3": "Which shape: a trapezium, or a parallelogram/rhombus.",
    "find3": "Which angle to find: a co-interior angle, any angle, or the opposite angle (parallelograms and rhombuses only).",
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
