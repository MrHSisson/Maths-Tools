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

describe("CPA — missing time off the critical path", () => {
  it("x ≤ bound keeps the minimum time; one more lengthens it", () => {
    for (let i = 0; i < 60; i++) {
      const { data, answerText, steps } = run(1, "cpaUnknown", { paths: "one", unknownWhere: "off" });
      const u = data.extra!.unknown!;
      expect(u.where).toBe("off");
      expect(data.times.float[u.id]).toBeGreaterThan(0);
      const T = referenceCpa(data.acts).projectTime;
      const withX = (x: number) => data.acts.map((a) => (a.id === u.id ? { ...a, duration: x } : a));
      expect(referenceCpa(withX(u.bound!)).projectTime, "x = bound keeps T").toBe(T);
      expect(referenceCpa(withX(u.bound! + 1)).projectTime, "x = bound + 1 lengthens").toBe(T + 1);
      expect(answerText).toBe(`x ≤ ${u.bound}`);
      expect(steps[steps.length - 1].runningTotal).toBe(u.bound);
    }
  });
});

describe("CPA — delays and changes recalculate the changed boxes one at a time", () => {
  it("each changed earliest start / latest finish appears on its own beat, in order, and nothing else moves", () => {
    for (let i = 0; i < 80; i++) {
      const { data, steps } = run((i % 2 ? 2 : 1) as CpaLevel, "cpaChange");
      const c = data.extra!.change!;
      const t = data.times, nt = c.newTimes;
      let prevEs = steps[0].cpaView!.es!, prevLf = steps[0].cpaView!.lf!;
      for (const s of steps.slice(1)) {
        const v = s.cpaView!;
        const esMoves = Object.keys(v.es!).filter((id) => v.es![id] !== prevEs[id]);
        const lfMoves = Object.keys(v.lf!).filter((id) => v.lf![id] !== prevLf[id]);
        expect(esMoves.length, "at most one earliest start per beat").toBeLessThanOrEqual(1);
        expect(lfMoves.length, "at most one latest finish per beat").toBeLessThanOrEqual(1);
        esMoves.forEach((id) => expect(v.es![id]).toBe(nt.es[id]));
        lfMoves.forEach((id) => expect(v.lf![id]).toBe(nt.lf[id]));
        prevEs = v.es!; prevLf = v.lf!;
      }
      // the last beat holds exactly the recalculated network
      for (const id of Object.keys(nt.es)) { expect(prevEs[id]).toBe(nt.es[id]); expect(prevLf[id]).toBe(nt.lf[id]); }
      // the number of beats that move a time = the number of times that differ
      const changedEs = Object.keys(nt.es).filter((id) => nt.es[id] !== t.es[id]).length;
      const changedLf = Object.keys(nt.lf).filter((id) => nt.lf[id] !== t.lf[id]).length;
      let movedEs = 0, movedLf = 0, pe = steps[0].cpaView!.es!, pl = steps[0].cpaView!.lf!;
      for (const s of steps.slice(1)) { if (Object.keys(s.cpaView!.es!).some((id) => s.cpaView!.es![id] !== pe[id])) movedEs++; if (Object.keys(s.cpaView!.lf!).some((id) => s.cpaView!.lf![id] !== pl[id])) movedLf++; pe = s.cpaView!.es!; pl = s.cpaView!.lf!; }
      expect(movedEs).toBe(changedEs);
      expect(movedLf).toBe(changedLf);
    }
  });
});

describe("CPA — resource histogram (A-level)", () => {
  for (const [lv, workers] of [[2, "one"], [2, "several"], [3, "one"]] as const) {
    it(`${lv === 3 ? "10–12" : "8–9"} activities, ${workers === "one" ? "one worker each" : "several workers each"}: blocks match the independent reference and stack with no holes`, () => {
      for (let i = 0; i < 12; i++) {
        const { data, steps, answerText } = run(lv as CpaLevel, "cpaHistogram", { paths: "one", workers });
        const h = data.extra!.histogram!;
        const ref = referenceCpa(data.acts);
        const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
        const w = Object.fromEntries(data.acts.map((a) => [a.id, a.workers ?? 1]));
        if (workers === "one") expect(data.acts.every((a) => a.workers === 1)).toBe(true);
        else expect(data.acts.every((a) => a.workers! >= 1 && a.workers! <= 3)).toBe(true);
        for (const b of h.blocks) {
          expect(b.start, `earliest start ${b.id}`).toBe(ref.es[b.id]);
          expect(b.end - b.start).toBe(dur[b.id]);
          expect(b.workers).toBe(w[b.id]);
          expect(b.critical).toBe(ref.criticalSet.has(b.id));
          if (b.critical) expect(b.y, "critical activities on the bottom").toBe(0);
        }
        // no two blocks overlap
        for (let a = 0; a < h.blocks.length; a++) for (let b = a + 1; b < h.blocks.length; b++) {
          const p = h.blocks[a], q = h.blocks[b];
          const clash = p.start < q.end && q.start < p.end && p.y < q.y + q.workers && q.y < p.y + p.workers;
          expect(clash, `${p.id} overlaps ${q.id}`).toBe(false);
        }
        // the stack in every time unit is contiguous from the bottom, and its height is the independent profile
        for (let t = 0; t < ref.projectTime; t++) {
          const here = h.blocks.filter((b) => b.start <= t && t < b.end).sort((x, y) => x.y - y.y);
          let top = 0;
          for (const b of here) { expect(b.y, `hole under ${b.id} at ${t}`).toBe(top); top = b.y + b.workers; }
          const expected = data.acts.reduce((s, a) => s + (ref.es[a.id] <= t && t < ref.es[a.id] + a.duration ? (a.workers ?? 1) : 0), 0);
          expect(top).toBe(expected);
          expect(h.profile[t]).toBe(expected);
        }
        expect(h.peak).toBe(Math.max(...h.profile));
        expect(h.peak).toBeGreaterThanOrEqual(3);
        expect(answerText).toContain(`The most needed at once is ${h.peak}`);
        const last = steps[steps.length - 1].histView!;
        expect(new Set(last.blocks)).toEqual(new Set(data.acts.map((a) => a.id)));
        expect(steps[steps.length - 1].runningTotal).toBe(h.peak);
      }
    }, 120_000);
  }
});

