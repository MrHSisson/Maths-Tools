import type { DifficultyLevel, ToolConfig, ToolShellDefaults } from "./types";
import { normalizeMultiSelect } from "./helpers";

// Shareable links for ToolShell: the URL query string is read once when a tool
// opens (`readShellUrl`) and rewritten from the live setup (`buildShellQuery`).
// Both are pure so they can be tested without rendering the shell.
//
// ?tool=key&mode=example|worksheet&level=2&dd=value&vars=a,-b&ms=x,-y&n=20&cols=2&diff=1&diffLv=1,3&diffSame=0&diffColor=0
// Tokens in vars/ms set a key on; a "-" prefix sets it off. Invalid or stale values fall
// back to defaults, so old bookmarks never break a tool. `diffLv` is an optional comma list
// of level numbers (e.g. "1,3") selecting a subset of levels for the Differentiated
// worksheet; omitted or invalid, it falls back to every available level. `diffSame=0`
// opts into per-level cell sizing; `diffColor=0` turns off each level's tint.

export const ALL_LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];
export type ShellMode = "whiteboard" | "single" | "worksheet" | "teach" | "depth";

// "builder" used to be its own top-level mode; it is now Worksheet mode's Advanced toggle.
// Old `mode=builder` links still land on Worksheet mode with Advanced on (`builderRequested`).
const MODE_FROM_URL: Record<string, ShellMode> = { whiteboard: "whiteboard", example: "single", worksheet: "worksheet", builder: "worksheet", teach: "teach", depth: "depth" };
const LEVEL_FROM_URL: Record<string, DifficultyLevel> = { "1": "level1", "2": "level2", "3": "level3" };

export interface ShellUrlInit {
  tool: string;
  mode: ShellMode;
  builderRequested: boolean;
  item: string | null;
  level: DifficultyLevel;
  vars: Record<string, boolean>;
  ms: Record<string, boolean>;
  dd: string | null;
  n: number | null;
  cols: number | null;
  diff: boolean;
  diffLv: string | null;
  diffSame: boolean;
  diffColor: boolean;
}

export function readShellUrl(search: string, config: ToolConfig, defaults: ToolShellDefaults, narrowInit: boolean): ShellUrlInit {
  const p = new URLSearchParams(search);
  const toolKeys = Object.keys(config.tools);
  const toggles = (param: string | null): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    for (const tok of (param ?? "").split(",")) {
      const off = tok.startsWith("-");
      const key = off ? tok.slice(1) : tok;
      if (key) out[key] = !off;
    }
    return out;
  };
  const levelParam = LEVEL_FROM_URL[p.get("level") ?? ""];
  const intParam = (key: string, min: number, max: number): number | null => {
    const n = parseInt(p.get(key) ?? "", 10);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
  };
  const toolParam = p.get("tool");
  const tool = toolParam && toolKeys.includes(toolParam) ? toolParam : toolKeys[0];
  const toolLvls = config.tools[tool]?.levels ?? ALL_LEVELS;
  return {
    tool,
    // On a narrow first paint with no explicit mode= param, seed "single" directly:
    // narrow has no Whiteboard mode, so "whiteboard" left neither toggle highlighted for a frame.
    mode: MODE_FROM_URL[p.get("mode") ?? ""] ?? (narrowInit ? "single" : "whiteboard"),
    builderRequested: p.get("mode") === "builder",
    item: p.get("item"),
    level: levelParam && toolLvls.includes(levelParam) ? levelParam : toolLvls[0],
    vars: toggles(p.get("vars")),
    ms: toggles(p.get("ms")),
    dd: p.get("dd"),
    n: intParam("n", 1, 24),
    cols: defaults.fixedColumns ? null : intParam("cols", 1, Math.max(defaults.maxColumns ?? 4, ...Object.values(defaults.maxColumnsByLevel ?? {}), ...Object.values(defaults.maxColumnsByTool ?? {}))),
    diff: p.get("diff") === "1",
    diffLv: p.get("diffLv"),
    diffSame: p.get("diffSame") !== "0",
    diffColor: p.get("diffColor") !== "0",
  };
}

