import { describe, it, expect } from "vitest";
import { qoLayout, QO_TABS_ABOVE } from "../shared/components/QOPopovers";

const loaders = import.meta.glob("../tools/**/*.tsx");
const TABS = ["questions", "numbers", "method", "display"];

// Every option group says which tab of the popover it sits on (Questions · Numbers · Method · Display), so groups are listed in one
// order everywhere. The popover shows pill tabs above 8 choices on a level (`qoLayout`), so a level above 8 choices has to spread
// over at least two tabs.
describe("options popover tabs", () => {
  it("every group has a known tab, and every level above 8 choices gets tabs", async () => {
    const bad: string[] = [];
    for (const [p, load] of Object.entries(loaders)) {
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG?.tools) continue;
      for (const [k, e] of Object.entries<any>(t.TOOL_CONFIG.tools)) {
        for (const lv of ["level1", "level2", "level3"]) {
          const s = e.difficultySettings?.[lv] ?? {};
          const dd = s.dropdown ?? e.dropdown ?? null;
          const ms: any[] = [].concat(s.multiSelect ?? e.multiSelect ?? []);
          const vars: any[] = s.variables ?? e.variables ?? [];
          for (const g of [...(dd ? [dd] : []), ...ms, ...vars]) if (!TABS.includes(g.tab)) bad.push(`${p} ${k} ${lv} ${g.label}: tab ${JSON.stringify(g.tab)}`);
          const n = (dd ? dd.options.length : 0) + ms.reduce((a, g) => a + g.options.length, 0) + vars.length;
          if (n > QO_TABS_ABOVE && qoLayout({ dd, ms, vars }) !== "tabs") bad.push(`${p} ${k} ${lv}: ${n} choices on one tab`);
        }
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  }, 120000);
});
