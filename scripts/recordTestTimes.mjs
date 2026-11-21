// Refreshes scripts/testTimes.json (seconds per test file) from a full run: `npm run test:times`, then commit it. Used to balance the CI runners (scripts/testShards.mjs).
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const out = "/tmp/test-times-report.json";
try { execSync(`npx vitest run --reporter=json --outputFile=${out}`, { stdio: "ignore" }); } catch { /* a failing test still writes the report */ }
const report = JSON.parse(readFileSync(out, "utf8"));
const times = {};
for (const f of report.testResults) times[f.name.split("src/tests/").pop()] = Math.round(((f.endTime - f.startTime) / 1000) * 10) / 10;
writeFileSync("scripts/testTimes.json", JSON.stringify(Object.fromEntries(Object.entries(times).sort(([a], [b]) => a.localeCompare(b))), null, 1) + "\n");
console.log(`scripts/testTimes.json: ${Object.keys(times).length} files, ${Math.round(Object.values(times).reduce((a, b) => a + b, 0))} s of work`);
