// ─────────────────────────────────────────────────────────────────────────────
// Critical Path Analysis exam-style questions (specs/cpa-exam-questions.md). Every chain builds, has the parts and marks the spec lists,
// and each part's model answer is checked against an independent derivation (the independent references of cpa.ts / cpaSkills.test.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { generateCpaExam, referenceCpa, AS_CHAINS, AL_CHAINS, type CpaChain } from "../shared/decision";

const SHAPE: Record<CpaChain, { labels: string[]; marks: number[] }> = {
  asBuild: { labels: ["(a)", "(b)"], marks: [4, 2] },
  asClaim: { labels: ["(a)(i)", "(a)(ii)", "(b)", "(c)(i)", "(c)(ii)"], marks: [3, 1, 1, 1, 1] },
  asChange: { labels: [], marks: [] }, // two shapes: (a) 1 + (b) 3, or (a) 3 + (b) 2
  asClock: { labels: ["(a)(i)", "(a)(ii)", "(b)(i)", "(b)(ii)", "(c)(i)", "(c)(ii)"], marks: [1, 2, 2, 1, 1, 2] },
  asMissing: { labels: ["(a)", "(b)", "(c)"], marks: [1, 1, 1] },
  alCascade: { labels: [], marks: [] }, // AL Q1 shape (a)(i) 2, (a)(ii) 1, (b) 3; or AL Q3 shape plus (c) 2
  alTable: { labels: ["(a)(i)", "(a)(ii)", "(b)", "(c)(i)", "(c)(ii)"], marks: [2, 3, 1, 2, 2] },
  alHist: { labels: ["(a)", "(b)", "(c)"], marks: [1, 3, 3] },
  alShorten: { labels: ["(a)", "(b)", "(c)"], marks: [2, 3, 2] },
  alPick: { labels: ["(a)"], marks: [1] },
  alAlloc: { labels: ["(a)", "(b)", "(c)", "(d)(i)", "(d)(ii)"], marks: [2, 1, 3, 2, 2] },
};

describe("CPA exam-style questions — every chain builds with the parts and marks the spec lists", () => {
  for (const ch of [...AS_CHAINS, ...AL_CHAINS]) for (const lv of [1, 2]) {
    it(`${ch}, Level ${lv}`, () => {
      for (let i = 0; i < 6; i++) {
        const p = generateCpaExam(lv, ch);
        const e = p.exam!;
        expect(e.parts.length).toBeGreaterThan(0);
        expect(e.totalMarks).toBe(e.parts.reduce((s, x) => s + x.marks, 0));
        const sh = SHAPE[ch];
        if (sh.labels.length) {
          expect(e.parts.map((x) => x.label)).toEqual(sh.labels);
          expect(e.parts.map((x) => x.marks)).toEqual(sh.marks);
        }
        for (const x of e.parts) {
          expect(x.scheme.length).toBe(x.marks);
          expect(x.scheme.every((m) => /^(B1F?|M1|A1F?|E1F?|R1)$/.test(m.code)), `${ch} ${x.label} codes`).toBe(true);
          expect(x.prompt.length).toBeGreaterThan(10);
          if (!x.onDiagram) expect(x.model.length, `${ch} ${x.label} has a model answer`).toBeGreaterThan(0);
          expect((x.working?.length ?? 0) > 0 || (x.explain?.length ?? 0) > 0, `${ch} ${x.label} has working`).toBe(true);
          if (x.onDiagram) expect(x.stepView, `${ch} ${x.label} has its answer picture`).toBeDefined();
        }
        // the network behind the whole question is the one the parts were built on
        const ref = referenceCpa(p.cpa!.acts);
        expect(p.cpa!.times.projectTime).toBe(ref.projectTime);
        expect(p.cpa!.extra!.examQ).toBeDefined();
        expect(e.intro.length).toBeGreaterThan(20);
        expect(e.minutes).toBeGreaterThanOrEqual(3);
      }
    }, 300_000);
  }
});

