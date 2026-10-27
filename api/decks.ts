// GET  /api/decks                         → { index, questions }: every shared deck's summary, and the shared questions
// GET  /api/decks?id=<id>                 → one deck
// POST /api/decks {deck, by}              → save a deck (whole), and update the index
// POST /api/decks {remove: <id>}          → delete a deck (a built deck goes back to its original)
// POST /api/decks {question}              → save one question; {removeQuestion: <id>} → drop one
// All need the header  x-admin-key: <ADMIN_KEY>  (the Developing-tools password), like /api/tool-notes.
// The index and the questions are single blobs written with their ETag, so two devices never overwrite each other;
// a deck is its own blob and the last save wins.
import { del, get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import { checkDeck, checkQuestion, deckPath, emptyIndex, emptyQuestions, indexWith, indexWithout, validId, type DeckIndex, type QuestionStore } from "./_decks.js";

const INDEX = "decks-index.json";
const QUESTIONS = "deck-questions.json";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function authorised(req: Request): Response | null {
  const key = process.env.ADMIN_KEY;
  if (!key) return json({ error: "ADMIN_KEY is not configured" }, 503);
  return req.headers.get("x-admin-key") === key ? null : json({ error: "Not authorised" }, 401);
}

/** Reads a JSON blob with its strong ETag (from head: a download's ETag turns weak and a conditional write rejects it). */
async function readJson<T>(path: string, empty: () => T): Promise<{ value: T; etag: string | null }> {
  let etag: string;
  try { etag = (await head(path)).etag; } catch (e) {
    if (e instanceof BlobNotFoundError) return { value: empty(), etag: null };
    throw e;
  }
  const res = await get(path, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return { value: empty(), etag: null };
  return { value: JSON.parse(await new Response(res.stream).text()) as T, etag };
}

const writeJson = (path: string, value: unknown, etag: string | null) =>
  put(path, JSON.stringify(value), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: etag !== null, ...(etag ? { ifMatch: etag } : {}) });

/** Read, change and write a blob, retrying when another writer got there first. */
async function update<T>(path: string, empty: () => T, change: (v: T) => T): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { value, etag } = await readJson(path, empty);
    const next = change(value);
    try { await writeJson(path, next, etag); return next; } catch (e) {
      if (!(e instanceof BlobPreconditionFailedError) && !String(e).includes("already exists")) throw e;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  return null;
}

export async function GET(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (id !== null) {
    if (!validId(id)) return json({ error: "Bad id" }, 400);
    const { value } = await readJson<unknown>(deckPath(id), () => null);
    return value ? json(value) : json({ error: "Not found" }, 404);
  }
  const [{ value: index }, { value: questions }] = await Promise.all([readJson<DeckIndex>(INDEX, emptyIndex), readJson<QuestionStore>(QUESTIONS, emptyQuestions)]);
  return json({ index, questions });
}

export async function POST(req: Request) {
  const denied = authorised(req);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON (or the deck is too large to share)" }, 400); }
  const by = typeof body.by === "string" ? body.by : "unknown";
  const now = new Date().toISOString();

  if ("deck" in body) {
    const checked = checkDeck(body.deck);
    if ("error" in checked) return json({ error: checked.error }, checked.status);
    await put(deckPath(checked.deck.id), checked.body, { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
    const index = await update(INDEX, emptyIndex, (i) => indexWith(i, checked.deck, by, now));
    return index ? json({ saved: true, entry: index.decks[checked.deck.id] }) : json({ error: "Could not save — please try again" }, 409);
  }
  if ("remove" in body) {
    if (!validId(body.remove)) return json({ error: "Bad id" }, 400);
    const id = body.remove;
    try { await del(deckPath(id)); } catch (e) { if (!(e instanceof BlobNotFoundError)) throw e; }
    await update(INDEX, emptyIndex, (i) => indexWithout(i, id));
    return json({ removed: true });
  }
  if ("question" in body) {
    const q = checkQuestion(body.question);
    if (!q) return json({ error: "A question needs an id, its maths, an answer and its working" }, 400);
    const store = await update(QUESTIONS, emptyQuestions, (s): QuestionStore => ({ version: 1, questions: { ...s.questions, [q.id]: q.q } }));
    return store ? json({ saved: true }) : json({ error: "Could not save — please try again" }, 409);
  }
  if ("removeQuestion" in body) {
    if (!validId(body.removeQuestion)) return json({ error: "Bad id" }, 400);
    const id = body.removeQuestion;
    await update(QUESTIONS, emptyQuestions, (s): QuestionStore => { const { [id]: _gone, ...rest } = s.questions; return { version: 1, questions: rest }; });
    return json({ removed: true });
  }
  return json({ error: "Nothing to do" }, 400);
}
