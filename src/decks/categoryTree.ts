// What the Decks page shows from the category tree and the filing: which category each deck sits in, and the sections in the order Harry set.
// Pure functions, so they are tested without a browser. The tree and the filing come from /api/decks (api/_categories.ts).
import type { Category, CategoryData } from "../../api/_categories";
import { DECK_STRANDS } from "./types";

export type { Category, CategoryData };
export interface TreeDeck { id: string; /** The strand the deck still carries from before categories were Harry's to control. */ strand?: string }
export interface Section { category: Category; decks: string[]; topics: { category: Category; decks: string[] }[] }
export interface Layout { sections: Section[]; unfiled: string[] }

/** The tree to use when the service cannot be reached (a local dev server): the five old strands, with decks placed by the strand they carry. */
export const LEGACY_DATA: CategoryData = {
  categories: DECK_STRANDS.map((name, position) => ({ id: `legacy-${position}`, name, parent: null, position })),
  filing: {},
};

/** The category a deck sits in: where it was filed, else the strand it still carries if that names a strand; null when it is not filed. */
export function placeOf(deck: TreeDeck, data: CategoryData): string | null {
  const filed = data.filing[deck.id];
  if (filed && data.categories.some((c) => c.id === filed)) return filed;
  const s = deck.strand?.trim().toLowerCase();
  const strand = s ? data.categories.find((c) => c.parent === null && c.name.toLowerCase() === s) : undefined;
  return strand ? strand.id : null;
}

const byOrder = (a: Category, b: Category) => a.position - b.position || (a.id < b.id ? -1 : 1);

/** The sections in order: each strand with the decks filed straight in it and then its topics. An empty category is kept only when `showEmpty` (so Harry can drop a deck into it). */
export function layoutDecks(decks: TreeDeck[], data: CategoryData | null | undefined, o: { showEmpty: boolean }): Layout {
  const tree = data ?? LEGACY_DATA;
  const into = new Map<string, string[]>();
  const unfiled: string[] = [];
  for (const d of decks) {
    const place = placeOf(d, tree);
    if (place === null) unfiled.push(d.id); else into.set(place, [...(into.get(place) ?? []), d.id]);
  }
  const sections: Section[] = tree.categories.filter((c) => c.parent === null).sort(byOrder).map((category) => ({
    category,
    decks: into.get(category.id) ?? [],
    topics: tree.categories.filter((t) => t.parent === category.id).sort(byOrder).map((t) => ({ category: t, decks: into.get(t.id) ?? [] })),
  })).map((s) => (o.showEmpty ? s : { ...s, topics: s.topics.filter((t) => t.decks.length > 0) }))
    .filter((s) => o.showEmpty || s.decks.length > 0 || s.topics.length > 0);
  return { sections, unfiled };
}

/** "Number" or "Number › Factors & multiples". */
export function pathOf(id: string | null, data: CategoryData | null | undefined): string {
  const tree = data ?? LEGACY_DATA;
  const c = tree.categories.find((x) => x.id === id);
  if (!c) return "Not filed";
  const parent = c.parent ? tree.categories.find((x) => x.id === c.parent) : undefined;
  return parent ? `${parent.name} › ${c.name}` : c.name;
}

/** Every category as a flat, indented list for a menu: a strand, then its topics. */
export function menuOptions(data: CategoryData | null | undefined): { id: string; label: string; depth: 0 | 1 }[] {
  const tree = data ?? LEGACY_DATA;
  return tree.categories.filter((c) => c.parent === null).sort(byOrder).flatMap((s) => [
    { id: s.id, label: s.name, depth: 0 as const },
    ...tree.categories.filter((t) => t.parent === s.id).sort(byOrder).map((t) => ({ id: t.id, label: t.name, depth: 1 as const })),
  ]);
}
