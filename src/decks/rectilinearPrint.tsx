import { renderToStaticMarkup } from "react-dom/server";
import { ShapeDiagram } from "../shared/shapes/Diagram";
import type { Drawing } from "../shared/shapes/drawing";
import { extras } from "../shared/questionExtras";
import { diagramPracticeSheet } from "../shared/printables";
import { openPrintWindow } from "../shared/print";
import type { AnyQuestion, PrintMode } from "../shared";
import type { CuratedQuestion } from "./types";
import { rectilinearQuestion } from "./rectilinear";

export function rectilinearPrintCells(items: (CuratedQuestion | AnyQuestion)[]) {
  return items.map(item => {
    const authored = "version" in item ? item : undefined;
    const q = authored?.rectilinear ? rectilinearQuestion(authored.rectilinear) : item as AnyQuestion;
    const d = extras(q)._diagram as Drawing;
    if (!d) throw new Error("This worksheet question has no shape diagram.");
    const measure = /perimeter/i.test(d.caption.join(" ")) ? "Perimeter" : "Area", unit = q.answerSuffix ?? "cm²";
    const scaffold = authored?.rectilinear?.scaffold ?? "none";
    const full = scaffold === "full";
    const prompts = !full ? ["Show your method.", `${measure} = __________________ ${unit}`] : authored?.rectilinear?.method === "subtract"
      ? ["Whole rectangle: ____ × ____ = ____ cm²", "Cut-out area(s): __________________", "Shape area: __________________ cm²"]
      : [...d.regions.filter(r => r.id.startsWith("s")).map((_, i) => `Rectangle ${String.fromCharCode(65 + i)}: ____ × ____ = ____ cm²`), "Total area: __________________ cm²"];
    if (authored?.rectilinear?.missingLength) prompts.unshift("Missing length: __________ cm");
    const clean = (s: string) => s.replace(/\\times/g, "×").replace(/,\\\s*/g, "; ").replace(/\\,/g, " ");
    return { svg: renderToStaticMarkup(<ShapeDiagram hideCaption d={d} showAnswer={false} small />),
      answerSvg: renderToStaticMarkup(<ShapeDiagram hideCaption d={d} showAnswer small focus={{ regions: d.regions.map(r => r.id) }} />),
      prompts, answer: `${measure} = ${q.answer} ${unit}`, working: q.working.map(w => clean(w.plain ?? w.latex)) };
  });
}
export function printRectilinearSheet(items: (CuratedQuestion | AnyQuestion)[], title: string, mode: PrintMode, paper: "A4" | "A5" = "A4") {
  // Open synchronously from the print button: this path has no asynchronous generator or font fetch.
  openPrintWindow(diagramPracticeSheet(rectilinearPrintCells(items), title, mode, paper, items.some(item => "version" in item) ? 4 : 6), 400);
}
