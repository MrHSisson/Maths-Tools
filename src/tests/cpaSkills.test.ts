// ─────────────────────────────────────────────────────────────────────────────
// Critical Path Analysis — the AS skill tabs (specs/cpa-skill-tools.md): table from a network, critical paths, missing time,
// delays and changes, clock times. Each answer is re-derived independently (list every path Start → End; recompute after the change).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { histBaseAt } from "../shared/decision/cpa";
import { cpaTimes, histogramData, generateCpa, referenceCpa, solveCpa, clockTime, depthOf, fullGraph, type CpaKind, type CpaLevel } from "../shared/decision";

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

describe("CPA — resource levelling (A-level)", () => {
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
          for (const b of L.after.blocks.filter((x) => x.start <= t && t < x.end).sort((x, y) => histBaseAt(x, t) - histBaseAt(y, t))) { expect(histBaseAt(b, t)).toBe(top); top = histBaseAt(b, t) + b.workers; }
        }
        expect(answerText).toContain(`${L.newTime} ${data.unit}`);
        const last = steps[steps.length - 1];
        expect(last.runningTotal).toBe(L.newTime);
        expect(new Set(last.histView!.blocks)).toEqual(new Set(data.acts.map((a) => a.id)));
      }
    }, 300_000);
  }
});

describe("CPA — the harder cases (more than one critical path, late start, partly drawn, critical activity held up)", () => {
  it("cascade chart with more than one critical path: first path end to end on the shared row, every other critical activity on its own row", () => {
    for (let i = 0; i < 25; i++) {
      const { data, steps } = run(2, "cpaCascade", { paths: "more", cascade: { start: i % 2 ? "late" : "early", layout: "sequence", style: "blocks" } });
      const c = data.extra!.cascade!;
      const ref = referenceCpa(data.acts);
      expect(ref.criticalPaths.length).toBeGreaterThanOrEqual(2);
      const first = new Set(ref.criticalPaths[0].filter((id) => id !== "Start" && id !== "End"));
      const shared = c.bars.filter((b) => b.row === 0).sort((x, y) => x.start - y.start);
      expect(new Set(shared.map((b) => b.id))).toEqual(first);
      expect(shared[0].start).toBe(0);
      expect(shared[shared.length - 1].end).toBe(c.T);
      shared.slice(1).forEach((b, k) => expect(b.start).toBe(shared[k].end));
      // no two bars on one row other than the shared one; every critical activity is drawn
      const rows = c.bars.filter((b) => b.row !== 0).map((b) => b.row);
      expect(new Set(rows).size).toBe(rows.length);
      c.bars.filter((b) => b.critical && !first.has(b.id)).forEach((b) => expect(b.row).toBeGreaterThan(0));
      expect(new Set(steps[steps.length - 1].ganttView!.bars)).toEqual(new Set(data.acts.map((a) => a.id)));
    }
  });
  it("a partly drawn cascade chart: the given bars are real, the working draws only the rest", () => {
    for (let i = 0; i < 25; i++) {
      const { data, steps } = run(2, "cpaCascade", { paths: "one", partial: true, cascade: { start: "early", layout: "sequence", style: "blocks" } });
      const c = data.extra!.cascade!;
      expect(c.given!.length).toBeGreaterThan(0);
      expect(c.given!.length).toBeLessThan(data.acts.length);
      const missing = data.acts.filter((a) => !c.given!.includes(a.id)).map((a) => a.id);
      expect(missing.length).toBeGreaterThan(0);
      const phases = steps.filter((s) => s.phase?.startsWith("Activity")).length;
      expect(phases).toBe(missing.length);
      expect(new Set(steps[steps.length - 1].ganttView!.bars)).toEqual(new Set(data.acts.map((a) => a.id)));
    }
  });
  it("histogram as late as possible, and with more than one critical path: blocks match the independent reference and stack with no holes", () => {
    for (let i = 0; i < 20; i++) {
      const late = i % 2 === 1;
      const { data } = run(2, "cpaHistogram", { paths: late ? "one" : "more", workers: "several", histStart: late ? "late" : "early" });
      const h = data.extra!.histogram!;
      const ref = referenceCpa(data.acts);
      const first = new Set(ref.criticalPaths[0]);
      for (const b of h.blocks) {
        const a = data.acts.find((x) => x.id === b.id)!;
        expect(b.start).toBe(late ? ref.lf[b.id] - a.duration : ref.es[b.id]);
        if (first.has(b.id)) expect(b.y).toBe(0);
      }
      for (let t = 0; t < ref.projectTime; t++) {
        let top = 0;
        for (const b of h.blocks.filter((x) => x.start <= t && t < x.end).sort((x, y) => histBaseAt(x, t) - histBaseAt(y, t))) { expect(histBaseAt(b, t)).toBe(top); top = histBaseAt(b, t) + b.workers; }
        expect(h.profile[t]).toBe(top);
      }
    }
  }, 120_000);
  it("Level 3 levelling holds up a critical activity at least once", () => {
    for (let i = 0; i < 5; i++) {
      const { data } = run(3, "cpaLevel", { paths: "one", workers: "one", levelType: "chain" });
      const L = data.extra!.level!;
      expect(L.delayed.length).toBeGreaterThanOrEqual(2);
      expect(L.delayed.some((d) => data.times.float[d.id] === 0)).toBe(true);
    }
  }, 300_000);
});

