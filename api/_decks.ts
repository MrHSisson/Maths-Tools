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
const PITCHES = ["upper", "middle", "lower"];

export function checkDeck(input: unknown): { deck: { id: string; title: string; summary: string; strand?: string; pitch?: string; slides: unknown[]; updatedAt?: string }; body: string } | { error: string; status: number } {
  if (!input || typeof input !== "object") return { error: "deck is required", status: 400 };
  const d = input as Record<string, unknown>;
  if (!validId(d.id)) return { error: "deck.id must be lower-case letters, digits and hyphens", status: 400 };
  if (typeof d.title !== "string" || !Array.isArray(d.slides)) return { error: "deck needs a title and slides", status: 400 };
  const body = JSON.stringify(d);
  if (new TextEncoder().encode(body).length > MAX_DECK_BYTES) return { error: "This deck is too large to share (use smaller pictures)", status: 413 };
  for (const slide of d.slides) {
    if (!slide || typeof slide !== "object" || !Array.isArray((slide as Record<string, unknown>).els)) continue; // legacy decks
    const timer = (slide as Record<string, unknown>).timer;
    if (timer !== undefined && (!timer || typeof timer !== "object" || !Number.isInteger((timer as Record<string, unknown>).minutes) || ((timer as Record<string, number>).minutes < 1) || ((timer as Record<string, number>).minutes > 10) || ((timer as Record<string, unknown>).auto !== undefined && typeof (timer as Record<string, unknown>).auto !== "boolean"))) return { error: "A slide timer is invalid", status: 400 };
    const brief = (slide as Record<string, unknown>).brief;
    if (brief !== undefined && (typeof brief !== "string" || brief.length > 4000)) return { error: "A slide brief is invalid", status: 400 };
    // Older decks' four-part notes and brief form: still accepted, folded into `brief` when the deck is next edited.
    if ((slide as Record<string, unknown>).questionBrief !== undefined && !isQuestionBrief((slide as Record<string, unknown>).questionBrief)) return { error: "A slide question brief is invalid", status: 400 };
    const intent = (slide as Record<string, unknown>).intent;
    if (intent !== undefined && (!intent || typeof intent !== "object" || !["purpose", "questionFocus", "evidence", "next"].every((key) => typeof (intent as Record<string, unknown>)[key] === "string" && ((intent as Record<string, string>)[key].length <= 4000)))) return { error: "A slide teaching brief is invalid", status: 400 };
    for (const el of (slide as { els: Record<string, unknown>[] }).els) {
      if (el?.authored !== undefined && (el.kind !== "worksheet" || !Array.isArray(el.authored) || !el.authored.length || el.authored.length > 60 || !el.authored.every(q => isCuratedQuestion(q) && q.status === "ready" && q.rectilinear))) return { error: "An authored worksheet contains invalid shape questions", status: 400 };
      if ((el?.kind === "generator" || el?.kind === "questions") && !isQuestionDisplaySettings(el)) return { error: "A question slide layout is invalid", status: 400 };
      if (el && (el.kind === "questions" || (el.kind === "grid" && el.items !== undefined))) {
        if (!Array.isArray(el.items) || !el.items.every((q) => isCuratedQuestion(q) && (el.kind !== "grid" || q.format === "open"))) return { error: "A question activity contains invalid question content", status: 400 };
      }
    }
  }
  return { deck: { id: d.id, title: d.title, summary: typeof d.summary === "string" ? d.summary : "", ...(typeof d.strand === "string" && d.strand.length <= 40 ? { strand: d.strand } : {}), ...(typeof d.pitch === "string" && PITCHES.includes(d.pitch) ? { pitch: d.pitch } : {}), slides: d.slides, updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : undefined }, body };
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

// ── Published decks: a frozen copy anyone may play, separate from the working copy a teacher edits ──

/** `preview` is the deck's first slide, so the listing can show what the deck looks like without loading it. */
export interface PublishedEntry { title: string; summary: string; strand?: string; pitch?: string; slides: number; publishedAt: string; preview?: unknown }
const MAX_PREVIEW_CHARS = 30_000;               // a title slide is a few hundred; a big picture on it is left out of the listing
export interface PublishedIndex { version: 1; decks: Record<string, PublishedEntry> }
export const emptyPublished = (): PublishedIndex => ({ version: 1, decks: {} });
export const publishedPath = (id: string) => `published/${id}.json`;

/** The frozen copy: the deck as sent, stamped with when it was published. */
export const publishedBody = (body: string, now: string): string => JSON.stringify({ ...(JSON.parse(body) as Record<string, unknown>), publishedAt: now });

export function publishedWith(index: PublishedIndex, deck: { id: string; title: string; summary: string; strand?: string; pitch?: string; slides: unknown[] }, now: string): PublishedIndex {
  const first = deck.slides[0];
  const preview = first && JSON.stringify(first).length <= MAX_PREVIEW_CHARS ? first : undefined;
  return { version: 1, decks: { ...index.decks, [deck.id]: { title: deck.title.slice(0, 200), summary: deck.summary.slice(0, 500), ...(deck.strand ? { strand: deck.strand } : {}), ...(deck.pitch ? { pitch: deck.pitch } : {}), slides: deck.slides.length, publishedAt: now, ...(preview ? { preview } : {}) } } };
}
export function publishedWithout(index: PublishedIndex, id: string): PublishedIndex {
  const { [id]: _gone, ...rest } = index.decks;
  return { version: 1, decks: rest };
}

// ── Shared version history: a rollback for the live copy ──
// Before a burst of edits changes the stored deck, the deck as it stood is kept as a snapshot (history/<id>/<key>.json), listed in
// history/<id>/index.json. At most one snapshot every SNAPSHOT_GAP_MS, so typing does not fill the store, and only the latest MAX_SNAPSHOTS are kept.

export const SNAPSHOT_GAP_MS = 10 * 60 * 1000;
export const MAX_SNAPSHOTS = 40;
export interface HistoryEntry { key: string; at: string; savedAt: string; title: string; slides: number }
export interface DeckHistory { version: 1; entries: HistoryEntry[] }              // oldest first
export const emptyHistory = (): DeckHistory => ({ version: 1, entries: [] });
export const historyIndexPath = (id: string) => `history/${id}/index.json`;
export const snapshotPath = (id: string, key: string) => `history/${id}/${key}.json`;
export const validSnapshotKey = (key: unknown): key is string => typeof key === "string" && /^[0-9TZ-]{10,40}$/.test(key);
export const snapshotKey = (now: string) => now.replace(/[:.]/g, "-");

/** A new snapshot is due when there is none yet, or the newest is older than the gap. */
export function shouldSnapshot(h: DeckHistory, nowMs: number): boolean {
  const newest = h.entries[h.entries.length - 1];
  return !newest || nowMs - Date.parse(newest.at) >= SNAPSHOT_GAP_MS;
}

/** Adds an entry, returning the new history and the keys that fell off the end (their blobs are deleted). */
export function historyWith(h: DeckHistory, entry: HistoryEntry, max = MAX_SNAPSHOTS): { history: DeckHistory; dropped: string[] } {
  const all = [...h.entries.filter((e) => e.key !== entry.key), entry];
  const dropped = all.slice(0, Math.max(0, all.length - max)).map((e) => e.key);
  return { history: { version: 1, entries: all.slice(all.length - Math.min(max, all.length)) }, dropped };
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
