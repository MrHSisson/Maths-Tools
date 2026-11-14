// Deck categories: a two-level tree Harry controls (a strand, with topics inside it) and the filing of each deck under one of them.
// Kept in their own tables, apart from the decks, so filing a deck never changes the deck itself (no new version, no merge, no clash with an edit).
// The first read seeds the tree from the strands decks already carry (the five GCSE strands, plus any other name a deck holds), and files those decks.
import type { Db } from "./_db.js";
import { validId } from "./_decks.js";

export interface Category { id: string; name: string; /** null for a strand; a strand's id for a topic inside it. */ parent: string | null; position: number }
export interface CategoryData { categories: Category[]; /** deck id → category id. A deck not listed is not filed. */ filing: Record<string, string> }
export type CategoryOp =
  | { op: "add"; name: string; parent?: string | null }
  | { op: "rename"; id: string; name: string }
  | { op: "move"; id: string; direction: "up" | "down" }
  | { op: "setParent"; id: string; parent: string | null }
  | { op: "delete"; id: string }
  | { op: "file"; deckId: string; categoryId: string | null };
export type OpResult = { ok: true; data: CategoryData } | { ok: false; error: string; status: number };

type Row = Record<string, unknown>;
export const MAX_NAME = 60;
/** The strands decks could be filed under before categories were Harry's to control (the GCSE categories on the landing page). */
export const DEFAULT_STRANDS = ["Number", "Algebra", "Ratio & Proportion", "Geometry", "Probability & Statistics"];

const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "category";

/** Checks the shape of an operation sent by a device. */
export function parseOp(raw: unknown): CategoryOp | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const idOk = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);
  switch (o.op) {
    case "add": return typeof o.name === "string" && (o.parent === undefined || o.parent === null || idOk(o.parent)) ? { op: "add", name: o.name, parent: (o.parent as string | null | undefined) ?? null } : null;
    case "rename": return idOk(o.id) && typeof o.name === "string" ? { op: "rename", id: o.id, name: o.name } : null;
    case "move": return idOk(o.id) && (o.direction === "up" || o.direction === "down") ? { op: "move", id: o.id, direction: o.direction } : null;
    case "setParent": return idOk(o.id) && (o.parent === null || idOk(o.parent)) ? { op: "setParent", id: o.id, parent: o.parent as string | null } : null;
    case "delete": return idOk(o.id) ? { op: "delete", id: o.id } : null;
    case "file": return validId(o.deckId) && (o.categoryId === null || idOk(o.categoryId)) ? { op: "file", deckId: o.deckId as string, categoryId: o.categoryId as string | null } : null;
    default: return null;
  }
}

/** Seeds the tree once (a marker row says it has been done, so deleting every category later is respected). Deterministic ids and DO NOTHING make a race between two cold starts harmless. */
async function ensureSeed(db: Db) {
  if ((await db.query(`SELECT value FROM maths.deck_meta WHERE key = 'categories_seeded'`)).length) return;
  const strands = new Map<string, string>();                       // deck id → the strand it holds
  for (const r of await db.query<Row>(`SELECT id, data->>'strand' AS strand FROM maths.decks`)) if (clean(r.strand)) strands.set(r.id as string, clean(r.strand));
  for (const r of await db.query<Row>(`SELECT id, strand FROM maths.published_decks`)) if (clean(r.strand) && !strands.has(r.id as string)) strands.set(r.id as string, clean(r.strand));
  const names = [...DEFAULT_STRANDS];
  for (const s of strands.values()) if (!names.some((n) => same(n, s))) names.push(s);
  for (const [i, n] of names.entries()) await db.query(`INSERT INTO maths.deck_categories (id, name, parent, position) VALUES ($1,$2,NULL,$3) ON CONFLICT (id) DO NOTHING`, [`seed-${slug(n)}`, n, i]);
  for (const [deck, s] of strands) await db.query(`INSERT INTO maths.deck_filing (deck_id, category_id) VALUES ($1,$2) ON CONFLICT (deck_id) DO NOTHING`, [deck, `seed-${slug(names.find((n) => same(n, s)) ?? s)}`]);
  await db.query(`INSERT INTO maths.deck_meta (key, value) VALUES ('categories_seeded', $1) ON CONFLICT (key) DO NOTHING`, [new Date().toISOString()]);
}

/** The tree and the filing. `publishedOnly` (the public read) lists only decks that are published, so an unpublished deck's id is not given away. */
export async function listCategories(db: Db, o: { publishedOnly?: boolean } = {}): Promise<CategoryData> {
  await ensureSeed(db);
  const cats = await db.query<Row>(`SELECT id, name, parent, position FROM maths.deck_categories ORDER BY position, id`);
  const fil = o.publishedOnly
    ? await db.query<Row>(`SELECT f.deck_id, f.category_id FROM maths.deck_filing f JOIN maths.published_decks p ON p.id = f.deck_id`)
    : await db.query<Row>(`SELECT deck_id, category_id FROM maths.deck_filing`);
  return {
    categories: cats.map((r) => ({ id: r.id as string, name: r.name as string, parent: (r.parent as string | null) ?? null, position: r.position as number })),
    filing: Object.fromEntries(fil.map((r) => [r.deck_id as string, r.category_id as string])),
  };
}

