import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { __seed } from "../tools/Decision/SimplexAlgorithm";
import { SxPrintFigure, SxPrintWorking } from "../shared/decision/SxWorking";
import { solveSimplex } from "../shared/decision/lpSimplexSolve";
import { skillSheetHtml } from "../shared/decision/printExam";
import { withSeededRandom } from "./seededRandom";

// A printed Simplex question must carry what the question gives (the tableau, or the table of data) and the answers page the model working:
// the prompt alone says "a tableau is shown", so a sheet without the figure is unusable.
describe("Simplex print", () => {
  it("prints the tableau under the question and the working under the answer", () => {
    withSeededRandom(7, () => {
      for (const sub of ["pivot", "interpret", "setup", "solve", "practical"]) for (const level of [1, 2, 3]) {
        const p = __seed.generate(level, { subTool: sub, options: {} } as never);
        const figure = renderToStaticMarkup(createElement(SxPrintFigure, { p }));
        const working = renderToStaticMarkup(createElement(SxPrintWorking, { steps: solveSimplex(p) }));
        // a question that refers to a tableau or a table has one printed
        if (/tableau .* is shown|tableau shows|table shows/i.test(p.prompt)) expect(figure, `${sub} L${level}`).toContain("<table");
        expect(working.length, `${sub} L${level}`).toBeGreaterThan(200);
        const html = skillSheetHtml("T", [{ prompt: p.prompt, answer: p.answer?.text ?? "", figure, working }], { layout: { perPage: true, space: "auto" } });
        if (figure) expect(html).toContain('class="skillfig"');
        expect(html).toContain('class="working"');
      }
    });
  });
});
