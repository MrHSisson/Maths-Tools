import { describe, expect, it } from "vitest";
import { __seed } from "../tools/Decision/CriticalPath";
import { CPA_ALL_HOMES, CPA_EXAM, CPA_SKILL_TOOLS, cpaHomeOf, cpaRedirect } from "../tools/Decision/CriticalPathHomes";

describe("Critical Path split: where every old sub-tool lives", () => {
  const old = __seed.subTools.map((t: { key: string }) => t.key);
  it("gives every old sub-tool exactly one new home", () => {
    for (const k of old) expect(CPA_ALL_HOMES.filter((h) => h.subs.includes(k)).length, k).toBe(1);
  });
  it("invents no sub-tool that did not exist", () => {
    for (const h of CPA_ALL_HOMES) for (const s of h.subs) expect(old, `${h.id}/${s}`).toContain(s);
  });
  it("keeps the exam chains (ex…) together and the skills out of the exam page", () => {
    expect(CPA_EXAM.subs.every((s) => s.startsWith("ex"))).toBe(true);
    expect(CPA_SKILL_TOOLS.flatMap((h) => h.subs).some((s) => s.startsWith("ex"))).toBe(false);
  });
  it("has unique ids and paths", () => {
    expect(new Set(CPA_ALL_HOMES.map((h) => h.id)).size).toBe(CPA_ALL_HOMES.length);
    expect(new Set(CPA_ALL_HOMES.map((h) => h.path)).size).toBe(CPA_ALL_HOMES.length);
  });
  it("keeps each skill tool to a single row of tabs", () => {
    for (const h of CPA_SKILL_TOOLS) expect(h.subs.length).toBeLessThanOrEqual(5);
  });
});

describe("cpaRedirect: old /critical-path links", () => {
  it("sends a tab to its tool, dropping the retired switches and keeping the rest", () => {
    expect(cpaRedirect("?tool=forward&level=2&o_course=as&o_practice=skills&o_size=small")).toEqual({ pathname: "/cpa-times", search: "?tool=forward&level=2&o_size=small" });
    expect(cpaRedirect("?tool=histogram&o_course=a")).toEqual({ pathname: "/cpa-charts", search: "?tool=histogram" });
  });
  it("sends an exam chain to the exam page", () => {
    expect(cpaRedirect("?tool=exCascade&o_course=a&o_practice=exam").pathname).toBe("/cpa-exam");
  });
  it("opens the first tab of Activity Networks when there is no usable tab, as the old tool did", () => {
    expect(cpaRedirect("")).toEqual({ pathname: "/cpa-networks", search: "" });
    expect(cpaRedirect("?tool=nonsense&level=2")).toEqual({ pathname: "/cpa-networks", search: "?level=2" });
  });
  it("redirects every old tab to a tool that lists it", () => {
    for (const t of __seed.subTools) {
      const r = cpaRedirect(`?tool=${t.key}`);
      expect(cpaHomeOf(t.key)!.path, t.key).toBe(r.pathname);
      expect(r.search, t.key).toBe(`?tool=${t.key}`);
    }
  });
});
