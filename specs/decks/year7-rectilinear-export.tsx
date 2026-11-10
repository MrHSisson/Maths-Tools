// Shared data export for the offline PowerPoint and print PDFs; the browser uses exactly these same questions.
import { renderToStaticMarkup } from "react-dom/server";
import { ShapeDiagram } from "/src/shared/shapes/Diagram";
import { rectilinearQuestion } from "/src/decks/rectilinear";
import { extras } from "/src/shared/questionExtras";
import type { Drawing, Focus } from "/src/shared/shapes/drawing";
import type { CuratedQuestion } from "/src/decks/types";
import { generateFrom } from "/src/decks/generators";
import lesson, { models, practiceOne, practiceTwo, cutoutPractice, worksheetQuestions } from "./year7-rectilinear-area.build";

export default async function exportLesson() {
  const deck = await lesson();
  const extra: CuratedQuestion[] = [];
  const generated: { id: string; q: any }[] = [];
  for (const missing of [false, true]) for (let i = 0; i < 2; i++) {
    const q = await generateFrom("perimeter-and-area", { sub: "compound", level: missing ? "level2" : "level1", multiSelect: { area: true, perimeter: false, all: !missing, missing, split: true, subtract: false }, variables: { reducedLabels: true, showSplit: false } }, 20261111 + i * 73 + (missing ? 1000 : 0));
    if (q) generated.push({ id: `${missing ? "live-missing" : "live-given"}-${i + 1}`, q });
  }
  const source = [...Object.values(models), ...practiceOne, ...practiceTwo, ...cutoutPractice, ...worksheetQuestions, ...extra].map(item => ({ id: item.id, item, q: rectilinearQuestion(item.rectilinear!) }));
  const assets = [...source, ...generated.map(x => ({ ...x, item: null }))].map(({ id, q, item }) => {
    const drawing = extras(q)._diagram as Drawing, focuses = extras(q)._stepFocus as (Focus | undefined)[];
    const all: Focus = { regions: drawing.regions.map(r => r.id), helpers: drawing.helpers.map(h => h.id), reveal: drawing.edges.map((_, i) => i), revealHelpers: drawing.helpers.map(h => h.id) };
    const render = (d: Drawing, answer = false, focus?: Focus, small = false) => renderToStaticMarkup(<ShapeDiagram pixelSize={small ? undefined : {w:1100,h:900}} hideCaption d={d} showAnswer={answer} focus={focus} small={small} fillBox />);
    const outline = { ...drawing, regions: drawing.regions.map(r => ({ ...r, always: false })), helpers: drawing.helpers.map(h => ({ ...h, always: false })) };
    const foundAt = q.working.findIndex(w => w.label === "So the missing side is:");
    const found = foundAt >= 0 ? { ...focuses[foundAt], reveal: focuses.slice(0, foundAt + 1).flatMap(f => f?.reveal ?? []) } : undefined;
    const svg: Record<string, string> = { question: render(drawing), answer: render(drawing, true, all), outline: render(outline), split: render(drawing, false, { regions: all.regions, helpers: all.helpers }), found: render(drawing, false, found), paper: render(drawing, false, undefined, true), paperAnswer: render(drawing, true, all, true) };
    if (id === models.split.id) {
      const alt = { ...drawing, regions: [{ id: "a", pts: [[3,0],[7,0],[7,7],[3,7]], color: "#bfdbfe", text: "A", always: true }, { id: "b", pts: [[0,0],[3,0],[3,2],[0,2]], color: "#bbf7d0", text: "B", always: true }, { id: "c", pts: [[7,0],[10,0],[10,2],[7,2]], color: "#fde68a", text: "C", always: true }] } as Drawing;
      svg.alternate = render(alt);
    }
    svg.whole = render(outline, false, { regions: ["outer"] });
    svg.cut = render(outline, false, { regions: drawing.regions.map(r => r.id) });
    return { id, item, drawing, working: q.working, focuses, answer: q.answer, suffix: q.answerSuffix, svg };
  });
  return { deck, assets, groups: { practiceOne: practiceOne.map(q => q.id), practiceTwo: practiceTwo.map(q => q.id), worksheet: worksheetQuestions.map(q => q.id), models: Object.fromEntries(Object.entries(models).map(([k, q]) => [k, q.id])) } };
}
