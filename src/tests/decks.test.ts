// Decks — every built deck, layout and hand-picked bank must be well-formed (src/decks, docs/reference/decks.md).
import { describe, it, expect } from "vitest";
import katex from "katex";
import { BANK, DECKS, decksForPath } from "../decks";
import { LAYOUTS } from "../decks/layouts";
import { MISCONCEPTIONS } from "../shared/misconceptions";
import { GENERATOR_TOOLS, generateFrom, generateSet, loadConfig, loadDepthItems, loadGenerator } from "../decks/generators";
import { readyProblems } from "../decks/questions";
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
    if (e.kind === "maths") { expect(e.size, `${e.id}: maths size`).toBeGreaterThanOrEqual(MIN_TEXT); renders(e.latex); }
    if (e.kind === "board") {
      for (const r of e.grid.rows) expect(r.length, `${e.id}: board rows`).toBe(e.grid.head.length);
      [...e.grid.head, ...e.grid.rows.flat()].flatMap(texOf).forEach(renders);
    }
    if (e.kind === "practice") texOf(e.prompt ?? "").forEach(renders);
    if (e.kind === "grid") { expect(e.cols).toBeGreaterThan(0); for (const id of e.bank) expect(bankById(id), `${e.id}: ${id}`).toBeTruthy(); }
    if (e.step !== undefined) expect(Number.isInteger(e.step) && e.step >= 0, `${e.id}: step`).toBe(true);
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

