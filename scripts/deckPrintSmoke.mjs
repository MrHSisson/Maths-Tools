// Local browser test: every worksheet pinned to a deck prints on ONE page (questions, and the answer sheet).
//   npm run dev, then: npm run smoke:deck-print -- <deck id>
// Opens the deck, presses Print sheet / Answer sheet on each pinned worksheet slide, takes the HTML the print window would get
// (KaTeX read from node_modules, since a sandbox has no CDN), renders it to PDF at its own page size and counts the pages.
import { createRequire } from "node:module";
import fs from "node:fs";
import { loadDeck, serveDeck } from "./deckPage.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const id = process.argv[2] ?? "manipulating-ratios";
const deck = loadDeck(id);                     // the repo copy, or DECK_FILE; served to the page below (decks are not bundled with the app)
const slides = deck.slides;
const pinned = slides.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => s.els.some((e) => e.kind === "worksheet" && e.pin));
const katex = `file://${process.cwd()}/node_modules/katex/dist/`;
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
let bad = 0;
// The print window asks the page that opened it for the page-fill layout (`window.opener.__mtWorksheetLayout`), so a stubbed window.open
// gives a blank sheet that always "fits". Here the sheet is written into an iframe whose opener is the page, and its pages are counted.
for (const { s, n } of pinned) for (const button of ["Print sheet", "Answer sheet"]) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
  await ctx.route("https://cdn.jsdelivr.net/npm/katex@*/dist/**", (r) => { const f = r.request().url().split("/dist/")[1].split("?")[0]; const p = `${process.cwd()}/node_modules/katex/dist/${f}`; fs.existsSync(p) ? r.fulfill({ path: p }) : r.abort(); });
  await serveDeck(ctx, id, deck);
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("mt-dev-mode", "1");
    window.open = () => {
      const f = document.createElement("iframe"); f.id = "print-frame"; f.style.cssText = "position:fixed;left:0;top:0;width:800px;height:1130px;border:0";
      document.body.appendChild(f);
      const w = f.contentWindow; w.opener = window; w.print = () => {};
      return { document: { write: (h) => { w.document.open(); w.document.write(h); }, close: () => w.document.close() }, focus() {}, print() {} };
    };
  });
  await page.goto(`${base}/decks/${id}?s=${n}`);
  await page.getByRole("button", { name: button }).first().click();
  await page.waitForFunction(() => document.getElementById("print-frame")?.contentDocument?.querySelectorAll(".page").length, null, { timeout: 15000 }).catch(() => {});
  const { pages } = await page.evaluate(() => { const d = document.getElementById("print-frame")?.contentDocument; return { pages: d?.querySelectorAll(".page").length ?? 0 }; });
  const ok = pages === 1;
  console.log(`${ok ? "ok " : "BAD"} slide ${n} (${s.id}) ${button}: ${pages} page${pages === 1 ? "" : "s"}${pages === 0 ? " (nothing was drawn)" : ""}`);
  if (!ok) bad++;
  await ctx.close();
}
await browser.close();
if (bad) { console.error(`${bad} print${bad > 1 ? "s" : ""} spill onto more than one page`); process.exit(1); }
