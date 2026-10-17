import { describe, expect, it } from "vitest";
import { MAX_KEPT, pushHistory, togglePin, type KeptQuestion } from "../shared/questionKeeper";

const q = (id: string): KeptQuestion<number> => ({ id, label: id, state: 0 });

describe("question keeper lists", () => {
  it("history is newest first, has no repeats, never holds the current question, and keeps at most MAX_KEPT", () => {
    let h: KeptQuestion<number>[] = [];
    h = pushHistory(h, q("a"), "b");
    h = pushHistory(h, q("b"), "c");
    h = pushHistory(h, q("a"), "d"); // seen again: moves to the top, not duplicated
    expect(h.map((x) => x.id)).toEqual(["a", "b"]);
    for (const id of ["c", "d", "e", "f", "g", "h"]) h = pushHistory(h, q(id), "z");
    expect(h.length).toBe(MAX_KEPT);
    expect(h[0].id).toBe("h");
    h = pushHistory(h, q("y"), "h"); // the question now on screen is dropped from the list
    expect(h.some((x) => x.id === "h")).toBe(false);
  });
  it("pins toggle, and stop at MAX_KEPT", () => {
    let p: KeptQuestion<number>[] = [];
    p = togglePin(p, q("a"));
    expect(p.map((x) => x.id)).toEqual(["a"]);
    p = togglePin(p, q("a"));
    expect(p).toEqual([]);
    for (let i = 0; i < MAX_KEPT + 2; i++) p = togglePin(p, q(`p${i}`));
    expect(p.length).toBe(MAX_KEPT);
    expect(togglePin(p, q("p0")).length).toBe(MAX_KEPT - 1); // unpinning is always allowed
  });
});
