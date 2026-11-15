import { describe, it, expect } from "vitest";
import { clickerAction } from "../decks/clickerKeys";

describe("clicker keys", () => {
  it("the usual clicker buttons move the deck", () => {
    for (const key of ["PageDown", "ArrowRight", "ArrowDown", "Enter", " ", "MediaTrackNext"]) expect(clickerAction({ key })).toBe("next");
    for (const key of ["PageUp", "ArrowLeft", "ArrowUp", "MediaTrackPrevious"]) expect(clickerAction({ key })).toBe("back");
  });
  it("a clicker that reports no key name is read by code or keyCode", () => {
    expect(clickerAction({ key: "Unidentified", keyCode: 34 })).toBe("next");
    expect(clickerAction({ key: "", keyCode: 33 })).toBe("back");
    expect(clickerAction({ key: "x", code: "PageDown" })).toBe("next");
  });
  it("blank, start and ends", () => {
    expect(clickerAction({ key: "." })).toBe("blank");
    expect(clickerAction({ key: "F5" })).toBe("full");
    expect(clickerAction({ key: "Home" })).toBe("first");
    expect(clickerAction({ key: "End" })).toBe("last");
  });
  it("shortcuts with a modifier are left alone", () => {
    expect(clickerAction({ key: "ArrowRight", ctrlKey: true })).toBeNull();
    expect(clickerAction({ key: "j" })).toBeNull();
  });
});
