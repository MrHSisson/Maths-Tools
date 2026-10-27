// Decks — every built deck, layout and hand-picked bank must be well-formed (src/decks, docs/reference/decks.md).
import { describe, it, expect } from "vitest";
import katex from "katex";
import { BANK, DECKS, decksForPath } from "../decks";
import { LAYOUTS } from "../decks/layouts";
import { MISCONCEPTIONS } from "../shared/misconceptions";
import { loadGenerator } from "../decks/generators";
import { CANVAS_H, CANVAS_W, MIN_TEXT, type DeckElement, type Slide } from "../decks/types";

const renders = (latex: string) => { katex.renderToString(latex, { throwOnError: true }); };
const texOf = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
const bankById = (id: string) => BANK.find((b) => b.id === id);

/** Checks every slide must pass, built deck or library sample. */
function checkSlide(s: Slide) {
  expect(s.title, s.id).toBeTruthy();
  expect(new Set(s.els.map((e) => e.id)).size, `${s.id}: element ids`).toBe(s.els.length);
  for (const e of s.els) {
    const x2 = e.x + Math.max(0, e.w), y2 = e.y + Math.max(0, e.h);
    expect(Math.min(e.x, e.x + e.w) >= 0 && Math.min(e.y, e.y + e.h) >= 0 && x2 <= CANVAS_W && y2 <= CANVAS_H, `${e.id} sits on the canvas`).toBe(true);
    if (e.kind === "text") { expect(e.size, `${e.id}: text size`).toBeGreaterThanOrEqual(MIN_TEXT); texOf(e.text).forEach(renders); }
    if (e.kind === "board") {
      for (const r of e.grid.rows) expect(r.length, `${e.id}: board rows`).toBe(e.grid.head.length);
      [...e.grid.head, ...e.grid.rows.flat()].flatMap(texOf).forEach(renders);
    }
    if (e.kind === "practice") texOf(e.prompt ?? "").forEach(renders);
  }
}
const practices = (s: Slide) => s.els.filter((e): e is Extract<DeckElement, { kind: "practice" }> => e.kind === "practice");

describe("hand-picked bank", () => {
  it("has unique ids", () => { expect(new Set(BANK.map((b) => b.id)).size).toBe(BANK.length); });
  for (const b of BANK) {
    it(`${b.id}: tag exists, KaTeX renders, working ends on the answer`, () => {
      expect(MISCONCEPTIONS[b.tag], b.tag).toBeTruthy();
      [b.latex, b.answer, ...b.working.map((w) => w.latex)].forEach(renders);
      expect(b.working.length).toBeGreaterThan(0);
      expect(b.working[b.working.length - 1].latex.endsWith(`= ${b.answer}`), "last step should end on the answer").toBe(true);
    });
  }
});

describe("misconceptions", () => {
  for (const [id, m] of Object.entries(MISCONCEPTIONS)) {
    it(`${id}: ids are <tool>-<slug>; examples render`, () => {
      expect(id).toMatch(/^[a-z]+-[a-z-]+$/);
      texOf(m.example ?? "").forEach(renders);
    });
  }
});

describe("layouts", () => {
  for (const l of LAYOUTS) it(`${l.key} makes a well-formed slide`, () => { const s = l.make("sample"); checkSlide(s); expect(s.family).toBe(l.family); });
});

describe("built decks", () => {
  it("have unique ids, none of them a page name", () => {
    expect(new Set(DECKS.map((d) => d.id)).size).toBe(DECKS.length);
    for (const d of DECKS) expect(["library"].includes(d.id)).toBe(false);
  });
  for (const d of DECKS) {
    describe(d.id, () => {
      it("is listed under its tool's path", () => { if (d.toolPath) expect(decksForPath(d.toolPath)).toContain(d); });
      it("has unique slide ids and well-formed slides", () => {
        expect(new Set(d.slides.map((s) => s.id)).size).toBe(d.slides.length);
        d.slides.forEach(checkSlide);
      });
      for (const s of d.slides) for (const p of practices(s)) {
        it(`${s.id} (practice): intention is a known misconception, questions exist and are written against it, the generator runs`, async () => {
          expect(MISCONCEPTIONS[p.intention], p.intention).toBeTruthy();
          expect(p.bank.length).toBeGreaterThan(0);
          for (const id of p.bank) { const b = bankById(id); expect(b, id).toBeTruthy(); expect(b!.tag).toBe(p.intention); expect(b!.tool).toBe(p.tool); if (p.generator) expect(b!.level).toBe(p.generator.level); }
          if (p.generator) {
            const gen = await loadGenerator(p.tool);
            expect(gen).toBeTruthy();
            for (let k = 0; k < 20; k++) { const q = gen!(p.tool, p.generator.level, p.generator.variables ?? {}, p.generator.dropdown ?? "", p.generator.multiSelect ?? {}); expect(q.difficulty).toBe(p.generator.level); }
          }
        });
      }
    });
  }
});
