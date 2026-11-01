// Three-way merge of a deck, by slide and by element, so two people (Harry in the editor, Claude from the command line) can edit the same
// deck without one save overwriting the other. Pure: no I/O, no imports, used by the decks API, the editor and `npm run deck`.
//
//   base      the version both sides last agreed on (what the saver started from)
//   incoming  the version being saved
//   current   what is stored now (it may hold changes the saver has not seen)
//   winner    who wins when BOTH changed the very same field: "incoming" or "current"
//
// Rules, applied to slides, to elements within a slide and to each field of a slide or element:
//   changed on one side only            -> that change is kept
//   changed on both sides, differently  -> `winner`'s value is kept, and the conflict is reported
//   added on either side                -> kept
//   deleted on one side, edited on the other -> the edit is kept (an edit never loses to a delete)
//   deleted on one side, untouched on the other -> deleted
// Order follows `winner`'s order, with the other side's additions slotted in after the item they followed.

type Obj = Record<string, unknown>;
type Item = Obj & { id: string };
export type Winner = "incoming" | "current";
export interface MergeReport { deck: Obj; conflicts: string[]; /** slides the other side changed that are now in the result */ merged: boolean }

const stable = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.entries(v as Obj).filter(([, x]) => x !== undefined).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => `${JSON.stringify(k)}:${stable(x)}`).join(",")}}`;
  return JSON.stringify(v) ?? "undefined";
};
const same = (a: unknown, b: unknown) => stable(a) === stable(b);

/** Merges two versions of one object field by field (nested values are compared whole). */
function mergeFields(base: Obj | undefined, a: Obj, b: Obj, winner: Winner, where: string, conflicts: string[], skip: string[] = []): Obj {
  const out: Obj = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b), ...Object.keys(base ?? {})]);
  for (const k of keys) {
    if (skip.includes(k)) continue;
    const va = a[k], vb = b[k], vs = base?.[k];
    let v: unknown;
    if (same(va, vb)) v = va;
    else if (same(va, vs)) v = vb;                 // only `current` changed it
    else if (same(vb, vs)) v = va;                 // only `incoming` changed it
    else { v = winner === "incoming" ? va : vb; conflicts.push(`${where}.${k}`); }
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Merges lists of items with ids (slides, or the elements of a slide). `mergeItem` merges one item present on both sides. */
function mergeList(base: Item[] | undefined, a: Item[], b: Item[], winner: Winner, where: string, conflicts: string[], mergeItem: (base: Item | undefined, a: Item, b: Item, where: string) => Item): Item[] {
  const byId = (xs: Item[] | undefined) => new Map((xs ?? []).map((x) => [x.id, x]));
  const B = byId(base), A = byId(a), C = byId(b);
  const result = new Map<string, Item>();
  for (const id of new Set([...A.keys(), ...C.keys()])) {
    const x = A.get(id), y = C.get(id), s = B.get(id);
    if (x && y) result.set(id, same(x, y) ? x : mergeItem(s, x, y, `${where}${id}`));
    else if (x) {                                  // missing from current
      if (!s) result.set(id, x);                   // added by incoming
      else if (!same(x, s)) { result.set(id, x); conflicts.push(`${where}${id} was deleted by the other side but edited here: kept`); }
    } else if (y) {                                // missing from incoming
      if (!s) result.set(id, y);                   // added in current
      else if (!same(y, s)) { result.set(id, y); conflicts.push(`${where}${id} was deleted here but edited by the other side: kept`); }
    }
  }
  // order: the winner's order, then the other side's additions after the item they followed
  const [first, second] = winner === "incoming" ? [a, b] : [b, a];
  const order = first.map((x) => x.id).filter((id) => result.has(id));
  second.forEach((x, i) => {
    if (!result.has(x.id) || order.includes(x.id)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j--) { const p = order.indexOf(second[j].id); if (p >= 0) { at = p + 1; break; } }
    order.splice(at, 0, x.id);
  });
  return order.map((id) => result.get(id)!);
}

/** Are two decks the same apart from when they were saved? */
export const sameDeck = (a: Obj, b: Obj): boolean => { const { updatedAt: _a, ...x } = a; const { updatedAt: _b, ...y } = b; void _a; void _b; return same(x, y); };

const asItems = (v: unknown): Item[] => (Array.isArray(v) ? (v as Item[]) : []);

function mergeSlide(base: Item | undefined, a: Item, b: Item, winner: Winner, where: string, conflicts: string[]): Item {
  const fields = mergeFields(base, a, b, winner, where, conflicts, ["els"]);
  const els = mergeList(base ? asItems(base.els) : undefined, asItems(a.els), asItems(b.els), winner, `${where}/`, conflicts,
    (be, x, y, w) => mergeFields(be, x, y, winner, w, conflicts) as Item);
  return { ...fields, id: a.id, els } as Item;
}

/** The merged deck. `base` may be absent (nothing to compare with): then `incoming` replaces `current`, as a plain save always did. */
export function mergeDecks(base: Obj | null | undefined, incoming: Obj, current: Obj, winner: Winner): MergeReport {
  const conflicts: string[] = [];
  if (!base) return { deck: incoming, conflicts, merged: false };
  const fields = mergeFields(base, incoming, current, winner, "deck", conflicts, ["slides", "updatedAt"]);
  const slides = mergeList(asItems(base.slides), asItems(incoming.slides), asItems(current.slides), winner, "", conflicts,
    (bs, x, y, w) => mergeSlide(bs, x, y, winner, w, conflicts));
  const deck = { ...fields, slides, ...(incoming.updatedAt !== undefined ? { updatedAt: incoming.updatedAt } : {}) };
  return { deck, conflicts, merged: !same(deck, incoming) };
}
