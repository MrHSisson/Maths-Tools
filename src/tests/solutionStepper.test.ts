import { describe, expect, it } from "vitest";
import { solutionProgress } from "../shared/components/SolutionStepper";

describe("side-by-side solution disclosure", () => {
  it("starts with just the question, with no working or answer revealed", () => {
    expect(solutionProgress(3, true, 0)).toMatchObject({ at: 0, end: 4, open: false, shown: 0, answer: false });
  });
  it("unfolds one step at a time and gives the answer its own final beat", () => {
    for (let i = 1; i <= 3; i++) expect(solutionProgress(3, true, i)).toMatchObject({ open: true, shown: i, answer: false });
    expect(solutionProgress(3, true, 4)).toMatchObject({ shown: 3, answer: true });
  });
  it("show all reveals the complete solution without changing the remembered position", () => {
    expect(solutionProgress(4, true, 1, true)).toMatchObject({ at: 1, shown: 4, answer: true });
    expect(solutionProgress(4, true, 1, false)).toMatchObject({ at: 1, shown: 1, answer: false });
  });
  it("stepping back hides later steps and returning to the question closes the split", () => {
    expect(solutionProgress(2, true, 2)).toMatchObject({ shown: 2, answer: false });
    expect(solutionProgress(2, true, 1)).toMatchObject({ shown: 1, answer: false });
    expect(solutionProgress(2, true, 0)).toMatchObject({ open: false, shown: 0, answer: false });
  });
  it("supports answer-only questions, missing-answer drafts and bounded navigation", () => {
    expect(solutionProgress(0, true, 1)).toMatchObject({ open: true, shown: 0, answer: true });
    expect(solutionProgress(2, false, 999)).toMatchObject({ at: 2, end: 2, shown: 2, answer: false });
    expect(solutionProgress(2, true, -1)).toMatchObject({ at: 0, open: false });
    expect(solutionProgress(0, false, 1, true)).toMatchObject({ open: false, answer: false });
  });
});
