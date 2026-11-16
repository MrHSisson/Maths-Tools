import { createElement } from "react";
import ActivityNodeView from "./representations/ActivityNodeView";
import GanttView from "./representations/GanttView";
import HistogramView from "./representations/HistogramView";
import { cascadeSequence, criticalActivities, fullGraph, layoutIssues, type CpaLayout, type CpaActivity, type CpaViewState, type HistogramData } from "./cpa";
import type { DecisionProblem } from "./types";
import type { CpaSheetFigure, CpaSheetInput } from "./printCpa";

// The A4 sheets for Critical Path questions, including cascade charts, histograms and levelling: the network with its times and critical path, the cascade chart with its
// floats, then histograms to draw on (blank) or already drawn, in the order the question needs them. `answers` fills the blank ones in.
// The tool hands `buildCpaSheet` to the shell (`config.questionSheet`); the shell prints what it returns.

/** which sub-tools have a sheet */
export const CPA_SHEET_TABS = ["network", "table", "forward", "backward", "full", "floatPaths", "unknown", "change", "reason", "cascade", "histogram", "level", "alloc", "shorten", "reasonA"];

// ── The working sheets: draw the network, forward pass, backward pass, full analysis ──────────────────────────────────────────────────────
// One A4 portrait page each, laid out for the student to write on. The network is the whole figure: drawn as large as the page allows, and
// turned a quarter turn when that makes it bigger (the long side of the page then carries the width of the network). The header and the
// write-in lines stay upright. Layout maths here mirrors the CSS in printCpa.ts (190mm wide, 276mm high, 10mm margins).

const PAGE_W = 190, PAGE_H = 276;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const WORK_TITLE: Record<string, string> = { cpaNetwork: "Drawing the network", cpaForward: "Forward pass", cpaBackward: "Backward pass", cpaFull: "Full analysis" };

/** The same layout with every box grown about its centre (the gaps between boxes take it up), so the three cells of a box are big enough to write in by hand.
 *  The largest growth that leaves no box touching another or an arrow passing through one is used. */
function enlargedLayout(l: CpaLayout): CpaLayout {
  for (const k of [1.3, 1.2, 1.1]) {
    const boxes = Object.fromEntries(Object.entries(l.boxes).map(([id, b]) => [id, { ...b, x: b.x - (b.w * (k - 1)) / 2, y: b.y - (b.h * (k - 1)) / 2, w: b.w * k, h: b.h * k }]));
    const edges = l.edges.map((e) => {
      const u = l.boxes[e.from], v = l.boxes[e.to];
      const pts = e.pts.map((pt, i) => (i === 0 ? [pt[0] + (u.w * (k - 1)) / 2, pt[1]] : i === e.pts.length - 1 ? [pt[0] - (v.w * (k - 1)) / 2, pt[1]] : [pt[0], pt[1]]) as [number, number]);
      return { ...e, pts };
    });
    const grown = { ...l, boxes, edges };
    if (layoutIssues(grown).length === 0) return grown;
  }
  return l;
}

/** the precedence table for a drawing sheet: one row per activity (activity, duration, immediate predecessors), upright, to sit in the corner of the drawing space */
function precedenceDown(d: NonNullable<DecisionProblem["cpa"]>, filled = true): string {
  return `<table class="prec up"><tr><th>Activity</th><th>Duration (${esc(d.unit)})</th><th>Immediate predecessors</th></tr>`
    + d.acts.map((a) => `<tr><td>${esc(a.id)}</td><td class="n">${a.duration}</td><td class="n">${filled ? a.preds.length ? esc(a.preds.join(", ")) : "&ndash;" : "&nbsp;"}</td></tr>`).join("")
    + `</table>`;
}

