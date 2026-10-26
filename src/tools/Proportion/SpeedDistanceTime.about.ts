import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Find speed, distance or time using a ratio table or a decimal method.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "units": "The units the question is set in.",
    "difficultyTier": "How awkward the numbers are.",
    "wording": "Which fact is stated first.",
    "method": "How the working is shown. This changes the working only.",
    "timeNotationL2": "How the time is written.",
    "l3Type": "The kind of time.",
    "mixedType": "Which of speed, distance and time can come up in a mixed worksheet.",
  },
  tools: {
    speed: {
      purpose: "Find an average speed from a distance and a time.",
      levels: [
        "A whole number of hours (or seconds for m/s): divide or multiply directly",
        "Minutes that divide exactly into 60: scale to one hour",
        "A time like 1 hour 30 minutes, or minutes that do not divide into 60: use the unitary method",
      ],
    },
    distance: {
      purpose: "Find a distance from a speed and a time.",
      levels: [
        "A whole number of hours (or seconds for m/s): divide or multiply directly",
        "Minutes that divide exactly into 60: scale to one hour",
        "A time like 1 hour 30 minutes, or minutes that do not divide into 60: use the unitary method",
      ],
    },
    time: {
      purpose: "Find a time from a distance and a speed.",
      levels: [
        "A whole number of hours (or seconds for m/s): divide or multiply directly",
        "Minutes that divide exactly into 60: scale to one hour",
        "A time like 1 hour 30 minutes, or minutes that do not divide into 60: use the unitary method",
      ],
    },
    mixed: {
      purpose: "A mix of speed, distance and time questions.",
      levels: [
        "A whole number of hours (or seconds for m/s): divide or multiply directly",
        "Minutes that divide exactly into 60: scale to one hour",
        "A time like 1 hour 30 minutes, or minutes that do not divide into 60: use the unitary method",
      ],
    },
  },
};
