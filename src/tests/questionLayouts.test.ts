import { describe, expect, it } from "vitest";
import { checkDeck } from "../../api/_decks";
import { isQuestionDisplaySettings } from "../../api/_questionDisplay";
import { ESTIMATION_DECK } from "../decks/estimation";
import { materializeDeck } from "../decks/questions";
import { generatorSlide } from "../decks/layouts";

describe("shared question layouts", () => {
  for (const presentation of ["full", "whiteboard", "whiteboard-inverted"] as const) it(`${presentation}: preserves a fixed set and a generator through portable saving`, async () => {
    const preset = structuredClone(ESTIMATION_DECK.slides.find((s) => s.id === "est-p-mult")!);
    const el = preset.els[0]; if (el.kind !== "questions") throw new Error();
    const items = JSON.stringify(el.items), brief = preset.brief;
    el.presentation = presentation; el.visualiser = false;
    const generated = generatorSlide("gen");
    const generator = generated.els[0]; if (generator.kind !== "generator") throw new Error();
    generator.presentation = presentation;
    // A saved custom position stays custom: display changes carry no geometry migration.
    el.x = 80; el.y = 50; el.w = 1400; el.h = 780;
    const deck = await materializeDeck({ ...ESTIMATION_DECK, slides: [preset, generated] }, () => undefined);
    const restored = JSON.parse(JSON.stringify(deck));
    expect("deck" in checkDeck(restored)).toBe(true);
    expect(restored.slides[0].els[0]).toMatchObject({ presentation, visualiser: false, x: 80, y: 50, w: 1400, h: 780 });
    expect(JSON.stringify(restored.slides[0].els[0].items)).toBe(items);
    expect(restored.slides[0].brief).toBe(brief);
    expect(restored.slides[1].els[0].presentation).toBe(presentation);
  });
  it("accepts old full-width and whiteboard settings but rejects malformed settings for both sources", () => {
    expect(isQuestionDisplaySettings({})).toBe(true);
    expect(isQuestionDisplaySettings({ presentation: "whiteboard" })).toBe(true);
    for (const kind of ["questions", "generator"]) for (const bad of [{ presentation: "other" }, { visualiser: "yes" }, { presentation: null }]) {
      const el = kind === "questions" ? ESTIMATION_DECK.slides.find((s) => s.id === "est-p-mult")!.els[0] : generatorSlide("g").els[0];
      expect("error" in checkDeck({ id: "test", title: "T", slides: [{ els: [{ ...el, ...bad }] }] })).toBe(true);
    }
  });
});
