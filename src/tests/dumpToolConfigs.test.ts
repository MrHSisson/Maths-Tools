// Not a real test: writes every ToolShell tool's question options to JSON for scripts/notesPages.mjs.
// Skipped unless DUMP_CONFIGS=1 (so CI never runs it).
import { it } from "vitest";
import fs from "fs";
import { normalizeMultiSelect } from "../shared/helpers";

const loaders = import.meta.glob("../tools/**/*.tsx");
const dir = process.env.NOTES_DUMP_DIR || "/tmp/maths-tools-notes";

it.skipIf(!process.env.DUMP_CONFIGS)("dump tool configs", async () => {
  const out: Record<string, unknown> = {};
  for (const [p, load] of Object.entries(loaders)) {
    const m: any = await load();
    const t = m.__test;
    if (!t || !t.TOOL_CONFIG) continue;
    const cfg = t.TOOL_CONFIG;
    const subs: Record<string, unknown> = {};
    for (const [k, e] of Object.entries<any>(cfg.tools)) {
      const lv: Record<string, unknown> = {};
      for (const level of ["level1", "level2", "level3"]) {
        const ds = e.difficultySettings?.[level] ?? {};
        const vars = (ds.variables ?? e.variables ?? []).map((v: any) => ({ label: v.label, on: v.defaultValue }));
        const dd = ds.dropdown !== undefined ? ds.dropdown : e.dropdown;
        const ms = normalizeMultiSelect(ds.multiSelect ?? e.multiSelect).map((g: any) => ({
          label: g.label,
          exclusive: !!g.exclusive,
          options: g.options.map((o: any) => ({ label: o.label, on: o.defaultActive, w: o.weight, req: o.requires })),
        }));
        lv[level] = {
          vars,
          dd: dd ? { label: dd.label, opts: dd.options?.map((o: any) => ({ l: o.label, on: o.value === dd.defaultValue })), def: dd.defaultValue } : null,
          ms,
        };
      }
      subs[k] = { name: e.name, instruction: e.instruction, levels: e.levels ?? t.levels ?? ["level1", "level2", "level3"], lv };
    }
    out[p.replace("../tools/", "")] = { title: cfg.pageTitle, subs, hasDepth: !!t.depthItems };
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + "/configs.json", JSON.stringify(out));
}, 300000);
