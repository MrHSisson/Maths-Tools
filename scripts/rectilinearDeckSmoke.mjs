// Deck APIs are intercepted: this check never changes live teacher content.
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const require2 = createRequire(import.meta.url);
const { chromium } = require2(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://localhost:5173";
const output = fs.mkdtempSync(path.join(os.tmpdir(), "rectilinear-deck-smoke-"));
(async () => {
  const b = await chromium.launch({ ...process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}, args: ["--no-sandbox"] });
  try {
    const context = await b.newContext({ viewport: { width: 1366, height: 900 } });
    let deck = null;
    const errors = [];
    await context.addInitScript(() => {
      window.print = () => {
      };
    });
    await context.route("**/api/decks*", async (route) => {
      const req = route.request(), url = new URL(req.url());
      let data = {};
      if (req.method() === "POST") {
        const body = req.postDataJSON();
        if (body.deck) deck = body.deck;
        data = { ok: true, deck };
      } else if (url.searchParams.has("published")) data = { decks: {} };
      else if (url.searchParams.has("id")) data = deck;
      else data = { index: { decks: deck ? { [deck.id]: { updatedAt: deck.updatedAt } } : {} }, questions: { questions: {} } };
      await route.fulfill({ json: data });
    });
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "/");
    deck = await p.evaluate(async () => {
      const { Q, S, buildDeck } = await import("/src/decks/builder.ts");
      const { defaultRectilinear } = await import("/api/_rectilinear.ts");
      const { authoredSheetSlide } = await import("/src/decks/worksheets.ts");
      const { saveDeck } = await import("/src/decks/store.ts");
      const { setDevMode } = await import("/src/devMode.ts");
      setDevMode(true);
      const spec = defaultRectilinear();
      const qs = [Q.rectilinear("l-add", spec), Q.rectilinear("l-subtract", { ...spec, method: "subtract", scaffold: "none" })];
      const worksheet = Array.from({ length: 12 }, (_, i) => Q.rectilinear("sheet-" + i, { ...spec, scaffold: i < 4 ? "full" : i < 8 ? "split" : "none", method: i > 9 ? "subtract" : "split" }));
      const d = await buildDeck({ id: "my-rectilinear-foundations-smoke", title: "Rectilinear foundations", summary: "Editor foundations demonstration", tool: "perimeter-and-area", updatedAt: (/* @__PURE__ */ new Date()).toISOString(), slides: [S.title("intro", "Rectilinear area"), S.deliberate("fixed", "Two methods", qs), { ...S.general("live", "General practice", "perimeter-and-area", { sub: "compound", level: "level1", multiSelect: { area: true, perimeter: false, all: true, missing: false }, variables: { showSplit: false, reducedLabels: true } }, 123), els: [{ id: "live-generator", kind: "generator", tool: "perimeter-and-area", preset: { sub: "compound", level: "level1", multiSelect: { area: true, perimeter: false, all: true, missing: false }, variables: { showSplit: false, reducedLabels: true } }, seed: 123, presentation: "full", x: 24, y: 24, w: 1552, h: 852 }] }, authoredSheetSlide("sheet", "Area practice", worksheet)] });
      saveDeck(d, false);
      return d;
    });
    fs.writeFileSync(path.join(output, "demo.json"), JSON.stringify(deck, null, 2));
    await p.goto(base + "/decks/" + deck.id + "?edit=1&s=2");
    await p.locator("[data-shape-question]").first().waitFor();
    const canvases = p.locator("[data-slide-canvas]");
    await canvases.last().dblclick({ position: { x: 200, y: 130 } });
    await p.getByRole("dialog", { name: "Skill practice" }).waitFor();
    await p.getByLabel("Overall width (cm)", { exact: true }).fill("2");
    await p.getByRole("button", { name: "Apply to slide", exact: true }).waitFor();
    if (!await p.getByRole("button", { name: "Apply to slide", exact: true }).isDisabled()) throw Error("Invalid dimensions can be applied");
    await p.getByLabel("Overall width (cm)", { exact: true }).fill("10");
    await p.getByRole("button", { name: "Apply to slide", exact: true }).click();
    await p.waitForTimeout(2200);
    if (deck.slides[1].els.find((e) => e.kind === "questions").items[0].rectilinear.width !== 10) throw Error("Shape dimensions did not save");
    console.log("PASS edit shape and save through API");
    await p.reload();
    await p.locator("[data-shape-question]").first().waitFor();
    await p.locator("[data-slide-canvas]").last().dblclick({ position: { x: 200, y: 130 } });
    await p.getByLabel("Overall width (cm)", { exact: true }).waitFor();
    if (await p.getByLabel("Overall width (cm)", { exact: true }).inputValue() !== "10") throw Error("Saved shape did not reload");
    for (const [width, height] of [[1024, 768], [390, 800]]) {
      await p.setViewportSize({ width, height });
      const dialog = p.getByRole("dialog", { name: "Skill practice", exact: true });
      if (await dialog.evaluate(el => el.scrollWidth > el.clientWidth + 2)) throw Error(`Question editor overflows at ${width}px`);
      console.log("PASS responsive shape editor", width);
    }
    await p.setViewportSize({ width: 1366, height: 900 });
    await p.getByRole("button", { name: "Make printable worksheet", exact: true }).click();
    await p.waitForTimeout(2200);
    if (deck.slides.length !== 5 || !deck.slides[2].els[0].authored) throw Error("Worksheet not created");
    console.log("PASS reload and make printable worksheet");
    await p.goto(base + "/decks/" + deck.id + "?s=4");
    await p.locator("[data-shape-question]").waitFor();
    await p.getByRole("button", { name: "Show working", exact: true }).click();
    await p.waitForTimeout(600);
    const bounds = await p.locator("[data-shape-question] svg").evaluate((el) => {
      let r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    if (bounds.w < 150 || bounds.h < 150) throw Error("Generator diagram is too small " + JSON.stringify(bounds));
    await p.screenshot({ path: path.join(output, "generator.png") });
    console.log("PASS live generator reveal", bounds);
    for (const [width, height] of [[1024, 768], [390, 800]]) {
      await p.setViewportSize({ width, height });
      await p.reload();
      await p.locator("[data-shape-question]").waitFor();
      if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) {
        console.log(await p.evaluate(() => [...document.querySelectorAll("body *")].map((e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 80), r: e.getBoundingClientRect().right, w: e.getBoundingClientRect().width })).filter((e) => e.r > innerWidth + 3 && e.w > 0).slice(0, 12)));
        await p.screenshot({ path: path.join(output, "phone.png") });
        throw Error("Viewport overflow");
      }
      console.log("PASS responsive player", width);
    }
    await p.setViewportSize({ width: 1366, height: 900 });
    await p.getByRole("button", { name: "Worksheets", exact: true }).click();
    const popup = context.waitForEvent("page");
    await p.getByRole("dialog", { name: "Worksheets", exact: true }).getByRole("button", { name: "Both", exact: true }).last().click();
    const print = await popup;
    await print.waitForLoadState();
    await print.setViewportSize({ width: 794, height: 1123 });
    if (await print.locator("section.page").count() !== 4) throw Error("Wrong print page count");
    const over = await print.locator("article").evaluateAll((es) => es.filter((e) => e.scrollHeight > e.clientHeight + 2).length);
    if (over) throw Error("Printed cell content clips " + over);
    await print.screenshot({ path: path.join(output, "print.png") });
    await print.pdf({ path: path.join(output, "print.pdf"), preferCSSPageSize: true });
    console.log("PASS four print pages without clipping");
    if (errors.length) throw Error(errors.join("\n"));
    console.log("PASS no browser errors; artifacts:", output);
    await context.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
