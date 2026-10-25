// "About this tool" — the content model for the info panel, and the once-per-tool first-visit memory.
// The Question Options topic is READ FROM the tool's config, so it can never go stale; the rest comes from the tool's hand-written
// INFO_SECTIONS. Pure functions (no React) so they are tested directly.
import type { InfoSection, ToolConfig, ToolEntry, ToolMultiSelect, ToolMultiSelectConfig, ToolVariable, ToolDropdown, DifficultyLevel, DifficultyLevelSettings } from "./types";
import { normalizeMultiSelect } from "./helpers";

interface AboutItem { label: string; detail: string }
interface AboutTopic { id: string; title: string; icon?: string; items: AboutItem[] }
export interface AboutModel { summary: string; subTools: AboutSubTool[]; topics: AboutTopic[] }

const ALL_LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];
const lvNo = (l: DifficultyLevel) => l.replace("level", "");
const levelsText = (have: DifficultyLevel[], all: DifficultyLevel[]) =>
  have.length === all.length ? "" : ` (Level${have.length > 1 ? "s" : ""} ${have.map(lvNo).join(", ")})`;
const optionLine = (o: { label: string; sub?: string }) => (o.sub ? `${o.label} ${o.sub}` : o.label).replace(/\*$/, "*");

interface OptionEntry { id: string; key: string; label: string; info?: string; list: string; levels: DifficultyLevel[] }

/** Every Question Option group of a sub-tool once (a pool, switch or dropdown that looks the same at several levels is one entry), with a
 *  stable id: its key, or `key@<levels>` (e.g. `questionType@23`) when the same key means different choices at different levels. */
function optionEntries(entry: ToolEntry): OptionEntry[] {
  const levels = entry.levels ?? ALL_LEVELS;
  const bySig = new Map<string, OptionEntry>();
  const add = (sig: string, key: string, label: string, info: string | undefined, list: string, level: DifficultyLevel) => {
    const r = bySig.get(sig);
    if (r) { if (!r.levels.includes(level)) r.levels.push(level); } else bySig.set(sig, { id: key, key, label, info, list, levels: [level] });
  };
  for (const level of levels) {
    const ds = entry.difficultySettings?.[level];
    for (const p of normalizeMultiSelect(ds?.multiSelect ?? entry.multiSelect) as ToolMultiSelect[]) {
      if (p.options.length < 2) continue;
      add(`P:${p.key}:${p.options.map((o) => o.value).join(",")}`, p.key, p.label, p.info, p.options.map(optionLine).join(" · "), level);
    }
    for (const v of ds?.variables ?? entry.variables ?? []) add(`V:${v.key}`, v.key, v.label, v.info, `A switch, ${v.defaultValue ? "on" : "off"} to start with`, level);
    const dd = ds?.dropdown ?? entry.dropdown;
    if (dd && dd.options.length > 1) add(`D:${dd.key}:${dd.options.map((o) => o.value).join(",")}`, dd.key, dd.label, dd.info, dd.options.map((o) => o.label).join(" · "), level);
  }
  const all = [...bySig.values()];
  const count = new Map<string, number>();
  for (const r of all) count.set(r.key, (count.get(r.key) ?? 0) + 1);
  for (const r of all) if ((count.get(r.key) ?? 0) > 1) r.id = `${r.key}@${r.levels.map(lvNo).join("")}`;
  return all;
}

/** One item per Question Option group of a sub-tool: what it is for (its `info`, written in `<Tool>.about.ts`), with the levels it is offered at. */
export function describeOptions(entry: ToolEntry): AboutItem[] {
  const levels = entry.levels ?? ALL_LEVELS;
  return optionEntries(entry).map((r) => ({ label: r.label + levelsText(r.levels, levels), detail: r.info ?? `${r.list}.` }));
}

/** The Question Options of a sub-tool that have no explanation yet (ids), for the test that keeps every option explained. */
export function unexplainedOptions(entry: ToolEntry): string[] {
  return optionEntries(entry).filter((r) => !r.info?.trim()).map((r) => r.id);
}

interface AboutSubTool { key: string; name: string; purpose: string; levels: string[]; options: AboutItem[] }

/** The panel's content. With a config (ToolShell tools): the tool's purpose, then each sub-tool with its purpose, what each level means
 *  (the same `levelLabels` as the level (i)) and its Question Options, all read from the config so the two never disagree. Without one
 *  (CS topics, games): the purpose and the hand-written topics. */
export function buildAbout(opts: { infoSections: InfoSection[]; config?: ToolConfig; current?: string }): AboutModel {
  const { infoSections, config } = opts;
  const overview = infoSections.flatMap((s) => s.content).find((i) => /^overview$/i.test(i.label)) ?? infoSections[0]?.content[0];
  if (config) {
    const subTools: AboutSubTool[] = Object.entries(config.tools).map(([key, e]) => {
      const n = (e.levels ?? ALL_LEVELS).length;
      return { key, name: e.name, purpose: e.purpose ?? "", levels: (e.levelLabels ?? []).slice(0, n), options: describeOptions(e) };
    });
    return { summary: config.purpose ?? overview?.detail ?? "", subTools, topics: [] };
  }
  const topics: AboutTopic[] = [];
  for (const s of infoSections.filter((x) => !/modes/i.test(x.title))) {   // how the modes work is not what this panel is for
    const items = s.content.filter((i) => i !== overview);
    if (items.length) topics.push({ id: `s:${s.title}`, title: s.title, icon: s.icon, items });
  }
  return { summary: overview?.detail ?? "", subTools: [], topics };
}

