import { useEffect, useRef, useState } from "react";
import { BASKET_MAX, addItem, hasItem, itemKey, loadBasket, removeItem, saveBasket, type BasketItem } from "./decision/printBasket";

// ═══════════════════════════════════════════════════════════════════════════
// The question keeper — the last few questions you moved on from (this visit only) and the saved questions (the pins).
// A shell hands it a snapshot of what is on screen (an id that changes with each new question, a label for the menu and
// whatever state is needed to put it back); the keeper remembers the one it replaces (the history, at most MAX_KEPT).
// Saved questions are stored as recipes (printBasket.ts: tab, level, options, seed) under the page's storage key, so they survive a
// reload and are the very list the Decision print basket prints; a shell opts in with a `SavedAdapter`. Without one, pins stay in memory
// (capped at MAX_KEPT) as they always were.
// ═══════════════════════════════════════════════════════════════════════════

export const MAX_KEPT = 5;

export interface KeptQuestion<S> { id: string; label: string; state: S }

/** How a shell turns the question on screen into a saved recipe and back. Saving never regenerates anything; restoring runs the generator
 *  again from the seed, so every number the generator draws must come through `Math.random` (rule R45). */
interface SavedAdapter<S> {
  /** where the saved list lives in the browser (the page's own key) */
  key: string;
  /** the recipe for the question on screen, or null when it cannot be saved (no seed). Cheap: it is read on every render. */
  toRecipe: (state: S) => BasketItem | null;
  /** a short fingerprint of the question's content, to tell later whether the generator has changed under a saved recipe */
  fingerprint: (state: S) => string;
  /** the question rebuilt from a recipe, or null when it cannot be (a tool or option that no longer exists) */
  fromRecipe: (item: BasketItem) => S | null;
}

/** The saved list as the print basket shares it. */
export interface SavedList { items: BasketItem[]; setItems: (next: BasketItem[]) => void }

/** The print basket, where a shell has one (Decision tools): the toolbar control offers it beside the pin. */
export interface BasketAction {
  /** how many questions are saved */
  count: number;
  /** open the page that prints the saved questions */
  onOpen: () => void;
}

/** What the burger menu needs: ids and labels only, plus the actions. */
export interface QuestionKeeperMenu {
  history: Array<{ id: string; label: string }>;
  /** the saved questions (or, without an adapter, the pinned ones for this visit) */
  pins: Array<{ id: string; label: string }>;
  /** how many questions can be saved */
  maxPins: number;
  currentId: string;
  isPinned: boolean;
  canPin: boolean;
  onPick: (id: string) => void;
  onPin: () => void;
  onUnpin: (id: string) => void;
  /** a short message after a restore that did not go as expected (the question could not be rebuilt, or has changed) */
  notice: string | null;
  /** the saved list, shared with the print basket (set when the shell gave an adapter) */
  saved?: SavedList;
  /** set by a shell that has a print basket */
  basket?: BasketAction;
}

/** the history after `prev` has been replaced on screen by the question `currentId`: newest first, no repeats, never the current one, at most MAX_KEPT */
export function pushHistory<S>(history: Array<KeptQuestion<S>>, prev: KeptQuestion<S>, currentId: string): Array<KeptQuestion<S>> {
  return [prev, ...history.filter((x) => x.id !== prev.id && x.id !== currentId)].slice(0, MAX_KEPT);
}
/** pin the question if it is not pinned (while there is room), unpin it if it is */
export function togglePin<S>(pins: Array<KeptQuestion<S>>, current: KeptQuestion<S>): Array<KeptQuestion<S>> {
  return pins.some((x) => x.id === current.id) ? pins.filter((x) => x.id !== current.id) : pins.length < MAX_KEPT ? [...pins, current] : pins;
}
/** the saved list with `item` saved if it is not there (while there is room), removed if it is */
export function toggleSaved(items: BasketItem[], item: BasketItem): BasketItem[] {
  return hasItem(items, item) ? removeItem(items, item) : addItem(items, item);
}

const NOTICE_MS = 6000;

/** `enabled` false (the phone start screens, where the question on screen was never shown) keeps the history untouched */
export function useQuestionKeeper<S>(current: KeptQuestion<S>, restore: (state: S) => void, enabled = true, adapter?: SavedAdapter<S>): QuestionKeeperMenu {
  const [history, setHistory] = useState<Array<KeptQuestion<S>>>([]);
  const [pins, setPins] = useState<Array<KeptQuestion<S>>>([]);
  const [items, setItemsState] = useState<BasketItem[]>(() => (adapter ? loadBasket(adapter.key) : []));
  const [notice, setNotice] = useState<string | null>(null);
  const prev = useRef(current);
  const setItems = (next: BasketItem[]) => { setItemsState(next); if (adapter) saveBasket(adapter.key, next); };

  // a new question on screen: the one it replaced goes to the top of the history (most recent first, no repeats, never the current one)
  useEffect(() => {
    const p = prev.current;
    if (enabled && p.id !== current.id) setHistory((h) => pushHistory(h, p, current.id));
    prev.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate: only a change of question id counts as a new question
  }, [current.id, enabled]);

  // the message goes by itself
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [notice]);

  if (!adapter) {
    const isPinned = pins.some((x) => x.id === current.id);
    const find = (id: string) => pins.find((x) => x.id === id) ?? history.find((x) => x.id === id);
    return {
      history: history.map(({ id, label }) => ({ id, label })),
      pins: pins.map(({ id, label }) => ({ id, label })),
      maxPins: MAX_KEPT,
      currentId: current.id,
      isPinned,
      canPin: isPinned || pins.length < MAX_KEPT,
      onPick: (id) => { const k = find(id); if (k) restore(k.state); },
      onPin: () => setPins((ps) => togglePin(ps, current)),
      onUnpin: (id) => setPins((ps) => ps.filter((x) => x.id !== id)),
      notice: null,
    };
  }

  const recipe = adapter.toRecipe(current.state);
  const isPinned = !!recipe && hasItem(items, recipe);
  /** put a saved question back on screen; say so if it could not be rebuilt or no longer matches what was saved */
  const pickSaved = (item: BasketItem) => {
    let rebuilt: S | null = null;
    try { rebuilt = adapter.fromRecipe(item); } catch { rebuilt = null; }
    if (!rebuilt) { setNotice("That question could not be rebuilt: the tool or one of its options has changed."); return; }
    if (item.fp && adapter.fingerprint(rebuilt) !== item.fp) setNotice("This question has changed since you saved it (the tool has been updated), so it may not look the same.");
    restore(rebuilt);
  };
  return {
    history: history.map(({ id, label }) => ({ id, label })),
    pins: items.map((i) => ({ id: itemKey(i), label: i.preview })),
    maxPins: BASKET_MAX,
    currentId: current.id,
    isPinned,
    canPin: isPinned || (!!recipe && items.length < BASKET_MAX),
    onPick: (id) => {
      const saved = items.find((i) => itemKey(i) === id);
      if (saved) { pickSaved(saved); return; }
      const k = history.find((x) => x.id === id);
      if (k) restore(k.state);
    },
    onPin: () => { if (recipe) setItems(toggleSaved(items, { ...recipe, fp: adapter.fingerprint(current.state) })); },
    onUnpin: (id) => setItems(items.filter((i) => itemKey(i) !== id)),
    notice,
    saved: { items, setItems },
  };
}
