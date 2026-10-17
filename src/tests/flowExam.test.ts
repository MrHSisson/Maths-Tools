// ─────────────────────────────────────────────────────────────────────────────
// Network Flows — AS exam-style questions (specs/flow-exam-questions.md). Every part's numbers are re-derived from the network with the
// independent solver (cutCapacity / minCutBruteForce / maxFlow), and the marks, mark schemes and views are checked for consistency.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import { cutCapacity, flowValue, isFeasibleFlow, maxFlow, minCutBruteForce } from "../shared/decision/flow";
import { generateFlowExam, EXAM_CHAINS, type ExamChain } from "../shared/decision/flowExam";
import { solveFlowProblem, questionView } from "../shared/decision/flowSolve";
import type { FlowViewState } from "../shared/decision/flow";

const views = (p: ReturnType<typeof generateFlowExam>) => p.exam!.parts.map((x) => x.view as FlowViewState | undefined);

describe("AS exam-style questions — structure", () => {
  for (const chain of EXAM_CHAINS) for (const level of [1, 2, 3] as const)
    it(`${chain} L${level}: marks, mark scheme and views are consistent`, () => {
      for (let i = 0; i < 10; i++) {
        const p = generateFlowExam(level, chain);
        const e = p.exam!;
        expect(p.flow!.subTool).toBe("exam");
        expect(p.flow!.course).toBe("as");
        expect(e.parts.length).toBeGreaterThanOrEqual(3);
        for (const part of e.parts) {
          expect(part.marks).toBe(part.scheme.length);
          expect(part.marks).toBeGreaterThanOrEqual(1);
          expect(part.prompt.length).toBeGreaterThan(10);
          expect(part.model.length).toBeGreaterThanOrEqual(1);
          for (const m of part.scheme) expect(m.code).toMatch(/^(B|M|A|E|R)1F?$/);
        }
        expect(e.totalMarks).toBe(e.parts.reduce((t, x) => t + x.marks, 0));
        expect(e.totalMarks).toBeGreaterThanOrEqual(4);
        expect(e.totalMarks).toBeLessThanOrEqual(7);
        expect(e.parts.map((x) => x.label)).toEqual(e.parts.map((_, k) => `(${"abcd"[k]})`));
        expect(solveFlowProblem(p).length).toBe(1);
        expect(questionView(p)).toEqual(p.flow!.examView ?? {});
        // every bound is a weak inequality
        for (const part of e.parts) for (const line of [...part.model, ...part.scheme.map((m) => m.text)]) expect(line).not.toMatch(/maximum flow (is|=) \d+ (litres|cubic|thousand)/);
      }
    }, 60_000);
});

