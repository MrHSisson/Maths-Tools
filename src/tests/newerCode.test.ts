// Deck content that needs code this version of the site does not have yet shows a placeholder (src/decks/newerCode.tsx), not a failure.
import { describe, expect, it } from "vitest";
import { needsNewerCode } from "../decks/newerCode";
import type { DeckElement } from "../decks/types";

const q = (extra: Record<string, unknown> = {}) => ({
  version: 2, id: "q-1", title: "T", tool: "indices", level: "level1", purpose: "practice", question: ["Q"], answer: ["A"], explanation: ["E"],
  rationale: "", expectedErrors: [], followUp: "", status: "ready", format: "open", ...extra,
});
const el = (e: Record<string, unknown>) => ({ id: "e", x: 0, y: 0, w: 10, h: 10, ...e }) as unknown as DeckElement;

describe("elements this version of the site cannot draw", () => {
  it("a question with a format it has not been taught needs newer code", () => {
    expect(needsNewerCode(el({ kind: "questions", items: [q({ format: "matching" })] }))).toBe(true);
  });
  it("an ordinary question set, a text box and a known layout do not", () => {
    expect(needsNewerCode(el({ kind: "questions", items: [q()], presentation: "whiteboard" }))).toBe(false);
    expect(needsNewerCode(el({ kind: "text", text: "Hi", size: 40 }))).toBe(false);
  });
  it("a worksheet shape from a later version needs newer code", () => {
    const rect = { version: 2, shape: "L" };
    expect(needsNewerCode(el({ kind: "worksheet", authored: [q({ tool: "perimeter-and-area", rectilinear: rect })] }))).toBe(true);
  });
});
