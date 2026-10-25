import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// A switched-off hook-dependency check is a promise that the effect is meant to run on fewer triggers than the values it reads. Inside the tool
// shell and the shared components that promise must say why (`-- deliberate: …`), so the next person can judge it. (Files still waiting
// for their audit are listed in eslint.config.js and skipped here.)
const NOT_YET_AUDITED = ["src/shared/grapher/SmartGrapher.tsx"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(p) ? [p] : []; });
}

describe("switched-off hook-dependency checks give a reason", () => {
  it("every one in src/shared says why", () => {
    const bare: string[] = [];
    for (const f of files("src/shared")) {
      if (NOT_YET_AUDITED.includes(f)) continue;
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/eslint-disable(-next-line|-line)?\s+react-hooks\/exhaustive-deps/.test(line) && !/--\s*deliberate:/.test(line)) bare.push(`${f}:${i + 1}`);
      });
    }
    expect(bare).toEqual([]);
  });
});
