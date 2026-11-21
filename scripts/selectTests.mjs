// Prints which tests CI should run for the files changed since a base ref.
//   node scripts/selectTests.mjs origin/main     → "all", "none", or the test files to run (one per line)
// With GITHUB_OUTPUT set it also writes `run=all|none|files`, `matrix=<the test runners, each with its files>`, `toolfiles=<comma separated>` and `smoke=true|false` (does the browser smoke check of
// the tool shell need to run). See scripts/testAreas.mjs for the lists. A base of all zeros (a brand-new branch) means everything.
import { execSync } from "node:child_process";
import { appendFileSync, readdirSync } from "node:fs";
import { areaOfTest, areasForChange, toolFilter } from "./testAreas.mjs";
import { balance, loadTimes, weights } from "./testShards.mjs";

const SHARDS = 4;

const base = process.argv[2];
const force = process.env.FORCE_ALL === "true" || /^0+$/.test(base ?? "");
let result, changed = null;
if (force || !base) result = "all";
else {
  try { changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" }).split("\n").filter(Boolean); } catch { /* the base is gone (a force-push, a shallow clone): run everything */ }
  result = changed === null ? "all" : changed.length === 0 ? "none" : areasForChange(changed);
}
let run, files = [], toolfiles = [];
if (result === "none") { run = "none"; }
const smoke = result === "all" || (Array.isArray(result) && result.some((a) => !["docs", "decks"].includes(a)));
const allTests = readdirSync("src/tests").filter((n) => n.endsWith(".test.ts")).map((n) => `src/tests/${n}`);
if (result === "none") { /* nothing changed */ }
else if (result === "all") { run = "all"; files = allTests; }
else {
  const areas = new Set(result);
  files = allTests.filter((f) => areas.has(areaOfTest(f.split("/").pop())));
  run = files.length ? "files" : "none";
  // the checks that run over every tool run over only the tools this change touched, when that is all it touches
  if (areas.has("cross") && changed) toolfiles = toolFilter(changed) ?? [];
}
// the files are shared out so the runners finish together (a check that will run for only a few tools counts as light)
const weightOf = weights(loadTimes(), (f) => (toolfiles.length && areaOfTest(f.split("/").pop()) === "cross" ? 0.15 : 1));
const shards = run === "none" ? [] : balance(files, weightOf, SHARDS);
console.log(run === "none" ? "none" : `${run}: ${files.length} test files${result === "all" ? "" : ` (areas: ${[...new Set(result)].join(", ")})`}${toolfiles.length ? `\nall-tool checks for only: ${toolfiles.join(", ")}` : ""}\n` + shards.map((s, i) => `shard ${i + 1}: ${s.files.length} files, about ${Math.round(s.load)} s of work`).join("\n"));
// the runners as a matrix: one entry per non-empty shard
const matrix = JSON.stringify({ include: shards.filter((s) => s.files.length).map((s, i) => ({ shard: i + 1, files: s.files.join(" ") })) });
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\nsmoke=${smoke}\ntoolfiles=${toolfiles.join(",")}\nmatrix=${matrix}\n`);
