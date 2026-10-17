// ─────────────────────────────────────────────────────────────────────────────
// Critical Path Analysis — the AS skill tabs (specs/cpa-skill-tools.md): table from a network, critical paths, missing time,
// delays and changes, clock times. Each answer is re-derived independently (list every path Start → End; recompute after the change).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { generateCpa, referenceCpa, solveCpa, clockTime, depthOf, fullGraph, type CpaKind, type CpaLevel } from "../shared/decision";

const run = (level: CpaLevel, kind: CpaKind, opts = {}) => {
  const g = generateCpa(level, kind, opts);
  const steps = solveCpa({ network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind } as never);
  return { ...g, steps };
};

describe("CPA — table from a network", () => {
  it("the table is the network's arrows; Level 2 has an arrow that skips a column; the table fills row by row", () => {
    for (let i = 0; i < 40; i++) {
      const lv = (i % 2 ? 2 : 1) as CpaLevel;
      const { data, steps } = run(lv, "cpaTable", { skip: lv === 2 });
      if (lv === 2) {
        const depth = depthOf(fullGraph(data.acts));
        expect(data.acts.some((a) => a.preds.some((p) => depth[a.id] - depth[p] >= 2)), "skip arrow").toBe(true);
      }
      expect(steps[steps.length - 1].cpaView!.tableDone).toEqual(data.acts.map((a) => a.id));
      expect(steps.length).toBe(data.acts.length + 2);
    }
  });
});

describe("CPA — critical paths", () => {
  it("Level 1 has exactly one critical path, Level 2 two or three; the working marks every one", () => {
    for (let i = 0; i < 40; i++) {
      const lv = (i % 2 ? 2 : 1) as CpaLevel;
      const { data, steps } = run(lv, "cpaPaths", { paths: lv === 1 ? "one" : "more" });
      const ref = referenceCpa(data.acts);
      expect(data.criticalPaths).toEqual(ref.criticalPaths);
      expect(ref.criticalPaths.length >= 2).toBe(lv === 2);
      expect(new Set(steps[steps.length - 1].cpaView!.critical)).toEqual(new Set(ref.criticalPaths.flat()));
    }
  });
});

describe("CPA — missing time", () => {
  it("x is the duration that makes the critical path add up to the minimum completion time", () => {
    for (let i = 0; i < 60; i++) {
      const { data, answerText, prompt } = run(1, "cpaUnknown", { paths: "one" });
      const u = data.extra!.unknown!;
      const ref = referenceCpa(data.acts);
      expect(ref.criticalPaths.length).toBe(1);
      const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
      const others = u.path.filter((id) => id !== "Start" && id !== "End" && id !== u.id).reduce((s, id) => s + dur[id], 0);
      expect(others + u.x).toBe(ref.projectTime);
      expect(u.x).toBe(ref.projectTime - others);
      expect(u.path).toContain(u.id);
      expect(answerText).toBe(`x = ${u.x}`);
      expect(prompt).toContain(`x ${data.unit}`);
    }
  });
});

describe("CPA — delays and changes", () => {
  it("the stated effect matches an independent recomputation of the changed network", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 120; i++) {
      const lv = (i % 2 ? 2 : 1) as CpaLevel;
      const { data, steps } = run(lv, "cpaChange");
      const c = data.extra!.change!;
      seen.add(c.mode);
      const T = referenceCpa(data.acts).projectTime;
      const nT = referenceCpa(c.newActs).projectTime;
      expect(c.newTimes.projectTime).toBe(nT);
      if (c.mode === "less") { expect(c.amount).toBeLessThan(c.float); expect(nT).toBe(T); }
      if (c.mode === "equal") { expect(c.amount).toBe(c.float); expect(nT).toBe(T); expect(c.newTimes.float[c.id]).toBe(0); }
      if (c.mode === "more") { expect(c.amount).toBeGreaterThan(c.float); expect(nT).toBe(T + c.amount - c.float); }
      if (c.mode === "shorten") { expect(c.float).toBe(0); expect(nT).toBeLessThanOrEqual(T); expect(nT).toBeGreaterThanOrEqual(T - c.amount); }
      if (lv === 1) expect(c.mode).not.toBe("shorten");
      expect(steps[steps.length - 1].runningTotal).toBe(nT);
    }
    expect(seen.has("less") && seen.has("equal") && seen.has("more") && seen.has("shorten")).toBe(true);
  });
});

