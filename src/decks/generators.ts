// The generator behind a practice question's backup: the SAME function the tool page uses (its `__test` export),
// loaded on demand, with the tool's TOOL_CONFIG so the editor can offer its Question Options.
import type { AnyQuestion, DifficultyLevel, ToolConfig } from "../shared";

type Generate = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdown: string, multiSelect?: Record<string, boolean>) => AnyQuestion;
type ToolModule = { __test: { generateQuestion: Generate; TOOL_CONFIG: ToolConfig } };
const LOADERS: Record<string, { name: string; load: () => Promise<ToolModule> }> = {
  estimation: { name: "Estimation", load: () => import("../tools/Number/Estimation") },
};

/** Tools a practice question can draw on (id → display name). */
export const GENERATOR_TOOLS: [string, string][] = Object.entries(LOADERS).map(([id, l]) => [id, l.name]);

export const loadGenerator = async (tool: string): Promise<Generate | null> => {
  const l = LOADERS[tool];
  return l ? (await l.load()).__test.generateQuestion : null;
};

/** The Question Options the tool offers at a level (pool label → its options), for the editor. */
export const loadOptions = async (tool: string, level: DifficultyLevel): Promise<{ label: string; options: { value: string; label: string }[] }[]> => {
  const l = LOADERS[tool];
  if (!l) return [];
  const cfg = (await l.load()).__test.TOOL_CONFIG;
  const first = Object.values(cfg.tools)[0];
  const raw = first?.difficultySettings?.[level]?.multiSelect ?? first?.multiSelect;
  const pools = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  return pools.map((p) => ({ label: p.label, options: p.options.map((o) => ({ value: o.value, label: o.label })) }));
};
