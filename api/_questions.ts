// Serializable authored questions. Shared by the browser and the API; never import React or src here.
type QuestionBase = {
  version: 2; id: string; title: string; tool: string; level: "level1" | "level2" | "level3";
  purpose: "practice" | "diagnose" | "explain" | "extend";
  question: string[]; answer: string[]; explanation: string[];
  misconception?: { id: string; label: string };
  relatedMisconceptions?: { id: string; label: string }[];
  rationale: string; expectedErrors: { response: string; reasoning: string }[]; followUp: string;
  status: "draft" | "ready";
  source?: { kind: "bank" | "depth" | "library"; id: string; tool: string; /** a Depth card changed in the deck: kept as the deck's own copy, not turned back into a reference to the bank */ edited?: boolean };
  visual?: { tool: string; item: string };
  depth?: { prompt: string; takeaway: string };
  missing?: string;
};
export type CuratedQuestion = QuestionBase & (
  | { format: "open" }
  | { format: "choice"; options: { text: string; correct: boolean; reasoning: string }[] }
  | { format: "claims"; claims: { name: string; text: string }[]; options: { text: string; correct: boolean; reasoning: string }[] }
  | { format: "error"; lines: string[]; wrongLine: number }
);
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === "string");
const textFields = (v: unknown, keys: string[]) => record(v) && keys.every((key) => typeof v[key] === "string");
export function isCuratedQuestion(q: unknown): q is CuratedQuestion {
  if (!record(q) || q.version !== 2 || !textFields(q, ["id", "title", "tool", "rationale", "followUp"])) return false;
  if (!/^[a-z0-9-]{1,80}$/.test(q.id as string) || !["level1", "level2", "level3"].includes(q.level as string) || !["practice", "diagnose", "explain", "extend"].includes(q.purpose as string) || !["draft", "ready"].includes(q.status as string)) return false;
  if (![q.question, q.answer, q.explanation].every(strings) || !Array.isArray(q.expectedErrors) || !q.expectedErrors.every((e) => textFields(e, ["response", "reasoning"]))) return false;
  if (q.misconception !== undefined && !textFields(q.misconception, ["id", "label"])) return false;
  if (q.relatedMisconceptions !== undefined && (!Array.isArray(q.relatedMisconceptions) || !q.relatedMisconceptions.every((m) => textFields(m, ["id", "label"])))) return false;
  if (q.source !== undefined && (!textFields(q.source, ["id", "tool", "kind"]) || !["bank", "depth", "library"].includes((q.source as Record<string, string>).kind) || ((q.source as Record<string, unknown>).edited !== undefined && typeof (q.source as Record<string, unknown>).edited !== "boolean"))) return false;
  if (q.depth !== undefined && !textFields(q.depth, ["prompt", "takeaway"])) return false;
  if (q.visual !== undefined && !textFields(q.visual, ["tool", "item"])) return false;
  if (q.missing !== undefined && typeof q.missing !== "string") return false;
  if (q.format === "error" && (!strings(q.lines) || !Number.isInteger(q.wrongLine) || Number(q.wrongLine) < 0 || (Number(q.wrongLine) >= q.lines.length && !(q.status === "draft" && q.lines.length === 0 && q.wrongLine === 0)))) return false;
  if (q.format === "choice" || q.format === "claims") {
    if (!Array.isArray(q.options) || (q.status === "ready" && q.options.length < 2 && !(q.format === "claims" && q.options.length === 0)) || !q.options.every((o) => textFields(o, ["text", "reasoning"]) && record(o) && typeof o.correct === "boolean") || (q.status === "ready" && q.options.length > 0 && !q.options.some((o) => o.correct))) return false;
    if (q.format === "claims" && (!Array.isArray(q.claims) || (q.status === "ready" && !q.claims.length) || !q.claims.every((c) => textFields(c, ["name", "text"])))) return false;
  }
  if (q.status === "ready" && (!(q.title as string).trim() || !(q.question as string[]).some((s) => s.trim()) || !(q.answer as string[]).some((s) => s.trim()) || q.missing)) return false;
  if (q.status === "ready" && (q.format === "choice" || q.format === "claims") && (q.options as { text: string }[]).some((o) => !o.text.trim())) return false;
  if (q.status === "ready" && q.format === "claims" && (q.claims as { name: string; text: string }[]).some((c) => !c.name.trim() || !c.text.trim())) return false;
  if (q.status === "ready" && q.format === "error" && (!(q.lines as string[]).length || (q.lines as string[]).some((s) => !s.trim()))) return false;
  return ["open", "choice", "claims", "error"].includes(q.format as string);
}