describe("CPA — clock times", () => {
  it("the finish and latest start clock times follow from the minimum time and the latest finish", () => {
    for (let i = 0; i < 40; i++) {
      const { data, answerText, steps } = run(2, "cpaContext");
      const clk = data.extra!.clock!;
      const ref = referenceCpa(data.acts);
      const a = data.acts.find((x) => x.id === clk.latestId)!;
      expect(answerText).toContain(`Finish at ${clockTime(clk.startMins + ref.projectTime)}`);
      expect(answerText).toContain(`can start as late as ${clockTime(clk.startMins + ref.lf[a.id] - a.duration)}`);
      expect(data.times.float[a.id]).toBeGreaterThan(0);
      expect(steps[steps.length - 1].caption).toContain(clockTime(clk.startMins + ref.lf[a.id] - a.duration));
    }
    expect(clockTime(9 * 60 + 5)).toBe("09:05");
  });
});

describe("CPA — cascade chart (A-level)", () => {
  for (const layout of ["sequence", "rows"] as const) for (const start of ["early", "late"] as const) {
    it(`${start} start, critical activities ${layout === "sequence" ? "in sequence" : "on their own rows"}: bars, floats and rows agree with the independent reference`, () => {
      for (let i = 0; i < 25; i++) {
        const { data, steps } = run(3, "cpaCascade", { paths: "one", cascade: { start, layout, style: i % 2 ? "bars" : "blocks" } });
        const c = data.extra!.cascade!;
        const ref = referenceCpa(data.acts);
        const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
        expect(c.T).toBe(ref.projectTime);
        for (const b of c.bars) {
          const fl = ref.lf[b.id] - ref.es[b.id] - dur[b.id];
          expect(b.float, `float ${b.id}`).toBe(fl);
          expect(b.critical).toBe(fl === 0);
          expect(b.start).toBe(start === "early" ? ref.es[b.id] : ref.lf[b.id] - dur[b.id]);
          expect(b.end - b.start).toBe(dur[b.id]);
          expect(b.end + (start === "early" ? b.float : 0)).toBeLessThanOrEqual(c.T + 0);
          expect(b.start - (start === "late" ? b.float : 0)).toBeGreaterThanOrEqual(0);
        }
        // critical activities lie end to end from 0 to T
        const crit = c.bars.filter((b) => b.critical).sort((x, y) => x.start - y.start);
        expect(crit[0].start).toBe(0);
        expect(crit[crit.length - 1].end).toBe(c.T);
        crit.slice(1).forEach((b, k) => expect(b.start).toBe(crit[k].end));
        // no two bars share a row unless both are critical (the shared row), and never overlap there
        const byRow = new Map<number, typeof c.bars>();
        c.bars.forEach((b) => byRow.set(b.row, [...(byRow.get(b.row) ?? []), b]));
        for (const [, bs] of byRow) if (bs.length > 1) {
          expect(layout).toBe("sequence");
          expect(bs.every((b) => b.critical)).toBe(true);
        }
        expect(c.rowLabels.length).toBe(Math.max(...c.bars.map((b) => b.row)) + 1);
        // the working ends with every bar drawn and every non-critical float shown
        const last = steps[steps.length - 1].ganttView!;
        expect(new Set(last.bars)).toEqual(new Set(data.acts.map((a) => a.id)));
        expect(new Set(last.floats)).toEqual(new Set(c.bars.filter((b) => !b.critical).map((b) => b.id)));
      }
    }, 60_000);
  }
});

describe("CPA — Level 3 (10–12 activities) of the forward pass and full analysis", () => {
  it("is generated at that size and still agrees with the independent reference", () => {
    for (const kind of ["cpaForward", "cpaFull"] as CpaKind[]) for (let i = 0; i < 15; i++) {
      const { data } = run(3, kind);
      expect(data.acts.length).toBeGreaterThanOrEqual(10);
      expect(data.acts.length).toBeLessThanOrEqual(12);
      expect(data.times.projectTime).toBe(referenceCpa(data.acts).projectTime);
    }
  }, 60_000);
});
