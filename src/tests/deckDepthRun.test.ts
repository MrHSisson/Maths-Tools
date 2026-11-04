import { describe, it, expect } from "vitest";
import { checkDeckContent } from "../decks/deckChecks";
import type { DeckDef, Slide } from "../decks/types";

const slide = (id: string, family: Slide["family"]): Slide => ({ id, family, title: id, els: [] });
const deck = (families: Slide["family"][]): DeckDef => ({ id: "t", title: "T", summary: "", slides: families.map((f, i) => slide(`s${i}`, f)) });

describe("never three Depth slides in a row", () => {
  it("reports a run of three", async () => {
    const r = await checkDeckContent(deck(["structure", "depth", "depth", "depth", "practice"]));
    expect(r.problems.some((p) => p.includes("three Depth slides in a row"))).toBe(true);
  });
  it("allows two in a row, or three with something between", async () => {
    for (const f of [["depth", "depth", "practice", "depth"], ["depth", "depth", "practice", "depth", "depth"]] as Slide["family"][][]) {
      expect((await checkDeckContent(deck(f))).problems.some((p) => p.includes("Depth slides in a row"))).toBe(false);
    }
  });
});
