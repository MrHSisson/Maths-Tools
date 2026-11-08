// Resource levelling — the method of specs/resource-levelling.md against the ground-truth solver, the real exam questions and generated questions.
import { describe, expect, it } from "vitest";
import { withSeededRandom } from "./seededRandom";
import fixture from "./fixtures/levelling-real.json";
import { countClashes, cpaTimes, generateCpa, levelMethod, levelSchedule, solveCpa, histBaseAt, type CpaActivity } from "../shared/decision";

const toActs = (q: (typeof fixture.questions)[number]): CpaActivity[] => q.activities.map((a) => ({ id: a.id, duration: a.duration, workers: a.workers, preds: a.after }));
const profileOf = (acts: CpaActivity[], st: Record<string, number>): number[] => {
  const end = Math.max(...acts.map((a) => st[a.id] + a.duration));
  return Array.from({ length: end }, (_, t) => acts.reduce((s, a) => s + (st[a.id] <= t && t < st[a.id] + a.duration ? (a.workers ?? 1) : 0), 0));
};

describe("levelling — the real exam questions", () => {
  for (const q of fixture.questions) {
    it(`${q.source} ${q.question}: the solver gives ${q.minimumTime}${q.fits.startsWith("levelling") ? " and so does the method" : ""}`, () => {
      const acts = toActs(q);
      const times = cpaTimes(acts);
      expect(times.projectTime).toBe(q.unlimitedTime);
      const sch = levelSchedule(acts, times, q.limit);
      expect(sch?.makespan).toBe(q.minimumTime);
      const early = Object.fromEntries(acts.map((a) => [a.id, times.es[a.id]]));
      const prof = profileOf(acts, early);
      expect(Math.max(...prof) - q.limit).toBe(q.peakOverLimit);
      expect(countClashes(prof, q.limit)).toBe(q.clashes);
      // heavy-task queues (most tasks need over half the workers) are left out of the levels by the tries cap: the method needs far more than the
      // most any level allows (8), so none can be generated. (A rule on the share of heavy tasks would wrongly drop Legacy Q11, a Level 3 question.)
      if (q.fits.startsWith("beyond caps")) {
        const m = levelMethod(acts, times, q.limit, 5000);
        expect(m === null || m.tries.length > 8, `${q.question} needs ${m?.tries.length} tries`).toBe(true);
      }
      if (q.fits.startsWith("levelling")) {
        const m = levelMethod(acts, times, q.limit)!;
        expect(m.minimum).toBe(q.minimumTime);
        expect(m.exact).toBe(true);
      }
    });
  }
});