async function buildWorkSheetInput(p: DecisionProblem, answers: boolean): Promise<CpaSheetInput | null> {
  const d = p.cpa;
  if (!d || !WORK_TITLE[d.kind]) return null;
  const all = fullGraph(d.acts);
  const T = d.times.projectTime;
  const crit = criticalActivities(d.acts);
  const arrows = [...new Set(d.criticalPaths.flatMap((path) => path.slice(1).map((id, i) => `${path[i]}→${id}`)))];
  const everyEs = Object.fromEntries(all.map((a) => [a.id, d.times.es[a.id]]));
  const everyLf = Object.fromEntries(all.map((a) => [a.id, d.times.lf[a.id]]));
  // what the question gives (the same as the screen), or, on the answer sheet, what the answer fills in
  let view: CpaViewState;
  if (answers) view = d.kind === "cpaNetwork" ? {} : d.kind === "cpaForward" ? { es: everyEs } : d.kind === "cpaBackward" ? { es: everyEs, lf: everyLf } : { es: everyEs, lf: everyLf, critical: crit, criticalArrows: arrows };
  else view = d.kind === "cpaBackward" ? { es: everyEs, lf: { End: T } } : { es: { Start: 0 } };
  const drawing = d.kind === "cpaNetwork" && !answers;
  const fill = answers ? undefined
    : d.kind === "cpaForward" ? [`Minimum completion time (${d.unit})`]
      : d.kind === "cpaFull" ? ["Critical activities", d.criticalPaths.length > 1 ? "Critical paths" : "Critical path", `Minimum completion time (${d.unit})`]
        : undefined;
  // a drawing space has the table in its top corner; the page left for a figure is what the header and write-in lines leave
  const promptMm = Math.ceil(p.prompt.length / 100) * 5 + 2;
  const availH = PAGE_H - 16 - promptMm - 10 - (fill?.length ?? 0) * 8.5 - (answers ? 14 : 0);
  const layout = enlargedLayout(d.layout);
  const { width: lw, height: lh } = layout;
  const up = Math.min(PAGE_W / lw, availH / lh), turned = Math.min(availH / lw, PAGE_W / lh);
  const rotate = !drawing && turned > up * 1.03;   // the drawing space stays upright (its table is read the right way up); the other sheets turn when that makes the network bigger
  const { renderToStaticMarkup } = await import("react-dom/server");
  const svg = drawing ? "" : renderToStaticMarkup(createElement(ActivityNodeView, { acts: d.acts as CpaActivity[], layout, view }));
  const turn = rotate ? " (turn the page a quarter turn clockwise)" : "";
  const fig: CpaSheetFigure = drawing
    ? { caption: "Draw the activity network in the dotted space, including Start and End", svg: `<div class="drawin"><div class="space">${precedenceDown(d)}</div></div>`, kind: "draw" }
    : { caption: answers && d.kind === "cpaNetwork" ? "The activity network" : `The activity network: each box is the activity, then earliest start | duration | latest finish${turn}`, svg, kind: "work", rotate };
  const level = p.level ? ` · Level ${p.level}` : "";
  return { title: "Critical Path Analysis", subtitle: `${WORK_TITLE[d.kind]}${level}`, prompt: p.prompt, figures: [fig], work: true, ...(fill ? { fill } : {}), answerSheet: answers, ...(answers ? { answer: [p.answer.text] } : {}) };
}

