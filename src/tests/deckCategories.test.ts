// Deck categories on Postgres (api/_categories.ts, through /api/decks): the tree is seeded from the strands decks already carry, Harry adds,
// renames, reorders and deletes categories and files decks, the public read shows only published decks, and every change needs the admin key.
import { beforeEach, describe, expect, it } from "vitest";
import { setDb } from "../../api/_db";
import { makeTestDb } from "./testDb";

const db = await makeTestDb();
setDb(db);
process.env.ADMIN_KEY = "k";
const { POST, GET } = await import("../../api/decks");

const slide = (id: string) => ({ id, family: "teach", title: id, els: [{ id: `${id}-1`, kind: "text", x: 0, y: 0, w: 10, h: 10, text: id, size: 40 }] });
const deck = (id: string, extra: Record<string, unknown> = {}) => ({ id, title: id, summary: "", slides: [slide("a")], updatedAt: "2026-11-14T10:00:00.000Z", ...extra });
const post = (body: unknown, key: string | null = "k") => POST(new Request("http://x/api/decks", { method: "POST", headers: key ? { "x-admin-key": key } : {}, body: JSON.stringify(body) }));
const get = (q: string, key: string | null = "k") => GET(new Request(`http://x/api/decks${q}`, { headers: key ? { "x-admin-key": key } : {} }));
const op = async (o: Record<string, unknown>) => { const r = await post({ categories: o }); return { status: r.status, body: await r.json() as { categories: { id: string; name: string; parent: string | null; position: number }[]; filing: Record<string, string>; error?: string } }; };
const all = async () => (await (await get("?categories=all")).json()) as { categories: { id: string; name: string; parent: string | null; position: number }[]; filing: Record<string, string> };
const idOf = (data: { categories: { id: string; name: string; parent: string | null }[] }, name: string, parent: string | null = null) => data.categories.find((c) => c.name === name && c.parent === parent)!.id;

