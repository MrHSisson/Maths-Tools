import { describe, it, expect } from "vitest";
import { readShellUrl, buildShellQuery, type ShellUrlState } from "../shared/shellUrl";
import type { ToolConfig } from "../shared/types";

const config = {
  pageTitle: "T",
  tools: {
    a: {
      name: "A", variables: [{ key: "neg", label: "Neg", defaultValue: false }], dropdown: { key: "d", label: "D", defaultValue: "x", options: [{ value: "x", label: "X" }, { value: "y", label: "Y" }] },
      multiSelect: { key: "m", label: "M", options: [{ value: "p", label: "P", defaultActive: true }, { value: "q", label: "Q", defaultActive: false }] },
      difficultySettings: null,
    },
    b: { name: "B", variables: [], dropdown: null, multiSelect: null, difficultySettings: null, levels: ["level1", "level2"] },
  },
} as unknown as ToolConfig;

const base: ShellUrlState = {
  currentTool: "a", mode: "whiteboard", difficulty: "level1", toolDropdowns: {}, toolVariables: {}, toolMultiSelect: {},
  numQuestions: 15, numColumns: 3, isDifferentiated: false, diffLevels: ["level1", "level2", "level3"],
  availableLevels: ["level1", "level2", "level3"], diffSameSize: true, diffColorLevels: true, depthItemId: null,
};

describe("shareable-link URL", () => {
  it("a default setup writes nothing", () => {
    expect(buildShellQuery(base, config, {}).toString()).toBe("");
  });
  it("writes only the non-default values", () => {
    const q = buildShellQuery({
      ...base, currentTool: "b", mode: "worksheet", difficulty: "level2", numQuestions: 20, numColumns: 2,
    }, config, {});
    expect(q.toString()).toBe("tool=b&mode=worksheet&level=2&n=20&cols=2");
    const a = buildShellQuery({
      ...base, toolDropdowns: { a__level1: "y" }, toolVariables: { a: { level1: { neg: true } } }, toolMultiSelect: { a: { p: false, q: true } },
    }, config, {});
    expect(a.get("dd")).toBe("y");
    expect(a.get("vars")).toBe("neg");
    expect(a.get("ms")).toBe("-p,q");
  });
  it("round-trips through readShellUrl", () => {
    const q = buildShellQuery({ ...base, mode: "worksheet", isDifferentiated: true, diffLevels: ["level1", "level3"], diffSameSize: false, diffColorLevels: false, numQuestions: 9 }, config, {});
    const r = readShellUrl(q.toString(), config, {}, false);
    expect(r).toMatchObject({ tool: "a", mode: "worksheet", diff: true, diffLv: "1,3", diffSame: false, diffColor: false, n: 9 });
  });
  it("falls back for stale or invalid values", () => {
    const r = readShellUrl("tool=gone&level=3&mode=nope&n=999&cols=x", config, {}, false);
    expect(r).toMatchObject({ tool: "a", mode: "whiteboard", level: "level3", n: 24, cols: null });
    expect(readShellUrl("tool=b&level=3", config, {}, false).level).toBe("level1");   // level 3 is not offered on b
    expect(readShellUrl("", config, {}, true).mode).toBe("single");                    // narrow first paint
    expect(readShellUrl("mode=builder", config, {}, false)).toMatchObject({ mode: "worksheet", builderRequested: true });
  });
  it("reads on/off tokens", () => {
    const r = readShellUrl("vars=neg,-other&ms=q,-p", config, {}, false);
    expect(r.vars).toEqual({ neg: true, other: false });
    expect(r.ms).toEqual({ q: true, p: false });
  });
});

import { initToolVariables, initToolDropdowns, initToolMultiSelect } from "../shared/shellOptions";

describe("starting Question Option state", () => {
  it("defaults, then the link's values for the sub-tool and level it opens on", () => {
    const url = readShellUrl("dd=y&vars=neg&ms=-p,q", config, {}, false);
    expect(initToolVariables(config, url).a.level1.neg).toBe(true);
    expect(initToolVariables(config, readShellUrl("", config, {}, false)).a.level1.neg).toBe(false);
    expect(initToolDropdowns(config, url)["a__level1"]).toBe("y");
    expect(initToolDropdowns(config, readShellUrl("dd=nope", config, {}, false))["a__level1"]).toBe("x");
    expect(initToolMultiSelect(config, url).a).toEqual({ p: false, q: true });
  });
});

import { onlyDisplayOptionsChanged } from "../shared/shellOptions";

describe("which option changes redraw the same question", () => {
  const dd = { key: "d", label: "D", defaultValue: "x", options: [], displayOnly: true } as never;
  const vars = [{ key: "hint", label: "Hint", defaultValue: false, displayOnly: true }, { key: "neg", label: "Neg", defaultValue: false }] as never;
  const ms = [{ key: "g", label: "G", displayOnly: false, options: [{ value: "p", label: "P", defaultActive: true }] }] as never;
  const st = (o: object = {}) => ({ dd: "x", vars: { hint: false, neg: false }, ms: { p: true }, ...o });
  it("only when something changed and everything that changed is display-only", () => {
    expect(onlyDisplayOptionsChanged(st(), st(), dd, vars, ms)).toBe(false);                                    // nothing changed
    expect(onlyDisplayOptionsChanged(st(), st({ dd: "y" }), dd, vars, ms)).toBe(true);
    expect(onlyDisplayOptionsChanged(st(), st({ vars: { hint: true, neg: false } }), dd, vars, ms)).toBe(true);
    expect(onlyDisplayOptionsChanged(st(), st({ vars: { hint: true, neg: true } }), dd, vars, ms)).toBe(false);  // one changes the numbers
    expect(onlyDisplayOptionsChanged(st(), st({ ms: { p: false } }), dd, vars, ms)).toBe(false);
  });
});
