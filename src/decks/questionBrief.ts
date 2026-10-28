import type { QuestionBrief } from "../../api/_questionBrief";
import type { QuestionSlideDraft } from "./types";

export function defaultQuestionBrief(tool: string, level: QuestionBrief["solution"]["level"] = "level1"): QuestionBrief {
  return { count: 5, exclude: "", progression: "", examples: "", solution: { tool, sub: "", level } };
}
export function questionBriefText(context: QuestionSlideDraft, identity: string): string {
  const b = context.questionBrief;
  return [`Slide: ${identity}`, `Skill: ${context.title}`, `Teaching purpose: ${context.intent?.purpose || "Not yet specified"}`, `Question focus: ${context.intent?.questionFocus || "Not yet specified"}`, `Avoid: ${b?.exclude || "Not specified"}`, `Number of questions: ${b?.count ?? 5}`, `Variation / progression: ${b?.progression || "Not specified"}`, `Reference examples: ${b?.examples || "Not specified"}`, `Solution reference: ${b ? `${b.solution.tool} / ${b.solution.sub || "default sub-tool"} / ${b.solution.level}` : "Not yet specified"}`, "Author the complete set directly on this slide. Match the referenced generator’s solution method, labels, notation and reveal steps."].join("\n");
}
