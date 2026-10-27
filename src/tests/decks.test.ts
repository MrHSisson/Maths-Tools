// Decks — every deck and hand-picked bank must be well-formed (src/decks, docs/reference/decks.md).
import { describe, it, expect } from "vitest";
import katex from "katex";
import { BANK, DECKS, bankById, decksForPath } from "../decks";
import { MISCONCEPTIONS } from "../shared/misconceptions";
import { loadGenerator } from "../decks/generators";
import { slideTitle } from "../decks/types";

const renders = (latex: string) => { katex.renderToString(latex, { throwOnError: true }); };
const texOf = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
const strings = (o: unknown): string[] => typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(strings) : o && typeof o === "object" ? Object.values(o).flatMap(strings) : [];

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

describe("decks", () => {
  it("has unique ids and a tool path", () => { expect(new Set(DECKS.map((d) => d.id)).size).toBe(DECKS.length); });
  for (const d of DECKS) {
    describe(d.id, () => {
      it("is listed under its tool's path", () => { expect(decksForPath(d.toolPath)).toContain(d); });
      it("every slide has a title and its $...$ renders", () => {
        for (const s of d.slides) { expect(slideTitle(s)).toBeTruthy(); strings(s).flatMap(texOf).forEach(renders); }
      });
      it("board grids are rectangular", () => {
        for (const s of d.slides) if (s.type === "board") for (const r of s.grid.rows) expect(r.length).toBe(s.grid.head.length);
      });
      for (const [i, s] of d.slides.entries()) {
        if (s.type !== "practice") continue;
        it(`slide ${i + 1} (practice): intention is a known misconception, bank questions exist and are written against it`, async () => {
          expect(MISCONCEPTIONS[s.intention], s.intention).toBeTruthy();
          expect(s.bank.length).toBeGreaterThan(0);
          for (const id of s.bank) { const b = bankById(id); expect(b, id).toBeTruthy(); expect(b!.tag).toBe(s.intention); expect(b!.tool).toBe(d.tool); if (s.generator) expect(b!.level).toBe(s.generator.level); }
          if (s.generator) {
            const gen = await loadGenerator(d.tool);
            expect(gen).toBeTruthy();
            for (let k = 0; k < 20; k++) { const q = gen!(d.tool, s.generator.level, s.generator.variables ?? {}, s.generator.dropdown ?? "", s.generator.multiSelect ?? {}); expect(q.difficulty).toBe(s.generator.level); }
          }
        });
      }
    });
  }
});
