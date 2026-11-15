// Every printed sheet shares one frame (src/shared/decision/printFrame.ts): the same page set-up, the header "tool — what it is" with Name and Date on a
// question page, an answers / mark scheme tag on an answer page, and "Question 2 of 4" numbering.
import { describe, it, expect } from "vitest";
import { cpaSheetsHtml, type CpaSheetInput } from "../shared/decision/printCpa";
import { examSetHtml, skillSheetHtml } from "../shared/decision/printExam";
import { generateDimExam } from "../shared/decision/dimExam";
import { withSeededRandom } from "./seededRandom";

const cpa = (answerSheet: boolean, answer?: string[]): CpaSheetInput => ({ title: "Critical Path Analysis", subtitle: "Forward pass · Level 1", prompt: "Find the times.", figures: [], answerSheet, answer });
const PAGE = "@page { size: A4; margin: 10mm; }";

describe("the shared print frame", () => {
  it("a Critical Path set is numbered, tags its answer sheets and has no empty answer box", () => {
    const html = cpaSheetsHtml([cpa(false), cpa(false), cpa(true, [""]), cpa(true, ["12 hours"])]);
    expect(html).toContain(PAGE);
    expect(html).toContain("Critical Path Analysis — Forward pass · Level 1");
    expect(html).toContain("Question 1 of 2");
    expect(html).toContain("Question 2 of 2");
    expect((html.match(/Question 1 of 2/g) ?? []).length).toBe(2);   // the question sheet and its answer sheet
    expect((html.match(/class="tag">answers/g) ?? []).length).toBe(2);
    expect((html.match(/Name _+/g) ?? []).length).toBe(2);           // only the question sheets carry Name and Date
    expect((html.match(/class="answer"/g) ?? []).length).toBe(1);     // the empty answer has no box
    expect(cpaSheetsHtml([cpa(false)])).not.toContain("Question 1 of");  // a single sheet is not numbered
  });
  it("a skill worksheet and an exam set use the same page, header and tags", () => {
    const skill = skillSheetHtml("Dimensional Analysis", [{ prompt: "A", answer: "B" }], { subtitle: "Find the powers · Level 2" });
    expect(skill).toContain(PAGE);
    expect(skill).toContain("Dimensional Analysis — Find the powers · Level 2");
    expect(skill).toContain('class="tag">answers');
    expect(skill).toMatch(/Name _+/);
    withSeededRandom(98, () => {
      const p = generateDimExam(1, "find");
      const exam = examSetHtml([{ title: "Dimensional Analysis", subtitle: "State the dimensions, then find the powers", exam: p.exam!, questionFigure: "", workingBox: true, answerFigures: p.exam!.parts.map(() => null) }]);
      expect(exam).toContain(PAGE);
      expect(exam).toContain("Dimensional Analysis — State the dimensions, then find the powers");
      expect(exam).toContain('class="tag">mark scheme');
      expect(exam).toMatch(/Name _+/);
    });
  });
});
