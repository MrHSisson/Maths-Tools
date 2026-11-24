// Folders: the file-explorer way to find a deck. A folder has a parent (so folders sit inside folders, to any depth) and belongs to one tree:
// `class` (years and classes, signed-in only) or `topic` (the strands and topics, also read-only and published-only for everyone). A deck can sit in
// several folders, like a shortcut: the deck is never copied. Kept in their own tables, apart from the decks, so filing a deck makes no deck version and
// cannot clash with an edit. The old two-level categories (`deck_categories`, `deck_filing`) are no longer read after the topic tree has been copied from them.
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
const CLASS_SEED_KEY = "class_folders_seeded";
const TOPIC_SEED_KEY = "topic_folders_seeded";
/** The topic tree a fresh start gets: the five GCSE strands, A-Level with Maths and Further Maths, and Starters. (A database that already had categories is copied instead.) */
export const DEFAULT_TOPIC_TREE: { name: string; topics?: string[] }[] = [
  { name: "Number" }, { name: "Algebra" }, { name: "Ratio & Proportion" }, { name: "Geometry" }, { name: "Probability & Statistics" },
  { name: "A-Level", topics: ["Maths", "Further Maths"] }, { name: "Starters" },
];
/** A strand name a deck carried before filing was Harry's to control, and where it now belongs (a top-level folder and a folder inside it). */
const ALIASES: Record<string, [string, string]> = { "decision mathematics": ["A-Level", "Further Maths"] };
/** Not a real folder: the decks that are in no folder of a tree, shown as "Not filed". */
export const UNFILED = "unfiled";

const marked = async (db: Db, key: string) => (await db.query<Row>(`SELECT value FROM maths.deck_meta WHERE key = $1`, [key])).length > 0;
const mark = (db: Db, key: string) => db.query(`INSERT INTO maths.deck_meta (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`, [key, new Date().toISOString()]);

/** Seeds the class tree once (a marker row says it has been done, so a folder deleted later stays deleted). Deterministic ids and DO NOTHING make a race harmless. */
async function ensureClassSeed(db: Db) {
  if (await marked(db, CLASS_SEED_KEY)) return;
  let position = 0;
  for (const g of DEFAULT_CLASS_TREE) {
    const yearId = `class-${slug(g.year)}`;
    await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'class',$2,NULL,$3) ON CONFLICT (id) DO NOTHING`, [yearId, g.year, position++]);
    for (const [i, c] of g.classes.entries()) await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'class',$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [`class-${slug(c)}`, c, yearId, i]);
  }
  await mark(db, CLASS_SEED_KEY);
}

/** The folder a strand name belongs in (a top-level topic folder, or the one an old name is aliased to), or null. */
async function folderForStrand(db: Db, strand: string): Promise<string | null> {
  const s = clean(strand).toLowerCase();
  if (!s) return null;
  const folders = (await db.query<Row>(`SELECT id, name, parent FROM maths.deck_folders WHERE tree = 'topic'`)).map((r) => ({ id: r.id as string, name: (r.name as string).toLowerCase(), parent: (r.parent as string | null) ?? null }));
  const alias = ALIASES[s];
  if (alias) {
    const top = folders.find((f) => f.parent === null && f.name === alias[0].toLowerCase());
    const inner = top ? folders.find((f) => f.parent === top.id && f.name === alias[1].toLowerCase()) : undefined;
    if (inner) return inner.id;
  }
  return folders.find((f) => f.parent === null && f.name === s)?.id ?? null;
}

/** Files a brand-new deck under the strand it carries (a deck built with `strand: "Number"` lands in Number), once, when it is first saved. Later saves never refile it. */
export async function fileNewDeckByStrand(db: Db, deckId: string, strand: unknown): Promise<void> {
  if (typeof strand !== "string") return;
  await ensureTopicSeed(db);
  const folder = await folderForStrand(db, strand);
  if (folder) await db.query(`INSERT INTO maths.deck_folder_items (folder_id, deck_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [folder, deckId]);
}

