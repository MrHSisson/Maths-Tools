// ─────────────────────────────────────────────────────────────────────────────
// Critical Path Analysis (specs/critical-path.md): the forward/backward pass reproduces the teacher's reference diagram, agrees with an
// independent list-every-path reference, and every generated network is a clean, unambiguous immediate-predecessor table.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import {
  cpaTimes, criticalActivities, referenceCpa, layoutCpa, layoutIssues, generateCpa, fullGraph, depthOf, solveCpa,
  type CpaActivity, type CpaKind, type CpaLevel,
} from "../shared/decision";

// The reference diagram: A 18, B 8, C 16 (after B), D 9 (after A, C), E 22 (after C), F 11 (after D), G 13 (after A, C).
const REF: CpaActivity[] = [
  { id: "A", duration: 18, preds: [] },
  { id: "B", duration: 8, preds: [] },
  { id: "C", duration: 16, preds: ["B"] },
  { id: "D", duration: 9, preds: ["A", "C"] },
  { id: "E", duration: 22, preds: ["C"] },
  { id: "F", duration: 11, preds: ["D"] },
  { id: "G", duration: 13, preds: ["A", "C"] },
];

describe("Critical Path Analysis — the reference diagram", () => {
  const t = cpaTimes(REF);
  it("earliest starts, latest finishes and floats", () => {
    expect(t.es).toMatchObject({ A: 0, B: 0, C: 8, D: 24, E: 24, F: 33, G: 24, End: 46 });
    expect(t.lf).toMatchObject({ A: 26, B: 8, C: 24, D: 35, E: 46, F: 46, G: 46, Start: 0 });
    expect(t.float).toMatchObject({ A: 8, B: 0, C: 0, D: 2, E: 0, F: 2, G: 9 });
    expect(t.projectTime).toBe(46);
  });
  it("critical activities B, C, E; path Start–B–C–E–End", () => {
    expect(criticalActivities(REF)).toEqual(["B", "C", "E"]);
    expect(referenceCpa(REF).criticalPaths).toEqual([["Start", "B", "C", "E", "End"]]);
  });
  it("lays out in columns by longest chain, with no arrow through a box", () => {
    const l = layoutCpa(REF);
    expect(layoutIssues(l)).toEqual([]);
    const depth = depthOf(fullGraph(REF));
    expect([depth.A, depth.B, depth.C, depth.D, depth.F, depth.End]).toEqual([1, 1, 2, 3, 4, 5]);
  });
});

const KINDS: CpaKind[] = ["cpaNetwork", "cpaForward", "cpaFull", "cpaFloat"];

describe("Critical Path Analysis — generated networks", () => {
  for (const level of [1, 2, 3] as CpaLevel[]) {
    it(`Level ${level}: clean, unambiguous, and the pass agrees with the independent reference`, () => {
      for (let i = 0; i < 120; i++) {
        const paths = (["one", "more", "either"] as const)[i % 3];
        const { data } = generateCpa(level, KINDS[i % 4], { size: i % 2 ? "small" : "medium", paths });
        const { acts, times, layout } = data;
        const ref = referenceCpa(acts);
        expect(times.projectTime).toBe(ref.projectTime);
        for (const id of Object.keys(times.es)) {
          expect(times.es[id], `es ${id}`).toBe(ref.es[id]);
          expect(times.lf[id], `lf ${id}`).toBe(ref.lf[id]);
          expect(times.float[id] === 0, `critical ${id}`).toBe(ref.criticalSet.has(id));
          expect(times.float[id]).toBeGreaterThanOrEqual(0);
        }
        if (paths === "one") expect(ref.criticalPaths.length).toBe(1);
        if (paths === "more") expect(ref.criticalPaths.length, "more than one critical path").toBeGreaterThanOrEqual(2);
        expect(ref.criticalPaths.length).toBeLessThanOrEqual(3);
        expect(data.criticalPaths).toEqual(ref.criticalPaths);
        // immediate predecessors only: no listed predecessor is reachable through another listed one
        const preds = new Map(acts.map((a) => [a.id, a.preds]));
        const reach = (from: string, target: string): boolean => (preds.get(from) ?? []).some((p) => p === target || reach(p, target));
        for (const a of acts) for (const p of a.preds) expect(a.preds.some((q) => q !== p && reach(q, p)), `${a.id} lists redundant ${p}`).toBe(false);
        expect(layoutIssues(layout)).toEqual([]);
        expect(acts.some((a) => a.preds.length === 0 && !acts.some((b) => b.preds.includes(a.id))), "a lone first-and-last activity").toBe(false);
        if (level === 1) expect(layout.edges.filter((e) => e.routed).length, "Level 1 has no routed arrow").toBe(0);
        expect(layout.crossings).toBeLessThanOrEqual(level === 1 ? 1 : level === 2 ? 2 : 4);
        if (level === 1) expect(acts.length).toBeGreaterThanOrEqual(6);
      }
    }, 60_000);
  }
});

