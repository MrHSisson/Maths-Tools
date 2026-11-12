// The Critical Path Question Options that belong to one level of one tab: they must exist (an edit once removed three of them without any test noticing) and be limited to their level.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const src = readFileSync("src/tools/Decision/CriticalPath.tsx", "utf8");
const optionBlock = (key: string): string => {
  const a = src.indexOf(`key: "${key}",`);
  expect(a, `option ${key} exists`).toBeGreaterThan(-1);
  return src.slice(a, src.indexOf("\n          },", a));
};

describe("Critical Path — level-specific Question Options", () => {
  const expected: [string, string, string][] = [
    ["levelWording", "level", ""],
    ["levelWorkers", "level", "[3]"],
    ["levelSize", "level", "[3]"],
    ["histSize", "histogram", "[1]"],
    ["histWorkers", "histogram", "[3]"],
    ["histCut", "histogram", "[3]"],
    ["histGiven", "histogram", "[3]"],
  ];
  for (const [key, tab, levels] of expected) {
    it(`${key} is on the ${tab} tab${levels ? ` at level ${levels}` : " at every level"}`, () => {
      const b = optionBlock(key);
      expect(b).toContain(`forSubTools: ["${tab}"]`);
      if (levels) expect(b).toContain(`forLevels: ${levels}`); else expect(b).not.toContain("forLevels");
      expect(b).toContain("info:");
    });
  }
});