async function buildCpaSheetInput(p: DecisionProblem, answers: boolean): Promise<CpaSheetInput | null> {
  const d = p.cpa;
  if (d && WORK_TITLE[d.kind]) return buildWorkSheetInput(p, answers);
  if (d?.kind === "cpaCascade") return buildCascadeSheetInput(p, answers);
  if (d && RESPONSE_TITLE[d.kind]) return buildResponseSheetInput(p, answers);
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
  const draw = (data: HistogramData, filled: boolean, limit?: number, tall = false): string => renderToStaticMarkup(createElement(HistogramView, {
    data, view: { blocks: filled ? data.blocks.map((b) => b.id) : [] }, unit: d.unit, limit, axisT: lv && limit !== undefined ? levelAxisT(T, lv.after.T) : Math.max(T, data.T), axisPeak, minWidth: 0, fineGrid: !filled,
    // a histogram that has the page to itself is drawn taller, to fill it
    ...(tall ? { plotH: 470, cellMax: 80 } : {}),
  }));
  // the cascade chart shows where every block starts, so a question that asks for the drawing (Levels 1 and 2) does not give it
  const drawsOnly = d.kind === "cpaHistogram" && !cut;
  const figures: CpaSheetFigure[] = [
    { caption: "Activity network (earliest start, duration, latest finish), critical path in green", svg: network, kind: "network", tall: drawsOnly },
    ...(drawsOnly ? [] : [{ caption: "Cascade chart: every activity as early as possible, float shown dashed", svg: gantt, kind: "gantt" as const }]),
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
      // the answer, the quick sums at the first clash, and the tries on one line (there can be several)
      const m = lv.method;
      const tries = (m?.tries ?? []).map((tr, k) => `(${k + 1}) hold ${tr.option.held} until ${tr.option.until}: ${tr.clash ? `a clash is left (${tr.clash.from}–${tr.clash.to})` : `no clash, finish ${tr.finish}`}`);
      out.answer = [p.answer.text, ...(m ? [`Quick sums: ${m.options.map((o) => `${o.held} ${o.quick}`).join(", ")}.`] : []), ...(tries.length ? [`Tries: ${tries.join("; ")}.`] : [])];
    }
  } else if (cut) {
    out.subtitle = `Resource histogram${level}`;
    const final = cut.states[cut.states.length - 1];
    // "show N − 1 cannot do it" needs only the sum, so there is no second histogram to draw
    const cutting = cut.ask !== "canFewer";
    if (cut.given) {
      figures.push({ caption: "The resource histogram, every activity as " + cut.start + " as possible", svg: draw(cut.states[0], true), kind: "hist" });
      if (cutting) figures.push({ caption: "Your histogram after cutting the peak", svg: draw(final, answers), kind: "hist" });
    } else {
      figures.push({ caption: "Draw the resource histogram, every activity as " + cut.start + " as possible", svg: draw(cut.states[0], answers), kind: "hist" });
      if (cutting) figures.push({ caption: "Draw it again after cutting the peak", svg: draw(final, answers), kind: "hist" });
    }
    if (answers) out.answer = [p.answer.text];
  } else {
    out.subtitle = `Resource histogram${level}`;
    figures.push({ caption: "Draw the resource histogram, every activity as " + (hist.start === "late" ? "late" : "early") + " as possible", svg: draw(hist, answers, undefined, true), kind: "hist", tall: true });
    if (answers) out.answer = [p.answer.text];
  }
  return out;
}

const RESPONSE_TITLE: Record<string, string> = {
  cpaTable: "Reading the network", cpaFloat: "Float and critical paths", cpaPaths: "Float and critical paths",
  cpaUnknown: "Missing times", cpaChange: "Delays and changes", cpaReason: "Explain and justify",
  cpaShorten: "Which to shorten", cpaAlloc: "Worker allocation",
};

/** Written questions need the supplied network and room to work, without filling in what they ask for. */
async function buildResponseSheetInput(p: DecisionProblem, answers: boolean): Promise<CpaSheetInput | null> {
  const d = p.cpa;
  if (!d) return null;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const view: CpaViewState = {
    es: { ...d.times.es }, lf: { ...d.times.lf },
    ...(d.kind === "cpaChange" || d.extra?.reason && ["range", "remove"].includes(d.extra.reason.type)
      ? { float: Object.fromEntries(d.acts.map((a) => [a.id, d.times.float[a.id]])) } : {}),
  };
  if (!answers && d.extra?.reason && ["claim", "glyn", "limit"].includes(d.extra.reason.type)) {
    view.es = { Start: 0 };
    delete view.lf;
  }
  if (d.kind === "cpaTable") { delete view.es; delete view.lf; }
  const unknown = d.extra?.unknown;
  if (unknown && !answers) {
    if (unknown.box) {
      const { id, cell } = unknown.box;
      delete view[cell]![id];
      if (cell === "es") view.esLabels = { [id]: "x" }; else view.lfLabels = { [id]: "x" };
    } else {
      delete view.es; delete view.lf;
      view.durLabels = { [unknown.id]: "x" };
    }
  }
  const reason = d.extra?.reason;
  const title = reason?.type === "limit" ? "Limits of the model" : RESPONSE_TITLE[d.kind];
  const out: CpaSheetInput = {
    title: "Critical Path Analysis", subtitle: `${title}${p.level ? ` · Level ${p.level}` : ""}`,
    prompt: p.prompt, answerSheet: answers, work: true,
    figures: [{ caption: "Activity network: earliest start | duration | latest finish", kind: "network", tall: true,
      svg: renderToStaticMarkup(createElement(ActivityNodeView, { acts: d.acts, layout: d.layout, view })) }],
    ...(answers ? { answer: reason ? reason.model : [p.answer.text] } : {}),
  };
  const al = d.extra?.alloc;
  if (al) {
    // A minimum-team question must not reveal the answer through its row count.
    const rows = al.kind === "min" ? d.acts.length : al.workers;
    const chart = { ...al.chart, rowLabels: Array.from({ length: rows }, (_, i) => `Worker ${i + 1}`) };
    const axisT = al.kind === "min" ? d.times.projectTime : Math.ceil(d.acts.reduce((sum, a) => sum + a.duration, 0) / 5) * 5;
    out.figures.push({ caption: answers ? "A possible worker allocation" : "Draw your worker allocation (use as many rows as you need)", kind: "gantt", tall: true,
      svg: renderToStaticMarkup(createElement(GanttView, { data: { ...chart, T: axisT }, view: { bars: answers ? d.acts.map((a) => a.id) : [], floats: [] }, unit: d.unit, rowH: 470 / rows, fineGrid: !answers, labelWidth: 90 })) });
    out.work = false;
  } else if (!answers || d.kind === "cpaTable") {
    out.figures.push({ caption: d.kind === "cpaTable" ? "Complete the precedence table" : "Your working and answer", kind: "response",
      svg: `<div class="responsein">${d.kind === "cpaTable" ? precedenceDown(d, answers) : ""}${answers ? "" : '<div class="ruled"></div>'}</div>` });
  }
  return out;
}

