// Shared data export for deck verification and print PDFs; the browser uses exactly these same questions.
import { renderToStaticMarkup } from "react-dom/server";
import { ShapeDiagram } from "/src/shared/shapes/Diagram";
import { rectilinearQuestion } from "/src/decks/rectilinear";
import { extras } from "/src/shared/questionExtras";
import type { Drawing, Focus } from "/src/shared/shapes/drawing";
import lesson, { questionSets } from "./year7-rectilinear-area.build";

export default async function exportLesson() {
  const deck = await lesson();
  const source = Object.values(questionSets).flat().map(item=>({id:item.id,item,q:rectilinearQuestion(item.rectilinear!)}));
  const assets = source.map(({ id, q, item }) => {
    const drawing = extras(q)._diagram as Drawing, focuses = extras(q)._stepFocus as (Focus | undefined)[];
    const all: Focus = { regions: drawing.regions.map(r => r.id), helpers: drawing.helpers.map(h => h.id), reveal: drawing.edges.map((_, i) => i), revealHelpers: drawing.helpers.map(h => h.id) };
    const render = (d: Drawing, answer = false, focus?: Focus, small = false) => renderToStaticMarkup(<ShapeDiagram pixelSize={small ? undefined : {w:1100,h:900}} hideCaption d={d} showAnswer={answer} focus={focus} small={small} fillBox />);
    const outline = { ...drawing, regions: drawing.regions.map(r => ({ ...r, always: false })), helpers: drawing.helpers.map(h => ({ ...h, always: false })) };
    const foundAt = q.working.findIndex(w => w.label === "So the missing side is:");
    const found = foundAt >= 0 ? { ...focuses[foundAt], reveal: focuses.slice(0, foundAt + 1).flatMap(f => f?.reveal ?? []) } : undefined;
    const svg: Record<string, string> = { question: render(drawing), answer: render(drawing, true, all), outline: render(outline), split: render(drawing, false, { regions: all.regions, helpers: all.helpers }), found: render(drawing, false, found), paper: render(drawing, false, undefined, true), paperAnswer: render(drawing, true, all, true) };
    svg.whole = render(outline, false, { regions: ["outer"] });
    svg.cut = render(outline, false, { regions: drawing.regions.map(r => r.id) });
    return { id, item, drawing, working: q.working, focuses, answer: q.answer, suffix: q.answerSuffix, svg };
  });
  return { deck, assets, groups: Object.fromEntries(Object.entries(questionSets).map(([key,items])=>[key,items.map(q=>q.id)])) };
}
