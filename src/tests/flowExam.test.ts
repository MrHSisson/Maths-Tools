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
          expect(part.onDiagram ? part.view : part.model.length).toBeTruthy();
          expect(part.explain?.length ?? 0).toBeGreaterThanOrEqual(1);
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

// ── A-level ──────────────────────────────────────────────────────────────────
import { allCuts, pathNodes } from "../shared/decision/flow";
import type { FlowMode } from "../shared/decision/flow";

const A_CHAINS = ["examAug", "examAugSuper", "examLower"] as const;

describe("A-level exam-style questions — structure", () => {
  for (const chain of A_CHAINS) for (const level of [1, 2, 3] as const)
    it(`${chain} L${level}: marks, mark scheme and views are consistent`, () => {
      for (let i = 0; i < 6; i++) {
        const mode: FlowMode = i % 2 ? "minmax" : "cap";
        const p = generateFlowExam(level, chain, { course: "a", mode });
        const e = p.exam!;
        expect(p.flow!.subTool).toBe("exam");
        expect(p.flow!.course).toBeUndefined();
        for (const part of e.parts) {
          expect(part.marks).toBe(part.scheme.length);
          expect(part.onDiagram ? part.view : part.model.length).toBeTruthy();
          for (const m of part.scheme) expect(m.code).toMatch(/^(B|M|A|E|R)1F?$/);
        }
        expect(e.totalMarks).toBe(e.parts.reduce((t, x) => t + x.marks, 0));
        expect(e.totalMarks).toBeGreaterThanOrEqual(chain === "examLower" ? 6 : 8);
        expect(e.totalMarks).toBeLessThanOrEqual(12);
        expect(solveFlowProblem(p).length).toBe(1);
        // a claim question always ends in an explicit verdict
        const claim = e.parts.find((x) => /Comment on the validity/.test(x.prompt))!;
        expect(claim.scheme[claim.scheme.length - 1].text).toMatch(/correct|incorrect/);
      }
    }, 120_000);
});

