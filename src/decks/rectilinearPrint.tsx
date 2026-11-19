import { renderToStaticMarkup } from "react-dom/server";
import { ShapeDiagram } from "../shared/shapes/Diagram";
import type { Drawing } from "../shared/shapes/drawing";
import { extras } from "../shared/questionExtras";
import { diagramPracticeSheet, shapeWorksheet, type ShapeSection } from "../shared/printables";
import { openPrintWindow } from "../shared/print";
import type { AnyQuestion, PrintMode } from "../shared";
import type { CuratedQuestion } from "./types";
import { rectilinearQuestion } from "./rectilinear";
import { dimensionPlan } from "../shared/shapes/dimensions";

/** The lengths' size against the shape that makes them `labelMm` tall on paper once the picture is fitted to a box of `box` mm (a tall, narrow shape needs more than a wide one). */
function printFontScale(d: Drawing, box: { w: number; h: number }, labelMm: number): number {
  for (let k = 1; k < 2.6; k += 0.1) {
    const plan = dimensionPlan(d, true, false, undefined, 10, k);
    if (plan.fs * Math.min(box.w / plan.W, box.h / plan.H) >= labelMm) return k;
  }
  return 2.6;
}
/** `fontScale` enlarges the lengths against the shape (a number), or `box` sizes them to read at `labelMm` on paper: the printed worksheet is shrunk two A4 pages to a sheet. */
export function rectilinearPrintCells(items: (CuratedQuestion | AnyQuestion)[], fontOrBoxes: number | { labelMm: number; box: { w: number; h: number }; keyBox: { w: number; h: number }; partitionBox: { w: number; h: number } } = 1) {
  return items.map(item => {
    const authored = "version" in item ? item : undefined;
    const q = authored?.rectilinear ? rectilinearQuestion(authored.rectilinear) : item as AnyQuestion;
    const d = extras(q)._diagram as Drawing;
    if (!d) throw new Error("This worksheet question has no shape diagram.");
    const measure = /perimeter/i.test(d.caption.join(" ")) ? "Perimeter" : "Area", unit = q.answerSuffix ?? "cm²";
    const scaffold = authored?.rectilinear?.scaffold ?? "none";
    const partition=authored?.rectilinear?.task === "partition";
    const full = scaffold === "full";
    const prompts = partition ? [scaffold === "none" ? "Draw lines to split the shape into rectangles. No area calculation." : "Identify the rectangles in the supplied partition. No area calculation."] : !full ? ["Show your method.", `${measure} = __________________ ${unit}`] : authored?.rectilinear?.method === "subtract"
      ? ["Whole rectangle: ____ × ____ = ____ cm²", "Cut-out area(s): __________________", "Shape area: __________________ cm²"]
      : [...d.regions.filter(r => r.id.startsWith("s")).map((_, i) => `Rectangle ${String.fromCharCode(65 + i)}: ____ × ____ = ____ cm²`), "Total area: __________________ cm²"];
    if(full && !partition && authored?.rectilinear?.method === "split") {
      q.working.filter(w=>w.label?.startsWith("Find the internal")).forEach(w=>prompts.unshift(`${w.label!.replace("Find the internal ", "Internal ").replace("of rectangle ", "of ")} ${w.latex.split("=")[0].trim().replace(/-/g, "−")} = ____ cm`));
    }
    if (authored?.rectilinear?.missingLength) prompts.unshift("Missing length: __________ cm");
    const boxed = typeof fontOrBoxes === "number" ? undefined : fontOrBoxes, isPartition = authored?.rectilinear?.task === "partition";
    const shortScaffold = d.regions.filter(r => r.id.startsWith("s")).length <= 2 && !q.working.some(w => w.label?.startsWith("Find the internal")) && authored?.rectilinear?.method !== "subtract";
    const fontScale = boxed ? printFontScale(d, isPartition ? boxed.partitionBox : full ? { w: boxed.box.w, h: shortScaffold ? 68 : 58 } : boxed.box, boxed.labelMm) : fontOrBoxes as number;
    const keyScale = boxed ? printFontScale(d, isPartition ? boxed.partitionBox : boxed.keyBox, boxed.labelMm) : fontScale;
    // A scaffolded question is laid out as numbered steps (the order a pupil works in), not one flat list of lines.
    let steps: { title: string; lines: string[] }[] | undefined;
    if (full && !partition) {
      const rects = d.regions.filter(r => r.id.startsWith("s")), cuts = d.regions.filter(r => r.id.startsWith("c")), blank = "____";
      if (authored?.rectilinear?.method === "subtract") steps = [
        { title: "Find the whole rectangle", lines: [`${blank} × ${blank} = ${blank} cm²`] },
        { title: cuts.length > 1 ? "Find each part that is cut out" : "Find the part that is cut out", lines: cuts.map((_, i) => `${cuts.length > 1 ? `Cut-out ${i + 1}: ` : ""}${blank} × ${blank} = ${blank} cm²`) },
        { title: "Take it away", lines: [`Area = ${blank} − ${cuts.map(() => blank).join(" − ")} = ${blank} cm²`] },
      ];
      else {
        const internal = prompts.filter(t => /^Internal /.test(t));
        steps = [
          ...(internal.length ? [{ title: "Find the lengths you need", lines: internal }] : []),
          { title: "Find the area of each rectangle", lines: rects.map((_, i) => `${String.fromCharCode(65 + i)}: ${blank} × ${blank} = ${blank} cm²`) },
          { title: "Add them up", lines: [`Area = ${rects.map(() => blank).join(" + ")} = ${blank} cm²`] },
        ];
      }
    }
    const clean = (s: string) => s.replace(/\\times/g, "×").replace(/,\\\s*/g, "; ").replace(/\\,/g, " ");
    const section: ShapeSection = partition ? "partition" : authored?.rectilinear?.method === "subtract" ? "cutout" : q.working.some(w => w.label?.startsWith("Find the internal")) ? "internal" : "area";
    return { steps, section, svg: renderToStaticMarkup(<ShapeDiagram hideCaption d={d} showAnswer={false} small fontScale={fontScale} />),
      answerSvg: renderToStaticMarkup(<ShapeDiagram hideCaption d={d} showAnswer small fontScale={keyScale} focus={{ regions: d.regions.map(r => r.id) }} />),
      prompts, answer: partition ? "One valid partition is shown; accept alternatives." : `${measure} = ${q.answer} ${unit}`, working: partition ? [] : q.working.map(w => clean(w.plain ?? w.latex)).filter(t => !/^Equal sides are the same length/.test(t)) };
  });
}
export function printRectilinearSheet(items: (CuratedQuestion | AnyQuestion)[], title: string, mode: PrintMode, paper: "A4" | "A5" = "A4") {
  // Open synchronously from the print button: this path has no asynchronous generator or font fetch.
  const authored = items.some(item => "version" in item);
  // A hand-authored sheet is A4 and made to be shrunk two to a sheet; a tool's generated worksheet keeps the grid layout.
  openPrintWindow(authored ? shapeWorksheet(rectilinearPrintCells(items, { labelMm: 4.7, box: { w: 83, h: 72 }, keyBox: { w: 83, h: 64 }, partitionBox: { w: 84, h: 100 } }), title, mode) : diagramPracticeSheet(rectilinearPrintCells(items), title, mode, paper, 6), 400);
}
