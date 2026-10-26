import type { DifficultyLevel, ToolConfig, ToolDropdown, ToolMultiSelect, ToolVariable } from "./types";
import { normalizeMultiSelect } from "./helpers";
import type { ShellUrlInit } from "./shellUrl";

// The starting Question Option state for every sub-tool and level: each option's default, then
// whatever the shareable link says for the sub-tool and level it opens on.

export function initToolVariables(config: ToolConfig, urlInit: ShellUrlInit): Record<string, Record<string, Record<string, boolean>>> {
  const toolKeys = Object.keys(config.tools);
  const init: Record<string, Record<string, Record<string, boolean>>> = {};
  toolKeys.forEach(k => {
    init[k] = {};
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      init[k][lv] = {};
      const vars = config.tools[k].difficultySettings?.[lv]?.variables ?? config.tools[k].variables;
      vars.forEach(v => { init[k][lv][v.key] = v.defaultValue; });
    });
  });
  Object.entries(urlInit.vars).forEach(([k, v]) => {
    if (k in (init[urlInit.tool]?.[urlInit.level] ?? {})) init[urlInit.tool][urlInit.level][k] = v;
  });
  return init;
}

export function initToolDropdowns(config: ToolConfig, urlInit: ShellUrlInit): Record<string, string> {
  const toolKeys = Object.keys(config.tools);
  const init: Record<string, string> = {};
  toolKeys.forEach(k => {
    const t = config.tools[k];
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
      if (dd) init[`${k}__${lv}`] = dd.defaultValue;
    });
  });
  const t0 = config.tools[urlInit.tool];
  const dd0 = t0.difficultySettings?.[urlInit.level]?.dropdown ?? t0.dropdown;
  if (urlInit.dd && dd0?.options.some(o => o.value === urlInit.dd)) init[`${urlInit.tool}__${urlInit.level}`] = urlInit.dd;
  return init;
}

export function initToolMultiSelect(config: ToolConfig, urlInit: ShellUrlInit): Record<string, Record<string, boolean>> {
  const toolKeys = Object.keys(config.tools);
  const init: Record<string, Record<string, boolean>> = {};
  toolKeys.forEach(k => {
    init[k] = {};
    const t = config.tools[k];
    normalizeMultiSelect(t.multiSelect).forEach(ms => { ms.options.forEach(o => { init[k][o.value] = o.defaultActive; }); });
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect).forEach(ms => {
        ms.options.forEach(o => { if (!(o.value in init[k])) init[k][o.value] = o.defaultActive; });
      });
    });
  });
  Object.entries(urlInit.ms).forEach(([k, v]) => {
    if (k in (init[urlInit.tool] ?? {})) init[urlInit.tool][k] = v;
  });
  return init;
}

/** The Question Options as they stood on one question. */
interface QoState { dd: string; vars: Record<string, boolean>; ms: Record<string, boolean> }

/**
 * Changing a Question Option keeps the question on screen, unless every option that changed only alters how the SAME question is shown
 * (`displayOnly`, or a dropdown that only swaps the working): the shell then redraws it at once from its saved seed. True only when at
 * least one option changed and all of them are display-only.
 */
export function onlyDisplayOptionsChanged(before: QoState, after: QoState, dropdown: ToolDropdown | null | undefined, variables: ToolVariable[], multiSelect: ToolMultiSelect[]): boolean {
  const changed: boolean[] = [];   // one entry per changed option: true when it is display-only
  if (before.dd !== after.dd) changed.push(!!(dropdown?.workedExampleOnly || dropdown?.displayOnly));
  for (const v of variables) if (before.vars[v.key] !== after.vars[v.key]) changed.push(!!v.displayOnly);
  for (const g of multiSelect) for (const o of g.options) if (before.ms[o.value] !== after.ms[o.value]) changed.push(!!g.displayOnly);
  return changed.length > 0 && changed.every(Boolean);
}