describe("CPA — stepped blocks (a block that jumps up or down where the stack under it changes)", () => {
  // independent check from the blocks' own bottom edges: no overlaps, no holes, the profile is the workers needed
  const check = (blocks: { id: string; start: number; end: number; workers: number; y: number; base?: number[] }[], T: number, profile: number[], expectProfile: number[]) => {
    const baseAt = (b: (typeof blocks)[number], t: number) => (b.base ? b.base[t - b.start] : b.y);
    for (let t = 0; t < T; t++) {
      const here = blocks.filter((b) => b.start <= t && t < b.end).sort((x, y) => baseAt(x, t) - baseAt(y, t));
      let top = 0;
      for (const b of here) { expect(baseAt(b, t), `${b.id} at ${t}`).toBe(top); top = baseAt(b, t) + b.workers; }
      expect(top).toBe(expectProfile[t]);
      expect(profile[t]).toBe(expectProfile[t]);
    }
  };
  it("a hand-built case: critical row goes 2 then 3 workers, a block over both steps up and is still 1 high", () => {
    const acts = [
      { id: "A", duration: 4, preds: [], workers: 2 },
      { id: "B", duration: 4, preds: ["A"], workers: 3 },
      { id: "C", duration: 6, preds: [], workers: 1 },
    ];
    const t = cpaTimes(acts);
    expect(t.projectTime).toBe(8);
    const h = histogramData(acts, t, "early", "step")!;
    const c = h.blocks.find((b) => b.id === "C")!;
    expect(c.base).toEqual([2, 2, 2, 2, 3, 3]); // steps up from 2 to 3 where A gives way to B
    check(h.blocks, h.T, h.profile, [3, 3, 3, 3, 4, 4, 3, 3]);
    expect(histogramData(acts, t, "early", "whole")).toBeNull(); // a plain rectangle cannot sit with no hole
  });
  for (const shape of ["step", "jump"] as const) {
    it(`generated histograms (${shape}) stack with no holes, profile = workers needed${shape === "jump" ? ", and have a stepped block" : ""}`, () => {
      for (let i = 0; i < 15; i++) {
        const { data, steps } = run((i % 2 ? 2 : 3) as CpaLevel, "cpaHistogram", { paths: "one", workers: i % 2 ? "several" : "one", histShape: shape });
        const h = data.extra!.histogram!;
        const ref = referenceCpa(data.acts);
        const expected = Array.from({ length: ref.projectTime }, (_, t) => data.acts.reduce((s, a) => s + (ref.es[a.id] <= t && t < ref.es[a.id] + a.duration ? (a.workers ?? 1) : 0), 0));
        check(h.blocks, h.T, h.profile, expected);
        h.blocks.forEach((b) => { if (b.base) expect(b.base.length).toBe(b.end - b.start); });
        if (shape === "jump") expect(h.blocks.some((b) => b.base && b.base.some((v) => v !== b.base![0]))).toBe(true);
        const stepped = h.blocks.filter((b) => b.base && b.base.some((v) => v !== b.base![0])).map((b) => b.id);
        stepped.forEach((id) => expect(steps.some((s) => s.phase === `Activity ${id}` && /drawn in pieces/.test(s.caption)), `step explained for ${id}`).toBe(true));
      }
    }, 300_000);
  }
  it("stepped levelled histograms respect the limit and stack with no holes", () => {
    for (let i = 0; i < 8; i++) {
      const { data } = run(2, "cpaLevel", { paths: "one", workers: "several", levelType: "extra", histShape: "step" });
      const L = data.extra!.level!;
      check(L.after.blocks, L.after.T, L.after.profile, L.after.profile);
      expect(Math.max(...L.after.profile)).toBeLessThanOrEqual(L.limit);
    }
  }, 300_000);
});

