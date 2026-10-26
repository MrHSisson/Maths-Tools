// "About this tool": the generated Question Options topic, the summary/topic split, and the once-per-tool first visit.
import { describe, expect, it, beforeEach } from "vitest";
import { buildAbout, applyAbout, describeOptions, setLivePaths, shouldAutoOpenAbout, markAboutSeen, resetAboutSeen } from "../shared/about";
import type { InfoSection, ToolConfig, ToolEntry } from "../shared/types";

const entry = (over: Partial<ToolEntry> = {}): ToolEntry => ({
  name: "A", variables: [{ key: "neg", label: "Negatives", defaultValue: false, info: "Allows negative numbers." }], dropdown: null,
  multiSelect: { key: "types", label: "Question Types", info: "Pick what comes up.", options: [
    { value: "a", label: "Type A", defaultActive: true }, { value: "b", label: "Type B", sub: "(harder)", defaultActive: false }] },
  difficultySettings: null, ...over,
} as ToolEntry);

const SECTIONS: InfoSection[] = [
  { title: "Adding", icon: "➕", content: [{ label: "Overview", detail: "Add numbers." }, { label: "Tip", detail: "Line them up." }] },
  { title: "Question Options", icon: "⚙️", content: [{ label: "Hand written", detail: "old copy" }] },
  { title: "Modes", icon: "🖥️", content: [{ label: "Whiteboard", detail: "old copy" }] },
];

describe("describeOptions", () => {
  it("reads pools, switches and dropdowns from the config", () => {
    const items = describeOptions(entry({ dropdown: { key: "m", label: "Method", options: [{ value: "x", label: "X" }, { value: "y", label: "Y" }] } as never }));
    expect(items.map((i) => i.label)).toEqual(["Question Types", "Negatives", "Method"]);
    expect(items[0].detail).toBe("Pick what comes up.");
    expect(items[1].detail).toBe("Allows negative numbers.");
  });
  it("shows the written explanation when there is one", () => {
    const e = entry({ multiSelect: { key: "types", label: "Question Types", info: "Which kinds of question come up.", options: [
      { value: "a", label: "A", defaultActive: true }, { value: "b", label: "B", defaultActive: false }] } as never, variables: [] });
    expect(describeOptions(e)[0].detail).toBe("Which kinds of question come up.");
  });
  it("says which levels an option is offered at, and skips single-option pools", () => {
    const pool = (key: string, label: string, n: number) => ({ key, label, options: Array.from({ length: n }, (_, i) => ({ value: `${key}${i}`, label: `O${i}`, defaultActive: true })) });
    const items = describeOptions(entry({ variables: [], multiSelect: null as never, difficultySettings: {
      level1: { multiSelect: pool("easy", "Easy pool", 2) }, level2: { multiSelect: pool("one", "Single", 1) }, level3: { multiSelect: pool("easy", "Easy pool", 2) } } as never }));
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("Easy pool (Levels 1, 3)");
  });
});

describe("buildAbout", () => {
  const config = (): ToolConfig => ({ pageTitle: "Adding", purpose: "Add numbers.", tools: {
    one: { ...entry({ levelLabels: ["Small", "Bigger", "Biggest"] }), name: "One", purpose: "The first part." },
    two: { ...entry({ levels: ["level1", "level2"] as never, levelLabels: ["A", "B", "C"] }), name: "Two", purpose: "The second part." },
  } });
  it("opens with the tool's purpose, then each sub-tool with its purpose, levels and options", () => {
    const a = buildAbout({ infoSections: SECTIONS, config: config() });
    expect(a.summary).toBe("Add numbers.");
    expect(a.subTools.map((t) => [t.name, t.purpose])).toEqual([["One", "The first part."], ["Two", "The second part."]]);
    expect(a.subTools[0].levels).toEqual(["Small", "Bigger", "Biggest"]);
    expect(a.subTools[1].levels).toEqual(["A", "B"]);   // only the levels the sub-tool has
    expect(a.subTools[0].options.length).toBeGreaterThan(0);
    expect(a.topics).toEqual([]);                        // hand-written notes and modes are not shown
  });
  it("without a config keeps the hand-written topics (games and CS topics)", () => {
    const a = buildAbout({ infoSections: SECTIONS });
    expect(a.summary).toBe("Add numbers.");
    expect(a.topics.map((t) => t.title)).toEqual(["Adding", "Question Options"]);   // no explanation of the modes
  });
});

describe("applyAbout", () => {
  it("writes the purpose and level text onto the config, and refuses a mismatch", () => {
    const cfg: ToolConfig = { pageTitle: "T", tools: { a: entry({ name: "A" }) } };
    applyAbout(cfg, { purpose: "P", tools: { a: { purpose: "Pa", levels: ["1", "2", "3"] } } });
    expect(cfg.purpose).toBe("P");
    expect(cfg.tools.a.purpose).toBe("Pa");
    expect(cfg.tools.a.levelLabels).toEqual(["1", "2", "3"]);
    expect(() => applyAbout(cfg, { purpose: "P", tools: {} })).toThrow(/missing/);
    expect(() => applyAbout(cfg, { purpose: "P", tools: { a: { purpose: "x" }, b: { purpose: "y" } } })).toThrow(/unknown/);
  });
});

describe("first visit", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } } };
    setLivePaths(["/live"]);
  });
  it("opens once for a live tool, then not again", () => {
    expect(shouldAutoOpenAbout("/live", "")).toBe(true);
    markAboutSeen("/live");
    expect(shouldAutoOpenAbout("/live", "")).toBe(false);
  });
  it("never opens for a tool that is not live, or from a shared link", () => {
    expect(shouldAutoOpenAbout("/dev", "")).toBe(false);
    expect(shouldAutoOpenAbout("/live", "?mode=worksheet")).toBe(false);
  });
  it("can be reset", () => {
    markAboutSeen("/live"); resetAboutSeen();
    expect(shouldAutoOpenAbout("/live", "")).toBe(true);
  });
  it("does not open when storage is blocked", () => {
    (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} } };
    expect(shouldAutoOpenAbout("/live", "")).toBe(false);
  });
});

describe("every tool can describe its options", () => {
  const loaders = import.meta.glob("../tools/**/*.tsx");
  it("describeOptions works for every sub-tool of every ToolShell tool", async () => {
    let tools = 0;
    for (const load of Object.values(loaders)) {
      const mod = (await load()) as { __test?: { TOOL_CONFIG?: ToolConfig } };
      const cfg = mod.__test?.TOOL_CONFIG;
      if (!cfg?.tools) continue;
      tools++;
      for (const e of Object.values(cfg.tools)) for (const i of describeOptions(e)) { expect(i.label.length).toBeGreaterThan(0); expect(i.detail.length).toBeGreaterThan(0); }
    }
    expect(tools).toBeGreaterThan(40);
  }, 120_000);
});
