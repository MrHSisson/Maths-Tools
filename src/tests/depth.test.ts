// Depth banks — every tool that passes `depthItems` must have a well-formed bank (see src/shared/depth.ts).
// Discovered through `__test.depthItems`, like the generator smoke tests discover tools.

import { describe, it, expect } from "vitest";
import katex from "katex";
import type { DepthItem } from "../shared/depth";

const loaders = import.meta.glob("../tools/**/*.tsx");
const banks: [string, DepthItem[], string[]][] = [];
for (const [path, load] of Object.entries(loaders)) {
  try {
    const mod = (await load()) as { __test?: { depthItems?: DepthItem[]; TOOL_CONFIG?: { tools: Record<string, unknown> } } };
    if (mod.__test?.depthItems?.length) banks.push([path, mod.__test.depthItems, Object.keys(mod.__test.TOOL_CONFIG?.tools ?? {})]);
  } catch { /* import failures are reported by generators.test.ts */ }
}

const texOf = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
const textsOf = (it: DepthItem) => [
  it.title, ...it.question, ...it.answer, it.teacherNote ?? "",
  ...(it.options ?? []).flatMap((o) => [o.text, o.misconception ?? ""]),
];

describe("Depth banks", () => {
  it("at least one tool has a bank", () => { expect(banks.length).toBeGreaterThan(0); });

  for (const [path, items, toolKeys] of banks) {
    describe(path, () => {
      const ids = new Set(items.map((i) => i.id));

      it("ids are unique and URL-safe", () => {
        expect(ids.size).toBe(items.length);
        for (const i of items) expect(i.id).toMatch(/^[a-z0-9-]+$/);
      });

      it("every item is well formed", () => {
        for (const i of items) {
          expect(["level1", "level2", "level3"]).toContain(i.level);
          expect(["diagnose", "explain", "extend"]).toContain(i.purpose);
          if (i.tool) expect(toolKeys).toContain(i.tool);
          expect(i.title.trim().length).toBeGreaterThan(0);
          expect(i.question.length).toBeGreaterThan(0);
          expect(i.answer.length).toBeGreaterThan(0);
        }
      });

      it("multiple-choice items have a correct option and named misconceptions", () => {
        for (const i of items.filter((x) => x.options)) {
          const opts = i.options!;
          expect(opts.length).toBeGreaterThanOrEqual(2);
          expect(opts.filter((o) => o.correct).length).toBe(1);
          for (const o of opts.filter((x) => !x.correct)) expect(o.misconception, `${i.id}: "${o.text}"`).toBeTruthy();
        }
      });

      it("follow-up links point at real items, and ifSecure never goes down a level", () => {
        const byId = new Map(items.map((i) => [i.id, i]));
        const rank = { level1: 1, level2: 2, level3: 3 } as const;
        for (const i of items) {
          for (const link of [i.ifNotSecure, i.ifSecure]) if (link) expect(byId.has(link), `${i.id} -> ${link}`).toBe(true);
          if (i.ifSecure) expect(rank[byId.get(i.ifSecure)!.level]).toBeGreaterThanOrEqual(rank[i.level]);
          expect(i.ifNotSecure).not.toBe(i.id);
          expect(i.ifSecure).not.toBe(i.id);
        }
      });

      it("every level has diagnose, explain and extend items; Start here is one diagnose per level", () => {
        for (const level of ["level1", "level2", "level3"] as const) {
          for (const purpose of ["diagnose", "explain", "extend"] as const) {
            expect(items.some((i) => i.level === level && i.purpose === purpose), `${level} ${purpose}`).toBe(true);
          }
          const starts = items.filter((i) => i.level === level && i.startHere);
          expect(starts.length, `${level} startHere`).toBe(1);
          expect(starts[0].purpose).toBe("diagnose");
        }
      });

      it("every $...$ segment renders in KaTeX", () => {
        for (const i of items) {
          for (const t of textsOf(i)) for (const tex of texOf(t)) {
            expect(() => katex.renderToString(tex, { throwOnError: true }), `${i.id}: ${tex}`).not.toThrow();
          }
        }
      });

      it("titles don't give the answer away (no '=' in a title)", () => {
        for (const i of items) expect(i.title).not.toContain("=");
      });
    });
  }
});