describe("CPA — histogram, 10–12 activities with one to three workers each", () => {
  it("stacks with no holes (stepped blocks) and the profile is the workers needed", () => {
    for (let i = 0; i < 12; i++) {
      const { data } = run(3, "cpaHistogram", { paths: "one", workers: "several", histShape: "step" });
      expect(data.acts.length).toBeGreaterThanOrEqual(10);
      const h = data.extra!.histogram!;
      const ref = referenceCpa(data.acts);
      const baseAt = (b: (typeof h.blocks)[number], t: number) => (b.base ? b.base[t - b.start] : b.y);
      for (let t = 0; t < ref.projectTime; t++) {
        let top = 0;
        for (const b of h.blocks.filter((x) => x.start <= t && t < x.end).sort((x, y) => baseAt(x, t) - baseAt(y, t))) { expect(baseAt(b, t)).toBe(top); top = baseAt(b, t) + b.workers; }
        expect(top).toBe(data.acts.reduce((s, a) => s + (ref.es[a.id] <= t && t < ref.es[a.id] + a.duration ? (a.workers ?? 1) : 0), 0));
      }
    }
  }, 120_000);
});

describe("CPA — worker allocation (A-level)", () => {
  for (const [lv, kind] of [[2, "min"], [2, "fixed"], [3, "min"], [3, "fixed"]] as const) {
    it(`${lv === 3 ? "10–12" : "8–9"} activities, ${kind === "min" ? "smallest team for the minimum time" : "a fixed team"}: a valid allocation, and the team / time is the true optimum`, () => {
      for (let i = 0; i < (lv === 3 ? 4 : 10); i++) {
        const { data, steps, answerText } = run(lv as CpaLevel, "cpaAlloc", { paths: "one", allocKind: kind });
        const A = data.extra!.alloc!;
        const ref = referenceCpa(data.acts);
        const T = ref.projectTime;
        const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
        expect(data.acts.every((a) => (a.workers ?? 1) === 1)).toBe(true);
        // every activity has exactly one worker, and nobody does two things at once
        expect(Object.keys(A.alloc).sort()).toEqual(data.acts.map((a) => a.id).sort());
        for (let w = 0; w < A.workers; w++) {
          const mine = data.acts.filter((a) => A.alloc[a.id] === w).sort((x, y) => A.starts[x.id] - A.starts[y.id]);
          mine.slice(1).forEach((a, k) => expect(A.starts[a.id], `Worker ${w + 1} overlaps`).toBeGreaterThanOrEqual(A.starts[mine[k].id] + dur[mine[k].id]));
        }
        expect(Math.max(...Object.values(A.alloc))).toBeLessThan(A.workers);
        // precedence and finish time
        for (const a of data.acts) { expect(A.starts[a.id]).toBeGreaterThanOrEqual(ref.es[a.id]); a.preds.forEach((p) => expect(A.starts[a.id]).toBeGreaterThanOrEqual(A.starts[p] + dur[p])); }
        const end = Math.max(...data.acts.map((a) => A.starts[a.id] + dur[a.id]));
        expect(end).toBe(A.newTime);
        if (data.acts.length <= 9) {
          if (kind === "min") {
            expect(A.newTime).toBe(T);
            expect(bruteMakespan(data.acts, A.workers), "the team reaches the minimum time").toBe(T);
            expect(bruteMakespan(data.acts, A.workers - 1), "one fewer worker cannot").toBeGreaterThan(T);
            expect(A.withFewer).toBe(bruteMakespan(data.acts, A.workers - 1));
          } else {
            expect(A.newTime).toBe(bruteMakespan(data.acts, A.workers));
            expect(A.newTime).toBeGreaterThan(T);
          }
        }
        if (kind === "min") {
          expect(A.newTime).toBe(T);
          // the critical path is on Worker 1
          ref.criticalPaths[0].filter((id) => id !== "Start" && id !== "End").forEach((id) => expect(A.alloc[id]).toBe(0));
        }
        // the chart has a row per worker and the working draws every activity
        expect(A.chart.rowLabels.length).toBe(A.workers);
        expect(answerText).toContain(kind === "min" ? `${A.workers} workers` : `${A.newTime} ${data.unit}`);
        expect(new Set(steps[steps.length - 1].ganttView!.bars)).toEqual(new Set(data.acts.map((a) => a.id)));
      }
    }, 300_000);
  }
});

