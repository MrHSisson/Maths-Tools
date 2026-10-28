import { describe, expect, it } from "vitest";
import { checkDeck } from "../../api/_decks";
import { LAYOUTS, whiteboardSlide } from "../decks/layouts";
import { materializeDeck } from "../decks/questions";
import type { DeckDef } from "../decks/types";

describe("Whiteboard generator slides", () => {
  it("offers a separate whiteboard layout backed by the same generator preset", () => {
    const slide = LAYOUTS.find((l) => l.key === "whiteboard")!.make("w");
    expect(slide.els[0]).toMatchObject({ kind: "generator", presentation: "whiteboard", visualiser: true, seed: 1 });
    const normal = LAYOUTS.find((l) => l.key === "generator")!.make("g");
    expect(normal.els[0]).not.toHaveProperty("presentation");
  });
  it("preserves the setup and optional camera through portable export/import without serializing runtime camera state", async () => {
    const slide = whiteboardSlide("board", "estimation", { sub: "estimation", level: "level2", multiSelect: { divide: true } }, "Model decimal division", 42);
    const el = slide.els[0];
    if (el.kind !== "generator") throw new Error();
    el.visualiser = false;
    const deck: DeckDef = { id: "board", title: "Board", summary: "", slides: [slide] };
    const portable = await materializeDeck(JSON.parse(JSON.stringify(deck)), () => undefined);
    expect(portable).toMatchObject(deck);
    expect("deck" in checkDeck(portable)).toBe(true);
    expect(JSON.stringify(portable)).not.toMatch(/srcObject|deviceId|MediaStream|presenterMode/);
    expect(portable.slides[0].els[0]).toMatchObject({ preset: el.preset, seed: 42, visualiser: false });
  });
  it("rejects invalid layout flags while retaining old generator payloads", () => {
    const slide = whiteboardSlide("w");
    const check = (patch: object) => checkDeck({ id: "d", title: "D", slides: [{ ...slide, els: [{ ...slide.els[0], ...patch }] }] });
    expect("error" in check({ presentation: "unknown" })).toBe(true);
    expect("error" in check({ visualiser: "yes" })).toBe(true);
    expect("deck" in check({ presentation: undefined, visualiser: undefined })).toBe(true);
  });
});