describe("levelling — the method against the solver on random networks", () => {
  it("finds the true minimum, never finishes a try below its quick sum, and a clash-free try finishes exactly on it", () => {
    withSeededRandom(20261107, () => {
      let checked = 0;
      for (let i = 0; i < 120; i++) {
        const { data } = generateCpa(2, "cpaHistogram", { workers: "several" });
        const acts = data.acts, times = data.times;
        const early = Object.fromEntries(acts.map((a) => [a.id, times.es[a.id]]));
        const prof = profileOf(acts, early);
        const maxW = Math.max(...acts.map((a) => a.workers ?? 1));
        for (let limit = Math.max(maxW, 2); limit < Math.max(...prof); limit++) {
          const truth = levelSchedule(acts, times, limit);
          const m = levelMethod(acts, times, limit, 5000);
          if (!truth) continue;
          expect(m, `limit ${limit}`).not.toBeNull();
          expect(m!.minimum, `limit ${limit}: ${JSON.stringify(acts)}`).toBe(truth.makespan);
          expect(Math.max(...profileOf(acts, m!.starts))).toBeLessThanOrEqual(limit);
          for (const t of m!.tries) {
            expect(t.finish).toBeGreaterThanOrEqual(t.option.quick);
            if (!t.clash) expect(t.finish).toBe(t.option.quick);
          }
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(100);
    });
  }, 120_000);
});

describe("levelling — generated questions meet their level", () => {
  const cases: { lvl: 1 | 2 | 3; workers?: "one" | "several" | "mixed"; cap?: number }[] = [
    { lvl: 1 }, { lvl: 2 }, { lvl: 3, workers: "one", cap: 8 }, { lvl: 3, workers: "several", cap: 5 }, { lvl: 3, workers: "mixed", cap: 3 }, { lvl: 3, workers: "one", cap: 3 },
  ];
  for (const c of cases) {
    it(`Level ${c.lvl}${c.lvl === 3 ? `, ${c.workers} workers, at most ${c.cap} tries` : ""}`, () => {
      withSeededRandom(1107 + c.lvl, () => {
        for (let i = 0; i < 8; i++) {
          const wording = (["time", "extra", "startLast", "explain"] as const)[i % 4];
          const { data, answerText, prompt } = generateCpa(c.lvl === 1 ? 2 : c.lvl, "cpaLevel", { paths: "one", levelLevel: c.lvl, levelWorkers: c.workers, levelMaxTries: c.cap, levelWording: wording, singleEnd: wording === "startLast" && c.lvl < 3, histShape: "step" });
          const L = data.extra!.level!, m = L.method!;
          const acts = data.acts, times = data.times, T = times.projectTime;
          expect(m.minimum).toBe(levelSchedule(acts, times, L.limit)!.makespan);
          expect(m.exact).toBe(true);
          expect(L.newTime).toBe(m.minimum);
          expect(m.minimum).toBeGreaterThan(T);
          expect(m.clashes).toBeLessThanOrEqual(2);
          expect(L.before.peak).toBeLessThanOrEqual(L.limit + 2);
          expect(L.before.peak).toBeGreaterThan(L.limit);
          expect(L.limit).toBeGreaterThanOrEqual(Math.max(...acts.map((a) => a.workers ?? 1)));
          const ws = acts.map((a) => a.workers ?? 1);
          if (c.lvl === 1) expect(ws.every((w) => w === 1)).toBe(true);
          if (c.lvl === 2) expect(Math.max(...ws)).toBeGreaterThanOrEqual(3);
          if (c.workers === "one") expect(ws.every((w) => w === 1)).toBe(true);
          if (c.workers === "several") expect(Math.min(...ws)).toBeGreaterThanOrEqual(2);
          if (c.lvl < 3) expect(m.tries.length).toBe(1);
          else { expect(m.tries.length).toBeGreaterThanOrEqual(2); expect(m.tries.length).toBeLessThanOrEqual(c.cap!); }
          // the top option of the first list is the first try, and the ranked list is smallest first
          expect(m.tries[0].option.held).toBe(m.options[0].held);
          m.options.forEach((o, k) => k && expect(o.quick).toBeGreaterThanOrEqual(m.options[k - 1].quick));
          for (const t of m.tries) { expect(t.finish).toBeGreaterThanOrEqual(t.option.quick); if (!t.clash) expect(t.finish).toBe(t.option.quick); }
          // the answer asks only for unique values and names its delays as one valid way
          expect(answerText).toContain(`${m.minimum} ${data.unit}`);
          expect(answerText).toContain("One valid way");
          const sinks = acts.filter((a) => !acts.some((b) => b.preds.includes(a.id)));
          if (wording === "startLast" && sinks.length === 1) {
            expect(m.starts[sinks[0].id] + sinks[0].duration).toBe(m.minimum);
            expect(prompt).toContain(`activity ${sinks[0].id}`);
          }
          expect(prompt).not.toMatch(/tick|Tick/);
        }
      });
    }, 240_000);
  }
});

describe("levelling — the walkthrough follows the method", () => {
  it("six kinds of step, one per try, knock-on steps between tries, and a levelled picture at the end", () => {
    withSeededRandom(77, () => {
      for (const lvl of [1, 2, 3, 3, 3] as const) {
        const g = generateCpa(lvl === 1 ? 2 : lvl, "cpaLevel", { paths: "one", levelLevel: lvl, levelWording: (["time", "extra", "explain"] as const)[lvl % 3], histShape: "step" });
        const L = g.data.extra!.level!, m = L.method!;
        const steps = solveCpa({ network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind: "cpaLevel" } as never);
        const phases = steps.map((s) => s.phase!);
        expect(phases.slice(0, 3)).toEqual(["The histogram", "The first clash", "Quick sums"]);
        expect(phases[phases.length - 2]).toBe("The check");
        expect(phases[phases.length - 1]).toBe("Final answer");
        expect(steps.filter((s) => s.phase!.startsWith("Try ")).length).toBe(m.tries.length);
        expect(steps.filter((s) => s.phase!.startsWith("Clash left")).length).toBe(m.tries.length - 1);
        if (lvl < 3) expect(steps.length).toBe(6);
        // the quick-sum table is smallest first with the tried option on top
        const q = steps[2].histView!.quick!;
        expect(q.rows[0].tone).toBe("top");
        expect(q.rows[0].cells[0]).toBe(m.tries[0].option.held);
        // each try picture is that try's own, hole-free, and shows the held block ghosted
        steps.filter((s) => s.phase!.startsWith("Try ")).forEach((s, k) => {
          expect(s.histView!.which).toBe("try");
          expect(s.histView!.tryIndex).toBe(k);
          expect(s.histView!.ghost!.id).toBe(m.tries[k].option.held);
          const h = L.tryHist![k];
          for (let x = 0; x < h.T; x++) {
            let top = 0;
            for (const b of h.blocks.filter((y) => y.start <= x && x < y.end).sort((a, c) => histBaseAt(a, x) - histBaseAt(c, x))) { expect(histBaseAt(b, x)).toBe(top); top = histBaseAt(b, x) + b.workers; }
          }
          expect(h.T).toBe(m.tries[k].finish);
        });
        // the last try is clash-free and the answer text carries the finish
        expect(steps[steps.length - 1].list!.items[steps[steps.length - 1].list!.items.length - 1].text).toContain("The new minimum completion time is");
        expect(steps[steps.length - 1].histView!.which).toBe("after");
        expect(steps[steps.length - 1].list!.items.length).toBe(m.tries.length + 4);
      }
    });
  }, 120_000);
});

describe("drawing rule — critical activities on the bottom, then longest first, no holes", () => {
  type B = { id: string; start: number; end: number; workers: number; y: number; base?: number[]; critical: boolean };
  const check = (blocks: B[], T: number) => {
    for (let t = 0; t < T; t++) {
      const here = blocks.filter((b) => b.start <= t && t < b.end).sort((a, c) => histBaseAt(a, t) - histBaseAt(c, t));
      let top = 0;
      here.forEach((b, i) => {
        expect(histBaseAt(b, t), `${b.id} at ${t}: no hole, no overhang`).toBe(top);
        top += b.workers;
        const below = here[i - 1];
        if (below && !b.critical) expect(below.critical || below.end - below.start >= b.end - b.start, `${b.id} (shorter) above ${below.id} at ${t}`).toBe(true);
        if (below && b.critical) expect(below.critical, `critical ${b.id} sits above a non-critical block`).toBe(true);
      });
    }
  };
  it("the drawn levelled histograms (every try and the final one) and the earliest-start histograms follow it", () => {
    withSeededRandom(31, () => {
      for (let i = 0; i < 6; i++) {
        const g = generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, histShape: "step" });
        const L = g.data.extra!.level!;
        check(L.after.blocks, L.after.T);
        L.tryHist!.forEach((h) => check(h.blocks, h.T));
      }
      for (let i = 0; i < 6; i++) {
        const h = generateCpa(3, "cpaHistogram", { paths: "one", workers: "several", histShape: "step" }).data.extra!.histogram!;
        check(h.blocks, h.T);
      }
    });
  }, 120_000);
});