describe("CPA — which activity to shorten (A-level)", () => {
  for (const [lv, shape, paths] of [[2, "simple", "one"], [2, "two", "more"], [3, "trap", "one"]] as const) {
    it(`${shape}: every result matches an independent recomputation, and the best activity is unique`, () => {
      for (let i = 0; i < (lv === 3 ? 10 : 20); i++) {
        const { data, steps, answerText } = run(lv as CpaLevel, "cpaShorten", { paths, shortenCase: shape });
        const S = data.extra!.shorten!;
        const ref = referenceCpa(data.acts);
        const T = ref.projectTime;
        const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
        expect(S.results.map((r) => r.id)).toEqual(data.acts.filter((a) => a.duration > S.to).map((a) => a.id));
        for (const r of S.results) {
          const nT = referenceCpa(data.acts.map((a) => (a.id === r.id ? { ...a, duration: S.to } : a))).projectTime;
          expect(r.newTime, `reduce ${r.id}`).toBe(nT);
          expect(r.saving).toBe(T - nT);
          expect(r.critical).toBe(ref.criticalSet.has(r.id));
          if (!r.critical) expect(r.saving, "a non-critical activity saves nothing").toBe(0);
          expect(r.saving).toBeLessThanOrEqual(dur[r.id] - S.to);
        }
        // unique best among critical activities, and nothing else beats it
        const min = Math.min(...S.results.map((r) => r.newTime));
        expect(S.bestTime).toBe(min);
        expect(S.results.filter((r) => r.newTime === min).map((r) => r.id)).toEqual([S.best]);
        expect(S.nextBest).toBe(Math.min(...S.results.filter((r) => r.id !== S.best).map((r) => r.newTime), T));
        expect(S.bestTime).toBeLessThan(T);
        // the case
        const crit = S.results.filter((r) => r.critical).sort((a, b) => dur[b.id] - dur[a.id]);
        if (shape === "simple") { expect(S.best).toBe(crit[0].id); expect(ref.criticalPaths.length).toBe(1); }
        if (shape === "two") { expect(ref.criticalPaths.length).toBeGreaterThanOrEqual(2); expect(crit.some((r) => r.saving === 0)).toBe(true); expect(crit.find((r) => r.id === S.best)!.saving).toBeGreaterThan(0); }
        if (shape === "trap") { expect(ref.criticalPaths.length).toBe(1); expect(S.best).not.toBe(crit[0].id); }
        expect(answerText).toContain(`Reduce ${S.best}`);
        expect(steps[steps.length - 1].runningTotal).toBe(S.bestTime);
        // the working tries every critical activity once
        expect(steps.filter((s) => s.phase?.startsWith("Reduce ")).length).toBe(crit.length);
      }
    }, 300_000);
  }
});

