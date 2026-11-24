// Deck classes on Postgres (api/_classes.ts, through /api/decks): a deck can be used with several classes, a class lists its decks most recently made
// first with each deck's first slide for its card, and every read and change needs the admin key.
import { beforeEach, describe, expect, it } from "vitest";
import { setDb } from "../../api/_db";
import { CLASS_GROUPS } from "../../api/_classes";
import { makeTestDb } from "./testDb";

const db = await makeTestDb();
setDb(db);
process.env.ADMIN_KEY = "k";
const { POST, GET } = await import("../../api/decks");

const slide = (id: string) => ({ id, family: "teach", title: id, els: [{ id: `${id}-1`, kind: "text", x: 0, y: 0, w: 10, h: 10, text: id, size: 40 }] });
const deck = (id: string, updatedAt: string) => ({ id, title: `Deck ${id}`, summary: `About ${id}`, slides: [slide("a"), slide("b")], updatedAt });
const post = (body: unknown, key: string | null = "k") => POST(new Request("http://x/api/decks", { method: "POST", headers: key ? { "x-admin-key": key } : {}, body: JSON.stringify(body) }));
const get = (q: string, key: string | null = "k") => GET(new Request(`http://x/api/decks${q}`, { headers: key ? { "x-admin-key": key } : {} }));
type ClassDeck = { id: string; title: string; slides: number; madeAt: string; published: boolean; preview?: unknown };

describe("deck classes", () => {
  beforeEach(async () => { await db.reset(); });

  it("lists the years and classes Harry asked for", () => {
    expect(CLASS_GROUPS.map((g) => g.year)).toEqual(["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "A-Level"]);
    expect(CLASS_GROUPS.find((g) => g.year === "Year 9")!.classes).toEqual(["9M6", "9M3", "9M2"]);
    expect(CLASS_GROUPS.find((g) => g.year === "A-Level")!.classes).toEqual(["12FM", "13MA", "13FM"]);
  });

  it("a class lists its decks most recently made first, each with its first slide", async () => {
    await post({ deck: deck("old", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("new", "2026-11-20T10:00:00.000Z") });
    await post({ deck: deck("mid", "2026-11-10T10:00:00.000Z") });
    for (const id of ["old", "new", "mid"]) expect((await post({ classes: { deckId: id, classIds: ["9M6"] } })).status).toBe(200);
    const body = await (await get("?class=9M6")).json() as { decks: ClassDeck[] };
    expect(body.decks.map((d) => d.id)).toEqual(["new", "mid", "old"]);
    expect(body.decks[0]).toMatchObject({ title: "Deck new", slides: 2, madeAt: "2026-11-20T10:00:00.000Z", published: false });
    expect(body.decks.every((d) => (d.preview as { id: string }).id === "a")).toBe(true);
  });

  it("'made' is when the deck was first saved, not when it was last changed", async () => {
    await post({ deck: deck("a", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("b", "2026-11-05T10:00:00.000Z") });
    await post({ deck: deck("a", "2026-11-30T10:00:00.000Z") });          // a is edited later: it is still the older deck
    for (const id of ["a", "b"]) await post({ classes: { deckId: id, classIds: ["7M1"] } });
    const body = await (await get("?class=7M1")).json() as { decks: ClassDeck[] };
    expect(body.decks.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("a deck can be used with several classes, and setting classes replaces the old ones", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    await post({ classes: { deckId: "x", classIds: ["9M2", "9M6", "13MA"] } });
    expect((await (await get("?classes=all")).json() as { byDeck: Record<string, string[]> }).byDeck).toEqual({ x: ["9M6", "9M3", "9M2", "13MA"].filter((c) => c !== "9M3") });
    const r = await post({ classes: { deckId: "x", classIds: ["9M3"] } });
    expect((await r.json() as { classIds: string[] }).classIds).toEqual(["9M3"]);
    const body = await (await get("?classes=all")).json() as { counts: Record<string, number>; byDeck: Record<string, string[]> };
    expect(body.byDeck).toEqual({ x: ["9M3"] });
    expect(body.counts["9M3"]).toBe(1);
    expect(body.counts["9M6"]).toBe(0);
  });

  it("a published deck's card uses its published first slide, and the admin list says which decks are published", async () => {
    await post({ deck: deck("live", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("draft", "2026-11-02T10:00:00.000Z") });
    for (const id of ["live", "draft"]) await post({ classes: { deckId: id, classIds: ["12FM"] } });
    await post({ publish: deck("live", "2026-11-01T10:00:00.000Z") });
    const all = await (await get("?class=12FM")).json() as { decks: ClassDeck[] };
    expect(all.decks.map((d) => [d.id, d.published])).toEqual([["draft", false], ["live", true]]);
    expect(all.decks.every((d) => d.preview)).toBe(true);
  });

  it("every read and change needs the admin key, and a class that is not on the list is refused", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    expect((await post({ classes: { deckId: "x", classIds: ["9M6"] } }, null)).status).toBe(401);
    expect((await post({ classes: { deckId: "x", classIds: ["9Z9"] } })).status).toBe(400);
    expect((await get("?class=9Z9")).status).toBe(400);
    expect((await get("?class=9M6", null)).status).toBe(401);
    expect((await get("?classes", null)).status).toBe(401);
    expect((await get("?classes=all", null)).status).toBe(401);
  });

  it("the admin read also lists every deck's id and title, newest made first, without any preview", async () => {
    await post({ deck: deck("one", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("two", "2026-11-09T10:00:00.000Z") });
    const body = await (await get("?classes=all")).json() as { decks: { id: string; title: string }[] };
    expect(body.decks).toEqual([{ id: "two", title: "Deck two" }, { id: "one", title: "Deck one" }]);
  });

  it("deleting a deck takes it out of its classes", async () => {
    await post({ deck: deck("gone", "2026-11-01T10:00:00.000Z") });
    await post({ classes: { deckId: "gone", classIds: ["9M6"] } });
    await post({ remove: "gone" });
    expect(((await (await get("?classes=all")).json()) as { byDeck: Record<string, string[]> }).byDeck).toEqual({});
  });

  it("existing decks get a made time from their earliest saved version", async () => {
    await post({ deck: deck("legacy", "2026-11-10T10:00:00.000Z") });
    await db.query(`UPDATE maths.decks SET created_at = NULL WHERE id = 'legacy'`);
    await db.query(`INSERT INTO maths.deck_versions (deck_id, key, at, saved_at, title, slides, data) VALUES ('legacy','k1','2026-11-12T00:00:00.000Z','2026-11-03T09:00:00.000Z','t',1,'{}'::jsonb)`);
    // the back-fill statement is part of the schema; run it as a cold start would
    await db.query(`UPDATE maths.decks d SET created_at = COALESCE((SELECT min(v.saved_at) FROM maths.deck_versions v WHERE v.deck_id = d.id), d.updated_at) WHERE d.created_at IS NULL`);
    await post({ classes: { deckId: "legacy", classIds: ["7M1"] } });
    const body = await (await get("?class=7M1")).json() as { decks: ClassDeck[] };
    expect(body.decks[0].madeAt).toBe("2026-11-03T09:00:00.000Z");
  });
});
