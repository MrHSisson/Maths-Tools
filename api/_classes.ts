// Classes: the other way to find a deck. Years, each with the classes Harry teaches, and which decks are used with which class (a deck may be in several).
// Kept in their own table, apart from the decks, so choosing a class never changes a deck (no new version, no merge, no clash with an edit).
// The class list is fixed here for now (Harry's list, 2026-11-24); a class view reads one class at a time and never loads a deck's first slide.
import type { Db } from "./_db.js";

export const CLASS_GROUPS: { year: string; classes: string[] }[] = [
  { year: "Year 7", classes: ["7M1"] },
  { year: "Year 8", classes: [] },
  { year: "Year 9", classes: ["9M6", "9M3", "9M2"] },
  { year: "Year 10", classes: [] },
  { year: "Year 11", classes: [] },
  { year: "A-Level", classes: ["12FM", "13MA", "13FM"] },
];
export const CLASS_IDS = CLASS_GROUPS.flatMap((g) => g.classes);
export const validClass = (v: unknown): v is string => typeof v === "string" && CLASS_IDS.includes(v);

/** A deck as the class view lists it: light (no preview), with when it was made. */
export interface ClassDeck { id: string; title: string; summary: string; slides: number; madeAt: string; published: boolean }
type Row = Record<string, unknown>;

/** Replaces the classes a deck is used with. Returns the classes now set (in the fixed order). */
export async function setDeckClasses(db: Db, deckId: string, classIds: string[]): Promise<string[]> {
  const keep = CLASS_IDS.filter((c) => classIds.includes(c));
  await db.query(`DELETE FROM maths.deck_classes WHERE deck_id = $1`, [deckId]);
  for (const c of keep) await db.query(`INSERT INTO maths.deck_classes (deck_id, class_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [deckId, c]);
  return keep;
}

/** The deck was deleted: it is used with no class. */
export const unclassDeck = (db: Db, deckId: string) => db.query(`DELETE FROM maths.deck_classes WHERE deck_id = $1`, [deckId]);

/** The decks used with one class, most recently made first. `publishedOnly` (the public read) lists only published decks. */
export async function decksInClass(db: Db, classId: string, publishedOnly: boolean): Promise<ClassDeck[]> {
  const rows = publishedOnly
    ? await db.query<Row>(`SELECT p.id, p.title, p.summary, p.slides, COALESCE(d.created_at, p.published_at) AS made
        FROM maths.deck_classes c JOIN maths.published_decks p ON p.id = c.deck_id LEFT JOIN maths.decks d ON d.id = c.deck_id
        WHERE c.class_id = $1 ORDER BY made DESC, p.id`, [classId])
    : await db.query<Row>(`SELECT d.id, d.title, d.summary, d.slides, COALESCE(d.created_at, d.updated_at) AS made, (p.id IS NOT NULL) AS published
        FROM maths.deck_classes c JOIN maths.decks d ON d.id = c.deck_id LEFT JOIN maths.published_decks p ON p.id = d.id
        WHERE c.class_id = $1 ORDER BY made DESC, d.id`, [classId]);
  return rows.map((r) => ({ id: r.id as string, title: r.title as string, summary: r.summary as string, slides: r.slides as number, madeAt: r.made as string, published: publishedOnly ? true : r.published === true }));
}

/** How many decks each class has, and (for the admin read) which classes each deck is in. */
export async function classSummary(db: Db, publishedOnly: boolean): Promise<{ counts: Record<string, number>; byDeck: Record<string, string[]> }> {
  const rows = publishedOnly
    ? await db.query<Row>(`SELECT c.deck_id, c.class_id FROM maths.deck_classes c JOIN maths.published_decks p ON p.id = c.deck_id`)
    : await db.query<Row>(`SELECT deck_id, class_id FROM maths.deck_classes`);
  const counts: Record<string, number> = Object.fromEntries(CLASS_IDS.map((c) => [c, 0]));
  const byDeck: Record<string, string[]> = {};
  for (const r of rows) { const d = r.deck_id as string, c = r.class_id as string; if (!(c in counts)) continue; counts[c]++; (byDeck[d] ??= []).push(c); }
  return { counts, byDeck };
}

/** Every deck's id and title and nothing else, newest made first: what the class view's "Add a deck" picker needs (the deck list proper carries a preview of each). */
export async function deckTitles(db: Db): Promise<{ id: string; title: string }[]> {
  const rows = await db.query<Row>(`SELECT id, title FROM maths.decks ORDER BY COALESCE(created_at, updated_at) DESC, id`);
  return rows.map((r) => ({ id: r.id as string, title: r.title as string }));
}
