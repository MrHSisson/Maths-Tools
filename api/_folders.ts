// Folders: the file-explorer way to find a deck. A folder has a parent (so folders sit inside folders, to any depth) and belongs to one tree
// (`class` today; `topic` joins it when the strands are moved onto this). A deck can sit in several folders, like a shortcut: the deck is never copied.
// Kept in their own tables, apart from the decks, so filing a deck makes no deck version and cannot clash with an edit.
import type { Db } from "./_db.js";

export type Tree = "class" | "topic";
export const TREES: Tree[] = ["class", "topic"];
export const validTree = (v: unknown): v is Tree => typeof v === "string" && (TREES as string[]).includes(v);
export interface Folder { id: string; tree: Tree; name: string; /** null for a top-level folder; another folder's id otherwise. */ parent: string | null; position: number }
/** A deck as a folder lists it: its summary and its first slide for the card, with when it was made. Only the opened folder's decks are read. */
export interface FolderDeck { id: string; title: string; summary: string; slides: number; madeAt: string; /** When the deck was last saved. */ editedAt: string; published: boolean; /** The lesson pitch (upper, middle or lower band), when set. */ pitch?: string; preview?: unknown }
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

/** The decks in one folder, most recently made first, each with its first slide (left out with `previews: false`, for the list view). Null when there is no such folder. */
export async function decksInFolder(db: Db, folderId: string, previews = true): Promise<FolderDeck[] | null> {
  if (!(await db.query<Row>(`SELECT 1 FROM maths.deck_folders WHERE id = $1`, [folderId])).length) return null;
  const rows = await db.query<Row>(`SELECT d.id, d.title, d.summary, d.slides,
      ${previews ? `CASE WHEN length((d.data->'slides'->0)::text) <= ${MAX_PREVIEW_CHARS} THEN d.data->'slides'->0 END` : "NULL"} AS preview,
      d.data->>'pitch' AS pitch, d.updated_at AS edited, COALESCE(d.created_at, d.updated_at) AS made, (p.id IS NOT NULL) AS published
    FROM maths.deck_folder_items i JOIN maths.decks d ON d.id = i.deck_id LEFT JOIN maths.published_decks p ON p.id = d.id
    WHERE i.folder_id = $1 ORDER BY made DESC, d.id`, [folderId]);
  return rows.map((r) => ({ id: r.id as string, title: r.title as string, summary: r.summary as string, slides: r.slides as number, madeAt: r.made as string, editedAt: r.edited as string, published: r.published === true, ...(r.pitch ? { pitch: r.pitch as string } : {}), ...(r.preview ? { preview: r.preview } : {}) }));
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

// ── Changing the folders themselves ──

export type FolderOp =
  | { op: "add"; tree: Tree; name: string; parent?: string | null }
  | { op: "rename"; id: string; name: string }
  | { op: "move"; id: string; parent: string | null }
  | { op: "reorder"; id: string; direction: "up" | "down" }
  | { op: "delete"; id: string };
export type TreeData = Awaited<ReturnType<typeof listTree>>;
export type FolderOpResult = { ok: true; data: TreeData } | { ok: false; error: string; status: number };

/** Checks the shape of an operation sent by a device. */
export function parseFolderOp(raw: unknown): FolderOp | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const parentOk = (v: unknown) => v === undefined || v === null || validFolderId(v);
  switch (o.op) {
    case "add": return validTree(o.tree) && typeof o.name === "string" && parentOk(o.parent) ? { op: "add", tree: o.tree, name: o.name, parent: (o.parent as string | null | undefined) ?? null } : null;
    case "rename": return validFolderId(o.id) && typeof o.name === "string" ? { op: "rename", id: o.id, name: o.name } : null;
    case "move": return validFolderId(o.id) && (o.parent === null || validFolderId(o.parent)) ? { op: "move", id: o.id, parent: o.parent as string | null } : null;
    case "reorder": return validFolderId(o.id) && (o.direction === "up" || o.direction === "down") ? { op: "reorder", id: o.id, direction: o.direction } : null;
    case "delete": return validFolderId(o.id) ? { op: "delete", id: o.id } : null;
    default: return null;
  }
}

const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");
const fail = (error: string, status = 400): FolderOpResult => ({ ok: false, error, status });

/** Applies one change to the folders and returns the whole tree as it now stands. A folder is only ever renamed, moved or removed: no deck is touched.
 *  Deleting a folder moves what is in it up one level: its decks go into its parent (if it has one) and its subfolders become the parent's. */