describe("A-level exam-style questions — the maths", () => {
  it("Augment and prove: the paths total the uplift, the cut proves the maximum, the claim verdict is right", () => {
    for (const withSuper of [false, true]) for (const level of [1, 3] as const) for (const mode of ["cap", "minmax"] as FlowMode[]) for (let i = 0; i < 4; i++) {
      const p = generateFlowExam(level, withSuper ? "examAugSuper" : "examAug", { course: "a", mode });
      const d = p.flow!;
      const { net, flow } = d;
      expect(isFeasibleFlow(net, flow).ok).toBe(true);
      const run = maxFlow(net, flow);
      const V = run.value, V0 = flowValue(net, flow);
      expect(V).toBe(minCutBruteForce(net).capacity);
      const ps = p.exam!.parts;
      const aug = ps.find((x) => /flow augmentation/.test(x.prompt))!;
      // the table lists every path, each with its extra flow, and the extras add up
      const rows = aug.model.filter((l) => /\| \+\d+$/.test(l));
      expect(rows.length).toBe(run.augmentations.length);
      expect(rows.reduce((t, l) => t + +l.match(/\+(\d+)$/)![1], 0)).toBe(V - V0);
      rows.forEach((l, k) => expect(l.startsWith(pathNodes(run.augmentations[k].path).join(""))).toBe(true));
      expect(aug.scheme[aug.scheme.length - 1].text).toContain(`${V} `);
      // the proof names the real minimum cut
      const proof = ps.find((x) => /^Prove that the flow/.test(x.prompt))!;
      const pv = proof.view as FlowViewState;
      expect(cutCapacity(net, pv.sSide!).capacity).toBe(V);
      expect(proof.scheme[1].text).toContain(`${V} `);
      // the claim's verdict agrees with recomputing the maximum flow
      const claim = ps.find((x) => /Comment on the validity/.test(x.prompt))!;
      const m = claim.prompt.match(/pipe (\S+) by (\d+)/)!;
      const raised = { ...net, arcs: net.arcs.map((a) => (a.id === m[1] ? { ...a, hi: a.hi + +m[2] } : a)) };
      const gain = maxFlow(raised, run.flow).value - V;
      expect(claim.scheme[1].text).toContain(gain > 0 ? "claim is correct" : "claim is incorrect");
      if (withSuper) expect(ps[0].prompt).toMatch(/^Add a super/);
      if (mode === "minmax" && withSuper) expect(ps[0].scheme[1].text).toMatch(/lower capacity/);
    }
  }, 180_000);

  it("Lower capacities: the cut subtracts the lower capacities, the claim is refutable, one pipe upgrade helps", () => {
    for (const level of [1, 2, 3] as const) for (let i = 0; i < 5; i++) {
      const p = generateFlowExam(level, "examLower", { course: "a" });
      const d = p.flow!;
      const { net, flow } = d;
      const ps = p.exam!.parts;
      expect(ps.length).toBe(4);
      expect(net.arcs.some((a) => a.lo > 0)).toBe(true);
      const cutV = ps[0].view as FlowViewState;
      const r = cutCapacity(net, cutV.sSide!);
      expect(r.backward.some((a) => a.lo > 0)).toBe(true);
      expect(ps[0].scheme[0].text).toContain(`${r.capacity} `);
      expect(ps[1].scheme[0].text).toContain(`${r.capacity} `);
      // the claimed maximum is above the cut, so it cannot be true
      const X = +ps[2].prompt.match(/is (\d+) /)![1];
      expect(X).toBeGreaterThan(r.capacity);
      const run = maxFlow(net, flow);
      expect(run.value).toBeLessThanOrEqual(r.capacity);
      // exactly one pipe's upgrade raises the maximum flow, and the gain stated is right
      const m = ps[3].prompt.match(/by (\d+) /)!;
      const k = +m[1];
      const helpful = net.arcs.filter((a) => maxFlow({ ...net, arcs: net.arcs.map((x) => (x.id === a.id ? { ...x, hi: x.hi + k } : x)) }, run.flow).value > run.value);
      expect(helpful.length).toBe(1);
      const g = maxFlow({ ...net, arcs: net.arcs.map((x) => (x.id === helpful[0].id ? { ...x, hi: x.hi + k } : x)) }, run.flow).value - run.value;
      expect(ps[3].scheme[0].text).toContain(`pipe ${helpful[0].id} `);
      expect(ps[3].scheme[1].text).toContain(`${run.value + g} `);
      void allCuts;
    }
  }, 120_000);

  it("Level 3 cap-mode augment questions may add a restricted-vertex part, and its new maximum flow is a real minimum cut", () => {
    let seen = 0;
    for (let i = 0; i < 40 && seen < 3; i++) {
      const p = generateFlowExam(3, "examAug", { course: "a", mode: "cap" });
      const rp = p.exam!.parts.find((x) => /restricted to a maximum/.test(x.prompt));
      if (!rp) continue;
      seen++;
      const V = maxFlow(p.flow!.net, p.flow!.flow).value;
      const M = +rp.scheme[1].text.match(/to (\d+) /)![1];
      expect(M).toBeLessThan(V);
      expect(minCutBruteForce((rp.view as FlowViewState).net!).capacity).toBe(M);
    }
    expect(seen).toBeGreaterThan(0);
  }, 180_000);
});

