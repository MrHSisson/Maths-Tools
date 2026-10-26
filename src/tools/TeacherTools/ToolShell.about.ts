import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
// `purpose`: one or two sentences on what the whole tool is for. For each sub-tool: one sentence on what it is for, and one short line
// per level on what changes (plain words, no jargon). The level text is the same as the level (i) beside the level buttons.
export const ABOUT: ToolAbout = {
  purpose: "TODO: what this tool is for, in one or two plain sentences.",
  tools: {
    tool1: { purpose: "TODO: what Sub-Tool 1 is for.", levels: ["TODO: Level 1", "TODO: Level 2", "TODO: Level 3"] },
    tool2: { purpose: "TODO: what Sub-Tool 2 is for.", levels: ["TODO: Level 1", "TODO: Level 2", "TODO: Level 3"] },
    tool3: { purpose: "TODO: what Sub-Tool 3 is for.", levels: ["TODO: Level 1", "TODO: Level 2", "TODO: Level 3"] },
  },
};
