// Local artwork regression checks. Sharing is intercepted; no shared teacher content is changed.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const artifacts = fs.mkdtempSync("/tmp/depth-artwork-");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
try {
 const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
 const errors = []; page.on("pageerror", (e) => errors.push(e.message));
 await page.route("**/api/decks*", (r) => r.fulfill({ status: 503, contentType: "application/json", body: '{}' }));
 await page.goto(`${base}/decks/estimation?s=12`);
 await expect(page.locator("[data-depth-speaker]")).toHaveCount(3);
 await expect(page.locator("[data-depth-speaker] svg")).toHaveCount(3);
 expect(await page.locator("[data-depth-speaker]").evaluateAll((els) => els.map((el) => el.dataset.depthSpeaker))).toEqual(["Ruby", "Kofi", "Mei"]);
 await expect(page.getByRole("complementary", { name: "Feathers", exact: true })).toBeVisible();
 const prompt = await page.locator("[data-depth-feathers]").innerText();
 expect(prompt).toContain("Decide who you agree with");
 await page.waitForTimeout(400); await page.screenshot({ path: `${artifacts}/depth-question.png` });
 await page.getByRole("button", { name: "Show answer", exact: true }).click();
 await expect(page.locator("[data-answer]")).toHaveCount(1);
 await expect.poll(() => page.locator("[data-depth-feathers]").innerText()).not.toBe(prompt);
 await expect(page.locator("[data-depth-speaker] svg")).toHaveCount(0);
 await expect(page.locator(".solution-stepper, .question-frame, .workspace-options")).toHaveCount(0);
 await expect(page.getByRole("region", { name: "Depth answer", exact: true })).toBeVisible();
 await page.waitForTimeout(800); await page.screenshot({ path: `${artifacts}/depth-answer.png` });
 await page.locator(".slide-more > summary").click(); await page.getByRole("button", { name: "Hide Feathers", exact: true }).click();
 await expect(page.locator("[data-depth-feathers]")).toHaveCount(0);
 await page.locator(".slide-more > summary").click(); await page.getByRole("button", { name: "Show Feathers", exact: true }).click();
 await expect(page.locator("[data-depth-feathers] svg")).toHaveCount(1);
 console.log("ok original cast faces, speech bubbles, Feathers question/answer prompts and optional mute");

 await page.getByRole("button", { name: "Edit", exact: true }).click();
 const open = async () => { await page.locator('div[style*="cursor: move"]').first().dblclick(); await page.getByRole("dialog", { name: "Depth card", exact: true }).waitFor(); };
 await open(); const dialog = page.getByRole("dialog", { name: "Depth card", exact: true });
 await expect(dialog.locator("aside [data-depth-speaker] svg")).toHaveCount(3);
 await expect(dialog.locator("aside [data-depth-feathers] svg")).toHaveCount(1);
 await expect(dialog.getByRole("button", { name: /^Workspace/ })).toHaveCount(0);
 await expect(dialog.getByRole("button", { name: /^Full-width/ })).toHaveCount(0);
 for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 800 }]) {
  await page.setViewportSize(viewport);
  await expect(dialog.getByRole("button", { name: "Apply to slide", exact: true })).toBeInViewport();
  await dialog.locator("aside").first().scrollIntoViewIfNeeded();
  await expect(dialog.locator("aside [data-depth-speaker] svg")).toHaveCount(3);
  await expect(dialog.locator("aside [data-depth-feathers] svg")).toHaveCount(1);
  await expect(dialog.locator(".question-frame, .solution-stepper, .workspace-options")).toHaveCount(0);
  await page.screenshot({ path: `${artifacts}/preview-standalone-${viewport.width}.png` });
 }
 await page.setViewportSize({ width: 1366, height: 768 });
 await dialog.getByRole("button", { name: "Apply to slide", exact: true }).click();
 const download = page.waitForEvent("download"); await page.getByTitle("Download this deck as a file").click();
 const file = await download; const path = `${artifacts}/artwork.deck.json`; await file.saveAs(path);
 const deck = JSON.parse(fs.readFileSync(path, "utf8")), q = deck.slides[11].els[0].items[0];
 expect(q.depth.prompt).toContain("Decide who you agree"); expect(q.claims.map((c) => c.name)).toEqual(["Ruby", "Kofi", "Mei"]);
 // Simulate an old saved deck with edited question text and no persisted artwork hints.
 await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("mt-deck:estimation")); const q = d.slides[11].els[0].items[0]; delete q.depth; q.question = ["My preserved teacher wording"]; d.slides[11].els[0].presentation = "whiteboard-inverted"; d.slides[11].els[0].visualiser = true; localStorage.setItem("mt-deck:estimation", JSON.stringify(d)); });
 await page.goto(`${base}/decks/estimation?s=12`);
 await expect(page.locator("[data-depth-speaker] svg")).toHaveCount(3);
 await expect(page.locator("[data-depth-feathers]")).toContainText("Decide who you agree");
 await expect(page.getByText("My preserved teacher wording", { exact: true })).toBeVisible();
 const colours = await page.locator('[style*="--deck-surface"]').evaluate((el) => ({ surface: getComputedStyle(el).backgroundColor, page: getComputedStyle(el.closest('.h-screen')).backgroundColor }));
 expect(colours).toEqual({ surface: "rgb(243, 247, 252)", page: "rgb(237, 243, 250)" });
 await expect(page.getByRole("region", { name: "Writing space", exact: true })).toHaveCount(0);
 await expect(page.locator(".solution-stepper")).toHaveCount(0);
 await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("mt-deck:estimation")); delete d.slides[11].els[0].items[0].source; localStorage.setItem("mt-deck:estimation", JSON.stringify(d)); });
 await page.goto(`${base}/decks/estimation?s=12`);
 await expect(page.getByRole("region", { name: "Depth question", exact: true })).toBeVisible();
 await expect(page.locator(".question-frame, .solution-stepper, .workspace-options")).toHaveCount(0);
 await expect(page.locator("[data-depth-speaker] svg")).toHaveCount(3);
 await page.getByRole("button", { name: "Edit", exact: true }).click(); await open();
 await dialog.getByRole("button", { name: "Choose Depth card", exact: true }).click();
 await expect(dialog.locator("article [data-depth-speaker] svg").first()).toBeVisible();
 expect(errors).toEqual([]);
 console.log(`All Depth artwork checks passed. Screenshots: ${artifacts}`);
} finally { await browser.close(); }
