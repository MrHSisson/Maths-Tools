// The deck list's column sorting (src/decks/folders.ts): by name, band, slides, made and edited, either way round.
import { describe, expect, it } from "vitest";
import { FIRST_DIR, sortDecks, type FolderDeck } from "../decks/folders";

const d = (id: string, title: string, over: Partial<FolderDeck> = {}): FolderDeck => ({ id, title, summary: "", slides: 10, madeAt: "2026-11-01T00:00:00Z", editedAt: "2026-11-01T00:00:00Z", published: false, ...over });
const ids = (xs: FolderDeck[]) => xs.map((x) => x.id);

describe("sortDecks", () => {
  const decks = [
    d("a", "Fractions", { pitch: "lower", slides: 12, madeAt: "2026-11-03T00:00:00Z", editedAt: "2026-11-20T00:00:00Z" }),
    d("b", "algebra 10", { pitch: "upper", slides: 30, madeAt: "2026-11-01T00:00:00Z", editedAt: "2026-11-05T00:00:00Z" }),
    d("c", "Algebra 2", { slides: 5, madeAt: "2026-11-09T00:00:00Z", editedAt: "2026-11-10T00:00:00Z" }),
    d("e", "Ratio", { pitch: "middle", slides: 20, madeAt: "2026-11-06T00:00:00Z", editedAt: "2026-11-12T00:00:00Z" }),
  ];
  it("sorts by name ignoring case and reading numbers as numbers", () => {
    expect(ids(sortDecks(decks, "name", "asc"))).toEqual(["c", "b", "a", "e"]);
    expect(ids(sortDecks(decks, "name", "desc"))).toEqual(["e", "a", "b", "c"]);
  });
  it("sorts by band upper to lower, with no band always last", () => {
    expect(ids(sortDecks(decks, "band", "asc"))).toEqual(["b", "e", "a", "c"]);
    expect(ids(sortDecks(decks, "band", "desc"))).toEqual(["a", "e", "b", "c"]);
  });
  it("sorts by slides, made and edited", () => {
    expect(ids(sortDecks(decks, "slides", "desc"))).toEqual(["b", "e", "a", "c"]);
    expect(ids(sortDecks(decks, "made", "desc"))).toEqual(["c", "e", "a", "b"]);
    expect(ids(sortDecks(decks, "made", "asc"))).toEqual(["b", "a", "e", "c"]);
    expect(ids(sortDecks(decks, "edited", "desc"))).toEqual(["a", "e", "c", "b"]);
  });
  it("does not change the list it is given, and ties go to the most recently made", () => {
    const before = ids(decks);
    sortDecks(decks, "name", "asc");
    expect(ids(decks)).toEqual(before);
    expect(ids(sortDecks([d("x", "Same", { madeAt: "2026-11-01T00:00:00Z" }), d("y", "Same", { madeAt: "2026-11-09T00:00:00Z" })], "name", "asc"))).toEqual(["y", "x"]);
  });
  it("a column's first click starts newest, biggest or A to Z", () => {
    expect(FIRST_DIR).toEqual({ name: "asc", band: "asc", slides: "desc", made: "desc", edited: "desc" });
  });
});