describe("the working behind the (?)", () => {
  const lastNum = (s: string) => { const m = s.match(/= (\d+)(?: [^\d=]+)?$/); return m ? Number(m[1]) : null; };
  for (const [course, chains] of [["as", ["examCut", "examFlow", "examSuper"]], ["a", ["examAug", "examAugSuper", "examLower"]]] as const) {
    for (const chain of chains) for (const level of [1, 2, 3] as const) {
      it(`${chain} level ${level}: parts that have working play it on their own network, and it agrees with the model answer`, () => {
        for (let i = 0; i < 6; i++) {
          const p = generateFlowExam(level, chain as never, { course });
          const withWork = p.exam!.parts.filter((x) => x.working);
          expect(withWork.length).toBeGreaterThanOrEqual(1);
          for (const part of withWork) {
            const w = part.working!;
            expect(w.length).toBeGreaterThanOrEqual(1);
            for (const st of w) { expect(st.caption.length).toBeGreaterThan(3); expect(st.flowView?.net).toBeTruthy(); }
            // a cut value (AS and the lower-capacity chain): the working's final total is the model answer
            if (/^Find the value of the cut/.test(part.prompt)) expect(w[w.length - 1].runningTotal).toBe(lastNum(part.model[0].replace(/ [a-z ]+$/, "")));
            // flow augmentation: the working ends at the maximum flow the table states
            if (/Use flow augmentation/.test(part.prompt)) {
              const total = Number(part.model[part.model.length - 1].match(/= (\d+) [a-z]/)?.[1]);
              expect(w.some((st) => st.runningTotal === total)).toBe(true);
            }
          }
        }
      }, 60_000);
    }
  }
});

import { examPrintHtml } from "../shared/decision/printExam";
describe("the printed exam question", () => {
  for (const chain of ["examCut", "examFlow", "examSuper"] as const) {
    it(`${chain}: the paper has every part with its marks and the mark scheme has every mark line`, () => {
      const p = generateFlowExam(2, chain, { course: "as" });
      const html = examPrintHtml({ title: "Network Flows", exam: p.exam!, questionFigure: "<svg></svg>", answerFigures: p.exam!.parts.map(() => "<svg></svg>") });
      for (const part of p.exam!.parts) {
        expect(html).toContain(`<b>${part.label}</b>`);
        for (const m of part.scheme) expect(html).toContain(m.code);
      }
      expect(html).toContain("mark scheme");
      expect((html.match(/class="mk"/g) ?? []).length).toBe(p.exam!.totalMarks);
    });
  }
});

describe("potentials are never drawn over the flows", () => {
  it("the potentials answer figure and its working show no flows", () => {
    for (let i = 0; i < 6; i++) {
      const p = generateFlowExam(2, "examAug", { course: "a" });
      const part = p.exam!.parts[0];
      const v = part.view as FlowViewState;
      expect(v.potentials).toBeTruthy();
      expect(v.flow).toBeUndefined();
      for (const st of part.working!) { expect(st.flowView?.potentials).toBeTruthy(); expect(st.flowView?.flow).toBeUndefined(); }
    }
  });
});

describe("the networks printed for potentials and augmentation", () => {
  const one = (html: string, needle: string) => (html.match(new RegExp(needle, "g")) ?? []).length;
  it("potentials then augmentation share one network and add one for the flows; augmentation alone gets two", () => {
    const fig = "<svg>BLANK</svg>";
    const a = generateFlowExam(2, "examAug", { course: "a" });
    const htmlA = examPrintHtml({ title: "T", exam: a.exam!, questionFigure: "<svg>Q</svg>", answerFigures: a.exam!.parts.map(() => null),
      blankFigures: a.exam!.parts.map((p) => (/potential increase|Use flow augmentation/.test(p.prompt) ? fig : null)) });
    expect(one(htmlA, "BLANK")).toBe(2); // one for the potentials and augmentations, one for the maximum flow
    const s = generateFlowExam(2, "examAugSuper", { course: "a" });
    const htmlS = examPrintHtml({ title: "T", exam: s.exam!, questionFigure: "<svg>Q</svg>", answerFigures: s.exam!.parts.map(() => null),
      blankFigures: s.exam!.parts.map((p) => (/potential increase|Use flow augmentation/.test(p.prompt) ? fig : null)) });
    expect(one(htmlS, "BLANK")).toBe(2); // augmentation alone: network 1 and network 2
  });
});