const fail = (error: string, status = 400): OpResult => ({ ok: false, error, status });

/** Applies one change and returns the whole tree and filing as they now stand. */
export async function applyOp(db: Db, op: CategoryOp): Promise<OpResult> {
  const { categories } = await listCategories(db);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const siblings = (parent: string | null) => categories.filter((c) => c.parent === parent).sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : 1));
  const taken = (name: string, parent: string | null, except?: string) => categories.some((c) => c.parent === parent && c.id !== except && same(c.name, name));
  const done = async (): Promise<OpResult> => ({ ok: true, data: await listCategories(db) });

  switch (op.op) {
    case "add": {
      const name = clean(op.name), parent = op.parent ?? null;
      if (!name || name.length > MAX_NAME) return fail(`A category name is 1 to ${MAX_NAME} characters`);
      if (parent !== null) { const p = byId.get(parent); if (!p) return fail("That strand does not exist", 404); if (p.parent !== null) return fail("Topics sit inside a strand: a topic cannot hold another"); }
      if (taken(name, parent)) return fail(`There is already a ${parent === null ? "strand" : "topic"} called "${name}" here`, 409);
      const position = siblings(parent).reduce((m, c) => Math.max(m, c.position + 1), 0);
      await db.query(`INSERT INTO maths.deck_categories (id, name, parent, position) VALUES ($1,$2,$3,$4)`, [`c_${crypto.randomUUID().slice(0, 8)}`, name, parent, position]);
      return done();
    }
    case "rename": {
      const c = byId.get(op.id), name = clean(op.name);
      if (!c) return fail("No such category", 404);
      if (!name || name.length > MAX_NAME) return fail(`A category name is 1 to ${MAX_NAME} characters`);
      if (taken(name, c.parent, c.id)) return fail(`There is already one called "${name}" here`, 409);
      await db.query(`UPDATE maths.deck_categories SET name = $2 WHERE id = $1`, [c.id, name]);
      return done();
    }
    case "move": {
      const c = byId.get(op.id);
      if (!c) return fail("No such category", 404);
      const line = siblings(c.parent), i = line.findIndex((x) => x.id === c.id), j = op.direction === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= line.length) return done();                         // already first or last
      [line[i], line[j]] = [line[j], line[i]];
      for (const [pos, x] of line.entries()) await db.query(`UPDATE maths.deck_categories SET position = $2 WHERE id = $1`, [x.id, pos]);
      return done();
    }
    case "setParent": {
      const c = byId.get(op.id);
      if (!c) return fail("No such category", 404);
      if (op.parent !== null) {
        const p = byId.get(op.parent);
        if (!p) return fail("That strand does not exist", 404);
        if (p.parent !== null || p.id === c.id) return fail("A topic can only go inside a strand");
        if (categories.some((x) => x.parent === c.id)) return fail("This strand has topics of its own, so it cannot become a topic");
      }
      if (taken(c.name, op.parent, c.id)) return fail(`There is already one called "${c.name}" there`, 409);
      const position = siblings(op.parent).reduce((m, x) => Math.max(m, x.position + 1), 0);
      await db.query(`UPDATE maths.deck_categories SET parent = $2, position = $3 WHERE id = $1`, [c.id, op.parent, position]);
      return done();
    }
    case "delete": {
      const c = byId.get(op.id);
      if (!c) return fail("No such category", 404);
      const ids = [c.id, ...categories.filter((x) => x.parent === c.id).map((x) => x.id)];       // a strand takes its topics with it
      for (const id of ids) { await db.query(`DELETE FROM maths.deck_filing WHERE category_id = $1`, [id]); await db.query(`DELETE FROM maths.deck_categories WHERE id = $1`, [id]); }
      return done();
    }
    case "file": {
      if (op.categoryId === null) { await db.query(`DELETE FROM maths.deck_filing WHERE deck_id = $1`, [op.deckId]); return done(); }
      if (!byId.has(op.categoryId)) return fail("No such category", 404);
      await db.query(`INSERT INTO maths.deck_filing (deck_id, category_id) VALUES ($1,$2) ON CONFLICT (deck_id) DO UPDATE SET category_id = EXCLUDED.category_id`, [op.deckId, op.categoryId]);
      return done();
    }
  }
}

/** A deck was deleted: it is no longer filed anywhere. */
export const unfileDeck = (db: Db, deckId: string) => db.query(`DELETE FROM maths.deck_filing WHERE deck_id = $1`, [deckId]);
