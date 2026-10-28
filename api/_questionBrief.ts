/** Portable slide authoring requirements. No dependency on the browser or question library. */
export interface QuestionBrief {
  count: number;
  exclude: string;
  progression: string;
  examples: string;
  solution: { tool: string; sub: string; level: "level1" | "level2" | "level3" };
}
export function isQuestionBrief(value: unknown): value is QuestionBrief {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>, s = b.solution as Record<string, unknown> | undefined;
  return Number.isSafeInteger(b.count) && Number(b.count) > 0 && [b.exclude, b.progression, b.examples].every((v) => typeof v === "string" && v.length <= 4000) && !!s && typeof s.tool === "string" && typeof s.sub === "string" && s.tool.length <= 200 && s.sub.length <= 200 && ["level1", "level2", "level3"].includes(s.level as string);
}
