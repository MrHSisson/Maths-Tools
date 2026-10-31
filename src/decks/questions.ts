import { feathersLine, type DepthItem } from "../shared/depth";
import { stripSkillMarkers } from "../shared/helpers";
import type { AnyQuestion } from "../shared";
import { pictureLine } from "./WorkedPicture";
import { MISCONCEPTIONS, misconceptionLabel } from "../shared/misconceptions";
import { loadDepthItems } from "./generators";
import type { BankQuestion, CuratedQuestion, DeckDef, DeckElement, LibraryQuestion } from "./types";

export const isDepthQuestion = (q: CuratedQuestion): boolean => !!q.depth || q.source?.kind === "depth";

export const questionId = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export const copyQuestion = (q: CuratedQuestion): CuratedQuestion => ({ ...structuredClone(q), id: questionId(), source: q.source ? { ...q.source } : undefined });
export const newQuestion = (tool = "estimation"): CuratedQuestion => ({ version: 2, id: questionId(), title: "", tool, level: "level1", purpose: "practice", format: "open", question: [], answer: [], explanation: [], rationale: "", expectedErrors: [], followUp: "", status: "draft" });

export function fromBank(q: BankQuestion): CuratedQuestion {
  const teaching = q.teaching;
  return { ...newQuestion(q.tool), id: q.id, title: q.title ?? (q.lines?.[0] || q.latex), level: q.level,
    question: q.lines?.length ? [...q.lines] : [`${q.tool === "estimation" ? "Estimate: " : ""}$${q.latex}$`],
    answer: [`$${q.tool === "estimation" ? "\\approx " : ""}${q.answer}$`],
    explanation: q.working.map((w) => `${w.label ? `${w.label} ` : ""}$${w.latex}$`),
    misconception: q.tag ? { id: q.tag, label: misconceptionLabel(q.tag) } : undefined,
    rationale: teaching?.rationale ?? "", expectedErrors: teaching?.expectedErrors ?? [], followUp: teaching?.followUp ?? "",
    status: teaching ? "ready" : "draft", source: { kind: "bank", id: q.id, tool: q.tool } };
}
/** A generated question as a fixed one, with the tool's own working: each step is a line, and a ratio table or bar model step keeps its picture. */
export function fromWorked(q: AnyQuestion, meta: { id: string; tool: string; level: CuratedQuestion["level"] }): CuratedQuestion {
  const lines = q.kind === "worded" ? [...q.lines] : [q.displayLatex ? `$${q.displayLatex}$` : q.display ?? ""];
  const line = (w: AnyQuestion["working"][number]) => w.type === "ratioTable" ? pictureLine(w.plain ?? "", "ratioTable", w.extra)
    : w.type === "fracBar" ? pictureLine(w.plain ?? "", "bar", w.extra)
    : w.type === "tStep" ? stripSkillMarkers(w.plain ?? "")
    : w.type === "mStep" ? `${stripSkillMarkers(w.label ?? "")} $${w.latex}$`.trim()
    : `$${w.latex}$`;
  return { ...newQuestion(meta.tool), id: meta.id, title: lines.join(" ").replace(/\$/g, "").slice(0, 100), level: meta.level, purpose: "practice", format: "open", status: "ready",
    question: lines, answer: [`$${q.answerLatex ?? q.answer}$`], explanation: q.working.map(line) };
}
export function fromDepth(tool: string, item: DepthItem): CuratedQuestion {
  const tags = [...new Set((item.options ?? []).flatMap((o) => o.tag ? [o.tag] : []))];
  const base = { ...newQuestion(tool), id: `depth-${item.id}`.replace(/[^a-z0-9-]/g, "-").slice(0, 80), title: item.title, level: item.level, purpose: item.purpose,
    question: [...(item.working?.intro ? [item.working.intro] : []), ...item.question],
    answer: item.answer.slice(0, 1), explanation: item.answer.slice(1),
    misconception: tags.length ? { id: tags[0], label: misconceptionLabel(tags[0]) } : undefined,
    relatedMisconceptions: tags.slice(1).map((id) => ({ id, label: misconceptionLabel(id) })),
    rationale: item.teacherNote ?? "", followUp: item.takeaway ?? "", expectedErrors: (item.options ?? []).filter((o) => !o.correct && o.misconception).map((o) => ({ response: o.text, reasoning: o.misconception! })),
    depth: { prompt: feathersLine(item, false), takeaway: feathersLine(item, true) },
    status: "ready" as const, source: { kind: "depth" as const, id: item.id, tool }, visual: item.visual ? { tool, item: item.id } : undefined };
  const finish = (q: CuratedQuestion): CuratedQuestion => ({ ...q, status: readyProblems(q).length ? "draft" : "ready" });
  const options = item.options?.map((o) => ({ text: o.text, correct: !!o.correct, reasoning: o.misconception ?? "" }));
  if (item.working) return finish({ ...base, format: "error", lines: [...item.working.lines], wrongLine: item.working.wrongLine });
  if (item.speakers) return finish({ ...base, format: "claims", claims: item.speakers.map((s) => ({ name: s.name, text: s.says.join("\n") })), options: options ?? [] });
  if (options?.length) return finish({ ...base, format: "choice", options });
  return finish({ ...base, format: "open" });
}
const asCurated = (q: LibraryQuestion): CuratedQuestion => "version" in q ? structuredClone(q) : fromBank(q);
const missingQuestion = (id: string, tool = "estimation"): CuratedQuestion => ({ ...newQuestion(tool), title: `Missing question: ${id}`, missing: id, question: [`Question ${id} could not be found. Replace it in Questions.`] });
export function legacyItems(el: Extract<DeckElement, { kind: "practice" | "grid" }>, lookup: (id: string) => LibraryQuestion | undefined): CuratedQuestion[] {
  if (el.kind === "grid" && el.items !== undefined) return el.items;
  return el.bank.map((id) => { const q = lookup(id); return q ? asCurated(q) : missingQuestion(id, el.kind === "practice" ? el.tool : undefined); });
}
/** Only used on an explicit edit/save/export, never writes to a bank or changes source definitions. */
export async function materializeDeck(deck: DeckDef, lookup: (id: string) => LibraryQuestion | undefined): Promise<DeckDef> {
  return { ...deck, questionVersion: 2, slides: await Promise.all(deck.slides.map(async (s) => ({ ...s, els: await Promise.all(s.els.map(async (el): Promise<DeckElement> => {
    if (el.kind === "practice") return { id: el.id, kind: "questions", x: el.x, y: el.y, w: el.w, h: el.h, step: el.step, size: el.size ? Math.max(30, Math.round(el.size * 46 / 120)) : 46, items: legacyItems(el, lookup) };
    if (el.kind === "grid") return { ...el, items: structuredClone(legacyItems(el, lookup)) };
    if (el.kind === "questions") return { ...structuredClone(el), ...(s.family === "depth" || el.items.some(isDepthQuestion) ? { presentation: "full" as const, visualiser: false } : {}), items: await Promise.all(el.items.map(async (q) => {
      if (q.depth || q.source?.kind !== "depth") return structuredClone(q);
      try {
        const item = (await loadDepthItems(q.source.tool)).find((i) => i.id === q.source!.id);
        return item ? { ...structuredClone(q), depth: { prompt: feathersLine(item, false), takeaway: feathersLine(item, true) } } : structuredClone(q);
      } catch { return structuredClone(q); } // Missing old artwork does not block the teacher’s saved content.
    })) };
    return structuredClone(el);
  })) }))) };
}
export function readyProblems(q: CuratedQuestion): string[] {
  const errors: string[] = [];
  if (!q.title.trim()) errors.push("Give the question a title.");
  if (!q.question.some((s) => s.trim())) errors.push("Add the student-facing question.");
  if (!q.answer.some((s) => s.trim())) errors.push("Add an answer.");
  if (q.missing) errors.push("Replace the missing question.");
  if ((q.format === "choice" || (q.format === "claims" && q.options.length > 0)) && (q.options.length < 2 || !q.options.some((o) => o.correct) || q.options.some((o) => !o.text.trim()))) errors.push("Add at least two choices and mark the correct answer(s).");
  if (q.format === "claims" && (!q.claims.length || q.claims.some((c) => !c.name.trim() || !c.text.trim()))) errors.push("Complete the students’ claims.");
  if (q.format === "error" && (!q.lines.length || q.wrongLine < 0 || q.wrongLine >= q.lines.length || q.lines.some((s) => !s.trim()))) errors.push("Add the worked lines and select the first error.");
  return errors;
}
export const misconceptionChoices = (questions: CuratedQuestion[]) => [...new Map([...Object.entries(MISCONCEPTIONS).map(([id, m]) => [id, m.label] as const), ...questions.flatMap((q) => [...(q.misconception ? [q.misconception] : []), ...(q.relatedMisconceptions ?? [])].map((m) => [m.id, m.label] as const))]).entries()];

