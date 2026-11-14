// The database behind /api/decks (Neon Postgres). One tiny interface so the handler can be tested against an in-memory Postgres
// (src/tests/testDb.ts) and run on Neon in production. Everything lives in the `maths` schema, created on first use.
import { neon } from "@neondatabase/serverless";

export interface Db { query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> }

let injected: Db | null = null;
let real: Db | null = null;
/** Tests hand in their own database. */
export const setDb = (db: Db | null) => { injected = db; schemaReady = new WeakMap(); };

export function getDb(): Db {
  if (injected) return injected;
  if (real) return real;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const sql = neon(url);
  real = { query: async <T,>(text: string, params: unknown[] = []) => (await sql.query(text, params)) as unknown as T[] };
  return real;
}

// One statement per query (the Neon HTTP driver does not run several in one call). Idempotent, so every cold start may run them.
// Times are kept as the ISO strings the app already uses (a deck stamps itself), so nothing is converted on the way in or out.
const SCHEMA = [
  `CREATE SCHEMA IF NOT EXISTS maths`,
  `CREATE TABLE IF NOT EXISTS maths.decks (
     id text PRIMARY KEY,
     title text NOT NULL,
     summary text NOT NULL DEFAULT '',
     slides integer NOT NULL DEFAULT 0,
     updated_at text NOT NULL,
     updated_by text NOT NULL DEFAULT '',
     version integer NOT NULL DEFAULT 1,
     data jsonb NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS maths.deck_versions (
     deck_id text NOT NULL,
     key text NOT NULL,
     at text NOT NULL,
     saved_at text NOT NULL,
     title text NOT NULL,
     slides integer NOT NULL DEFAULT 0,
     data jsonb NOT NULL,
     PRIMARY KEY (deck_id, key)
   )`,
  `CREATE TABLE IF NOT EXISTS maths.published_decks (
     id text PRIMARY KEY,
     title text NOT NULL,
     summary text NOT NULL DEFAULT '',
     strand text,
     slides integer NOT NULL DEFAULT 0,
     published_at text NOT NULL,
     preview jsonb,
     data jsonb NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS maths.deck_categories (
     id text PRIMARY KEY,
     name text NOT NULL,
     parent text,
     position integer NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS maths.deck_filing (
     deck_id text PRIMARY KEY,
     category_id text NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS maths.deck_meta (
     key text PRIMARY KEY,
     value text NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS maths.questions (
     id text PRIMARY KEY,
     data jsonb NOT NULL
   )`,
];

let schemaReady = new WeakMap<Db, Promise<void>>();
/** Creates the tables if they are missing; once per database per process. A failure is not remembered, so the next request tries again. */
export function ensureSchema(db: Db): Promise<void> {
  let p = schemaReady.get(db);
  if (!p) {
    p = (async () => { for (const s of SCHEMA) await db.query(s); })();
    schemaReady.set(db, p);
    p.catch(() => schemaReady.delete(db));
  }
  return p;
}
