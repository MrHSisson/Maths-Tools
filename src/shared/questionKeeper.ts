import { useEffect, useRef, useState } from "react";
import { BASKET_MAX, decodeBasket, encodeBasket, loadBasket, type BasketItem } from "./decision/printBasket";
import {
  adoptLegacy, clearSaved, createList, currentList, deleteList, hasSaved, legacyKey, mergeSaved, removeSaved, renameList, savedId, selectList, toggleSaved,
  updateSaved, useSavedState, type SavedItem,
} from "./savedLists";

// ═══════════════════════════════════════════════════════════════════════════
// The question keeper — the last few questions you moved on from (this visit only) and the saved questions (the pins).
// A shell hands it a snapshot of what is on screen (an id that changes with each new question, a label for the menu and
// whatever state is needed to put it back); the keeper remembers the one it replaces (the history, at most MAX_KEPT).
// Saved questions are recipes (printBasket.ts: tab, level, options, seed) in the site-wide named lists of savedLists.ts, so they survive a
// reload, can mix tools, and are the very list the Decision print basket prints; a shell opts in with a `SavedAdapter`. Without one,
// pins stay in memory (capped at MAX_KEPT) as they always were.
// ═══════════════════════════════════════════════════════════════════════════

export const MAX_KEPT = 5;

export interface KeptQuestion<S> { id: string; label: string; state: S }

/** How a shell turns the question on screen into a saved recipe and back. Saving never regenerates anything; restoring runs the generator
 *  again from the seed, so every number the generator draws must come through `Math.random` (rule R45). */
interface SavedAdapter<S> {
  /** the page's name: shown beside its questions when a list is open on another tool, and the key of this page's old basket */
  pageTitle: string;
  /** the recipe for the question on screen, or null when it cannot be saved (no seed). Cheap: it is read on every render. */
  toRecipe: (state: S) => BasketItem | null;
  /** a short fingerprint of the question's content, to tell later whether the generator has changed under a saved recipe */
  fingerprint: (state: S) => string;
  /** the question rebuilt from a recipe, or null when it cannot be (a tool or option that no longer exists) */
  fromRecipe: (item: BasketItem) => S | null;
}

/** The current saved list as the print basket page works on it (the questions of every tool in the list). */
export interface SavedApi {
  items: SavedItem[];
  remove: (item: SavedItem) => void;
  clear: () => void;
  /** add questions from a link to the list (this page's); returns how many were new */
  merge: (items: BasketItem[]) => number;
}

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
  /** how many questions can be saved (in one list) */
  maxPins: number;
  currentId: string;
  isPinned: boolean;
  canPin: boolean;
  onPick: (id: string) => void;
  onPin: () => void;
  onUnpin: (id: string) => void;
  /** a short message after a restore that did not go as expected (the question could not be rebuilt, or has changed) */
  notice: string | null;
  /** the lists, with the current one open: set when the shell gave an adapter (saved questions are kept in named lists) */
  lists?: Array<{ id: string; name: string; count: number }>;
  currentListId?: string;
  currentListName?: string;
  onSelectList?: (id: string) => void;
  onCreateList?: (name: string) => void;
  onRenameList?: (name: string) => void;
  onDeleteList?: () => void;
  /** the current list, shared with the print basket (set when the shell gave an adapter) */
  saved?: SavedApi;
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
const NOTICE_MS = 6000;

