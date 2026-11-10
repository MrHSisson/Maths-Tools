// A phone only previews a deck: no editor, a start card, a full-screen show that fills the screen upright or sideways (and again after the phone
// turns), and swipes that move the slides. Runs an iPhone in a real browser.
//
//   npm run smoke:deck-phone              starts the dev server itself (needs Playwright and a Chromium: it is not a project dependency)
//   SMOKE_URL=http://localhost:5173 npm run smoke:deck-phone   uses a server that is already running
//   SMOKE_DECK=estimation npm run smoke:deck-phone              plays this deck (default: estimation)
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); } catch { console.error("Playwright is not installed. Install it (and a Chromium) to run this check."); process.exit(2); }

const PORT = 5189;
const base = process.env.SMOKE_URL ?? `http://localhost:${PORT}`;
const DECK = process.env.SMOKE_DECK ?? "estimation";
let server;
if (!process.env.SMOKE_URL) {
  server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch { /* not up yet */ } await new Promise(r => setTimeout(r, 500)); }
}

const failures = [];
const check = (ok, what) => { if (ok) console.log(`ok   ${what}`); else { failures.push(what); console.error(`FAIL ${what}`); } };
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
await ctx.addInitScript(() => localStorage.setItem("mt-dev-mode", "1"));   // the working copy (built decks) shows without the published service
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
const cdp = await ctx.newCDPSession(page);
const turnTo = (width, height) => cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 3, mobile: true, screenOrientation: { type: width > height ? "landscapePrimary" : "portraitPrimary", angle: width > height ? 90 : 0 } });
const counter = async () => ((await page.locator("#root").innerText()).match(/(\d+) \/ (\d+)/) ?? [])[1];
const swipe = async ([x1, y1], [x2, y2]) => {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1, id: 1 }] });
  for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + (x2 - x1) * i / 6, y: y1 + (y2 - y1) * i / 6, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(350);
};
/** how much of the window the slide covers along the side that limits it (a slide that is the right size covers nearly all of one side) */
const fill = () => page.evaluate(() => {
  const r = document.querySelector("[data-slide-canvas]")?.getBoundingClientRect();
  return r ? Math.max(r.width / innerWidth, r.height / innerHeight) : 0;
});

// no editor on a phone
for (const [path, wanted] of [["/decks", "/deck-gallery"], ["/decks/library", "/deck-gallery"], [`/decks/${DECK}?edit=1&s=2`, `/decks/${DECK}?s=2`]]) {
  await page.goto(base + path); await page.waitForTimeout(1500);
  check(page.url().replace(base, "") === wanted, `${path} goes to ${wanted}`);
}
await page.goto(base + "/deck-gallery"); await page.waitForTimeout(1500);
check((await page.getByText("Deck editor").count()) === 0, "the Decks page has no Deck editor button on a phone");

// the start card, then the show
await page.goto(base + `/decks/${DECK}?s=2`); await page.waitForTimeout(5500);
check((await page.getByRole("button", { name: "Start" }).count()) === 1, "a phone opens a deck on a start card");
await page.getByRole("button", { name: "Start" }).click(); await page.waitForTimeout(900);
check((await page.getByRole("button", { name: /^Edit/ }).count()) === 0, "the show has no Edit button");

// the controls bar: showing as the show opens, gone a few seconds later, and a tap on the slide shows it and a second tap hides it
const barShown = () => page.evaluate(() => Number(getComputedStyle(document.querySelector("[data-player-bar]")).opacity) > 0.5);
check(await barShown(), "the controls bar shows as the show opens");
await page.waitForTimeout(5500);
check(!(await barShown()), "the controls bar fades by itself");
await page.touchscreen.tap(150, 300); await page.waitForTimeout(500);
check(await barShown(), "a tap on the slide shows the bar");
await page.touchscreen.tap(150, 300); await page.waitForTimeout(500);
check(!(await barShown()), "a second tap on the slide hides it at once");

// upright: the show is turned on its side and fills the screen
check((await page.locator("[data-turned]").count()) === 1, "an upright phone shows the slides turned on their side");
check((await fill()) > 0.9, "upright: the slide fills the screen");
const a = await counter();
await swipe([200, 600], [200, 250]);
check(Number(await counter()) === Number(a) + 1, "upright: a swipe up the screen (right to left on the slide) goes forward");
await swipe([200, 250], [200, 600]);
check(Number(await counter()) === Number(a), "upright: a swipe down the screen goes back");

// the phone turns sideways: the slide must fill the new screen (it once stayed at its smallest size)
await turnTo(844, 390); await page.waitForTimeout(900);
check((await page.locator("[data-turned]").count()) === 0, "turned sideways: the slides are drawn normally");
check((await fill()) > 0.9, "turned sideways: the slide fills the screen");
const b = await counter();
await swipe([650, 200], [250, 200]);
check(Number(await counter()) === Number(b) + 1, "sideways: a swipe from right to left goes forward");
await swipe([250, 200], [650, 200]);
check(Number(await counter()) === Number(b), "sideways: a swipe from left to right goes back");

// and back upright
await turnTo(390, 664); await page.waitForTimeout(900);
check((await fill()) > 0.9, "turned upright again: the slide fills the screen");

check(errors.length === 0, `no page errors${errors.length ? `: ${errors[0]}` : ""}`);
await browser.close();
server?.kill();
if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log("\nA phone previews a deck: no editor, fills the screen both ways, swipes work.");
