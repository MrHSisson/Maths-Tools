import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find missing angles using angle facts: right angles, straight lines, around a point and vertically opposite.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "algOptions": "How the algebra is written.",
    "numberType": "Whether the angles are whole numbers or can be decimals.",
    "showSquare": "Switch on to show the square symbol for the right angle.",
    "parts": "How many angles share the line or right angle.",
    "fixedRotation": "Switch on to always draw the line horizontal, with no rotation.",
    "voL1Variants": "Matching: say which letters stand for the same angle. Calculation: find x and y.",
    "voL2Variants": "Find x when both parts are given, or find a missing part when x plus the part equals the opposite angle.",
    "voL3Variants": "Two expressions that are equal (pure vertically opposite), or an angle split into parts whose sum is an expression.",
    "angleType": "Which angle facts can come up.",
  },
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
      options: {
        "parts": "How many angles are around the point.",
      },
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