/** The live setup that gets written into the address bar. */
export interface ShellUrlState {
  currentTool: string;
  mode: ShellMode;
  difficulty: DifficultyLevel;
  toolDropdowns: Record<string, string>;
  toolVariables: Record<string, Record<string, Record<string, boolean>>>;
  toolMultiSelect: Record<string, Record<string, boolean>>;
  numQuestions: number;
  numColumns: number;
  isDifferentiated: boolean;
  diffLevels: DifficultyLevel[];
  availableLevels: DifficultyLevel[];
  diffSameSize: boolean;
  diffColorLevels: boolean;
  depthItemId: string | null | undefined;
}

/** Only non-default values are written, so a freshly opened tool keeps a clean URL. */
export function buildShellQuery(s: ShellUrlState, config: ToolConfig, defaults: ToolShellDefaults): URLSearchParams {
  const toolKeys = Object.keys(config.tools);
  const p = new URLSearchParams();
  if (s.currentTool !== toolKeys[0]) p.set("tool", s.currentTool);
  if (s.mode !== "whiteboard") p.set("mode", s.mode === "single" ? "example" : s.mode === "teach" ? "teach" : s.mode === "depth" ? "depth" : "worksheet");
  if (s.difficulty !== "level1") p.set("level", s.difficulty.slice(-1));
  const t = config.tools[s.currentTool];
  const ddCfg = t.difficultySettings?.[s.difficulty]?.dropdown ?? t.dropdown;
  const ddVal = s.toolDropdowns[`${s.currentTool}__${s.difficulty}`];
  if (ddCfg && ddVal && ddVal !== ddCfg.defaultValue) p.set("dd", ddVal);
  const varTokens: string[] = [];
  (t.difficultySettings?.[s.difficulty]?.variables ?? t.variables).forEach(v => {
    const cur = s.toolVariables[s.currentTool]?.[s.difficulty]?.[v.key];
    if (cur !== undefined && cur !== v.defaultValue) varTokens.push(cur ? v.key : `-${v.key}`);
  });
  if (varTokens.length) p.set("vars", varTokens.join(","));
  const msTokens: string[] = [];
  const seenMS = new Set<string>();
  const msGroups = [
    ...normalizeMultiSelect(t.multiSelect),
    ...ALL_LEVELS.flatMap(lv => normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect)),
  ];
  msGroups.forEach(g => g.options.forEach(o => {
    if (seenMS.has(o.value)) return;
    seenMS.add(o.value);
    const cur = s.toolMultiSelect[s.currentTool]?.[o.value];
    if (cur !== undefined && cur !== o.defaultActive) msTokens.push(cur ? o.value : `-${o.value}`);
  }));
  if (msTokens.length) p.set("ms", msTokens.join(","));
  if (s.mode === "worksheet") {
    if (s.numQuestions !== (defaults.numQuestions ?? 15)) p.set("n", String(s.numQuestions));
    if (!s.isDifferentiated && s.numColumns !== (defaults.numColumns ?? 3)) p.set("cols", String(s.numColumns));
    if (s.isDifferentiated) {
      p.set("diff", "1");
      const levelToNum: Record<DifficultyLevel, string> = { level1: "1", level2: "2", level3: "3" };
      const isFullSet = s.diffLevels.length === s.availableLevels.length && s.diffLevels.every(l => s.availableLevels.includes(l));
      if (!isFullSet) p.set("diffLv", s.diffLevels.map(l => levelToNum[l]).join(","));
      if (!s.diffSameSize) p.set("diffSame", "0");
      if (!s.diffColorLevels) p.set("diffColor", "0");
    }
  }
  if (s.mode === "depth" && s.depthItemId) p.set("item", s.depthItemId);
  return p;
}
