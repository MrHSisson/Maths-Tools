import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles using angle facts: right angles, straight lines, around a point and vertically opposite.",
  tools: {
    rightAngle: {
      purpose: "Angles in a right angle add up to 90°.",
      levels: [
        "One line inside: one angle given, find x",
        "Two lines inside: two angles given, find x",
        "Angles written with letters that add to 90°",
      ],
    },
    straightLine: {
      purpose: "Angles on a straight line add up to 180°.",
      levels: [
        "One line from the line: one angle given, find x",
        "Two lines from the line: two angles given, find x",
        "Angles written with letters that add to 180°",
      ],
    },
    aroundPoint: {
      purpose: "Angles around a point add up to 360°.",
      levels: [
        "3 angles, two given: find x",
        "4 angles, three given: find x",
        "Angles written with letters that add to 360°",
      ],
    },
    verticallyOpposite: {
      purpose: "Vertically opposite angles are equal.",
      levels: [
        "Match up x and y from two angles, or find x and y from one",
        "One angle is split: find x from the parts, or find a missing part",
        "Angles written with letters: set equal and solve",
      ],
    },
    mixed: {
      purpose: "A mix of all the angle facts.",
      levels: [
        "One or two angles given, on the simpler diagrams",
        "Two or three angles given, on busier diagrams",
        "Angles with letters: write an equation and solve for x",
      ],
    },
  },
};
