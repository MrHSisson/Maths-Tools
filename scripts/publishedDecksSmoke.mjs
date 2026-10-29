// Local browser test: published decks (a read-only copy for everyone) and the password in front of the editor.
// The sharing service is simulated, so nothing real is published or read.   npm run dev, then npm run smoke:published
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const password = fs.readFileSync("src/devAccess.ts", "utf8").match(/DEV_PASSWORD = "([^"]*)"/)[1];
const slide = (id, text) => ({ id, family: "structure", title: text, els: [{ id: `${id}-1`, kind: "text", x: 100, y: 100, w: 1200, h: 200, text, size: 60 }] });
const demo = { id: "demo", title: "Demo deck", summary: "A published lesson", slides: [slide("s1", "Hello published"), slide("s2", "Second slide")], publishedAt: "2026-10-29T12:00:00Z" };
const listing = { title: demo.title, summary: demo.summary, slides: 2, publishedAt: demo.publishedAt, preview: demo.slides[0] };
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
const sent = [];

async function visitor() {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/decks*", async (route) => {
    const url = new URL(route.request().url()), json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (route.request().method() === "POST") { sent.push(JSON.parse(route.request().postData())); return json({ published: true, entry: { title: "x", summary: "", slides: 1, publishedAt: "2026-10-29T13:00:00Z" } }); }
    if (url.searchParams.get("published") === "") return json({ decks: { demo: listing } });
    if (url.searchParams.get("published") === "demo") return json(demo);
    if (url.searchParams.has("published")) return json({ error: "Not published" }, 404);
    return json({ error: "Not authorised" }, 401);        // the working copies need the admin key
  });
  return { page, errors };
}

try {
  // 1. Anyone: the Decks tab lists the published deck and the editor, and the deck plays read-only.
  let { page, errors } = await visitor();
  await page.goto(base); await page.getByRole("button", { name: "Decks", exact: true }).click();
  await expect(page.getByLabel("Play Demo deck")).toBeVisible();
  await expect(page.getByText("A published lesson")).toHaveCount(0);            // the words wait behind the (i)
  await page.getByLabel("About Demo deck").click();
  await expect(page.getByText("A published lesson")).toBeVisible();
  await expect(page.getByRole("link", { name: "Deck editor" })).toHaveAttribute("title", "Needs the admin password");
  await expect(page.locator("a[href=\"/decks/demo\"]").getByText("Hello published")).toBeVisible();   // the card shows the first slide
  await page.getByLabel("Play Demo deck").click();
  await expect(page).toHaveURL(/\/decks\/demo$/);
  await expect(page.getByText("Hello published")).toBeVisible();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  await page.keyboard.press("ArrowRight"); await expect(page.getByText("Second slide")).toBeVisible();
  await page.goto(`${base}/decks/nothing-here`); await expect(page.getByText("This deck isn't published")).toBeVisible();
  console.log("ok the Decks tab with a first-slide preview with the words behind an (i), an editor button, a published deck playing read-only, a missing one");

  // 2. The editor, the deck list and the slide library all ask for the password.
  for (const [path, heading] of [["/decks/demo?edit=1", "Open the deck editor"], ["/decks", "Open the deck editor"], ["/decks/library", "Open the slide library"]]) {
    await page.goto(base + path); await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await page.goto(`${base}/decks/demo?edit=1`);
  await page.getByLabel("Password").fill("wrong"); await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("That password isn't right.");
  await expect(page.getByLabel("Deck title")).toHaveCount(0);
  console.log("ok the editor, list and library ask for the password; a wrong one is refused");

  // 3. With the password: the deck editor opens, a new deck can be made and published from the File menu.
  await page.getByLabel("Password").fill(password); await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.goto(`${base}/decks`); await expect(page.getByRole("heading", { name: "Deck editor" })).toBeVisible();
  await page.getByRole("button", { name: "New deck" }).click();
  await expect(page.getByLabel("Deck title")).toBeVisible();
  await page.getByRole("button", { name: "File", exact: true }).click();
  await page.getByRole("button", { name: "Publish this deck", exact: true }).click();
  await expect.poll(() => sent.some((b) => b.publish?.id?.startsWith("my-"))).toBe(true);
  expect(sent.find((b) => b.publish).publish.slides.length).toBe(1);
  console.log("ok unlocked: the deck list, the editor and Publish this deck");

  // 4. Locked again (the switch off): the player goes back to the published copy and has no Edit button.
  await page.evaluate(() => localStorage.setItem("mt-dev-mode", "0"));
  await page.goto(`${base}/decks/demo`); await expect(page.getByText("Hello published")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log("ok locked again: published copy only");
} finally { await browser.close(); }
