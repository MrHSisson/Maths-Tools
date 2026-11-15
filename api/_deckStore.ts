// The database half of /api/decks: every read and write of decks, version history, published copies and questions. It takes a Db, so
// the handler (api/decks.ts) and the tests use the same code. The pure rules (what may be sent, when to snapshot) stay in _decks.ts.
import type { Db } from "./_db.js";
import { emptyPublished, publishedWith, type DeckIndex, type DeckIndexEntry, type HistoryEntry, type PublishedEntry, type PublishedIndex, type QuestionStore } from "./_decks.js";

type Row = Record<string, unknown>;
const j = (v: unknown) => JSON.stringify(v);

// ── Working decks ──

/** Every deck's summary, as the index blob used to hold it (the title, summary and counts live in their own columns, so this reads no deck bodies). */
export async function listIndex(db: Db): Promise<DeckIndex> {
  const rows = await db.query<Row>(`SELECT id, title, summary, slides, updated_at, updated_by FROM maths.decks`);
  const decks: Record<string, DeckIndexEntry> = {};
  for (const r of rows) decks[r.id as string] = { title: r.title as string, summary: r.summary as string, slides: r.slides as number, updatedAt: r.updated_at as string, updatedBy: r.updated_by as string };
  return { version: 1, decks };
}

export async function getDeck(db: Db, id: string): Promise<Record<string, unknown> | null> {
  const rows = await db.query<Row>(`SELECT data FROM maths.decks WHERE id = $1`, [id]);
  return rows.length ? (rows[0].data as Record<string, unknown>) : null;
}

/** The stored deck with the version it was read at (a save writes only if the version has not moved). */
export async function readDeck(db: Db, id: string): Promise<{ data: Record<string, unknown>; version: number } | null> {
  const rows = await db.query<Row>(`SELECT data, version FROM maths.decks WHERE id = $1`, [id]);
  return rows.length ? { data: rows[0].data as Record<string, unknown>, version: rows[0].version as number } : null;
}

export interface DeckWrite { id: string; title: string; summary: string; slides: number; updatedAt: string; updatedBy: string; body: string }

/** Writes a deck if nobody else has since it was read: `expected` is the version read, or null for "there was none". Returns false when another save got in first. */
export async function writeDeck(db: Db, w: DeckWrite, expected: number | null): Promise<boolean> {
  const cols = [w.id, w.title.slice(0, 200), w.summary.slice(0, 500), w.slides, w.updatedAt, w.updatedBy, w.body];
  const rows = expected === null
    ? await db.query(`INSERT INTO maths.decks (id, title, summary, slides, updated_at, updated_by, data) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT (id) DO NOTHING RETURNING version`, cols)
    : await db.query(`UPDATE maths.decks SET title=$2, summary=$3, slides=$4, updated_at=$5, updated_by=$6, data=$7::jsonb, version=version+1 WHERE id=$1 AND version=$8 RETURNING version`, [...cols, expected]);
  return rows.length > 0;
}

export const removeDeck = (db: Db, id: string) => db.query(`DELETE FROM maths.decks WHERE id = $1`, [id]);

// ── Version history (a deck's rollback points; survive the deck being deleted, as before) ──

export async function newestSnapshotAt(db: Db, id: string): Promise<string | null> {
  const rows = await db.query<Row>(`SELECT at FROM maths.deck_versions WHERE deck_id = $1 ORDER BY at DESC LIMIT 1`, [id]);
  return rows.length ? (rows[0].at as string) : null;
}

export async function addSnapshot(db: Db, id: string, e: HistoryEntry, previous: unknown, keep: number) {
  await db.query(`INSERT INTO maths.deck_versions (deck_id, key, at, saved_at, title, slides, data) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT (deck_id, key) DO UPDATE SET at=EXCLUDED.at, saved_at=EXCLUDED.saved_at, title=EXCLUDED.title, slides=EXCLUDED.slides, data=EXCLUDED.data`,
    [id, e.key, e.at, e.savedAt, e.title, e.slides, j(previous)]);
  await db.query(`DELETE FROM maths.deck_versions WHERE deck_id = $1 AND key NOT IN (SELECT key FROM maths.deck_versions WHERE deck_id = $1 ORDER BY at DESC LIMIT $2)`, [id, keep]);
}

