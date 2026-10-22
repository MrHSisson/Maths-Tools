import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { sanitiseFields, applyNoteUpdate, emptyStore, MAX_TEXT } from "../admin/notes";
import { TOOLS } from "../admin/facts";

describe("admin notes", () => {
  it("keeps only known fields with valid values", () => {
    const f = sanitiseFields({ status: "live", review: "nope", wantsToChange: "x", hack: 1, representationAgreed: "yes", inDevelopment: 5 });
    expect(f).toEqual({ status: "live", wantsToChange: "x" });
  });
  it("caps text length", () => {
    expect(sanitiseFields({ openQuestions: "a".repeat(MAX_TEXT + 50) }).openQuestions!.length).toBe(MAX_TEXT);
  });
  it("merges a partial update without losing other fields, and stamps who and when", () => {
    const a = applyNoteUpdate(emptyStore(), "indices", { wantsToChange: "more depth" }, "Harry", "2026-10-22T10:00:00Z");
    const b = applyNoteUpdate(a, "indices", { status: "live" }, "Claude", "2026-10-22T11:00:00Z");
    expect(b.tools.indices).toEqual({ wantsToChange: "more depth", status: "live", updatedAt: "2026-10-22T11:00:00Z", updatedBy: "Claude" });
    expect(a.tools.indices.updatedBy).toBe("Harry");
  });
});

describe("tool facts", () => {
  it("is in step with the code (run `npm run facts` after changing tools or the registry)", () => {
    expect(() => execFileSync("node", ["scripts/toolFacts.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
  it("lists every registered tool once with a name, route and shell", () => {
    expect(new Set(TOOLS.map(t => t.id)).size).toBe(TOOLS.length);
    TOOLS.forEach(t => { expect(t.name, t.id).toBeTruthy(); expect(t.path.startsWith("/"), t.id).toBe(true); expect(t.shell, t.id).toBeTruthy(); });
    expect(TOOLS.find(t => t.id === "indices")).toMatchObject({ depth: true, lessons: true, teach: true, shell: "ToolShell" });
  });
});
