import { useSyncExternalStore } from "react";
import { BASKET_MAX, isBasketItem, itemKey, type BasketItem } from "./decision/printBasket";

// ═══════════════════════════════════════════════════════════════════════════
// Saved lists — the questions a teacher keeps to come back to, in named lists that can mix tools ("Year 10 Tuesday" can hold an Indices
// question, a Surds question and a Critical Path one). One store for the whole site, kept in the browser (`mt-saved-lists`).
// A saved question is a recipe (printBasket.ts: tab, level, options, seed) plus the page it came from, so it can be drawn again on that
// page: picking one from another tool takes you there. Pure functions below; the store at the end holds the state, persists it and lets
// every control on the page (the pin panel, the burger menu, the print page) read the same list.
// ═══════════════════════════════════════════════════════════════════════════

/** a saved question: its recipe and the tool page it belongs to (`page` the path, `pageTitle` its name for the list) */
export interface SavedItem extends BasketItem { page: string; pageTitle: string }
interface SavedList { id: string; name: string; items: SavedItem[] }
interface SavedState { current: string; lists: SavedList[] }

const DEFAULT_LIST_NAME = "Saved";
export const MAX_LISTS = 20;
const MAX_NAME = 40;
const KEY = "mt-saved-lists";

/** what makes two saved questions the same one: the page, then the recipe */
export const savedId = (i: SavedItem): string => `${i.page}|${itemKey(i)}`;

const newId = (): string => `l${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const cleanName = (n: string): string => n.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);

export function emptyState(): SavedState {
  const id = newId();
  return { current: id, lists: [{ id, name: DEFAULT_LIST_NAME, items: [] }] };
}

export const currentList = (s: SavedState): SavedList => s.lists.find((l) => l.id === s.current) ?? s.lists[0];
const mapCurrent = (s: SavedState, fn: (items: SavedItem[]) => SavedItem[]): SavedState => ({ ...s, lists: s.lists.map((l) => (l.id === currentList(s).id ? { ...l, items: fn(l.items) } : l)) });

// ── the current list ──
export const hasSaved = (s: SavedState, item: SavedItem): boolean => currentList(s).items.some((x) => savedId(x) === savedId(item));
/** `item` saved to the current list if it is not there (while there is room), removed if it is */
export function toggleSaved(s: SavedState, item: SavedItem): SavedState {
  return mapCurrent(s, (items) => (items.some((x) => savedId(x) === savedId(item)) ? items.filter((x) => savedId(x) !== savedId(item)) : items.length < BASKET_MAX ? [...items, item] : items));
}
export const removeSaved = (s: SavedState, id: string): SavedState => mapCurrent(s, (items) => items.filter((x) => savedId(x) !== id));
export const clearSaved = (s: SavedState): SavedState => mapCurrent(s, () => []);
/** `incoming` added after the current list's questions (a shared link): nothing twice, nothing past the cap */
export function mergeSaved(s: SavedState, incoming: SavedItem[]): SavedState {
  return mapCurrent(s, (items) => incoming.reduce((acc, i) => (acc.length < BASKET_MAX && !acc.some((x) => savedId(x) === savedId(i)) ? [...acc, i] : acc), items));
}

// ── the lists ──
/** a new list with `name` (made the current one); a blank name or too many lists changes nothing */
export function createList(s: SavedState, name: string): SavedState {
  const n = cleanName(name);
  if (!n || s.lists.length >= MAX_LISTS) return s;
  const id = newId();
  return { current: id, lists: [...s.lists, { id, name: n, items: [] }] };
}
export const renameList = (s: SavedState, id: string, name: string): SavedState => {
  const n = cleanName(name);
  return n ? { ...s, lists: s.lists.map((l) => (l.id === id ? { ...l, name: n } : l)) } : s;
};
export const selectList = (s: SavedState, id: string): SavedState => (s.lists.some((l) => l.id === id) ? { ...s, current: id } : s);
/** a list removed with its questions; there is always at least one list, so the last one cannot go */
export function deleteList(s: SavedState, id: string): SavedState {
  if (s.lists.length <= 1) return s;
  const lists = s.lists.filter((l) => l.id !== id);
  return { current: s.current === id ? lists[0].id : s.current, lists };
}

// ── the browser's storage (never throws: a private window or blocked storage just means lists that live on in memory) ──
const isSavedItem = (x: unknown): x is SavedItem => isBasketItem(x) && typeof (x as SavedItem).page === "string" && !!(x as SavedItem).page && typeof (x as SavedItem).pageTitle === "string";

/** the state in a stored string; anything damaged falls back to an empty state, so an old or odd value never breaks a page */
export function parseState(raw: string | null): SavedState {
  try {
    const d = raw ? JSON.parse(raw) : null;
    const lists: SavedList[] = (Array.isArray(d?.lists) ? d.lists : [])
      .filter((l: SavedList) => l && typeof l.id === "string" && typeof l.name === "string" && Array.isArray(l.items))
      .slice(0, MAX_LISTS)
      .map((l: SavedList) => ({ id: l.id, name: cleanName(l.name) || DEFAULT_LIST_NAME, items: l.items.filter(isSavedItem).slice(0, BASKET_MAX) }));
    if (!lists.length) return emptyState();
    return { current: lists.some((l) => l.id === d.current) ? d.current : lists[0].id, lists };
  } catch { return emptyState(); }
}

/** the questions a page saved before there were lists (key `mt-print-basket:<page title>`) join the current list, tagged with the page they belong to */
export function adoptLegacy(s: SavedState, legacy: BasketItem[], page: string, pageTitle: string): SavedState {
  return mergeSaved(s, legacy.map((i) => ({ ...i, page, pageTitle })));
}
export const legacyKey = (pageTitle: string): string => `mt-print-basket:${pageTitle}`;

// ── the store: one state for the whole page, shared by every control, saved as it changes ──
let state: SavedState | null = null;
const listeners = new Set<() => void>();
const read = (): SavedState => { try { return parseState(window.localStorage.getItem(KEY)); } catch { return emptyState(); } };
const getSaved = (): SavedState => (state ??= read());
/** change the saved state (and keep it in the browser); every control listening is told */
export function updateSaved(fn: (s: SavedState) => SavedState): SavedState {
  const next = fn(getSaved());
  if (next === state) return next;
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked: the lists live on in memory */ }
  listeners.forEach((l) => l());
  return next;
}
const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  // another tab changed the lists: take them
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { state = read(); cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
};
export const useSavedState = (): SavedState => useSyncExternalStore(subscribe, getSaved, getSaved);
