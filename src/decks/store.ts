// Where a teacher's work is kept: the shared copy (cloud) is the master and this device keeps what it has opened (localStorage, one whole
// copy per deck under its own id). Decks are not bundled into the app, so a deck a device has never synced is not listed until it does
// (syncFromCloud). Every read is guarded, so a private window or full storage just means nothing is kept here.
import { mergeDecks, sameDeck } from "../../api/_deckMerge";
import type { DeckIndexEntry } from "../../api/_decks";
import { fetchDeck, fetchIndex, pushDeck, pushQuestion, pushRemoveDeck, setSyncHandler } from "./cloud";
import { BANK } from "./index";
import { normaliseDeck } from "./normalise";
import type { LibraryQuestion, DeckDef, Pitch, Slide } from "./types";

const DECK_KEY = (id: string) => `mt-deck:${id}`;
const MINE_KEY = "mt-decks-mine";
const BANK_KEY = "mt-deck-bank";

const read = <T,>(key: string, fallback: T): T => {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
};
const trySet = (key: string, json: string): boolean => { try { localStorage.setItem(key, json); return true; } catch { return false; } };
const keysWith = (prefix: string): string[] => {
  const out: string[] = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(prefix)) out.push(k); } } catch { /* ignore */ }
  return out;
};
const drop = (keys: string[]) => { for (const k of keys) { try { localStorage.removeItem(k); } catch { /* ignore */ } } };
/** A base copy is safe to drop when it is not holding unsent work: there is none, or this device's deck is the same as it (so it can be fetched again). */
const baseDroppable = (baseKey: string): boolean => {
  const id = baseKey.slice("mt-deck-base:".length);
  const base = read<DeckDef | undefined>(baseKey, undefined), local = read<DeckDef | undefined>(DECK_KEY(id), undefined);
  return !base || !local || sameDeck(base as never, local as never);
};
/** Returns false when the device refuses (storage full, private window). When it is full and the write is a deck (or its versions or base), space is
 *  freed and the write retried: first the saved versions of the other decks, then the base copies of other decks that hold no unsent work, then this
 *  deck's own older versions. The deck itself is never dropped, and a small bookkeeping write (a timestamp, the list of decks) frees nothing. */
const write = (key: string, value: unknown): boolean => {
  let json: string;
  try { json = JSON.stringify(value); } catch { return false; }
  if (trySet(key, json)) return true;
  if (!/^mt-deck(-base|-history)?:/.test(key)) return false;
  const own = key.slice(key.indexOf(":") + 1);
  const other = (k: string) => k !== key && k.slice(k.indexOf(":") + 1) !== own;
  const steps: (() => string[])[] = [
    () => keysWith("mt-deck-history:").filter(other),
    () => keysWith("mt-deck-base:").filter(other).filter(baseDroppable),
    () => keysWith("mt-deck-history:").filter((k) => k !== key),
  ];
  for (const step of steps) { const keys = step(); if (!keys.length) continue; drop(keys); if (trySet(key, json)) return true; }
  return false;
};

/** Every deck this device holds: the listed ones plus any saved copy (a deck once bundled and edited here has a copy but no list entry). */
const holds = (id: string): boolean => { try { return localStorage.getItem(DECK_KEY(id)) !== null; } catch { return false; } };
const myDeckIds = (): string[] => {
  const ids = new Set(read<string[]>(MINE_KEY, []));
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith("mt-deck:")) ids.add(k.slice("mt-deck:".length)); } } catch { /* ignore */ }
  return [...ids];
};

