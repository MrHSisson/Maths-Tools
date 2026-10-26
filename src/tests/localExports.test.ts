import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// An export that no other file names is noise in the public surface (and hides dead code). If this fails, either drop the `export`, or use
// the name somewhere (a test counts). Barrel files (`index.ts`) and `__test` are exempt. The check is by name, so it errs towards "used".
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mjs|js)$/.test(p) ? [p] : []; });
}

describe("no file-local exports", () => {
  it("every exported name is named by another file", () => {
    const files = [...walk("src"), ...walk("scripts"), ...walk("api")];
    const text = new Map(files.map(f => [f, readFileSync(f, "utf8")]));
    const EXP = /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;
    const lonely: string[] = [];
    for (const [f, t] of text) {
      if (/(^|\/)index\.tsx?$/.test(f) || f.startsWith("src/generated") || !/^src\//.test(f)) continue;
      for (const m of t.matchAll(EXP)) {
        const name = m[1];
        if (name === "__test") continue;
        const word = new RegExp(`(?<![\\w$])${name.replace(/\$/g, "\\$")}(?![\\w$])`);
        if (![...text].some(([f2, t2]) => f2 !== f && word.test(t2))) lonely.push(`${f}: ${name}`);
      }
    }
    expect(lonely).toEqual([]);
  });
});
