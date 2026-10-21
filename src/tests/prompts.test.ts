// Prompt hoisting: a worksheet whose questions all share one prompt line says it once.
import { describe, it, expect } from "vitest";
import { promptOf, commonPrompt, withoutPrompt, type AnyQuestion } from "../shared";

const worded = (...lines: string[]) => ({ kind: "worded", lines, answer: "", working: [], key: lines.join("|"), difficulty: "level1" }) as unknown as AnyQuestion;
const simple = { kind: "simple", display: "1", answer: "1", working: [], key: "s", difficulty: "level1" } as unknown as AnyQuestion;

describe("prompt hoisting", () => {
  it("a prompt is a maths-free first line above a line that is only maths", () => {
    expect(promptOf(worded("Simplify:", "$x^3$"))).toBe("Simplify:");
    expect(promptOf(worded("A bag weighs $3$ kg.", "$x$"))).toBeNull();      // maths in the first line: prose, not a prompt
    expect(promptOf(worded("Find the value", "of $x$ here"))).toBeNull();     // last line is not only maths
    expect(promptOf(worded("one line only"))).toBeNull();
    expect(promptOf(simple)).toBeNull();
  });
  it("is common only when every question has the same prompt", () => {
    const a = worded("Simplify:", "$a^2$"), b = worded("Simplify:", "$b^3$"), c = worded("Work out:", "$2^3$");
    expect(commonPrompt([a, b])).toBe("Simplify:");
    expect(commonPrompt([a, b, c])).toBeNull();
    expect(commonPrompt([a, simple])).toBeNull();
    expect(commonPrompt([a])).toBeNull();
  });
  it("withoutPrompt leaves just the maths line, and other questions untouched", () => {
    const a = worded("Simplify:", "$a^2$");
    expect((withoutPrompt(a) as unknown as { lines: string[] }).lines).toEqual(["$a^2$"]);
    expect(withoutPrompt(simple)).toBe(simple);
  });
});
