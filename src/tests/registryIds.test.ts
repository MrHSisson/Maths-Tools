import { describe, it, expect } from "vitest";
import { ALL_TOOLS, PAGES } from "../registry";

// A tool's id is its dashboard-note key and its name in the docs, so it is the route without the slash: lower-case words joined by hyphens.
describe("registry ids", () => {
  it("every tool id is kebab-case and is its route", () => {
    const bad = ALL_TOOLS.filter(t => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id) || t.id !== t.path.replace(/^\//, "")).map(t => `${t.id} (${t.path})`);
    expect(bad).toEqual([]);
  });
  it("ids are unique", () => {
    const ids = ALL_TOOLS.map(t => t.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
  it("an old address is kebab-case, never a live route, and used once", () => {
    const paths = new Set([...ALL_TOOLS, ...PAGES].map(t => t.path));
    const aliases = [...ALL_TOOLS, ...PAGES].flatMap(t => t.aliases ?? []);
    expect(aliases.filter(a => paths.has(a) || !/^\/[a-z0-9]+(-[a-z0-9]+)*$/.test(a))).toEqual([]);
    expect(aliases.filter((a, i) => aliases.indexOf(a) !== i)).toEqual([]);
  });
});
