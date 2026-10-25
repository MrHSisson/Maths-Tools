// "About this tool" — the content model for the info panel, and the once-per-tool first-visit memory.
// The Question Options topic is READ FROM the tool's config, so it can never go stale; the rest comes from the tool's hand-written
// INFO_SECTIONS. Pure functions (no React) so they are tested directly.
import type { InfoSection, ToolEntry, ToolMultiSelect, DifficultyLevel } from "./types";
import { normalizeMultiSelect } from "./helpers";

interface AboutItem { label: string; detail: string }
interface AboutTopic { id: string; title: string; icon?: string; items: AboutItem[] }
export interface AboutMode { label: string; sub: string }
interface AboutModel { summary: string; modes: AboutMode[]; topics: AboutTopic[] }

const ALL_LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];
const lvNo = (l: DifficultyLevel) => l.replace("level", "");
const levelsText = (have: DifficultyLevel[], all: DifficultyLevel[]) =>
  have.length === all.length ? "" : ` (Level${have.length > 1 ? "s" : ""} ${have.map(lvNo).join(", ")})`;
const optionLine = (o: { label: string; sub?: string }) => (o.sub ? `${o.label} ${o.sub}` : o.label).replace(/\*$/, "*");

/** One item per Question Option group of a sub-tool: its pools, switches and dropdown, with the levels each is offered at. */
export function describeOptions(entry: ToolEntry): AboutItem[] {
  const levels = entry.levels ?? ALL_LEVELS;
  type Row = { label: string; detail: string; levels: DifficultyLevel[] };
  const rows = new Map<string, Row>();
  const add = (id: string, label: string, detail: string, level: DifficultyLevel) => {
    const r = rows.get(id);
    if (r) { if (!r.levels.includes(level)) r.levels.push(level); } else rows.set(id, { label, detail, levels: [level] });
  };
  for (const level of levels) {
    const ds = entry.difficultySettings?.[level];
    const pools: ToolMultiSelect[] = normalizeMultiSelect(ds?.multiSelect ?? entry.multiSelect);
    for (const p of pools) {
      if (p.options.length < 2) continue;
      const opts = p.options.map(optionLine).join(" · ");
      add(`p:${p.key}:${opts}`, p.label, `${p.info ? p.info + " " : ""}${opts}.`, level);
    }
    for (const v of ds?.variables ?? entry.variables ?? []) add(`v:${v.key}`, v.label, (v as { info?: string }).info ?? "A switch.", level);
    const dd = ds?.dropdown ?? entry.dropdown;
    if (dd && dd.options.length > 1) add(`d:${dd.key}:${dd.options.map((o) => o.value).join(",")}`, dd.label, `${dd.options.map((o) => o.label).join(" · ")}.`, level);
  }
  return [...rows.values()].map((r) => ({ label: r.label + levelsText(r.levels, levels), detail: r.detail }));
}

const MODES_TITLES = /^(modes|how the modes differ)$/i;
const OPTIONS_TITLES = /^question options$/i;

/** The panel's content. `entry` (the current sub-tool) switches on the generated Question Options topic and drops the hand-written
 *  copies of it and of the modes; `modes` is the list the tool really has. */
export function buildAbout(opts: { infoSections: InfoSection[]; entry?: ToolEntry; modes?: AboutMode[] }): AboutModel {
  const { infoSections, entry, modes = [] } = opts;
  const overview = infoSections.flatMap((s) => s.content).find((i) => /^overview$/i.test(i.label)) ?? infoSections[0]?.content[0];
  const generated = entry ? describeOptions(entry) : [];
  const topics: AboutTopic[] = [];
  const handWritten = infoSections.filter((s) => !(modes.length && MODES_TITLES.test(s.title)) && !(generated.length && OPTIONS_TITLES.test(s.title)));
  // the section holding the overview becomes the summary, so it only appears as a topic when it says more than the overview
  for (const s of handWritten) {
    const items = s.content.filter((i) => i !== overview);
    if (items.length) topics.push({ id: `s:${s.title}`, title: s.title, icon: s.icon, items });
  }
  if (generated.length) topics.splice(Math.min(1, topics.length), 0, { id: "options", title: "Question Options", icon: "⚙️", items: generated });
  return { summary: overview?.detail ?? "", modes, topics };
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