/** The deck as this device holds it (the last copy synced or saved here), or undefined. */
export const loadDeck = (id: string): DeckDef | undefined => {
  const saved = read<DeckDef | undefined>(DECK_KEY(id), undefined);
  const deck = saved ? normaliseDeck(saved) : undefined;
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
  if (ok) touch(deck.id);
  if (ok && share) autoVersion(stamped);
  if (ok && !read<string[]>(MINE_KEY, []).includes(deck.id)) write(MINE_KEY, [...read<string[]>(MINE_KEY, []), deck.id]);
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

/** Delete a deck: this device's copy, and the shared copy (so it goes from every device that syncs next). */
export const deleteDeck = (id: string) => {
  try { localStorage.removeItem(DECK_KEY(id)); } catch { /* ignore */ }
  write(MINE_KEY, read<string[]>(MINE_KEY, []).filter((x) => x !== id));
  pushRemoveDeck(id);
};

/** The decks this device holds whole (not every deck: see `deckSummaries`). */
export const allDecks = (): { deck: DeckDef; mine: boolean; edited: boolean }[] =>
  myDeckIds().flatMap((id) => { const d = loadDeck(id); return d ? [{ deck: d, mine: true, edited: false }] : []; });

// ── The deck list: summaries, not decks ──
// The shared copy's list (title, where filed, tool, slides by kind, first slide) is all a list needs, so the device does not download every
// deck (together they are megabytes, and a full device once stopped decks being saved). A deck is fetched when it is opened, and the device keeps
// only the few opened or saved most recently (`trimDevice`).
let lastIndex: Record<string, DeckIndexEntry> | null = null;

export interface DeckSummary { id: string; title: string; summary: string; strand?: string; pitch?: Pitch; tool?: string; toolPath?: string; slides: number; families: Record<string, number>; updatedAt?: string; preview?: Slide; /** this device holds the whole deck */ held: boolean; edited: boolean }

const familiesOf = (d: DeckDef): Record<string, number> => { const out: Record<string, number> = {}; for (const s of d.slides) if (s.family) out[s.family] = (out[s.family] ?? 0) + 1; return out; };

/** Every deck there is: the shared list (when it has been read this visit) with this device's copies laid over it where they are newer or not shared yet. */
export const deckSummaries = (): DeckSummary[] => {
  const out = new Map<string, DeckSummary>();
  for (const [id, e] of Object.entries(lastIndex ?? {})) out.set(id, { id, title: e.title, summary: e.summary, strand: e.strand, pitch: e.pitch as Pitch | undefined, tool: e.tool, toolPath: e.toolPath, slides: e.slides, families: e.families ?? {}, updatedAt: e.updatedAt, preview: e.preview as Slide | undefined, held: false, edited: false });
  for (const id of myDeckIds()) {
    const d = loadDeck(id);
    if (!d) continue;
    const shared = out.get(id);
    if (shared && d.updatedAt && d.updatedAt < (shared.updatedAt ?? "")) { shared.held = true; continue; }      // the shared copy is newer: list that
    out.set(id, { id, title: d.title, summary: d.summary, strand: d.strand, pitch: d.pitch, tool: d.tool, toolPath: d.toolPath, slides: d.slides.length, families: familiesOf(d), updatedAt: d.updatedAt, preview: d.slides[0], held: true, edited: false });
  }
  return [...out.values()];
};

/** The decks for a tool's page (listed in its menu). */
export const decksForPath = (path: string): DeckSummary[] => deckSummaries().filter((d) => d.toolPath === path);

/** The deck whole: this device's copy, or the shared one fetched now. Undefined when it cannot be had (offline, or it does not exist). */
export const ensureDeck = async (id: string): Promise<DeckDef | undefined> => loadDeck(id) ?? (await syncFromCloud(id), loadDeck(id));

// ── Keeping the device small ──
const USED_KEY = "mt-deck-used";
const KEEP_LOCAL = 8;
const touch = (id: string) => { write(USED_KEY, { ...read<Record<string, number>>(USED_KEY, {}), [id]: Date.now() }); };

/** Drops the copies of the least recently used decks beyond KEEP_LOCAL (with their saved versions and base), never `keep`, and only a deck the shared copy has at least as new, so no unsent work is lost. */
function trimDevice(keep: string) {
  if (!lastIndex) return;
  const all = myDeckIds();
  const held = all.filter((id) => id !== keep);
  const over = all.length - KEEP_LOCAL;
  if (over <= 0) return;
  const used = read<Record<string, number>>(USED_KEY, {});
  // safe = the shared copy is at least as new AND this device's copy is the same as the base it last agreed with the shared copy (no unsent edit; an unknown base is not safe)
  const safe = held.filter((id) => {
    const e = lastIndex![id], l = read<DeckDef | undefined>(DECK_KEY(id), undefined), b = read<DeckDef | undefined>(BASE_KEY(id), undefined);
    return !!e && !!l && !!b && (l.updatedAt ?? "") <= e.updatedAt && sameDeck(b as never, l as never);
  });
  const drop = safe.sort((a, b) => (used[a] ?? 0) - (used[b] ?? 0)).slice(0, over);
  if (!drop.length) return;
  drop.forEach((id) => { try { for (const k of [DECK_KEY(id), BASE_KEY(id), HIST_KEY(id)]) localStorage.removeItem(k); } catch { /* ignore */ } seen.delete(id); });
  write(MINE_KEY, read<string[]>(MINE_KEY, []).filter((x) => !drop.includes(x)));
}

export const newDeckId = () => `my-${Date.now().toString(36)}`;

// ── Questions ──
/** The teacher's questions: new ones, and their edited copies of built ones (same id). */
const myQuestions = (): Record<string, LibraryQuestion> => read<Record<string, LibraryQuestion>>(BANK_KEY, {});
export const bankQuestion = (id: string): LibraryQuestion | undefined => myQuestions()[id] ?? BANK.find((b) => b.id === id);
export const saveQuestion = (q: LibraryQuestion): boolean => { const ok = write(BANK_KEY, { ...myQuestions(), [q.id]: q }); if (ok) pushQuestion(q); return ok; };

// ── Pulling from the teacher's other devices ──
/** Brings in every shared deck newer than this device's copy, and the shared questions. Resolves to whether anything
 *  changed (so a page can re-read), or false when sharing is not available. */
export const syncFromCloud = async (onlyId?: string): Promise<boolean> => (await syncDecks(onlyId))?.changed ?? false;

/** The deck list's "Check for changes" button: every deck. Resolves to the titles of the decks that were updated and of those that could not be
 *  kept on this device (storage full), or null when sharing is not available. */
export const syncAllDecks = async (): Promise<{ updated: string[]; failed: string[] } | null> => { const r = await syncDecks(); return r ? { updated: r.updated, failed: r.failed } : null; };

async function syncDecks(onlyId?: string): Promise<{ changed: boolean; updated: string[]; failed: string[] } | null> {
  const snap = await fetchIndex();
  if (!snap) return null;
  lastIndex = snap.index;
  if (onlyId) touch(onlyId);
  let changed = false;
  const updated: string[] = [], failed: string[] = [];
  const mine = myQuestions();
  // New library entries are immutable copies with unique ids. Keep unsent local copies on reconnect.
  const merged = { ...snap.questions, ...mine };
  if (JSON.stringify(merged) !== JSON.stringify(mine)) { write(BANK_KEY, merged); changed = true; }
  for (const [id, entry] of Object.entries(snap.index)) {
    if (onlyId ? id !== onlyId : !holds(id)) continue;       // opening one deck fetches it; a whole-list check only refreshes the decks this device already holds
    const local = read<DeckDef | undefined>(DECK_KEY(id), undefined);
    if (local?.updatedAt && local.updatedAt >= entry.updatedAt) continue;
    const deck = await fetchDeck(id);
    if (!deck) continue;
    if (local) saveVersion(local, "Before an update from another device");
    if (saveDeck(deck, false)) { changed = true; updated.push(deck.title); } else failed.push(deck.title);   // storage full even after freeing space: say so, never "Updated"
  }
  trimDevice(onlyId ?? "");
  return { changed, updated, failed };
}
export const newQuestionId = () => `my-q-${Date.now().toString(36)}`;
