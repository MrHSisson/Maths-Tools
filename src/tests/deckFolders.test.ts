// Deck folders on Postgres (api/_folders.ts, through /api/decks): a tree of folders of any depth (the class tree is seeded with Harry's years and classes),
// a deck can sit in several folders, a folder lists its decks most recently made first with each first slide, and every read and change needs the admin key.
import { beforeEach, describe, expect, it } from "vitest";
import { setDb } from "../../api/_db";
import { MAX_DEPTH } from "../../api/_folders";
import { makeTestDb } from "./testDb";

const db = await makeTestDb();
setDb(db);
process.env.ADMIN_KEY = "k";
const { POST, GET } = await import("../../api/decks");

const slide = (id: string) => ({ id, family: "teach", title: id, els: [{ id: `${id}-1`, kind: "text", x: 0, y: 0, w: 10, h: 10, text: id, size: 40 }] });
const deck = (id: string, updatedAt: string) => ({ id, title: `Deck ${id}`, summary: `About ${id}`, slides: [slide("a"), slide("b")], updatedAt });
const post = (body: unknown, key: string | null = "k") => POST(new Request("http://x/api/decks", { method: "POST", headers: key ? { "x-admin-key": key } : {}, body: JSON.stringify(body) }));
const get = (q: string, key: string | null = "k") => GET(new Request(`http://x/api/decks${q}`, { headers: key ? { "x-admin-key": key } : {} }));
type FolderDeck = { id: string; title: string; slides: number; madeAt: string; editedAt: string; published: boolean; pitch?: string; preview?: { id: string } };
type Tree = { folders: { id: string; tree: string; name: string; parent: string | null; position: number }[]; counts: Record<string, number>; byDeck: Record<string, string[]>; decks: { id: string; title: string }[] };
const tree = async (t = "class") => (await (await get(`?folders=${t}`)).json()) as Tree;
const fid = (t: Tree, name: string) => t.folders.find((f) => f.name === name)!.id;
const file = (deckId: string, folderIds: string[], t = "class") => post({ folders: { deckId, tree: t, folderIds } });
const inFolder = async (id: string, extra = "") => (await (await get(`?folder=${id}${extra}`)).json()) as { decks: FolderDeck[] };

