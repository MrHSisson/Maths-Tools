import { describe, expect, it } from "vitest";
import { TOOLS } from "../admin/facts";

// The dashboard's checklists tick from these facts, so they must be true. Each is checked against a tool whose answer is known (docs/pathways/dashboard-checklists.md).
const tool = (id: string) => { const t = TOOLS.find((x) => x.id === id); if (!t) throw new Error(`no tool ${id}`); return t; };

describe("the generated tool facts are true", () => {
  it("finds the sub-tools and levels of a Decision tool", () => {
    expect(tool("lp-simplex").subTools).toBe(5);
    expect(tool("lp-formulate").subTools).toBe(2);
    expect(tool("lp-simplex").levels).toBe(3);
    expect(tool("minimum-spanning-tree").subTools).toBe(3);
  });
  it("finds a brief by the tool named in its header, not only by its filename", () => {
    expect(tool("lp-simplex").spec).toBe(true);   // specs/linear-programming-simplex.md
    expect(tool("lp-formulate").spec).toBe(true); // specs/linear-programming-formulate.md
    expect(tool("critical-path").spec).toBe(true); // by filename
  });
  it("finds tests for a tool tested through its shared code or its file", () => {
    expect(tool("lp-simplex").tests).toBe(true);
    expect(tool("indices").tests).toBe(true);     // a __test export
  });
  it("finds the lesson decks built for a tool", () => {
    expect(tool("lp-simplex").decks).toEqual(expect.arrayContaining(["lp-simplex-process", "lp-simplex-not-origin"]));
    expect(tool("lp-formulate").decks).toEqual([]);
  });
  it("finds a tool that explains itself", () => {
    expect(tool("lp-simplex").about).toBe(true);
    expect(tool("further-maths-flashcards").about).toBe(false);
  });
});
