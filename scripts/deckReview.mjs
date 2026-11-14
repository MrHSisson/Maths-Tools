// Contact sheets of a deck, for LOOKING at it: every slide with all its clicks revealed, each question of a question set (and the first one
// with its working open), and a book-work grid with its answers shown. Two uses:
//   npm run deck -- review <id>            every slide of a built deck (before showing it to Harry)
//   npm run deck -- looks <build script>   the look card: ONE slide of each kind, every state, from a script that has not been built into the repo yet
//                                          (this is what Harry approves BEFORE the rest of the deck is built)
// Environment (set by scripts/deck.mjs): SMOKE_URL, DECK_FILE (the deck to draw), REVIEW_KINDS=1 (one slide per kind), REVIEW_OUT (folder for the sheets).
import { createRequire } from "node:module";
import fs from "node:fs";
import { loadDeck, serveDeck } from "./deckPage.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright/test");
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const id = process.argv[2];
const kinds = process.env.REVIEW_KINDS === "1";
const outDir = process.env.REVIEW_OUT ?? `/tmp/deck-review-${id}`;
const deck = loadDeck(id);
fs.mkdirSync(outDir, { recursive: true });

/** Slides that look alike are one kind: same family, same element kinds, same question layout. */
const signature = (s) => `${s.family}|${s.els.map((e) => `${e.kind}${e.presentation ? `:${e.presentation}` : ""}${e.kind === "grid" ? `:${e.cols}` : ""}`).sort().join(",")}`;
const picked = [];
const seen = new Set();
deck.slides.forEach((s, i) => { const sig = signature(s); if (!kinds || !seen.has(sig)) { seen.add(sig); picked.push({ s, n: i + 1 }); } });

const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
const tiles = [];
const press = async (page, name) => { const b = page.getByRole("button", { name }); if (await b.count()) { await b.first().click(); return true; } return false; };
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => localStorage.setItem("mt-dev-mode", "1"));
  await serveDeck(page, id, deck);
  const shot = async (label) => { await page.waitForTimeout(450); tiles.push({ label, png: (await page.screenshot()).toString("base64") }); };
  for (const { s, n } of picked) {
    await page.goto(`${base}/decks/${id}?s=${n}`);
    await page.waitForFunction(() => [...document.querySelectorAll("div")].some((d) => d.style.width === "1600px" && d.style.height === "900px"), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(900);
    const steps = Math.max(0, ...s.els.map((e) => e.step ?? 0));
    for (let i = 0; i < steps; i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(220); }
    const items = s.els.find((e) => e.kind === "questions")?.items?.length ?? 0;
    const title = (s.title || s.id).slice(0, 38);
    if (!items) {
      await shot(`${n}. ${title}`);
      if (s.els.some((e) => e.kind === "grid" || e.kind === "worksheet") && (await press(page, /show answers/i))) await shot(`${n}. ${title}: answers shown`);
      continue;
    }
    // a question set: the first question, then (look card) every question, each with the working open once
    const count = kinds ? items : 1;
    for (let q = 0; q < count; q++) {
      if (q > 0 && !(await press(page, /next question/i))) break;
      await shot(`${n}. ${title}: question ${q + 1}`);
      if (q === 0 && (await press(page, /show working/i))) { await page.waitForTimeout(900); await shot(`${n}. ${title}: question 1, working open`); }
    }
  }
} finally { await browser.close(); }

// the sheets: six pictures to a sheet, two across, each with its caption
const PER = 6, files = [];
const sheetBrowser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
try {
  for (let k = 0; k * PER < tiles.length; k++) {
    const part = tiles.slice(k * PER, k * PER + PER), rows = Math.ceil(part.length / 2);
    const sheet = await sheetBrowser.newPage({ viewport: { width: 1366, height: 404 * rows } });
    await sheet.setContent(`<body style="margin:0;background:#fff;font:600 17px system-ui;color:#334155;display:grid;grid-template-columns:repeat(2,683px)">${part.map((t) => `<figure style="margin:0;width:683px;height:404px"><div style="height:20px;padding:0 8px">${t.label.replace(/</g, "&lt;")}</div><img style="width:683px;height:384px" src="data:image/png;base64,${t.png}"></figure>`).join("")}</body>`);
    const f = `${outDir}/${kinds ? "looks" : "review"}-${id}-${k + 1}.png`;
    await sheet.screenshot({ path: f });
    files.push(f);
    await sheet.close();
  }
} finally { await sheetBrowser.close(); }
console.log(`${kinds ? "look card" : "review"} of ${id}: ${tiles.length} pictures from ${picked.length} slide${picked.length > 1 ? "s" : ""}${kinds ? ` (one of each of ${picked.length} kinds)` : ""}`);
for (const f of files) console.log(`wrote ${f}`);
