/** Question content and presentation are independent for fixed sets and live generators. */
export interface QuestionDisplaySettings {
  presentation?: "full" | "full-inverted" | "whiteboard" | "whiteboard-inverted";
  visualiser?: boolean;
}
export function isQuestionDisplaySettings(value: unknown): value is QuestionDisplaySettings {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (s.presentation === undefined || ["full", "full-inverted", "whiteboard", "whiteboard-inverted"].includes(s.presentation as string)) && (s.visualiser === undefined || typeof s.visualiser === "boolean");
}
