// CLAUDE.md and its reference files: the shared-library reference lives in docs/reference/ so every session does not load it, and the
// never / always rules are copied into the Rules checklist in CLAUDE.md so they apply even when a reference file is not opened. This
// test keeps the two in step, so a rule cannot quietly leave the always-loaded file.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const claude = readFileSync("CLAUDE.md", "utf8");
const refFiles = readdirSync("docs/reference").filter((f) => f.endsWith(".md")).sort();
const refText = Object.fromEntries(refFiles.map((f) => [f, readFileSync(`docs/reference/${f}`, "utf8")]));

const checklist = [...claude.matchAll(/^- \*\*R(\d+)\*\*/gm)].map((m) => Number(m[1]));
const STRONG = /\b(never|always|must|do not|don't|mustn't)\b/i;
const MARK = /<!--\s*((?:R\d+|ref)(?:\s+(?:R\d+|ref))*)\s*-->/;

/** Lines of a reference file outside code fences, with their line numbers. */
function proseLines(text: string): { n: number; line: string }[] {
  let fence = false;
  const out: { n: number; line: string }[] = [];
  text.split("\n").forEach((line, i) => {
    if (line.trim().startsWith("```")) { fence = !fence; return; }
    if (!fence) out.push({ n: i + 1, line });
  });
  return out;
}

describe("CLAUDE.md and docs/reference", () => {
  it("indexes every reference file, and every link resolves", () => {
    for (const f of refFiles) expect(claude, `CLAUDE.md does not link docs/reference/${f}`).toContain(`docs/reference/${f}`);
    for (const m of claude.matchAll(/docs\/reference\/([\w-]+\.md)/g)) expect(refFiles, `CLAUDE.md links a missing file: ${m[1]}`).toContain(m[1]);
  });

  it("every reference file says when to read it", () => {
    for (const f of refFiles) expect(refText[f], f).toMatch(/\*\*Read when:\*\*/);
  });

  it("the Rules checklist has consecutive ids R1…Rn", () => {
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist).toEqual(checklist.map((_, i) => i + 1));
  });

  it("every never / always / must line in a reference file carries a rule id (or `ref` for a plain description), and every id is in the checklist", () => {
    const bare: string[] = [];
    const unknown: string[] = [];
    for (const f of refFiles) for (const { n, line } of proseLines(refText[f])) {
      const mark = line.match(MARK);
      if (STRONG.test(line.replace(MARK, "")) && !mark) bare.push(`${f}:${n}: ${line.slice(0, 90)}`);
      if (mark) for (const id of mark[1].split(/\s+/)) if (id !== "ref" && !checklist.includes(Number(id.slice(1)))) unknown.push(`${f}:${n}: ${id}`);
    }
    expect(bare, "lines with never / always / must and no rule id (add the rule to the CLAUDE.md checklist and tag the line, or tag it `ref`)").toEqual([]);
    expect(unknown, "rule ids that are not in the CLAUDE.md checklist").toEqual([]);
  });

  it("every checklist rule is tagged on at least one reference line", () => {
    const tagged = new Set<number>();
    for (const f of refFiles) for (const { line } of proseLines(refText[f])) {
      const mark = line.match(MARK);
      if (mark) for (const id of mark[1].split(/\s+/)) if (id !== "ref") tagged.add(Number(id.slice(1)));
    }
    expect(checklist.filter((n) => !tagged.has(n)).map((n) => `R${n}`)).toEqual([]);
  });

  it("CLAUDE.md stays small: new reference goes in docs/reference/", () => {
    expect(claude.length, "CLAUDE.md is loaded in every session; put long reference in docs/reference/ and keep only rules and pointers here").toBeLessThan(64_000);
  });
});
