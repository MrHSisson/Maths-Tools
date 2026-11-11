// TEMPORARY. One-off copy of everything the decks API kept in Vercel Blob into Postgres (api/_deckStore.ts). Delete this file, and the
// @vercel/blob dependency if nothing else uses it, once the move is confirmed.
//   POST /api/migrate-decks            {dryRun?: true, ids?: ["deck-id", …]}   needs  x-admin-key: <ADMIN_KEY>
// `ids` limits the decks (and their history) to those, so a big store can be moved in pieces if one call runs out of time (vercel.json allows 60 s).
// Safe to run again: a deck is written only if the database has none or an older one, and history, published copies and questions are upserts.
// Nothing in Blob is changed or deleted. The answer lists what was found and what was written, so the counts can be compared by eye.
import { get } from "@vercel/blob";
import { getDb, ensureSchema } from "./_db.js";
import { addSnapshot, importDeck, putPublished, putQuestion } from "./_deckStore.js";
import { MAX_SNAPSHOTS, publishedBody, type DeckHistory, type DeckIndex, type PublishedIndex, type QuestionStore } from "./_decks.js";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 1), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** A JSON blob, or null when it does not exist. */
async function readBlob<T>(path: string): Promise<T | null> {
  try {
    const res = await get(path, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  } catch (e) {
    if (String((e as Error)?.name).includes("NotFound")) return null;
    throw e;
  }
}

export async function POST(req: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return json({ error: "ADMIN_KEY is not configured" }, 503);
  if (req.headers.get("x-admin-key") !== key) return json({ error: "Not authorised" }, 401);
  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean; ids?: string[] };
  const dry = body.dryRun === true;
  const db = getDb(); await ensureSchema(db);
  const report = { dryRun: dry, decks: { found: 0, written: 0, skippedNewer: 0, missing: [] as string[] }, history: { found: 0 }, published: { found: 0, written: 0, missing: [] as string[] }, questions: { found: 0 } };

  const index = await readBlob<DeckIndex>("decks-index.json");
  for (const [id, entry] of Object.entries(index?.decks ?? {})) {
    if (Array.isArray(body.ids) && !body.ids.includes(id)) continue;
    report.decks.found++;
    const deck = await readBlob<Record<string, unknown>>(`decks/${id}.json`);
    if (!deck || !Array.isArray(deck.slides)) { report.decks.missing.push(id); continue; }
    const updatedAt = typeof deck.updatedAt === "string" ? deck.updatedAt : entry.updatedAt;
    if (!dry && await importDeck(db, { id, title: String(deck.title ?? entry.title), summary: typeof deck.summary === "string" ? deck.summary : entry.summary, slides: deck.slides.length, updatedAt, updatedBy: entry.updatedBy ?? "", body: JSON.stringify(deck) })) report.decks.written++;
    else if (!dry) report.decks.skippedNewer++;
    const hist = await readBlob<DeckHistory>(`history/${id}/index.json`);
    const snaps = await Promise.all((hist?.entries ?? []).map(async (e) => ({ e, snap: await readBlob<unknown>(`history/${id}/${e.key}.json`) })));      // the snapshots are independent: read them together
    for (const { e, snap } of snaps) {
      if (!snap) continue;
      report.history.found++;
      if (!dry) await addSnapshot(db, id, e, snap, MAX_SNAPSHOTS);
    }
  }

  const pub = await readBlob<PublishedIndex>("published-index.json");
  for (const id of Object.keys(pub?.decks ?? {})) {
    if (Array.isArray(body.ids) && !body.ids.includes(id)) continue;
    report.published.found++;
    const copy = await readBlob<Record<string, unknown>>(`published/${id}.json`);
    if (!copy || !Array.isArray(copy.slides)) { report.published.missing.push(id); continue; }
    const at = typeof copy.publishedAt === "string" ? copy.publishedAt : pub!.decks[id].publishedAt;
    if (!dry) { await putPublished(db, { id, title: String(copy.title ?? ""), summary: typeof copy.summary === "string" ? copy.summary : "", strand: typeof copy.strand === "string" ? copy.strand : undefined, slides: copy.slides }, publishedBody(JSON.stringify(copy), at), at); report.published.written++; }
  }

  const questions = await readBlob<QuestionStore>("deck-questions.json");
  for (const [id, q] of Object.entries(questions?.questions ?? {})) { report.questions.found++; if (!dry) await putQuestion(db, id, q); }
  return json(report);
}
