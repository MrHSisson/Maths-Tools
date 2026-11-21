// The patch notes are one file per session (docs/patch-notes/), combined into docs/PATCH_NOTES.md by scripts/patchNotes.mjs.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain script, no types
import { buildPatchNotes, sessionEntries } from "../../scripts/patchNotes.mjs";

describe("patch notes", () => {
  it("the combined file is up to date (run `npm run facts` and commit it)", () => {
    expect(readFileSync("docs/PATCH_NOTES.md", "utf8")).toBe(buildPatchNotes());
  });
  it("every session file names its strand and starts with a dated heading, names the agent and links its Build Log block", () => {
    for (const e of sessionEntries() as { file: string; ok: boolean; body: string }[]) {
      expect(e.ok, `${e.file}: first line "Strand: Maths" (or "Strand: Computer Science"), a blank line, then "## YYYY-MM-DD — Title"`).toBe(true);
      expect(e.body, `${e.file}: needs an "Agent: Claude Code" or "Agent: Codex" line`).toMatch(/^Agent: (Claude Code|Codex)/m);
      expect(e.body, `${e.file}: needs a "Notes:" line`).toMatch(/^Notes: /m);
    }
  });
});
