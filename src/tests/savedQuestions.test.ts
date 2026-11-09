// Saved questions: pins and the print basket are one list of recipes (tab, level, options, seed) kept on the device. These tests cover the
// pure pieces: how a ToolShell question's settings are written into a recipe and read back, the fingerprint that travels with a recipe
// (and an old link without one), toggling, and a real round trip: save a question's recipe, rebuild it from the seed, get the same question.
import { describe, it, expect } from "vitest";
import { levelKey, levelNumber, encodeToolOptions, decodeToolOptions } from "../shared/savedRecipe";
import { decodeBasket, encodeBasket, itemKey, type BasketItem } from "../shared/decision/printBasket";
import { generateFromSeed, generateSeeded } from "../shared/seededGenerate";
import { questionFingerprint } from "../shared/recentQuestions";
import { extras } from "../shared/questionExtras";
import { normalizeMultiSelect } from "../shared/helpers";

const item = (n: number, extra: Partial<BasketItem> = {}): BasketItem => ({ tab: "t", level: 1, seed: n, options: {}, preview: `q${n}`, ...extra });

describe("saved recipe options", () => {
  it("writes switches, multi-select options and the dropdown into one record and reads them back", () => {
    const s = { vars: { a: true, b: false }, ms: { x: true, y: false }, dd: "mode" };
    const back = decodeToolOptions(encodeToolOptions(s));
    expect(back).toEqual(s);
  });
  it("an empty dropdown is left out, and keys that are not ours are ignored", () => {
    expect(encodeToolOptions({ vars: {}, ms: {}, dd: "" })).toEqual({});
    expect(decodeToolOptions({ "v:a": "1", other: "z" })).toEqual({ vars: { a: true }, ms: {}, dd: "" });
  });
  it("level keys and numbers convert both ways", () => {
    expect(levelNumber("level3")).toBe(3);
    expect(levelKey(2)).toBe("level2");
  });
});

describe("saved list", () => {
  it("the fingerprint travels in a link; a link without one still reads", () => {
    const withFp = decodeBasket(encodeBasket([item(1, { fp: "abc123" })]));
    expect(withFp?.[0].fp).toBe("abc123");
    const old = btoa(JSON.stringify([["t", 1, 5, {}, "old link"]])).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const read = decodeBasket(old);
    expect(read?.[0].seed).toBe(5);
    expect(read?.[0].fp).toBeUndefined();
  });
  it("a recipe's identity ignores the fingerprint", () => {
    expect(itemKey(item(1, { fp: "a" }))).toBe(itemKey(item(1, { fp: "b" })));
  });
});

const loaders = import.meta.glob("../tools/Algebra/CompletingTheSquare.tsx");
describe("round trip through a real tool", () => {
  it("a saved recipe rebuilds the question exactly, with the same fingerprint", async () => {
    const t = ((await Object.values(loaders)[0]()) as any).__test;
    const [tool, e] = Object.entries<any>(t.TOOL_CONFIG.tools)[0];
    const level = "level2" as const;
    const ds = e.difficultySettings?.[level] ?? {};
    const vars: Record<string, boolean> = {};
    (ds.variables ?? e.variables ?? []).forEach((v: any) => { vars[v.key] = v.defaultValue; });
    const dd = (ds.dropdown !== undefined ? ds.dropdown : e.dropdown)?.defaultValue ?? "";
    const ms: Record<string, boolean> = {};
    normalizeMultiSelect(ds.multiSelect ?? e.multiSelect).forEach((g: any) => g.options.forEach((o: any) => { ms[o.value] = o.defaultActive; }));
    const q = generateSeeded(() => t.generateQuestion(tool, level, vars, dd, ms));
    // what the shell saves ...
    const saved: BasketItem = { tab: tool, level: levelNumber(level), seed: extras(q)._seed as number, options: encodeToolOptions({ vars, ms, dd }), preview: "x", fp: questionFingerprint(q) };
    // ... survives a link and is rebuilt
    const [back] = decodeBasket(encodeBasket([saved]))!;
    const s = decodeToolOptions(back.options);
    const again = generateFromSeed(back.seed, () => t.generateQuestion(back.tab, levelKey(back.level), s.vars, s.dd, s.ms));
    expect(questionFingerprint(again)).toBe(back.fp);
  });
});
