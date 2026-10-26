import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work with circles: circumference, area and sectors.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "decimals": "Switch on to allow lengths with decimals.",
    "answerPi": "Switch on to give answers in terms of π rather than as a decimal.",
    "questionPool": "What to find for the sector.",
  },
  tools: {
    circumference: {
      purpose: "Find the circumference of a circle.",
      levels: [
        "Given the diameter: C = πd",
        "Given the radius: C = 2πr",
        "Given the circumference: find the radius or diameter",
      ],
    },
    area: {
      purpose: "Find the area of a circle.",
      levels: [
        "Given the radius: A = πr²",
        "Given the diameter: halve it first",
        "Given the area: find the radius or diameter",
      ],
    },
    sectors: {
      purpose: "Find the arc length and area of part of a circle.",
      levels: [
        "Semicircles, with the diameter given",
        "Quarter circles, with the radius given",
        "Any sector angle, with the radius given",
      ],
    },
  },
};