/** A deck question written in the Depth shape (claims, choices, or worked lines with a mistake) as a Depth item, so it is drawn by
 *  the same slide as a Depth card from the bank. The inverse of `fromDepth`, for questions authored in the deck. */
export function asDepthItem(q: CuratedQuestion): DepthItem {
  const options = q.format === "choice" || q.format === "claims" ? q.options.map((o) => ({ text: o.text, correct: o.correct || undefined, misconception: o.correct ? undefined : o.reasoning || "A tempting wrong answer" })) : undefined;
  const lines = q.question.filter((l) => l.trim());
  const working = q.format === "error" ? { intro: lines.length > 1 ? lines[0] : undefined, lines: q.lines, wrongLine: q.wrongLine } : undefined;
  return {
    id: q.id, level: q.level, purpose: q.purpose === "practice" ? "diagnose" : q.purpose, title: q.title,
    question: working ? (lines.length > 1 ? lines.slice(1) : ["Tap the first line that is wrong."]) : lines,
    speakers: q.format === "claims" ? q.claims.map((c) => ({ name: c.name, says: c.text.split("\n") })) : undefined,
    working, options: options?.length ? options : undefined,
    answer: [...q.answer.filter((l) => l.trim()), ...q.explanation],
    prompt: q.depth?.prompt, takeaway: q.depth?.takeaway, teacherNote: q.rationale || undefined,
  };
}