describe("CPA — delays and changes, level 3 (a delay given as a range, an activity removed) and questions about named activities", () => {
  it("range: the threshold is the float and the worst case matches an independent recomputation", () => {
    for (let i = 0; i < 40; i++) {
      const { data, steps, answerText } = run(2, "cpaChange", { changeCase: "range" });
      const c = data.extra!.change!;
      const T = referenceCpa(data.acts).projectTime;
      expect(c.mode).toBe("range");
      expect(c.amount).toBeGreaterThan(c.float);
      expect(c.float).toBe(referenceCpa(data.acts).lf[c.id] - referenceCpa(data.acts).es[c.id] - data.acts.find((a) => a.id === c.id)!.duration);
      expect(referenceCpa(c.newActs).projectTime).toBe(T + c.amount - c.float); // worst case
      // a delay of exactly the float changes nothing
      const atFloat = data.acts.map((a) => (a.id === c.id ? { ...a, duration: a.duration + c.float } : a));
      expect(referenceCpa(atFloat).projectTime).toBe(T);
      // one more than the float adds one
      const over = data.acts.map((a) => (a.id === c.id ? { ...a, duration: a.duration + c.float + 1 } : a));
      expect(referenceCpa(over).projectTime).toBe(T + 1);
      expect(answerText).toContain(`${c.amount - c.float}`);
      expect(steps[steps.length - 1].runningTotal).toBe(T + c.amount - c.float);
    }
  });
  it("remove: the activity takes 0 time and the new minimum time matches an independent recomputation", () => {
    for (let i = 0; i < 40; i++) {
      const { data, steps } = run(2, "cpaChange", { changeCase: "remove" });
      const c = data.extra!.change!;
      const ref = referenceCpa(data.acts);
      expect(c.mode).toBe("remove");
      expect(ref.criticalSet.has(c.id)).toBe(true);
      expect(c.newActs.find((a) => a.id === c.id)!.duration).toBe(0);
      const nT = referenceCpa(c.newActs).projectTime;
      expect(nT).toBeLessThan(ref.projectTime);
      expect(steps[steps.length - 1].runningTotal).toBe(nT);
    }
  });
  it("named activities: they come after the changed one, and their stated times are the recalculated ones", () => {
    for (let i = 0; i < 60; i++) {
      const mode = (["delay", "shorten", "remove"] as const)[i % 3];
      const { data, answerText, prompt } = run(2, "cpaChange", { changeCase: mode, changeAsk: "boxes" });
      const c = data.extra!.change!;
      const named = c.named!;
      expect(named.length).toBeGreaterThanOrEqual(2);
      expect(named.length).toBeLessThanOrEqual(3);
      const ref = referenceCpa(data.acts), nref = referenceCpa(c.newActs);
      // each named activity is a descendant of the changed one
      const reach = (from: string, target: string): boolean => data.acts.filter((a) => a.preds.includes(from)).some((a) => a.id === target || reach(a.id, target));
      for (const q of named) {
        expect(reach(c.id, q), `${q} after ${c.id}`).toBe(true);
        const esTxt = nref.es[q] === ref.es[q] ? `earliest start unchanged (${ref.es[q]})` : `earliest start ${ref.es[q]} → ${nref.es[q]}`;
        const lfTxt = nref.lf[q] === ref.lf[q] ? `latest finish unchanged (${ref.lf[q]})` : `latest finish ${ref.lf[q]} → ${nref.lf[q]}`;
        expect(answerText).toContain(`${q}: ${esTxt}, ${lfTxt}`);
      }
      expect(prompt).toContain("earliest start time and latest finish time of activities");
    }
  });
});

describe("CPA — clock times level 2 (a second project timed in seconds) and which activity must start first", () => {
  it("the second project's durations convert correctly and the latest start is the main finish minus its total", () => {
    for (let i = 0; i < 40; i++) {
      const { data, answerText, steps } = run(2, "cpaContext", { clockSecond: true });
      const clk = data.extra!.clock!;
      const sec = clk.second!;
      const T = referenceCpa(data.acts).projectTime;
      expect(sec.parts).toHaveLength(3);
      sec.parts.forEach((x) => expect(x.mins).toBeGreaterThan(0));
      // each job's minutes = its stated minutes + seconds ÷ 60
      expect(sec.parts[2].mins).toBe(sec.parts[2].secs / 60);
      expect(Number.isInteger(sec.total)).toBe(true);
      expect(sec.total).toBeLessThan(T);
      const stated = sec.parts.map((x) => x.text.match(/(\d+) minutes/)).map((m) => (m ? Number(m[1]) : 0));
      sec.parts.forEach((x, k) => expect(x.mins).toBeCloseTo(stated[k] + x.secs / 60, 10));
      expect(answerText).toContain(`Finish at ${clockTime(clk.startMins + T)}`);
      expect(answerText).toContain(`Latest start ${clockTime(clk.startMins + T - sec.total)}`);
      expect(steps[steps.length - 1].caption).toContain(clockTime(clk.startMins + T - sec.total));
    }
  });
  it("which must start first: exactly one source activity is critical and the working names it", () => {
    for (let i = 0; i < 40; i++) {
      const { data, answerText, steps } = run(2, "cpaPaths", { paths: "one", pathsAsk: "first" });
      const f = data.extra!.first!;
      const ref = referenceCpa(data.acts);
      expect(f.sources.length).toBeGreaterThanOrEqual(2);
      expect(f.sources.filter((id) => ref.criticalSet.has(id))).toEqual([f.answer]);
      f.sources.forEach((id) => expect(f.floats[id]).toBe(ref.lf[id] - ref.es[id] - data.acts.find((a) => a.id === id)!.duration));
      expect(answerText.startsWith(`${f.answer}:`)).toBe(true);
      expect(steps[steps.length - 1].caption).toContain(f.answer);
    }
  });
});