describe("resource histogram, Level 3 — cut the peak within the float", () => {
  const cases = [
    { w: "one", ask: "fewest", start: "early" }, { w: "several", ask: "show", start: "early" }, { w: "mixed", ask: "canFewer", start: "late" }, { w: "one", ask: "fewest", start: "late" },
  ] as const;
  for (const c of cases) {
    it(`${c.w} workers, ${c.ask}, ${c.start} start: the fewest is true, at most two activities move, the project time is unchanged, the floor proves it`, () => {
      withSeededRandom(404, () => {
        for (let i = 0; i < 5; i++) {
          const g = generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histWorkers: c.w, histCut: c.ask, histStart: c.start });
          const cut = g.data.extra!.cut!, acts = g.data.acts, times = g.data.times, T = times.projectTime;
          const final = cut.states[cut.states.length - 1];
          // the answer is the true least: the solver can do it with `best` and not with one fewer
          expect(levelSchedule(acts, times, cut.best)?.makespan).toBe(T);
          if (cut.best > Math.max(...acts.map((a) => a.workers ?? 1))) expect(levelSchedule(acts, times, cut.best - 1)?.makespan ?? Infinity).toBeGreaterThan(T);
          expect(final.peak).toBe(cut.best);
          expect(cut.states[0].peak).toBeGreaterThan(cut.best);
          // every move stays inside the float, so nothing finishes after the minimum time, and precedence holds
          const start = Object.fromEntries(final.blocks.map((b) => [b.id, b.start]));
          for (const a of acts) {
            expect(start[a.id]).toBeGreaterThanOrEqual(times.es[a.id]);
            expect(start[a.id] + a.duration).toBeLessThanOrEqual(times.lf[a.id]);
            a.preds.forEach((q) => expect(start[a.id]).toBeGreaterThanOrEqual(start[q] + acts.find((x) => x.id === q)!.duration));
          }
          expect(final.T).toBe(T);
          expect(cut.moves.length).toBeLessThanOrEqual(2);
          expect(cut.moves.length).toBeGreaterThan(0);
          // one state per move, each a step further from the question's histogram
          expect(cut.states.length).toBe(cut.moves.length + 1);
          // the floor, when given, equals the answer (so nothing fewer is possible)
          if (cut.floor) expect(cut.floor.value).toBe(cut.best);
          if (cut.ask !== "show") expect(cut.floor).not.toBeNull();
          expect(cut.target).toBe(cut.ask === "canFewer" ? cut.best - 1 : cut.best);
          // the walkthrough: peak, what can slide, a step per move, the check, (why), the answer
          const steps = solveCpa({ network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind: "cpaHistogram" } as never);
          expect(steps.map((s) => s.phase).slice(0, 2)).toEqual(["The peak", "What can slide"]);
          expect(steps.filter((s) => s.phase!.startsWith("Slide") || s.phase!.startsWith("Knock-on")).length).toBe(cut.moves.length);
          expect(steps[steps.length - 1].phase).toBe("Answer");
          expect(steps.some((s) => s.phase === "Why no fewer")).toBe(cut.ask !== "show" && !!cut.floor);
          expect(g.prompt).toContain(`${T}`);
          // must-run floor: the shaded windows are real (running in every schedule), and those at the picked time add up to the answer
          const why = steps.find((s) => s.phase === "Why no fewer");
          if (cut.floor?.kind === "mustRun" && why) {
            const gv = why.ganttView!;
            expect(gv.mustRunAt).toBe(cut.floor.at);
            for (const w of gv.mustRun!) {
              const a = acts.find((x) => x.id === w.id)!;
              expect(w.from).toBe(times.lf[a.id] - a.duration);
              expect(w.to).toBe(times.es[a.id] + a.duration);
              expect(w.from).toBeLessThan(w.to);
            }
            const at = gv.mustRunAt!;
            const sum = gv.mustRun!.filter((w) => w.from <= at && at < w.to).reduce((n, w) => n + (acts.find((x) => x.id === w.id)!.workers ?? 1), 0);
            expect(sum).toBe(cut.best);
          } else if (why) expect(why.ganttView?.mustRun).toBeUndefined();
        }
      });
    }, 120_000);
  }
  it("a must-run floor turns up and is drawn correctly (several workers, fewest)", () => {
    withSeededRandom(2468, () => {
      let seen = 0;
      for (let i = 0; i < 40 && seen < 2; i++) {
        const g = generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histWorkers: i % 2 ? "mixed" : "several", histCut: "fewest" });
        const cut = g.data.extra!.cut!;
        if (cut.floor?.kind !== "mustRun") continue;
        seen++;
        const steps = solveCpa({ network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind: "cpaHistogram" } as never);
        const gv = steps.find((s) => s.phase === "Why no fewer")!.ganttView!;
        expect(gv.mustRun!.length).toBeGreaterThanOrEqual(1);
        expect(cut.floor.ids!.length).toBeGreaterThanOrEqual(1);
        expect(cut.floor.ids!.every((id) => gv.mustRun!.some((w) => w.id === id && w.from <= cut.floor!.at! && cut.floor!.at! < w.to))).toBe(true);
      }
      expect(seen, "a must-run floor appeared").toBeGreaterThan(0);
    });
  }, 200_000);
});