/** Builds the topic tree once. A database that already had categories gets them copied as they are (same ids, same order, same filing; the old tables are left alone);
 *  a new one gets the default tree. Decks that carry a strand but were never filed are then filed under it, as the old Decks page showed them. */
async function ensureTopicSeed(db: Db) {
  if (await marked(db, TOPIC_SEED_KEY)) return;
  if (await marked(db, "categories_seeded")) {
    await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) SELECT id, 'topic', name, parent, position FROM maths.deck_categories ON CONFLICT (id) DO NOTHING`);
    await db.query(`INSERT INTO maths.deck_folder_items (folder_id, deck_id) SELECT f.category_id, f.deck_id FROM maths.deck_filing f WHERE f.category_id IN (SELECT id FROM maths.deck_folders WHERE tree = 'topic') ON CONFLICT DO NOTHING`);
  } else {
    let position = 0;
    for (const t of DEFAULT_TOPIC_TREE) {
      const id = `topic-${slug(t.name)}`;
      await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'topic',$2,NULL,$3) ON CONFLICT (id) DO NOTHING`, [id, t.name, position++]);
      for (const [i, topic] of (t.topics ?? []).entries()) await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'topic',$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [`${id}-${slug(topic)}`, topic, id, i]);
    }
  }
  const strands = new Map<string, string>();
  for (const r of await db.query<Row>(`SELECT id, data->>'strand' AS strand FROM maths.decks`)) if (clean(r.strand)) strands.set(r.id as string, clean(r.strand));
  for (const r of await db.query<Row>(`SELECT id, strand FROM maths.published_decks`)) if (clean(r.strand) && !strands.has(r.id as string)) strands.set(r.id as string, clean(r.strand));
  for (const [deck, strand] of strands) {
    const filed = await db.query<Row>(`SELECT 1 FROM maths.deck_folder_items i JOIN maths.deck_folders f ON f.id = i.folder_id WHERE i.deck_id = $1 AND f.tree = 'topic' LIMIT 1`, [deck]);
    const folder = filed.length ? null : await folderForStrand(db, strand);
    if (folder) await db.query(`INSERT INTO maths.deck_folder_items (folder_id, deck_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [folder, deck]);
  }
  await mark(db, TOPIC_SEED_KEY);
}
const ensureSeed = (db: Db, tree: Tree) => (tree === "class" ? ensureClassSeed(db) : ensureTopicSeed(db));

const toFolder = (r: Row): Folder => ({ id: r.id as string, tree: r.tree as Tree, name: r.name as string, parent: (r.parent as string | null) ?? null, position: r.position as number });

/** One tree's folders in order, how many decks each holds directly, which folders each deck is in, how many decks are in none, and every deck's id and title (for the
 *  "Add a deck" picker). `publicOnly` (the read anyone may make) counts only published decks, drops folders with no published deck anywhere inside, and lists no titles. */
export async function listTree(db: Db, tree: Tree, o: { publicOnly?: boolean } = {}): Promise<{ folders: Folder[]; counts: Record<string, number>; byDeck: Record<string, string[]>; unfiled: number; decks: { id: string; title: string }[] }> {
  await ensureSeed(db, tree);
  let folders = (await db.query<Row>(`SELECT id, tree, name, parent, position FROM maths.deck_folders WHERE tree = $1 ORDER BY position, id`, [tree])).map(toFolder);
  const items = await db.query<Row>(`SELECT i.deck_id, i.folder_id FROM maths.deck_folder_items i JOIN maths.deck_folders f ON f.id = i.folder_id ${o.publicOnly ? "JOIN maths.published_decks p ON p.id = i.deck_id" : ""} WHERE f.tree = $1`, [tree]);
  if (o.publicOnly) {                                                                      // only the folders that lead to a published deck
    const byId = new Map(folders.map((f) => [f.id, f]));
    const keep = new Set<string>();
    for (const r of items) for (let f = byId.get(r.folder_id as string), n = 0; f && n < 20; f = f.parent ? byId.get(f.parent) : undefined, n++) keep.add(f.id);
    folders = folders.filter((f) => keep.has(f.id));
  }
  const counts: Record<string, number> = Object.fromEntries(folders.map((f) => [f.id, 0]));
  const byDeck: Record<string, string[]> = {};
  for (const r of items) { const d = r.deck_id as string, f = r.folder_id as string; counts[f] = (counts[f] ?? 0) + 1; (byDeck[d] ??= []).push(f); }
  const table = o.publicOnly ? "maths.published_decks" : "maths.decks";
  const unfiled = Number((await db.query<Row>(`SELECT count(*) AS n FROM ${table} d WHERE NOT EXISTS (SELECT 1 FROM maths.deck_folder_items i JOIN maths.deck_folders f ON f.id = i.folder_id WHERE i.deck_id = d.id AND f.tree = $1)`, [tree]))[0].n);
  const titles = o.publicOnly ? [] : await db.query<Row>(`SELECT id, title FROM maths.decks ORDER BY COALESCE(created_at, updated_at) DESC, id`);
  return { folders, counts, byDeck, unfiled, decks: titles.map((r) => ({ id: r.id as string, title: r.title as string })) };
}

/** The decks in one folder (or, for `UNFILED`, those in no folder of tree `of`), most recently made first, each with its first slide. Null when there is no such folder.
 *  `publicOnly` lists only published decks, from their published copies, and only for the topic tree. */
export async function decksInFolder(db: Db, folderId: string, o: { publicOnly?: boolean; of?: Tree } = {}): Promise<FolderDeck[] | null> {
  let param: string;
  let cond: (id: string) => string;
  if (folderId === UNFILED) {
    if (!o.of) return null;
    await ensureSeed(db, o.of);
    param = o.of;
    cond = (id) => `NOT EXISTS (SELECT 1 FROM maths.deck_folder_items i JOIN maths.deck_folders f ON f.id = i.folder_id WHERE i.deck_id = ${id} AND f.tree = $1)`;
    if (o.publicOnly && o.of !== "topic") return null;
  } else {
    const f = await db.query<Row>(`SELECT tree FROM maths.deck_folders WHERE id = $1`, [folderId]);
    if (!f.length) return null;
    if (o.publicOnly && f[0].tree !== "topic") return null;
    param = folderId;
    cond = (id) => `EXISTS (SELECT 1 FROM maths.deck_folder_items i WHERE i.deck_id = ${id} AND i.folder_id = $1)`;
  }
  const rows = o.publicOnly
    ? await db.query<Row>(`SELECT p.id, p.title, p.summary, p.slides, p.preview, COALESCE(d.created_at, p.published_at) AS made
        FROM maths.published_decks p LEFT JOIN maths.decks d ON d.id = p.id WHERE ${cond("p.id")} ORDER BY made DESC, p.id`, [param])
    : await db.query<Row>(`SELECT d.id, d.title, d.summary, d.slides,
        CASE WHEN length((d.data->'slides'->0)::text) <= ${MAX_PREVIEW_CHARS} THEN d.data->'slides'->0 END AS preview,
        COALESCE(d.created_at, d.updated_at) AS made, (p.id IS NOT NULL) AS published
        FROM maths.decks d LEFT JOIN maths.published_decks p ON p.id = d.id WHERE ${cond("d.id")} ORDER BY made DESC, d.id`, [param]);
  return rows.map((r) => ({ id: r.id as string, title: r.title as string, summary: r.summary as string, slides: r.slides as number, madeAt: r.made as string, published: o.publicOnly ? true : r.published === true, ...(r.preview ? { preview: r.preview } : {}) }));
}

/** Replaces the folders a deck is in within one tree (its place in the other tree is left alone). Folders that are not in that tree are ignored. Returns the folders now set. */
export async function setDeckFolders(db: Db, deckId: string, tree: Tree, folderIds: string[]): Promise<string[]> {
  await ensureSeed(db, tree);
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
  await ensureSeed(db, "class"); await ensureSeed(db, "topic");
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
