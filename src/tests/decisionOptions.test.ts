import { describe, expect, it, vi } from "vitest";
import type { DecisionShellProps } from "../shared/decision/types";
import { levelForOptions, levelOption, offeredAt, optionValue, profileOptions, resolvedOptions } from "../shared/decision/options";
import { CpaTool } from "../tools/Decision/CriticalPath";
const CPA = () => CpaTool({});   // the whole tool (the default export may redirect a moved tab)
import Flows from "../tools/Decision/NetworkFlows";
import MST from "../tools/Decision/MinimumSpanningTree";
import TSP from "../tools/Decision/TravellingSalesperson";
import Route from "../tools/Decision/RouteInspection";
import Dim from "../tools/FurtherMechanics/DimensionalAnalysis";

vi.mock("../devMode", () => ({ useDevMode: () => true }));

type Config = DecisionShellProps["config"];
const configs: Config[] = [CPA, Flows, MST, TSP, Route, Dim].map(App => App().props.config);
const cpa = configs[0].options!;

describe("Decision options at every sub-tool and level", () => {
  it("Explain and justify has exactly its two question forms at each level, including stale links", () => {
    const o = cpa.find(o => o.key === "reasonForm")!;
    expect(levelOption(o, 1).choices.map(c => c.value)).toEqual(["range", "remove"]);
    expect(levelOption(o, 2).choices.map(c => c.value)).toEqual(["claim", "glyn"]);
    expect(optionValue(o, "claim,glyn", 1, "reason")).toBe("range,remove");
    expect(optionValue(o, "range,claim", 2, "reason")).toBe("claim");
  });
  for (const config of configs) it(`${config.pageTitle}: every offered option has legal defaults and filters foreign sub-tools/levels`, () => {
    const groups = config.options ?? [];
    for (const sub of config.subTools ?? []) for (let level = 1; level <= (sub.levels ?? config.levels ?? 1); level++) {
      const defaults = profileOptions(groups, {}, undefined, level, sub.key);
      const all = Object.fromEntries(groups.map(o => [o.key, o.choices.map(c => c.value).join(",")]));
      const resolved = resolvedOptions(groups, all, level, sub.key);
      for (const o of groups) {
        if (!offeredAt(o, level, sub.key)) {
          expect(resolved[o.key]).toBeUndefined(); continue;
        }
        const legal = levelOption(o, level).choices.map(c => c.value);
        for (const v of [defaults[o.key], resolved[o.key]].filter(v => v !== undefined && v !== "")) {
          expect(v.split(",").every(v => legal.includes(v))).toBe(true);
        }
      }
    }
  });
  it("settings start independently for a new level/sub-tool and restore only that profile", () => {
    const original = profileOptions(cpa, { course: "as", practice: "skills" }, undefined, 1, "reason");
    original.reasonForm = "remove"; original.size = "small";
    const second = profileOptions(cpa, original, undefined, 2, "reason");
    expect(second.reasonForm).toBe("claim,glyn"); expect(second.size).toBe("medium");
    const returning = profileOptions(cpa, second, original, 1, "reason");
    expect(returning.reasonForm).toBe("remove"); expect(returning.size).toBe("small");
    const other = profileOptions(cpa, original, undefined, 1, "change");
    expect(other.size).toBe("medium"); expect(other.course).toBe("as");
  });
  it("practice links select a level that actually offers their requested task", () => {
    expect(levelForOptions(cpa, { reasonForm: "glyn" }, 1, 2, "reason")).toBe(2);
    expect(levelForOptions(cpa, { unknownWhere: "off" }, 2, 2, "unknown")).toBe(1);
    const dims = configs[5].options!;
    expect(levelForOptions(dims, { dimsAsk: "constant" }, 1, 2, "dims")).toBe(2);
    expect(levelForOptions(dims, { powAsk: "zero" }, 1, 3, "powers")).toBe(2);
    expect(levelForOptions(dims, { powAsk: "zero" }, 3, 3, "powers")).toBe(3);
  });
  it("suppresses options ignored by their advertised levels", () => {
    expect(resolvedOptions(cpa, { chartGiven: "partial" }, 2, "cascade")).not.toHaveProperty("chartGiven");
    expect(resolvedOptions(cpa, { unknownWhere: "off" }, 2, "unknown")).not.toHaveProperty("unknownWhere");
    expect(resolvedOptions(cpa, { histBlocks: "whole" }, 3, "histogram")).not.toHaveProperty("histBlocks");
    expect(resolvedOptions(cpa, { histBlocks: "whole" }, 3, "level").histBlocks).toBe("whole");
    expect(resolvedOptions(cpa, { allocKind: "fixed" }, 1, "alloc")).not.toHaveProperty("allocKind");
    const flows = configs[1].options!;
    expect(resolvedOptions(flows, { scale: "100" }, 1, "reason")).not.toHaveProperty("scale");
    expect(resolvedOptions(flows, { scale: "100" }, 1, "examAny")).not.toHaveProperty("scale");
    const dims = configs[5].options!;
    expect(resolvedOptions(dims, { powAsk: "zero" }, 1, "powers").powAsk).toBe("find");
    expect(resolvedOptions(dims, { dimsAsk: "constant" }, 1, "dims").dimsAsk).toBe("quantity,expression");
  });
});
