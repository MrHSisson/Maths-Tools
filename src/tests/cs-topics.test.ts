// ─────────────────────────────────────────────────────────────────────────────
// CSTopic contract tests — the CS analog of generators.test.ts. Every CS tool that
// exports `__topic` (a CSTopic) is discovered and run through validateTopic, so
// authoring-as-data mistakes fail at CI: undeclared spec tags, out-of-range MCQ
// answers, cloze slots with no matching word, duplicate ids, unanswered predict
// beats, lessons with no backing scene, and mis-attributed synoptic marks.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { validateTopic } from "../shared/cs";
import type { CSTopic } from "../shared/cs";

// Discover every CS tool exporting a `__topic` CSTopic. Modules must import cleanly
// under node — a broken CS tool surfaces as an import failure below.
const moduleLoaders = import.meta.glob("../tools/ComputerScience/**/*.tsx");
const topics: [string, CSTopic][] = [];
const importFailures: [string, unknown][] = [];
for (const [path, load] of Object.entries(moduleLoaders)) {
  try {
    const mod = (await load()) as { __topic?: CSTopic };
    if (mod.__topic) topics.push([path, mod.__topic]);
  } catch (e) {
    importFailures.push([path, e]);
  }
}

describe("CS topic discovery", () => {
  it("imports every CS tool module", () => {
    const msgs = importFailures.map(([p, e]) => `${p}: ${(e as Error).message}`);
    expect(msgs).toEqual([]);
  });
  it("finds the CSTopic-backed tools (1.1.1 + 1.1.2 at least)", () => {
    expect(topics.length).toBeGreaterThanOrEqual(2);
  });
});

for (const [path, topic] of topics) {
  describe(`${path} — ${topic.id} ${topic.title}`, () => {
    it("is a well-formed CSTopic (validateTopic)", () => {
      expect(validateTopic(topic)).toEqual([]);
    });
  });
}
