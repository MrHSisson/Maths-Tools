import { createElement } from "react";
import ActivityNodeView from "./representations/ActivityNodeView";
import GanttView from "./representations/GanttView";
import HistogramView from "./representations/HistogramView";
import { cascadeSequence, criticalActivities, fullGraph, type CpaActivity, type HistogramData } from "./cpa";
import { solveCpa } from "./cpaSolve";
import type { DecisionProblem } from "./types";
import type { CpaSheetFigure, CpaSheetInput } from "./printCpa";

// The A4 sheet for a Critical Path histogram or levelling question: the network with its times and critical path, the cascade chart with its
// floats, then histograms to draw on (blank) or already drawn, in the order the question needs them. `answers` fills the blank ones in.
// The tool hands `buildCpaSheet` to the shell (`config.questionSheet`); the shell prints what it returns.

/** which sub-tools have a sheet */
export const CPA_SHEET_TABS = ["histogram", "level"];

async function buildCpaSheetInput(p: DecisionProblem, answers: boolean): Promise<CpaSheetInput | null> {
  const d = p.cpa;
  if (!d || (d.kind !== "cpaHistogram" && d.kind !== "cpaLevel")) return null;
  const hist = d.extra?.histogram, lv = d.extra?.level, cut = d.extra?.cut;
  if (!hist) return null;
  // the chart as a page wants it: the critical path along one row (the one on screen has a row for every activity)
  const cas = cascadeSequence(d.acts as CpaActivity[], d.times, hist.start === "late" ? "late" : "early", d.criticalPaths[0].filter((id) => id !== "Start" && id !== "End"));
  const { renderToStaticMarkup } = await import("react-dom/server");
  const T = d.times.projectTime;
  const all = fullGraph(d.acts);
  const crit = criticalActivities(d.acts);
  const arrows = [...new Set(d.criticalPaths.flatMap((path) => path.slice(1).map((id, i) => `${path[i]}→${id}`)))];
  const network = renderToStaticMarkup(createElement(ActivityNodeView, {
    acts: d.acts as CpaActivity[], layout: d.layout,
    view: { es: Object.fromEntries(all.map((a) => [a.id, d.times.es[a.id]])), lf: Object.fromEntries(all.map((a) => [a.id, d.times.lf[a.id]])), critical: crit, criticalArrows: arrows },
  }));
  const gantt = renderToStaticMarkup(createElement(GanttView, {
    data: cas, view: { bars: d.acts.map((a) => a.id), floats: d.acts.filter((a) => d.times.float[a.id] > 0).map((a) => a.id) }, unit: d.unit, axisT: T, rowH: 22,
  }));
  const axisPeak = Math.max(hist.peak, lv?.limit ?? 0, ...(cut?.states ?? []).map((s) => s.peak), lv?.after.peak ?? 0);
  const draw = (data: HistogramData, filled: boolean, limit?: number): string => renderToStaticMarkup(createElement(HistogramView, {
    data, view: { blocks: filled ? data.blocks.map((b) => b.id) : [] }, unit: d.unit, limit, axisT: Math.max(T, data.T), axisPeak, minWidth: 0,
  }));
  const figures: CpaSheetFigure[] = [
    { caption: "Activity network (earliest start, duration, latest finish), critical path in green", svg: network, kind: "network" },
    { caption: "Cascade chart: every activity as early as possible, float shown dashed", svg: gantt, kind: "gantt" },
  ];
  const out: CpaSheetInput = { title: "Critical Path Analysis", subtitle: "", prompt: p.prompt, figures, answerSheet: answers };
  if (d.acts.some((a) => (a.workers ?? 1) > 1)) out.workers = d.acts.map((a) => ({ id: a.id, n: a.workers ?? 1 }));
  const level = p.level ? ` · Level ${p.level}` : "";
  if (d.kind === "cpaLevel" && lv) {
    // the histogram with no limit is given (with the limit line); the student draws the levelled one
    out.subtitle = `Resource levelling${level}`;
    figures.push({ caption: `The resource histogram with every activity as early as possible (limit ${lv.limit})`, svg: draw(lv.before, true, lv.limit), kind: "hist" });
    figures.push({ caption: `Your levelled histogram (limit ${lv.limit})`, svg: draw(lv.after, answers, lv.limit), kind: "hist" });
    if (answers) {
      const steps = solveCpa(p);
      const last = steps[steps.length - 1];
      // the answer, the quick sums, the tries on one line (there can be eight), then the write-up (which opens with the clash sentence, so that is not listed twice)
      const items = (last?.list?.items ?? []).map((i: { text: string }) => i.text);
      const tries = items.slice(2, -1).map((t: string) => t.replace(/^Try \d+: /, "").replace(/\.$/, ""));
      out.answer = [p.answer.text, items[1], ...(tries.length ? [`Tries: ${tries.map((t: string, k: number) => `(${k + 1}) ${t}`).join("; ")}.`] : []), items[items.length - 1]].filter(Boolean);
    }
  } else if (cut) {
    out.subtitle = `Resource histogram${level}`;
    const final = cut.states[cut.states.length - 1];
    if (cut.given) {
      figures.push({ caption: "The resource histogram, every activity as " + cut.start + " as possible", svg: draw(cut.states[0], true), kind: "hist" });
      figures.push({ caption: "Your histogram after cutting the peak", svg: draw(final, answers), kind: "hist" });
    } else {
      figures.push({ caption: "Draw the resource histogram, every activity as " + cut.start + " as possible", svg: draw(cut.states[0], answers), kind: "hist" });
      figures.push({ caption: "Draw it again after cutting the peak", svg: draw(final, answers), kind: "hist" });
    }
    if (answers) out.answer = [p.answer.text];
  } else {
    out.subtitle = `Resource histogram${level}`;
    figures.push({ caption: "Draw the resource histogram, every activity as " + (hist.start === "late" ? "late" : "early") + " as possible", svg: draw(hist, answers), kind: "hist", tall: true });
    if (answers) out.answer = [p.answer.text];
  }
  return out;
}

/** the printable HTML of a sheet (questions) or answer sheet, or null when this question has none */
export async function buildCpaSheet(p: DecisionProblem, answers: boolean): Promise<import("./printCpa").CpaSheetInput[] | null> {
  const q = await buildCpaSheetInput(p, false);
  if (!q) return null;
  return answers ? [await buildCpaSheetInput(p, true) as CpaSheetInput] : [q];
}