describe("CPA — resource levelling (A-level)", () => {
  // INDEPENDENT optimum: every order of the activities that keeps precedence, each placed at the earliest time its predecessors are done and enough workers are free
  const bruteMakespan = (acts: { id: string; duration: number; preds: string[]; workers?: number }[], limit: number): number => {
    const n = acts.length;
    let best = Infinity;
    const placed = new Map<string, number>();
    const use: number[] = new Array(400).fill(0);
    const rec = (count: number) => {
      if (count === n) { best = Math.min(best, Math.max(...acts.map((a) => placed.get(a.id)! + a.duration))); return; }
      for (const a of acts) {
        if (placed.has(a.id) || !a.preds.every((p) => placed.has(p))) continue;
        let s = Math.max(0, ...a.preds.map((p) => placed.get(p)! + acts.find((x) => x.id === p)!.duration));
        const w = a.workers ?? 1;
        for (let u = s; u < s + a.duration; u++) if (use[u] + w > limit) { s = u + 1; u = s - 1; }
        placed.set(a.id, s);
        for (let u = s; u < s + a.duration; u++) use[u] += w;
        rec(count + 1);
        for (let u = s; u < s + a.duration; u++) use[u] -= w;
        placed.delete(a.id);
      }
    };
    rec(0);
    return best;
  };
  for (const [lv, workers, type] of [[2, "one", "within"], [2, "several", "extra"], [3, "one", "chain"]] as const) {
    it(`${type}: the levelled histogram respects the limit and every precedence, and the finish time is the true minimum`, () => {
      for (let i = 0; i < (lv === 3 ? 6 : 10); i++) {
        const { data, steps, answerText } = run(lv as CpaLevel, "cpaLevel", { paths: "one", workers, levelType: type });
        const L = data.extra!.level!;
        const ref = referenceCpa(data.acts);
        const T = ref.projectTime;
        const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
        // schedule validity
        for (const a of data.acts) {
          expect(L.starts[a.id], `${a.id} no earlier than its earliest start`).toBeGreaterThanOrEqual(ref.es[a.id]);
          a.preds.forEach((p) => expect(L.starts[a.id], `${a.id} after ${p}`).toBeGreaterThanOrEqual(L.starts[p] + dur[p]));
        }
        const end = Math.max(...data.acts.map((a) => L.starts[a.id] + a.duration));
        expect(end).toBe(L.newTime);
        const profile = Array.from({ length: end }, (_, t) => data.acts.reduce((s, a) => s + (L.starts[a.id] <= t && t < L.starts[a.id] + a.duration ? (a.workers ?? 1) : 0), 0));
        expect(Math.max(...profile)).toBeLessThanOrEqual(L.limit);
        expect(L.after.profile).toEqual(profile);
        // the unlevelled histogram does exceed the limit (that is the question), and the over ranges are right
        expect(L.before.peak).toBeGreaterThan(L.limit);
        const over = Array.from({ length: T }, (_, t) => (L.before.profile[t] > L.limit ? t : -1)).filter((t) => t >= 0);
        expect(L.over.flatMap((o) => Array.from({ length: o.to - o.from }, (_, k) => o.from + k))).toEqual(over);
        // the type of question
        const readyAt = (a: { preds: string[] }) => Math.max(0, ...a.preds.map((q) => L.starts[q] + dur[q]));
        const delayed = data.acts.filter((a) => L.starts[a.id] > readyAt(a));
        expect(L.delayed.map((d) => d.id)).toEqual(delayed.map((a) => a.id));
        if (type === "within") expect(L.newTime).toBe(T);
        else expect(L.newTime).toBeGreaterThan(T);
        if (type === "chain") expect(delayed.length).toBeGreaterThanOrEqual(2);
        // lower bounds, and (up to nine activities) the independent optimum
        const work = data.acts.reduce((s, a) => s + a.duration * (a.workers ?? 1), 0);
        expect(L.newTime).toBeGreaterThanOrEqual(Math.max(T, Math.ceil(work / L.limit)));
        if (data.acts.length <= 9) expect(L.newTime, "minimum completion time").toBe(bruteMakespan(data.acts, L.limit));
        // the levelled blocks stack with no holes, and the working ends on them
        for (let t = 0; t < end; t++) {
          let top = 0;
          for (const b of L.after.blocks.filter((x) => x.start <= t && t < x.end).sort((x, y) => x.y - y.y)) { expect(b.y).toBe(top); top = b.y + b.workers; }
        }
        expect(answerText).toContain(`${L.newTime} ${data.unit}`);
        const last = steps[steps.length - 1];
        expect(last.runningTotal).toBe(L.newTime);
        expect(new Set(last.histView!.blocks)).toEqual(new Set(data.acts.map((a) => a.id)));
      }
    }, 300_000);
  }
});
