// The corpus of paper questions (specs/corpus/network-flows.md): every question written as a chain of parts from the parts library.
// Fails if a row names a part the library does not have (and is not marked gap: / skip:), or if a row's part marks do not add up to its marks.
// CORPUS_REPORT=1 prints the gaps — the build list — most common first.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PARTS } from "../shared/decision/flowParts";

const text = readFileSync(new URL("../../specs/corpus/network-flows.md", import.meta.url), "utf8");
const rows = text.split("\n").filter((l) => /^\| (AL|AS|L) \|/.test(l)).map((l) => {
  const [, source, q, marks, parts] = l.split("|").map((c) => c.trim());
  return { source, q, marks: Number(marks), parts: parts.split("→").map((p) => { const m = p.trim().match(/^([\w:]+)\((\d+)\)$/)!; return { id: m[1], marks: Number(m[2]), raw: p.trim() }; }) };
});

describe("the Network Flows corpus", () => {
  it("has the current A-level (7), AS (9) and legacy questions", () => {
    expect(rows.filter((r) => r.source === "AL")).toHaveLength(7);
    expect(rows.filter((r) => r.source === "AS")).toHaveLength(9);
    expect(rows.filter((r) => r.source === "L").length).toBeGreaterThanOrEqual(30);
  });
  it("every part is in the library, or marked gap: / skip:", () => {
    for (const r of rows) for (const p of r.parts) {
      if (p.id.startsWith("gap:") || p.id.startsWith("skip:")) continue;
      expect(PARTS[p.id], `${r.source} ${r.q}: ${p.raw}`).toBeTruthy();
    }
  });
  it("each row's part marks add up to its marks", () => {
    for (const r of rows) expect(r.parts.reduce((t, p) => t + p.marks, 0), `${r.source} ${r.q}`).toBe(r.marks);
  });
  it("reports the gaps (the build list)", () => {
    const gaps = new Map<string, { n: number; marks: number }>();
    for (const r of rows) for (const p of r.parts) if (p.id.startsWith("gap:")) { const g = gaps.get(p.id) ?? { n: 0, marks: 0 }; g.n++; g.marks += p.marks; gaps.set(p.id, g); }
    const sorted = [...gaps.entries()].sort((a, b) => b[1].n - a[1].n);
    if (process.env.CORPUS_REPORT) console.info("GAPS\n" + sorted.map(([id, g]) => `${id.padEnd(26)} ${g.n} questions, ${g.marks} marks`).join("\n"));
    expect(sorted.length).toBeGreaterThan(0);
  });
  it("every library part is used by at least one paper question or is a stated extra", () => {
    const used = new Set(rows.flatMap((r) => r.parts.map((p) => p.id)));
    const extras = new Set(["flowCutCompare", "cutShowThat", "cutInNew", "boundNew", "claimAboveCut"]); // used by the Explain and justify tab, or by exam shapes from the earlier AQA dataset that are not in this pack
    for (const id of Object.keys(PARTS)) expect(used.has(id) || extras.has(id), `${id} is not in any corpus row`).toBe(true);
  });
});
