// Regression test for the differentiated-worksheet bug in Collecting Like
// Terms: a level nobody has opened the differentiated QO popover for stores
// `{}` in ToolShell's per-level multiSelect state. Feeding that raw `{}`
// straight into pickActive() (which treats "not === false" as active) meant
// EVERY option counted as active — including "Subtraction" and "Crossing
// zero" — even when the tool's own config marks them `defaultActive: false`
// and only "Positive terms only" is meant to be on. resolveMultiSelectValues
// (shared/helpers.ts) is what ToolShell now uses to fill in each option's own
// default before layering explicit overrides on top.

import { describe, it, expect } from "vitest";
import { resolveMultiSelectValues, pickActive } from "../shared";

const SUBTRACTION_GROUP = {
  key: "subtractionCases",
  options: [
    { value: "positiveOnly", label: "Positive terms only", defaultActive: true },
    { value: "subtractionPositive", label: "Subtraction (stays positive)", defaultActive: false },
    { value: "crossingZero", label: "Crossing zero", defaultActive: false },
  ],
};

describe("resolveMultiSelectValues", () => {
  it("an untouched level (empty overrides) resolves to just the configured defaults", () => {
    const resolved = resolveMultiSelectValues([SUBTRACTION_GROUP], {});
    expect(resolved).toEqual({ positiveOnly: true, subtractionPositive: false, crossingZero: false });
  });

  it("pickActive on the resolved values always picks positiveOnly when only it defaults on", () => {
    const resolved = resolveMultiSelectValues([SUBTRACTION_GROUP], {});
    for (let i = 0; i < 100; i++) {
      expect(pickActive(resolved, SUBTRACTION_GROUP.options)).toBe("positiveOnly");
    }
  });

  it("feeding raw {} straight into pickActive (the old, buggy path) wrongly treats every option as active", () => {
    // This documents the bug this fix eliminates: without resolving defaults
    // first, an untouched level's {} makes pickActive see every option
    // (including "Crossing zero") as fair game.
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickActive({}, SUBTRACTION_GROUP.options));
    expect(seen.has("crossingZero")).toBe(true);
  });

  it("an explicit override for one option is layered on top of the other defaults", () => {
    const resolved = resolveMultiSelectValues([SUBTRACTION_GROUP], { crossingZero: true });
    expect(resolved).toEqual({ positiveOnly: true, subtractionPositive: false, crossingZero: true });
  });
});
