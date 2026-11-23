// Decision Maths: the pairings for every tool other than Critical Path (which decisionPairings.test.ts covers). The pairing is data written by hand, so these tests keep it honest:
// every paired sub-tool exists in its tool under the name the pairing gives it (and, for Network Flows, with the same course and practice), and every sub-tool of each tool is placed
// in exactly one place (under a statement, in a group or as the chapter's exam card), so a new one cannot be forgotten or listed twice.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DECISION_CHAPTERS, DECISION_PAIRINGS, DECISION_GROUPS, DECISION_EXAM, type SubToolRef } from "../tools/Decision/decisionSpec";
import { TOOLS } from "../admin/facts";

interface Sub { key: string; label: string; course?: string; practice?: string }
const TOOL_IDS = ["minimum-spanning-tree", "route-inspection", "travelling-salesperson", "network-flows", "lp-formulate", "lp-simplex", "mixed-strategies"];
const fileOf = (id: string): string => { const t = TOOLS.find((x) => x.id === id); if (!t) throw new Error(`no tool ${id}`); return t.file; };

/** the sub-tools a tool really has: from its `__seed` when it exports one, from its SUB_TOOLS list in the source otherwise, from its config for a one-tab ToolShell tool */
async function subsOf(id: string): Promise<Sub[]> {
  const file = fileOf(id);
  const mod: any = await import(/* @vite-ignore */ `../${file.replace(/^src\//, "").replace(/\.tsx$/, "")}`);
  if (mod.__seed?.subTools) {
    return mod.__seed.subTools.map((s: any) => {
      const when: any[] = Array.isArray(s.when) ? s.when : s.when ? [s.when] : [];
      return { key: s.key, label: s.label, course: when.find((w) => w.key === "course")?.values?.[0], practice: when.find((w) => w.key === "practice")?.values?.[0] };
    });
  }
  if (mod.__test?.TOOL_CONFIG?.tools) return Object.entries<any>(mod.__test.TOOL_CONFIG.tools).map(([key, v]) => ({ key, label: v.name }));
  const src = readFileSync(file, "utf8");
  const at = src.search(/\bSUB_TOOLS\b[^=\n]*=\s*\[/);
  const block = src.slice(at, src.indexOf("\n];", at));
  return [...block.matchAll(/\{\s*key:\s*"([A-Za-z0-9]+)",\s*label:\s*"([^"]*)"/g)].map((m) => ({ key: m[1], label: m[2] }));
}

const all = (): SubToolRef[] => [...Object.values(DECISION_PAIRINGS).flat(), ...Object.values(DECISION_GROUPS).flatMap((gs) => gs.flatMap((g) => g.links)), ...Object.values(DECISION_EXAM).map((e) => e.ref)];

describe("Decision spec pairings for every tool", () => {
  it("every paired sub-tool exists in its tool with the same name", async () => {
    const problems: string[] = [];
    for (const id of TOOL_IDS) {
      const subs = await subsOf(id);
      for (const r of all().filter((x) => x.tool === id)) {
        const s = subs.find((x) => x.key === r.sub);
        if (!s) { problems.push(`${id}/${r.sub}: no such sub-tool`); continue; }
        if (s.label !== r.label) problems.push(`${id}/${r.sub}: the tool calls it "${s.label}", the pairing "${r.label}"`);
        if (s.course && r.course && s.course !== r.course) problems.push(`${id}/${r.sub}: course is ${s.course}, the pairing says ${r.course}`);
        if (s.practice && r.practice && s.practice !== r.practice) problems.push(`${id}/${r.sub}: practice is ${s.practice}, the pairing says ${r.practice}`);
        if (r.course && r.as !== (r.course === "as")) problems.push(`${id}/${r.sub}: the AS flag does not match its course`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("every sub-tool of each tool is placed in exactly one place", async () => {
    const problems: string[] = [];
    for (const id of TOOL_IDS) {
      const subs = await subsOf(id);
      const placed = all().filter((x) => x.tool === id).map((x) => x.sub);
      for (const s of subs) if (!placed.includes(s.key)) problems.push(`${id}/${s.key}: not placed`);
      for (const k of placed.filter((k, i) => placed.indexOf(k) !== i)) problems.push(`${id}/${k}: placed twice`);
    }
    expect(problems).toEqual([]);
  });

  it("every chapter with a tool links to it from at least one statement, group or exam card", () => {
    const linked = new Set(all().map((x) => x.tool));
    const missing = DECISION_CHAPTERS.flatMap((c) => c.toolIds).filter((id) => TOOL_IDS.includes(id) && !linked.has(id));
    expect(missing).toEqual([]);
  });
});
