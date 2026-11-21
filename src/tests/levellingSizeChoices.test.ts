// Resource levelling, Level 3 question size: the default, the real questions against each size, and which list the second try comes from (split from levellingMethod.test.ts).
import { describe, expect, it } from "vitest";
import { withSeededRandom } from "./seededRandom";
import fixture from "./fixtures/levelling-real.json";
import { cpaTimes, generateCpa, levelMethod, levelFits, type CpaActivity, type LevelSize } from "../shared/decision";

const toActs = (q: (typeof fixture.questions)[number]): CpaActivity[] => q.activities.map((a) => ({ id: a.id, duration: a.duration, workers: a.workers, preds: a.after }));

describe("levelling — Level 3 question size: the choices and the real questions", () => {
  const sizes = ["short", "exam", "stretch"] as const;
  it("defaults to Exam when no size is given", () => {
    withSeededRandom(5, () => {
      for (let i = 0; i < 6; i++) {
        const { data } = generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, levelWorkers: "one", histShape: "step" });
        expect(levelFits(data.extra!.level!.method!, "exam")).toBe(true);
      }
    });
  });
  const fitsOf = (source: string, question: string): LevelSize[] => {
    const q = fixture.questions.find((x) => x.source.startsWith(source) && x.question === question)!;
    const acts = toActs(q);
    const m = levelMethod(acts, cpaTimes(acts), q.limit, 5000);
    return m ? sizes.filter((s) => levelFits(m, s)) : [];
  };
  it("the real questions fit the size they should: Legacy Q4 fits all three; Q11 and Q14 (two knock-ons) fit Stretch only; Q15 and OUP 29.2B Q1 (three or more) fit none", () => {
    expect(fitsOf("Legacy", "Q4(d)")).toEqual(["short", "exam", "stretch"]);
    expect(fitsOf("Legacy", "Q11")).toEqual(["stretch"]);
    expect(fitsOf("Legacy", "Q14(e)(i)")).toEqual(["stretch"]);
    expect(fitsOf("Legacy", "Q15(d)(i)")).toEqual([]);
    expect(fitsOf("OUP", "29.2B Q1 with 11 workers")).toEqual([]);
    expect(fitsOf("OUP", "29.2B Q4 with 6 workers")).toContain("exam");
  });
  it("Short's second try comes from the knock-on clash's own options; Exam may go back to the first list", () => {
    withSeededRandom(8, () => {
      const parents = new Set<number>();
      for (let i = 0; i < 12; i++) {
        const m = generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, levelWorkers: "one", levelSize: "exam", histShape: "step" }).data.extra!.level!.method!;
        expect(m.tries.length).toBe(2);
        expect(m.tries[0].clash).not.toBeNull();
        expect(m.tries[1].clash).toBeNull();
        parents.add(m.tries[1].option.parent);
        const s = generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, levelWorkers: "one", levelSize: "short", histShape: "step" }).data.extra!.level!.method!;
        expect(s.tries[1].option.parent).toBe(0);
      }
      expect(parents.has(-1) || parents.has(0)).toBe(true);
    });
  }, 120_000);
  it("the beyond-the-caps questions fit no size", () => {
    for (const q of fixture.questions.filter((x) => x.fits.startsWith("beyond caps"))) expect(fitsOf(q.source.slice(0, 4), q.question), q.question).toEqual([]);
  });
});
