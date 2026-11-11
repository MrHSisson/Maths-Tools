// An in-memory Postgres (PGlite) standing in for Neon, for the decks API tests. `hook` sees every statement before it runs, so a test can
// make another save land between a read and a write.
import { PGlite } from "@electric-sql/pglite";
import { setDb, type Db } from "../../api/_db";

interface TestDb extends Db { raw: PGlite; hook: ((text: string) => Promise<void> | void) | null; reset: () => Promise<void> }   // reset: empty database; the next request creates the tables again

export async function makeTestDb(): Promise<TestDb> {
  const raw = new PGlite();
  const db: TestDb = {
    raw, hook: null,
    query: async <T,>(text: string, params: unknown[] = []) => { if (db.hook) await db.hook(text); return (await raw.query(text, params)).rows as T[]; },
    reset: async () => { try { await raw.exec(`DROP SCHEMA IF EXISTS maths CASCADE`); } catch { /* none yet */ } setDb(db); },
  };
  return db;
}