describe("CPA — missing time level 2 (a missing value in a box) and multiple choice", () => {
  it("the missing earliest start / latest finish matches an independent reference; four options with the right one once", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const { data, answerText, prompt, steps } = run(2, "cpaUnknown", { paths: "one", unknownBox: true, unknownChoice: true });
      const u = data.extra!.unknown!;
      const b = u.box!;
      seen.add(b.cell);
      const ref = referenceCpa(data.acts);
      expect(u.x).toBe(b.cell === "es" ? ref.es[b.id] : ref.lf[b.id]);
      expect(answerText).toBe(`x = ${u.x}`);
      expect(u.choices).toHaveLength(4);
      expect(new Set(u.choices).size).toBe(4);
      expect(u.choices!.filter((v) => v === u.x)).toHaveLength(1);
      expect(prompt).toContain(`Circle your answer: ${u.choices!.join("   ")}`);
      // the hidden value is never drawn in the question view; the last beat shows it
      expect(steps[steps.length - 1].runningTotal).toBe(u.x);
      expect(steps[steps.length - 1].caption).toContain(`x = ${u.x}`);
      // a wrong option is never the right value
      b.wrong.forEach((w) => expect(Number(w)).not.toBe(u.x));
    }
    expect(seen.has("es") && seen.has("lf")).toBe(true);
  });
  it("the on-critical-path form can also be multiple choice", () => {
    for (let i = 0; i < 40; i++) {
      const { data } = run(1, "cpaUnknown", { paths: "one", unknownWhere: "on", unknownChoice: true });
      const u = data.extra!.unknown!;
      expect(u.choices).toHaveLength(4);
      expect(u.choices!.filter((v) => v === u.x)).toHaveLength(1);
      expect(new Set(u.choices).size).toBe(4);
      u.choices!.forEach((v) => expect(v).toBeGreaterThan(0));
    }
  });
});

describe("CPA — resource levelling: choose the correct histogram (A-level)", () => {
  it("exactly one option obeys the limit and every precedence; the others break one rule each", () => {
    for (let i = 0; i < 25; i++) {
      const { data, steps, answerText } = run(2, "cpaLevel", { paths: "one", workers: i % 2 ? "several" : "one", levelType: "extra", levelAsk: "choose" });
      const L = data.extra!.level!;
      const ch = L.choices!;
      expect(ch.map((c) => c.label)).toEqual(["A", "B", "C"]);
      const dur = Object.fromEntries(data.acts.map((a) => [a.id, a.duration]));
      const verdicts = ch.map((c) => {
        const st = Object.fromEntries(c.data.blocks.map((b) => [b.id, b.start]));
        const within = c.data.profile.every((v) => v <= L.limit);
        const precedence = data.acts.every((a) => a.preds.every((q) => st[a.id] >= st[q] + dur[q]));
        return { c, within, precedence };
      });
      // independent classification matches the stated fault
      for (const v of verdicts) {
        if (v.c.fault === "none") { expect(v.within && v.precedence).toBe(true); expect(v.c.data.T).toBe(L.newTime); }
        if (v.c.fault === "limit") { expect(v.within).toBe(false); expect(v.precedence).toBe(true); }
        if (v.c.fault === "precedence") { expect(v.within).toBe(true); expect(v.precedence).toBe(false); expect(v.c.data.T).toBeLessThan(L.newTime); }
        expect(v.c.note.length > 0).toBe(v.c.fault !== "none");
      }
      expect(verdicts.filter((v) => v.within && v.precedence)).toHaveLength(1);
      expect(ch.map((c) => c.fault).sort()).toEqual(["limit", "none", "precedence"]);
      // every option's blocks stack with no holes
      for (const c of ch) for (let t = 0; t < c.data.T; t++) {
        const here = c.data.blocks.filter((b) => b.start <= t && t < b.end);
        const baseAt = (b: (typeof here)[number]) => (b.base ? b.base[t - b.start] : b.y);
        let top = 0;
        for (const b of here.sort((x, y) => baseAt(x) - baseAt(y))) { expect(baseAt(b)).toBe(top); top += b.workers; }
      }
      const right = ch.find((c) => c.fault === "none")!;
      expect(answerText.startsWith(`Option ${right.label}.`)).toBe(true);
      expect(steps.length).toBe(ch.length + 2);
    }
  }, 300_000);
});