// ── the copy ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The plain-language words about a tool, kept in one small file beside it (`<Tool>.about.ts`): what the whole tool is for, and for each
 *  sub-tool what it is for and what its levels mean. They feed both "About this tool" and the level (i), so the two always agree. */
export interface ToolAbout {
  purpose: string;
  /** What each Question Option is for, by option id (the key, or `key@<levels>` when the key means different choices at different levels). Shared by every sub-tool. */
  options?: Record<string, string>;
  /** `options` here override the shared text for one sub-tool. */
  tools: Record<string, { purpose: string; levels?: string[]; options?: Record<string, string> }>;
}

/** Writes the copy onto a tool's config (call once, after the config is declared). Throws if the copy and the sub-tools do not match.
 *  Question Option text is written onto COPIES of the pools, switches and dropdowns, so an object shared by several sub-tools can say
 *  something different in each. */
export function applyAbout(config: ToolConfig, about: ToolAbout): ToolConfig {
  const keys = Object.keys(config.tools);
  const missing = keys.filter((k) => !about.tools[k]);
  const extra = Object.keys(about.tools).filter((k) => !config.tools[k]);
  if (missing.length || extra.length) throw new Error(`about copy does not match sub-tools (missing: ${missing.join(", ") || "none"}; unknown: ${extra.join(", ") || "none"})`);
  config.purpose = about.purpose;
  const used = new Set<string>();
  for (const k of keys) {
    const e = config.tools[k], a = about.tools[k];
    e.purpose = a.purpose;
    if (a.levels) e.levelLabels = a.levels;
    const entries = optionEntries(e);
    const levels = e.levels ?? ALL_LEVELS;
    const textAt = (key: string, level: DifficultyLevel): string | undefined => {
      const r = entries.find((x) => x.key === key && x.levels.includes(level));
      if (!r) return undefined;
      for (const [src, tag] of [[a.options, `${k}:`], [about.options, ""]] as const) {
        for (const name of [r.id, key]) if (src && name in src) { used.add(`${tag}${name}`); return src[name]; }
      }
      return undefined;
    };
    const pools = (ms: ToolMultiSelectConfig | undefined, level: DifficultyLevel) => {
      const one = (p: ToolMultiSelect): ToolMultiSelect => { const t = textAt(p.key, level); return t ? { ...p, info: t } : p; };
      return ms === undefined ? undefined : Array.isArray(ms) ? ms.map(one) : one(ms);
    };
    const vars = (vs: ToolVariable[], level: DifficultyLevel) => vs.map((v) => { const t = textAt(v.key, level); return t ? { ...v, info: t } : v; });
    const dd = (d: ToolDropdown, level: DifficultyLevel): ToolDropdown => { const t = textAt(d.key, level); return t ? { ...d, info: t } : d; };
    if (e.multiSelect) e.multiSelect = pools(e.multiSelect, levels[0]);
    if (e.dropdown) e.dropdown = dd(e.dropdown, levels[0]);
    if (e.variables?.length) e.variables = vars(e.variables, levels[0]);
    if (e.difficultySettings) {
      const ds: Record<string, DifficultyLevelSettings> = {};
      for (const [lv, st] of Object.entries(e.difficultySettings)) {
        const level = lv as DifficultyLevel;
        ds[lv] = { ...st,
          ...(st.multiSelect ? { multiSelect: pools(st.multiSelect, level) } : {}),
          ...(st.dropdown ? { dropdown: dd(st.dropdown, level) } : {}),
          ...(st.variables ? { variables: vars(st.variables, level) } : {}) };
      }
      e.difficultySettings = ds;
    }
  }
  const unknown = [
    ...Object.keys(about.options ?? {}).filter((n) => !used.has(n)),
    ...Object.entries(about.tools).flatMap(([k, t]) => Object.keys(t.options ?? {}).filter((n) => !used.has(`${k}:${n}`)).map((n) => `${k}:${n}`)),
  ];
  if (unknown.length) throw new Error(`about copy names options that do not exist: ${unknown.join(", ")}`);
  return config;
}

// ── first visit: open the panel once per tool per device ─────────────────────────────────────────────────────────────────
const SEEN_KEY = "mt-about-seen";
let livePaths: Set<string> | null = null;
/** Called once by App with the routes of the live tools: only they open the panel by themselves. */
export const setLivePaths = (paths: string[]): void => { livePaths = new Set(paths); };

const readSeen = (): string[] | null => {
  try { const v = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return null; }
};
/** Storage can be blocked (private window): then nothing is remembered, so we never auto-open. */
const writeSeen = (list: string[]): boolean => {
  try { window.localStorage.setItem(SEEN_KEY, JSON.stringify(list)); return true; } catch { return false; }
};
export const markAboutSeen = (path: string): void => { const l = readSeen(); if (l && !l.includes(path)) writeSeen([...l, path]); };
export const resetAboutSeen = (): void => { try { window.localStorage.removeItem(SEEN_KEY); } catch { /* nothing stored */ } };

/** True the first time a live tool is opened on this device from a plain address (no shared link, lesson step or set-up worksheet). */
export function shouldAutoOpenAbout(path: string, search: string): boolean {
  if (!livePaths || !livePaths.has(path)) return false;
  if (search.replace(/^\?/, "") !== "") return false;
  const seen = readSeen();
  if (!seen || seen.includes(path)) return false;
  return writeSeen([...seen]);   // proves storage works before we promise to remember
}
