// Resource levelling — the method of specs/resource-levelling.md against the ground-truth solver, the real exam questions and generated questions.
import { describe, expect, it } from "vitest";
import { withSeededRandom } from "./seededRandom";
import fixture from "./fixtures/levelling-real.json";
import { countClashes, cpaTimes, generateCpa, levelMethod, levelSchedule, type CpaActivity } from "../shared/decision";

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
