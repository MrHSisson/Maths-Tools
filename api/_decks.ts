import { isQuestionDisplaySettings } from "./_questionDisplay.js";
import { isQuestionBrief } from "./_questionBrief.js";
import { isCuratedQuestion } from "./_questions.js";
// Shared decks — the pure half of /api/decks: checking what a teacher sends, and keeping the index of decks.
// A deck lives in its own private blob (decks/<id>.json); the index (decks-index.json) lists them, and the teacher's
// own and edited questions live in one blob (deck-questions.json). Kept free of @vercel/blob so it can be tested.

export const MAX_DECK_BYTES = 4_000_000;          // under the 4.5 MB request limit; pictures are the usual reason to hit it
const MAX_QUESTION_BYTES = 20_000;

export interface DeckIndexEntry { title: string; summary: string; slides: number; updatedAt: string; updatedBy: string }
export interface DeckIndex { version: 1; decks: Record<string, DeckIndexEntry> }
export interface QuestionStore { version: 1; questions: Record<string, unknown> }

export const emptyIndex = (): DeckIndex => ({ version: 1, decks: {} });
export const emptyQuestions = (): QuestionStore => ({ version: 1, questions: {} });

export const validId = (id: unknown): id is string => typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id);
export const deckPath = (id: string) => `decks/${id}.json`;

/** A deck must have a usable id, a title and a list of slides, and fit in one request. */
export function checkDeck(input: unknown): { deck: { id: string; title: string; summary: string; slides: unknown[]; updatedAt?: string }; body: string } | { error: string; status: number } {
  if (!input || typeof input !== "object") return { error: "deck is required", status: 400 };
  const d = input as Record<string, unknown>;
  if (!validId(d.id)) return { error: "deck.id must be lower-case letters, digits and hyphens", status: 400 };
  if (typeof d.title !== "string" || !Array.isArray(d.slides)) return { error: "deck needs a title and slides", status: 400 };
  const body = JSON.stringify(d);
  if (new TextEncoder().encode(body).length > MAX_DECK_BYTES) return { error: "This deck is too large to share (use smaller pictures)", status: 413 };
  for (const slide of d.slides) {
    if (!slide || typeof slide !== "object" || !Array.isArray((slide as Record<string, unknown>).els)) continue; // legacy decks
    if ((slide as Record<string, unknown>).questionBrief !== undefined && !isQuestionBrief((slide as Record<string, unknown>).questionBrief)) return { error: "A slide question brief is invalid", status: 400 };
    const intent = (slide as Record<string, unknown>).intent;
    if (intent !== undefined && (!intent || typeof intent !== "object" || !["purpose", "questionFocus", "evidence", "next"].every((key) => typeof (intent as Record<string, unknown>)[key] === "string" && ((intent as Record<string, string>)[key].length <= 4000)))) return { error: "A slide teaching brief is invalid", status: 400 };
    for (const el of (slide as { els: Record<string, unknown>[] }).els) {
      if ((el?.kind === "generator" || el?.kind === "questions") && !isQuestionDisplaySettings(el)) return { error: "A question slide layout is invalid", status: 400 };
      if (el && (el.kind === "questions" || (el.kind === "grid" && el.items !== undefined))) {
        if (!Array.isArray(el.items) || !el.items.every((q) => isCuratedQuestion(q) && (el.kind !== "grid" || q.format === "open"))) return { error: "A question activity contains invalid question content", status: 400 };
      }
    }
  }
  return { deck: { id: d.id, title: d.title, summary: typeof d.summary === "string" ? d.summary : "", slides: d.slides, updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : undefined }, body };
}

/** The entry keeps the deck's own `updatedAt` (stamped by the device that saved it), so a device that already has that
 *  copy can tell it needs nothing; `now` stands in for a deck sent without one. */
export function indexWith(index: DeckIndex, deck: { id: string; title: string; summary: string; slides: unknown[]; updatedAt?: string }, by: string, now: string): DeckIndex {
  return { version: 1, decks: { ...index.decks, [deck.id]: { title: deck.title.slice(0, 200), summary: deck.summary.slice(0, 500), slides: deck.slides.length, updatedAt: deck.updatedAt ?? now, updatedBy: by.slice(0, 40) || "unknown" } } };
}

export function indexWithout(index: DeckIndex, id: string): DeckIndex {
  const { [id]: _gone, ...rest } = index.decks;
  return { version: 1, decks: rest };
}

/** A question must have an id, its maths and an answer; anything larger than a question could be is refused. */
export function checkQuestion(input: unknown): { id: string; q: Record<string, unknown> } | null {
  if (!input || typeof input !== "object") return null;
  const q = input as Record<string, unknown>;
  if (q.version === 2) return isCuratedQuestion(q) && new TextEncoder().encode(JSON.stringify(q)).length <= MAX_QUESTION_BYTES ? { id: q.id, q } : null;
  if (!validId(q.id) || typeof q.latex !== "string" || typeof q.answer !== "string" || !Array.isArray(q.working)) return null;
  if (JSON.stringify(q).length > MAX_QUESTION_BYTES) return null;
  return { id: q.id, q };
}
