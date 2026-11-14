// The printable A4 sheet for Critical Path histogram and levelling questions.
import { describe, expect, it } from "vitest";
import { buildCpaSheet, CPA_SHEET_TABS, generateCpa, levelAxisT } from "../shared/decision";
import { cpaSheetsHtml } from "../shared/decision/printCpa";
import { withSeededRandom } from "./seededRandom";

const problemOf = (g: ReturnType<typeof generateCpa>, kind: "cpaHistogram" | "cpaLevel", level: number) => ({ network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind, level }) as never;
const html = async (p: never, answers: boolean) => cpaSheetsHtml((await buildCpaSheet(p, answers))!);
const figs = (h: string) => (h.match(/class="fig (network|gantt|hist)/g) ?? []).map((x) => x.replace('class="fig ', ""));
const blocksIn = (h: string) => (h.match(/<rect/g) ?? []).length;

describe("A4 question sheet", () => {
  it("is offered on the network, pass, full analysis, histogram and levelling tabs", () => { expect(CPA_SHEET_TABS).toEqual(["network", "forward", "backward", "full", "histogram", "level"]); });
  it("histogram Level 3, histogram given: network, Gantt chart, the given histogram and one blank to cut the peak", async () => {
    await withSeededRandom(31, async () => {
      const g = generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histGiven: true, histWorkers: "mixed" });
      const q = await html(problemOf(g, "cpaHistogram", 3), false);
      expect(figs(q)).toEqual(["network", "gantt", "hist", "hist"]);
      expect(q).toContain("Name ____");
      expect(q).toContain("table.workers { border-collapse: collapse; margin: 0 auto");   // the workers table is centred
      expect(q).toContain("Workers</th>");                  // the workers table, as the activities differ
      const a = await html(problemOf(g, "cpaHistogram", 3), true);
      expect(a).toContain("answers");
      expect(blocksIn(a)).toBeGreaterThan(blocksIn(q));      // the blank histogram is drawn in the answer sheet
      expect(a).toContain(g.answerText.slice(0, 20).replace(/&/g, "&amp;"));
    });
  }, 100_000);
  it("histogram Level 3, student draws it: two blank histograms (the second is the same size); the answer sheet fills both", async () => {
    await withSeededRandom(32, async () => {
      const g = generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histGiven: false });
      const q = await html(problemOf(g, "cpaHistogram", 3), false);
      expect(figs(q)).toEqual(["network", "gantt", "hist", "hist"]);
      const a = await html(problemOf(g, "cpaHistogram", 3), true);
      expect(blocksIn(a)).toBeGreaterThan(blocksIn(q) + g.data.acts.length);
    });
  }, 100_000);
  it("histogram Levels 1 and 2: the network and one tall blank histogram (no cascade chart: it would show the answer)", async () => {
    await withSeededRandom(33, async () => {
      for (const lv of [2, 3] as const) {
        const g = generateCpa(lv, "cpaHistogram", { paths: "one", workers: lv === 3 ? "several" : "one" });
        const q = await html(problemOf(g, "cpaHistogram", lv === 2 ? 1 : 2), false);
        expect(figs(q)).toEqual(["network", "hist"]);
        expect(q).toContain("hist tall");
      }
    });
  }, 100_000);
  it("levelling: network, Gantt chart, the given histogram with its limit line and a blank one to draw the levelled histogram; answers add the quick sums and the tries (no write-up)", async () => {
    await withSeededRandom(34, async () => {
      const g = generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, histShape: "step" });
      const L = g.data.extra!.level!;
      const q = await html(problemOf(g, "cpaLevel", 3), false);
      expect(figs(q)).toEqual(["network", "gantt", "hist", "hist"]);
      expect(q).toContain(`limit ${L.limit}`);
      const a = await html(problemOf(g, "cpaLevel", 3), true);
      expect(a).toContain("Quick sums:");
      expect(a).toContain("Tries:");
      expect(a).not.toContain("The new minimum completion time is");
    });
  }, 100_000);
  it("working sheets: one portrait page with the network as the figure, turned when that makes it bigger", async () => {
    await withSeededRandom(35, async () => {
      for (const kind of ["cpaNetwork", "cpaForward", "cpaBackward", "cpaFull"] as const) {
        const g = generateCpa(2, kind, { paths: "one" });
        const p = { network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind, level: 2 } as never;
        const q = await html(p, false), a = await html(p, true);
        expect(q).toContain("sheet work");
        expect(q).toContain("Name ____");
        expect(q.match(/class="fig /g)).toHaveLength(1);
        expect(a).toContain("answers");
        if (kind === "cpaNetwork") { expect(q).toContain("fig draw rot"); expect(q).toContain("Immediate predecessors"); expect(a).toContain("fig work"); }
        else expect(q).toContain("fig work");
        if (kind === "cpaFull") { expect(q).toContain("Critical activities"); expect(q).toContain("Minimum completion time"); }
        // the answer sheet fills the boxes in
        if (kind !== "cpaNetwork") expect(blocksIn(a)).toBe(blocksIn(q));
        expect((a.match(/<text/g) ?? []).length).toBeGreaterThan((q.match(/<text/g) ?? []).length - 1);
      }
    });
  }, 100_000);
  it("other tabs have no sheet", async () => {
    const g = generateCpa(2, "cpaFloat", {});
    expect(await buildCpaSheet({ network: { nodes: [], edges: [] }, prompt: g.prompt, answer: { text: g.answerText }, cpa: g.data, kind: "cpaFloat" } as never, false)).toBeNull();
  });
});

