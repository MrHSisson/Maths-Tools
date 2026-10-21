// Teach lessons for Indices (src/tools/Number/IndicesTeach.ts): every scene has a caption per beat, every KaTeX string renders,
// every check is a real Depth item, every hand-off names a real sub-tool, level, Question Option and Depth item, and the
// lesson steps that open a deck name a real lesson.
import { describe, it, expect } from "vitest";
import katex from "katex";
import { slideMaxStep, indexSeq, indexTileCount, patternSeq, setupParams, type TeachingSlide, type TeachLesson, type TeachBlock } from "../shared";
import { __test } from "../tools/Number/Indices";

const { TOOL_CONFIG, depthItems, lessons, teachLessons } = __test as unknown as {
  TOOL_CONFIG: { tools: Record<string, { multiSelect?: unknown; difficultySettings?: Record<string, { multiSelect?: unknown }> | null }> };
  depthItems: { id: string; tool?: string | string[]; level: string }[];
  lessons: { steps: { kind: string; deck?: string }[] }[];
  teachLessons: TeachLesson[];
};

const optionsOf = (tool: string): Set<string> => {
  const t = TOOL_CONFIG.tools[tool];
  const out = new Set<string>();
  const add = (raw: unknown) => { if (!raw) return; (Array.isArray(raw) ? raw : [raw]).forEach((g: { options: { value: string }[] }) => g.options.forEach(o => out.add(o.value))); };
  add(t.multiSelect);
  Object.values(t.difficultySettings ?? {}).forEach(s => add(s.multiSelect));
  return out;
};
const renders = (tex: string) => { katex.renderToString(tex, { throwOnError: true }); };
const inline = (s: string) => s.split(/\$([^$]+)\$/g).forEach((p, i) => { if (i % 2 === 1) renders(p); });
const blocks = (s: TeachingSlide): TeachBlock[] => (s.kind === "anim" || s.kind === "depth" ? [] : [...(s.body ?? []), ...(s.reveal ?? [])]);

describe("Indices Teach lessons", () => {
  it("lesson ids are unique, each is on a real sub-tool and has slides", () => {
    expect(new Set(teachLessons.map(l => l.id)).size).toBe(teachLessons.length);
    for (const l of teachLessons) {
      expect(TOOL_CONFIG.tools[l.tool], l.id).toBeDefined();
      expect(l.slides.length).toBeGreaterThan(3);
    }
  });

  it("every scene supplies exactly one caption per beat and stays small", () => {
    for (const l of teachLessons) for (const s of l.slides) {
      if (s.kind !== "anim") continue;
      expect(s.steps.length, `${l.id} "${s.title}"`).toBe(slideMaxStep(s) + 1);
      if (s.scene.type === "indexExpand") expect(indexTileCount(s.scene), s.title).toBeLessThanOrEqual(16);
    }
  });

  it("index scene beats", () => {
    const sc = (law: "multiply" | "divide" | "power" | "expand", extra = {}) => ({ type: "indexExpand" as const, law, base: "x", m: 3, n: 2, ...extra });
    expect(indexSeq(sc("multiply")).length).toBe(5);
    expect(indexSeq(sc("divide")).length).toBe(6);
    expect(indexSeq(sc("power")).length).toBe(5);
    expect(indexSeq(sc("power", { predict: true })).length).toBe(6);
    expect(indexSeq(sc("power", { predict: true })).indexOf("predict")).toBe(indexSeq(sc("power", { predict: true })).indexOf("count") - 1);
    expect(indexSeq(sc("expand")).length).toBe(4);
  });

  it("index pattern beats: one per row, plus one more for each predicted row, and it stays short", () => {
    const sc = (extra = {}) => ({ type: "indexPattern" as const, base: 5, from: 3, to: 0, ...extra });
    expect(patternSeq(sc()).length).toBe(4);
    expect(patternSeq(sc({ predictFrom: 0 })).length).toBe(5);
    expect(patternSeq(sc({ predictFrom: 2 })).length).toBe(7);
    for (const l of teachLessons) for (const s of l.slides) {
      if (s.kind === "anim" && s.scene.type === "indexPattern") expect(s.scene.from - s.scene.to + 1, s.title).toBeLessThanOrEqual(6);
    }
  });

  it("every KaTeX string renders", () => {
    for (const l of teachLessons) for (const s of l.slides) {
      inline(s.title);
      if (s.kind === "anim") s.steps.forEach(inline);
      for (const b of blocks(s)) {
        if (b.t === "math") renders(b.s);
        else if (b.t === "text" || b.t === "note") inline(b.s);
      }
    }
  });

  it("every hand-off names a real sub-tool, level, Question Option and Depth item", () => {
    let seen = 0;
    for (const l of teachLessons) for (const s of l.slides) for (const b of blocks(s)) {
      if (b.t !== "handoff") continue;
      for (const btn of b.buttons) {
        seen++;
        const { tool, step } = btn.to;
        expect(TOOL_CONFIG.tools[tool], btn.label).toBeDefined();
        const opts = optionsOf(tool);
        for (const k of Object.keys(step.ms ?? {})) expect(opts.has(k), `${btn.label} ms ${k}`).toBe(true);
        if (step.kind === "depth") {
          const item = depthItems.find(i => i.id === step.item);
          expect(item, `${btn.label} item ${step.item}`).toBeDefined();
          expect(item!.level).toBe(step.level);
        }
        expect(setupParams(tool, step).get("tool")).toBe(tool);
      }
    }
    expect(seen).toBeGreaterThanOrEqual(3);
  });

  it("every Check slide is built from a real Depth item and a lesson's deck steps name a real lesson", () => {
    for (const l of teachLessons) for (const s of l.slides) if (s.kind === "depth") {
      expect(depthItems.some(i => i.id === s.item.id), `${l.id} check ${s.item.id}`).toBe(true);
      expect(slideMaxStep(s)).toBe(1); // question, then answer
    }
    for (const ls of lessons) for (const st of ls.steps) if (st.kind === "teach") expect(teachLessons.some(t => t.id === st.deck), String(st.deck)).toBe(true);
  });
});
