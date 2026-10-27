// The site's generators, wired into decks: every ToolShell question tool is loaded through its registry entry and
// its `__test` export (the SAME generateQuestion and TOOL_CONFIG the tool page uses), so a deck slide asks exactly
// what the tool would. Tools whose questions are pictures with their own print (customPrint) are left out: a deck
// draws questions as maths and words, not a tool's own pictures.
import { ALL_TOOLS } from "../registry";
import facts from "../generated/toolFacts.json";
import { replaySeeded } from "../shared/seededGenerate";
import type { AnyQuestion, DifficultyLevel, ToolConfig, ToolEntry } from "../shared";
import type { DepthItem } from "../shared/depth";
import type { GeneratorPreset } from "./types";

type Generate = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdown: string, multiSelect?: Record<string, boolean>) => AnyQuestion;
type ToolModule = { __test?: { generateQuestion: Generate; TOOL_CONFIG: ToolConfig; depthItems?: DepthItem[] } };

type Fact = { id: string; name: string; shell: string; kind: string; customPrint: boolean; category: string; group?: string };
/** Tools a deck can draw questions from, with the strand and group they sit under on the landing page. */
export const GENERATOR_TOOL_INFO: { id: string; name: string; category: string; group?: string }[] = ((facts as unknown as { tools: Fact[] }).tools)
  .filter((t) => t.shell === "ToolShell" && t.kind === "tool" && !t.customPrint)
  .map((t) => ({ id: t.id, name: t.name, category: t.category, group: t.group }));
/** The same list as (registry id, display name) pairs. */
export const GENERATOR_TOOLS: [string, string][] = GENERATOR_TOOL_INFO.map((t) => [t.id, t.name]);

const cache = new Map<string, Promise<ToolModule["__test"] | null>>();
const load = (tool: string) => {
  if (!cache.has(tool)) {
    const entry = ALL_TOOLS.find((t) => t.id === tool);
    cache.set(tool, entry ? entry.load().then((m) => (m as unknown as ToolModule).__test ?? null).catch(() => null) : Promise.resolve(null));
  }
  return cache.get(tool)!;
};

export const loadGenerator = async (tool: string): Promise<Generate | null> => (await load(tool))?.generateQuestion ?? null;
export const loadConfig = async (tool: string): Promise<ToolConfig | null> => (await load(tool))?.TOOL_CONFIG ?? null;
/** The tool's Depth bank (empty when it has none). */
export const loadDepthItems = async (tool: string): Promise<DepthItem[]> => (await load(tool))?.depthItems ?? [];

const pools = (raw: ToolEntry["multiSelect"] | undefined) => (raw ? (Array.isArray(raw) ? raw : [raw]) : []);

/** What the tool offers on a sub-tool at a level: its option pools, switches and dropdown (each level may override them). */
export function offered(cfg: ToolConfig, sub: string, level: DifficultyLevel) {
  const t = cfg.tools[sub] ?? Object.values(cfg.tools)[0];
  const lv = t?.difficultySettings?.[level];
  return { pools: pools(lv?.multiSelect ?? t?.multiSelect), variables: lv?.variables ?? t?.variables ?? [], dropdown: lv?.dropdown !== undefined ? lv.dropdown : t?.dropdown ?? null };
}

/** The preset filled in with the tool's own defaults wherever it says nothing, so a slide always asks a real question. */
function resolvePreset(cfg: ToolConfig, p: GeneratorPreset) {
  const sub = p.sub && cfg.tools[p.sub] ? p.sub : Object.keys(cfg.tools)[0];
  const o = offered(cfg, sub, p.level);
  const ms: Record<string, boolean> = {};
  for (const g of o.pools) for (const opt of g.options) ms[opt.value] = p.multiSelect && opt.value in p.multiSelect ? !!p.multiSelect[opt.value] : opt.defaultActive;
  const vars: Record<string, boolean> = {};
  for (const v of o.variables) vars[v.key] = p.variables && v.key in p.variables ? !!p.variables[v.key] : v.defaultValue;
  return { sub, level: p.level, multiSelect: ms, variables: vars, dropdown: p.dropdown ?? o.dropdown?.defaultValue ?? "" };
}

/** A question from the preset; with a seed, always the same one (a slide opens on a stable question). */
export async function generateFrom(tool: string, preset: GeneratorPreset, seed?: number): Promise<AnyQuestion | null> {
  const [gen, cfg] = [await loadGenerator(tool), await loadConfig(tool)];
  if (!gen || !cfg) return null;
  const r = resolvePreset(cfg, preset);
  const make = () => gen(r.sub, r.level, r.variables, r.dropdown, r.multiSelect);
  return seed === undefined ? make() : replaySeeded({ _seed: seed } as unknown as AnyQuestion, make);
}

/** `count` different questions (different keys), stable for a given seed. */
export async function generateSet(tool: string, preset: GeneratorPreset, count: number, seed: number): Promise<AnyQuestion[]> {
  const out: AnyQuestion[] = [];
  const keys = new Set<string>();
  for (let i = 0; out.length < count && i < count * 6; i++) {
    const q = await generateFrom(tool, preset, (seed + i * 7919) >>> 0);
    if (!q) break;
    if (keys.has(q.key)) continue;
    keys.add(q.key); out.push(q);
  }
  return out;
}

/** The instruction the tool puts above its questions on this sub-tool ("Estimate:", "Simplify:"), if any. */
export const instructionOf = (cfg: ToolConfig, sub?: string) => (cfg.tools[sub ?? ""] ?? Object.values(cfg.tools)[0])?.instruction ?? "";
