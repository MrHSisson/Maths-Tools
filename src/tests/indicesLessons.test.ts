// Lessons (src/shared/lessons.ts) — every preset must name a real sub-tool, level, Question Option and
// Depth item, and the URL helpers must round-trip. Checked against the Indices tool.
import { describe, it, expect } from "vitest";
import { lessonStepParams, lessonOverviewParams, readLessonFromUrl, type ToolLesson } from "../shared";
import { __test } from "../tools/Number/Indices";

const { TOOL_CONFIG, depthItems, lessons } = __test as unknown as {
  TOOL_CONFIG: { tools: Record<string, { name: string; multiSelect?: unknown; difficultySettings?: Record<string, { multiSelect?: unknown }> | null; levels?: string[] }> };
  depthItems: { id: string; tool?: string | string[]; level: string }[];
  lessons: ToolLesson[];
};

// All Question Option values a sub-tool offers, across its levels.
const optionsOf = (tool: string): Set<string> => {
  const t = TOOL_CONFIG.tools[tool];
  const out = new Set<string>();
  const add = (raw: unknown) => { if (!raw) return; (Array.isArray(raw) ? raw : [raw]).forEach((g: { options: { value: string }[] }) => g.options.forEach(o => out.add(o.value))); };
  add(t.multiSelect);
  Object.values(t.difficultySettings ?? {}).forEach(s => add(s.multiSelect));
  return out;
};

describe("Indices lessons", () => {
  it("lesson ids are unique and each lesson has steps", () => {
    const ids = lessons.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of lessons) expect(l.steps.length, l.id).toBeGreaterThan(0);
  });

  it("every step names a real sub-tool level, Question Options and Depth item", () => {
    for (const l of lessons) {
      expect(TOOL_CONFIG.tools[l.tool], `${l.id} tool`).toBeDefined();
      const opts = optionsOf(l.tool);
      for (const s of l.steps) {
        expect(["level1", "level2", "level3"], `${l.id} level`).toContain(s.level);
        for (const k of Object.keys(s.ms ?? {})) expect(opts.has(k), `${l.id} "${s.title}" ms ${k}`).toBe(true);
        for (const k of Object.keys(s.vars ?? {})) expect(opts.has(k), `${l.id} "${s.title}" vars ${k}`).toBe(true);
        if (s.kind === "depth") {
          const item = depthItems.find(i => i.id === s.item);
          expect(item, `${l.id} item ${s.item}`).toBeDefined();
          expect(!item!.tool || (Array.isArray(item!.tool) ? item!.tool.includes(l.tool) : item!.tool === l.tool), `${s.item} is on ${l.tool}`).toBe(true);
          expect(item!.level, `${s.item} level`).toBe(s.level);
        }
        if (s.kind === "worksheet") expect(s.n ?? 15, `${l.id} n`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("a step's link carries the tool, level, mode and lesson markers", () => {
    const l = lessons[0];
    const i = l.steps.findIndex(s => s.kind === "depth");
    const p = lessonStepParams(l, i);
    expect(p.get("tool")).toBe(l.tool);
    expect(p.get("mode")).toBe("depth");
    expect(p.get("item")).toBe(l.steps[i].item);
    expect(p.get("lesson")).toBe(l.id);
    expect(p.get("step")).toBe(String(i));
    const t = lessonStepParams(l, l.steps.findIndex(s => s.kind === "teach"));
    expect(t.get("mode")).toBe("teach");
    expect(t.get("deck")).toBe("laws");
  });

  it("the overview link names the tool and lesson, with no step", () => {
    const l = lessons[0];
    const p = lessonOverviewParams(l);
    expect(p.get("tool")).toBe(l.tool);
    expect(p.get("lesson")).toBe(l.id);
    expect(p.get("step")).toBeNull();
  });

  it("a worksheet step sets the question count", () => {
    const l = lessons[0];
    const i = l.steps.findIndex(s => s.kind === "worksheet");
    const p = lessonStepParams(l, i);
    expect(p.get("mode")).toBe("worksheet");
    expect(p.get("n")).toBe(String(l.steps[i].n));
  });

  it("readLessonFromUrl finds a lesson and clamps the step", () => {
    const l = lessons[0];
    expect(readLessonFromUrl(lessons, `?${lessonStepParams(l, 2)}`)).toEqual({ id: l.id, step: 2 });
    expect(readLessonFromUrl(lessons, `?lesson=${l.id}&step=99`)).toEqual({ id: l.id, step: l.steps.length - 1 });
    expect(readLessonFromUrl(lessons, `?lesson=${l.id}`)).toEqual({ id: l.id, step: null });
    expect(readLessonFromUrl(lessons, "?lesson=nope&step=1")).toBeNull();
    expect(readLessonFromUrl(undefined, `?lesson=${l.id}`)).toBeNull();
  });
});