describe("deck categories", () => {
  beforeEach(async () => { await db.reset(); });

  it("seeds the five maths strands, A-Level (Maths, Further Maths) and Starters, and files decks by the strand they carry", async () => {
    await post({ deck: deck("est", { strand: "Number" }) });
    await post({ deck: deck("res", { strand: "Decision Mathematics" }) });
    await post({ deck: deck("odd", { strand: "Weird" }) });
    await post({ deck: deck("loose") });
    const d = await all();
    expect(d.categories.filter((c) => c.parent === null).map((c) => c.name)).toEqual(["Number", "Algebra", "Ratio & Proportion", "Geometry", "Probability & Statistics", "A-Level", "Starters", "Weird"]);
    expect(d.categories.filter((c) => c.parent === idOf(d, "A-Level")).map((c) => c.name)).toEqual(["Maths", "Further Maths"]);
    expect(d.filing).toEqual({ est: idOf(d, "Number"), res: idOf(d, "Further Maths", idOf(d, "A-Level")), odd: idOf(d, "Weird") });
  });
  const oldSeed = async (extra: () => Promise<void> = async () => {}) => {
    await post({ deck: deck("res") });                                   // creates the tables without reading the categories
    const names = ["Number", "Algebra", "Ratio & Proportion", "Geometry", "Probability & Statistics", "Decision Mathematics"];
    for (const [i, n] of names.entries()) await db.query(`INSERT INTO maths.deck_categories (id, name, parent, position) VALUES ($1,$2,NULL,$3)`, [`seed-${n.toLowerCase().replace(/[^a-z]+/g, "-")}`, n, i]);
    await db.query(`INSERT INTO maths.deck_meta (key, value) VALUES ('categories_seeded', '2026-11-14T10:00:00.000Z')`);
    await db.query(`INSERT INTO maths.deck_filing (deck_id, category_id) VALUES ('res', 'seed-decision-mathematics')`);
    await extra();
  };
  it("upgrades an untouched earlier tree: Decision Mathematics becomes A-Level > Further Maths, Starters is added", async () => {
    await oldSeed();
    const d = await all();
    expect(d.categories.filter((c) => c.parent === null).map((c) => c.name)).toEqual(["Number", "Algebra", "Ratio & Proportion", "Geometry", "Probability & Statistics", "A-Level", "Starters"]);
    expect(d.filing).toEqual({ res: idOf(d, "Further Maths", idOf(d, "A-Level")) });
    expect(JSON.stringify(await all())).toBe(JSON.stringify(d));        // and only once
  });
  it("leaves a tree Harry has already changed alone", async () => {
    await oldSeed(() => db.query(`INSERT INTO maths.deck_categories (id, name, parent, position) VALUES ('mine','Mine',NULL,9)`).then(() => {}));
    const d = await all();
    expect(d.categories.map((c) => c.name)).toEqual(["Number", "Algebra", "Ratio & Proportion", "Geometry", "Probability & Statistics", "Decision Mathematics", "Mine"]);
  });
  it("seeds once: deleting every category is respected", async () => {
    let d = await all();
    for (const c of d.categories) await op({ op: "delete", id: c.id });
    d = await all();
    expect(d.categories).toEqual([]);
  });
  it("adds strands and topics, refuses a duplicate, a topic inside a topic and a bad name", async () => {
    const start = await all();
    const number = idOf(start, "Number");
    const added = await op({ op: "add", name: "  Factors   & multiples ", parent: number });
    expect(added.status).toBe(200);
    expect(added.body.categories.find((c) => c.name === "Factors & multiples")).toMatchObject({ parent: number });
    const topic = idOf(added.body, "Factors & multiples", number);
    expect((await op({ op: "add", name: "factors & MULTIPLES", parent: number })).status).toBe(409);
    expect((await op({ op: "add", name: "Deeper", parent: topic })).status).toBe(400);
    expect((await op({ op: "add", name: "   " })).status).toBe(400);
    expect((await op({ op: "add", name: "x".repeat(61) })).status).toBe(400);
    expect((await op({ op: "add", name: "Nope", parent: "missing" })).status).toBe(404);
    expect((await op({ op: "add", name: "Plans" })).body.categories.find((c) => c.name === "Plans")).toMatchObject({ parent: null });
  });
  it("renames, and refuses a name already used beside it", async () => {
    const d = await all();
    const r = await op({ op: "rename", id: idOf(d, "Algebra"), name: "Algebra and graphs" });
    expect(r.body.categories.some((c) => c.name === "Algebra and graphs")).toBe(true);
    expect((await op({ op: "rename", id: idOf(d, "Geometry"), name: "number" })).status).toBe(409);
    expect((await op({ op: "rename", id: "missing", name: "X" })).status).toBe(404);
  });
  it("moves a category up and down among its siblings", async () => {
    const d = await all();
    const names = (x: typeof d) => x.categories.filter((c) => c.parent === null).sort((a, b) => a.position - b.position).map((c) => c.name);
    expect(names(d).slice(0, 3)).toEqual(["Number", "Algebra", "Ratio & Proportion"]);
    expect(names((await op({ op: "move", id: idOf(d, "Algebra"), direction: "up" })).body).slice(0, 3)).toEqual(["Algebra", "Number", "Ratio & Proportion"]);
    expect(names((await op({ op: "move", id: idOf(d, "Algebra"), direction: "up" })).body).slice(0, 3)).toEqual(["Algebra", "Number", "Ratio & Proportion"]);   // already first: unchanged
    expect(names((await op({ op: "move", id: idOf(d, "Number"), direction: "down" })).body).slice(0, 3)).toEqual(["Algebra", "Ratio & Proportion", "Number"]);
  });
  it("turns a strand into a topic and a topic back into a strand, but not a strand that has topics", async () => {
    const d = await all();
    const number = idOf(d, "Number");
    await op({ op: "add", name: "Topic", parent: number });
    const algebra = idOf(d, "Algebra");
    const moved = await op({ op: "setParent", id: algebra, parent: number });
    expect(moved.body.categories.find((c) => c.id === algebra)).toMatchObject({ parent: number });
    expect((await op({ op: "setParent", id: number, parent: idOf(d, "Geometry") })).status).toBe(400);      // Number has topics of its own
    const back = await op({ op: "setParent", id: algebra, parent: null });
    expect(back.body.categories.find((c) => c.id === algebra)).toMatchObject({ parent: null });
  });
  it("files a deck, moves it, unfiles it, and refuses a missing category or a bad deck id", async () => {
    await post({ deck: deck("d1") });
    const d = await all();
    const number = idOf(d, "Number"), algebra = idOf(d, "Algebra");
    expect((await op({ op: "file", deckId: "d1", categoryId: number })).body.filing).toEqual({ d1: number });
    expect((await op({ op: "file", deckId: "d1", categoryId: algebra })).body.filing).toEqual({ d1: algebra });
    expect((await op({ op: "file", deckId: "d1", categoryId: null })).body.filing).toEqual({});
    expect((await op({ op: "file", deckId: "d1", categoryId: "missing" })).status).toBe(404);
    expect((await op({ op: "file", deckId: "../x", categoryId: number })).status).toBe(400);
  });
  it("deleting a strand deletes its topics and unfiles the decks in them", async () => {
    await post({ deck: deck("d1") });
    await post({ deck: deck("d2") });
    const d = await all();
    const number = idOf(d, "Number");
    const topic = idOf((await op({ op: "add", name: "Topic", parent: number })).body, "Topic", number);
    await op({ op: "file", deckId: "d1", categoryId: topic });
    await op({ op: "file", deckId: "d2", categoryId: number });
    const r = await op({ op: "delete", id: number });
    expect(r.body.categories.some((c) => c.id === number || c.id === topic)).toBe(false);
    expect(r.body.filing).toEqual({});
  });
  it("deleting a deck unfiles it", async () => {
    await post({ deck: deck("gone") });
    const number = idOf(await all(), "Number");
    await op({ op: "file", deckId: "gone", categoryId: number });
    await post({ remove: "gone" });
    expect((await all()).filing).toEqual({});
  });
  it("the public read lists only published decks' filing and needs no key; editing and the full read need the key", async () => {
    await post({ deck: deck("pub") });
    await post({ deck: deck("priv") });
    await post({ publish: deck("pub") });
    const number = idOf(await all(), "Number");
    await op({ op: "file", deckId: "pub", categoryId: number });
    await op({ op: "file", deckId: "priv", categoryId: number });
    const open = await (await get("?categories", null)).json() as { filing: Record<string, string>; categories: unknown[] };
    expect(open.filing).toEqual({ pub: number });                                      // the unpublished deck's id is not given away
    expect(open.categories.length).toBeGreaterThan(0);
    expect((await get("?categories", null)).headers.get("cache-control")).toContain("s-maxage");
    expect((await get("?categories=all", null)).status).toBe(401);
    expect((await post({ categories: { op: "add", name: "X" } }, null)).status).toBe(401);
    expect((await post({ categories: { op: "add", name: "X" } }, "wrong")).status).toBe(401);
    expect((await all()).filing).toEqual({ pub: number, priv: number });
  });
  it("refuses something that is not a category change", async () => {
    expect((await post({ categories: { op: "explode" } })).status).toBe(400);
    expect((await post({ categories: "x" })).status).toBe(400);
  });
});
