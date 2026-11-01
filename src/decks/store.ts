// Where a teacher's work is kept: on this device for now (localStorage). A built deck the teacher edits is saved
// as a whole copy under its own id ("Reset to original" removes it); a teacher's own decks and questions live
// beside them. Every read is guarded, so a private window or full storage falls back to the built decks.
import { mergeDecks, sameDeck } from "../../api/_deckMerge";
import { fetchDeck, fetchIndex, pushDeck, pushQuestion, pushRemoveDeck, setSyncHandler } from "./cloud";
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
  const deck = saved ? normaliseDeck(saved) : builtDeck(id);
  if (deck && !seen.has(id)) seen.set(id, deck);
  return deck;
};

// ── Sharing without overwriting: the base ──
// Two people can edit one deck (Harry here, Claude from the command line). A save carries the version it STARTED from (its base), and the
// server merges it into whatever is stored by slide and element (api/_deckMerge.ts). The base is the deck as last agreed with the shared
// copy: written whenever this device pulls a deck or a save is accepted. Before either has happened it is the first copy this page saw.
const BASE_KEY = (id: string) => `mt-deck-base:${id}`;
const seen = new Map<string, DeckDef>();
export const deckBase = (id: string): DeckDef | undefined => read<DeckDef | undefined>(BASE_KEY(id), undefined) ?? seen.get(id);
const setBase = (deck: DeckDef) => { write(BASE_KEY(deck.id), deck); };

type MergedListener = (merged: DeckDef, base: DeckDef) => void;
const listeners = new Map<string, Set<MergedListener>>();
/** The editor listens here: told when the shared copy holds changes that are not in what it is showing. */
export const onDeckMerged = (id: string, fn: MergedListener): (() => void) => {
  if (!listeners.has(id)) listeners.set(id, new Set());
  listeners.get(id)!.add(fn);
  return () => { listeners.get(id)?.delete(fn); };
};
/** Folds the shared copy's changes into `mine` (what is on screen), given the base both started from. */
export const mergeIn = (base: DeckDef, mine: DeckDef, shared: DeckDef): DeckDef => mergeDecks(base as never, mine as never, shared as never, "incoming").deck as unknown as DeckDef;
/** The editor takes the shared copy in: it becomes the new base. */
export const adoptShared = (deck: DeckDef) => setBase(deck);

setSyncHandler(({ sent, merged }) => {
  if (!merged) { setBase(sent); return; }
  setBase(merged);
  const open = listeners.get(sent.id);
  if (open && open.size) { open.forEach((fn) => fn(merged, sent)); return; }            // an editor is open: it adopts the merge itself
  const local = read<DeckDef | undefined>(DECK_KEY(sent.id), undefined);                // nobody is editing here: the merged deck is this device's copy
  if (local) saveVersion(local, "Before changes were merged in");
  write(DECK_KEY(sent.id), local && !sameDeck(local as never, sent as never) ? { ...mergeIn(sent, local, merged), updatedAt: merged.updatedAt } : merged);
});

/** Keeps the deck on this device; `share` (the default) also sends it to the teacher's other devices. */
export const saveDeck = (deck: DeckDef, share = true): boolean => {
  const stamped = share ? { ...deck, updatedAt: new Date().toISOString() } : deck;
  const ok = write(DECK_KEY(deck.id), stamped);
  if (ok && share) autoVersion(stamped);
  if (ok && !builtDeck(deck.id) && !myDeckIds().includes(deck.id)) write(MINE_KEY, [...myDeckIds(), deck.id]);
  if (share) {
    const base = deckBase(deck.id);
    if (!base || !sameDeck(base as never, stamped as never)) pushDeck(stamped, base);     // nothing new relative to the shared copy: nothing to send
  } else if (ok) setBase(deck);
  return ok;
};

// ── Versions ──
// A rolling history of a deck on this device, so a bad edit or a rebuild can be undone: a snapshot while editing (at most one every ten
// minutes), one before an update from another device replaces this copy, and one whenever "Save a version" is pressed. The last six stay.
const HIST_KEY = (id: string) => `mt-deck-history:${id}`;
const KEEP_VERSIONS = 6, AUTO_MINUTES = 10;
interface DeckVersion { at: string; note: string; deck: DeckDef }
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