export async function applyFolderOp(db: Db, op: FolderOp): Promise<FolderOpResult> {
  const all = (await db.query<Row>(`SELECT id, tree, name, parent, position FROM maths.deck_folders`)).map(toFolder);
  const byId = new Map(all.map((f) => [f.id, f]));
  const kids = (parent: string | null, tree: Tree) => all.filter((f) => f.tree === tree && f.parent === parent).sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : 1));
  const depthOf = (id: string | null): number => { let d = 0; for (let f = id ? byId.get(id) : undefined; f && d < 50; f = f.parent ? byId.get(f.parent) : undefined) d++; return d; };
  const heightOf = (id: string): number => 1 + Math.max(0, ...all.filter((f) => f.parent === id).map((f) => heightOf(f.id)));
  const inside = (id: string, ancestor: string): boolean => { for (let f = byId.get(id), n = 0; f && n < 50; f = f.parent ? byId.get(f.parent) : undefined, n++) if (f.id === ancestor) return true; return false; };
  const taken = (name: string, parent: string | null, tree: Tree, except?: string) => kids(parent, tree).some((f) => f.id !== except && f.name.toLowerCase() === name.toLowerCase());
  const nextPosition = (parent: string | null, tree: Tree) => kids(parent, tree).reduce((m, f) => Math.max(m, f.position + 1), 0);
  const done = async (tree: Tree): Promise<FolderOpResult> => ({ ok: true, data: await listTree(db, tree) });

  switch (op.op) {
    case "add": {
      const name = clean(op.name), parent = op.parent ?? null;
      if (!name || name.length > MAX_NAME) return fail(`A folder name is 1 to ${MAX_NAME} characters`);
      if (parent !== null) { const p = byId.get(parent); if (!p) return fail("That folder does not exist", 404); if (p.tree !== op.tree) return fail("A folder goes inside a folder of the same kind"); }
      if (depthOf(parent) + 1 > MAX_DEPTH) return fail(`Folders can go ${MAX_DEPTH} deep and no further`);
      if (taken(name, parent, op.tree)) return fail(`There is already a folder called "${name}" here`, 409);
      await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,$2,$3,$4,$5)`, [`f_${crypto.randomUUID().slice(0, 8)}`, op.tree, name, parent, nextPosition(parent, op.tree)]);
      return done(op.tree);
    }
    case "rename": {
      const f = byId.get(op.id), name = clean(op.name);
      if (!f) return fail("No such folder", 404);
      if (!name || name.length > MAX_NAME) return fail(`A folder name is 1 to ${MAX_NAME} characters`);
      if (taken(name, f.parent, f.tree, f.id)) return fail(`There is already a folder called "${name}" here`, 409);
      await db.query(`UPDATE maths.deck_folders SET name = $2 WHERE id = $1`, [f.id, name]);
      return done(f.tree);
    }
    case "move": {
      const f = byId.get(op.id);
      if (!f) return fail("No such folder", 404);
      if (op.parent !== null) {
        const p = byId.get(op.parent);
        if (!p) return fail("That folder does not exist", 404);
        if (p.tree !== f.tree) return fail("A folder stays in its own kind of folders");
        if (inside(p.id, f.id)) return fail("A folder cannot go inside itself");
      }
      if (depthOf(op.parent) + heightOf(f.id) > MAX_DEPTH) return fail(`That would make folders more than ${MAX_DEPTH} deep`);
      if (taken(f.name, op.parent, f.tree, f.id)) return fail(`There is already a folder called "${f.name}" there`, 409);
      await db.query(`UPDATE maths.deck_folders SET parent = $2, position = $3 WHERE id = $1`, [f.id, op.parent, nextPosition(op.parent, f.tree)]);
      return done(f.tree);
    }
    case "reorder": {
      const f = byId.get(op.id);
      if (!f) return fail("No such folder", 404);
      const line = kids(f.parent, f.tree), i = line.findIndex((x) => x.id === f.id), j = op.direction === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= line.length) return done(f.tree);                    // already first or last
      [line[i], line[j]] = [line[j], line[i]];
      for (const [pos, x] of line.entries()) await db.query(`UPDATE maths.deck_folders SET position = $2 WHERE id = $1`, [x.id, pos]);
      return done(f.tree);
    }
    case "delete": {
      const f = byId.get(op.id);
      if (!f) return fail("No such folder", 404);
      if (f.parent !== null) await db.query(`INSERT INTO maths.deck_folder_items (folder_id, deck_id) SELECT $2, deck_id FROM maths.deck_folder_items WHERE folder_id = $1 ON CONFLICT DO NOTHING`, [f.id, f.parent]);
      let position = nextPosition(f.parent, f.tree);
      for (const k of kids(f.id, f.tree)) {
        // a subfolder moves up; if the new level already has one of that name, it keeps its place inside a renamed copy of the name rather than clashing
        const name = taken(k.name, f.parent, f.tree) ? `${k.name} (from ${f.name})`.slice(0, MAX_NAME) : k.name;
        await db.query(`UPDATE maths.deck_folders SET parent = $2, position = $3, name = $4 WHERE id = $1`, [k.id, f.parent, position++, name]);
      }
      await db.query(`DELETE FROM maths.deck_folder_items WHERE folder_id = $1`, [f.id]);
      await db.query(`DELETE FROM maths.deck_folders WHERE id = $1`, [f.id]);
      return done(f.tree);
    }
  }
}