/** Match the histogram drawing sheets, keeping the question's own chart style, rows and given bars. */
async function buildCascadeSheetInput(p: DecisionProblem, answers: boolean): Promise<CpaSheetInput | null> {
  const d = p.cpa, cas = d?.extra?.cascade;
  if (!d || !cas) return null;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const all = fullGraph(d.acts);
  const times = {
    es: Object.fromEntries(all.map((a) => [a.id, d.times.es[a.id]])),
    lf: Object.fromEntries(all.map((a) => [a.id, d.times.lf[a.id]])),
  };
  const bars = answers ? cas.bars.map((b) => b.id) : cas.given ?? [];
  const level = p.level ? ` · Level ${p.level}` : "";
  return {
    title: "Critical Path Analysis", subtitle: `Cascade/Gantt chart${level}`, prompt: p.prompt, answerSheet: answers,
    figures: [
      {
        caption: cas.passes && !answers ? "Activity network: fill in the earliest starts and latest finishes" : "Activity network (earliest start, duration, latest finish)",
        svg: renderToStaticMarkup(createElement(ActivityNodeView, {
          acts: d.acts, layout: d.layout, view: cas.passes && !answers ? { es: { Start: 0 } } : times,
        })), kind: "network", tall: true,
      },
      {
        caption: `${answers ? "Completed chart" : cas.given?.length ? "Complete the chart" : "Draw the chart"}: every activity as ${cas.start} as possible, float shown dashed`,
        svg: renderToStaticMarkup(createElement(GanttView, {
          data: cas, view: { bars, floats: bars.filter((id) => d.times.float[id] > 0) }, unit: d.unit,
          rowH: 470 / cas.rowLabels.length, fineGrid: !answers,
        })), kind: "gantt", tall: true,
      },
    ],
    ...(answers ? { answer: [p.answer.text] } : {}),
  };
}

/** the printable HTML of a sheet (questions) or answer sheet, or null when this question has none */
/**
 * The time axis of the levelling histograms on a printed question. The blank levelled histogram must not give the answer away, so its axis never
 * stops at the answer: it runs 10 past the time with no limit, to the next multiple of 5 (the given histogram uses the same axis). Only when the
 * answer would not fit is the axis taken from it: the next multiple of 5 above the answer plus 5 (167 gives 175, 53 gives 60).
 */
export function levelAxisT(unlimited: number, answer: number): number {
  const base = Math.ceil((unlimited + 10) / 5) * 5;
  return answer < base ? base : Math.ceil((answer + 5) / 5) * 5;
}

export async function buildCpaSheet(p: DecisionProblem, answers: boolean): Promise<import("./printCpa").CpaSheetInput[] | null> {
  const q = await buildCpaSheetInput(p, false);
  if (!q) return null;
  return answers ? [await buildCpaSheetInput(p, true) as CpaSheetInput] : [q];
}