describe("deck folders", () => {
  beforeEach(async () => { await db.reset(); });

  it("seeds the class tree: a folder per year, with the classes Harry asked for inside", async () => {
    const t = await tree();
    const tops = t.folders.filter((f) => f.parent === null);
    expect(tops.map((f) => f.name)).toEqual(["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "A-Level"]);
    const kids = (name: string) => t.folders.filter((f) => f.parent === fid(t, name)).map((f) => f.name);
    expect(kids("Year 7")).toEqual(["7M1"]);
    expect(kids("Year 9")).toEqual(["9M6", "9M3", "9M2"]);
    expect(kids("A-Level")).toEqual(["12FM", "13MA", "13FM"]);
    expect(kids("Year 8")).toEqual([]);
    expect(t.folders.every((f) => f.tree === "class")).toBe(true);
  });

  it("seeds once: a folder removed later stays removed", async () => {
    await tree();
    await db.query(`DELETE FROM maths.deck_folders WHERE id = 'class-9m3'`);
    expect((await tree()).folders.some((f) => f.name === "9M3")).toBe(false);
  });

  it("a folder lists its decks most recently made first, each with its first slide", async () => {
    await post({ deck: deck("old", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("new", "2026-11-20T10:00:00.000Z") });
    await post({ deck: deck("mid", "2026-11-10T10:00:00.000Z") });
    const f = fid(await tree(), "9M6");
    for (const id of ["old", "new", "mid"]) expect((await file(id, [f])).status).toBe(200);
    const { decks } = await inFolder(f);
    expect(decks.map((d) => d.id)).toEqual(["new", "mid", "old"]);
    expect(decks[0]).toMatchObject({ title: "Deck new", slides: 2, madeAt: "2026-11-20T10:00:00.000Z", published: false });
    expect(decks.every((d) => d.preview?.id === "a")).toBe(true);
  });

  it("'made' is when the deck was first saved, not when it was last changed", async () => {
    await post({ deck: deck("a", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("b", "2026-11-05T10:00:00.000Z") });
    await post({ deck: deck("a", "2026-11-30T10:00:00.000Z") });          // a is edited later: it is still the older deck
    const f = fid(await tree(), "7M1");
    for (const id of ["a", "b"]) await file(id, [f]);
    expect((await inFolder(f)).decks.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("the list view gets each deck's band and last-edited time, and can ask for no pictures", async () => {
    await post({ deck: { ...deck("a", "2026-11-01T10:00:00.000Z"), pitch: "middle" } });
    await post({ deck: deck("b", "2026-11-05T10:00:00.000Z") });
    await post({ deck: { ...deck("a", "2026-11-30T10:00:00.000Z"), pitch: "middle" } });
    const f = fid(await tree(), "7M1");
    for (const id of ["a", "b"]) await file(id, [f]);
    const { decks } = await inFolder(f, "&previews=0");
    const a = decks.find((d) => d.id === "a")!, b = decks.find((d) => d.id === "b")!;
    expect(a.pitch).toBe("middle");
    expect(b.pitch).toBeUndefined();
    expect(a.editedAt).toBe("2026-11-30T10:00:00.000Z");
    expect(a.madeAt).toBe("2026-11-01T10:00:00.000Z");
    expect(decks.every((d) => d.preview === undefined)).toBe(true);
    expect((await inFolder(f)).decks.every((d) => d.preview?.id === "a")).toBe(true);        // pictures stay the default
  });

  it("works for a folder inside a folder, to any depth", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    const t = await tree();
    let parent = fid(t, "9M6");
    for (let i = 0; i < MAX_DEPTH; i++) { const id = `deep-${i}`; await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ($1,'class',$2,$3,0)`, [id, `Level ${i}`, parent]); parent = id; }
    expect((await file("x", [parent])).status).toBe(200);
    const after = await tree();
    expect(after.byDeck).toEqual({ x: [parent] });
    expect(after.counts[parent]).toBe(1);
    expect((await inFolder(parent)).decks.map((d) => d.id)).toEqual(["x"]);
  });

  it("a deck can be in several folders, and setting folders replaces the old ones", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    const t = await tree();
    const [a, b, c] = [fid(t, "9M2"), fid(t, "9M6"), fid(t, "13MA")];
    await file("x", [a, b, c]);
    expect((await tree()).byDeck.x.sort()).toEqual([a, b, c].sort());
    const r = await file("x", [fid(t, "9M3")]);
    expect((await r.json() as { folderIds: string[] }).folderIds).toEqual([fid(t, "9M3")]);
    const after = await tree();
    expect(after.byDeck).toEqual({ x: [fid(t, "9M3")] });
    expect(after.counts[fid(t, "9M3")]).toBe(1);
    expect(after.counts[a]).toBe(0);
  });

  it("filing in one tree leaves the deck's place in the other tree alone", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ('t-num','topic','Number',NULL,0)`);
    await file("x", ["t-num"], "topic");
    await file("x", [fid(await tree(), "9M6")]);
    expect((await tree("topic")).byDeck).toEqual({ x: ["t-num"] });
    await file("x", [], "class");
    expect((await tree("topic")).byDeck).toEqual({ x: ["t-num"] });
    expect((await tree("class")).byDeck).toEqual({});
  });

  it("a folder from another tree is ignored when filing", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ('t-num','topic','Number',NULL,0)`);
    const r = await file("x", ["t-num", fid(await tree(), "9M6")], "class");
    expect((await r.json() as { folderIds: string[] }).folderIds).toEqual([fid(await tree(), "9M6")]);
  });

  it("the admin list says which decks are published and gives every deck's title for the picker", async () => {
    await post({ deck: deck("live", "2026-11-01T10:00:00.000Z") });
    await post({ deck: deck("draft", "2026-11-02T10:00:00.000Z") });
    const f = fid(await tree(), "12FM");
    for (const id of ["live", "draft"]) await file(id, [f]);
    await post({ publish: deck("live", "2026-11-01T10:00:00.000Z") });
    expect((await inFolder(f)).decks.map((d) => [d.id, d.published])).toEqual([["draft", false], ["live", true]]);
    expect((await tree()).decks).toEqual([{ id: "draft", title: "Deck draft" }, { id: "live", title: "Deck live" }]);
  });

  it("every read and change needs the admin key; a bad tree, folder or request is refused", async () => {
    await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
    const f = fid(await tree(), "9M6");
    expect((await file("x", [f]).then(() => post({ folders: { deckId: "x", tree: "class", folderIds: [f] } }, null))).status).toBe(401);
    expect((await get("?folders=class", null)).status).toBe(401);
    expect((await get(`?folder=${f}`, null)).status).toBe(401);
    expect((await get("?folders=nope")).status).toBe(400);
    expect((await get("?folder=bad%20id")).status).toBe(400);
    expect((await get("?folder=missing")).status).toBe(404);
    expect((await post({ folders: { deckId: "x", tree: "nope", folderIds: [] } })).status).toBe(400);
    expect((await post({ folders: { deckId: "x", tree: "class", folderIds: ["bad id"] } })).status).toBe(400);
  });

  it("deleting a deck takes it out of its folders", async () => {
    await post({ deck: deck("gone", "2026-11-01T10:00:00.000Z") });
    await file("gone", [fid(await tree(), "9M6")]);
    await post({ remove: "gone" });
    expect((await tree()).byDeck).toEqual({});
  });

  describe("changing folders", () => {
    const op = async (o: Record<string, unknown>) => { const r = await post({ folderOp: o }); return { status: r.status, body: await r.json() as Tree & { error?: string } }; };
    const kidsOf = (t: Tree, parent: string | null) => t.folders.filter((f) => f.parent === parent).sort((a, b) => a.position - b.position).map((f) => f.name);

    it("adds a folder inside a folder, at the end, and refuses a clashing or bad name", async () => {
      const t = await tree();
      const y9 = fid(t, "Year 9");
      const r = await op({ op: "add", tree: "class", name: "  Autumn   term ", parent: fid(t, "9M6") });
      expect(r.status).toBe(200);
      expect(kidsOf(r.body, fid(t, "9M6"))).toEqual(["Autumn term"]);
      expect((await op({ op: "add", tree: "class", name: "autumn TERM", parent: fid(t, "9M6") })).status).toBe(409);
      expect((await op({ op: "add", tree: "class", name: "   ", parent: y9 })).status).toBe(400);
      expect((await op({ op: "add", tree: "class", name: "x".repeat(61), parent: y9 })).status).toBe(400);
      expect((await op({ op: "add", tree: "class", name: "Top" })).status).toBe(200);
      expect(kidsOf((await tree()), null).slice(-1)).toEqual(["Top"]);
      expect((await op({ op: "add", tree: "class", name: "Lost", parent: "nope" })).status).toBe(404);
    });

    it("stops folders going deeper than the cap", async () => {
      let t = await tree();
      let parent: string | null = null;
      for (let i = 0; i < MAX_DEPTH; i++) { const r = await op({ op: "add", tree: "class", name: `L${i}`, parent }); expect(r.status).toBe(200); t = r.body; parent = t.folders.find((f) => f.name === `L${i}`)!.id; }
      const r = await op({ op: "add", tree: "class", name: "Too deep", parent });
      expect(r.status).toBe(400);
      expect(r.body.error).toMatch(/deep/);
    });

    it("renames a folder, keeping names unique among its siblings", async () => {
      const t = await tree();
      expect((await op({ op: "rename", id: fid(t, "9M3"), name: "9M3 (new)" })).status).toBe(200);
      expect((await op({ op: "rename", id: fid(t, "9M3"), name: "9m6" })).status).toBe(409);
      expect((await op({ op: "rename", id: "missing", name: "x" })).status).toBe(404);
    });

    it("moves a folder, but never inside itself or too deep, or into another kind of tree", async () => {
      const t = await tree();
      const [y7, y9, c96] = [fid(t, "Year 7"), fid(t, "Year 9"), fid(t, "9M6")];
      const moved = await op({ op: "move", id: c96, parent: y7 });
      expect(moved.status).toBe(200);
      expect(kidsOf(moved.body, y7)).toEqual(["7M1", "9M6"]);
      expect(kidsOf(moved.body, y9)).toEqual(["9M3", "9M2"]);
      expect((await op({ op: "move", id: y9, parent: fid(t, "9M3") })).status).toBe(400);         // inside its own subfolder
      expect((await op({ op: "move", id: y9, parent: y9 })).status).toBe(400);                      // inside itself
      expect((await op({ op: "move", id: c96, parent: null })).status).toBe(200);                   // to the top level
      await db.query(`INSERT INTO maths.deck_folders (id, tree, name, parent, position) VALUES ('t-num','topic','Number',NULL,0)`);
      expect((await op({ op: "move", id: c96, parent: "t-num" })).status).toBe(400);               // another tree
      // a folder with a deep subtree cannot be moved so that it would pass the cap
      let p: string = y9;
      for (let i = 0; i < MAX_DEPTH - 2; i++) { const r = await op({ op: "add", tree: "class", name: `D${i}`, parent: p }); p = r.body.folders.find((f) => f.name === `D${i}`)!.id; }
      expect((await op({ op: "move", id: y9, parent: fid(await tree(), "7M1") })).status).toBe(400);
    });

    it("reorders among siblings, and the ends stay put", async () => {
      const t = await tree();
      const up = await op({ op: "reorder", id: fid(t, "9M2"), direction: "up" });
      expect(kidsOf(up.body, fid(t, "Year 9"))).toEqual(["9M6", "9M2", "9M3"]);
      const first = await op({ op: "reorder", id: fid(t, "9M6"), direction: "up" });
      expect(kidsOf(first.body, fid(t, "Year 9"))).toEqual(["9M6", "9M2", "9M3"]);
    });

    it("deleting a folder moves its decks up to its parent and its subfolders up one level, and touches no deck", async () => {
      await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
      await post({ deck: deck("y", "2026-11-02T10:00:00.000Z") });
      const t = await tree();
      const [y9, c96] = [fid(t, "Year 9"), fid(t, "9M6")];
      const sub = (await op({ op: "add", tree: "class", name: "Autumn", parent: c96 })).body.folders.find((f) => f.name === "Autumn")!.id;
      await file("x", [c96]); await file("y", [sub]);
      const r = await op({ op: "delete", id: c96 });
      expect(r.status).toBe(200);
      expect(r.body.folders.some((f) => f.id === c96)).toBe(false);
      expect(kidsOf(r.body, y9)).toEqual(["9M3", "9M2", "Autumn"]);                                 // the subfolder moved up into Year 9
      expect(r.body.byDeck.x).toEqual([y9]);                                                         // its decks went up to the parent
      expect(r.body.byDeck.y).toEqual([sub]);
      expect((await get("?id=x")).status).toBe(200);                                                 // the deck itself is untouched
    });

    it("deleting a top-level folder leaves its decks in no folder, and a moved-up subfolder with a clashing name is renamed", async () => {
      await post({ deck: deck("x", "2026-11-01T10:00:00.000Z") });
      const t = await tree();
      const c96 = fid(t, "9M6");
      await op({ op: "add", tree: "class", name: "9M3", parent: c96 });                              // same name as a sibling of 9M6
      await file("x", [fid(t, "A-Level")]);
      const r = await op({ op: "delete", id: c96 });
      expect(kidsOf(r.body, fid(t, "Year 9"))).toEqual(["9M3", "9M2", "9M3 (from 9M6)"]);
      const gone = await op({ op: "delete", id: fid(t, "A-Level") });
      expect(gone.body.byDeck).toEqual({});
      expect(kidsOf(gone.body, null)).toContain("12FM");                                             // its classes became top-level folders
    });

    it("folder changes need the admin key and a well-formed request", async () => {
      const t = await tree();
      expect((await post({ folderOp: { op: "delete", id: fid(t, "9M6") } }, null)).status).toBe(401);
      expect((await op({ op: "explode", id: "x" })).status).toBe(400);
      expect((await op({ op: "add", tree: "nope", name: "x" })).status).toBe(400);
    });
  });
});
