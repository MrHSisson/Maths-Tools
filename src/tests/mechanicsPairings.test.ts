// Further Mechanics hub: which sub-tools of each built tool practise which specification statement (mechanicsSpec.ts). The pairing is data written by hand,
// so these tests keep it honest: every pairing names a sub-tool the tool really has, with the name the tool gives it and the kind of practice it shows,
// and every sub-tool of the tool is placed in exactly one place (a statement, the exam card or a group), so a new one cannot be forgotten or listed twice.
import { describe, it, expect } from "vitest";
import { CHAPTERS, MECHANICS_PAIRINGS, MECHANICS_GROUPS, MECHANICS_EXAM, MECHANICS_TOOLS, type MechSubRef } from "../tools/FurtherMechanics/mechanicsSpec";

type Sub = { key: string; label: string; when: { key: string; values: string[] }[] };
const mod: any = await import("../tools/FurtherMechanics/DimensionalAnalysis");
const SUBS: Sub[] = mod.__seed.subTools;
const all = (): MechSubRef[] => [...Object.values(MECHANICS_PAIRINGS).flat(), ...Object.values(MECHANICS_GROUPS).flatMap((gs) => gs.flatMap((g) => g.links)), ...Object.values(MECHANICS_EXAM).map((e) => e.ref)]
  .filter((r) => r.tool === "dimensional-analysis");

describe("Further Mechanics pairings", () => {
  it("every statement ref and chapter id exists in the spec, and every tool a chapter lists is real", () => {
    const refs = new Set(CHAPTERS.flatMap((c) => c.statements.map((s) => s.ref)));
    const ids = new Set(CHAPTERS.map((c) => c.id));
    expect(Object.keys(MECHANICS_PAIRINGS).filter((r) => !refs.has(r))).toEqual([]);
    for (const o of [MECHANICS_GROUPS, MECHANICS_EXAM, MECHANICS_TOOLS]) expect(Object.keys(o).filter((i) => !ids.has(i))).toEqual([]);
  });
  it("every paired sub-tool exists in Dimensional Analysis with the same name and kind of practice", () => {
    const problems: string[] = [];
    for (const r of all()) {
      const s = SUBS.find((x) => x.key === r.sub);
      if (!s) { problems.push(`${r.sub}: no such sub-tool`); continue; }
      if (s.label !== r.label && !(r.sub === "exAny" && s.label === "Any exam question")) problems.push(`${r.sub}: the tool calls it "${s.label}", the pairing "${r.label}"`);
      const practice = s.when.find((w) => w.key === "practice")?.values[0];
      if (practice !== r.practice) problems.push(`${r.sub}: practice is ${practice}, the pairing says ${r.practice}`);
    }
    expect(problems).toEqual([]);
  });
  it("every Dimensional Analysis sub-tool is placed once", () => {
    const placed = all().map((x) => x.sub);
    expect(SUBS.map((s) => s.key).filter((k) => !placed.includes(k))).toEqual([]);
    expect(placed.filter((k, i) => placed.indexOf(k) !== i)).toEqual([]);
  });
});
