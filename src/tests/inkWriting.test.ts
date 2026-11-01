import { describe, expect, it } from "vitest";
import { strokeTouches } from "../decks/inkMath";
import { inkPath, inkPoints } from "../decks/InkLayer";
import { mergeDecks } from "../../api/_deckMerge";
import { getInk, setInk, strokesFromSlide, strokesToSlide } from "../shared/inkBridge";
import type { InkStroke } from "../decks/types";

const line: InkStroke = { c: "#dc2626", w: 9, p: [100, 100, 300, 100] };

describe("writing on a slide", () => {
  it("the eraser touches a line it passes near, thickness included, and not one far away", () => {
    expect(strokeTouches(line, 200, 110, 22)).toBe(true);        // 10 above the line
    expect(strokeTouches(line, 200, 126, 22)).toBe(true);        // just inside the reach: 22 plus half the thickness, 26.5
    expect(strokeTouches(line, 200, 127, 22)).toBe(false);
    expect(strokeTouches(line, 500, 100, 22)).toBe(false);       // past the end
    expect(strokeTouches({ c: "#000", w: 6, p: [50, 50] }, 55, 50, 22)).toBe(true);   // a dot
  });

  it("a stroke is a list of points and draws as a path; a tap draws as a dot", () => {
    expect(inkPoints(line)).toEqual([{ x: 100, y: 100 }, { x: 300, y: 100 }]);
    expect(inkPath(line)).toMatch(/^M 100 100/);
    expect(inkPath({ c: "#000", w: 6, p: [10, 20] })).toMatch(/^M 10 20 L 10.1 20/);
  });

  it("writing converts to slide units and back without moving", () => {
    const frame = { left: 120, top: 80, width: 800 };               // a slide shown 800 px wide at (120, 80): 1600 units, so 2 units per px
    const screen = [{ color: "#dc2626", width: 4, points: [{ x: 120, y: 80 }, { x: 520, y: 380 }] }];
    const onSlide = strokesToSlide(screen, frame, 1600);
    expect(onSlide[0].points).toEqual([{ x: 0, y: 0 }, { x: 800, y: 600 }]);
    expect(onSlide[0].width).toBe(8);
    const bigger = { left: 0, top: 0, width: 1600 };                // later shown at full size
    expect(strokesFromSlide(onSlide, bigger, 1600)[0].points[1]).toEqual({ x: 800, y: 600 });
    expect(strokesFromSlide(strokesToSlide(screen, frame, 1600), frame, 1600)).toEqual(screen);
  });

  it("the pen layer is read and replaced through the bridge", () => {
    const seen: unknown[] = [];
    const w = globalThis as unknown as { window: unknown; CustomEvent: unknown };
    let held: unknown[] = [];
    w.window = {
      dispatchEvent: (e: { type: string; detail: { strokes?: unknown[] } | unknown[] }) => {
        if (e.type === "mt-ink-get") (e.detail as { strokes: unknown[] }).strokes = held;
        if (e.type === "mt-ink-set") { held = e.detail as unknown[]; seen.push(held); }
        return true;
      },
    };
    w.CustomEvent = class { type: string; detail: unknown; constructor(type: string, init: { detail: unknown }) { this.type = type; this.detail = init.detail; } };
    expect(getInk()).toEqual([]);
    setInk([{ color: "#000", points: [{ x: 1, y: 2 }] }]);
    expect(getInk()).toHaveLength(1);
    expect(seen).toHaveLength(1);
  });

  it("writing merges like any other element: Harry's writing and Claude's text change are both kept", () => {
    const slide = (extra: object[] = []) => ({ id: "s", family: "teach", title: "S", els: [{ id: "t", kind: "text", x: 0, y: 0, w: 10, h: 10, text: "a", size: 40 }, ...extra] });
    const base = { id: "d", title: "D", summary: "", slides: [slide()] };
    const harry = { ...base, slides: [slide([{ id: "s-ink", kind: "ink", x: 0, y: 0, w: 1600, h: 900, strokes: [line] }])] };
    const claude = { ...base, slides: [{ ...slide(), els: [{ ...slide().els[0], text: "changed" }] }] };
    const r = mergeDecks(base, claude, harry, "current").deck as { slides: { els: { id: string; text?: string; strokes?: unknown[] }[] }[] };
    expect(r.slides[0].els.find((e) => e.id === "t")?.text).toBe("changed");
    expect(r.slides[0].els.find((e) => e.id === "s-ink")?.strokes).toHaveLength(1);
  });
});
