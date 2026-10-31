import { describe, expect, it } from "vitest";
import { applyLayout } from "../decks/relayout";
import { LAYOUTS, discussionSlide } from "../decks/layouts";
import type { DeckElement, Slide } from "../decks/types";

const text = (s: Slide) => s.els.filter((e): e is Extract<DeckElement, { kind: "text" }> => e.kind === "text").map((e) => e.text);

describe("changing a slide's layout keeps its content", () => {
  it("moves the texts, the maths and nothing is lost", () => {
    const old = discussionSlide("s1", "My prompt?", "My key point", "My question", "7");
    const to = LAYOUTS.find((l) => l.key === "two-column")!.make("s1");
    const out = applyLayout(old, to);
    const all = text(out).join("|");
    for (const t of ["My prompt?", "My key point", "My question"]) expect(all).toContain(t);   // every text is still on the slide
    expect(out.id).toBe("s1"); expect(out.family).toBe(to.family); expect(out.title).toBe(old.title);
    expect(new Set(out.els.map((e) => e.id)).size).toBe(out.els.length);                         // ids stay unique
  });
  it("carries a generator's setup into another generator layout", () => {
    const gen = LAYOUTS.find((l) => l.key === "generator")!.make("s2");
    const el = gen.els.find((e) => e.kind === "generator")!;
    const old: Slide = { ...gen, els: gen.els.map((e) => (e === el ? ({ ...e, tool: "rounding", seed: 9 } as DeckElement) : e)) };
    const out = applyLayout(old, LAYOUTS.find((l) => l.key === "generator")!.make("s2"));
    expect(out.els.find((e) => e.kind === "generator")).toMatchObject({ tool: "rounding", seed: 9 });
  });
});