describe("Critical Path Analysis — the working", () => {
  for (const kind of KINDS) for (const level of [1, 2, 3] as CpaLevel[]) {
    it(`${kind} Level ${level}: ends with every answer on the picture`, () => {
      for (let i = 0; i < 25; i++) {
        const { data, prompt, answerText } = generateCpa(level, kind, { paths: (["one", "more", "either"] as const)[i % 3] });
        const problem = { network: { nodes: [], edges: [] }, prompt, answer: { text: answerText, value: data.times.projectTime }, cpa: data, kind } as never;
        const steps = solveCpa(problem);
        expect(steps.length).toBeGreaterThan(2);
        const last = steps[steps.length - 1].cpaView!;
        const t = data.times;
        if (kind !== "cpaNetwork") {
          for (const a of data.acts) {
            if (kind !== "cpaFloat") expect(last.es?.[a.id], `${kind} es ${a.id}`).toBe(t.es[a.id]);
            if (kind === "cpaFull" || kind === "cpaFloat") expect(last.lf?.[a.id], `${kind} lf ${a.id}`).toBe(t.lf[a.id]);
          }
        } else {
          expect(new Set(last.shown)).toEqual(new Set(["Start", "End", ...data.acts.map((a) => a.id)]));
          expect(last.arrows?.length).toBe(data.layout.edges.length);
        }
        if (kind === "cpaFloat") for (const a of data.acts) expect(last.float?.[a.id]).toBe(t.float[a.id]);
        // every beat names only real boxes
        const ids = new Set(data.layout.edges.flatMap((e) => [e.from, e.to]));
        for (const s of steps) for (const id of [...(s.cpaView?.shown ?? []), ...(s.cpaView?.compare ?? []), ...(s.cpaView?.current ? [s.cpaView.current] : [])]) expect(ids.has(id), id).toBe(true);
      }
    }, 60_000);
  }
});

describe("Critical Path Analysis — more than one critical path", () => {
  it("'either' gives both one and several; the working marks every critical path", () => {
    const counts = new Set<number>();
    for (let i = 0; i < 80; i++) {
      const { data, prompt, answerText } = generateCpa(2, "cpaFull", { paths: "either" });
      counts.add(data.criticalPaths.length);
      const steps = solveCpa({ network: { nodes: [], edges: [] }, prompt, answer: { text: answerText }, cpa: data, kind: "cpaFull" } as never);
      const last = steps[steps.length - 1].cpaView!;
      expect(new Set(last.critical)).toEqual(new Set(data.criticalPaths.flat()));
      expect(last.criticalArrows?.length).toBe(new Set(data.criticalPaths.flatMap((p) => p.slice(1).map((id, k) => `${p[k]}→${id}`))).size);
    }
    expect(counts.has(1) && (counts.has(2) || counts.has(3))).toBe(true);
  });
});