// ── each chain's model answers against an independent derivation ─────────────
import { clockTime } from "../shared/decision";
type P = ReturnType<typeof generateCpaExam>;
const withDur = (p: P, id: string, f: (d: number) => number) => p.cpa!.acts.map((a) => (a.id === id ? { ...a, duration: f(a.duration) } : a));
const part = (p: P, label: string) => p.exam!.parts.find((x) => x.label === label)!;
const critText = (p: P) => referenceCpa(p.cpa!.acts).criticalPaths.map((q) => q.filter((id) => id !== "Start" && id !== "End").join(" – ")).join(" and ");

describe("CPA exam chains — the answers are right", () => {
  it("asClaim: minimum time, critical activities and Glyn's sum all come from the one network", () => {
    for (let i = 0; i < 20; i++) {
      const p = generateCpaExam(i % 2 + 1, "asClaim");
      const ref = referenceCpa(p.cpa!.acts);
      expect(part(p, "(a)(ii)").model[0]).toBe(`${ref.projectTime} ${p.cpa!.unit}`);
      expect(part(p, "(b)").model[0].split(", ").sort()).toEqual([...ref.criticalSet].filter((id) => id !== "Start" && id !== "End").sort());
      expect(ref.criticalPaths.length).toBeGreaterThanOrEqual(2);
      const sum = p.cpa!.acts.filter((a) => ref.criticalSet.has(a.id)).reduce((s, a) => s + a.duration, 0);
      expect(part(p, "(c)(i)").model[0]).toContain(`${sum}`);
      expect(part(p, "(c)(i)").model[0]).toContain(`${ref.projectTime}`);
      expect(part(p, "(c)(ii)").model[0]).toContain("single critical path");
    }
  });
  it("asBuild: a change part's new minimum time is the independent recomputation; a claim part's verdict follows from the minimum time", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const p = generateCpaExam(i % 2 + 1, "asBuild");
      const ref = referenceCpa(p.cpa!.acts);
      const b = part(p, "(b)");
      if (/extended by/.test(b.prompt)) {
        seen.add("change");
        const m = b.prompt.match(/activity (\w+) is extended by (\d+)/)!;
        const nT = referenceCpa(withDur(p, m[1], (d) => d + Number(m[2]))).projectTime;
        expect(b.model[0]).toContain(`to ${nT} `);
        expect(b.scheme.map((x) => x.code)).toEqual(["M1", "A1F"]);
      } else {
        seen.add("claim");
        const c = Number(b.prompt.match(/completed in (\d+)/)![1]);
        expect(c).toBeLessThanOrEqual(ref.projectTime);
        expect(b.model.join(" ")).toContain(c === ref.projectTime ? "appears to be valid" : "not valid");
      }
    }
    expect(seen.size).toBe(2);
  });
  it("asChange: both shapes are right", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const p = generateCpaExam(i % 2 + 1, "asChange");
      const ref = referenceCpa(p.cpa!.acts);
      const labels = p.exam!.parts.map((x) => x.label).join("");
      if (labels === "(a)(b)" && p.exam!.parts[0].marks === 1) {
        seen.add("q5");
        expect(part(p, "(a)").model[0]).toBe(critText(p));
        const b = part(p, "(b)");
        const m = b.prompt.match(/activity (\w+) is increased by (\d+)/)!;
        const nref = referenceCpa(withDur(p, m[1], (d) => d + Number(m[2])));
        const named = b.prompt.match(/activities (.*)\.$/)![1].split(/, | and /);
        for (const q of named) {
          const es = nref.es[q] === ref.es[q] ? `earliest start unchanged (${ref.es[q]})` : `earliest start ${ref.es[q]} → ${nref.es[q]}`;
          const lf = nref.lf[q] === ref.lf[q] ? `latest finish unchanged (${ref.lf[q]})` : `latest finish ${ref.lf[q]} → ${nref.lf[q]}`;
          expect(b.model[0]).toContain(`${q}: ${es}, ${lf}`);
        }
        expect(b.marks).toBe(3);
      } else {
        seen.add("q1");
        expect(p.exam!.parts.map((x) => x.marks)).toEqual([3, 2]);
        const b = part(p, "(b)");
        const m = b.prompt.match(/activity (\w+) may increase by up to (\d+)/) ?? b.prompt.match(/increase by up to (\d+)/);
        expect(m).toBeTruthy();
        expect(b.model.join(" ")).toMatch(/float of \w+ is \d+/);
      }
    }
    expect(seen.size).toBe(2);
  });
  it("asClock: the clock times and the second project add up", () => {
    for (let i = 0; i < 25; i++) {
      const p = generateCpaExam(i % 2 + 1, "asClock");
      const ref = referenceCpa(p.cpa!.acts);
      const T = ref.projectTime;
      const start = p.exam!.intro.match(/Work starts at (\d\d):(\d\d)/)!;
      const sm = Number(start[1]) * 60 + Number(start[2]);
      expect(part(p, "(b)(ii)").model[0]).toContain(clockTime(sm + T));
      const f = part(p, "(b)(i)");
      const sources = p.cpa!.acts.filter((a) => a.preds.length === 0).map((a) => a.id);
      const critSource = sources.filter((id) => ref.criticalSet.has(id));
      expect(critSource).toHaveLength(1);
      expect(f.model[0].startsWith(`${critSource[0]}:`)).toBe(true);
      const c2 = part(p, "(c)(ii)").model[0].match(/(\d+) − (\d+) = (\d+) minutes\. (\d\d:\d\d) \+ (\d+) minutes = (\d\d:\d\d)/)!;
      expect(Number(c2[1])).toBe(T);
      expect(Number(c2[1]) - Number(c2[2])).toBe(Number(c2[3]));
      expect(c2[6]).toBe(clockTime(sm + Number(c2[3])));
      // the durations in minutes add up to that total
      const mins = part(p, "(c)(i)").model.map((l) => Number(l.match(/: ([\d.]+) minutes/)![1]));
      expect(mins.reduce((s, v) => s + v, 0)).toBeCloseTo(Number(c2[2]), 10);
      expect(part(p, "(a)(i)").model).toHaveLength(p.cpa!.acts.length);
    }
  });
  it("asMissing: x, y and d match the independent reference, and each question has four distinct options", () => {
    for (let i = 0; i < 25; i++) {
      const p = generateCpaExam(i % 2 + 1, "asMissing");
      const ref = referenceCpa(p.cpa!.acts);
      for (const lab of ["(a)", "(b)"]) {
        const pt = part(p, lab);
        const m = pt.prompt.match(/The (earliest start time|latest finish time) of activity (\w+) is (x|y)/)!;
        const truth = m[1] === "earliest start time" ? ref.es[m[2]] : ref.lf[m[2]];
        expect(pt.model[0]).toBe(`${m[3]} = ${truth}`);
        const opts = pt.prompt.match(/Circle your answer: (.*)$/)![1].trim().split(/\s+/).map(Number);
        expect(opts).toHaveLength(4);
        expect(new Set(opts).size).toBe(4);
        expect(opts).toContain(truth);
      }
      const c = part(p, "(c)");
      const k = c.prompt.match(/activity (\w+) is d/)![1];
      const v = ref.lf[k] - ref.es[k];
      expect(ref.criticalSet.has(k)).toBe(true);
      expect(c.model[0]).toBe(`d = ${v}`);
      expect(c.prompt).toContain(`0 < d < ${v}`);
      expect(c.prompt).toContain(`d = ${2 * v}`);
    }
  });
});

