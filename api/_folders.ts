// Folders: the file-explorer way to find a deck. A folder has a parent (so folders sit inside folders, to any depth) and belongs to one tree
// (`class` today; `topic` joins it when the strands are moved onto this). A deck can sit in several folders, like a shortcut: the deck is never copied.
// Kept in their own tables, apart from the decks, so filing a deck makes no deck version and cannot clash with an edit.
import type { Db } from "./_db.js";

export type Tree = "class" | "topic";
export const TREES: Tree[] = ["class", "topic"];
export const validTree = (v: unknown): v is Tree => typeof v === "string" && (TREES as string[]).includes(v);
export interface Folder { id: string; tree: Tree; name: string; /** null for a top-level folder; another folder's id otherwise. */ parent: string | null; position: number }
/** A deck as a folder lists it: its summary and its first slide for the card, with when it was made. Only the opened folder's decks are read. */
export interface FolderDeck { id: string; title: string; summary: string; slides: number; madeAt: string; published: boolean; preview?: unknown }
type Row = Record<string, unknown>;

export const MAX_NAME = 60;
/** The deepest a folder may sit (a top-level folder is depth 1), so the breadcrumb stays readable. */
export const MAX_DEPTH = 6;
export const validFolderId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);
const MAX_PREVIEW_CHARS = 30_000;                    // as the deck list: a big picture on the title slide is left out of the card

/** The class tree a fresh start gets (Harry's list, 2026-11-24): a folder per year and the classes inside it. He reshapes it from the Decks page. */
export const DEFAULT_CLASS_TREE: { year: string; classes: string[] }[] = [
  { year: "Year 7", classes: ["7M1"] },
  { year: "Year 8", classes: [] },
  { year: "Year 9", classes: ["9M6", "9M3", "9M2"] },
  { year: "Year 10", classes: [] },
  { year: "Year 11", classes: [] },
  { year: "A-Level", classes: ["12FM", "13MA", "13FM"] },
];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SEED_KEY = "class_folders_seeded";

/** Seeds the class tree once (a marker row says it has been done, so a folder deleted later stays deleted). Deterministic ids and DO NOTHING make a race harmless. */
async function ensureSeed(db: Db) {
  if ((await db.query<Row>(`SELECT value FROM maths.deck_meta WHERE key = $1`, [SEED_KEY])).length) return;
  let position = 0;
  for (const g of DEFAULT_CLASS_TREE) {
    const yearId = `class-${slug(g.year)}`;
    await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'class',$2,NULL,$3) ON CONFLICT (id) DO NOTHING`, [yearId, g.year, position++]);
    for (const [i, c] of g.classes.entries()) await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'class',$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [`class-${slug(c)}`, c, yearId, i]);
  }
  await db.query(`INSERT INTO maths.deck_meta (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`, [SEED_KEY, new Date().toISOString()]);
}

const toFolder = (r: Row): Folder => ({ id: r.id as string, tree: r.tree as Tree, name: r.name as string, parent: (r.parent as string | null) ?? null, position: r.position as number });

/** One tree's folders in order, how many decks each holds directly, which folders each deck is in, and every deck's id and title (for the "Add a deck" picker). */
export async function listTree(db: Db, tree: Tree): Promise<{ folders: Folder[]; counts: Record<string, number>; byDeck: Record<string, string[]>; decks: { id: string; title: string }[] }> {
  if (tree === "class") await ensureSeed(db);
  const folders = (await db.query<Row>(`SELECT id, tree, name, parent, position FROM maths.deck_folders WHERE tree = $1 ORDER BY position, id`, [tree])).map(toFolder);
  const items = await db.query<Row>(`SELECT i.deck_id, i.folder_id FROM maths.deck_folder_items i JOIN maths.deck_folders f ON f.id = i.folder_id WHERE f.tree = $1`, [tree]);
  const counts: Record<string, number> = Object.fromEntries(folders.map((f) => [f.id, 0]));
  const byDeck: Record<string, string[]> = {};
  for (const r of items) { const d = r.deck_id as string, f = r.folder_id as string; counts[f] = (counts[f] ?? 0) + 1; (byDeck[d] ??= []).push(f); }
  const titles = await db.query<Row>(`SELECT id, title FROM maths.decks ORDER BY COALESCE(created_at, updated_at) DESC, id`);
  return { folders, counts, byDeck, decks: titles.map((r) => ({ id: r.id as string, title: r.title as string })) };
}

/** The decks in one folder, most recently made first, each with its first slide. Null when there is no such folder. */
export async function decksInFolder(db: Db, folderId: string): Promise<FolderDeck[] | null> {
  if (!(await db.query<Row>(`SELECT 1 FROM maths.deck_folders WHERE id = $1`, [folderId])).length) return null;
  const rows = await db.query<Row>(`SELECT d.id, d.title, d.summary, d.slides,
      CASE WHEN length((d.data->'slides'->0)::text) <= ${MAX_PREVIEW_CHARS} THEN d.data->'slides'->0 END AS preview,
      COALESCE(d.created_at, d.updated_at) AS made, (p.id IS NOT NULL) AS published
    FROM maths.deck_folder_items i JOIN maths.decks d ON d.id = i.deck_id LEFT JOIN maths.published_decks p ON p.id = d.id
    WHERE i.folder_id = $1 ORDER BY made DESC, d.id`, [folderId]);
  return rows.map((r) => ({ id: r.id as string, title: r.title as string, summary: r.summary as string, slides: r.slides as number, madeAt: r.made as string, published: r.published === true, ...(r.preview ? { preview: r.preview } : {}) }));
}

/** Replaces the folders a deck is in within one tree (its place in the other tree is left alone). Folders that are not in that tree are ignored. Returns the folders now set. */
export async function setDeckFolders(db: Db, deckId: string, tree: Tree, folderIds: string[]): Promise<string[]> {
  const inTree = (await db.query<Row>(`SELECT id FROM maths.deck_folders WHERE tree = $1 ORDER BY position, id`, [tree])).map((r) => r.id as string);
  const keep = inTree.filter((f) => folderIds.includes(f));
  await db.query(`DELETE FROM maths.deck_folder_items WHERE deck_id = $1 AND folder_id IN (SELECT id FROM maths.deck_folders WHERE tree = $2)`, [deckId, tree]);
  for (const f of keep) await db.query(`INSERT INTO maths.deck_folder_items (folder_id, deck_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [f, deckId]);
  return keep;
}

/** The deck was deleted: it is in no folder. */
export const unfolderDeck = (db: Db, deckId: string) => db.query(`DELETE FROM maths.deck_folder_items WHERE deck_id = $1`, [deckId]);
