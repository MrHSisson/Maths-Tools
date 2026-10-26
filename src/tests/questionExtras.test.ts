import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// The underscore fields on a question are the contract between a tool and the shell (`src/shared/questionExtras.ts`).
// A misspelt one silently does nothing, so source may only mention fields that interface lists, and every listed field must be used.

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(p) ? [p] : []; });
}

const SELF = "src/shared/questionExtras.ts";
const src = files("src").filter(f => !f.includes("/tests/") && f !== SELF).map(f => ({ f, text: readFileSync(f, "utf8") }));

const declared = new Set([...readFileSync(SELF, "utf8").matchAll(/^\s+(_[a-zA-Z]+)\?:/gm)].map(m => m[1]));

// Underscore names that are not question fields: unused parameters, a local in a standalone generator and one arc property in the flow network code.
const NOT_FIELDS = new Set(["_idx", "_level", "_vars", "_dropdownValue", "_variables", "_multiSelectValues", "_el", "_worksheetEl", "_w", "_setTip", "_setActiveTooltip", "_pos"]);

// A field is mentioned as a property (`q._x`, `extras(q)._x`) or as an object key (`{ _x: …`, `, _x: …`, a line starting `_x:`). `_x?:` is a parameter.
const MENTION = /(?:\.|[{,]\s*|^\s*)(_[a-z][A-Za-z]*)\b(?!\?)(?=\s*(?:[:=]|[^\w:?(]|$))/gm;

describe("question underscore fields", () => {
  it("lists every field the source mentions", () => {
    const unknown: string[] = [];
    for (const { f, text } of src) {
      for (const m of text.matchAll(MENTION)) {
        const name = m[1];
        if (name === "_" || declared.has(name) || NOT_FIELDS.has(name)) continue;
        // `x._y: T` style type annotations and `_name` parameters are skipped by the lookahead; anything left is a field.
        const line = text.slice(0, m.index).split("\n").length;
        unknown.push(`${f}:${line} ${name}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("has no field that nothing uses", () => {
    const body = src.map(s => s.text).join("\n");
    const unused = [...declared].filter(n => !new RegExp(`\\b${n}\\b`).test(body));
    expect(unused).toEqual([]);
  });

  it("is read through extras(q), not (q as any)", () => {
    const loose: string[] = [];
    for (const { f, text } of src) {
      text.split("\n").forEach((line, i) => { if (/as any\)\._[a-z]/.test(line)) loose.push(`${f}:${i + 1}`); });
    }
    expect(loose).toEqual([]);
  });
});
