// Further Mechanics hub: which sub-tools of each built tool practise which specification statement (mechanicsSpec.ts). The pairing is data written by hand,
// so these tests keep it honest: every pairing names a sub-tool the tool really has, with the name the tool gives it and the kind of practice it shows,
// and every sub-tool of the tool is placed in exactly one place (a statement, the exam card or a group), so a new one cannot be forgotten or listed twice.
import { describe, it, expect } from "vitest";
import { CHAPTERS, MECHANICS_PAIRINGS, MECHANICS_PLANNED, MECHANICS_GROUPS, MECHANICS_EXAM, MECHANICS_TOOLS, type MechSubRef } from "../tools/FurtherMechanics/mechanicsSpec";

type Sub = { key: string; label: string; when: { key: string; values: string[] }[] };
const MODS: Record<string, any> = {
  "dimensional-analysis": await import("../tools/FurtherMechanics/DimensionalAnalysis"),
  "work-done": await import("../tools/FurtherMechanics/WorkDone"),
  "energy": await import("../tools/FurtherMechanics/Energy"),
  "power": await import("../tools/FurtherMechanics/Power"),
  "elastic-strings": await import("../tools/FurtherMechanics/Elastic"),
};
const subsOf = (tool: string): Sub[] => MODS[tool].__seed.subTools.map((s: Sub) => ({ ...s, when: s.when ?? [] }));
const everyRef = (): MechSubRef[] => [...Object.values(MECHANICS_PAIRINGS).flat(), ...Object.values(MECHANICS_GROUPS).flatMap((gs) => gs.flatMap((g) => g.links)), ...Object.values(MECHANICS_EXAM).map((e) => e.ref)];
const all = (tool: string): MechSubRef[] => everyRef().filter((r) => r.tool === tool);
/** the hub says "Force at an angle", the tool "Force at an Angle (A2)": same name once the A2 tag and the capitals are set aside */
const plain = (l: string): string => l.replace(/\s*\(A2\)$/, "").toLowerCase();

describe("Further Mechanics pairings", () => {
  it("every statement ref and chapter id exists in the spec, and every tool a chapter lists is real", () => {
    const refs = new Set(CHAPTERS.flatMap((c) => c.statements.map((s) => s.ref)));
    const ids = new Set(CHAPTERS.map((c) => c.id));
    expect(Object.keys(MECHANICS_PAIRINGS).filter((r) => !refs.has(r))).toEqual([]);
    for (const o of [MECHANICS_GROUPS, MECHANICS_EXAM, MECHANICS_TOOLS]) expect(Object.keys(o).filter((i) => !ids.has(i))).toEqual([]);
  });
  it("every paired sub-tool exists in its tool with the same name and kind of practice", () => {
    const problems: string[] = [];
    for (const tool of Object.keys(MODS)) for (const r of all(tool)) {
      const s = subsOf(tool).find((x) => x.key === r.sub);
      if (!s) { problems.push(`${r.sub}: no such sub-tool`); continue; }
      if (plain(s.label) !== plain(r.label) && !(r.sub === "exAny" && s.label === "Any exam question")) problems.push(`${r.sub}: the tool calls it "${s.label}", the pairing "${r.label}"`);
      const practice = s.when.find((w) => w.key === "practice")?.values[0];
      if (practice !== r.practice) problems.push(`${r.sub}: practice is ${practice}, the pairing says ${r.practice}`);
      // a sub-tool that is only offered at A2 is shown on the A2 row
      const a2 = s.when.some((w) => w.key === "course" && w.values.length === 1 && w.values[0] === "A2");
      if (a2 !== !!r.a2) problems.push(`${r.sub}: A2 is ${a2} in the tool, ${!!r.a2} in the pairing`);
    }
    expect(problems).toEqual([]);
  });
  it("every sub-tool of a built tool is placed once", () => {
    for (const tool of Object.keys(MODS)) {
      const placed = all(tool).map((x) => x.sub);
      expect(subsOf(tool).map((s) => s.key).filter((k) => !placed.includes(k)), tool).toEqual([]);
      expect(placed.filter((k, i) => placed.indexOf(k) !== i), tool).toEqual([]);
    }
  });

  it("plans (greyed-out) sub-tools only for real statements, never twice on one statement, and A2 ones only where the course goes beyond AS", () => {
    const stmts = new Map(CHAPTERS.flatMap((c) => c.statements.map((s) => [s.ref, s] as const)));
    for (const [ref, list] of Object.entries(MECHANICS_PLANNED)) {
      expect(stmts.has(ref), `${ref} is a statement`).toBe(true);
      expect(new Set(list.map((p) => p.label)).size, `${ref} lists a sub-tool twice`).toBe(list.length);
      // a statement that is A2 throughout has only A2 sub-tools
      if (!stmts.get(ref)!.as) for (const p of list) expect(p.a2, `${ref}: ${p.label}`).toBe(true);
    }
    // a statement whose sub-tools are built has none planned; every other statement of a chapter still to be built has something planned
    for (const ref of Object.keys(MECHANICS_PAIRINGS)) expect(MECHANICS_PLANNED[ref], `${ref} is built, so nothing is planned for it`).toBeUndefined();
    expect(Object.keys(MECHANICS_PLANNED).filter((r) => r.startsWith("MA"))).toEqual([]);
    for (const c of CHAPTERS.filter((c) => c.id !== "MA")) for (const s of c.statements) expect(MECHANICS_PLANNED[s.ref] ?? MECHANICS_PAIRINGS[s.ref], `${s.ref} has a built or planned sub-tool`).toBeDefined();
  });
});