describe("CPA — explain and justify (written reasoning, marked against mark points)", () => {
  it("range and remove: the evidence matches the independent recomputation, and the marks and model answer follow the working", () => {
    for (const rc of ["range", "remove"] as const) for (let i = 0; i < 25; i++) {
      const { data, steps, answerText } = run(2, "cpaReason", { reasonCase: rc });
      const r = data.extra!.reason!;
      const c = data.extra!.change!;
      expect(r.type).toBe(rc);
      expect(r.marks).toHaveLength(2);
      const T = referenceCpa(data.acts).projectTime;
      const nT = referenceCpa(c.newActs).projectTime;
      if (rc === "range") {
        expect(nT).toBe(T + c.amount - c.float);
        expect(r.marks[0].text).toContain(`${c.float}`);
        expect(answerText).toContain(`${c.amount - c.float}`);
      } else {
        expect(nT).toBeLessThan(T);
        expect(c.newActs.find((a) => a.id === c.id)!.duration).toBe(0);
        expect(r.marks[1].text).toContain(`${T - nT}`);
      }
      expect(steps[steps.length - 2].phase).toMatch(/^Mark scheme \(2 marks\)/);
      expect(steps[steps.length - 1].phase).toBe("A model answer");
    }
  });
  it("claim: the verdict follows from the minimum time", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const { data, answerText, prompt, steps } = run(2, "cpaReason", { reasonCase: "claim", paths: "one" });
      const r = data.extra!.reason!;
      const T = referenceCpa(data.acts).projectTime;
      const c = r.claim!;
      expect(c.time).toBeLessThanOrEqual(T);
      expect(prompt).toContain(`${c.time} ${data.unit}`);
      if (c.time === T) { seen.add("equal"); expect(answerText).toContain("appears to be valid"); expect(answerText).toMatch(/not enough workers|workers/); }
      else { seen.add("less"); expect(answerText).toContain("not valid"); expect(answerText).toContain(`${T} ${data.unit}`); }
      expect(r.marks.every((m) => m.code === "E1")).toBe(true);
      expect(steps[0].runningTotal).toBe(T);
    }
    expect(seen.size).toBe(2);
  });
  it("Glyn's claim: more than one critical path, the sum of the critical durations really differs from the minimum time", () => {
    for (let i = 0; i < 40; i++) {
      const { data, answerText } = run(2, "cpaReason", { reasonCase: "glyn", paths: "more" });
      const r = data.extra!.reason!;
      const ref = referenceCpa(data.acts);
      expect(ref.criticalPaths.length).toBeGreaterThanOrEqual(2);
      const sum = data.acts.filter((a) => ref.criticalSet.has(a.id)).reduce((s, a) => s + a.duration, 0);
      expect(r.sumCritical).toBe(sum);
      expect(sum).toBeGreaterThan(ref.projectTime);
      expect(answerText).toContain(`${sum}`);
      expect(answerText).toContain("single critical path");
    }
  });
  it("limit: a limitation and its effect earn B1 and E1; every family is offered", () => {
    for (let i = 0; i < 20; i++) {
      const { data, steps } = run(2, "cpaReason", { reasonCase: "limit" });
      const r = data.extra!.reason!;
      expect(r.marks.map((m) => m.code)).toEqual(["B1", "E1"]);
      expect(r.limits).toHaveLength(4);
      expect(r.model).toHaveLength(2);
      expect(steps[steps.length - 1].runningTotal).toBe(2);
    }
  });
});
