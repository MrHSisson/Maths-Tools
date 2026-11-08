// An activity that needs several workers is written D(3) in every picture that draws it: the network box, the cascade (Gantt) chart and the histogram block.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityNodeView, GanttView, HistogramView, generateCpa } from "../shared/decision";
import { withSeededRandom } from "./seededRandom";

const draw = (g: ReturnType<typeof generateCpa>) => {
  const d = g.data, cas = d.extra!.cascade!, h = d.extra!.histogram!;
  return {
    network: renderToStaticMarkup(createElement(ActivityNodeView, { acts: d.acts, layout: d.layout, view: {} })),
    gantt: renderToStaticMarkup(createElement(GanttView, { data: cas, view: { bars: d.acts.map((a) => a.id), floats: [] }, unit: d.unit })),
    hist: renderToStaticMarkup(createElement(HistogramView, { data: h, view: { blocks: h.blocks.map((b) => b.id) }, unit: d.unit })),
  };
};
// the text of an SVG label, e.g. >D(3)<
const hasTag = (svg: string, id: string, w: number) => svg.includes(`>${id}(${w})<`);

describe("worker labels D(3) in the network, the cascade chart and the histogram", () => {
  it("several workers: every activity box, bar and (wide enough) block carries its workers", () => {
    withSeededRandom(1717, () => {
      for (let i = 0; i < 4; i++) {
        const g = generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histWorkers: i % 2 ? "mixed" : "several", histCut: "show" });
        const pics = draw(g);
        for (const a of g.data.acts) {
          const w = a.workers ?? 1;
          expect(hasTag(pics.network, a.id, w), `network ${a.id}(${w})`).toBe(true);
          expect(hasTag(pics.gantt, a.id, w), `gantt ${a.id}(${w})`).toBe(true);
        }
        // at least the biggest histogram blocks carry the tag (a narrow piece keeps just the letter)
        expect(/>[A-Z]\(\d\)</.test(pics.hist)).toBe(true);
      }
    });
  });
  it("one worker each: plain letters everywhere", () => {
    withSeededRandom(1718, () => {
      const g = generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histWorkers: "one", histCut: "show" });
      const pics = draw(g);
      for (const svg of Object.values(pics)) expect(/>[A-Z]\(\d\)</.test(svg)).toBe(false);
    });
  });
});