/** `enabled` false (the phone start screens, where the question on screen was never shown) keeps the history untouched */
export function useQuestionKeeper<S>(current: KeptQuestion<S>, restore: (state: S) => void, enabled = true, adapter?: SavedAdapter<S>): QuestionKeeperMenu {
  const [history, setHistory] = useState<Array<KeptQuestion<S>>>([]);
  const [pins, setPins] = useState<Array<KeptQuestion<S>>>([]);
  const store = useSavedState();
  const [notice, setNotice] = useState<string | null>(null);
  const prev = useRef(current);

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

  const here = () => window.location.pathname;
  /** put a saved question back on screen; say so if it could not be rebuilt or no longer matches what was saved */
  const pickSaved = (item: BasketItem) => {
    if (!adapter) return;
    let rebuilt: S | null = null;
    try { rebuilt = adapter.fromRecipe(item); } catch { rebuilt = null; }
    if (!rebuilt) { setNotice("That question could not be rebuilt: the tool or one of its options has changed."); return; }
    if (item.fp && adapter.fingerprint(rebuilt) !== item.fp) setNotice("This question has changed since you saved it (the tool has been updated), so it may not look the same.");
    restore(rebuilt);
  };
  // once, when the page opens: this page's old basket (kept before there were lists) joins the current list, and a link from another tool's
  // list (`?pick=`) puts its question on screen
  useEffect(() => {
    if (!adapter) return;
    try {
      const old = loadBasket(legacyKey(adapter.pageTitle));
      if (old.length) { updateSaved((s) => adoptLegacy(s, old, here(), adapter.pageTitle)); window.localStorage.removeItem(legacyKey(adapter.pageTitle)); }
    } catch { /* storage blocked: nothing to bring over */ }
    const code = new URLSearchParams(window.location.search).get("pick");
    if (code) {
      const url = new URL(window.location.href);
      url.searchParams.delete("pick");
      window.history.replaceState(window.history.state, "", url.toString());
      const [item] = decodeBasket(code) ?? [];
      if (item) pickSaved(item); else setNotice("That link could not be read.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: runs once, when the page opens

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

  const list = currentList(store);
  const recipe = adapter.toRecipe(current.state);
  const asItem = (r: BasketItem, fp?: string): SavedItem => ({ ...r, page: here(), pageTitle: adapter.pageTitle, ...(fp ? { fp } : {}) });
  const isPinned = !!recipe && hasSaved(store, asItem(recipe));
  return {
    history: history.map(({ id, label }) => ({ id, label })),
    pins: list.items.map((i) => ({ id: savedId(i), label: i.page === here() ? i.preview : `${i.pageTitle} · ${i.preview}` })),
    maxPins: BASKET_MAX,
    currentId: current.id,
    isPinned,
    canPin: isPinned || (!!recipe && list.items.length < BASKET_MAX),
    onPick: (id) => {
      const saved = list.items.find((i) => savedId(i) === id);
      if (saved) {
        // a question from another tool: go to that page, which draws it
        if (saved.page !== here()) { window.location.href = `${saved.page}?pick=${encodeBasket([saved])}`; return; }
        pickSaved(saved);
        return;
      }
      const k = history.find((x) => x.id === id);
      if (k) restore(k.state);
    },
    onPin: () => { if (recipe) updateSaved((s) => toggleSaved(s, asItem(recipe, adapter.fingerprint(current.state)))); },
    onUnpin: (id) => { updateSaved((s) => removeSaved(s, id)); },
    notice,
    lists: store.lists.map((l) => ({ id: l.id, name: l.name, count: l.items.length })),
    currentListId: list.id,
    currentListName: list.name,
    onSelectList: (id) => { updateSaved((s) => selectList(s, id)); },
    onCreateList: (name) => { updateSaved((s) => createList(s, name)); },
    onRenameList: (name) => { updateSaved((s) => renameList(s, list.id, name)); },
    onDeleteList: () => { updateSaved((s) => deleteList(s, list.id)); },
    saved: {
      items: list.items,
      remove: (item) => { updateSaved((s) => removeSaved(s, savedId(item))); },
      clear: () => { updateSaved((s) => clearSaved(s)); },
      merge: (incoming) => {
        const before = currentList(store).items.length;
        const next = updateSaved((s) => mergeSaved(s, incoming.map((i) => ({ ...i, page: here(), pageTitle: adapter.pageTitle }))));
        return currentList(next).items.length - before;
      },
    },
  };
}
