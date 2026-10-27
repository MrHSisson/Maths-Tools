import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../decks/cloud", () => ({ fetchIndex: vi.fn(), fetchDeck: vi.fn(), pushDeck: vi.fn(), pushQuestion: vi.fn(), pushRemoveDeck: vi.fn(), pushRemoveQuestion: vi.fn() }));
import { fetchIndex, pushQuestion } from "../decks/cloud";
import { bankQuestion, loadDeck, saveDeck, saveQuestion, syncFromCloud } from "../decks/store";
import { newQuestion } from "../decks/questions";
import type { CuratedQuestion, DeckDef } from "../decks/types";
const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear(); vi.clearAllMocks();
  vi.stubGlobal("localStorage", { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v), removeItem: (k: string) => memory.delete(k) });
});
describe("question copy persistence", () => {
  it("library sync cannot rewrite a deck's embedded question", async () => {
    const q = { ...newQuestion(), id: "q-copy", title: "Deck version", question: ["Original deck content"] };
    const d: DeckDef = { id: "my-test", title: "T", summary: "", slides: [{ id: "s", title: "S", family: "practice", els: [{ id: "e", kind: "questions", x: 0, y: 0, w: 100, h: 100, items: [q] }] }] };
    saveDeck(d, false);
    vi.mocked(fetchIndex).mockResolvedValue({ index: {}, questions: { [q.id]: { ...q, title: "Cloud library version", question: ["Different content"] } } });
    await syncFromCloud();
    const el = loadDeck(d.id)!.slides[0].els[0];
    expect(el.kind === "questions" && el.items[0].title).toBe("Deck version");
    expect((bankQuestion(q.id) as CuratedQuestion).title).toBe("Cloud library version");
  });
  it("retains an unsent local library copy on reconnect", async () => {
    const q = { ...newQuestion(), id: "q-offline", title: "Local draft" };
    expect(saveQuestion(q)).toBe(true);
    vi.mocked(fetchIndex).mockResolvedValue({ index: {}, questions: { [q.id]: { ...q, title: "Older cloud draft" } } });
    await syncFromCloud();
    expect((bankQuestion(q.id) as CuratedQuestion).title).toBe("Local draft");
  });
  it("does not announce a cloud save when local library storage fails", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => { throw new Error("quota"); } });
    expect(saveQuestion(newQuestion())).toBe(false);
    expect(pushQuestion).not.toHaveBeenCalled();
  });
});