describe("levelling question sheet: the blank levelled histogram does not give the answer away", () => {
  it("the axis runs 10 past the time with no limit, to the next multiple of 5, whatever the answer; only an answer that does not fit sets it (167 gives 175, 53 gives 60)", () => {
    expect(levelAxisT(94, 95)).toBe(105);
    expect(levelAxisT(94, 103)).toBe(105);
    expect(levelAxisT(43, 44)).toBe(55);
    for (let T = 20; T <= 120; T++) for (let extra = 1; extra <= 9; extra++) {
      const ax = levelAxisT(T, T + extra);
      expect(ax % 5).toBe(0);
      expect(ax).toBeGreaterThan(T + extra);
      expect(ax).toBe(levelAxisT(T, T + 1));          // the same axis for every answer that fits
    }
    expect(levelAxisT(50, 53 + 10)).toBe(70);          // an answer that does not fit sets the axis: next multiple of 5 above answer + 5
    expect(levelAxisT(40, 53)).toBe(60);          // 53 gives 60
    expect(levelAxisT(150, 167 + 10)).toBe(185);
    expect(levelAxisT(150, 167)).toBe(175);          // 167 gives 175
  });
  it("on the printed question both histograms share one axis, and changing the answer does not change what is printed", async () => {
    // the questions are drawn inside the seeded stream; the printing awaits outside it (withSeededRandom puts the real Math.random back as soon as an async function first awaits)
    const drawn = withSeededRandom(77, () => Array.from({ length: 3 }, () => generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, levelWorkers: "one", histShape: "step" })));
    {
      for (const g of drawn) {
        const p = problemOf(g, "cpaLevel", 3) as never;
        const q = await html(p, false);
        const hist = [...q.matchAll(/class="fig hist[\s\S]*?<\/svg>/g)].map((m) => m[0]);
        expect(hist.length).toBe(2);
        expect(hist[0].match(/viewBox="[^"]*"/)![0]).toBe(hist[1].match(/viewBox="[^"]*"/)![0]);
        // a different (smaller) answer on the same network prints the same question
        const lv = g.data.extra!.level!, T = g.data.times.projectTime;
        if (lv.after.T > T + 1) {
          const saved = lv.after.T;
          lv.after.T = T + 1;
          const q2 = await html(p, false);
          lv.after.T = saved;
          expect(q2).toBe(q);
        }
      }
    }
  }, 100_000);
});
