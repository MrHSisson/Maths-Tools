// Depth banks — every tool that passes `depthItems` must have a well-formed bank (see src/shared/depth.ts).
// Discovered through `__test.depthItems`, like the generator smoke tests discover tools.

import { describe, it, expect } from "vitest";
import katex from "katex";
import { depthUnmet, type DepthItem, type DepthOptionInfo } from "../shared/depth";

const loaders = import.meta.glob("../tools/**/*.tsx");
type Pool = { label: string; options: { value: string; label: string; defaultActive: boolean }[] };
type Cfg = { tools: Record<string, { multiSelect?: Pool | Pool[] | null; difficultySettings?: Record<string, { multiSelect?: Pool | Pool[] | null }> | null }> };
const banks: [string, DepthItem[], string[]][] = [];
const configs = new Map<string, Cfg>();
for (const [path, load] of Object.entries(loaders)) {
  try {
    const mod = (await load()) as { __test?: { depthItems?: DepthItem[]; TOOL_CONFIG?: { tools: Record<string, unknown> } } };
    if (mod.__test?.depthItems?.length) configs.set(path, mod.__test.TOOL_CONFIG as unknown as Cfg);
    if (mod.__test?.depthItems?.length) banks.push([path, mod.__test.depthItems, Object.keys(mod.__test.TOOL_CONFIG?.tools ?? {})]);
  } catch { /* import failures are reported by generators.test.ts */ }
}

const texOf = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
const textsOf = (it: DepthItem) => [
  it.title, ...it.question, ...it.answer, it.teacherNote ?? "",
  ...(it.options ?? []).flatMap((o) => [o.text, o.misconception ?? ""]),
  ...(it.speakers ?? []).flatMap((sp) => sp.says),
  it.working?.intro ?? "",
];

describe("Depth banks", () => {
  it("at least one tool has a bank", () => { expect(banks.length).toBeGreaterThan(0); });

  for (const [path, items, toolKeys] of banks) {
    describe(path, () => {
      const ids = new Set(items.map((i) => i.id));

      // The options each sub-tool offers at each level, as DepthMode sees them (value → pool/label), and the defaults.
      const offered = (toolKey: string, lv: string) => {
        const t = configs.get(path)?.tools[toolKey];
        const raw = t?.difficultySettings?.[lv]?.multiSelect ?? t?.multiSelect;
        const pools = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
        const info: DepthOptionInfo = {};
        const on = new Set<string>();
        for (const g of pools) for (const o of g.options) { info[o.value] = { pool: g.label, label: o.label }; if (o.defaultActive) on.add(o.value); }
        return { info, on };
      };
      const tabsOf = (i: DepthItem) => (i.tool ? [i.tool] : toolKeys);

      it("`needs` names real Question Options offered at the item's level", () => {
        for (const i of items.filter((x) => x.needs)) {
          for (const need of i.needs!) {
            const clause = Array.isArray(need) ? need : [need];
            for (const v of clause) {
              expect(tabsOf(i).some((k) => v in offered(k, i.level).info), `${i.id}: "${v}" is not an option at ${i.level}`).toBe(true);
            }
          }
        }
      });

      it("with default options every level still offers diagnose, explain and extend on every tab", () => {
        for (const k of toolKeys) {
          for (const lv of ["level1", "level2", "level3"]) {
            const { info, on } = offered(k, lv);
            for (const purpose of ["diagnose", "explain", "extend"]) {
              const avail = items.filter((i) => i.level === lv && i.purpose === purpose && (!i.tool || i.tool === k) && !depthUnmet(i, on, info));
              expect(avail.length, `${k} ${lv} ${purpose}`).toBeGreaterThan(0);
            }
          }
        }
      });

      it("depthUnmet: skips clauses nothing offers, needs ANY option in a clause and ALL clauses", () => {
        const info: DepthOptionInfo = { a: { pool: "Focus", label: "A" }, b: { pool: "Focus", label: "B" }, n: { pool: "Numbers", label: "Negatives" } };
        const it0 = { needs: [["a", "b"], "n", "ghost"] } as unknown as DepthItem;
        expect(depthUnmet(it0, new Set(["b", "n"]), info)).toBeNull();
        expect(depthUnmet(it0, new Set(["n"]), info)).toBe("Needs Focus: A or B");
        expect(depthUnmet(it0, new Set(["a"]), info)).toBe("Needs Numbers: Negatives");
        expect(depthUnmet({} as DepthItem, new Set(), info)).toBeNull();
      });

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

      it("speakers, working lines and visuals are well formed", () => {
        for (const i of items) {
          for (const sp of i.speakers ?? []) { expect(sp.name.length).toBeGreaterThan(0); expect(sp.says.length).toBeGreaterThan(0); }
          if (i.working) {
            expect(i.working.lines.length).toBeGreaterThan(1);
            expect(i.working.wrongLine).toBeGreaterThanOrEqual(0);
            expect(i.working.wrongLine).toBeLessThan(i.working.lines.length);
            // Working lines are bare LaTeX (no $), each valid on its own.
            for (const ln of i.working.lines) {
              expect(ln).not.toContain("$");
              expect(() => katex.renderToString(ln, { throwOnError: true }), `${i.id}: ${ln}`).not.toThrow();
            }
          }
          if (i.visual) {
            expect(i.visual.type).toBe("pyramid");
            for (const t of [...(i.visual.strong ?? []), ...(i.visual.soft ?? [])]) expect(["B", "I", "D", "M", "A", "S"]).toContain(t);
          }
        }
      });

      it("titles don't give the answer away (no '=' in a title)", () => {
        for (const i of items) expect(i.title).not.toContain("=");
      });
    });
  }
});
