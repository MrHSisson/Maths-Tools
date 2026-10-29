// Local browser test: simulated cameras, intercepted sharing, no real camera or shared content.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const artifacts = fs.mkdtempSync("/tmp/question-layouts-");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/decks*", (r) => r.fulfill({ status: 503, contentType: "application/json", body: '{}' }));
  await page.addInitScript(() => {
    window.cameraStreams = []; window.cameraRequests = 0;
    const media = navigator.mediaDevices, get = media.getUserMedia.bind(media);
    media.getUserMedia = async (options) => { window.cameraRequests++; const stream = await get(options); window.cameraStreams.push(stream); return stream; };
  });
  const dialog = () => page.getByRole("dialog", { name: "Skill practice", exact: true });
  const open = async () => { await page.locator('div[style*="cursor: move"]').first().dblclick(); await dialog().waitFor(); };
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("mt-deck:estimation") || "null"));
  const cameraAction = async (name) => {
    if (await page.locator(".workspace-options").getAttribute("open") === null) await page.getByRole("button", { name: "Workspace options", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).click();
  };
  await page.goto(`${base}/decks/estimation?edit=1&s=9`); await open();
  await dialog().getByRole("button", { name: /^Workspace right/ }).click();
  await expect(dialog().locator(".question-frame")).toHaveAttribute("data-presentation", "whiteboard");
  await expect(dialog().getByRole("button", { name: "Workspace options", exact: true })).toHaveCount(0);
  await dialog().getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await saved()).toBeNull();
  await open();
  await expect(dialog().getByRole("button", { name: /^Full-width/ })).toHaveAttribute("aria-pressed", "true");
  await dialog().getByRole("button", { name: /^Workspace left/ }).click();
  await dialog().getByRole("button", { name: "Apply to slide", exact: true }).click();
  await expect.poll(async () => (await saved())?.slides[8].els[0].presentation).toBe("whiteboard-inverted");
  const content = JSON.stringify((await saved()).slides[8].els[0].items);
  const brief = JSON.stringify((await saved()).slides[8].brief);
  await page.keyboard.press("Control+z");
  await expect.poll(async () => (await saved())?.slides[8].els[0].presentation).toBeUndefined();
  await page.keyboard.press("Control+Shift+z");
  await expect.poll(async () => (await saved())?.slides[8].els[0].presentation).toBe("whiteboard-inverted");
  expect(await page.evaluate(() => window.cameraRequests)).toBe(0);
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start visualiser", exact: true })).toHaveCount(0);
  const workspace = () => page.getByRole("region", { name: "Writing space", exact: true });
  const question = () => page.getByRole("region", { name: "Question", exact: true });
  let w = await workspace().boundingBox(), q = await question().boundingBox();
  expect(w.x + w.width).toBeLessThan(q.x);
  await cameraAction("Start visualiser");
  await expect.poll(() => page.locator("video").evaluate((el) => el.videoWidth)).toBeGreaterThan(0);
  const requests = await page.evaluate(() => window.cameraRequests);
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await expect(page.getByText("Question 2 of 5", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.cameraRequests)).toBe(requests);
  await expect.poll(() => page.locator("video").evaluate((el) => el.videoWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Show working", exact: true }).click();
  await page.waitForTimeout(600);
  expect(await workspace().boundingBox()).toEqual(w);
  const steps = await page.getByRole("region", { name: "Worked solution", exact: true }).boundingBox();
  q = await question().boundingBox(); expect(q.y + q.height).toBeLessThan(steps.y);
  await page.locator(".slide-more > summary").click();
  await page.getByRole("button", { name: "Teacher guidance", exact: true }).click();
  expect(await workspace().boundingBox()).toEqual(w);
  expect(await page.evaluate(() => window.cameraRequests)).toBe(requests);
  await page.getByRole("button", { name: "Back to question", exact: true }).first().click();
  await page.screenshot({ path: `${artifacts}/fixed-camera-inverted.png` });
  await cameraAction("Stop visualiser");
  await expect.poll(() => page.evaluate(() => window.cameraStreams.every((s) => s.getTracks().every((t) => t.readyState === "ended")))).toBe(true);
  console.log("ok fixed set layout draft, cancel, undo/redo, hidden camera menu and camera continuity across questions/guidance");

  for (const [name, value] of [["Full-width", "full"], ["Workspace right", "whiteboard"], ["Workspace left", "whiteboard-inverted"]]) {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.getByRole("button", { name: "Edit", exact: true }).click(); await open();
    await dialog().getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await dialog().getByRole("button", { name: "Apply to slide", exact: true }).click();
    expect(JSON.stringify((await saved()).slides[8].els[0].items)).toBe(content);
    expect(JSON.stringify((await saved()).slides[8].brief)).toBe(brief);
    await page.getByRole("button", { name: "Present", exact: true }).click();
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 800 }]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(250);
      const before = value !== "full" ? await workspace().boundingBox() : await question().boundingBox();
      await page.getByRole("button", { name: "Show working", exact: true }).click(); await page.waitForTimeout(600);
      q = await question().boundingBox(); const s = await page.getByRole("region", { name: "Worked solution", exact: true }).boundingBox();
      if (value === "full") expect(s.x + s.width).toBeLessThan(q.x);
      else { expect(q.y + q.height).toBeLessThan(s.y); w = await workspace().boundingBox(); expect(w).toEqual(before); if (value === "whiteboard") expect(q.x + q.width).toBeLessThan(w.x); else expect(w.x + w.width).toBeLessThan(q.x); }
      await page.screenshot({ path: `${artifacts}/${value}-${viewport.width}.png` });
      await page.keyboard.press("a"); await page.keyboard.press("a");
    }
  }
  console.log("ok one fixed five-question set presents in all three layouts at phone/tablet/laptop sizes without content changes");

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Edit", exact: true }).click(); await open();
  await dialog().getByRole("button", { name: /^Workspace right/ }).click();
  await page.reload(); await open();
  await expect(dialog().getByText(/Recovered your unsaved slide draft/)).toBeVisible();
  await expect(dialog().getByRole("button", { name: /^Workspace right/ })).toHaveAttribute("aria-pressed", "true");
  await dialog().getByRole("button", { name: "Apply to slide", exact: true }).click();
  const downloading = page.waitForEvent("download"); await page.getByTitle("Export, import, reset").click(); await page.getByRole("button", { name: /Export this deck/ }).click();
  const download = await downloading; const path = `${artifacts}/layouts.deck.json`; await download.saveAs(path);
  const portable = JSON.parse(fs.readFileSync(path, "utf8")); expect(portable.slides[8].els[0].presentation).toBe("whiteboard");
  await page.getByRole("button", { name: "Add slide", exact: true }).click();
  await expect(page.getByRole("button", { name: "Whiteboard generator", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fixed question set", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Live generator", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Depth card", exact: true }).click();
  const depth = page.getByRole("dialog", { name: "Depth card", exact: true });
  await expect(depth.getByRole("button", { name: /^Workspace/ })).toHaveCount(0);
  await depth.getByRole("button", { name: "Use this card", exact: true }).first().click();
  await depth.getByRole("button", { name: "Apply to slide", exact: true }).click();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await expect(page.locator(".question-frame, .solution-stepper")).toHaveCount(0);
  await page.getByRole("button", { name: "Show answer", exact: true }).click();
  await expect(page.locator("[data-answer]")).toHaveCount(1);
  expect(errors).toEqual([]);
  console.log(`All shared layout checks passed. Screenshots: ${artifacts}`);
} finally { await browser.close(); }
