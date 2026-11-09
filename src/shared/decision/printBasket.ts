// ═══════════════════════════════════════════════════════════════════════════
// The print basket: questions saved to print later. A saved question is only its recipe — the sub-tool, the level, the options and the seed it
// was generated from — so it is a few hundred bytes, lives in the browser's storage (it survives closing the tab) and can be carried to another
// device as a link: the same seed and options draw the same question again. Pure logic; the shell owns the menu and the dialog.
// ═══════════════════════════════════════════════════════════════════════════

export interface BasketItem {
  /** the sub-tool key (the tab) */
  tab: string;
  level: number;
  seed: number;
  /** every option as the generator receives it (a multi option as its comma list) */
  options: Record<string, string>;
  /** the start of the question, for the list */
  preview: string;
  /** a short fingerprint of the question's content when it was saved: a rebuilt question that differs means the generator has changed since */
  fp?: string;
}

export const BASKET_MAX = 30;

const PREVIEW_LEN = 70;
/** a short line for the list: the question's own sentence, not the opening every question shares */
export function previewOf(prompt: string): string {
  const rest = prompt.replace(/^The activity network represents [^.]*\.\s*The times are in \w+\.\s*/, "").replace(/\s+/g, " ").trim();
  return rest.length > PREVIEW_LEN ? `${rest.slice(0, PREVIEW_LEN - 1).trimEnd()}…` : rest;
}

/** what makes two saved questions the same one */
export const itemKey = (i: BasketItem): string => `${i.tab}|${i.level}|${i.seed}|${Object.keys(i.options).sort().map((k) => `${k}=${i.options[k]}`).join(";")}`;

export const hasItem = (items: BasketItem[], item: BasketItem): boolean => items.some((x) => itemKey(x) === itemKey(item));

/** the basket with `item` added (not twice, and not past the cap) */
export function addItem(items: BasketItem[], item: BasketItem): BasketItem[] {
  if (hasItem(items, item) || items.length >= BASKET_MAX) return items;
  return [...items, item];
}
export const removeItem = (items: BasketItem[], item: BasketItem): BasketItem[] => items.filter((x) => itemKey(x) !== itemKey(item));

/** the basket with `incoming` added after it (from a shared link): nothing twice, nothing past the cap */
export function mergeItems(items: BasketItem[], incoming: BasketItem[]): BasketItem[] {
  return incoming.reduce(addItem, items);
}

const valid = (x: unknown): x is BasketItem => {
  const i = x as BasketItem;
  return !!i && typeof i.tab === "string" && Number.isInteger(i.level) && i.level >= 1 && i.level <= 9 && Number.isInteger(i.seed) && i.seed >= 0
    && !!i.options && typeof i.options === "object" && Object.values(i.options).every((v) => typeof v === "string") && typeof i.preview === "string" && (i.fp === undefined || typeof i.fp === "string");
};

// ── the browser's storage (never throws: a private window or blocked storage just means an empty, unsaved basket) ──
export function loadBasket(key: string): BasketItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(valid).slice(0, BASKET_MAX) : [];
  } catch { return []; }
}
export function saveBasket(key: string, items: BasketItem[]): void {
  try { window.localStorage.setItem(key, JSON.stringify(items)); } catch { /* storage full or blocked: the basket lives on in memory */ }
}

// ── a link: the whole basket in one query value ──
const b64 = (s: string): string => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string): string => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

/** compact: one array per question, [tab, level, seed, options, preview, fingerprint] */
export function encodeBasket(items: BasketItem[]): string {
  return b64(JSON.stringify(items.map((i) => [i.tab, i.level, i.seed, i.options, i.preview, i.fp ?? null])));
}
/** the questions in a link, or null when it is not a basket (an old, damaged or made-up link never breaks the page) */
export function decodeBasket(code: string): BasketItem[] | null {
  try {
    const list = JSON.parse(unb64(code));
    if (!Array.isArray(list)) return null;
    const items = list.map((r) => (Array.isArray(r) ? { tab: r[0], level: r[1], seed: r[2], options: r[3], preview: r[4], ...(typeof r[5] === "string" ? { fp: r[5] } : {}) } : null)).filter(valid) as BasketItem[];
    return items.length ? items.slice(0, BASKET_MAX) : null;
  } catch { return null; }
}