describe("AS exam-style questions — the maths", () => {
  it("Cuts and bounds: (a) and (b) are real cut values and (c) is the smaller of the two", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const p = generateFlowExam(level, "examCut");
      const net = p.flow!.net;
      const [a, b, c] = views(p);
      const capA = cutCapacity(net, a!.sSide!).capacity, capB = cutCapacity(net, b!.sSide!).capacity;
      const [pa, pb, pc] = p.exam!.parts;
      expect(pa.scheme[0].text).toContain(`${capA} `);
      expect(pb.prompt).toContain(`${capB} `);
      expect(capB).toBeLessThan(capA);
      expect(pc.scheme[0].text).toContain(`${capB} `);
      expect(pc.scheme[0].text).toMatch(/weak inequality/);
      expect(pc.scheme[1].code).toBe("E1F");
      expect(c!.sSide).toEqual(b!.sSide);
      // the bound is never below the true maximum flow
      expect(capB).toBeGreaterThanOrEqual(minCutBruteForce(net).capacity);
      expect(a!.sSide).toContain("S"); expect(a!.sSide).not.toContain("T");
      expect(a!.cutBackSilent).toBe(true);
    }
  }, 60_000);

  it("Flow in = flow out: the missing flows are conservation, and (c) proves the minimum cut", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const p = generateFlowExam(level, "examFlow");
      const d = p.flow!;
      const { net, flow, missing } = d;
      expect(isFeasibleFlow(net, flow).ok).toBe(true);
      const ps = p.exam!.parts;
      expect(ps.length).toBe(3);
      const v = views(p);
      // each answered part names the true flow of its arc
      missing!.forEach((id, k) => { void id; void k; });
      const solvedArcs = v.flatMap((x) => x?.solved ?? []);
      for (const arc of solvedArcs) expect(ps.some((x) => x.scheme.some((m) => m.text.includes(`${flow[arc]} `)))).toBe(true);
      expect(new Set(solvedArcs)).toEqual(new Set(missing));
      // the last view carries the full flow, and the cut is the minimum cut with exactly the stated value
      const last = v[v.length - 1]!;
      expect(last.flow).toEqual(flow);
      const V = maxFlow(net, flow).value;
      expect(cutCapacity(net, last.sSide!).capacity).toBe(V);
      expect(minCutBruteForce(net).capacity).toBe(V);
      expect(ps[ps.length - 1].prompt).toContain(`at most ${V} `);
      expect(V).toBeGreaterThan(flowValue(net, flow));
      // the starting picture shows the circled flows except the missing ones
      for (const id of missing!) expect(p.flow!.examView!.flow![id]).toBeUndefined();
      expect(p.flow!.examView!.unknown).toEqual(missing);
    }
  }, 60_000);

  it("Supersource / supersink: sources and sinks, the added arcs, a cut and the bound", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 12; i++) {
      const p = generateFlowExam(level, "examSuper");
      const d = p.flow!;
      const sp = d.superST!;
      const ps = p.exam!.parts;
      expect(ps.length).toBe(4);
      expect(ps.map((x) => x.marks)).toEqual([2, 2, 1, 1]);
      // the listed sources and sinks match the network the question draws
      for (const s of sp.removeS ? Object.keys(sp.sources) : ["S"]) expect(ps[0].scheme[0].text).toContain(s);
      for (const t of sp.removeT ? Object.keys(sp.sinks) : ["T"]) expect(ps[0].scheme[1].text).toContain(t);
      // each added arc carries at least what leaves its source (or arrives at its sink)
      for (const id of sp.superArcs) {
        const a = d.net.arcs.find((x) => x.id === id)!;
        const others = a.from === "S" ? d.net.arcs.filter((x) => x.from === a.to && x.id !== id) : d.net.arcs.filter((x) => x.to === a.from && x.id !== id);
        expect(a.hi).toBeGreaterThanOrEqual(others.reduce((t, x) => t + x.hi, 0));
      }
      const [, bView, cView] = views(p);
      expect(bView!.focus!.slice().sort()).toEqual(sp.superArcs.slice().sort());
      const cap = cutCapacity(d.net, cView!.sSide!).capacity;
      expect(ps[2].scheme[0].text).toContain(`${cap} `);
      expect(ps[3].scheme[0].text).toContain(`${cap} `);
      expect(cap).toBeGreaterThanOrEqual(minCutBruteForce(d.net).capacity);
      expect(p.flow!.examView!.net).toBe(sp.question);
    }
  }, 60_000);

  it("Level 3 supersource questions have several sources and several sinks", () => {
    for (let i = 0; i < 12; i++) {
      const sp = generateFlowExam(3, "examSuper").flow!.superST!;
      expect(sp.removeS && sp.removeT).toBe(true);
    }
  });

  it("'any' draws every style", () => {
    const seen = new Set<ExamChain>();
    for (let i = 0; i < 120; i++) {
      const p = generateFlowExam(2, "any");
      seen.add(p.exam!.parts.length === 4 && p.exam!.parts[0].prompt.startsWith("State which") ? "examSuper" : p.exam!.parts[0].prompt.startsWith("Find the value") ? "examCut" : "examFlow");
    }
    expect(seen.size).toBe(3);
  }, 60_000);
});
