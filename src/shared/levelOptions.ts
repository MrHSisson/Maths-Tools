import type { DifficultyLevel, ToolEntry } from "./types";
import { normalizeMultiSelect } from "./helpers";
import type { LevelOptionGroup } from "./components/LevelInfoDialog";

/** What a teacher can choose at one level of a sub-tool (its pools, dropdown and switches), each marked if ticked by default. */
export function levelOptionGroups(t: ToolEntry | undefined, lv: DifficultyLevel): LevelOptionGroup[] {
  if (!t) return [];
  const ds = t.difficultySettings?.[lv];
  const groups: LevelOptionGroup[] = normalizeMultiSelect(ds?.multiSelect ?? t.multiSelect)
    .map(g => ({ title: g.label, items: g.options.map(o => ({ label: o.label.replace(/\*$/, "").trim(), on: !!o.defaultActive })) }));
  const dd = ds?.dropdown !== undefined ? ds.dropdown : t.dropdown;
  if (dd && dd.options.length > 1) groups.push({ title: dd.label, items: dd.options.map(o => ({ label: o.label, on: o.value === dd.defaultValue })) });
  const vars = (ds?.variables ?? t.variables).filter(v => !v.worksheetOnly);
  if (vars.length) groups.push({ title: "Switches", items: vars.map(v => ({ label: v.label, on: !!v.defaultValue })) });
  return groups.filter(g => g.items.length > 1);
}
