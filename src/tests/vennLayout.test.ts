import { describe, expect, it } from "vitest";
import { BOX_H, BOX_W, CIRCLE_R, CIRCLE_Y, LEFT_X, RIGHT_X, layoutCards, regionsOf, tileProblems } from "../decks/vennLayout";
import { stagedClicks } from "../decks/SlideCanvas";
import { checkDeckContent as checkDeck } from "../decks/deckChecks";
import { splitPrimes } from "../shared/venn";
import type { DeckDef, VennCard } from "../decks/types";

const tiles = (a: number, b: number, placed = true): VennCard[] => {
  const r = splitPrimes(a, b);
  const mk = (xs: number[], region: "left" | "middle" | "right"): VennCard[] => xs.map((n) => ({ text: String(n), tile: true, ...(placed ? { region } : {}) }));
  return [...mk(r.left, "left"), ...mk(r.middle, "middle"), ...mk(r.right, "right")];
};
const inCircle = (x: number, y: number, cx: number) => Math.hypot(x - cx, y - CIRCLE_Y) <= CIRCLE_R;
const corners = (p: { x: number; y: number; w: number; h: number }) => [[p.x - p.w / 2, p.y - p.h / 2], [p.x + p.w / 2, p.y - p.h / 2], [p.x - p.w / 2, p.y + p.h / 2], [p.x + p.w / 2, p.y + p.h / 2]];
const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

describe("Venn card layout", () => {
  it("puts placed tiles wholly inside their part of the diagram", () => {
    for (const [a, b] of [[12, 18], [10, 15], [8, 12], [9, 18], [8, 15], [36, 60]]) {
      const cards = tiles(a, b), at = layoutCards(cards);
      cards.forEach((c, i) => corners(at[i]).forEach(([x, y]) => {
        const l = inCircle(x, y, LEFT_X), r = inCircle(x, y, RIGHT_X);
        expect([c.region, l, r], `${a} & ${b}: ${c.text} corner`).toEqual([c.region, c.region !== "right", c.region !== "left"]);
      }));
    }
  });
  it("never overlaps two cards and keeps scattered cards in the box and out of the circles", () => {
    const words = ["Triangle", "Square", "Circle", "Hexagon", "Pentagon", "Kite", "Rhombus", "Oval"].map((text) => ({ text }));
    for (const cards of [words, tiles(12, 18, false), [{ text: "12" }, { text: "18" }, { text: "30" }, { text: "45" }]]) {
      const at = layoutCards(cards);
      at.forEach((p, i) => {
        corners(p).forEach(([x, y]) => { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(BOX_W); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(BOX_H); });
        for (let j = i + 1; j < at.length; j++) expect(overlap(p, at[j]), `${cards[i].text} and ${cards[j].text}`).toBe(false);
      });
    }
  });
  it("scales the cards", () => { expect(layoutCards([{ text: "2", tile: true }], 2)[0].w).toBe(128); });
});

describe("Venn tiles", () => {
  it("reads the regions only from placed prime tiles", () => {
    expect(regionsOf(tiles(12, 18))).toEqual({ left: [2], middle: [2, 3], right: [3] });
    expect(regionsOf(tiles(12, 18, false))).toBeNull();
    expect(regionsOf([{ text: "12", region: "left" }])).toBeNull();
  });
  it("accepts a right Venn and names a wrong one", () => {
    expect(tileProblems(tiles(12, 18))).toEqual([]);
    expect(tileProblems(tiles(8, 15))).toEqual([]);
    expect(tileProblems([{ text: "2", tile: true, region: "left" }, { text: "2", tile: true, region: "right" }])).toHaveLength(1);   // a shared prime written on both sides
  });
});

describe("Venn clicks and checks", () => {
  const el = (over: object) => ({ id: "v", kind: "venn", x: 0, y: 0, w: 900, h: 612, left: "A", right: "B", cards: tiles(12, 18), ...over }) as never;
  it("counts one click per card when staged, then each answer line", () => {
    expect(stagedClicks(el({}))).toBe(0);
    expect(stagedClicks(el({ staged: true }))).toBe(4);
    expect(stagedClicks(el({ staged: true, lines: ["hcf", "lcm"] }))).toBe(6);
    expect(stagedClicks(el({ lines: ["hcf"] }))).toBe(1);
  });
  const deck = (e: unknown): DeckDef => ({ id: "t", title: "t", summary: "", slides: [{ id: "s", family: "teach", title: "t", els: [e] }] } as never);
  it("fails a Venn whose tiles are in the wrong place, and warns when a line has nothing to multiply", async () => {
    const bad = await checkDeck(deck(el({ cards: [{ text: "2", tile: true, region: "left" }, { text: "2", tile: true, region: "right" }] })));
    expect(bad.problems.join("\n")).toMatch(/share|where the prime factors/);
    const warn = await checkDeck(deck(el({ cards: tiles(12, 18, false), lines: ["hcf"] })));
    expect(warn.problems).toEqual([]);
    expect(warn.warnings.join("\n")).toMatch(/needs every card/);
    expect((await checkDeck(deck(el({ lines: ["hcf", "lcm"], staged: true })))).problems).toEqual([]);
  });
});
