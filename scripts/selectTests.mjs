// Prints which tests CI should run for the files changed since a base ref.
//   node scripts/selectTests.mjs origin/main     → "all", "none", or the test files to run (one per line)
// With GITHUB_OUTPUT set it also writes `run=all|none|files`, `files=<space separated>` and `smoke=true|false` (does the browser smoke check of
// the tool shell need to run). See scripts/testAreas.mjs for the lists. A base of all zeros (a brand-new branch) means everything.
import { execSync } from "node:child_process";
import { appendFileSync, readdirSync } from "node:fs";
import { areaOfTest, areasForChange } from "./testAreas.mjs";

const base = process.argv[2];
const force = process.env.FORCE_ALL === "true" || /^0+$/.test(base ?? "");
let result;
if (force || !base) result = "all";
else {
  let changed = null;
  try { changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" }).split("\n").filter(Boolean); } catch { /* the base is gone (a force-push, a shallow clone): run everything */ }
  result = changed === null ? "all" : changed.length === 0 ? "none" : areasForChange(changed);
}
let run, files = [];
if (result === "none") { run = "none"; }
const smoke = result === "all" || (Array.isArray(result) && result.some((a) => !["docs", "decks"].includes(a)));
if (result === "none") { /* nothing changed */ }
else if (result === "all") run = "all";
else {
  const areas = new Set(result);
  files = readdirSync("src/tests").filter((n) => n.endsWith(".test.ts") && areas.has(areaOfTest(n))).map((n) => `src/tests/${n}`);
  run = files.length ? "files" : "none";
}
console.log(run === "files" ? `areas: ${[...new Set(result)].join(", ")}\n${files.join("\n")}` : run);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\nfiles=${files.join(" ")}\nsmoke=${smoke}\n`);
