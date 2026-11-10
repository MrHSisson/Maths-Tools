// Decision Maths: which generator sub-tools address which specification statement (decisionSpec.ts, DECISION_PAIRINGS and DECISION_GROUPS).
// The pairing is data written by hand, so these tests keep it honest: every pairing names a sub-tool the tool really has, with the name and
// the course and practice settings the tool gives it, and every sub-tool of the tool is placed somewhere, so a new one cannot be forgotten.
import { describe, it, expect } from "vitest";
import { DECISION_CHAPTERS, DECISION_PAIRINGS, DECISION_GROUPS, type SubToolRef } from "../tools/Decision/decisionSpec";

type Sub = { key: string; label: string; when: { key: string; values: string[] }[] };
const cpaModule: any = await import("../tools/Decision/CriticalPath");
const SUBS: Sub[] = cpaModule.__seed.subTools;

const all = (): SubToolRef[] => [...Object.values(DECISION_PAIRINGS).flat(), ...Object.values(DECISION_GROUPS).flatMap(gs => gs.flatMap(g => g.links))];
const whenOf = (s: Sub, key: string) => s.when.find(w => w.key === key)?.values[0];

describe("Decision spec pairings", () => {
  it("every statement ref and chapter id exists in the spec", () => {
    const refs = new Set(DECISION_CHAPTERS.flatMap(c => c.statements.map(s => s.ref)));
    const ids = new Set(DECISION_CHAPTERS.map(c => c.id));
    expect(Object.keys(DECISION_PAIRINGS).filter(r => !refs.has(r))).toEqual([]);
    expect(Object.keys(DECISION_GROUPS).filter(i => !ids.has(i))).toEqual([]);
  });

  it("every paired sub-tool exists in Critical Path with the same name, course and practice", () => {
    const problems: string[] = [];
    for (const r of all().filter(x => x.tool === "critical-path")) {
      const s = SUBS.find(x => x.key === r.sub);
      if (!s) { problems.push(`${r.sub}: no such sub-tool`); continue; }
      if (s.label !== r.label) problems.push(`${r.sub}: the tool calls it "${s.label}", the pairing "${r.label}"`);
      if (whenOf(s, "course") !== r.course) problems.push(`${r.sub}: course is ${whenOf(s, "course")}, the pairing says ${r.course}`);
      if (whenOf(s, "practice") !== r.practice) problems.push(`${r.sub}: practice is ${whenOf(s, "practice")}, the pairing says ${r.practice}`);
      if (r.as !== (r.course === "as")) problems.push(`${r.sub}: the AS flag does not match its course`);
    }
    expect(problems).toEqual([]);
  });

  it("every Critical Path sub-tool is placed under a statement or in a group", () => {
    const placed = new Set(all().filter(x => x.tool === "critical-path").map(x => x.sub));
    expect(SUBS.map(s => s.key).filter(k => !placed.has(k))).toEqual([]);
  });
});
