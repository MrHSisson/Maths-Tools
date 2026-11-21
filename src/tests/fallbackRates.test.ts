// Measures how often a generator gives up and returns its fall-back question. Skipped unless FALLBACK_RATES=1 (it draws about 20,000 questions per case):
//   FALLBACK_RATES=1 npx vitest run src/tests/fallbackRates.test.ts   then read /tmp/fallback-rates.json
// The policy for a test that fails now and then is in AGENTS.md ("Tests must not fail by chance"). To measure another tool, add its cases here.
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { __test } from "../tools/Proportion/RatioManipulation";
const T = ["wholeNumbers", "units", "decimals", "fractions", "letters", "alreadySimplest"];
it.skipIf(!process.env.FALLBACK_RATES)("fall-back rates of Ratio Manipulation", () => {
  const out: Record<string, string> = {};
  const N = 20000;
  const run = (label: string, tool: string, level: string, ms: Record<string, boolean>) => {
    let bad = 0, thrown = 0;
    for (let i = 0; i < N; i++) { try { const q: any = __test.generateQuestion(tool, level as never, {}, "primes", ms as never); if (/fallback/.test(q.key ?? "")) bad++; } catch { thrown++; } }
    out[label] = `${(100 * bad / N).toFixed(3)}%${thrown ? ` threw ${thrown}` : ""}`;
  };
  for (const level of ["level1", "level2", "level3"]) {
    for (const t of T) {
      const base: Record<string, boolean> = Object.fromEntries(T.map((x) => [x, false]));
      for (const ask of t === "wholeNumbers" ? ["simplest", "oneToN", "nToOne"] : ["simplest"]) run(`simplifying ${level} ${t} ${ask}`, "simplifying", level, { ...base, [t]: true, simplest: ask === "simplest", oneToN: ask === "oneToN", nToOne: ask === "nToOne" });
    }
    run(`equivalentRatios ${level} default`, "equivalentRatios", level, {});
    run(`fractionToRatio ${level} default`, "fractionToRatio", level, {});
    run(`ratioToFraction ${level} default`, "ratioToFraction", level, {});
    run(`formingRatios ${level} default`, "formingRatios", level, {});
  }
  writeFileSync("/tmp/fallback-rates.json", JSON.stringify(out, null, 1));
}, 900000);
