// "About this tool": the generated Question Options topic, the summary/topic split, and the once-per-tool first visit.
import { describe, expect, it, beforeEach } from "vitest";
import { buildAbout, describeOptions, setLivePaths, shouldAutoOpenAbout, markAboutSeen, resetAboutSeen } from "../shared/about";
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
    expect(items[0].detail).toContain("Pick what comes up.");
    expect(items[0].detail).toContain("Type B (harder)");
    expect(items[1].detail).toBe("Allows negative numbers.");
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
  const modes = [{ label: "Worksheet", sub: "a set" }];
  it("uses the Overview as the summary and writes the options topic from the config", () => {
    const a = buildAbout({ infoSections: SECTIONS, entry: entry(), modes });
    expect(a.summary).toBe("Add numbers.");
    expect(a.topics.map((t) => t.title)).toEqual(["Adding", "Question Options"]);   // hand-written Options and Modes copies are dropped
    expect(a.topics[0].items.map((i) => i.label)).toEqual(["Tip"]);
    expect(a.topics[1].items.length).toBeGreaterThan(0);
  });
  it("without a config keeps the hand-written sections (Decision tools and games)", () => {
    const a = buildAbout({ infoSections: SECTIONS });
    expect(a.topics.map((t) => t.title)).toEqual(["Adding", "Question Options", "Modes"]);
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
