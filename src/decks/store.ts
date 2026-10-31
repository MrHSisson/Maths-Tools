// Where a teacher's work is kept: on this device for now (localStorage). A built deck the teacher edits is saved
// as a whole copy under its own id ("Reset to original" removes it); a teacher's own decks and questions live
// beside them. Every read is guarded, so a private window or full storage falls back to the built decks.
import { fetchDeck, fetchIndex, pushDeck, pushQuestion, pushRemoveDeck } from "./cloud";
import { BANK, DECKS } from "./index";
import { normaliseDeck } from "./normalise";
import type { LibraryQuestion, DeckDef } from "./types";

const DECK_KEY = (id: string) => `mt-deck:${id}`;
const MINE_KEY = "mt-decks-mine";
const BANK_KEY = "mt-deck-bank";

const read = <T,>(key: string, fallback: T): T => {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
};
/** Returns false when the device refuses (storage full, private window). */
const write = (key: string, value: unknown): boolean => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

export const builtDeck = (id: string): DeckDef | undefined => DECKS.find((d) => d.id === id);
const myDeckIds = (): string[] => read<string[]>(MINE_KEY, []);
const isEdited = (id: string): boolean => { try { return localStorage.getItem(DECK_KEY(id)) !== null; } catch { return false; } };

/** The deck as this device sees it: the teacher's saved copy, else the built one. */
export const loadDeck = (id: string): DeckDef | undefined => {
  const saved = read<DeckDef | undefined>(DECK_KEY(id), undefined);
  return saved ? normaliseDeck(saved) : builtDeck(id);
};

/** Keeps the deck on this device; `share` (the default) also sends it to the teacher's other devices. */
export const saveDeck = (deck: DeckDef, share = true): boolean => {
  const stamped = share ? { ...deck, updatedAt: new Date().toISOString() } : deck;
  const ok = write(DECK_KEY(deck.id), stamped);
  if (ok && share) autoVersion(stamped);
  if (ok && !builtDeck(deck.id) && !myDeckIds().includes(deck.id)) write(MINE_KEY, [...myDeckIds(), deck.id]);
  if (share) pushDeck(stamped);
  return ok;
};

// ── Versions ──
// A rolling history of a deck on this device, so a bad edit or a rebuild can be undone: a snapshot while editing (at most one every ten
// minutes), one before an update from another device replaces this copy, and one whenever "Save a version" is pressed. The last six stay.
const HIST_KEY = (id: string) => `mt-deck-history:${id}`;
const KEEP_VERSIONS = 6, AUTO_MINUTES = 10;
export interface DeckVersion { at: string; note: string; deck: DeckDef }
export const deckVersions = (id: string): DeckVersion[] => read<DeckVersion[]>(HIST_KEY(id), []);
export function saveVersion(deck: DeckDef, note: string): boolean {
  let all = [...deckVersions(deck.id), { at: new Date().toISOString(), note, deck: structuredClone(deck) }].slice(-KEEP_VERSIONS);
  while (!write(HIST_KEY(deck.id), all)) { if (all.length <= 1) return false; all = all.slice(1); }   // storage full: keep fewer
  return true;
}
function autoVersion(deck: DeckDef) {
  const all = deckVersions(deck.id), last = all[all.length - 1];
  if (!last || Date.now() - Date.parse(last.at) > AUTO_MINUTES * 60000) saveVersion(deck, "While editing");
}

/** A built deck: drop the saved copy. A teacher's own deck: delete it. */
export const resetDeck = (id: string) => {
  try { localStorage.removeItem(DECK_KEY(id)); } catch { /* ignore */ }
  if (!builtDeck(id)) write(MINE_KEY, myDeckIds().filter((x) => x !== id));
  pushRemoveDeck(id);
};

export const allDecks = (): { deck: DeckDef; mine: boolean; edited: boolean }[] => [
  ...DECKS.map((d) => ({ deck: loadDeck(d.id) ?? d, mine: false, edited: isEdited(d.id) })),
  ...myDeckIds().flatMap((id) => { const d = loadDeck(id); return d ? [{ deck: d, mine: true, edited: false }] : []; }),
];

export const newDeckId = () => `my-${Date.now().toString(36)}`;

// ── Questions ──
/** The teacher's questions: new ones, and their edited copies of built ones (same id). */
const myQuestions = (): Record<string, LibraryQuestion> => read<Record<string, LibraryQuestion>>(BANK_KEY, {});
export const bankQuestion = (id: string): LibraryQuestion | undefined => myQuestions()[id] ?? BANK.find((b) => b.id === id);
export const saveQuestion = (q: LibraryQuestion): boolean => { const ok = write(BANK_KEY, { ...myQuestions(), [q.id]: q }); if (ok) pushQuestion(q); return ok; };

// ── Pulling from the teacher's other devices ──
/** Brings in every shared deck newer than this device's copy, and the shared questions. Resolves to whether anything
 *  changed (so a page can re-read), or false when sharing is not available. */
export async function syncFromCloud(onlyId?: string): Promise<boolean> {
  const snap = await fetchIndex();
  if (!snap) return false;
  let changed = false;
  const mine = myQuestions();
  // New library entries are immutable copies with unique ids. Keep unsent local copies on reconnect.
  const merged = { ...snap.questions, ...mine };
  if (JSON.stringify(merged) !== JSON.stringify(mine)) { write(BANK_KEY, merged); changed = true; }
  for (const [id, entry] of Object.entries(snap.index)) {
    if (onlyId && id !== onlyId) continue;
    const local = read<DeckDef | undefined>(DECK_KEY(id), undefined);
    if (local?.updatedAt && local.updatedAt >= entry.updatedAt) continue;
    const deck = await fetchDeck(id);
    if (deck) { if (local) saveVersion(local, "Before an update from another device"); saveDeck(deck, false); changed = true; }
  }
  return changed;
}
export const newQuestionId = () => `my-q-${Date.now().toString(36)}`;
