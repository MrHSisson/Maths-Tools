// /api/decks on Postgres: listing, deleting, published copies (public and cached), the question library, and what a save writes to the index columns.
import { beforeEach, describe, expect, it } from "vitest";
import { setDb } from "../../api/_db";
import { makeTestDb } from "./testDb";

const db = await makeTestDb();
setDb(db);
process.env.ADMIN_KEY = "k";
const { POST, GET } = await import("../../api/decks");

const slide = (id: string) => ({ id, family: "teach", title: id, els: [{ id: `${id}-1`, kind: "text", x: 0, y: 0, w: 10, h: 10, text: id, size: 40 }] });
const deck = (id: string, title = "T", extra: Record<string, unknown> = {}) => ({ id, title, summary: "S", slides: [slide("a"), slide("b")], updatedAt: "2026-11-11T10:00:00.000Z", ...extra });
const post = (body: unknown, key = "k") => POST(new Request("http://x/api/decks", { method: "POST", headers: { "x-admin-key": key }, body: JSON.stringify(body) }));
const get = (q = "", key: string | null = "k") => GET(new Request(`http://x/api/decks${q}`, { headers: key ? { "x-admin-key": key } : {} }));

describe("decks in Postgres", () => {
  beforeEach(async () => { await db.reset(); });

  it("lists every deck's summary (no bodies) and the shared questions, in the shape the app reads", async () => {
    await post({ deck: deck("one", "First"), by: "Harry" });
    await post({ deck: deck("two", "Second"), by: "Claude" });
    const q = { id: "my-q-1", latex: "1+1", answer: "2", working: [] };
    await post({ question: q });
    const res = await (await get()).json();
    expect(res.index).toEqual({ version: 1, decks: {
      one: { title: "First", summary: "S", slides: 2, updatedAt: "2026-11-11T10:00:00.000Z", updatedBy: "Harry" },
      two: { title: "Second", summary: "S", slides: 2, updatedAt: "2026-11-11T10:00:00.000Z", updatedBy: "Claude" },
    } });
    expect(res.questions).toEqual({ version: 1, questions: { "my-q-1": q } });
    expect((await (await get("?id=one")).json()).title).toBe("First");
    expect((await get("?id=nope")).status).toBe(404);
  });

  it("a save returns the index entry, and a second save to the same id replaces the row", async () => {
    const first = await (await post({ deck: deck("d", "Before"), by: "Harry" })).json();
    expect(first).toMatchObject({ saved: true, merged: false, entry: { title: "Before", slides: 2, updatedBy: "Harry" } });
    await post({ deck: deck("d", "After", { slides: [slide("a")], updatedAt: "2026-11-11T11:00:00.000Z" }), by: "Harry" });
    const index = (await (await get()).json()).index.decks;
    expect(Object.keys(index)).toEqual(["d"]);
    expect(index.d).toMatchObject({ title: "After", slides: 1, updatedAt: "2026-11-11T11:00:00.000Z" });
  });

  it("two saves at the same moment both land (one is retried against the other's version)", async () => {
    const base = deck("race");
    await post({ deck: base, by: "Harry" });
    const edit = (s: string) => ({ ...base, slides: base.slides.map((x) => (x.id === s ? { ...x, els: [{ ...x.els[0], text: `${s} edited` }] } : x)), updatedAt: new Date().toISOString() });
    const [a, b] = await Promise.all([post({ deck: edit("a"), base, by: "Harry" }), post({ deck: edit("b"), base, by: "Claude" })]);
    expect([a.status, b.status]).toEqual([200, 200]);
    const d = await (await get("?id=race")).json();
    expect([d.slides[0].els[0].text, d.slides[1].els[0].text]).toEqual(["a edited", "b edited"]);
  });

  it("deleting a deck removes it from the list but keeps its history", async () => {
    await post({ deck: deck("gone"), by: "Harry" });
    await post({ deck: deck("gone", "Edited", { updatedAt: "2026-11-11T12:00:00.000Z" }), by: "Harry" });
    expect((await (await post({ remove: "gone" })).json()).removed).toBe(true);
    expect((await get("?id=gone")).status).toBe(404);
    expect((await (await get()).json()).index.decks).toEqual({});
    expect((await (await get("?history=gone")).json()).entries).toHaveLength(1);
    expect((await post({ remove: "../x" })).status).toBe(400);
  });

  it("publishing is public, cached for a minute, and unpublishing takes it down", async () => {
    await post({ deck: deck("pub", "Public one", { strand: "Number" }), by: "Harry" });
    expect((await (await post({ publish: deck("pub", "Public one", { strand: "Number" }) })).json()).entry).toMatchObject({ title: "Public one", strand: "Number", slides: 2, preview: { id: "a" } });
    const list = await get("?published", null);                       // no admin key needed
    expect(list.status).toBe(200);
    expect(list.headers.get("cache-control")).toContain("s-maxage=60");
    expect((await list.json()).decks.pub).toMatchObject({ title: "Public one", strand: "Number", slides: 2 });
    const one = await get("?published=pub", null);
    expect(one.headers.get("cache-control")).toContain("s-maxage=60");
    expect(await one.json()).toMatchObject({ id: "pub", publishedAt: expect.any(String) });
    expect((await get("")).headers.get("cache-control")).toBe("no-store");   // the private reads are never cached
    await post({ unpublish: "pub" });
    expect((await get("?published=pub", null)).status).toBe(404);
    expect((await (await get("?published", null)).json()).decks).toEqual({});
  });

  it("the private reads and every write need the admin key; the questions can be dropped", async () => {
    expect((await get("", null)).status).toBe(401);
    expect((await post({ deck: deck("x") }, "wrong")).status).toBe(401);
    await post({ question: { id: "my-q-2", latex: "2+2", answer: "4", working: [] } });
    await post({ removeQuestion: "my-q-2" });
    expect((await (await get()).json()).questions.questions).toEqual({});
    expect((await post({ question: { id: "my-q-3" } })).status).toBe(400);
    expect((await post({ nothing: true })).status).toBe(400);
  });
});