describe("CPA exam chains (A-level) — the answers are right", () => {
  it("alCascade: floats and critical path agree with the reference; the cascade is complete", () => {
    for (let i = 0; i < 30; i++) {
      const p = generateCpaExam(i % 2 + 1, "alCascade");
      const ref = referenceCpa(p.cpa!.acts);
      const second = part(p, "(a)(ii)");
      if (/critical path/.test(second.prompt)) expect(second.model[0]).toBe(critText(p));
      else {
        const m = second.prompt.match(/float of activity (\w+)/)!;
        const a = p.cpa!.acts.find((x) => x.id === m[1])!;
        expect(second.model[0]).toBe(`${ref.lf[m[1]] - ref.es[m[1]] - a.duration} ${p.cpa!.unit}`);
      }
      const cas = p.cpa!.extra!.cascade!;
      expect(cas.bars.map((b) => b.id).sort()).toEqual(p.cpa!.acts.map((a) => a.id).sort());
      expect(part(p, "(b)").scheme.map((x) => x.code)).toEqual(["M1", "A1", "A1"]);
      const c = p.exam!.parts.find((x) => x.label === "(c)");
      if (c) {
        const id = c.prompt.match(/activity (\w+) is not necessary/)![1];
        expect(ref.criticalSet.has(id)).toBe(true);
        expect(c.scheme).toHaveLength(2);
      }
    }
  });
  it("alTable: critical paths, histogram and levelling are consistent with the network", () => {
    for (let i = 0; i < 12; i++) {
      const p = generateCpaExam(i % 2 + 1, "alTable");
      const ref = referenceCpa(p.cpa!.acts);
      expect(ref.criticalPaths.length).toBeGreaterThanOrEqual(2);
      expect(part(p, "(b)").model[0]).toBe(critText(p));
      const h = p.cpa!.extra!.histogram!;
      for (const b of h.blocks) expect(b.start).toBe(ref.es[b.id]);
      const L = p.cpa!.extra!.level!;
      expect(Math.max(...L.after.profile)).toBeLessThanOrEqual(L.limit);
      expect(L.newTime).toBeGreaterThan(ref.projectTime);
      const lev = part(p, "(c)(ii)");
      expect(lev.prompt).toContain(`assigns ${L.limit} members`);
      expect(lev.scheme[1].text).toContain(`${L.newTime}`);
    }
  }, 120_000);
  it("alHist: the histogram and the levelled histogram are consistent", () => {
    for (let i = 0; i < 12; i++) {
      const p = generateCpaExam(i % 2 + 1, "alHist");
      const ref = referenceCpa(p.cpa!.acts);
      expect(part(p, "(a)").model[0]).toBe(critText(p));
      const L = p.cpa!.extra!.level!;
      expect(L.before.profile).toEqual(p.cpa!.extra!.histogram!.profile);
      expect(Math.max(...L.after.profile)).toBeLessThanOrEqual(L.limit);
      expect(part(p, "(c)").scheme[2].text).toContain(`${L.newTime}`);
      expect(p.cpa!.acts.some((a) => (a.workers ?? 1) > 1)).toBe(true);
      void ref;
    }
  }, 120_000);
  it("alShorten: the activity named is the true best", () => {
    for (let i = 0; i < 12; i++) {
      const p = generateCpaExam(i % 2 + 1, "alShorten");
      const b = part(p, "(b)");
      const id = b.model[0].match(/Reduce (\w+):/)![1];
      const nT = Number(b.model[0].match(/becomes (\d+)/)![1]);
      expect(referenceCpa(withDur(p, id, () => 1)).projectTime).toBe(nT);
      for (const a of p.cpa!.acts) if (a.id !== id && a.duration > 1) expect(referenceCpa(withDur(p, a.id, () => 1)).projectTime).toBeGreaterThan(nT);
      expect(part(p, "(c)").scheme.map((x) => x.code)).toEqual(["B1", "E1"]);
    }
  }, 120_000);
  it("alPick: exactly one of three histograms is valid, and it is the one named", () => {
    for (let i = 0; i < 12; i++) {
      const p = generateCpaExam(i % 2 + 1, "alPick");
      const L = p.cpa!.extra!.level!;
      const dur = Object.fromEntries(p.cpa!.acts.map((a) => [a.id, a.duration]));
      const ok = L.choices!.filter((c) => {
        const st = Object.fromEntries(c.data.blocks.map((b) => [b.id, b.start]));
        return c.data.profile.every((v) => v <= L.limit) && p.cpa!.acts.every((a) => a.preds.every((q) => st[a.id] >= st[q] + dur[q]));
      });
      expect(ok).toHaveLength(1);
      expect(part(p, "(a)").model[0].startsWith(`Option ${ok[0].label}.`)).toBe(true);
      expect(p.cpa!.extra!.examQ!.chart).toBe("choose");
    }
  }, 120_000);
  it("alAlloc: levelling and allocation use the same limit and the same finish time", () => {
    for (let i = 0; i < 10; i++) {
      const p = generateCpaExam(i % 2 + 1, "alAlloc");
      const L = p.cpa!.extra!.level!;
      const A = p.cpa!.extra!.alloc!;
      expect(A.workers).toBe(L.limit);
      expect(A.newTime).toBe(L.newTime);
      expect(part(p, "(d)(ii)").prompt).toContain(`${L.limit} workers`);
      expect(part(p, "(d)(i)").prompt).toContain(`${L.limit} workers`);
    }
  }, 120_000);
});
