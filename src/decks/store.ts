// Where a teacher's work is kept: on this device for now (localStorage). A built deck the teacher edits is saved
// as a whole copy under its own id ("Reset to original" removes it); a teacher's own decks and questions live
// beside them. Every read is guarded, so a private window or full storage falls back to the built decks.
import { BANK, DECKS } from "./index";
import type { BankQuestion, DeckDef } from "./types";

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
export const loadDeck = (id: string): DeckDef | undefined => read<DeckDef | undefined>(DECK_KEY(id), undefined) ?? builtDeck(id);

export const saveDeck = (deck: DeckDef): boolean => {
  const ok = write(DECK_KEY(deck.id), deck);
  if (ok && !builtDeck(deck.id) && !myDeckIds().includes(deck.id)) write(MINE_KEY, [...myDeckIds(), deck.id]);
  return ok;
};

/** A built deck: drop the saved copy. A teacher's own deck: delete it. */
export const resetDeck = (id: string) => {
  try { localStorage.removeItem(DECK_KEY(id)); } catch { /* ignore */ }
  if (!builtDeck(id)) write(MINE_KEY, myDeckIds().filter((x) => x !== id));
};

export const allDecks = (): { deck: DeckDef; mine: boolean; edited: boolean }[] => [
  ...DECKS.map((d) => ({ deck: loadDeck(d.id) ?? d, mine: false, edited: isEdited(d.id) })),
  ...myDeckIds().flatMap((id) => { const d = loadDeck(id); return d ? [{ deck: d, mine: true, edited: false }] : []; }),
];

export const newDeckId = () => `my-${Date.now().toString(36)}`;

// ── Questions ──
/** The teacher's questions: new ones, and their edited copies of built ones (same id). */
const myQuestions = (): Record<string, BankQuestion> => read<Record<string, BankQuestion>>(BANK_KEY, {});
export const bankQuestion = (id: string): BankQuestion | undefined => myQuestions()[id] ?? BANK.find((b) => b.id === id);
export const allQuestions = (): BankQuestion[] => {
  const mine = myQuestions();
  return [...BANK.map((b) => mine[b.id] ?? b), ...Object.values(mine).filter((q) => !BANK.some((b) => b.id === q.id))];
};
export const isEditedQuestion = (id: string) => id in myQuestions() && BANK.some((b) => b.id === id);
export const saveQuestion = (q: BankQuestion): boolean => write(BANK_KEY, { ...myQuestions(), [q.id]: q });
export const resetQuestion = (id: string) => { const m = myQuestions(); delete m[id]; write(BANK_KEY, m); };
export const newQuestionId = () => `my-q-${Date.now().toString(36)}`;