describe("generators wired into decks", () => {
  it("lists the question tools", () => { expect(GENERATOR_TOOLS.length).toBeGreaterThan(20); expect(GENERATOR_TOOLS.some(([id]) => id === "estimation")).toBe(true); });
  for (const [id] of GENERATOR_TOOLS) {
    it(`${id}: loads through the registry and asks a question on every tab and level`, async () => {
      const cfg = await loadConfig(id);
      expect(cfg, id).toBeTruthy();
      for (const [sub, t] of Object.entries(cfg!.tools)) for (const level of (t.levels ?? ["level1", "level2", "level3"]) as ("level1" | "level2" | "level3")[]) {
        const q = await generateFrom(id, { sub, level });
        expect(q?.key, `${id} ${sub} ${level}`).toBeTruthy();
      }
    });
  }
  it("a seed gives the same question every time, and a set has no repeats", async () => {
    const a = await generateFrom("estimation", { level: "level2" }, 42), b = await generateFrom("estimation", { level: "level2" }, 42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const set = await generateSet("estimation", { level: "level1" }, 8, 7);
    expect(new Set(set.map((q) => q.key)).size).toBe(8);
  });
});

describe("layouts", () => {
  it("the practice starter also supplies five distinct questions", () => {
    const slide = LAYOUTS.find((l) => l.key === "practice")!.make("starter");
    const el = practices(slide)[0];
    expect(el.bank.length).toBeGreaterThanOrEqual(5);
    expect(new Set(el.bank.map((id) => bankById(id)?.latex)).size).toBe(el.bank.length);
  });
  for (const l of LAYOUTS) it(`${l.key} makes a well-formed slide`, async () => {
    const s = l.make("sample"); checkSlide(s); expect(s.family).toBe(l.family);
    for (const e of s.els) if (e.kind === "depth") expect((await loadDepthItems(e.tool)).some((i) => i.id === e.item)).toBe(true);
  });
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
      it("every Depth element names an item in its tool's Depth bank", async () => {
        for (const s of d.slides) for (const e of s.els) if (e.kind === "depth") {
          const items = await loadDepthItems(e.tool);
          expect(items.some((i) => i.id === e.item), `${s.id}: ${e.tool} / ${e.item}`).toBe(true);
        }
      });
      it("Depth checks ask something new: no number from the deck's questions, boards or slide text", async () => {
        // numbers with two or more significant figures (single figures like 5, 30, 0.4 are everywhere and prove nothing)
        const nums = (t: string) => (t.match(/\d+(?:\.\d+)?/g) ?? []).filter((n) => n.replace(".", "").replace(/^0+/, "").replace(/0+$/, "").length >= 2);
        const used = new Set<string>();
        for (const s of d.slides) for (const e of s.els) {
          if (e.kind === "practice" || e.kind === "grid") for (const id of e.bank) nums(bankById(id)?.latex ?? "").forEach((n) => used.add(n));
          if (e.kind === "board") { const g = e.grid.given ?? 1; [...e.grid.head, ...e.grid.rows.flatMap((r) => r.slice(0, g))].forEach((c) => nums(c).forEach((n) => used.add(n))); }
          if (e.kind === "text") texOf(e.text).forEach((t) => nums(t).forEach((n) => used.add(n)));
        }
        for (const s of d.slides) for (const e of s.els) if (e.kind === "depth") {
          const item = (await loadDepthItems(e.tool)).find((i) => i.id === e.item)!;
          const asked = [...item.question, ...(item.speakers ?? []).flatMap((sp) => sp.says), item.working?.intro ?? "", ...(item.working?.lines ?? []), ...(item.options ?? []).map((o) => o.text)];
          const clash = [...new Set(asked.flatMap(nums))].filter((n) => used.has(n));
          expect(clash, `${s.id} (${item.id}) reuses numbers the deck already asks about`).toEqual([]);
        }
      });
      it("R42: embedded misconception-practice sequences have five distinct, complete questions with one focus and level", () => {
        for (const s of d.slides) for (const e of s.els) if (e.kind === "questions") {
          const practice = e.items.filter((q) => q.purpose === "practice" && q.misconception);
          if (!practice.length) continue; // a standalone diagnostic is not a practice sequence
          expect(practice.length, s.id).toBeGreaterThanOrEqual(5);
          expect(new Set(practice.map((q) => `${q.tool}:${q.level}:${q.misconception!.id}`)).size, `${s.id}: one misconception and level`).toBe(1);
          const content = practice.map((q) => JSON.stringify({ format: q.format, question: q.question, options: q.format === "choice" || q.format === "claims" ? q.options.map((o) => o.text) : undefined, claims: q.format === "claims" ? q.claims : undefined, lines: q.format === "error" ? q.lines : undefined }));
          expect(new Set(content).size, `${s.id}: distinct questions`).toBe(practice.length);
          for (const q of practice) expect(readyProblems(q), q.id).toEqual([]);
        }
      });
      it("generator and book-activity slides draw questions at their level", async () => {
        for (const s of d.slides) for (const e of s.els) if (e.kind === "generator" || e.kind === "worksheet") {
          expect(GENERATOR_TOOLS.some(([id]) => id === e.tool), `${s.id}: ${e.tool}`).toBe(true);
          const qs = e.kind === "worksheet" ? await generateSet(e.tool, e.preset, e.count, e.seed ?? 1) : [await generateFrom(e.tool, e.preset, e.seed ?? 1)];
          if (e.kind === "worksheet") expect(qs.length, s.id).toBe(e.count);
          for (const q of qs) expect(q?.difficulty, s.id).toBe(e.preset.level);
        }
      });
      for (const s of d.slides) for (const p of practices(s)) {
        it(`${s.id} (practice): intention is a known misconception, questions exist and are written against it, the generator runs`, async () => {
          expect(p.intention && MISCONCEPTIONS[p.intention], p.intention).toBeTruthy();
          expect(p.bank.length, "R42: each authored misconception-practice slide needs at least five distinct questions").toBeGreaterThanOrEqual(5);
          expect(new Set(p.bank.map((id) => bankById(id)?.latex)).size, "five different ids do not replace five distinct questions").toBe(p.bank.length);
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


describe("authored lesson thread", () => {
  it("gives every Estimation slide a complete brief, with constrained generator transfer checks", () => {
    const deck = DECKS.find((d) => d.id === "estimation")!;
    for (const slide of deck.slides) for (const field of ["purpose", "questionFocus", "evidence", "next"] as const) expect(slide.intent?.[field].trim().length, `${slide.id}: ${field}`).toBeGreaterThan(15);
    expect(deck.slides.find((s) => s.id === "est-gen-l1")?.intent?.questionFocus).toContain("whole-number operands");
    expect(deck.slides.find((s) => s.id === "est-gen-l3")?.intent?.questionFocus).toContain("fracbar and fracterm");
  });
});
