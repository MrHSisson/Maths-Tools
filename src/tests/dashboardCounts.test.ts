import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import facts from "../generated/toolFacts.json";

// The dashboard lists every registry entry that loads a page from `./tools/…`. The one other entry is the dashboard itself, which is not a
// tool, so it is not listed. This keeps the two counts explained: if another non-tool entry appears, this fails until it is decided.
describe("dashboard counts", () => {
  it("every registry entry is a listed tool, except the dashboard itself", () => {
    const entries = readFileSync("src/registry.ts", "utf8").split("\n").filter(l => !/^\s*\/\//.test(l) && /\bload: \(\) => import\(/.test(l));
    const unlisted = entries.filter(l => !/import\('\.\/tools\//.test(l)).map(l => l.match(/id: '([^']+)'/)?.[1]);
    expect(unlisted).toEqual(["admin"]);
    expect(facts.tools.length + unlisted.length).toBe(entries.length);
  });
});