/** Newest first, as the editor lists them. */
export async function listHistory(db: Db, id: string): Promise<HistoryEntry[]> {
  const rows = await db.query<Row>(`SELECT key, at, saved_at, title, slides FROM maths.deck_versions WHERE deck_id = $1 ORDER BY at DESC`, [id]);
  return rows.map((r) => ({ key: r.key as string, at: r.at as string, savedAt: r.saved_at as string, title: r.title as string, slides: r.slides as number }));
}

export async function getSnapshot(db: Db, id: string, key: string): Promise<unknown | null> {
  const rows = await db.query<Row>(`SELECT data FROM maths.deck_versions WHERE deck_id = $1 AND key = $2`, [id, key]);
  return rows.length ? rows[0].data : null;
}

// ── Published copies (what anyone may play) ──

const publishedEntry = (r: Row): PublishedEntry => ({
  title: r.title as string, summary: r.summary as string, ...(r.strand ? { strand: r.strand as string } : {}), ...(r.pitch ? { pitch: r.pitch as string } : {}),
  slides: r.slides as number, publishedAt: r.published_at as string, ...(r.preview ? { preview: r.preview } : {}),
});

export async function listPublished(db: Db): Promise<PublishedIndex> {
  const rows = await db.query<Row>(`SELECT id, title, summary, strand, pitch, slides, published_at, preview FROM maths.published_decks`);
  const decks: Record<string, PublishedEntry> = {};
  for (const r of rows) decks[r.id as string] = publishedEntry(r);
  return { version: 1, decks };
}

export async function getPublished(db: Db, id: string): Promise<unknown | null> {
  const rows = await db.query<Row>(`SELECT data FROM maths.published_decks WHERE id = $1`, [id]);
  return rows.length ? rows[0].data : null;
}

/** Stores the frozen copy and its listing entry (title, summary, strand, first-slide preview) together; returns the entry. */
export async function putPublished(db: Db, deck: { id: string; title: string; summary: string; strand?: string; pitch?: string; slides: unknown[] }, frozenBody: string, now: string): Promise<PublishedEntry> {
  const entry = publishedWith(emptyPublished(), deck, now).decks[deck.id];
  await db.query(
    `INSERT INTO maths.published_decks (id, title, summary, strand, pitch, slides, published_at, preview, data) VALUES ($1,$2,$3,$4,$9,$5,$6,$7::jsonb,$8::jsonb)
     ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, strand=EXCLUDED.strand, pitch=EXCLUDED.pitch, slides=EXCLUDED.slides, published_at=EXCLUDED.published_at, preview=EXCLUDED.preview, data=EXCLUDED.data`,
    [deck.id, entry.title, entry.summary, entry.strand ?? null, entry.slides, entry.publishedAt, entry.preview === undefined ? null : j(entry.preview), frozenBody, entry.pitch ?? null]);
  return entry;
}

export const removePublished = (db: Db, id: string) => db.query(`DELETE FROM maths.published_decks WHERE id = $1`, [id]);

// ── The shared question library ──

export async function listQuestions(db: Db): Promise<QuestionStore> {
  const rows = await db.query<Row>(`SELECT id, data FROM maths.questions`);
  const questions: Record<string, unknown> = {};
  for (const r of rows) questions[r.id as string] = r.data;
  return { version: 1, questions };
}

export const putQuestion = (db: Db, id: string, q: unknown) =>
  db.query(`INSERT INTO maths.questions (id, data) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [id, j(q)]);
export const removeQuestion = (db: Db, id: string) => db.query(`DELETE FROM maths.questions WHERE id = $1`, [id]);

// ── One-off import from the old Blob store (api/migrate-decks.ts) ──

/** Imports a deck only if the database has no copy of it, or an older one: re-running the import never overwrites a newer edit. Returns whether it wrote. */
export async function importDeck(db: Db, w: DeckWrite): Promise<boolean> {
  const rows = await db.query(
    `INSERT INTO maths.decks (id, title, summary, slides, updated_at, updated_by, data) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
     ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, slides=EXCLUDED.slides, updated_at=EXCLUDED.updated_at, updated_by=EXCLUDED.updated_by, data=EXCLUDED.data, version=maths.decks.version+1
     WHERE maths.decks.updated_at < EXCLUDED.updated_at RETURNING version`,
    [w.id, w.title.slice(0, 200), w.summary.slice(0, 500), w.slides, w.updatedAt, w.updatedBy, w.body]);
  return rows.length > 0;
}
