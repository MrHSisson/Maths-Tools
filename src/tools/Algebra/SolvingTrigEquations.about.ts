import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Solve sin, cos and tan equations in a stated range, in degrees or radians, finding every solution, with a graph that builds up beside the working.",
  options: {
    "functions": "Which of sin, cos and tan appear.",
    "ranges": "The interval the solutions must lie in.",
    "angleForms": "What the angle inside the function looks like, from a plain multiple of θ to one with a shift as well.",
    "equationForms": "Whether the trig function stands alone or has to be rearranged first.",
    "angleUnit": "Whether angles and ranges are in degrees or in radians.",
    "values": "Whether the right-hand side is an exact value or a calculator decimal.",
    "extremes": "Switch on to include 0 and ±1, which give a single solution in each turn, and solutions that sit on an end of the range.",
  },
  tools: {
    solve: {
      purpose: "Find every solution of a trig equation in a given range.",
      levels: [
        "A trig function of θ equal to a value, in a stated range",
        "A multiple of θ inside the function, so the range is widened first",
        "A multiple of θ plus or minus a shift, so the range can start below zero",
      ],
    },
  },
};
